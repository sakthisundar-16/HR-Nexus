# HR Nexus — Enterprise Human Resource Management System
**Hackathon Competition Backend API Built with FastAPI & Clean Architecture**

---

## 🏆 Why This Backend Stands Out

Most hackathon projects are simple CRUD applications with tangled logic and zero separation of concerns. **HR Nexus** is engineered to look and function like an enterprise SaaS platform competing with **BambooHR**, **Zoho People**, and **Odoo HR**.

### Key Software Engineering Highlights
1. **Enterprise Clean Architecture**: Strict 6-layer separation (`API` → `Service` → `Repository` → `Model` → `Schema` → `Core`). Business logic is completely decoupled from HTTP routes and database engines.
2. **Real-World Business Logic**:
   - **Attendance Rules**: Prevents duplicate daily check-ins, blocks check-out before check-in, auto-computes working hours, and dynamically assigns status (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`).
   - **Leave Overlap Prevention**: Date range intersection detection prevents conflicting leave applications. Auto-calculates business days excluding weekends.
   - **Payroll Engine**: Automated gross/tax/net salary computations integrated with attendance records for pro-rata deductions.
   - **Protected Profile Fields**: Employees can edit self-service fields (phone, address, emergency contact) but cannot modify protected HR data (salary, role, hire date).
3. **Production Security**:
   - **JWT Authentication**: Short-lived access tokens (30 min) with refresh token rotation (7 days).
   - **Password Hashing**: Industry-standard `bcrypt` via `passlib`.
   - **Role-Based Access Control (RBAC)**: Granular permission dependencies enforcing `ADMIN`, `HR_MANAGER`, and `EMPLOYEE` access tiers.
   - **Rate Limiting & Lockout**: Account locking after 5 consecutive failed login attempts.
4. **Advanced Analytics & Charting**:
   - Dedicated `/api/v1/analytics` endpoints returning pre-formatted JSON optimized for frontend charting libraries (Recharts / Chart.js).
   - Metrics include attendance percentages, department headcount distribution, payroll cost trends, and employee growth curves.
5. **Audit Trails & Activity Timelines**:
   - Immutable audit logs capturing JSON snapshots of `old_values` and `new_values` for every administrative write operation.
   - Chronological activity feeds for employee profiles and system-wide dashboards.

---

## 🏗️ Architecture Layout

```text
backend/
├── app/
│   ├── api/v1/              # Presentation Layer (Thin route handlers)
│   ├── core/                # Security, exceptions, response wrappers, middleware
│   ├── db/                  # Async SQLAlchemy engine & session management
│   ├── models/              # SQLAlchemy ORM entities (Database schema)
│   ├── repositories/        # Data Access Layer (Generic & specialized CRUD)
│   ├── schemas/             # Pydantic v2 DTOs (Request / Response validation)
│   ├── services/            # Business Logic Layer (Workflows & rules engine)
│   └── utils/               # Pure utilities (validators, business day calculators)
├── main.py                  # Application factory & ASGI entrypoint
├── seed_db.py               # Demo data generator for hackathon evaluation
├── requirements.txt         # Production dependencies
└── .env.example             # Configurable environment variables
```

---

## 🚀 Getting Started (Zero-Setup Demo)

### 1. Prerequisites
- Python 3.10+ installed on your system.

### 2. Installation
Navigate to the `backend` directory and install dependencies:
```powershell
cd "c:\Users\sivan\OneDrive\Desktop\HR Nexus\HR-Nexus\backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the example environment file:
```powershell
copy .env.example .env
```

### 4. Seed Demo Data
Populate the database with realistic departments, employees, attendance logs, leave requests, and payslips:
```powershell
python seed_db.py
```

### 5. Run the Server
Launch the async Uvicorn development server:
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📚 Interactive API Documentation

Once the server is running, access the auto-generated Swagger UI and ReDoc:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **System Health**: [http://localhost:8000/api/v1/system/health](http://localhost:8000/api/v1/system/health)

### 🔑 Demo Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@hrnexus.com` | `Admin@123456` | Full system access, payroll generation, leave approval |
| **HR Manager** | `hr@hrnexus.com` | `Hr@123456` | Employee onboarding, department management, attendance reports |
| **Employee** | `alex.chen@hrnexus.com` | `Employee@123` | Self-service check-in/out, leave applications, payslip viewing |

---

## 🧪 Standardized API Response Format

Every endpoint returns a consistent JSON envelope:

### Success Response
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  },
  "timestamp": "2026-07-04T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Leave dates overlap with an existing leave request (2026-07-10 to 2026-07-15)",
  "error_code": "LEAVE_OVERLAP",
  "details": {
    "conflicting_dates": "2026-07-10 to 2026-07-15"
  },
  "timestamp": "2026-07-04T10:30:00Z"
}
```

---

## 🛠️ Built With
- **FastAPI**: Async web framework with automatic OpenAPI schemas.
- **SQLAlchemy 2.0 (Async)**: Modern ORM with `aiosqlite` / `asyncpg` support.
- **Pydantic v2**: High-performance data validation and serialization.
- **Python-JOSE & Passlib**: Secure JWT token encoding and bcrypt password hashing.
