import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/drift-devnet.ts', import.meta.url), 'utf8');
const trade = readFileSync(new URL('../components/DriftTradingLab.tsx', import.meta.url), 'utf8');

test('Order 6050 regression: bounded perpetual limit order excludes rejected IOC flag', () => {
  assert.match(source, /const params = sdk\.getLimitOrderParams\(\{[\s\S]*?marketType:\s*sdk\.MarketType\.PERP/);
  const orderParams = source.split('const params = sdk.getLimitOrderParams({')[1].split('});')[0];
  assert.doesNotMatch(orderParams, /bitFlags:|immediateOrCancel:/);
  assert.match(source, /signature = await client\.placePerpOrder\(params\)/);
  assert.match(source, /getFreeCollateral/);
  assert.match(trade, /may remain open until cancelled/);
  assert.match(trade, /This is a resting LIMIT order/);
});
