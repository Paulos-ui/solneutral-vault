"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ConnectWallet } from './ConnectWallet';
import { Icon } from './Icons';
import { assertDevnetGenesis, explorerTransactionUrl, validateDevnetAmount } from '@/lib/devnet-execution';
import { executeDriftDevnetAction, inspectDriftDevnetAccount, type ExecutionAction, type ExecutionResult } from '@/lib/drift-devnet';

type ConnectionState = 'idle'|'checking'|'verified'|'unavailable';
const ACTIONS = [
  { id: 'initialize', label: 'Initialize', tagline: 'Open a Drift user subaccount' },
  { id: 'deposit', label: 'Deposit', tagline: 'SOL collateral → Drift account' },
  { id: 'withdraw', label: 'Withdraw', tagline: 'Drift collateral → your wallet' },
  { id: 'long', label: 'Long', tagline: 'SOL-PERP buy limit IOC order' },
  { id: 'short', label: 'Short', tagline: 'SOL-PERP sell limit IOC order' },
  { id: 'cancel', label: 'Cancel', tagline: 'Cancel SOL-PERP open orders' },
] as const;

function compact(addr: string){ return `${addr.slice(0,6)}…${addr.slice(-6)}`; }
function readableError(err:unknown){
  if(!(err instanceof Error)) return 'Transaction could not be completed.';
  if(/reject|denied|cancelled/i.test(err.message)) return 'The wallet rejected the transaction; no action was submitted.';
  return err.message.slice(0,450);
}

export function DriftTradingLab() {
  const { connection }=useConnection();
  const { publicKey, connected }=useWallet();
  const signer=useAnchorWallet();
  const [network,setNetwork]=useState<ConnectionState>('idle');
  const [genesis,setGenesis]=useState('');
  const [balance,setBalance]=useState<number|null>(null);
  const [driftAccount,setDriftAccount]=useState<{address:string;exists:boolean}|null>(null);
  const [action,setAction]=useState<ExecutionAction>('initialize');
  const [amount,setAmount]=useState('0.05');
  const [approved,setApproved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [pendingStep,setPendingStep]=useState('');
  const [error,setError]=useState('');
  const [result,setResult]=useState<ExecutionResult|null>(null);
  const reduceMotion=useReducedMotion();
  const enableExecution = process.env.NEXT_PUBLIC_ENABLE_DEVNET_TRADING !== 'false';
  const current = ACTIONS.find(a=>a.id===action)!;
  const noAmount=action==='initialize'||action==='cancel';
  const ready=Boolean(connected&&publicKey&&signer&&network==='verified'&&!busy&&enableExecution);

  const refresh=useCallback(async()=>{
    if(!connected||!publicKey||!signer){setNetwork('idle');setBalance(null);setDriftAccount(null);return;}
    setNetwork('checking');setError('');setDriftAccount(null);
    try{
      const hash=await connection.getGenesisHash();
      setGenesis(hash);
      assertDevnetGenesis(hash);
      const lamports=await connection.getBalance(publicKey,'confirmed');
      setBalance(lamports/1e9);
      setNetwork('verified');
      // Account read is independent; a temporary Drift SDK/indexer problem must not fake network status.
      try{
        const account=await inspectDriftDevnetAccount(connection,signer);
        setDriftAccount({address:account.address,exists:account.exists});
      }catch(err){setError(`Drift account lookup unavailable: ${readableError(err)}`);}
    }catch(err){setNetwork('unavailable');setError(readableError(err));}
  },[connected,publicKey,signer,connection]);
  useEffect(()=>{void refresh();},[refresh]);

  function choose(id:ExecutionAction){setAction(id);setApproved(false);setError('');setResult(null);setAmount(id==='long'||id==='short'?'0.01':'0.05');}
  async function submit(){
    if(!ready||!signer) return;
    if(!approved){setError('Review the action and tick the acknowledgement before signing.');return;}
    if(!noAmount){try{validateDevnetAmount(action as 'deposit'|'withdraw'|'long'|'short',amount);}catch(err){setError(readableError(err));return;}}
    setBusy(true);setError('');setResult(null);setApproved(false);
    setPendingStep('Checking devnet and preparing Drift transaction…');
    try{
      const receipt=await executeDriftDevnetAction(connection,signer,action,amount);
      setResult(receipt);
      setPendingStep(receipt.confirmed?'Confirmed on devnet. Read the signature below.':'Submitted; network confirmation is still unverified.');
      await refresh();
    }catch(err){setError(readableError(err));setPendingStep('Action was not verified as successful.');}
    finally{setBusy(false);}
  }
  return <section className="trade-lab-grid" aria-label="Drift devnet execution lab">
    <div className="trade-lab-main">
      <div className="trade-statusline"><span className="trade-live-dot"/> DEVNET / SIGNED EXECUTION <span>USER-CONTROLLED</span></div>
      <div className="trade-headline"><span className="micro-label">TRANSACTION ENGINE / 001</span><h2>YOUR KEYS.<br/><em>YOUR POSITIONS.</em></h2><p>Initialize your own Drift subaccount, deposit or withdraw test collateral, and place bounded SOL-PERP orders. Every action requires your wallet signature.</p></div>
      <div className="trade-stepper" aria-label="Transaction workflow">
        <span className={connected?'complete':''}>01 CONNECT</span><span className={network==='verified'?'complete':''}>02 VERIFY NETWORK</span><span className={driftAccount?.exists?'complete':''}>03 DRIFT ACCOUNT</span><span>04 SIGN & VERIFY</span>
      </div>
      <div className="trade-wallet-card">
        <div className="trade-card-top"><span>CONNECTED IDENTITY</span><span>{network==='verified'?'● DEVNET VERIFIED':network==='checking'?'CHECKING RPC':network==='unavailable'?'NETWORK REJECTED':'DISCONNECTED'}</span></div>
        <div className="trade-wallet-row"><div><strong>{publicKey?compact(publicKey.toBase58()):'— / CONNECT A WALLET'}</strong><p>{publicKey?'Wallet owns all signing authority. No key enters SolNeutral servers.':'Use Phantom or Solflare to continue.'}</p></div><ConnectWallet/></div>
        <div className="trade-wallet-metrics"><div><small>NATIVE DEVNET SOL</small><strong>{balance===null?'—':balance.toLocaleString('en-US',{maximumFractionDigits:6})}</strong></div><div><small>DRIFT USER ACCOUNT</small><strong>{driftAccount?(driftAccount.exists?'EXISTS':'NOT INITIALIZED'):'NOT VERIFIED'}</strong></div></div>
        <button className="trade-refresh" type="button" onClick={()=>void refresh()} disabled={!connected||busy}>REFRESH NETWORK & ACCOUNT <Icon name="arrowUp" size={13}/></button>
        {genesis&&<small className="trade-genesis">Cluster fingerprint: {compact(genesis)}</small>}
      </div>
      <div className="trade-actions-box">
        <div className="trade-card-top"><span>ACTION SELECTOR / SOL-PERP</span><span>DRIFT PROTOCOL · DEVNET</span></div>
        <div className="trade-action-tabs" role="group" aria-label="Select a devnet action">
          {ACTIONS.map(a=><button key={a.id} type="button" onClick={()=>choose(a.id)} className={action===a.id?'selected':''} aria-pressed={action===a.id}>{a.label}</button>)}
        </div>
        <div className="trade-action-detail"><div><span className="micro-label">CURRENT INSTRUCTION</span><strong>{current.tagline}</strong></div><span>{noAmount?'NO AMOUNT':'SOL'}</span></div>
        {!noAmount&&<label className="trade-amount-field">AMOUNT / SOL
          <input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={amount} onChange={e=>{setAmount(e.target.value);setApproved(false);}} placeholder="0.05" />
          <small>{action==='long'||action==='short'?'Max 0.1 SOL base size per order.':'Max 0.5 SOL per transaction.'}</small>
        </label>}
        {(action==='long'||action==='short')&&<p className="trade-market-limit"><Icon name="shield" size={16}/> Oracle-referenced limit price with 1% adverse-move guard and immediate-or-cancel. An accepted order can remain unfilled.</p>}
        {action==='withdraw'&&<p className="trade-market-limit"><Icon name="shield" size={16}/> Reduce-only spot withdrawal: no intentional collateral borrowing. Free collateral checks are enforced by Drift.</p>}
        <label className="trade-accept"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/><span>I understand this signs a <strong>real devnet transaction</strong> using test assets. This interacts with my own Drift account, not the SolNeutral vault. I have reviewed the network and amount.</span></label>
        <button className="trade-submit" type="button" disabled={!ready||!approved} onClick={()=>void submit()}>{busy?'AWAITING WALLET / NETWORK…':`REVIEW & SIGN ${action.toUpperCase()}`} <Icon name="arrowUp" size={17}/></button>
        {!enableExecution&&<p className="trade-warning">Trading is disabled by NEXT_PUBLIC_ENABLE_DEVNET_TRADING=false.</p>}
        {network==='unavailable'&&<p className="trade-warning">RPC network failed the devnet identity check. Transaction controls are locked.</p>}
        {error&&<p className="trade-warning" role="alert">{error}</p>}
        {pendingStep&&<p className="trade-progress" role="status">{pendingStep}</p>}
        {result&&<div className="trade-receipt"><div><span className="micro-label">TRANSACTION RECEIPT</span><strong>{result.confirmed?'CONFIRMED / DEVNET':'UNVERIFIED CONFIRMATION'}</strong></div><p>{result.description}</p><a href={explorerTransactionUrl(result.signature)} target="_blank" rel="noopener noreferrer">VERIFY ON SOLANA EXPLORER ↗</a><code>{result.signature}</code></div>}
      </div>
    </div>
    <aside className="trade-lab-aside">
      <div className="trade-orbit-panel">
        <div className="trade-card-top"><span>EXECUTION OBSERVATORY / 01</span><span>NO CUSTODY</span></div>
        <motion.div className="trade-orbit-visual" initial={false} animate={{rotate:reduceMotion?0:network==='verified'?8:0}} transition={{type:'spring',stiffness:22,damping:16}} aria-hidden="true">
          <svg viewBox="0 0 310 310" role="img"><circle cx="155" cy="155" r="125" fill="none" stroke="#426a4b" strokeDasharray="3 9"/><circle cx="155" cy="155" r="92" fill="none" stroke="#c7ff91" strokeWidth="1.4" strokeDasharray="175 405" transform="rotate(-110 155 155)"/><circle cx="155" cy="155" r="60" fill="none" stroke="#7de6ab" strokeWidth="1" strokeDasharray="140 240" transform="rotate(40 155 155)"/><path d="M15 155h280M155 15v280" stroke="#315844"/><circle cx="155" cy="155" r="5" fill="#c7ff91"/><circle cx="155" cy="30" r="5" fill="#c7ff91"/></svg>
        </motion.div>
        <div className="trade-orbit-caption"><span>CHAIN STATE</span><strong>{network==='verified'?'DEVNET':'— / —'}</strong><small>{network==='verified'?'ON-CHAIN FINGERPRINT VERIFIED':'NO EXECUTION PERMISSION'}</small></div>
      </div>
      <div className="trade-aside-notes"><span className="micro-label">KNOW BEFORE YOU SIGN</span><h3>REAL TRANSACTIONS.<br/><em>TEST ASSETS.</em></h3><p>This lab uses Drift's existing deployed devnet program. Devnet tokens have no monetary value. Your wallet remains the only signer.</p><p>Deposits enter <strong>your personal Drift account</strong>, not a SolNeutral-managed pool. On-chain fills, funding, margin, and liquidations are controlled by Drift.</p><p>Our custom Anchor vault remains separate and cannot receive production deposits through this interface.</p><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">GET DEVNET TEST SOL ↗</a></div>
    </aside>
  </section>;
}
