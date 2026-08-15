"use strict";

(function () {
  var grid = document.getElementById("gallery");
  var statusEl = document.getElementById("status");
  var themeBtn = document.getElementById("theme-toggle");
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightbox-img");
  var lbTitle = document.getElementById("lightbox-title");
  var lbDesc = document.getElementById("lightbox-desc");
  var lbLink = document.getElementById("lightbox-link");
  var lbClose = document.getElementById("lightbox-close");

  // --- branding ---
  document.title = SITE.name + " — " + SITE.tagline;
  document.getElementById("brand").textContent = SITE.name;
  document.getElementById("hero-kicker").textContent = SITE.tagline;
  document.getElementById("hero-title").textContent = SITE.name;
  document.getElementById("hero-text").textContent = SITE.description;
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footer-name").textContent = SITE.name;

  // --- theme: saved choice > night time > browser preference ---
  initTheme(themeBtn);

  // --- lightbox (measures the window so the photo always fits the screen) ---
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var openRect = null;

  function targetTransform() {
    var w = lbImg.naturalWidth || 1200;
    var h = lbImg.naturalHeight || 900;
    var s = Math.min((window.innerWidth * 0.94) / w, (window.innerHeight * 0.8) / h, 1);
    var tw = w * s;
    var th = h * s;
    return {
      x: (window.innerWidth - tw) / 2,
      y: (window.innerHeight - th) / 2 - 30,
      s: s,
    };
  }

  function applyTransform(t, transition) {
    lbImg.style.transition = transition;
    lbImg.style.transform = "translate(" + t.x + "px," + t.y + "px) scale(" + t.s + ")";
  }

  function openLightbox(imgEl, work) {
    lbTitle.textContent = work.title;
    lbDesc.textContent = work.description || "";
    lbDesc.style.display = work.description ? "" : "none";
    lbLink.href = work.github || "#";
    lbLink.style.display = work.github ? "" : "none";
    lbImg.src = work.image;
    lbImg.alt = work.title;
    openRect = imgEl.getBoundingClientRect();
    document.body.classList.add("lock");
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    lbClose.focus();
    if (reduceMotion) {
      applyTransform(targetTransform(), "none");
      return;
    }
    var w = lbImg.naturalWidth || imgEl.naturalWidth || 1200;
    var h = lbImg.naturalHeight || imgEl.naturalHeight || 900;
    applyTransform({ x: openRect.left, y: openRect.top, s: openRect.width / w }, "none");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        applyTransform(targetTransform(), "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)");
      });
    });
  }

  function closeLightbox() {
    if (!reduceMotion && openRect) {
      var w = lbImg.naturalWidth || 1200;
      var h = lbImg.naturalHeight || 900;
      applyTransform(
        { x: openRect.left, y: openRect.top, s: openRect.width / w },
        "transform 0.35s cubic-bezier(0.55,0.06,0.68,0.19)"
      );
    }
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    window.setTimeout(function () {
      openRect = null;
      lbImg.style.transform = "";
      lbImg.style.transition = "";
      lbImg.src = "";
    }, reduceMotion ? 0 : 400);
  }

  lbClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb.classList.contains("open")) closeLightbox();
  });
  window.addEventListener("resize", function () {
    if (lb.classList.contains("open") && !reduceMotion) {
      applyTransform(targetTransform(), "transform 0.25s ease");
    }
  });
  lbImg.addEventListener("load", function () {
    if (lb.classList.contains("open")) {
      applyTransform(
        targetTransform(),
        reduceMotion ? "none" : "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)"
      );
    }
  });

  // --- gallery ---
  var ghIcon =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';

  function makeCard(work) {
    var card = document.createElement("article");
    card.className = "card reveal";
    card.innerHTML =
      '<button type="button" class="card-media" aria-label="View fullscreen: ' +
      escapeHTML(work.title) +
      '">' +
      '<img src="' + work.image + '" alt="' + escapeHTML(work.title) + '" loading="lazy" decoding="async">' +
      "</button>" +
      '<h3 class="card-title">' + escapeHTML(work.title) + "</h3>" +
      (work.github
        ? '<a class="gh-btn" href="' + escapeHTML(work.github) + '" target="_blank" rel="noopener noreferrer">' +
          ghIcon + "<span>GitHub</span></a>"
        : "");
    card.querySelector(".card-media").addEventListener("click", function () {
      openLightbox(card.querySelector("img"), work);
    });
    return card;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  function observeCards() {
    grid.querySelectorAll(".reveal").forEach(function (el) {
      if (reduceMotion || typeof IntersectionObserver === "undefined") el.classList.add("in");
      else io.observe(el);
    });
  }

  async function load() {
    if (!isConfigured()) {
      statusEl.innerHTML =
        "Not configured yet — add your Firebase project ID and API key to <code>firebase-config.js</code> (see README.md).";
      return;
    }
    statusEl.textContent = "Loading projects…";
    try {
      var works = await getWorks();
      grid.innerHTML = "";
      if (!works.length) {
        statusEl.textContent = "No projects yet — check back soon.";
        return;
      }
      statusEl.style.display = "none";
      works.forEach(function (w) {
        grid.appendChild(makeCard(w));
      });
      observeCards();
    } catch (err) {
      statusEl.textContent = "Couldn't load projects: " + err.message;
    }
  }

  load();
})();
