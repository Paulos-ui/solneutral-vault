# SolNeutral V7.6.2 — Trade Lab Learning Desk

This release updates **the existing SolNeutral repository**, preserving its Next.js 16 / TypeScript frontend, wallet adapters, Solana testnet SOL reserve, AI, scenario modeling, and Vercel root directory (`frontend`).

## User-facing improvements

- Removed the duplicated SolNeutral logo and network name from the connected dashboard introduction; the main navigation still carries the SolNeutral identity.
- Updated the actual favicon.ico from `frontend/app/icon.svg` so Chrome/other browsers use the SolNeutral brand instead of the default template icon.
- Rebuilt Trade Lab into a desktop **left market chart / right order ticket** layout; stacks sensibly on mobile.
- Added **SOL/USD and BONK/USD** quote selectors; data is sourced from external Coinbase Exchange markets and is not testnet order execution.
- Added an educational **$10,000 virtual USD paper account** with long/short, margin, leverage, multiple local positions, and simulated unrealized/realized PnL. Trades never sign or broadcast an order.
- Preserved the separate wallet-signed testnet SOL → wallet-owned wSOL reserve with withdrawal and transaction receipts.
- Improved guidance for testnet SOL including a link to the official Solana faucet.

## What this project does not yet do

- **No on-chain testnet order matching or token swaps**: SOL and BONK demo trades are browser-local simulations with external market reference prices.
- **No yield or pooled DeFi vault**: the wallet reserve only wraps/unlocks the connected wallet's SOL.
- No fabricated balances or fictitious market quotes. Missing/delayed prices prevent new paper orders.

## Requirements

- Vercel Root Directory: `frontend`.
- Optional dedicated `NEXT_PUBLIC_TESTNET_RPC_URL`; fallback `https://api.testnet.solana.com`.
- Private Anthropic API configuration stays server-only.

## Validate locally

```bash
cd frontend
npm ci
npm run typecheck
npm run build
```

**Verification limitations at packaging:** TypeScript/TSX syntax checked with the installed TypeScript compiler; full `npm ci`, typecheck, and Next.js production build were unavailable because dependencies were not cached and the registry was unreachable. On-chain reserve transactions and BONK market feed must be tested in the deployed environment.
