const nodemailer = require('nodemailer');

// ── Shared transporter ───────────────────────────────────────────────────────

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || user === 'your-gmail@gmail.com') {
    console.warn('[email] ✗ GMAIL_USER not set in backend/.env — emails disabled');
    return null;
  }
  if (!pass || pass === 'your-16-char-app-password') {
    console.warn('[email] ✗ GMAIL_APP_PASSWORD not set in backend/.env — emails disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ── Purple-branded email wrapper ─────────────────────────────────────────────

function wrap(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { margin:0; padding:0; background:#080812; font-family: -apple-system, 'Inter', sans-serif; }
  .outer { max-width: 520px; margin: 32px auto; background: #0e0b1e; border: 1px solid rgba(123,57,252,0.25); border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #7b39fc 0%, #5b21b6 100%); padding: 28px 32px; }
  .logo { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
  .logo span { color: rgba(255,255,255,0.7); }
  .body { padding: 28px 32px; color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.7; }
  .title { font-size: 22px; font-weight: 600; color: #fff; margin-bottom: 14px; letter-spacing: -0.01em; }
  .btn { display: inline-block; margin: 18px 0; padding: 12px 28px; background: #7b39fc; color: #fff !important; text-decoration: none; border-radius: 9px; font-weight: 600; font-size: 14px; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 20px 0; }
  .footer { padding: 16px 32px 24px; font-size: 11px; color: rgba(255,255,255,0.25); }
  .meta { background: rgba(123,57,252,0.08); border: 1px solid rgba(123,57,252,0.2); border-radius: 8px; padding: 12px 16px; margin: 14px 0; font-size: 12px; }
  .meta strong { color: #c4b5fd; display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="outer">
    <div class="header">
      <div class="logo">Invest<span>Rite</span></div>
    </div>
    <div class="body">
      <div class="title">${title}</div>
      ${bodyHtml}
    </div>
    <div class="footer">
      InvestRite · Educational demo platform · Not investment advice<br>
      If you didn't request this email, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;
}

// ── Send helpers ─────────────────────────────────────────────────────────────

async function send(to, subject, html) {
  const t = createTransporter();
  if (!t) {
    console.log(`[email] SMTP not configured — would have sent "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: `"InvestRite" <${process.env.GMAIL_USER}>`, to, subject, html });
    console.log(`[email] ✓ Sent "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] ✗ Failed to send "${subject}" → ${to}:`, err.message);
    // Common causes:
    if (err.message.includes('Invalid login')) {
      console.error('[email] → Check GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env');
      console.error('[email] → App Password must be 16 chars (no spaces) from myaccount.google.com/apppasswords');
    }
    throw err;
  }
}

// ── 1. Welcome / signup confirmation ────────────────────────────────────────

async function sendWelcome({ to, name }) {
  const html = wrap('Welcome to InvestRite 👋', `
    <p>Hi <strong style="color:#e9d5ff">${name}</strong>,</p>
    <p>Your account has been created. You now have access to:</p>
    <ul style="padding-left:18px;color:rgba(255,255,255,0.6)">
      <li>Institutional Options Flow Screener (mid-cap US equities)</li>
      <li>Multi-Bagger 6-layer fundamental screener</li>
      <li>Portfolio health dashboard</li>
      <li>Trade plan generator</li>
    </ul>
    <div class="divider"></div>
    <p style="font-size:12px;color:rgba(255,255,255,0.4)">
      InvestRite is a <strong>demonstration product</strong> for educational purposes only.
      All data is sourced from Yahoo Finance and does not constitute investment advice.
    </p>
  `);
  return send(to, 'Welcome to InvestRite — your account is ready', html);
}

// ── 2. Login detected ────────────────────────────────────────────────────────

async function sendLoginAlert({ to, name, time, userAgent, ip }) {
  const html = wrap('New login detected', `
    <p>Hi <strong style="color:#e9d5ff">${name}</strong>, a new login was detected on your account.</p>
    <div class="meta">
      <strong>Time</strong>${time}
    </div>
    <div class="meta">
      <strong>Device / Browser</strong>${userAgent || 'Unknown'}
    </div>
    <div class="meta">
      <strong>IP Address</strong>${ip || 'Unknown'}
    </div>
    <div class="divider"></div>
    <p>If this was you, no action is needed.</p>
    <p>If you did <strong>not</strong> log in, secure your account immediately by resetting your password.</p>
  `);
  return send(to, 'InvestRite: New login detected on your account', html);
}

// ── 3. Password reset code ───────────────────────────────────────────────────

async function sendPasswordResetCode({ to, name, code }) {
  const html = wrap('Reset your password', `
    <p>Hi <strong style="color:#e9d5ff">${name}</strong>, here is your password reset code.</p>
    <div style="text-align:center;margin:24px 0">
      <div style="display:inline-block;background:rgba(123,57,252,0.15);border:1px solid rgba(123,57,252,0.4);border-radius:12px;padding:16px 32px">
        <div style="font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px">Your reset code</div>
        <div style="font-size:36px;font-weight:700;color:#fff;letter-spacing:0.15em;font-family:monospace">${code}</div>
      </div>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.4)">
      This code expires in <strong style="color:#c4b5fd">15 minutes</strong>.
      If you didn't request a reset, ignore this email.
    </p>
  `);
  return send(to, 'InvestRite: Your password reset code', html);
}

// ── 4. Email change verification code ────────────────────────────────────────

async function sendEmailChangeCode({ to, name, code, newEmail }) {
  const html = wrap('Confirm your new email', `
    <p>Hi <strong style="color:#e9d5ff">${name}</strong>, you requested an email address change.</p>
    <div class="meta">
      <strong>New email address</strong>${newEmail}
    </div>
    <div style="text-align:center;margin:24px 0">
      <div style="display:inline-block;background:rgba(123,57,252,0.15);border:1px solid rgba(123,57,252,0.4);border-radius:12px;padding:16px 32px">
        <div style="font-size:11px;color:#a78bfa;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px">Verification code</div>
        <div style="font-size:36px;font-weight:700;color:#fff;letter-spacing:0.15em;font-family:monospace">${code}</div>
      </div>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.4)">
      Expires in <strong style="color:#c4b5fd">15 minutes</strong>.
    </p>
  `);
  return send(to, 'InvestRite: Confirm your new email address', html);
}

// ── 5. Price alert ───────────────────────────────────────────────────────────

async function sendPriceAlert({ to, name, ticker, title, message, action, price, sentiment }) {
  const up = sentiment === 'up';
  const color = up ? '#00d4aa' : '#ff4d6d';
  const arrow = up ? '▲' : '▼';
  const html = wrap('Price alert triggered', `
    <p>Hi <strong style="color:#e9d5ff">${name}</strong>, one of your portfolio alerts just fired.</p>
    <div style="text-align:center;margin:22px 0">
      <div style="display:inline-block;background:rgba(123,57,252,0.10);border:1px solid rgba(123,57,252,0.3);border-radius:14px;padding:18px 30px;min-width:200px">
        <div style="font-family:monospace;font-size:13px;color:#a78bfa;letter-spacing:0.12em;text-transform:uppercase">${ticker}</div>
        <div style="font-size:34px;font-weight:700;color:#fff;margin:6px 0">${price != null ? '$' + Number(price).toFixed(2) : ''}</div>
        <div style="font-size:13px;font-weight:600;color:${color}">${arrow} ${title || ''}</div>
      </div>
    </div>
    <p style="font-size:14px;color:rgba(255,255,255,0.8)">${message || ''}</p>
    ${action ? `<div class="meta"><strong>What this could mean</strong>${action}</div>` : ''}
    <div class="divider"></div>
    <p style="font-size:11px;color:rgba(255,255,255,0.4)">
      This is an educational notification, <strong>not investment advice</strong>. Alert thresholds were set by you in InvestRite.
    </p>
  `);
  return send(to, `InvestRite alert: ${ticker} ${title || 'price level reached'}`, html);
}

module.exports = { sendWelcome, sendLoginAlert, sendPasswordResetCode, sendEmailChangeCode, sendPriceAlert };
