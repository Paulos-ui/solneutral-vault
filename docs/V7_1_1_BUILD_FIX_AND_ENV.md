# SolNeutral V7.1.1 — TypeScript market-verification repair

Founder: **Web3 supporter** · X: **@instators**

## What failed

Vercel compiled source but TypeScript rejected `market.mint.equals(NATIVE_MINT)` at `frontend/lib/drift-devnet.ts:70` because the narrow SDK-facing market type guarantees `toBase58()` but not `equals()`.

## Correction

- Compare the canonical mint addresses using `toBase58()`.
- Derive the Drift spot-market PDA using `getSpotMarketPublicKeySync(programId, marketIndex)` rather than relying on a structural `pubkey` field.
- Continue validating that the account exists and is owned by the configured Drift devnet program.
- Preserve the rule: check the collateral market *before* wallet-owned SOL is wrapped.
- No change to wallet credentials, custody permissions, or allowed networks.

## Vercel environment variables

Set in **Project Settings → Environment Variables**. Select **Production** (plus Preview only if you use preview builds). Do not commit your actual secrets.

| Name | Value / instructions | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_DEVNET_RPC_URL` | `https://api.devnet.solana.com` for initial testing; optionally a dedicated devnet RPC URL | Browser-visible |
| `NEXT_PUBLIC_ENABLE_DEVNET_TRADING` | `true` | Browser-visible |
| `SOLANA_RPC_URL` | Your dedicated **mainnet-beta** RPC URL; used only for research/reads | Server-only |
| `ANTHROPIC_API_KEY` | Your Claude API key from Anthropic | Server-only secret |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` (must be enabled in your Anthropic account) | Server-only |
| `AI_DEMO_ACCESS_TOKEN` | Separate randomly generated token (minimum 20 characters) | Server-only secret |

The existing AI UI requires the matching **demo access token** to be entered by an authorized tester. It is *not* the Claude API key.

Remove obsolete `NEXT_PUBLIC_API_URL`, `RAILWAY_*`, and other Flask-era variables only **after checking that no other deployments use them**. The current Next.js API routes deploy alongside the frontend; no standalone Railway server is required.

Changes to environment variables only affect **new** Vercel deployments. Redeploy after saving.

## Installation

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_1_1_TypeScript_Env_Fix.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_1_1_TypeScript_Env_Fix.zip"
cd frontend
npm test && npm run typecheck && npm run build
```

Push to GitHub only if all checks succeed:

```bash
cd ..
git add -A
git commit -m "fix: verify Drift market address and TypeScript types"
git push origin HEAD
```

## Validation limits

The local model suite includes 64 passing tests. Dependency fetching failed in this environment, so a full TypeScript check and Next.js build were **not** completed here. Wallet-signed devnet deposits/withdrawals remain unverified and may be unavailable on the configured Drift devnet market. Never use mainnet funds to test this flow.
