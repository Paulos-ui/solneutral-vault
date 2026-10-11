'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POSITION_RISK_DEFAULT } from '@/lib/position-risk';
import { DEFAULT_EVIDENCE, type FundingEvidence } from '@/lib/intelligence';
import { buildResearchBrief } from '@/lib/analyst';
const examples=['How could SOL dropping 30% affect my hedge?','What happens if funding turns negative?','Does a neutral portfolio eliminate liquidation risk?'];
export function RiskAnalyst(){
 const [question,setQuestion]=useState(examples[0]);
 const [funding,setFunding]=useState<FundingEvidence>(DEFAULT_EVIDENCE);
 const [answer,setAnswer]=useState<ReturnType<typeof buildResearchBrief>|null>(null);
 const [modelAnswer,setModelAnswer]=useState<string|null>(null);
 const [token,setToken]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const snapshot={assumptions:POSITION_RISK_DEFAULT,funding};
 useEffect(()=>{const abort=new AbortController();fetch('/api/market/funding',{cache:'no-store',signal:abort.signal}).then(r=>r.json()).then(p=>{if(!abort.signal.aborted&&p&&(p.status==='observed'||p.status==='stale')&&typeof p.latest?.hourlyPct==='number')setFunding({status:p.status,hourlyPct:p.latest.hourlyPct,ageMinutes:p.ageMinutes??null,source:p.source??null})}).catch(()=>{});return()=>abort.abort()},[]);
 const inspect=()=>{setError('');setModelAnswer(null);try{setAnswer(buildResearchBrief(snapshot,question))}catch{setError('Please enter a clear question between 8 and 500 characters.')}};
 const explain=async()=>{
  setError('');setModelAnswer(null);if(!token.trim()){setError('Private AI demo token required. The deterministic research analysis works without a token.');return;}
  setBusy(true);
  try{const response=await fetch('/api/ai/interpret',{method:'POST',headers:{'Content-Type':'application/json','x-solneutral-demo-token':token},body:JSON.stringify({question,snapshot})});const value=await response.json();if(!response.ok||typeof value.answer!=='string')throw Error(value.error||'AI unavailable');setModelAnswer(value.answer)}catch(e){setError(e instanceof Error?e.message:'AI unavailable. Use the verified research summary.')}finally{setBusy(false)}
 };
 return <div className="analyst-layout"><div className="analyst-input-panel"><div className="terminal-panel-head"><span className="micro-label">01 / QUESTION THE ASSUMPTIONS</span><span className="terminal-tag">READ-ONLY</span></div><h2>Ask the question<br/><em>behind the number.</em></h2><div className="analyst-samples">{examples.map(x=><button key={x} onClick={()=>{setQuestion(x);setAnswer(null);setModelAnswer(null)}}>{x} ↗</button>)}</div><label htmlFor="research-question" className="micro-label">YOUR QUESTION</label><textarea id="research-question" value={question} maxLength={500} onChange={e=>setQuestion(e.target.value)} rows={5} placeholder="What would you like to understand about hedge risk?"/><button className="button-primary analyst-run" onClick={inspect}>GENERATE EVIDENCE BRIEF ↗</button><p className="analyst-help">Always available: calculations use illustrative default holdings and current indexed funding when provided. No user portfolio is assumed.</p><div className="analyst-ai-optin"><span className="micro-label">OPTIONAL / PRIVATE LANGUAGE MODEL</span><p>For natural-language interpretation, the project owner must configure Anthropic API credentials and a private demo token on the server. No API key is ever sent to your browser.</p><input type="password" autoComplete="off" placeholder="Private demo access token" value={token} onChange={e=>setToken(e.target.value)}/><button className="terminal-compare-toggle" onClick={()=>void explain()} disabled={busy}>{busy?'REQUESTING INTERPRETATION…':'EXPLAIN WITH OPTIONAL AI ↗'}</button></div></div>
 <div className="analyst-output-panel"><div className="terminal-panel-head"><span className="micro-label">02 / GROUNDED INTERPRETATION</span><span className="terminal-tag">{modelAnswer?'LLM · EVIDENCE-BOUND':answer?'DETERMINISTIC ENGINE':'AWAITING QUESTION'}</span></div><AnimatePresence mode="wait">{modelAnswer||answer?<motion.div key={modelAnswer?'ai':'rules'} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}><h2>What the <em>evidence says.</em></h2><div className="analyst-prose">{(modelAnswer||answer?.answer||'').split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</div><div className="analyst-provenance"><span className="micro-label">EVIDENCE SOURCES</span>{(answer?.provenance||['Manually supplied assumptions','Deterministic risk model']).map(s=><div key={s}>↗ {s}</div>)}</div></motion.div>:<div className="analyst-placeholder"><span>⌁</span><h2>Nothing fabricated.<br/><em>Nothing assumed real.</em></h2><p>Choose a question and inspect a reproducible explanation. Your holdings are illustrative unless a verified position is explicitly connected.</p></div>}</AnimatePresence>{error&&<p className="analyst-error" role="alert">{error}</p>}</div></div>
}
