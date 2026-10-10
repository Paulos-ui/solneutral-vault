# SOLNEUTRAL / V2
### The Hedge Observatory

> **The art of staying neutral.** The goal isn't to erase risk. It's to make risk visible.

SolNeutral V2 is an in-development, risk-intelligent Solana DeFi research experience. It explores the mechanics of long-spot / short-perpetual hedges, makes funding assumptions inspectable, and helps users understand how hedge drift affects price exposure. The current release is a polished, working **research preview**, not a custodial vault or live trading service.

**Founder:** [Web3 supporter](https://x.com/instators) · **X:** [@instators](https://x.com/instators)  
**Ecosystem:** Solana · **Builder audience:** Colosseum and Superteam Nigeria (independent project; no affiliation or endorsement implied)

## Why build SolNeutral?

“Delta neutral” doesn't mean risk-free. A perfect-looking hedge can still lose money to funding reversals, leverage, liquidations, basis changes, fees, poor execution, or infrastructure failures. SolNeutral puts the explanatory tools **before** the yield headline.

## What is actually working in this release

| Feature | Current status |
| --- | --- |
| Bespoke "Hedge Observatory" visual identity | Implemented |
| Animated interactive hedge field (60–140%) | Implemented — **conceptual** |
| Educational spot/perpetual exposure chart | Implemented — **illustrative** |
| Risk Lab with adjustable scenarios | Implemented — **deterministic simplified math** |
| Server-side `POST /api/risk/scenario` | Implemented — input validation and bounded output |
| `GET /api/status` | Implemented — honest status and capability flags |
| Responsive layout, navigation, reduced-motion support | Implemented |
| About / Field Manual / onboarding documentation | Implemented |
| Guarded deposit entry point | Implemented — **deposits disabled** |
| Live Solana / Drift data and transaction history | **Not integrated yet** |
| Wallet connection, secure vault accounting, keeper | **Not implemented in V2 yet** |
| AI analyst with sourced calculations | **Planned** |
| Production contract audits or mainnet vault | **Not delivered** |

No real vault TVL, live APY, user PnL, successful executed trades, or liquidity is claimed by this preview.

## Start in under five minutes

Requires **Node.js 22+** and npm. Commands use your normal Git Bash terminal.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Visit `/observatory`, `/risk-lab`, `/about`, and `/docs`.

### Run checks

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

> The ZIP is delivered without `node_modules` or a generated package lock, since dependency installation requires network access. Running `npm install` will generate `package-lock.json`. Commit that lockfile after confirming installation.

### Test the research API

```bash
curl -X POST http://localhost:3000/api/risk/scenario \
  -H 'Content-Type: application/json' \
  -d '{"spotNotionalUsd":25000,"hedgeRatioPct":100,"priceMovePct":-18,"annualFundingPct":8,"days":30}'
```

This is the same bounded calculation as the visual simulator. Invalid inputs return HTTP `422`; malformed JSON returns `400`.

## How it works / User guide

1. **Start at the homepage.** Adjust the counterweight in the hedge field to see the basic effect of balancing long and short exposures.
2. **Open the Observatory.** Inspect the same conceptual balance mechanism and the illustrative indexed exposure chart; click its legend to isolate series.
3. **Open Risk Lab.** Choose a spot notional, hedge ratio, price shock, annualized funding assumption, and time horizon.
4. **Study the decomposition.** The output separates spot price P/L, perpetual price P/L, funding effect, gross notional and residual delta.
5. **Read the Field Manual.** Learn exactly what has been modeled, what has been omitted, and what must be built before real funds are at stake.

## Simplified model

Let **S** = USD notional of a long spot position, **h** = short perp hedge ratio (e.g. `1.0` for fully hedged), **m** = hypothetical spot price move, **f** = assumed annualized funding fraction, and **d** = number of days.

```text
spot price P/L   = S × m
perp price P/L   = −S × h × m
funding effect   = S × h × f × (d / 365)
modeled total    = spot P/L + perp P/L + funding effect
net delta (%)    = (1 − h) × 100
```

**Important:** This is intentionally not a deployable trading model. It does NOT model collateral, leverage, liquidation, margin health, borrow costs, basis, compounding, variable intra-period funding, position rebalancing, execution slippage, protocol fees, smart contract risk, or transaction failures. Funding payments can change direction. The results are **illustrative only**.

## Architecture

```text
frontend/                      Next.js 16, React 19, TypeScript, Tailwind, Framer Motion
  app/                         App Router pages and server endpoints
    page.tsx                   Signature landing page
    observatory/               Conceptual exposure field
    risk-lab/                  Interactive deterministic model
    about/                     Vision and provenance
    docs/                      Field manual / user guide
    deposit/                   Guarded disabled vault status
    api/status/                Explicit preview-status endpoint
    api/risk/scenario/         Validated scenario endpoint
  components/                  Brand, motion, SVG instrument, chart and simulator
  lib/scenario.ts              Shared pure, bounded calculations
  tests/                       Scenario correctness and input boundary tests
legacy/                        Archived V1 source — NOT RUN by V2
  frontend-v1/                 Original V1 React/Next frontend
  backend/                     Flask / historical simulation API
  scripts/                     Historical research scripts and CSV
  vault/                       Old incomplete Anchor source and associated artifacts
  README_V1.md                 Original historical copy

docs/                           Build roadmap, design system and migration decisions
```

The site can run on Vercel without Railway because its current APIs are stateless Next.js route handlers. **Continuous automated strategy execution must not be placed into request-limited serverless handlers without a separately designed keeper.**

## Deploy to Vercel

Push this directory to GitHub, then in Vercel **Import Project** and set **Root Directory** to `frontend`. Use framework preset **Next.js**, build command `npm run build`, and let Vercel detect the rest. The research preview requires no secret credentials.

If replacing an existing deployment, don't redirect real-user deposit flows to this preview. Withdrawals from any earlier deployment must be separately safeguarded and not silently disabled without a migration plan.

## Development roadmap

**Now — V2 design foundation:** Brand system, observatory, interactions, studio, educational docs, safe preview deployment.  
**Next — sourced intelligence:** Verified on-chain reads, Drift funding data, provenance, timestamping, caching/rate limiting, risk monitoring, data-integrity tests.  
**Then — protocol engineering:** Explicit strategy specification, vault share accounting, collateral controls, privileged-role analysis, simulated adversarial testing, and independent review.  
**Finally — AI and execution:** Explainable agent with calculations/source attribution, opt-in notifications, monitored execution only after comprehensive risk work.

## Responsible framing & originality

This is an upgrade of an **existing SolNeutral V1 concept**. The original project/source is retained under `legacy/` for provenance. Clearly disclose reused work when submitting to any hackathon; do not represent previously written code as fresh work within a new competition period.

Inspired by ecosystem builder communities **Colosseum** and **Superteam Nigeria**, not presented as officially affiliated with either group. Founder attribution: **Web3 supporter (@instators)**.

## Security

No wallet connection or real-money vault functionality exists in this preview. Never commit API tokens, seed phrases, wallet keypairs, or `.env` credentials. Do not run or deploy the archived Anchor program without a separate security/consistency review: its prior source had mismatched advertised instructions and an unsuitable fixed-yield withdrawal mechanism.

## License

No open-source license is granted automatically by this README. Choose a license explicitly before public distribution.
