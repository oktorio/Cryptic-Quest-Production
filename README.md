# Cryptic Quest 4.0.1 — Interactive Missions

<img width="1584" height="818" alt="Cryptic Quest" src="https://github.com/user-attachments/assets/1da6aa93-0d99-4a19-a76f-8105c1b64862" />

Cryptic Quest is a dependency-free cryptography learning game for the web. The 4.x series combines the adaptive learning systems introduced in 3.2 with hands-on interactive campaign mechanics.

## 4.0.1 maintenance highlights

- Repository cleanup: the duplicated nested project copy has been removed; the repository root is now the canonical application.
- New sessions use `CQ40-...` reproducible session codes.
- Existing `CQ32-...` codes remain replayable for backward compatibility.
- CI now includes a real Chromium/Playwright browser smoke test in addition to static and mathematical regression tests.
- GitHub Pages deployment is gated until the repository completes the one-time Pages setup; see `PAGES_SETUP.md`.
- Package/release metadata is aligned to version 4.0.1.

## Learning intelligence

- **Cross-session anti-repeat memory**: the last 60 answered prompts are deprioritized in new sessions.
- **Mistake Notebook**: wrong answers are stored locally with the correct answer, explanation, topic, wrong-count, review level, and next review time.
- **Spaced repetition**: correct reviews move through increasing intervals; repeated mistakes return sooner.
- **External JSON question bank**: `content/questions-v3.2.json` contains 105 unique curated questions across 21 conceptual topics.
- **Question-bank QA**: CI checks IDs, duplicate prompts, answer indexes, topic coverage, difficulty metadata, hints, and explanations.
- **Seeded/reproducible sessions**: Campaign, Quick, Exam, and Endless runs receive a reproducible session code.
- **Skill dependency diagnostics**: weak higher-level skills are linked to under-practiced prerequisites.
- **Training modes**: Quick Practice (5), Exam Mode (20), Endless Mode (3 lives), and Spaced Review.
- Duplicate-within-section protection remains enforced.

## Interactive mission mechanics

The campaign includes five hands-on mechanics instead of relying exclusively on multiple-choice and text-entry questions:

| Mission | Mechanic |
|---|---|
| Clockwork Arithmetic | Clickable modular clock |
| Inside AES | Reorder the AES round transformations |
| Shared Secret | Complete a Diffie–Hellman exchange |
| RSA Forge | Build `n`, `φ(n)`, `d`, and ciphertext |
| Chain of Trust | Arrange a certificate validation path |

Interactive missions are marked **⚡ INTERACTIVE** on the campaign screen. They remain integrated with mastery tracking, the Mistake Notebook, spaced review, XP, hints, explanations, and seeded session replay.

## Existing major features

- 12 themed worlds / 36 campaign missions
- Four difficulty profiles
- Academy with beginner and technical explanations
- Caesar, Vigenère, Affine, Playfair, Rail Fence, XOR, number theory, Diffie–Hellman, RSA, SHA-256, and AES teaching labs
- ECB, reused-keystream, MITM, and avalanche attack simulations
- Daily Challenge, CTF, Detective, and Crypto Disaster modes
- XP, ranks, achievements, streaks, progress import/export
- Installable offline-capable PWA
- Cyberpunk web interface
- No account, ads, analytics, API key, backend, remote fonts, or remote runtime dependencies

## Run locally

### Windows

1. Clone or download the repository.
2. Double-click `start.bat`.
3. Open `http://127.0.0.1:8317` if the browser does not open automatically.

### macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

Then open `http://127.0.0.1:8317`.

### npm convenience

There are no npm runtime dependencies:

```bash
npm start
```

## QA before publishing

Run:

```bash
npm run check
```

This performs JavaScript syntax validation, question-bank QA, cryptographic regression checks, content integrity checks, anti-repeat tests, session-code compatibility tests, spaced-repetition tests, skill-dependency tests, PWA/static asset checks, and randomized generator stress tests.

GitHub CI additionally launches Chromium with Playwright and performs a browser smoke path through Home → Campaign → Training → Sandbox.

Question-bank-only QA:

```bash
npm run qa:questions
```

## Question authoring

Curated expansion questions live in `content/questions-v3.2.json`. Each record has a stable ID, topic, skill, difficulty, prompt, four choices, correct answer index, explanation, and hint. The QA command fails on duplicate IDs/prompts, invalid answers, missing teaching text, invalid difficulty, or insufficient topic coverage.

## Session codes

New Campaign and non-review practice runs use codes such as:

```text
CQ40-M-ORIGINS-1-ANA-7F91B2C4
```

Older 3.2 codes such as the following remain supported for replay:

```text
CQ32-M-ORIGINS-1-ANA-7F91B2C4
```

Use **Training → Replay a session code** to reproduce the generated set. Spaced Review is not seed-replayable because the queue changes with learner history.

## GitHub Pages

The deployment workflow is included, but GitHub Pages requires one repository-level setup step before it can deploy. Follow `PAGES_SETUP.md`. Until that is completed, the Pages job is intentionally skipped instead of reporting a failed deployment.

## Local privacy

Question history, mistakes, review schedules, mastery data, XP, and session codes remain in browser local storage and are not sent to a server.

## Educational security note

Cryptic Quest deliberately uses small numbers and historical/insecure constructions for teaching. Toy RSA, classical ciphers, and simplified protocol examples are not production cryptography.


## 4.1 Mission Experience 2.0

Mission Experience 2.0 makes selected campaign missions behave like guided cryptography workbenches instead of all-or-nothing quiz questions.

- **RSA Forge 2.0** verifies `n → φ(n) → d → ciphertext` in sequence and explains why each stage exists.
- **Shared Secret 2.0** verifies Alice and Bob's public values independently before unlocking the shared secret.
- **Exponent Reactor 2.0** requires a binary exponent decomposition, then reveals a square-and-multiply trace before the final modular residue is submitted.
- Existing local progress, anti-repeat history, mistake tracking, spaced repetition, session seeds and XP scoring remain in place.


## 4.2 Mission Experience expansion

Four more campaign operations are hands-on: RSA-CRT decryption/recombination, CBC error propagation, AES ShiftRows matrix manipulation, and reused-XOR keystream recovery. They use staged verification and remain reproducible from CQ40 session codes.
