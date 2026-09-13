const express = require('express');
const prisma = require('../config/db');

const router = express.Router();

// Feature flags the customer app is allowed to see — a small, explicit
// allowlist rather than exposing every internal flag publicly.
const PUBLIC_FLAG_KEYS = ['supermarket_vertical_enabled', 'card_on_delivery_enabled'];

router.get('/meta/feature-flags', async (req, res) => {
  const flags = await prisma.featureFlag.findMany({ where: { key: { in: PUBLIC_FLAG_KEYS } } });
  const map = {};
  PUBLIC_FLAG_KEYS.forEach((k) => { map[k] = false; });
  flags.forEach((f) => { map[f.key] = f.isEnabled; });
  res.json(map);
});

// GET /vendors?type=RESTAURANT&city=Cairo&district=Nasr City
router.get('/', async (req, res) => {
  const { type, city, district } = req.query;
  const vendors = await prisma.vendor.findMany({
    where: {
      isApproved: true,
      ...(type ? { type } : {}),
      ...(city ? { city } : {}),
      ...(district ? { district } : {}),
    },
    orderBy: { rating: 'desc' },
  });
  res.json(vendors);
});

// GET /vendors/:id  (menu/catalog with categories + products)
router.get('/:id', async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: { products: { where: { inStock: true } } },
      },
    },
  });
  if (!vendor || !vendor.isApproved) return res.status(404).json({ error: 'Vendor not found' });
  res.json(vendor);
});

module.exports = router;
