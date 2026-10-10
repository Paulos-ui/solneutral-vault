# SolNeutral V2 — Engineering rollout

## Phase 1: Delivered in this package

- Next.js 16-only Vercel research app with no Railway runtime dependency.
- Custom responsive mineral-green aesthetic; interactive signature balance visualization.
- Deterministic, validated shared scenario model and read-only server endpoints.
- Honest data-state UI and disabled deposits. No unreviewed transactions are enabled.
- Full About, Field Manual, test suite, migration notes, and founder attribution.

## Phase 2: Real data, read-only

1. Research Solana and Drift API/SDK version compatibility against real network and official protocol docs.
2. Record market identifiers and fetch live oracle/funding/position information server-side.
3. Add timestamps, staleness labels, source links, service error modes, pagination/rate limiting and retry policies.
4. Show empty states instead of displaying synthetic TVL/APY as live data.
5. Compare reference-market observations against independently reproducible on-chain transactions.
6. Monitor correctness with deterministic fixtures and network integration tests.

## Phase 3: Smart contract redesign

Do NOT deploy legacy vault code as-is. It lacks a trustworthy correspondence between its published IDL and actual source instructions and contains fixed-yield payout logic. Specify deposit/withdraw invariants, per-share NAV methodology, profit/loss attribution, authority separation, token validation, fees and idle cash limits first. Add Anchor tests for authorization, overflow/underflow, reentrancy-like CPI assumptions, liquidation drift, oracle events, user exits and partial failures. Arrange independent review before any mainnet funds.

## Phase 4: Intelligent risk analysis

Expose machine-readable pure risk calculations with explicit assumptions. Add an LLM summary layer ONLY on top of verified calculations; constrain recommendations to explanation and education at first. Never delegate wallet signing or key access to an LLM. Maintain explanations with provenance and give the user control over actions.

## Phase 5: Keeper/execution

If automated rebalancing is necessary, build a purpose-made monitored keeper, not a long-running loop inside a Vercel Function. Define circuit breakers, idempotency keys, durable scheduling, RPC fallback strategy, emergency halt, vault pause logic, gas budgeting, user disclosure and audit logs.

## Submission readiness

Maintain a changelog separating pre-existing V1 work from competition-period V2 contributions. Judges should receive a short product demo, working public research URL, reproducible setup, technical tests, source-based performance claims (if added), honest roadmap, and proof of user feedback. Do not claim a Colosseum or SuperteamNG partnership or award without confirmation.
