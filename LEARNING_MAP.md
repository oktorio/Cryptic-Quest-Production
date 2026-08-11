# Cryptic Quest Learning Map

Cryptic Quest is structured as a progression from intuition to modern system design.

| World | Core ideas | Main interactions |
|---|---|---|
| Cipher Origins | Caesar, Vigenère, substitution/transposition, frequency intuition | Cipher wheel/playground, dynamic missions |
| Secret Machines | XOR, stream ciphers, one-time pad rules, keystream reuse | XOR studio, reused-keystream exploit |
| Cipher Fortress | AES, confusion/diffusion, ECB/CBC/CTR/AEAD concepts | AES state visualizer, ECB pattern lab |
| Number Realm | Congruence, GCD, modular inverse, fast exponentiation | Modular clock, Euclid/inverse/mod-exp lab |
| Prime Kingdom | Totient, primitive roots, CRT | Randomized number-theory missions |
| Key Exchange | Diffie–Hellman, shared-secret derivation, MITM | DH simulator, MITM relay simulation |
| Public Key Revolution | Asymmetric roles, RSA arithmetic, hybrid design | RSA Forge and RSA boss |
| Digital Fingerprints | Hash properties, avalanche, password storage | SHA-256 visualizer, password breach case |
| Identity & Access | IBE, ABE, authentication vs authorization | Scenario questions and policy reasoning |
| Crypto Battlefield | Replay, nonce misuse, downgrade, side channels, protocol reasoning | Detective cases and boss gauntlet |
| Digital Trust | Digital signatures, PKI, certificates, TLS | Chain/trust and TLS reasoning missions |
| Quantum Frontier | Quantum threat model, PQC, KEMs, crypto-agility | Migration and KEM scenario missions |

## Challenge modes

- **Daily** — deterministic local daily puzzle and streak.
- **CTF** — escalating flags covering encoding, ciphers, XOR, modular arithmetic, DH and RSA.
- **Detective** — evidence-based failure diagnosis.
- **Crypto Disasters** — concise historical implementation/protocol lessons.

## Teaching safety boundary

Small RSA keys, classical ciphers, repeated XOR keys, and similar examples are deliberately insecure teaching devices. The UI explicitly distinguishes them from production recommendations such as standardized authenticated encryption, authenticated key exchange, purpose-built password hashing, certificate validation, and planned post-quantum migration.

## Version 3.2 learning intelligence

The Training Center sits across the curriculum rather than belonging to one world. Recent-question memory reduces repetition; the Mistake Notebook schedules weak items for spaced review; Quick/Exam/Endless modes draw from multiple skills; and the dependency model can recommend prerequisite review (for example modular arithmetic/GCD → inverse → RSA, or DH → MITM defense). Session seeds allow generated campaign and practice sets to be reproduced within the same release.

## 4.0 hands-on mission layer

Five campaign missions now include a required interactive mechanic:

- Number Realm / Clockwork Arithmetic → modular clock selection
- Cipher Fortress / Inside AES → AES round ordering
- Key Exchange / Shared Secret → Diffie–Hellman public/shared value console
- Public Key Revolution / RSA Forge → multi-step RSA key construction
- Digital Trust / Chain of Trust → certificate path ordering

These mechanics are designed to move learners from recognition-based questions toward construction and manipulation tasks while preserving the existing adaptive review and mastery model.
