# SolNeutral V7.5.4 | Receive-first collateral onboarding

Cumulative upgrade based directly on V7.5.3. Project source remains at the ZIP archive root for extraction into the **existing** `solneutral-vault` repository, preserving `.git` and history.

## Changes

- **Real receiving-account setup:** optional, wallet-signed, devnet-only creation of the canonical associated SPL token account for the *on-chain verified* Drift Spot Market 0 quote mint. Mint mismatch and program ownership checks occur before signing. Confirmation is followed by an independently validated owner/mint account read, with bounded RPC retries.
- **Receive-first flow:** copy the connected wallet address, exact market mint and token-account address. A clear step sequence guides Receive → Deposit → Trade/Withdraw, including an automatic read-only initial collateral check and a manual refresh after external funding.
- **Prevent predictable failures:** Deposit is disabled when the wallet does not hold enough matching quote tokens, and Withdraw is disabled when verified deposited balance or destination account is insufficient. No misleading on-chain action or error is attempted for known zero-balance states.
- **Preserve working features:** existing USDC/wSOL market checks, account setup, ledger reconciliation, orders, SOL/USD historical chart, dashboard, SolNeutral AI, mineral-green styling, and devnet-only network guards.
- **Clarify source and limitations:** owning SOL/wSOL does not create test USDC. The known on-chain market mint is not Circle's standard devnet USDC mint. SolNeutral does not mint arbitrary test USDC and no publicly compatible faucet has been verified.

## Verification boundaries

67 TypeScript/TSX files parsed without syntax errors. npm registry is unreachable from this environment; `npm ci`, full app typecheck, `next build`, real wallet signature, external mint funding and Drift token movements **are not independently verified**. A successful wallet token-account creation is not equivalent to obtaining USDC or depositing to Drift. Run `npm ci && npm run typecheck && npm run build` inside `frontend` before submission and verify all signed transactions on Solana Explorer devnet.

Vercel Root Directory: `frontend`. Keep `ANTHROPIC_API_KEY` server-only, and keep devnet RPC access in `NEXT_PUBLIC_DEVNET_RPC_URL`. Do not switch to testnet based on cluster naming alone.
