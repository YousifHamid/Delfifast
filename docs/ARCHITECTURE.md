# Delifast — Architecture Overview

Cairo-first multi-vendor delivery platform (restaurants now, supermarkets/grocery later) with a customer app, a vendor dashboard, and an admin panel.

## Design principle: vendor type is a config, not a rebuild

Every vendor (restaurant, supermarket, pharmacy later, etc.) is stored the same way. What differs is the `vendorType` and which `productAttributeSchema` its products use. Adding "supermarket" support later means adding a new vendor type + product category tree — no schema migration, no app rebuild.

```
Vendor (id, name, type: RESTAURANT | SUPERMARKET | PHARMACY, city, isApproved, ...)
  -> Category (per-vendor, e.g. "Chargrill", "Dairy", "Produce")
    -> Product (name, price, unit, stock/inStock, attributes JSON)
Order (customer, vendor, items[], status timeline, payment method)
```

`Product.attributes` is a JSON column: a restaurant plate might have `{spice_level, add_ons}`, a supermarket item might have `{weight_kg, brand, expiry_tracked: true}`. This is how one schema serves both verticals.

## Components

1. **Backend API** (Node.js + Express + PostgreSQL, Prisma ORM)
   - Public API: browse vendors/products, place orders, track status
   - Vendor API: manage menu/inventory, view & update orders
   - Admin API: approve vendors, manage users, view all orders, feature flags, audit log
   - Auth: JWT, role-based (customer / vendor_staff / admin / super_admin)

2. **Customer app** — React Native + Expo, Arabic-first RTL (matches your usual stack), Cairo neighborhoods for delivery zones, Cash on Delivery as default payment method with room for card-on-delivery and wallet integration later (InstaPay / Bankak style when you're ready to integrate Egyptian payment rails).

3. **Vendor dashboard** — responsive web app for restaurant/market owners: menu management, order queue, hours, live "accept/reject order" flow.

4. **Admin panel** — separate, more tightly secured web app:
   - Vendor onboarding/approval queue
   - User management (ban/suspend, role changes)
   - Order oversight + dispute handling
   - Audit log of all admin actions
   - Feature flags (e.g. turn on "Supermarket" category platform-wide)
   - 2FA required for admin/super_admin roles; every admin action is logged with actor + timestamp

## Store-readiness checklist (things only you can complete, outside this chat)

- Apple Developer Program account ($99/yr) + App Store Connect listing
- Google Play Console account ($25 one-time) + Play listing
- A published Privacy Policy URL (draft below) and Terms of Service
- Data safety / App Privacy questionnaire in both stores — depends on which real integrations you enable (payments, location, push notifications, analytics)
- Business registration details for Vestra Technology if required by store KYC for the merchant/vendor payout flows
- Real payment processor agreement if you move beyond Cash on Delivery

## Build phases

1. ✅ Architecture + database schema (this message)
2. Backend API (auth, vendors, products, orders, admin) — scaffolded next
3. Customer app screens (matching your Kofta Night / ZAKA-style mockup, rebranded Delifast)
4. Vendor dashboard
5. Admin panel with secure auth + audit log
6. Privacy policy / store listing content
