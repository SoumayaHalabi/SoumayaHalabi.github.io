# Interior Design Portfolio

A lightweight portfolio for an interior designer, hosted on **GitHub Pages**.
Visitors browse a responsive gallery; the admin uploads photos and links each
one to a GitHub repository so the published work can be cloned and reused.

**Zero dependencies:** pure HTML/CSS/JavaScript. No npm packages, no CDNs, no
build step, no framework, no Firebase SDK — the site talks to Firebase with
plain `fetch()` calls to the official REST APIs. GitHub Pages serves the files
exactly as they are.

## Features

- **Gallery** — responsive grid that reorganizes itself to any screen size.
- **Smart light / dark mode** — automatically dark at night (7 PM–7 AM on
  the visitor's device clock), follows the browser's theme preference during
  the day, and any manual choice the visitor makes always wins. Re-checks
  every minute, so it flips when the clock crosses into night.
- **Mobile mode** — 2-column grid on phones (1 column on very narrow
  screens), larger tap targets, 16px form inputs (no iOS auto-zoom), and the
  fullscreen viewer is tuned for small screens. Desktop gets a wider grid.
- **Cards** — bold project title directly under each photo, GitHub button
  below it (the description appears in the fullscreen view).
- **Fullscreen viewing** — clicking a photo measures the visitor's window
  (`innerWidth` / `innerHeight`) and scales the image so it always fits the
  screen perfectly, even when the window is resized. The photo animates
  smoothly from its card position into fullscreen and back. Close with `Esc`,
  the × button, or clicking the backdrop.
- **GitHub links** — every project has an optional GitHub URL that opens in a
  new tab (with `rel="noopener noreferrer"`).
- **Admin panel** (`admin.html`) — email/password sign-in (Firebase Auth),
  upload photos (auto-resized and compressed in the browser so they fit
  Firestore's 1 MB document limit), add/delete projects, and a one-click
  JSON backup of all projects.
- **Smooth motion** — card hover lifts, scroll-reveal, FLIP-style lightbox
  animation; all animation is disabled for users with
  `prefers-reduced-motion`.
- **Fast** — system fonts, no external requests except the two Google API
  endpoints. Works from a repo sub-path (`…github.io/repo/`) and from a
  custom domain, thanks to relative URLs only.

## Project structure

```
website/  (this folder becomes the root of your GitHub repository)
  index.html          Public gallery page
  admin.html          Admin panel (login, upload, delete, backup)
  demo.html           Demo gallery (sample photos, no Firebase needed)
  demo-data.js        Demo data + fetch mock used by demo.html
  demo/               Demo photos + CREDITS.md (licenses & attribution)
  style.css           All styles (light + dark themes, mobile)
  firebase-config.js  ← EDIT THIS: your Firebase project id/API key + branding
  common.js           Shared helpers (Firestore REST, Auth REST, theme, escaping)
  app.js              Gallery logic (render, lightbox, theme)
  admin.js            Admin logic (session, upload, delete, backup)
  robots.txt          Keeps search engines out of admin.html
  .nojekyll           Tells GitHub Pages not to process this site
README.md             This file
```

## 1. Set up Firebase (one-time, ~10 minutes)

1. Go to <https://console.firebase.google.com> and **Add project**. Google
   Analytics is optional — leave it off for simplicity.
2. **Build → Firestore Database → Create database** → choose *Production mode*
   → pick a region near you (e.g. `europe-west1`, `us-central1`).
3. Open the **Rules** tab and publish these rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /works/{id} {
         allow read: if true;
         allow create, update, delete: if request.auth != null;
       }
     }
   }
   ```

   Visitors may read. Only the signed-in admin may write. This is the **real**
   security boundary — everything else is hardening on top of it.
4. **Build → Authentication → Get started → Sign-in method → Email/Password →
   Enable → Save.**
5. **Authentication → Users → Add user** — create the admin account with a
   strong, unique password (use a password manager).
6. **Project settings → General → Your apps → `</>` Web app** → register any
   name → copy `apiKey` and `projectId` into `website/firebase-config.js`.
   Also edit the `SITE` block (studio name, tagline, description).
7. (Recommended) Restrict the API key: open
   <https://console.cloud.google.com> with the same project selected →
   **APIs & Services → Credentials** → click the *"Browser key (auto created
   by Firebase)"* → set:
   - **Application restrictions → HTTP referrers**: add
     `https://USERNAME.github.io/*` (replace USERNAME — see section 3), your
     custom domain if you use one (e.g. `https://yourdomain.com/*`), and
     `http://localhost:8123/*` (for local testing).
   - **API restrictions → Restrict key**: select `Cloud Firestore API` and
     `Identity Toolkit API`.
   - Save. The key now only works on your own domains.

## 2. Run locally

Firebase calls are blocked when a page is opened directly from disk
(`file://`), so use a local web server:

```powershell
cd website
python -m http.server 8123
```

Open <http://localhost:8123> (gallery) and <http://localhost:8123/admin.html>
(admin). If you set the referrer restriction in step 7 above, make sure
`http://localhost:8123/*` was added, otherwise requests from localhost will be
rejected.

### Demo version

`demo.html` shows exactly how uploaded projects will look — the same rendering
code as the real gallery, fed with sample photos that carry open licenses
(CC0 / CC BY / CC BY-SA, see `demo/CREDITS.md`). It needs **no** Firebase
configuration: open <http://localhost:8123/demo.html> while the local server
is running. The demo's GitHub buttons are placeholders; on the real site they
use the links you enter when uploading. You can delete `demo.html`,
`demo-data.js` and `demo/` before your first push if you don't want them
public (nothing links to them from the live site).

### How the theme is decided

Priority order, evaluated on the visitor's device:

1. **Manual choice** — if the visitor used the moon/sun toggle, that choice
   is remembered (`localStorage`) and always wins.
2. **Time of day** — between 7 PM and 7 AM local time the site is dark.
3. **Browser preference** — during the day it follows
   `prefers-color-scheme` (light otherwise).

The page re-checks every minute and on system-theme changes, so an open tab
switches to dark automatically when evening arrives.

## 3. Host on GitHub Pages (step by step)

### 3.1 Create the GitHub repository

1. Go to <https://github.com/new> and create a repository, for example
   `soumaya-portfolio`.
2. **Visibility must be Public** (GitHub Pages is free for public repos;
   private repos need a paid plan).
3. Leave "Add a README file" unchecked.

### 3.2 Turn `website/` into its own repository and push

The pages site is served from the repository root, so the `website/` folder
becomes a small repository of its own:

```powershell
cd website
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/soumaya-portfolio.git
git push -u origin main
```

Replace `USERNAME` and the repo name with yours. GitHub no longer accepts
plain passwords over HTTPS — authenticate with a
[personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
or, easier, install [GitHub CLI](https://cli.github.com/) and run
`gh auth login`, then:

```powershell
gh repo create soumaya-portfolio --public --source . --push
```

### 3.3 Enable Pages

1. In your repository on github.com: **Settings → Pages**.
2. **Source: Deploy from a branch** → branch `main` → folder **/ (root)** →
   **Save**.
3. Wait about a minute, then visit:

   ```
   https://USERNAME.github.io/soumaya-portfolio/
   ```

   That's your live site. The admin panel is at
   `https://USERNAME.github.io/soumaya-portfolio/admin.html`.

### 3.4 Custom domain (optional)

1. Buy a domain, then in the repo: **Settings → Pages → Custom domain**,
   enter `yourdomain.com` (GitHub shows the exact DNS records to create at
   your registrar — usually 4 A records plus a CNAME for `www`).
2. Wait for DNS to propagate, tick **Enforce HTTPS**. GitHub provides and
   renews the Let's Encrypt certificate automatically.
3. Update the Firebase key referrer restriction with `https://yourdomain.com/*`
   (section 1, step 7).

### 3.5 Updating the live site

Edit the files in `website/`, then:

```powershell
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages redeploys automatically. The site itself updates within a
minute; browsers may cache files for up to ~10 minutes, so use a hard refresh
(Ctrl+F5) to see changes immediately.

## 4. How the Firebase API key is kept secure on GitHub Pages

### What the API key actually is

A Firebase *browser* API key is **not a secret** — it is a project identifier
that Google documents as safe to ship in web pages. On GitHub Pages the site
is public and static, so the key **will** be visible in the page source. That
is fine: the key grants **no access by itself**. All access is decided by the
Firestore **security rules** you published in section 1. Even if someone
copies the key from your page:

- the rules still stop them from writing anything (only the signed-in admin
  can write), and
- the referrer restriction stops them from using the key from any other
  website — it only works when the request comes from your GitHub Pages
  domain.

So on GitHub Pages the security model is:

1. **Layer 1 — Firestore rules** (the real access control): anyone can read,
   only a signed-in admin user can create/update/delete.
2. **Layer 2 — API key restrictions** (section 1, step 7): the key is
   rejected unless the request comes from `USERNAME.github.io` / your custom
   domain, and it can only call Firestore and the Auth API.

### Admin session handling

- Admin credentials are **never** stored in code and never committed to the
  repository. The admin signs in at `admin.html` with the Firebase Auth
  account you created.
- The ID token returned by Firebase is kept in **`sessionStorage`** only:
  it lives in one tab and disappears when the tab closes (unlike
  `localStorage`, which persists). Tokens expire after 1 hour; the app
  refreshes them silently while the tab is open, and asks for a new sign-in
  when they cannot be refreshed.
- Writes are impossible without a valid token: Firestore rejects them at the
  server, regardless of what anyone does to the page.

### Why not the official Firebase SDK?

Security-wise the SDK offers nothing extra: it sends the same non-secret API
key and enforces the same Firestore Security Rules. This site calls the same
official REST endpoints directly (including a real Firebase Auth login that
produces the same ID tokens), while saving ~150 KB of JavaScript and avoiding
a CDN dependency or a bundler build step. The only SDK feature that would add
security is **App Check** (verifies requests come from your own domain and
protects your free quota from abuse) — optional and not required at portfolio
scale; switch to the SDK if you ever want it.

### Note for maximum secrecy

GitHub Pages cannot hide the key from the browser (there is no server code
you control). If you ever want the key to never leave your own machine, you
can switch to self-hosting behind a reverse proxy that injects the key
server-side: set `apiKey: ""` in `firebase-config.js` and proxy `/__api`,
`/__auth` and `/__token` to the Google endpoints (the site has built-in
support for this). This is optional — the two layers above are the industry
standard for Firebase web apps.

## 5. Security checklist

- [ ] Firestore rules published exactly as above (`write` only with auth).
- [ ] Admin user created with a strong, unique password (password manager).
- [ ] API key restricted: referrers include `https://USERNAME.github.io/*`
      and your custom domain (section 1, step 7) + API restrictions.
- [ ] Two-factor authentication enabled on the Google account that owns the
      Firebase project **and** on your GitHub account.
- [ ] HTTPS enforced (automatic on GitHub Pages; tick "Enforce HTTPS" for
      custom domains).
- [ ] Backups: the repo itself backs up the site files; take the admin panel
      JSON export regularly for the photo data.
- [ ] No secrets in the repository: only the non-secret API key in
      `firebase-config.js`. Never commit the admin password, refresh tokens,
      or personal access tokens.

## 6. Daily use

**Admin** — open `/admin.html`, sign in, pick a photo (it is compressed
automatically), add a title, description, and the GitHub URL of the project
source, and upload. Delete removes a project permanently. *Download backup*
exports everything as JSON.

**Visitors** — see the gallery on `/`. Click a photo to open it fullscreen
(fits any screen, animates from its card, closes with `Esc`). Click the
GitHub button to open the project source in a new tab. The moon/sun button
switches light/dark mode.

## 7. Limits and notes

- **Firestore free tier**: 1 GiB storage, 50K reads / 20K writes per day —
  far more than a portfolio needs. Firestore charges nothing at this scale.
- **GitHub Pages**: free for public repositories; soft bandwidth limit of
  100 GB/month, no server-side code. The repo must stay public (or you need
  GitHub Pro).
- **1 MB per document**: photos are resized to ≤1600 px and JPEG-compressed
  to under ~900 KB on upload. That's plenty for on-screen display. If you
  later want full-resolution originals, the natural upgrade is Firebase
  Storage (store the download URL in Firestore instead of the image) — kept
  out of this version to minimize complexity.
- Practical size: up to a few hundred projects is fine; the gallery loads
  them in one request, sorted newest-first.
- The gallery needs JavaScript and a modern browser (works in all evergreen
  browsers; `prefers-reduced-motion` users get static fades).

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `https://USERNAME.github.io/repo/` gives 404 | Pages not enabled (section 3.3), or the site was pushed to a branch/folder other than `main` + `/ (root)`. |
| "Couldn't load projects: PERMISSION_DENIED" | Firestore rules not published — publish the rules from section 1 step 3. |
| Admin upload fails with 403 | Token expired — sign in again; or the write rule is missing. |
| "Sign-in failed: INVALID_LOGIN_CREDENTIALS" | Wrong email/password, or the Email/Password provider isn't enabled, or the admin user was never created (section 1 steps 4–5). |
| "Referrer not allowed" / 403 on the live site | The API key's referrer restriction doesn't include `https://USERNAME.github.io/*` (and custom domain) — add them in Cloud Console. |
| Everything fails on `localhost` | Referrer restriction doesn't include `http://localhost:8123/*` — add it (or you opened the page via `file://`, which never works). |
| Changes don't appear on the live site | Wait a minute for the deploy, then hard-refresh (Ctrl+F5) — GitHub Pages caches files for up to ~10 minutes. |
| Images missing on the live site | You moved/renamed files and broke the relative paths — keep the folder layout from section "Project structure". |
| CORS errors in the browser console | Page opened from `file://`, or `apiKey` was left empty on GitHub Pages (proxy mode only works when self-hosting). |
| Images look blocky | Expected: upload compression is tuned for fast loading. Re-upload with the original file at a higher resolution setting (edit `maxDim` in `admin.js`) if needed. |
