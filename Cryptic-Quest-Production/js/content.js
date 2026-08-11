export const worlds = [
  { id:'origins', number:1, icon:'𐄙', title:'Cipher Origins', subtitle:'Secrets before computers', skills:['caesar','vigenere','classical'], description:'Learn how substitution and polyalphabetic ciphers transform messages—and why patterns betray them.' },
  { id:'machines', number:2, icon:'⊕', title:'Secret Machines', subtitle:'Bits, XOR & keystreams', skills:['xor','stream'], description:'Move from letters to bits. Operate XOR, stream ciphers, and one-time-pad ideas safely.' },
  { id:'fortress', number:3, icon:'▦', title:'Cipher Fortress', subtitle:'Modern symmetric encryption', skills:['aes','modes'], description:'Explore block ciphers, AES rounds, confusion, diffusion, and modes of operation.' },
  { id:'numbers', number:4, icon:'≡', title:'Number Realm', subtitle:'The arithmetic of cryptography', skills:['modular','gcd','inverse'], description:'Build intuition for congruences, GCDs, inverses, and fast modular exponentiation.' },
  { id:'primes', number:5, icon:'φ', title:'Prime Kingdom', subtitle:'Structures behind public keys', skills:['phi','primitive','crt'], description:'Work with primes, Euler’s totient, primitive roots, and the Chinese Remainder Theorem.' },
  { id:'exchange', number:6, icon:'⇄', title:'Key Exchange', subtitle:'Agree without sharing the secret', skills:['dh','mitm'], description:'Run Diffie–Hellman and learn exactly why unauthenticated exchange is vulnerable to interception.' },
  { id:'publickey', number:7, icon:'🔑', title:'Public Key Revolution', subtitle:'RSA & asymmetric thinking', skills:['rsa','asymmetric'], description:'Forge RSA keys, encrypt small messages, and reason about public/private key roles.' },
  { id:'fingerprints', number:8, icon:'#', title:'Digital Fingerprints', subtitle:'Integrity & hashing', skills:['hash','integrity'], description:'Investigate preimages, collisions, avalanche behavior, password hashing, and integrity checks.' },
  { id:'identity', number:9, icon:'◎', title:'Identity & Access', subtitle:'Encrypt for people and attributes', skills:['ibe','abe','access'], description:'Compare identity-based and attribute-based encryption with conventional public-key systems.' },
  { id:'battlefield', number:10, icon:'⚠', title:'Crypto Battlefield', subtitle:'Break assumptions, not mathematics', skills:['attacks','protocols'], description:'Diagnose nonce reuse, replay, downgrade, brute-force, and implementation failures.' },
  { id:'trust', number:11, icon:'✓', title:'Digital Trust', subtitle:'Signatures, certificates & TLS', skills:['signatures','pki','tls'], description:'Understand digital signatures, certificate chains, authenticated key exchange, and HTTPS trust.' },
  { id:'quantum', number:12, icon:'◇', title:'Quantum Frontier', subtitle:'Cryptography after large quantum computers', skills:['pqc','kem','migration'], description:'Learn why quantum algorithms change key-size assumptions and how post-quantum migration works.' }
];

const missionTemplate = [
  ['briefing','Recon','Learn the mechanism and identify the security goal.'],
  ['operation','Operation','Apply the mechanism under pressure.'],
  ['boss','Boss','Combine the ideas and defeat a realistic failure.']
];

const worldMissions = {
  origins:[
    ['Rotate the Signal','caesar','An intercepted field note uses a fixed alphabet rotation. Recover it before the sender changes channels.'],
    ['Many Alphabets','vigenere','A courier upgraded from one shift to a repeating keyword. Follow the changing alphabet.'],
    ['The Pattern Hunter','classical','A rival analyst claims classical ciphers are “secure because the text looks random.” Prove otherwise.']
  ],
  machines:[
    ['Bitwise Entry','xor','A hardware token exposes raw bit operations. Use XOR to reconstruct the intended message.'],
    ['Keystream Operator','stream','Operate a stream cipher and distinguish a secret key from a generated keystream.'],
    ['The Reused Pad','otp-reuse','Two transmissions reused the same keystream. Exploit the cancellation and explain the failure.']
  ],
  fortress:[
    ['Inside AES','aes','Walk a 128-bit AES state through the transformations that create confusion and diffusion.'],
    ['Mode Control','modes','Choose between ECB, CBC, CTR and authenticated encryption for different constraints.'],
    ['The Repeating Image','ecb','An encrypted image still reveals structure. Diagnose the mode and redesign the system.']
  ],
  numbers:[
    ['Clockwork Arithmetic','modular','Navigate a modular clock and translate ordinary arithmetic into congruences.'],
    ['Inverse Engine','inverse','Find values that undo multiplication—and identify when no inverse can exist.'],
    ['Exponent Reactor','modexp','Use square-and-multiply to handle exponents too large for naive arithmetic.']
  ],
  primes:[
    ['Totient Census','phi','Count residues that are coprime to a modulus and connect the result to Euler’s theorem.'],
    ['Generator Search','primitive','Test candidates that can generate every non-zero residue modulo a prime.'],
    ['Remainder Convergence','crt','Merge several compatible congruences into one solution with the CRT.']
  ],
  exchange:[
    ['Public Values','dh','Create public Diffie–Hellman values without exposing the private exponents.'],
    ['Shared Secret','dh-shared','Calculate the same shared secret independently from opposite public values.'],
    ['Mallory in the Middle','mitm','A key exchange is mathematically correct but unauthenticated. Find the protocol flaw.']
  ],
  publickey:[
    ['Asymmetric Roles','asymmetric','Separate what can be public from what must remain private, and match operations to goals.'],
    ['RSA Forge','rsa','Choose primes, build n and φ(n), select e, and derive the private exponent d.'],
    ['The RSA Vault','rsa-boss','Recover a small message by completing the entire RSA chain without skipped steps.']
  ],
  fingerprints:[
    ['Hash Properties','hash','Classify preimage, second-preimage and collision resistance.'],
    ['Avalanche Observatory','avalanche','Change one character and measure how widely the digest changes.'],
    ['Password Breach','passwords','A leaked database used a fast unsalted hash. Design a safer password-storage strategy.']
  ],
  identity:[
    ['Identity as a Key','ibe','Compare conventional PKI with identity-based encryption and the role of a trusted authority.'],
    ['Policy Encryption','abe','Decide when ciphertext-policy attributes can express access requirements more naturally.'],
    ['Access Architect','access','Choose an encryption model for a complex organization without confusing authentication and authorization.']
  ],
  battlefield:[
    ['Attack Taxonomy','attacks','Match brute force, replay, chosen-input, side-channel, downgrade and key-substitution attacks.'],
    ['Protocol Detective','protocols','Read evidence, locate the broken assumption, and recommend the smallest effective fix.'],
    ['Red Team Gauntlet','battle-boss','Combine multiple clues to defend a fictional service from cryptographic misuse.']
  ],
  trust:[
    ['Sign the Evidence','signatures','Use hash-then-sign reasoning to distinguish authenticity from confidentiality.'],
    ['Chain of Trust','pki','Trace a certificate from server leaf to trusted root and identify hostname or expiry failures.'],
    ['TLS Handshake','tls','Assemble the purpose of authenticated key exchange, symmetric session keys, and certificate validation.']
  ],
  quantum:[
    ['Quantum Threat Map','pqc','Separate what Shor’s and Grover’s algorithms threaten from what remains structurally sound.'],
    ['KEM Migration','kem','Understand the role of a post-quantum key encapsulation mechanism in hybrid key establishment.'],
    ['Harvest Now, Decrypt Later','migration','Prioritize migration based on data lifetime, algorithm exposure, and crypto-agility.']
  ]
};

export const missions = worlds.flatMap(world => worldMissions[world.id].map((item, i) => ({
  id:`${world.id}-${i+1}`,
  world:world.id,
  worldNumber:world.number,
  order:i+1,
  title:item[0],
  topic:item[1],
  story:item[2],
  kind:missionTemplate[i][0],
  label:missionTemplate[i][1],
  objective:missionTemplate[i][2],
  questions:i === 2 ? 6 : 5,
  baseXp:i === 2 ? 240 : i === 1 ? 180 : 140
})));

export const ranks = [
  {name:'Recruit',xp:0},{name:'Codebreaker',xp:500},{name:'Analyst',xp:1400},{name:'Cipher Specialist',xp:3000},
  {name:'Cryptographer',xp:5500},{name:'Senior Cryptanalyst',xp:9000},{name:'Master of Ciphers',xp:14000}
];

export const difficulties = {
  explorer:{name:'Explorer',icon:'🧭',description:'Guided steps, generous hints and smaller numbers.',multiplier:0.85},
  analyst:{name:'Analyst',icon:'🔎',description:'Balanced challenge with optional hints.',multiplier:1},
  cryptographer:{name:'Cryptographer',icon:'🧠',description:'Fewer clues, larger values and deeper reasoning.',multiplier:1.25},
  nightmare:{name:'Nightmare / CTF',icon:'☠',description:'Minimal guidance and multi-step challenges.',multiplier:1.6}
};

export const skills = [
  ['caesar','Caesar cipher'],['vigenere','Vigenère cipher'],['classical','Classical cryptanalysis'],['xor','XOR'],['stream','Stream ciphers'],
  ['aes','AES'],['modes','Block modes'],['modular','Modular arithmetic'],['gcd','GCD'],['inverse','Modular inverse'],['modexp','Modular exponentiation'],
  ['phi','Euler totient'],['primitive','Primitive roots'],['crt','Chinese Remainder Theorem'],['dh','Diffie–Hellman'],['mitm','MITM defense'],
  ['rsa','RSA'],['asymmetric','Asymmetric principles'],['hash','Hashing'],['integrity','Integrity'],['ibe','IBE'],['abe','ABE'],['access','Access models'],
  ['attacks','Cryptographic attacks'],['protocols','Protocol reasoning'],['signatures','Digital signatures'],['pki','PKI'],['tls','TLS'],['pqc','Post-quantum concepts'],['kem','KEMs'],['migration','Crypto-agility']
].map(([id,name])=>({id,name}));

export const achievements = [
  {id:'first-contact',icon:'✦',title:'First Contact',description:'Complete your first mission.',condition:s=>s.completed.length>=1},
  {id:'caesar-breaker',icon:'↻',title:'Caesar Breaker',description:'Answer 10 Caesar questions correctly.',condition:s=>(s.skills.caesar?.correct||0)>=10},
  {id:'key-master',icon:'⇄',title:'Key Master',description:'Reach 80% mastery in Diffie–Hellman.',condition:s=>skillRate(s,'dh')>=0.8 && (s.skills.dh?.attempts||0)>=5},
  {id:'modular-wizard',icon:'≡',title:'Modular Wizard',description:'Solve 20 modular-number questions correctly.',condition:s=>['modular','gcd','inverse','modexp','phi','primitive','crt'].reduce((n,k)=>n+(s.skills[k]?.correct||0),0)>=20},
  {id:'rsa-architect',icon:'φ',title:'RSA Architect',description:'Clear the RSA boss mission.',condition:s=>s.completed.includes('publickey-3')},
  {id:'cipher-breaker',icon:'⊕',title:'Keystream Breaker',description:'Defeat the reused-pad boss.',condition:s=>s.completed.includes('machines-3')},
  {id:'detective',icon:'🔎',title:'Crypto Detective',description:'Solve all detective cases.',condition:s=>(s.detectives||[]).length>=detectiveCases.length},
  {id:'historian',icon:'⌛',title:'Failure Historian',description:'Complete all Crypto Disaster cases.',condition:s=>(s.disasters||[]).length>=cryptoDisasters.length},
  {id:'ctf',icon:'⚑',title:'Flag Hunter',description:'Capture five CTF flags.',condition:s=>(s.ctfSolved||[]).length>=5},
  {id:'streak',icon:'🔥',title:'Seven-Day Signal',description:'Complete daily challenges on a 7-day streak.',condition:s=>(s.daily?.bestStreak||0)>=7},
  {id:'worlds',icon:'🌐',title:'World Traveller',description:'Clear one mission in every world.',condition:s=>worlds.every(w=>s.completed.some(id=>id.startsWith(`${w.id}-`)))},
  {id:'master',icon:'◇',title:'Cryptographer',description:'Reach at least 90% measured mastery across practiced skills.',condition:s=>overallMastery(s)>=0.9 && Object.values(s.skills||{}).filter(v=>v.attempts>=3).length>=10}
];

function skillRate(state, id){ const v=state.skills?.[id]; return v?.attempts ? v.correct/v.attempts : 0; }
function overallMastery(state){ const vals=Object.values(state.skills||{}).filter(v=>v.attempts>0); return vals.length?vals.reduce((a,v)=>a+v.correct/v.attempts,0)/vals.length:0; }

export const academyModules = [
  {id:'crypto-basics',icon:'🛡',title:'What cryptography actually protects',level:'Foundation',skills:['integrity','asymmetric'],summary:'Confidentiality, integrity, authenticity, availability and non-repudiation solve different problems.',newbie:'Think of cryptography as a toolbox. A lock hides a message, a tamper seal reveals changes, and a signature helps prove who approved something. One tool does not automatically provide every property.',deep:'Security goals must be bound to a threat model. Encryption can provide confidentiality while still allowing undetected modification unless an authenticated construction or separate integrity mechanism is used.'},
  {id:'caesar',icon:'↻',title:'Caesar & substitution ciphers',level:'Foundation',skills:['caesar','classical'],summary:'A fixed substitution can hide text from casual readers but preserves too much statistical structure.',newbie:'Give A the number 0, B the number 1, and so on. Add a small key and wrap around after Z—exactly like a 26-hour clock.',deep:'The keyspace is tiny and monoalphabetic substitution preserves frequency relationships, making brute force and frequency analysis practical.'},
  {id:'vigenere',icon:'▦',title:'Vigenère cipher',level:'Foundation',skills:['vigenere'],summary:'A repeating keyword changes the shift from character to character.',newbie:'Instead of one Caesar shift, each key letter supplies a different shift. Repeat the keyword until it is as long as the message.',deep:'Periodicity introduced by keyword reuse enables Kasiski-style and index-of-coincidence attacks; it is historically important, not modern security.'},
  {id:'xor-stream',icon:'⊕',title:'XOR & stream ciphers',level:'Core',skills:['xor','stream'],summary:'XOR is reversible: applying the same keystream twice restores the plaintext.',newbie:'XOR says “same bits become 0, different bits become 1.” Because K XOR K becomes all zeros, the same keystream can decrypt what it encrypted.',deep:'Secure stream constructions require unpredictable keystreams and unique nonce/key pairs. Reuse causes algebraic cancellation and leaks relationships between plaintexts.'},
  {id:'aes',icon:'▦',title:'AES from the inside',level:'Core',skills:['aes','modes'],summary:'AES repeatedly substitutes, permutes, mixes, and adds round-key material to a 4×4 byte state.',newbie:'AES does not “scramble once.” It transforms the data across rounds so that a small input or key change spreads across the block.',deep:'AES-128 uses 10 rounds. Standard rounds apply SubBytes, ShiftRows, MixColumns and AddRoundKey; the final round omits MixColumns.'},
  {id:'modular',icon:'≡',title:'Modular arithmetic',level:'Core',skills:['modular','gcd','inverse','modexp'],summary:'Cryptography frequently works with remainders rather than unrestricted integers.',newbie:'On a 12-hour clock, 10 + 5 lands on 3. Modular arithmetic does the same thing with any modulus.',deep:'Groups of invertible residues and efficient modular exponentiation underpin many public-key constructions.'},
  {id:'number-theory',icon:'φ',title:'Totients, roots & CRT',level:'Core',skills:['phi','primitive','crt'],summary:'Euler’s totient counts invertible residues; primitive roots generate cyclic groups; CRT recombines congruences.',newbie:'These ideas describe which numbers have multiplicative “undo buttons,” how powers move through a modular system, and how several remainder clues can point to one number.',deep:'Euler’s theorem, cyclic-group structure, and CRT are foundational tools for RSA reasoning and efficient arithmetic.'},
  {id:'dh',icon:'⇄',title:'Diffie–Hellman key exchange',level:'Core',skills:['dh','mitm'],summary:'Two parties publish exponentiations and independently derive the same secret.',newbie:'Alice and Bob mix private numbers with public parameters. They exchange only the mixed values and still end up with the same secret.',deep:'Classic DH provides key agreement but not peer authentication. Secure protocols bind ephemeral keys to authenticated identities or certificates.'},
  {id:'rsa',icon:'🔑',title:'RSA',level:'Core',skills:['rsa','asymmetric'],summary:'RSA builds a public/private exponent pair from arithmetic modulo a product of primes.',newbie:'Two primes create n. Euler’s totient helps choose two exponents, e and d, that undo each other in the right modular system.',deep:'Textbook RSA is deterministic and insecure in real systems. Production encryption uses standardized padding such as OAEP; signatures use schemes such as PSS.'},
  {id:'hash',icon:'#',title:'Cryptographic hash functions',level:'Core',skills:['hash','integrity'],summary:'A hash compresses arbitrary input to a fixed-size digest with strong one-way and collision properties.',newbie:'A hash is like a digital fingerprint. Tiny input changes should produce a completely different-looking digest.',deep:'Security is characterized by preimage, second-preimage and collision resistance. Password storage additionally requires salts and intentionally expensive password hashing.'},
  {id:'ibe-abe',icon:'◎',title:'IBE & ABE',level:'Advanced',skills:['ibe','abe','access'],summary:'IBE derives public identifiers from identity strings; ABE ties decryption to attribute policies.',newbie:'IBE can let an email address act like a public identifier. ABE can encrypt so that only users with the right set of attributes can open the data.',deep:'IBE introduces private-key generation authority trust and escrow concerns. ABE can express fine-grained cryptographic access policies but has more complex key lifecycle and revocation considerations.'},
  {id:'signatures-pki',icon:'✓',title:'Digital signatures & PKI',level:'Advanced',skills:['signatures','pki'],summary:'Signatures authenticate data; PKI binds public keys to names through certificate chains.',newbie:'A digital signature lets others verify that data came from the holder of a private signing key and was not changed afterward.',deep:'Certificate validation requires chain building, trust anchors, validity periods, hostname binding, key usage, revocation policy and algorithm constraints.'},
  {id:'tls',icon:'🌐',title:'TLS & hybrid cryptography',level:'Advanced',skills:['tls'],summary:'TLS combines authenticated key establishment with fast symmetric protection for application data.',newbie:'Public-key techniques help establish trust and session secrets. Symmetric encryption then protects the bulk traffic efficiently.',deep:'Modern TLS favors ephemeral authenticated key exchange and AEAD record protection, providing confidentiality and integrity with forward-secrecy properties when configured appropriately.'},
  {id:'pqc',icon:'◇',title:'Post-quantum cryptography',level:'Frontier',skills:['pqc','kem','migration'],summary:'Post-quantum algorithms are designed around problems not known to be efficiently solved by large quantum computers.',newbie:'A future large quantum computer would threaten some public-key mathematics. Post-quantum schemes replace those assumptions while still running on ordinary computers.',deep:'Migration requires cryptographic inventory, data-lifetime analysis, crypto-agility, interoperability testing and often staged hybrid deployment.'}
];

export const detectiveCases = [
  {id:'det-ecb',title:'The Visible Logo',difficulty:'Explorer',evidence:['Encrypted database thumbnails show repeated 16-byte ciphertext blocks.','Identical source tiles create identical encrypted tiles.','The key is long and random.'],question:'What is the most likely design error?',options:['AES key is too short','ECB mode leaks equality patterns','The hash function collided','RSA primes are too close'],answer:1,explanation:'The symptom is deterministic block-by-block encryption. ECB reveals equality patterns even when the underlying block cipher and key are strong.'},
  {id:'det-nonce',title:'Nonce Collision',difficulty:'Analyst',evidence:['A service uses a stream-like authenticated cipher.','Two records share the same key and nonce.','The ciphertexts differ, but analysts can derive relationships between plaintexts.'],question:'What should be fixed first?',options:['Increase plaintext length','Ensure nonce uniqueness for the key','Replace certificates hourly','Base64-encode the ciphertext'],answer:1,explanation:'Nonce/key reuse can catastrophically violate confidentiality and, for some AEAD constructions, integrity. The nonce lifecycle is the immediate failure.'},
  {id:'det-mitm',title:'Perfect Math, Wrong Peer',difficulty:'Analyst',evidence:['Alice and Bob calculate matching DH secrets during tests.','An attacker on the network can substitute exchanged public values.','No certificate, signature or pre-shared authentication is used.'],question:'What property is missing?',options:['Compression','Authentication of the key exchange','A larger hash output','Prime factorization'],answer:1,explanation:'The DH arithmetic can be correct while each victim actually shares a secret with the attacker. Authentication must bind the exchanged values to identities.'},
  {id:'det-password',title:'Instant Password Cracking',difficulty:'Cryptographer',evidence:['Passwords are stored as SHA-256(password).','Identical passwords have identical database values.','Attackers test billions of guesses rapidly.'],question:'What redesign is appropriate?',options:['Encrypt all passwords with one AES key','Use a salted, memory-hard password hashing function','Use a longer username','Apply SHA-256 twice'],answer:1,explanation:'Password storage needs unique salts and an intentionally expensive password hashing/KDF construction. Fast general-purpose hashes make offline guessing cheap.'},
  {id:'det-cert',title:'The Green Lock Impostor',difficulty:'Cryptographer',evidence:['TLS encryption is active.','The client accepts any certificate presented by the server.','A network attacker can proxy traffic.'],question:'Why is encryption insufficient?',options:['TLS cannot encrypt','The peer identity is not being validated','AES only works on files','Certificates are secret keys'],answer:1,explanation:'Confidential encryption to an unauthenticated endpoint can still protect traffic from everyone except the attacker you accidentally connected to.'}
];

export const cryptoDisasters = [
  {id:'wep',year:'1999–2004',title:'WEP and IV reuse',summary:'WEP combined RC4 with a small initialization vector space and problematic key construction, enabling practical statistical key-recovery attacks.',lesson:'Nonce/IV design and protocol composition matter as much as the primitive.'},
  {id:'debian-rng',year:'2006–2008',title:'Debian OpenSSL RNG bug',summary:'A code change drastically reduced entropy available to generated cryptographic keys, making many keys predictable.',lesson:'Randomness failures can collapse security even when the algorithm is mathematically sound.'},
  {id:'sha1',year:'2017',title:'Practical SHA-1 collision',summary:'Researchers demonstrated two different files with the same SHA-1 digest, confirming that SHA-1 collision resistance was no longer trustworthy.',lesson:'Algorithms age; migration must happen before attacks become routine.'},
  {id:'heartbleed',year:'2014',title:'Heartbleed key exposure',summary:'A memory-safety flaw in a TLS library could disclose process memory, potentially including secrets and private key material.',lesson:'Cryptographic security depends on implementation security and secret handling, not only algorithm selection.'},
  {id:'nonce-reuse',year:'Recurring',title:'Nonce reuse incidents',summary:'Across stream ciphers and AEAD systems, repeated nonce/key combinations have repeatedly leaked plaintext relationships or damaged authenticity.',lesson:'Treat nonce generation and uniqueness as a first-class security requirement.'}
];

export const ctfChallenges = [
  {id:'ctf1',title:'Shift Happens',level:1,hint:'Try a Caesar shift backward by 1.',prompt:'Decrypt DSZQUP{DBFTBS}',answer:'CRYPTO{CAESAR}',explanation:'Each letter was shifted forward by one.'},
  {id:'ctf2',title:'Hex Whisper',level:2,hint:'Convert hexadecimal bytes to text.',prompt:'Decode 43525950544F7B4845587D',answer:'CRYPTO{HEX}',explanation:'Each pair of hex digits is one ASCII/UTF-8 byte.'},
  {id:'ctf3',title:'Base Station',level:3,hint:'This is Base64 encoding, not encryption.',prompt:'Decode Q1JZUFRPe0JBU0U2NH0=',answer:'CRYPTO{BASE64}',explanation:'Base64 is a reversible representation and provides no confidentiality.'},
  {id:'ctf4',title:'XOR Gate',level:4,hint:'XOR the ciphertext with key 2A repeated.',prompt:'Cipher hex: 6978737A7E655172657857 · key: 2A',answer:'CRYPTO{XOR}',explanation:'Repeated single-byte XOR recovers the flag. Repeating-key XOR is not secure against modern analysis.'},
  {id:'ctf5',title:'Rail Runner',level:5,hint:'Use a 3-rail Rail Fence decryption.',prompt:'Decrypt CTAE}RPORIFNEY{LC',answer:'CRYPTO{RAILFENCE}',explanation:'Transposition changes positions rather than character identities.'},
  {id:'ctf6',title:'Inverse Door',level:6,hint:'Find x such that 7x ≡ 1 (mod 26). The numeric answer completes CRYPTO{INV_x}.',prompt:'What is 7⁻¹ mod 26?',answer:'CRYPTO{INV_15}',explanation:'7×15=105=4×26+1, so the inverse is 15.'},
  {id:'ctf7',title:'Shared Secret',level:7,hint:'Compute B^a mod p.',prompt:'DH: p=23, g=5, Alice a=6, Bob public B=19. Flag CRYPTO{DH_secret}.',answer:'CRYPTO{DH_2}',explanation:'19^6 mod 23 = 2.'},
  {id:'ctf8',title:'RSA Mini Vault',level:8,hint:'Derive d from e=7 and φ(33)=20, then decrypt 17.',prompt:'RSA: p=3, q=11, e=7, ciphertext C=2. Flag CRYPTO{RSA_plaintext}.',answer:'CRYPTO{RSA_8}',explanation:'n=33, φ=20, d=3, and 2^3 mod 33=8.'}
];

export const fieldGuide = [
  ['Security goals','Confidentiality hides data; integrity detects unauthorized change; authenticity establishes source or peer; availability concerns access; non-repudiation concerns evidence of origin or action.','A secure design starts by naming the property and adversary.'],
  ['Caesar cipher','c=(p+k) mod 26; p=(c−k) mod 26.','Only 26 shifts exist; it is educational, not secure.'],
  ['Vigenère','cᵢ=(pᵢ+kᵢ) mod 26 using a repeated keyword.','Keyword repetition creates exploitable periodicity.'],
  ['XOR','C=P⊕K and P=C⊕K because K⊕K=0.','Never infer that XOR alone creates security; the keystream quality and reuse rules are decisive.'],
  ['One-time pad','A truly random key as long as the message, used exactly once, gives information-theoretic secrecy.','Reusing a pad gives C₁⊕C₂=P₁⊕P₂.'],
  ['AES','AES operates on a 4×4 byte state with SubBytes, ShiftRows, MixColumns and AddRoundKey.','Use standard authenticated modes rather than inventing a composition.'],
  ['ECB','Each block encrypts independently under the same key.','Equal plaintext blocks produce equal ciphertext blocks, leaking patterns.'],
  ['CBC','Each plaintext block is XORed with the previous ciphertext block before block-cipher encryption.','Requires unpredictable/appropriate IV handling and separate authenticity unless used inside a standardized authenticated construction.'],
  ['CTR','Encrypts counter blocks to form a keystream, then XORs with plaintext.','Counter/nonce reuse under a key repeats the keystream.'],
  ['AEAD','Authenticated Encryption with Associated Data protects confidentiality and integrity while authenticating optional unencrypted metadata.','Nonce requirements remain construction-specific and important.'],
  ['Congruence','a≡b (mod n) means n divides a−b; equivalently a and b have the same remainder modulo n.','Reduce values modulo n to keep arithmetic manageable.'],
  ['GCD','gcd(a,b) is the largest positive integer dividing both.','a has a multiplicative inverse modulo n exactly when gcd(a,n)=1.'],
  ['Modular inverse','a⁻¹ is x such that ax≡1 (mod n).','Use the extended Euclidean algorithm for efficient calculation.'],
  ['Euler totient','φ(n) counts integers 1..n that are coprime to n. For distinct primes p,q: φ(pq)=(p−1)(q−1).','The simple product formula depends on knowing the prime factorization.'],
  ['Modular exponentiation','Square-and-multiply computes a^e mod n efficiently from the binary representation of e.','Never calculate the full huge power first.'],
  ['Primitive root','A generator g modulo prime p produces every non-zero residue through g^1…g^(p−1).','Generator requirements depend on the group being used.'],
  ['CRT','For pairwise-coprime moduli, compatible congruences have one solution modulo the product.','CRT can accelerate RSA private operations but implementations must resist fault attacks.'],
  ['Diffie–Hellman','A=g^a mod p, B=g^b mod p, shared=B^a=A^b mod p.','Plain DH does not authenticate the peer.'],
  ['RSA','n=pq; φ=(p−1)(q−1); choose gcd(e,φ)=1; find ed≡1 mod φ.','Real RSA needs standardized padding and adequate key sizes; textbook examples are only for learning.'],
  ['Hash properties','Preimage: given h find x. Second preimage: given x find y≠x with same hash. Collision: find any distinct x,y with same hash.','Collision security is roughly half the digest-bit strength for ideal hashes.'],
  ['Password hashing','Use a unique salt and a purpose-built expensive password hashing/KDF function.','Fast hashes alone are inappropriate for password databases.'],
  ['IBE','An identity string can serve as a public identifier; a trusted private-key generator issues corresponding private keys.','Key escrow and authority compromise are major trust considerations.'],
  ['ABE','Encryption/decryption policies are expressed over attributes.','Revocation, attribute lifecycle and policy complexity require careful system design.'],
  ['Digital signatures','A signer uses a private key; verifiers use the public key to verify authenticity/integrity.','A signature does not hide the message.'],
  ['Certificates','A certificate binds an identity/name to a public key and is signed within a trust hierarchy.','Clients must validate name, chain, time, usage and policy constraints.'],
  ['TLS','TLS authenticates endpoints (typically the server), establishes shared secrets, and protects records with symmetric authenticated encryption.','Do not disable certificate verification to “fix” connectivity.'],
  ['MITM','An attacker relays and substitutes data between endpoints that fail to authenticate each other.','Bind key exchange to authenticated identities.'],
  ['Replay','A valid old message is resent to trigger an action again.','Use freshness mechanisms such as nonces, sequence numbers, timestamps or protocol state.'],
  ['Side channel','Secrets leak through timing, power, cache behavior, faults or other implementation effects.','Constant-time code and hardened implementations matter even when algorithms are strong.'],
  ['Post-quantum migration','Inventory cryptographic dependencies, assess data lifetime, introduce crypto-agility, test PQC/hybrid paths, and phase migration.','Harvest-now-decrypt-later risk makes long-lived confidentiality an early priority.']
].map(([title,body,note],i)=>({id:`guide-${i+1}`,title,body,note}));

export const onboardingProfiles = [
  {id:'new',title:'Completely new',description:'Start with visual explanations and guided steps.',difficulty:'explorer'},
  {id:'basics',title:'Know the basics',description:'Use balanced explanations and practice.',difficulty:'analyst'},
  {id:'student',title:'Cybersecurity student',description:'Move faster and emphasize calculations and attacks.',difficulty:'cryptographer'},
  {id:'experienced',title:'Experienced',description:'Jump directly into deeper reasoning and CTF-style tasks.',difficulty:'nightmare'}
];
