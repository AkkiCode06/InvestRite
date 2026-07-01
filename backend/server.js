// Load backend/.env by absolute path so it works regardless of cwd
// (npm scripts run from the repo root, where there is no .env).
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const screenerRouter        = require('./routes/screener');
const multibaggerRouter     = require('./routes/multibagger');
const portfolioHealthRouter = require('./routes/portfolioHealth');
const emailRouter           = require('./routes/email');
const dashboardRouter       = require('./routes/dashboard');
const stocksRouter          = require('./routes/stocks');

const app     = express();
const PORT    = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Security headers (helmet) ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled so React inline styles work
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by'); // don't leak Express version

// ── CORS (dev only) ───────────────────────────────────────────────────────
// Allow the Netlify frontend URL (and localhost for dev)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // set on Railway: https://your-app.netlify.app
].filter(Boolean);

// In development, also allow localhost + private-LAN origins so phones on the
// same Wi-Fi can use the app through the Vite dev proxy (e.g. http://192.168.x.x:5173).
const DEV_LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (Railway health checks, same-origin GET) or listed origins
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (!IS_PROD && DEV_LAN_ORIGIN.test(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// ── Body parser with size cap ─────────────────────────────────────────────
app.use(express.json({ limit: '128kb' })); // was 2mb — no endpoint needs that much

// ── Rate limiters ─────────────────────────────────────────────────────────

// General API — 120 req / min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests — try again in a minute.' },
});

// Screener endpoints — expensive Yahoo Finance calls, cap at 10/min
const screenerLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  message: { error: 'Screener rate limit reached — wait a minute.' },
});

// Auth-sensitive email endpoints — hard cap 5/15 min per IP
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { error: 'Too many requests — try again in 15 minutes.' },
});

// Price-alert emails — more lenient than auth emails (legit bursts when several
// alerts fire at once), but still capped to prevent abuse.
const alertEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 40,
  message: { error: 'Too many alert emails — try again shortly.' },
});

app.use('/api', generalLimiter);
app.use('/api/screener', screenerLimiter);
app.use('/api/multibagger', screenerLimiter);
app.use('/api/email/alert', alertEmailLimiter);
app.use('/api/email/request-password-reset', emailLimiter);
app.use('/api/email/request-email-change',   emailLimiter);

// ── Input sanitisation helper ─────────────────────────────────────────────
// Strip script tags / html from string fields before they reach any handler
app.use((req, _res, next) => {
  function clean(v) {
    if (typeof v !== 'string') return v;
    return v.replace(/<[^>]*>/g, '').trim().slice(0, 500);
  }
  function sanitiseObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const k of Object.keys(obj)) obj[k] = typeof obj[k] === 'object' ? sanitiseObj(obj[k]) : clean(obj[k]);
    return obj;
  }
  if (req.body) req.body = sanitiseObj(req.body);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/screener',   screenerRouter);
app.use('/api/multibagger', multibaggerRouter);
app.use('/api/portfolio',  portfolioHealthRouter);
app.use('/api/email',      emailRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/stocks',    stocksRouter);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Serve built React app in production ──────────────────────────────────
const DIST = path.join(__dirname, '../frontend/dist');
if (IS_PROD && fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1d' }));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else if (IS_PROD) {
  console.warn('[warn] frontend/dist not found — run `npm run build` first');
}

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Never leak stack traces to the client
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: IS_PROD ? 'Internal server error' : err.message });
});

app.listen(PORT, () => {
  console.log(`InvestRite running on :${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
