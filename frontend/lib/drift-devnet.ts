/**
 * Drift execution adapter: only invoked by explicit user clicks after wallet signature.
 * This interacts with a USER-OWNED DRIFT account, NOT the experimental SolNeutral vault.
 * DEVNET ONLY: mainnet is impossible through the exported transaction functions.
 */
import type { Connection } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import { prepareWrappedSolDeposit, ensureWrappedSolDestination, unwrapWalletWsol } from './native-sol';
import { validateQuoteSpotMarket, meaningfulDriftError } from './collateral-guards';
import {
  assertDevnetGenesis, boundedLimitPrice,
  validateDevnetAmount, decimalToUnits,
} from './devnet-execution';

export type ExecutionAction = 'initialize' | 'deposit' | 'withdraw' | 'long' | 'short' | 'cancel' | 'unwrap';
export type CollateralAsset = 'usdc' | 'wsol';
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

/** Verify an actual Drift devnet wSOL spot market before funds move.
 * The SDK can omit a market from its subscribed preset even when the PDA
 * exists, so inspect the on-chain canonical SOL market (#1) as a fallback.
 * Never infer support merely because the wallet holds wSOL.
 */
async function verifiedWrappedSolMarket(connection: Connection, client: Awaited<ReturnType<typeof openDevnetClient>>['client']) {
  const { NATIVE_MINT } = await import('@solana/spl-token');
  const { getSpotMarketPublicKeySync } = await import('@drift-labs/sdk');
  const subscribedCandidates = client.getSpotMarketAccounts()
    .filter(m => m.mint.toBase58() === NATIVE_MINT.toBase58())
    .map(m => m.marketIndex);
  const candidateIndices = [...new Set([1, ...subscribedCandidates])];
  const matches: number[] = [];
  for (const index of candidateIndices) {
    const marketPda = getSpotMarketPublicKeySync(client.program.programId, index);
    const chainAccount = await connection.getAccountInfo(marketPda, 'confirmed');
    if (!chainAccount) continue;
    if (!chainAccount.owner.equals(client.program.programId)) {
      throw new Error('Drift wSOL candidate is not owned by the configured devnet program. No funds moved.');
    }
    const market = await client.program.account.spotMarket.fetch(marketPda);
    if (market.marketIndex !== index) {
      throw new Error('Drift wSOL spot market index does not match its derived PDA. No funds moved.');
    }
    if (market.mint.toBase58() === NATIVE_MINT.toBase58()) {
      if (market.decimals !== 9) throw new Error('Drift wSOL market precision disagrees with native wSOL. No funds moved.');
      matches.push(index);
    }
  }
  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? 'This Drift devnet program has no verified wSOL collateral market at the subscribed or standard SOL index. No SOL was wrapped or deposited. You can unwrap the existing wallet wSOL.'
      : 'Multiple verified wSOL spot markets were found; deposits are disabled rather than guessing.');
  }
  const index = matches[0];
  if (!client.getSpotMarketAccount(index)) {
    const added = await client.accountSubscriber.addSpotMarket(index);
    if (added) await client.accountSubscriber.fetch();
    if (!added || !client.getSpotMarketAccount(index)) {
      throw new Error('Drift wSOL market exists, but the SDK could not load it. Retry with a healthy devnet RPC before signing.');
    }
  }
  if (client.getSpotMarketAccount(index)?.mint.toBase58() !== NATIVE_MINT.toBase58()) {
    throw new Error('Subscribed wSOL market mint disagrees with the verified on-chain mint. Deposits disabled.');
  }
  return index;
}

/** Resolve the canonical Drift quote market from the deployed program, not from
 * the subset of markets loaded by the SDK subscription or a stale SDK mint.
 * Every caller must independently confirm PDA ownership, index, mint and decimals.
 * Nothing in this function signs a transaction.
 */
async function verifiedUsdcMarket(
  connection: Connection,
  client: Awaited<ReturnType<typeof openDevnetClient>>['client'],
) {
  const { getSpotMarketPublicKeySync } = await import('@drift-labs/sdk');
  const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
  const index = 0; // Drift's canonical quote spot market.
  const pda = getSpotMarketPublicKeySync(client.program.programId, index);
  const chainAccount = await connection.getAccountInfo(pda, 'confirmed');
  if (!chainAccount || !chainAccount.owner.equals(client.program.programId)) {
    throw new Error('The Drift quote spot market (index 0) could not be verified on this devnet RPC. No collateral transaction was sent.');
  }
  // Decode the *same on-chain PDA* with Drift's IDL. A subscribed market list
  // may be empty/incomplete without the market actually being absent.
  const market = await client.program.account.spotMarket.fetch(pda);
  const mintAddress = market.mint.toBase58();
  validateQuoteSpotMarket({marketIndex:market.marketIndex, mint:mintAddress, decimals:market.decimals});

  const mint = market.mint;
  const mintInfo = await connection.getParsedAccountInfo(mint, 'confirmed');
  if (!mintInfo.value || !mintInfo.value.owner.equals(TOKEN_PROGRAM_ID) ||
      !('parsed' in mintInfo.value.data) || mintInfo.value.data.parsed?.type !== 'mint') {
    throw new Error(`Drift quote market #0 points to a mint (${mintAddress}) that is not a verified SPL Token mint. No transfer was sent.`);
  }
  if (Number(mintInfo.value.data.parsed.info.decimals) !== market.decimals) {
    throw new Error('Drift quote market decimals disagree with the token mint. Transfers are disabled.');
  }
  // Market 0 must be subscribed when composing Drift deposit/withdraw
  // instructions. Dynamic subscription avoids missing markets in SDK presets.
  if (!client.getSpotMarketAccount(index)) {
    const added = await client.accountSubscriber.addSpotMarket(index);
    if (added) await client.accountSubscriber.fetch();
    if (!added || !client.getSpotMarketAccount(index)) {
      throw new Error('Drift quote market exists on-chain but the SDK could not load it. Retry using a healthy devnet RPC. No transfer was sent.');
    }
  }
  if (client.getSpotMarketAccount(index)?.mint.toBase58() !== mintAddress) {
    throw new Error('The subscribed Drift market and on-chain quote mint disagree. Transfers are disabled.');
  }
  return {marketIndex:index, mint, decimals:market.decimals};
}

/** Read wallet-owned devnet USDC. This is NOT Drift-deposited collateral. */
export async function inspectDriftDevnetUsdc(connection: Connection, wallet: AnchorWallet) {
  const {client}=await openDevnetClient(connection,wallet);
  try {
    const spot=await verifiedUsdcMarket(connection,client);
    const {getAssociatedTokenAddressSync,getAccount,TOKEN_PROGRAM_ID}=await import('@solana/spl-token');
    const address=getAssociatedTokenAddressSync(spot.mint,wallet.publicKey);
    const tokenInfo=await connection.getAccountInfo(address,'confirmed');
    if (!tokenInfo) return {mint:spot.mint.toBase58(),amount:0n};
    if (!tokenInfo.owner.equals(TOKEN_PROGRAM_ID)) throw new Error('Wallet quote token account has the wrong token program.');
    const token=await getAccount(connection,address,'confirmed');
    if (!token.mint.equals(spot.mint)||!token.owner.equals(wallet.publicKey)) throw new Error('Wallet quote token account does not match the verified Drift market mint.');
    return {mint:spot.mint.toBase58(),amount:token.amount};
  } finally {await client.unsubscribe().catch(()=>undefined);}
}

/** Explicit, read-only readiness check for the exact Drift devnet quote asset.
 * Does not request a signature or move any tokens. The market mint is read
 * from Drift's subscribed on-chain account, not inferred from a faucet name.
 */
export type DriftUsdcReadiness = {
  mint: string;
  marketIndex: number;
  decimals: number;
  walletTokenAccount: string;
  walletAmount: string;
  driftDepositedAmount: string | null;
  userAccountExists: boolean;
};

export async function inspectDriftDevnetUsdcReadiness(
  connection: Connection,
  wallet: AnchorWallet,
): Promise<DriftUsdcReadiness> {
  const { client, sdk, config } = await openDevnetClient(connection, wallet);
  try {
    const spot = await verifiedUsdcMarket(connection, client);
    const { getAssociatedTokenAddressSync, getAccount } = await import('@solana/spl-token');
    const { PublicKey } = await import('@solana/web3.js');
    const associated = getAssociatedTokenAddressSync(spot.mint, wallet.publicKey);
    const accountInfo = await connection.getAccountInfo(associated, 'confirmed');
    // A missing ATA means zero. An existing ATA with an invalid owner MUST
    // surface as an error, never silently masquerade as a zero token balance.
    if (accountInfo && !accountInfo.owner.equals((await import('@solana/spl-token')).TOKEN_PROGRAM_ID)) {
      throw new Error('The derived wallet USDC account is not owned by the SPL Token program.');
    }
    const token = accountInfo ? await getAccount(connection, associated, 'confirmed') : null;
    if (token && (!token.mint.equals(spot.mint) || !token.owner.equals(wallet.publicKey))) {
      throw new Error('Wallet token account owner/mint mismatch. Collateral actions disabled.');
    }
    const userId = sdk.getUserAccountPublicKeySync(
      new PublicKey(config.DRIFT_PROGRAM_ID), wallet.publicKey, 0,
    );
    const userInfo = await connection.getAccountInfo(userId, 'confirmed');
    const exists = Boolean(userInfo);
    let deposited: string | null = null;
    if (exists) {
      if (!userInfo!.owner.equals(new PublicKey(config.DRIFT_PROGRAM_ID))) {
        throw new Error('Drift user account owner does not match the devnet program.');
      }
      if (!(await client.addUser(0))) {
        throw new Error('Drift user account exists but could not be loaded. Retry the check.');
      }
      deposited = client.getUser(0).getTokenAmount(spot.marketIndex).toString();
    }
    return {
      mint: spot.mint.toBase58(),
      marketIndex: spot.marketIndex,
      decimals: spot.decimals,
      walletTokenAccount: associated.toBase58(),
      walletAmount: (token?.amount ?? 0n).toString(),
      driftDepositedAmount: deposited,
      userAccountExists: exists,
    };
  } finally {
    await client.unsubscribe().catch(() => undefined);
  }
}

/** Read-only validation before presenting a native-SOL funding path.
 * Only accepts a verified deployed Drift wSOL market. Never wraps on inspection.
 */
export type DriftWsolReadiness = { marketIndex:number; walletSolLamports:string; walletWsolLamports:string; depositedWsolLamports:string|null };
export async function inspectDriftDevnetWsolReadiness(connection:Connection, wallet:AnchorWallet):Promise<DriftWsolReadiness> {
  const {client,sdk,config}=await openDevnetClient(connection,wallet);
  try {
    const marketIndex=await verifiedWrappedSolMarket(connection,client);
    const {inspectWrappedSol}=await import('./native-sol');
    const [lamports,wrapped]=await Promise.all([connection.getBalance(wallet.publicKey,'confirmed'),inspectWrappedSol(connection,wallet.publicKey)]);
    const userId=sdk.getUserAccountPublicKeySync(new (await import('@solana/web3.js')).PublicKey(config.DRIFT_PROGRAM_ID),wallet.publicKey,0);
    const account=await connection.getAccountInfo(userId,'confirmed');
    let depositedWsolLamports:string|null=null;
    if(account){
      if(!account.owner.equals(client.program.programId))throw new Error('Drift user account owner mismatch.');
      if(!(await client.addUser(0)))throw new Error('Unable to load your Drift user account.');
      depositedWsolLamports=client.getUser(0).getTokenAmount(marketIndex).toString();
    }
    return {marketIndex,walletSolLamports:String(lamports),walletWsolLamports:wrapped.amount.toString(),depositedWsolLamports};
  } finally { await client.unsubscribe().catch(()=>undefined); }
}

/** All actions require a connected wallet, devnet RPC, small validated sizes and separate user confirmation. */
export async function executeDriftDevnetAction(
  connection: Connection,
  wallet: AnchorWallet,
  action: ExecutionAction,
  amountText: string,
  collateralAsset: CollateralAsset = 'usdc',
): Promise<ExecutionResult> {
  const units = action === 'initialize' || action === 'cancel' || action === 'unwrap' ? null :
    ((action === 'deposit' || action === 'withdraw') && collateralAsset === 'usdc' ? decimalToUnits(amountText, 6) : validateDevnetAmount(action, amountText));
  if (units !== null && (action === 'deposit' || action === 'withdraw') && collateralAsset === 'usdc' && units > 100_000_000n) throw new Error('Demo limit: maximum 100 test USDC per transaction.');
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
    const spot = action === 'deposit' || action === 'withdraw'
      ? (collateralAsset === 'usdc'
        ? await verifiedUsdcMarket(connection, client)
        : { marketIndex: await verifiedWrappedSolMarket(connection, client), mint: null, decimals: 9 }) : null;
    const spotIndex = spot?.marketIndex ?? null;
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
      let tokenAccount;
      if (collateralAsset === 'usdc') {
        const { getAssociatedTokenAddressSync, getAccount } = await import('@solana/spl-token');
        tokenAccount = getAssociatedTokenAddressSync(spot!.mint!, wallet.publicKey);
        const accountInfo = await connection.getAccountInfo(tokenAccount, 'confirmed');
        if (!accountInfo) throw new Error('No wallet token account exists for the EXACT Drift devnet USDC mint. No transaction was sent.');
        if (!accountInfo.owner.equals((await import('@solana/spl-token')).TOKEN_PROGRAM_ID)) throw new Error('Wallet USDC token account is not owned by the SPL Token program. No transaction was sent.');
        const token = await getAccount(connection, tokenAccount, 'confirmed');
        if (!token.owner.equals(wallet.publicKey) || !token.mint.equals(spot!.mint!) || token.amount < units!)
          throw new Error('Not enough correctly minted test USDC in this wallet. Obtain the exact Drift devnet USDC mint shown in Collateral and refresh. No transaction was sent.');
      } else {
        ({ tokenAccount } = await prepareWrappedSolDeposit(connection, wallet, units!));
      }
      try {
        signature = await client.deposit(new sdk.BN(units!.toString()), spotIndex!, tokenAccount, 0);
      } catch (error) {
        throw new Error(`Drift deposit failed before a successful confirmation. ${collateralAsset === 'wsol' ? 'Any prepared wSOL remains in your wallet and can be unwrapped. ' : 'Wallet-owned USDC remains in your wallet unless an on-chain transaction proves otherwise. '}${meaningfulDriftError(error)}`);
      }
      description = `Submitted ${collateralAsset === 'usdc' ? 'USDC' : 'wSOL'} collateral to your personal Drift devnet account`;
    } else if (action === 'withdraw') {
      // reduceOnly=true: never create a spot borrow to fund a withdrawal.
      // Fail early if account has no SOL deposit balance. Protocol margin rules
      // may still prevent the requested amount even when balance is sufficient.
      const available = client.getUser(0).getTokenAmount(spotIndex!);
      if (!available || BigInt(available.toString()) < units!) {
        throw new Error(`Your Drift account has insufficient deposited ${collateralAsset === 'usdc' ? 'USDC' : 'wSOL'} for this withdrawal. No transaction was sent.`);
      }
      let tokenAccount;
      if (collateralAsset === 'usdc') {
        const { getAssociatedTokenAddressSync, getAccount, TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
        tokenAccount = getAssociatedTokenAddressSync(spot!.mint!, wallet.publicKey);
        const accountInfo = await connection.getAccountInfo(tokenAccount, 'confirmed');
        if (!accountInfo) throw new Error('Create your wallet devnet USDC token account before withdrawal (receive a small amount of the correct test USDC first). No withdrawal was sent.');
        if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) throw new Error('USDC withdrawal destination is not an SPL Token account. No transaction was sent.');
        const dest = await getAccount(connection, tokenAccount, 'confirmed');
        if (!dest.owner.equals(wallet.publicKey) || !dest.mint.equals(spot!.mint!)) throw new Error('USDC withdrawal destination owner/mint mismatch. No transaction was sent.');
      } else {
        ({ tokenAccount } = await ensureWrappedSolDestination(connection, wallet));
      }
      signature = await client.withdraw(new sdk.BN(units!.toString()), spotIndex!, tokenAccount, true, 0);
      description = `Withdrew ${collateralAsset === 'usdc' ? 'USDC' : 'wSOL'} collateral to your wallet's matching token account`;
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
