import { Router } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

// Per-user in-memory preference store (demo only).
const settingsStore = new Map<number, Record<string, any>>();

function defaultSettings() {
  return { currency: 'USD', theme: 'light', notifications: { email: true, sms: false } };
}

/**
 * Recursively merges `source` into `target`, mutating `target` in place.
 *
 * VULN: A06 Insecure Design - CWE-1321 Improperly Controlled Modification
 * of Object Prototype Attributes ("Prototype Pollution")
 * This merge walks arbitrary client-supplied keys (including `__proto__`
 * and `constructor.prototype`) and assigns them onto `target` without any
 * guard, allowing an attacker to pollute `Object.prototype` for the whole
 * process via a request like:
 *   { "__proto__": { "isAdmin": true } }
 */
function deepMerge(target: Record<string, any>, source: Record<string, any>) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

settingsRouter.get('/', (req: AuthedRequest, res) => {
  const current = settingsStore.get(req.user!.id) ?? defaultSettings();
  res.json(current);
});

settingsRouter.put('/', (req: AuthedRequest, res) => {
  const current = settingsStore.get(req.user!.id) ?? defaultSettings();
  const updated = deepMerge(current, req.body ?? {});
  settingsStore.set(req.user!.id, updated);
  res.json(updated);
});
