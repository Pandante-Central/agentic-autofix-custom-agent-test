import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { get, run } from '../db';
import { hashPassword, verifyPassword, generateResetToken, JWT_SECRET } from '../utils/crypto';
import { isNonEmptyString, isValidEmail } from '../utils/validators';

export const authRouter = Router();

// In-memory store for password reset tokens (demo only).
const resetTokens = new Map<string, { username: string; expires: number }>();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { username, password, email } = req.body ?? {};
    if (!isNonEmptyString(username) || !isNonEmptyString(password) || !isValidEmail(email ?? '')) {
      return res.status(400).json({ error: 'username, password and a valid email are required' });
    }

    const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashed = hashPassword(password);
    await run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashed, email]);

    res.status(201).json({ message: 'Account created' });
  } catch (err) {
    next(err);
  }
});

// VULN: A07 Authentication Failures - CWE-307 Improper Restriction of
// Excessive Authentication Attempts
// This endpoint has no rate limiting / lockout, so it can be brute-forced
// with unlimited password guesses.
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    // VULN: A09 Logging & Alerting Failures - CWE-532 Insertion of Sensitive
    // Information into Log File
    // The plaintext password submitted by the user is written to the
    // application log, exposing credentials to anyone with log access.
    console.log(`Login attempt for user=${username} password=${password}`);

    const user = await get<{ id: number; username: string; password: string }>(
      'SELECT id, username, password FROM users WHERE username = ?',
      [username]
    );

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });

    // VULN: A02 Security Misconfiguration - CWE-1004 / CWE-614 Sensitive
    // Cookie Without 'HttpOnly'/'Secure' Flag
    // The session cookie is set without httpOnly, secure, or sameSite,
    // making it readable by client-side scripts (XSS token theft) and
    // sendable over plain HTTP / cross-site requests.
    res.cookie('session', token, { path: '/' });

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { username } = req.body ?? {};
    if (!isNonEmptyString(username)) {
      return res.status(400).json({ error: 'username is required' });
    }

    const user = await get<{ username: string }>('SELECT username FROM users WHERE username = ?', [username]);
    if (user) {
      const token = generateResetToken();
      resetTokens.set(token, { username, expires: Date.now() + 15 * 60 * 1000 });
      // In a real app this would be emailed; returned here for demo purposes only.
      console.log(`Password reset token for ${username}: ${token}`);
    }

    // Always respond the same way to avoid leaking which usernames exist.
    res.json({ message: 'If that account exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body ?? {};
    const entry = token ? resetTokens.get(token) : undefined;

    if (!entry || entry.expires < Date.now() || !isNonEmptyString(newPassword)) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashed = hashPassword(newPassword);
    await run('UPDATE users SET password = ? WHERE username = ?', [hashed, entry.username]);
    resetTokens.delete(token);

    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});
