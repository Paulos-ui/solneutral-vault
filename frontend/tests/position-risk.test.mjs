import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePositionStress, validatePositionRiskInput, POSITION_RISK_DEFAULT } from '../lib/position-risk.ts';

describe('Position Stress Engine: audited deterministic assumptions', () => {
  test('exactly offsetting prices have zero net directional PnL in all shocks', () => {
    const result = calculatePositionStress({ ...POSITION_RISK_DEFAULT, spotBaseSol: 100, perpBaseSol: -100, fundingAssumptionDailyPct: 0 });
    assert.equal(result.residualDeltaPctOfGross, 0);
    assert.deepEqual(result.shocks.map(r => r.combinedPnlUsd), [0, 0, 0, 0, 0, 0, 0]);
  });
  test('long spot with undersized short loses under falling prices and gains on upside', () => {
    const result = calculatePositionStress({ ...POSITION_RISK_DEFAULT, fundingAssumptionDailyPct: 0 });
    assert.equal(result.netDeltaBaseSol, 5);
    assert.equal(result.netDeltaNotionalUsd, 800);
    assert.equal(result.shocks[0].combinedPnlUsd, -320);
    assert.equal(result.shocks.at(-1).combinedPnlUsd, 320);
  });
  test('negative funding rate makes shorts pay while positive lets shorts receive', () => {
    const positive = calculatePositionStress({ ...POSITION_RISK_DEFAULT, fundingAssumptionDailyPct: 0.1, horizonDays: 1 });
    const negative = calculatePositionStress({ ...POSITION_RISK_DEFAULT, fundingAssumptionDailyPct: -0.1, horizonDays: 1 });
    assert.equal(positive.shocks[3].modeledFundingUsd, 18.4);
    assert.equal(negative.shocks[3].modeledFundingUsd, -18.4);
  });
  test('spot gains never silently become usable perpetual collateral', () => {
    const result = calculatePositionStress({ ...POSITION_RISK_DEFAULT, isolatedCollateralUsd: 0, fundingAssumptionDailyPct: 0 });
    const down = result.shocks[0];
    assert.equal(down.estimatedMarginEquityUsd, 7360);
    assert.equal(down.spotPnlUsd, -7680);
    assert.equal(result.startingGrossToCollateral, null);
  });
  test('flags a breached hypothetical guardrail, never a protocol liquidation event', () => {
    const result = calculatePositionStress({ ...POSITION_RISK_DEFAULT, isolatedCollateralUsd: 1000, fundingAssumptionDailyPct: 0 });
    const up = result.shocks.at(-1);
    assert.equal(up.guardrail, 'below');
    assert.ok(up.estimatedBufferUsd < 0);
  });
  test('rejects invalid and unbounded inputs including NaN, Infinity, keys, strings', () => {
    assert.equal(validatePositionRiskInput({ ...POSITION_RISK_DEFAULT, markPriceUsd: Infinity }), false);
    assert.equal(validatePositionRiskInput({ ...POSITION_RISK_DEFAULT, spotBaseSol: -1 }), false);
    assert.equal(validatePositionRiskInput({ ...POSITION_RISK_DEFAULT, horizonDays: '7' }), false);
    assert.equal(validatePositionRiskInput({ ...POSITION_RISK_DEFAULT, apiKey: 'abc' }), false);
    assert.throws(() => calculatePositionStress({ ...POSITION_RISK_DEFAULT, markPriceUsd: NaN }), RangeError);
  });
  test('empty portfolio is handled without invented leverage or delta', () => {
    const result = calculatePositionStress({ ...POSITION_RISK_DEFAULT, spotBaseSol: 0, perpBaseSol: 0, isolatedCollateralUsd: 0 });
    assert.equal(result.grossNotionalUsd, 0);
    assert.equal(result.residualDeltaPctOfGross, 0);
    assert.equal(result.startingGrossToCollateral, null);
  });
});
