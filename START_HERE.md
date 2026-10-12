# SolNeutral V7.6.2 — START HERE

Deploy into the EXISTING `solneutral-vault` repository. Unzip at repo root, not inside `frontend`.

1. Open `/dashboard`: you should see **Your workspace** without the duplicated logo or testnet name. The navigation still shows SolNeutral branding.
2. Open `/trade`: **SOL/BONK chart on left** and **Long/Short paper ticket on right** on desktop.
3. Switch between SOL and BONK to inspect fetched Coinbase spot references. No fallback values are fabricated; unsupported/unavailable quotes prevent new positions.
4. Try $100 demo margin, 2x leverage and a long or short; observe local simulated PnL, close a position, or reset to $10,000.
5. Scroll to the separate wallet-owned reserve, connect a testnet wallet, request test SOL or visit `https://faucet.solana.com/`, and test confirmed wrap/unwrap transactions.
6. Verify the SolNeutral favicon in Chrome; hard-refresh if Chrome has cached the old icon.

**Always distinguish** simulated trades from real testnet wallet actions. This release does not introduce a testnet AMM, liquidity pool, or smart-contract trading protocol.
