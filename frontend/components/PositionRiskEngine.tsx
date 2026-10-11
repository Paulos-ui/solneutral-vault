'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  calculatePositionStress, POSITION_RISK_DEFAULT, validatePositionRiskInput,
  type PositionRiskInput, type PositionShock,
} from '@/lib/position-risk';
import { Icon } from '@/components/Icons';

type NumericKey = keyof PositionRiskInput;
const compactUsd = (n: number) => Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const signedUsd = (n: number) => `${n > 0 ? '+' : ''}${compactUsd(n)}`;
const numberString = (n: number) => Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);

const fields: Array<{ key: NumericKey; label: string; hint: string; unit: string; step: string }> = [
  { key: 'spotBaseSol', label: 'SPOT HOLDING', hint: 'SOL held outside perp collateral', unit: 'SOL', step: '1' },
  { key: 'perpBaseSol', label: 'PERPETUAL POSITION', hint: 'Negative = short / positive = long', unit: 'SOL', step: '1' },
  { key: 'markPriceUsd', label: 'REFERENCE PRICE', hint: 'User-supplied starting mark', unit: 'USD', step: '0.01' },
  { key: 'isolatedCollateralUsd', label: 'MARGIN CAPITAL', hint: 'Hypothetically available to the perp', unit: 'USD', step: '100' },
  { key: 'maintenanceAssumptionPct', label: 'MARGIN ASSUMPTION', hint: 'Illustrative, not a Drift risk parameter', unit: '%', step: '0.5' },
  { key: 'fundingAssumptionDailyPct', label: 'DAILY FUNDING', hint: 'Positive: shorts receive / longs pay', unit: '%', step: '0.005' },
  { key: 'horizonDays', label: 'HOLDING PERIOD', hint: 'Assumes unchanged daily funding', unit: 'DAYS', step: '1' },
];

function ExposureLattice({ rows, selected }: { rows: PositionShock[]; selected: number }) {
  const low = Math.min(...rows.map(r => r.combinedPnlUsd), 0);
  const high = Math.max(...rows.map(r => r.combinedPnlUsd), 0);
  const span = Math.max(1, high - low);
  const y = (value: number) => 212 - ((value - low) / span) * 156;
  const x = (i: number) => 52 + i * (555 / (rows.length - 1));
  const line = rows.map((row, i) => `${x(i)},${y(row.combinedPnlUsd)}`).join(' ');
  const zero = y(0);
  return <div className="risk-lattice-svg-wrap">
    <svg viewBox="0 0 660 276" role="img" aria-label="Illustrative combined spot and perpetual PnL across seven hypothetical market price shocks" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="solneutral-lattice-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c7ff91" stopOpacity=".19"/><stop offset="1" stopColor="#c7ff91" stopOpacity="0"/></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1="40" x2="617" y1={46 + i * 41} y2={46 + i * 41} stroke="#45644d" strokeOpacity=".4" strokeDasharray="2 7"/>)}
      <line x1="40" x2="617" y1={zero} y2={zero} stroke="#a1bba2" strokeOpacity=".55" strokeDasharray="5 7"/>
      <polygon points={`52,230 ${line} 607,230`} fill="url(#solneutral-lattice-fill)" />
      <polyline points={line} fill="none" stroke="#c7ff91" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {rows.map((r, i) => <g key={r.shockPct}><circle cx={x(i)} cy={y(r.combinedPnlUsd)} r={i === selected ? 7 : 3.5} fill={i === selected ? '#f4f6e9' : '#a5e9ad'} stroke="#10271a" strokeWidth="2"/><text x={x(i)} y="258" textAnchor="middle" fill={i === selected ? '#ecf0dc' : '#8eaf96'} fontSize="12" fontWeight="700">{r.shockPct > 0 ? '+' : ''}{r.shockPct}%</text></g>)}
      <text x="44" y="23" fill="#a5bea6" fontSize="11" letterSpacing="1.6">COMBINED MODELED PNL / USD</text>
      <text x="610" y="23" fill="#829f88" fontSize="10" textAnchor="end">NOT MARKET HISTORY</text>
    </svg>
  </div>;
}

export function PositionRiskEngine() {
  const [rawInputs, setRawInputs] = useState<Record<NumericKey, string>>(() => Object.fromEntries(
    (Object.keys(POSITION_RISK_DEFAULT) as NumericKey[]).map(k => [k, String(POSITION_RISK_DEFAULT[k])]),
  ) as Record<NumericKey, string>);
  const [selected, setSelected] = useState(5);
  const reduced = useReducedMotion();
  const input = useMemo(() => Object.fromEntries((Object.keys(POSITION_RISK_DEFAULT) as NumericKey[]).map(k => [k, rawInputs[k].trim() === '' ? NaN : Number(rawInputs[k])])) as unknown, [rawInputs]);
  const isValid = validatePositionRiskInput(input);
  const result = useMemo(() => isValid ? calculatePositionStress(input) : null, [input, isValid]);
  const row = result?.shocks[selected] ?? null;
  const update = (key: NumericKey, value: string) => setRawInputs(old => ({ ...old, [key]: value }));
  const reset = () => { setRawInputs(Object.fromEntries((Object.keys(POSITION_RISK_DEFAULT) as NumericKey[]).map(k => [k, String(POSITION_RISK_DEFAULT[k])])) as Record<NumericKey, string>); setSelected(5); };

  return <section className="position-terminal" aria-label="Hypothetical position stress engine">
    <div className="position-warning"><span><span className="status-square"/> DEMONSTRATION DATA / MANUAL INPUT</span><span>NO LIVE ACCOUNT DECODING · NO TRADES</span></div>
    <div className="position-top-grid">
      <div className="position-input-console">
        <div className="position-panel-title"><span className="micro-label">01 / EXPOSURE INPUTS</span><button onClick={reset} className="position-reset" type="button">RESET STUDY ↗</button></div>
        <h2>Define the <em>position.</em></h2>
        <p className="position-panel-sub">Adjust the assumptions. Every result changes immediately. Values are provided by you, not imported from a verified Drift account.</p>
        <div className="position-fields">
          {fields.map(f => <label className="position-field" key={f.key}><span className="position-field-desc"><strong>{f.label}</strong><small>{f.hint}</small></span><span className="position-field-input"><input type="number" step={f.step} value={rawInputs[f.key]} onChange={e => update(f.key, e.target.value)} aria-label={f.label}/><span>{f.unit}</span></span></label>)}
        </div>
        {!isValid && <p className="position-input-error" role="alert">Some parameters are empty or outside the supported range. Correct them to resume the study.</p>}
        <div className="position-input-note"><Icon name="shield" size={18}/><span>Nothing here is submitted to a wallet or trading venue. Spot holdings and perpetual margin are modeled as separate accounts.</span></div>
      </div>
      <div className="position-results-console">
        <div className="position-panel-title"><span className="micro-label">02 / RISK OBSERVATORY</span><span className="position-led"><span/> DETERMINISTIC MODEL</span></div>
        <div className="position-results-heading"><div><span>NET DIRECTIONAL EXPOSURE</span><motion.strong key={result?.netDeltaNotionalUsd ?? 0} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .27 }}>{result ? signedUsd(result.netDeltaNotionalUsd) : '—'}</motion.strong><small>{result ? `${numberString(result.netDeltaBaseSol)} SOL · ${result.residualDeltaPctOfGross.toFixed(2)}% OF GROSS` : 'INVALID MODEL PARAMETERS'}</small></div><div className="position-math-icon" aria-hidden="true"><span>Δ</span><span>≠</span><span>0</span></div></div>
        <div className="position-lattice"><div className="position-lattice-top"><span>STRESS LATTICE / 007</span><span>PRICE SHOCKS</span></div>{result ? <ExposureLattice rows={result.shocks} selected={selected}/> : <div className="position-empty-graph">Waiting for valid parameters.</div>}<div className="position-shock-keys" role="group" aria-label="Choose hypothetical SOL price shock">{[-40,-25,-10,0,10,25,40].map((shock, i) => <button key={shock} className={i === selected ? 'selected' : ''} type="button" aria-pressed={i === selected} onClick={() => setSelected(i)}>{shock > 0 ? '+' : ''}{shock}%</button>)}</div></div>
        <div className="position-selected"><div><span>SELECTED SHOCK</span><strong>{row ? `${row.shockPct > 0 ? '+' : ''}${row.shockPct}%` : '—'}</strong></div><div><span>COMBINED PNL + FUNDING</span><strong className={row && row.combinedPnlUsd < 0 ? 'negative' : ''}>{row ? signedUsd(row.combinedPnlUsd) : '—'}</strong></div><div><span>ILLUSTRATIVE BUFFER</span><strong className={row?.guardrail === 'below' ? 'negative' : ''}>{row ? signedUsd(row.estimatedBufferUsd) : '—'}</strong></div></div>
      </div>
    </div>
    <div className="position-evidence-grid">
      <div className="position-evidence-panel"><div className="position-panel-title"><span className="micro-label">03 / PNL BREAKDOWN</span><span>SCENARIO, NOT FORECAST</span></div><h3>Under the <em>surface.</em></h3><div className="position-breakdown"><div><span>SPOT PRICE MOVE</span><strong>{row ? signedUsd(row.spotPnlUsd) : '—'}</strong></div><div><span>PERP PRICE MOVE</span><strong>{row ? signedUsd(row.perpPnlUsd) : '—'}</strong></div><div><span>ASSUMED FUNDING CARRY</span><strong>{row ? signedUsd(row.modeledFundingUsd) : '—'}</strong></div><div><span>MODELED TOTAL</span><strong>{row ? signedUsd(row.combinedPnlUsd) : '—'}</strong></div></div><p>Assumes linear SOL price changes, unchanged daily funding, and no fees, slippage or basis shifts. A strong apparent hedge can still incur significant real-world losses.</p></div>
      <div className="position-evidence-panel"><div className="position-panel-title"><span className="micro-label">04 / MARGIN HYPOTHESIS</span><span>NOT DRIFT HEALTH</span></div><h3>Watch the <em>buffer.</em></h3><div className="position-breakdown"><div><span>ESTIMATED PERP EQUITY</span><strong>{row ? compactUsd(row.estimatedMarginEquityUsd) : '—'}</strong></div><div><span>ASSUMED MAINTENANCE</span><strong>{row ? compactUsd(row.hypotheticalMaintenanceUsd) : '—'}</strong></div><div><span>HYPOTHETICAL BUFFER</span><strong className={row?.guardrail === 'below' ? 'position-bad' : ''}>{row ? signedUsd(row.estimatedBufferUsd) : '—'}</strong></div><div><span>ASSUMPTION STATUS</span><strong>{row ? row.guardrail === 'below' ? 'BELOW BUFFER' : 'ABOVE BUFFER' : '—'}</strong></div></div><p>This buffer is <strong>not a Drift liquidation price, margin health score or liquidation trigger.</strong> Actual risk uses venue-specific collateral weights, margin tiers, oracle prices, PnL rules and other factors.</p></div>
    </div>
    <div className="position-proof-footer"><div><span className="micro-label">05 / THE EVIDENCE BOUNDARY</span><h3>Calculations are transparent.<br/><em>Positions must be proven.</em></h3><p>Use Drift Lens to verify a public User subaccount and see external indexed records. Those records are not enough to automatically populate this study as current positions. We intentionally keep the two workflows separate until on-chain account decoding and oracle reconciliation are implemented.</p></div><Link href="/drift-lens" className="button-primary">VERIFY A DRIFT ACCOUNT <Icon name="arrowUp" size={16}/></Link></div>
  </section>;
}
