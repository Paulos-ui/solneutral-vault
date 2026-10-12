# SolNeutral V7.6 — SOL Testnet Reserve

This cumulative release is built on the existing SolNeutral repository. Archive contents begin at repository root and intentionally contain no `.git` folder. Vercel Root Directory remains `frontend`.

## Active experience

- **Solana testnet only:** the wallet connection uses `NEXT_PUBLIC_TESTNET_RPC_URL` or `https://api.testnet.solana.com`. Read and signed operations verify the Solana testnet genesis hash; devnet SOL is not usable on testnet.
- **Self-custodied SOL reserve:** Trade Lab offers wallet-signed transfers of native testnet SOL into a wrapped-SOL associated token account (ATA) owned by the connected wallet, plus an all-balance unwrapping/close operation. This is *not* a protocol vault deposit, investment, staking, or yield-bearing strategy.
- **On-chain evidence:** reserves and native SOL balances are separately observed from Solana RPC, with signature links to the testnet explorer. A confirmed signature is not described as a verified reserve change until a subsequent balance read matches.
- **Clearer UI:** brand and dashboard identify SolNeutral and SOL Testnet; workspace metrics show wallet SOL, reserve wSOL, wallet ownership, and testnet history. Existing mineral-green UI, persistent navigation, chart, research scenarios, and SolNeutral AI remain.
- **No Drift/USDC dependency in the active SOL flow.** The prior Drift integration and historical developer materials are preserved as legacy code, not used for the current transaction actions.

## Known limitations / verification

- A wrapped-SOL ATA remains controlled by the user. The word "deposit" means **wrap native SOL into the user's own token account**, not send funds to a SolNeutral smart contract.
- The withdrawal action closes the **entire** wrapped SOL ATA and returns the contained native SOL and reclaimable rent to the connected wallet. It does not support partial withdrawals; it is inappropriate if a user wishes to retain wSOL in that same ATA.
- Testnet faucet availability is not guaranteed. Public Solana testnet RPCs may be rate limited and testnet can reset or be unstable.
- No production build, browser wallet signing, testnet airdrop or actual testnet deposit/withdrawal was independently completed in this environment. Deploy and verify before presenting these actions as live.
- The AI route still needs a Vercel-hosted `ANTHROPIC_API_KEY` and public-route rate limiting; users should never enter secrets.

## Deployment

Place `SolNeutral_V7_6_SOL_Testnet_Reserve.zip` on your Desktop, then run the single extraction-and-push block in `START_HERE.md`. Set `NEXT_PUBLIC_TESTNET_RPC_URL=https://api.testnet.solana.com` in Vercel if a custom RPC is not provided. Remove any stale expectations that `NEXT_PUBLIC_DEVNET_RPC_URL` configures wallet actions. Follow up with a Vercel build and a *small* signed testnet SOL reserve cycle.
