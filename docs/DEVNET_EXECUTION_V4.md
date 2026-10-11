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
| Deposit | `DriftClient.deposit` SOL spot index 1 | Two wallet signatures: prepare canonical wSOL ATA, then deposit the wSOL; max 0.5 SOL; reserves native SOL for fees/rent |
| Withdraw | `DriftClient.withdraw` spot index 1, reduceOnly | Creates destination ATA if missing; withdraws **wSOL**, not native SOL; max 0.5 SOL; Drift enforces collateral constraints |
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
5. Deposit **devnet SOL** via a separate wSOL wrapping approval and a Drift deposit approval; verify the two explorer signatures and the spot collateral balance. If Drift deposit fails, the wrapped funds remain in the wallet token account.
6. Withdraw a smaller amount and verify the **wSOL associated token account** balance increased. Unwrapping to native SOL is a separate wallet operation.
7. Place small long and short IOC limit orders; inspect transaction statuses **and fills separately**. Test empty book/stale-oracle conditions and rejection behavior.
8. Confirm `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=false` disables transaction controls.
9. Simulate RPC rejection, insufficient SOL, unsupported wallet, aborted signature, stale market, wrong genesis, and throttled devnet RPC.
10. Check browser console and `npm audit` and resolve security issues without blindly running `npm audit fix --force`.

## What remains before real-money mainnet SolNeutral custody

Compile and independently audit the Anchor vault, new verified program ID and generated IDL, accounting property tests, devnet integration and threat model, Drift CPI/strategy integration design, oracle safety, treasury/admin policy, keeper, emergency procedures, economics and external security assessment. This V4 wallet/Drift test lab is **not** any of those release gates.

## Build compatibility fix (October 2026)

Next.js 16's Turbopack eagerly resolves browser transitive imports of optional `fs` helpers in Drift/Anchor/Serum. `frontend/next.config.ts` now applies the **browser-only** `fs` alias recommended by Next.js. `frontend/lib/browser-fs-empty.ts` exports nothing; NodeWallet or server keypair code is never a supported browser execution path. This fix does not prove that the whole Drift SDK is browser-runtime compatible: complete the manual wallet and signature tests before calling the integration operational. If additional Node-only imports appear, fix those at the module boundary rather than exposing server secrets to the client.

We also corrected a dangerous token-account argument in the original V4 transaction adapter: Drift's SOL spot deposit and withdrawal instructions require an SPL token account. Passing `wallet.publicKey` (a system account) was wrong. The repair uses the wallet's canonical wrapped-SOL ATA and official SPL Token instructions.
