# DailyWish — Premium Skincare eCommerce

> Enterprise-grade storefront & admin dashboard for **DailyWish** (by Majid Cosmetics) — built with Next.js 16, TypeScript, MongoDB, Tailwind CSS & a shadcn-style UI kit.

DailyWish is a full-featured, production-oriented eCommerce platform for a real Pakistani cosmetics brand. Customers can browse the Vitamin C skincare range, filter & search, add to cart/wishlist, check out (Cash on Delivery / Stripe / PayPal-ready) and manage their account & orders. Administrators get a secure dashboard with full CRUD, analytics and audit logging.

---

## ✨ Features

### Storefront
- Modern animated homepage — hero carousel, featured / best-sellers / new arrivals, categories, testimonials, newsletter
- Shop with advanced filtering (category, price), sorting, full-text search & pagination
- Rich product pages — gallery, variants, reviews, related products, JSON-LD
- Cart & wishlist (persisted, instant) with a slide-out cart drawer
- Checkout — address, coupon codes, COD/Stripe/PayPal, server-side re-pricing (anti-tampering)
- Customer accounts — orders, order tracking, addresses, profile & password
- Content — About, Contact (with store locator + maps), Privacy, Terms, Return Policy

### Admin Dashboard (`/admin`)
- Secure, role-gated (RBAC: `super_admin`, `admin`, `customer`)
- Analytics — revenue, sales, product/customer/order stats & charts
- Full CRUD — products, categories, orders, customers, reviews, coupons, banners, testimonials, settings
- Inventory & image management, order status workflow, review moderation
- Audit log of all privileged actions

### Platform
- **Auth** — JWT access/refresh tokens, httpOnly cookies, bcrypt hashing, email verification, password reset, session invalidation
- **Security** — Zod validation, request/response sanitization (NoSQL-injection safe), CSP & security headers, rate limiting / brute-force protection, env validation
- **SEO** — dynamic metadata, Open Graph, Twitter cards, JSON-LD, sitemap, robots, canonical URLs
- **Performance** — Server Components, ISR, image optimization, code splitting, standalone output
- **Email** — pluggable provider (Resend / SMTP / console) with transactional templates
- **Payments** — modular provider layer (Stripe / PayPal / COD)

---

## 🧱 Tech Stack

| Layer       | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 16 (App Router) · React 19                |
| Language    | TypeScript (strict)                               |
| Styling     | Tailwind CSS · shadcn-style components · Radix UI |
| Animation   | Framer Motion                                     |
| Database    | Supabase Postgres + Drizzle ORM                   |
| Auth        | jose (JWT) · bcryptjs                             |
| Validation  | Zod                                               |
| Email       | Resend / Nodemailer (SMTP)                        |
| Payments    | Stripe (PayPal/COD ready)                         |
| Testing     | Jest · React Testing Library · Playwright         |
| Deploy      | Vercel / Docker                                   |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20 (22 recommended)
- A **Supabase** project (or any Postgres 14+). Get the connection string from
  Supabase → Project Settings → Database → Connection string (Transaction pooler).

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Set at minimum `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
Use the Supabase Transaction-pooler URI (port 6543):
```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```
Then create the schema and seed:
```bash
npm run db:push   # apply src/db/schema.ts to the database
npm run seed      # load the catalog + bootstrap admin
```
> 💡 You can run the app with **no database** — it falls back to the built-in static catalog so the storefront still renders. Set `DATABASE_URL` to unlock auth, orders, reviews & the admin dashboard.

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### 3. Seed the database
```bash
npm run seed
```
This loads the real DailyWish catalog (products, categories, banners, testimonials, coupons) and creates:
- **Admin:** `admin@dailywish.pk` / `Admin@12345`
- **Customer:** `customer@dailywish.pk` / `Customer@123`

### 4. Run
```bash
npm run dev
```
- Storefront → http://localhost:3000
- Admin → http://localhost:3000/admin (sign in with the admin account)

---

## 📜 Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start dev server                         |
| `npm run build`       | Production build                         |
| `npm start`           | Run the production server                |
| `npm run seed`        | Seed catalog + admin/customer            |
| `npm run create-admin -- <email> <password> [role]` | Create/promote an admin |
| `npm run lint`        | ESLint                                   |
| `npm run typecheck`   | TypeScript check                         |
| `npm test`            | Jest unit/integration tests              |
| `npm run test:e2e`    | Playwright E2E                           |

---

## 🖼️ Product Images

The brand product photography lives in `public/`:
- `public/products/` — product images (face wash, serum, creams, etc.)
- `public/banners/` — hero & promo banners
- `public/testimonials/` — customer avatars
- `public/originals/` — all original source uploads

The catalog (`src/data/catalog.ts`) references these paths. To swap to Cloudinary, set the `CLOUDINARY_*` env vars and update image URLs.

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (storefront)/      # Customer-facing pages (header/footer layout)
│   ├── (auth)/            # Login, register, password flows
│   ├── admin/             # Secure admin dashboard
│   ├── api/               # Route handlers (auth, products, checkout, admin…)
│   ├── sitemap.ts robots.ts manifest.ts
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn-style primitives
│   ├── layout/            # Header, footer, cart drawer
│   ├── storefront/        # Product cards, hero, sections…
│   ├── admin/             # Admin widgets & charts
│   └── providers/         # Cart, wishlist, theme contexts
├── lib/                   # auth, jwt, db (Drizzle), env, validations, api, email, payments, seo
├── db/schema.ts           # Drizzle schema (12 Postgres tables, jsonb for embedded objects)
├── server/                # Data-access (catalog, commerce, audit)
├── data/catalog.ts        # Canonical catalog (seed + offline fallback)
├── config/site.ts         # Business info (single source of truth)
└── types/                 # Shared domain types
```

---

## 🐳 Docker

```bash
# Build & run app + Postgres together
JWT_SECRET=... JWT_REFRESH_SECRET=... NEXTAUTH_SECRET=... ADMIN_PASSWORD=... docker compose up --build
```
Then seed inside the container or against the exposed Postgres at `localhost:5432`.

---

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Add all env vars from `.env.example` in the Vercel dashboard.
3. Use your **Supabase** Postgres for `DATABASE_URL` in production (Transaction pooler URL).
4. Deploy. Apply the schema and seed once against your Supabase DB (`npm run db:push && npm run seed` locally pointed at it).

See [`docs/PRODUCTION_CHECKLIST.md`](docs/PRODUCTION_CHECKLIST.md) before going live.

---

## 🔐 Security Notes
- Rotate `JWT_SECRET` / `JWT_REFRESH_SECRET` and change the seeded admin password immediately in production.
- The default rate limiter is in-memory; use Redis/Upstash for multi-instance deployments.
- CSP is set in `src/middleware.ts` — tighten `script-src` with nonces for maximum strictness.

---

## 📞 Business

**DailyWish** by Majid Cosmetics
📧 Kashifkhaan777@gmail.com · 📱 03135119536
🏬 Nawaz Khan Plaza, Link Road, Swabi · Khan Cloth Tower, Moqam Chowk, Mardan

---

_Built with care. © DailyWish._
