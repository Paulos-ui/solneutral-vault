# SolNeutral V7.4 — Install

From Git Bash in your existing repo:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_4_Collateral_Readiness_COMPLETE.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_4_Collateral_Readiness_COMPLETE.zip"
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

Only after successful tests and build:

```bash
cd ..
git add -A && git commit -m "feat: verify devnet USDC collateral readiness" && git push origin HEAD
```

Then open Trade Lab → Collateral → USDC → Check collateral. This is a read-only preflight, not a confirmed deposit/withdrawal.
