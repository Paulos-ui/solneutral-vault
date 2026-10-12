# SolNeutral V7.6 — Frontend

Production build: Next.js 16 / TypeScript / Tailwind / Framer Motion / Solana Wallet Adapter. Vercel Root Directory is `frontend`.

Current wallet-connected environment: **Solana testnet** (`NEXT_PUBLIC_TESTNET_RPC_URL`, defaults to the standard public testnet RPC).

Connected workflow: Dashboard → Trade Lab (SOL Reserve) → Deposit SOL into the wallet's own canonical wSOL ATA → Withdraw all wSOL as native SOL. These transactions require a wallet signature and Solana testnet genesis verification. This is **not** Drift collateral, an Anchor custody contract, lending, staking, real APY, or a real-money vault.

Research features: Coinbase SOL/USD candlestick chart, hypothetical hedge scenarios, risk models, and SolNeutral AI via server-only Anthropic API. Archived Drift source and reference vault prototypes remain for developer research but are not wired into the active wallet flows.

```bash
npm ci
npm run typecheck
npm run build
```

Read the root `START_HERE.md` for network setup. Users need testnet SOL; devnet and testnet balances are separate. Real transaction success requires signed on-chain verification after deployment; don't advertise verified results without signatures and observed balances.
