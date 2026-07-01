import {
  Activity, SlidersHorizontal, Zap,
  Layers, Gauge, TrendingUp,
  PieChart, Briefcase, Shield,
  Crosshair, Map, ListChecks,
  Bell, Mail, Monitor,
  BarChart2, Rocket, Target,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
 * Public feature pages — what each tool offers (benefit-led, no deep internals;
 * the full "how it works" lives in the in-app Wiki).
 * Single source of truth for the landing navbar + feature pages.
 * ────────────────────────────────────────────────────────────────────────── */

export const FEATURE_ORDER = ['screener', 'multibagger', 'portfolio', 'tradeplan', 'alerts'];

// Shown as direct links in the landing navbar; the rest live under "More".
export const MAIN_FEATURES = ['screener', 'multibagger', 'portfolio'];
export const MORE_FEATURES = ['tradeplan', 'alerts'];

export const FEATURES = {
  screener: {
    key: 'screener',
    label: 'Flow Screener',
    navIcon: BarChart2,
    icon: Activity,
    eyebrow: 'Options flow',
    titlePre: 'See where the ',
    titleEm: 'big money',
    titlePost: ' is positioning',
    subtitle: 'Scan institutional-style options flow across US mid-cap equities and surface unusual bullish or bearish activity — ranked, scored, and filtered exactly the way you want.',
    highlights: [
      { icon: Activity,         title: 'Live options chains',  text: '~60 liquid US small & mid-caps, pulled fresh from Yahoo Finance each session.' },
      { icon: SlidersHorizontal, title: 'Tune every filter',   text: 'Market cap, IV rank, flow %, Vol/OI and DTE thresholds are all editable.' },
      { icon: Zap,              title: 'Catch the big prints', text: 'The single largest premium order each session is flagged automatically.' },
    ],
    bullets: [
      'Bullish vs bearish premium split at a glance',
      'Approximate IV Rank from realized volatility',
      'One click straight into a full trade plan',
    ],
  },

  multibagger: {
    key: 'multibagger',
    label: 'Multi-Bagger',
    navIcon: Rocket,
    icon: Rocket,
    eyebrow: 'Fundamental screening',
    titlePre: 'Hunt for the next ',
    titleEm: 'multi-bagger',
    titlePost: '',
    subtitle: 'A six-layer fundamental screen across US small-caps, scoring each name on valuation, growth, quality and balance-sheet strength to surface 5×–10× candidates.',
    highlights: [
      { icon: Layers,     title: '6-layer formula',    text: 'Valuation, growth, quality, balance sheet, yield and advanced signals.' },
      { icon: Gauge,      title: 'Composite 0–100 score', text: 'Every stock gets a colour-coded score ring you can sort and compare.' },
      { icon: TrendingUp, title: 'Bull & bear cases',  text: 'Data-driven narratives plus a live 6-month chart on every row.' },
    ],
    bullets: [
      '5×, 10× and income / yield modes',
      'Piotroski-style financial health checks',
      'Built from real financial ratios — no hand-waving',
    ],
  },

  portfolio: {
    key: 'portfolio',
    label: 'Portfolio',
    navIcon: Briefcase,
    icon: Briefcase,
    eyebrow: 'Track your holdings',
    titlePre: 'Your portfolio, ',
    titleEm: 'clearly measured',
    titlePost: '',
    subtitle: 'Add holdings manually or import a CSV, then see allocation, concentration, risk and performance at a glance — all saved securely to your account.',
    highlights: [
      { icon: PieChart,  title: 'Health dashboard',   text: 'Allocation, sector mix, beta, concentration (HHI) and drawdown.' },
      { icon: Briefcase, title: 'Manual or CSV import', text: 'Bring positions in seconds — column names are auto-detected.' },
      { icon: Shield,    title: 'Private & persistent', text: 'Stored under your account in Firebase, never sold, yours to delete.' },
    ],
    bullets: [
      'Live prices and today’s change',
      'Cost basis and position sizing',
      'Benchmarks and risk-adjusted metrics',
    ],
  },

  tradeplan: {
    key: 'tradeplan',
    label: 'Trade Plan',
    navIcon: Target,
    icon: Target,
    eyebrow: 'Structured setups',
    titlePre: 'Turn an idea into a ',
    titleEm: 'trade plan',
    titlePost: '',
    subtitle: 'Generate a structured setup for any screened ticker — entry, two targets, a stop, key levels and clear exit rules — so you’re never trading on a hunch.',
    highlights: [
      { icon: Crosshair, title: 'Entry, targets & stop', text: 'A complete plan with risk / reward worked out for you.' },
      { icon: Map,       title: 'Key price levels',      text: 'Support and resistance from recent pivots, with distances.' },
      { icon: ListChecks, title: 'Exit rules & catalysts', text: 'Profit-taking, stop logic and an earnings / event check.' },
    ],
    bullets: [
      'Technical snapshot — trend, RSI, volume',
      'Options positioning context',
      'Educational only — never auto-executed',
    ],
  },

  alerts: {
    key: 'alerts',
    label: 'Alerts',
    navIcon: Bell,
    icon: Bell,
    eyebrow: 'Stay notified',
    titlePre: 'Never miss a ',
    titleEm: 'price level',
    titlePost: '',
    subtitle: 'Set alerts on any holding — 52-week highs and lows, daily extremes, dip-in / dip-out zones or a custom price — and get told the moment they hit.',
    highlights: [
      { icon: Bell,     title: 'Levels that matter', text: '52-week & daily high / low, buy / sell zones, or your own price.' },
      { icon: Mail,     title: 'Email + browser',    text: 'Choose how each alert reaches you, with a suggested action.' },
      { icon: Monitor,  title: 'Watches your book',  text: 'Pulls live quotes and fires the instant a level is reached.' },
    ],
    bullets: [
      'One-tap alerts from any position',
      'Educational buy / sell hints',
      'Re-arm, pause or delete any time',
    ],
  },
};
