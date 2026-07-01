import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

export const calculatorRouter = Router();

calculatorRouter.use(requireAuth);

type Token = { type: 'number' | 'identifier' | 'operator' | 'paren'; value: string };

function tokenizeFormula(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (/[()+\-*/]/.test(char)) {
      tokens.push({ type: char === '(' || char === ')' ? 'paren' : 'operator', value: char });
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let j = i;
      let dotCount = 0;
      while (j < formula.length && /[0-9.]/.test(formula[j])) {
        if (formula[j] === '.') dotCount += 1;
        j += 1;
      }
      const value = formula.slice(i, j);
      if (value === '.' || dotCount > 1) {
        throw new Error('Invalid number in formula');
      }
      tokens.push({ type: 'number', value });
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let j = i;
      while (j < formula.length && /[A-Za-z0-9_]/.test(formula[j])) j += 1;
      tokens.push({ type: 'identifier', value: formula.slice(i, j) });
      i = j;
      continue;
    }

    throw new Error('Unsupported character in formula');
  }

  return tokens;
}

function evaluateFormula(formula: string, rawVariables: unknown): number {
  const variables =
    rawVariables && typeof rawVariables === 'object'
      ? (rawVariables as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const tokens = tokenizeFormula(formula);
  let index = 0;

  const readToken = () => tokens[index];
  const consumeToken = () => tokens[index++];

  const parseExpression = (): number => {
    let value = parseTerm();
    while (readToken()?.type === 'operator' && (readToken().value === '+' || readToken().value === '-')) {
      const op = consumeToken().value;
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (readToken()?.type === 'operator' && (readToken().value === '*' || readToken().value === '/')) {
      const op = consumeToken().value;
      const right = parseFactor();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };

  const parseFactor = (): number => {
    const token = readToken();
    if (!token) throw new Error('Unexpected end of formula');

    if (token.type === 'operator' && token.value === '-') {
      consumeToken();
      return -parseFactor();
    }

    if (token.type === 'number') {
      consumeToken();
      return Number(token.value);
    }

    if (token.type === 'identifier') {
      consumeToken();
      const value = variables[token.value];
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Variable "${token.value}" must be a finite number`);
      }
      return value;
    }

    if (token.type === 'paren' && token.value === '(') {
      consumeToken();
      const value = parseExpression();
      const closeParen = readToken();
      if (!closeParen || closeParen.type !== 'paren' || closeParen.value !== ')') {
        throw new Error('Unbalanced parentheses in formula');
      }
      consumeToken();
      return value;
    }

    throw new Error('Invalid formula syntax');
  };

  const result = parseExpression();
  if (index !== tokens.length) throw new Error('Invalid trailing token in formula');
  return result;
}

calculatorRouter.post('/custom', (req, res, next) => {
  try {
    const { formula, variables } = req.body ?? {};
    if (typeof formula !== 'string') {
      return res.status(400).json({ error: 'formula (string) is required' });
    }

    const result = evaluateFormula(formula, variables);

    res.json({ result });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});
