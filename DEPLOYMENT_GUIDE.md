# AI-SA-PORTAL – Production Deployment Guide

**Project:** Department Student Information System (AI & DS)  
**Stack:** React 18 (Vite + Tailwind CSS) + Express 5 (Node.js) + MySQL / TiDB (with SQLite zero-config fallback)

---

## Deployment Architecture Options

1. **Option A (Frontend on Vercel + Backend on Render – Recommended):**
   - **Frontend (Vercel):** Lightning-fast global Edge CDN, instant previews, zero build timeouts, automated SSL.
   - **Backend (Render):** Express REST API, background database connections (TiDB Cloud / MySQL), document streaming.
   - Fully configured with CORS whitelisting, cross-domain Bearer auth tokens, and SPA routing.

2. **Option B (All-in-One on Render):**
   - Express server serves both compiled Vite frontend (`dist/`) and `/api` routes from a single Render Web Service.

---

## Method 1: Deploy Frontend on Vercel + Backend on Render (Recommended)

### Step 1: Prepare Your Backend on Render

If your backend is already deployed on Render:
1. Go to your **Render Dashboard** -> Open your Web Service (e.g., `ai-sa-portal` or `aids-portal-api`).
2. Copy your Render backend URL (e.g., `https://your-backend.onrender.com`).
3. Under **Environment**, make sure the following variables are configured:
   - `NODE_ENV` = `production`
   - `TRUST_PROXY` = `1`
   - `JWT_SECRET` = `(your 32+ character random string)`
   - `COOKIE_SECRET` = `(your 32+ character random string)`
   - `CLIENT_URL` = `https://your-frontend-app.vercel.app` *(or comma-separated list of your Vercel domains)*
   - Database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`)
4. *(Optional Build Speedup)*: Since frontend is on Vercel, you can set the **Build Command** on Render to:
   ```bash
   npm run build:backend
   ```
   and **Start Command** to:
   ```bash
   npm start
   ```

---

### Step 2: Deploy Frontend on Vercel

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com) and log in with your GitHub account (`yoges-08`).

2. **Import Your Repository:**
   - Click **Add New...** -> **Project**.
   - Under *Import Git Repository*, locate `yoges-08/AI-SA-PORTAL` and click **Import**.

3. **Configure Project Settings:**
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** Click **Edit** and select or type `frontend` *(Note: If you leave it as `./`, the root `vercel.json` will also build it automatically)*.
   - **Build and Output Settings:** Leave at default:
     - Build Command: `npm run build` (or `vite build`)
     - Output Directory: `dist`
     - Install Command: `npm install`

4. **Add Environment Variable:**
   - Expand the **Environment Variables** section:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://your-backend.onrender.com` *(Replace with your actual live Render backend URL, without trailing slash)*

5. **Deploy:**
   - Click **Deploy**.
   - In ~30–45 seconds, Vercel will build and publish your frontend to a global edge domain (e.g. `https://ai-sa-portal.vercel.app`).

6. **Connect the Backend (CORS Final Step):**
   - Copy your new Vercel production URL (e.g., `https://ai-sa-portal.vercel.app`).
   - In Render Dashboard -> Environment Variables -> update `CLIENT_URL` to include your Vercel URL.
   *(Note: The backend also has automatic regex matching for all `*.vercel.app` domains, so preview and production deployments are accepted automatically).*

---

### Step 3: Setup Supabase Storage (1 GB Free Forever, No Credit Card)

To store student passport photos, Aadhaar cards, marksheets, and bank passbooks permanently without losing them on Render free redeploys:

1. **Create Account & Project:**
   - Create a free account and a new project at [supabase.com](https://supabase.com) (no credit card needed).
2. **Create Private Bucket:**
   - Go to **Storage**, click **New bucket**.
   - Name it `aids-portal-files`.
   - **IMPORTANT:** Keep **Public bucket OFF** (sensitive student documents must remain private).
3. **Get Project URL & Service Role Key:**
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** (e.g. `https://your-project-ref.supabase.co`).
   - Copy the **service_role** key (secret, backend-only). Treat this key like a password.
4. **Configure Environment Variables:**
   - In `backend/.env` (local) and in your Render Dashboard -> **Environment Variables**:
     - `STORAGE_PROVIDER` = `supabase`
     - `SUPABASE_URL` = `https://your-project-ref.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key`
     - `SUPABASE_BUCKET` = `aids-portal-files`
5. **Run Existing File Migration (One-Time):**
   - If you have existing files in your database or disk:
     ```bash
     cd backend
     node scripts/migrate-to-storage.js
     ```
   - To also null existing database binary blobs after confirming storage upload:
     ```bash
     node scripts/migrate-to-storage.js --null-blobs
     ```
6. **Free-Plan Limits & Auto-Keep-Alive:**
   - 1 GB total file storage, 50 MB max per file.
   - Supabase pauses free projects after ~1 week of inactivity; the backend includes an automated keep-alive ping that runs on startup and every 24 hours to prevent dormancy.

---

## Method 2: Deploy All-in-One on Render.com (Single Service)

Render allows you to deploy Node.js web services directly from your GitHub repository for free.

### Step-by-Step Instructions:

1. **Sign in to Render:**
   - Go to [render.com](https://render.com) and sign in using your GitHub account (`yoges-08`).

2. **Create a New Web Service:**
   - On the Render Dashboard, click **New +** → **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Choose your repository: `yoges-08/AI-SA-PORTAL` (click **Connect**).

3. **Configure Service Settings:**
   - **Name:** `aids-portal` (or any name you choose)
   - **Region:** Choose the closest region (e.g., *Singapore* or *Frankfurt*)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / default)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

4. **Add Environment Variables:**
   Under the **Environment Variables** section, add the following key-value pairs:

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & security |
   | `TRUST_PROXY` | `1` | Required for secure cookies & rate limiting behind Render's proxy |
   | `JWT_SECRET` | *(any 32+ character random string)* | E.g. `9f8b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c` |
   | `COOKIE_SECRET` | *(any 32+ character random string)* | E.g. `4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9f8b7c6d5e` |
   | `CLIENT_URL` | `https://your-service-name.onrender.com` | Your live Render URL |
   | `DEFAULT_ADMIN_USERNAME` | `admin` | Initial admin username (created via `node scripts/create-admin.js`) |
   | `DEFAULT_ADMIN_PASSWORD` | *(Set strong password via CLI)* | Initial admin password created via `node scripts/create-admin.js` |

5. **Database Options on Render:**
   - **Option A (Zero-Config SQLite):** If no MySQL variables are provided, the server automatically boots with the built-in SQLite database (`backend/aids_portal.sqlite`). *(Note: On Render Free tier, local disks reset on redeploy. For persistent SQLite, add a Render Persistent Disk mounted at `/opt/render/project/src/backend` or use MySQL below).*
   - **Option B (Free Cloud MySQL – Recommended):**
     Create a free MySQL database on [TiDB Cloud](https://tidbcloud.com), [Aiven](https://aiven.io), or [Clever Cloud](https://www.clever-cloud.com), and add these environment variables:
     ```env
     DB_HOST=your-db-host
     DB_PORT=3306
     DB_USER=your-db-username
     DB_PASSWORD=your-db-password
     DB_NAME=aids_portal
     ```

6. **Deploy:**
   - Click **Deploy Web Service**.
   - Render will build the frontend, install dependencies, and launch the server.
   - Once the status displays **Live**, click the URL (e.g., `https://aids-portal.onrender.com`).

---

## Method 2: Deploy on Railway.app

Railway offers built-in 1-click MySQL databases and effortless GitHub deployments.

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Provision MySQL**.
3. In the same project, click **New** → **GitHub Repo** → select `yoges-08/AI-SA-PORTAL`.
4. In the service settings:
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Under **Variables**, click **Add Reference** to automatically link MySQL variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
6. Add `NODE_ENV=production`, `TRUST_PROXY=1`, `JWT_SECRET`, and `COOKIE_SECRET`.
7. Go to **Settings** → **Generate Domain** to get your public live URL.

---

## Method 3: College Campus Server / Ubuntu VPS / On-Premise Deployment

For colleges running an internal campus server (accessible across college Wi-Fi / LAN or behind a college domain name):

### Prerequisites on Server (Ubuntu / Debian):
```bash
sudo apt update && sudo apt install -y nodejs npm mysql-server git nginx
sudo npm install -g pm2
```

### 1. Clone & Set Up:
```bash
cd /var/www
sudo git clone https://github.com/yoges-08/AI-SA-PORTAL.git
cd AI-SA-PORTAL
```

### 2. Configure Environment:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Fill in your production MySQL credentials, strong JWT/Cookie secrets, and domain URL:
```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_USER=aids_user
DB_PASSWORD=your_secure_password
DB_NAME=aids_portal
JWT_SECRET=generate_strong_secret_here
COOKIE_SECRET=generate_strong_cookie_secret_here
CLIENT_URL=http://your-college-domain-or-ip
```

### 3. Initialize MySQL Database:
```bash
mysql -u root -p
```
```sql
CREATE DATABASE aids_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aids_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON aids_portal.* TO 'aids_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Run schema creation:
```bash
mysql -u aids_user -p aids_portal < backend/schema.sql
node backend/seed.js
```

### 4. Build and Run with PM2:
```bash
npm run build
pm2 start backend/server.js --name "aids-portal"
pm2 save
pm2 startup
```

### 5. Nginx Reverse Proxy (Optional, for port 80 / 443 HTTPS):
Create `/etc/nginx/sites-available/aids-portal`:
```nginx
server {
    listen 80;
    server_name portal.aamec.edu.in; # or your server IP

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/aids-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Method 4: Windows Server Deployment (Local College Server)

1. Install [Node.js (LTS)](https://nodejs.org) and [MySQL Community Server](https://dev.mysql.com/downloads/installer/).
2. Open PowerShell in the project directory:
   ```powershell
   npm run build
   ```
3. Set your production `.env` in `backend/.env`.
4. Install `pm2` globally:
   ```powershell
   npm install -g pm2
   pm2 start backend/server.js --name "aids-portal"
   ```
5. You can now access the portal from any computer on the college network at:
   `http://<SERVER_LAN_IP>:5000` (e.g. `http://192.168.1.100:5000`).

---

## Production Security & Maintenance Checklist

- [ ] **Admin Credentials:** Create your initial administrative user using `node scripts/create-admin.js <username> "<Full Name>" <email> <password>`. Ensure a strong unique password is used.
- [ ] **Production Secrets:** Ensure `JWT_SECRET` and `COOKIE_SECRET` are non-default 32+ character strings.
- [ ] **Database Backups:** Set up an automated daily backup:
  ```bash
  mysqldump -u aids_user -p aids_portal > /backups/aids_portal_$(date +%F).sql
  ```
- [ ] **File Uploads Storage:** Ensure `backend/uploads/` directory is backed up regularly alongside the database so student certificates are never lost.

---

## Switching to Cloudflare R2 Later (Storage Adapter Migration)

The backend is built with a swappable storage adapter in `backend/config/storage.js`. When you are ready to switch from Supabase Storage to Cloudflare R2:

1. **Implement `config/storage.r2.js`:**
   Implement the same interface (`uploadObject`, `downloadObject`, `deleteObject`, `objectExists`, `isConfigured`) using `@aws-sdk/client-s3` with `region: 'auto'` and endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
2. **Set Environment Variables:**
   ```env
   STORAGE_PROVIDER=r2
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   R2_BUCKET=aids-portal-files
   ```
3. **Run One-Time Migration Script:**
   ```bash
   cd backend
   node scripts/migrate-to-storage.js
   ```
   The migration tool will detect `STORAGE_PROVIDER=r2` and copy all objects to Cloudflare R2 automatically and idempotently.
4. **Redeploy:**
   No frontend code or database changes are required because all file access goes through the authenticated `GET /uploads/:filename` route via `config/storage.js`.
