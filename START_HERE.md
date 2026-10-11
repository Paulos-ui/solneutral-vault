# SolNeutral V5 — Install into your existing repository

Save `SolNeutral_V5_Connected_Dashboard_COMPLETE.zip` to your Windows Desktop. Use Git Bash:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V5_Connected_Dashboard_COMPLETE.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V5_Connected_Dashboard_COMPLETE.zip"
```

Test **before** pushing:

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

Push **only if** all commands above succeed:

```bash
cd ..
git add -A
git commit -m "feat: launch SolNeutral wallet-first dashboard"
git push origin HEAD
```

Open the home page, connect Phantom/Solflare from the header, and confirm you reach `/dashboard`. Or click Dashboard to view the connection gate before connecting. Test `/trade`, `/history`, `/analyst`, `/observatory`, and `/settings`.

The Dashboard reads *public devnet* wallet SOL, signature history and external indexed Drift funding if available. Modeled stress values are not a real wallet portfolio. Sign transactions with a throwaway devnet-only wallet. Mainnet pooled SolNeutral deposits are not enabled. No API key is required for the default deterministic Analyst mode; private AI credentials remain server-side in Vercel.
