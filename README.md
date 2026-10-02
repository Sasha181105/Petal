# Petal

Waste tracking and inventory for a small flower shop. Staff log deliveries and
discarded stems from a phone at the counter; the dashboard shows waste rate per
flower type, money lost, the worst performers and the trend over time.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · Drizzle ORM · Recharts · Vercel

## Setup

Requires Node.js 20+.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
   Under *Authentication → Sign In / Providers*, keep Email enabled and leave
   **"Allow new users to sign up" on**: shop managers register at `/signup`.

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the values. Each one is described in `.env.example`.

3. **Install, migrate, seed**

   ```bash
   npm install
   npm run db:migrate   # creates the tables
   npm run db:seed      # demo shop + demo login + ~90 days of data
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`.

## Flower photos (Cloudinary)

Photos are stored on [Cloudinary](https://cloudinary.com), not in the repo or database.
The database keeps only each flower's `photo_url` and `photo_public_id`.

1. Create a free Cloudinary account.
2. Under **Settings → API Keys**, copy the cloud name, API key and API secret into
   `.env.local` (see `.env.example`).
3. Restart `npm run dev`.

How it works:
- **Upload.** The browser shrinks the photo to at most 2000 px, then uploads it
  straight to Cloudinary using a short-lived signature from the server. The API
  secret never reaches the browser.
- **Checks.** The server only saves an upload that sits in that shop's folder
  (`petal/<shopId>/`). Replacing or removing a photo deletes the old image.
- **Display.** Cloudinary serves each size on demand (32–56 px thumbnails, up to
  1200 px on the flower card) in WebP/AVIF. Images lazy-load, and a ~1 KB blurred
  copy shows until they arrive.
- **Without photos.** Flowers without a photo get a tinted placeholder. If the
  Cloudinary keys aren't set, uploads are hidden and everything else works.

## Weeks and weekly reports

Weeks run **Monday to Sunday** (Europe/Dublin) and open and close by themselves.

- **Logging:** waste can only be logged in the **open week**. The server checks this,
  not just the date picker. Entries in closed weeks can't be deleted.
- **Corrections:** a **manager** can reopen a past week on the **Weeks** page, then
  close it again.
- **Reports:** every closed week has a **PDF report**, from `/weeks/<monday>/report`.
  It holds the headline figures vs the week before, the five worst flowers, every
  flower by reason, and every entry with who logged it.

The PDF is rendered on the server with `@react-pdf/renderer`, using the TTF fonts in
`src/assets/fonts`.

## Accounts, roles and passwords

| | Staff | Manager |
|---|---|---|
| Log waste and deliveries, manage flowers | ✓ | ✓ |
| Change own password | ✓ | ✓ |
| Dashboard, weekly PDF reports, money figures | | ✓ |
| Turn features on/off, manage the team, reopen weeks | | ✓ |

- **Managers sign up themselves** at `/signup` (shop name, currency, email,
  password). The account becomes the manager of a new shop, created on first
  sign-in. If Supabase asks people to confirm their email, the shop is created
  after they follow the link. A short **Welcome** page lists the first steps.
- **Staff can't sign up.** Managers add them in **Settings → Team**, either by
  emailing an invitation or by setting a temporary password to hand over in person.
- **Forgot password:** the link on the sign-in page emails a one-time link.
- **Sign-in protection:** after 5 wrong passwords in 15 minutes, that email is
  locked for 15 minutes.

**Supabase setup for email links** (password reset, invitations):
1. **Authentication → URL Configuration:** set **Site URL** to your site. Add
   `http://localhost:3000/**` and `https://<your-site>/**` to **Redirect URLs**.
2. **Email templates.** In **Authentication → Emails → Templates**, paste the Petal
   templates from `supabase/templates/`. Each file's first comment gives its subject
   line:
   - `confirm-signup.html` → **Confirm signup**
   - `invite.html` → **Invite user**
   - `recovery.html` → **Reset password**
3. **Email delivery.** Supabase's built-in email is for testing only: it sends a
   few emails an hour and only to your Supabase team's addresses. For real staff,
   add your own SMTP under **Authentication → Emails → SMTP Settings** (for example
   Resend or Postmark). Until then, use **Set a password now** when adding staff.

## Adding users from the command line

Normally managers sign up at `/signup` and add their own staff. For setting up a
shop by hand, this creates a manager account:

```bash
npm run user:add -- anna@example.com "a-strong-password" "Anna's Flowers"
```

This creates the shop if it doesn't exist and links the user to it. Without the
shop name, the user joins the only existing shop.

## Database

The schema is in [src/db/schema.ts](src/db/schema.ts). After changing it:

```bash
npm run db:generate   # writes a new SQL migration to drizzle/
npm run db:migrate    # applies it
```

Every table has a `shop_id`, and every query filters by the signed-in user's shop
(`requireShop()` in [src/lib/shop.ts](src/lib/shop.ts)). Row Level Security is on with
no policies, so the tables can't be reached through Supabase's public REST API.
The app connects to Postgres directly from the server only.

## Optional deliveries

Waste logging works on its own. The delivery log is an optional feature, turned
on per shop in **Settings** (off for new shops). While it's off, the Deliveries
tab explains what it adds and offers **Get started**.

Purchase prices only exist in deliveries, so the setting decides whether Petal
shows money at all:

- **Deliveries off: stems only.** The dashboard, weekly PDFs, home page, Weeks page
  and flower cards count stems binned (total, per day, most binned flower, by
  reason). No prices are asked for or shown.
- **Deliveries on: money and waste rate too.**
  - **Money lost** = stems binned × the price from that flower's most recent
    delivery on or before the waste date (else the earliest one after it).
  - If a flower was binned but never delivered, it has no price. The dashboard and
    PDF flag it, because money lost undercounts it.
  - **Waste rate** = stems binned ÷ stems delivered in the period.

Switching deliveries off hides the log and every money figure. Nothing is deleted:
switch it back on and the figures return.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add these environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `DATABASE_URL` (transaction pooler, port 6543).
   The service role key is only needed locally for scripts.
   - **Real shop:** that's all. Visitors see a **Sign in** button only.
   - **Public demo:** also set `PUBLIC_DEMO=true`, `DEMO_USER_EMAIL` and
     `DEMO_USER_PASSWORD`. The home page then shows **Open the demo shop**, which
     signs visitors into the demo shop, and the demo shop's weekly figures.
3. Deploy. Run migrations and seed from your machine against the same database.

## Screenshots

_To be added once the screens are built._

## Project layout

```
src/
  app/
    login/            sign-in page and auth actions
    (app)/            signed-in area with bottom nav
      waste/          waste log (core screen)
      deliveries/     delivery log
      dashboard/      charts and tables
  db/                 Drizzle schema and client
  lib/                Supabase client, shop scoping
  proxy.ts            session refresh and auth redirects (Next.js middleware)
scripts/              seed and add-user CLI scripts
drizzle/              generated SQL migrations
```
