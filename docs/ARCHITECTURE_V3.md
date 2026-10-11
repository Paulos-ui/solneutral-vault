# SolNeutral — V3 Architecture & Evidence Boundaries

## Main architecture

```
Browser (Next.js / Framer Motion)
  ├── Homepage + interactive hedge field          [ILLUSTRATION]
  ├── Intelligence Terminal                       [INDEXED + MODELED]
  │     ├── /api/market/funding -> Drift indexer  [EXTERNAL OBSERVATION]
  │     └── position-risk + intelligence.ts       [PURE MATH]
  ├── Wallet Lens -> /api/chain/wallet -> RPC     [ON-CHAIN READ ONLY]
  ├── Drift Lens -> /api/drift/account -> RPC     [ACCOUNT TYPE VERIFIED]
  │                                 -> indexer     [INDEXED HISTORY; NOT POSITIONS VERIFIED CURRENT]
  ├── Risk Analyst (deterministic)                [EXPLAINABLE MATH]
  │     └── /api/ai/interpret -> Anthropic        [OPTIONAL TEXT ONLY, PRIVATE GATE]
  └── Research Vault (separate Anchor source)    [NOT CONNECTED / NOT DEPLOYED]
```

## Non-negotiable labels

- `Observed`: public indexed data normalized with validated units and timestamps. External indexing is not proof of on-chain account state.
- `Stale`: observation older than freshness threshold; not a current market signal.
- `Unavailable`: never backfill missing external observations with illustrative numbers.
- `Modeled`: computed from visible, bounded assumptions, never a verified wallet portfolio.
- `On-chain verified`: RPC ownership and discriminator verification for an account, not its economic health.

## AI boundary

The analytical core is a deterministic TypeScript model. Optional model invocation uses an Anthropic Messages endpoint **only** if all three server-side environment variables exist and the private demo access token matches. Questions are bounded; fields are validated and recomputed server-side. The model receives only the calculations and question (not wallet private keys). It has no wallet, signer, trade execution or deposit tool. The web route is not intended for public paid-inference traffic until distributed rate limiting, authorization and abuse monitoring exist.

## Data availability

Network access may fail, providers may change schema or rate-limit public RPC. All conditional integrations must gracefully show degraded states and source references. `SOLANA_RPC_URL` must stay private. Do not set `NEXT_PUBLIC_SOLANA_RPC_URL`.

## Long-term roadmap

1. Integrate verified per-market Drift User state using the maintained SDK and current risk formulas.
2. Model oracle freshness, collateral weights, liquidation and funding accurately with protocol documentation and integration tests.
3. Build a keeper service with separate transaction controls, replay protection, pauses, monitoring and a funded security plan. A perpetual keeper cannot reliably run solely as short-lived Vercel route handlers.
4. Review and test vault contracts; integrate only audited program deployments and generated IDL.
5. Implement real product research cohorts and feedback before mainnet custody, and disclose V1 history for competition submissions.
