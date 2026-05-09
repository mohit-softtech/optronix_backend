# AttendX — Attendance Management System

A production-grade Attendance Management module with Employee, HR, and Admin roles. Built with React, Node.js/Express, and MySQL.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 (Sequelize ORM) |
| Auth | JWT + bcrypt |
| Styling | Vanilla CSS (Dark Glassmorphism) |
| Infrastructure | Docker Compose |

## 📁 Project Structure

```
├── docker-compose.yml          # MySQL + phpMyAdmin containers
├── Backend/
│   ├── server.js               # Express entry point
│   ├── .env                    # Environment variables
│   └── src/
│       ├── config/             # DB & app configuration
│       ├── middleware/         # Auth, RBAC, validation, error handling
│       ├── models/            # Sequelize models (6 tables)
│       ├── routes/            # API route definitions
│       ├── controllers/       # Request handlers
│       ├── services/          # Business logic layer
│       ├── validators/        # Joi validation schemas
│       └── seeders/           # Database seed script
├── Frontend/
│   └── src/
│       ├── api/               # Axios instance with JWT interceptor
│       ├── context/           # Auth state management
│       ├── layouts/           # Dashboard layout wrapper
│       ├── pages/             # Employee, HR, Admin pages
│       ├── components/        # Sidebar, Header, shared UI
│       └── utils/             # Constants & helpers
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **Docker Desktop** (for MySQL)

### 1. Start Database

```bash
# From the project root
docker-compose up -d
```

This starts:
- MySQL 8.0 on port **3306**
- phpMyAdmin on port **8080** (http://localhost:8080)

### 2. Backend Setup

```bash
cd Backend
npm install
npm run seed    # Creates tables + seed data
npm run dev     # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

### 4. Open the App

Navigate to **http://localhost:5173** and use the quick-login buttons or credentials below.

## 🔑 Sample Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@optronix.com | Admin@123 |
| **HR** | hr@optronix.com | Hr@123 |
| **Employee** | emp1@optronix.com | Emp@123 |
| **Employee** | emp2@optronix.com | Emp@123 |
| **Employee** | emp3@optronix.com | Emp@123 |

## 📋 Features by Role

### Employee
- ⏰ Clock In / Clock Out with live time widget
- 📋 View attendance history (paginated)
- ✏️ Raise correction requests (missed/wrong in-time or out-time)
- 📊 Track correction request status

### HR
- ✅ Review all correction requests (approve/reject with remarks)
- 📋 View all employee attendance records
- 📊 Dashboard with pending request stats

### Admin
- 👥 Create, edit, activate/deactivate users
- ⚙️ Configure attendance rules (shift timings, grace period, hour thresholds)
- 📋 Full visibility into all attendance records and corrections
- 📜 View complete audit log trail
- 🔐 Role assignment

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `roles` | Role definitions (admin, hr, employee) |
| `users` | All system users with role FK |
| `attendance_records` | Daily clock-in/out with hours calculation |
| `correction_requests` | Correction workflow (pending → approved/rejected) |
| `attendance_rules` | Global attendance configuration |
| `audit_logs` | Immutable action trail |

## 🔒 Security Features

- JWT token authentication
- bcrypt password hashing (12 rounds)
- Role-based access control (RBAC) on every endpoint
- Helmet security headers
- Rate limiting (100 req/15 min)
- CORS configured for frontend origin
- Input validation on all endpoints (Joi)
- Centralized error handling (no stack trace leaks in production)

## 📖 API Endpoints

See [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md) for full API documentation and architecture decisions.
