'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { FundingObservation } from '@/lib/funding';

type FundingPayload = {
  status: 'observed' | 'stale' | 'unavailable';
  market: string;
  fetchedAt: string;
  source: string;
  ageMinutes?: number;
  latest?: FundingObservation;
  records: FundingObservation[];
  note?: string;
};

function signed(value: number, precision = 3) {
  return `${value > 0 ? '+' : ''}${value.toFixed(precision)}%`;
}

export function FundingPulse() {
  const [data, setData] = useState<FundingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/market/funding', { cache: 'no-store', signal });
      const payload = (await response.json()) as FundingPayload;
      if (!signal?.aborted) setData(response.ok ? payload : { ...payload, status: 'unavailable' });
    } catch {
      if (!signal?.aborted) setData({ status: 'unavailable', market: 'SOL-PERP', source: '', fetchedAt: '', records: [] });
    } finally {
      if (!signal?.aborted) { setLoading(false); setUpdating(false); }
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    void refresh(abort.signal);
    const timer = setInterval(() => { void refresh(abort.signal); }, 120_000);
    return () => { abort.abort(); clearInterval(timer); };
  }, [refresh]);

  const valid = (data?.status === 'observed' || data?.status === 'stale') && Boolean(data?.latest);
  const observed = data?.records ?? [];
  const timeline = [...observed].reverse();
  const peak = Math.max(0.001, ...timeline.map(r => Math.abs(r.hourlyPct)));
  const latest = valid ? data?.latest : undefined;
  const stale = data?.status === 'stale';

  return (
    <section className="funding-pulse" aria-labelledby="funding-pulse-title">
      <div className="funding-pulse-head">
        <div>
          <span className="eyebrow">02 / INDEXED MARKET OBSERVATION</span>
          <h2 id="funding-pulse-title">Follow the <em>funding signal.</em></h2>
          <p>A read-only view of publicly indexed SOL-PERP funding. Data appears only when it can be validated.</p>
        </div>
        <div className="funding-pulse-state" aria-live="polite">
          <span className={`pulse-status ${valid && !stale ? 'connected' : ''}`} />
          {loading ? 'CONTACTING INDEXER' : valid ? stale ? 'HISTORICAL / DELAYED' : 'INDEXED DATA' : 'SOURCE UNAVAILABLE'}
        </div>
      </div>
      <div className="funding-pulse-grid">
        <div className="funding-pulse-chart">
          <div className="funding-pulse-timeline-label"><span>DRIFT / SOL-PERP</span><span>LAST {timeline.length || '—'} VALIDATED RECORDS</span></div>
          {valid ? (
            <div className="funding-bars" role="img" aria-label={`Recent hourly funding observations from Drift for SOL-PERP. Latest funding rate ${signed(latest?.hourlyPct ?? 0, 5)} per hour.`}>
              <div className="funding-zero-line" />
              {timeline.map((record, index) => {
                const height = `${Math.max(1.5, (Math.abs(record.hourlyPct) / peak) * 43)}%`;
                return <div className="funding-bar-track" key={`${record.time}/${index}`} title={`${new Date(record.time).toLocaleString()}: ${signed(record.hourlyPct, 5)} per hour`}><div className={`funding-bar ${record.hourlyPct >= 0 ? 'positive' : 'negative'}`} style={{ height, [record.hourlyPct >= 0 ? 'bottom' : 'top']: '50%' }} /></div>;
              })}
            </div>
          ) : (
            <div className="funding-offline"><span className="funding-offline-icon" aria-hidden="true">⌁</span><strong>{loading ? 'Requesting public observations…' : 'No verified market data'}</strong><p>{loading ? 'Awaiting a response from the Drift indexer.' : 'The source may be unavailable, rate limited, or using a different response format. SolNeutral will never substitute fictional rates.'}</p></div>
          )}
          <div className="funding-pulse-chartfoot"><span>NEGATIVE FUNDING</span><span>0 / REFERENCE</span><span>POSITIVE FUNDING</span></div>
        </div>
        <div className="funding-readout">
          <span className="micro-label">LATEST INDEXED INTERVAL</span>
          <strong className="funding-number">{latest ? signed(latest.hourlyPct, 5) : '—'}</strong>
          <span className="funding-unit">NORMALIZED MARKET FUNDING / HOUR</span>
          <div className="funding-readout-detail"><span>INDICATIVE ANNUALIZATION</span><strong>{latest ? signed(latest.annualizedPct, 2) : '—'}</strong></div>
          <div className="funding-readout-detail"><span>ORACLE TWAP AT RECORD</span><strong>{latest ? `$${latest.oracleTwapUsd.toFixed(2)}` : '—'}</strong></div>
          <div className="funding-readout-detail"><span>AGE OF LAST RECORD</span><strong>{data?.ageMinutes !== undefined ? `${data.ageMinutes} min` : '—'}</strong></div>
          <button type="button" className="funding-refresh" disabled={updating} onClick={() => void refresh()}>{updating ? 'CHECKING SOURCE…' : '↻ CHECK AGAIN'}</button>
        </div>
      </div>
      <div className="funding-pulse-foot"><p><strong>Market signal ≠ investment return.</strong> Positive funding does not guarantee a short earns the displayed rate. No live vault, user position, or realized PnL is connected. Annualized figures extrapolate a single observation.</p><Link href="https://data.api.drift.trade/playground" target="_blank" rel="noopener noreferrer">VIEW DRIFT DATA SOURCE ↗</Link></div>
    </section>
  );
}
