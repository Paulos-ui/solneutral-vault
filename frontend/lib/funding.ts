/**
 * Drift indexed funding observation parser.
 * All numbers are derived from external indexed market records, never a simulated vault.
 * The calculation uses the general rate-unit normalization documented by Drift data API examples.
 */
export interface FundingObservation {
  time: string;
  market: 'SOL-PERP';
  hourlyPct: number;
  annualizedPct: number;
  oracleTwapUsd: number;
  slot: number | null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function recordTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const numeric = finiteNumber(value);
  const timestamp = numeric !== null
    ? (numeric > 1e12 ? numeric : numeric * 1000)
    : Date.parse(String(value));
  if (!Number.isFinite(timestamp)) return null;
  const now = Date.now();
  // Never report a very old or future-dated observation as a current market signal.
  if (timestamp > now + 5 * 60_000 || timestamp < now - 45 * 86_400_000) return null;
  return timestamp;
}

export function parseDriftFundingRow(row: unknown): FundingObservation | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const r = row as Record<string, unknown>;
  const funding = finiteNumber(r.fundingRate);
  const oracleTwap = finiteNumber(r.oraclePriceTwap);
  const timeMs = recordTimestamp(r.ts);
  if (funding === null || oracleTwap === null || oracleTwap <= 0 || timeMs === null) return null;
  // Indexer convention: fundingRate quote/base precision 1e9, oraclePriceTwap USD precision 1e6.
  // One indexed interval is normally hourly. This annualization is only an extrapolation.
  const hourlyPct = ((funding / 1e9) / (oracleTwap / 1e6)) * 100;
  const annualizedPct = hourlyPct * 24 * 365;
  if (!Number.isFinite(annualizedPct) || Math.abs(annualizedPct) > 100_000) return null;
  const slot = finiteNumber(r.slot);
  return {
    market: 'SOL-PERP', time: new Date(timeMs).toISOString(),
    hourlyPct, annualizedPct, oracleTwapUsd: oracleTwap / 1e6,
    slot: slot !== null && Number.isSafeInteger(slot) && slot >= 0 ? slot : null,
  };
}

export function parseDriftFundingResponse(data: unknown): FundingObservation[] {
  // Drift serves more than one public indexer URL shape; only validate rows
  // regardless of envelope. Do not infer any nonexistent funding observation.
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  const nested = obj.data && typeof obj.data === 'object' ? obj.data as Record<string,unknown> : null;
  const records = Array.isArray(data) ? data : (obj.fundingRates ?? nested?.fundingRates ?? obj.records);
  if (!Array.isArray(records)) return [];
  const observations = records.map(parseDriftFundingRow).filter((r): r is FundingObservation => r !== null);
  observations.sort((a, b) => b.time.localeCompare(a.time));
  const seen = new Set<string>();
  return observations.filter(r => {
    const key = `${r.time}/${r.slot ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 48);
}
