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
