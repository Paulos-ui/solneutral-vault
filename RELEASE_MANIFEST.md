# SolNeutral V7.6.2 release manifest

**Source baseline:** SolNeutral V7.6.1 cumulative ZIP.
**Delivery:** cumulative archive with all repository files at archive root, no nested project folder and no `.git`.

## Focused changes

- `frontend/components/SolNeutralDashboard.tsx`: simplify connected dashboard introduction.
- `frontend/components/TradeWorkspace.tsx`: add synchronized market selector with chart left and Long/Short ticket right.
- `frontend/components/DemoTradeDesk.tsx`: educational SOL and BONK paper trading with virtual USD collateral and simulated PnL.
- `frontend/components/SolPriceChart.tsx`: switchable SOL/BONK external spot reference; prevent showing old price under the wrong asset.
- `frontend/app/api/market/sol-chart/route.ts`: explicit allowlist of Coinbase SOL-USD and BONK-USD candle feeds, validation and failure states.
- `frontend/app/trade/page.tsx`: rearranged trading workspace above the original self-custodied SOL reserve.
- `frontend/app/globals.css`: aligned desktop/mobile layout and smaller responsive cards.
- `frontend/app/favicon.ico`, `frontend/app/layout.tsx`: real SolNeutral favicon and explicit browser icon metadata.
- `frontend/components/SolReserve.tsx`: official Solana testnet faucet link.
- `frontend/app/docs/page.tsx`: documentation explains external quotes, demo trading and reserve separation.
- `frontend/app/api/status/route.ts`: version metadata.

## Validation and limitations

The syntax parser accepts the changed files. Full dependency-powered build and live transaction/market availability are **not claimed**. A demo trade is simulated, not a token swap, a blockchain order or a profit. The SOL reserve is wallet-owned wSOL, not custody by a deployed vault program.
