# SolNeutral V7.5.2 | Drift collateral and dashboard correction

Cumulative source ZIP. Extract at the root of the existing `solneutral-vault` repository. `.git` stays untouched.

## Focused changes

- **Drift quote collateral:** Read the canonical Drift Spot Market 0 PDA directly from the deployed devnet program. Verify PDA ownership, decoded account index/mint, SPL mint owner and six-decimal precision. If the SDK subscription omits the existing market, load it explicitly. Derive the wallet token account from the verified *on-chain market mint* instead of relying solely on SDK config or guessing from faucet labels.
- **Wrapped SOL:** Independently verify the standard SOL market (index 1) plus subscribed wSOL candidates by PDA ownership, on-chain mint, and nine-decimal precision. Dynamically subscribe if present. Check before wrapping or depositing; never assume the market exists. Existing wallet-owned wSOL can be unwrapped even without a valid Drift collateral market.
- **Dashboard:** Separate Drift user-account verification from quote-market readiness. A quote-mint/RPC error no longer replaces a verified Drift account with an incorrect "Unavailable" status. Funding remains research-only; missing observations get calmer, accurate labels, never fabricated values.
- **Error handling:** Do not mislabel Drift transaction rejections as user wallet denials. Clarified zero-token and collateral prerequisites. Replaced the ambiguous "Vault deposits not enabled" line with the real deposit destination, the wallet's personal Drift account.
- Preserves V7.5.1 SolNeutral AI typing hotfix, server-held API key, dashboard design, chart, wallet and signed trade flows.

## What is *not* claimed

The newly implemented checks have not been executed against a live devnet RPC in this sandbox and no wallet signed anything. Source parsing alone is **not** equivalent to `npm run typecheck`, `npm run build`, or verified on-chain transactions. There is currently no claim of a successful USDC/wSOL deposit, withdrawal or order fill. A wallet with zero matching market-0 test USDC cannot deposit USDC, even if it has native SOL.

## Deployment

Vercel Root Directory: `frontend`. Keep the devnet RPC and its genesis check. Anthropic environment variables stay private; the SolNeutral AI endpoint requires a real edge/WAF rate limit before broad public usage. Do not deploy a separate Solidity vault for wallet-owned Drift collateral.
