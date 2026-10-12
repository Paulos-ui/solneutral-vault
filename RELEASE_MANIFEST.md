# SolNeutral V7.5.3 | Anchor spot-market type safety hotfix

This is a complete cumulative source ZIP based directly on V7.5.2, for extraction at the root of the **existing** `solneutral-vault` repository. The ZIP does not include `.git` and will not overwrite repository history.

## Targeted fix from Vercel deployment

- Fixed `frontend/lib/drift-devnet.ts` build error `market.mint is of type unknown` by validating and narrowing Anchor's `spotMarket.fetch()` account data into explicit `marketIndex`, `decimals`, and Solana `PublicKey` fields.
- Applied the same decoding to **both** the wSOL market resolver (former line 90) and the USDC quote-market resolver (former line 134), so the error is not merely shifted to the second collateral path.
- Preserved the previous Drift program ownership, canonical PDA, index and decimals checks before any collateral transaction. No permissive `any`, compiler-error suppression, or guesswork about the USDC mint was introduced.
- No UI, network, dashboard, AI, order execution, or wallet-signing flow was changed by this hotfix.

## Verification boundaries

The npm registry was not reachable from this build environment. Therefore this delivery **cannot** claim `npm ci`, a full app typecheck, Vercel `next build`, or live Drift deposit/withdrawal verification. Validate those in the existing repository before pushing. A successful Vercel build likewise does not prove on-chain collateral movement; verify transaction signatures and account balances separately.

## Deployment

Keep Vercel Root Directory as `frontend`. Keep Drift wallet-signed transactions on Solana devnet. Keep the `ANTHROPIC_API_KEY` private. No new environment variables are required for this typing fix.

## Preserved V7.5.2 functionality

- **Drift quote collateral:** Read the canonical Drift Spot Market 0 PDA directly from the deployed devnet program. Verify PDA ownership, decoded account index/mint, SPL mint owner and six-decimal precision. If the SDK subscription omits the existing market, load it explicitly. Derive the wallet token account from the verified *on-chain market mint* instead of relying solely on SDK config or guessing from faucet labels.
- **Wrapped SOL:** Independently verify the standard SOL market (index 1) plus subscribed wSOL candidates by PDA ownership, on-chain mint, and nine-decimal precision. Dynamically subscribe if present. Check before wrapping or depositing; never assume the market exists. Existing wallet-owned wSOL can be unwrapped even without a valid Drift collateral market.
- **Dashboard:** Separate Drift user-account verification from quote-market readiness. A quote-mint/RPC error no longer replaces a verified Drift account with an incorrect "Unavailable" status. Funding remains research-only; missing observations get calmer, accurate labels, never fabricated values.
- **Error handling:** Do not mislabel Drift transaction rejections as user wallet denials. Clarified zero-token and collateral prerequisites. Replaced the ambiguous "Vault deposits not enabled" line with the real deposit destination, the wallet's personal Drift account.
- Preserves V7.5.1 SolNeutral AI typing hotfix, server-held API key, dashboard design, chart, wallet and signed trade flows.

