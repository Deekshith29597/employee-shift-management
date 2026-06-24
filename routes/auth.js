// routes/auth.js
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { authMiddleware, SECRET } = require('../middleware/auth');

const router = express.Router();

function runP(sql, p=[]) { return new Promise((res,rej)=>db.run(sql,p,function(e){if(e)rej(e);else res(this);})); }
function getP(sql, p=[]) { return new Promise((res,rej)=>db.get(sql,p,(e,r)=>{if(e)rej(e);else res(r);})); }
function allP(sql, p=[]) { return new Promise((res,rej)=>db.all(sql,p,(e,r)=>{if(e)rej(e);else res(r);})); }

// ── LOGIN ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  try {
    const user = await getP('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ME ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getP('SELECT id,username,role,created_at FROM users WHERE id=?', [req.user.id]);
    res.json(user);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CHANGE PASSWORD ────────────────────────────────
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both current and new password required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  try {
    const user = await getP('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = bcrypt.hashSync(newPassword, 10);
    await runP('UPDATE users SET password=? WHERE id=?', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CHANGE USERNAME ────────────────────────────────
router.put('/change-username', authMiddleware, async (req, res) => {
  const { newUsername, password } = req.body;
  if (!newUsername || !password)
    return res.status(400).json({ error: 'New username and current password required' });
  if (newUsername.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  try {
    const user = await getP('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Password is incorrect' });
    const taken = await getP('SELECT id FROM users WHERE username=? AND id!=?', [newUsername, req.user.id]);
    if (taken) return res.status(409).json({ error: 'Username already taken' });
    await runP('UPDATE users SET username=? WHERE id=?', [newUsername, req.user.id]);
    const newToken = jwt.sign(
      { id: user.id, username: newUsername, role: user.role },
      SECRET, { expiresIn: '8h' }
    );
    res.json({ message: 'Username updated successfully', token: newToken, username: newUsername });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── CREATE USER (admin only) ───────────────────────
router.post('/create-user', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  const { username, password, role = 'staff' } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  try {
    const exists = await getP('SELECT id FROM users WHERE username=?', [username]);
    if (exists) return res.status(409).json({ error: 'Username already taken' });
    const hash = bcrypt.hashSync(password, 10);
    const r = await runP('INSERT INTO users (username,password,role) VALUES (?,?,?)', [username, hash, role]);
    res.json({ message: 'User created', id: r.lastID });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── LIST USERS (admin only) ────────────────────────
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  try {
    const users = await allP('SELECT id,username,role,created_at FROM users');
    res.json(users);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE USER (admin only) ───────────────────────
router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await runP('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
