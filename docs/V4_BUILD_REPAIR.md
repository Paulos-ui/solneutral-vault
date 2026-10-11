# SolNeutral V4 | Next.js build + wrapped SOL correction

**Founder:** Web3 supporter · [@instators](https://x.com/instators)

## Root cause of the six errors

The client-only Drift Trade Lab uses `@drift-labs/sdk`. It brings in Anchor, Serum, and Switchboard modules that reference the Node.js `fs` API. Next.js 16 (Turbopack) tries to resolve `fs` inside the browser bundle even when those optional NodeWallet helpers are not invoked.

**Fix:** `frontend/next.config.ts` configures a browser-only `fs` alias to `frontend/lib/browser-fs-empty.ts`. This follows the documented Next.js 16 compatibility approach. Do not use `fs` browser polyfills to load private keys or expose the `ANCHOR_WALLET` environment variable on the public website.

## Corrected devnet SOL collateral flow

- `frontend/lib/native-sol.ts`: derives the actual canonical wrapped SOL (wSOL) associated token account with the official `@solana/spl-token` package.
- Deposit: wallet signs the ATA create-if-needed, native SOL transfer, and SyncNative instructions. Once that transaction confirms, a **second wallet approval** deposits wSOL into the user's personal Drift account.
- Withdrawal: destination ATA is created if needed; Drift transfers wSOL to the user-owned ATA. **Native SOL unwrapping is not automatic** and must be done separately using a supported wallet.
- The application retains a devnet genesis check. Each signed transaction uses a fresh blockhash and validates RPC confirmation.
- Failed second-stage deposits leave prepared wSOL in the user's own ATA. The interface explains this condition.

## Your manual validation

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

If Turbopack reports another Node-only import that is not `fs`, send the full error. Do not apply a blanket list of stubbed Node modules: that can make the build pass while breaking trading at runtime.

Once the build passes, check `/trade` in Phantom/Solflare on devnet, and perform **small test-asset-only** initialize, deposit, withdrawal, and order flows with Explorer proof. Until real end-to-end signatures are confirmed, trade functionality is **implemented but unverified**.

**Not a security audit:** No pooled SolNeutral vault/mainnet deposits are enabled. The experimental Anchor vault is separate. This update fixes bundling and account-addressing defects; it does not certify Drift SDK version compatibility, oracle status, successful fills, or smart-contract safety.
