import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { decimalToUnits, validateDevnetAmount, assertDevnetGenesis, DEVNET_GENESIS_HASH, boundedLimitPrice } from '../lib/devnet-execution.ts';
test('exact amount never rounds fractional SOL', () => {
 assert.equal(decimalToUnits('0.000000001',9),1n);
 assert.equal(decimalToUnits('0.05',9),50_000_000n);
 assert.equal(decimalToUnits('0000.010',9),10_000_000n);
});
test('invalid quantities fail closed', () => {
 for(const input of ['-1','1e2','0','NaN','0.0000000001','Infinity','1,000','']) assert.throws(()=>decimalToUnits(input,9));
});
test('per action upper limits are enforced',()=>{
 assert.equal(validateDevnetAmount('deposit','0.5'),500_000_000n);
 assert.throws(()=>validateDevnetAmount('deposit','0.500000001'));
 assert.throws(()=>validateDevnetAmount('long','0.100000001'));
 assert.throws(()=>validateDevnetAmount('short','1'));
});
test('devnet RPC is checked before preparing any transaction',()=>{
 assert.doesNotThrow(()=>assertDevnetGenesis(DEVNET_GENESIS_HASH));
 assert.throws(()=>assertDevnetGenesis('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'));
});
test('limit price differs by trade direction',()=>{
 assert.equal(boundedLimitPrice(200_000_000n,'long'),202_000_000n);
 assert.equal(boundedLimitPrice(200_000_000n,'short'),198_000_000n);
 assert.throws(()=>boundedLimitPrice(0n,'short'));
});
