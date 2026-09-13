const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAdminAction } = require('../middleware/adminAudit');

const router = express.Router();
// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
// Pair this with 2FA enforcement at login (see auth.js) before going live.
router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

// --- Vendor approval queue ---
router.get('/vendors/pending', async (req, res) => {
  const vendors = await prisma.vendor.findMany({ where: { isApproved: false } });
  res.json(vendors);
});

router.post('/vendors/:id/approve', async (req, res) => {
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { isApproved: true },
  });
  await logAdminAction({
    actorId: req.user.id,
    action: 'VENDOR_APPROVED',
    targetType: 'Vendor',
    targetId: vendor.id,
  });
  res.json(vendor);
});

router.post('/vendors/:id/suspend', async (req, res) => {
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { isApproved: false },
  });
  await logAdminAction({
    actorId: req.user.id,
    action: 'VENDOR_SUSPENDED',
    targetType: 'Vendor',
    targetId: vendor.id,
    metadata: { reason: req.body?.reason },
  });
  res.json(vendor);
});

// --- User management ---
router.get('/users', async (req, res) => {
  const { search } = req.query;
  const users = await prisma.user.findMany({
    where: search
      ? { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }
      : undefined,
    select: { id: true, fullName: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
    take: 50,
  });
  res.json(users);
});

const suspendUserSchema = z.object({ reason: z.string().min(1) });

router.post('/users/:id/suspend', async (req, res) => {
  const parsed = suspendUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  await logAdminAction({
    actorId: req.user.id,
    action: 'USER_SUSPENDED',
    targetType: 'User',
    targetId: user.id,
    metadata: { reason: parsed.data.reason },
  });
  res.json({ id: user.id, isActive: user.isActive });
});

// Only SUPER_ADMIN can promote roles — prevents an ADMIN from self-escalating.
router.post('/users/:id/role', requireRole('SUPER_ADMIN'), async (req, res) => {
  const roleSchema = z.object({ role: z.enum(['CUSTOMER', 'VENDOR_STAFF', 'VENDOR_OWNER', 'ADMIN', 'SUPER_ADMIN']) });
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: parsed.data.role } });
  await logAdminAction({
    actorId: req.user.id,
    action: 'USER_ROLE_CHANGED',
    targetType: 'User',
    targetId: user.id,
    metadata: { newRole: parsed.data.role },
  });
  res.json({ id: user.id, role: user.role });
});

// --- Orders oversight ---
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: { vendor: true, customer: { select: { fullName: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(orders);
});

// --- Feature flags (e.g. turning on the Supermarket vertical) ---
router.get('/feature-flags', async (req, res) => {
  const flags = await prisma.featureFlag.findMany();
  res.json(flags);
});

router.post('/feature-flags/:key', async (req, res) => {
  const enabledSchema = z.object({ isEnabled: z.boolean() });
  const parsed = enabledSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const flag = await prisma.featureFlag.upsert({
    where: { key: req.params.key },
    update: { isEnabled: parsed.data.isEnabled },
    create: { key: req.params.key, isEnabled: parsed.data.isEnabled },
  });
  await logAdminAction({
    actorId: req.user.id,
    action: 'FEATURE_FLAG_TOGGLED',
    targetType: 'FeatureFlag',
    targetId: flag.key,
    metadata: { isEnabled: flag.isEnabled },
  });
  res.json(flag);
});

// --- Audit log (read-only, self-evident who-did-what) ---
router.get('/audit-log', async (req, res) => {
  const log = await prisma.adminAuditLog.findMany({
    include: { actor: { select: { fullName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(log);
});

module.exports = router;
