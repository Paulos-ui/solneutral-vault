/**
 * SolNeutral Position Stress Engine — transparent, deterministic, hypothetical model.
 * INPUTS ARE MANUALLY PROVIDED. This is NOT decoded Drift User state or an
 * implementation of Drift's SPAN/IMF/margin/liquidation rules.
 */
export interface PositionRiskInput {
  spotBaseSol: number;
  perpBaseSol: number; // signed; negative = short
  markPriceUsd: number;
  isolatedCollateralUsd: number;
  maintenanceAssumptionPct: number; // user hypothesis, not Drift maintenance ratio
  fundingAssumptionDailyPct: number; // positive = longs pay shorts, hypothesis
  horizonDays: number;
}

export interface PositionShock {
  shockPct: number;
  shockedPriceUsd: number;
  spotPnlUsd: number;
  perpPnlUsd: number;
  modeledFundingUsd: number;
  combinedPnlUsd: number;
  estimatedMarginEquityUsd: number;
  hypotheticalMaintenanceUsd: number;
  estimatedBufferUsd: number;
  guardrail: 'above' | 'below';
}

export interface PositionRiskResult {
  spotNotionalUsd: number;
  perpNotionalUsd: number;
  grossNotionalUsd: number;
  netDeltaBaseSol: number;
  netDeltaNotionalUsd: number;
  residualDeltaPctOfGross: number;
  startingGrossToCollateral: number | null;
  shocks: PositionShock[];
}

export const POSITION_RISK_DEFAULT: PositionRiskInput = {
  spotBaseSol: 120,
  perpBaseSol: -115,
  markPriceUsd: 160,
  isolatedCollateralUsd: 10000,
  maintenanceAssumptionPct: 5,
  fundingAssumptionDailyPct: 0.015,
  horizonDays: 7,
};

export const POSITION_SHOCKS = [-40, -25, -10, 0, 10, 25, 40] as const;
const BOUNDS: Record<keyof PositionRiskInput, readonly [number, number]> = {
  spotBaseSol: [0, 10000],
  perpBaseSol: [-10000, 10000],
  markPriceUsd: [0.01, 100000],
  isolatedCollateralUsd: [0, 100000000],
  maintenanceAssumptionPct: [0, 50],
  fundingAssumptionDailyPct: [-2, 2],
  horizonDays: [1, 90],
};

export function validatePositionRiskInput(value: unknown): value is PositionRiskInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== Object.keys(BOUNDS).length) return false;
  return (Object.keys(BOUNDS) as Array<keyof PositionRiskInput>).every((key) => {
    const number = data[key];
    const [min, max] = BOUNDS[key];
    return typeof number === 'number' && Number.isFinite(number) && number >= min && number <= max;
  });
}

const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Funding carry uses the INITIAL short/long notional throughout the selected horizon.
 * No compounding or adjustment for shocks. There is no guarantee funding persists.
 */
export function calculatePositionStress(input: PositionRiskInput): PositionRiskResult {
  if (!validatePositionRiskInput(input)) throw new RangeError('Position inputs invalid or outside permitted limits');
  const spotNotional = input.spotBaseSol * input.markPriceUsd;
  const perpNotional = input.perpBaseSol * input.markPriceUsd;
  const grossNotional = Math.abs(spotNotional) + Math.abs(perpNotional);
  const netDeltaBase = input.spotBaseSol + input.perpBaseSol;
  const assumedFunding = -perpNotional * (input.fundingAssumptionDailyPct / 100) * input.horizonDays;
  const shocks = POSITION_SHOCKS.map((shockPct): PositionShock => {
    const shockedPrice = input.markPriceUsd * (1 + shockPct / 100);
    const deltaPrice = shockedPrice - input.markPriceUsd;
    const spotPnl = input.spotBaseSol * deltaPrice;
    const perpPnl = input.perpBaseSol * deltaPrice;
    // Spot PnL is outside the assumed perpetual collateral account.
    const marginEquity = input.isolatedCollateralUsd + perpPnl + assumedFunding;
    const assumedMaintenance = Math.abs(input.perpBaseSol * shockedPrice) * input.maintenanceAssumptionPct / 100;
    const buffer = marginEquity - assumedMaintenance;
    return {
      shockPct,
      shockedPriceUsd: round(shockedPrice),
      spotPnlUsd: round(spotPnl),
      perpPnlUsd: round(perpPnl),
      modeledFundingUsd: round(assumedFunding),
      combinedPnlUsd: round(spotPnl + perpPnl + assumedFunding),
      estimatedMarginEquityUsd: round(marginEquity),
      hypotheticalMaintenanceUsd: round(assumedMaintenance),
      estimatedBufferUsd: round(buffer),
      guardrail: buffer >= 0 ? 'above' : 'below',
    };
  });
  return {
    spotNotionalUsd: round(spotNotional),
    perpNotionalUsd: round(perpNotional),
    grossNotionalUsd: round(grossNotional),
    netDeltaBaseSol: round(netDeltaBase),
    netDeltaNotionalUsd: round(netDeltaBase * input.markPriceUsd),
    residualDeltaPctOfGross: grossNotional === 0 ? 0 : round(Math.abs(netDeltaBase * input.markPriceUsd) / grossNotional * 100),
    startingGrossToCollateral: input.isolatedCollateralUsd > 0 ? round(grossNotional / input.isolatedCollateralUsd) : null,
    shocks,
  };
}
