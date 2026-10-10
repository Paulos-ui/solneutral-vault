import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateScenario, validateScenario } from '../lib/scenario.ts';

describe('deterministic research scenario model', () => {
  const baseline = { spotNotionalUsd: 25000, hedgeRatioPct: 100, priceMovePct: -20, annualFundingPct: 0, days: 30 };
  test('100% hedge offsets linear price move before costs', () => {
    const outcome = calculateScenario(baseline);
    assert.equal(outcome.spotPnlUsd, -5000);
    assert.equal(outcome.perpPnlUsd, 5000);
    assert.equal(outcome.pricePnlUsd, 0);
    assert.equal(outcome.netDeltaPct, 0);
  });
  test('80% hedge leaves residual long delta', () => {
    const outcome = calculateScenario({ ...baseline, hedgeRatioPct: 80 });
    assert.equal(outcome.pricePnlUsd, -1000);
    assert.equal(outcome.netDeltaPct, 20);
  });
  test('negative funding costs money even at a balanced hedge', () => {
    const outcome = calculateScenario({ ...baseline, annualFundingPct: -20, days: 365 });
    assert.equal(outcome.fundingPnlUsd, -5000);
    assert.equal(outcome.modeledPnlUsd, -5000);
  });
  test('rejects invalid and non-finite input', () => {
    assert.equal(validateScenario({ ...baseline, spotNotionalUsd: Infinity }), false);
    assert.equal(validateScenario({ ...baseline, hedgeRatioPct: 200 }), false);
    assert.equal(validateScenario({ ...baseline, days: -1 }), false);
    assert.throws(() => calculateScenario({ ...baseline, days: 0 }), RangeError);
  });
});
