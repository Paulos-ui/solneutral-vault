# SolNeutral V4 — Complete cumulative release (V2 + 2A–2E + V3 + V4)

This archive contains the **entire currently assembled V4 source**. It is **not** a 17-file patch. It combines the redesigned V2 experience, research upgrades through Phase 2E, V3 Intelligence and AI Analyst, and V4 Phantom/Solflare Drift devnet Trade Lab. The earlier V1 materials are kept under `legacy/` and the experimental Anchor V3 contract under `vault/solneutral_v3/`.

## Install into the EXISTING Git repo (Git Bash)

Download `SolNeutral_V4_COMPLETE_All_In_One.zip` to your Windows Desktop. Run:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_V4_COMPLETE_All_In_One.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V4_COMPLETE_All_In_One.zip"
```

No new project folder; matching files are overwritten. Git history is preserved (`.git` is NOT packaged). The ZIP is removed **only after successful extraction**. Files present locally but absent from the archive are not deleted.

## Validate

```bash
cd frontend
npm install
npm test && npm run typecheck && npm run build
```

Only if the checks succeed, push from the repository root:

```bash
cd ..
git add -A && git commit -m "feat: consolidate SolNeutral V4 intelligence and devnet trade lab" && git push origin HEAD
```

Vercel Project Root Directory: `frontend`.

## Safety and functional status

- Public portfolio observations use read-only RPC.
- Drift signing controls in `/trade` are **devnet-only code**, requiring live wallet / RPC / exchange integration verification before considering them operational.
- The Anchor V3 vault is research source and has NOT been compiled, independently audited or connected to deposits.
- No live mainnet trading or real-currency SolNeutral pooled-vault deposits are enabled.
- AI remains explanatory; provider secret must only be configured as a **server-side** environment variable, never shared or embedded in client code.
- `npm` tests are not substitutes for on-chain integration tests. Never move mainnet funds on the basis of a passing frontend build.
