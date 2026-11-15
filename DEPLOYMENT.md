# ELDERCARE 360: Vercel & Render Deployment Guide

This guide provides step-by-step instructions for deploying **ELDERCARE 360** to production using **Vercel** (for the React PWA frontend) and **Render** (for the NestJS API, PostgreSQL database, and background worker).

---

## Architecture Overview

```
+-----------------------------------------------------------+
|                      USER (Browser / PWA)                 |
+-----------------------------+-----------------------------+
                              |
       +----------------------+----------------------+
       | Static Assets / SPA                         | API Requests & Auth
       v                                             v
+-----------------------------+        +-----------------------------+
|           VERCEL            |        |           RENDER            |
|                             |        |                             |
|  - React 19 PWA             |        |  - NestJS API (Web Service) |
|  - Vite SPA Bundle          |        |  - Background Worker        |
|  - Client-side Routing      |------->|  - Managed PostgreSQL 16   |
|  - Comfort Profile & Audio  |  CORS  |  - Email Escalation Engine  |
+-----------------------------+        +-----------------------------+
```

---

## Part 1: Deploying the Backend & Database to Render

Deploy Render first so you obtain the live backend API URL to pass to Vercel.

### Option A: 1-Click Deployment via Render Blueprint (`render.yaml`)

The repository includes a ready-to-use [render.yaml](file:///c:/Users/Ramakrishna/OneDrive/Pictures/java/Documents/Projects/MGM/render.yaml) specification:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/ramakrishnanyadav/ElderCare`.
4. Render will detect `render.yaml` and configure:
   - **`eldercare-postgres`**: Managed PostgreSQL 16 database.
   - **`eldercare-api`**: Node.js Web Service running `apps/api`.
   - **`eldercare-worker`**: Background Worker running `apps/worker`.
5. Click **Apply**.
6. Once provisioned, copy the URL of the `eldercare-api` web service (e.g. `https://eldercare-api.onrender.com`).

---

### Option B: Manual Setup via Render Dashboard

If you prefer configuring services individually:

#### 1. Create PostgreSQL Database
- In Render Dashboard, click **New +** > **PostgreSQL**.
- **Name:** `eldercare-postgres`
- **Database:** `eldercare_db`
- **User:** `eldercare_admin`
- **Region:** Choose the region closest to your users (e.g., Oregon or Frankfurt).
- **Plan:** Free or Starter.
- Once created, copy the **Internal Database URL**.

#### 2. Create the API Web Service
- Click **New +** > **Web Service**.
- Select the `ElderCare` GitHub repository.
- **Name:** `eldercare-api`
- **Environment:** `Node`
- **Region:** Same as your database.
- **Branch:** `main`
- **Build Command:**
  ```bash
  pnpm install --no-frozen-lockfile && pnpm run build
  ```
- **Start Command:**
  ```bash
  node apps/api/dist/main.js
  ```
- **Plan:** Free (or Starter).
- **Environment Variables:**
  | Variable | Value |
  |---|---|
  | `NODE_ENV` | `production` |
  | `PORT` | `10000` |
  | `DATABASE_URL` | *(Paste Internal Database URL from step 1)* |
  | `CORS_ORIGIN` | `https://your-eldercare.vercel.app` *(or `*` temporarily)* |
  | `SESSION_SECRET` | *(64-character random string)* |
  | `ENCRYPTION_KEY` | *(32-byte hex string for AES-256-GCM)* |
  | `SMTP_HOST` | *(e.g., smtp.sendgrid.net or smtp.resend.com)* |
  | `SMTP_PORT` | `587` |
  | `SMTP_USER` | *(your SMTP username / api key)* |
  | `SMTP_PASS` | *(your SMTP password / secret)* |
  | `FROM_EMAIL` | `alerts@eldercare360.health` |

#### 3. Run Database Migrations
In the Render dashboard for `eldercare-api`, open the **Shell** tab and execute:
```bash
psql $DATABASE_URL -f infra/init-db.sql
psql $DATABASE_URL -f infra/migrations/001-init.sql
```

---

## Part 2: Deploying the Frontend to Vercel

The React PWA is pre-configured with [vercel.json](file:///c:/Users/Ramakrishna/OneDrive/Pictures/java/Documents/Projects/MGM/vercel.json) to handle Single Page App rewrites and security headers.

### Option A: Deploy via Vercel Web Dashboard (Recommended)

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** > **Project**.
2. Select your repository: **`ramakrishnanyadav/ElderCare`**.
3. In **Project Settings**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `pnpm run build:client`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`
4. Expand **Environment Variables** and add the following keys:
   ```ini
   # Backend API
   VITE_API_BASE_URL=https://eldercare-api.onrender.com/api/v1

   # Firebase Auth & Cloud Firestore
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```
5. Click **Deploy**.
6. Vercel will build the bundle, generate the PWA service worker, and assign a production URL (e.g., `https://eldercare-360.vercel.app`).

---

### Option B: Deploy via Vercel CLI

If you have the Vercel CLI installed locally:

```bash
# 1. Log in to Vercel
pnpm dlx vercel login

# 2. Link and deploy
pnpm dlx vercel

# 3. Add environment variables
pnpm dlx vercel env add VITE_API_BASE_URL production
pnpm dlx vercel env add VITE_FIREBASE_API_KEY production
# (repeat for remaining Firebase vars)

# 4. Deploy to production
pnpm dlx vercel --prod
```

---

## Part 3: Connecting Vercel & Render (CORS & Sync)

Once Vercel issues your live domain (e.g., `https://eldercare-360.vercel.app`):

1. Go to your **Render Dashboard** > **`eldercare-api`** > **Environment**.
2. Update the `CORS_ORIGIN` variable to match your exact Vercel URL:
   ```ini
   CORS_ORIGIN=https://eldercare-360.vercel.app
   ```
3. Click **Save Changes** (Render will automatically redeploy the API).
4. Verify communication by opening the Vercel app in your browser and checking Network requests in DevTools.

---

## Troubleshooting & Verification

| Issue | Cause | Fix |
|---|---|---|
| **API requests fail with CORS error** | `CORS_ORIGIN` on Render doesn't match Vercel origin. | Add `https://<your-project>.vercel.app` to Render's `CORS_ORIGIN`. |
| **Refreshing `/family` or `/caregiver` gives 404** | SPA routing rewrite missing. | Ensure [vercel.json](file:///c:/Users/Ramakrishna/OneDrive/Pictures/java/Documents/Projects/MGM/vercel.json) has the `rewrites` block pointing `/(.*)` to `/index.html`. |
| **First API call takes 30-50s on Render** | Render Free Tier spins down inactive instances. | Normal behavior on Free tier. Upgrade to Starter plan or use an automated uptime monitor pinging `/health`. |
| **PWA not updating after deploy** | Service Worker caching previous build assets. | `autoUpdate` is configured in `vite.config.ts`. Hard refresh (Ctrl+F5) or close all tabs and re-open. |
