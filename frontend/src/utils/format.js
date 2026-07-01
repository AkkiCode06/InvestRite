// Region-aware money formatting. setMoneyLocale() is driven by RegionProvider.
let CUR = { symbol: '$', locale: 'en-US', code: 'USD' };

export function setMoneyLocale(region) {
  CUR = region === 'IN'
    ? { symbol: '₹', locale: 'en-IN', code: 'INR' }
    : { symbol: '$', locale: 'en-US', code: 'USD' };
}
export function currencySymbol() { return CUR.symbol; }

// ── Per-market currency (independent of the global US/IN toggle) ───────────
// Used for portfolio holdings, where each position's currency is intrinsic
// to the stock (e.g. RELIANCE.NS is always ₹, AAPL is always $).
export function symbolForMarket(market) { return market === 'IN' ? '₹' : '$'; }

export function fmtMoneyForMarket(market, n, compact = false) {
  if (n == null) return '—';
  const inr = market === 'IN';
  const sym = inr ? '₹' : '$';
  if (compact) {
    const a = Math.abs(n);
    if (inr) {
      if (a >= 1e7) return `${sym}${(n / 1e7).toFixed(1)}Cr`;
      if (a >= 1e5) return `${sym}${(n / 1e5).toFixed(1)}L`;
      if (a >= 1e3) return `${sym}${(n / 1e3).toFixed(0)}K`;
      return `${sym}${n.toFixed(0)}`;
    }
    if (a >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${sym}${(n / 1e3).toFixed(0)}K`;
    return `${sym}${n.toFixed(0)}`;
  }
  return new Intl.NumberFormat(inr ? 'en-IN' : 'en-US', { style: 'currency', currency: inr ? 'INR' : 'USD', maximumFractionDigits: 0 }).format(n);
}

export function fmtDollar(n, compact = false) {
  if (n == null) return '—';
  if (compact) {
    const a = Math.abs(n);
    if (CUR.code === 'INR') {
      if (a >= 1e7) return `${CUR.symbol}${(n / 1e7).toFixed(1)}Cr`;
      if (a >= 1e5) return `${CUR.symbol}${(n / 1e5).toFixed(1)}L`;
      if (a >= 1e3) return `${CUR.symbol}${(n / 1e3).toFixed(0)}K`;
      return `${CUR.symbol}${n.toFixed(0)}`;
    }
    if (a >= 1_000_000) return `${CUR.symbol}${(n / 1_000_000).toFixed(1)}M`;
    if (a >= 1_000) return `${CUR.symbol}${(n / 1_000).toFixed(0)}K`;
    return `${CUR.symbol}${n.toFixed(0)}`;
  }
  return new Intl.NumberFormat(CUR.locale, { style: 'currency', currency: CUR.code, maximumFractionDigits: 0 }).format(n);
}

export function fmtPct(n, decimals = 1) {
  if (n == null) return '—';
  return `${Number(n).toFixed(decimals)}%`;
}

export function fmtMCap(n) {
  if (n == null) return '—';
  // n is expressed in billions by the (US) screener; keep B/T but follow the active symbol.
  if (n >= 1000) return `${CUR.symbol}${(n / 1000).toFixed(1)}T`;
  return `${CUR.symbol}${n.toFixed(1)}B`;
}

export function fmtNumber(n, decimals = 2) {
  if (n == null) return '—';
  return Number(n).toFixed(decimals);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
