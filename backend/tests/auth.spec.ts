import request from 'supertest';
import { createApp } from '../src/app';
import { initDb } from '../src/db';

describe('Auth routes', () => {
  const app = createApp();

  beforeAll(async () => {
    await initDb();
  });

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'jdoe', password: 'hunter2pass', email: 'jdoe@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/created/i);
  });

  it('rejects registration with an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'baduser', password: 'hunter2pass', email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('rejects duplicate usernames', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'dupeuser', password: 'hunter2pass', email: 'dupe@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dupeuser', password: 'anotherpass', email: 'dupe2@example.com' });

    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials and returns a token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'loginuser', password: 'correcthorse', email: 'login@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'loginuser', password: 'correcthorse' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('loginuser');
  });

  it('rejects login with an incorrect password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'wrongpassuser', password: 'correcthorse', email: 'wp@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'wrongpassuser', password: 'incorrect' });

    expect(res.status).toBe(401);
  });

  it('always returns a generic message for forgot-password, regardless of username existing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ username: 'nobody' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that account exists/i);
  });
});
