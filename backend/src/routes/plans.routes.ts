import { Router } from 'express';
import { all, allRaw, get, run } from '../db';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { isNonEmptyString } from '../utils/validators';

export const plansRouter = Router();

plansRouter.use(requireAuth);

function projectSavings(plan: {
  current_age: number;
  retirement_age: number;
  current_savings: number;
  monthly_contribution: number;
  annual_return: number;
}) {
  const years = Math.max(plan.retirement_age - plan.current_age, 0);
  const monthlyRate = plan.annual_return / 100 / 12;
  const months = years * 12;

  let balance = plan.current_savings;
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + plan.monthly_contribution;
  }

  return Math.round(balance * 100) / 100;
}

plansRouter.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const plans = await all('SELECT * FROM plans WHERE user_id = ?', [req.user?.id]);
    res.json(plans.map((p) => ({ ...p, projectedBalance: projectSavings(p) })));
  } catch (err) {
    next(err);
  }
});

// VULN: A05 Injection - CWE-89 SQL Injection
// The search term is concatenated directly into the SQL string instead of
// using a parameterized query, allowing an attacker to inject arbitrary SQL
// (e.g. `?q=' OR '1'='1`).
plansRouter.get('/search', async (req: AuthedRequest, res, next) => {
  try {
    const q = String(req.query.q ?? '');
    const sql = `SELECT * FROM plans WHERE user_id = ${req.user?.id} AND name LIKE '%${q}%'`;
    const plans = await allRaw(sql);
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

plansRouter.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const { name, currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, notes } =
      req.body ?? {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await run(
      `INSERT INTO plans
        (user_id, name, current_age, retirement_age, current_savings, monthly_contribution, annual_return, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user?.id,
        name,
        Number(currentAge) || 0,
        Number(retirementAge) || 0,
        Number(currentSavings) || 0,
        Number(monthlyContribution) || 0,
        Number(annualReturn) || 0,
        notes ?? '',
      ]
    );

    res.status(201).json({ id: result.lastID });
  } catch (err) {
    next(err);
  }
});

// VULN: A01 Broken Access Control - CWE-639 Authorization Bypass Through
// User-Controlled Key (IDOR)
// This lookup fetches a plan purely by its id, without checking that
// `req.user.id` matches the plan's `user_id`, so any authenticated user can
// read another user's retirement plan just by guessing/incrementing the id.
plansRouter.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const plan = await get('SELECT * FROM plans WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ ...plan, projectedBalance: projectSavings(plan as any) });
  } catch (err) {
    next(err);
  }
});

// VULN: A01 Broken Access Control - CWE-639 Authorization Bypass Through
// User-Controlled Key (IDOR)
// Same issue as above: any authenticated user can update any other user's
// plan by id, with no ownership check.
plansRouter.put('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const { name, currentAge, retirementAge, currentSavings, monthlyContribution, annualReturn, notes } =
      req.body ?? {};

    await run(
      `UPDATE plans SET name = ?, current_age = ?, retirement_age = ?, current_savings = ?,
        monthly_contribution = ?, annual_return = ?, notes = ? WHERE id = ?`,
      [
        name,
        Number(currentAge) || 0,
        Number(retirementAge) || 0,
        Number(currentSavings) || 0,
        Number(monthlyContribution) || 0,
        Number(annualReturn) || 0,
        notes ?? '',
        req.params.id,
      ]
    );

    res.json({ message: 'Plan updated' });
  } catch (err) {
    next(err);
  }
});

plansRouter.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await run('DELETE FROM plans WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    next(err);
  }
});
