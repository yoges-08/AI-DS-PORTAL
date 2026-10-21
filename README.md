# Department Student Information System (AI & DS Department)

An official college department portal modeled on Tamil Nadu's **UMIS (University & Higher Education Management Information System)**. It enables students to submit and track their complete profile particulars, certificates, and government scholarship credentials while providing the department administration with full student lifecycle oversight, record locks, bulk imports, audit logs, and PDF/Excel reports.

---

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS (Inter typography, responsive official government portal theme `#1F3A6E`)
- **Backend:** Node.js + Express (REST API, modular routes and controllers)
- **Database:** MySQL (Prisma ORM schema + native connection pool via `mysql2`)
- **Authentication:** Role-Based Access Control (RBAC) with JWT stored in `httpOnly` secure cookies & Bearer sync
- **File Storage:** Cloudflare R2 (S3-compatible, private bucket, 10 GB lifetime free, $0 bandwidth fees) + Express authenticated streaming
- **Reports:** Server-side Excel exports (`xlsx`) and formatted PDF registers (`pdfkit`)
- **Security:** Bcrypt password hashing, express rate-limiting on authentication, data masking (Aadhaar & Bank Account in list views), administrative audit trail

---

## Directory Structure

```
AI&DS PORTAL/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MySQL pool connection and health check
│   │   └── r2.js                 # Cloudflare R2 object storage client & helpers
│   ├── controllers/
│   │   ├── authController.js     # Student & Admin login/logout, session
│   │   ├── studentController.js  # Profile view, step draft saves, submit, uploads
│   │   ├── adminController.js    # Statistics, filters, lock/unlock, password reset
│   │   └── exportController.js   # Excel (.xlsx) and PDF document generation
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification, RBAC (Student/Admin/Self)
│   │   ├── uploadMiddleware.js   # Multer file storage, MIME and 2MB size filter
│   │   └── rateLimiter.js        # Express rate limiting for auth endpoints
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM schema definition
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── studentRoutes.js      # /api/student routes
│   │   ├── adminRoutes.js        # /api/admin routes
│   │   └── exportRoutes.js       # /api/export routes
│   ├── utils/
│   │   ├── validators.js         # Mobile, Aadhaar, IFSC, Pincode validation & masking
│   │   └── auditLogger.js        # DB logger for administrative actions
│   ├── uploads/                  # Uploaded student certificates & photos
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Local environment configuration
│   ├── package.json              # Backend dependencies and scripts
│   ├── schema.sql                # Standalone MySQL schema definition
│   ├── seed.js                   # Database seed script (1 admin + 10 students)
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── public/
│   │   ├── logo.svg              # Department institutional crest
│   │   └── sample_student_bulk_import.csv
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Official top banner with user session
│   │   │   ├── Footer.jsx            # Department copyright footer
│   │   │   ├── AdminSidebar.jsx      # Left sidebar navigation
│   │   │   ├── ProgressBar.jsx       # 8-step indicator with draft save
│   │   │   ├── StatusBadge.jsx       # Draft, Submitted, Verified, Rejected badges
│   │   │   ├── DocumentUploadField.jsx # Document upload with preview/delete
│   │   │   ├── StudentDetailModal.jsx# Full student profile dossier & actions
│   │   │   ├── AddStudentModal.jsx   # Single student entry modal
│   │   │   └── BulkImportModal.jsx   # Spreadsheet upload modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state provider
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Split layout student/admin login
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.jsx    # Student landing page
│   │   │   │   ├── MultiStepForm.jsx       # 8-step submission form
│   │   │   │   └── ProfileSummaryPrint.jsx # Official printable bio-data slip
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx  # Metrics cards, filtered data table
│   │   │       ├── BulkImportPage.jsx  # Bulk student spreadsheet import
│   │   │       ├── ReportsPage.jsx     # Excel & PDF export center
│   │   │       └── AuditLogsPage.jsx   # Complete security audit logs
│   │   ├── services/
│   │   │   └── api.js                # Frontend API client
│   │   ├── App.jsx                   # Role-based route dispatcher
│   │   ├── index.css                 # Tailwind directives and print styles
│   │   └── main.jsx                  # React application root
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── sample_student_bulk_import.csv     # Sample CSV template for bulk import
├── sample_student_bulk_import.xlsx    # Sample Excel template for bulk import
└── README.md
```

---

## User Roles & Credentials

### 1. Department Administrator
- **Username:** `admin`
- **Password:** `Admin@123`
- **Access:** Complete management of all student cohorts, bulk imports, locking/unlocking records, resetting passwords to Date of Birth, verifying or rejecting submissions, and exporting official PDF/Excel reports.

### 2. Sample Students (10 pre-seeded across Years 1 to 4)

| Register Number | Student Name | Year / Sec | Date of Birth | Login Password (DDMMYYYY) | Community | First Graduate | PMS | Status |
|---|---|---|---|---|---|---|---|---|
| `71762105001` | AARTHI S | 4 - A | `2003-05-14` | `14052003` | BC | Yes | No | SUBMITTED |
| `71762105002` | BALAJI K | 4 - A | `2003-08-22` | `22082003` | MBC | No | Yes (Approved) | VERIFIED (Locked) |
| `71762105003` | CHANDRU M | 4 - B | `2003-11-30` | `30112003` | SC | No | Yes (Disbursed) | VERIFIED (Locked) |
| `71762205015` | DEEPALAKSHMI R | 3 - A | `2004-03-18` | `18032004` | BC | Yes | No | SUBMITTED |
| `71762205022` | ELANGOVAN T | 3 - A | `2004-07-09` | `09072004` | BCM | No | No | DRAFT |
| `71762205035` | HARINI V | 3 - B | `2004-12-25` | `25122004` | OC | No | No | DRAFT |
| `71762305008` | KARTHIK N | 2 - A | `2005-01-15` | `15012005` | MBC | Yes | Yes (Applied) | SUBMITTED |
| `71762305019` | MONISHA P | 2 - B | `2005-06-20` | `20062005` | SCA | Yes | Yes (Approved) | SUBMITTED |
| `71762405004` | NAVEEN KUMAR S | 1 - A | `2006-04-10` | `10042006` | BC | No | No | DRAFT |
| `71762405028` | PRIYADHARSHINI M | 1 - B | `2006-09-05` | `05092006` | DNC | Yes | No | DRAFT |

---

## 8-Step Student Form Architecture

1. **Step 1 - Personal Details:** Full Name, Register Number (read-only), Date of Birth (read-only), Gender, Blood Group, Religion, Community (OC/BC/BCM/MBC/DNC/SC/SCA/ST), Caste, Nationality, Aadhaar Number (12 digits), Mother Tongue, Photo Upload.
2. **Step 2 - Contact Details:** Student Mobile (10 digits), Alternate Mobile, Email, Permanent Address, Communication Address ("Same as permanent" checkbox), District, State, Pincode (6 digits).
3. **Step 3 - Family Details:** Father's Name, Mother's Name, Guardian Name, Parents' Occupation, Parents' Mobile (10 digits), Annual Family Income.
4. **Step 4 - Academic Details:** SSLC & HSC School Name, Board of Examination, Year of Passing, Marks/Percentage, Current Year, Current Semester, Section, Mode of Admission (Govt Quota, Management, Lateral, 7.5% Govt School Quota).
5. **Step 5 - Scholarship & Category:** First Graduate (Yes/No with Tahsildar certificate requirement), Post Matric Scholarship (PMS Yes/No with application number & status), Other Scholarships (NSP, Pragati), Statutory Community & Income certificate details.
6. **Step 6 - Bank Details:** Account Holder Name, Bank Name, Account Number, IFSC Code (11 alphanumeric characters), Branch Name.
7. **Step 7 - Documents Upload (Max 2MB each, PDF/JPG/PNG):**
   - Passport Photograph
   - Aadhaar Card Copy
   - Community Certificate
   - Income Certificate
   - First Graduate Certificate (conditional)
   - Bank Passbook Front Page
   - SSLC (10th) Marksheet
   - HSC (12th) / Diploma Marksheet
8. **Step 8 - Review and Submit:** Full dossier review, mandatory declaration checkbox, and final submission.

---

## Setup & Running Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL**: MySQL 5.7+ / 8.0+ or MariaDB (e.g. MySQL Server, XAMPP, or Docker)

---

### Step 1: Create Database & Setup Backend

1. **Start your MySQL server** (e.g., via XAMPP Control Panel or `net start MySQL80`).
2. **Create the database and schema**:
   You can either import `backend/schema.sql` via MySQL CLI or Workbench:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
   Or create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS aids_portal;
   ```
   And let Prisma push the schema:
   ```bash
   cd backend
   npx prisma db push
   ```

3. **Configure Environment Variables**:
   In `backend/.env`, configure your MySQL database credentials:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=aids_portal
   DB_PORT=3306

   DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/aids_portal"

   JWT_SECRET=super_secret_jwt_key_aids_portal_2026_department_system
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=department_cookie_secret_aids_2026

   CLIENT_URL=http://localhost:5173
   ```

4. **Install Backend Dependencies & Seed Data**:
   ```bash
   cd backend
   npm install
   npm run seed
   ```
   *The seed script creates the default admin (`admin` / `Admin@123`) and 10 realistic students.*

5. **Start Backend Server**:
   ```bash
   npm start
   ```
   *The backend starts at `http://localhost:5000`.*

---

### Step 2: Setup Frontend

1. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

2. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```
   *The application opens at `http://localhost:5173`.*

---

## Testing the Application

1. **Student Workflow:**
   - Go to `http://localhost:5173`.
   - On the login screen, select **Student Login**.
   - Login with:
     - Register Number: `71762105001`
     - Password (DOB): `14052003`
   - Test step-by-step navigation, inline field validations, "Save as draft", document upload, and review.
   - Click **Print Profile Summary** to test the official printable student verification dossier.

2. **Admin Workflow:**
   - Switch to **Admin Login** tab.
   - Login with:
     - Username: `admin`
     - Password: `Admin@123`
   - View top summary metric cards (Total, Submitted, Pending, First Graduates, PMS, Locked).
   - Use search and filter bars (Year, Section, First Graduate, PMS, Status).
   - Click any student row to view full unmasked details, preview documents, lock/unlock record, or reset password to DOB.
   - Click **Export Excel** and **Export PDF** to download live reports.
   - Test **Bulk Import** by uploading `sample_student_bulk_import.xlsx` or `sample_student_bulk_import.csv`.
   - View the **Audit Logs** tab to verify all administrative events are recorded.
