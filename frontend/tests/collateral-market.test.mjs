import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { chooseWrappedSolMarket, missingWrappedSolTopup, meaningfulDriftError } from '../lib/collateral-guards.ts';
const native='So11111111111111111111111111111111111111112';
const market=(index,mint)=>({marketIndex:index,mint:{toBase58:()=>mint},pubkey:{toBase58:()=>`market-${index}`}});

test('wSOL collateral market is selected by mint, never assumed index',()=>{
 assert.equal(chooseWrappedSolMarket([market(0,'not-sol'),market(5,native)]).marketIndex,5);
 assert.throws(()=>chooseWrappedSolMarket([market(1,'not-sol')]),/no subscribed wrapped-SOL/);
 assert.throws(()=>chooseWrappedSolMarket([market(1,native),market(2,native)]),/More than one/);
});
test('retries do not rewrap already-funded wSOL',()=>{
 assert.equal(missingWrappedSolTopup(50_000_000n,50_000_000n),0n);
 assert.equal(missingWrappedSolTopup(20_000_000n,50_000_000n),30_000_000n);
 assert.equal(missingWrappedSolTopup(60_000_000n,50_000_000n),0n);
 assert.throws(()=>missingWrappedSolTopup(-1n,50_000_000n));
});
test('0x17c7 maps to spot market missing rather than compute-budget failure',()=>{
 assert.match(meaningfulDriftError(new Error('Instruction 2: custom program error: 0x17c7')),/SpotMarketNotFound \(6087\)/);
});
test('wallet-signed recovery closes only the wallet-owned native-mint ATA',()=>{
 const helper=readFileSync(new URL('../lib/native-sol.ts',import.meta.url),'utf8');
 assert.match(helper,/createCloseAccountInstruction\(existing.tokenAccount,wallet.publicKey,wallet.publicKey\)/);
 assert.match(helper,/parsed.owner.equals\(owner\)/);
 assert.match(helper,/parsed.mint.equals\(NATIVE_MINT\)/);
});
test('market validation happens before wrapping and withdraw checks balance',()=>{
 const adapter=readFileSync(new URL('../lib/drift-devnet.ts',import.meta.url),'utf8');
 assert.ok(adapter.indexOf('verifiedWrappedSolMarket(connection, client)') < adapter.indexOf('prepareWrappedSolDeposit(connection, wallet, units!)'));
 assert.match(adapter,/getUser\(0\)\.getTokenAmount/);
 assert.match(adapter,/action === 'unwrap'/);
});
test('SDK mint address is compared safely and the market PDA is derived by index',()=>{
 const adapter=readFileSync(new URL('../lib/drift-devnet.ts',import.meta.url),'utf8');
 assert.match(adapter,/market\.mint\.toBase58\(\) !== NATIVE_MINT\.toBase58\(\)/);
 assert.match(adapter,/getSpotMarketPublicKeySync\(client\.program\.programId, market\.marketIndex\)/);
 assert.doesNotMatch(adapter,/market\.mint\.equals\(/);
 assert.doesNotMatch(adapter,/getAccountInfo\(market\.pubkey/);
});

test('0x17a2 is explained as InvalidOrderIOC, not a program-id problem',()=>{
 assert.match(meaningfulDriftError(new Error('custom program error: 0x17a2')),/InvalidOrderIOC, 6050/);
});
