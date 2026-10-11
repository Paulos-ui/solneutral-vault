# SolNeutral V7.2 cumulative release

- Built upon complete SolNeutral V7.1 source, overlaid with V7.1.1 build fix.
- Corrects the observed `InvalidOrderIOC (6050 / 0x17a2)` order construction using a bounded, potentially resting limit order.
- Adds a positive free-collateral check before a new order, without fabricating collateral balances.
- Updates the trading consent and order receipt to describe resting-order behavior and cancellation.
- Adds historical chart controls for browsing verified SOL/USD candles. Preserves automatic refresh and timeframe controls.
- Makes the dashboard's unverified Drift account card compact, while retaining funding refresh.
- Adds validated funding API route fallback with no invented rates.
- Updates regression tests, deployment docs, old program-ID discrepancy notes, and safe devnet/testnet guidance.

**Cannot yet claim:** fully tested mainnet vault, verified deposit/withdrawal, actual fill, liquidation price, portfolio PnL or live testnet Drift deployment. This release is a **research/devnet execution upgrade**, not an audit or a production trading certification.
