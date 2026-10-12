# SolNeutral V7.5.4 | Receive test collateral

This is a cumulative ZIP containing the existing SolNeutral repository files at ZIP root. Place `SolNeutral_V7_5_4_Receive_Collateral.zip` on your Windows Desktop and run in Git Bash:

```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -oq "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_4_Receive_Collateral.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_V7_5_4_Receive_Collateral.zip"
git add -A
git commit -m "feat: SolNeutral V7.5.4 receive collateral flow"
git push origin HEAD
```

Vercel Root Directory stays `frontend`; transactions stay on **Solana devnet**. For a local typecheck and build, run `cd frontend && npm ci && npm run typecheck && npm run build` when npm is available. A successful deployment alone does not prove a signed Drift deposit/withdrawal.

## Funding a test wallet

1. Connect a wallet to SolNeutral Trade Lab → Collateral → USDC. The app reads Drift Spot Market 0 on-chain and displays the **actual mint**, connected wallet, and canonical token-account address.
2. If the receiving account does not exist, choose **Prepare receiving account** and approve its devnet wallet signature. This creates an associated SPL token account paid by test SOL; it **does not mint or airdrop assets**.
3. Obtain the **exact quote-mint test tokens** from a source that can supply that mint (or another wallet that already owns them), send to the displayed wallet/token account on devnet, and click **I received tokens — refresh balance**.
4. Sign a small deposit only after the wallet actually holds the exact mint. Verify wallet and Drift spot balance changes following on-chain confirmation. Withdrawals require a verified Drift deposit.

**Important:** The currently observed Drift quote mint `8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2` differs from Circle's standard Solana devnet USDC. Do not use a Circle faucet expecting that token to satisfy this market. Never send mainnet assets; no user keys or mint-authority credentials should be added to the frontend.
