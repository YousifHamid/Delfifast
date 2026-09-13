# Delifast Admin Panel

Secure internal web app for platform operators. Separate app from the vendor dashboard on purpose — keep it on its own subdomain in production (e.g. `admin.delifast.app`) and consider IP allow-listing.

## Setup

```bash
npm install
npm run dev   # runs on :5174 so it can run alongside the vendor dashboard's :5173
```

## Pages

- Vendor approvals — approve or reject new restaurants/markets
- Users — search, suspend, change roles (role changes require SUPER_ADMIN)
- Orders — platform-wide view with status filter
- Feature flags — e.g. turn on the Supermarket vertical instantly, no redeploy
- Audit log — read-only record of every admin action, who did it, and when

## Before launch

- Same session-persistence gap as the vendor dashboard: add a bootstrap check on page load
- Put this behind its own subdomain, separate from the customer-facing app
