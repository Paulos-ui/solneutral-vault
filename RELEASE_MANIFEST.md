# Complete V4 release manifest

Cumulative upgrade from the current assembled source, not an incremental hotfix.

| Development stage | Included features |
| --- | --- |
| V2 | Signature mineral-green homepage, responsive Hedge Field, Observatory, Risk Lab, About, Docs |
| V2A–B | Funding Signal data interface, refined first-screen controls |
| V2C | Read-only Solana Wallet Lens; ES2020 BigInt build fix |
| V2D | Drift User account provenance and indexed observations |
| V2E | Position Stress Engine and seven-shock deterministic scenarios |
| V3 | Intelligence Terminal, explainable analyst, scenario comparisons, in-page alerts, experimental Anchor program source |
| V4 | Phantom / Solflare connection, devnet-only Drift account actions and SOL-PERP order UI |

## Distinguish code from production validation

- Source code is included for each feature, but not every external API, chain signature, and Anchor procedure has been end-to-end verified.
- An experimental contract must not be represented as audited or deployed.
- Live pooled deposits/withdrawals, audited mainnet trading execution and autonomous rebalancing are not implemented.
- The repo's existing `.git` is never included in or modified by extraction, and existing absent-from-ZIP files are not deleted.
