import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSolCandles,validInterval,solCandleFresh,solVisibleWindow,shiftSolWindow} from '../lib/market/sol-candles.ts';

test('Coinbase market-chart intervals are allowlisted',()=>{
 assert.equal(validInterval('5m'),true);
 assert.equal(validInterval('1d'),true);
 assert.equal(validInterval('0'),false);
 assert.equal(validInterval('1m&product=BTC-USD'),false);
});
test('OHLC candles are parsed, chronologically sorted, and validated',()=>{
 const now=1740000200000;
 const rows=[[1740000100,130,141,133,139,10],[1740000000,120,133,125,131,20],[1740000100,-1,100,99,99,5],[1740000150,130,120,122,125,5]];
 assert.deepEqual(parseSolCandles(rows,now),[{time:1740000000,low:120,high:133,open:125,close:131,volume:20},{time:1740000100,low:130,high:141,open:133,close:139,volume:10}]);
});
test('stale candles are never labeled current',()=>{
 assert.equal(solCandleFresh({time:1740000000,low:10,high:11,open:10,close:11,volume:1},60,1740000100000),true);
 assert.equal(solCandleFresh({time:1740000000,low:10,high:11,open:10,close:11,volume:1},60,1740010000000),false);
});
test('empty and malformed API responses cannot masquerade as candles',()=>{
 assert.deepEqual(parseSolCandles({oops:1}),[]);
 assert.deepEqual(parseSolCandles([[1740000000,200,190,195,198,1]]),[]);
});

test('chart history navigation is bounded and returns exact observed candles',()=>{
 const series=Array.from({length:100},(_,i)=>({time:1740000000+i*60,low:100,high:110,open:101,close:105,volume:1}));
 assert.equal(solVisibleWindow(series,0,20)[0].time,series[80].time);
 assert.equal(solVisibleWindow(series,20,20)[0].time,series[60].time);
 assert.equal(solVisibleWindow(series,999,20)[0].time,series[0].time);
 assert.equal(shiftSolWindow(series.length,0,20,20),20);
 assert.equal(shiftSolWindow(series.length,75,20,20),80);
 assert.equal(shiftSolWindow(series.length,20,-30,20),0);
});
