"use client";
 
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getVaultStats, getPnLData, getRebalanceEvents, getRiskMetrics,
  VaultStats, PnLDataPoint, RebalanceEvent, RiskMetrics,
  formatUSDC, formatPct, formatDateTime,
} from "@/lib/api";
import StatCard    from "@/components/StatCard";
import PnLChart    from "@/components/PnLChart";
import PersonalPnL from "@/components/PersonalPnL";
 
export default function DashboardPage() {
  const { publicKey, connected } = useWallet();
 
  const [stats,      setStats]      = useState<VaultStats | null>(null);
  const [pnl,        setPnl]        = useState<PnLDataPoint[]>([]);
  const [rebalances, setRebalances] = useState<RebalanceEvent[]>([]);
  const [risk,       setRisk]       = useState<RiskMetrics | null>(null);
  const [hours,      setHours]      = useState(168);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
 
  async function loadData(h: number) {
    setLoading(true);
    try {
      const [s, p, r, rm] = await Promise.all([
        getVaultStats(),
        getPnLData(h),
        getRebalanceEvents(),
        getRiskMetrics(),
      ]);
      setStats(s);
      setPnl(p.chart_data);
      setRebalances(r.rebalance_events.slice(0, 10));
      setRisk(rm);
    } catch (e: any) {
      setError("Backend not reachable. Start the Flask server first.");
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => { loadData(hours); }, [hours]);
 
  const riskColor = risk?.drawdown_status === "safe"
    ? "text-emerald-400"
    : risk?.drawdown_status === "warning"
    ? "text-amber-400"
    : "text-red-400";
 
  return (
    <div className="space-y-8">
 
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Live vault performance · SolNeutral Delta-Neutral Strategy
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs">Strategy active</span>
        </div>
      </div>
 
      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
 
      {loading && (
        <div className="text-gray-500 text-sm animate-pulse">Loading vault data...</div>
      )}
 
      {/* ── Top Stats ──────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Value Locked"
            value={formatUSDC(stats.tvl_usdc)}
            sub="USDC in vault"
            accent="green"
            large
          />
          <StatCard
            label="Net APY"
            value={formatPct(stats.net_apy_pct)}
            sub={`Gross: ${formatPct(stats.gross_apy_pct)}`}
            accent="blue"
            large
          />
          <StatCard
            label="Net Profit"
            value={formatUSDC(stats.net_profit_usdc)}
            sub={`Fees: ${formatUSDC(stats.total_fees_usdc)}`}
            accent="purple"
            large
          />
          <StatCard
            label="Max Drawdown"
            value={formatPct(stats.max_drawdown_pct)}
            sub={stats.max_drawdown_pct < 5 ? "Safe ✓" : "Monitor"}
            accent={stats.max_drawdown_pct < 5 ? "green" : "amber"}
            large
          />
        </div>
      )}
 
      {/* ── Personal PnL ───────────────────── */}
      <PersonalPnL />
 
      {/* ── PnL Chart ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Vault performance</h2>
          <div className="flex gap-2">
            {[
              { label: "7d",  value: 168  },
              { label: "30d", value: 720  },
              { label: "90d", value: 2160 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setHours(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  hours === opt.value
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {pnl.length > 0 && <PnLChart data={pnl} title="" />}
      </div>
 
      {/* ── Risk + Rebalances ──────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {risk && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-white">Risk indicators</h3>
            {[
              { label: "Drawdown status",   value: risk.drawdown_status.toUpperCase(), color: riskColor },
              { label: "Max drawdown",      value: formatPct(risk.max_drawdown_pct)    },
              { label: "Drawdown limit",    value: formatPct(risk.drawdown_limit_pct)  },
              { label: "Sharpe ratio",      value: risk.sharpe_ratio.toFixed(2)        },
              { label: "Collateral buffer", value: formatPct(risk.collateral_buffer_pct) },
              { label: "Liquidation risk",  value: risk.liquidation_risk.toUpperCase(), color: "text-emerald-400" },
              { label: "Strategy status",   value: risk.strategy_status.toUpperCase(),  color: "text-emerald-400" },
              { label: "Next rebalance",    value: formatDateTime(risk.next_rebalance)  },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-400">{row.label}</span>
                <span className={row.color || "text-white font-medium"}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
 
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Recent rebalances</h3>
          <div className="space-y-3 overflow-y-auto max-h-64">
            {rebalances.map((r) => (
              <div
                key={r.event_id}
                className="flex items-center justify-between text-sm border-b border-gray-800 pb-2"
              >
                <div>
                  <span className="text-white font-medium">#{r.event_id}</span>
                  <span className="text-gray-500 ml-2 text-xs">{r.trigger}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">{formatDateTime(r.timestamp)}</p>
                  <p className="text-emerald-400 text-xs">${r.cost_usdc.toFixed(4)} cost</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── Vault config ───────────────────── */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Vault configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Lock period",     value: `${stats.lock_period_days} days`          },
              { label: "Performance fee", value: `${stats.performance_fee_pct}% on profits` },
              { label: "Rebalances",      value: `${stats.rebalance_count} executed`         },
              { label: "Simulation days", value: `${stats.simulation_days} days`             },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-gray-500">{item.label}</p>
                <p className="text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
 
    </div>
  );
}