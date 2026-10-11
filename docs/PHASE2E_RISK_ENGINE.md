# Phase 2E — Position Stress Engine

Founder: **Web3 supporter** · X **@instators**. Built for Solana builders and research audiences; not an endorsed product of Colosseum or Superteam Nigeria.

## Combined delivery

This update includes all Phase 2D files plus the TypeScript ES2020 target fix needed by Phase 2C `BigInt` literals. Apply this archive directly to the same repository root; 2D does not need separate installation. Phase 2C must already be present.

## What's new

- `/risk-engine` is a uniquely designed mineral-green exposure terminal. Users enter hypothetical quantities of SOL spot and signed SOL perpetuals, reference price, margin capital, assumed maintenance fraction, daily funding, and horizon.
- Seven shocks (−40%, −25%, −10%, 0%, +10%, +25%, +40%) with reproducible price PnL, modeled carry, spot/perp leg separation, and a deliberately limited margin buffer approximation.
- The margin buffer only includes selected perp PnL, hypothetical funding and user-entered perpetual collateral, never transferable unrealized spot gains. It is **not Drift margin health or liquidation data**.
- Reuses `/drift-lens` only as a separate evidence-check flow, not as a source of live position sizes.
- `POST /api/risk/positions` shares the same deterministic model (strict finite-range JSON validation, no user-controlled URLs or external calls).
- No new runtime npm dependencies.

## Data & security boundaries

The client does not connect or sign a wallet. The API neither trades nor stores portfolios. The inputs and output do not represent on-chain Drift account state. The rate assumption is a static scenario parameter, not a forecast. Protocol-specific health, margin tiers, borrow costs, liquidations, slippage, cross-margin effects and oracle states require further audited integrations.

## Steps

1. Extract ZIP into the **existing repository root**.
2. `cd frontend && npm install && npm test && npm run typecheck && npm run build`.
3. Review `/drift-lens` and `/risk-engine` locally, then commit/push.

## Validation

The updated models have Node built-in tests and syntax checks. A production build must pass on the user's machine before deploying; do not assume success based solely on extraction.
