'use client';
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useState,type ReactNode} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {useConnection,useWallet} from '@solana/wallet-adapter-react';
import {ConnectWallet} from '@/components/ConnectWallet';
import {Icon} from '@/components/Icons';
import {SolPriceChart} from '@/components/SolPriceChart';
import {useSolNeutralLive} from '@/lib/use-solneutral-live';
import {shortSignature,scalePath,formatObservedNumber} from '@/lib/dashboard-view';
import {POSITION_RISK_DEFAULT,calculatePositionStress} from '@/lib/position-risk';
import {readTestnetReserve,type TestnetReserveSnapshot} from '@/lib/testnet-sol';

function Card({title,icon,children,subtitle,accent}:{title:string;icon:'wallet'|'pulse'|'shield'|'history'|'layers';children:ReactNode;subtitle:string;accent?:boolean}){
 return <article className={`sn-kpi ${accent?'sn-kpi-accent':''}`}><div className="sn-kpi-top"><span className="sn-kpi-icon"><Icon name={icon} size={19}/></span><span>{title}</span></div><div className="sn-kpi-value">{children}</div><div className="sn-kpi-sub">{subtitle}</div></article>;
}
function Frame({children,title,subtitle,tag}:{children:ReactNode;title:string;subtitle?:string;tag?:string}){
 return <section className="sn-dash-card"><div className="sn-dash-card-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{tag&&<span className="sn-dash-tag">{tag}</span>}</div>{children}</section>;
}
export function SolNeutralDashboard(){
 const {connected,publicKey}=useWallet();
 const {connection}=useConnection();
 const account=useSolNeutralLive();
 const reduced=useReducedMotion();
 const [reserve,setReserve]=useState<TestnetReserveSnapshot|null>(null);
 const [reserveStatus,setReserveStatus]=useState<'checking'|'verified'|'unknown'>('checking');
 const [reserveRefresh,setReserveRefresh]=useState(0);
 const [modelSize,setModelSize]=useState(100);
 const [hedgePct,setHedgePct]=useState(95);
 const [shock,setShock]=useState(0);
 const refresh=useCallback(()=>{account.refresh();setReserveRefresh(n=>n+1);},[account.refresh]);
 useEffect(()=>{
  if(!connected||!publicKey){setReserve(null);setReserveStatus('checking');return;}
  let cancelled=false;setReserveStatus('checking');setReserve(null);
  void readTestnetReserve(connection,publicKey).then(value=>{if(!cancelled){setReserve(value);setReserveStatus('verified');}}).catch(()=>{if(!cancelled)setReserveStatus('unknown');});
  return()=>{cancelled=true};
 },[connected,publicKey,connection,reserveRefresh]);
 const input=useMemo(()=>({...POSITION_RISK_DEFAULT,spotBaseSol:modelSize,perpBaseSol:-(Math.round(modelSize*hedgePct)/100)}),[modelSize,hedgePct]);
 const modeled=useMemo(()=>calculatePositionStress(input),[input]);
 const selected=modeled.shocks.find(s=>s.shockPct===shock)??modeled.shocks[3];
 const shortUnits=Math.abs(input.perpBaseSol);
 const degrees=360*modelSize/(modelSize+shortUnits);
 const path=useMemo(()=>scalePath(modeled.shocks.map(s=>s.combinedPnlUsd),600,224,24),[modeled]);
 const reserveValue=reserve?.reservedLamports!==undefined?Number(reserve.reservedLamports)/1e9:null;
 return <div className="sn-dashboard">
  {!connected?<div className="sn-connect-gateway"><div className="sn-connect-copy"><span className="sn-eyebrow"><i/> SOLNEUTRAL · SOLANA TESTNET</span><h1>YOUR SOL.<br/><em>YOUR CONTROL.</em></h1><p>Connect Phantom or Solflare to see your testnet SOL, explore market research, and manage a wallet-owned SOL reserve. No Drift collateral or USDC needed.</p><ConnectWallet/><div className="sn-connect-privacy"><Icon name="shield" size={16}/> Wallet-owned reserve · No seed phrases · Testnet only</div><Link href="/observatory" className="sn-secondary-link">Explore the Observatory <Icon name="arrowUp" size={16}/></Link></div><div className="sn-gateway-art" aria-hidden="true"><div className="sn-gateway-orbit sn-gateway-orbit-a"/><div className="sn-gateway-orbit sn-gateway-orbit-b"/><div className="sn-gateway-orbit sn-gateway-orbit-c"/><div className="sn-gateway-center"><span>Δ</span><strong>SOL<br/>TESTNET</strong></div></div></div>:
  <>
    <div className="sn-dashboard-intro"><div><span className="sn-eyebrow"><i/> CONNECTED WORKSPACE</span><h1>Your workspace</h1><p>Live wallet balances, demo trading, and market research in one place.</p></div><div className="sn-intro-actions"><button onClick={refresh} type="button" title="Refresh verified wallet balances"><Icon name="pulse" size={16}/> Refresh</button><Link href="/trade" className="sn-trade-cta">Open Trade Lab <Icon name="arrowUp" size={17}/></Link></div></div>
    <div className="sn-data-banners"><span className={`sn-data-banner ${account.status==='verified'?'is-on':''}`}><i/>{account.status==='verified'?'TESTNET VERIFIED':account.status==='loading'?'VERIFYING TESTNET':'TESTNET NOT VERIFIED'}</span><span>RPC: LIVE WALLET READS</span><span>RESERVE: WALLET CONTROLLED</span><span>SCENARIOS: SIMULATED</span></div>
    <div className="sn-kpi-grid">
      <Card title="Wallet SOL" icon="wallet" subtitle="Native SOL · Solana testnet" accent><span>{formatObservedNumber(account.sol,4)}</span><small>SOL</small></Card>
      <Card title="SOL Reserve" icon="layers" subtitle="Your wallet-owned wrapped SOL"><span>{reserveStatus==='verified'?reserveValue?.toFixed(4):'—'}</span><small>{reserveStatus==='unknown'?'Retry balance read':'wSOL · testnet'}</small><Link href="/trade" className="sn-card-link">Manage SOL ↗</Link></Card>
      <Card title="Your Control" icon="shield" subtitle="Self-custody · no protocol vault"><span className="sn-v72-kpi-compact sn-kpi-tight">Self custody</span><Link href="/docs" className="sn-card-link">How it works ↗</Link></Card>
      <Card title="Transaction History" icon="history" subtitle="Last 12 public testnet signatures"><span>{account.historyAvailable?account.signatures.length:'—'}</span><Link href="/history" className="sn-card-link">View activity ↗</Link></Card>
    </div>
    <div className="sn-dashboard-grid">
      <div className="sn-span-6"><Frame title="Market & scenario performance" subtitle="A hypothetical hedged position — never real PnL." tag="RESEARCH MODEL"><div className="sn-chart-reading"><span>ILLUSTRATIVE SPOT + PERP PNL</span><strong>${selected.combinedPnlUsd.toLocaleString('en-US',{maximumFractionDigits:0})}</strong><small>SOL PRICE SHOCK {shock>0?'+':''}{shock}% · NOT REAL PNL</small></div><div className="sn-trend-chart"><svg viewBox="0 0 600 224" preserveAspectRatio="none" aria-label="Simulated profit or loss across seven price shocks" role="img"><defs><linearGradient id="sn-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#83F0AF" stopOpacity=".27"/><stop offset="1" stopColor="#83F0AF" stopOpacity="0"/></linearGradient></defs>{[40,85,130,175].map(y=><line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#244234" strokeDasharray="3 7"/>)}<path d={`${path} L 576 210 L 24 210 Z`} fill="url(#sn-gradient)"/><motion.path initial={reduced?false:{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.1}} d={path} fill="none" stroke="#9BF4AB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="sn-shock-picker" role="group" aria-label="Choose price movement">{modeled.shocks.map(s=><button key={s.shockPct} type="button" className={shock===s.shockPct?'active':''} aria-pressed={shock===s.shockPct} onClick={()=>setShock(s.shockPct)}>{s.shockPct>0?'+':''}{s.shockPct}%</button>)}</div></Frame></div>
      <div className="sn-span-3"><Frame title="Hedge exposure" subtitle="Adjust a purely hypothetical hedge." tag="MODEL"><div className="sn-exposure-graphic"><div className="sn-donut" style={{background:`conic-gradient(#A8F2A3 0deg ${degrees}deg,#2C8969 ${degrees}deg 360deg)`}}><div className="sn-donut-middle"><small>RESIDUAL DELTA</small><strong>{modeled.netDeltaBaseSol.toFixed(1)}</strong><small>SOL · MODEL</small></div></div></div><div className="sn-legend"><span><i className="mint"/> Spot / long</span><strong>+{modelSize} SOL</strong><span><i className="forest"/> Perp / short</span><strong>−{shortUnits.toFixed(1)} SOL</strong></div><label className="sn-control-label">POSITION SIZE <strong>{modelSize} SOL</strong><input type="range" min="10" max="200" step="10" value={modelSize} onChange={e=>setModelSize(Number(e.target.value))}/></label><label className="sn-control-label">HEDGE RATIO <strong>{hedgePct}%</strong><input type="range" min="70" max="130" step="5" value={hedgePct} onChange={e=>setHedgePct(Number(e.target.value))}/></label><Link className="sn-inline-link" href="/risk-engine">Open stress engine ↗</Link></Frame></div>
      <div className="sn-span-3"><Frame title="Data provenance" subtitle="Each number has a source." tag="VERIFIABLE"><div className="sn-evidence-list"><div><span className="sn-evidence-indicator green"/><span>Wallet SOL</span><strong>{account.sol===null?'Not verified':'Testnet RPC'}</strong></div><div><span className="sn-evidence-indicator green"/><span>Reserve wSOL</span><strong>{reserveStatus==='verified'?'SPL Token RPC':'Read pending'}</strong></div><div><span className="sn-evidence-indicator grey"/><span>Portfolio PnL</span><strong>Not calculated</strong></div><div><span className="sn-evidence-indicator grey"/><span>Vault APY</span><strong>Not offered</strong></div></div><p className="sn-evidence-note">Wallet balances are independent of hypothetical chart figures. No return or deposit into a SolNeutral contract is implied.</p><Link className="sn-inline-link" href="/trade">Manage your SOL ↗</Link></Frame></div>
      <div className="sn-span-4"><Frame title="Live SOL/USD chart" subtitle="Coinbase spot reference, independent of Solana testnet." tag="REFERENCE"><SolPriceChart/></Frame></div>
      <div className="sn-span-4"><Frame title="Recent activity" subtitle="Observed Solana testnet wallet signatures only." tag="PUBLIC LEDGER"><div className="sn-activity-list">{!account.historyAvailable?<div className="sn-simple-empty">History not available from RPC.</div>:account.signatures.length===0?<div className="sn-simple-empty">No recent testnet wallet signatures.</div>:account.signatures.slice(0,5).map(item=><a key={item.signature} target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${item.signature}?cluster=testnet`} className="sn-activity-row"><span className="sn-activity-icon"><Icon name="arrowUp" size={17}/></span><div><strong>{shortSignature(item.signature)}</strong><small>{item.err?'Transaction failed':'Recorded signature'}</small></div><time>{item.blockTime?new Date(item.blockTime*1000).toLocaleDateString():'Slot '+item.slot}</time></a>)}</div><p className="sn-fineprint">Transactions are not marked as deposits unless the relevant reserve balance is also observed.</p></Frame></div>
    </div>
    <div className="sn-dash-end"><span>SOLNEUTRAL TESTNET · WALLET OWNERSHIP · NO MAINNET VAULT</span><Link href="/docs">Read the product guide <Icon name="arrowUp" size={14}/></Link></div>
   </>}
 </div>;
}
