import { Router } from 'express';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth';

export const avatarRouter = Router();

avatarRouter.use(requireAuth);

// VULN: A05 Injection - CWE-918 Server-Side Request Forgery (SSRF)
// The server fetches whatever URL the client supplies and proxies back the
// response, with no validation against an allow-list or block-list of
// internal/private addresses. An attacker can use this to reach internal
// services (e.g. `?url=http://169.254.169.254/latest/meta-data/`).
avatarRouter.get('/proxy', async (req, res, next) => {
  try {
    const url = String(req.query.url ?? '');
    if (!url) {
      return res.status(400).json({ error: 'url query parameter is required' });
    }

    const upstream = await fetch(url);
    const buffer = await upstream.buffer();

    res.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
