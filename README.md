# 📚 Student Information System (SIS)

A full-stack Student Information System with role-based access control for **Super Admins** and **Professors**. Built with Node.js, React, and MongoDB.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, MongoDB, Mongoose, JWT |
| **Frontend** | React 18, Vite |
| **Analytics** *(optional)* | Python, Pandas, PyMongo |

---

## 📁 Project Structure

```
resha_SIS/
├── backend/              # Express REST API
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   ├── scripts/      # Seed scripts
│   │   └── server.js     # Entry point
│   ├── .env.example      # Environment template
│   └── package.json
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── App.jsx       # Main application
│   │   ├── api.js        # API helper
│   │   ├── main.jsx      # React entry point
│   │   └── styles.css    # Styling
│   └── package.json
├── python/               # Optional analytics
│   ├── analytics.py
│   └── requirements.txt
└── README.md
```

---

## 🔐 User Roles

### Super Admin
- Full CRUD for **students**, **classes**, **professors**, and **enrollments**
- View system-wide reports and dashboard analytics
- **Transfer** students between classes
- **Expel** students from the system
- **Fire** professors and reassign their classes
- **Transfer** professors between classes

### Professor (Admin)
- View only their **assigned classes** and **enrolled students**
- Edit basic info of students in their classes
- Update **grades**, **attendance**, and **notes** inline for their students
- Filter students by class using tab navigation

---

## 📋 Prerequisites

Before you begin, make sure you have these installed:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | v6 or higher | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Python** *(optional)* | 3.9 or higher | [python.org](https://www.python.org/) |

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/resha_SIS.git
cd resha_SIS
```

### Step 2: Start MongoDB

Make sure MongoDB is running on your machine:

```bash
# Windows (if installed as a service, it runs automatically)
# Otherwise, start it manually:
mongod
```

### Step 3: Setup the Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create your environment file from the template
copy .env.example .env

# Start the backend server (development mode with auto-reload)
npm run dev
```

The backend will start on **http://localhost:5000**.

#### Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/sis_db` | MongoDB connection string |
| `JWT_SECRET` | `super-secret-key` | Secret key for JWT tokens |
| `JWT_EXPIRES_IN` | `1d` | Token expiration time |

### Step 4: Create the Super Admin Account

On first run, you need to seed the super admin account:

```bash
# Option A: Use the seed script (from the backend folder)
npm run seed:superadmin
```

This creates:
- **Email:** `superadmin@sis.local`
- **Password:** `admin123`

```bash
# Option B: (Optional) Seed sample data (students, classes, enrollments)
npm run seed:samples
```

### Step 5: Setup the Frontend

Open a **new terminal**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

The frontend will start on **http://localhost:5173**.

### Step 6 (Optional): Setup Python Analytics

```bash
# Navigate to python folder
cd python

# Install Python dependencies
pip install -r requirements.txt

# Run the analytics script
python analytics.py
```

---

## 🖥 How to Use

### Logging In

1. Open **http://localhost:5173** in your browser
2. Enter your credentials:
   - **Super Admin:** `superadmin@sis.local` / `admin123`
   - **Professor:** Use the email/password set by the super admin

### Super Admin Workflow

1. **Dashboard** — View total students, classes, professors, enrollments, and an enrollment distribution chart
2. **Students** — Add new students, transfer students between classes, or expel students
3. **Classes** — Create classes, assign professors, transfer professors between classes
4. **Professors** — Create professor accounts, assign them to classes, or fire them
5. **Enrollments** — Assign students to classes and view all enrollment records

### Professor Workflow

1. **Dashboard** — Welcome page with quick overview
2. **Students** — Edit basic info (name, email, phone) for students in your assigned classes
3. **Classes** — View your assigned classes
4. **Enrollments** — Manage grades, attendance, and notes:
   - Use the **class tabs** at the top to filter by class
   - Use the **search bar** to find specific students
   - Click **Edit** on any row to update grade, attendance %, and notes inline
   - Click **Save** to confirm or **Cancel** to discard changes

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/bootstrap-superadmin` | Public (first run only) | Create initial super admin |
| `POST` | `/auth/login` | Public | Login and get JWT token |
| `GET` | `/auth/me` | Authenticated | Get current user info |

### Students
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/students` | All authenticated | List students (scoped for professors) |
| `POST` | `/students` | Super Admin | Create a student |
| `PATCH` | `/students/:id` | All authenticated | Update student info |
| `DELETE` | `/students/:id` | Super Admin | Delete a student |
| `POST` | `/students/:id/expel` | Super Admin | Expel a student |
| `POST` | `/students/:id/transfer` | Super Admin | Transfer student between classes |

### Classes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/classes` | All authenticated | List classes (scoped for professors) |
| `POST` | `/classes` | Super Admin | Create a class |
| `PATCH` | `/classes/:id` | Super Admin | Update a class |
| `DELETE` | `/classes/:id` | Super Admin | Delete a class |

### Enrollments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/enrollments` | All authenticated | List enrollments (scoped for professors) |
| `POST` | `/enrollments` | Super Admin | Enroll student in a class |
| `PATCH` | `/enrollments/:id` | All authenticated | Update grade/attendance/notes |
| `DELETE` | `/enrollments/:id` | Super Admin | Delete an enrollment |

### Admin Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/users` | Super Admin | List all professor accounts |
| `POST` | `/users` | Super Admin | Create a professor account |
| `PATCH` | `/users/:id` | Super Admin | Update a professor |
| `DELETE` | `/users/:id` | Super Admin | Delete a professor |
| `POST` | `/users/:id/fire` | Super Admin | Fire professor and reassign classes |
| `POST` | `/users/transfer-professor` | Super Admin | Transfer professor to a class |

### Reports
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/reports/system` | Super Admin | System-wide summary stats |

---

## 📦 Dependencies

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable management |
| `morgan` | HTTP request logger |
| `nodemon` *(dev)* | Auto-restart on file changes |

### Frontend (`frontend/package.json`)

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | React DOM renderer |
| `vite` *(dev)* | Build tool and dev server |
| `@vitejs/plugin-react` *(dev)* | React support for Vite |

### Python (`python/requirements.txt`)

| Package | Purpose |
|---------|---------|
| `pymongo` | MongoDB driver for Python |
| `pandas` | Data analysis library |

---

## ⚡ Quick Start (TL;DR)

```bash
# Terminal 1 — Backend
cd backend
npm install
copy .env.example .env
npm run seed:superadmin
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** and login with `superadmin@sis.local` / `admin123`.

---

## 📝 Notes

- Make sure **MongoDB** is running before starting the backend
- The frontend proxies API requests to `http://localhost:5000`
- JWT tokens expire after 1 day by default (configurable in `.env`)
- Change `JWT_SECRET` to a strong random string for production use
