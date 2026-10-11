/** Pure checks used before any wallet signs a SOL collateral transaction. */
export interface SpotMarketLike {
  marketIndex: number;
  mint: { toBase58(): string };
}
export const WRAPPED_SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';
export const SPOT_MARKET_NOT_FOUND = 6087;

export function chooseWrappedSolMarket(markets: readonly SpotMarketLike[]): SpotMarketLike {
  const matching = markets.filter(m => m.mint.toBase58() === WRAPPED_SOL_MINT_ADDRESS);
  if (!matching.length) throw new Error('Drift devnet has no subscribed wrapped-SOL spot market. SOL deposits/withdrawals are disabled. Existing wSOL is safe in your wallet and may be unwrapped.');
  // If multiple pools expose wSOL, fail rather than guessing which market accepts collateral.
  if (matching.length !== 1) throw new Error('More than one wSOL spot market is available; cannot determine the correct collateral market safely.');
  const market = matching[0];
  if (!Number.isSafeInteger(market.marketIndex) || market.marketIndex < 0) throw new Error('Invalid Drift wrapped-SOL spot market index.');
  return market;
}

export function missingWrappedSolTopup(available: bigint, required: bigint): bigint {
  if (available < 0n || required <= 0n) throw new Error('Invalid wrapped-SOL amount.');
  return available >= required ? 0n : required - available;
}

export function meaningfulDriftError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/0x17c7\b|\b6087\b|SpotMarketNotFound/i.test(message)) {
    return 'Drift rejected the transaction: SpotMarketNotFound (6087). This SOL collateral market is not accepted by the currently deployed Drift program. No deposit was confirmed; check market configuration. Any prepared wSOL remains in your wallet and can be unwrapped.';
  }
  return message.slice(0, 560);
}
