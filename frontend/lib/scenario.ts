/**
 * Pure deterministic educational scenario model.
 * No market-data input and no claim of trading/portfolio accuracy.
 * This model intentionally excludes basis, fees, slippage, borrow, margin,
 * liquidation, execution timing, and protocol/counterparty risks.
 */
export interface ScenarioInput {
  spotNotionalUsd: number;
  hedgeRatioPct: number;
  priceMovePct: number;
  annualFundingPct: number;
  days: number;
}

export interface ScenarioResult {
  spotPnlUsd: number;
  perpPnlUsd: number;
  fundingPnlUsd: number;
  pricePnlUsd: number;
  modeledPnlUsd: number;
  netDeltaPct: number;
  grossExposureUsd: number;
  hedgeNotionalUsd: number;
}

export const DEFAULT_SCENARIO: ScenarioInput = {
  spotNotionalUsd: 25000,
  hedgeRatioPct: 100,
  priceMovePct: -18,
  annualFundingPct: 8,
  days: 30,
};

export const SCENARIO_LIMITS = {
  spotNotionalUsd: [100, 1000000],
  hedgeRatioPct: [0, 150],
  priceMovePct: [-90, 300],
  annualFundingPct: [-100, 100],
  days: [1, 365],
} as const;

export function validateScenario(value: unknown): value is ScenarioInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (Object.keys(SCENARIO_LIMITS) as Array<keyof ScenarioInput>).every((key) => {
    const number = v[key];
    const [min, max] = SCENARIO_LIMITS[key];
    return typeof number === "number" && Number.isFinite(number) && number >= min && number <= max;
  });
}

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  if (!validateScenario(input)) throw new RangeError("Scenario parameters out of range");
  const priceMove = input.priceMovePct / 100;
  const hedgeRatio = input.hedgeRatioPct / 100;
  const hedgeNotionalUsd = input.spotNotionalUsd * hedgeRatio;
  const spotPnlUsd = input.spotNotionalUsd * priceMove;
  const perpPnlUsd = -hedgeNotionalUsd * priceMove;
  const fundingPnlUsd = hedgeNotionalUsd * (input.annualFundingPct / 100) * (input.days / 365);
  const pricePnlUsd = spotPnlUsd + perpPnlUsd;
  return {
    spotPnlUsd,
    perpPnlUsd,
    fundingPnlUsd,
    pricePnlUsd,
    modeledPnlUsd: pricePnlUsd + fundingPnlUsd,
    netDeltaPct: 100 - input.hedgeRatioPct,
    grossExposureUsd: input.spotNotionalUsd + hedgeNotionalUsd,
    hedgeNotionalUsd,
  };
}

export function usd(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function signedUsd(value: number, digits = 0) {
  return `${value > 0 ? "+" : ""}${usd(value, digits)}`;
}
