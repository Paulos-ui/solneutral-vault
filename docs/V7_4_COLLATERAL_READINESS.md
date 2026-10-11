# V7.4: USDC collateral readiness and transaction proof

This update makes the **read-only** market/mint/wallet/Drift balance checks visible in Trade Lab before deposit and withdrawal. It does not include token minting or claim to have tested wallet signatures.

## What is verified

- Connected RPC matches Solana devnet genesis hash.
- Drift SDK devnet USDC mint is matched to one subscribed, decoded Drift spot market.
- On-chain spot-market PDA is present and owned by the Drift program.
- On-chain token mint exists with 6 decimals.
- Connected wallet's associated token account belongs to the same owner and mint.
- The current Drift User subaccount is verified and its raw token amount is read when accessible.

## Important limitation

A devnet USDC mint account existing does NOT mean the wallet holds those tokens or that an unrelated faucet supplies that mint. Do not substitute Circle devnet USDC or a third-party dummy token without comparing the EXACT mint. No program ID or env variable grants wallet-owned USDC.

## Transaction acceptance

1. Run **Trade Lab → Collateral → USDC → Check collateral**; fix any mismatch or zero-balance blocker.
2. Attempt a small wallet-authorized deposit with the exact USDC mint. Save the transaction signature and verify chain confirmation.
3. Refresh **Check collateral** to verify the Drift deposit balance changed.
4. Withdraw a smaller amount, verify transaction signature, and refresh to confirm both wallet and Drift balances changed as expected.
5. If no matching faucet exists, do not present these actions as functional or use real assets.

The old experimental SolNeutral Anchor vault is **not** connected to these wallet-owned Drift deposits; testnet and mainnet remain disabled for trade execution.
