'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { isSolanaPublicKey, MAINNET_USDC_MINT, type WalletReadResponse } from '@/lib/wallet';
import { Icon } from '@/components/Icons';

function money(value: number, decimals: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value);
}
function abbreviated(address: string) { return `${address.slice(0, 5)}…${address.slice(-5)}`; }

export function WalletLens() {
  const [address, setAddress] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<WalletReadResponse | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => { pending.current?.abort(); }, []);

  async function examine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = address.trim();
    if (!isSolanaPublicKey(value)) {
      setError('Enter a valid Solana public address. Never paste a recovery phrase or private key.');
      setResult(null);
      setState('error');
      return;
    }
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setState('loading'); setError(''); setResult(null);
    try {
      const response = await fetch('/api/chain/wallet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: value }), cache: 'no-store', signal: controller.signal,
      });
      const data: WalletReadResponse & { message?: string } = await response.json();
      if (controller.signal.aborted) return;
      if (data.status === 'unavailable' || (response.ok && data.status)) {
        setResult(data);
        setState('done');
      } else {
        throw new Error(data.message || 'The wallet read was not successful.');
      }
    } catch (cause) {
      if (controller.signal.aborted) return;
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Unable to request public RPC balances.');
    }
  }

  function clearLens() {
    pending.current?.abort();
    setAddress(''); setResult(null); setError(''); setState('idle');
  }

  const retrieved = state === 'done' && result !== null;
  const explorer = retrieved ? `https://explorer.solana.com/address/${result.address}?cluster=mainnet-beta` : '';
  return <section className="wallet-lens" aria-labelledby="wallet-lens-title">
    <div className="wallet-lens-intro">
      <div><span className="micro-label">01 / PUBLIC CHAIN STATE</span><h2 id="wallet-lens-title">A window into <em>your wallet.</em></h2><p>Inspect public balances without connecting a wallet. No signatures, approvals, deposits, or trading permissions are requested.</p></div>
      <div className="wallet-lens-proof"><Icon name="shield" size={23}/><span>READ-ONLY<br/>BY DESIGN</span></div>
    </div>

    <form onSubmit={examine} className="wallet-lens-form">
      <label htmlFor="wallet-public-address">PUBLIC SOLANA ADDRESS <span>MAINNET-BETA</span></label>
      <div className="wallet-lens-inputrow">
        <input id="wallet-public-address" type="text" value={address} onChange={event => setAddress(event.target.value)} spellCheck={false} autoComplete="off" maxLength={44} placeholder="Paste a public wallet address…" aria-describedby="wallet-public-help" />
        <button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'READING CHAIN…' : 'INSPECT ADDRESS'} <Icon name="arrowUp" size={15}/></button>
      </div>
      <div className="wallet-lens-formfoot"><p id="wallet-public-help">Only paste a public address. Never enter your seed phrase or private key.</p>{address && <button type="button" onClick={clearLens} className="lens-reset">CLEAR ↗</button>}</div>
    </form>

    {error && <p className="wallet-error" role="alert"><Icon name="shield" size={16}/>{error}</p>}

    <div className="wallet-instrument" aria-live="polite">
      <div className="wallet-instrument-head"><span>ON-CHAIN OBSERVATION / 001</span><span className={`wallet-indicator ${retrieved && result.status === 'observed' ? 'wallet-indicator--up' : ''}`}>{state === 'loading' ? 'FETCHING CONFIRMED STATE' : retrieved ? result.status.toUpperCase() + ' / RPC' : 'AWAITING PUBLIC ADDRESS'}</span></div>
      <div className="wallet-instrument-body">
        <div className="wallet-orbit" aria-hidden="true">
          <div className="wallet-orbit-grid"/>
          <motion.svg width="260" height="260" viewBox="0 0 260 260" fill="none" initial={false} animate={{ rotate: reduceMotion ? 0 : retrieved ? 16 : 0 }} transition={{ type: 'spring', stiffness: 25, damping: 18 }}>
            <circle cx="130" cy="130" r="104" stroke="#577c5f" strokeWidth="1" strokeDasharray="2 8"/>
            <circle cx="130" cy="130" r="76" stroke="#c7ff91" strokeWidth="1.4" opacity=".65" strokeDasharray="120 357" transform="rotate(-100 130 130)"/>
            <circle cx="130" cy="130" r="56" stroke="#7de6ab" strokeWidth="2" opacity=".75" strokeDasharray="78 274" transform="rotate(45 130 130)"/>
            <path d="M130 7v246M7 130h246" stroke="#4e6958" strokeWidth=".7" opacity=".65"/>
            <circle cx="130" cy="130" r="3" fill="#c7ff91"/>
            <circle cx="130" cy="26" r="4" fill="#c7ff91"/>
          </motion.svg>
          <div className="wallet-orbit-label"><span>{retrieved ? 'ADDRESS READ' : 'SIGNAL READY'}</span><strong>{retrieved ? abbreviated(result.address) : '— / —'}</strong><small>PUBLIC ACCOUNT</small></div>
        </div>
        <div className="wallet-measures">
          <div className="wallet-measure"><span>01 / NATIVE SOL <i>{retrieved && result.sol ? 'CONFIRMED' : 'NOT VERIFIED'}</i></span><strong>{retrieved && result.sol ? money(result.sol.amount, 9) : '—'} <small>SOL</small></strong><p>{retrieved && result.sol ? `RPC context / slot ${money(result.sol.slot, 0)}` : 'Wallet-native lamports, not SOL held inside other protocols.'}</p></div>
          <div className="wallet-measure"><span>02 / CANONICAL USDC <i>{retrieved && result.usdc ? 'CONFIRMED' : 'NOT VERIFIED'}</i></span><strong>{retrieved && result.usdc ? money(result.usdc.amount, 6) : '—'} <small>USDC</small></strong><p>{retrieved && result.usdc ? `${result.usdc.accounts} token account${result.usdc.accounts === 1 ? '' : 's'} / slot ${money(result.usdc.slot, 0)}` : 'Mainnet USDC mint only. No implied USD valuation.'}</p></div>
          <div className="wallet-measure wallet-measure--foot"><span>READ INTEGRITY</span><p>{retrieved ? result.notice : 'We only show balances returned by the network. Missing data never becomes a fictional zero.'}</p></div>
        </div>
      </div>
      <div className="wallet-instrument-foot"><span>{retrieved ? `OBSERVED ${new Date(result.fetchedAt).toLocaleString()} · ${result.network.toUpperCase()}` : 'PROOF BEFORE PERFORMANCE · NO WALLET CONNECTION'}</span>{retrieved && <a href={explorer} target="_blank" rel="noreferrer noopener">VERIFY IN SOLANA EXPLORER <Icon name="arrowUp" size={14}/></a>}</div>
    </div>
    <div className="wallet-scope-grid">
      <div><span className="micro-label">VERIFIABLE</span><h3>What we can see</h3><p>Native SOL and canonical USDC wallet balances retrieved through Solana JSON-RPC with confirmation context.</p></div>
      <div><span className="micro-label">NOT CONNECTED</span><h3>What we cannot infer</h3><p>Drift margin, open positions, perpetual PnL, other token holdings, or vault shares. Those require separate verified data integrations.</p></div>
      <div><span className="micro-label">PROVENANCE</span><h3>How to verify</h3><p>Inspect the wallet on the Solana Explorer. You can also review the mainnet USDC mint: <a href={`https://explorer.solana.com/address/${MAINNET_USDC_MINT}`} target="_blank" rel="noreferrer noopener">view mint ↗</a></p></div>
    </div>
  </section>;
}
