import {test} from 'node:test';import assert from 'node:assert/strict';
const mint=(assets,shares,deposit)=>shares===0n?deposit:deposit*shares/assets;
const redeem=(assets,shares,burn)=>shares===burn?assets:assets*burn/shares;
test('first deposit mints one share per atomic unit',()=>assert.equal(mint(0n,0n,1000000n),1000000n));
test('actual added custody raises share value without minting new shares',()=>assert.equal(redeem(2000000n,1000000n,500000n),1000000n));
test('rounding down protects remaining shares',()=>assert.equal(mint(3000000n,1000000n,1000000n),333333n));
test('last withdrawal returns custody dust to last owner',()=>assert.equal(redeem(1000001n,1000000n,1000000n),1000001n));
