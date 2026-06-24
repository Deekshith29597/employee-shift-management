// db.js — SQLite database (sqlite3, no native compiler needed)
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const bcrypt  = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'shift_erp.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('DB open error:', err); process.exit(1); }
  console.log('✅ Database opened:', DB_PATH);
});

// sqlite3 is async — wrap in a promise-based helper used at startup only
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
  });
}

// ── Synchronous helpers used in routes (via db.run/db.get/db.all directly) ───
// Routes use db.run / db.get / db.all with callbacks, wrapped in promises.
// We attach promise-wrappers directly to the db object for convenience.
db.runP  = run;
db.getP  = get;
db.allP  = all;
db.runSync = run;   // alias

// ── INIT TABLES & SEED ────────────────────────────────────
async function init() {
  await run('PRAGMA foreign_keys = ON');

  await run(`CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'staff',
    created_at TEXT    DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS departments (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS roles (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS shifts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    start_time TEXT,
    end_time   TEXT,
    type       TEXT DEFAULT 'Morning'
  )`);

  await run(`CREATE TABLE IF NOT EXISTS employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    emp_id     TEXT NOT NULL UNIQUE,
    phone      TEXT,
    department TEXT,
    role       TEXT,
    shift      TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS attendance (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    status      TEXT    NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
  )`);

  // Seed admin
  const admin = await get("SELECT id FROM users WHERE username = 'admin'");
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [hash]);
    console.log('✅ Default admin created  →  username: admin   password: admin123');
  } else {
    console.log('✅ Admin user already exists');
  }

  const users = await all('SELECT id, username, role FROM users');
  console.log('👥 Users in DB:', users);
}

init().catch(e => { console.error('DB init error:', e); process.exit(1); });

module.exports = db;
