# Cryptic Quest 3.2 — Question Bank Health

## Curated external expansion bank

- File: `content/questions-v3.2.json`
- Questions: **105**
- Topics: **21**
- Minimum per topic: **5**
- Duplicate prompt fingerprints: **0**
- Duplicate IDs: **0**
- Invalid choice answer indexes: **0**

Topics: classical, stream, OTP reuse, AES, modes, ECB, asymmetric cryptography, hashing, password storage, IBE, ABE, access models, attacks, protocol reasoning, signatures, PKI, TLS, PQC, KEM, migration, and MITM defense.

## Additional sources

The external bank is not the whole question supply. Cryptic Quest also has built-in curated questions plus procedural generators for Caesar, Vigenère, XOR, modular arithmetic, modular inverse, modular exponentiation, Euler totient, primitive roots, CRT, Diffie–Hellman, and RSA. Parameterized generators are deduplicated by normalized prompt inside each session.

## Anti-repeat policy

1. A normalized prompt cannot repeat within the same mission/practice section.
2. The most recent 60 answered prompts are deprioritized in new sessions.
3. If fresh material is insufficient to fill a required section, the engine may use the least-recent eligible material rather than return an incomplete session.
4. Replaying an explicit session seed ignores recent-history filtering so that the session can be reproduced exactly.

## CI rule

Run `npm run qa:questions` or the full `npm run check`. The build fails for duplicate IDs/prompts, missing metadata, invalid answer indexes, invalid difficulty metadata, short/missing teaching text, insufficient per-topic JSON coverage, or regression-test failures.
