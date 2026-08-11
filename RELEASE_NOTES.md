# Cryptic Quest 4.0.0 — Interactive Missions Milestone 1

Version 4.0 begins the transition from a quiz-heavy learning application into a hands-on cryptography game. The existing 3.2 learning intelligence, cyberpunk visual theme, anti-repeat engine, Mistake Notebook, spaced repetition, seeded sessions, labs, campaign, and CTF content remain intact.

## New interactive campaign mechanics

Five campaign missions now replace one conventional question with a hands-on interaction while preserving the original mission length and XP balance.

- **Clockwork Arithmetic — Modular Clock:** click the correct landing position after applying a modular movement.
- **Inside AES — Round Repair:** reorder SubBytes, ShiftRows, MixColumns, and AddRoundKey using drag-and-drop or accessible arrow controls.
- **Shared Secret — Diffie–Hellman Console:** calculate Alice's public value, Bob's public value, and the shared secret in one exchange flow.
- **RSA Forge — Key Forge:** calculate `n`, `φ(n)`, the private exponent `d`, and the ciphertext from supplied toy parameters.
- **Chain of Trust — Certificate Path:** reorder Root CA, Intermediate CA, and Server/Leaf Certificate into the validation path.

Interactive missions are marked with **⚡ INTERACTIVE** in the campaign.

## Learning integration

Interactive challenges participate in the same learning system as conventional questions:

- skill mastery updates;
- Mistake Notebook recording;
- spaced repetition scheduling;
- session seed reproducibility;
- hint and explanation penalties;
- mission accuracy and XP calculation.

The interactive challenge snapshot now preserves mechanic metadata and challenge parameters, so a missed interactive problem can be reconstructed by the review system.

## Accessibility and mobile interaction

Ordering mechanics support both drag-and-drop and explicit up/down buttons, so keyboard and touch users are not dependent on drag gestures. Interactive fields use large touch targets and responsive layouts. Modular clock positions are real buttons with visible focus states.

## Validation

`npm run check` validates the entire legacy regression suite plus new tests for:

- deterministic interactive challenge generation;
- canonical answer grading;
- supported interactive mission IDs;
- persistence of interactive challenge metadata in the Mistake Notebook;
- JavaScript syntax and PWA shell inclusion.

The local HTTP smoke check also confirms the entry page, interactive mission module, CSS, and external question bank are served successfully.
