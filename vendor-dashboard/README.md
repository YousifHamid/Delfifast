# Delifast Vendor Dashboard

Web app (Vite + React) for restaurant/market owners to manage their menu and order queue.

## Setup

```bash
npm install
npm run dev
```

Set `VITE_API_URL` (in a `.env` file) if your backend isn't on `http://localhost:4000`.

## Known v0 limitation

Login state is kept in memory only — refreshing the page logs you out even though the JWT is still in `localStorage`. Before launch, add a bootstrap check on load (`GET /vendor-panel/me` with the stored token) to restore the session automatically.

## Pages

- `/login` — phone + password, rejects non-vendor accounts
- `/orders` — active order queue with one-tap status advance (Confirm → Preparing → Ready → Picked up → Delivered)
- `/menu` — add items, mark items sold out / back in stock
