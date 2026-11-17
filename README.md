# Multi-tenant E-Commerce Platform 🛍️⚡

แพลตฟอร์มอีคอมเมิร์ซแบบ **Multi-tenant (หลายร้านค้าในระบบเดียว)** พัฒนาด้วยสถาปัตยกรรม **Node.js, Express, PostgreSQL, React (Vite)** โดยใช้แนวทางการแยกข้อมูลระดับแถว (**Row-Level Data Isolation**) อย่างสมบูรณ์ พร้อมระบบจัดการคำสั่งซื้อแบบ ACID Transaction และดีไซน์ระบบตามสเปก **Shopify Design Language (Two-Canvas Architecture)**

---

## 🌟 จุดเด่นและฟีเจอร์หลัก (Key Features)

### 1. สถาปัตยกรรม Multi-tenancy ที่ปลอดภัย (Isolated Multi-tenancy)
- **Tenant Isolation**: แยกข้อมูลตามร้านค้า/แบรนด์ผ่าน Header `X-Tenant-ID`
- **Scoped Authentication**: Token (JWT) ผูกกับ Tenant โดยตรง ไม่สามารถนำ Token ของแบรนด์หนึ่งไปใช้งานกับอีกแบรนด์หนึ่งได้
- **Role-Based Access Control (RBAC)**: แบ่งสิทธิ์ชัดเจนระหว่างผู้ดูแลระบบ (`admin`) และลูกค้า (`customer`)
- **Brand Switching**: สลับดูหน้าร้านระหว่างแบรนด์ (เช่น `brand-a`, `brand-b`) ได้ทันทีจากแถบนำทาง

### 2. ระบบหน้าร้านและการสั่งซื้อ (Storefront & Order Lifecycle)
- **Product Catalog**: แสดงรายการสินค้า พร้อมระบบค้นหาแบบเรียลไทม์ (Live Search) และตัวแบ่งหน้า (Pagination)
- **Stock Management & ACID Transactions**: ตัดสต็อกสินค้าแบบ Atomic Transaction ด้วย PostgreSQL ผ่าน `withTransaction` ป้องกันการสั่งซื้อสินค้าเกินจำนวนพร้อมกัน (Race Conditions)
- **Order State Machine**: รองรับสถานะคำสั่งซื้อตามลำดับจริง:
  - `pending` (รอชำระเงิน) → `paid` (ชำระเงินแล้ว) → `shipped` (จัดส่งแล้ว)
  - `cancelled` (ยกเลิกคำสั่งซื้อ): คืนสต็อกสินค้ากลับเข้าคลังอัตโนมัติ

### 3. ระบบจัดการสินค้าสำหรับผู้ดูแล (Admin Dashboard)
- แดชบอร์ดสรุปสถิติสต็อก 4 ช่อง: ทั้งหมด, พร้อมขาย, สินค้าใกล้หมด, หมดสต็อก
- ตารางจัดการสินค้าแบบ CRUD (เพิ่ม, แก้ไข, ลบ) พร้อมระบบ Preview รูปภาพ

### 4. ดีไซน์ตาม Shopify Design Language ([DESIGN-shopify.md](DESIGN-shopify.md))
- **Two-Canvas System**:
  - **Cinematic Marketing Track (`#000000`)**: แบนเนอร์หัวเรื่องสีดำสนิท ตัวอักษรบางเบาสไตล์ Editorial (Thin 330) พร้อมปุ่ม White Outline Pill
  - **Transactional Track (`#fbfbf5` & `#ffffff`)**: หน้าร้าน การ์ดสินค้า และแดชบอร์ดบนแคนวาสสีครีมละมุน พร้อมเงาซ้อนบางเบา (Level 3 Stacked Paper Shadows)
- **Pill-Only Buttons**: ปุ่มกดทรงเม็ดพิลล์มน 100% (`border-radius: 9999px`)
- **Signature Accents**: สีมินต์ Aloe-10 (`#c1fbd4`), สี Pistachio-10 (`#d4f9e0`), และเส้น Hairline (`#e4e4e7`)
- **Typography**: รองรับ Inter Variable + Prompt (ภาษาไทย) พร้อมเปิดใช้งาน OpenType `ss03` ทั่วทั้งระบบ
- **Fully Responsive**: รองรับการใช้งานสมบูรณ์แบบทั้ง Desktop, Tablet และ Mobile

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนของระบบ | เทคโนโลยี | รายละเอียด |
|---|---|---|
| **Backend** | Node.js, Express 5 | RESTful API, Custom Middlewares |
| **Database** | PostgreSQL 16 | Relational Database, Indexing, Transactions |
| **Authentication** | JWT, bcrypt | Token-based auth, Salt hashing |
| **Frontend** | React 18, Vite | SPA, React Router DOM, Shopify Design System |
| **Testing** | Jest, Supertest | 119+ Unit Tests & Integration/API Tests |
| **DevOps** | Docker, Docker Compose | Multi-container setup (Node + Postgres) |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
multi-tenant-platform/
├── db/
│   ├── migrations/          # ไฟล์ Migration และ Seed ข้อมูลเริ่มต้น
│   │   ├── 001_init.sql
│   │   ├── 002_seed_dev_tenants.sql
│   │   ├── 003_seed_dev_admins.sql
│   │   ├── 004_product_image.sql
│   │   └── 005_orders.sql
├── frontend/                # ฝั่งไคลเอนต์ (React + Vite)
│   ├── src/
│   │   ├── components/      # BuyBox, Layout, ProductForm, ProductImage
│   │   ├── pages/           # Storefront, AdminProducts, Orders, Login, Register
│   │   ├── api.js           # Fetch API wrapper พร้อม X-Tenant-ID & Auth
│   │   ├── auth.jsx         # AuthContext และ Session Management
│   │   ├── styles.css       # ระบบ CSS ตาม Shopify Design Language
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js       # Reverse Proxy ไปยัง Backend (port 3000)
├── src/                     # ฝั่งเซิร์ฟเวอร์ (Node.js Express)
│   ├── config/              # ตั้งค่า Database และ Environment
│   ├── controllers/         # Business logic สำหรับ Auth, Orders, Products, Tenants
│   ├── middlewares/         # tenantResolver, authMiddleware, errorHandler
│   ├── models/              # Data Access Layer (SQL Queries)
│   ├── routes/              # Express API Routes
│   ├── services/            # Application Services
│   ├── utils/               # withTransaction, paging, isUuid, httpError
│   ├── views/               # Serializers / JSON Formatters
│   ├── app.js               # Express Application Setup
│   └── server.js            # Entry point ของ Server
├── tests/
│   ├── unit/                # Unit Tests (119 tests)
│   └── api/                 # API Integration Tests
├── docker-compose.yml       # ตั้งค่า Docker สำหรับ Database & Backend
├── Dockerfile
└── DESIGN-shopify.md        # ข้อกำหนดระบบดีไซน์ Shopify ฉบับสมบูรณ์
```

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำ สะดวกที่สุด)

รันทั้ง PostgreSQL 16 และ Node.js Backend พร้อม Migration อัตโนมัติ:

```bash
# 1. คัดลอกไฟล์ Environment
cp .env.example .env

# 2. เริ่มต้นระบบด้วย Docker Compose
docker compose up --build
```
> ระบบจะรัน Backend ที่ `http://localhost:3000` และ PostgreSQL ที่พอร์ต `5432`

---

### วิธีที่ 2: รันแยกแบบ Local Development

#### 1. ติดตั้ง Dependencies
```bash
# ติดตั้ง Backend Dependencies
npm install

# ติดตั้ง Frontend Dependencies
cd frontend
npm install
cd ..
```

#### 2. ตั้งค่าฐานข้อมูล PostgreSQL
สร้างฐานข้อมูล `platform` และรันไฟล์ Migration ใน `db/migrations/` ตามลำดับ:
1. `001_init.sql`
2. `002_seed_dev_tenants.sql`
3. `003_seed_dev_admins.sql`
4. `004_product_image.sql`
5. `005_orders.sql`

#### 3. ตั้งค่าไฟล์ `.env` ใน Root Directory
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/platform
JWT_SECRET=your_super_secret_key
CORS_ORIGIN=http://localhost:5173
```

#### 4. เริ่มต้นรันเซิร์ฟเวอร์
```bash
# รัน Backend (Terminal 1)
node --watch src/server.js

# รัน Frontend (Terminal 2)
cd frontend
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่: **`http://localhost:5173`**

---

## 🔑 ข้อมูลบัญชีทดสอบเริ่มต้น (Default Credentials)

ระบบได้เตรียมข้อมูลจำลอง (Seed Data) สำหรับการทดสอบไว้ล่วงหน้า:

| แบรนด์ (Tenant) | อีเมลผู้ดูแล (Admin) | รหัสผ่าน | สิทธิ์ (Role) |
|---|---|---|---|
| **brand-a** | `admin@brand-a.com` | `Admin1234` | `admin` |
| **brand-b** | `admin@brand-b.com` | `Admin1234` | `admin` |

*(ในหน้า Login ฝั่ง Frontend มีปุ่ม **"⚡ Dev Auto-fill"** ให้คลิกเพื่อกรอกข้อมูลผู้ดูแลอัตโนมัติได้อย่างรวดเร็ว)*

> **หมายเหตุ**: ผู้ใช้สามารถกดปุ่ม "สมัครสมาชิก" (Register) เพื่อสร้างบัญชีลูกค้า (`customer`) ประจำแบรนด์นั้นๆ เพื่อทดสอบการกดสั่งซื้อสินค้าได้ทันที

---

## 📡 รายการ API Endpoints (API Documentation)

ทุก Request ภายใต้ `/api/*` (ยกเว้น `/api/tenants`) จำเป็นต้องแนบ Header:
`X-Tenant-ID: <slug>` เช่น `X-Tenant-ID: brand-a`

### 1. Tenants & Health Check
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| `GET` | `/health` | Public | ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์ |
| `GET` | `/api/tenants` | Public | ดูรายชื่อแบรนด์ทั้งหมดในระบบ |
| `GET` | `/api/whoami` | Public | ตรวจสอบ Tenant ปัจจุบันจาก Header |

### 2. Authentication
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | สมัครสมาชิกลูกค้าใหม่ประจำ Tenant |
| `POST` | `/api/auth/login` | Public | เข้าสู่ระบบและรับ JWT Token |
| `GET` | `/api/auth/me` | Logged In | ดูข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบัน |

### 3. Products
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| `GET` | `/api/products?page=1&limit=10` | Public | ดูรายการสินค้า (มีแบ่งหน้า) |
| `GET` | `/api/products/:id` | Public | ดูรายละเอียดสินค้าตาม ID |
| `POST` | `/api/products` | Admin Only | สร้างสินค้าใหม่ใน Tenant |
| `PUT` | `/api/products/:id` | Admin Only | แก้ไขข้อมูลสินค้าและจำนวนสต็อก |
| `DELETE` | `/api/products/:id` | Admin Only | ลบสินค้าออกจากระบบ |

### 4. Orders
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| `POST` | `/api/orders` | Customer Only | สั่งซื้อสินค้า (ตัดสต็อกแบบ ACID Transaction) |
| `GET` | `/api/orders?page=1&limit=10` | Logged In | ลูกค้าดูเฉพาะของตนเอง / Admin ดูทั้งหมดใน Tenant |
| `GET` | `/api/orders/:id` | Owner/Admin | ดูรายละเอียดคำสั่งซื้อ |
| `PATCH` | `/api/orders/:id/status` | Admin Only | อัปเดตสถานะ (`paid`, `shipped`, `cancelled`) |

---

## 🧪 การทดสอบระบบ (Testing)

โปรเจกต์นี้มีชุดทดสอบครอบคลุมทั้งแบบ Unit Test และ Integration Test:

```bash
# รัน Unit Tests ทั้งหมด (119/119 ผ่าน)
npm run test:unit

# รัน API / Integration Tests (ต้องการฐานข้อมูลทดสอบ)
npm run test:api

# รันรายงานความครอบคลุมของการทดสอบ (Coverage Report)
npm run test:coverage
```

---

