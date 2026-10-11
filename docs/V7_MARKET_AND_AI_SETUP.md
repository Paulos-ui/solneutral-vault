# SolNeutral V7 · Real SOL Reference Market & Claude AI

Founder: Web3 supporter · X: @instators · Solana / Colosseum / Superteam Nigeria

## What this release does

- Adds `/api/market/sol-chart?interval=5m` as a server-proxied, validated Coinbase SOL/USD **SPOT** candle feed. Allowed intervals: `1m`, `5m`, `15m`, `1h`, `6h`, `1d`. Requests are cached around 30 seconds to reduce provider load. Provider may be unavailable, delayed, or rate limited.
- Trade Lab displays responsive OHLC candlesticks, changing timeframe, candle tooltip details, last observed close, refresh/poll status, and source attribution.
- Trade Lab still executes separate SOL-PERP **devnet** actions through Drift. This Coinbase spot chart is for context, NOT the venue execution price, mark, oracle, fill confirmation, or risk calculation.
- Enables the already-written optional Claude private-model integration with Vercel environment settings. The rules-based assistant works without Claude.
- Preserves the existing four-link top nav, app sidebar, wallet connection and devnet-only execution guards.
- Does **not** deploy the experimental SolNeutral vault or enable real-money deposits.

## Required Vercel settings

Keep your existing Vercel project. Set Framework: Next.js; Root Directory: `frontend`.

For **Production** environment:

| Variable | Example / description | Public? |
| --- | --- | --- |
| `NEXT_PUBLIC_DEVNET_RPC_URL` | `https://api.devnet.solana.com` (replace with reliable devnet RPC as needed) | Yes |
| `NEXT_PUBLIC_ENABLE_DEVNET_TRADING` | `true` (set `false` to disable test transaction controls) | Yes |
| `SOLANA_RPC_URL` | Your read-only **mainnet** RPC endpoint (optional but recommended) | **No** |
| `ANTHROPIC_API_KEY` | Your Claude API key | **No** |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Server only |
| `AI_DEMO_ACCESS_TOKEN` | Create a long random access token (20+ characters) | **No** |

Do not put secrets in `NEXT_PUBLIC_` variables. Do not paste keys into a Git repository or a ticket. Do not transfer old Railway-only `NEXT_PUBLIC_API_URL`, Flask port/config, or other unused values. In V7, all active API routes run as Vercel Functions in `frontend/app/api/*`.

Changes to Vercel env need **redeployment**. Vercel > Deployments > latest > Redeploy.

## Connecting Claude

1. Set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `AI_DEMO_ACCESS_TOKEN` in Vercel Production env.
2. Redeploy. Visit `/settings` > check backend & RPC. `/api/health` reports whether Claude is configured without revealing values.
3. Go to `/analyst`, open **Private AI interpretation (optional)**, and enter the **demo access token**, not your Claude API key.
4. Ask a specific risk question and select **Ask private language model**. The server makes the Claude API call.

**Important:** The demo token is shared access, not authenticated per-wallet identity. Before exposing paid AI publicly, implement wallet sign-in with nonce, request authentication, rate limits, spend limits, and audit logs. Until then, give the token only to trusted testers and monitor Anthropic usage.

## Verification

- `https://solneutral-vault.vercel.app/api/status` returns V7 metadata.
- `https://solneutral-vault.vercel.app/api/market/sol-chart?interval=5m` should return `observed` or `stale` with actual OHLC bars. If `unavailable`, investigate provider access or rate limits, not trading wallet keys.
- `/trade` shows chart, account initialization, devnet-only collateral and order controls.
- `npm test && npm run typecheck && npm run build` must pass locally before pushing.
- New Anchor program is *not* compiled or security-reviewed by this release. No mainnet vault trading.

## What comes after V7

Drift-specific verified SOL-PERP oracle/mark price, indexed fills and transaction receipts, decoded personal positions and collateral, and end-to-end devnet execution tests. No UI component should display unverified collateral health or guaranteed yields.

## Sources

- Coinbase historical candles: https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles
- Claude model IDs: https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
- Vercel environment variables: https://vercel.com/docs/environment-variables
