# SolNeutral — Vercel backend and Drift onboarding (V6.1)

## 1. Where the backend actually lives

The **active backend is already part of Next.js**, located at `frontend/app/api/*`.
Vercel deploys it with the frontend when the Project **Root Directory is `frontend`**.
There is **no need to delete your Vercel project** or redeploy the archived `legacy/backend` Flask simulation service.

Example endpoints (on your current domain):

- `GET /api/status`: status and release metadata; does not require environment configuration.
- `GET /api/health`: fast environment readiness check.
- `GET /api/health?probe=1`: actively validates the devnet and read-only mainnet RPC genesis hashes; may return unavailable if public endpoints rate-limit.
- `GET /api/market/funding`: independent upstream Drift funding data; may be unavailable even when Next.js is working.
- `POST /api/chain/wallet`: read-only mainnet wallet information.
- `POST /api/drift/account`: read-only mainnet Drift subaccount research.
- `POST /api/ai/interpret`: optional private API narration; protected by an access token.

**Devnet transactions are initiated from a browser wallet through the Drift SDK, not from a Vercel private key.**

## 2. Vercel steps

1. Open the existing **solneutral-vault** project at Vercel.
2. Settings > Build and Deployment: `Framework Preset = Next.js`, `Root Directory = frontend`.
3. Settings > Environment Variables: add variables by exact names, selecting **Production** (and Preview if wanted).
4. `NEXT_PUBLIC_DEVNET_RPC_URL` = `https://api.devnet.solana.com` for initial testing.
5. `NEXT_PUBLIC_ENABLE_DEVNET_TRADING` = `true` while testing with worthless devnet assets; set `false` to disable execution controls.
6. Optional `SOLANA_RPC_URL`: a **mainnet** RPC endpoint; preferably a dedicated, private server-side provider URL.
7. Optional AI: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and a strong private `AI_DEMO_ACCESS_TOKEN` at least 20 characters. The model service is not necessary for the deterministic analyst.
8. Save the environment variables and **redeploy** the current production commit, or push a new commit.
9. Visit `/api/status`, `/api/health`, and **Settings > Backend & data services > Test backend & RPC**. This reports reachability, not trading success.

Don't paste `RAILWAY_*`, Flask secrets, private keys or an old local `NEXT_PUBLIC_API_URL` just because they existed in V1. Only use variables read by the current code. `NEXT_PUBLIC_` values become public in browser bundles: never put private provider tokens in them unless intentionally public and origin-restricted.

## 3. Initialize Drift account in the app

1. Open `/trade` and connect a dedicated Phantom or Solflare **devnet** wallet.
2. Wait for the **Verified devnet** network check.
3. The app checks the wallet's derived Drift User account; if missing, it opens the **Account** tab and offers **Initialize Drift Account** prominently.
4. Tick the acknowledgement; click **Initialize Drift Account**, then approve the wallet's transaction. You need a small amount of devnet SOL to cover fees.
5. Look for a confirmed signature and verify it on Solana Explorer (cluster=devnet).
6. Select **Collateral** to test small wSOL deposits into your personal Drift devnet account. Opening a Drift account is not a deposit into SolNeutral's unaudited experimental vault.
7. If RPC or Drift SDK checking fails, choose **Retry account check** and inspect the displayed error. Never assume successful setup merely because the wallet connected.

**Important:** Drift order submission is not proof of an execution/fill. Mainnet custody, real deposits, and automated hedging are not enabled by this release.

## 4. Troubleshooting

- `/api/status` works but funding is unavailable: backend is deployed; inspect `/api/market/funding` and the upstream Drift indexer independently.
- `/api/health?probe=1` returns `unavailable`: the configured RPC may be throttled/blocked or temporarily unavailable. It is not always a deployment error.
- `wrong_network` for devnet: check `NEXT_PUBLIC_DEVNET_RPC_URL`; devnet signing stays disabled until correct.
- Drift account shows `not initialized`: choose Account > Initialize Drift Account, confirm the wallet signature, then Refresh.
- `Drift account lookup unavailable`: do not deposit; verify the client RPC, wallet session and SDK error first.
- Unrelated old Railway variables are ignored by the current code. Copy names only when migrating, never assume the old Flask backend is part of V6.
