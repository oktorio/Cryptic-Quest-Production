# Cryptic Quest

**Cryptic Quest** is a production-oriented, dependency-free cryptography learning game for the web. It combines a story campaign, adaptive practice, visual mathematics, cryptographic sandboxes, attack simulations, daily challenges, detective cases, historical failures, and capture-the-flag puzzles.

It is designed for a broad audience: complete beginners, students, cybersecurity practitioners, and experienced learners who want fast practice.

## Highlights

- 12 themed learning worlds and 36 story missions
- Four difficulty profiles: Explorer, Analyst, Cryptographer, and Nightmare / CTF
- Adaptive practice that targets the learner's weakest measured skill
- Beginner and technical explanation modes
- Crypto Academy with guided explanations
- Cipher Playground: Caesar, Vigenère, Affine, Playfair, and Rail Fence
- XOR / reused-keystream laboratory
- Modular arithmetic clock, GCD, inverses, exponentiation, Euler totient, primitive roots, and CRT
- Diffie–Hellman simulator
- Toy RSA key-generation, encryption, and decryption simulator
- SHA-256 avalanche visualizer using the browser Web Crypto API
- AES state visualizer with real SubBytes, ShiftRows, MixColumns, and AddRoundKey teaching primitives
- ECB pattern-leak, reused-keystream, MITM, and avalanche attack simulations
- Daily deterministic challenge with local streak tracking
- CTF challenges, crypto detective cases, and historical “Crypto Disasters”
- XP, ranks, achievements, mission scores, and skill mastery
- Progress export/import as JSON
- Installable PWA and offline app shell
- Responsive and keyboard-friendly interface with reduced-motion support
- No analytics, accounts, ads, backend, API key, remote fonts, or remote runtime dependencies

## Run locally

### Windows — easiest method

1. Extract the repository/ZIP.
2. Double-click `start.bat`.
3. Your browser opens `http://localhost:8000`.

The launcher uses `py` or `python` if available.

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

Then open:

```text
http://localhost:8000
```

### npm convenience command

There are **no npm package dependencies**. If Node.js is installed:

```bash
npm start
```

The `npm start` command simply launches Python's static HTTP server.

> Do not rely on opening `index.html` directly with `file://`. ES modules, Web Crypto behavior, and service workers are intended to run from HTTP(S).

## Test before publishing

With Node.js installed:

```bash
npm run check
```

This checks JavaScript syntax and runs regression/content-integrity tests.

## Deploy to GitHub Pages

The repository includes `.github/workflows/pages.yml`.

```bash
git init
git add .
git commit -m "Release Cryptic Quest 2.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Then in GitHub:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions** if it is not already selected.
3. Push to `main` or run the Pages workflow manually.

The workflow first runs the regression checks and only deploys after they pass.

The workflow follows GitHub's current Pages Actions pattern using `actions/checkout@v7`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`.

## Install as an app

When served through HTTPS (including GitHub Pages) or localhost, supporting browsers can install Cryptic Quest as a Progressive Web App. The project includes:

- a web app manifest with stable app ID, app shortcuts, and 192/512px icons;
- a maskable 512px icon;
- a service worker that pre-caches the app shell;
- offline fallback for navigations after the first successful load.

Browser support and install UI vary by platform.

## Application structure

```text
.
├── index.html
├── styles.css
├── manifest.webmanifest
├── sw.js
├── start.bat
├── start.sh
├── js/
│   ├── app.js
│   ├── content.js
│   └── crypto-utils.js
├── assets/icons/
├── tests/test.mjs
└── .github/workflows/
```

### `js/crypto-utils.js`
Pure teaching/calculation utilities: modular arithmetic, CRT, Caesar/Vigenère/Affine/Rail Fence, XOR, Diffie–Hellman/RSA building blocks, and AES round transformations.

### `js/content.js`
Data-driven worlds, missions, Academy content, achievements, detective cases, failure stories, CTF challenges, and field-guide entries.

### `js/app.js`
UI state, adaptive learning logic, mission generation/scoring, sandbox/attack simulations, daily challenge logic, local persistence, PWA installation, and accessibility interactions.

## Production characteristics

### Local-first privacy

All learning state is stored in browser `localStorage`. No learner data is transmitted by the application. See `PRIVACY.md`.

### Security posture

- No remote JavaScript or CSS dependencies.
- No `eval` or dynamic code execution.
- Player-supplied content is rendered as text or escaped before HTML insertion.
- A restrictive Content Security Policy is provided in `index.html`.
- A `_headers` file is included for hosts that support static security headers.
- Imported progress is shape-filtered before use.
- Toy cryptographic examples are labeled as educational and intentionally insecure where appropriate.

GitHub Pages does not allow arbitrary custom response headers from the repository alone, so the HTML CSP remains the primary in-repo browser policy on Pages. If deploying to a platform that supports `_headers`, additional response-level policies can be applied automatically.

See `SECURITY.md` for deployment guidance.

## Learning design

The player-facing experience is organized by cryptographic ideas and skill progression:

1. Cipher Origins
2. Secret Machines
3. Cipher Fortress
4. Number Realm
5. Prime Kingdom
6. Key Exchange
7. Public Key Revolution
8. Digital Fingerprints
9. Identity & Access
10. Crypto Battlefield
11. Digital Trust
12. Quantum Frontier

See `LEARNING_MAP.md` for the detailed scope.

## Extending the game

Most new content can be added without changing the UI architecture:

- add a world or mission in `js/content.js`;
- add conceptual questions to `questionBank` in `js/app.js`;
- add a numeric generator when randomized calculations are useful;
- add an Academy module and Field Guide entry;
- add tests for any new cryptographic utility.

When adding real cryptographic examples, prefer standards-based descriptions and make a clear distinction between **teaching-size examples** and **production security recommendations**.

## Browser targets

The application uses modern standard browser capabilities: ES modules, `localStorage`, Web Crypto, service workers, CSS Grid/Flexbox, and the web app manifest. Current Chromium, Firefox, and Safari-family browsers are the intended targets. Some PWA installation features are browser/platform-specific.

## License

MIT. See `LICENSE`.
