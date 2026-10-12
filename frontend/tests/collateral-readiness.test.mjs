import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

test('USDC read-only preflight binds mint and owner before displaying balances',()=>{
 const adapter=readFileSync(new URL('../lib/drift-devnet.ts',import.meta.url),'utf8');
 assert.match(adapter,/inspectDriftDevnetUsdcReadiness/);
 assert.match(adapter,/verifiedUsdcMarket\(connection, client\)/);
 assert.match(adapter,/getAssociatedTokenAddressSync\(spot.mint, wallet.publicKey\)/);
 assert.match(adapter,/token\.mint\.equals\(spot.mint\)/);
 assert.match(adapter,/client\.getUser\(0\)\.getTokenAmount\(spot.marketIndex\)/);
 assert.match(adapter,/finally\s*\{\s*await client.unsubscribe\(\)/);
});

test('Trade Lab exposes a read-only readiness check and zero-asset blocker',()=>{
 const ui=readFileSync(new URL('../components/DriftTradingLab.tsx',import.meta.url),'utf8');
 assert.match(ui,/Check collateral ↻/);
 assert.match(ui,/Receive Drift-compatible test USDC/);
 assert.match(ui,/prepareDriftDevnetUsdcReceiveAccount/);
 assert.match(ui,/walletTokenAccountExists/);
 assert.match(ui,/Receive USDC before depositing/);
 assert.match(ui,/inspectDriftDevnetUsdcReadiness\(connection, signer\)/);
 assert.match(ui,/Deposited in Drift:/);
});
