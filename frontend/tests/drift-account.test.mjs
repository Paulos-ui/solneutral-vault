import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DRIFT_V2_MAINNET_PROGRAM, parseDriftAccountInfo, parseIndexedPositionRecords } from '../lib/drift-account.ts';
const discriminator = createHash('sha256').update('account:User').digest().subarray(0, 8).toString('base64');
const sample = (owner = DRIFT_V2_MAINNET_PROGRAM, data = discriminator) => ({ context: { slot: 101_234 }, value: { owner, executable: false, data: [data, 'base64'] } });
describe('Drift Lens account integrity', () => {
  test('confirms program ownership + User discriminator + RPC slot', () => {
    assert.equal(parseDriftAccountInfo(sample()).status, 'verified');
    assert.equal(parseDriftAccountInfo(sample()).slot, 101234);
    assert.equal(parseDriftAccountInfo(sample('11111111111111111111111111111111')).status, 'not-drift');
    assert.equal(parseDriftAccountInfo(sample(DRIFT_V2_MAINNET_PROGRAM, Buffer.alloc(8).toString('base64'))).status, 'not-drift');
  });
  test('does not confuse missing accounts and bad RPC responses with zero positions', () => {
    assert.equal(parseDriftAccountInfo({ context: { slot: 10 }, value: null }).status, 'not-found');
    assert.equal(parseDriftAccountInfo({ context: {}, value: null }).status, 'unavailable');
    assert.equal(parseDriftAccountInfo({ context: { slot: 10 }, value: { owner: DRIFT_V2_MAINNET_PROGRAM, executable: false, data: ['oops', 'base64'] } }).status, 'unavailable');
  });
  test('strictly projects indexed records without fake normalized units', () => {
    assert.deepEqual(parseIndexedPositionRecords({ data: [{ marketIndex: 0, marketType: 'perp', direction: 'short', baseAssetAmount: '-2500000000', quoteAssetAmount: '350000000', ts: 1760000000 }] }), [{
      marketIndex: 0, marketType: 'perp', direction: 'short', baseAssetAmountRaw: '-2500000000', quoteAssetAmountRaw: '350000000', timestamp: new Date(1760000000 * 1000).toISOString(),
    }]);
    assert.deepEqual(parseIndexedPositionRecords([]), []);
    assert.equal(parseIndexedPositionRecords({ hello: 'world' }), null);
    assert.equal(parseIndexedPositionRecords([{ marketIndex: -1 }]), null);
    assert.equal(parseIndexedPositionRecords([{ marketIndex: 0, baseAssetAmount: 'Infinity' }]), null);
  });
});
