import type { Metadata } from 'next';
import { PositionRiskEngine } from '@/components/PositionRiskEngine';
export const metadata: Metadata = {
  title: 'Position Risk Engine — SolNeutral',
  description: 'Model hypothetical spot and perpetual position exposures, funding carry and margin assumptions with explainable deterministic stress scenarios. No trades or verified Drift risk scores.',
};
export default function RiskEnginePage() {
  return <div className="shell inner-page position-risk-page">
    <div className="page-kicker"><span className="small-disc"/> INSTRUMENT / 05 — POSITION STRESS ENGINE <span>MANUAL SCENARIOS / NO EXECUTION</span></div>
    <div className="position-page-head"><div><span className="micro-label">BETTER QUESTIONS / HIGHER STANDARDS</span><h1>POSITION<br/><em>UNDER PRESSURE.</em></h1></div><div><p>Move past a single APY. Explore the mechanics of a long spot and short perpetual hedge under changing prices, funding and user-supplied margin assumptions.</p><small>SEVEN PRICE SCENARIOS / DETERMINISTIC MATH</small></div></div>
    <PositionRiskEngine/>
  </div>;
}
