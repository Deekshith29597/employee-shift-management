// server.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/erp',  require('./routes/erp'));

// Fallback to frontend for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Shift ERP running at http://localhost:${PORT}`);
  console.log(`   Login: admin / admin123\n`);
});
