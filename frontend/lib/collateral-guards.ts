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
  if (/0x17a2\b|\b6050\b|InvalidOrderIOC/i.test(message)) {
    return 'Drift rejected an immediate-or-cancel order (InvalidOrderIOC, 6050). The updated trading flow uses a bounded resting limit order. Check account collateral and cancel any unfilled order when necessary.';
  }
  if (/0x17c7\b|\b6087\b|SpotMarketNotFound/i.test(message)) {
    return 'Drift rejected the transaction: SpotMarketNotFound (6087). This SOL collateral market is not accepted by the currently deployed Drift program. No deposit was confirmed; check market configuration. Any prepared wSOL remains in your wallet and can be unwrapped.';
  }
  return message.slice(0, 560);
}


/** Drift quote collateral is different from native SOL. The mint MUST match the active SDK config. */
export function chooseDevnetUsdcMarket(markets: readonly SpotMarketLike[], configuredMint: string): SpotMarketLike {
  if (typeof configuredMint !== 'string' || configuredMint.length < 32) throw new Error('Drift SDK has no valid configured devnet USDC mint.');
  const matched = markets.filter(m => m.mint.toBase58() === configuredMint);
  if (matched.length !== 1) throw new Error('Drift devnet USDC collateral market is missing or ambiguous. No tokens were transferred. Check the connected cluster and SDK market configuration.');
  const market = matched[0];
  if (!Number.isSafeInteger(market.marketIndex) || market.marketIndex < 0) throw new Error('Invalid Drift USDC market index.');
  return market;
}

/** Pure validation for the authoritative, decoded Spot Market 0 quote mint.
 * This must not accept a different market index or arbitrary decimals, even
 * if an RPC endpoint claims it is the devnet market.
 */
export function validateQuoteSpotMarket(market: {marketIndex:number;mint:string;decimals:number}): void {
  if (market.marketIndex!==0) throw new Error('The on-chain Drift quote account is not spot market 0. No transaction was sent.');
  if (market.decimals!==6) throw new Error('Drift devnet quote market is not a six-decimal token. USDC collateral is disabled.');
  if (typeof market.mint!=='string'||market.mint.length<32||market.mint.length>44) {
    throw new Error('The Drift quote mint is invalid. No collateral instruction was created.');
  }
}
