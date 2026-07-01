import request from 'supertest';
import { createApp } from '../src/app';
import { initDb } from '../src/db';

describe('Calculator routes', () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    await initDb();
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'calcuser', password: 'calcpass123', email: 'calc@example.com' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'calcuser', password: 'calcpass123' });

    token = login.body.token;
  });

  it('evaluates a simple custom formula with variables', async () => {
    const res = await request(app)
      .post('/api/calculator/custom')
      .set('Authorization', 'Bearer ' + token)
      .send({ formula: 'balance * 1.1 + contribution', variables: { balance: 1000, contribution: 100 } });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeCloseTo(1200);
  });

  it('requires a formula string', async () => {
    const res = await request(app)
      .post('/api/calculator/custom')
      .set('Authorization', 'Bearer ' + token)
      .send({ variables: { balance: 1000 } });

    expect(res.status).toBe(400);
  });

  it('rejects non-arithmetic formula payloads', async () => {
    const res = await request(app)
      .post('/api/calculator/custom')
      .set('Authorization', 'Bearer ' + token)
      .send({ formula: "this.constructor.constructor('return 7')()", variables: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unsupported character|Invalid formula|Invalid number/);
  });
});
