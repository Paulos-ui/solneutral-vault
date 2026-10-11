# SolNeutral V7.1 — Install and test

Founder: **Web3 supporter** · X **@instators**.

Save `SolNeutral_V7_1_Live_Chart_Collateral_Repair_COMPLETE.zip` to your Windows Desktop. In Git Bash:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_1_Live_Chart_Collateral_Repair_COMPLETE.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_1_Live_Chart_Collateral_Repair_COMPLETE.zip"
```

Test before pushing:

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

Only if successful:

```bash
cd ..
git add -A
git commit -m "feat: V7.1 live SOL chart and guarded Drift collateral"
git push origin HEAD
```

Keep existing Vercel project, Root Directory `frontend`, and devnet environment variables. Confirm `/api/market/sol-chart?interval=5m` after redeploy. Connect a dedicated **devnet** wallet and verify market/Drift account before any signed test transaction.

**Important:** Your previous failed deposit may have left wSOL in **your wallet**. Trade Lab → Collateral → **Unwrap wSOL** will close the **entire canonical wSOL associated token account**, returning its entire wallet-owned balance as native SOL and reclaiming rent. Verify that amount first. It cannot withdraw SOL already inside Drift. No mainnet/vault deposits enabled. Current market support cannot be guaranteed until live network checks pass.
