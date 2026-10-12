'use client';
import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { assertTestnetGenesis } from '@/lib/testnet-sol';

export type RecentSignature = { signature:string; blockTime:number|null; err: boolean; slot:number };
type AccountRead = { status:'disconnected'|'loading'|'verified'|'partial'|'failed'; sol:number|null; signatures:RecentSignature[]; historyAvailable:boolean; message:string; updatedAt:string|null };
const empty:AccountRead={status:'disconnected',sol:null,signatures:[],historyAvailable:false,message:'Connect a wallet to inspect its public testnet state.',updatedAt:null};

export function useSolNeutralLive(){
 const { publicKey,connected }=useWallet();
 const {connection}=useConnection();
 const [account,setAccount]=useState<AccountRead>(empty);
 const [nonce,setNonce]=useState(0);
 const refresh=useCallback(()=>setNonce(n=>n+1),[]);
 useEffect(()=>{
  if(!connected||!publicKey){setAccount(empty);return;}
  let disposed=false;
  setAccount(s=>({...s,status:'loading',message:'Verifying Solana testnet and loading public records…'}));
  (async()=>{
   try{
    const genesis=await connection.getGenesisHash();
    assertTestnetGenesis(genesis);
    const [balance,history]=await Promise.allSettled([
     connection.getBalance(publicKey,'confirmed'),
     connection.getSignaturesForAddress(publicKey,{limit:12},'confirmed'),
    ]);
    if(disposed)return;
    const sol=balance.status==='fulfilled'?balance.value/1e9:null;
    const signatures=history.status==='fulfilled'?history.value.map(item=>({signature:item.signature,blockTime:item.blockTime??null,err:item.err!==null,slot:item.slot})):[];
    setAccount({status:sol!==null?'verified':'partial',sol,signatures,historyAvailable:history.status==='fulfilled',updatedAt:new Date().toISOString(),message:sol!==null?'Verified public testnet wallet balance. SOL reserved as wallet-owned wSOL is reported separately.':'Testnet verified; balance RPC temporarily unavailable.'});
   }catch{
    if(!disposed)setAccount({status:'failed',sol:null,signatures:[],historyAvailable:false,message:'The RPC did not prove it is Solana testnet. No balances or transaction data are shown.',updatedAt:null});
   }
  })();
  return()=>{disposed=true};
 },[connected,publicKey,connection,nonce]);
 return {...account,address:publicKey?.toBase58()??null,connected,refresh};
}
