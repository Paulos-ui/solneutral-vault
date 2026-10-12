# Release Manifest — SolNeutral V7.6.1

## Package
- Name: SolNeutral_V7_6_1_Trade_Lab_Demo.zip
- Mode: Solana Testnet + Demo SOL trading

## Included user-facing refinements
- Trade Lab layout refresh
- Real wallet actions for testnet SOL reserve
- Demo long/short SOL trade panel
- Test SOL onboarding guidance
- Cleaner dashboard KPI presentation
- Explicit favicon metadata
- Updated workspace navigation label

## Main implementation files changed
- frontend/app/trade/page.tsx
- frontend/app/layout.tsx
- frontend/app/api/status/route.ts
- frontend/app/globals.css
- frontend/components/SolReserve.tsx
- frontend/components/SolNeutralDashboard.tsx
- frontend/components/AppShell.tsx
- frontend/components/DemoTradeDesk.tsx

## Intended validation
- Browser tab displays SolNeutral favicon.
- Dashboard KPI alignment looks cleaner.
- Trade Lab shows:
  - real reserve controls,
  - demo trade panel,
  - onboarding steps,
  - market chart.
- Users can request testnet SOL from the reserve screen.
- Demo trades can be opened and closed locally.
