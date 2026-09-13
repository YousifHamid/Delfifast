const jwt = require('jsonwebtoken');

// Verifies the JWT and rejects tokens issued mid-2FA-setup (twoFactorPending)
// for every normal route — those tokens are only valid on the 2FA setup
// endpoints, via requireAuthAllowPending below.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.twoFactorPending) {
      return res.status(403).json({ error: 'Complete 2FA setup before continuing', code: 'TWO_FACTOR_SETUP_REQUIRED' });
    }
    req.user = payload; // { id, role, vendorId? }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Same as requireAuth, but also accepts a short-lived twoFactorPending token —
// used ONLY on /auth/2fa/setup and /auth/2fa/confirm so a user can finish
// enrolling before they have a full session.
function requireAuthAllowPending(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage: requireRole('ADMIN', 'SUPER_ADMIN')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireAuthAllowPending, requireRole };
