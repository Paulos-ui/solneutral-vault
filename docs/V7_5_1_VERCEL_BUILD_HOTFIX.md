# SolNeutral V7.5.1 — Vercel RiskAnalyst build fix

## Resolved issue
Vercel reported `frontend/components/RiskAnalyst.tsx:57:19`: `Type 'unknown' is not assignable to type 'string'`. The AI response is parsed as `unknown`; TypeScript correctly narrows `payload.answer` to a string inside the guard but cannot reliably preserve that property narrowing inside a state updater callback. After validation, we now copy `payload.answer` into `const answer: string` before the updater. The validated string is used when inserting the assistant message.

## Scope
One targeted application change in `frontend/components/RiskAnalyst.tsx`. All existing V7.5 functionality and folder structure are retained. No RPC network, wallet or smart-contract changes; no transaction success is claimed.

## Verification
An isolated TypeScript strict-mode compile of the validation and state-update pattern succeeded. Full `npm run typecheck` and `npm run build` require installed project dependencies. npm registry DNS failed in the packaging environment, so those full checks are **not verified** here. Run both locally before committing; Vercel will also check upon push.

## Install / validate
From the existing repository directory: `unzip -oq "...zip" -d .` (do not delete `.git`). Then `cd frontend && npm ci && npm run typecheck && npm run build`.
