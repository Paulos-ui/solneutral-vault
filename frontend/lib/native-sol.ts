/**
 * SPL Token's native SOL mint uses wrapped-SOL token accounts, NOT a system
 * wallet address. Deposit/withdraw Drift SOL collateral through the wallet's
 * canonical associated token account for NATIVE_MINT.
 *
 * Every instruction is signed by the connected browser wallet. There are no
 * server private keys; the helpers are for Solana DEVNET only.
 */
import { SystemProgram, Transaction, type Connection, type PublicKey, type TransactionInstruction } from '@solana/web3.js';
import type { AnchorWallet } from '@solana/wallet-adapter-react';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { assertDevnetGenesis } from './devnet-execution';

function getWrappedSolAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(NATIVE_MINT, owner);
}

async function signSendConfirm(
  connection: Connection,
  wallet: AnchorWallet,
  instructions: TransactionInstruction[],
): Promise<string> {
  assertDevnetGenesis(await connection.getGenesisHash());
  const latest = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: latest.blockhash,
  }).add(...instructions);
  const signed = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  const result = await connection.confirmTransaction({
    signature,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }, 'confirmed');
  if (result.value.err) throw new Error(`Devnet token-account transaction failed: ${signature}`);
  return signature;
}

/**
 * Step 1/2 for Drift SOL collateral deposits. Creates the wSOL ATA (if needed),
 * transfers actual native SOL into it and syncs the token balance. A SECOND
 * wallet signature is then required to deposit that wSOL into Drift.
 * If Drift rejects the subsequent deposit, wSOL remains in the user-owned ATA.
 */
export async function prepareWrappedSolDeposit(
  connection: Connection,
  wallet: AnchorWallet,
  lamports: bigint,
): Promise<{ tokenAccount: PublicKey; preparationSignature: string }> {
  assertDevnetGenesis(await connection.getGenesisHash());
  if (lamports <= 0n || lamports > 500_000_000n) throw new Error('Invalid devnet SOL wrapping amount.');
  const tokenAccount = getWrappedSolAta(wallet.publicKey);
  const existing = await connection.getAccountInfo(tokenAccount, 'confirmed');
  if (existing && !existing.owner.equals(TOKEN_PROGRAM_ID)) throw new Error('Wrapped SOL destination is not owned by the SPL Token program.');
  const balance = await connection.getBalance(wallet.publicKey, 'confirmed');
  // Conservatively reserve space for ATA rent, network fees and retry overhead.
  const reservedLamports = 20_000_000;
  if (balance < Number(lamports) + reservedLamports) {
    throw new Error('Insufficient devnet SOL: keep at least 0.02 SOL for network fees and token-account rent.');
  }
  const instructions: TransactionInstruction[] = [];
  if (!existing) {
    instructions.push(createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      tokenAccount,
      wallet.publicKey,
      NATIVE_MINT,
  TOKEN_PROGRAM_ID,
    ));
  }
  instructions.push(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: tokenAccount,
    lamports: Number(lamports),
  }));
  instructions.push(createSyncNativeInstruction(tokenAccount));
  const preparationSignature = await signSendConfirm(connection, wallet, instructions);
  return { tokenAccount, preparationSignature };
}

/**
 * Drift withdrawals transfer wSOL to the owner's ATA, not native SOL directly.
 * The user may unwrap their wSOL separately in a wallet that supports it.
 */
export async function ensureWrappedSolDestination(
  connection: Connection,
  wallet: AnchorWallet,
): Promise<{ tokenAccount: PublicKey; preparationSignature?: string }> {
  assertDevnetGenesis(await connection.getGenesisHash());
  const tokenAccount = getWrappedSolAta(wallet.publicKey);
  const existing = await connection.getAccountInfo(tokenAccount, 'confirmed');
  if (existing && !existing.owner.equals(TOKEN_PROGRAM_ID)) throw new Error('Wrapped SOL destination is not owned by the SPL Token program.');
  if (existing) return { tokenAccount };
  const preparationSignature = await signSendConfirm(connection, wallet, [
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      tokenAccount,
      wallet.publicKey,
      NATIVE_MINT,
  TOKEN_PROGRAM_ID,
    ),
  ]);
  return { tokenAccount, preparationSignature };
}
