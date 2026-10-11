# SolNeutral V7.5 | Upgrade your existing repository

In Git Bash from your **existing repository directory** (the archive is already flat; `.git` stays intact):

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_Colosseum_Upgrade.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_Colosseum_Upgrade.zip"
```

Install dependencies and check the production build (the test suite is optional and was not run for this delivery):

```bash
cd frontend
npm ci
npm run typecheck && npm run build
```

Only after success, commit and push:

```bash
cd ..
git add -A
git commit -m "feat: SolNeutral V7.5 assisted collateral and conversational AI"
git push origin HEAD
```

On Vercel, keep Root Directory `frontend`, set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in Project Settings → Environment Variables, and enforce a WAF rate limit on the public `/api/ai/interpret` route. Do not share secrets with visitors.

Drift remains on **Solana devnet**; testnet deployment is not yet verified. Nothing here claims a transaction succeeded without a signed on-chain receipt and account evidence.
