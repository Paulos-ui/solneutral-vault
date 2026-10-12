'use client';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/ai-chat';
import { POSITION_RISK_DEFAULT } from '@/lib/position-risk';
import { DEFAULT_EVIDENCE, type FundingEvidence } from '@/lib/intelligence';
import { buildResearchBrief } from '@/lib/analyst';

const prompts = [
  'How do I deposit test SOL?',
  'What happens if SOL falls 30%?',
  'What is a delta-neutral hedge?',
  'How do I withdraw my SOL?',
];

export function RiskAnalyst() {
  const [question, setQuestion] = useState('');
  const funding: FundingEvidence = DEFAULT_EVIDENCE;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [localExplanation, setLocalExplanation] = useState('');
  const bottom = useRef<HTMLDivElement | null>(null);
  const snapshot = { assumptions: POSITION_RISK_DEFAULT, funding };

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, localExplanation]);

  async function send(text = question) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    if (prompt.length > 1200) { setError('Please keep your question under 1,200 characters.'); return; }
    const previous = messages;
    setMessages(items => [...items, {role:'user', content:prompt}]);
    setQuestion(''); setError(''); setLocalExplanation(''); setBusy(true);
    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({question:prompt, snapshot, history:previous.slice(-8)}),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== 'object' || !('answer' in payload) || typeof payload.answer !== 'string') {
        const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error : 'SolNeutral AI is temporarily unavailable. Please try again.';
        throw new Error(message);
      }
      // Keep the narrowed response value outside the state callback. TypeScript
      // does not preserve property narrowing on an unknown value across closures.
      const answer: string = payload.answer;
      setMessages(items => [...items, {role:'assistant', content:answer}]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'SolNeutral AI is temporarily unavailable.');
    } finally { setBusy(false); }
  }

  function explainScenario() {
    setError('');
    try {
      const result = buildResearchBrief(snapshot, question.trim() || 'How does a 30% SOL price drop affect the example hedge?');
      setLocalExplanation(result.answer);
    } catch { setError('Enter a question to analyze the example hedge.'); }
  }

  return <div className="sn-v6-ai-workspace sn-ai-simplified">
    <section className="sn-v6-chat-panel" aria-label="SolNeutral AI conversation">
      <div className="sn-v6-chat-head"><div className="sn-v6-chat-symbol">✳</div><div><strong>SolNeutral AI</strong><p>Your research companion · Ask naturally</p></div><span>READ ONLY</span></div>
      <div className="sn-v6-chat-body sn-ai-thread" aria-live="polite">
        {messages.length === 0 && !localExplanation && <div className="sn-v6-chat-empty"><span aria-hidden="true">✳</span><h2>How can I help?</h2><p>Ask about SOL reserves, testnet wallet actions, hedging, or anything else. I can explain the product, but I cannot sign transactions or see private wallet data.</p></div>}
        {messages.map((message, index) => <div key={index} className={`sn-ai-message ${message.role === 'user' ? 'from-user' : 'from-agent'}`}><small>{message.role === 'user' ? 'YOU' : 'SOLNEUTRAL AI'}</small><p>{message.content}</p></div>)}
        {busy && <p className="sn-ai-thinking" role="status">SolNeutral AI is responding…</p>}
        {localExplanation && <div className="sn-ai-message from-agent"><small>OFFLINE SCENARIO · HYPOTHETICAL</small><p>{localExplanation}</p></div>}
        <div ref={bottom} />
      </div>
      <div className="sn-v6-chat-compose">
        <div className="sn-v6-prompt-chips">{prompts.map(prompt => <button key={prompt} type="button" disabled={busy} onClick={() => void send(prompt)}>{prompt}</button>)}</div>
        <label htmlFor="research-question">Ask SolNeutral AI</label>
        <textarea id="research-question" maxLength={1200} rows={3} value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();void send();}}} placeholder="Type your question…" />
        <div className="sn-ai-compose-actions"><button type="button" disabled={busy || !question.trim()} className="sn-trade-cta" onClick={() => void send()}>{busy ? 'Thinking…' : 'Send message ↗'}</button><button type="button" className="sn-v73-secondary-ai" onClick={explainScenario}>Offline hedge explanation</button></div>
        {error && <p role="alert" className="analyst-error">{error}</p>}
      </div>
    </section>
    <aside className="sn-v6-ai-aside"><div className="sn-v6-side-head"><h3>SolNeutral AI</h3><span>RESEARCH</span></div><p>Ask your question directly. No separate AI login, personal API key, or demo access token is required.</p><div className="sn-v6-ticket-facts"><div><span>Example hedge</span><strong>Simulation only</strong></div><div><span>Funding data</span><strong>{funding.hourlyPct === null ? 'Not currently verified' : `${funding.hourlyPct.toFixed(5)}% / hour`}</strong></div><div><span>Wallet signatures</span><strong>Always yours</strong></div></div><p>Live account balances are checked separately in Trade Lab. SolNeutral AI does not execute trades, access private keys, or invent transactions. The operator manages its private AI service configuration.</p></aside>
  </div>;
}
