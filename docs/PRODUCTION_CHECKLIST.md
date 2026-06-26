# DailyWish — Production Readiness Checklist

Work through this before exposing DailyWish to real customers and real orders.

## 🔑 Environment & Secrets
- [ ] `MONGODB_URI` points at a production MongoDB Atlas cluster (IP allow-list / VPC peering configured)
- [ ] `JWT_SECRET` & `JWT_REFRESH_SECRET` are unique 48+ byte random values (NOT the dev defaults)
- [ ] `NEXTAUTH_SECRET` set
- [ ] `NEXT_PUBLIC_APP_URL` & `NEXTAUTH_URL` set to the real HTTPS domain
- [ ] Seeded admin password changed; demo customer removed
- [ ] All secrets stored in the host's secret manager (Vercel env / Docker secrets), never committed

## 💳 Payments
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set (live keys)
- [ ] Stripe webhook endpoint configured & verified
- [ ] PayPal credentials added (if used)
- [ ] COD fee / shipping thresholds reviewed in `src/config/site.ts`

## 📧 Email
- [ ] `EMAIL_PROVIDER` set to `resend` or `smtp` (not `console`)
- [ ] Sending domain verified (SPF/DKIM/DMARC)
- [ ] `EMAIL_FROM` uses the verified domain
- [ ] Test: welcome, verification, password reset, order confirmation, order status emails deliver

## 🛡️ Security
- [ ] HTTPS enforced (HSTS already set via headers)
- [ ] CSP reviewed in `src/middleware.ts`; tighten `script-src` with nonces if feasible
- [ ] Rate limiter backed by Redis/Upstash for multi-instance scale
- [ ] Admin routes verified to reject non-admin sessions (RBAC)
- [ ] Dependency audit clean: `npm audit` (only Next's internal build-time postcss advisory remains)
- [ ] Audit logging confirmed for admin mutations

## 🚀 Performance & SEO
- [ ] `npm run build` succeeds with no type errors
- [ ] Lighthouse: Performance ≥ 95, SEO = 100, Accessibility ≥ 95
- [ ] `sitemap.xml` & `robots.txt` resolve and reference the production domain
- [ ] Product/Organization JSON-LD validates (Google Rich Results Test)
- [ ] Open Graph / Twitter cards preview correctly
- [ ] Images optimized & served via next/image (or Cloudinary)

## 🗄️ Data
- [ ] Catalog seeded (`npm run seed`) against production DB
- [ ] MongoDB indexes built (auto in dev; verify in prod)
- [ ] Automated database backups enabled (Atlas continuous backup)

## ✅ Quality Gates
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` passing
- [ ] `npm run test:e2e` passing against a seeded build
- [ ] CI (GitHub Actions) green on the deploy branch

## 📈 Observability (recommended)
- [ ] Error monitoring (Sentry) wired into `src/app/error.tsx` & API handlers
- [ ] Uptime monitoring on `/` and `/api/auth/me`
- [ ] Analytics (Vercel Analytics / GA4) added

## 🧾 Legal & Business
- [ ] Privacy Policy, Terms, Return Policy reviewed by the business owner
- [ ] Contact details & store locations correct in `src/config/site.ts`
- [ ] Google Maps embeds point to the real store locations
