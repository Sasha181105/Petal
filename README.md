# Petal

Waste tracking and inventory for a small flower shop. Staff log deliveries and
discarded stems from a phone at the counter; the dashboard shows waste rate per
flower type, money lost, the worst performers and the trend over time.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth) · Drizzle ORM · Recharts · Vercel

## Setup

Requires Node.js 20+.

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
   Under *Authentication → Sign In / Providers*, keep Email enabled and turn
   **off** "Allow new users to sign up": accounts are created by script.

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

## Adding real users

There's no public sign-up. To give someone access:

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

**Money lost** = stems wasted × the unit cost from that flower's most recent
delivery on or before the waste date.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add these environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `DATABASE_URL` (transaction pooler, port 6543).
   The service role key is only needed locally for scripts.
   - **Public demo:** also set `DEMO_USER_EMAIL` and `DEMO_USER_PASSWORD`. The home page
     then shows a **Try the demo** button that signs visitors into the demo shop.
   - **Real shop:** leave those two unset and the demo button disappears.
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
