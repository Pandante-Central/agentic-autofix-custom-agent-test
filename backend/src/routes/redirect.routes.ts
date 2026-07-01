import { Router } from 'express';

export const redirectRouter = Router();

// VULN: A06 Insecure Design - CWE-601 URL Redirection to Untrusted Site
// ("Open Redirect")
// The destination is taken directly from the `next` query parameter with
// no validation that it points to this application, so it can be used in
// phishing links like `/api/redirect?next=https://evil.example.com`.
redirectRouter.get('/', (req, res) => {
  const next = String(req.query.next ?? '/');
  res.redirect(next);
});
