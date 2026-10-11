# SolNeutral V7.5 — Current product

Live UI: SolNeutral AI (no visitor token), Drift wSOL market verification, on-chain account and USDC visibility in the dashboard, simplified Settings. The AI needs operator-held Vercel environment variables `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` and a WAF rate limit; no keys are placed in the client. Drift remains **devnet**, not testnet. Signed transaction proof is still pending. See root `START_HERE.md` and `docs/V7_5_PRODUCT_UPGRADE.md`.

---

# SolNeutral

**A more transparent way to hedge on Solana.**

SolNeutral is a wallet-first DeFi research and devnet execution workspace for understanding long-spot/short-perpetual strategies. Its differentiator is **visible risk**: each data tile distinguishes public blockchain observations, indexed Drift market records, user-controlled signed test transactions, and reproducible hypothetical models.

**Founder:** Web3 supporter · **X:** [@instators](https://x.com/instators) · **GitHub:** [paulos-ui](https://github.com/Paulos-ui) · **Ecosystem:** Solana, Drift

> **Status:** Research/development preview with wallet-signed **Drift devnet** execution. No production SolNeutral pooled vault, mainnet deployment or audited deposit service. This project is not endorsed by Colosseum or Superteam Nigeria.

## What makes SolNeutral useful

The traditional DeFi dashboard can display a tempting APR without communicating the risk that makes it possible. SolNeutral explores the opposite approach: the first screen is an actual workspace, not an oversized marketing presentation; the trader sees wallet state, funding observations, risk assumptions and transaction controls with explicit provenance and caveats.

## Product walkthrough

1. **Landing page.** Explore the animated Hedge Field and choose the dashboard or the documentation.
2. **Connect Phantom or Solflare** using the wallet modal. The homepage opens the connected dashboard after successful connection.
3. **Dashboard.** Inspect real devnet wallet SOL and recent signatures where verified. Explore market-wide indexed SOL-PERP funding and a *clearly marked* hypothetical shock model. A dash means missing evidence, not zero risk.
4. **Observatory.** Manipulate the illustrative hedge balance, view funding records, retry the source and expand the technical exposure study.
5. **Trade Lab.** Four compact panels: **Trade**, **Collateral**, **Account**, **Orders**. Operations interact only with a user-owned Drift devnet account and require network checks, explicit acknowledgement and a wallet signature. Small bounded IOC SOL-PERP orders are not guaranteed to fill.
6. **AI Analyst.** Ask natural-language risk questions; the deterministic model works without any paid API. Private hosted-model narration is optional, gated and strictly read-only.
7. **Risk Lab.** Adjust notional, hedge ratio, price movement, funding and duration. No simulated output is claimed as verified PnL.
8. **History and Settings.** Review recent Solana signatures and inspect network/signer settings.
9. **Docs.** The persistent left rail remains available while reading the technical/user guide.

### Compact navigation

| Persistent top navigation | Left workspace rail |
| --- | --- |
| Dashboard · Observatory · Trade Lab · Docs | AI Analyst · Activity History · Risk Lab · Settings (plus quick workspace links) |

In the app, clicking the SolNeutral brand returns to **Dashboard**. On the public homepage it returns to the landing page.

## Verified vs modeled

| Data/feature | Current status |
| --- | --- |
| Native devnet SOL wallet balance | From RPC after checking genesis hash; requires connected wallet |
| Recent wallet signature records | Public RPC observations, not decoded trading fills |
| SOL-PERP indexed funding | Drift indexer, shown only when records validate; may be stale or unavailable |
| Hedge shock / basis / funding estimates | Deterministic scenario models, not realized PnL |
| Live Drift collateral ratio, liquidation health and verified realized PnL | **Not yet implemented**; never fabricated |
| Phantom/Solflare wallet signing | Implemented for devnet workflows, full external wallet compatibility requires end-to-end testing |
| Drift deposit, withdraw, create account, bounded order, cancel | SDK flows for **devnet test assets**; transactions require end-to-end verification |
| SolNeutral pooled strategy deposits and keeper | **Not enabled**; experimental Anchor source is separate from the frontend |

**Deposits to Drift are not deposits to a SolNeutral vault.** Native devnet SOL is wrapped to wSOL before Drift deposit, with separate wallet signatures. Withdrawals return wSOL. Neither balances nor actual PnL can be inferred from a signature alone.

## Architecture

- **Next.js 16 / React 19 / TypeScript** application in `frontend/`, hosted on Vercel.
- **Tailwind + custom CSS + Framer Motion** for the original interface and animated hedge visualization.
- **Solana Wallet Adapter + @solana/web3.js** for wallet sessions and devnet RPC.
- **Drift SDK** loaded in the signed execution path for user-owned test operations.
- **Next.js API routes** for server-side indexed funding collection and optional authenticated language-model interpretation.
- **Pure deterministic mathematics** for scenario and risk models. No simulated data is relabeled as actual market history.
- **Anchor/Rust research vault** in `vault/solneutral_v3`, intentionally disconnected from live trading. Not compiled, deployed or security audited in this release.
- **Historical V1 materials** in `legacy/`, retained for provenance and discussion of improvements.

## Run locally

Requires a current Node.js LTS release and npm.

```bash
cd frontend
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`. Never upload your `.env.local`, wallet seeds or signing keys. Use server-side variables for any AI provider credential. If Drift or RPC responses are unavailable, the UI should say so clearly; do not backfill with made-up rates.

### Production/deployment guardrails

The developer should independently validate end-to-end browser wallet signing on devnet, ensure the RPC targets devnet, confirm transaction signatures and actual outcomes on Solana Explorer, and keep mainnet vault deposits disabled. Never claim an experimental vault is audited. See `docs/V6_RELEASE.md` and `docs/VAULT_SECURITY_GATES.md`.

## Colosseum / Superteam Nigeria demonstration

**Problem:** Yield-focused DeFi interfaces often obscure funding reversals, margin risk, and the distinction between backtests and deployed positions.

**Demonstration:** Start on the first-screen hedge animation, connect a devnet wallet, inspect the compact dashboard, alter a price shock, open funding provenance, switch to Trade Lab, and explain exactly which steps require user signatures. Use the AI Analyst to explain why a near-zero delta does not guarantee a safe strategy.

**Originality:** A unified user experience centered on verifiable inputs and explicit model boundaries rather than unsupported yield promises. Prior SolNeutral code predates the V6 work; the project should disclose reused components in any hackathon submission and clearly identify what was built during the eligible competition period.

**Roadmap:** Decode verified Drift trading position and collateral state; add complete verified fills and PnL; expand indexer provenance and monitoring; build, test and independently assess Anchor vault custody/share logic before any production deposits. For details see `docs/ENGINEERING_PLAN.md`.

---

Built by **Web3 supporter** for the Solana ecosystem. Research and software-development preview, not financial advice.
