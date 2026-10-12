'use client';

import {useEffect, useMemo, useState} from 'react';

type Side = 'long' | 'short';
type DemoPosition = {
  id: string;
  side: Side;
  sizeSol: number;
  entry: number;
  leverage: number;
  openedAt: string;
};

type ChartPayload = {
  candles?: { close: number }[];
  price?: number;
};

const STORAGE_KEY = 'solneutral-demo-trades';

function loadPositions(): DemoPosition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) as DemoPosition[] : [];
  } catch {
    return [];
  }
}

function pnlFor(position: DemoPosition, current: number): number {
  const directionalMove = (current - position.entry) * (position.side === 'long' ? 1 : -1);
  return directionalMove * position.sizeSol * position.leverage;
}

export function DemoTradeDesk() {
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [side, setSide] = useState<Side>('long');
  const [size, setSize] = useState('1');
  const [leverage, setLeverage] = useState('2');
  const [positions, setPositions] = useState<DemoPosition[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch {
      // ignore storage write failures
    }
  }, [positions]);

  useEffect(() => {
    let disposed = false;
    async function refresh(): Promise<void> {
      setLoading(true);
      try {
        const response = await fetch('/api/market/sol-chart?interval=1m', { cache: 'no-store' });
        const payload = await response.json() as ChartPayload;
        const latest = typeof payload.price === 'number'
          ? payload.price
          : Array.isArray(payload.candles) && payload.candles.length > 0
            ? payload.candles[payload.candles.length - 1]?.close
            : null;
        if (!response.ok || typeof latest !== 'number' || !Number.isFinite(latest)) {
          throw new Error('Demo market reference is unavailable right now.');
        }
        if (!disposed) {
          setSpotPrice(latest);
          setError('');
        }
      } catch (reason) {
        if (!disposed) {
          setError(reason instanceof Error ? reason.message : 'Could not load SOL price.');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  const currentSize = Number(size);
  const currentLeverage = Number(leverage);
  const notional = spotPrice !== null && Number.isFinite(currentSize) && Number.isFinite(currentLeverage)
    ? spotPrice * currentSize * currentLeverage
    : null;

  const totalPnl = useMemo(() => {
    if (spotPrice === null) return null;
    return positions.reduce((sum, position) => sum + pnlFor(position, spotPrice), 0);
  }, [positions, spotPrice]);

  function openDemoTrade(): void {
    setMessage('');
    if (spotPrice === null) {
      setMessage('Wait for the SOL price reference before opening a demo trade.');
      return;
    }
    if (!Number.isFinite(currentSize) || currentSize <= 0 || currentSize > 500) {
      setMessage('Choose a demo size from 0.1 to 500 SOL.');
      return;
    }
    if (!Number.isFinite(currentLeverage) || currentLeverage < 1 || currentLeverage > 10) {
      setMessage('Choose leverage from 1x to 10x.');
      return;
    }
    const position: DemoPosition = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      side,
      sizeSol: currentSize,
      entry: spotPrice,
      leverage: currentLeverage,
      openedAt: new Date().toISOString(),
    };
    setPositions((items) => [position, ...items].slice(0, 8));
    setMessage(`Demo ${side} opened at $${spotPrice.toFixed(2)}. No on-chain order was sent.`);
  }

  function closePosition(id: string): void {
    setPositions((items) => items.filter((item) => item.id !== id));
  }

  function clearAll(): void {
    setPositions([]);
    setMessage('Demo positions cleared.');
  }

  return (
    <section className="sn-dash-card sn-demo-trade" aria-label="Demo SOL trading">
      <div className="sn-dash-card-head">
        <div>
          <span className="sn-eyebrow"><i /> SOLNEUTRAL · DEMO TRADING</span>
          <h2>Trade SOL in demo mode</h2>
          <p>Practice a simple long or short idea using the live SOL/USD reference price. No wallet signature or real execution is required.</p>
        </div>
        <span className="sn-dash-tag">SIMULATION</span>
      </div>

      <div className="sn-demo-grid">
        <article className="sn-demo-stat">
          <span>Reference price</span>
          <strong>{loading ? 'Loading…' : spotPrice === null ? '—' : `$${spotPrice.toFixed(2)}`}</strong>
          <small>Coinbase SOL/USD spot reference</small>
        </article>
        <article className="sn-demo-stat">
          <span>Open demo trades</span>
          <strong>{positions.length}</strong>
          <small>Stored in this browser only</small>
        </article>
        <article className="sn-demo-stat">
          <span>Total demo PnL</span>
          <strong>{totalPnl === null ? '—' : `${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toFixed(2)}`}</strong>
          <small>Marked against the latest reference price</small>
        </article>
      </div>

      <div className="sn-demo-side-select" role="group" aria-label="Demo trade direction">
        <button type="button" className={side === 'long' ? 'active buy' : 'buy'} onClick={() => setSide('long')}>↗ Long</button>
        <button type="button" className={side === 'short' ? 'active sell' : 'sell'} onClick={() => setSide('short')}>↘ Short</button>
      </div>

      <div className="sn-demo-inputs">
        <label>
          Size (SOL)
          <input type="text" inputMode="decimal" value={size} onChange={(event) => setSize(event.target.value)} placeholder="1" />
        </label>
        <label>
          Leverage
          <select value={leverage} onChange={(event) => setLeverage(event.target.value)}>
            {[1, 2, 3, 5, 10].map((item) => <option key={item} value={item}>{item}x</option>)}
          </select>
        </label>
      </div>

      <div className="sn-demo-ticket-row">
        <div className="sn-demo-ticket-note">
          <strong>{side === 'long' ? 'Long idea' : 'Short idea'}</strong>
          <span>{notional === null ? 'Waiting for market data' : `Estimated notional: $${notional.toFixed(2)}`}</span>
        </div>
        <button type="button" className="sn-demo-open" onClick={openDemoTrade}>Open demo trade ↗</button>
      </div>

      {error && <p className="sn-reserve-alert">{error}</p>}
      {message && <p className="sn-demo-message">{message}</p>}

      <div className="sn-demo-positions">
        <div className="sn-demo-positions-head">
          <strong>Active demo trades</strong>
          <button type="button" className="sn-inline-btn" disabled={positions.length === 0} onClick={clearAll}>Clear all</button>
        </div>
        {positions.length === 0 ? (
          <div className="sn-demo-empty">Open a demo long or short to test the trade flow without using real funds.</div>
        ) : (
          <div className="sn-demo-list">
            {positions.map((position) => {
              const pnl = spotPrice === null ? null : pnlFor(position, spotPrice);
              return (
                <article key={position.id} className="sn-demo-position">
                  <div>
                    <span className={`sn-demo-chip ${position.side}`}>{position.side.toUpperCase()}</span>
                    <strong>{position.sizeSol} SOL · {position.leverage}x</strong>
                    <small>Entry ${position.entry.toFixed(2)}</small>
                  </div>
                  <div className="sn-demo-position-right">
                    <strong className={pnl !== null && pnl < 0 ? 'down' : 'up'}>{pnl === null ? '—' : `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`}</strong>
                    <button type="button" onClick={() => closePosition(position.id)}>Close</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <p className="sn-fineprint">Demo trades are local simulations only. They do not create on-chain orders, custody assets, or promise returns.</p>
    </section>
  );
}
