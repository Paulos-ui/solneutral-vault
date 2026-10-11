# SolNeutral V7.3 — Demo reliability update

## What changed
- **Collateral**: default selector now supports wallet-owned **test USDC** from the Drift SDK configured devnet mint, with on-chain market/authority/mint/decimals checks. If SOL/wSOL collateral is unsupported on the chosen Drift deployment, the old flow remains guarded and users can choose USDC instead.
- **Withdraw**: targets the selected spot collateral market, verifies available deposited balance, refuses to create a borrow, and requires an existing wallet USDC ATA. Verify balances before and after each signature.
- **Recovery**: the wSOL unwrap action remains available for wallet-owned wSOL from a previous failed attempt.
- **AI**: ordinary questions, including brief greetings, are accepted; Claude's answer is no longer confined to risk-only questions. Requires a configured and valid server-side model/API key and a private demo token.
- **SOL chart**: existing 1m/5m/15m/1h/6h/1d timeframe, Older/Newer/Latest navigation and refresh from V7.2 remain.

## IMPORTANT
This is a **devnet-only research application**, not an audited vault. The deposited asset must be the exact devnet mint used by Drift SDK; native SOL balance alone is NOT sufficient USDC collateral. Do not send mainnet assets. No production or live-signature success claims are made by source-level tests.

## Vercel environment variables
- `NEXT_PUBLIC_DEVNET_RPC_URL=https://api.devnet.solana.com` (prefer a dedicated devnet RPC)
- `NEXT_PUBLIC_ENABLE_DEVNET_TRADING=true`
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com` for read-only research (dedicated RPC recommended)
- `ANTHROPIC_API_KEY=<secret Claude API key>`
- `ANTHROPIC_MODEL=claude-sonnet-5-5` (verify your Anthropic account supports it; `claude-sonnet-5` is an alternative)
- `AI_DEMO_ACCESS_TOKEN=<random 32-byte secret from openssl rand -hex 32>`

Keep server secrets private. Redeploy on Vercel after changes. The AI demo token is NOT a production authentication system, so restrict distribution and usage.

## Fast demo plan
1. Wallet connect and account initialization on devnet; verify transaction signature.
2. Open Collateral; select USDC, confirm exact devnet mint and wallet token balance.
3. Deposit small test USDC, verify signature and actual Drift account balance.
4. Withdraw less than the verified available amount, verify receipt.
5. Trade Lab chart: navigate Older/Newer/Latest. Only place a small limit order after collateral is verified, cancel if unfilled.
6. In Analyst, set private demo token (not API key), ask Claude a SolNeutral question and then a general question.
If a transaction fails, do not film it as successful. Your legacy SolNeutral program ID is separate from Drift's program and is not used for these deposits.
