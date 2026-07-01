import request from 'supertest';
import { createApp } from '../src/app';
import { initDb } from '../src/db';

describe('Plans routes', () => {
  const app = createApp();
  let token: string;

  beforeAll(async () => {
    await initDb();
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'planner', password: 'plannerpass', email: 'planner@example.com' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'planner', password: 'plannerpass' });

    token = login.body.token;
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.status).toBe(401);
  });

  it('creates a retirement plan', async () => {
    const res = await request(app)
      .post('/api/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Comfortable retirement',
        currentAge: 35,
        retirementAge: 65,
        currentSavings: 20000,
        monthlyContribution: 750,
        annualReturn: 7,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('lists plans for the authenticated user with a projected balance', async () => {
    const res = await request(app).get('/api/plans').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].projectedBalance).toBeGreaterThan(0);
  });

  it('fetches a single plan by id', async () => {
    const list = await request(app).get('/api/plans').set('Authorization', `Bearer ${token}`);
    const id = list.body[0].id;

    const res = await request(app).get(`/api/plans/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for a plan that does not exist', async () => {
    const res = await request(app).get('/api/plans/999999').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
