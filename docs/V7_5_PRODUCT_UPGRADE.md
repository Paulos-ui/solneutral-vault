# SolNeutral V7.5: Product upgrade notes

## Why your SOL wallet balance cannot place a Drift order

The wallet may hold native devnet SOL while its Drift User account holds zero deposited collateral. This is not an RPC sync problem. A trading transaction with zero free collateral is correctly rejected by Drift. **Do not change to testnet** as a workaround.

1. Connect Phantom or Solflare on Solana devnet.
2. In Trade Lab, initialize the Drift User account if absent.
3. Choose Trade Lab → Collateral and inspect the quote (USDC) market or use the wSOL market check.
4. If the wSOL market check reports no subscribed wSOL market, no SOL wrap/deposit should occur. Obtain the exact Drift-configured devnet quote token rather than an unrelated token with the USDC symbol.
5. If wSOL market is verified, the existing wallet-signed sequence prepares wallet wSOL and then deposits. If the deposit fails, wallet-owned wSOL can be unwrapped from the recovery tab; this is not a Drift withdrawal.
6. After a deposit signature is confirmed, independently read the on-chain Drift spot balance and the wallet token balance. Verify both before trading.

## AI without an access field

SolNeutral AI sends user questions to a same-origin Next.js server route, which then calls Anthropic using `ANTHROPIC_API_KEY` stored privately on Vercel. No user-visible demo token or per-user Claude API key. Rate limiting is essential before public launch; in-memory rate limits in Vercel lambdas are best effort only and cannot replace WAF. Set `ANTHROPIC_MODEL` to a currently supported model ID in your Anthropic API account. The assistant never signs transactions.

## Dashboard integrity

Display exact test USDC wallet and Drift deposit reads when available. Hide unverified margin-health metrics and avoid pretending an unavailable funding indexer is a current live signal. Funding charts remain research-only and should not be confused with devnet account data.

## Network and program deployment

SolNeutral executes against an existing Drift devnet deployment through `@drift-labs/sdk`; deploying an unrelated Solidity contract does not fix Drift collateral. Solana custom programs are normally built with Rust/Anchor, and are unnecessary for wallet-owned Drift User deposits. Solana testnet must not be chosen until a compatible Drift deployment and markets exist there.

## Limitations

These changes are source changes, not proof of successful network operations. Live proof requires user-approved signatures and independent on-chain reads. No full dependency-powered build, e2e tests, or live wallet actions were run in this delivery.
