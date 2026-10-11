/** Local validator / research ONLY. Requires built Anchor IDL and freshly synchronized keys. */
import * as anchor from '@coral-xyz/anchor';
import {assert} from 'chai';
import {createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY} from '@solana/web3.js';

describe('SolNeutral V3 localnet custody and shares — NOT MAINNET',()=>{
 const provider=anchor.AnchorProvider.env();
 anchor.setProvider(provider);
 const program=anchor.workspace.SolneutralV3 as anchor.Program;
 const wallet=provider.wallet as anchor.Wallet;
 let mint:PublicKey;
 let vault:PublicKey;
 let custody:PublicKey;
 let position:PublicKey;
 let userAsset:PublicKey;
 const oneMillion=new anchor.BN(1_000_000);
 before(async()=>{
  mint=await createMint(provider.connection,wallet.payer,wallet.publicKey,null,6);
  vault=PublicKey.findProgramAddressSync([Buffer.from('research_vault'),mint.toBuffer()],program.programId)[0];
  custody=PublicKey.findProgramAddressSync([Buffer.from('custody'),vault.toBuffer()],program.programId)[0];
  position=PublicKey.findProgramAddressSync([Buffer.from('user_shares'),vault.toBuffer(),wallet.publicKey.toBuffer()],program.programId)[0];
  const token=await getOrCreateAssociatedTokenAccount(provider.connection,wallet.payer,mint,wallet.publicKey);
  userAsset=token.address;
  await mintTo(provider.connection,wallet.payer,mint,userAsset,wallet.publicKey,5_000_000);
 });
 it('initializes a PDA-controlled six-decimal custody vault',async()=>{
  await program.methods.initialize().accounts({vault,assetCustody:custody,assetMint:mint,admin:wallet.publicKey,tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId,rent:SYSVAR_RENT_PUBKEY}).rpc();
  const data=await program.account.vaultState.fetch(vault) as any;
  assert.equal(data.admin.toBase58(),wallet.publicKey.toBase58());
  assert.equal(data.totalShares.toString(),'0');
 });
 it('rejects zero and under-minimum deposits',async()=>{
  try{await program.methods.deposit(new anchor.BN(1)).accounts({vault,assetCustody:custody,position,user:wallet.publicKey,userAsset,tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId}).rpc();assert.fail('Expected too-small rejection');}
  catch(e){assert.notMatch(String(e),'Expected too-small rejection')}
 });
 it('deposits actually transferred tokens and allocates shares',async()=>{
  const beforeAccount=await getAccount(provider.connection,custody);
  await program.methods.deposit(oneMillion).accounts({vault,assetCustody:custody,position,user:wallet.publicKey,userAsset,tokenProgram:TOKEN_PROGRAM_ID,systemProgram:SystemProgram.programId}).rpc();
  const after=await getAccount(provider.connection,custody);
  const shares=await program.account.userShares.fetch(position) as any;
  assert.equal(after.amount-beforeAccount.amount,1000000n);
  assert.equal(shares.shares.toString(),'1000000');
 });
 it('rejects unauthorized pause',async()=>{
  const other=anchor.web3.Keypair.generate();
  await provider.connection.requestAirdrop(other.publicKey,1_000_000_000).then(x=>provider.connection.confirmTransaction(x,'confirmed'));
  try{await program.methods.setPaused(true).accounts({vault,admin:other.publicKey}).signers([other]).rpc();assert.fail('Expected unauthorized rejection');}
  catch(e){assert.notMatch(String(e),'Expected unauthorized rejection')}
 });
 it('allows an admin pause without disabling withdrawals',async()=>{
  await program.methods.setPaused(true).accounts({vault,admin:wallet.publicKey}).rpc();
  await program.methods.withdraw(new anchor.BN(250000)).accounts({vault,assetCustody:custody,position,user:wallet.publicKey,userAsset,tokenProgram:TOKEN_PROGRAM_ID}).rpc();
  const shares=await program.account.userShares.fetch(position) as any;
  assert.equal(shares.shares.toString(),'750000');
 });
});
