# SolNeutral V7.5.3 | Vercel typing fix

Download `SolNeutral_V7_5_3_Vercel_Typescript_Hotfix.zip` to your Windows Desktop, then run in Git Bash:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_3_Vercel_Typescript_Hotfix.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_3_Vercel_Typescript_Hotfix.zip"
cd frontend
npm ci
npm run typecheck && npm run build
```

Only after the checks succeed:

```bash
cd ..
git add -A
git commit -m "fix: validate Drift spot market mint types"
git push origin HEAD
```

Vercel Root Directory stays `frontend`. Drift execution remains on **devnet**. Read `RELEASE_MANIFEST.md` for verification boundaries. A successful deploy does not prove a deposit, withdrawal, or order fill.
