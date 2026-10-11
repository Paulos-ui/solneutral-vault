import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lab=readFileSync(new URL('../components/DriftTradingLab.tsx',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../lib/drift-devnet.ts',import.meta.url),'utf8');
test('USDC proof is collected before a signed transfer and independently re-read after confirmation',()=>{
 const before=lab.indexOf('const before = usdcAction ? await inspectDriftDevnetUsdcReadiness');
 const sign=lab.indexOf('const receipt=await executeDriftDevnetAction');
 const after=lab.indexOf('const after = await inspectDriftDevnetUsdcReadiness',sign);
 assert.ok(before>0&&sign>before&&after>sign);
 assert.match(lab,/reconcileUsdcMovement\(before,after,action,decimalToUnits\(amount,6\)\)/);
 assert.match(lab,/recheckCollateralProof\(\)/);
 assert.match(lab,/Signature confirmed, but collateral changes are not reconciled/);
});
test('USDC token program, mint, destination ownership are validated before instruction submission',()=>{
 assert.match(adapter,/mintInfo\.value\.owner\.equals\(TOKEN_PROGRAM_ID\)/);
 assert.match(adapter,/Wallet USDC token account is not owned by the SPL Token program/);
 assert.match(adapter,/USDC withdrawal destination owner\/mint mismatch/);
});
