# SolNeutral · Phase 2A — Quiet Interface + Sourced Signals

Founder: **Web3 supporter** · X: **@instators**

## Changes
- Removed top neon announcement bar and visible `/ V2` branding.
- Reduced desktop/tablet/mobile hero headline size to favor visual balance.
- No obsolete V1 files are touched, no repository structure changes.
- Added read-only market funding intelligence instrument to Observatory.
- Strictly validates externally indexed Drift SOL-PERP rate observations.
- Never shows mock market data or claims observed market funding equals vault return.
- Includes fallback/degraded states if upstream API fails or is stale.
- Test parser with `npm test` from `frontend`.

## User workflow
1. Visit `/observatory`; scroll to **Follow the funding signal**.
2. If the Drift public indexer responds, see the sourced records and their age.
3. If unavailable, the panel will explicitly say so without fake metrics.
4. Change exposure in the Hedge Field. It remains illustrative.
5. Continue to `/risk-lab` for hypothetical stress tests.

## Important
This is not a live Drift SDK position integration, a vault APY feed, or an autonomously managed hedge. Before trading support, implement and audit correct position accounting, collateral/liquidation simulation, wallet controls and keeper execution.

## Known caveat
The Drift indexer endpoint can change or be rate limited; live network access was not available to the builder at the time of packaging. Always test the funding panel and endpoint against the deployed site before claiming it is live.
