# Cryptic Quest 4.0 — Interactive Missions

Cryptic Quest is a dependency-free cryptography learning game for the web. Version 3.2 adds a local learning-intelligence layer on top of the campaign, Academy, Sandbox, Attack Lab, CTFs, and daily challenges.

## 3.2 highlights

- **Cross-session anti-repeat memory**: the last 60 answered prompts are deprioritized in new sessions.
- **Mistake Notebook**: wrong answers are stored locally with the correct answer, explanation, topic, wrong-count, review level, and next review time.
- **Spaced repetition**: correct reviews move through increasing intervals; repeated mistakes return sooner.
- **External JSON question bank**: `content/questions-v3.2.json` contains 105 unique curated questions across 21 conceptual topics.
- **Question-bank QA**: CI checks IDs, duplicate prompts, answer indexes, topic coverage, difficulty metadata, hints, and explanations.
- **Seeded/reproducible sessions**: campaign, Quick, Exam, and Endless runs receive a `CQ32-...` session code.
- **Skill dependency diagnostics**: weak higher-level skills are linked to under-practiced prerequisites.
- **Training modes**: Quick Practice (5), Exam Mode (20), Endless Mode (3 lives), and Spaced Review.
- Existing duplicate-within-section protection from 3.1.2 remains enforced.

## Existing major features

- 12 themed worlds / 36 campaign missions
- Four difficulty profiles
- Academy with beginner and technical explanations
- Caesar, Vigenère, Affine, Playfair, Rail Fence, XOR, number theory, Diffie–Hellman, RSA, SHA-256, and AES teaching labs
- ECB, reused-keystream, MITM, and avalanche attack simulations
- Daily Challenge, CTF, Detective, and Crypto Disaster modes
- XP, ranks, achievements, streaks, progress import/export
- Installable offline-capable PWA
- No account, ads, analytics, API key, backend, remote fonts, or remote runtime dependencies

## Run locally

### Windows

1. Extract the ZIP.
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

This performs JavaScript syntax validation, question-bank QA, cryptographic regression checks, content integrity checks, anti-repeat tests, seed tests, spaced-repetition tests, skill-dependency tests, PWA/static asset checks, and randomized generator stress tests.

Question-bank-only QA:

```bash
npm run qa:questions
```

## Question authoring

Curated expansion questions live in `content/questions-v3.2.json`. Each record has a stable ID, topic, skill, difficulty, prompt, four choices, correct answer index, explanation, and hint. The QA command fails on duplicate IDs/prompts, invalid answers, missing teaching text, invalid difficulty, or insufficient topic coverage.

## Session codes

Campaign and non-review practice runs display codes such as:

```text
CQ32-M-ORIGINS-1-ANA-7F91B2C4
```

Use **Training → Replay a session code** to reproduce the generated set in this release. Spaced Review is not seed-replayable because the queue changes with learner history.

## Local privacy

Question history, mistakes, review schedules, mastery data, XP, and session codes remain in browser local storage and are not sent to a server.

## Educational security note

Cryptic Quest deliberately uses small numbers and historical/insecure constructions for teaching. Toy RSA, classical ciphers, and simplified protocol examples are not production cryptography.


## Theme variant

This web-only package applies a stronger cyberpunk palette with neon pink, violet, and cyan accents over the existing 3.2 learning features.

## 3.2.2 Cyberpunk polish

This web-only build keeps the 3.2 learning engine and adds a completed neon pink/cyan/violet cyberpunk theme across the Training Center and other 3.2-specific UI, keyboard focus improvements, clearer answer-state feedback, responsive navigation fixes, high-contrast support, and refreshed cache/version metadata.


## 4.0 interactive mission mechanics

The campaign now includes five hands-on mechanics instead of relying exclusively on multiple-choice and text-entry questions:

| Mission | Mechanic |
|---|---|
| Clockwork Arithmetic | Clickable modular clock |
| Inside AES | Reorder the AES round transformations |
| Shared Secret | Complete a Diffie–Hellman exchange |
| RSA Forge | Build `n`, `φ(n)`, `d`, and ciphertext |
| Chain of Trust | Arrange a certificate validation path |

Interactive missions are marked **⚡ INTERACTIVE** on the campaign screen. They remain integrated with mastery tracking, the Mistake Notebook, spaced review, XP, hints, explanations, and seeded session replay.

