"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PnLDataPoint, formatDateTime } from "@/lib/api";

interface PnLChartProps {
  data: PnLDataPoint[];
  title?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-emerald-400 font-medium">
        Vault: ${Number(payload[0]?.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
      {payload[1] && (
        <p className="text-blue-400">
          Yield: ${Number(payload[1]?.value).toFixed(4)}
        </p>
      )}
    </div>
  );
}

export default function PnLChart({ data, title = "Vault Performance" }: PnLChartProps) {
  // Sample every 6th point to avoid overcrowding the chart
  const sampled = data.filter((_, i) => i % 6 === 0);

  const formatted = sampled.map((d) => ({
    ...d,
    time: formatDateTime(d.timestamp),
    vault_usdc: Number(d.vault_usdc.toFixed(2)),
    cumulative_yield: Number(d.cumulative_yield.toFixed(4)),
  }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(formatted.length / 6)}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="vault_usdc"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#vaultGrad)"
            name="Vault USDC"
          />
          <Area
            type="monotone"
            dataKey="cumulative_yield"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#yieldGrad)"
            name="Cumulative Yield"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-400 rounded" />
          <span className="text-gray-500 text-xs">Vault value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-400 rounded" />
          <span className="text-gray-500 text-xs">Cumulative yield</span>
        </div>
      </div>
    </div>
  );
}
