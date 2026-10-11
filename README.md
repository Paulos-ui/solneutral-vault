# SolNeutral — The Hedge Observatory

> **Yield is visible. Risk should be too.**

**Founder:** [Web3 supporter](https://x.com/instators) · **X:** [@instators](https://x.com/instators) · **GitHub:** [paulos-ui](https://github.com/Paulos-ui)  
**Network:** Solana · **Protocol research:** Drift · **Community focus:** Colosseum / Superteam Nigeria

SolNeutral is an independent Solana research and risk-intelligence product for delta-neutral strategies. It turns opaque hedge assumptions into readable exposures, empirical funding observations, comparable strategies, and documented failure cases. We aim to build secure vault infrastructure, but we don't equate a promising backtest with realized yield or claim any unaudited deposit infrastructure is production-ready.

## Why it exists

A spot-long/perpetual-short portfolio can dampen price exposure without eliminating funding reversals, collateral shortfalls, basis risk, liquidation risk, faulty execution, oracle outages, or protocol vulnerabilities. Yield dashboards often emphasize an APY and bury the conditions under which the strategy fails. **SolNeutral starts with the conditions.**

## Core experience

| Product surface | User benefit | What is verified? |
| --- | --- | --- |
| [Homepage](https://solneutral-vault.vercel.app/) + [Observatory](https://solneutral-vault.vercel.app/observatory) | Bespoke, interactive hedge visualization | Illustrative model only |
| [Connected Dashboard](https://solneutral-vault.vercel.app/dashboard) | Connected devnet SOL balance, verified wallet signatures, Drift funding and clearly labeled interactive stress models | Devnet RPC / indexed funding when available; hypothetical figures labeled |
| [Intelligence Terminal](https://solneutral-vault.vercel.app/terminal) | Funding observation, seven-shock matrix, model stress, hedge comparisons, in-page watch thresholds | External funding records when validated; other values modeled |
| [Risk Lab](https://solneutral-vault.vercel.app/risk-lab) + [Position Risk Engine](https://solneutral-vault.vercel.app/risk-engine) | Explore how spot, short perp, collateral and funding scenarios change outcomes | Deterministic calculations from user's assumptions |
| [Trade Lab](https://solneutral-vault.vercel.app/trade) | Phantom/Solflare wallet discovery, on-chain Drift user initialization, test SOL collateral deposit/withdrawal, bounded SOL-PERP IOC limit orders | Wallet-signed **DEVNET** transactions, subject to devnet wallet/RPC testing. Not a SolNeutral vault. |
| [Wallet Lens](https://solneutral-vault.vercel.app/wallet-lens) | Read public SOL and USDC wallet balances without requesting signatures | Solana RPC if available |
| [Drift Account Lens](https://solneutral-vault.vercel.app/drift-lens) | Verify Drift User account provenance; inspect external indexed records | Owner/discriminator verified via RPC; indexed records labeled as external |
| [Explainable Analyst](https://solneutral-vault.vercel.app/analyst) | Evidence-grounded risk answers, with optional private language model | Deterministic model by default; optional LLM text, never executed trades |
| [About](https://solneutral-vault.vercel.app/about) + [Field Manual](https://solneutral-vault.vercel.app/docs) | Product vision, technical architecture, limitations and user guide | Documentation |
| `vault/solneutral_v3` | Secure custody-and-share accounting design exploration | **Uncompiled / unaudited localnet-only reference; no mainnet use** |

**Not operational:** real-money SolNeutral pooled-vault deposits/withdrawals, mainnet trade execution within SolNeutral, autonomous Drift hedge execution, keeper, verified real-time Drift margin/liquidation computations, audited vault, verified TVL, and automated notifications. Those are explicit future security milestones, not hidden features.

## Install and develop

Requires Node.js 22+ and npm:

```bash
cd frontend
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then open `http://localhost:3000`. Connect a wallet or visit `/dashboard` for the new wallet-first experience. Existing Vercel deployments should use **Root Directory `frontend`**. A working page does **not** imply on-chain execution. All keyless browser research works without Railway.

### Read-only Solana and funding

The public-address Wallet Lens uses mainnet RPC by default; the connected Dashboard and devnet Trade Lab use a separate verified **devnet** RPC. Funding observations are market-level indexed data, not wallet-specific yield. The Drift indexer is queried independently of the wallet network. Use a private server-side RPC URL in Vercel if the public RPC rate-limits or denies requests. Failure yields an explicit unavailable state, not simulated live data.

### Optional AI (private, never enabled automatically)

The `/analyst` page works without credentials. To enable language-model explanations, configure these **server-side** environment variables in Vercel:

```bash
ANTHROPIC_API_KEY=your-private-provider-key
ANTHROPIC_MODEL=a-model-you-have-access-to
AI_DEMO_ACCESS_TOKEN=a-random-secret-at-least-20-characters
```

For a private preview, enter only the **demo access token** on the Analyst page. Do not share the server-side provider key. The API accepts only bounded questions and independently calculates the evidence before asking the model to explain. It cannot trade or access wallet secrets. **Before public availability, add durable distributed rate limiting, authentication and spending caps.**

## Technology and architecture

- **Next.js 16 / TypeScript / React 19**, Tailwind, Framer Motion.
- **Server routes:** read-only Solana RPC, external Drift indexed funding, provenance verification, bounded deterministic model endpoints, optional private AI interpretation.
- **Security boundary:** wallet signing stays in the users own browser wallet, never in a SolNeutral server. The model can provide only explanations; it has no transaction tool.
- **State of truth:** `observed`/`stale`/`unavailable` for external readings, `illustrative`/`user-hypothesis` for modeled calculations.
- **New Anchor program:** separate research vault with token-account constraints and internal share accounting. **Not compiled, audited, connected or deployed.**

See [Technical Architecture](docs/ARCHITECTURE_V3.md), [Vault Release Gates](docs/VAULT_SECURITY_GATES.md), [Demo Walkthrough](docs/DEMO_SCRIPT.md), and [Engineering Plan](docs/ENGINEERING_PLAN.md).

## How to use SolNeutral

1. Open the homepage, inspect the Hedge Field, and **connect Phantom or Solflare**. A connection from the landing page directs you to the new Dashboard.
2. Review the Dashboard. It displays verified public devnet wallet SOL when available; funding observations from the Drift indexer; clearly separate, user-adjustable hedge simulations; and links to personal transaction history.
3. Use the left navigation for **AI Analyst**, **History**, Risk Lab, Wallet Lens and Settings. The top four links are Dashboard, Observatory, Trade Lab and Docs.
4. Switch the Dashboard chart between funding observations and scenario analysis, adjust size/hedge ratio, or open the deeper **Intelligence Terminal** for multi-scenario research.
5. Open **Trade Lab** to test wallet-signed Drift transactions on **DEVNET ONLY**, after acquiring devnet SOL. The transaction controls are *not* a SolNeutral pooled vault.
6. Ask a question in **Analyst**, or inspect a Drift User subaccount in **Drift Lens**. An optional private language model can explain deterministic evidence but cannot trade.
7. Read **Field Manual** and vault limitations before making any financial decision.

## Prior work / hackathon disclosure

This application is an upgrade of the earlier SolNeutral V1 project. Historical Flask simulations and Anchor source are preserved under `legacy/`. We will distinguish reusable prior work from new work created within each applicable competition window, and disclose that provenance in submissions. Interest in Colosseum and Superteam Nigeria does not imply affiliation, sponsorship, selection or award.

### Engineering commitments

We won't ship a vault based on screenshots, fabricated APY, autogenerated secrets, or a passing frontend build alone. Mainnet custody requires full Drift execution design, fresh program ID and generated IDL, extensive Anchor local-validator tests, a threat model, operational controls, monitoring and independent security review.

**Web3 supporter — [@instators](https://x.com/instators)**

## V4 / User-controlled Drift devnet transaction lab

This release adds wallet-standard discovery for Phantom and Solflare, a client-side RPC genesis check, personal Drift account initialization, native SOL collateral deposits and reduce-only withdrawals on Drift devnet, bounded SOL-PERP limit IOC orders, cancel-orders and explorer receipts. Users must explicitly approve each transaction through their wallet. The interface cannot access seed phrases or sign without consent.

**This is not a pooled SolNeutral vault.** Only a personal Drift devnet account receives deposits; our V3 Anchor reference code is not deployed or safe for real assets. Mainnet execution is unavailable. Actual transaction success requires a funded wallet, functional devnet Drift markets and an RPC provider; JavaScript tests are not on-chain integration tests.

From the `frontend` directory, install the new dependencies and run `npm test && npm run typecheck && npm run build`. Optional `NEXT_PUBLIC_DEVNET_RPC_URL` controls the devnet RPC (its genesis hash is checked), `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=false` disables devnet actions. Because any `NEXT_PUBLIC_` variable is visible in browser bundles, restrict RPC keys at the provider or use a proxy. Never publish `ANTHROPIC_API_KEY`. See [Devnet Execution Security](docs/DEVNET_EXECUTION_V4.md).

## Connected workspace — V5 design implementation

The image-led dashboard concept is implemented as real components rather than screenshot placeholders. Panels for SOL balance and wallet activity are backed by a devnet RPC after genesis verification. The funding chart only renders validated Drift indexer observations; it is *not* user's earned yield. Hypothetical PnL and hedge graphs react to adjustable spot and hedge ratios and are visibly marked as simulations. Real portfolio valuation, Drift margin and live liquidation fields are intentionally unavailable until a fully verified protocol integration exists.

The app offers a wallet-first view, a four-item top navigation, and a sidebar for secondary tools. Real wallet funds and mainnet SOLNeutral pooled deposits must not be used in this experimental devnet product.
