# SolNeutral V6.1 — cumulative release

- Maintains all V6 navigation, dashboard, AI, Docs, Observatory and Drift devnet features.
- New: Next.js `/api/health` diagnostics with optional fixed-source devnet/mainnet RPC genesis-hash probes. No secrets or private RPC URLs are returned.
- Corrected: `/api/status` reports the actual V6.1 feature state rather than outdated V3 flags.
- New: Settings > Backend & data services checker.
- Improved: Trade Lab prominently surfaces wallet/network/Drift User account initialization, opens the Account pane when an account is verified missing, and preserves wallet approval/testnet controls.
- New: detailed Vercel environment mapping and setup guide.
- No new dependencies, no Railway backend migration, no new mainnet vault functionality.
- Validation: 53 local deterministic tests passed; TypeScript and CSS source parsing passed. Full Next.js build and live Drift wallet transaction **not run** in this environment.
