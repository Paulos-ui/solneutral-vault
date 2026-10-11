# SolNeutral V7.4 Colosseum Hotfix: Chat Types + Devnet Collateral Evidence

This package is **cumulative**: it contains the uploaded project source plus targeted fixes. It is intended to overwrite matching files in the **existing** Git repository, not initialize a replacement repository. Vercel Root Directory remains `frontend`. The app remains on Solana devnet for wallet-signed execution.

## What changed

- `components/RiskAnalyst.tsx`: fixed the Vercel TypeScript error by declaring the appended AI history as `ChatMessage[]` rather than letting literal message roles widen to `string`. The route and browser share `lib/ai-chat.ts`; untrusted user/assistant history is validated server-side. No API keys were embedded or moved into client code.
- `lib/drift-devnet.ts`: checks that the on-chain USDC mint is owned by the SPL Token program, and treats an invalid wallet token-account owner as a hard error, **not** as a missing/empty token account. Deposit and withdrawal verify the destination account's owner and mint before signing.
- `lib/collateral-reconciliation.ts`: pure conservative checker for the before/after Drift USDC wallet-token and signed Drift User spot token balances. It requires the same mint, market index, token account, six-decimal precision, an exact SPL wallet delta and a closely matching Drift balance delta (bounded rounding/interest tolerance). A transaction signature **alone** is never a collateral balance proof.
- `components/DriftTradingLab.tsx`: takes a fresh on-chain USDC readiness snapshot before asking for the wallet signature, verifies the signature status, refreshes, reads a second independent snapshot, shows the observed signed deltas, and clearly labels unreconciled changes. Offers a read-only “Recheck collateral proof” action if RPC/state data lags. Resets old transaction proof when the wallet changes.
- No refactor of the dashboard, SOL/USD Coinbase candle component, Drift SOL-PERP limit orders, the dark mineral-green UI, the primary navigation, or the server-only Claude credential model.

## Testing and evidence boundaries

- `npm run test`: **82 tests passed** here, including chat-history, USDC delta reconciliation, previous Drift market, order guardrail and chart regression tests.
- The TypeScript 5.8 compiler syntax-checked the 66 `.ts`/`.tsx` source files and reported **zero parse diagnostics**. The new dependency-free helper modules passed independent strict `tsc --noEmit` typechecking.
- Full `npm run typecheck` and `npm run build` **not verified in this environment**: registry.npmjs.org was unreachable (`EAI_AGAIN`) and the npm dependencies could not be installed. `tsc` consequently reports missing `next`, React, and SDK typings, while `next build` cannot start because `next` is not installed. These are **environment blockers**, not successful production build evidence. Run `npm ci`, then the exact commands below on a machine with npm registry access.
- **No Solana transaction was signed or executed here.** The exact market mint, wallet token balance, per-transaction signature, wallet/drift delta, free collateral and execution fills must be verified against a real devnet wallet in the deployed app. This package does not supply fake funds, a USDC faucet, market prices, filled orders, or on-chain success claims.

## Demo acceptance sequence (using your own wallet)

1. In Phantom/Solflare select **devnet** and hold enough **devnet SOL for transaction fees**. Connect the wallet in SolNeutral.
2. Trade Lab → Account: initialize the wallet's Drift devnet User account if required. Wait for a confirmed signature, or check the account again.
3. Trade Lab → Collateral → USDC → **Check collateral**. Confirm: devnet verified; a single Drift spot market for the exact SDK-configured mint; on-chain mint has six decimals; the wallet actually owns the matching token ATA; and the Drift User spot balance is readable.
4. **Do not try a deposit with zero matching USDC.** Ordinary devnet SOL, tokens on other clusters and unrelated test USDC mints cannot be substituted. No minting mechanism is included.
5. With matching test USDC and sufficient gas, send a **small wallet-approved deposit**. Save its Explorer devnet transaction signature. Only call the collateral movement verified when the fresh wallet and Drift balances reconcile; if RPC lags, select **Recheck collateral proof ↻** without resending.
6. After deposited balance increases, request a **smaller wallet-signed withdrawal**. Require the confirmed signature **and** matching reverse balance movement in both accounts. Margin health can still block withdrawals.
7. If required, place a small bounded SOL-PERP limit order. A confirmed order transaction only means it was **submitted**. It is not a confirmed fill; cancel resting orders as needed. Do not present the dashboard's wallet SOL or illustrative scenario PnL as Drift trading equity.
8. Check the live reference SOL/USD Coinbase candles and timeframes, then ask Claude a general question plus a SolNeutral-risk question using the **separate private demo access token**; the Anthropic API key stays server-side.

## Existing-repository update (Git Bash)

After placing the downloaded ZIP on your Windows Desktop:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_4_Colosseum_Hotfix.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_4_Colosseum_Hotfix.zip"
cd frontend
npm ci
npm run test && npm run typecheck && npm run build
cd ..
git add -A && git commit -m "fix: type AI history and reconcile devnet USDC collateral" && git push
```

No `.git` directory is included in the ZIP; the existing repository history is preserved. Keep all private keys, seed phrases and `.env.local` files out of git. Do not push if the typecheck or build fails; share the exact errors to repair them first.
