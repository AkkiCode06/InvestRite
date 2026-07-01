import { auth } from '../firebase.js';

// In production on Netlify: set VITE_API_BASE_URL=https://your-railway-app.up.railway.app
// Locally or when backend serves the frontend: leave unset (defaults to same-origin /api)
const BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api';

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  screener: {
    flow: (seed, region) => request(`/screener/flow?seed=${seed}${region ? `&region=${region}` : ''}`),
    tradePlan: (ticker, seed) => request(`/screener/trade-plan/${ticker}?seed=${seed}`),
  },
  multibagger: {
    screen: (mode, region) => request(`/multibagger/screen?mode=${mode}${region ? `&region=${region}` : ''}`),
    chart: (ticker) => request(`/multibagger/chart/${ticker}`),
  },
  portfolioHealth: {
    enrich: (tickers) => request(`/portfolio/health?tickers=${tickers.join(',')}`),
    quotes: (tickers) => request(`/portfolio/quotes?tickers=${tickers.join(',')}`),
  },
  dashboard: {
    market: (region) => request(`/dashboard/market${region ? `?region=${region}` : ''}`),
    news:   (region) => request(`/dashboard/news${region ? `?region=${region}` : ''}`),
  },
  search: (q) => request(`/stocks/search?q=${encodeURIComponent(q)}`),
  stock:  (ticker) => request(`/stocks/${encodeURIComponent(ticker)}`),
  stockChart: (ticker, range) => request(`/stocks/${encodeURIComponent(ticker)}/chart?range=${range}`),
  email: {
    welcome:             () => request('/email/welcome', { method: 'POST', body: {} }),
    loginAlert:          (body) => request('/email/login-alert', { method: 'POST', body }),
    priceAlert:          (body) => request('/email/alert', { method: 'POST', body }),
    requestPasswordReset:(email) => fetch('/api/email/request-password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(r => r.json()),
    verifyResetCode:     (email, code) => fetch('/api/email/verify-reset-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) }).then(r => r.json()),
    requestEmailChange:  (newEmail) => request('/email/request-email-change', { method: 'POST', body: { newEmail } }),
    verifyEmailChange:   (newEmail, code) => request('/email/verify-email-change', { method: 'POST', body: { newEmail, code } }),
  },
};
