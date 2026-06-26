# DailyWish

A modern eCommerce storefront and admin dashboard for **Majid Cosmetics**, a Pakistani skincare brand. Browse products, manage a cart and wishlist, check out (Cash on Delivery or card via Stripe), and manage the store from a secure admin panel.

Built with **Next.js 16** (App Router, React 19), **Supabase Postgres** via Drizzle ORM, Stripe payments, and Cloudinary image hosting. Currency is **PKR**.

## Tech stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Database:** Supabase Postgres + Drizzle ORM
- **Auth:** JWT (jose) + bcrypt, httpOnly cookies
- **Payments:** Stripe (Payment Element + webhook)
- **Images:** Cloudinary
- **UI:** Tailwind CSS + shadcn-style components

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in the values

# 3. Apply the database schema and seed data
npm run db:apply
npm run seed

# 4. Run the dev server
npm run dev
```

Open http://localhost:3000. The app also runs without a database, falling back to a static product catalog.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint |
| `npm run typecheck` | Type-check |
| `npm test` | Unit/integration tests (Jest) |
| `npm run seed` | Seed the database |
| `npm run db:generate` / `db:apply` | Generate & apply migrations |

## Project structure

```
src/
  app/(storefront)   Public store (shop, product, cart, checkout, account)
  app/admin          Admin dashboard
  app/api            Route handlers (auth, checkout, admin, webhooks)
  server/            Request-time data modules (catalog, commerce, payments)
  lib/               Auth, db, payments, cloudinary, validations
  db/schema.ts       Drizzle schema
```

## Environment

See `.env.example` for the full list. Key variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CLOUDINARY_*`.
