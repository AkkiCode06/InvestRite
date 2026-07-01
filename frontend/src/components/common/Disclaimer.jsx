export default function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="disclaimer-banner">
        <span>⚠</span>
        <span>
          <strong>Educational use only.</strong> Yahoo Finance data — not investment advice.
          Options trading involves substantial risk of loss.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,209,102,0.04)',
      border: '1px solid rgba(255,209,102,0.15)',
      borderRadius: 12, padding: '14px 18px',
      fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
    }}>
      <div style={{ color: 'rgba(255,209,102,0.8)', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
        ⚠ Important Disclaimer — Please Read
      </div>
      <p>
        <strong style={{ color: 'rgba(255,255,255,0.7)' }}>InvestRite is a demonstration platform for educational purposes only.</strong>{' '}
        All data is sourced from Yahoo Finance and is <em>not</em> verified for accuracy.
        Nothing on this platform constitutes investment, financial, or trading advice.
      </p>
      <p style={{ marginTop: 8 }}>
        Options trading involves a <strong style={{ color: 'var(--accent-red)' }}>high degree of risk</strong> and is not suitable for all investors.
        You can lose your entire investment and more. Always consult a licensed financial advisor.
      </p>
      <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
        InvestRite is not registered with the SEC, FINRA, or any state securities authority.
      </p>
    </div>
  );
}
