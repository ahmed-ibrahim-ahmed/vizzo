# Vizzo Platform — Production Deployment Guide

This guide details the step-by-step procedure to transition the Vizzo monorepo from local environments to production-grade architectures.

---

## 1. Production Supabase Provisioning

### A. Project Creation & Credentials
1. Sign in to your [Supabase Dashboard](https://supabase.com).
2. Click **New Project** and select your organization.
3. Configure the database name, securely generate a database password, and choose your region (select a region close to your primary merchant base, e.g. Europe or Middle East).
4. Navigate to **Project Settings > API** to collect:
   - `Project URL` (Production Supabase URL)
   - `anon public` Key (Production Anon Key)
   - `service_role` Key (Keep this extremely secure; only used for server environments if needed)

### B. Database Migration Deployment
Apply migrations in chronological order. You can copy/paste these files directly into the Supabase **SQL Editor**:
1. [001_initial_schema.sql](file:///home/ahmed/vizzo/supabase/migrations/001_initial_schema.sql): Sets up tables (`merchants`, `stores`, `products`, `banner_slots`, `subscriptions`, `analytics`).
2. [002_rls_hardening.sql](file:///home/ahmed/vizzo/supabase/migrations/002_rls_hardening.sql): Restricts reads/writes via strict RLS.
3. [003_discount_cron.sql](file:///home/ahmed/vizzo/supabase/migrations/003_discount_cron.sql): Registers the hourly pg_cron discounting worker.
4. [004_indexing_tuning.sql](file:///home/ahmed/vizzo/supabase/migrations/004_indexing_tuning.sql): Optimizes product search indexes and foreign keys.
5. [005_admin_whitelist.sql](file:///home/ahmed/vizzo/supabase/migrations/005_admin_whitelist.sql): Scaffolds the `admins` table.
   > [!IMPORTANT]
   > Update the email address in `005_admin_whitelist.sql` to your own live administrative Google email so you are immediately whitelisted:
   > ```sql
   > INSERT INTO admins (email) VALUES ('your-admin-email@gmail.com');
   > ```
6. [006_admin_policies.sql](file:///home/ahmed/vizzo/supabase/migrations/006_admin_policies.sql): Enables administrative RLS select/update overrides.

### C. Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project named `Vizzo Production`.
3. Configure the **OAuth Consent Screen** (external) and add scope `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
4. Go to **Credentials > Create Credentials > OAuth Client ID**.
   - Application Type: **Web Application**.
   - Authorized JavaScript origins:
     - `https://dashboard.vizzotrade.com`
     - `https://admin.vizzotrade.com`
   - Authorized redirect URIs:
     - Copy the Redirect URL from your Supabase Dashboard: **Authentication > Providers > Google**.
5. Save the generated `Client ID` and `Client Secret`.
6. Return to your **Supabase Dashboard > Authentication > Providers > Google**:
   - Enable the provider.
   - Paste the `Client ID` and `Client Secret`.
   - Save changes.

---

## 2. Production S3-Compatible Object Storage Setup

You have three excellent options for storing storefront logos and product images. **Options A and B do not require any bank card or credit card to activate.**

### Option A: Supabase Storage (Highly Recommended - No Credit Card Required)
Since you are already setting up a Supabase project, you can use its built-in S3-compatible Object Storage.
1. Sign in to your [Supabase Dashboard](https://supabase.com).
2. Go to **Storage** in the left sidebar and click **New Bucket**.
   - Bucket Name: `vizzo-media`
   - Allowed MIME types: (Leave empty or set to allow images like `image/*`)
   - **Public Bucket:** Enable this toggle (allows storefront buyers to load product images).
3. Go to **Project Settings** (gear icon) > **Storage**.
4. Scroll down to **S3 Access Keys** and click **Generate new key**.
5. Save your credentials immediately:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint:** Copy the S3 endpoint URL (e.g. `https://<PROJECT_REF>.supabase.co/storage/v1/s3`)
   - **Region:** e.g. your project's region (visible on the same settings panel).

### Option B: Backblaze B2 (No Credit Card Required)
Backblaze B2 offers a large **10 GB free tier** and does not require a card to sign up.
1. Sign up for a free account at [Backblaze B2](https://www.backblaze.com/cloud-storage).
2. Go to **Buckets** > **Create a Bucket**:
   - Bucket Name: `vizzo-media`
   - Files in Bucket are: **Public**
   - Click **Create a Bucket**.
3. Go to **Application Keys** and click **Add a New Application Key**:
   - Name: `vizzo-dashboard-uploader`
   - Allow Access to Bucket(s): `vizzo-media`
   - Access Type: **Read and Write**
   - Click **Create New Key**.
4. Copy the keys and connection parameters:
   - **keyID** (Access Key ID)
   - **applicationKey** (Secret Access Key)
   - **S3 Endpoint:** (e.g., `https://s3.us-east-005.backblazeb2.com`)

### Option C: Cloudflare R2 (Requires Card for Verification)
If you have a card available later, Cloudflare R2 has a **10 GB free tier** and zero egress fees.
1. In Cloudflare, go to **R2 Object Storage** and click **Create Bucket** (`vizzo-media`).
2. Go to the bucket's **Settings** tab and enable the **R2.dev Subdomain** or connect a custom domain (e.g. `media.vizzotrade.com`) to allow public read access.
3. Go to **R2 Overview** > **Manage R2 API Tokens** > **Create API Token** with Edit permissions.

---

## 3. Production Environment Files (.env)

Configure variables for each package in their respective build settings or `.env` files.

### A. Landing Package (`packages/landing/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### B. Dashboard Package (`packages/dashboard/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Storage Configurations (Supabase Storage / Backblaze B2 / any S3)
VITE_S3_ACCESS_KEY_ID=your-s3-access-key-id
VITE_S3_SECRET_ACCESS_KEY=your-s3-secret-access-key
VITE_S3_BUCKET_NAME=vizzo-media
VITE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
VITE_S3_REGION=your-bucket-region # e.g., us-east-1 (or global)
# Optional: Full public URL for images. For Supabase, you can use:
# VITE_S3_PUBLIC_URL=https://your-project.supabase.co/storage/v1/object/public/vizzo-media

# (Optional: Only if you chose Cloudflare R2 in Option C)
# VITE_R2_ACCOUNT_ID=your-cloudflare-account-id
# VITE_R2_ACCESS_KEY_ID=your-r2-access-key-id
# VITE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
# VITE_R2_BUCKET_NAME=vizzo-media
# VITE_R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev
```

### C. Admin Package (`packages/admin/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### D. Storefront Package (`packages/storefront/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 4. Cloudflare Pages & Wildcard DNS Routing

We deploy the client packages to **Cloudflare Pages** for global edge loading speeds.

### A. Repository Connection
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **Workers & Pages**.
2. Click **Create Application > Pages > Connect to Git**.
3. Select your GitHub repository (`vizzo`).

### B. Build Settings for Each App

| Project App | Custom Domain | Build Command | Output Dir |
| :--- | :--- | :--- | :--- |
| **vizzo-landing** | `vizzotrade.com` <br> `www.vizzotrade.com` | `pnpm --filter @vizzo/landing run build` | `dist` |
| **vizzo-dashboard** | `dashboard.vizzotrade.com` | `pnpm --filter @vizzo/dashboard run build` | `dist` |
| **vizzo-admin** | `admin.vizzotrade.com` | `pnpm --filter @vizzo/admin run build` | `dist` |
| **vizzo-storefront** | `*.vizzotrade.com` *(Wildcard)* | `pnpm --filter @vizzo/storefront run build` | `dist` |

> [!TIP]
> **Environment Variables on Cloudflare**:
> Under each Pages project settings (**Settings > Environment Variables**), configure the matching Supabase/Tebi variables for `Production` and `Preview` environments.
> Add the variable `NODE_VERSION = 22` to ensure Cloudflare builds compile on our Node.js runtime.

### C. Setting Up Wildcard Subdomains on Cloudflare DNS
To ensure that typing `https://[store-slug].vizzotrade.com` immediately loads the storefront, set up wildcard DNS mapping:
1. In Cloudflare, go to **Websites > vizzotrade.com > DNS**.
2. Click **Add Record**:
   - Type: `CNAME`
   - Name: `*` (represents wildcards)
   - Target: `vizzo-storefront.pages.dev` (your Cloudflare Pages project domain)
   - Proxy Status: **Proxied** (orange cloud)
   - Save the record.
3. Next, navigate to your **vizzo-storefront** Pages Project settings:
   - Go to **Custom Domains > Set up a custom domain**.
   - Type `*.vizzotrade.com`.
   - Save and authorize Cloudflare to generate the SSL certificate (this covers all subdomains automatically!).

---

## 5. Production Optimization Enhancements

To make the storefront resolve subdomains seamlessly in production, we will apply a code enhancement to `@vizzo/storefront` that automatically extracts the store slug from the browser hostname.

### Active Subdomain Resolution Code (Injected into App.tsx)
Instead of relying strictly on routing params `/:slug`, the app extracts the slug directly from the hostname.
For example:
- `https://my-store.vizzotrade.com` → slug is `'my-store'`.
- `https://vizzotrade.com/my-store` (fallback) → slug is `'my-store'`.
- `localhost:3000/my-store` (dev fallback) → slug is `'my-store'`.
