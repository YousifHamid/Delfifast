const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('VENDOR_OWNER', 'VENDOR_STAFF'));

// Confirms the logged-in vendor staff belongs to the vendor they're editing.
async function assertOwnsVendor(userId, vendorId) {
  const link = await prisma.vendorStaff.findUnique({
    where: { userId_vendorId: { userId, vendorId } },
  });
  return !!link;
}

const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  attributes: z.record(z.any()).optional(),
});

// Which vendor(s) the logged-in staff member manages — dashboard uses this
// right after login to know which vendor to load.
router.get('/me', async (req, res) => {
  const links = await prisma.vendorStaff.findMany({
    where: { userId: req.user.id },
    include: { vendor: true },
  });
  res.json(links.map((l) => l.vendor));
});

const categorySchema = z.object({ name: z.string().min(1) });

router.post('/vendors/:vendorId/categories', async (req, res) => {
  const { vendorId } = req.params;
  if (!(await assertOwnsVendor(req.user.id, vendorId))) {
    return res.status(403).json({ error: 'Not your vendor' });
  }
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const count = await prisma.category.count({ where: { vendorId } });
  const category = await prisma.category.create({
    data: { vendorId, name: parsed.data.name, sortOrder: count + 1 },
  });
  res.status(201).json(category);
});

router.post('/vendors/:vendorId/products', async (req, res) => {
  const { vendorId } = req.params;
  if (!(await assertOwnsVendor(req.user.id, vendorId))) {
    return res.status(403).json({ error: 'Not your vendor' });
  }
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.create({
    data: { vendorId, ...parsed.data },
  });
  res.status(201).json(product);
});

router.patch('/vendors/:vendorId/products/:productId', async (req, res) => {
  const { vendorId, productId } = req.params;
  if (!(await assertOwnsVendor(req.user.id, vendorId))) {
    return res.status(403).json({ error: 'Not your vendor' });
  }
  const partialSchema = productSchema.partial().extend({ inStock: z.boolean().optional() });
  const parsed = partialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.update({
    where: { id: productId },
    data: parsed.data,
  });
  res.json(product);
});

// Order queue for the vendor: accept / move through statuses
router.get('/vendors/:vendorId/orders', async (req, res) => {
  const { vendorId } = req.params;
  if (!(await assertOwnsVendor(req.user.id, vendorId))) {
    return res.status(403).json({ error: 'Not your vendor' });
  }
  const orders = await prisma.order.findMany({
    where: { vendorId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_PICKED_UP', 'DELIVERED', 'CANCELLED']),
});

router.patch('/vendors/:vendorId/orders/:orderId/status', async (req, res) => {
  const { vendorId, orderId } = req.params;
  if (!(await assertOwnsVendor(req.user.id, vendorId))) {
    return res.status(403).json({ error: 'Not your vendor' });
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.vendorId !== vendorId) return res.status(404).json({ error: 'Order not found' });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: parsed.data.status,
      statusHistory: [...order.statusHistory, { status: parsed.data.status, at: new Date().toISOString() }],
    },
  });
  res.json(updated);
});

module.exports = router;
