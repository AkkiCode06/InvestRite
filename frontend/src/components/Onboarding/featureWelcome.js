import { LayoutDashboard, BarChart2, Rocket, Briefcase, Bell, Target, BookOpen } from 'lucide-react';

// First-visit welcome content, one per feature page. Title + short "what is this".
export const WELCOMES = {
  dashboard: {
    icon: LayoutDashboard,
    title: 'Your Dashboard',
    desc: 'A live snapshot of the markets and your portfolio — an index overview, a scrolling gainers & losers ticker, your holdings, and a finance news feed. Use the 🇺🇸 / 🇮🇳 switch up top to flip between US and Indian markets.',
  },
  screener: {
    icon: BarChart2,
    title: 'Institutional Flow Screener',
    desc: 'Scans options flow across ~50 US mid-caps and ranks them by bullish premium %. It highlights where conviction is concentrated — strong flow, low Vol/OI, elevated IV. Educational only, never a signal to trade.',
  },
  multibagger: {
    icon: Rocket,
    title: 'Multi-Bagger Screener',
    desc: 'A 6-layer fundamental screen for 5× / 10× / income candidates across US and Indian small-caps. Every name gets a 0–100 score plus a data-driven bull & bear case. Expand any row for its live chart.',
  },
  portfolio: {
    icon: Briefcase,
    title: 'Your Portfolio',
    desc: 'Track holdings (added manually or via CSV) with per-stock currency, live prices, allocation, concentration and risk metrics. Tick rows to bulk-delete, or use the pencil to edit a position inline.',
  },
  alerts: {
    icon: Bell,
    title: 'Price Alerts',
    desc: 'Set alerts on any holding — 52-week highs & lows, daily extremes, dip-in / dip-out zones, or a custom price. They fire by email and browser notification while InvestRite is open, each with a suggested action.',
  },
  tradeplan: {
    icon: Target,
    title: 'Trade Plan Generator',
    desc: 'Turns any screened ticker into a structured setup — an entry, two targets, a stop, key support / resistance levels and clear exit rules. Educational and illustrative; nothing is ever auto-executed.',
  },
  wiki: {
    icon: BookOpen,
    title: 'Wiki & Docs',
    desc: 'Full documentation, a glossary of every metric used across the app, and the Terms & Privacy for this free, non-commercial hobby project by Akshat Barjatya.',
  },
};
