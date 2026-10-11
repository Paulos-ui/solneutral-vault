import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {formatObservedNumber, scalePath, summarizeFunding, shortSignature} from '../lib/dashboard-view.ts';
test('dashboard view does not convert missing data into zero',()=>{assert.equal(formatObservedNumber(null),'—');assert.equal(formatObservedNumber(NaN),'—');assert.equal(summarizeFunding(null).hourlyPct,null);assert.equal(summarizeFunding({status:'unavailable',latest:{hourlyPct:22}}).hourlyPct,null)});
test('only valid indexed funding records enter chart',()=>{const value=summarizeFunding({status:'observed',latest:{hourlyPct:-0.0001},records:[{time:'2026-01-11T00:00:00Z',hourlyPct:-0.0001},{time:'garbage',hourlyPct:9},{time:'2026-01-10T00:00:00Z',hourlyPct:Infinity}]});assert.equal(value.records.length,1);assert.equal(value.hourlyPct,-0.0001)});
test('chart path refuses invalid values and handles flat series',()=>{assert.equal(scalePath([1,NaN],600,200),'');assert.ok(scalePath([1,1,1],600,200).startsWith('M'));assert.equal(scalePath([],600,200),'')});
test('signature display limits full address exposure',()=>{assert.equal(shortSignature('abcdef0123456789'),'abcde…56789')});
