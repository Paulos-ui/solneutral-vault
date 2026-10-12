/**
 * SolNeutral SOL Testnet wallet reserve.
 * Not a vault or custodial deposit: the connected wallet owns its wSOL ATA.
 * No program deployment, no operator custody, no synthetic assets.
 */
import {SystemProgram,Transaction, type Connection, type PublicKey, type TransactionInstruction} from '@solana/web3.js';
import type {AnchorWallet} from '@solana/wallet-adapter-react';
import {
 createAssociatedTokenAccountIdempotentInstruction,
 createCloseAccountInstruction,
 createSyncNativeInstruction,
 getAccount,
 getAssociatedTokenAddressSync,
 NATIVE_MINT, TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export const TESTNET_RPC_FALLBACK = 'https://api.testnet.solana.com';
export const TESTNET_GENESIS_HASH = '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY';
const LAMPORTS_PER_SOL_BIG = 1_000_000_000n;

export function assertTestnetGenesis(hash:string):void {
 if(hash!==TESTNET_GENESIS_HASH) throw new Error('Wrong Solana network. Switch your wallet and RPC to SOLANA TESTNET. No transaction was sent.');
}
export function parseTestSolAmount(value:string):bigint {
 const clean=value.trim();
 if(!/^(?:0|[1-9]\d{0,1})(?:\.\d{1,9})?$/.test(clean)) throw new Error('Enter a SOL amount up to 99 with at most nine decimals.');
 const [whole,fraction='']=clean.split('.');
 const raw=BigInt(whole)*LAMPORTS_PER_SOL_BIG+BigInt(fraction.padEnd(9,'0'));
 if(raw<1_000_000n||raw>10_000_000_000n) throw new Error('Choose an amount from 0.001 to 10 test SOL.');
 return raw;
}
export function testSolString(raw:bigint):string {
 const sign=raw<0n?'-':'';
 const abs=raw<0n?-raw:raw;
 const remainder=(abs%LAMPORTS_PER_SOL_BIG).toString().padStart(9,'0').replace(/0+$/,'');
 return `${sign}${abs/LAMPORTS_PER_SOL_BIG}${remainder?'.'+remainder:''}`;
}
export type TestnetReserveSnapshot={walletLamports:bigint;reservedLamports:bigint;reserveAccount:string;reserveExists:boolean;wallet:string};
export async function readTestnetReserve(connection:Connection,owner:PublicKey):Promise<TestnetReserveSnapshot>{
 assertTestnetGenesis(await connection.getGenesisHash());
 const ata=getAssociatedTokenAddressSync(NATIVE_MINT,owner,false,TOKEN_PROGRAM_ID);
 const [balance,info]=await Promise.all([connection.getBalance(owner,'confirmed'),connection.getAccountInfo(ata,'confirmed')]);
 if(!info)return {walletLamports:BigInt(balance),reservedLamports:0n,reserveAccount:ata.toBase58(),reserveExists:false,wallet:owner.toBase58()};
 if(!info.owner.equals(TOKEN_PROGRAM_ID))throw Error('Reserve address is not owned by the SPL Token Program.');
 const token=await getAccount(connection,ata,'confirmed',TOKEN_PROGRAM_ID);
 if(!token.owner.equals(owner)||!token.mint.equals(NATIVE_MINT)||!token.isNative) throw Error('Unexpected reserve account owner or mint. Transaction blocked.');
 return {walletLamports:BigInt(balance),reservedLamports:token.amount,reserveAccount:ata.toBase58(),reserveExists:true,wallet:owner.toBase58()};
}
async function signAndConfirm(connection:Connection,wallet:AnchorWallet,instructions:TransactionInstruction[]):Promise<string>{
 assertTestnetGenesis(await connection.getGenesisHash());
 const {blockhash,lastValidBlockHeight}=await connection.getLatestBlockhash('confirmed');
 const transaction=new Transaction({feePayer:wallet.publicKey,recentBlockhash:blockhash}).add(...instructions);
 const signed=await wallet.signTransaction(transaction);
 const signature=await connection.sendRawTransaction(signed.serialize(),{skipPreflight:false});
 const status=await connection.confirmTransaction({signature,blockhash,lastValidBlockHeight},'confirmed');
 if(status.value.err)throw Error(`The signed testnet transaction failed. Inspect signature ${signature} before retrying.`);
 return signature;
}
export async function depositSolToWalletReserve(connection:Connection,wallet:AnchorWallet,amount:string):Promise<{signature:string;previous:bigint;expected:bigint}>{
 const lamports=parseTestSolAmount(amount);
 const before=await readTestnetReserve(connection,wallet.publicKey);
 // Fees + potential ATA rent. Do not drain users' native SOL for a token account.
 if(before.walletLamports<lamports+20_000_000n)throw Error('Not enough testnet SOL. Keep at least 0.02 SOL available for rent and network fees.');
 const ata=getAssociatedTokenAddressSync(NATIVE_MINT,wallet.publicKey,false,TOKEN_PROGRAM_ID);
 const signature=await signAndConfirm(connection,wallet,[
  createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey,ata,wallet.publicKey,NATIVE_MINT,TOKEN_PROGRAM_ID),
  SystemProgram.transfer({fromPubkey:wallet.publicKey,toPubkey:ata,lamports:Number(lamports)}),
  createSyncNativeInstruction(ata,TOKEN_PROGRAM_ID),
 ]);
 return {signature,previous:before.reservedLamports,expected:before.reservedLamports+lamports};
}
export async function withdrawAllFromWalletReserve(connection:Connection,wallet:AnchorWallet):Promise<{signature:string;previous:bigint}>{
 const before=await readTestnetReserve(connection,wallet.publicKey);
 if(!before.reserveExists||before.reservedLamports===0n)throw Error('Your testnet SOL reserve is empty.');
 if(before.walletLamports<5_000_000n)throw Error('Keep a small amount of testnet SOL for the transaction fee.');
 const ata=getAssociatedTokenAddressSync(NATIVE_MINT,wallet.publicKey,false,TOKEN_PROGRAM_ID);
 const signature=await signAndConfirm(connection,wallet,[createCloseAccountInstruction(ata,wallet.publicKey,wallet.publicKey,[],TOKEN_PROGRAM_ID)]);
 return {signature,previous:before.reservedLamports};
}
export async function requestTestnetSol(connection:Connection,owner:PublicKey):Promise<string>{
 assertTestnetGenesis(await connection.getGenesisHash());
 const signature=await connection.requestAirdrop(owner,500_000_000);
 // Airdrop service may be rate-limited; don't state success before confirmation.
 const tx=await connection.getLatestBlockhash('confirmed');
 const confirmed=await connection.confirmTransaction({signature,blockhash:tx.blockhash,lastValidBlockHeight:tx.lastValidBlockHeight},'confirmed');
 if(confirmed.value.err)throw Error('Testnet faucet returned an unsuccessful transaction.');
 return signature;
}
export const testnetExplorerUrl=(signature:string)=>`https://explorer.solana.com/tx/${signature}?cluster=testnet`;
