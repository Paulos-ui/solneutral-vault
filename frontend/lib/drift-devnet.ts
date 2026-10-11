/**
 * Drift execution adapter: only invoked by explicit user clicks after wallet signature.
 * This interacts with a USER-OWNED DRIFT account, NOT the experimental SolNeutral vault.
 * DEVNET ONLY: mainnet is impossible through the exported transaction functions.
 */
import type { Connection } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { prepareWrappedSolDeposit, ensureWrappedSolDestination, unwrapWalletWsol } from './native-sol';
import { chooseWrappedSolMarket, meaningfulDriftError } from './collateral-guards';
import {
  assertDevnetGenesis, boundedLimitPrice, DEVNET_GENESIS_HASH,
  validateDevnetAmount,
} from './devnet-execution';

export type ExecutionAction = 'initialize' | 'deposit' | 'withdraw' | 'long' | 'short' | 'cancel' | 'unwrap';
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

/** Verify on-chain wSOL market existence, ownership and mint before wallet funds move. */
async function verifiedWrappedSolMarket(connection: Connection, client: Awaited<ReturnType<typeof openDevnetClient>>['client']) {
  const { NATIVE_MINT } = await import('@solana/spl-token');
  const { getSpotMarketPublicKeySync } = await import('@drift-labs/sdk');
  const markets = client.getSpotMarketAccounts();
  const market = chooseWrappedSolMarket(markets);
  // SDK subscription market types expose toBase58(), but do not guarantee the
  // concrete PublicKey.equals() method. Compare their canonical mint addresses.
  if (market.mint.toBase58() !== NATIVE_MINT.toBase58()) {
    throw new Error('The selected collateral market is not native wrapped SOL.');
  }
  // Resolve the authoritative spot-market PDA from the program and market index.
  // Do not rely on an SDK market object's optional/shape-only pubkey property.
  const spotMarketPda = getSpotMarketPublicKeySync(client.program.programId, market.marketIndex);
  const account = await connection.getAccountInfo(spotMarketPda, 'confirmed');
  if (!account || !account.owner.equals(client.program.programId)) {
    throw new Error('Drift wSOL spot market is missing or owned by a different program on devnet. Deposit and withdrawal disabled.');
  }
  return market.marketIndex;
}

/** All actions require a connected wallet, devnet RPC, small validated sizes and separate user confirmation. */
export async function executeDriftDevnetAction(
  connection: Connection,
  wallet: AnchorWallet,
  action: ExecutionAction,
  amountText: string,
): Promise<ExecutionResult> {
  const units = action === 'initialize' || action === 'cancel' || action === 'unwrap' ? null : validateDevnetAmount(action, amountText);
  // Wallet-owned wSOL recovery does not need Drift market data or even a Drift User account.
  if (action === 'unwrap') {
    const outcome = await unwrapWalletWsol(connection, wallet);
    const confirmed = await waitForVerifiedSignature(connection, outcome.signature);
    return {signature:outcome.signature, confirmed, description:`Returned ${Number(outcome.unwrappedLamports)/1e9} wSOL to native devnet SOL (entire wallet token account closed).`,userAccount:'Not a Drift transaction'};
  }
  const { client, sdk, config } = await openDevnetClient(connection, wallet);
  const programId = new (await import('@solana/web3.js')).PublicKey(config.DRIFT_PROGRAM_ID);
  try {
    // The current Drift User account may not exist yet. DriftClient.getUserAccountPublicKey()
    // uses getUser(), which throws for a wallet without a subscribed User account.
    // Derive the PDA independently so initialization can proceed on a fresh wallet.
    const userId = sdk.getUserAccountPublicKeySync(programId, wallet.publicKey, 0);
    const account = await connection.getAccountInfo(userId, 'confirmed');
    if (account && !account.owner.equals(programId)) throw new Error('Invalid Drift user account owner.');
    if (!account && action !== 'initialize') throw new Error('Initialize your Drift devnet account before sending funds or placing orders.');
    if (account && action === 'initialize') throw new Error('Drift account already exists; no need to initialize it again.');
    if (account && action !== 'initialize') {
      if (!(await client.addUser(0))) throw new Error('Drift subaccount exists but its state could not be loaded. Please retry.');
    }
    // Validate market BEFORE preparing any wallet-owned wSOL, preventing stranded
    // collateral when the selected spot market does not exist on Drift devnet.
    const spotIndex = action === 'deposit' || action === 'withdraw'
      ? await verifiedWrappedSolMarket(connection, client) : null;
    // Resolve the actual subscribed SOL perpetual market rather than assuming
    // a devnet index that may have changed with deployments/configuration.
    const perpSelection = action === 'long' || action === 'short' || action === 'cancel'
      ? client.getMarketIndexAndType('SOL-PERP') : undefined;
    const perpIndex = perpSelection?.marketIndex;
    if ((action === 'long' || action === 'short' || action === 'cancel') &&
        (perpIndex === undefined || !client.getPerpMarketAccount(perpIndex))) {
      throw new Error('SOL-PERP is not currently subscribed on the selected Drift devnet program. Trading is disabled; no transaction was sent.');
    }
    let signature: string;
    let description: string;
    if (action === 'initialize') {
      [signature] = await client.initializeUserAccount();
      description = 'Drift devnet user-account initialization';
    } else if (action === 'deposit') {
      const { tokenAccount } = await prepareWrappedSolDeposit(connection, wallet, units!);
      try {
        signature = await client.deposit(new sdk.BN(units!.toString()), spotIndex!, tokenAccount, 0);
      } catch (error) {
        throw new Error(`Drift did not confirm the collateral deposit. Any wSOL prepared in your wallet remains yours and can be unwrapped in the Collateral tab. ${meaningfulDriftError(error)}`);
      }
      description = 'Deposited verified wSOL collateral into your personal Drift devnet account';
    } else if (action === 'withdraw') {
      // reduceOnly=true: never create a spot borrow to fund a withdrawal.
      // Fail early if account has no SOL deposit balance. Protocol margin rules
      // may still prevent the requested amount even when balance is sufficient.
      const available = client.getUser(0).getTokenAmount(spotIndex!);
      if (!available || BigInt(available.toString()) < units!) {
        throw new Error('Your Drift account does not have this much deposited wSOL. No withdrawal was sent.');
      }
      const { tokenAccount } = await ensureWrappedSolDestination(connection, wallet);
      signature = await client.withdraw(new sdk.BN(units!.toString()), spotIndex!, tokenAccount, true, 0);
      description = 'Withdrew wSOL collateral to your wallet token account (unwrap separately to receive native SOL)';
    } else if (action === 'cancel') {
      signature = await client.cancelOrders(sdk.MarketType.PERP, perpIndex!);
      description = 'Requested cancellation of outstanding SOL-PERP devnet orders';
    } else {
      const oracle = client.getOracleDataForPerpMarket(perpIndex!);
      const rawPrice = BigInt(oracle.price.toString());
      const cap = boundedLimitPrice(rawPrice, action);
      const market = client.getPerpMarketAccount(perpIndex!);
      if (!market) throw new Error('SOL-PERP market unavailable on devnet.');
      // Drift error 6050 (0x17a2) is InvalidOrderIOC on the previously
      // encoded limit+IOC combination. A normal bounded limit order is
      // supported here, but it MAY remain open until a user cancels it.
      // Never claim an order was immediately executed or fully filled.
      const freeCollateral = client.getUser(0).getFreeCollateral();
      if (freeCollateral.lte(new sdk.BN(0))) {
        throw new Error('Your Drift account has no verified free collateral. Deposit supported devnet collateral before placing an order. No order was sent.');
      }
      const params = sdk.getLimitOrderParams({
        marketType: sdk.MarketType.PERP,
        marketIndex: perpIndex!,
        direction: action === 'long' ? sdk.PositionDirection.LONG : sdk.PositionDirection.SHORT,
        baseAssetAmount: new sdk.BN(units!.toString()),
        price: new sdk.BN(cap.toString()),
        // Do NOT set the rejected IOC bit flag; this is a regular LIMIT
        // order, which may rest on Drift. The UI explicitly explains this.
      });
      signature = await client.placePerpOrder(params);
      description = `Submitted ${action.toUpperCase()} SOL-PERP bounded LIMIT order on Drift devnet (1% oracle guard). May rest unfilled until cancelled; verify its actual order status.`;
    }
    const confirmed = await waitForVerifiedSignature(connection, signature);
    return { signature, confirmed, description, userAccount: userId.toBase58() };
  } catch (error) {
    throw new Error(meaningfulDriftError(error));
  } finally {
    await client.unsubscribe().catch(() => undefined);
  }
}
