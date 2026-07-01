# Retirement Planner (Vulnerable Demo App)

> ⚠️ **INTENTIONALLY VULNERABLE APPLICATION — DEMO USE ONLY**
>
> This application was built specifically to demonstrate GitHub Advanced
> Security tooling (CodeQL code scanning + Copilot Autofix) and GitHub Code
> Quality / coverage reporting. It contains **deliberately introduced
> security vulnerabilities**, marked inline with `// VULN: <OWASP category> -
> CWE-xxx <name>` comments, mapped to the **OWASP Top 10:2026** categories.
>
> **Do not deploy this application, reuse its code in production, or treat
> it as an example of secure coding practice.**

## What it is

A minimal retirement-planning web app, API-first:

- **`backend/`** — Node.js + TypeScript + Express REST API backed by SQLite.
  Handles auth, retirement plan CRUD, projection calculations, report
  export, avatar proxying, and user settings.
- **`frontend/`** — Vue 3 + TypeScript + Vite single-page app styled with
  Bootstrap 5, consuming the backend API exclusively over HTTP.

## Running locally

### Backend

```bash
cd backend
npm install
npm run dev      # starts the API on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # starts the SPA on http://localhost:5173
```

The frontend expects the API at `http://localhost:4000` (see
`frontend/src/api/client.ts`).

## Tests & coverage

```bash
cd backend && npm test      # Jest + Supertest
cd frontend && npm test     # Vitest + Vue Test Utils
```

Coverage reports (Cobertura XML) are generated automatically in CI —
see `.github/workflows/code-coverage.yml` — and uploaded so results show
on pull requests via GitHub Code Quality.

## Security scanning

This repo is intended to be scanned with **CodeQL default setup**
(Settings → Code security → Code scanning → enable "Default" setup for
the `javascript-typescript` language) so that Copilot Autofix can be
demonstrated against the vulnerabilities listed below.

## Known vulnerabilities (by OWASP Top 10:2026 category)

| Category | Vulnerability | Location |
|---|---|---|
| A01 Broken Access Control | IDOR on plan read/update | `backend/src/routes/plans.routes.ts` |
| A02 Security Misconfiguration | Wildcard CORS + reflected origin w/ credentials | `backend/src/app.ts` |
| A02 Security Misconfiguration | Missing security headers | `backend/src/app.ts` |
| A02 Security Misconfiguration | Insecure auth cookie (no httpOnly/secure/sameSite) | `backend/src/routes/auth.routes.ts` |
| A03 Software Supply Chain Failures | Pinned outdated/vulnerable dependency (`lodash@4.17.11`) | `backend/package.json` |
| A04 Cryptographic Failures | MD5 password hashing | `backend/src/utils/crypto.ts` |
| A04 Cryptographic Failures | Hardcoded JWT secret & API key | `backend/src/utils/crypto.ts`, `frontend/src/api/client.ts` |
| A04 Cryptographic Failures | Insecure randomness for reset tokens | `backend/src/utils/crypto.ts` |
| A05 Injection | SQL injection in plan search | `backend/src/routes/plans.routes.ts` |
| A05 Injection | Command injection in report export | `backend/src/routes/export.routes.ts` |
| A05 Injection | Path traversal in report export | `backend/src/routes/export.routes.ts` |
| A05 Injection | Code injection (`Function` constructor) in projection calculator | `backend/src/routes/calculator.routes.ts` |
| A05 Injection | Server-side request forgery in avatar proxy | `backend/src/routes/avatar.routes.ts` |
| A05 Injection | DOM-based XSS via `v-html` | `frontend/src/views/PlanDetail.vue` |
| A06 Insecure Design | Prototype pollution via unguarded merge | `backend/src/routes/settings.routes.ts` |
| A06 Insecure Design | Open redirect | `backend/src/routes/redirect.routes.ts` |
| A06 Insecure Design | ReDoS-vulnerable email regex | `backend/src/utils/validators.ts` |
| A07 Authentication Failures | JWT decoded without signature verification | `backend/src/middleware/auth.ts` |
| A07 Authentication Failures | No rate limiting on login | `backend/src/routes/auth.routes.ts` |
| A08 Software or Data Integrity Failures | Third-party script loaded without Subresource Integrity | `frontend/index.html` |
| A09 Logging & Alerting Failures | Clear-text logging of credentials/tokens | `backend/src/routes/auth.routes.ts` |
| A10 Mishandling of Exceptional Conditions | Fail-open auth middleware on error | `backend/src/middleware/auth.ts` |
| A10 Mishandling of Exceptional Conditions | Stack traces leaked to API clients | `backend/src/middleware/errorHandler.ts` |
