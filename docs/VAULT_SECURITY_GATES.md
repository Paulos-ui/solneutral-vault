# Release Gates — SolNeutral Vault

**BLOCKED**: production deposits and transaction buttons remain disabled. The new Anchor program is a reference design, not a completed or deployed vault.

## Pre-deployment

- [ ] Generate a fresh program keypair; use `anchor keys sync`; never assume the V1 program address matches V3 bytecode.
- [ ] Compile Rust, generate IDL from built code, run Cargo and full Anchor validator tests.
- [ ] Audit all PDA derivations, checked token constraints, signer policies and account realloc/init paths.
- [ ] Validate share mint/burn amounts against SPL balances and token transfer behavior.
- [ ] Test all funding pathways with real token transfers, not time-based yield constants.
- [ ] Test extreme donations, seed/first-share inflation, insolvency, loss, rounding, paused deposits and withdrawals.
- [ ] Examine malicious token extensions / transfer fees; implementation currently restricts to traditional SPL Token and six decimal mints.
- [ ] Develop Drift protocol CPI/keeper architecture separately. Define who may rebalance, price bounds, slippage, emergency unwind and settlement.
- [ ] Test oracle staleness, funding reversals, margin failures and keeper outages in localnet and devnet.
- [ ] Independent security review, incident response playbook, monitored operations, and upgrade governance.

## Mainnet blockers

No production withdrawal UI or mainnet deposit until independent audit and operational tests. A Next.js/Vercel deploy does **not** establish vault safety. The legacy `2CsCE...` and `Ec8p...` strings must not be treated as proof of any new deployment.
