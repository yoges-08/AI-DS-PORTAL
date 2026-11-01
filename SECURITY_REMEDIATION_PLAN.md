# AI Prompt & Remediation Task: Security & Code Quality Fixes

> **Instructions for the AI Assistant / Developer:**
> You are tasked with resolving security, stability, and code quality findings in the Department Student Information System (`AI&DS PORTAL`).
> Phase 1 tasks (Tasks 1–4) and Phase 2 tasks (Tasks 5–7) have been implemented and verified.
> Please follow the verified specifications below.

---

## Task Checklist

### Phase 1 (Resolved & Verified)
- [x] **Task 1 (RESOLVED):** Fix premature `rejection_reason` nullification in `backend/controllers/studentController.js`
- [x] **Task 2 (RESOLVED):** Move compiler tools to `devDependencies` in `frontend/package.json`
- [x] **Task 3 (RESOLVED):** Remove `'unsafe-eval'` from Content Security Policy in `vercel.json`
- [x] **Task 4 (RESOLVED):** Add in-memory cache for `/api/health` database ping in `backend/server.js`

### Phase 2 (Resolved & Verified)
- [x] **Task 5 (RESOLVED):** Purge expired `auth_lockouts` and `password_resets` in `backend/utils/cleanupJob.js`
- [x] **Task 6 (RESOLVED):** Align student JWT token validity to 24 hours in `verifyEmail` in `backend/controllers/authController.js`
- [x] **Task 7 (RESOLVED):** Sweep orphaned Multer import files in `backend/uploads/temp/` older than 2 hours in `backend/utils/cleanupJob.js`

---

## Detailed Task Specifications

### Task 5: Purge Expired `auth_lockouts` & `password_resets`
* **File:** `backend/utils/cleanupJob.js`
* **Severity:** Low (Resource Availability & Table Hygiene)
* **Problem:** `runPeriodicCleanup()` currently purges unverified accounts and email logs, but failed login/verification attempts in `auth_lockouts` and expired password reset sessions in `password_resets` (`expires_at < Date.now()`) are never deleted. Over months of operation, dead rows accumulate indefinitely.
* **Goal:** Automatically delete expired `auth_lockouts` (older than 24 hours) and expired `password_resets` (older than 2 hours) during the hourly maintenance sweep.

#### Changes Required:
In `backend/utils/cleanupJob.js`, inside `runPeriodicCleanup()`, append the following queries right after step 2 (email logs cleanup):

```javascript
    // 3. Purge expired auth lockouts older than 24 hours
    const oneDayAgoMs = Date.now() - (24 * 60 * 60 * 1000);
    await pool.query(
      'DELETE FROM auth_lockouts WHERE (locked_until_ms > 0 AND locked_until_ms < ?) OR (locked_until_ms = 0 AND first_attempt_ms < ?)',
      [Date.now(), oneDayAgoMs]
    );

    // 4. Purge expired password reset sessions older than 2 hours
    const twoHoursAgoMs = Date.now() - (2 * 60 * 60 * 1000);
    await pool.query(
      'DELETE FROM password_resets WHERE expires_at < ?',
      [twoHoursAgoMs]
    );
```

---

### Task 6: Align Session Token Expiry to 24 Hours in `verifyEmail`
* **File:** `backend/controllers/authController.js`
* **Severity:** Low (Session Policy Consistency)
* **Problem:** In `loginStudent` (line 539) and `COOKIE_OPTIONS` (line 60), student sessions are limited to 24 hours (`24h`). However, in `verifyEmail` (~line 953), the issued JWT token has `{ expiresIn: '7d' }`. If a student uses the Bearer token or overrides cookie settings, their session lasts 7 days instead of the intentional 24 hours.
* **Goal:** Set `{ expiresIn: '24h' }` in `verifyEmail`.

#### Changes Required:
In `backend/controllers/authController.js`, locate `verifyEmail` (~lines 940–955) and update the token signing options:

```javascript
// BEFORE:
    const token = jwt.sign(
      {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        tokenVersion: student.token_version || 1
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

// AFTER:
    const token = jwt.sign(
      {
        id: student.id,
        role: 'STUDENT',
        registerNo: student.register_no,
        name: student.name,
        year: student.year !== null && student.year !== undefined ? student.year : null,
        section: student.section || null,
        tokenVersion: student.token_version || 1
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
```

---

### Task 7: Sweep Orphaned Multer Import Files in `uploads/temp`
* **File:** `backend/utils/cleanupJob.js`
* **Severity:** Informational (Disk Space Protection)
* **Problem:** When administrators upload spreadsheets for bulk imports, Multer saves temporary files in `backend/uploads/temp/`. While regular flows delete the file in `finally`, unexpected crashes or aborts during massive imports leave orphaned files on disk.
* **Goal:** Sweep and delete any file in `backend/uploads/temp/` that is older than 2 hours.

#### Changes Required:
In `backend/utils/cleanupJob.js`:
1. Ensure `path` and `fs` are imported at the top:
```javascript
const path = require('path');
const fs = require('fs');
```
2. Inside `runPeriodicCleanup()`, append the temp file cleanup step:
```javascript
    // 5. Sweep orphaned Multer import files in uploads/temp older than 2 hours
    const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(tempDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > (2 * 60 * 60 * 1000)) { // 2 hours
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          // ignore error if file was already deleted
        }
      }
    }
```

---

## Reference: Phase 1 Implementations (Completed)

<details>
<summary>Click to view completed Task 1-4 details</summary>

### Task 1: Fix Premature `rejection_reason` Nullification
* **File:** `backend/controllers/studentController.js`
* **Status:** Resolved. Lines 412–413 removed from `updateStudentDetails`.

### Task 2: Separate Build Dependencies
* **File:** `frontend/package.json`
* **Status:** Resolved. `vite`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`, and `tailwindcss` moved to `devDependencies`.

### Task 3: Remove `'unsafe-eval'` from CSP
* **File:** `vercel.json` & `frontend/vercel.json`
* **Status:** Resolved. `'unsafe-eval'` removed from `script-src`.

### Task 4: In-Memory Cache for `/api/health`
* **File:** `backend/server.js`
* **Status:** Resolved. 15-second TTL memory cache implemented for DB pings.

</details>

---

## Verification & Testing Steps for Phase 2
1. **Verify Backend Syntax:**
   Run:
   ```bash
   node -c backend/server.js
   node -c backend/utils/cleanupJob.js
   node -c backend/controllers/authController.js
   ```
   Ensure all commands exit with code 0 (zero syntax errors).
2. **Test Cleanup Function:**
   Trigger `runPeriodicCleanup()` in a test script or wait for server startup sweep to confirm database and file deletions execute without errors.
