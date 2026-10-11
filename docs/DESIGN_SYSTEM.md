# SolNeutral V2 — The Balance Field design language

## The motif

Not a generic dashboard. **A scientific instrument for uncertainty.** Two countervailing paths approach a neutral center point. Their relationship (not either asset alone) is the hero. The brand icon borrows from this counterweight geometry; the same vocabulary becomes the exposure chart and Risk Lab.

## Palette / original "Mineral Green" edition

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#07150f` | Forest ink, primary backdrop |
| `--bg-2` | `#0c2117` | Dimensional shadow panel |
| `--panel` | `#10271b` | Research instrumentation |
| `--paper` | `#ecf0dc` | Warm mineral ivory, primary typography |
| `--volt` | `#c7ff91` | Radio-lime signal, CTA, key tracks |
| `--mint` | `#7de6ab` | Opposing position trace, evidence |
| `--ember` | `#e6a97f` | Risk, negative outcomes, uncertainty |
| `--stroke` | `rgba(194,225,184,.17)` | Precision instrument grid |

The design combines forest ink, acid mineral lime, and warm ivory. Green communicates focus, not guaranteed earnings. Amber flags assumptions and adverse modeled outcomes. No purple neon gradients, glassmorphism cards, or generic pie charts.

## Typography and layout

High-density grotesk uppercase headlines with tight negative tracking. Short readable explanatory paragraphs. Italic Georgia editorial contrast for thesis statements. Micro labels use fixed uppercase tracking to recall instrumentation. Components mostly have square corners rather than generic rounded SaaS cards. Responsive layout uses an intentional desktop editorial asymmetry that collapses to a clear single column on mobile.

## Motion

The field draws two opposing paths in sequence. The user changes hedge size, shifting one path and recalculating residual delta. Circular orbits on feature cards symbolize active measurement. On-scroll reveals show hierarchy. All repeating animation is disabled for visitors requesting reduced motion; data values still update without dependent animation.

## Trust vocabulary

- RESEARCH PREVIEW = no positions executed.
- SIMULATION ONLY = deterministic output given selected inputs.
- NOT CONNECTED = no claim of a live data connection.
- PLANNED = explicitly not built yet.
- VERIFIED = reserved for sourced/validated on-chain data only.

These are product semantics, not secondary legal disclaimers.

## V5 — Connected Workspace (2026)

The homepage remains editorial, while the connected workspace takes on a compact, high-density financial instrument composition. The four-item primary navigation is **Dashboard, Observatory, Trade Lab, Docs**. An icon rail surfaces **AI Analyst, History, Risk Lab, Documentation, and Settings** without crowding the header. Desktop panels are deeply inked forest-green with 17px corner radii, thin mineral-green strokes, clean typography, and intentionally restrained luminous accents.

**Data integrity is a design requirement, not a footnote:** unverified values render as an em dash, not an invented APR or portfolio value. Model charts are labeled as *illustrative* and may be controlled interactively. Devnet chain reads are explicitly distinguished from public Drift indexer readings, wallet transaction signatures, and hypothetical stress scenarios. No decorative example figure is silently treated as a real portfolio.

**Interaction flow:** Homepage → Connect Phantom/Solflare → Dashboard (real public devnet balance + clear verification state) → Trade Lab (wallet-signed devnet transactions) or AI/History via sidebar. All actions remain wallet-controlled and mainnet custody is unavailable.
