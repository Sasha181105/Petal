# Petal

A waste ledger for small flower shops. Florists note discarded stems from a phone
at the counter in a few taps; managers see what gets thrown away, per flower and
per week, and download a PDF report every Monday.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth) ·
Drizzle ORM · Recharts · Motion · Cloudinary · `@react-pdf/renderer` · Vercel

## What it does

- **Waste log**: the core screen. Flower (recent ones one tap away, search, photo
  preview), stems, reason (wilted / damaged / unsold / other), save, with Undo.
- **Weeks**: Monday–Sunday weeks open and close by themselves. Waste can only be
  logged in the open week. A manager can reopen a past week to correct it. Every
  closed week has a PDF report.
- **Dashboard** (managers): headline figures vs the previous period, trend chart,
  the five worst flowers and a table of every flower.
- **Deliveries** (optional, per shop): flower, stems, price per stem, supplier.
  With deliveries on, reports also show **money lost** and **waste rate**. Without
  them Petal counts stems only, because it has no purchase prices.
- **Flowers**: list, card with photo (Cloudinary), rename.
- **Accounts**: managers sign up and get their own shop; staff are added by the
  manager. Includes password reset, password change and sign-in throttling.

## Run it locally

Requires Node.js 20+.

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Under
   *Authentication → Sign In / Providers*, keep Email enabled and leave
   **Allow new users to sign up** on (managers register at `/signup`).
2. **Configure:**

   ```bash
   cp .env.example .env.local   # then fill in the values; each is explained there
   ```

3. **Install and create the tables:**

   ```bash
   npm install
   npm run db:migrate
   ```

4. **Start:**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and create a shop at **Start your shop**. For a shop
   with 90 days of sample data to click around in, run `npm run db:seed`, then sign
   in with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`. The seed is for local
   development only.

## Deploy to Vercel

1. **Rotate the Supabase secret key** if it was ever shared (Supabase → Project
   Settings → API Keys → new secret key; delete the old one).
2. **Import the GitHub repo** in Vercel. It's a standard Next.js project, so no
   build settings are needed.
3. **Environment variables.** Set everything in the **App** block of
   `.env.example`:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable / anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | secret key (server only) |
   | `DATABASE_URL` | Transaction pooler string, port **6543** |
   | `NEXT_PUBLIC_SITE_URL` | the site's address, e.g. `https://petal.example.com` |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary keys |
   | `RESEND_API_KEY` | Resend key with sending access |
   | `EMAIL_FROM` | optional, e.g. `Petal <noreply@your-domain>` |

   `DIRECT_URL` and the `DEMO_*` values are for your computer only.
4. **Deploy.** Migrations run from your computer (`npm run db:migrate`) against the
   same database. They're already applied if you've run the app locally.
5. **Supabase → Authentication → URL Configuration:** set **Site URL** to the Vercel
   address. Add `https://<your-site>/**` (and `http://localhost:3000/**` for local
   work) to **Redirect URLs**.
6. **Smoke test** on the live site: sign up, add a flower, log waste, invite staff,
   and after a Monday download a weekly PDF.

### Email

Petal sends every email itself through **Resend**, from your own domain:
sign-up confirmation, password reset and staff invitations. Supabase only mints
the one-time token (admin `generateLink`, which sends nothing); the link goes
straight to `/auth/confirm`, so it works in any browser or device. Templates live
in `src/lib/email/templates.ts`.

1. In Resend, add and verify your domain (the DNS records it lists).
2. Create an API key with **Sending access** and set `RESEND_API_KEY` (and
   optionally `EMAIL_FROM`) locally and on Vercel.

Supabase's own email templates and SMTP settings aren't used. Each address gets
at most 3 emails per 15 minutes.

## Accounts, roles and passwords

| | Staff | Manager |
|---|---|---|
| Log waste and deliveries, manage flowers and photos | ✓ | ✓ |
| Change own password | ✓ | ✓ |
| Dashboard, weekly PDF reports, money figures | | ✓ |
| Turn features on/off, manage the team, reopen weeks | | ✓ |

- **Manager sign-up** (`/signup`): shop name, currency, email, password. The shop is
  created on first sign-in (after email confirmation, if that's on), and a
  **Welcome** page lists the first steps.
- **Staff** can't sign up. Managers add them in **Settings → Team**, by email
  invitation or with a temporary password.
- **Forgot password** emails a one-time link. After 5 wrong passwords in 15 minutes
  an address is locked for 15 minutes.

## Weeks and reports

Weeks run **Monday to Sunday** in Europe/Dublin time.

- **Logging.** The server only accepts and deletes waste in the open week (or a
  reopened one).
- **Reports.** A closed week's PDF (`/weeks/<monday>/report`) holds:
  - the headline figures vs the week before;
  - the five worst flowers;
  - every flower by reason;
  - every entry with who logged it.
- **Printing.** PDFs and printed pages use a white background.

## Optional deliveries

Purchase prices only exist in deliveries, so the per-shop setting decides whether
Petal shows money:

- **Off: stems only.** Totals, per day, most binned flower, by reason.
- **On: money and waste rate too.**
  - **Money lost** = stems binned × the price paid at that flower's most recent
    delivery on or before the waste date (else the earliest one after it).
  - A flower binned but never delivered has no price. Reports flag it.
  - **Waste rate** = stems binned ÷ stems delivered in the period.

Switching off hides the log and all money figures; nothing is deleted.

## Flower photos

Photos live on Cloudinary; the database keeps only each flower's URL.

- **Upload.** The browser shrinks a photo to 2000 px and uploads it straight to
  Cloudinary with a short-lived server signature. The server only saves uploads
  from the shop's own folder (`petal/<shopId>/`).
- **Display.** Images are served at the size needed, lazy-loaded, with a blurred
  stand-in. Flowers without a photo get a tinted placeholder.

## Database

Schema: [src/db/schema.ts](src/db/schema.ts). After changing it:

```bash
npm run db:generate   # writes a migration to drizzle/
npm run db:migrate    # applies it
```

Every table has a `shop_id`, and every query filters by the signed-in user's shop
(`requireShop()` in [src/lib/shop.ts](src/lib/shop.ts)). Row Level Security is on with
no policies, so the tables can't be reached through Supabase's public REST API.
The app talks to Postgres from the server only.

## Command-line helpers

```bash
npm run db:seed                                       # local sample shop (development only)
npm run user:add -- anna@example.com "password" "Anna's Flowers"   # manager account by hand
```

## Project layout

```
src/
  app/
    page.tsx          home
    login/ signup/ forgot-password/ reset-password/ auth/confirm/
    (app)/            signed-in area
      waste/          waste log (core screen)
      deliveries/     optional delivery log
      flowers/        flower list and cards
      dashboard/      charts and tables (managers)
      weeks/          weeks list and PDF route (managers)
      settings/       account, features, team
      welcome/        first steps for a new manager
  components/         shared UI (flower picker, photos, forms, nav pieces)
  db/                 Drizzle schema and client
  lib/                stats, weeks, PDF, auth helpers, Cloudinary
  proxy.ts            session refresh and auth redirects
scripts/              seed and add-user
drizzle/              SQL migrations
```
