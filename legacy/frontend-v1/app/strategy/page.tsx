"use client";

import { useEffect, useState } from "react";
import {
  getVaultStats, getFundingRates, getRiskMetrics,
  VaultStats, FundingRate, RiskMetrics,
  formatPct, formatUSDC,
} from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export default function StrategyPage() {
  const [stats,  setStats]  = useState<VaultStats | null>(null);
  const [rates,  setRates]  = useState<FundingRate[]>([]);
  const [risk,   setRisk]   = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, f, r] = await Promise.all([
          getVaultStats(),
          getFundingRates(72),
          getRiskMetrics(),
        ]);
        setStats(s);
        setRates(f.rates.filter((_, i) => i % 3 === 0));
        setRisk(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Strategy</h1>
        <p className="text-gray-400 text-sm mt-1">
          How SolNeutral generates yield with zero directional risk
        </p>
      </div>

      {/* ── Strategy Explainer ─────────────── */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-bold">Delta-neutral explained</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-emerald-400 font-semibold">The problem we solve</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Most DeFi yield strategies are exposed to market direction. If SOL drops 30%,
                your vault drops with it. SolNeutral eliminates that risk entirely.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-emerald-400 font-semibold">How delta-neutrality works</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We hold equal and opposite positions: a long spot SOL position and a short
                SOL-PERP position on Drift Protocol. When SOL price moves, gains on one
                side cancel losses on the other — net delta is always ~0.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-emerald-400 font-semibold">Where the yield comes from</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Perpetual futures have a funding rate — a fee paid from longs to shorts
                (or vice versa) every hour to keep the perp price anchored to spot.
                On Drift, this rate is positive 92%+ of the time, meaning our short
                position earns fees continuously.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Step 1 — Split capital",
                desc:  "50% of vault USDC goes to spot SOL (long). 50% used as collateral for SOL-PERP short on Drift.",
                color: "border-emerald-500/40 bg-emerald-500/5",
              },
              {
                title: "Step 2 — Collect funding",
                desc:  "Every hour Drift settles funding payments. Our short position receives payments when rate > 0.",
                color: "border-blue-500/40 bg-blue-500/5",
              },
              {
                title: "Step 3 — Rebalance",
                desc:  "Every 8 hours (or when delta drifts >2%), we adjust positions to restore delta-neutrality.",
                color: "border-purple-500/40 bg-purple-500/5",
              },
              {
                title: "Step 4 — Compound",
                desc:  "Collected funding fees are added back to the vault, increasing the base for next period.",
                color: "border-amber-500/40 bg-amber-500/5",
              },
            ].map((step) => (
              <div key={step.title} className={`border rounded-lg p-4 ${step.color}`}>
                <p className="text-white font-medium text-sm">{step.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Performance Summary ────────────── */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Gross APY</p>
            <p className="text-white text-2xl font-bold mt-1">{formatPct(stats.gross_apy_pct)}</p>
            <p className="text-gray-500 text-xs mt-1">Before performance fee</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Net APY</p>
            <p className="text-emerald-400 text-2xl font-bold mt-1">{formatPct(stats.net_apy_pct)}</p>
            <p className="text-gray-500 text-xs mt-1">After 20% performance fee</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Target APY</p>
            <p className="text-white text-2xl font-bold mt-1">{formatPct(stats.target_apy_pct)}</p>
            <p className="text-emerald-400 text-xs mt-1">✓ Target exceeded</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">Simulation profit</p>
            <p className="text-white text-2xl font-bold mt-1">{formatUSDC(stats.net_profit_usdc)}</p>
            <p className="text-gray-500 text-xs mt-1">On $10,000 over 90 days</p>
          </div>
        </section>
      )}

      {/* ── Funding Rate Chart ─────────────── */}
      {rates.length > 0 && (
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">SOL-PERP funding rates (72h)</h2>
          <p className="text-gray-500 text-xs mb-4">
            Positive = shorts earn. Negative = shorts pay. We earn when bars are green.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rates} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="timestamp" tick={false} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(3)}%`}
                width={60}
              />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toFixed(4)}%`, "Funding rate"]}
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
              <Bar
                dataKey="rate_pct"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Risk Management ────────────────── */}
      {risk && (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Risk management</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Max drawdown limit",
                value: "10% hard stop",
                desc:  "If vault value drops 10% from peak, all positions are closed automatically.",
                accent: "text-red-400",
              },
              {
                title: "Max position size",
                value: "25% of vault",
                desc:  "No single trade may exceed 25% of total vault value, limiting concentration risk.",
                accent: "text-amber-400",
              },
              {
                title: "Collateral buffer",
                value: "20% above liquidation",
                desc:  "We maintain 20% extra collateral above the Drift liquidation threshold at all times.",
                accent: "text-blue-400",
              },
              {
                title: "Rebalance trigger",
                value: "Every 8h or 2% drift",
                desc:  "Positions are rebalanced every 8 hours or whenever delta exceeds 2% threshold.",
                accent: "text-emerald-400",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-gray-700 rounded-xl p-5 space-y-2"
              >
                <p className="text-gray-400 text-sm">{item.title}</p>
                <p className={`font-bold text-lg ${item.accent}`}>{item.value}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Verification ───────────────────── */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">On-chain verification</h2>
        <p className="text-gray-400 text-sm">
          All vault transactions are recorded on-chain and verifiable on Solscan.
          Smart contract code is open source on GitHub.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://solscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            View on Solscan →
          </a>
          <a
            href="https://github.com/Paulos-ui/solneutral-vault"   
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            GitHub Repository →
          </a>
          <a
            href="https://drift.trade"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            Drift Protocol →
          </a>
        </div>
      </section>

    </div>
  );
}
