# Delifast — Quickstart

Everything for the platform lives in this one folder, split into the four projects that actually get deployed separately (a Node API can't share a build with an Expo app or a Vite app — this is the real-world equivalent of "one folder").

## 1. Start the database

```bash
docker compose up -d
```

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev        # API on http://localhost:4000
```

Seeding creates two restaurants (matching the reference mockup: Midan Kofta House, Shurba on 26), one preview supermarket vendor, and three test logins — all use password `Password123!`:

| Role | Phone |
|---|---|
| Customer | +201000000000 |
| Vendor owner (Midan Kofta House) | +201000000001 |
| Vendor owner (Nasr City Fresh Market) | +201000000002 |
| Super admin | +201000000009 |

## 3. Customer app (Expo)

```bash
cd mobile-app
npm install
npx expo start     # scan the QR code, or press i / a for a simulator
```

## 4. Vendor dashboard

```bash
cd vendor-dashboard
npm install
npm run dev         # http://localhost:5173 — sign in as the vendor owner above
```

## 5. Admin panel

```bash
cd admin-panel
npm install
npm run dev         # http://localhost:5174
```

Sign in with the super admin phone above and password `Password123!`. Since this is the super admin's first login, you'll be walked through 2FA setup automatically — copy the secret shown into any TOTP app (Google Authenticator, Authy, etc.) and enter the 6-digit code to finish signing in. Every login after that will ask for a fresh code.

## What to try

1. The supermarket vertical is **on by default** in the seed data — open the customer app, and you'll see a "Supermarket" filter chip on Home. Tap it to browse Nasr City Fresh Market (Produce, Dairy, Pantry — with weight and brand shown per item).
2. Sign in to the vendor dashboard as the market owner (+201000000002) to add/edit grocery items — the form adds weight/brand fields automatically for a SUPERMARKET-type vendor.
3. Sign in to the admin panel as the super admin, flip `supermarket_vertical_enabled` off — the chip disappears from the customer app immediately, no redeploy.
4. Sign in to the customer app, browse Midan Kofta House, add a Charcoal Kofta Plate, check out with Cash on Delivery.
5. Sign in to the vendor dashboard as that restaurant's owner (+201000000001), watch the order appear, advance it through Confirmed → Preparing → Ready → Picked up → Delivered.
6. Back in the customer app's Orders tab, watch the live tracker move with it.

See `docs/ARCHITECTURE.md` for the system design and `docs/PRIVACY_POLICY_DRAFT.md` before any app-store submission.
