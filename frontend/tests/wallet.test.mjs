import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isSolanaPublicKey, MAINNET_USDC_MINT, parseSolBalance, parseUsdcBalance } from '../lib/wallet.ts';

const address = '11111111111111111111111111111111';

describe('Read-only Solana RPC normalization', () => {
  test('validates actual decoded 32-byte public addresses, not merely regex', () => {
    assert.equal(isSolanaPublicKey(address), true);
    assert.equal(isSolanaPublicKey(MAINNET_USDC_MINT), true);
    assert.equal(isSolanaPublicKey('0'.repeat(32)), false);
    assert.equal(isSolanaPublicKey('1'.repeat(33)), false);
    assert.equal(isSolanaPublicKey('x'), false);
    assert.equal(isSolanaPublicKey({}), false);
    assert.equal(isSolanaPublicKey('11111111111111111111111111111111 '), false);
  });
  test('reads integer native lamports with slot; rejects fabricated or malformed values', () => {
    assert.deepEqual(parseSolBalance({ context: { slot: 345 }, value: 1_250_000_000 }), { amount: 1.25, slot: 345 });
    assert.equal(parseSolBalance({ context: { slot: 345 }, value: -1 }), null);
    assert.equal(parseSolBalance({ context: { slot: 345 }, value: '1000000000' }), null);
    assert.equal(parseSolBalance({ context: {}, value: 100 }), null);
  });
  test('accepts genuine empty token list as zero instead of unknown', () => {
    assert.deepEqual(parseUsdcBalance({ context: { slot: 5 }, value: [] }), { amount: 0, accounts: 0, slot: 5 });
    assert.equal(parseUsdcBalance({ context: {}, value: [] }), null);
  });
  test('sums only validated canonical-USDC accounts', () => {
    const row = (uiAmountString) => ({ account: { data: { parsed: { info: { mint: MAINNET_USDC_MINT, tokenAmount: { decimals: 6, uiAmountString } } } } } });
    assert.deepEqual(parseUsdcBalance({ context: { slot: 8 }, value: [row('1.5'), row('2.25')] }), { amount: 3.75, accounts: 2, slot: 8 });
    assert.equal(parseUsdcBalance({ context: { slot: 8 }, value: [{ account: { data: { parsed: { info: { mint: 'fake', tokenAmount: { decimals: 6, uiAmountString: '5' } } } } } }] }), null);
    assert.equal(parseUsdcBalance({ context: { slot: 8 }, value: [row('NaN')] }), null);
  });
});
