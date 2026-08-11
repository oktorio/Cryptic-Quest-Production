export function mod(n, m) {
  const result = Number(n) % Number(m);
  return result >= 0 ? result : result + Number(m);
}

export function gcd(a, b) {
  a = Math.abs(Number(a));
  b = Math.abs(Number(b));
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

export function extendedGcd(a, b) {
  let oldR = BigInt(a), r = BigInt(b);
  let oldS = 1n, s = 0n;
  let oldT = 0n, t = 1n;
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { gcd: oldR, x: oldS, y: oldT };
}

export function modInverse(a, n) {
  const A = BigInt(a), N = BigInt(n);
  if (N <= 1n) return null;
  const { gcd: d, x } = extendedGcd(A, N);
  if (d !== 1n && d !== -1n) return null;
  return ((x % N) + N) % N;
}

export function modPow(base, exponent, modulus) {
  let b = ((BigInt(base) % BigInt(modulus)) + BigInt(modulus)) % BigInt(modulus);
  let e = BigInt(exponent);
  const m = BigInt(modulus);
  if (m <= 0n) throw new Error('Modulus must be positive');
  if (e < 0n) throw new Error('Exponent must be non-negative');
  if (m === 1n) return 0n;
  let result = 1n;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    e >>= 1n;
    b = (b * b) % m;
  }
  return result;
}

export function squareMultiplySteps(base, exponent, modulus) {
  const bits = BigInt(exponent).toString(2);
  let result = 1n;
  const b = BigInt(base);
  const m = BigInt(modulus);
  const steps = [];
  for (const bit of bits) {
    const before = result;
    result = (result * result) % m;
    const squareResult = result;
    let multiplyResult = null;
    if (bit === '1') {
      result = (result * b) % m;
      multiplyResult = result;
    }
    steps.push({ bit, before, squareResult, multiplyResult, result });
  }
  return { bits, result, steps };
}

export function isPrime(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

export function primeFactors(n) {
  n = Math.abs(Number(n));
  const factors = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    while (n % p === 0) {
      factors.push(p);
      n /= p;
    }
  }
  if (n > 1) factors.push(n);
  return factors;
}

export function phi(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 1) return 0;
  let result = n;
  const unique = [...new Set(primeFactors(n))];
  for (const p of unique) result -= result / p;
  return Math.round(result);
}

export function isPrimitiveRoot(g, p) {
  if (!isPrime(p) || gcd(g, p) !== 1) return false;
  const values = new Set();
  for (let k = 1; k < p; k++) values.add(Number(modPow(g, k, p)));
  return values.size === p - 1;
}

export function crt(remainders, moduli) {
  if (remainders.length !== moduli.length || !remainders.length) return null;
  for (let i = 0; i < moduli.length; i++) {
    for (let j = i + 1; j < moduli.length; j++) {
      if (gcd(moduli[i], moduli[j]) !== 1) return null;
    }
  }
  const M = moduli.reduce((acc, n) => acc * BigInt(n), 1n);
  let x = 0n;
  const terms = [];
  for (let i = 0; i < moduli.length; i++) {
    const ni = BigInt(moduli[i]);
    const ai = BigInt(remainders[i]);
    const Mi = M / ni;
    const yi = modInverse(Mi, ni);
    if (yi === null) return null;
    const term = ai * Mi * yi;
    terms.push({ ai, ni, Mi, yi, term });
    x += term;
  }
  return { result: ((x % M) + M) % M, modulus: M, terms };
}

export function caesar(text, shift, decrypt = false) {
  const s = decrypt ? -Number(shift) : Number(shift);
  return [...String(text)].map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCharCode(65 + mod(code - 65 + s, 26));
    if (code >= 97 && code <= 122) return String.fromCharCode(97 + mod(code - 97 + s, 26));
    return ch;
  }).join('');
}

export function vigenere(text, key, decrypt = false) {
  const cleanKey = String(key).toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return String(text);
  let index = 0;
  return [...String(text)].map(ch => {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isUpper && !isLower) return ch;
    const base = isUpper ? 65 : 97;
    const k = cleanKey.charCodeAt(index++ % cleanKey.length) - 65;
    return String.fromCharCode(base + mod(code - base + (decrypt ? -k : k), 26));
  }).join('');
}

export function vigenereSteps(text, key, decrypt = false) {
  const cleanText = String(text).toUpperCase().replace(/[^A-Z]/g, '');
  const cleanKey = String(key).toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return [];
  return [...cleanText].map((letter, i) => {
    const p = letter.charCodeAt(0) - 65;
    const keyLetter = cleanKey[i % cleanKey.length];
    const k = keyLetter.charCodeAt(0) - 65;
    const value = mod(p + (decrypt ? -k : k), 26);
    return { letter, p, keyLetter, k, value, output: String.fromCharCode(65 + value) };
  });
}

export function affine(text, a, b, decrypt = false) {
  a = Number(a); b = Number(b);
  const inv = modInverse(a, 26);
  if (gcd(a, 26) !== 1 || inv === null) return null;
  return [...String(text)].map(ch => {
    const code = ch.charCodeAt(0);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isUpper && !isLower) return ch;
    const base = isUpper ? 65 : 97;
    const x = code - base;
    const y = decrypt ? mod(Number(inv) * (x - b), 26) : mod(a * x + b, 26);
    return String.fromCharCode(base + y);
  }).join('');
}

export function railFence(text, rails = 3, decrypt = false) {
  const input = String(text);
  rails = Math.max(2, Math.floor(Number(rails)));
  if (rails >= input.length || input.length < 3) return input;
  const pattern = [];
  let rail = 0, direction = 1;
  for (let i = 0; i < input.length; i++) {
    pattern.push(rail);
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }
  if (!decrypt) {
    return Array.from({ length: rails }, (_, r) => [...input].filter((_, i) => pattern[i] === r).join('')).join('');
  }
  const counts = Array(rails).fill(0);
  pattern.forEach(r => counts[r]++);
  const railChars = [];
  let offset = 0;
  for (const count of counts) {
    railChars.push(input.slice(offset, offset + count).split(''));
    offset += count;
  }
  return pattern.map(r => railChars[r].shift()).join('');
}


export function playfairSquare(key) {
  const cleaned = (String(key).toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '') + 'ABCDEFGHIKLMNOPQRSTUVWXYZ');
  const seen = new Set();
  return [...cleaned].filter(ch => { if (seen.has(ch)) return false; seen.add(ch); return true; }).slice(0, 25);
}

export function playfairPrepare(text) {
  const clean = String(text).toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  const out = [];
  for (let i = 0; i < clean.length;) {
    const a = clean[i];
    let b = clean[i + 1];
    if (!b) { out.push(a, 'X'); i += 1; }
    else if (a === b) { out.push(a, a === 'X' ? 'Q' : 'X'); i += 1; }
    else { out.push(a, b); i += 2; }
  }
  return out.join('');
}

export function playfair(text, key, decrypt = false) {
  const square = playfairSquare(key);
  const input = decrypt ? String(text).toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '') : playfairPrepare(text);
  if (input.length % 2) return null;
  const locate = ch => { const idx = square.indexOf(ch); return [Math.floor(idx / 5), idx % 5]; };
  const output = [];
  const shift = decrypt ? -1 : 1;
  for (let i = 0; i < input.length; i += 2) {
    const a = input[i], b = input[i + 1];
    const [ra, ca] = locate(a), [rb, cb] = locate(b);
    if (ra === rb) {
      output.push(square[ra * 5 + mod(ca + shift, 5)], square[rb * 5 + mod(cb + shift, 5)]);
    } else if (ca === cb) {
      output.push(square[mod(ra + shift, 5) * 5 + ca], square[mod(rb + shift, 5) * 5 + cb]);
    } else {
      output.push(square[ra * 5 + cb], square[rb * 5 + ca]);
    }
  }
  return output.join('');
}

export function xorBits(a, b) {
  if (!/^[01]+$/.test(a) || !/^[01]+$/.test(b) || a.length !== b.length) return null;
  return [...a].map((bit, i) => bit === b[i] ? '0' : '1').join('');
}

export function xorHex(a, b) {
  const aa = String(a).replace(/\s+/g, '');
  const bb = String(b).replace(/\s+/g, '');
  if (!/^[0-9a-f]+$/i.test(aa) || !/^[0-9a-f]+$/i.test(bb) || aa.length !== bb.length) return null;
  let out = '';
  for (let i = 0; i < aa.length; i++) out += (parseInt(aa[i], 16) ^ parseInt(bb[i], 16)).toString(16).toUpperCase();
  return out;
}

export function textToHex(text) {
  return Array.from(new TextEncoder().encode(String(text)), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexToText(hex) {
  const clean = String(hex).replace(/\s+/g, '');
  if (!/^(?:[0-9a-f]{2})+$/i.test(clean)) return null;
  return new TextDecoder().decode(Uint8Array.from(clean.match(/../g).map(x => parseInt(x, 16))));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeAnswer(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function bitDifference(hexA, hexB) {
  if (!hexA || !hexB || hexA.length !== hexB.length) return 0;
  let count = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (x) { count += x & 1; x >>= 1; }
  }
  return count;
}

export function seededRandom(seed) {
  let x = Math.abs(Number(seed)) || 1;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

// --- AES teaching primitives (real AES byte transformations) ---
export const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

function xtime(x) { return ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff; }
function mul2(x) { return xtime(x); }
function mul3(x) { return xtime(x) ^ x; }

export function aesSubBytes(state) {
  return state.map(v => AES_SBOX[v & 0xff]);
}

export function aesShiftRows(state) {
  if (state.length !== 16) throw new Error('AES state requires 16 bytes');
  // State uses AES column-major indexing: index = row + 4*column.
  const out = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[row + 4 * col] = state[row + 4 * ((col + row) % 4)];
    }
  }
  return out;
}

export function aesMixColumns(state) {
  if (state.length !== 16) throw new Error('AES state requires 16 bytes');
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const a = state.slice(i, i + 4);
    out[i]   = mul2(a[0]) ^ mul3(a[1]) ^ a[2] ^ a[3];
    out[i+1] = a[0] ^ mul2(a[1]) ^ mul3(a[2]) ^ a[3];
    out[i+2] = a[0] ^ a[1] ^ mul2(a[2]) ^ mul3(a[3]);
    out[i+3] = mul3(a[0]) ^ a[1] ^ a[2] ^ mul2(a[3]);
  }
  return out.map(v => v & 0xff);
}

export function aesAddRoundKey(state, roundKey) {
  if (state.length !== 16 || roundKey.length !== 16) throw new Error('AES state and round key require 16 bytes');
  return state.map((v, i) => (v ^ roundKey[i]) & 0xff);
}

export function hexToBytes16(hex) {
  const clean = String(hex).replace(/[^0-9a-f]/gi, '');
  if (clean.length !== 32) return null;
  return clean.match(/../g).map(x => parseInt(x, 16));
}

export function bytesToHex(bytes) {
  return bytes.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
