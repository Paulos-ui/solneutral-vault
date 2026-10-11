# SolNeutral Phase 2D | Drift Account Lens

**Founder:** Web3 supporter · **X:** @instators

## Purpose
Make Drift account provenance observable before attempting to discuss position-level risk. This phase adds a bespoke `/drift-lens` UI, `POST /api/drift/account`, strict indexed record normalization, and validation tests. It is **not** a live position-monitoring or trading product.

## User flow
1. Obtain the **Drift User subaccount** public address from a trustworthy Drift account explorer or protocol integration. Do not paste your mnemonic/private key or assume a wallet authority is the same address.
2. Visit `/drift-lens`; enter the public subaccount key.
3. SolNeutral checks the RPC owner, Anchor `User` discriminator and confirmed slot.
4. If verified, SolNeutral requests public indexer records associated with that User account key.
5. The UI marks which layers are verified vs unverified and shows external raw field records with disclaimers.

## Implementation and trust boundaries
- On-chain read: `getAccountInfo` (8 byte slice, `confirmed`).
- Owner: mainnet Drift V2 program `dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH`.
- Discriminator: SHA-256 of `account:User`, first 8 bytes.
- External data: `https://data.api.drift.trade/user/{accountId}/positions`, server-side fixed origin. Public indexer; data freshness, completeness, response schema and availability not guaranteed.
- Data validation: bounded array, bounded safe integer market index, basic numeric raw string validation. No price/precision assumptions or PnL calculation.
- Error states: not-found, not-drift, unavailable, empty, indexed observed. `empty` means the *indexer returned zero rows*, NOT that the subaccount has no current positions.
- Future: reconcile decoded RPC Drift positions and market oracle state, derive health/leverage only from the canonical protocol SDK with specific risk-model tests, and review rate-limiting controls.

## Security and Vercel
No extra npm dependencies required. Nothing can sign or send a transaction. Public endpoint validates 32-byte addresses and fetches only fixed RPC/indexer origins. It should be rate-limited under public traffic load. RPC credentials belong in server-only `SOLANA_RPC_URL`. Public endpoints can still fail due to RPC rate limits or data-provider schema changes; no cached fake values are substituted.

## Manual install and check
```bash
cd "/mnt/c/Users/MY PC/Desktop/solneutral-vault"
unzip -o "/mnt/c/Users/MY PC/Desktop/SolNeutral_Phase2D_Drift_Account_Lens.zip" -d . && rm -f "/mnt/c/Users/MY PC/Desktop/SolNeutral_Phase2D_Drift_Account_Lens.zip"
cd frontend
npm test && npm run build
```

**Project positioning:** Independent Solana ecosystem project presented for builder feedback in Colosseum / Superteam Nigeria communities; not affiliated with or endorsed by either. Preserve provenance of SolNeutral V1 code in hackathon disclosures.
