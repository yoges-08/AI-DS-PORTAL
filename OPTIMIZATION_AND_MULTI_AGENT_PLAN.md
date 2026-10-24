# AI-DS Portal — Optimization & Mobile Report + Multi-Agent Fix Plan

## Part 1 — How to run multiple agents on this file

### 1.0 Rules that apply to EVERY agent (non-negotiable)
1. Work only inside your own file scope (listed in Part 4). If you need a change in a file you do not own, write the request to agents/logs/<your-agent>.md under "Requests to other agents" and continue. Do not edit it.
2. Never touch: .env*, backend/config/secrets.js, auth logic (authController.js, authMiddleware.js, lockout.js, passwordPolicy.js, fieldCrypto.js), package-lock.json (let npm regenerate it), or anything in node_modules/.
3. Do not weaken security. Keep cookies, CORS, CSRF origin check, rate limiters, upload validation, and role checks exactly as they are.
4. Do not add heavy dependencies. Allowed new dependency: compression (backend only). Anything else needs a note in your log and a reason.
5. Small, reviewable commits. One commit per issue ID, message format: perf(P1): lazy-load admin pages.
6. Prove it. After each issue run the checks listed under "Acceptance" for that issue. If a check fails, fix it or revert that commit and note it in your log.
7. Write a log at agents/logs/<agent-name>.md with: issues attempted, files changed, result (done / partial / skipped + why), and anything the next agent must know.
8. Do not delete files unless your section explicitly says so. Dead-code deletion belongs only to Agent 7.
9. Mobile means: test at 360×640, 390×844 and 768×1024 widths.

---

## Part 2 — Audit summary
| Area | Rating | Summary |
| --- | --- | --- |
| Mobile usability | 6.5 / 10 | Good base; gaps in admin pages, forms, tap targets, text size |
| Frontend performance | 5 / 10 | No code splitting, heavy blur/animation, dead code, big logo |
| Backend performance | 6.5 / 10 | No compression/caching; documents stored as DB BLOBs |
| Security & code quality | 8 / 10 | Careful cookies, CORS, CSRF, rate limits, upload checks |

Already good (keep as is): responsive admin student list (cards on mobile), 100dvh on login, reduced-motion handling in login, server pagination + debounced search, strict upload validation, Safari popup workaround for opening documents.

---

## Part 3 — Issues and solutions

### 3.A Frontend performance

#### P1 — No code splitting · Sev High · Owner A4
App.jsx imports every page up front. Lazy-load page components with React.lazy and Suspense.
Also lazy-load the landing page extras (LoginOverlay, Robert) only when !user.

#### P2 — Heavy backdrop-filter blur · Sev High · Owner A3
~64 uses of blur/saturate. Keep blur on desktop, replace with almost-opaque solid on mobile in glass.css:
```css
@media (max-width: 767px), (prefers-reduced-transparency: reduce) {
  .frosted-glass-card, .glass-nav, .glass-card-l1, .glass-card-l2, .glass-dock, .frosted-pill-tag, .apple-modal-backdrop, .apple-modal-card {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  .glass-nav, .glass-dock { background: rgba(250, 249, 254, 0.98); }
  .apple-modal-backdrop { background: rgba(15, 23, 42, 0.60); }
  .apple-modal-card, .frosted-glass-card, .glass-card-l1, .glass-card-l2 { background: rgba(255, 255, 255, 0.98); }
}
```

#### P3 — Many infinite animations · Sev High · Owner A3
CSS: hide decorative layers on small screens and pause when tab is hidden or prefers-reduced-motion.
JS: do not mount LoginParticles (canvas) when window.matchMedia('(max-width: 767px)').matches; cancel rAF on document.visibilitychange.
Robert mascot: on mobile render a static pose (no flight/wobble loops).

#### P4 — Unoptimized logos / images · Sev Med · Owner A4
college-logo.webp is ~77 KB shown at 36-44px; create 96px and 192px versions with srcSet, width, height, decoding="async".
Non-above-the-fold images get loading="lazy". Navbar logo gets fetchpriority="high".

#### P5 — Two render-blocking font requests · Sev Med · Owner A2
index.html loads Inter and Material Symbols Outlined. Replace material-symbols-outlined usage with lucide-react. Remove Material Symbols <link>.

#### P6 — framer-motion used in one file · Sev Low · Owner A4
Ensure framer-motion is isolated to lazy chunks or simplified so it doesn't inflate entry bundle.

#### P7 — Dead / duplicate code · Sev Med · Owner A7
Delete unused components: components/auth/LoginForm.jsx (unused), pages/LoginPage.jsx (unused), LoginHeroArt.jsx, LoginParticles.jsx (if unused by live code), duplicate Robert components. Confirm with grep before deleting.

#### P8 — Little memoization / giant form component · Sev Med · Owner A6
MultiStepForm.jsx: split each step into React.memo components; use useCallback/useMemo; keep text inputs' state local to the step, push on blur or step change.

#### P9 — Custom routing, no Back button / deep links · Sev Med · Owner A7
Sync admin tab state with window.location.pathname via window.history.pushState and popstate event.

---

### 3.B Mobile usability

#### M1 — Text too small · Sev High · Owner A2 (config) + A5/A6 (files)
Add '2xs': ['0.75rem', { lineHeight: '1rem' }] to tailwind.config.js. Replace text-[10px]/text-[11px] with text-xs md:text-[11px].

#### M2 — Inputs under 16px cause iOS zoom · Sev High · Owner A2
In index.css @layer base:
```css
input, select, textarea { font-size: 14px; }
@media (max-width: 767px) {
  input, select, textarea { font-size: 16px !important; }
}
```

#### M3 — Tap targets under 44 px · Sev Med · Owner A2 (global) + A5 (admin)
Add `.tap-target { min-height: 44px; min-width: 44px; }`. Apply to mobile tab strips, pagination buttons, checkboxes.

#### M4 — Admin pages other than the student list not mobile-friendly · Sev High · Owner A5
BulkImportPage, BulkManagePage, AuditLogsPage, ReportsPage: add responsive card/table switching like AdminDashboard.

#### M5 — 100vh problems · Sev Med · Owner A2 + A4 + A5
tailwind.config.js extend minHeight/height with `['100vh', '100dvh']`. Replace max-h-[94vh] with max-h-[94dvh].

#### M6 — Modals not mobile-friendly · Sev Med · Owner A5
Make modals bottom sheets / full screen on small screens with max-h-[92dvh] and sticky headers.

#### M7 — Long form with no draft protection · Sev High · Owner A6
Debounced draft save of non-sensitive fields to localStorage (omit Aadhaar, bank, passwords, cert numbers). Clear on submit/logout.

#### M8 — No safe-area handling · Sev Med · Owner A2 (+ A6)
viewport-fit=cover in index.html, .pb-safe and .pt-safe in css.

#### M9 — Missing input hints · Sev Med · Owner A6
Add type="tel", inputMode="numeric", autoComplete, etc. to form fields.

#### M10 — Photo upload: no camera option, no compression · Sev High · Owner A6
Compress images with canvas before upload in DocumentUploadField.jsx. Add camera capture option.

#### M11 — No PWA basics · Sev Low · Owner A7
Add manifest.webmanifest and theme-color meta tag.

#### M12 — Cold start on free hosting looks like a crash · Sev Med · Owner A4 (UI) + A1 (backend)
Backend /api/health lightweight ping. Frontend show waking-up message after 8s of loading.

---

### 3.C Backend

#### B1 — No response compression · Sev High · Owner A1
Install compression in backend. Mount `app.use(compression({ threshold: 1024 }))` before routes.

#### B2 — Documents stored as DB BLOBs · Sev High · Owner A1
Prefer object storage over file_data in `/uploads/:filename`, stop writing new BLOBs.

#### B3 — No cache headers for documents · Sev Med · Owner A1
Set `Cache-Control: private, max-age=300, must-revalidate` on `/uploads/:filename`.

#### B4 — Database indexes · Sev Med · Owner A1
Add needed composite and single indexes for queries in both MySQL and SQLite schemas.

#### B5 — Connection pool & long exports · Sev Low · Owner A1
Ensure Cache-Control: no-store for exports, document connectionLimit findings.

#### B6 — Dev-only failover code in production API client · Sev Low · Owner A4
Wrap localhost retry in `if (import.meta.env.DEV)`.

---

## Part 4 — Agent definitions

### Agent 1 — Backend (a1-backend) · Wave 1
- **Scope:** backend/** (except .env*, secrets.js, auth files).
- **Issues:** B1, B2, B3, B4, B5, M12 (backend health endpoint).
- **Log:** agents/logs/a1-backend.md

### Agent 2 — Mobile foundation (a2-mobile-foundation) · Wave 1
- **Scope:** frontend/index.html, frontend/src/index.css, frontend/tailwind.config.js, frontend/public/.
- **Issues:** M1 (config only), M2, M3 (global utility), M5 (tailwind config), M8, P5.
- **Log:** agents/logs/a2-mobile-foundation.md

### Agent 3 — Visual effects (a3-effects) · Wave 1
- **Scope:** frontend/src/styles/**, frontend/src/components/LoginParticles.jsx, frontend/src/components/login/**, frontend/src/components/robert/**, frontend/src/components/LoginWelcomeAnimation.jsx, frontend/src/components/MagneticButton.jsx.
- **Issues:** P2, P3.
- **Log:** agents/logs/a3-effects.md

### Agent 4 — Frontend performance (a4-frontend-perf) · Wave 1
- **Scope:** frontend/src/App.jsx, frontend/src/main.jsx, frontend/vite.config.js, frontend/package.json, frontend/src/services/api.js, frontend/src/components/landing/**, frontend/src/components/Navbar.jsx, Footer.jsx, AdminSidebar.jsx, NotFoundPage.jsx, frontend/public/.
- **Issues:** P1, P4, P6, B6, M12 (loading screen UI), M5 (App.jsx dvh).
- **Log:** agents/logs/a4-frontend-perf.md

### Agent 5 — Admin responsive (a5-admin-responsive) · Wave 2
- **Scope:** frontend/src/pages/admin/**, frontend/src/components/StudentDetailModal.jsx, AddStudentModal.jsx, BulkImportModal.jsx, StatusBadge.jsx, ProgressBar.jsx.
- **Issues:** M4, M6, M3 (admin controls), M5 (modal dvh), M1 (for its own files).
- **Log:** agents/logs/a5-admin-responsive.md

### Agent 6 — Student form & uploads (a6-student-form) · Wave 2
- **Scope:** frontend/src/pages/student/**, frontend/src/components/DocumentUploadField.jsx, frontend/src/components/ProgressBar.jsx (read-only).
- **Issues:** M7, M8 (action bar), M9, M10, P8, M1 (for its own files).
- **Log:** agents/logs/a6-student-form.md

### Agent 7 — Cleanup, router, PWA (a7-cleanup-router-pwa) · Wave 2
- **Scope:** frontend/src/App.jsx (routing only), dead-code files in P7, frontend/public/manifest.webmanifest, frontend/index.html (manifest/theme-color).
- **Issues:** P7, P9, M11.
- **Log:** agents/logs/a7-cleanup-router-pwa.md

### Agent 8 — QA & verification (a8-qa) · Wave 3
- **Scope:** Read-only everywhere.
- **Output:** agents/logs/FINAL_REPORT.md.
