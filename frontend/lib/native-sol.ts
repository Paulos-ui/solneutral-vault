/**
 * Wallet-owned native SOL / wrapped SOL transactions. DEVNET ONLY.
 * Never wraps additional SOL if the associated wSOL account already holds
 * sufficient funds from a previous, uncompleted Drift deposit attempt.
 */
import { SystemProgram, Transaction, type Connection, type PublicKey, type TransactionInstruction } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { assertDevnetGenesis } from './devnet-execution';
import { missingWrappedSolTopup } from './collateral-guards';

function wrappedAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(NATIVE_MINT, owner);
}

export async function signSendConfirm(connection: Connection, wallet: AnchorWallet, instructions: TransactionInstruction[]): Promise<string> {
  assertDevnetGenesis(await connection.getGenesisHash());
  const latest = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({feePayer:wallet.publicKey, recentBlockhash:latest.blockhash}).add(...instructions);
  const signed = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), {skipPreflight:false});
  const result = await connection.confirmTransaction({signature,blockhash:latest.blockhash,lastValidBlockHeight:latest.lastValidBlockHeight},'confirmed');
  if (result.value.err) throw new Error(`Devnet token-account transaction failed. Verify ${signature} before retrying.`);
  return signature;
}

export async function inspectWrappedSol(connection: Connection, owner: PublicKey): Promise<{tokenAccount:PublicKey;amount:bigint;exists:boolean}> {
  assertDevnetGenesis(await connection.getGenesisHash());
  const tokenAccount = wrappedAta(owner);
  const info = await connection.getAccountInfo(tokenAccount,'confirmed');
  if (!info) return {tokenAccount,amount:0n,exists:false};
  if (!info.owner.equals(TOKEN_PROGRAM_ID)) throw new Error('The wSOL token-account address is not owned by the SPL Token program.');
  const parsed = await getAccount(connection,tokenAccount,'confirmed');
  if (!parsed.owner.equals(owner) || !parsed.mint.equals(NATIVE_MINT)) throw new Error('Invalid wSOL account owner or mint.');
  return {tokenAccount,amount:parsed.amount,exists:true};
}

/** Prepare exactly the missing wSOL amount; if already funded, no wallet signature is needed. */
export async function prepareWrappedSolDeposit(
  connection: Connection, wallet: AnchorWallet, lamports: bigint,
): Promise<{tokenAccount:PublicKey;preparationSignature?:string;reusedLamports:bigint;newlyWrappedLamports:bigint}> {
  if (lamports<=0n || lamports>500_000_000n) throw new Error('Invalid devnet SOL wrapping amount.');
  const existing = await inspectWrappedSol(connection,wallet.publicKey);
  const missing = missingWrappedSolTopup(existing.amount,lamports);
  if (missing===0n) return {tokenAccount:existing.tokenAccount,reusedLamports:lamports,newlyWrappedLamports:0n};
  const balance = await connection.getBalance(wallet.publicKey,'confirmed');
  if (BigInt(balance)<missing+20_000_000n) throw new Error('Insufficient devnet SOL: reserve 0.02 SOL for fees and account rent.');
  const ixs:TransactionInstruction[]=[];
  if (!existing.exists) ixs.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey,existing.tokenAccount,wallet.publicKey,NATIVE_MINT,TOKEN_PROGRAM_ID));
  ixs.push(SystemProgram.transfer({fromPubkey:wallet.publicKey,toPubkey:existing.tokenAccount,lamports:Number(missing)}));
  ixs.push(createSyncNativeInstruction(existing.tokenAccount));
  const preparationSignature = await signSendConfirm(connection,wallet,ixs);
  return {tokenAccount:existing.tokenAccount,preparationSignature,reusedLamports:existing.amount,newlyWrappedLamports:missing};
}

export async function ensureWrappedSolDestination(
  connection:Connection,wallet:AnchorWallet,
):Promise<{tokenAccount:PublicKey;preparationSignature?:string}>{
  const existing=await inspectWrappedSol(connection,wallet.publicKey);
  if (existing.exists) return {tokenAccount:existing.tokenAccount};
  const preparationSignature=await signSendConfirm(connection,wallet,[createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey,existing.tokenAccount,wallet.publicKey,NATIVE_MINT,TOKEN_PROGRAM_ID)]);
  return {tokenAccount:existing.tokenAccount,preparationSignature};
}

/**
 * Recovery action: closes the user's canonical wSOL ATA and returns its entire
 * wSOL balance plus rent to the user's native SOL address. Cannot touch Drift funds.
 */
export async function unwrapWalletWsol(connection:Connection,wallet:AnchorWallet):Promise<{signature:string;unwrappedLamports:bigint}>{
  const existing=await inspectWrappedSol(connection,wallet.publicKey);
  if (!existing.exists || existing.amount<=0n) throw new Error('No wallet-owned wrapped SOL is available to unwrap.');
  const signature=await signSendConfirm(connection,wallet,[createCloseAccountInstruction(existing.tokenAccount,wallet.publicKey,wallet.publicKey)]);
  return {signature,unwrappedLamports:existing.amount};
}
