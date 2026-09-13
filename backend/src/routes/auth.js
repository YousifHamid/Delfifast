const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { z } = require('zod');
const prisma = require('../config/db');
const { requireAuthAllowPending } = require('../middleware/auth');

const router = express.Router();

// Roles that must have 2FA enabled to sign in at all — enforced below.
const ROLES_REQUIRING_2FA = ['ADMIN', 'SUPER_ADMIN'];

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  password: z.string().min(8),
  language: z.enum(['ar', 'en']).default('ar'),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { fullName, phone, email, password, language } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: 'Phone already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { fullName, phone, email, passwordHash, language, role: 'CUSTOMER' },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { phone, password, totpCode } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  if (ROLES_REQUIRING_2FA.includes(user.role)) {
    if (!user.twoFactorSecret) {
      // First login for an admin/super-admin before they've set up 2FA yet:
      // issue a short-lived, scope-limited token that can ONLY call the
      // /auth/2fa/setup and /auth/2fa/confirm endpoints — not a real session.
      const setupToken = jwt.sign(
        { id: user.id, role: user.role, twoFactorPending: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.status(403).json({
        error: '2FA setup required before you can sign in with this role',
        code: 'TWO_FACTOR_SETUP_REQUIRED',
        setupToken,
      });
    }
    if (!totpCode) {
      return res.status(401).json({ error: 'Authentication code required', code: 'TWO_FACTOR_CODE_REQUIRED' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1, // allow ±30s clock drift
    });
    if (!verified) return res.status(401).json({ error: 'Invalid authentication code' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// --- 2FA setup, for a user who is already authenticated with phone+password
// but doesn't have a secret yet. The admin panel calls this once, shows the
// secret for the user to add to their authenticator app, then confirms it
// with /auth/2fa/confirm before it's actually enforced. ---

router.post('/2fa/setup', requireAuthAllowPending, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `Delifast (${req.user.id.slice(0, 8)})` });
  await prisma.user.update({ where: { id: req.user.id }, data: { twoFactorSecret: secret.base32 } });
  res.json({ base32Secret: secret.base32, otpauthUrl: secret.otpauth_url });
});

const confirmSchema = z.object({ totpCode: z.string().length(6) });

router.post('/2fa/confirm', requireAuthAllowPending, async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user.twoFactorSecret) return res.status(400).json({ error: 'Call /auth/2fa/setup first' });

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: parsed.data.totpCode,
    window: 1,
  });
  if (!verified) return res.status(400).json({ error: 'Code did not match — try again' });

  // 2FA is now enrolled — issue a real, full-scope session token so the
  // frontend doesn't have to make the user log in a second time.
  const token = signToken(user);
  res.json({ confirmed: true, token, user: publicUser(user) });
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  const { passwordHash, twoFactorSecret, ...safe } = user;
  return safe;
}

module.exports = router;
