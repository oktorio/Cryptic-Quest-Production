# Cryptic Quest 4.2.0 — Advanced Mission Experience

- RSA-CRT staged private-key decryption and CRT recombination in The RSA Vault.
- CBC single-bit ciphertext-error propagation tracing in Mode Control.
- Direct AES ShiftRows 4×4 state manipulation in Inside AES.
- Known-plaintext reused-keystream recovery in The Reused Pad.
- Deterministic generation, Node regression coverage, Chromium interaction coverage, and refreshed PWA cache metadata.

# Cryptic Quest 4.1 — Mission Experience 2.0

- Adds a dedicated Mission Experience layer for deeper staged campaign mechanics.
- Upgrades RSA Forge to four individually verified stages: n, φ(n), d, then ciphertext.
- Upgrades Shared Secret to verify Alice/Bob public values before the shared secret unlocks.
- Adds Exponent Reactor 2.0 with binary decomposition and a visible square-and-multiply trace.
- Adds stage-specific feedback, lock/unlock progression, and "why this step matters" guidance.
- Adds Node regression checks and Playwright browser tests for staged progression.
- Bumps web/PWA cache metadata to 4.1.0.

# Cryptic Quest 4.0.2 — Modular Clock Hotfix

- Fixes modular-clock number buttons collapsing near the center of the dial.
- Uses a responsive length-based clock radius instead of a percentage transform radius.
- Extends the existing Playwright browser smoke test to verify clock geometry and click handling.
- Refreshes PWA cache/version metadata so the corrected CSS is fetched cleanly.

# Cryptic Quest 4.0.1 — Repository & Reliability Cleanup

Version 4.0.1 is a maintenance release focused on keeping the 4.0 interactive-mission foundation clean, reproducible, and safer to publish.

## Repository cleanup

- Removed the duplicated nested `Cryptic-Quest-Production/` project tree.
- The repository root is now the single canonical application source.
- This avoids editing, testing, or deploying an outdated duplicate by mistake.

## Session-code migration

- New reproducible sessions now use the `CQ40-...` prefix.
- Existing `CQ32-...` session codes remain accepted for replay.
- Added a dedicated version-compatibility smoke test so legacy replay support is regression-tested.

## CI reliability

The standard quality workflow still runs the full static, cryptographic, question-bank, anti-repeat, spaced-repetition, and interactive-mission regression suite.

A second browser-smoke job now installs Chromium via Playwright and verifies that the real application can load and navigate through:

`Home → Campaign → Training → Sandbox`

The browser job also fails on uncaught page errors or browser console errors.

## GitHub Pages

The previous deployment workflow failed during `Configure GitHub Pages` because the repository Pages site had not yet been enabled at the repository-settings level.

The Pages workflow is now gated by the repository variable `ENABLE_PAGES_DEPLOY=true`. Until the one-time Pages setup is completed, deployment is skipped instead of producing a failed workflow run.

See `PAGES_SETUP.md` for the setup steps.

## Interactive missions retained

The five 4.0 interactive campaign mechanics remain unchanged:

- Clockwork Arithmetic — clickable modular clock
- Inside AES — AES round ordering
- Shared Secret — Diffie–Hellman exchange
- RSA Forge — toy RSA key construction
- Chain of Trust — PKI certificate path ordering

They remain integrated with mastery tracking, Mistake Notebook, spaced review, seeded replay, hints, explanations, and XP.
