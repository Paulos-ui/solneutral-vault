/** Pure, auditable guardrails for the SolNeutral devnet execution laboratory. */
export const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const DRIFT_SOL_SPOT_MARKET_INDEX = 1;
export const DRIFT_SOL_PERP_MARKET_INDEX = 0;
export type DevnetAction = 'initialize' | 'deposit' | 'withdraw' | 'long' | 'short' | 'cancel';
export const DEVNET_LIMITS = Object.freeze({ depositLamports: 500_000_000n, withdrawLamports: 500_000_000n, orderBaseUnits: 100_000_000n });

/** Exact decimal parser. Never convert UI SOL quantities via floating point. */
export function decimalToUnits(text: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) throw new Error('Unsupported decimal precision');
  const trimmed = text.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) throw new Error('Enter a positive decimal amount');
  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) throw new Error(`Only ${decimals} decimal places are supported`);
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (amount <= 0n) throw new Error('Amount must be greater than zero');
  return amount;
}

export function validateDevnetAmount(action: 'deposit' | 'withdraw' | 'long' | 'short', input: string): bigint {
  const amount = decimalToUnits(input, 9);
  const limit = action === 'deposit' ? DEVNET_LIMITS.depositLamports
    : action === 'withdraw' ? DEVNET_LIMITS.withdrawLamports : DEVNET_LIMITS.orderBaseUnits;
  if (amount > limit) throw new Error(`Exceeds the devnet per-transaction limit (${Number(limit) / 1e9} SOL)`);
  return amount;
}

export function assertDevnetGenesis(hash: string): void {
  if (hash !== DEVNET_GENESIS_HASH) throw new Error('Wrong Solana cluster. Transactions are permitted on DEVNET only.');
}

export function boundedLimitPrice(oracleRaw: bigint, side: 'long' | 'short'): bigint {
  if (oracleRaw <= 0n) throw new Error('Oracle price is unavailable. Cannot prepare an order.');
  // 1% adverse-move limit, rounded conservatively. On-chain limit orders may not fill.
  const price = side === 'long' ? (oracleRaw * 101n + 99n) / 100n : oracleRaw * 99n / 100n;
  if (price <= 0n) throw new Error('Calculated price is invalid');
  return price;
}

export function explorerTransactionUrl(signature: string): string {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) throw new Error('Invalid transaction signature');
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
