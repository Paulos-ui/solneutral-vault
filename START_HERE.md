# SolNeutral V7.5.2 | Install into your existing repository

From Git Bash, after downloading this ZIP to your Desktop:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_2_Drift_Dashboard_Fix.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_2_Drift_Dashboard_Fix.zip"
cd frontend
npm ci
npm run typecheck && npm run build
```

If both commands succeed:

```bash
cd ..
git add -A
git commit -m "fix: verify Drift devnet collateral market and dashboard state"
git push origin HEAD
```

Vercel Root Directory stays `frontend`. Keep Drift transactions on Solana devnet. After deploying, use Trade Lab > Collateral > Check collateral (USDC) or Check SOL market (wSOL). If wallet USDC is 0, obtain the **exact market-0 mint** shown by the verified read-only check before attempting a USDC deposit. An unsigned read-only check cannot move funds. For funds left in a wallet-owned wSOL account, use the Recover wallet wSOL action.

A successful build or a confirmed cancellation transaction does not prove any collateral deposit or order fill. To verify transfers, use actual devnet transaction signatures and pre/post wallet and Drift account balances.
