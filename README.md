# 🏢 Employee Shift Management ERP — Full Stack

## Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML + CSS + Vanilla JS           |
| Backend    | Node.js + Express                 |
| Database   | SQLite (via better-sqlite3)       |
| Auth       | JWT (jsonwebtoken) + bcryptjs     |

---

## 📁 Project Structure
```
shift-erp/
├── backend/
│   ├── server.js          ← Express entry point
│   ├── db.js              ← SQLite setup + table creation
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js        ← JWT verification middleware
│   └── routes/
│       ├── auth.js        ← Login, change password/username, user management
│       └── erp.js         ← Departments, Roles, Shifts, Employees, Attendance
└── frontend/
    └── index.html         ← Complete SPA frontend
```

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
cd shift-erp/backend
npm install
```

### 2. Start the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

### 3. Open browser
```
http://localhost:3000
```

---

## 🔑 Default Login
| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

> ⚠️ Change this password immediately after first login via **Profile & Settings**

---

## 🗄️ Database
- SQLite file auto-created at `backend/shift_erp.db` on first run
- No separate DB installation needed
- Tables: `users`, `departments`, `roles`, `shifts`, `employees`, `attendance`

---

## 🔐 Features
- **JWT auth** — tokens expire in 8 hours
- **Change username** — requires current password confirmation
- **Change password** — requires current + new + confirm
- **Admin panel** — create/delete users, assign roles
- **Role-based access** — `admin` sees user management, `staff` does not

---

## 🌐 API Endpoints

### Auth
| Method | Path                        | Auth     | Description          |
|--------|-----------------------------|----------|----------------------|
| POST   | /api/auth/login             | ❌       | Login                |
| GET    | /api/auth/me                | ✅       | Get current user     |
| PUT    | /api/auth/change-password   | ✅       | Change password      |
| PUT    | /api/auth/change-username   | ✅       | Change username      |
| GET    | /api/auth/users             | ✅ Admin | List all users       |
| POST   | /api/auth/create-user       | ✅ Admin | Create a user        |
| DELETE | /api/auth/users/:id         | ✅ Admin | Delete a user        |

### ERP Data (all require auth)
| Method | Path                        | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | /api/erp/departments        | List departments             |
| POST   | /api/erp/departments        | Add department               |
| PUT    | /api/erp/departments/:id    | Edit department              |
| DELETE | /api/erp/departments/:id    | Delete department            |
| GET    | /api/erp/roles              | List roles                   |
| POST   | /api/erp/roles              | Add role                     |
| GET    | /api/erp/shifts             | List shifts                  |
| POST   | /api/erp/shifts             | Add shift                    |
| GET    | /api/erp/employees          | List employees + attendance  |
| POST   | /api/erp/employees          | Add employee                 |
| PUT    | /api/erp/employees/:id      | Edit employee                |
| DELETE | /api/erp/employees/:id      | Delete employee              |
| POST   | /api/erp/attendance         | Mark attendance (upsert)     |
| GET    | /api/erp/attendance/:emp_id | Get employee attendance      |
| GET    | /api/erp/dashboard          | Dashboard summary counts     |

---

## 🛠️ Environment Variables (optional)
```env
PORT=3000
JWT_SECRET=your_custom_secret_here
```
