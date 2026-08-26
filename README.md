# UBBIM Corporate CRM

Production-ready corporate CRM for UBBIM to manage vendors, contractors, company profiles, documents, CIDB records, projects, activities, payments, notifications, reports, and audit logs.

## Stack

- Next.js 16 (App Router) + TypeScript + React
- Tailwind CSS + shadcn/ui
- Supabase PostgreSQL, Auth, Storage, RLS, Realtime
- Stripe Checkout + webhooks
- SMTP via Nodemailer
- Vercel deployment

A dedicated Supabase project named **UBBIM CRM** (`fxsdcrihxxyavauhafdv`, region `ap-southeast-1`) has been provisioned and migrated.

## Features

- Role-based access: Super Admin, Admin, Staff, Management
- Vendor and contractor registers with company profiles and tabs
- Document expiry engine (90 / 60 / 30 days + expired)
- Project management and CRM activity timeline
- Stripe payments with webhook updates to `crm_payments`
- SMTP branded email templates
- In-app notifications (header + Realtime-ready table)
- CSV / Excel / PDF reports
- Database audit triggers + audit log UI
- Storage RLS on the private `crm-documents` bucket

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Copy `.env.example` to `.env.local` for local secrets. Production public Supabase keys live in `.env.production` (loaded by Vercel/`next build`):

- `NEXT_PUBLIC_SUPABASE_URL` — must be `https://<project-ref>.supabase.co` (not `//host` and not `/rest/v1/`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon key) or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only — Stripe webhooks, user creation, document expiry cron)

4. Optional integrations:

- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Cron: `CRON_SECRET`

5. Start the app:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) after the terminal prints `Ready`. Keep that terminal open.

## First Super Admin

The first Auth user created in this project is automatically provisioned as an **active Super Admin**.

Create that user in the Supabase dashboard (**Authentication → Users → Add user**) or from the CRM **Users** screen after you have a service role key.

Subsequent sign-ups are created as inactive Staff until a Super Admin activates them.

## Database

SQL migrations live in `supabase/migrations/`:

1. `202608190001_crm_schema.sql`
2. `202608190002_crm_functions.sql`
3. `202608190003_crm_rls.sql`
4. `202608190004_crm_storage_seed.sql`

These have already been applied to the UBBIM CRM Supabase project. To apply them to another project:

```bash
npx supabase db push
```

or run the files in the SQL editor in order.

Authorization is stored in `crm_profiles.role` (never in user-editable `user_metadata`). Staff can only access assigned companies or companies where they are PIC. Management is read-only.

## Stripe

1. Create a Checkout session from **Payments → Collect payment**.
2. Point the Stripe webhook to `https://<your-domain>/api/stripe/webhook`.
3. Events handled: `checkout.session.completed`, async success/failure, expiry, and refunds.
4. The webhook verifies the Stripe signature, then updates Supabase through `crm_apply_payment_status` using the service role key.

Never expose `STRIPE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Email and document expiry

System emails are sent only from server routes/actions. Configure SMTP for:

- Welcome / password reset
- Vendor and contractor registration
- Approval and rejection
- Document expiry reminders
- Payment confirmations
- Project / system notices

Vercel Cron calls `/api/cron/document-expiry` daily at 01:00 UTC. Protect it with `Authorization: Bearer $CRON_SECRET`.

## Vercel, GitHub, and Supabase

These dashboard steps cannot be completed from CI. Use the UBBIM Vercel account and the existing Supabase project **UBBIM CRM** (`fxsdcrihxxyavauhafdv`). Do not create a second Supabase project.

### 1. Connect GitHub → Vercel

1. Open [New Project](https://vercel.com/new) and sign in.
2. Import `ubbimsupport/ubbim-crm` (authorize the Vercel GitHub app for the `ubbimsupport` org if asked).
3. Production branch: `main`. Framework: Next.js (auto-detected).
4. Deploy. Later pushes to `main` become production; pull requests get preview URLs.
   Public Supabase keys are in committed `.env.production`, so the Vercel build can sign in without dashboard env vars. Still add `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) in Vercel for webhooks, user creation, and expiry cron.

### 2. Connect Supabase → Vercel

1. In the Vercel project: **Integrations** → install [Supabase](https://vercel.com/marketplace/supabase/supabase).
2. Choose **Connect existing project**, not a new database.
3. Select **UBBIM CRM** (`fxsdcrihxxyavauhafdv`).
4. Confirm env sync includes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The app also accepts `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` (Vercel marketplace names).
5. Set `NEXT_PUBLIC_APP_URL` to the production `https://…vercel.app` (or custom domain). Add `CRON_SECRET` for document-expiry. SMTP and Stripe remain optional.
6. Redeploy Production.

### 3. Connect GitHub → Supabase

1. Open [Project Settings → Integrations](https://supabase.com/dashboard/project/fxsdcrihxxyavauhafdv/settings/integrations).
2. **Authorize GitHub**, then **Authorize Supabase** on GitHub.
3. Repository: `ubbimsupport/ubbim-crm`. Working directory: `.`
4. Enable **Deploy to production** so `supabase/migrations` on `main` apply to the hosted database.
5. In **Authentication → URL configuration**, set Site URL to the Vercel production origin and add:
   - `https://<prod>/auth/callback`
   - `https://<prod>/reset-password`

Webhook URL after deploy:

```text
https://<project>.vercel.app/api/stripe/webhook
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Navigation

Dashboard, Vendors, Contractors, Contacts, Projects, Documents, Activities, Payments, Notifications, Reports, Users, Audit Logs, Settings.
