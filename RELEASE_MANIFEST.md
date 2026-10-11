# SolNeutral V7.5 | Colosseum usability upgrade

Cumulative project rooted at repository root. Preserve your existing `.git` directory.

## Source changes

- SolNeutral AI is now a visitor-facing multi-turn assistant. Removed the manual AI demo-access token from the UI and API. The Anthropic key stays on the server (Vercel).
- Added basic instance-local request caps, reduced model output length, input checks, no-store responses, and same-origin browser checks. **Configure an actual Vercel WAF rate-limit rule** before letting public traffic reach the AI API; in-memory limits are not global across serverless instances.
- Dashboard now checks the connected Drift devnet account and exact test-USDC wallet/spot balance, rather than advertising unverified health or an unsynced card. Funding remains optional research data and is never invented.
- New assisted funding path helps users with wallet SOL check the actual deployed wSOL collateral market before signing, with explicit recovery advice if wrapping succeeds but a later Drift deposit fails.
- Backend diagnostics are no longer shown in Settings. The internal Next.js API endpoints remain necessary for secure model requests and public data fetching.
- Retained candlestick chart, Trade Lab, navigation, wallet adapters, risks and market model, documentation and previous hotfix.

## Verification limits

No wallet transactions were signed in this environment. No deposit, withdrawal, order fill, or margin calculation is claimed verified on-chain. No full `npm run typecheck` or `npm run build` was executed for V7.5 because npm dependencies are not installed in this environment. The user requested no automated test run. Modified TS/TSX modules were syntax-transpiled only.

### Deployment

Keep the Vercel Root Directory `frontend`; configure `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in Vercel only (no browser prefixes). Do **not** configure or ask visitors for `AI_DEMO_ACCESS_TOKEN`. Rate-limit POST `/api/ai/interpret` using Vercel WAF before opening unrestricted AI access. Keep the Solana RPC on **devnet**; no compatible Drift testnet deployment has been confirmed.

### Collateral

Native wallet SOL alone is not Drift margin. Use Trade Lab → Collateral → wSOL → Check SOL market. Only a verified wSOL market allows the two-step wrap/deposit flow. Otherwise use the exact test USDC mint shown by the verified spot market. After wallet confirmations, verify both wallet and Drift account changes; neither action is demonstrated by this source release.
