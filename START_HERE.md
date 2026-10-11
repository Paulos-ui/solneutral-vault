# SOLNEUTRAL V7.2 · INSTALL INTO EXISTING REPOSITORY

**Do not delete your Vercel project.** This ZIP contains files directly at its root.

Copy/paste in Git Bash once the ZIP has been saved to your Windows Desktop:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_2_Order_Chart_Funding_COMPLETE.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_2_Order_Chart_Funding_COMPLETE.zip"
```

**Test first.** Stop and share the FIRST failing message if anything fails:

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

**Push only after all checks pass:**

```bash
cd ..
git add -A
git commit -m "fix: validate Drift orders and add chart navigation"
git push origin HEAD
```

Vercel settings: Root Directory `frontend`. See `docs/V7_2_ORDER_CHART_FUNDING.md` for precise environment variables. Funding and price candles require working upstream providers. **Transactions remain devnet-only.** Drift unsupported collateral markets remain blocked. An order confirmation does not prove a fill.
