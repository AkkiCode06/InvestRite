# InvestRite

An investing companion app: track your portfolio, screen stocks, spot potential multibaggers, and build a trade plan — backed by live market data.

## What it does

- **Portfolio:** track holdings and get a portfolio health check
- **Screener:** filter stocks with a guided, chip-based flow
- **MultiBagger:** surface stocks with multibagger potential
- **Trade plan:** plan entries/exits per stock
- **Alerts, wiki, onboarding:** stay on top of positions and learn the terminology along the way
- **Auth:** email/Firebase-based sign-in, plus email notifications (nodemailer)

## Architecture

```
frontend/   React 18 + Vite + Tailwind CSS 4, Firebase auth, Recharts for charts
backend/    Express API — auth, portfolio, screener, multibagger, dashboard routes
            pulls live quotes via yahoo-finance2
firestore.rules   Firestore security rules
```

## Getting started

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in secrets (JWT, email, etc.)
npm run dev

# Frontend
cd frontend
npm install
cp .env.example .env    # fill in Firebase config
npm run dev
```

Deployed via Netlify (frontend, see `netlify.toml`) and Railway (backend, see `railway.json`).
