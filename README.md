# SolNeutral

**Stable yield. Zero directional risk.**

SolNeutral is a delta-neutral USDC vault built on Solana. It runs a long spot + short perpetual strategy on Drift Protocol, collecting funding fees to generate consistent yield regardless of market direction.

Live on Solana Devnet · Powered by Drift Protocol · Built by [Jayeoba Tunmise Paul](https://github.com/Paulos-ui)

---

## What is delta-neutral?

Most DeFi yield strategies are exposed to market direction — if SOL drops 30%, your vault drops with it. SolNeutral eliminates that risk entirely.

The vault holds two equal and opposite positions:
- **Long spot SOL** — held via Jupiter/Orca
- **Short SOL-PERP** — held on Drift Protocol

When SOL price moves, gains on one side cancel losses on the other. Net delta is always ~0. Profit comes entirely from **funding fees** — hourly payments from long position holders to short position holders on Drift.

---

## Performance (90-day simulation)

| Metric | Value |
|---|---|
| Gross APY | 19.84% |
| Net APY | 14.81% |
| Target APY | ≥ 10% |
| Max drawdown | 0.04% |
| Execution fees | $3.15 on $10,000 |
| Positive funding hours | 92.6% |
| Rebalance events | 269 |
| Simulation period | 90 days |

---

## Architecture

```
solneutral-vault/
├── scripts/              # Strategy simulation + proof of APY
│   ├── simulate_trades.py
│   ├── solneutral_simulation.csv
│   └── solneutral_summary.json
├── backend/              # Flask REST API
│   └── app.py
├── frontend/             # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx          # Home
│   │   ├── dashboard/        # Live vault stats
│   │   ├── deposit/          # Deposit/Withdraw
│   │   └── strategy/         # Strategy explainer
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StatCard.tsx
│   │   └── PnLChart.tsx
│   └── lib/
│       └── api.ts
├── vault/                # Anchor smart contract (in progress)
│   ├── deposit.rs
│   ├── withdraw.rs
│   ├── execute_strategy.rs
│   └── rebalance.rs
└── docs/
    └── SUBMISSION.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana |
| Smart contract | Rust + Anchor |
| Perpetuals | Drift Protocol (SOL-PERP) |
| Spot trading | Jupiter / Orca |
| Backend API | Python Flask |
| Frontend | Next.js 15 + Tailwind CSS |
| Charts | Recharts |
| Simulation | Python + Pandas + NumPy |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Rust + Anchor CLI (for smart contract)
- Solana CLI

### 1. Run the simulation

```bash
cd scripts
pip install requests pandas numpy python-dotenv
python simulate_trades.py
```

Output: `solneutral_simulation.csv` and `solneutral_summary.json`

### 2. Start the backend API

```bash
cd backend
pip install flask flask-cors python-dotenv
python app.py
```

API runs on `http://localhost:5000`

### 3. Start the frontend dashboard

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs on `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vault/stats` | Overall vault performance |
| GET | `/api/vault/apy` | Current APY + funding rates |
| GET | `/api/vault/pnl?hours=168` | PnL history for charts |
| GET | `/api/vault/rebalances` | Rebalance event log |
| GET | `/api/vault/funding-rates` | Funding rate history |
| GET | `/api/user/<wallet>/balance` | User balance + yield |
| POST | `/api/user/deposit` | Simulate deposit |
| POST | `/api/user/withdraw` | Simulate withdrawal |
| GET | `/api/risk` | Live risk metrics |

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

## Strategy Logic

```
Every hour:
  funding_earned = perp_collateral × funding_rate
  vault_usdc += funding_earned

Every 8 hours (or delta drift > 2%):
  target_spot = vault_usdc × 0.50
  target_perp = vault_usdc × 0.50
  adjustment  = |current - target|
  cost        = adjustment × 0.0005
  rebalance positions

If drawdown > 10%:
  emergency stop → close all positions
```

---

## Roadmap

- [x] Strategy simulation (Python)
- [x] Backend REST API (Flask)
- [x] Frontend dashboard (Next.js)
- [ ] Anchor smart contract (devnet)
- [ ] Real Drift Protocol integration
- [ ] Mainnet deployment via Ranger Earn
- [ ] Live wallet connect (Phantom)
- [ ] Real-time funding rate feed

---

## License

MIT License — open source, free to use and build upon.

---

*Built on Solana. Powered by Drift Protocol.*
