import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSnapshot, compareStrategies, evaluateLocalAlerts, DEFAULT_EVIDENCE } from '../lib/intelligence.ts';
import { POSITION_RISK_DEFAULT } from '../lib/position-risk.ts';

test('evidence unavailable generates no invented rate', () => {
 const findings=analyzeSnapshot({assumptions: POSITION_RISK_DEFAULT, funding: DEFAULT_EVIDENCE});
 assert.equal(findings.find(x => x.id === 'provenance').severity,'caution');
 assert.ok(!findings.some(x => /guaranteed|risk-free/i.test(x.explanation)));
});
test('capital-tight profile has lower collateral buffer than baseline', () => {
 const profiles=compareStrategies(POSITION_RISK_DEFAULT);
 assert.equal(profiles.length,3);
 assert.ok(profiles[2].risk.stressedBuffer < profiles[1].risk.stressedBuffer);
});
test('actual threshold only triggers on fresh observed indexed data', () => {
 const fresh={status:'observed',hourlyPct:0.01,ageMinutes:2,source:'indexer'};
 assert.equal(evaluateLocalAlerts(fresh,0.2).length,1);
 assert.equal(evaluateLocalAlerts({...fresh,status:'stale'},0.2).length,0);
 assert.equal(evaluateLocalAlerts({...fresh,ageMinutes:300},0.2).length,0);
});
test('rejects invalid model inputs and unsafe evidence', () => {
 assert.throws(()=>analyzeSnapshot({ assumptions:{...POSITION_RISK_DEFAULT, markPriceUsd:Infinity},funding:DEFAULT_EVIDENCE }),RangeError);
 assert.throws(()=>analyzeSnapshot({ assumptions:POSITION_RISK_DEFAULT,funding:{...DEFAULT_EVIDENCE,source:'x'.repeat(400)}}),RangeError);
});
test('negative short funding assumption highlights costs', () => {
 const f=analyzeSnapshot({assumptions:{...POSITION_RISK_DEFAULT,fundingAssumptionDailyPct:-0.5},funding:DEFAULT_EVIDENCE});
 assert.ok(f.find(x=>x.id==='funding-assumption'));
});
