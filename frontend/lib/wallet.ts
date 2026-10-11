/**
 * SolNeutral read-only wallet observability utilities.
 * No signing, transaction execution, key material or private wallet state.
 * Data sources: Solana JSON-RPC getBalance / getTokenAccountsByOwner.
 */
export const MAINNET_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_LOOKUP = new Map([...BASE58].map((ch, i) => [ch, BigInt(i)]));

type Dictionary = Record<string, unknown>;
function object(value: unknown): Dictionary | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Dictionary : null;
}

/** Validates a decoded 32-byte Solana address, not merely its alphabet. */
export function isSolanaPublicKey(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44) return false;
  let n = 0n;
  let leadingZeros = 0;
  let stillLeading = true;
  for (const ch of value) {
    const digit = BASE58_LOOKUP.get(ch);
    if (digit === undefined) return false;
    if (stillLeading && ch === '1') leadingZeros++;
    else stillLeading = false;
    n = n * 58n + digit;
  }
  let byteCount = 0;
  while (n > 0n) { byteCount++; n >>= 8n; }
  return leadingZeros + byteCount === 32;
}

export interface ChainBalance {
  amount: number;
  slot: number;
}

export interface TokenRead extends ChainBalance { accounts: number; }

export interface WalletReadResponse {
  status: 'observed' | 'partial' | 'unavailable';
  network: 'mainnet-beta';
  address: string;
  fetchedAt: string;
  sol: ChainBalance | null;
  usdc: TokenRead | null;
  notice: string;
}

/** Only accept finite integer lamport quantities with an RPC context slot. */
export function parseSolBalance(result: unknown): ChainBalance | null {
  const r = object(result);
  const c = object(r?.context);
  if (!r || !c || !Number.isSafeInteger(c.slot) || (c.slot as number) < 0 ||
    !Number.isSafeInteger(r.value) || (r.value as number) < 0) return null;
  return { amount: (r.value as number) / 1_000_000_000, slot: c.slot as number };
}

/** Restrict to the canonical mainnet USDC mint and a validated numeric balance. */
export function parseUsdcBalance(result: unknown): TokenRead | null {
  const r = object(result);
  const c = object(r?.context);
  if (!r || !c || !Number.isSafeInteger(c.slot) || (c.slot as number) < 0 || !Array.isArray(r.value)) return null;
  let amount = 0;
  for (const entry of r.value) {
    const account = object(object(entry)?.account);
    const parsed = object(object(account?.data)?.parsed);
    const info = object(parsed?.info);
    const tokenAmount = object(info?.tokenAmount);
    if (info?.mint !== MAINNET_USDC_MINT || tokenAmount?.decimals !== 6 || typeof tokenAmount.uiAmountString !== 'string' || !/^\d+(?:\.\d+)?$/.test(tokenAmount.uiAmountString)) return null;
    const balance = Number(tokenAmount.uiAmountString);
    if (!Number.isFinite(balance) || balance < 0 || balance > 1e15) return null;
    amount += balance;
    if (!Number.isFinite(amount) || amount > 1e15) return null;
  }
  return { amount, accounts: r.value.length, slot: c.slot as number };
}
