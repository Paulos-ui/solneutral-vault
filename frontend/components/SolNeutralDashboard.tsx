'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useWallet, useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { inspectDriftDevnetAccount, inspectDriftDevnetUsdcReadiness } from '@/lib/drift-devnet';
import { ConnectWallet } from '@/components/ConnectWallet';
import { Icon } from '@/components/Icons';
import { useSolNeutralLive } from '@/lib/use-solneutral-live';
import { summarizeFunding, scalePath, formatObservedNumber, shortSignature } from '@/lib/dashboard-view';
import { POSITION_RISK_DEFAULT, calculatePositionStress } from '@/lib/position-risk';
import { analyzeSnapshot, DEFAULT_EVIDENCE } from '@/lib/intelligence';

type FundingState=ReturnType<typeof summarizeFunding>;
function Card({title,icon,children,subtitle,accent}:{title:string;icon:'wallet'|'pulse'|'shield'|'history'|'layers';children:ReactNode;subtitle:string;accent?:boolean}){
 return <article className={`sn-kpi ${accent?'sn-kpi-accent':''}`}><div className="sn-kpi-top"><span className="sn-kpi-icon"><Icon name={icon} size={19}/></span><span>{title}</span></div><div className="sn-kpi-value">{children}</div><div className="sn-kpi-sub">{subtitle}</div></article>
}
function DashboardFrame({children,title,subtitle,tag,action}:{children:ReactNode;title:string;subtitle?:string;tag?:string;action?:ReactNode}){
 return <section className="sn-dash-card"><div className="sn-dash-card-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action??(tag&&<span className="sn-dash-tag">{tag}</span>)}</div>{children}</section>
}
export function SolNeutralDashboard(){
 const {connected, publicKey}=useWallet();
 const signer=useAnchorWallet();
 const {connection}=useConnection();
 const [driftStatus,setDriftStatus]=useState<'checking'|'active'|'missing'|'unavailable'>('checking');
 const [walletQuote,setWalletQuote]=useState<string|null>(null);
 const [depositedQuote,setDepositedQuote]=useState<string|null>(null);
 const account=useSolNeutralLive();
 const reduced=useReducedMotion();
 const [funding,setFunding]=useState<FundingState>(()=>summarizeFunding(null));
 const [fundingLoading,setFundingLoading]=useState(true);
 const [fundingRefresh,setFundingRefresh]=useState(0);
 const [modelSize,setModelSize]=useState(100);
 const [hedgePct,setHedgePct]=useState(95);
 const [shock,setShock]=useState(0);
 const [chartView,setChartView]=useState<'funding'|'model'>('model');
 useEffect(()=>{
  const ctrl=new AbortController();
  const load=async()=>{setFundingLoading(true);try{const r=await fetch('/api/market/funding',{cache:'no-store',signal:ctrl.signal});const d:unknown=await r.json();if(!ctrl.signal.aborted)setFunding(summarizeFunding(d))}catch{if(!ctrl.signal.aborted)setFunding(summarizeFunding(null))}finally{if(!ctrl.signal.aborted)setFundingLoading(false)}};
  void load();const timer=setInterval(()=>void load(),120000);
  return()=>{ctrl.abort();clearInterval(timer)};
 },[fundingRefresh]);
 useEffect(()=>{
   if(!connected||!publicKey||!signer){setDriftStatus('unavailable');setWalletQuote(null);setDepositedQuote(null);return;}
   let cancelled=false;
   setDriftStatus('checking');setWalletQuote(null);setDepositedQuote(null);
   (async()=>{
     try {
       const account=await inspectDriftDevnetAccount(connection,signer);
       if(cancelled)return;
       setDriftStatus(account.exists?'active':'missing');
       const quote=await inspectDriftDevnetUsdcReadiness(connection,signer);
       if(cancelled)return;
       const precision=10**quote.decimals;
       setWalletQuote((Number(BigInt(quote.walletAmount))/precision).toLocaleString('en-US',{maximumFractionDigits:2}));
       setDepositedQuote(quote.driftDepositedAmount===null?null:(Number(BigInt(quote.driftDepositedAmount))/precision).toLocaleString('en-US',{maximumFractionDigits:2}));
     } catch { if(!cancelled)setDriftStatus('unavailable'); }
   })();
   return()=>{cancelled=true};
 },[connected,publicKey,signer,connection,account.updatedAt]);
 const modelInput=useMemo(()=>({...POSITION_RISK_DEFAULT,spotBaseSol:modelSize,perpBaseSol:-(Math.round(modelSize*hedgePct)/100)}),[modelSize,hedgePct]);
 const model=useMemo(()=>calculatePositionStress(modelInput),[modelInput]);
 const findings=useMemo(()=>analyzeSnapshot({assumptions:modelInput,funding:{...DEFAULT_EVIDENCE,status:funding.status,hourlyPct:funding.hourlyPct}}),[modelInput,funding]);
 const selected=model.shocks.find(s=>s.shockPct===shock)??model.shocks[3];
 const shortUnits=Math.abs(modelInput.perpBaseSol);
 const longDegrees=360*modelSize/(modelSize+shortUnits);
 const modelValues=model.shocks.map(s=>s.combinedPnlUsd);
 const fundingValues=funding.records.map(r=>r.hourlyPct);
 const chartValues=chartView==='model'?modelValues:fundingValues;
 const validChart=chartValues.length>1;
 const line=useMemo(()=>scalePath(chartValues,600,224,24),[chartValues]);
 return <div className="sn-dashboard">
  {!connected?<div className="sn-connect-gateway">
   <div className="sn-connect-copy"><span className="sn-eyebrow"><i/> YOUR SOLANA WORKSPACE</span><h1>YOUR HEDGE.<br/><em>IN FOCUS.</em></h1><p>Connect Phantom or Solflare to open your personal SolNeutral dashboard. Inspect public devnet balances, examine market signals, and reach Drift trading in one place.</p><ConnectWallet/><div className="sn-connect-privacy"><Icon name="shield" size={16}/> Wallet-owned access · No seed phrases · Devnet execution only</div><Link href="/observatory" className="sn-secondary-link">Explore the Observatory without connecting <Icon name="arrowUp" size={16}/></Link></div>
   <div className="sn-gateway-art" aria-hidden="true"><div className="sn-gateway-orbit sn-gateway-orbit-a"/><div className="sn-gateway-orbit sn-gateway-orbit-b"/><div className="sn-gateway-orbit sn-gateway-orbit-c"/><div className="sn-gateway-center"><span>Δ</span><strong>CONNECTED<br/>CLARITY</strong></div></div>
  </div>:<>
  <div className="sn-dashboard-intro"><div><span className="sn-eyebrow"><i/> CONNECTED WORKSPACE · DEVNET</span><h1>Your workspace <span aria-hidden="true">✳</span></h1><p>Wallet data, market signals and the hedge model in one view.</p></div><div className="sn-intro-actions"><button onClick={account.refresh} type="button" title="Refresh wallet balances and history"><Icon name="pulse" size={16}/> Refresh</button><Link href="/trade" className="sn-trade-cta">Trade on devnet <Icon name="arrowUp" size={17}/></Link></div></div>
  <div className="sn-data-banners"><span className={`sn-data-banner ${account.status==='verified'?'is-on':''}`}><i/>{account.status==='verified'?'DEVNET VERIFIED':account.status==='loading'?'VERIFYING DEVNET':account.status==='failed'?'NETWORK UNVERIFIED':'WALLET DATA PARTIAL'}</span><span>WALLET: PUBLIC ON-CHAIN DATA</span><span>RESEARCH FUNDING: {funding.status==='observed'?'INDEXED':funding.status==='stale'?'STALE':'UNAVAILABLE'}</span><span>RISK: ILLUSTRATIVE MODEL</span></div>
  <div className="sn-kpi-grid">
   <Card title="Wallet Balance" icon="wallet" subtitle="Native SOL · verified devnet" accent><span>{formatObservedNumber(account.sol,4)}</span><small>SOL</small></Card>
   <Card title="Drift Account" icon="layers" subtitle="On-chain devnet account check"><span className="sn-v72-kpi-compact">{driftStatus==='checking'?'Checking…':driftStatus==='active'?'Account found':driftStatus==='missing'?'Setup needed':'Unavailable'}</span><Link href="/trade" className="sn-card-link">{driftStatus==='missing'?'Initialize account ↗':'Manage collateral ↗'}</Link></Card>
   <Card title="Wallet Test USDC" icon="pulse" subtitle="Exact Drift devnet market mint"><span>{walletQuote===null?'—':walletQuote}</span><small>{walletQuote===null?'Check in Trade Lab':'USDC'}</small></Card>
   <Card title="Drift USDC Deposit" icon="shield" subtitle="Read-only on-chain spot balance"><span>{depositedQuote===null?'—':depositedQuote}</span><small>{depositedQuote===null?'Check collateral':'USDC'}</small></Card>
   <Card title="Recent Transactions" icon="history" subtitle="Public wallet signatures · last 12"><span>{account.historyAvailable?account.signatures.length:'—'}</span><Link href="/history" className="sn-card-link">View history ↗</Link></Card>
  </div>
  <div className="sn-dashboard-grid">
   <div className="sn-span-6"><DashboardFrame title="Market & scenario performance" subtitle="Switch between indexed funding history and hypothetical hedge outcomes." action={<div className="sn-chart-switch" role="group" aria-label="Chart data"><button type="button" className={chartView==='model'?'is-active':''} aria-pressed={chartView==='model'} onClick={()=>setChartView('model')}>Scenario</button><button type="button" disabled={funding.records.length<2} title={funding.records.length<2?'Indexed funding unavailable':'Indexed mainnet research observations'} className={chartView==='funding'?'is-active':''} aria-pressed={chartView==='funding'} onClick={()=>setChartView('funding')}>Funding research</button></div>}>
     <div className="sn-chart-reading"><span>{chartView==='model'?'ILLUSTRATIVE SPOT + PERP PNL':'INDEXED HOURLY FUNDING'}</span><strong>{chartView==='model'?`$${selected.combinedPnlUsd.toLocaleString('en-US',{maximumFractionDigits:0})}`:funding.hourlyPct===null?'—':`${funding.hourlyPct.toFixed(5)}% / hr`}</strong><small>{chartView==='model'?`SOL PRICE SHOCK ${shock>0?'+':''}${shock}% · NOT REAL PNL`:`${funding.status.toUpperCase()} · NOT A YIELD FORECAST`}</small></div>
     <div className="sn-trend-chart">{validChart?<svg viewBox="0 0 600 224" preserveAspectRatio="none" aria-label={chartView==='model'?'Illustrative profit and loss across price shocks':'Recent indexed funding observations'} role="img"><defs><linearGradient id="sn-gradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#83F0AF" stopOpacity=".27"/><stop offset="1" stopColor="#83F0AF" stopOpacity="0"/></linearGradient></defs>{[40,85,130,175].map(y=><line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#244234" strokeDasharray="3 7"/>)}<path d={`${line} L 576 210 L 24 210 Z`} fill="url(#sn-gradient)"/><motion.path initial={reduced?false:{pathLength:0}} animate={{pathLength:1}} transition={{duration:1.1}} d={line} fill="none" stroke="#9BF4AB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>:<div className="sn-chart-empty">{fundingLoading?'Loading indexed observations…':'No verified funding observations available.'}</div>}</div>
     {chartView==='model'?<div className="sn-shock-picker" role="group" aria-label="Select hypothetical SOL price movement">{model.shocks.map(s=><button key={s.shockPct} type="button" className={shock===s.shockPct?'active':''} aria-pressed={shock===s.shockPct} onClick={()=>setShock(s.shockPct)}>{s.shockPct>0?'+':''}{s.shockPct}%</button>)}</div>:<div className="sn-chart-caption">Market-level indexed research (not devnet trading data). Last {funding.records.length} validated Drift funding records · most recent indexer response {funding.updatedAt?new Date(funding.updatedAt).toLocaleTimeString():'unavailable'}</div>}
    </DashboardFrame></div>
   <div className="sn-span-3"><DashboardFrame title="Hedge exposure" subtitle="Adjust a simulated long/short hedge." tag="MODEL"><div className="sn-exposure-graphic"><div className="sn-donut" style={{background:`conic-gradient(#A8F2A3 0deg ${longDegrees}deg,#2C8969 ${longDegrees}deg 360deg)`}}><div className="sn-donut-middle"><small>RESIDUAL DELTA</small><strong>{model.netDeltaBaseSol.toFixed(1)}</strong><small>SOL · MODEL</small></div></div></div><div className="sn-legend"><span><i className="mint"/> Spot / long</span><strong>+{modelSize} SOL</strong><span><i className="forest"/> Perp / short</span><strong>−{shortUnits.toFixed(1)} SOL</strong></div><label className="sn-control-label">POSITION SIZE <strong>{modelSize} SOL</strong><input type="range" min="10" max="200" step="10" value={modelSize} onChange={e=>setModelSize(Number(e.target.value))}/></label><label className="sn-control-label">HEDGE RATIO <strong>{hedgePct}%</strong><input type="range" min="70" max="130" step="5" value={hedgePct} onChange={e=>setHedgePct(Number(e.target.value))}/></label><Link className="sn-inline-link" href="/risk-engine">Open full stress engine ↗</Link></DashboardFrame></div>
   <div className="sn-span-3"><DashboardFrame title="Data provenance" subtitle="Every number needs a source." tag="EVIDENCE"><div className="sn-evidence-list"><div><span className="sn-evidence-indicator green"/> <span>Wallet SOL</span><strong>{account.sol===null?'Unavailable':'Devnet RPC'}</strong></div><div><span className="sn-evidence-indicator yellow"/><span>Funding</span><strong>{funding.status==='observed'?'Drift indexer':funding.status==='stale'?'Stale':'Unavailable'}</strong></div><div><span className="sn-evidence-indicator grey"/><span>Portfolio USD</span><strong>Not calculated</strong></div><div><span className="sn-evidence-indicator grey"/><span>Drift margin</span><strong>Not verified</strong></div></div><p className="sn-evidence-note">No projected APY, invented performance, or simulated funds are presented as actual holdings.</p><Link className="sn-inline-link" href="/terminal">Open research terminal ↗</Link><button type="button" className="sn-refresh-funding" disabled={fundingLoading} onClick={()=>setFundingRefresh(x=>x+1)}><Icon name="pulse" size={16}/> {fundingLoading?'Checking…':'Refresh signals'}</button></DashboardFrame></div>
   <div className="sn-span-4"><DashboardFrame title="Scenario heatmap" subtitle="Modeled price shocks and collateral buffers." tag="SIMULATION"><div className="sn-risk-grid"><div className="sn-heatmap-head"><span>SHOCK</span><span>COMBINED PNL</span><span>BUFFER</span></div>{model.shocks.map(s=><button key={s.shockPct} type="button" className={`sn-risk-row ${shock===s.shockPct?'active':''}`} onClick={()=>{setShock(s.shockPct);setChartView('model')}}><span>{s.shockPct>0?'+':''}{s.shockPct}%</span><span>{s.combinedPnlUsd>=0?'+':''}${s.combinedPnlUsd.toLocaleString('en-US',{maximumFractionDigits:0})}</span><span className={s.guardrail==='below'?'bad':'good'}>{s.guardrail==='below'?'BELOW':'ABOVE'}</span></button>)}</div><p className="sn-fineprint">Buffer uses assumed maintenance, not the Drift margin engine.</p></DashboardFrame></div>
   <div className="sn-span-4"><DashboardFrame title="AI & risk insights" subtitle="Grounded, explainable strategy observations." action={<Link href="/analyst" className="sn-action-text">Ask AI ↗</Link>}><div className="sn-insights">{findings.slice(0,3).map((f,i)=><Link href="/analyst" key={f.id} className="sn-insight-row"><span className="sn-insight-icon"><Icon name={i===0?'pulse':i===1?'shield':'spark'} size={20}/></span><div><strong>{f.title}</strong><p>{f.explanation}</p><small>ILLUSTRATIVE STRATEGY · {f.severity.toUpperCase()}</small></div><Icon name="arrowUp" size={15}/></Link>)}</div></DashboardFrame></div>
   <div className="sn-span-4"><DashboardFrame title="Recent activity" subtitle="Verified devnet wallet signatures only." action={<Link href="/history" className="sn-action-text">All activity ↗</Link>}><div className="sn-activity-list">{!account.historyAvailable?<div className="sn-simple-empty">Public transaction history unavailable.</div>:account.signatures.length===0?<div className="sn-simple-empty">No recent signatures for this wallet on devnet.</div>:account.signatures.slice(0,5).map(item=><a key={item.signature} target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`} className="sn-activity-row"><span className="sn-activity-icon"><Icon name="arrowUp" size={17}/></span><div><strong>{shortSignature(item.signature)}</strong><small>{item.err?'Transaction failed':'Confirmed signature'}</small></div><time>{item.blockTime?new Date(item.blockTime*1000).toLocaleDateString():'Slot '+item.slot}</time></a>)}</div><p className="sn-fineprint">Transactions are not classified as deposits or fills without decoding their instructions.</p></DashboardFrame></div>
  </div>
  <div className="sn-dash-end"><span>DEVNET WORKSPACE · WALLET-CONTROLLED · NO SOLNEUTRAL MAINNET VAULT</span><Link href="/docs">How SolNeutral works <Icon name="arrowUp" size={14}/></Link></div>
  </>}
 </div>;
}
