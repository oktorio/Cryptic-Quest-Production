# Cryptic Quest 2.0 — Production Release Notes

Cryptic Quest 2.0 transforms the original learning prototype into a general-audience, self-contained cryptography adventure.

## Highlights

- 12 themed worlds and 36 campaign missions with boss encounters.
- Four audience/difficulty profiles from complete beginner to CTF-oriented play.
- Adaptive practice driven by measured skill mastery.
- Academy lessons, Field Guide, free-form Sandbox, Attack Laboratory, Detective cases, Crypto Disasters, CTF challenges, and deterministic Daily Challenge.
- Interactive Caesar, Vigenere, Affine, Rail Fence, Playfair, XOR, modular arithmetic, Diffie-Hellman, RSA, SHA-256, and AES teaching tools.
- Progress, XP, ranks, achievements, streaks, mastery, import/export, and local persistence.
- Installable/offline-capable PWA with responsive and accessibility-focused UI.
- Dependency-free runtime: plain HTML, CSS, and JavaScript; no backend, account, analytics, API key, or package installation required.
- GitHub Actions CI and GitHub Pages deployment workflows.
- Security, privacy, contribution, licensing, and learning-map documentation.

## Validation

The release includes automated regression checks for cryptographic utilities, known AES round transformations, campaign/content integrity, CTF solvability, unique HTML IDs, PWA assets, and remote-dependency guards.

Run:

```bash
npm run check
```

The runtime itself has no npm dependencies; Node is only used for automated checks.

## Production note

Cryptic Quest is an educational simulator. Classical ciphers, small RSA parameters, and simplified protocol demonstrations are intentionally insecure teaching examples and must not be reused as production cryptography.
