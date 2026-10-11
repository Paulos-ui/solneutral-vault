# SolNeutral V3 Research Vault — NOT READY FOR DEPOSITS

**Security status: reference implementation / uncompiled / unaudited.** It is intentionally NOT connected to the Vercel frontend or the old deployed vault address. No mainnet deployment is authorized.

## Design
- Custody is held in one PDA-owned SPL token account, constrained by token authority and mint.
- Non-transferable shares are recorded per (vault, wallet) PDA; share minting/redeeming is based on **actual token custody balances** and checked `u128` math.
- No hardcoded APY; realized gains can only be represented by actual tokens transferred into custody by admin.
- Admin can pause new deposits but not halt withdrawal or seize vault funds through this program.
- Users sign their own deposits and withdrawals. No server wallet private keys.
- USDC-like six-decimal SPL tokens only. Localnet test mint; never use genuine mainnet USDC in untested code.

## Required local verification (not executed in delivery environment)
1. Install Solana CLI, Rust, Anchor **0.29**, Node and Yarn.
2. Generate a fresh program keypair with `anchor keys sync`; this reference uses a placeholder legacy public key and must not reuse the old deployment.
3. `cd vault/solneutral_v3 && anchor build` and resolve compiler errors before any deploy.
4. `cargo test` and `anchor test` with a local validator, six-decimal test mint, program-specific integration tests.
5. Test unauthorized admin actions, custody substitutions, mint substitutions, multi-deposit share accounting, partial withdraw, final withdraw, pause-withdraw, token donations, loss/drawdown, overflow, rounding, and vault insolvency.
6. Add property-based tests and independent review. No audits have been performed.

## Not implemented
- Drift CPI and real strategy execution, keeper infrastructure, audited share inflation defenses, external risk oracles, emergency recovery, upgrade governance, account migrations, fee logic, and transferable receipts. Nothing here represents a working yield strategy.
