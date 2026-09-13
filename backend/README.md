# Delifast Backend

Node.js + Express + PostgreSQL (Prisma ORM) API powering the Delifast customer app, vendor dashboard, and admin panel.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and a real JWT_SECRET
npx prisma migrate dev --name init
npm run dev
```

## Structure

- `src/routes/auth.js` — register/login, issues JWTs
- `src/routes/vendors.js` — public browsing (customer-facing)
- `src/routes/vendorPanel.js` — vendor-owner menu & order management (auth required)
- `src/routes/orders.js` — customer order placement & tracking (auth required)
- `src/routes/admin.js` — admin-only: vendor approval, user management, feature flags, audit log
- `src/middleware/auth.js` — JWT verification + role gating
- `src/middleware/adminAudit.js` — logs every admin action (who/what/when)
- `prisma/schema.prisma` — database schema, vendor-type-agnostic (restaurant today, supermarket/pharmacy later via `VendorType` + `Product.attributes`)

## Security notes before going live

- Restrict `cors()` in `src/index.js` to your actual app/admin-panel origins
- Add stricter rate limiting on `/auth/*` specifically (brute-force protection)
- 2FA is now enforced for ADMIN/SUPER_ADMIN at login (`speakeasy`-based TOTP) — first login walks them through setup automatically, see `src/routes/auth.js`. Nothing left to wire up here before launch.
- Put the admin panel behind its own subdomain and consider IP allow-listing for the admin API in production
- Rotate `JWT_SECRET` via your host's secret manager, never commit `.env`

## Enabling the supermarket vertical later

1. Create vendors with `type: SUPERMARKET`
2. Give them categories like "Produce", "Dairy", "Pantry"
3. Use `Product.attributes` for grocery-specific fields (`weightKg`, `brand`, `expiryTracked`)
4. Flip the `supermarket_vertical_enabled` feature flag on from the admin panel to surface the new vendor type filter in the customer app — no backend redeploy needed
