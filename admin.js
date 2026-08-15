"use strict";

(function () {
  var SESSION_KEY = "portfolio_admin_session";

  var loginView = document.getElementById("login-view");
  var adminView = document.getElementById("admin-view");
  var loginForm = document.getElementById("login-form");
  var loginEmail = document.getElementById("login-email");
  var loginPassword = document.getElementById("login-password");
  var loginError = document.getElementById("login-error");
  var uploadForm = document.getElementById("upload-form");
  var photoInput = document.getElementById("photo");
  var titleInput = document.getElementById("title");
  var descInput = document.getElementById("description");
  var githubInput = document.getElementById("github");
  var uploadMsg = document.getElementById("upload-msg");
  var worksList = document.getElementById("works-list");
  var logoutBtn = document.getElementById("logout");
  var backupBtn = document.getElementById("backup");
  var adminEmail = document.getElementById("admin-email");
  var themeBtn = document.getElementById("theme-toggle");
  var brandEl = document.getElementById("brand");

  // --- branding + theme ---
  document.title = "Admin — " + SITE.name;
  if (brandEl) brandEl.textContent = SITE.name;
  initTheme(themeBtn);

  // --- session (id token lives only in sessionStorage, per-tab) ---
  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveSession(data) {
    var prev = getSession();
    var idToken = data.idToken || data.access_token;
    var exp = idToken
      ? tokenExpiry(idToken)
      : Math.floor(Date.now() / 1000) + Number(data.expires_in || data.expiresIn || 3600);
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        idToken: idToken,
        refreshToken: data.refreshToken || data.refresh_token || (prev ? prev.refreshToken : ""),
        exp: exp,
        email: (prev && prev.email) || loginEmail.value.trim(),
      })
    );
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function validIdToken() {
    var s = getSession();
    if (!s || !s.idToken) return null;
    if (s.exp - 60 > Math.floor(Date.now() / 1000)) return s.idToken;
    if (s.refreshToken) {
      try {
        var data = await refreshIdToken(s.refreshToken);
        saveSession(data);
        return getSession().idToken;
      } catch (_) {
        clearSession();
        return null;
      }
    }
    clearSession();
    return null;
  }

  async function withAuthRetry(fn) {
    var token = await validIdToken();
    if (!token) throw new Error("Session expired — sign in again.");
    try {
      return await fn(token);
    } catch (err) {
      var token2 = await validIdToken();
      if (!token2) {
        showView("login");
        throw new Error("Session expired — sign in again.");
      }
      if (token2 !== token) return await fn(token2);
      throw err;
    }
  }

  function showView(view) {
    loginView.hidden = view !== "login";
    adminView.hidden = view !== "admin";
  }

  // --- login ---
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var btn = loginForm.querySelector("button");
    btn.disabled = true;
    try {
      var data = await signInWithPassword(loginEmail.value.trim(), loginPassword.value);
      saveSession(data);
      loginPassword.value = "";
      await enterAdmin();
    } catch (err) {
      loginError.textContent = "Sign-in failed: " + err.message;
    } finally {
      btn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", function () {
    clearSession();
    showView("login");
  });

  // --- project list ---
  async function refreshList() {
    worksList.innerHTML = "<li class='empty'>Loading…</li>";
    try {
      var works = await getWorks();
      worksList.innerHTML = "";
      if (!works.length) {
        worksList.innerHTML = "<li class='empty'>Nothing uploaded yet.</li>";
        return;
      }
      works.forEach(function (w) {
        var li = document.createElement("li");
        li.innerHTML =
          '<img src="' + w.image + '" alt="">' +
          '<div class="li-info"><strong>' + escapeHTML(w.title) + "</strong>" +
          (w.github
            ? '<a href="' + escapeHTML(w.github) + '" target="_blank" rel="noopener noreferrer">view repo</a>'
            : "") +
          "</div>" +
          '<button type="button" class="danger-btn" data-id="' + w.id + '">Delete</button>';
        li.querySelector(".danger-btn").addEventListener("click", async function () {
          if (!confirm("Delete “" + w.title + "”? This cannot be undone.")) return;
          try {
            await withAuthRetry(function (token) {
              return deleteWork(w.id, token);
            });
            refreshList();
          } catch (err) {
            alert("Delete failed: " + err.message);
          }
        });
        worksList.appendChild(li);
      });
    } catch (err) {
      worksList.innerHTML = "<li class='empty'>Couldn't load: " + escapeHTML(err.message) + "</li>";
    }
  }

  // --- upload (resizes + compresses on the client, no server needed) ---
  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  async function compressImage(file) {
    var url = URL.createObjectURL(file);
    var img;
    try {
      img = await loadImage(url);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw new Error("Could not read that image file.");
    }
    var maxDim = 1600;
    var quality = 0.82;
    var dataUrl = "";
    while (true) {
      var scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.max(1, Math.round(img.naturalWidth * scale));
      var h = Math.max(1, Math.round(img.naturalHeight * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= 900000 || maxDim <= 640) break;
      maxDim = Math.round(maxDim * 0.75);
      quality = Math.max(0.45, quality - 0.12);
    }
    URL.revokeObjectURL(url);
    if (dataUrl.length > 1048000) {
      throw new Error("Image is still too large after compression — try a smaller file.");
    }
    return dataUrl;
  }

  uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!photoInput.files.length) return;
    var btn = uploadForm.querySelector("button");
    uploadMsg.textContent = "";
    btn.disabled = true;
    try {
      btn.textContent = "Compressing…";
      var dataUrl = await compressImage(photoInput.files[0]);
      btn.textContent = "Uploading…";
      var github = githubInput.value.trim();
      if (github && !/^https?:\/\//i.test(github)) github = "https://" + github;
      await withAuthRetry(function (token) {
        return createWork(
          {
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            github: github,
            image: dataUrl,
          },
          token
        );
      });
      uploadForm.reset();
      uploadMsg.textContent = "Uploaded!";
      refreshList();
    } catch (err) {
      uploadMsg.textContent = "Upload failed: " + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Upload";
    }
  });

  // --- backup ---
  backupBtn.addEventListener("click", async function () {
    try {
      var works = await getWorks();
      var blob = new Blob([JSON.stringify(works, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "portfolio-backup-" + new Date().toISOString().slice(0, 10) + ".json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    } catch (err) {
      alert("Backup failed: " + err.message);
    }
  });

  // --- init ---
  async function enterAdmin() {
    var s = getSession();
    if (!s) {
      showView("login");
      return;
    }
    showView("admin");
    adminEmail.textContent = s.email || "";
    await refreshList();
  }

  (async function init() {
    if (!isConfigured()) {
      loginError.textContent =
        "Not configured yet — add your Firebase project to firebase-config.js (see README.md).";
      showView("login");
      return;
    }
    var token = await validIdToken();
    if (token) await enterAdmin();
    else showView("login");
  })();
})();
