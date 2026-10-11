'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { isSolanaPublicKey } from '@/lib/wallet';
import { type DriftAccountResponse } from '@/lib/drift-account';
import { Icon } from './Icons';

function smallAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-6)}`; }
function label(status: string) { return status.replaceAll('-', ' ').toUpperCase(); }

export function DriftAccountLens() {
  const [account, setAccount] = useState('');
  const [mode, setMode] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [response, setResponse] = useState<DriftAccountResponse | null>(null);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => () => { requestRef.current?.abort(); }, []);

  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const addr = account.trim();
    if (!isSolanaPublicKey(addr)) {
      setError('Enter a valid PUBLIC Solana account address, not a wallet recovery phrase.');
      setMode('error'); setResponse(null); return;
    }
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setMode('loading'); setResponse(null); setError('');
    try {
      const r = await fetch('/api/drift/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', signal: controller.signal, body: JSON.stringify({ account: addr }),
      });
      const data: DriftAccountResponse & { message?: string } = await r.json();
      if (controller.signal.aborted) return;
      if (data.onChain && data.indexed && data.account) { setResponse(data); setMode('done'); }
      else throw new Error(data.message ?? 'This request could not be interpreted.');
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : 'An unexpected network error occurred.');
      setMode('error');
    }
  }

  const verified = response?.onChain.status === 'verified';
  const ready = mode === 'done' && response !== null;
  const link = ready ? `https://explorer.solana.com/address/${response.account}?cluster=mainnet-beta` : null;
  return <section className="drift-account-lens" aria-label="Read-only Drift account explorer">
    <div className="drift-lens-heading">
      <div><span className="micro-label">01 / ACCOUNT PROVENANCE</span><h2>Proof, before <em>positions.</em></h2><p>Enter a public <strong>Drift User subaccount</strong> address. This is different from your regular wallet authority address. We first verify the on-chain account type, then request indexed position records.</p></div>
      <span className="drift-seal"><Icon name="shield" size={22}/> READ ONLY<br/>NO SIGNATURES</span>
    </div>
    <form className="wallet-lens-form drift-lens-form" onSubmit={inspect}>
      <label htmlFor="drift-account-input">PUBLIC DRIFT USER ACCOUNT <span>MAINNET / DRIFT V2</span></label>
      <div className="wallet-lens-inputrow">
        <input id="drift-account-input" value={account} maxLength={44} spellCheck={false} autoComplete="off" onChange={e => setAccount(e.target.value)} placeholder="Drift User subaccount public address…" aria-describedby="drift-account-hint"/>
        <button type="submit" disabled={mode === 'loading'}>{mode === 'loading' ? 'VERIFYING…' : 'INSPECT ACCOUNT'} <Icon name="arrowUp" size={15}/></button>
      </div>
      <div className="wallet-lens-formfoot"><p id="drift-account-hint">No private keys. The account must be a Drift program-owned <em>User</em> subaccount, not a wallet authority or a deposit address.</p>{account && <button type="button" className="lens-reset" onClick={() => { requestRef.current?.abort(); setAccount(''); setMode('idle'); setError(''); setResponse(null); }}>CLEAR ↗</button>}</div>
    </form>
    {error && <p className="wallet-error" role="alert">{error}</p>}
    <div className="drift-readout" aria-live="polite">
      <div className="drift-readout-header"><span>DRIFT / PROVENANCE TERMINAL / 002</span><span>{mode === 'loading' ? 'CHECKING RPC + INDEXER' : ready ? smallAddress(response.account) : 'AWAITING ACCOUNT INPUT'}</span></div>
      <div className="drift-readout-body">
        <div className="drift-signal-visual" aria-hidden="true">
          <div className="drift-grid"/>
          <motion.svg viewBox="0 0 340 320" className="drift-signal-svg" fill="none" initial={false} animate={{ rotate: reduced ? 0 : verified ? 12 : 0 }} transition={{ type: 'spring', stiffness: 36, damping: 19 }}>
            <circle cx="170" cy="160" r="119" stroke="#497658" strokeWidth="1" strokeDasharray="3 9"/>
            <circle cx="170" cy="160" r="86" stroke="#90e8b1" strokeWidth="1.2" strokeDasharray="98 442" transform="rotate(10 170 160)"/>
            <circle cx="170" cy="160" r="55" stroke="#c7ff91" strokeWidth="1.6" strokeDasharray="195 151" transform="rotate(-36 170 160)"/>
            <path d="M170 17v286M27 160h286" stroke="#55795f" opacity=".45"/>
            <path d="M52 250 116 186 174 215 240 115 289 70" stroke="#c7ff91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/>
            <circle cx="170" cy="160" r="8" fill={verified ? '#c7ff91' : '#547963'} />
            <circle cx="240" cy="115" r="5" fill="#c7ff91" />
          </motion.svg>
          <div className="drift-signal-center"><small>ON-CHAIN ACCOUNT</small><strong>{mode === 'loading' ? '···' : ready ? verified ? 'VALID' : '—' : '— / —'}</strong><span>{verified ? 'DRIFT USER / CONFIRMED' : 'EVIDENCE PENDING'}</span></div>
        </div>
        <div className="drift-evidence">
          <div className="drift-evidence-row"><span>01 / CHAIN ACCOUNT TYPE</span><strong className={verified ? 'drift-good' : ''}>{ready ? label(response.onChain.status) : 'NOT CHECKED'}</strong><p>{ready ? response.onChain.notice : 'Solana RPC will check program ownership and the Anchor User account discriminator.'}</p>{ready && response.onChain.slot !== null && <small>CONFIRMED RPC CONTEXT · SLOT {response.onChain.slot.toLocaleString()}</small>}</div>
          <div className="drift-evidence-row"><span>02 / INDEXED POSITION RECORDS</span><strong className={ready && response.indexed.status === 'observed' ? 'drift-good' : ''}>{ready ? label(response.indexed.status) : 'NOT CHECKED'}</strong><p>{ready ? response.indexed.notice : 'Indexed data is queried only after verifying the Drift account on-chain.'}</p>{ready && response.indexed.status === 'observed' && <small>{response.indexed.records.length} RECORDS DISPLAYED · MAXIMUM 20</small>}</div>
          <div className="drift-evidence-row drift-evidence-row--critical"><span>03 / MARGIN & LIQUIDATION</span><strong>NOT VERIFIED</strong><p>Health, liquidation levels, equity, leverage and realized PnL require additional account-state and market calculations. We do not estimate them from an indexer list.</p></div>
        </div>
      </div>
      {ready && response.indexed.records.length > 0 && <div className="drift-records">
        <div className="drift-records-title"><h3>Indexed records</h3><span>PROVIDER-REPORTED RAW FIELDS / NOT LIVE PNL</span></div>
        <div className="drift-records-scroller"><table><thead><tr><th>#</th><th>MARKET INDEX</th><th>MARKET TYPE</th><th>DIRECTION</th><th>BASE (RAW)</th><th>OBSERVED TIME</th></tr></thead><tbody>{response.indexed.records.map((item, i) => <tr key={`${i}-${item.marketIndex}`}><td>{String(i + 1).padStart(2, '0')}</td><td>{item.marketIndex}</td><td>{item.marketType.toUpperCase()}</td><td>{item.direction.toUpperCase()}</td><td className="drift-raw">{item.baseAssetAmountRaw ?? '—'}</td><td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'UNSPECIFIED'}</td></tr>)}</tbody></table></div>
        <p>Raw base amounts are shown exactly as reported, without assuming their token precision. An indexed record may be historical rather than a current open position.</p>
      </div>}
      <div className="drift-readout-foot"><span>{ready ? 'DATA FETCHED / ' + new Date(response.fetchedAt).toLocaleString() : 'DATA SOURCE / SOLANA RPC + DRIFT INDEXER'}</span>{link ? <a href={link} target="_blank" rel="noopener noreferrer">VERIFY IN SOLANA EXPLORER ↗</a> : <span>NO ACTIVE WALLET CONNECTION</span>}</div>
    </div>
    <div className="drift-lens-bottom"><div><span className="micro-label">02 / EVIDENCE IS NOT A FORECAST</span><h3>Know what the data <em>cannot</em> prove.</h3><p>The public ledger verifies the account&apos;s owner and type. An indexer supplies historical position records, not an independent guarantee of a present open position. Risk calculations will come only after we can reconcile actual positions, collateral, oracle values and margin rules.</p></div><Link href="/risk-lab" className="button-primary">EXPLORE SIMULATED RISK <Icon name="arrowUp" size={16}/></Link></div>
  </section>;
}
