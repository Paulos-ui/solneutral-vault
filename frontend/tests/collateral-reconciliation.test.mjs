import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileUsdcMovement } from '../lib/collateral-reconciliation.ts';
const initial = {
  mint: 'TheExactDriftDevnetUsdcMint', marketIndex: 0, decimals: 6,
  walletTokenAccount: 'WalletAssociatedTokenAccount', walletAmount: '10000000',
  driftDepositedAmount: '2000000', userAccountExists: true,
};
test('requires exact wallet token deduction and matching Drift increase for deposit', () => {
  const after = {...initial, walletAmount: '5000000', driftDepositedAmount: '7000000'};
  assert.equal(reconcileUsdcMovement(initial, after, 'deposit', 5000000n).status, 'verified');
  assert.equal(reconcileUsdcMovement(initial, {...after, driftDepositedAmount:'2000000'}, 'deposit', 5000000n).status, 'unverified');
});
test('requires matching wallet increase and Drift decrease for withdrawal', () => {
  const after = {...initial, walletAmount: '11000000', driftDepositedAmount: '1000000'};
  const proof = reconcileUsdcMovement(initial, after, 'withdraw', 1000000n);
  assert.equal(proof.status, 'verified');
  assert.equal(proof.walletDeltaRaw,'1000000');
  assert.equal(proof.driftDeltaRaw,'-1000000');
});
test('rejects another mint/ATA/market and missing spot balances', () => {
  const after = {...initial, walletAmount:'5000000',driftDepositedAmount:'7000000'};
  for(const patch of [
    {mint: 'OtherMint'}, {marketIndex:1}, {walletTokenAccount: 'OtherAta'},
    {driftDepositedAmount:null}, {userAccountExists:false}, {decimals:9},
  ]) assert.equal(reconcileUsdcMovement(initial,{...after,...patch},'deposit',5000000n).status,'unverified');
});
test('does not mistake a signed borrow or unchanged balance for a successful transfer', () => {
  const before = {...initial,driftDepositedAmount:'-10000000'};
  const after = {...before,walletAmount:'5000000',driftDepositedAmount:'-5000000'};
  assert.equal(reconcileUsdcMovement(before,after,'deposit',5000000n).status,'verified');
  assert.equal(reconcileUsdcMovement(before,before,'deposit',5000000n).status,'unverified');
});
test('allows tiny drift rounding only, never inaccurate wallet amount', () => {
  const after={...initial,walletAmount:'5000000',driftDepositedAmount:'6999998'};
  assert.equal(reconcileUsdcMovement(initial,after,'deposit',5000000n).status,'verified');
  assert.equal(reconcileUsdcMovement(initial,{...after,driftDepositedAmount:'6900000'},'deposit',5000000n).status,'unverified');
  assert.equal(reconcileUsdcMovement(initial,{...after,walletAmount:'5000001'},'deposit',5000000n).status,'unverified');
});
