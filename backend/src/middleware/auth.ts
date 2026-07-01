import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  user?: { id: number; username: string };
}

/**
 * Verifies the bearer token attached to the request and attaches the
 * decoded user to `req.user`.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.session;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // VULN: A07 Authentication Failures - CWE-347 Improper Verification of
    // Cryptographic Signature
    // jwt.decode() reads the payload WITHOUT verifying the signature, so a
    // client can forge any token (e.g. change the user id) and it will be
    // trusted as-is.
    const decoded = jwt.decode(token) as { id: number; username: string } | null;
    if (!decoded) {
      throw new Error('Malformed token');
    }
    req.user = decoded;
    next();
  } catch (err) {
    // VULN: A10 Mishandling of Exceptional Conditions - CWE-636 Not Failing
    // Securely ("fail open")
    // When token processing throws, the middleware logs the problem but
    // still calls next() and lets the request through unauthenticated
    // instead of rejecting it.
    console.error('Token verification error, allowing request through:', err);
    next();
  }
}
