# SolNeutral V2 — Phase 2C / Wallet Lens

**Founder:** Web3 supporter (@instators)  
**Build target:** Solana research preview, suitable for future Colosseum / Superteam Nigeria evaluation (no association claimed)

## What is new

- `/wallet-lens`: a custom public-chain observatory with a self-contained animated ring instrument, explicit data provenance, native SOL/USDC readouts and read-only explorer link.
- `POST /api/chain/wallet`: server-side read-only RPC using `getBalance` and `getTokenAccountsByOwner` (mainnet canonical USDC), with input length and decoded-key validation, a strict 7.5 second timeout, individual degradation and no-store responses.
- An integrated existing Drift funding observation panel, without conflating market funding and wallet balances.
- Direct navigation from header and Observatory, expanded docs and capability endpoint, 4 additional unit tests.

## Integrity and security boundaries

- We do not connect wallets, access secrets, store private keys, send transactions, or prompt for permission to spend assets.
- Neither wallet holdings nor market funding rates establish an actual delta-neutral position, vault assets, strategy PnL or risk-adjusted yield.
- Balance zero is displayed only on an explicitly validated RPC result; a failed lookup stays unknown.
- Missing provider/rate-limit/timeout state is displayed as unavailable or partial.
- Mainnet addresses are public, but the API does not log addresses in application code. A provider can still observe queried addresses.
- The public endpoint `https://api.mainnet-beta.solana.com` is intended for development; use a dedicated private endpoint through `SOLANA_RPC_URL` when production traffic warrants it. Keep tokens server-side.

## Future milestones

1. Verified Drift user-subaccount state and collateral, including ownership/authority mapping.
2. Account-specific PnL and hedge sensitivity computed from validated position state.
3. Watchlists, alerts, data freshness monitoring and time-series histories.
4. An explainable AI analyst grounded in reconciled input state and deterministic risk calculations.
5. Audited vault/keeper only after access-control, liquidation and accounting tests.

## QA

- `npm test` to execute deterministic simulator, Drift normalization and Wallet Lens parsing tests.
- `npm run build` as the required Next.js production deployment gate.
- Browser test with public address only; expect partial/unavailable when Solana public RPC rate-limits.
- Never enter a seed phrase, recovery phrase or private key.

## Manual installation into existing repository

Save ZIP on Desktop and use Git Bash:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_Phase2C_Wallet_Lens.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_Phase2C_Wallet_Lens.zip"
cd frontend
npm test && npm run build
```

After the tests and build succeed, return to the repository root and commit/push. No extra nested folder or backup is created. The update archive contains only changed/new files at its root and never contains `.git` or `node_modules`.
