/**
 * Drift Account Lens data-integrity model.
 * Reads only public, provider-supplied account evidence. NEVER handles signer secrets.
 */
import { createHash } from 'node:crypto';

export const DRIFT_V2_MAINNET_PROGRAM = 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH';
export const DRIFT_INDEXER_ORIGIN = 'https://data.api.drift.trade';
const USER_DISCRIMINATOR = createHash('sha256').update('account:User').digest().subarray(0, 8);

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Obj : null;

export interface DriftAccountVerification {
  status: 'verified' | 'not-drift' | 'not-found' | 'unavailable';
  slot: number | null;
  notice: string;
}
export interface DriftRecord {
  marketIndex: number;
  marketType: 'perp' | 'spot' | 'unknown';
  direction: 'long' | 'short' | 'unknown';
  // Precision and units depend on the indexer; NEVER silently scale or price it.
  baseAssetAmountRaw: string | null;
  quoteAssetAmountRaw: string | null;
  timestamp: string | null;
}
export interface DriftAccountResponse {
  network: 'mainnet-beta';
  account: string;
  fetchedAt: string;
  onChain: DriftAccountVerification;
  indexed: { status: 'observed' | 'empty' | 'unavailable' | 'not-checked'; records: DriftRecord[]; notice: string; source: string };
  limitations: string;
}

function slotOf(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
}

/** Fail closed: verify program ownership and the Anchor account:User discriminator. */
export function parseDriftAccountInfo(result: unknown): DriftAccountVerification {
  const root = obj(result);
  const slot = slotOf(obj(root?.context)?.slot);
  if (!root || slot === null) return { status: 'unavailable', slot: null, notice: 'Solana RPC did not return a verifiable context slot.' };
  if (root.value === null) return { status: 'not-found', slot, notice: 'No account exists at this address at the confirmed RPC slot.' };
  const value = obj(root.value);
  if (!value) return { status: 'unavailable', slot, notice: 'RPC returned an invalid account payload.' };
  if (value.owner !== DRIFT_V2_MAINNET_PROGRAM || value.executable !== false) {
    return { status: 'not-drift', slot, notice: 'Account is not owned by the official Drift V2 program.' };
  }
  const raw = value.data;
  if (!Array.isArray(raw) || raw[1] !== 'base64' || typeof raw[0] !== 'string') {
    return { status: 'unavailable', slot, notice: 'RPC account discriminator could not be decoded.' };
  }
  // RPC dataSlice returns precisely 8 bytes; reject truncated/altered base64.
  const buffer = Buffer.from(raw[0], 'base64');
  if (buffer.length !== 8 || buffer.toString('base64') !== raw[0]) {
    return { status: 'unavailable', slot, notice: 'RPC returned malformed account discriminator bytes.' };
  }
  if (!buffer.equals(USER_DISCRIMINATOR)) {
    return { status: 'not-drift', slot, notice: 'Program-owned account is not a Drift User subaccount.' };
  }
  return { status: 'verified', slot, notice: 'Confirmed Solana RPC identifies a Drift V2 User subaccount. This verifies account type, not current position values or performance.' };
}

const numericRaw = (v: unknown): string | null => {
  if (typeof v === 'string' && /^-?\d+(?:\.\d+)?$/.test(v) && v.length <= 42) return v;
  if (typeof v === 'number' && Number.isSafeInteger(v)) return String(v);
  return null;
};
function parseTime(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d{10,13}$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n < 10_000_000_000 ? n * 1000 : n;
  if (ms < 1262304000000 || ms > Date.now() + 86_400_000) return null;
  return new Date(ms).toISOString();
}

/**
 * Strict, small projection of known fields in Drift position indexer records.
 * No assumption that an indexed *record* equals a current, live position.
 */
export function parseIndexedPositionRecords(payload: unknown): DriftRecord[] | null {
  const root = obj(payload);
  const rows = Array.isArray(payload) ? payload :
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root?.records) ? root.records :
    Array.isArray(root?.positions) ? root.positions : null;
  if (!rows || rows.length > 500) return null;
  const result: DriftRecord[] = [];
  for (const row of rows.slice(0, 20)) {
    const data = obj(row);
    if (!data || !Number.isInteger(data.marketIndex) || (data.marketIndex as number) < 0 || (data.marketIndex as number) > 65535) return null;
    const rawMarketType = String(data.marketType ?? '').toLowerCase();
    const marketType = rawMarketType === 'perp' || rawMarketType === 'spot' ? rawMarketType : 'unknown';
    const directionCandidate = String(data.direction ?? '').toLowerCase();
    const direction = directionCandidate === 'long' || directionCandidate === 'short' ? directionCandidate : 'unknown';
    const base = data.baseAssetAmount == null ? null : numericRaw(data.baseAssetAmount);
    const quote = data.quoteAssetAmount == null ? null : numericRaw(data.quoteAssetAmount);
    if ((data.baseAssetAmount != null && base == null) || (data.quoteAssetAmount != null && quote == null)) return null;
    const timestamp = parseTime(data.ts ?? data.timestamp ?? data.blockchainTimestamp);
    result.push({ marketIndex: data.marketIndex as number, marketType, direction, baseAssetAmountRaw: base, quoteAssetAmountRaw: quote, timestamp });
  }
  return result;
}
