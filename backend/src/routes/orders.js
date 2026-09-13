const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const placeOrderSchema = z.object({
  vendorId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD_ON_DELIVERY', 'WALLET']).default('CASH_ON_DELIVERY'),
  addressId: z.string().uuid(),
});

router.post('/', async (req, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { vendorId, items, paymentMethod, addressId } = parsed.data;

  const [vendor, address] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: vendorId } }),
    prisma.address.findFirst({ where: { id: addressId, userId: req.user.id } }),
  ]);
  if (!vendor || !vendor.isApproved) return res.status(404).json({ error: 'Vendor not found' });
  if (!vendor.isOpen) return res.status(409).json({ error: 'Vendor is currently closed' });
  if (!address) return res.status(404).json({ error: 'Address not found' });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, vendorId } });
  if (products.length !== items.length) {
    return res.status(400).json({ error: 'One or more items are unavailable at this vendor' });
  }
  const outOfStock = products.filter((p) => !p.inStock);
  if (outOfStock.length) {
    return res.status(409).json({ error: 'Some items are out of stock', items: outOfStock.map((p) => p.id) });
  }

  const orderItems = items.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    return {
      productId: product.id,
      nameSnapshot: product.name,
      priceSnapshot: product.price,
      quantity: i.quantity,
    };
  });
  const subtotal = orderItems.reduce((sum, i) => sum + i.priceSnapshot * i.quantity, 0);
  const total = subtotal + vendor.deliveryFee;
  const code = `EG-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await prisma.order.create({
    data: {
      code,
      customerId: req.user.id,
      vendorId,
      paymentMethod,
      subtotal,
      deliveryFee: vendor.deliveryFee,
      total,
      deliveryAddress: address,
      statusHistory: [{ status: 'PENDING', at: new Date().toISOString() }],
      items: { create: orderItems },
    },
    include: { items: true },
  });

  res.status(201).json(order);
});

router.get('/', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.user.id },
    include: { items: true, vendor: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: req.user.id },
    include: { items: true, vendor: true },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
