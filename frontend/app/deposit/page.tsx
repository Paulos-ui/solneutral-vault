"use client";

import { useState } from "react";
import {
  depositUSDC, withdrawUSDC, getUserBalance,
  UserBalance, DepositResult,
  formatUSDC, formatPct, formatDate,
} from "@/lib/api";
import StatCard from "@/components/StatCard";

export default function DepositPage() {
  const [wallet,   setWallet]   = useState("");
  const [amount,   setAmount]   = useState("");
  const [balance,  setBalance]  = useState<UserBalance | null>(null);
  const [result,   setResult]   = useState<DepositResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [tab,      setTab]      = useState<"deposit" | "withdraw">("deposit");

  async function handleCheckBalance() {
    if (!wallet.trim()) return setError("Enter a wallet address.");
    setLoading(true); setError(null);
    try {
      const b = await getUserBalance(wallet.trim());
      setBalance(b);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!wallet.trim()) return setError("Enter a wallet address.");
    const amt = parseFloat(amount);
    if (!amt || amt < 10) return setError("Minimum deposit is 10 USDC.");
    setLoading(true); setError(null); setSuccess(null);
    try {
      const r = await depositUSDC(wallet.trim(), amt);
      setResult(r);
      setSuccess(r.message);
      const b = await getUserBalance(wallet.trim());
      setBalance(b);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!wallet.trim()) return setError("Enter a wallet address.");
    setLoading(true); setError(null); setSuccess(null);
    try {
      const r = await withdrawUSDC(wallet.trim());
      setSuccess(r.message || "Withdrawal processed.");
      setBalance(null);
      setResult(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Deposit / Withdraw</h1>
        <p className="text-gray-400 text-sm mt-1">
          Simulate depositing USDC into SolNeutral vault.
          Real on-chain deposits coming with mainnet launch.
        </p>
      </div>

      {/* Simulation notice */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-4">
        <p className="text-blue-400 text-sm font-medium">Simulation mode</p>
        <p className="text-gray-400 text-xs mt-1">
          This simulates vault interactions. No real USDC is transferred.
          Enter any valid Solana wallet address (44 characters) to test.
        </p>
      </div>

      {/* Wallet input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Wallet address</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Solana wallet address (44 chars)"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleCheckBalance}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            Check
          </button>
        </div>

        {/* Balance display */}
        {balance && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            {balance.has_deposit ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deposited</span>
                  <span className="text-white font-medium">{formatUSDC(balance.deposit_usdc!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accrued yield</span>
                  <span className="text-emerald-400 font-medium">{formatUSDC(balance.accrued_yield!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current value</span>
                  <span className="text-white font-bold">{formatUSDC(balance.current_value!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APY applied</span>
                  <span className="text-blue-400">{formatPct(balance.apy_applied_pct!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lock status</span>
                  <span className={balance.is_locked ? "text-amber-400" : "text-emerald-400"}>
                    {balance.is_locked
                      ? `Locked · ${balance.days_remaining} days left`
                      : "Unlocked · Ready to withdraw"}
                  </span>
                </div>
                {balance.unlock_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unlock date</span>
                    <span className="text-white">{formatDate(balance.unlock_date)}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">{balance.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl">
        {(["deposit", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Deposit form */}
      {tab === "deposit" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold">Deposit USDC</h2>

          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Amount (USDC)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                USDC
              </span>
            </div>
            <div className="flex gap-2">
              {[100, 500, 1000, 5000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg transition-colors"
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Lock period info */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-sm">
            <p className="text-amber-400 font-medium mb-1">90-day lock period</p>
            <p className="text-gray-400">
              Deposits are locked for 90 days to maintain vault stability.
              Yield accrues daily at the current net APY rate.
            </p>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || !wallet || !amount}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold rounded-xl transition-colors"
          >
            {loading ? "Processing..." : "Deposit USDC"}
          </button>
        </div>
      )}

      {/* Withdraw form */}
      {tab === "withdraw" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold">Withdraw USDC</h2>
          <p className="text-gray-400 text-sm">
            Withdrawals are only available after the 90-day lock period expires.
            Your full principal plus accrued yield will be returned.
          </p>

          {balance?.has_deposit && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="You will receive"
                value={formatUSDC(balance.current_value!)}
                sub="Principal + yield"
                accent="green"
              />
              <StatCard
                label="Status"
                value={balance.is_locked ? "Locked" : "Ready"}
                sub={balance.is_locked ? `${balance.days_remaining} days left` : "Withdraw now"}
                accent={balance.is_locked ? "amber" : "green"}
              />
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={loading || !wallet || balance?.is_locked}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors"
          >
            {loading
              ? "Processing..."
              : balance?.is_locked
              ? `Locked — ${balance.days_remaining} days remaining`
              : "Withdraw USDC"}
          </button>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">
          {success}
        </div>
      )}

    </div>
  );
}
