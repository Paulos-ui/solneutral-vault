# SolNeutral V4 — Wallet and Drift execution security boundary

Founder: Web3 supporter ([@instators](https://x.com/instators)). Solana builder project for Colosseum / Superteam Nigeria ecosystem participation; no endorsement implied.

## Separate product domains

1. **Market research** (`/observatory`, `/terminal`, `/risk-lab`, `/risk-engine`, `/analyst`) uses clearly labeled observations and hypothetical models. None can send transactions.
2. **Public data** (`/wallet-lens`, `/drift-lens`) uses mainnet read-only RPC routes for evidence. These remain independent of wallet-signed devnet execution.
3. **Execution lab** (`/trade`) uses *only* the devnet Solana connection with `getGenesisHash()` fail-closed verification. User must connect Phantom/Solflare (Wallet Standard), choose an action, enter a bounded size, tick acknowledgement, then approve the wallet signature.
4. **SolNeutral vault research** (`vault/solneutral_v3`) is separate and uncompiled. No UI connected to that program. **Never send real user funds to the old V1 or new research vault program IDs.**

## Signed actions (experimental, devnet only)

| Action | SDK operation | Operational constraint |
| --- | --- | --- |
| Initialize | `DriftClient.initializeUserAccount` | Derived wallet User account must not exist |
| Deposit | `DriftClient.deposit` SOL spot index 1 | Wallet owns signer; max 0.5 SOL; 0.02 SOL retained for fees/rent |
| Withdraw | `DriftClient.withdraw` spot index 1, reduceOnly | Max 0.5 SOL; no new borrowing intended; protocol performs risk checks |
| Long/short | `DriftClient.placePerpOrder` SOL-PERP index 0 | Max 0.1 SOL base, limit 1% from oracle, immediate-or-cancel; may not fill |
| Cancel | `DriftClient.cancelOrders` perp market 0 | Cancels outstanding SOL-PERP orders for user |

The app never promises trade execution based solely on a transaction signature. RPC confirmation indicates the transaction status; fills and account positions must be independently checked. Devnet is ephemeral and may have unavailable markets, faucet downtime, stale oracles or inconsistent RPC responses. Exchange fees and risk still exist even in testing. Do not use mainnet funds.

## RPC, deployment and environment

- `NEXT_PUBLIC_DEVNET_RPC_URL` is optional, defaults to the public devnet RPC. Its genesis hash is compared against `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG` before executing. A mainnet RPC will be rejected.
- `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=false` disables signed action controls, default is enabled when wallet connects and devnet verification succeeds.
- Browser RPC URLs are public. Use provider-side browser origin restrictions and caps; never put secret server credentials in `NEXT_PUBLIC_` environment variables.
- Vercel Root Directory stays `frontend`, standard Next.js functions only. No keeper or autonomous execution.
- AI stays isolated. `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `AI_DEMO_ACCESS_TOKEN` must be server-only. Trading code does not accept commands from AI output.

## Verifications needed before calling the devnet flow tested

1. `cd frontend && npm install && npm test && npm run typecheck && npm run build`.
2. Connect actual Phantom and Solflare devnet wallets from a test account (not a mainnet key with significant assets).
3. Independently inspect the devnet genesis hash and Drift program ID on the explorer.
4. Initialize a fresh Drift User account and confirm explorer transaction success.
5. Deposit **devnet SOL** and verify Drift spot collateral increased; withdraw a smaller amount and verify balances after fees.
6. Place small long and short IOC limit orders; inspect transaction statuses **and fills separately**. Test empty book/stale-oracle conditions and rejection behavior.
7. Confirm `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=false` disables transaction controls.
8. Simulate RPC rejection, insufficient SOL, unsupported wallet, aborted signature, stale market, wrong genesis, and throttled devnet RPC.
9. Check browser console and `npm audit` and resolve security issues without blindly running `npm audit fix --force`.

## What remains before real-money mainnet SolNeutral custody

Compile and independently audit the Anchor vault, new verified program ID and generated IDL, accounting property tests, devnet integration and threat model, Drift CPI/strategy integration design, oracle safety, treasury/admin policy, keeper, emergency procedures, economics and external security assessment. This V4 wallet/Drift test lab is **not** any of those release gates.
