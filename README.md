# 🏥 MedChain — Secure Medical Report Management & Prescription System

A full-stack web application with **blockchain-based integrity verification** for medical records.

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, Axios |
| Backend     | Node.js, Express.js                 |
| Database    | PostgreSQL                          |
| Auth        | JWT (role-based: Doctor / Patient)  |
| Blockchain  | SHA-256 hashing via Node `crypto`   |
| File Upload | Multer                              |
| Charts      | Recharts                            |

---

## 📁 Project Structure

```
medchain/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL pool connection
│   │   └── schema.sql         # Database schema + seed data
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── prescriptionController.js
│   │   ├── reportController.js
│   │   └── verificationController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT + role-based middleware
│   │   └── upload.js          # Multer file upload config
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── prescriptions.js
│   │   ├── reports.js
│   │   └── verification.js
│   ├── uploads/               # Uploaded files (auto-created)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── PatientDashboard.jsx
    │   │   ├── PatientsListPage.jsx
    │   │   ├── PatientDetailPage.jsx
    │   │   ├── PrescriptionsPage.jsx
    │   │   ├── AddPrescriptionPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   ├── VerificationPage.jsx
    │   │   └── SharedPrescriptionPage.jsx
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** v9+

---

### 1. Database Setup

```bash
# Open psql
psql -U postgres

# Create database
CREATE DATABASE medchain;
\c medchain

# Run schema (from backend/config/schema.sql)
\i /path/to/medchain/backend/config/schema.sql
```

This creates all tables and inserts sample users:
- **Doctor:** `doctor@medchain.com` / `password`
- **Patient:** `patient@medchain.com` / `password`

---

### 2. Backend Setup

```bash
cd medchain/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=medchain
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# JWT_SECRET=your_very_long_secret_key_here
# PORT=5000

# Start development server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd medchain/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔐 Demo Credentials

| Role    | Email                    | Password |
|---------|--------------------------|----------|
| Doctor  | doctor@medchain.com      | password |
| Patient | patient@medchain.com     | password |

> **Note:** The sample patient is NOT yet linked to the sample doctor. After logging in as doctor, note your doctor ID, then run:
> ```sql
> UPDATE patients SET doctor_id = 1 WHERE user_id = 2;
> ```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| POST   | /api/auth/register  | Register user         |
| POST   | /api/auth/login     | Login                 |
| GET    | /api/auth/me        | Get current user      |

### Patients
| Method | Endpoint                 | Role   | Description              |
|--------|--------------------------|--------|--------------------------|
| GET    | /api/patients            | Doctor | Get assigned patients     |
| GET    | /api/patients/me         | Patient| Get own profile           |
| GET    | /api/patients/stats      | Doctor | Dashboard statistics      |
| GET    | /api/patients/:id        | Both   | Get patient by ID         |

### Prescriptions
| Method | Endpoint                        | Role    | Description               |
|--------|---------------------------------|---------|---------------------------|
| GET    | /api/prescriptions              | Both    | Get all (role-filtered)    |
| POST   | /api/prescriptions              | Doctor  | Create prescription        |
| GET    | /api/prescriptions/:id          | Both    | Get single prescription    |
| DELETE | /api/prescriptions/:id          | Doctor  | Delete prescription        |
| POST   | /api/prescriptions/:id/share    | Patient | Generate share link        |
| GET    | /api/prescriptions/shared/:token| Public  | View shared prescription   |
| GET    | /api/prescriptions/patient/:id  | Both    | Get patient's prescriptions|

### Reports
| Method | Endpoint                  | Role   | Description          |
|--------|---------------------------|--------|----------------------|
| GET    | /api/reports              | Both   | Get all (filtered)    |
| POST   | /api/reports/upload       | Doctor | Upload report file    |
| GET    | /api/reports/:id          | Both   | Get report            |
| DELETE | /api/reports/:id          | Doctor | Delete report         |
| GET    | /api/reports/patient/:id  | Both   | Patient's reports     |

### Verification
| Method | Endpoint                      | Description                  |
|--------|-------------------------------|------------------------------|
| GET    | /api/verify/prescription/:id  | Verify prescription hash      |
| GET    | /api/verify/report/:id        | Verify report file hash       |
| GET    | /api/verify/hash?type=&id=    | Verify arbitrary hash         |

---

## 🔗 Blockchain Verification

Every prescription and report gets a **SHA-256 hash** at creation:

```
Prescription Hash = SHA256(patient_id + doctor_id + diagnosis + notes + items + timestamp)
Report Hash       = SHA256(file binary contents)
```

Verification compares stored hash vs. recomputed hash:
- **VERIFIED** ✅ — record is intact, not tampered
- **TAMPERED** ⚠️ — hash mismatch, data was modified

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT tokens** expire in 24 hours
- Role-based route guards on frontend and backend
- Doctor cannot access other doctor's patients
- Patient cannot access other patient's data
- File upload restricted to PDF, JPG, PNG (max 10MB)

---

## 🚀 Build for Production

```bash
# Frontend build
cd frontend
npm run build
# Output in frontend/dist/

# Backend — set NODE_ENV=production in .env
cd backend
npm start
```
