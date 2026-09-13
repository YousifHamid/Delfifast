# Delifast — Going Live: Exact Manual Requirements

This is the precise list of things that need a human to do them — accounts to create, values to generate, commands to run once, in order. Everything else in this repo is code I've already written; this document is the part that has to happen outside a chat window.

---

## 1. Accounts you need (in order of urgency)

| Account | Cost | Needed for |
|---|---|---|
| A hosting provider for the backend (Render, Railway, or Fly.io all work with the included `Dockerfile`) | Free tier exists, ~$7–25/mo for always-on | Running the API |
| A managed Postgres database (Render/Railway/Fly.io all offer one; or Supabase/Neon) | Free tier exists, ~$7–15/mo for production | Data storage |
| A domain name (e.g. `delifast.app`) | ~$10–15/yr | Public URLs for the API, admin panel, vendor dashboard |
| Apple Developer Program | $99/yr | Publishing the iOS app |
| Google Play Console | $25 one-time | Publishing the Android app |
| Expo/EAS account (free tier is enough to start) | Free, paid tiers speed up builds | Building the iOS/Android binaries |

Optional but expected soon:
- A payment processor with an Egypt-compatible integration (e.g. Paymob, Fawry) — only needed once you move past Cash on Delivery
- An SMS provider (Twilio, or a local Egyptian SMS gateway) for OTP verification and order notifications, if you want that (not built yet)

---

## 2. Domain & DNS (manual, ~15 minutes)

Buy the domain, then create these DNS records pointing at whatever your hosting provider gives you (each provider's dashboard shows you the exact value to use):

| Subdomain | Points to | Purpose |
|---|---|---|
| `api.delifast.app` | Your backend host | The Express API |
| `app.delifast.app` (optional) | Static host for a marketing page, or skip if mobile-only | Public-facing site |
| `vendor.delifast.app` | Static host for `vendor-dashboard/` build output | Restaurant/market owners |
| `admin.delifast.app` | Static host for `admin-panel/` build output | Your ops team only |

Most hosting providers (Render, Vercel, Netlify) issue free SSL certificates automatically once DNS is pointed at them — no manual certificate work needed.

---

## 3. Generate real secrets (manual — do this once, store in a password manager)

```bash
# Generates a strong random string for JWT_SECRET
openssl rand -base64 48
```

Never reuse the placeholder value in `.env.example`. Store the real value only in your hosting provider's environment variable settings — never commit it to git (the included `.gitignore` already excludes `.env`).

---

## 4. Environment variables to set on the backend host

Set these in your hosting provider's dashboard (Render/Railway/Fly.io all have an "Environment Variables" section):

| Variable | Example value | Notes |
|---|---|---|
| `DATABASE_URL` | provided by your Postgres host | Copy exactly as given |
| `JWT_SECRET` | output of the `openssl` command above | Keep secret, rotate if ever leaked |
| `JWT_EXPIRES_IN` | `7d` | How long a login session lasts |
| `NODE_ENV` | `production` | Enables the stricter CORS check |
| `PORT` | usually set automatically by the host | Leave unset unless your host requires it |
| `ALLOWED_ORIGINS` | `https://vendor.delifast.app,https://admin.delifast.app` | **Required in production** — comma-separated, no spaces, no trailing slash. Add your mobile app's web fallback origin too if you build one. |

---

## 5. Deploy the backend (manual, first time only)

Using the included `Dockerfile`:

1. Push this repo to a GitHub repository (private is fine)
2. In your hosting provider, create a new service from that repo, pointing at the `backend/` folder
3. Set the environment variables from step 4
4. Deploy — the Dockerfile's `CMD` automatically runs `prisma migrate deploy` on every deploy, so your schema stays in sync
5. Confirm it's alive: `curl https://api.delifast.app/health` should return `{"status":"ok","env":"production"}`

---

## 6. Create your first real admin account (manual, one command)

There is deliberately no API endpoint that can create an admin — only a script you run directly against the production database, once:

```bash
# From your local machine, with DATABASE_URL pointed at production,
# or via your host's "run a one-off command" feature:
node backend/scripts/create-admin.js "Your Full Name" "+20xxxxxxxxxx" "a-strong-password-12-chars-min"
```

Then log in to `admin.delifast.app` with that phone/password — you'll be walked through mandatory 2FA setup automatically.

---

## 7. Onboard your first real vendor (manual, until you build a self-serve signup flow)

Right now, creating a vendor + linking a staff account happens directly via the database or a script modeled on `backend/prisma/seed.js`. Practical path for launch day:
1. Have the restaurant/market owner register a normal account in the customer app (or via `POST /auth/register`)
2. As the super admin, use Prisma Studio (`npx prisma studio` pointed at production `DATABASE_URL`) to: create their `Vendor` row, set `isApproved: true`, and create a `VendorStaff` row linking their user to that vendor with role `VENDOR_OWNER`
3. They can now log in to `vendor.delifast.app`

This manual step is worth automating into a proper "vendor signup + admin approval" flow before you have more than a handful of vendors — happy to build that next if useful.

---

## 8. Deploy the two web dashboards (manual, ~10 minutes each)

Both are static builds:

```bash
cd vendor-dashboard && npm install && npm run build   # outputs dist/
cd admin-panel && npm install && npm run build         # outputs dist/
```

Push `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, or your backend host's static-site feature). Set the build-time env var `VITE_API_URL=https://api.delifast.app` for both.

---

## 9. Build and submit the mobile apps (manual, follow in order)

```bash
cd mobile-app
npm install -g eas-cli
eas login
eas build:configure          # links this project to your Expo account, fills in eas.json's projectId
```

Then edit `mobile-app/eas.json` and `app.config.js`:
- Replace `REPLACE_WITH_YOUR_EAS_PROJECT_ID` with the real ID `eas build:configure` gives you
- Fill in your Apple Team ID, App Store Connect app ID, and Apple ID email in `eas.json`
- Add a `google-play-service-account.json` (downloaded from Google Play Console → API access) next to `eas.json`

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

Before this step, in the App Store Connect and Play Console dashboards (manual, ~30–60 minutes each, first time only):
- Create the app listing (name "Delifast", category Food & Drink)
- Upload screenshots (take them from a build via `eas build --profile preview`)
- Paste your published privacy policy URL (host `docs/PRIVACY_POLICY_DRAFT.md`, filled in, at `delifast.app/privacy`)
- Fill in the App Privacy (Apple) / Data Safety (Google) questionnaires — see the notes at the bottom of `docs/PRIVACY_POLICY_DRAFT.md`
- Both stores will manually review the first submission — Apple typically 1–3 days, Google a few hours to a few days

---

## 10. Before you flip the switch — final checklist

- [ ] `ALLOWED_ORIGINS` set in production (requests will fail without it)
- [ ] Real `JWT_SECRET` generated and set (not the placeholder)
- [ ] First super-admin created via the script, not the API
- [ ] 2FA completed for that super-admin
- [ ] Database backups enabled on your Postgres host (usually a one-click toggle — check daily automatic backups are on)
- [ ] Privacy policy published at a live URL and reviewed by someone familiar with Egyptian data protection law (Law No. 151 of 2020) — the draft in `docs/` is a starting structure, not legal sign-off
- [ ] Decide your actual delivery zones/cities before onboarding vendors outside Cairo — the schema supports it, nothing else needs to change

---

## What's still code, not a manual step, if you want it next

- Self-serve vendor signup with an admin-approval queue (removes the Prisma Studio step in §7)
- Push notifications for order status changes (Expo push tokens — a few hours of work)
- Real payment integration (Paymob/Fawry) once you're ready to move past Cash on Delivery
- Rider/courier assignment flow (currently order status is vendor-driven only; no rider app exists yet)
