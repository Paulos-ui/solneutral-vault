'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { POSITION_RISK_DEFAULT, calculatePositionStress, type PositionRiskInput } from '@/lib/position-risk';
import { analyzeSnapshot, compareStrategies, evaluateLocalAlerts, DEFAULT_EVIDENCE, type FundingEvidence } from '@/lib/intelligence';

function money(n: number){return `${n<0?'−':''}$${Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:2})}`}
const refreshEveryMs=120000;
function inferFunding(payload: unknown): FundingEvidence {
 if (!payload || typeof payload!=='object') return DEFAULT_EVIDENCE;
 const p=payload as Record<string, unknown>; const r=p.latest as Record<string, unknown>|undefined;
 const status = p.status==='observed'?'observed':p.status==='stale'?'stale':'unavailable';
 return { status, hourlyPct: typeof r?.hourlyPct==='number' && Number.isFinite(r.hourlyPct)?r.hourlyPct:null, ageMinutes: typeof p.ageMinutes==='number' && Number.isFinite(p.ageMinutes)?p.ageMinutes:null, source:typeof p.source==='string'?p.source:null };
}
export function IntelligenceTerminal(){
 const [funding,setFunding]=useState<FundingEvidence>(DEFAULT_EVIDENCE);
 const [updated,setUpdated]=useState<string|null>(null);
 const [input,setInput]=useState<PositionRiskInput>(POSITION_RISK_DEFAULT);
 const [alertThreshold,setAlertThreshold]=useState(0.2);
 const [showCompare,setShowCompare]=useState(false);
 const [marketBusy,setMarketBusy]=useState(false);
 const loadFunding=useCallback(async (signal?:AbortSignal)=>{
  setMarketBusy(true);
  try { const response=await fetch('/api/market/funding',{cache:'no-store',signal});const json:unknown=await response.json();if(!signal?.aborted){setFunding(inferFunding(json));setUpdated(new Date().toISOString());}}
  catch{if(!signal?.aborted){setFunding(DEFAULT_EVIDENCE);setUpdated(new Date().toISOString());}}
  finally{if(!signal?.aborted)setMarketBusy(false)}
 },[]);
 useEffect(()=>{const ctrl=new AbortController();void loadFunding(ctrl.signal);const timer=setInterval(()=>void loadFunding(ctrl.signal),refreshEveryMs);return ()=>{ctrl.abort();clearInterval(timer)}},[loadFunding]);
 const model=useMemo(()=>calculatePositionStress(input),[input]);
 const findings=useMemo(()=>analyzeSnapshot({assumptions:input,funding}),[input,funding]);
 const strategies=useMemo(()=>compareStrategies(input),[input]);
 const alert=useMemo(()=>evaluateLocalAlerts(funding,alertThreshold),[funding,alertThreshold]);
 const replace=(k:keyof PositionRiskInput,v:number)=>setInput(s=>({...s,[k]:v}));
 const critical=findings.some(x=>x.severity==='critical');
 return <div className="terminal-wrap">
   <div className="terminal-data-rail"><span><i className={`signal-dot ${funding.status==='observed'?'signal-active':''}`}/> DRIFT / SOL-PERP {funding.status==='observed'?'INDEXED':funding.status==='stale'?'DELAYED':'UNAVAILABLE'}</span><span>RPC / READ-ONLY · NO CUSTODY</span><span>SCENARIO INPUTS / USER ASSUMPTIONS</span></div>
   <div className="terminal-metrics">
    <div className="terminal-metric"><span className="micro-label">RESIDUAL DELTA / MODEL</span><strong>{model.netDeltaBaseSol.toFixed(2)} <small>SOL</small></strong><p>{model.residualDeltaPctOfGross.toFixed(2)}% of gross notional</p></div>
    <div className="terminal-metric"><span className="micro-label">GROSS EXPOSURE / MODEL</span><strong>{money(model.grossNotionalUsd)}</strong><p>Spot plus absolute perp notional</p></div>
    <div className="terminal-metric"><span className="micro-label">LOWEST COLLATERAL BUFFER / MODEL</span><strong className={critical?'signal-danger':''}>{money(Math.min(...model.shocks.map(x=>x.estimatedBufferUsd)))}</strong><p>Seven hypothetical shocks</p></div>
    <div className="terminal-metric terminal-metric-source"><span className="micro-label">FUNDING / INDEXED OBSERVATION</span><strong>{funding.hourlyPct!==null?`${funding.hourlyPct>0?'+':''}${funding.hourlyPct.toFixed(5)}%`:'—'} <small>/ HR</small></strong><p>{funding.status==='observed'?`Observed ${funding.ageMinutes} min ago`:funding.status==='stale'?'Delayed observation':'No verified current reading'}</p></div>
   </div>
   <div className="terminal-columns">
    <section className="terminal-panel terminal-scenarios"><div className="terminal-panel-head"><span className="micro-label">01 / POSITION STRESS MATRIX</span><span className="terminal-tag">DETERMINISTIC · NOT DRIFT MARGIN</span></div><div className="terminal-section-title"><h2>What happens<br/><em>when price moves?</em></h2><p>Spot and perpetual PnL are modeled independently. The margin buffer excludes spot profits because they may not be available to the perp account.</p></div><div className="scenario-bars" role="img" aria-label="Modeled PnL by price-shock scenario">
      {model.shocks.map(s=>{const max=Math.max(1,...model.shocks.map(x=>Math.abs(x.combinedPnlUsd)));const size=Math.max(3,Math.abs(s.combinedPnlUsd)/max*42);return <div className="scenario-column" key={s.shockPct}><div className="scenario-pnl">{money(s.combinedPnlUsd)}</div><div className="scenario-bar-track"><motion.div initial={{height:0}} animate={{height:`${size}%`}} transition={{type:'spring',stiffness:90,damping:19}} className={`scenario-bar ${s.guardrail==='below'?'negative':s.combinedPnlUsd>=0?'positive':'negative'}`} style={{[s.combinedPnlUsd>=0?'bottom':'top']:'50%'}}/></div><span>{s.shockPct>0?'+':''}{s.shockPct}%</span><small>{s.guardrail==='below'?'BUFFER ↓':'—'}</small></div>})}
     </div><div className="terminal-panel-footer"><span>FUNDING ASSUMPTION INCLUDED · NO FEES, SLIPPAGE OR BASIS SPREAD</span><Link href="/risk-engine">OPEN FULL ENGINE ↗</Link></div></section>
    <section className="terminal-panel terminal-controls"><div className="terminal-panel-head"><span className="micro-label">02 / ADJUST THE THESIS</span><span className="terminal-tag">LOCAL ONLY</span></div><h2>Move a variable.<br/><em>See the trade-off.</em></h2>
      <div className="terminal-sliders">
       {([['spotBaseSol','SPOT HOLDINGS','SOL',0,500,5],['perpBaseSol','PERP CONTRACTS','SOL',-500,0,5],['isolatedCollateralUsd','PERP COLLATERAL','USD',0,50000,500],['fundingAssumptionDailyPct','DAILY FUNDING','%',-0.5,0.5,0.025]] as const).map(([key,label,unit,min,max,step])=><label className="terminal-slider" key={key}><span>{label}<strong>{input[key]} {unit}</strong></span><input type="range" min={min} max={max} step={step} value={input[key]} onChange={e=>replace(key,Number(e.target.value))}/></label>)}
      </div><button className="terminal-reset" onClick={()=>setInput(POSITION_RISK_DEFAULT)}>↺ RESET ASSUMPTIONS</button><p className="terminal-disclaimer">The model is educational, not a portfolio transaction, investment recommendation, or Drift margin calculation.</p></section>
   </div>
   <div className="terminal-columns terminal-secondary">
    <section className="terminal-panel"><div className="terminal-panel-head"><span className="micro-label">03 / EXPLAINABLE RISK ENGINE</span><Link href="/analyst" className="terminal-tag">ASK THE ANALYST ↗</Link></div><div className="terminal-findings">{findings.map((f,i)=><motion.div key={f.id} className="terminal-finding" initial={{opacity:0,y:9}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}><span className={`finding-severity ${f.severity}`}>{f.severity.toUpperCase()}</span><div><h3>{f.title}</h3><p>{f.explanation}</p><small>{f.evidence}</small></div></motion.div>)}</div></section>
    <section className="terminal-panel"><div className="terminal-panel-head"><span className="micro-label">04 / COMPARE & WATCH</span><span className="terminal-tag">IN-BROWSER RESEARCH</span></div><h2>Three hedges.<br/><em>Different trade-offs.</em></h2><button className="terminal-compare-toggle" onClick={()=>setShowCompare(v=>!v)}>{showCompare?'HIDE COMPARISONS −':'COMPARE THREE STRUCTURES ↗'}</button><AnimatePresence>{showCompare&&<motion.div className="compare-list" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>{strategies.map(s=><div key={s.profile.id}><strong>{s.profile.name}</strong><span>{s.valid&&s.risk?`${s.risk.scenariosBreached} / 7 buffer breaches · ${s.risk.residualDeltaPct}% residual delta`:'OUT OF MODEL RANGE'}</span><p>{s.profile.rationale}</p></div>)}</motion.div>}</AnimatePresence>
     <div className="terminal-alert"><label htmlFor="funding-alert">INDEXED FUNDING DAILY THRESHOLD <strong>{alertThreshold.toFixed(2)}%</strong></label><input id="funding-alert" type="range" min="0" max="2" step="0.05" value={alertThreshold} onChange={e=>setAlertThreshold(Number(e.target.value))}/><p>{alert.length?alert[0].explanation:'No fresh observation currently crosses this in-page threshold.'}</p><small>Visible only while this page is open. No push notifications, scheduled monitoring, or storage.</small></div>
    </section>
   </div>
   <div className="terminal-evidence-footer"><div><span className="micro-label">DATA PROVENANCE</span><p>Solana and Drift observations are read-only. Scenario metrics are calculated from the sliders above. No deposits, signatures or trades are available.</p></div><div><span className="micro-label">LAST INDEXER REQUEST</span><p>{updated?new Date(updated).toLocaleTimeString():'Not yet requested'} · <button onClick={()=>void loadFunding()} disabled={marketBusy}>{marketBusy?'CHECKING…':'REFRESH ↻'}</button></p>{funding.source&&<a href={funding.source} target="_blank" rel="noreferrer">DRIFT SOURCE ↗</a>}</div></div>
 </div>
}
