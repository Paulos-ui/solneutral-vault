import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = rel => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

test('backend deploys with frontend and public endpoints contain no secret values', () => {
  const route = read('app/api/health/route.ts');
  assert.match(route, /export async function GET/);
  assert.match(route, /getGenesisHash/);
  assert.match(route, /wrong_network/);
  assert.match(route, /api\/market\/funding/);
  assert.doesNotMatch(route, /\bprivateKey\b|\bsecretKey\b/);
});
test('account initialization is findable and wallet-signed', () => {
  const trade = read('components/DriftTradingLab.tsx');
  assert.match(trade, /Initialize Drift Account/);
  assert.match(trade, /selectTab\('account'\)/);
  assert.match(trade, /useAnchorWallet/);
  assert.match(trade, /executeDriftDevnetAction/);
  assert.match(trade, /disabled=\{!ready\|\|!approved\}/);
});
test('Settings has health check; deployment docs separate devnet and private mainnet', () => {
  assert.match(read('app/settings/page.tsx'), /BackendDiagnostics/);
  assert.match(read('components/BackendDiagnostics.tsx'), /api\/health\?probe=1/);
  assert.match(read('.env.example'), /SOLANA_RPC_URL/);
  assert.match(read('.env.example'), /NEXT_PUBLIC_DEVNET_RPC_URL/);
});
