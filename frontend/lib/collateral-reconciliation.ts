/** Reconcile two independently read, confirmed-chain USDC snapshots.
 * Transaction signature confirmation alone does not prove a collateral delta.
 * Drift's signed spot token amount can be NEGATIVE when the user has a borrow.
 */
export interface UsdcBalanceSnapshot {
  mint: string;
  marketIndex: number;
  decimals: number;
  walletTokenAccount: string;
  walletAmount: string;
  driftDepositedAmount: string | null;
  userAccountExists: boolean;
}

export type UsdcMovementProof = {
  status: 'verified' | 'unverified';
  detail: string;
  walletDeltaRaw: string | null;
  driftDeltaRaw: string | null;
};

export function reconcileUsdcMovement(
  before: UsdcBalanceSnapshot,
  after: UsdcBalanceSnapshot,
  action: 'deposit' | 'withdraw',
  amountRaw: bigint,
): UsdcMovementProof {
  const fail = (detail: string): UsdcMovementProof => ({
    status: 'unverified', detail, walletDeltaRaw: null, driftDeltaRaw: null,
  });
  if (amountRaw <= 0n) return fail('Invalid requested amount; movement cannot be verified.');
  if (!before.userAccountExists || !after.userAccountExists ||
      before.driftDepositedAmount === null || after.driftDepositedAmount === null) {
    return fail('A readable Drift User spot balance is required before and after the transaction.');
  }
  if (before.mint !== after.mint || before.marketIndex !== after.marketIndex ||
      before.walletTokenAccount !== after.walletTokenAccount ||
      before.decimals !== 6 || after.decimals !== 6) {
    return fail('The account, market, mint, or decimals changed between reads.');
  }
  let walletDelta: bigint;
  let driftDelta: bigint;
  try {
    const int = (text: string) => {
      if (!/^-?\d+$/.test(text)) throw new Error('Invalid chain amount');
      return BigInt(text);
    };
    const walletBefore = int(before.walletAmount);
    const walletAfter = int(after.walletAmount);
    if (walletBefore < 0n || walletAfter < 0n) return fail('Invalid unsigned wallet token balance.');
    walletDelta = walletAfter - walletBefore;
    driftDelta = int(after.driftDepositedAmount) - int(before.driftDepositedAmount);
  } catch {
    return fail('Malformed confirmed-chain balances.');
  }
  const observed: UsdcMovementProof = {
    status: 'unverified',
    walletDeltaRaw: walletDelta.toString(),
    driftDeltaRaw: driftDelta.toString(),
    detail: 'Observed wallet and Drift deltas do not reconcile with the signed amount.',
  };
  const expectedWalletDelta = action === 'deposit' ? -amountRaw : amountRaw;
  const expectedDriftDelta = -expectedWalletDelta;
  // Interest accrual and Drift spot scaled-balance rounding can create small
  // differences from the exact token transfer. Do not silently accept a large one.
  const driftTolerance = amountRaw / 10_000n > 2n ? amountRaw / 10_000n : 2n;
  const driftError = driftDelta - expectedDriftDelta;
  const driftWithinTolerance = driftError >= -driftTolerance && driftError <= driftTolerance;
  if (walletDelta !== expectedWalletDelta || !driftWithinTolerance) return observed;
  return {
    status: 'verified',
    walletDeltaRaw: walletDelta.toString(),
    driftDeltaRaw: driftDelta.toString(),
    detail: 'The wallet token change matches the signed amount, and a fresh Drift spot balance agrees within bounded rounding/interest tolerance.',
  };
}
