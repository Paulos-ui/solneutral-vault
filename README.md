# SolNeutral V7.6 — SOL Testnet Reserve

**SolNeutral** is a wallet-first Solana research interface with a self-custodied **SOL testnet reserve**, market charts, hedge scenario modelling, and an operator-hosted **SolNeutral AI** analyst.

**Founder:** Web3 supporter · [@instators](https://x.com/instators) · [GitHub](https://github.com/Paulos-ui/solneutral-vault) · [Production demo](https://solneutral-vault.vercel.app)

## Current functionality

- **Wallet-connected dashboard:** reads the native SOL balance and recent public signatures from a verified Solana *testnet* RPC. It separately reads any SOL already held as wrapped SOL by the connected wallet.
- **Trade Lab → SOL Reserve:** deposit means **wrap** native testnet SOL in the wallet's associated wSOL token account. Withdrawal closes that account and **unwraps the entire balance** into native SOL. Both require wallet signatures and verified network checks. No Drift, matching USDC mint or SolNeutral contract is needed.
- **SolNeutral AI:** read-only AI analysis available through a privately configured server key. The assistant cannot approve wallet transactions.
- **Research:** SOL/USD historical chart, scenario analysis, and a hedge-model dashboard; hypothetical results are always distinct from actual wallet balances and executed transactions.
- **Navigation and UI:** original dark mineral-green interface, connected workspace, compact sidebar and Dashboard / Observatory / Trade Lab / Docs top navigation.

## A crucial distinction

**Wallet-owned wSOL is not a DeFi vault deposit.** A reserve deposit does not transfer custody to the SolNeutral team or an on-chain SolNeutral smart contract, does not pay yield, and does not establish a leveraged or delta-neutral trading position. Historical Drift SDK and Anchor/Rust prototype material remains in this repository for reference, but the active V7.6 wallet transaction flow does not use those modules.

**All testing stays on Solana testnet.** Devnet SOL, USDC and wallets are network-specific; an old devnet balance will not show up as testnet funds. Only valueless testnet SOL should be used, and public testnet faucets are not guaranteed to work.

## Deployment

See [`START_HERE.md`](START_HERE.md) for the exact one-block Git Bash extract/commit/push workflow and the live wallet demo procedure. Vercel Root Directory remains `frontend`.

The frontend RPC is `NEXT_PUBLIC_TESTNET_RPC_URL`, defaulting to `https://api.testnet.solana.com`. Configure private `ANTHROPIC_API_KEY` in Vercel, never in the browser; apply a WAF/rate limit to the public AI route. See [`RELEASE_MANIFEST.md`](RELEASE_MANIFEST.md) for detailed verification boundaries.

## Status

The V7.6 code is packaged for deployment; it has **not yet been independently validated end-to-end by a production build and signed Solana testnet deposit/withdrawal cycle**. Verify that Vercel builds successfully, then test with a small amount and observe both transaction signatures and balance changes. Historical docs under `docs/` may describe earlier Drift/devnet versions and are not current operating instructions.
