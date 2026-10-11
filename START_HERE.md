# SolNeutral V6.1 — Backend & Drift setup

Founder: **Web3 supporter** · X: **@instators**

## Update the EXISTING repository (Git Bash)

Download `SolNeutral_V6_1_Backend_Drift_Onboarding_COMPLETE.zip` to your Windows Desktop.

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V6_1_Backend_Drift_Onboarding_COMPLETE.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V6_1_Backend_Drift_Onboarding_COMPLETE.zip"
```

## Validate and push

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

Only if all succeed:

```bash
cd ..
git add -A
git commit -m "feat: backend diagnostics and guided Drift devnet setup"
git push origin HEAD
```

## Configure Vercel without deleting the project

In **Vercel > Existing SolNeutral Project > Settings > Build and Deployment**, set **Root Directory = `frontend`**. In **Settings > Environment Variables**, configure:

- `NEXT_PUBLIC_DEVNET_RPC_URL = https://api.devnet.solana.com`
- `NEXT_PUBLIC_ENABLE_DEVNET_TRADING = true`
- Optional `SOLANA_RPC_URL`: private **mainnet** RPC, used for read-only data only.
- Optional AI: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `AI_DEMO_ACCESS_TOKEN` (private server-side secrets).

Select Production and redeploy. The existing backend runs automatically as Next.js API routes on Vercel; the archived Flask/Railway backend is not involved.

Test:

- `https://solneutral-vault.vercel.app/api/status`
- `https://solneutral-vault.vercel.app/api/health`
- `https://solneutral-vault.vercel.app/settings` → **Test backend & RPC**
- `https://solneutral-vault.vercel.app/trade` → **Initialize Drift Account** when a connected devnet wallet has no verified Drift account.

See `docs/VERCEL_BACKEND_AND_DRIFT_SETUP.md` for a more detailed walkthrough. Never commit `.env.local`, private tokens, private keypairs, or wallet seed phrases.

**Devnet only. No real-money pooled vault deposits.**
