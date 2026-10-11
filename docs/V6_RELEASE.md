# V6 Release Notes — Compact, wallet-first product workspace

## User experience improvements

- Simplified persistent navigation: exactly **Dashboard, Observatory, Trade Lab, Docs** at the top.
- Added Docs to the persistent workspace shell; brand click goes to Dashboard while inside the app.
- Rebalanced typography and density, especially on laptop screens and mobile.
- Reduced the public hero type scale while preserving the interactive first-screen balance field.
- Dashboard cards, charts and recent activity are visible higher on screen; user inputs remain interactive.
- Observatory opens with the Hedge Field and the current indexed funding section rather than a two-line slogan and static unavailable statements. Exposure methodology can be expanded.
- Risk Lab opens directly on the scenario controls/results. Methodology is expandable.
- Trade Lab now has **Trade**, **Collateral**, **Account** and **Orders** views. Existing devnet SDK calls and explicit wallet approvals remain; nothing implicitly places an order. Order cancellation does not imply position closure.
- Analyst is a concise Q&A workspace with preset prompts, evidence transparency and an optional token-gated language-model section.
- History and Settings use smaller titles and a dense first-screen view.
- Documentation has a concise entry heading, quick links, retained table of contents and persistent global sidebar.

## Financial integrity

Do not create or advertise synthetic PnL, APY, health factors, balances, or transaction history as actual values. An unavailable Drift indexer is displayed as unavailable, with a refresh path. An unavailable position/collateral decoder is explicitly marked unsupported rather than substituted with a simulated metric.

## Build/validation status

- `npm test`: **50 passed** (45 previous + 5 V6 structural safety checks).
- All frontend TypeScript/TSX file syntax trees parsed successfully.
- CSS parsed without structural errors.
- The actual Next.js compilation, TypeScript semantic checking, browser wallet signing and devnet transaction integration are **not verified** by these checks. `npm install` could not complete in the artifact environment.
- Do not deploy until `npm test && npm run typecheck && npm run build` succeeds locally. Stop on any error rather than pushing.

## Next verified engineering work

Implement a read-only Drift User account decoder with validated on-chain oracle and margin data, reconcile executed orders/fills against signatures, then expose account-level collateral and liquidation metrics only after correct SDK and version checks. Separately, compile and integration-test the Anchor vault; never connect it to mainnet deposits before independent review.
