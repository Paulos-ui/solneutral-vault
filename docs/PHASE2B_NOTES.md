# SolNeutral — Phase 2B · First-Fold Hedge Observatory

Founder: **Web3 supporter** (@instators). Focus: Solana, Colosseum, Superteam Nigeria.

## Why

The homepage balance graphic and its interactive hedge slider formerly required scrolling to see together on desktop. Phase 2B keeps the existing illustration and behavior, but gives them a shared **viewport-aware first-screen composition**. The headline is reduced and the slider has a dedicated visible place in the right-hand instrument panel.

## Files changed

- `frontend/app/page.tsx` — adds a scoped `hero--one-screen` design hook.
- `frontend/app/globals.css` — desktop/laptop viewport-responsive layout rules; mobile stacking left intact.

## User-facing behavior

- On typical desktop/laptop heights, the complete control panel, including its slider, appears with the hero at first load.
- Slider remains fully interactive via drag, touch and keyboard. Explanations of net directional exposure remain illustrative, not proof of executed trades.
- At tablet/mobile widths, the design stacks rather than rendering illegibly small.
- No new API, credentials, packages, or routes required. Retains Phase 2A funding work.

## Install

The ZIP has files at its root. Extract straight into the existing repository, no backup or temporary folder needed. Always run the build and inspect locally before committing.
