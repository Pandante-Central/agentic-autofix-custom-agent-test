import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

export const calculatorRouter = Router();

calculatorRouter.use(requireAuth);

// VULN: A05 Injection - CWE-95 Improper Neutralization of Directives in
// Dynamically Evaluated Code ("Code Injection")
// The "advanced" custom formula feature lets users supply a JS expression
// (e.g. `balance * 1.07 + contribution`) that is compiled and executed
// server-side via the `Function` constructor, so any JavaScript payload
// the client sends runs with the privileges of the Node.js process.
calculatorRouter.post('/custom', (req, res, next) => {
  try {
    const { formula, variables } = req.body ?? {};
    if (typeof formula !== 'string') {
      return res.status(400).json({ error: 'formula (string) is required' });
    }

    const vars = variables && typeof variables === 'object' ? variables : {};
    const argNames = Object.keys(vars);
    const argValues = Object.values(vars);

    // eslint-disable-next-line no-new-func
    const evaluate = new Function(...argNames, `return (${formula});`);
    const result = evaluate(...argValues);

    res.json({ result });
  } catch (err) {
    next(err);
  }
});
