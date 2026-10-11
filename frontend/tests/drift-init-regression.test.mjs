import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const adapter = readFileSync(new URL('../lib/drift-devnet.ts', import.meta.url), 'utf8');

test('fresh wallets derive the Drift User PDA without requiring a previously loaded user', () => {
  assert.match(adapter, /sdk\.getUserAccountPublicKeySync\(programId, wallet\.publicKey, 0\)/);
  assert.doesNotMatch(adapter, /client\.getUserAccountPublicKey\(0\)/);
  assert.match(adapter, /if \(!account && action !== 'initialize'\)/);
  assert.match(adapter, /if \(account && action === 'initialize'\)/);
  assert.match(adapter, /\[signature\] = await client\.initializeUserAccount\(\)/);
});
