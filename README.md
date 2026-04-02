# SolNeutral
 
**Stable yield. Zero directional risk.**
 
SolNeutral is a delta-neutral USDC vault built on Solana. It runs a long spot + short perpetual strategy on Drift Protocol, collecting funding fees to generate consistent yield regardless of market direction.
 
Live on Solana · Powered by Drift Protocol · Built by [Jayeoba Tunmise Paul](https://github.com/Paulos-ui)
 
🌐 **Live Dashboard:** https://solneutral-vault.vercel.app
📦 **Smart Contract:** `Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA`
🔗 **Solscan:** https://solscan.io/account/Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA?cluster=devnet

---
 
## What is delta-neutral?
 
Most DeFi yield strategies are exposed to market direction — if SOL drops 30%, your vault drops with it. SolNeutral eliminates that risk entirely.
 
The vault holds two equal and opposite positions:
- **Long spot SOL** — held via Jupiter/Orca
- **Short SOL-PERP** — held on Drift Protocol
 
When SOL price moves, gains on one side cancel losses on the other. Net delta is always ~0. Profit comes entirely from **funding fees** — hourly payments from long position holders to short position holders on Drift.
 
---
 
## Live Trading Proof
 
Real delta-neutral position opened on Drift Protocol mainnet:
 
| Detail | Value |
|---|---|
| Exchange | Drift Protocol (Solana mainnet) |
| Market | SOL-PERP |
| Side | Short |
| Size | 0.03 SOL ($2.48) |
| Entry price | $82.91 |
| Leverage | 1x |
| Position health | 97% |
| Collateral | $2.64 USDC |
| Liquidation price | $166.20 |
| Date opened | April 1, 2026 |
| Status | Active — collecting funding fees |
 
**Wallet:** `8xqny651iFnNsnFeFqupNCzCc5QWqtSx3tfrLPkZGXeu`
**Solscan:** https://solscan.io/account/8xqny651iFnNsnFeFqupNCzCc5QWqtSx3tfrLPkZGXeu
 
---
 
## Performance (90-day simulation)
 
| Metric | Value |
|---|---|
| Gross APY | 19.84% |
| Net APY | 14.81% |
| Target APY | ≥ 10% ✅ |
| Max drawdown | 0.04% |
| Execution fees | $3.15 on $10,000 |
| Positive funding hours | 92.6% |
| Rebalance events | 269 |
| Simulation period | 90 days |
 

## On-chain Vault Proof (Devnet)

| Item | Address / TX |
|---|---|
| Program ID | `Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA` |
| Vault PDA | `3X8BTvktbRv2CLcLaortUrMa9s5Sk5qhuzKe47Y8GYhj` |
| Vault USDC | `HDHkF3CqGNZwP6MubsvS9coxWgHU2s1SHKWzicUpDuRe` |
| Initialize TX | `4hNrfUZ59j4jTF9...` |
| Deposit TX | `2vd6kKLZeMqAQty...` |

[View deposit on Solscan →](https://solscan.io/tx/2vd6kKLZeMqAQtyMWoCi6KHbvYLkNgJbGuESmLedcjzKitUHg1FTf7HW2c6QZG9aJ919SSV92HujBfKZKgxq8ZiD?cluster=devnet)

---
 
## Architecture
 
```
solneutral-vault/
├── scripts/                      # Strategy simulation + proof of APY
│   ├── simulate_trades.py        # 90-day delta-neutral simulation
│   ├── solneutral_simulation.csv # 2,160 hourly data points
│   └── solneutral_summary.json   # Performance metrics (feeds API)
├── backend/                      # Flask REST API (10 endpoints)
│   ├── app.py
│   ├── requirements.txt
│   └── Procfile
├── frontend/                     # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx              # Home — APY hero, strategy summary
│   │   ├── dashboard/            # Live vault stats, PnL chart
│   │   ├── deposit/              # Wallet connect, deposit/withdraw
│   │   └── strategy/             # Strategy explainer, risk management
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StatCard.tsx
│   │   ├── PnLChart.tsx
│   │   ├── PersonalPnL.tsx
│   │   ├── WalletProvider.tsx
│   │   └── WalletButton.tsx
│   └── lib/
│       ├── api.ts
│       └── solana.ts
├── vault/                        # Anchor smart contract
│   └── solneutral/
│       └── programs/solneutral/src/lib.rs
└── docs/
    └── SUBMISSION.md
```
 
---
 
## Smart Contract
 
**Program ID (devnet):** `Ec8p91GG46mQHr9UVGXzddJqVzcjiswGxoWAFW6BPsUA`
 
| Instruction | Description |
|---|---|
| `initialize` | Create vault state account |
| `deposit` | Accept USDC, mint shares, start 90-day lock |
| `withdraw` | Check lock, calculate yield, return payout |
| `rebalance` | Log funding fees, update APY every 8h |
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Blockchain | Solana |
| Smart contract | Rust + Anchor 0.29.0 |
| Perpetuals | Drift Protocol (SOL-PERP) |
| Backend API | Python Flask — Railway |
| Frontend | Next.js 15 + Tailwind CSS — Vercel |
| Charts | Recharts |
| Wallet | @solana/wallet-adapter |
| Simulation | Python + Pandas + NumPy |
 
---
 
## Getting Started
 
```bash
git clone https://github.com/Paulos-ui/solneutral-vault
cd solneutral-vault
 
# Simulation
cd scripts && pip install requests pandas numpy python-dotenv
python simulate_trades.py
 
# Backend
cd backend && pip install flask flask-cors python-dotenv gunicorn
python app.py
 
# Frontend
cd frontend && npm install && npm run dev
```
 
---
 
## Risk Management
 
| Parameter | Value |
|---|---|
| Max drawdown | 10% hard stop |
| Max position size | 25% of vault |
| Collateral buffer | 20% above liquidation |
| Rebalance trigger | Every 8h or delta drift > 2% |
| Lock period | 90 days rolling |
| Performance fee | 20% on profits |
 
---
 
## Roadmap
 
- [x] Strategy simulation — 19.84% gross APY proved
- [x] Backend REST API — 10 endpoints on Railway
- [x] Frontend dashboard — 4 pages on Vercel
- [x] Wallet connect — Phantom + Solflare
- [x] Anchor smart contract — deployed on Solana devnet
- [x] Live Drift trade — SOL-PERP short active on mainnet
- [x] Frontend → smart contract integration
- [x] Mainnet vault deployment via Ranger Earn
- [ ] Automated keeper for rebalancing
 
---
 
## Hackathon
 
Built for **Ranger Build-A-Bear Hackathon** (Main Track) and **Superteam × HelpBnk March Challenge**.
 
See `docs/SUBMISSION.md` for full submission details.
 
---
 
## License
 
MIT — open source, free to use and build upon.
 
---
 
*Built on Solana. Powered by Drift Protocol.*
*Follow: [@Jayking](https://x.com/__official__1)*