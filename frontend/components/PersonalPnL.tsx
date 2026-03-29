"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getUserBalance, UserBalance, formatUSDC, formatPct } from "@/lib/api";

export default function PersonalPnL() {
  const { publicKey, connected } = useWallet();
  const [balance,  setBalance]  = useState<UserBalance | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  async function loadBalance() {
    if (!publicKey) return;
    setLoading(true);
    try {
      const b = await getUserBalance(publicKey.toBase58());
      setBalance(b);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
      // Refresh every 30 seconds
      const interval = setInterval(loadBalance, 30_000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-3">
        <p className="text-gray-400 text-sm">Connect wallet to see your personal PnL</p>
      </div>
    );
  }

  if (loading && !balance) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="animate-pulse text-gray-500 text-sm">Loading your position...</div>
      </div>
    );
  }

  if (!balance?.has_deposit) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center space-y-2">
        <p className="text-gray-400 text-sm">No active position found for this wallet.</p>
        <a href="/deposit" className="text-emerald-400 text-sm hover:underline">
          Make a deposit →
        </a>
      </div>
    );
  }

  const profit      = (balance.accrued_yield || 0);
  const pct_gain    = balance.deposit_usdc
    ? (profit / balance.deposit_usdc) * 100
    : 0;
  const isProfit    = profit >= 0;
  const roiColor    = isProfit ? "text-emerald-400" : "text-red-400";
  const borderColor = isProfit
    ? "border-emerald-500/20"
    : "border-red-500/20";

  return (
    <div className={`bg-gray-900 border ${borderColor} rounded-2xl p-6 space-y-5`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Your position</h3>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-gray-600 text-xs">
              Synced {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadBalance}
            disabled={loading}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* PnL hero */}
      <div className="bg-gray-800 rounded-xl p-5 text-center space-y-1">
        <p className="text-gray-400 text-xs">Total yield earned</p>
        <p className={`text-4xl font-bold ${roiColor}`}>
          {isProfit ? "+" : ""}{formatUSDC(profit)}
        </p>
        <p className={`text-sm font-medium ${roiColor}`}>
          {isProfit ? "▲" : "▼"} {Math.abs(pct_gain).toFixed(4)}% on principal
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Deposited</p>
          <p className="text-white font-bold">
            {formatUSDC(balance.deposit_usdc || 0)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Current value</p>
          <p className={`font-bold ${roiColor}`}>
            {formatUSDC(balance.current_value || 0)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Days in vault</p>
          <p className="text-white font-bold">
            {balance.days_in_vault?.toFixed(1) || "0"} days
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">APY applied</p>
          <p className="text-emerald-400 font-bold">
            {formatPct(balance.apy_applied_pct || 0)}
          </p>
        </div>
      </div>

      {/* Lock status */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${
        balance.is_locked
          ? "bg-amber-500/5 border border-amber-500/20"
          : "bg-emerald-500/5 border border-emerald-500/20"
      }`}>
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${balance.is_locked ? "text-amber-400" : "text-emerald-400"}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {balance.is_locked ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            )}
          </svg>
          <span className={`text-sm font-medium ${
            balance.is_locked ? "text-amber-400" : "text-emerald-400"
          }`}>
            {balance.is_locked
              ? `Locked · ${balance.days_remaining} days remaining`
              : "Unlocked · Ready to withdraw"}
          </span>
        </div>
        {!balance.is_locked && (
          <a href="/deposit"
            className="text-emerald-400 text-xs font-medium hover:underline">
            Withdraw →
          </a>
        )}
      </div>

    </div>
  );
}
