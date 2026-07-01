import { useState, useEffect } from 'react';
import { Zap, Check, Mail, Monitor, TrendingUp, Bell } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
 * Per-feature "bento" showcase — bespoke mini charts that visualise each
 * tool's sub-features. Adapted to InvestRite's dark-glass / purple theme
 * (no shadcn tokens). Pure SVG/CSS, no chart lib needed at this size.
 * ────────────────────────────────────────────────────────────────────────── */

const PURPLE = '#7b39fc';
const LPURPLE = '#c4b5fd';
const VIOLET = '#6d28d9';
const GREEN = '#00d4aa';
const RED = '#ff4d6d';
const DIM = 'rgba(255,255,255,0.25)';

function useIsDesktop() {
  const [d, setD] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  useEffect(() => {
    const h = () => setD(window.innerWidth >= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return d;
}

const cardStyle = {
  background: 'rgba(12,10,24,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '18px 20px',
  display: 'flex', flexDirection: 'column',
};

function Cell({ span = 2, desktop, children, style }) {
  return <div style={{ ...cardStyle, gridColumn: desktop ? `span ${span}` : 'auto', ...style }}>{children}</div>;
}
function Title({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontFamily: 'Manrope', fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{children}</span>
      {right}
    </div>
  );
}
function Desc({ children, style }) {
  return <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginTop: 'auto', paddingTop: 10, ...style }}>{children}</div>;
}

/* ── Visual primitives ─────────────────────────────────────────────────────── */

function Ring({ value, suffix = '', label, color = PURPLE, size = 96, max = 100 }) {
  const r = size / 2 - 8, c = size / 2;
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          pathLength="100" strokeDasharray={`${pct} 100`} transform={`rotate(-90 ${c} ${c})`} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 700, fontSize: size * 0.27, fill: '#fff' }}>{value}{suffix}</text>
      </svg>
      {label && <div style={{ fontFamily: 'Manrope', fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>{label}</div>}
    </div>
  );
}

function Donut({ segments, size = 96, thickness = 13 }) {
  const r = size / 2 - thickness / 2 - 1, c = size / 2;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${c} ${c})`}>
        {segments.map((s, i) => {
          const el = (
            <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
              pathLength="100" strokeDasharray={`${s.value} ${100 - s.value}`} strokeDashoffset={`${-cum}`} />
          );
          cum += s.value;
          return el;
        })}
      </g>
    </svg>
  );
}

function Radar({ data, size = 156 }) {
  const c = size / 2, R = size / 2 - 24, n = data.length;
  const pt = (i, rad) => {
    const a = (-90 + i * (360 / n)) * Math.PI / 180;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)];
  };
  const rings = [0.34, 0.67, 1].map(g => data.map((_, i) => pt(i, R * g).join(',')).join(' '));
  const poly = data.map((d, i) => pt(i, R * Math.max(0.1, d.value)).join(',')).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {rings.map((g, i) => <polygon key={i} points={g} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
      {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />; })}
      <polygon points={poly} fill="rgba(123,57,252,0.28)" stroke={PURPLE} strokeWidth="1.5" />
      {data.map((d, i) => {
        const [x, y] = pt(i, R + 13);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: 'Manrope', fontSize: 8.5, fontWeight: 600, fill: 'rgba(255,255,255,0.5)' }}>{d.label}</text>;
      })}
    </svg>
  );
}

function AreaSpark({ values, color = GREEN, width = 240, height = 64 }) {
  const max = Math.max(...values), min = Math.min(...values), rng = max - min || 1;
  const X = i => i * (width / (values.length - 1));
  const Y = v => height - ((v - min) / rng) * (height - 8) - 4;
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const id = 'as' + color.replace('#', '');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', aspectRatio: `${width}/${height}`, display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HBars({ items }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 52, fontFamily: 'Cabin, sans-serif', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{it.label}</span>
          <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${it.value}%`, height: '100%', background: it.color || PURPLE, borderRadius: 4 }} />
          </div>
          <span style={{ width: 36, textAlign: 'right', fontFamily: 'Cabin, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{it.right ?? `${it.value}%`}</span>
        </div>
      ))}
    </div>
  );
}

function Chip({ children, active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9999,
      fontFamily: 'Manrope', fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(123,57,252,0.2)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${active ? 'rgba(123,57,252,0.45)' : 'rgba(255,255,255,0.1)'}`,
      color: active ? LPURPLE : 'rgba(255,255,255,0.55)',
    }}>{children}</span>
  );
}

function Toggle({ icon: I, label, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}><I size={15} color={LPURPLE} />{label}</span>
      <span style={{ width: 34, height: 18, borderRadius: 9, background: on ? PURPLE : 'rgba(255,255,255,0.15)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
      </span>
    </div>
  );
}

/* ── Feature-specific composites ───────────────────────────────────────────── */

function FlowSplit({ bull }) {
  const bear = 100 - bull;
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${bull}%`, background: GREEN }} />
        <div style={{ width: `${bear}%`, background: RED }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Manrope', fontSize: 11, fontWeight: 600 }}>
        <span style={{ color: GREEN }}>▲ {bull}% calls</span>
        <span style={{ color: RED }}>{bear}% puts ▼</span>
      </div>
    </div>
  );
}

function SRLevels() {
  const rows = [
    ['R2', '$56.80', '+15%', 'res'],
    ['R1', '$52.30', '+5%', 'res'],
    ['Now', '$49.60', '', 'now'],
    ['S1', '$46.90', '-5%', 'sup'],
    ['S2', '$43.10', '-13%', 'sup'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {rows.map(([l, p, d, t]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, fontFamily: 'Manrope', fontSize: 10.5, fontWeight: 700, color: t === 'res' ? LPURPLE : t === 'sup' ? GREEN : '#fff' }}>{l}</span>
          <div style={{ flex: 1, borderTop: t === 'now' ? '1px solid rgba(255,255,255,0.45)' : '1px dashed rgba(255,255,255,0.18)' }} />
          <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>{p}</span>
          <span style={{ width: 36, textAlign: 'right', fontFamily: 'Manrope', fontSize: 10, color: d.startsWith('+') ? GREEN : d.startsWith('-') ? RED : 'rgba(255,255,255,0.4)' }}>{d}</span>
        </div>
      ))}
    </div>
  );
}

function AlertChart() {
  const W = 280, H = 96;
  const vals = [34, 39, 36, 43, 41, 48, 53, 50, 58, 63, 61, 67];
  const max = 72, min = 28, rng = max - min;
  const X = i => i * (W / (vals.length - 1));
  const Y = v => H - ((v - min) / rng) * (H - 10) - 5;
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const lines = [{ v: 64, c: LPURPLE }, { v: 58, c: GREEN }, { v: 34, c: RED }];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', aspectRatio: `${W}/${H}`, display: 'block' }}>
        {lines.map((t, i) => <line key={i} x1="0" y1={Y(t.v)} x2={W} y2={Y(t.v)} stroke={t.c} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />)}
        <path d={line} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={X(vals.length - 1)} cy={Y(vals[vals.length - 1])} r="4" fill={LPURPLE} stroke="#0e0b1e" strokeWidth="1.5" />
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 9 }}>
        {[[LPURPLE, '52-wk high'], [GREEN, 'your target'], [RED, '52-wk low']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 11, borderTop: `2px dashed ${c}` }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function AlertToast() {
  return (
    <div style={{ background: 'rgba(14,11,30,0.9)', border: '1px solid rgba(123,57,252,0.3)', borderLeft: `3px solid ${GREEN}`, borderRadius: 11, padding: '11px 13px', display: 'flex', gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,212,170,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><TrendingUp size={15} color={GREEN} /></div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}><Bell size={11} color={LPURPLE} /><span style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 700, color: '#fff' }}>AAPL · High reached</span></div>
        <div style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>Hit a new 52-week high at $228.40.</div>
        <div style={{ fontFamily: 'Manrope', fontSize: 10.5, color: LPURPLE, marginTop: 4 }}>→ Consider trimming / taking profit</div>
      </div>
    </div>
  );
}

/* ── Per-feature bento layouts ─────────────────────────────────────────────── */

function ScreenerShowcase({ desktop }) {
  return (
    <>
      <Cell span={2} desktop={desktop}>
        <Title>Bullish flow</Title>
        <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: 30, fontWeight: 700, color: '#fff', margin: '4px 0 12px' }}>72%</div>
        <FlowSplit bull={72} />
        <Desc>Call vs put premium split, computed live each session.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>IV Rank</Title>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><Ring value={84} suffix="%" label="vs 52-wk range" /></div>
        <Desc>Surfaces elevated implied volatility worth fading.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Largest sweep</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, margin: '12px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,212,170,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Zap size={19} color={GREEN} /></div>
          <div>
            <div style={{ fontFamily: 'Cabin, sans-serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>$1.2M</div>
            <div style={{ fontFamily: 'Manrope', fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>NVTS · 45 DTE calls</div>
          </div>
        </div>
        <Desc>The single biggest premium print, flagged automatically.</Desc>
      </Cell>

      <Cell span={3} desktop={desktop}>
        <Title>Ranked by conviction</Title>
        <div style={{ margin: '14px 0 4px' }}>
          <HBars items={[
            { label: 'NVTS', value: 86, color: GREEN, right: '86%' },
            { label: 'AMBA', value: 79, color: GREEN, right: '79%' },
            { label: 'RKLB', value: 71, color: GREEN, right: '71%' },
            { label: 'IONQ', value: 64, color: LPURPLE, right: '64%' },
          ]} />
        </div>
        <Desc>Every name scored on bullish-flow %, sorted for you.</Desc>
      </Cell>

      <Cell span={3} desktop={desktop}>
        <Title>Tune every filter</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '14px 0 4px' }}>
          <Chip active>Mkt cap $1–10B</Chip>
          <Chip active>IV rank &gt; 80%</Chip>
          <Chip active>Vol/OI &lt; 0.5</Chip>
          <Chip>DTE 15–60</Chip>
          <Chip>Flow ≥ 70%</Chip>
        </div>
        <Desc>Adjust any threshold — the table updates instantly.</Desc>
      </Cell>
    </>
  );
}

function MultibaggerShowcase({ desktop }) {
  return (
    <>
      <Cell span={2} desktop={desktop}>
        <Title>Composite score</Title>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><Ring value={82} label="of 100" color={GREEN} /></div>
        <Desc>Each stock scored across all six layers.</Desc>
      </Cell>

      <Cell span={4} desktop={desktop}>
        <Title>6-layer fundamentals</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
          <Radar data={[
            { label: 'Value', value: 0.82 }, { label: 'Growth', value: 0.95 }, { label: 'Quality', value: 0.7 },
            { label: 'Balance', value: 0.6 }, { label: 'Yield', value: 0.42 }, { label: 'Signals', value: 0.85 },
          ]} />
          <Desc style={{ flex: 1, minWidth: 150, marginTop: 0, paddingTop: 0 }}>Valuation, growth, quality, balance sheet, yield and advanced signals — profiled at a glance.</Desc>
        </div>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Screen by goal</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0 4px', alignItems: 'flex-start' }}>
          <Chip active>5× growth</Chip><Chip>10× moonshot</Chip><Chip>Income / yield</Chip>
        </div>
        <Desc>Switch modes to match your strategy.</Desc>
      </Cell>

      <Cell span={4} desktop={desktop}>
        <Title right={<span style={{ fontFamily: 'Cabin, sans-serif', fontSize: 16, fontWeight: 700, color: GREEN }}>+148%</span>}>Live 6-month chart</Title>
        <div style={{ margin: '12px 0 2px' }}><AreaSpark values={[10, 12, 11, 14, 18, 17, 22, 28, 26, 34, 41, 52]} color={GREEN} /></div>
        <Desc>Plus an algorithmic bull &amp; bear case on every expanded row.</Desc>
      </Cell>
    </>
  );
}

function PortfolioShowcase({ desktop }) {
  return (
    <>
      <Cell span={2} desktop={desktop}>
        <Title>Allocation</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 2px' }}>
          <Donut segments={[{ value: 34, color: PURPLE }, { value: 24, color: LPURPLE }, { value: 18, color: GREEN }, { value: 14, color: VIOLET }, { value: 10, color: DIM }]} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[['Tech', PURPLE], ['Health', LPURPLE], ['Energy', GREEN], ['Fin', VIOLET], ['Other', DIM]].map(([l, c]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Manrope', fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>
            ))}
          </div>
        </div>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Sector mix</Title>
        <div style={{ margin: '14px 0 4px' }}>
          <HBars items={[
            { label: 'Tech', value: 42, color: PURPLE, right: '42%' },
            { label: 'Health', value: 23, color: LPURPLE, right: '23%' },
            { label: 'Energy', value: 18, color: GREEN, right: '18%' },
            { label: 'Fin', value: 17, color: VIOLET, right: '17%' },
          ]} />
        </div>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Risk metrics</Title>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', margin: '14px 0 4px' }}>
          {[['1.12', 'Beta'], ['1.4', 'Sharpe'], ['-18%', 'Max DD'], ['Low', 'Concentration']].map(([v, l]) => (
            <div key={l}><div style={{ fontFamily: 'Cabin, sans-serif', fontSize: 19, fontWeight: 700, color: '#fff' }}>{v}</div><div style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{l}</div></div>
          ))}
        </div>
      </Cell>

      <Cell span={4} desktop={desktop}>
        <Title right={<span style={{ fontFamily: 'Cabin, sans-serif', fontSize: 15, fontWeight: 700, color: GREEN }}>+$2,340 today</span>}>Performance</Title>
        <div style={{ margin: '12px 0 2px' }}><AreaSpark values={[20, 22, 21, 24, 23, 27, 30, 29, 33, 38, 36, 43]} color={GREEN} /></div>
        <Desc>Live prices, cost basis and daily change on every holding.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Diversification</Title>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><Ring value={72} suffix="" label="balance score" color={PURPLE} /></div>
        <Desc>HHI concentration flags when one name dominates.</Desc>
      </Cell>
    </>
  );
}

function TradeplanShowcase({ desktop }) {
  return (
    <>
      <Cell span={3} desktop={desktop}>
        <Title>Entry, targets &amp; stop</Title>
        <div style={{ margin: '12px 0 2px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['Target 2', '$58.40', GREEN, '+18%'],
            ['Target 1', '$54.10', GREEN, '+9%'],
            ['Entry', '$49.60', PURPLE, 'now'],
            ['Stop', '$45.20', RED, '-9%'],
          ].map(([l, p, c, d]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${c}` }}>
              <span style={{ fontFamily: 'Manrope', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{l}</span>
              <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: 13, fontWeight: 700, color: c === PURPLE ? '#fff' : c }}>{p}</span>
              <span style={{ width: 32, textAlign: 'right', fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{d}</span>
            </div>
          ))}
        </div>
      </Cell>

      <Cell span={3} desktop={desktop}>
        <Title>Key price levels</Title>
        <div style={{ margin: '16px 0 2px' }}><SRLevels /></div>
        <Desc>Support &amp; resistance from recent pivots, with distances.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Momentum</Title>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><Ring value={58} label="RSI" color={PURPLE} /></div>
        <Desc>Trend, RSI and relative volume in one glance.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Risk / reward</Title>
        <div style={{ margin: '16px 0 2px' }}>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: '26%', background: RED }} /><div style={{ width: '74%', background: GREEN }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Cabin, sans-serif', fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: RED }}>1.0R risk</span><span style={{ color: GREEN }}>2.8R reward</span>
          </div>
        </div>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>Exit rules</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0 2px' }}>
          {['Take 50% at T1', 'Trail to break-even', 'Hard stop at support', 'Skip earnings events'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}><Check size={12} color={GREEN} />{t}</span>
          ))}
        </div>
      </Cell>
    </>
  );
}

function AlertsShowcase({ desktop }) {
  return (
    <>
      <Cell span={4} desktop={desktop}>
        <Title>Levels that matter</Title>
        <div style={{ margin: '12px 0 2px' }}><AlertChart /></div>
        <Desc>52-week &amp; daily highs / lows, buy &amp; sell zones, or your own price.</Desc>
      </Cell>

      <Cell span={2} desktop={desktop}>
        <Title>How you're notified</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '14px 0 2px' }}>
          <Toggle icon={Mail} label="Email" on />
          <Toggle icon={Monitor} label="Browser push" on />
        </div>
        <Desc>Pick channels per alert.</Desc>
      </Cell>

      <Cell span={3} desktop={desktop}>
        <Title>Alert types</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '14px 0 4px' }}>
          <Chip active>52-wk high</Chip><Chip active>52-wk low</Chip><Chip>Day high</Chip><Chip>Day low</Chip><Chip>Dip in</Chip><Chip>Dip out</Chip><Chip>Custom $</Chip>
        </div>
        <Desc>One-tap from any position in your portfolio.</Desc>
      </Cell>

      <Cell span={3} desktop={desktop}>
        <Title>Instant &amp; actionable</Title>
        <div style={{ margin: '14px 0 2px' }}><AlertToast /></div>
        <Desc>Every alert carries an educational suggested action.</Desc>
      </Cell>
    </>
  );
}

const SHOWCASES = {
  screener: ScreenerShowcase,
  multibagger: MultibaggerShowcase,
  portfolio: PortfolioShowcase,
  tradeplan: TradeplanShowcase,
  alerts: AlertsShowcase,
};

export default function FeatureShowcase({ feature }) {
  const desktop = useIsDesktop();
  const Showcase = SHOWCASES[feature] || ScreenerShowcase;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(6, 1fr)' : '1fr', gap: 12 }}>
      <Showcase desktop={desktop} />
    </div>
  );
}
