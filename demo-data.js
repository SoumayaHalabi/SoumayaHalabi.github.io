"use strict";

// Demo data for demo.html only — no Firebase needed.
// The real site fetches the same document shape from Firestore, so this
// exercises the exact same rendering code path (common.js getWorks → app.js).
// Photos: see demo/CREDITS.md for sources and licenses.
FIREBASE_CONFIG.apiKey = "demo";
FIREBASE_CONFIG.projectId = "demo";

var DEMO_WORKS = [
  {
    id: "demo1",
    title: "Cozy Living Room",
    description: "Soft textures and warm neutrals for slow evenings.",
    github: "https://github.com/",
    image: "demo/img1.jpg",
    createdAt: 1759000000000,
  },
  {
    id: "demo2",
    title: "Lake View Lounge",
    description: "Floor-to-ceiling windows framing trees and water.",
    github: "https://github.com/",
    image: "demo/img2.jpg",
    createdAt: 1758000000000,
  },
  {
    id: "demo3",
    title: "Bright Kitchen",
    description: "A sunlit counter with fresh fruit by the window.",
    github: "https://github.com/",
    image: "demo/img3.jpg",
    createdAt: 1757000000000,
  },
  {
    id: "demo4",
    title: "Dining Nook",
    description: "A wooden table and green chairs for everyday meals.",
    github: "https://github.com/",
    image: "demo/img4.jpg",
    createdAt: 1756000000000,
  },
  {
    id: "demo5",
    title: "Playful Bedroom",
    description: "A colorful headboard with plush white pillows.",
    github: "https://github.com/",
    image: "demo/img5.jpg",
    createdAt: 1755000000000,
  },
  {
    id: "demo6",
    title: "Spa Bathroom",
    description: "Calm stone tones and soft natural light.",
    github: "https://github.com/",
    image: "demo/img6.jpg",
    createdAt: 1754000000000,
  },
  {
    id: "demo7",
    title: "Home Office",
    description: "A quiet corner desk with room to think.",
    github: "https://github.com/",
    image: "demo/img7.jpg",
    createdAt: 1753000000000,
  },
];

window.fetch = async function () {
  return {
    ok: true,
    status: 200,
    json: async function () {
      return {
        documents: DEMO_WORKS.map(function (w) {
          return {
            name: "projects/demo/databases/(default)/documents/works/" + w.id,
            fields: {
              title: { stringValue: w.title },
              description: { stringValue: w.description },
              github: { stringValue: w.github },
              image: { stringValue: w.image },
              createdAt: { integerValue: String(w.createdAt) },
            },
          };
        }),
      };
    },
  };
};
