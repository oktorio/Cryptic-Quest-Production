# Cryptic Quest 4.0.0 QA Report

## Scope

This QA pass covers the web-only Cyberpunk build with the first interactive mission milestone.

## Automated validation

`npm run check` passes successfully. Coverage includes:

- modular arithmetic, GCD, inverses, totient, primitive roots, CRT and modular exponentiation;
- Caesar, Vigenère, Affine, Rail Fence, Playfair and XOR helpers;
- AES SubBytes, ShiftRows, MixColumns and AddRoundKey regression vectors;
- 12 worlds / 36 campaign missions;
- 105-question external conceptual bank and question-bank QA;
- duplicate-free question generation and cross-session anti-repeat logic;
- session seed parsing and deterministic replay utilities;
- Mistake Notebook and spaced-repetition scheduling;
- skill dependency analysis;
- five deterministic interactive mission mechanics;
- interactive answer grading;
- persistence of interactive mechanic/data fields for review reconstruction;
- unique HTML IDs;
- PWA files and local runtime dependencies.

## Interactive mission set

1. `numbers-1` — modular clock
2. `fortress-1` — AES round ordering
3. `exchange-2` — Diffie–Hellman exchange
4. `publickey-2` — RSA key forge
5. `trust-2` — PKI chain ordering

Each interactive challenge replaces one conventional question, so mission question counts and XP weighting remain unchanged.

## Local HTTP smoke check

The following resources were served from the packaged project and returned HTTP 200:

- `/`
- `/js/interactive-missions.js`
- `/styles.css?v=4.0.0-interactive`
- `/content/questions-v3.2.json`

## Browser interaction note

The automated environment does not provide a reliable full Chromium UI click-through for local applications. The new interaction logic is therefore validated with pure regression tests and local-resource serving checks. A normal Chrome/Edge manual smoke test remains recommended before public deployment, especially drag-and-drop behavior across touch devices.
