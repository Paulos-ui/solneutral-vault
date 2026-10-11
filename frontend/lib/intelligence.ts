/** Deterministic, explainable decision support. No claims of real trades. */
import { calculatePositionStress, validatePositionRiskInput, type PositionRiskInput } from './position-risk.ts';

export type Severity = 'critical' | 'caution' | 'informational';
export type Finding = { id: string; severity: Severity; title: string; explanation: string; evidence: string };
export interface FundingEvidence { status: 'observed' | 'stale' | 'unavailable'; hourlyPct: number | null; ageMinutes: number | null; source: string | null; }
export type IntelligenceSnapshot = { assumptions: PositionRiskInput; funding: FundingEvidence };
export const DEFAULT_EVIDENCE: FundingEvidence = { status: 'unavailable', hourlyPct: null, ageMinutes: null, source: null };

export function validFundingEvidence(input: unknown): input is FundingEvidence {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const f = input as Record<string, unknown>;
  if (!['observed', 'stale', 'unavailable'].includes(String(f.status))) return false;
  return (f.hourlyPct === null || (typeof f.hourlyPct === 'number' && Number.isFinite(f.hourlyPct) && Math.abs(f.hourlyPct) < 100)) &&
    (f.ageMinutes === null || (Number.isSafeInteger(f.ageMinutes) && (f.ageMinutes as number) >= 0)) &&
    (f.source === null || (typeof f.source === 'string' && f.source.length <= 250));
}

export function analyzeSnapshot(snapshot: IntelligenceSnapshot): Finding[] {
  if (!validatePositionRiskInput(snapshot.assumptions) || !validFundingEvidence(snapshot.funding)) throw new RangeError('Invalid evidence snapshot');
  const { assumptions, funding } = snapshot;
  const model = calculatePositionStress(assumptions);
  const out: Finding[] = [];
  const add = (id: string, severity: Severity, title: string, explanation: string, evidence: string) => out.push({ id, severity, title, explanation, evidence });
  const breached = model.shocks.filter(s => s.guardrail === 'below');
  if (breached.length) add('buffer', 'critical', 'Hypothetical margin buffer breached', `${breached.length} of seven modeled price shocks cross your assumed collateral buffer. This is NOT a Drift liquidation forecast.`, `Assumed collateral $${assumptions.isolatedCollateralUsd.toLocaleString()}; maintenance ${assumptions.maintenanceAssumptionPct}%`);
  else add('buffer', 'informational', 'Modeled buffer remains positive', 'The seven price shocks do not cross the user-supplied maintenance threshold. Real exchange margin health may differ.', 'Seven illustrative shocks from −40% to +40%');
  if (model.residualDeltaPctOfGross > 10) add('delta', 'caution', 'Material residual direction exposure', 'Spot and perpetual quantities do not cancel closely. Market direction remains important.', `${model.netDeltaBaseSol} SOL net; ${model.residualDeltaPctOfGross}% of gross notional`);
  else add('delta', 'informational', 'Directional exposure comparatively balanced', 'The assumed spot and perpetual legs largely offset in the local scenario model, not an executed hedge.', `${model.netDeltaBaseSol} SOL net; ${model.residualDeltaPctOfGross}% of gross notional`);
  if (assumptions.fundingAssumptionDailyPct < 0 && assumptions.perpBaseSol < 0) add('funding-assumption', 'caution', 'Negative funding assumption', 'A short perpetual position pays funding when the assumed market funding is negative.', `${assumptions.fundingAssumptionDailyPct}% per day hypothesis; ${assumptions.horizonDays} days`);
  if (funding.status === 'unavailable') add('provenance', 'caution', 'Market funding not verified', 'The external funding source is unavailable. Do not treat modeled carry as observed earnings.', 'Drift indexer unavailable or unsupported');
  else if (funding.status === 'stale' || (funding.ageMinutes ?? Infinity) > 180) add('provenance', 'caution', 'Market observation is delayed', 'The latest funding observation is too old for a current market decision. Refresh or use a fresh source.', `${funding.ageMinutes ?? 'Unknown'} minutes since index`);
  else add('provenance', 'informational', 'Indexed funding observation available', 'A market-wide funding record was indexed. It does not prove vault earnings or ongoing future funding.', `${funding.hourlyPct?.toFixed(5) ?? '—'}% / hour; age ${funding.ageMinutes} minutes`);
  return out;
}

export type StrategyProfile = { id: string; name: string; rationale: string; hedgeFraction: number; collateralFactor: number; };
export const STRATEGY_PROFILES: StrategyProfile[] = [
  { id: 'defensive', name: 'Buffer first', rationale: 'More collateral and a deliberately conservative short', hedgeFraction: 0.9, collateralFactor: 1.6 },
  { id: 'balanced', name: 'Near-neutral', rationale: 'Close directional offset with baseline collateral', hedgeFraction: 1, collateralFactor: 1 },
  { id: 'capital', name: 'Capital tight', rationale: 'Higher collateral utilization, more vulnerable to a margin shock', hedgeFraction: 1, collateralFactor: 0.55 },
];
export function compareStrategies(baseline: PositionRiskInput) {
  if (!validatePositionRiskInput(baseline)) throw new RangeError('Invalid baseline');
  return STRATEGY_PROFILES.map(profile => {
    const input = { ...baseline, perpBaseSol: -baseline.spotBaseSol * profile.hedgeFraction, isolatedCollateralUsd: baseline.isolatedCollateralUsd * profile.collateralFactor };
    // round is necessary because modified inputs must stay bounded
    const valid = validatePositionRiskInput(input);
    if (!valid) return { profile, valid: false as const, risk: null };
    const result = calculatePositionStress(input);
    return { profile, valid: true as const, risk: { netDelta: result.netDeltaBaseSol, residualDeltaPct: result.residualDeltaPctOfGross, stressedBuffer: Math.min(...result.shocks.map(s => s.estimatedBufferUsd)), scenariosBreached: result.shocks.filter(s => s.guardrail === 'below').length, maxScenarioLoss: Math.min(...result.shocks.map(s => s.combinedPnlUsd)), grossToCollateral: result.startingGrossToCollateral } };
  });
}

export function evaluateLocalAlerts(funding: FundingEvidence, threshold: number): Finding[] {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 50) throw new RangeError('Invalid alert threshold');
  if (funding.status !== 'observed' || funding.hourlyPct === null || funding.ageMinutes === null || funding.ageMinutes > 180) return [];
  const daily = funding.hourlyPct * 24;
  if (Math.abs(daily) < threshold) return [];
  return [{ id: 'funding-watch', severity: 'caution', title: 'Funding threshold crossed', explanation: 'An indexed market-wide funding observation crossed your in-page research threshold. This is not a trading signal.', evidence: `${daily.toFixed(4)}% extrapolated per day versus ${threshold.toFixed(3)}% threshold` }];
}
