"use client";
import { useMemo, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "./Icons";
import { calculateScenario, DEFAULT_SCENARIO, signedUsd, usd, type ScenarioInput } from "@/lib/scenario";

type Key = keyof ScenarioInput;
const fields: Array<{ key: Key; label: string; min: number; max: number; step: number; format: (n: number) => string; foot: string }> = [
  { key: "spotNotionalUsd", label: "Spot position", min: 5000, max: 100000, step: 1000, format: (v) => usd(v), foot: "Assumed SOL spot exposure" },
  { key: "hedgeRatioPct", label: "Perpetual hedge", min: 50, max: 150, step: 5, format: (v) => `${v}%`, foot: "Short position as % of spot" },
  { key: "priceMovePct", label: "SOL price movement", min: -60, max: 60, step: 1, format: (v) => `${v > 0 ? "+" : ""}${v}%`, foot: "One hypothetical market move" },
  { key: "annualFundingPct", label: "Annualized funding", min: -30, max: 30, step: 1, format: (v) => `${v > 0 ? "+" : ""}${v}%`, foot: "Simplified funding assumption" },
  { key: "days", label: "Holding period", min: 1, max: 180, step: 1, format: (v) => `${v} days`, foot: "Fixed hypothetical duration" },
];

function OutputBar({ name, amount, max, accent }: { name: string; amount: number; max: number; accent: string }) {
  const reduced = useReducedMotion();
  const pct = Math.max(2, Math.min(100, (Math.abs(amount) / max) * 100));
  return <div className="output-row"><div className="output-label"><span>{name}</span><strong className={amount < 0 ? "negative" : ""}>{signedUsd(amount)}</strong></div><div className="output-track"><motion.div className={`output-fill ${accent}`} initial={reduced ? false : { width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 140, damping: 26 }}/></div></div>;
}

export function ScenarioStudio({ compact = false }: { compact?: boolean }) {
  const [params, setParams] = useState<ScenarioInput>(DEFAULT_SCENARIO);
  const result = useMemo(() => calculateScenario(params), [params]);
  const max = Math.max(Math.abs(result.spotPnlUsd), Math.abs(result.perpPnlUsd), Math.abs(result.fundingPnlUsd), 1);
  const status = Math.abs(result.netDeltaPct) <= 4 ? "BALANCED EXPOSURE" : result.netDeltaPct > 0 ? "NET LONG EXPOSURE" : "NET SHORT EXPOSURE";
  return <div className={`studio ${compact ? "studio-compact" : ""}`}>
    <div className="studio-sidebar"><div className="studio-section-head"><span className="micro-label">01 / SCENARIO INPUTS</span><span className="studio-indicator"><span className="status-square"/> EDITABLE</span></div>
      <div className="studio-intro"><h2>Change the inputs.<br/><em>Watch the outcome.</em></h2><p>This is a simplified scenario, not a forecast. Every number is derived from the assumptions you choose.</p></div>
      <div className="studio-sliders">{fields.map((field) => {
        const val = params[field.key];
        return <div className="studio-slider" key={field.key}><div className="slider-top"><label htmlFor={`studio-${field.key}`}>{field.label}</label><strong>{field.format(val)}</strong></div>
        <input id={`studio-${field.key}`} type="range" min={field.min} max={field.max} step={field.step} value={val} onChange={(e) => setParams((previous) => ({ ...previous, [field.key]: Number(e.target.value) }))} style={{ "--value": `${((val - field.min) / (field.max - field.min)) * 100}%` } as CSSProperties}/>
        <p>{field.foot}</p></div>;
      })}</div>
      <button className="reset-button" onClick={() => setParams(DEFAULT_SCENARIO)}>RESET DEFAULT ASSUMPTIONS <Icon name="cross" size={15}/></button>
    </div>
    <div className="studio-results"><div className="studio-section-head"><span className="micro-label">02 / MODELED OUTCOME</span><span className="model-tag">SIMULATION ONLY</span></div>
      <div className="result-hero"><span>MODELED NET P/L</span><motion.strong key={Math.round(result.modeledPnlUsd)} initial={{ opacity: .5, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} className={result.modeledPnlUsd < 0 ? "negative" : ""}>{signedUsd(result.modeledPnlUsd)}</motion.strong><div className="result-sub"><span className={Math.abs(result.netDeltaPct) < 5 ? "good-dot" : "warning-dot"} /> {status} <span>•</span> {params.days} DAY HYPOTHESIS</div></div>
      <div className="result-breakdown"><OutputBar name="SPOT / PRICE EFFECT" amount={result.spotPnlUsd} max={max} accent="fill-spot"/><OutputBar name="PERP / PRICE EFFECT" amount={result.perpPnlUsd} max={max} accent="fill-perp"/><OutputBar name="PERP / FUNDING EFFECT" amount={result.fundingPnlUsd} max={max} accent="fill-funding"/></div>
      <div className="metrics-split"><div><span>RESIDUAL DELTA</span><strong>{result.netDeltaPct > 0 ? "+" : ""}{result.netDeltaPct.toFixed(0)}%</strong></div><div><span>GROSS EXPOSURE</span><strong>{usd(result.grossExposureUsd)}</strong></div><div><span>SHORT NOTIONAL</span><strong>{usd(result.hedgeNotionalUsd)}</strong></div><div><span>PRICE-ONLY P/L</span><strong className={result.pricePnlUsd < 0 ? "negative" : ""}>{signedUsd(result.pricePnlUsd)}</strong></div></div>
      <div className="model-warning"><Icon name="shield" size={19}/><p><strong>Model boundaries.</strong> This simplified calculation excludes liquidation, margin requirements, spread, execution slippage, basis, borrow, fees, and protocol failures. Funding may change continuously; assumed annualized funding is not a yield promise.</p></div>
    </div>
  </div>;
}
