'use client';

import { useCallback, useEffect, useState } from 'react';

type Health = {
  backend: string;
  environment: string;
  verifiedAt: string;
  services: {
    nextApi: { state: string; detail: string };
    devnetRpc: { state: string; configured: boolean };
    mainnetResearchRpc: { state: string; configured: boolean; note: string };
    aiNarration: { state: string };
    fundingData: { state: string; endpoint: string };
  };
};

function label(state: string) {
  switch (state) {
    case 'online': return 'ONLINE';
    case 'verified': return 'VERIFIED';
    case 'wrong_network': return 'WRONG NETWORK';
    case 'unavailable': return 'UNAVAILABLE';
    case 'configured': return 'CONFIGURED';
    case 'optional_not_configured': return 'NOT CONNECTED';
    case 'external': return 'SEPARATE FEED';
    default: return 'NOT TESTED';
  }
}

export function BackendDiagnostics() {
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const check = useCallback(async (probe = false) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(probe ? '/api/health?probe=1' : '/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('The API did not return a successful response.');
      setHealth(await response.json() as Health);
    } catch {
      setHealth(null);
      setError('Cannot reach the deployed Next.js backend. Check the Vercel deployment and frontend Root Directory.');
    } finally { setBusy(false); }
  }, []);
  useEffect(() => { void check(false); }, [check]);
  const services = health?.services;
  return <section className="sn-dash-card sn-health-section" aria-label="Backend diagnostics">
    <div className="sn-dash-card-head"><h2>Backend & data services</h2><span className="sn-dash-tag">NEXT.JS / VERCEL</span></div>
    <p className="sn-settings-description">The API deploys with the frontend. Check RPC connectivity without exposing any private keys or API URLs.</p>
    <div className="sn-health-grid">
      <div><span>Next.js backend</span><strong>{health ? 'ONLINE' : error ? 'UNAVAILABLE' : 'CHECKING'}</strong></div>
      <div><span>Wallet devnet RPC</span><strong>{services ? label(services.devnetRpc.state) : '—'}</strong></div>
      <div><span>Research mainnet RPC</span><strong>{services ? label(services.mainnetResearchRpc.state) : '—'}</strong></div>
      <div><span>AI narration</span><strong>{services ? label(services.aiNarration.state) : '—'}</strong></div>
    </div>
    {error && <p className="trade-warning" role="alert">{error}</p>}
    <div className="sn-health-actions">
      <button className="sn-health-button" type="button" disabled={busy} onClick={() => void check(true)}>{busy ? 'Checking…' : 'Test backend & RPC ↻'}</button>
      <a className="sn-inline-link" href="/api/status" target="_blank" rel="noopener noreferrer">API status ↗</a>
      <a className="sn-inline-link" href="/api/market/funding" target="_blank" rel="noopener noreferrer">Funding feed ↗</a>
    </div>
    <p className="sn-fineprint">A verified RPC connection does not initialize a Drift account. Mainnet research and devnet execution use different clusters. The funding feed is independently provided by Drift and can be unavailable even when the backend is online.</p>
  </section>;
}
