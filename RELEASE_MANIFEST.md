# SolNeutral V7.1 — Live Chart & Safer Devnet Collateral

- Full cumulative V2–V7.1 repository-root release (no nested wrapper directory).
- Original premium wallet-first dashboard, Observatory, Risk Lab, AI Analyst, Docs and Trade Lab retained.
- Trade Lab SOL/USD Coinbase spot candlestick chart (1m/5m/15m/1h/6h/1d) and `/api/market/sol-chart`; observation only, **not** a Drift-perp mark/execution feed.
- Corrected handling of failed SOL collateral deposits: dynamically validate actual wSOL spot market by mint and Drift program owner **before** wallet wrapping; do not assume market index 1.
- Reuse available wallet-owned wSOL; only wrap a deficit. Explicit wallet-signed **Unwrap wSOL** action closes the user's canonical wSOL ATA, converting its entire balance to SOL (plus reclaimed rent).
- Deposits and withdrawals require Drift devnet account verification, wallet signature, and on-chain confirmation; unsupported devnet collateral fails closed.
- Optional Claude integration remains server-side and access-token gated. No private credentials embedded in ZIP.
- Experimental Anchor vault in `vault/` remains uncompiled, unaudited and disconnected from mainnet deposits.
- **Checks:** 63 Node deterministic tests pass; ZIP CRC / root layout checked. Full `npm run typecheck` / Next.js production build and live signed devnet transactions **not verified** in this environment.

See [`docs/V7_1_COLLATERAL_AND_CHART.md`](docs/V7_1_COLLATERAL_AND_CHART.md) for recovery and caveats.
