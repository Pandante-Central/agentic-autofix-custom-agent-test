import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Tests run against an isolated in-memory database so they never touch
// (or depend on) the developer's local data file.
const isTestEnv = process.env.NODE_ENV === 'test';

let dbPath = ':memory:';
if (!isTestEnv) {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, 'retirement.db');
}

// Verbose mode makes stack traces easier to read during the demo.
sqlite3.verbose();

export const db = new sqlite3.Database(dbPath);

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          current_age INTEGER NOT NULL,
          retirement_age INTEGER NOT NULL,
          current_savings REAL NOT NULL,
          monthly_contribution REAL NOT NULL,
          annual_return REAL NOT NULL,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

/** Runs a query and resolves with all matching rows. */
export function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

/** Runs a query and resolves with the first matching row (or undefined). */
export function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

/** Runs an insert/update/delete statement. */
export function run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

/**
 * Runs a raw, unparameterized SQL query built by the caller.
 * Exposed deliberately so search endpoints can build dynamic WHERE clauses.
 */
export function allRaw<T = any>(sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}
