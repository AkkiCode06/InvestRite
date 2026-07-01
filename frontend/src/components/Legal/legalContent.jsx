import React from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * Single source of truth for InvestRite's Terms and Privacy notice.
 * Rendered by <LegalDoc/> in the modal, profile page, wiki, etc.
 * ────────────────────────────────────────────────────────────────────────── */

export const OWNER         = 'Akshat Barjatya';
export const CONTACT_EMAIL = 'akshat.barjatya@gmail.com';
export const LAST_UPDATED  = 'June 6, 2026';

export const TERMS = {
  id: 'terms',
  title: 'Terms & Conditions',
  intro: `InvestRite ("InvestRite", "the App", "we", "us", "our") is a personal, non-commercial hobby project created and operated by ${OWNER}. By creating an account or using InvestRite, you agree to these Terms. If you do not agree, please do not use the App.`,
  sections: [
    { h: '1. A hobby project — provided free of charge', body: [
      `InvestRite is a personal hobby and learning project built and maintained by ${OWNER} in an individual capacity. It is offered completely free, makes no money, runs no advertising, sells nothing, and is not a registered company, fund, or commercial service.`,
      `Because it is a free hobby project offered on a best-effort basis, the App may change, contain errors, break, lose data, go offline, or be discontinued at any time, without notice or liability.`,
    ]},
    { h: '2. Not financial advice', body: [
      `${OWNER} is not a licensed or registered investment adviser, financial adviser, broker, dealer, analyst, accountant, or tax professional, and InvestRite is not a financial-services firm or a substitute for one.`,
      `Nothing in InvestRite is financial, investment, legal, accounting, or tax advice, nor a recommendation, offer, or solicitation to buy or sell any security or to adopt any strategy. Every screener, score, ranking, "bull / bear" case, trade plan, price alert, and any "buy", "sell", "accumulate" or similar wording is automated, hypothetical, and provided purely for education and entertainment.`,
      `Investing and trading carry substantial risk, including the loss of your entire investment; options and leveraged strategies are especially risky. Past or simulated performance does not guarantee future results. You alone are responsible for your decisions — always do your own research and consult a qualified, licensed professional before investing.`,
    ]},
    { h: '3. Data is provided "as is"', body: [
      `Market and company data is retrieved from third-party sources (primarily Yahoo Finance) and may be delayed, inaccurate, incomplete, or unavailable. We do not create, verify, endorse, or guarantee any of this data and are not responsible for third-party content or outages.`,
      `The App and all content are provided "as is" and "as available", without warranties of any kind, whether express or implied, including accuracy, reliability, merchantability, or fitness for a particular purpose.`,
    ]},
    { h: '4. Limitation of liability', body: [
      `To the maximum extent permitted by law, ${OWNER} shall not be liable for any direct, indirect, incidental, or consequential loss or damage — including trading or investment losses, lost profits, or loss of data — arising from or relating to your use of, or inability to use, InvestRite, or any reliance on its content. You use the App entirely at your own risk.`,
    ]},
    { h: '5. Your account & acceptable use', body: [
      `You are responsible for keeping your login credentials secure and for all activity under your account, and you agree to provide accurate information when registering.`,
      `You agree not to misuse the App — including no attempts to break, overload, mass-scrape, reverse-engineer, or gain unauthorised access; no unlawful, harmful, or fraudulent use; and no reselling or offering the App to others as a paid service.`,
    ]},
    { h: '6. Eligibility', body: [
      `InvestRite deals with financial markets and is intended for adults aged 18 or older. It is not directed at children.`,
    ]},
    { h: '7. Changes & termination', body: [
      `These Terms may be updated from time to time; continued use of the App after an update means you accept the revised Terms. We may suspend, limit, or discontinue the App or your access to it at any time.`,
    ]},
    { h: '8. Contact', body: [
      `Questions about these Terms can be sent to ${CONTACT_EMAIL}.`,
    ]},
  ],
};

export const PRIVACY = {
  id: 'privacy',
  title: 'Privacy & Data Notice',
  intro: `This notice explains what personal data InvestRite collects, why, and how it is handled. InvestRite is a free, non-commercial hobby project operated by ${OWNER}, and your data is never sold.`,
  sections: [
    { h: '1. Who is responsible', body: [
      `InvestRite is run by ${OWNER} as a personal, non-commercial project. For any privacy question or request, contact ${CONTACT_EMAIL}.`,
    ]},
    { h: '2. What we collect', body: ['We collect only what is needed to run the App:'], bullets: [
      'Account details — your email address, chosen username / display name, and a password. Passwords are handled entirely by Google Firebase Authentication and are never seen or stored by InvestRite.',
      'Portfolio & alerts — the tickers, share counts, average cost, notes, and price-alert settings you enter. These are stored in Google Firebase (Firestore) under your account ID.',
      'Sign-in security info — when you log in, a notification email may record the time, your browser / device (user-agent), and IP address so you can detect unauthorised access.',
      'Basic analytics — anonymous usage data via Google / Firebase Analytics, where supported by your browser.',
    ]},
    { h: '3. How we use it', body: ['Your data is used only to:'], bullets: [
      'authenticate you and keep you signed in;',
      'store and display your portfolio, health metrics, and alerts;',
      'send emails you trigger or opt into — welcome, login alerts, password-reset and email-change codes, and price alerts;',
      'operate, secure, and improve the App.',
    ]},
    { h: '4. Third-party services', body: ['To run a free hobby project, InvestRite relies on third parties, each governed by their own privacy policies:'], bullets: [
      'Google Firebase — Authentication, Firestore database, and Analytics. Google’s Privacy Policy applies.',
      'Yahoo Finance — market data. Only ticker symbols are sent to fetch quotes; your identity and portfolio are never sent to them.',
      'Gmail (SMTP) — used to deliver the emails described above.',
    ]},
    { h: '5. Cookies & local storage', body: [
      `InvestRite stores a Firebase authentication token in your browser so you stay signed in, and Firebase Analytics may set identifiers. We do not use third-party advertising or cross-site tracking cookies.`,
    ]},
    { h: '6. Data retention & your control', body: ['You stay in control of your data:'], bullets: [
      'Delete individual positions or alerts at any time from the Portfolio and Alerts pages.',
      'Change your username, email, or password from the Profile page.',
      `To delete your entire account and all associated data, email ${CONTACT_EMAIL} and it will be removed.`,
    ]},
    { h: '7. We do not sell your data', body: [
      `InvestRite makes no money and does not sell, rent, or trade your personal information. Data is shared only with the service providers listed above, strictly to operate the App.`,
    ]},
    { h: '8. Security', body: [
      `Authentication and storage are handled by Google Firebase, and the backend applies standard protections such as token verification, rate limiting, and input sanitisation. No online service can be guaranteed 100% secure, so please use a strong, unique password.`,
    ]},
    { h: '9. Children', body: [
      `InvestRite is intended for adults (18+) and is not directed at, or intended for use by, children.`,
    ]},
    { h: '10. Changes & contact', body: [
      `This notice may be updated occasionally; material changes will be reflected here with a new "last updated" date. Questions or requests: ${CONTACT_EMAIL}.`,
    ]},
  ],
};

export const DOCS = { terms: TERMS, privacy: PRIVACY };

/* ── Shared renderer ──────────────────────────────────────────────────────── */
export function LegalDoc({ doc }) {
  const d = DOCS[doc] || TERMS;
  return (
    <div>
      <p style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
        Last updated: {LAST_UPDATED}
      </p>
      <p style={{ fontFamily: 'Manrope', fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.65)', marginBottom: 22 }}>
        {d.intro}
      </p>
      {d.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: 'Manrope', fontSize: 13.5, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>{s.h}</h3>
          {(s.body || []).map((p, j) => (
            <p key={j} style={{ fontFamily: 'Manrope', fontSize: 12.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{p}</p>
          ))}
          {s.bullets && (
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {s.bullets.map((b, k) => (
                <li key={k} style={{ fontFamily: 'Manrope', fontSize: 12.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
