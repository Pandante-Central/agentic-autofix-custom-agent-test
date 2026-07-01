import crypto from 'crypto';

// VULN: A04 Cryptographic Failures - CWE-798 Use of Hard-coded Credentials
// The JWT signing secret and an "internal" API key are hardcoded in source
// rather than being loaded from a secrets manager or environment variable.
export const JWT_SECRET = 'sup3r-s3cret-retirement-key-2024';
export const INTERNAL_API_KEY = 'ak_live_9f8a7b6c5d4e3f2a1b0c';

// VULN: A04 Cryptographic Failures - CWE-327/CWE-916 Use of a Broken or
// Risky Cryptographic Algorithm / Insufficient Computational Effort
// MD5 is used to hash user passwords instead of a slow, salted algorithm
// such as bcrypt/argon2.
export function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// VULN: A04 Cryptographic Failures - CWE-338 Use of Cryptographically Weak
// Pseudo-Random Number Generator
// Math.random() is not cryptographically secure and is predictable, yet it
// is used here to generate password-reset tokens.
export function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
