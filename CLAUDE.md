# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**DailyWish** — enterprise eCommerce storefront + admin dashboard for **Majid Cosmetics**. Next.js 16 (App Router, React 19), **Supabase Postgres via Drizzle ORM**, Stripe payments, Cloudinary images. Currency is **PKR**.

## Commands

```bash
npm run dev            # next dev
npm run build          # next build (works without a DB — see gotchas)
npm run start          # next start
npm run lint           # eslint .
npm run typecheck      # tsc --noEmit
npm test               # jest (unit/integration/component)
npm run test:e2e       # playwright
npm run seed           # tsx scripts/seed.ts (reseeds Supabase from src/data/catalog)
npm run create-admin   # tsx scripts/create-admin.ts
npm run db:generate    # drizzle-kit generate (SQL migration from src/db/schema.ts -> supabase/migrations)
npm run db:push        # drizzle-kit push (apply schema to DATABASE_URL)
npm run migrate:images # local images -> Cloudinary
```

DB schema lives in `src/db/schema.ts` (Drizzle). Migrations are emitted to `supabase/migrations/` and can also be applied with the Supabase CLI (`npx supabase db push` on a linked project).

Before declaring work done, run `npm run typecheck && npm run lint && npm test`. All three currently pass clean — keep them that way.

## Architecture

- `src/app/(storefront)/*` — public store (shop, product, cart, checkout, account, wishlist).
- `src/app/admin/(dashboard)/*` — admin UI; `(dashboard)/layout.tsx` calls `requireRole()`.
- `src/app/api/**` — route handlers. `api/admin/*` (admin), `api/auth/*`, `api/account/*`, public.
- `src/lib/` — `api.ts` (`handler()` wrapper + `parseBody` + `sanitize` + `takeOne`), `auth.ts`, `jwt.ts` (jose), `db.ts` (Drizzle/postgres-js, lazy+cached `getDb()`), `env.ts`, `rate-limit.ts`, `validations.ts` (zod), `cloudinary.ts`, `email/`, `payments/`.
- `src/server/` — request-time data modules: `commerce.ts` (re-pricing, coupons), `catalog.ts`, `settings.ts`, `audit.ts`.
- `src/db/schema.ts` — Drizzle schema: 12 Postgres tables. UUID `id` PKs are exposed to the API as `_id` strings by serializers (the external contract is unchanged from the Mongo era). Embedded value-objects (product images/variants, user addresses, order items/statusHistory, SEO) are `jsonb` columns.

## Conventions (match these)

- **Every API write** goes through `handler()` + `parseBody()` (zod validation + `sanitize()` strips `$`/`.` keys — now defense-in-depth; Drizzle queries are parameterized). Never spread `req.body` into inserts/updates; map fields explicitly. Use `getDb()` from `@/lib/db`; wrap single-row `.returning()` results with `takeOne()`.
- **DB access** — `getDb()` returns a cached Drizzle handle (throws `DatabaseUnavailableError` when `DATABASE_URL` is unset). Any `[id]`/FK value used in a query must be UUID-validated first (a non-uuid string throws at Postgres) — see the `UUID_RE` guards. Admin text search escapes `%`/`_` before `ilike` (no ReDoS / wildcard smuggling).
- **Every admin route** must call `requireRole()`; account/order routes call `requireUser()` and scope queries to `session.id` (no IDOR).
- **Never trust client prices.** Checkout re-prices server-side via `server/commerce.ts priceCartItems` and re-validates coupons; order insert + stock/sold decrement + coupon usage run in a Drizzle `db.transaction(...)`. Keep it that way.
- Password hashes / tokens live on the `users` row but are NEVER returned — serializers/responses select only safe fields. Never `select()` the whole row into a response without stripping `passwordHash` and token columns.
- Auth cookies: `httpOnly`, `secure` in prod, `sameSite:'lax'`. JWT HS256 via `jose` with `tokenVersion` revocation.

## Gotchas

- **Edge middleware import trap** — `src/middleware.ts` runs on the edge runtime. Import ONLY from `@/lib/jwt` (pure jose). Never import `@/lib/auth`, `@/lib/db`, `@/db/schema`, `drizzle-orm`, `postgres`, or bcrypt there; `isAdminRole` is inlined deliberately.
- **DB-less build** — `getDb()` is lazy; never call it at module top level. Build/SSR must work with `DATABASE_URL` unset (falls back to the static catalog).
- **Supabase pooler — use the SESSION pooler (port 5432), NOT transaction (6543)** for this long-lived Node server. The transaction pooler is for serverless (ephemeral connection per invocation); from `lib/db.ts`'s persistent pool it rotates/kills backends underneath the client, so after the first burst every connection is a dead socket and queries hang indefinitely (proven: 8/8 → 0/8 across 5 rounds on 6543; 8/8 every round on 5432). Same host `aws-1-<region>.pooler.supabase.com`, user `postgres.<project-ref>`, just port 5432. `prepare:false` is kept as a safe default (and is mandatory if anyone repoints at 6543). Switch back to 6543 ONLY for a serverless deploy. A wrong host prefix gives `tenant ... not found`; URL-encode password specials (`@` → `%40`).
- **Stale-connection hangs** — the pool MUST set `idle_timeout`/`max_lifetime`/`connect_timeout` (see `lib/db.ts`). Without them, the network/pooler silently drops idle connections and `postgres.js` hangs on the dead socket until the OS TCP timeout (~60–120s) — symptom was `/admin` taking 72s as stuck connections exhausted the pool. The DB region is ap-south-1 (Mumbai); ~2–4s per dashboard load is geographic latency × ~10 queries, not a bug. A stalled query can still hang up to the server `statement_timeout` (default 2min) — mitigated by a `statement_timeout='20s'` role default + an 8s client-side timeout in `server/catalog.ts withDb` + a crash guard in `src/instrumentation.ts` that swallows late postgres.js connection rejections so they can't kill the process.
- **Applying schema** — `drizzle-kit push` introspection FAILS over the transaction pooler (silent exit). Use `npm run db:generate` (emit SQL → `supabase/migrations/`) then `npm run db:apply` (`scripts/db-apply.ts` runs the SQL via the same prepare:false postgres.js connection that works). `db:apply` is idempotent only for fresh DBs (plain `CREATE TABLE`).
- **Cloudinary** — content images live on Cloudinary (`res.cloudinary.com` is in `next.config.mjs` remotePatterns); brand assets stay local in `public/`. Admin uploads go through `/api/admin/upload` (returns a secure URL; **the `public_id` is NOT persisted** — only the URL is stored on the product). Product writes clean up orphaned Cloudinary assets via `server/media.ts purgeUnusedImages(urls)` (reconstructs public_ids with `lib/cloudinary.ts publicIdFromUrl()`, destroys via `deleteImagesByUrl()` — best-effort, never blocks the write, skips non-Cloudinary URLs, keeps any URL still referenced by another product). Wired into BOTH `DELETE` (all images) and `PATCH` (only images removed/replaced during the edit) of `/api/admin/products/[id]`. Run it AFTER the row write so the still-referenced check sees the final catalog.
- **Next 16 / React 19** — note edge-runtime constraints and Next 16 lint rules.

## Audit backlog (2026-06-24)

Full audit done — storefront is feature-complete and safe, but the online-payment path is non-functional and a few prod-hardening items remain. Work top-down.

### 🔴 Broken / incomplete
1. ✅ **Stripe card payment — IMPLEMENTED (2026-06-26).** Checkout now: creates order + PaymentIntent → shows Stripe **Payment Element** (`components/checkout/stripe-payment-form.tsx`) → `confirmPayment` with a `return_url` to `/checkout/success`. Settlement is server-side only: webhook `api/webhooks/stripe` (authoritative; needs `STRIPE_WEBHOOK_SECRET`) **and** `api/checkout/confirm` (re-verifies the PaymentIntent on return, so it works in local dev without a webhook) — both funnel through `server/payments.ts markOrderPaid` (idempotent). The success page never trusts `redirect_status`. Currency is PKR (works in Stripe test mode; account is US/USD). REMAINING: order + stock decrement still happen at order creation, so an abandoned card payment leaves a `pending`/unpaid order with stock already taken (see #7 — add a reaper or defer the decrement until `paid`).
2. **Email verification is cosmetic** — no `/api/auth/verify-email` route; verify page fakes success from a query param; `isEmailVerified` never set, never enforced. Implement the route + enforce it.
3. **PayPal is a stub** — returns fake `pp_<orderNumber>`; either implement or remove from the checkout method list.
4. **Wishlist persistence** — the dead `models/Wishlist.ts` was removed during the Postgres migration (a `wishlists` table exists in `src/db/schema.ts` but is unused). Wishlist is still localStorage-only; wire up the table or drop it.

### 🟠 Hardening
5. **Demo admin creds everywhere** — `admin@dailywish.pk / Admin@12345` printed on admin login page + defaulted in `env.ts`, `seed.ts`, `docker-compose.yml` (+ `NEXTAUTH_SECRET=changeme`). Remove defaults; require env in prod.
6. **JWT secret validation bypassed** — `env.ts` is only imported by `cloudinary.ts`; `jwt.ts` reads `process.env` directly. Run env validation at startup (`instrumentation.ts`); require secrets unconditionally.
7. **Checkout race/integrity** — order insert + stock/sold decrement + coupon usage now run in a Drizzle `db.transaction(...)` (✅ atomic). STILL TODO: no `stock >= qty` guard on the decrement (oversell) — add a conditional `WHERE stock >= qty` update; and no idempotency key (double-submit dupes orders).
8. **Rate limiter weak** — in-memory (fails multi-instance) + trusts spoofable `x-forwarded-for`; `reset-password` and `change-password` unthrottled. Move to Redis/KV; add limits.
9. **Coupon `perUserLimit` unenforced**; `usedCount` check is racy.
10. **Regex DoS** — ✅ fixed in the Postgres migration: admin search now uses `ilike` with `%`/`_`/`\` escaped (see `likeEscape` in the admin route files).
11. **CSP `script-src 'unsafe-inline'`** in all envs; move to nonce/hash.

### 🧪 Tests (5 files / 176 sources)
Money path untested. Add (priority order): checkout re-pricing, coupon DB enforcement, auth/JWT rotation + `tokenVersion`, then `api/**` handlers. For real DB tests use a disposable Postgres (Testcontainers / `pglite` / a Supabase test schema) against the Drizzle schema.

### Docs
README overstates wishlist persistence + "PayPal (ready)"; `test:cloudinary`/`test:stripe`/`migrate:images` scripts undocumented.

## Fixes applied (2026-06-26)

Debugging session — login/redirect, DB connection stability, and admin/customer routing. All changes verified with `npm run typecheck` + `npm run lint` (0 errors).

1. **DB connection: switched to the SESSION pooler (port 5432).** Root cause of intermittent query hangs / `canceling statement due to statement timeout` (57014) / `unhandledRejection` crashes: `DATABASE_URL` used the **transaction pooler (6543)**, which is for serverless. From this long-lived server's persistent pool, Supavisor rotates/kills backends → dead sockets → queries hang after the first burst. Proven: 8/8→0/8 over 5 rounds on 6543 vs 8/8 every round (~155ms) on 5432. Fix: `DATABASE_URL` now uses `:5432`. **Use 6543 only for a serverless deploy.** (See the Supabase pooler gotcha above.)
2. **`src/instrumentation.ts` + `src/instrumentation-node.ts` (new).** Process-level crash guard: swallows ONLY transient postgres.js connection/timeout rejections (so a pooler blip can't kill the Node 22 process, which crashes on unhandledRejection by default); re-throws anything else so real bugs aren't masked. Node-only code is in `instrumentation-node.ts`, dynamically imported only when `NEXT_RUNTIME === 'nodejs'` (a bare `process.on` in `instrumentation.ts` breaks the Edge bundle).
3. **DB `statement_timeout` role default = 20s.** Ran `ALTER ROLE postgres SET statement_timeout = '20s'` on the DB so no query can hang for the Postgres default of 2min. (`SET`/startup-param timeouts don't stick through the pooler; the role default does.)
4. **`server/catalog.ts withDb()` — 8s client-side timeout** racing each catalog query, so a stalled DB falls back to the static catalog fast instead of blocking the page. The abandoned (losing) promise gets a `.catch(()=>{})` so it can't surface as an unhandled rejection.
5. **Login redirect race fixed.** `src/app/(auth)/login/page.tsx` and `src/app/admin/login/page.tsx` replaced `router.push(dest); router.refresh()` with `window.location.assign(dest)` — the soft push + refresh raced and stranded users on `/login` after a successful login. Full-page nav also lets the fresh session cookie flow through middleware cleanly. Removed now-unused `useRouter` imports.
6. **Admin can no longer see the customer dashboard.** `src/app/(storefront)/account/layout.tsx` now redirects admin/super_admin to `/admin` (covers direct nav, stale `?redirect=/account` after login, and header links). `src/components/layout/site-header.tsx` dropdown shows only "Admin Dashboard" for admins (hides customer "My Account"/"My Orders").
7. **Env cleanup.** Region corrected to **ap-south-1 (Mumbai)** (was wrongly noted as Sydney). The live Supabase project ref is **`zgijnujugwkweouzbrna`**; stale `NEXT_PUBLIC_SUPABASE_*` keys that pointed at a different project (`xoquiwbsubijzxcaxanm`) were corrected to match (those keys are unused — the app talks to Postgres directly via Drizzle).

Note: this partially addresses Hardening #6 — `instrumentation.ts` now exists, but it does the crash guard, NOT startup env validation. Wiring `env.ts` validation into instrumentation is still TODO.

9. **Provisional online orders (hide unpaid, defer stock).** Online-payment orders (stripe/paypal) are now provisional until paid: (a) `server/orders.ts placedOrderCondition()` — COD OR `paymentStatus IN (paid,refunded)` — filters them out of the customer orders API, admin orders list, and admin dashboard stats (recent orders, order count, status breakdown, revenue series) so abandoned/failed card attempts don't pollute dashboards; (b) the checkout transaction now commits stock/sold + coupon usage ONLY for COD — for online orders that's deferred to `markOrderPaid` (in a `FOR UPDATE` txn, idempotent across webhook+confirm), so an abandoned card payment never eats stock or burns a coupon. Partially closes Hardening #7 (the abandoned-order stock leak); the `stock >= qty` oversell guard is still TODO. NOTE: pre-existing orphan orders created before this change already decremented stock under the old path — they're now hidden but their stock wasn't restored.

8. **Real Stripe card payment + order linkage.** Installed `@stripe/stripe-js` + `@stripe/react-stripe-js`. New: `lib/stripe-client.ts` (memoized browser Stripe), `components/checkout/stripe-payment-form.tsx` (Payment Element + `confirmPayment`), `server/payments.ts` (`markOrderPaid`/`markOrderPaymentFailed`/`confirmStripeOrder` — idempotent, the only place payment status flips to paid), `api/webhooks/stripe` (raw-body signature verify; authoritative), `api/checkout/confirm` (return-from-Stripe re-verification so it works without a webhook locally). Checkout page shows a card step for `stripe`; COD/PayPal unchanged. Success page (now a client component) re-verifies the intent server-side and clears the cart. **CSP:** `middleware.ts buildCsp()` MUST allow Stripe — `script-src https://js.stripe.com`, `frame-src https://js.stripe.com https://hooks.stripe.com`, `connect-src https://api.stripe.com` — else Stripe.js fails to load ("Failed to load Stripe.js") and the card form never mounts. `stripe-client.ts` resolves to null (not reject) on load failure and the form shows a graceful error. **Order linkage:** new `server/orders.ts claimGuestOrders(userId,email)` called from register + login so guest orders (placed with `userId=null`) attach to the account by email — fixes "ordered as guest, no orders after signing up". Existing orphan orders attach on the customer's next login.
