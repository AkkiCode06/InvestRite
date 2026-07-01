// Onboarding tour steps. Each step targets a [data-tour="..."] element
// (or null for a centered card). Kept short — one or two sentences each.

export function getSteps(isMobile) {
  const welcome = {
    target: null,
    title: 'Welcome to InvestRite 👋',
    body: 'A quick 30-second tour of what you can do here. Skip anytime with Esc or the ✕ — use ← → to move.',
  };
  const finish = {
    target: null,
    title: "You're all set 🎉",
    body: 'Everything here is educational, not financial advice. Switch markets anytime, explore the screeners, and have fun.',
  };

  if (isMobile) {
    return [
      welcome,
      { target: '[data-tour="nav-menu"]', title: 'Everything lives here', body: 'Tap the menu for all your tools — dashboard, screeners, portfolio, alerts, and the US / India switch.' },
      finish,
    ];
  }

  return [
    welcome,
    { target: '[data-tour="region"]',         title: 'US 🇺🇸 / India 🇮🇳',  body: 'Flip the whole app between US markets (NYSE / NASDAQ, in $) and Indian markets (NSE / BSE, in ₹).' },
    { target: '[data-tour="nav-dashboard"]',   title: 'Dashboard',          body: 'Your home base: a live market overview, a scrolling gainers / losers ticker, your portfolio snapshot, and a finance news feed.' },
    { target: '[data-tour="nav-screener"]',    title: 'Flow Screener',      body: 'Scan institutional-style options flow across US mid-caps, ranked by bullish %. (US only — there’s no Indian options data.)' },
    { target: '[data-tour="nav-multibagger"]', title: 'Multi-Bagger',       body: 'A 6-layer fundamental screen for 5× / 10× / income candidates — works for both US and Indian stocks.' },
    { target: '[data-tour="nav-portfolio"]',   title: 'Portfolio',          body: 'Add holdings manually or by CSV. Each keeps its own currency, with allocation, risk and health metrics.' },
    { target: '[data-tour="nav-alerts"]',      title: 'Alerts',             body: 'Set price alerts on any holding — 52-week highs / lows, dips, or a custom level — delivered by email and browser.' },
    { target: '[data-tour="nav-tradeplan"]',   title: 'Trade Plan',         body: 'Turn any screened ticker into a structured setup: entry, two targets, a stop, key levels and exit rules.' },
    { target: '[data-tour="nav-wiki"]',        title: 'Wiki & Legal',       body: 'Full documentation, a glossary, and the Terms & Privacy for this free, educational hobby project.' },
    { target: '[data-tour="profile"]',         title: 'Your Account',       body: 'Change your email or password and manage notification preferences here anytime.' },
    finish,
  ];
}
