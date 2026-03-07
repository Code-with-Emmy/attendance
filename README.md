# AttendanceKiosk

### **Face-Verified Attendance for Modern Workplaces**

AttendanceKiosk is a production-grade biometric attendance platform designed for security, trust, and operational efficiency. It transforms standard hardware (tablets, laptops) into super-advanced biometric terminals with liveness detection, real-time reporting, and multi-organization governance.

---

## Overview

The application is organized into four product surfaces:

1.  **Public Site**: A premium, motion-rich marketing and sales surface including pricing, security documentation, and self-serve onboarding.
2.  **Biometric Kiosk**: A futuristic, dark-mode terminal focused on speed and reliability. Uses `face-api.js` for 1:N biometric matching and active liveness verification.
3.  **Admin Control Desk**: The operational hub for organization managers to handle employee enrollment, device management, shifts, alerts, and payroll-ready exports.
4.  **Master Admin (Platform)**: A high-level dashboard for platform owners to manage organizations, monitor global stats, handle billing, and configure system-wide secrets.

---

## ✨ Key Features

-   **Biometric Verification (1:N)**: High-precision face identification without requiring employee passwords or PINs.
-   **Active Liveness Detection**: Advanced spoof-protection layer to ensure only physical subjects can clock in/out.
-   **Dual Billing Engine**: Native support for **Stripe** (International) and **Flutterwave** (African markets) for flexible global scaling.
-   **Master Admin Dashboard**: Global oversight of organizations, active subscriptions, and device health across the platform.
-   **System-Wide Secrets**: Dynamic credential management stored in encrypted database records, prioritized over environment variables.
-   **Role-Based Access (RBAC)**: Secure access tiers for Master Admins, Org Admins, HR, Managers, and Viewers.
-   **Email Infrastructure**: Automated communications for trial welcomes, purchase confirmations, and demo requests via **Resend**.

---

## 🛠️ Tech Stack

-   **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion.
-   **Backend**: Prisma ORM, PostgreSQL (Supabase/Neon), Supabase Auth.
-   **Biometrics**: `face-api.js` with TensorFlow.js.
-   **Payments**: Stripe API, Flutterwave API.
-   **Emails**: Resend + React Email.
-   **Deployment**: Vercel.

---

## 📦 Local Setup

### Prerequisites

-   Node.js 20+
-   PostgreSQL database
-   Supabase project for authentication

### Install

```bash
npm install
```

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure the following:

```bash
# Database & Auth
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Admin & Platform Access
ADMIN_EMAIL="admin@example.com"
ADMIN_EMAILS="admin@example.com,ops@example.com"
MASTER_ADMIN_EMAILS="owner@example.com"
SUPPORT_EMAIL="support@attendancekiosk.com"

# Integration Secrets (Fallback)
PAYMENT_PROVIDER="STRIPE"
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
FLUTTERWAVE_SECRET_KEY="..."
FLUTTERWAVE_WEBHOOK_HASH="..."
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="AttendanceKiosk <onboarding@yourdomain.com>"
```

> [!TIP]
> **Secrets Management**: Sensitive keys can be managed dynamically via the `/master-admin/settings` page. The application prioritizes database-stored secrets over environment variables.

---

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Download Biometric Models**:
    AttendanceKiosk requires pre-trained models for facial recognition.
    ```bash
    npm run models:download
    ```

3.  **Database Setup**:
    ```bash
    npx prisma migrate dev
    npx prisma generate
    npx prisma db seed
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    - Public site: `http://localhost:3000`
    - Kiosk: `http://localhost:3000/kiosk`
    - Admin login: `http://localhost:3000/login`

---

## 🧪 Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run models:download
```

---

## 🗺️ Route Map

### **Public Surface**
-   `/`: Dynamic Landing Page with Biometric Splash
-   `/pricing`: Full Tier Comparison
-   `/security`: Security & Privacy Documentation
-   `/contact`: Sales & Support
-   `/demo`: Request a Platform Walkthrough
-   `/trial`: 14-day Free Trial Onboarding
-   `/purchase`: Self-serve checkout
-   `/login`: Admin sign-in
-   `/forgot-password`: Password reset request
-   `/reset-password`: Password reset completion
-   `/privacy`, `/terms`, `/cookies`: Legal pages
-   `/checkout/success`, `/checkout/cancel`: Checkout result pages

### **Organization Admin (`/admin`)**
-   `/admin`: Workspace Overview
-   `/admin/enroll`: Employee Face Enrollment & Profiles
-   `/admin/history`: Attendance Logs & Activity
-   `/admin/devices`: Kiosk Terminal Management
-   `/admin/payroll`: Exports & Summaries
-   `/admin/shifts`: Shift planning and assignments
-   `/admin/violations`: Policy Alert Monitoring

### **Platform Governance (`/master-admin`)**
-   `/master-admin`: Global Metrics & Stats
-   `/master-admin/organizations`: Tenant Management
-   `/master-admin/subscriptions`: Subscription Billing Overview
-   `/master-admin/devices`: Global device inventory
-   `/master-admin/users`: Platform user oversight
-   `/master-admin/settings`: **System Settings** (Secrets & Whitelists)
-   `/master-admin/audits`: Global Security Logs

### **Biometric Terminal**
-   `/kiosk`: Dedicated Attendance Interface
-   `/attendance`: Legacy route that redirects to `/kiosk`

---

## 🔌 API Surface

The app exposes route handlers for the main product areas:

-   **Admin**: employees, devices, shifts, sessions, history, payroll, violations
-   **Kiosk**: clock-in / clock-out actions and recent kiosk history
-   **Master Admin**: organizations, users, devices, subscriptions, audits, settings, stats
-   **Commercial**: trial signup, demo requests, direct purchase flows, Stripe checkout, Flutterwave and Stripe webhooks
-   **Authentication**: current user lookup, forgot-password, reset-password

Representative routes:

-   `POST /api/kiosk/clock`
-   `GET /api/admin/history`
-   `POST /api/admin/employees`
-   `GET /api/master-admin/stats`
-   `POST /api/trial`
-   `POST /api/demo`
-   `POST /api/purchase/create-intent`
-   `POST /api/purchase/create-checkout-session`
-   `POST /api/webhooks/stripe`
-   `POST /api/webhooks/flutterwave`

---

## 📁 Project Structure

```text
app/                  Next.js pages and API route handlers
components/           UI components for public, admin, and kiosk flows
lib/                  Billing, auth, server utilities, client sync, branding
prisma/               Schema, migrations, and seed data
public/models/        face-api.js model files
tests/                Node-based test coverage
emails/               React Email templates
```

---

## 🔒 Security & Privacy

-   **No Raw Photos**: We store biometric embeddings (mathematical vectors) instead of raw images in the database.
-   **Device Locking**: Kiosks must be activated via short-lived tokens and are bound to specific hardware identifiers.
-   **Encrypted Secrets**: Platform secrets are managed with a hierarchical fallback system to ensure zero-downtime during key rotation.
-   **Email Whitelisting**: Access to administrative roles can be restricted to specific email domains or addresses via the System Admin Whitelist.

---

## ✅ Testing

Run the current automated test suite with:

```bash
npm test
```
