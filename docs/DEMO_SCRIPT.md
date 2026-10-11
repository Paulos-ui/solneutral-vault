# Five-minute SolNeutral demo — For independent builder review

**Founder:** Web3 supporter · **X:** @instators · **Blockchain:** Solana

### 00:00 — The problem

Most yield interfaces show the upside but hide the failure modes. Explain that delta neutrality reduces first-order directional exposure, not funding, margin, basis or execution risk.

### 00:45 — Signature interaction

Show the unified homepage: opposing spot and perpetual curves, then adjust the interactive hedge control. Explain these are *illustrations* and do not represent real customer capital.

### 01:30 — Intelligence Terminal

Show the Drift funding source and its timestamp, if available. If unavailable, point to the explicit degraded state. Adjust collateral downward and show buffer guardrails and seven price shocks respond. Switch on three-strategy comparisons.

### 02:45 — Provenance

Use a **public** Solana address in Wallet Lens. In Drift Lens show read-only ownership/discriminator checks of a real Drift User subaccount. Do not claim indexed trading records are current positions.

### 03:30 — Explainable analyst

Ask what happens when funding turns negative or SOL falls 30%. Show evidence grounded in exact model outputs; explain optional private LLM narration without wallet authority.

### 04:15 — Engineering and release bar

Show the separate `vault/solneutral_v3` code and the test checklist. Be explicit: the vault is **uncompiled and unaudited**, not an operating strategy. Close by describing audited share custody, real Drift positions and independent review as future deliverables.

### Attribution and disclosure

Present prior SolNeutral V1 material separately from V3 work. No claim of Colosseum or Superteam Nigeria endorsement or acceptance. Show GitHub commits and actual usage evidence.

## V5 Wallet-first product flow (demonstrate with test assets)

1. Open the polished editorial landing page. Highlight the Balance Field and clear value proposition; don't call it an executed trading portfolio.
2. Click Dashboard. An unconnected viewer sees the wallet gateway. Connect a devnet Phantom/Solflare wallet. If connecting from the homepage header, SolNeutral navigates to the Dashboard automatically.
3. Show verified devnet balance and recently confirmed transaction signatures. Explain that a balance read does not establish USD portfolio value or trading PnL.
4. Switch **Scenario** to **Funding** in the chart. Only validated Drift indexed observations display. When unavailable, explain why the UI doesn't manufacture an APY.
5. Adjust the model hedge position-size slider and price-shock buttons; chart, modeled PnL, risk heatmap and insights update. The model is deterministic, not on-chain collateral health.
6. Navigate with the compact rail to AI Analyst and History. Use Trade Lab to inspect a small signed devnet transaction only if network and account checks pass.
7. Explain that independent Anchor vault audit, live Drift portfolio reconciliation and a production keeper are separate remaining steps.
