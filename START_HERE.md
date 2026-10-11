# SolNeutral V6 — Install and Verify

The V6 ZIP is **cumulative**. All source files are at the ZIP root. Extract directly over the existing `solneutral-vault` repository. It preserves `.git`, adds new files and overwrites matching files; it does **not** automatically remove obsolete, unmatched old files.

## Install (Git Bash, after saving ZIP to Desktop)

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V6_COMPLETE_Product_Workspace.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V6_COMPLETE_Product_Workspace.zip"
```

The ZIP is only removed if extraction succeeded. No backup folders or nested project directories.

## Test before committing

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

If **all three pass**, push:

```bash
cd ..
git add -A
git commit -m "feat: SolNeutral V6 compact trading workspace"
git push origin HEAD
```

Make sure Vercel's **Root Directory** is `frontend` and the latest deployment is **Ready**. Test `/dashboard`, `/observatory`, `/trade`, `/analyst`, `/risk-lab`, `/history`, `/docs` and `/settings`. Connect a dedicated devnet wallet. Never use real assets with unverified experimental code.

**Test status of this release:** 50 deterministic/static regression tests passed; TypeScript/TSX syntax and CSS parser checks passed. Full `npm run typecheck`, Next.js production build and live wallet transactions were **not** run in the artifact environment because npm package installation was unavailable. Your local validation is necessary.
