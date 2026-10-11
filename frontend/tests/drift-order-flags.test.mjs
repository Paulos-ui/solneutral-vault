import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../lib/drift-devnet.ts', import.meta.url), 'utf8');

test('Drift V4 limit order sets a perpetual market and supported IOC bit flag', () => {
  assert.match(source, /const params = sdk\.getLimitOrderParams\(\{[\s\S]*?marketType:\s*sdk\.MarketType\.PERP/);
  assert.match(source, /bitFlags:\s*sdk\.OrderParamsBitFlag\.ImmediateOrCancel/);
  assert.doesNotMatch(source, /\bimmediateOrCancel:\s*true/);
  assert.match(source, /signature = await client\.placePerpOrder\(params\)/);
});
