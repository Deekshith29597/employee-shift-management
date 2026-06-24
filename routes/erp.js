// routes/erp.js
const express = require('express');
const db      = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── helpers ───────────────────────────────────────────────
function runP(sql, p=[])  { return new Promise((res,rej)=>db.run(sql,p,function(e){if(e)rej(e);else res(this);})); }
function getP(sql, p=[])  { return new Promise((res,rej)=>db.get(sql,p,(e,r)=>{if(e)rej(e);else res(r);})); }
function allP(sql, p=[])  { return new Promise((res,rej)=>db.all(sql,p,(e,r)=>{if(e)rej(e);else res(r);})); }

// ═══════════════════════════════════════════════════
//  DEPARTMENTS
// ═══════════════════════════════════════════════════
router.get('/departments', async (req, res) => {
  try { res.json(await allP('SELECT * FROM departments ORDER BY id')); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/departments', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const r = await runP('INSERT INTO departments (name) VALUES (?)', [name.trim()]);
    res.json({ id: r.lastID, name: name.trim() });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Department already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    await runP('UPDATE departments SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
    res.json({ message: 'Updated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await runP('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════
//  ROLES
// ═══════════════════════════════════════════════════
router.get('/roles', async (req, res) => {
  try { res.json(await allP('SELECT * FROM roles ORDER BY id')); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/roles', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const r = await runP('INSERT INTO roles (name) VALUES (?)', [name.trim()]);
    res.json({ id: r.lastID, name: name.trim() });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Role already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    await runP('UPDATE roles SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
    res.json({ message: 'Updated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    await runP('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════
//  SHIFTS
// ═══════════════════════════════════════════════════
router.get('/shifts', async (req, res) => {
  try { res.json(await allP('SELECT * FROM shifts ORDER BY id')); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/shifts', async (req, res) => {
  try {
    const { name, start_time, end_time, type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const r = await runP(
      'INSERT INTO shifts (name, start_time, end_time, type) VALUES (?,?,?,?)',
      [name.trim(), start_time||'', end_time||'', type||'Morning']
    );
    res.json({ id: r.lastID, name: name.trim(), start_time, end_time, type });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Shift already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/shifts/:id', async (req, res) => {
  try {
    const { name, start_time, end_time, type } = req.body;
    await runP('UPDATE shifts SET name=?,start_time=?,end_time=?,type=? WHERE id=?',
      [name, start_time, end_time, type, req.params.id]);
    res.json({ message: 'Updated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    await runP('DELETE FROM shifts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════
//  EMPLOYEES
// ═══════════════════════════════════════════════════
router.get('/employees', async (req, res) => {
  try {
    const emps = await allP('SELECT * FROM employees ORDER BY id');
    const att  = await allP('SELECT * FROM attendance ORDER BY date DESC');
    const result = emps.map(e => ({
      ...e,
      attendance: att
        .filter(a => a.employee_id === e.id)
        .map(a => ({ date: a.date, status: a.status }))
    }));
    res.json(result);
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

router.post('/employees', async (req, res) => {
  try {
    const { name, emp_id, phone, department, role, shift } = req.body;
    if (!name || !emp_id) return res.status(400).json({ error: 'Name and Employee ID required' });
    const r = await runP(
      'INSERT INTO employees (name,emp_id,phone,department,role,shift) VALUES (?,?,?,?,?,?)',
      [name.trim(), emp_id.trim(), phone||'', department||'', role||'', shift||'']
    );
    res.json({ id: r.lastID, name, emp_id, phone, department, role, shift, attendance: [] });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Employee ID already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const { name, emp_id, phone, department, role, shift } = req.body;
    await runP(
      'UPDATE employees SET name=?,emp_id=?,phone=?,department=?,role=?,shift=? WHERE id=?',
      [name, emp_id, phone||'', department||'', role||'', shift||'', req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await runP('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════
router.post('/attendance', async (req, res) => {
  try {
    const { employee_id, date, status } = req.body;
    if (!employee_id || !date || !status)
      return res.status(400).json({ error: 'employee_id, date and status required' });

    const empId = parseInt(employee_id, 10);
    const existing = await getP(
      'SELECT id FROM attendance WHERE employee_id = ? AND date = ?', [empId, date]
    );

    if (existing) {
      await runP('UPDATE attendance SET status = ? WHERE employee_id = ? AND date = ?',
        [status, empId, date]);
    } else {
      await runP('INSERT INTO attendance (employee_id, date, status) VALUES (?,?,?)',
        [empId, date, status]);
    }
    res.json({ message: 'Saved', employee_id: empId, date, status });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

router.get('/attendance/:employee_id', async (req, res) => {
  try {
    const rows = await allP(
      'SELECT date, status FROM attendance WHERE employee_id = ? ORDER BY date DESC',
      [req.params.employee_id]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const now   = new Date();
    const today = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');

    const [depts, roles, shifts, emps, present, absent, onLeave] = await Promise.all([
      getP('SELECT COUNT(*) as c FROM departments'),
      getP('SELECT COUNT(*) as c FROM roles'),
      getP('SELECT COUNT(*) as c FROM shifts'),
      getP('SELECT COUNT(*) as c FROM employees'),
      getP("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='Present'", [today]),
      getP("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='Absent'",  [today]),
      getP("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='Leave'",   [today]),
    ]);

    res.json({
      departments: depts.c, roles: roles.c, shifts: shifts.c, employees: emps.c,
      present: present.c, absent: absent.c, onLeave: onLeave.c
    });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
