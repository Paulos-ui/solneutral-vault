import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDriftFundingRow, parseDriftFundingResponse } from '../lib/funding.ts';

const nowSec = Math.floor(Date.now() / 1000);
const sample = { fundingRate: '1000000', oraclePriceTwap: '150000000', ts: String(nowSec - 60), slot: 123456 };

describe('Drift sourced funding normalization', () => {
  test('normalizes rate and sorts indexed observations', () => {
    const older = { ...sample, ts: String(nowSec - 3600) };
    const parsed = parseDriftFundingResponse({ fundingRates: [older, sample] });
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].slot, 123456);
    assert.ok(parsed[0].time > parsed[1].time);
    assert.ok(Math.abs(parsed[0].hourlyPct - (1 / 1500)) < 1e-8);
  });
  test('rejects malformed and unreasonable source observations', () => {
    assert.equal(parseDriftFundingRow({ ...sample, oraclePriceTwap: '0' }), null);
    assert.equal(parseDriftFundingRow({ ...sample, fundingRate: 'NaN' }), null);
    assert.equal(parseDriftFundingRow({ ...sample, ts: String(nowSec + 86_400) }), null);
    assert.equal(parseDriftFundingRow({ ...sample, ts: String(nowSec - 47 * 86_400) }), null);
    assert.deepEqual(parseDriftFundingResponse({ unexpected: [] }), []);
  });
  test('removes duplicated observations', () => {
    assert.equal(parseDriftFundingResponse({ fundingRates: [sample, sample] }).length, 1);
  });
});
