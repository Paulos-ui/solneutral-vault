
## Wallet-first V5 dashboard

The homepage retains the Hedge Observatory marketing experience. Connecting a wallet from the homepage transitions to `/dashboard`, while users may also click **Dashboard** in the header. The dashboard requires an active Phantom/Solflare wallet session to show personal data. Without a wallet, it shows a dedicated connection state, not invented portfolio results.

The application header now exposes only Dashboard, Observatory, Trade Lab, and Docs. The workspace icon rail offers AI Analyst, History, Risk Lab, and Settings. The older `/terminal` research page remains accessible via a contextual link.

Dashboard evidence contract:
- Wallet balance: verified devnet `getBalance`, or explicitly unavailable. This is *not* a USD portfolio valuation.
- Recent activity: verified devnet wallet transaction signatures, **not** assumed Drift fills or vault earnings.
- Funding: validated public Drift indexed hourly observations, with stale/unavailable states.
- Hedge stress: explicitly hypothetical and not Drift's liquidation or margin model.
- Collateral, vault share value, executed hedge PnL: unavailable until securely decoded and reconciled.

Trade Lab remains devnet only and requires live wallet signature approval. No mainnet pooled SolNeutral vault is offered.
