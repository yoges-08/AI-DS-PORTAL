# AI Prompt & Remediation Task: Security & Code Quality Fixes

> **Instructions for the AI Assistant / Developer:**
> You are tasked with resolving 4 security and code quality findings in the Department Student Information System (`AI&DS PORTAL`).
> Please execute the exact modifications described below across the 4 target files. Do not alter any unrelated business logic or styling.

---

## Task Checklist
- [ ] **Task 1:** Fix premature `rejection_reason` nullification in `backend/controllers/studentController.js`
- [ ] **Task 2:** Move compiler tools to `devDependencies` in `frontend/package.json`
- [ ] **Task 3:** Remove `'unsafe-eval'` from Content Security Policy in `vercel.json`
- [ ] **Task 4:** Add in-memory cache for `/api/health` database ping in `backend/server.js`

---

## Detailed Task Specifications

### Task 1: Fix Premature `rejection_reason` Nullification
* **File:** `backend/controllers/studentController.js`
* **Severity:** Medium (Business Logic & State Transition Bug)
* **Problem:** When an admin rejects a profile submission with feedback, saving any draft edit in Step 1 (`updateStudentDetails`) immediately clears `rejection_reason` from the database before the student has completed and resubmitted their form.
* **Goal:** 
  1. Remove the line that sets `rejection_reason = NULL` during draft saves.
  2. Only clear `rejection_reason` when the student completes final submission (`submitStudentDetails`).

#### Changes Required:

1. In `updateStudentDetails` (~lines 409-415), **delete** lines 412–413:
```javascript
// DELETE THESE TWO LINES:
setClauses.push("rejection_reason = CASE WHEN ? = 'DRAFT' THEN NULL ELSE rejection_reason END");
values.push(updatedStatus);
```

2. In `submitStudentDetails` (~lines 470-476), update the final submission SQL query to reset `rejection_reason` upon successful re-submission:
```javascript
// BEFORE:
await pool.query(
  `UPDATE students SET status = 'SUBMITTED', submission_date = NOW(), declaration_accepted = 1 WHERE id = ?`,
  [studentId]
);

// AFTER:
await pool.query(
  `UPDATE students SET status = 'SUBMITTED', submission_date = NOW(), declaration_accepted = 1, rejection_reason = NULL WHERE id = ?`,
  [studentId]
);
```

---

### Task 2: Separate Build Dependencies in `frontend/package.json`
* **File:** `frontend/package.json`
* **Severity:** Medium (Supply Chain & Dependency Hygiene)
* **Problem:** Build toolkits (`vite`, `@vitejs/plugin-react`, `postcss`, `autoprefixer`, `tailwindcss`) are placed under `"dependencies"` rather than `"devDependencies"`, causing SCA alerts and unnecessary build overhead.
* **Goal:** Keep only true runtime packages in `"dependencies"` and move all build/bundler packages to `"devDependencies"`.

#### Changes Required:
Update `frontend/package.json` dependencies sections:
```json
  "dependencies": {
    "framer-motion": "^14.6.0",
    "gsap": "^3.15.0",
    "lucide-react": "^1.16.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.186.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^5.4.14"
  }
```

---

### Task 3: Remove `'unsafe-eval'` from Content Security Policy
* **File:** `vercel.json`
* **Severity:** Low (Client-Side Defense-in-Depth)
* **Problem:** The Edge CSP header in `vercel.json` includes `'unsafe-eval'`, which weakens defenses against potential DOM-based script injection. React 18 production builds do not require `eval()`.
* **Goal:** Remove `'unsafe-eval'` from the `script-src` directive in `vercel.json`.

#### Changes Required:
In `vercel.json` under headers (`source: "/(.*)"`), update line 19:
```json
// BEFORE:
"value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://ai-sa-portal.onrender.com; frame-ancestors 'none';"

// AFTER:
"value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://ai-sa-portal.onrender.com; frame-ancestors 'none';"
```

---

### Task 4: Add In-Memory Cache for Health Check Database Ping
* **File:** `backend/server.js`
* **Severity:** Informational (Resource Availability & Connection Pool Protection)
* **Problem:** `GET /api/health` queries `SELECT 1 AS ping` against the database on every request. High-frequency monitoring checks or traffic spikes can exhaust the database connection pool.
* **Goal:** Cache the database ping status in memory with a 15-second TTL.

#### Changes Required:
In `backend/server.js`, replace the `app.get('/api/health', ...)` route (~lines 241-270) with:

```javascript
// In-memory cache for database health check (15-second TTL)
let cachedHealth = { connected: false, mode: getDbMode(), lastChecked: 0 };

app.get('/api/health', async (req, res) => {
  const now = Date.now();
  if (now - cachedHealth.lastChecked > 15000) {
    try {
      const [result] = await pool.query('SELECT 1 AS ping');
      cachedHealth = {
        connected: Boolean(result && result.length > 0),
        mode: getDbMode(),
        database: process.env.DB_NAME || 'aids_portal',
        lastChecked: now
      };
    } catch (dbErr) {
      cachedHealth = {
        connected: false,
        mode: getDbMode(),
        error: process.env.NODE_ENV === 'production' ? 'Database service unavailable' : dbErr.message,
        lastChecked: now
      };
    }
  }

  const statusCode = cachedHealth.connected ? 200 : 503;
  if (!cachedHealth.connected) {
    console.warn(`[Health Warning] Degraded status: DB ${cachedHealth.mode} disconnected.`);
  }

  res.status(statusCode).json({
    status: cachedHealth.connected ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString()
  });
});
```

---

## Verification & Testing Steps
1. **Verify Backend Syntax:**
   Run `node -c backend/server.js` and `node -c backend/controllers/studentController.js` to ensure zero syntax errors.
2. **Verify Frontend Build:**
   Run `npm run build:frontend` from the repository root to verify that moving build tools to `devDependencies` compiles cleanly.
3. **Verify Health Route:**
   Run `curl http://localhost:5000/api/health` twice in succession to confirm fast response from cache.
