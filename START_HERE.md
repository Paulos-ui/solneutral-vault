# SolNeutral V7.6 — SOL Testnet Reserve

This ZIP unpacks directly over the existing `solneutral-vault` Git repository; no nested directory, no new repository and no `.git` replacement.

## Git Bash: extract, clean up, commit, push

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"

unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_6_SOL_Testnet_Reserve.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_6_SOL_Testnet_Reserve.zip"

git add -A
git commit -m "feat: SolNeutral V7.6 SOL testnet reserve"
git push origin HEAD
```

## Vercel configuration

- Root Directory: `frontend`
- Wallet endpoint: `NEXT_PUBLIC_TESTNET_RPC_URL=https://api.testnet.solana.com` or a trusted Solana **testnet** RPC URL.
- SolNeutral AI: keep `ANTHROPIC_API_KEY` private in Vercel; configure appropriate API rate limiting.
- **Devnet SOL balances are separate from testnet SOL balances.** Do not transfer mainnet funds or assume an old devnet wallet balance will appear in the new workspace.

## Actual testnet wallet demo

1. Connect Phantom or Solflare on Solana **testnet**. Open Dashboard; confirm its testnet status and the wallet's genuine balance.
2. Visit Trade Lab / SOL Reserve. Use **Get 0.5 test SOL** if the RPC faucet supports it, or fund the public testnet wallet from an authorized testnet faucet. Never use real SOL.
3. Start with a small deposit (e.g. 0.05 test SOL), review the wording and sign. This creates/uses your **own** wrapped SOL token account; it is *not* a pooled vault deposit.
4. Check the transaction signature on Solana Explorer testnet and refresh to verify the increased wrapped-SOL reserve and decreased native SOL balance.
5. Select **Withdraw SOL**; this closes your *entire* wSOL associated token account, returning all wrapped SOL and recoverable rent to the wallet. Check the signature and corresponding balances.

Build validation (optional before push): run `cd frontend && npm ci && npm run typecheck && npm run build` from the repository root. Vercel will build on push. No end-to-end transaction can be declared successful without a signed on-chain result and matching observed balance changes.
