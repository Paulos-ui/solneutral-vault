'use client';
import {useCallback,useEffect,useState} from 'react';
import {useAnchorWallet,useConnection,useWallet} from '@solana/wallet-adapter-react';
import {ConnectWallet} from '@/components/ConnectWallet';
import {SolPriceChart} from '@/components/SolPriceChart';
import {
  depositSolToWalletReserve,readTestnetReserve,requestTestnetSol,testnetExplorerUrl,
  withdrawAllFromWalletReserve,type TestnetReserveSnapshot,
} from '@/lib/testnet-sol';

type Action='deposit'|'withdraw';
type Proof={action:Action;signature:string;status:'observed'|'pending';detail:string};
export function SolReserve(){
 const {connection}=useConnection();
 const {publicKey,connected}=useWallet();
 const signer=useAnchorWallet();
 const [data,setData]=useState<TestnetReserveSnapshot|null>(null);
 const [status,setStatus]=useState<'idle'|'loading'|'verified'|'error'>('idle');
 const [amount,setAmount]=useState('0.05');
 const [action,setAction]=useState<Action>('deposit');
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [proof,setProof]=useState<Proof|null>(null);
 const [approved,setApproved]=useState(false);
 const refresh=useCallback(async()=>{
  if(!connected||!publicKey){setData(null);setStatus('idle');return null;}
  setStatus('loading');
  try{const snapshot=await readTestnetReserve(connection,publicKey);setData(snapshot);setStatus('verified');setNotice('');return snapshot;}
  catch(err){setStatus('error');setData(null);setNotice(err instanceof Error?err.message:'Unable to verify the testnet RPC.');return null;}
 },[connected,publicKey,connection]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{setProof(null);setApproved(false);setNotice('');},[publicKey?.toBase58()]);
 const displayed=data?.walletLamports!==undefined?Number(data.walletLamports)/1e9:null;
 const reserved=data?.reservedLamports!==undefined?Number(data.reservedLamports)/1e9:null;
 async function execute(){
  if(!signer||!publicKey||!approved||busy||status!=='verified')return;
  setBusy(true);setNotice('');setProof(null);
  try{
    const result=action==='deposit'
     ?await depositSolToWalletReserve(connection,signer,amount)
     :await withdrawAllFromWalletReserve(connection,signer);
    const after=await refresh();
    const observed=Boolean(after&&(action==='deposit'
     ?after.reservedLamports===(result as Awaited<ReturnType<typeof depositSolToWalletReserve>>).expected
     :after.reservedLamports===0n&&!after.reserveExists));
    setProof({action,signature:result.signature,status:observed?'observed':'pending',detail:observed
      ?action==='deposit'?'Confirmed: matching testnet SOL is now in your wallet-owned wSOL reserve.':'Confirmed: reserve closed and SOL returned to your wallet.'
      :'Transaction confirmed. The latest RPC balance has not reconciled yet. Refresh to verify.'});
    setApproved(false);
  }catch(err){setNotice(err instanceof Error?err.message:'Transaction could not be completed.');}
  finally{setBusy(false);}
 }
 async function faucet(){
  if(!publicKey||busy)return;setBusy(true);setNotice('');
  try{await requestTestnetSol(connection,publicKey);await refresh();setNotice('Testnet faucet request confirmed. Your on-chain wallet balance has been refreshed.');}
  catch(err){setNotice(`Testnet airdrop unavailable: ${err instanceof Error?err.message:'Provider rejected request'}. The public testnet faucet may be rate-limited.`);}
  finally{setBusy(false);}
 }
 return <div className="sn-reserve">
   <section className="sn-dash-card sn-reserve-hero">
    <div className="sn-dash-card-head"><div><span className="sn-eyebrow"><i/> SOLNEUTRAL · SOLANA TESTNET</span><h2>Personal SOL Reserve</h2><p>Deposit test SOL into your own wrapped SOL account. Withdraw it to your wallet whenever you choose.</p></div><span className="sn-dash-tag">WALLET OWNED</span></div>
    <div className="sn-reserve-balances"><article><span>Available SOL</span><strong>{displayed===null?'—':displayed.toFixed(5)}</strong><small>Native SOL in connected wallet</small></article><article><span>SOL in reserve</span><strong>{reserved===null?'—':reserved.toFixed(5)}</strong><small>Wallet-controlled wSOL token account</small></article><article><span>Network</span><strong>{status==='verified'?'Verified':status==='loading'?'Checking…':'Not verified'}</strong><small>Solana testnet only</small></article></div>
    {!connected?<div className="sn-reserve-connect"><p>Connect Phantom or Solflare and select <strong>Solana Testnet</strong> in wallet developer settings.</p><ConnectWallet/></div>:<div className="sn-reserve-tools"><button type="button" className="sn-plain-btn" disabled={busy} onClick={()=>void refresh()}>↻ Refresh balances</button><button type="button" className="sn-plain-btn" disabled={busy||status!=='verified'} onClick={()=>void faucet()}>Get 0.5 test SOL</button><button type="button" className="sn-plain-btn" onClick={()=>void navigator.clipboard.writeText(publicKey?.toBase58()??'')}>Copy wallet address</button></div>}
   </section>
   {connected&&<section className="sn-dash-card sn-reserve-action">
    <div className="sn-dash-card-head"><div><h2>Move your SOL</h2><p>One wallet approval. No USDC, Drift account, or operator-held funds.</p></div></div>
    <div className="sn-reserve-tabs" role="group" aria-label="Reserve action"><button type="button" className={action==='deposit'?'selected':''} onClick={()=>{setAction('deposit');setApproved(false);setNotice('');}}>↓ Deposit SOL</button><button type="button" className={action==='withdraw'?'selected':''} onClick={()=>{setAction('withdraw');setApproved(false);setNotice('');}}>↑ Withdraw SOL</button></div>
    {action==='deposit'?<label className="sn-reserve-label">Amount in test SOL <input type="text" inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} aria-label="SOL amount to reserve" placeholder="0.05"/><small>Minimum 0.001 SOL · Maximum 10 SOL per action · keep 0.02 SOL for network fees and rent.</small></label>:<div className="sn-reserve-all"><strong>Withdraw all {reserved===null?'—':reserved.toFixed(5)} SOL</strong><p>Closing the wSOL account returns its entire balance plus reclaimable account rent. Partial withdrawal is not supported in this version.</p></div>}
    <label className="sn-reserve-approve"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> I understand this is a wallet-owned wSOL reserve, not a yield-generating vault or investment.</label>
    <button type="button" className="sn-reserve-sign" disabled={busy||status!=='verified'||!approved||(action==='withdraw'&&(!data||data.reservedLamports===0n))} onClick={()=>void execute()}>{busy?'Waiting for network…':action==='deposit'?'Review & sign deposit':'Review & sign withdraw all'} ↗</button>
    {notice&&<p className="sn-reserve-alert" role="status">{notice}</p>}
    {proof&&<div className="sn-reserve-proof" role="status"><strong>{proof.status==='observed'?'Verified on testnet':'Confirmation received'}</strong><p>{proof.detail}</p><a href={testnetExplorerUrl(proof.signature)} target="_blank" rel="noopener noreferrer">View transaction ↗</a></div>}
    <p className="sn-fineprint">Your reserve is the associated token account for Solana's native mint, controlled solely by your wallet. No trading, APY, or SolNeutral vault custody is involved. Testnet assets are not real assets.</p>
   </section>}
   <SolPriceChart/>
  </div>;
}
