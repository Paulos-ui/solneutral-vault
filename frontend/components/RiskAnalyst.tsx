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
 const [history,setHistory]=useState<{role:'user'|'assistant';content:string}[]>([]);
 const [error,setError]=useState('');
 const snapshot={assumptions:POSITION_RISK_DEFAULT,funding};
 useEffect(()=>{const abort=new AbortController();fetch('/api/market/funding',{cache:'no-store',signal:abort.signal}).then(r=>r.json()).then(p=>{if(!abort.signal.aborted&&p&&(p.status==='observed'||p.status==='stale')&&typeof p.latest?.hourlyPct==='number')setFunding({status:p.status,hourlyPct:p.latest.hourlyPct,ageMinutes:p.ageMinutes??null,source:p.source??null})}).catch(()=>{});return()=>abort.abort()},[]);
 const inspect=()=>{setError('');setModelAnswer(null);try{setAnswer(buildResearchBrief(snapshot,question))}catch{setError('Please enter a clear question between 8 and 500 characters.')}};
 const explain=async()=>{
  setError('');setModelAnswer(null);if(!token.trim()){setError('Enter the private AI demo access token under AI Access to ask Claude. Scenario analysis works without it.');return;}
  setBusy(true);
  try{const response=await fetch('/api/ai/interpret',{method:'POST',headers:{'Content-Type':'application/json','x-solneutral-demo-token':token},body:JSON.stringify({question,snapshot,history:history.slice(-6)})});const value=await response.json();if(!response.ok||typeof value.answer!=='string')throw Error(value.error||'AI unavailable');setModelAnswer(value.answer);setAnswer(null);setHistory(previous=>[...previous,{role:'user',content:question},{role:'assistant',content:value.answer}].slice(-12));}catch(e){setError(e instanceof Error?e.message:'AI unavailable. Use the verified research summary.')}finally{setBusy(false)}
 };
 return <div className="sn-v6-ai-workspace">
 <section className="sn-v6-chat-panel" aria-label="Ask SolNeutral AI">
  <div className="sn-v6-chat-head"><div className="sn-v6-chat-symbol">✳</div><div><strong>SolNeutral Analyst</strong><p>Risk research · Not trading advice</p></div><span>READ ONLY</span></div>
  <div className="sn-v6-chat-body" aria-live="polite">
   {history.length>2&&history.slice(0,-2).map((entry,i)=><div className="sn-v73-chat-history" key={i}><small>{entry.role==='user'?'YOU':'CLAUDE'}</small><p>{entry.content.slice(0,950)}</p></div>)}
   {modelAnswer||answer?<div className="sn-v6-chat-message"><span className="sn-v6-chat-bubble-label">SOLNEUTRAL · {modelAnswer?'PRIVATE MODEL':'RULE-BASED RESEARCH'}</span><div className="sn-v6-chat-answer">{(modelAnswer||answer?.answer||'').split('\n\n').map((text,i)=><p key={i}>{text}</p>)}</div>{answer?.provenance&&<details><summary>View supporting assumptions and evidence</summary>{answer.provenance.map(src=><p key={src}>↗ {src}</p>)}</details>}</div>:<div className="sn-v6-chat-empty"><span aria-hidden="true">⌁</span><h2>What would you like to understand?</h2><p>Ask anything. Claude can explain SolNeutral, analyze risk, or answer general questions. Live figures are shown only when verified.</p></div>}
  </div>
  <div className="sn-v6-chat-compose"><div className="sn-v6-prompt-chips">{examples.map((sample,i)=><button type="button" key={sample} onClick={()=>{setQuestion(questions[i]);setAnswer(null);setModelAnswer(null)}}>{sample}</button>)}</div><label htmlFor="research-question">Your question</label><textarea id="research-question" maxLength={1200} rows={3} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask SolNeutral about risk…"/><button type="button" disabled={busy} className="sn-trade-cta" onClick={()=>void explain()}>{busy?'Claude is thinking…':'Ask Claude ↗'}</button><button type="button" className="sn-v73-secondary-ai" onClick={inspect}>Explain hedge scenario without API</button>{error&&<p role="alert" className="analyst-error">{error}</p>}</div>
 </section>
 <aside className="sn-v6-ai-aside"><div className="sn-v6-side-head"><h3>Context & sources</h3><span>{funding.status.toUpperCase()}</span></div><div className="sn-v6-ticket-facts"><div><span>Hedge values</span><strong>Illustrative defaults</strong></div><div><span>Funding observation</span><strong>{funding.hourlyPct===null?'Not verified':`${funding.hourlyPct.toFixed(5)}% / hour`}</strong></div><div><span>Execution rights</span><strong>None</strong></div></div><p>The analyst does not access your private keys or execute trades. Answers do not imply verified account positions.</p><details open className="sn-v6-ai-advanced"><summary>AI Access · private demo token ↗</summary><p>The operator must configure server-side API credentials and a separate demo access token.</p><input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" placeholder="Demo access token"/><p>Use your separate AI_DEMO_ACCESS_TOKEN value here, never your Anthropic API key. This demo access is private, not public-user authentication.</p></details></aside>
 </div>;
}
