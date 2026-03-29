"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  depositUSDC, withdrawUSDC, getUserBalance,
  UserBalance, formatUSDC, formatPct, formatDate,
} from "@/lib/api";
import {
  getWalletBalances, buildDepositTransaction, truncateAddress,
} from "@/lib/solana";
import WalletButton from "@/components/WalletButton";
import StatCard from "@/components/StatCard";

const NET_APY = 14.81;

export default function DepositPage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [amount,      setAmount]      = useState("");
  const [balance,     setBalance]     = useState<UserBalance | null>(null);
  const [solBalance,  setSolBalance]  = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [txSig,       setTxSig]       = useState<string | null>(null);
  const [tab,         setTab]         = useState<"deposit" | "withdraw">("deposit");

  // Load on-chain balances when wallet connects
  const loadBalances = useCallback(async () => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    const [onChain, vaultBal] = await Promise.all([
      getWalletBalances(wallet),
      getUserBalance(wallet).catch(() => null),
    ]);
    setSolBalance(onChain.sol);
    setUsdcBalance(onChain.usdc);
    if (vaultBal) setBalance(vaultBal);
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      loadBalances();
    } else {
      setSolBalance(0);
      setUsdcBalance(0);
      setBalance(null);
    }
  }, [connected, publicKey, loadBalances]);

  // ── Deposit ────────────────────────────────
  async function handleDeposit() {
    if (!publicKey || !connected) return setError("Connect your wallet first.");
    const amt = parseFloat(amount);
    if (!amt || amt < 10) return setError("Minimum deposit is 10 USDC.");
    if (amt > usdcBalance && usdcBalance > 0)
      return setError(`Insufficient USDC. Your balance is ${formatUSDC(usdcBalance)}.`);

    setLoading(true);
    setError(null);
    setSuccess(null);
    setTxSig(null);

    try {
      // Step 1: Sign real on-chain transaction (proof of wallet ownership)
      const tx = await buildDepositTransaction(publicKey.toBase58(), amt);
      if (tx) {
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");
        setTxSig(signature);
      }

      // Step 2: Record deposit in SolNeutral backend
      const result = await depositUSDC(publicKey.toBase58(), amt);
      setSuccess(result.message);
      await loadBalances();
    } catch (e: any) {
      setError(e.message || "Deposit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Withdraw ───────────────────────────────
  async function handleWithdraw() {
    if (!publicKey || !connected) return setError("Connect your wallet first.");
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await withdrawUSDC(publicKey.toBase58());
      setSuccess(result.message || "Withdrawal processed successfully.");
      setBalance(null);
      await loadBalances();
    } catch (e: any) {
      setError(e.message || "Withdrawal failed.");
    } finally {
      setLoading(false);
    }
  }

  const wallet = publicKey?.toBase58() || "";
  const parsedAmount = parseFloat(amount) || 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Deposit / Withdraw</h1>
        <p className="text-gray-400 text-sm mt-1">
          Deposit USDC into SolNeutral and earn delta-neutral yield
          powered by Drift Protocol funding fees.
        </p>
      </div>

      {/* ── Not connected ─────────────────────── */}
      {!connected ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-xl">Connect your wallet</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
              Connect a Solana wallet to deposit USDC and start earning
              delta-neutral yield in SolNeutral.
            </p>
          </div>
          <WalletButton fullWidth className="py-3.5 text-base max-w-xs mx-auto" />
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span>Solana Devnet</span>
            <span>·</span>
            <span>USDC deposits only</span>
            <span>·</span>
            <span>90-day lock</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Wallet info bar ────────────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-mono text-sm">
                    {truncateAddress(wallet, 6)}
                  </p>
                  <p className="text-emerald-400 text-xs">Connected · Devnet</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-gray-500 text-xs">SOL</p>
                  <p className="text-white font-medium">{solBalance.toFixed(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">USDC</p>
                  <p className="text-emerald-400 font-bold">{formatUSDC(usdcBalance)}</p>
                </div>
                <a
                  href={`https://solscan.io/account/${wallet}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline hidden sm:block"
                >
                  Solscan →
                </a>
              </div>
            </div>
          </div>

          {/* ── Active vault position ──────────── */}
          {balance?.has_deposit && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-emerald-400 font-semibold">Your vault position</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  balance.is_locked
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {balance.is_locked ? `Locked · ${balance.days_remaining}d` : "Unlocked ✓"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Deposited</p>
                  <p className="text-white font-bold">{formatUSDC(balance.deposit_usdc!)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Yield earned</p>
                  <p className="text-emerald-400 font-bold">{formatUSDC(balance.accrued_yield!)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Total value</p>
                  <p className="text-white font-bold">{formatUSDC(balance.current_value!)}</p>
                </div>
              </div>
              {balance.unlock_date && (
                <p className="text-gray-500 text-xs mt-3">
                  Unlocks on {formatDate(balance.unlock_date)} ·{" "}
                  {balance.days_in_vault?.toFixed(0)} days in vault
                </p>
              )}
            </div>
          )}

          {/* ── Tabs ───────────────────────────── */}
          <div className="flex gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                  setSuccess(null);
                  setTxSig(null);
                }}
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

          {/* ── Deposit form ───────────────────── */}
          {tab === "deposit" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-lg">Deposit USDC</h2>
                <p className="text-gray-500 text-xs mt-1">
                  USDC only · Minimum 10 USDC · 90-day lock · 14.81% net APY
                </p>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 text-sm">Amount</label>
                  <button
                    onClick={() => setAmount(String(Math.floor(usdcBalance)))}
                    className="text-emerald-400 text-xs hover:underline"
                  >
                    Max: {formatUSDC(usdcBalance)}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-4 text-white text-2xl placeholder-gray-700 outline-none transition-colors pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    USDC
                  </span>
                </div>
                <div className="flex gap-2">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs rounded-lg transition-colors"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yield preview */}
              {parsedAmount >= 10 && (
                <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-gray-300 text-sm font-medium">
                    Projected yield at {NET_APY}% net APY
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { label: "30 days",  mult: 30 / 365  },
                      { label: "90 days",  mult: 90 / 365  },
                      { label: "1 year",   mult: 1          },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="text-emerald-400 font-medium">
                          +{formatUSDC(parsedAmount * (NET_APY / 100) * row.mult)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between text-sm">
                    <span className="text-gray-400">Value after 1 year</span>
                    <span className="text-white font-bold">
                      {formatUSDC(parsedAmount * (1 + NET_APY / 100))}
                    </span>
                  </div>
                </div>
              )}

              {/* Lock notice */}
              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-amber-400 text-sm font-medium">90-day lock period</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Deposits are locked to maintain vault stability and strategy execution.
                    Yield accrues every day from Drift Protocol funding fees.
                  </p>
                </div>
              </div>

              {/* Deposit button */}
              <button
                onClick={handleDeposit}
                disabled={loading || parsedAmount < 10}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold text-lg rounded-xl transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                    Signing transaction...
                  </span>
                ) : parsedAmount >= 10 ? (
                  `Deposit ${formatUSDC(parsedAmount)}`
                ) : (
                  "Enter amount to deposit"
                )}
              </button>

              {/* Tx link */}
              {txSig && (
                <a
                  href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-blue-400 text-sm hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Transaction confirmed · View on Solscan
                </a>
              )}
            </div>
          )}

          {/* ── Withdraw form ──────────────────── */}
          {tab === "withdraw" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-lg">Withdraw USDC</h2>
                <p className="text-gray-500 text-xs mt-1">
                  Available after 90-day lock · Principal + all accrued yield returned
                </p>
              </div>

              {balance?.has_deposit ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="You will receive"
                      value={formatUSDC(balance.current_value!)}
                      sub="Principal + yield"
                      accent="green"
                    />
                    <StatCard
                      label="Lock status"
                      value={balance.is_locked ? "Locked" : "Ready"}
                      sub={balance.is_locked
                        ? `${balance.days_remaining} days remaining`
                        : "Withdraw now ✓"}
                      accent={balance.is_locked ? "amber" : "green"}
                    />
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={loading || balance.is_locked}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-lg rounded-xl transition-all"
                  >
                    {loading
                      ? "Processing..."
                      : balance.is_locked
                      ? `Locked · ${balance.days_remaining} days remaining`
                      : "Withdraw USDC + yield"}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-gray-500">No active vault position found.</p>
                  <button
                    onClick={() => setTab("deposit")}
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    Make a deposit →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}
        </>
      )}
    </div>
  );
}
