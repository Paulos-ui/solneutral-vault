# SolNeutral V7.2 · Drift Order Repair / Historical Chart / Funding Signals

**Founder:** Web3 supporter · X: @instators · GitHub: @paulos-ui  
**Network:** Drift execution on **Solana devnet only**. All execution uses wallet signatures and test assets. **No production SolNeutral vault** is deployed through this release.

## Why the order failed

V7.1 used `getLimitOrderParams` with `bitFlags: OrderParamsBitFlag.ImmediateOrCancel` and submitted it through `placePerpOrder`. The observed transaction error was `0x17a2` = decimal **6050**, which the Drift error definitions label **InvalidOrderIOC**. This was **not** a SolNeutral program ID error. V7.2 removes the invalid IOC bit flag and submits a **bounded resting limit** order instead. The order may remain OPEN and unfilled until cancelled. The UI explicitly states this, and the user must acknowledge it before signing. It verifies positive free collateral locally before attempting the order; no real fill is inferred from a signature.

**Do not confuse this change with automatic hedging:** no complete long-spot/short-perpetual workflow, fill monitoring, or production vault exists yet. Until order status is decoded from Drift, confirm it on the protocol before considering it executed. Test with a **small devnet-only** amount and use the **Orders → Cancel** action if it remains open.

## Why not switch to Solana testnet?

Testnet is designed primarily for validator/network stress testing. Simply switching the app's RPC URL to `https://api.testnet.solana.com` would not deploy the Drift program, markets, or SolNeutral program and would break current devnet wallet accounts. SolNeutral retains strict devnet-genesis verification until an independently verified testnet deployment exists. Mainnet execution stays disabled.

## Historical chart controls

Trade Lab → SOL/USD spot chart now includes **Older**, **Newer**, and **Latest** controls, in addition to timeframe buttons (1m through 1d). Each view is a window into actual validated Coinbase SOL/USD OHLCV candles; it never creates synthetic candles. Data refreshes about every 30 seconds when available. **Coinbase spot reference data is not the execution price or Drift SOL-PERP oracle.**

## Funding signal

The backend attempts the documented market funding route and, if unavailable, the older funding-indexer route. It still validates timestamps, oracle prices, and numeric fields, and reports `observed`, `stale`, or `unavailable` without inventing returns. Funding is *market-wide*, not user-earned funding or vault APY. `SOLANA_RPC_URL` is a separate **mainnet read-only** RPC, not a fix for Drift-devnet errors.

## Collateral and withdrawals

V7.2 preserves the previous **wSOL spot-market preflight**, owned-wallet wSOL verification, and Unwrap wSOL recovery action. A previous screenshot showed `SpotMarketNotFound (6087)` for attempted SOL collateral; the app must not wrap additional SOL until Drift actually supports that collateral spot market. This release cannot guarantee a deposit or withdrawal will succeed; users may need another collateral asset on a verified Drift-devnet market, which is **not implemented in this update**. Never use mainnet assets.

## SolNeutral legacy program IDs (not verified deployments)

* `legacy/vault/solneutral/programs/solneutral/src/lib.rs` declares `Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA`.
* `legacy/vault/solneutral/Anchor.toml` references a **different localnet** program address, `2CsCEfYVTnxjJ4PB1UN16tDMEFN5YxrBpW98EN6jf5Mb`.
* `vault/solneutral_v3/` reuses the legacy Rust address as an explicitly uncompiled placeholder.

These **do not** prove a deployed or audited SolNeutral vault exists. Verify the actual deployed program, version, cluster and program upgrade authority before considering any vault transaction. Drift execution uses **Drift's program**, not either SolNeutral placeholder.

## Environment setup · existing Vercel project

**Vercel Root Directory:** `frontend` (Next.js; routes deploy as Vercel serverless functions). No Railway backend required.

| Environment variable | Value | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_DEVNET_RPC_URL` | `https://api.devnet.solana.com` initially; use a dedicated devnet RPC for reliability | Public |
| `NEXT_PUBLIC_ENABLE_DEVNET_TRADING` | `true` for explicitly signed devnet testing | Public |
| `SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` for initial mainnet read-only analytics, or private dedicated RPC | Server-only |
| `ANTHROPIC_API_KEY` | Your secret Claude API key | **Secret/server-only** |
| `ANTHROPIC_MODEL` | An available Anthropic model ID from your provider dashboard | Server-only |
| `AI_DEMO_ACCESS_TOKEN` | Your own long random secret from `openssl rand -hex 32` | **Secret/server-only** |

Do not copy legacy `NEXT_PUBLIC_API_URL`, `RAILWAY_*`, or API server addresses as if they enabled trading. A private RPC URL embedded in a `NEXT_PUBLIC_` variable is visible to all browsers. Add variables under Vercel → Settings → Environment Variables; save and **redeploy** to apply them. No mainnet transaction signing is enabled by these variables.

## Verification gates

1. `cd frontend && npm install && npm test && npm run typecheck && npm run build`
2. Test `GET /api/status`, `GET /api/market/funding` and `GET /api/market/sol-chart?interval=5m` on Vercel.
3. Wallet devnet account confirmed and funded with **test** collateral supported by Drift.
4. Submit very small bounded order, inspect its **actual open/fill state**, and cancel if needed.
5. Verify funding displays clear provenance and chart historical navigation works.
6. **Do not claim real withdrawals, funding earnings, liquidation metrics or pooled custody without separate on-chain evidence.**
