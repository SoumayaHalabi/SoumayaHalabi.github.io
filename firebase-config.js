"use strict";

// Firebase project credentials.
// Get these from: Firebase console → Project settings → General → Your apps (Web app).
const FIREBASE_CONFIG = {
  // For GitHub Pages: paste your API key here. It is safe to ship in public
  // pages — Firestore security rules and the key's referrer restrictions are
  // the real protection (see README.md).
  // Leave as "" ONLY if you self-host behind your own reverse proxy.
  apiKey: "AIzaSyC5LRVQiLyNMf2noWaF_D-IlvlQvnOCbEc",
  projectId: "portfolio-5a145",
};

// Branding shown in the header, hero and footer.
const SITE = {
  name: "Soumaya's Studio",
  tagline: "Interior Design Portfolio",
  description:
    "An overview of my various work. A selection of projects — each one open-source, with its source available on GitHub.",
};
