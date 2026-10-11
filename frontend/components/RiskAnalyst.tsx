'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POSITION_RISK_DEFAULT } from '@/lib/position-risk';
import { DEFAULT_EVIDENCE, type FundingEvidence } from '@/lib/intelligence';
import { buildResearchBrief } from '@/lib/analyst';
const examples=['SOL drops 30%','Funding turns negative','Is my hedge really neutral?','What about liquidation risk?'];
const questions=['How could SOL dropping 30% affect my hedge?','What happens if funding turns negative?','Does a neutral portfolio eliminate liquidation risk?','What happens to collateral if SOL falls rapidly?'];
export function RiskAnalyst(){
 const [question,setQuestion]=useState(questions[0]);
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
 return <div className="sn-v6-ai-workspace">
 <section className="sn-v6-chat-panel" aria-label="Ask SolNeutral AI">
  <div className="sn-v6-chat-head"><div className="sn-v6-chat-symbol">✳</div><div><strong>SolNeutral Analyst</strong><p>Risk research · Not trading advice</p></div><span>READ ONLY</span></div>
  <div className="sn-v6-chat-body" aria-live="polite">
   {modelAnswer||answer?<div className="sn-v6-chat-message"><span className="sn-v6-chat-bubble-label">SOLNEUTRAL · {modelAnswer?'PRIVATE MODEL':'RULE-BASED RESEARCH'}</span><div className="sn-v6-chat-answer">{(modelAnswer||answer?.answer||'').split('\n\n').map((text,i)=><p key={i}>{text}</p>)}</div>{answer?.provenance&&<details><summary>View supporting assumptions and evidence</summary>{answer.provenance.map(src=><p key={src}>↗ {src}</p>)}</details>}</div>:<div className="sn-v6-chat-empty"><span aria-hidden="true">⌁</span><h2>What would you like to understand?</h2><p>Ask about hedge drift, funding reversals or a hypothetical price shock. Answers use disclosed model assumptions.</p></div>}
  </div>
  <div className="sn-v6-chat-compose"><div className="sn-v6-prompt-chips">{examples.map((sample,i)=><button type="button" key={sample} onClick={()=>{setQuestion(questions[i]);setAnswer(null);setModelAnswer(null)}}>{sample}</button>)}</div><label htmlFor="research-question">Your question</label><textarea id="research-question" maxLength={500} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask SolNeutral about risk…"/><button type="button" className="sn-trade-cta" onClick={inspect}>Analyze assumptions ↗</button>{error&&<p role="alert" className="analyst-error">{error}</p>}</div>
 </section>
 <aside className="sn-v6-ai-aside"><div className="sn-v6-side-head"><h3>Context & sources</h3><span>{funding.status.toUpperCase()}</span></div><div className="sn-v6-ticket-facts"><div><span>Hedge values</span><strong>Illustrative defaults</strong></div><div><span>Funding observation</span><strong>{funding.hourlyPct===null?'Not verified':`${funding.hourlyPct.toFixed(5)}% / hour`}</strong></div><div><span>Execution rights</span><strong>None</strong></div></div><p>The analyst does not access your private keys or execute trades. Answers do not imply verified account positions.</p><details className="sn-v6-ai-advanced"><summary>Private AI interpretation (optional) ↗</summary><p>The operator must configure server-side API credentials and a separate demo access token.</p><input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" placeholder="Demo access token"/><button type="button" disabled={busy} onClick={()=>void explain()}>{busy?'Requesting…':'Ask private language model'}</button></details></aside>
 </div>;
}
