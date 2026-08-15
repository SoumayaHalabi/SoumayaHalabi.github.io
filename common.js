"use strict";

// Direct mode: the browser calls Google's REST APIs with the API key in the
// query string. The key is not a secret (Firestore security rules are the
// real access control) and it is restricted to this site's domains.
// Proxy mode (apiKey = ""): the browser calls your own server (/__api,
// /__auth, /__token) which injects the key server-side. See the README.
const PROXY = !String(FIREBASE_CONFIG.apiKey || "").trim();

const API_BASE = PROXY ? "/__api" : "https://firestore.googleapis.com";
const AUTH_BASE = PROXY ? "/__auth" : "https://identitytoolkit.googleapis.com";
const TOKEN_BASE = PROXY ? "/__token" : "https://securetoken.googleapis.com";

const FIRESTORE_BASE =
  API_BASE +
  "/v1/projects/" +
  FIREBASE_CONFIG.projectId +
  "/databases/(default)/documents";
const WORKS_URL = FIRESTORE_BASE + "/works";

function keyed(url) {
  return PROXY
    ? url
    : url +
        (url.indexOf("?") >= 0 ? "&" : "?") +
        "key=" +
        encodeURIComponent(FIREBASE_CONFIG.apiKey);
}

function isConfigured() {
  const p = String(FIREBASE_CONFIG.projectId || "").trim();
  return p.length > 0 && p !== "YOUR_PROJECT_ID";
}

async function fapi(url, options) {
  const res = await fetch(keyed(url), options);
  if (!res.ok) {
    let msg = "Request failed (" + res.status + ")";
    try {
      const data = await res.json();
      if (data.error && data.error.message) msg = data.error.message;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// --- Firestore helpers --------------------------------------------------------

function toWork(doc) {
  const f = doc.fields || {};
  return {
    id: doc.name.split("/").pop(),
    title: f.title ? f.title.stringValue || "Untitled" : "Untitled",
    description: f.description ? f.description.stringValue || "" : "",
    github: f.github ? f.github.stringValue || "" : "",
    image: f.image ? f.image.stringValue || "" : "",
    createdAt: f.createdAt ? Number(f.createdAt.integerValue || 0) : 0,
  };
}

async function getWorks() {
  const data = await fapi(WORKS_URL);
  return (data.documents || [])
    .map(toWork)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function newId() {
  if (globalThis.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "w-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

async function createWork(work, idToken) {
  const id = newId();
  await fapi(WORKS_URL + "?documentId=" + encodeURIComponent(id), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + idToken,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: work.title },
        description: { stringValue: work.description },
        github: { stringValue: work.github },
        image: { stringValue: work.image },
        createdAt: { integerValue: String(Date.now()) },
      },
    }),
  });
  return id;
}

async function deleteWork(id, idToken) {
  await fapi(WORKS_URL + "/" + encodeURIComponent(id), {
    method: "DELETE",
    headers: { Authorization: "Bearer " + idToken },
  });
}

// --- Firebase Auth REST helpers (admin login) ---------------------------------

async function signInWithPassword(email, password) {
  return fapi(AUTH_BASE + "/v1/accounts:signInWithPassword", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true,
    }),
  });
}

async function refreshIdToken(refreshToken) {
  return fapi(TOKEN_BASE + "/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
}

function tokenExpiry(idToken) {
  try {
    const payload = JSON.parse(
      atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp || 0;
  } catch (_) {
    return 0;
  }
}

function escapeHTML(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// --- Theme: saved choice > time of day > browser preference -------------------
// Night (19:00–07:00 local device time) always dark, unless the visitor
// picked a theme manually. During the day, follow the browser's preference.

const NIGHT_START = 19;
const NIGHT_END = 7;

function storedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (_) {
    return null;
  }
}

function resolveTheme() {
  var saved = storedTheme();
  if (saved === "light" || saved === "dark") return saved;
  var hour = new Date().getHours();
  if (hour >= NIGHT_START || hour < NIGHT_END) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initTheme(toggleBtn) {
  function apply(t) {
    document.documentElement.dataset.theme = t;
  }

  apply(resolveTheme());

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch (_) {}
      apply(next);
    });
  }

  function recheck() {
    if (!storedTheme()) apply(resolveTheme());
  }

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", recheck);
  window.setInterval(recheck, 60000);
}
