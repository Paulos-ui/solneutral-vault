/**
 * Drift execution adapter: only invoked by explicit user clicks after wallet signature.
 * This interacts with a USER-OWNED DRIFT account, NOT the experimental SolNeutral vault.
 * DEVNET ONLY: mainnet is impossible through the exported transaction functions.
 */
import type { Connection } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { prepareWrappedSolDeposit, ensureWrappedSolDestination } from './native-sol';
import {
  assertDevnetGenesis, boundedLimitPrice, DEVNET_GENESIS_HASH,
  DRIFT_SOL_PERP_MARKET_INDEX, DRIFT_SOL_SPOT_MARKET_INDEX,
  validateDevnetAmount,
} from './devnet-execution';

export type ExecutionAction = 'initialize' | 'deposit' | 'withdraw' | 'long' | 'short' | 'cancel';
export type ExecutionResult = { signature: string; confirmed: boolean; description: string; userAccount: string };

async function openDevnetClient(connection: Connection, wallet: AnchorWallet) {
  const genesis = await connection.getGenesisHash();
  assertDevnetGenesis(genesis);
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) throw new Error('Connect a signing wallet first.');

  // Dynamic import keeps this large SDK out of all research pages.
  const sdk = await import('@drift-labs/sdk');
  const config = sdk.initialize({ env: 'devnet' });
  const { PublicKey } = await import('@solana/web3.js');
  const loader = new sdk.BulkAccountLoader(connection, 'confirmed', 1200);
  const client = new sdk.DriftClient({
    connection,
    wallet,
    env: 'devnet',
    programID: new PublicKey(config.DRIFT_PROGRAM_ID),
    ...sdk.getMarketsAndOraclesForSubscription('devnet'),
    accountSubscription: { type: 'polling', accountLoader: loader },
  });
  const subscribed = await client.subscribe();
  if (!subscribed) throw new Error('Drift devnet market subscription is unavailable.');
  return { client, sdk, config };
}

export async function inspectDriftDevnetAccount(connection: Connection, wallet: AnchorWallet) {
  const genesis = await connection.getGenesisHash();
  assertDevnetGenesis(genesis);
  const { getUserAccountPublicKeySync } = await import('@drift-labs/sdk');
  const { PublicKey } = await import('@solana/web3.js');
  const sdk = await import('@drift-labs/sdk');
  const config = sdk.initialize({ env: 'devnet' });
  const id = getUserAccountPublicKeySync(new PublicKey(config.DRIFT_PROGRAM_ID), wallet.publicKey, 0);
  const account = await connection.getAccountInfo(id, 'confirmed');
  if (account && !account.owner.equals(new PublicKey(config.DRIFT_PROGRAM_ID))) {
    throw new Error('Derived account owner does not match the configured Drift devnet program.');
  }
  return { address: id.toBase58(), exists: Boolean(account), genesis };
}

async function waitForVerifiedSignature(connection: Connection, signature: string): Promise<boolean> {
  // The SDK broadcasts transactions; the RPC is independently queried for confirmation.
  // A submitted order may not fill just because the transaction was confirmed.
  const outcome = await connection.confirmTransaction(signature, 'confirmed');
  if (outcome.value.err) throw new Error('Transaction was rejected on-chain. Inspect the signature in Solana Explorer.');
  const status = (await connection.getSignatureStatuses([signature], {searchTransactionHistory:true})).value[0];
  return Boolean(status && !status.err && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'));
}

/** All actions require a connected wallet, devnet RPC, small validated sizes and separate user confirmation. */
export async function executeDriftDevnetAction(
  connection: Connection,
  wallet: AnchorWallet,
  action: ExecutionAction,
  amountText: string,
): Promise<ExecutionResult> {
  const units = action === 'initialize' || action === 'cancel' ? null : validateDevnetAmount(action, amountText);
  const { client, sdk, config } = await openDevnetClient(connection, wallet);
  const programId = new (await import('@solana/web3.js')).PublicKey(config.DRIFT_PROGRAM_ID);
  try {
    const userId = await client.getUserAccountPublicKey(0);
    const account = await connection.getAccountInfo(userId, 'confirmed');
    if (account && !account.owner.equals(programId)) throw new Error('Invalid Drift user account owner.');
    if (!account && action !== 'initialize') throw new Error('Initialize your Drift devnet account before sending funds or placing orders.');
    if (account && action === 'initialize') throw new Error('Drift account already exists; no need to initialize it again.');
    let signature: string;
    let description: string;
    if (action === 'initialize') {
      [signature] = await client.initializeUserAccount();
      description = 'Drift devnet user-account initialization';
    } else if (action === 'deposit') {
      const { tokenAccount } = await prepareWrappedSolDeposit(connection, wallet, units!);
      try {
        signature = await client.deposit(new sdk.BN(units!.toString()), DRIFT_SOL_SPOT_MARKET_INDEX, tokenAccount, 0);
      } catch (error) {
        throw new Error(`Wrapped SOL was prepared in your wallet, but the separate Drift deposit did not finish. Your wSOL remains in your associated token account. ${error instanceof Error ? error.message : 'Check the devnet explorer.'}`);
      }
      description = 'Deposited wSOL collateral into your personal Drift devnet account';
    } else if (action === 'withdraw') {
      // reduceOnly=true: never create a spot borrow to fund a withdrawal.
      const { tokenAccount } = await ensureWrappedSolDestination(connection, wallet);
      signature = await client.withdraw(new sdk.BN(units!.toString()), DRIFT_SOL_SPOT_MARKET_INDEX, tokenAccount, true, 0);
      description = 'Withdrew wSOL collateral to your wallet token account (unwrap separately to receive native SOL)';
    } else if (action === 'cancel') {
      signature = await client.cancelOrders(sdk.MarketType.PERP, DRIFT_SOL_PERP_MARKET_INDEX);
      description = 'Requested cancellation of outstanding SOL-PERP devnet orders';
    } else {
      const oracle = client.getOracleDataForPerpMarket(DRIFT_SOL_PERP_MARKET_INDEX);
      const rawPrice = BigInt(oracle.price.toString());
      const cap = boundedLimitPrice(rawPrice, action);
      const market = client.getPerpMarketAccount(DRIFT_SOL_PERP_MARKET_INDEX);
      if (!market) throw new Error('SOL-PERP market unavailable on devnet.');
      const params = sdk.getLimitOrderParams({
        marketType: sdk.MarketType.PERP,
        marketIndex: DRIFT_SOL_PERP_MARKET_INDEX,
        direction: action === 'long' ? sdk.PositionDirection.LONG : sdk.PositionDirection.SHORT,
        baseAssetAmount: new sdk.BN(units!.toString()),
        price: new sdk.BN(cap.toString()),
        // Drift SDK v2.143 uses bitFlags for IOC; immediateOrCancel is not
        // a supported property of getLimitOrderParams in this version.
        bitFlags: sdk.OrderParamsBitFlag.ImmediateOrCancel,
      });
      signature = await client.placePerpOrder(params);
      description = `Submitted ${action.toUpperCase()} SOL-PERP limit IOC order on Drift devnet (1% oracle price guard; may not fill)`;
    }
    const confirmed = await waitForVerifiedSignature(connection, signature);
    return { signature, confirmed, description, userAccount: userId.toBase58() };
  } finally {
    await client.unsubscribe().catch(() => undefined);
  }
}
