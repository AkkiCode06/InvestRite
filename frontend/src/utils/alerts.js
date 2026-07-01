import { fmtDollar } from './format.js';

/* ──────────────────────────────────────────────────────────────────────────
 * Alert type catalogue
 *  - needsTarget : user must supply a trigger price
 *  - sentiment   : 'up' (price went high) | 'down' (price went low)
 *  - action      : educational suggestion shown in the alert (NOT advice)
 * ────────────────────────────────────────────────────────────────────────── */

export const ALERT_TYPES = {
  custom_above: {
    label: 'Price rises above', short: 'Above', group: 'Custom price',
    needsTarget: true, targetLabel: 'Trigger price ($)', sentiment: 'up',
    action: 'Your upside level was reached — review your plan.',
    desc: 'Fires once the live price climbs to or above the price you set.',
  },
  custom_below: {
    label: 'Price drops below', short: 'Below', group: 'Custom price',
    needsTarget: true, targetLabel: 'Trigger price ($)', sentiment: 'down',
    action: 'Your downside level was reached — review your plan.',
    desc: 'Fires once the live price falls to or below the price you set.',
  },
  dip_in: {
    label: 'Dip in — buy zone', short: 'Dip in', group: 'Action',
    needsTarget: true, targetLabel: 'Buy below ($)', sentiment: 'down',
    action: 'Pulled back into your buy zone — consider adding (BUY).',
    desc: 'A "buy the dip" alert: fires when price falls to your accumulation level.',
  },
  dip_out: {
    label: 'Dip out — sell zone', short: 'Dip out', group: 'Action',
    needsTarget: true, targetLabel: 'Sell above ($)', sentiment: 'up',
    action: 'Reached your take-profit target — consider trimming (SELL).',
    desc: 'A profit-target alert: fires when price rises to your exit level.',
  },
  '52w_high': {
    label: '52-week high', short: '52w high', group: 'Range',
    needsTarget: false, sentiment: 'up',
    action: 'Trading near its yearly top — momentum strong; consider trimming.',
    desc: 'Fires when price reaches its trailing 52-week high (new yearly high).',
  },
  '52w_low': {
    label: '52-week low', short: '52w low', group: 'Range',
    needsTarget: false, sentiment: 'down',
    action: 'Trading near its yearly bottom — possible value, verify fundamentals.',
    desc: 'Fires when price reaches its trailing 52-week low (new yearly low).',
  },
  day_high: {
    label: "Today's high", short: 'Day high', group: 'Range',
    needsTarget: false, sentiment: 'up',
    action: 'At the intraday high — strength today.',
    desc: "Fires when price reaches the session's high so far.",
  },
  day_low: {
    label: "Today's low", short: 'Day low', group: 'Range',
    needsTarget: false, sentiment: 'down',
    action: 'At the intraday low — watch support.',
    desc: "Fires when price reaches the session's low so far.",
  },
};

export const ALERT_GROUPS = ['Custom price', 'Action', 'Range'];

// Tolerance band (0.1%) so "at the high/low" fires when price is essentially there.
const NEAR = 0.001;

/**
 * Evaluate one alert against a live quote.
 * @returns {null | { dir:'up'|'down', price:number, level:number }}
 */
export function evaluateAlert(alert, q) {
  if (!q || !(q.price > 0)) return null;
  const price = q.price;
  const t = Number(alert.target);

  switch (alert.type) {
    case 'custom_above': return price >= t ? hit('up', price, t) : null;
    case 'custom_below': return price <= t ? hit('down', price, t) : null;
    case 'dip_in':       return price <= t ? hit('down', price, t) : null;
    case 'dip_out':      return price >= t ? hit('up', price, t) : null;
    case '52w_high':     return q.week52High > 0 && price >= q.week52High * (1 - NEAR) ? hit('up', price, q.week52High) : null;
    case '52w_low':      return q.week52Low  > 0 && price <= q.week52Low  * (1 + NEAR) ? hit('down', price, q.week52Low) : null;
    case 'day_high':     return q.dayHigh > 0 && price >= q.dayHigh * (1 - NEAR) ? hit('up', price, q.dayHigh) : null;
    case 'day_low':      return q.dayLow  > 0 && price <= q.dayLow  * (1 + NEAR) ? hit('down', price, q.dayLow) : null;
    default: return null;
  }
}
function hit(dir, price, level) { return { dir, price, level }; }

/** Human-readable one-liner for the trigger (used in toast + email + list). */
export function alertMessage(alert, fire) {
  const meta = ALERT_TYPES[alert.type] || {};
  const T = alert.ticker;
  const p = fmtDollar(fire.price);
  const lvl = fmtDollar(fire.level);
  switch (alert.type) {
    case 'custom_above': return `${T} rose above ${lvl} — now trading at ${p}.`;
    case 'custom_below': return `${T} dropped below ${lvl} — now trading at ${p}.`;
    case 'dip_in':       return `${T} dipped into your buy zone (${lvl}) — now at ${p}.`;
    case 'dip_out':      return `${T} reached your sell target (${lvl}) — now at ${p}.`;
    case '52w_high':     return `${T} hit a new 52-week high at ${p}.`;
    case '52w_low':      return `${T} hit a new 52-week low at ${p}.`;
    case 'day_high':     return `${T} is at today's high — ${p}.`;
    case 'day_low':      return `${T} is at today's low — ${p}.`;
    default:             return `${T} alert triggered at ${p}.`;
  }
}

/** Short title for notifications, e.g. "AAPL · High reached". */
export function alertTitle(alert, fire) {
  const word = fire.dir === 'up' ? 'High reached' : 'Low reached';
  return `${alert.ticker} · ${word}`;
}

/** Compact summary of the alert's condition for list rows. */
export function alertCondition(alert) {
  const meta = ALERT_TYPES[alert.type] || {};
  if (meta.needsTarget) {
    const verb = (alert.type === 'custom_above' || alert.type === 'dip_out') ? '≥' : '≤';
    return `${meta.short} ${verb} ${fmtDollar(alert.target)}`;
  }
  return meta.label || alert.type;
}
