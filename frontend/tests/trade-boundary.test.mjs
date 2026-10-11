import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Turbopack isolates optional Node filesystem imports from browser builds', () => {
  assert.match(read('../next.config.ts'), /fs:\s*\{\s*browser:\s*"\.\/lib\/browser-fs-empty\.ts"/);
  assert.match(read('../lib/browser-fs-empty.ts'), /export\s*\{\s*\}\s*;/);
  assert.doesNotMatch(read('../components/DriftTradingLab.tsx'), /from\s+['"]@drift-labs\/sdk/);
});

test('Drift collateral uses a wrapped SOL token account, never the wallet system account', () => {
  const adapter = read('../lib/drift-devnet.ts');
  const helper = read('../lib/native-sol.ts');
  assert.match(adapter, /prepareWrappedSolDeposit/);
  assert.match(adapter, /ensureWrappedSolDestination/);
  assert.doesNotMatch(adapter, /client\.deposit\([^\n]*wallet\.publicKey/);
  assert.doesNotMatch(adapter, /client\.withdraw\([^\n]*wallet\.publicKey/);
  assert.match(helper, /getAssociatedTokenAddressSync\(NATIVE_MINT/);
  assert.match(helper, /createSyncNativeInstruction/);
  assert.match(helper, /assertDevnetGenesis/);
  assert.ok(JSON.parse(read('../package.json')).dependencies['@solana/spl-token']);
});
