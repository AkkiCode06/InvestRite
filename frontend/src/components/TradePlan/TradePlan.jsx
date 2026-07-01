import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import { fmtDollar, fmtPct, fmtMCap, fmtNumber } from '../../utils/format.js';
import Disclaimer from '../common/Disclaimer.jsx';

function Section({ title, children, accentColor = '#7b39fc' }) {
  return (
    <div className="p-card" style={{ marginBottom: 12, padding: '14px 16px' }}>
      <div style={{
        fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: accentColor, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 2, height: 12, background: accentColor, borderRadius: 2 }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, valueColor, mono = true }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: valueColor || 'var(--text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}

function PriceLevel({ price, label, color, currentPrice }) {
  const dist = currentPrice ? (((price - currentPrice) / currentPrice) * 100).toFixed(1) : null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', background: `${color}12`, border: `1px solid ${color}30`,
      borderRadius: 6, marginBottom: 6,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
          {fmtDollar(price)}
        </span>
        {dist && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {dist > 0 ? '+' : ''}{dist}% from current
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradePlan({ sessionSeed, initialTicker, onBack }) {
  const [ticker, setTicker] = useState(initialTicker || '');
  const [inputTicker, setInputTicker] = useState(initialTicker || '');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTicker) {
      fetchPlan(initialTicker);
    }
  }, [initialTicker]);

  async function fetchPlan(t) {
    const sym = (t || inputTicker).toUpperCase().trim();
    if (!sym) return;
    setTicker(sym);
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const data = await api.screener.tradePlan(sym, sessionSeed);
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const stock = plan?.stock;
  const tech = plan?.technicals;
  const opts = plan?.options;
  const tp = plan?.tradePlan;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 940, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="purple-glow">
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Trade Plan Generator</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>Technical + options analysis for screened candidates</p>
        </div>
        {onBack && (
          <button className="btn-ghost" onClick={onBack} style={{ marginTop: 4 }}>← Screener</button>
        )}
      </div>

      {/* Search */}
      <div className="p-card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ marginBottom: 6 }}>Screened Ticker Symbol</label>
          <input
            placeholder="e.g. CELH"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchPlan()}
            style={{ textTransform: 'uppercase', marginBottom: 0 }}
          />
        </div>
        <button className="btn-purple" onClick={() => fetchPlan()} disabled={loading || !inputTicker}>
          {loading ? 'Analyzing…' : 'Generate Plan'}
        </button>
      </div>
      {error && <div style={{ marginBottom: 14, padding: '9px 14px', borderRadius: 10, background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', color: '#ff4d6d', fontSize: 12, fontFamily: 'Manrope' }}>{error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: 56 }}>
          <div style={{ fontSize: 28, display: 'inline-block', animation: 'spin 1s linear infinite', color: '#7b39fc' }}>↻</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            Analyzing {ticker}…
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
            Checking catalysts · Technical setup · Options positioning · Building plan
          </div>
        </div>
      )}

      {plan && stock && (
        <div className="fade-in">
          {/* Skip warning */}
          {tp?.skipReason && (
            <div style={{
              background: 'var(--accent-red-dim)', border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 16,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20 }}>🚫</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: 4 }}>
                  Binary Event — Skip This Setup
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {tp.skipReason}. Holding options through binary events turns a flow trade into a pure gamma bet. Rule: skip.
                </div>
              </div>
            </div>
          )}

          {/* Stock header */}
          <div className="p-card mb-3" style={{ background: 'linear-gradient(135deg, rgba(18,14,32,0.9) 0%, rgba(123,57,252,0.08) 100%)', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <h2 style={{ fontFamily: 'Cabin', fontSize: 30, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.02em' }}>
                    {stock.ticker}
                  </h2>
                  <span style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{stock.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-green">Bullish Flow {fmtPct(stock.bullishFlowPct)}</span>
                  <span className="badge badge-blue">IV Rank {fmtPct(stock.ivRank)}</span>
                  <span className="badge badge-purple">Mkt Cap {fmtMCap(stock.marketCap)}</span>
                  <span className="badge badge-yellow">{stock.dte}d DTE</span>
                  {tp?.skipReason && <span className="badge badge-red">⚠ Binary Event</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Current Price (sim)</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {fmtDollar(tech?.currentPrice)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Catalyst check */}
            <Section title="Catalyst Check" accentColor={stock.hasNearCatalyst ? 'var(--accent-red)' : 'var(--accent-green)'}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px',
                background: stock.hasNearCatalyst ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                border: `1px solid ${stock.hasNearCatalyst ? 'rgba(255,77,109,0.2)' : 'rgba(0,212,170,0.2)'}`,
                borderRadius: 8, marginBottom: 10,
              }}>
                <span style={{ fontSize: 18 }}>{stock.hasNearCatalyst ? '🚨' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: stock.hasNearCatalyst ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {stock.hasNearCatalyst ? 'Binary Event Detected' : 'No Near-Term Binary Events'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {stock.catalystNote || 'No earnings, FDA dates, or known catalysts within 7 days.'}
                  </div>
                </div>
              </div>
              <Row label="Earnings Date" value={stock.earningsDate || 'N/A'} valueColor={stock.earningsDate ? 'var(--accent-yellow)' : 'var(--text-muted)'} />
              <Row label="FDA Date" value={stock.fdaDate || 'N/A'} valueColor={stock.fdaDate ? 'var(--accent-purple)' : 'var(--text-muted)'} />
              <Row label="Verdict" value={stock.hasNearCatalyst ? 'SKIP' : 'PROCEED'} valueColor={stock.hasNearCatalyst ? 'var(--accent-red)' : 'var(--accent-green)'} mono={false} />
            </Section>

            {/* Technical Setup */}
            <Section title="Technical Setup" accentColor="var(--accent-blue)">
              <Row label="Trend" value={tech?.trend} valueColor={tech?.trend === 'Uptrend' ? 'var(--accent-green)' : 'var(--accent-yellow)'} mono={false} />
              <Row label="RSI" value={tech?.rsi} valueColor={tech?.rsi > 70 ? 'var(--accent-red)' : tech?.rsi < 40 ? 'var(--accent-green)' : 'var(--text-primary)'} />
              <Row label="MACD" value={tech?.macdSignal} mono={false} />
              <Row label="Avg Volume" value={Number(tech?.avgVolume).toLocaleString()} />
              <Row label="Rel Volume" value={`${tech?.relVolume}x`} valueColor={tech?.relVolume > 1.5 ? 'var(--accent-green)' : 'var(--text-secondary)'} />
            </Section>

            {/* Key Levels */}
            <Section title="Key Price Levels" accentColor="var(--accent-yellow)">
              <PriceLevel price={tech?.resistance[1]} label="Resistance 2" color="var(--accent-red)" currentPrice={tech?.currentPrice} />
              <PriceLevel price={tech?.resistance[0]} label="Resistance 1" color="var(--accent-yellow)" currentPrice={tech?.currentPrice} />
              <div style={{
                textAlign: 'center', padding: '6px', margin: '4px 0',
                background: 'var(--accent-blue-dim)', border: '1px solid rgba(77,166,255,0.2)',
                borderRadius: 4, fontSize: 12, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}>
                ▶ {fmtDollar(tech?.currentPrice)} (current)
              </div>
              <PriceLevel price={tech?.support[0]} label="Support 1" color="var(--accent-green)" currentPrice={tech?.currentPrice} />
              <PriceLevel price={tech?.support[1]} label="Support 2" color="var(--text-muted)" currentPrice={tech?.currentPrice} />
            </Section>

            {/* Options Positioning */}
            <Section title="Options Positioning" accentColor="var(--accent-purple)">
              <Row label="Gamma Flip Level" value={fmtDollar(opts?.gammaFlip)} />
              <Row
                label="Price vs Gamma Flip"
                value={tech?.currentPrice > opts?.gammaFlip ? 'Above flip (+ gamma)' : 'Below flip (− gamma)'}
                valueColor={tech?.currentPrice > opts?.gammaFlip ? 'var(--accent-green)' : 'var(--accent-red)'}
                mono={false}
              />
              <Row label="Dealer Bias" value={opts?.dealerBias} mono={false} valueColor="var(--text-secondary)" />
              <Row label="Put/Call Ratio" value={fmtNumber(opts?.putCallRatio)} valueColor={opts?.putCallRatio < 0.6 ? 'var(--accent-green)' : 'var(--text-secondary)'} />
              <Row label="Skew" value={opts?.skew > 0 ? `+${opts?.skew} (put premium)` : `${opts?.skew} (call premium)`} mono={false} />
            </Section>
          </div>

          {/* Trade Plan */}
          <Section title="Structured Trade Plan" accentColor="var(--accent-green)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Entry', value: fmtDollar(tp?.entry), color: 'var(--accent-blue)', note: 'Near current price' },
                { label: 'Target 1', value: fmtDollar(tp?.target1), color: 'var(--accent-green)', note: 'Resistance 1' },
                { label: 'Target 2', value: fmtDollar(tp?.target2), color: 'var(--accent-green)', note: 'Resistance 2 (stretch)' },
                { label: 'Stop Loss', value: fmtDollar(tp?.stopLoss), color: 'var(--accent-red)', note: 'Below Support 1' },
              ].map((l) => (
                <div key={l.label} style={{
                  textAlign: 'center', padding: '14px 10px',
                  background: `${l.color}0d`, border: `1px solid ${l.color}2a`, borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{l.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: l.color }}>{l.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{l.note}</div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              padding: '10px 14px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Risk / Reward:</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
                color: tp?.riskReward >= 2 ? 'var(--accent-green)' : tp?.riskReward >= 1.5 ? 'var(--accent-yellow)' : 'var(--accent-red)',
              }}>
                {tp?.riskReward}:1
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {tp?.riskReward >= 2 ? 'Favorable' : tp?.riskReward >= 1.5 ? 'Acceptable' : 'Poor — reconsider'}
              </div>
            </div>

            {tp?.notes?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Trade Notes
                </div>
                {tp.notes.map((note, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '6px 0', borderBottom: i < tp.notes.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: 13, color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: 'var(--accent-green)', marginTop: 1 }}>✓</span>
                    {note}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Exit Rules */}
          <Section title="Exit Rules" accentColor="var(--accent-yellow)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: 'var(--accent-green-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Profit Exit</div>
                <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Take 50% off at Target 1 ({fmtDollar(tp?.target1)})</li>
                  <li>Trail remainder to break-even stop</li>
                  <li>Final exit at Target 2 or 5 days before expiry</li>
                  <li>If IV collapses &gt;20%, exit regardless of price</li>
                </ul>
              </div>
              <div style={{ padding: 14, background: 'var(--accent-red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Loss Exit</div>
                <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Hard stop at {fmtDollar(tp?.stopLoss)} (Support 1)</li>
                  <li>Exit if option loses 50% of premium</li>
                  <li>Exit if original thesis invalidated</li>
                  <li>Never hold through binary events</li>
                </ul>
              </div>
            </div>
          </Section>

          <Disclaimer compact />
        </div>
      )}
    </div>
  );
}
