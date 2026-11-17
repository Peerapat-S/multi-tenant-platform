const express = require('express');
const cors = require('cors');
const tenantResolver = require('./middlewares/tenant');
const errorHandler = require('./middlewares/errorHandler');
const tenantRoutes = require('./routes/tenantRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// CORS ต้องมาก่อน tenantResolver (preflight OPTIONS ไม่มี header X-Tenant-ID)
// ตั้ง CORS_ORIGIN=http://localhost:5173 (คั่นหลายค่าด้วย ,) ไม่ตั้ง = อนุญาตทุก origin (เฉพาะตอนพัฒนา)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// เปิดสาธารณะ ไม่ต้องมี X-Tenant-ID: รายชื่อแบรนด์ (ให้หน้าเว็บทำตัวเลือกแบรนด์)
app.use('/api/tenants', tenantRoutes);

// ทุก route ที่เหลือใต้ /api ต้องผ่าน tenant middleware
app.use('/api', tenantResolver);
app.get('/api/whoami', (req, res) => res.json({ tenant: req.tenant }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

module.exports = app;