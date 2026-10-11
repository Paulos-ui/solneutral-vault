# SolNeutral V7.1 — Market-aware collateral and live SOL chart

Founder: **Web3 supporter** · X: **@instators** · Solana devnet execution only.

## Why the previous deposit failed

The V6.1 screenshot showed that wallet-native SOL was first wrapped, then a Drift deposit simulation returned `custom program error: 0x17c7`. In the Drift program's published error list, this is `6087 / SpotMarketNotFound`, **not** a compute-budget error. The `ComputeBudget111…` lines in the logs are ordinary program-log context, not evidence that more compute units will fix the deposit.

The old client passed constant spot-market index 1 without verifying on-chain availability before wrapping any SOL. We cannot prove from an incomplete log alone why Drift could not find the market, but the new preflight is designed to catch missing, mismatched, or unsubscribed wSOL markets and stop before custody changes.

## New collateral flow

1. Verify the exact Solana devnet genesis hash and connected wallet signing ability.
2. Confirm the user's Drift subaccount exists and subscribe to its state.
3. **Before wrapping** verify that the subscribed spot market's mint equals the wrapped-SOL mint, check the actual market index, and confirm the market PDA is owned by the configured Drift program.
4. Read the wallet's existing canonical wSOL associated token account, verifying both its mint and token-account owner.
5. If there is enough wSOL, submit the deposit with **no additional wrapping**. Otherwise, wrap only the difference, using a separate wallet signature.
6. Submit the Drift deposit and independently confirm the signature. If it still fails, leave wallet-owned wSOL untouched and display an actionable error.

Withdrawal uses the same market verification; it checks the Drift user's deposited amount and requests a reduce-only withdrawal into the wallet's wSOL account. The protocol may still refuse withdrawals because of active positions, margin requirements, liquidity, or market controls. Do not claim success without an on-chain confirmation.

**Recovery / Unwrap wSOL:** In Trade Lab → Collateral, select **Unwrap wSOL** and approve the wallet signature. This **closes your wallet's entire wSOL associated token account** and converts the account's wSOL (plus reclaimed rent) back into native devnet SOL. It is not a Drift withdrawal; funds actually deposited into Drift cannot be recovered with this action. Review the entire wSOL balance before authorizing, particularly if you use the wallet for anything besides testing.

The app never requests a secret key, seed phrase, or custody transfer to SolNeutral. Mainnet execution and SolNeutral vault deposits remain disabled.

## Market chart

The cumulative release also contains the V7 compact SOL/USD candle chart with timeframe options 1m/5m/15m/1h/6h/1d. Its server endpoint is `/api/market/sol-chart`, sourcing public **Coinbase Exchange SOL/USD spot** candles and refreshing approximately every 30 seconds. This is **not** a Drift SOL perpetual mark or execution price. Spot market data may be delayed or temporarily unavailable, and the UI will show that rather than fabricate data.

## Required Vercel configuration

Use the existing Vercel project with Root Directory `frontend`. For initial devnet testing configure:

- `NEXT_PUBLIC_DEVNET_RPC_URL=https://api.devnet.solana.com`
- `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=true`
- `SOLANA_RPC_URL=` private mainnet RPC, optional for read-only research
- `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` optional, server-side for Claude
- `AI_DEMO_ACCESS_TOKEN` optional private server-side demo token

No Railway service is required for the active Next.js API routes. Do not publish private API tokens in a `NEXT_PUBLIC_` variable.

## Testing protocol

Run `npm install`, `npm test`, `npm run typecheck`, `npm run build` inside `frontend/`. Only push once all succeed. We ran deterministic parser/source tests but could not run a browser-signed live devnet deposit or withdrawal in this environment; no live transaction success has been claimed.

On Vercel: verify `/api/health`, `/api/market/sol-chart?interval=5m`, and Trade Lab wallet/account status. Inspect wallet wSOL, select **Unwrap wSOL** to recover any leftover wallet-owned wSOL if you do not want it kept wrapped. For new deposits, try only small test funds after confirming the market is supported; then verify signatures on Solana Explorer. If SOL spot market is not supported in the current Drift devnet configuration, the controls will safely fail before wrapping and require a separate supported collateral-integration design.
