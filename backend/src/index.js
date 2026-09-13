require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const vendorPanelRoutes = require('./routes/vendorPanel');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

// Required when running behind a reverse proxy / load balancer (Render,
// Railway, Fly.io, nginx, etc.) so req.ip and rate-limiting see the real
// client IP instead of the proxy's.
app.set('trust proxy', 1);

app.use(helmet());

// CORS: reads a comma-separated allowlist from the environment. In
// development, with no ALLOWED_ORIGINS set, everything is allowed so you
// don't have to fight CORS while building. In production, ALLOWED_ORIGINS
// MUST be set or all cross-origin requests are rejected.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (process.env.NODE_ENV !== 'production' && !origin) return callback(null, true); // mobile apps / curl
    if (allowedOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('ALLOWED_ORIGINS is not set — rejecting cross-origin request in production.');
        return callback(new Error('CORS not configured'));
      }
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());

// General abuse protection across the whole API.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Tighter limit specifically on auth endpoints — brute-force protection on
// login/register/2FA, where an attacker gets the most value from spamming.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try again later' } });
app.use('/auth', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

app.use('/auth', authRoutes);
app.use('/vendors', vendorRoutes);
app.use('/vendor-panel', vendorPanelRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

// Central error handler — keeps stack traces out of API responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Delifast API listening on port ${port} [${process.env.NODE_ENV || 'development'}]`));
