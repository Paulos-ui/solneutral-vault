import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildResearchBrief,isValidQuestion} from '../lib/analyst.ts';
import {DEFAULT_EVIDENCE} from '../lib/intelligence.ts';
import {POSITION_RISK_DEFAULT} from '../lib/position-risk.ts';
test('unavailable funding never becomes verified yield',()=>{const r=buildResearchBrief({assumptions:POSITION_RISK_DEFAULT,funding:DEFAULT_EVIDENCE},'Tell me about yield');assert.match(r.answer,/No fresh market funding has been verified/);assert.equal(r.mode,'deterministic')});
test('rejects malformed prompts',()=>{assert.equal(isValidQuestion(''),false);assert.equal(isValidQuestion('x'.repeat(1201)),false);assert.equal(isValidQuestion('Will funding reverse soon?'),true);assert.equal(isValidQuestion('hi'),true)});
test('brief contains verified provenance labels',()=>{const r=buildResearchBrief({assumptions:POSITION_RISK_DEFAULT,funding:{status:'observed',hourlyPct:0.0005,ageMinutes:2,source:'drift'}},'Is this portfolio neutral?');assert.ok(r.provenance.some(s=>s.includes('Drift indexed')));assert.match(r.answer,/hypothetical/)});
