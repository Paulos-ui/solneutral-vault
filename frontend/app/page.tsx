"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVaultStats, getVaultAPY, VaultStats, VaultAPY, formatUSDC, formatPct } from "@/lib/api";
import StatCard from "@/components/StatCard";

export default function HomePage() {
  const [stats, setStats]   = useState<VaultStats | null>(null);
  const [apy,   setApy]     = useState<VaultAPY | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a] = await Promise.all([getVaultStats(), getVaultAPY()]);
        setStats(s);
        setApy(a);
      } catch (e: any) {
        setError("Could not connect to SolNeutral API. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-16">

      {/* ── Hero ─────────────────────────────── */}
      <section className="text-center space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live on Solana Devnet · Powered by Drift Protocol
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Stable yield.<br />
          <span className="text-emerald-400">Zero directional risk.</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          SolNeutral runs a delta-neutral strategy on Solana — long spot, short perpetual —
          collecting funding fees from Drift Protocol to generate consistent USDC yield
          regardless of market direction.
        </p>

        {loading && (
          <div className="text-gray-500 text-sm animate-pulse">Loading vault data...</div>
        )}

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 max-w-md mx-auto">
            {error}
          </div>
        )}

        {stats && (
          <div className="text-7xl font-bold text-emerald-400 tracking-tight">
            {formatPct(stats.net_apy_pct)}
            <span className="text-2xl text-gray-400 ml-2 font-normal">Net APY</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/deposit"
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-colors"
          >
            Start Earning
          </Link>
          <Link
            href="/strategy"
            className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors"
          >
            How It Works
          </Link>
        </div>
      </section>

      {/* ── Live Stats Bar ───────────────────── */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Value Locked"
            value={formatUSDC(stats.tvl_usdc)}
            sub="USDC in vault"
            accent="green"
          />
          <StatCard
            label="Net APY"
            value={formatPct(stats.net_apy_pct)}
            sub={`Target: ${stats.target_apy_pct}% ✓`}
            accent="blue"
          />
          <StatCard
            label="Max Drawdown"
            value={formatPct(stats.max_drawdown_pct)}
            sub="Extremely low risk"
            accent="purple"
          />
          <StatCard
            label="Strategy"
            value="Delta-Neutral"
            sub="Drift Protocol perps"
            accent="amber"
          />
        </section>
      )}

      {/* ── How It Works ─────────────────────── */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">How SolNeutral works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Deposit USDC",
              desc:  "Deposit USDC into the vault. Your funds are split 50/50 between a spot position and perpetual collateral on Drift Protocol.",
              color: "text-emerald-400",
            },
            {
              step: "02",
              title: "Earn funding fees",
              desc:  "The vault holds a short SOL-PERP position on Drift. When funding rates are positive — which is 92%+ of the time — you earn fees every hour.",
              color: "text-blue-400",
            },
            {
              step: "03",
              title: "Withdraw with yield",
              desc:  "After the 90-day lock period, withdraw your USDC plus all accrued yield. No liquidation risk from price movements due to delta-neutrality.",
              color: "text-purple-400",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3"
            >
              <span className={`text-4xl font-bold ${item.color} opacity-40`}>{item.step}</span>
              <h3 className="text-white font-semibold text-lg">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── APY Detail ───────────────────────── */}
      {apy && (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Live funding rate snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Avg hourly rate</p>
              <p className="text-white font-bold text-xl">{formatPct(apy.current_hourly_rate_pct)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Projected annual</p>
              <p className="text-emerald-400 font-bold text-xl">{formatPct(apy.projected_annual_pct)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Positive hours</p>
              <p className="text-white font-bold text-xl">{formatPct(apy.positive_hours_pct)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Funding source</p>
              <p className="text-white font-bold text-sm">{apy.funding_source}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Risk Disclaimer ──────────────────── */}
      <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
        <h3 className="text-amber-400 font-semibold mb-2">Risk disclosure</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          SolNeutral is currently in simulation mode on Solana Devnet. Funding rates are variable
          and can turn negative during extreme market conditions. While the delta-neutral structure
          eliminates directional price risk, smart contract risk, liquidation risk, and protocol
          risk still exist. Do not deposit funds you cannot afford to lose. This is not financial advice.
        </p>
      </section>

    </div>
  );
}
