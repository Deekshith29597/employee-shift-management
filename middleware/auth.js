// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'shift_erp_secret_2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Malformed token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware, SECRET };
