# SolNeutral V6 — Cumulative Release Manifest

- Product: SolNeutral
- Founder: Web3 supporter · @instators
- Codebase: Full consolidated V5 base with funding type correction and V6 UX changes
- Intended repository: existing `solneutral-vault` checkout, no separate repo
- Contents: Next.js frontend + API, deterministic models/tests, V3 Anchor research source, docs, and historical V1 files
- Behavior: `unzip -o` overwrites matching paths, preserves `.git`, and does not delete unmatched legacy files
- Main product changes: compressed home/dashboard, persistent Docs sidebar, compact Observatory and Risk Lab, tabbed devnet trade workstation, Q&A analyst, concise History/Settings, corrected brand navigation
- External functions: Solana devnet RPC, Drift indexer and Drift devnet SDK require live integration checks
- Product restrictions: no mainnet vault deposits, no invented financial returns, no unattended trading, no production custodian claim
- Verification: 50 unit/source tests pass and all frontend TS/TSX files parse; Next.js build **not confirmed** locally because npm dependency installation is blocked
