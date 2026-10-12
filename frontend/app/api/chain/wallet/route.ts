import {NextRequest,NextResponse} from 'next/server';
import {PublicKey} from '@solana/web3.js';
import {TESTNET_GENESIS_HASH,TESTNET_RPC_FALLBACK} from '@/lib/testnet-sol';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const HEADERS={'Cache-Control':'no-store'};
const RPC=process.env.NEXT_PUBLIC_TESTNET_RPC_URL?.trim()||TESTNET_RPC_FALLBACK;
async function call(method:string,params:unknown[]){
 const r=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(6500),cache:'no-store'});
 if(!r.ok)throw Error('Testnet RPC not available');
 const p:unknown=await r.json();
 if(!p||typeof p!=='object'||!('result' in p)||'error' in p)throw Error('Testnet RPC returned an error');
 return p.result;
}
export async function POST(request:NextRequest){
 let input:unknown;
 try{input=await request.json();}catch{return NextResponse.json({message:'Send a public wallet address.'},{status:400,headers:HEADERS});}
 const address=input&&typeof input==='object'&&'address' in input?input.address:null;
 let wallet:PublicKey;
 try{if(typeof address!=='string')throw Error();wallet=new PublicKey(address);if(wallet.toBytes().length!==32)throw Error();}
 catch{return NextResponse.json({message:'Enter a public Solana address; never a private key.'},{status:400,headers:HEADERS});}
 try{
  const hash=await call('getGenesisHash',[]);
  if(hash!==TESTNET_GENESIS_HASH)throw Error('The configured RPC is not Solana testnet.');
  const reply=await call('getBalance',[wallet.toBase58(),{commitment:'confirmed'}]);
  if(!reply||typeof reply!=='object'||!('value' in reply)||typeof reply.value!=='number')throw Error('Balance unavailable');
  return NextResponse.json({network:'testnet',address:wallet.toBase58(),status:'verified',nativeSol:reply.value/1e9,readOnly:true},{headers:HEADERS});
 }catch{return NextResponse.json({network:'testnet',status:'unavailable',message:'Testnet RPC balance could not be verified.'},{status:503,headers:HEADERS});}
}
