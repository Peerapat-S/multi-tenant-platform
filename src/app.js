const express = require('express');
const tenantResolver = require('./middlewares/tenant');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ทุก route ใต้ /api ต้องผ่าน tenant middleware
app.use('/api', tenantResolver);
app.get('/api/whoami', (req, res) => res.json({ tenant: req.tenant }));
app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;