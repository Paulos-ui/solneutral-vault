"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  depositToVault,
  withdrawFromVault,
  fetchUserPosition,
  calculateAccruedYield,
  UserPositionData,
  PROGRAM_ID,
  formatSolscanTx,
  formatSolscanAccount,
} from "@/lib/program";
import { getWalletBalances, truncateAddress } from "@/lib/solana";
import { formatUSDC, formatDate } from "@/lib/api";
import WalletButton from "@/components/WalletButton";
import StatCard from "@/components/StatCard";

const NET_APY = 14.81;

export default function DepositPage() {
  const { publicKey, connected, wallet } = useWallet();

  const [amount,       setAmount]       = useState("");
  const [position,     setPosition]     = useState<UserPositionData | null>(null);
  const [solBalance,   setSolBalance]   = useState(0);
  const [usdcBalance,  setUsdcBalance]  = useState(0);
  const [accruedYield, setAccruedYield] = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [txSig,        setTxSig]        = useState<string | null>(null);
  const [tab,          setTab]          = useState<"deposit" | "withdraw">("deposit");

  const loadData = useCallback(async () => {
    if (!publicKey || !wallet?.adapter) return;
    try {
      const [balances, pos] = await Promise.all([
        getWalletBalances(publicKey.toBase58()),
        fetchUserPosition(wallet.adapter, publicKey),
      ]);
      setSolBalance(balances.sol);
      setUsdcBalance(balances.usdc);
      if (pos) {
        setPosition(pos);
        setAccruedYield(calculateAccruedYield(pos.depositedAmount, pos.depositTimestamp));
      }
    } catch (e) {
      console.error(e);
    }
  }, [publicKey, wallet]);

  useEffect(() => {
    if (connected && publicKey) {
      loadData();
      const interval = setInterval(() => {
        if (position) {
          setAccruedYield(calculateAccruedYield(position.depositedAmount, position.depositTimestamp));
        }
      }, 30_000);
      return () => clearInterval(interval);
    } else {
      setPosition(null);
      setSolBalance(0);
      setUsdcBalance(0);
    }
  }, [connected, publicKey]);

  async function handleDeposit() {
  if (!publicKey || !wallet?.adapter) return setError("Connect your wallet first.");
  const amt = parseFloat(amount);
  if (!amt || amt < 10) return setError("Minimum deposit is 10 USDC.");

  setLoading(true);
  setError(null);
  setSuccess(null);
  setTxSig(null);

  const result = await depositToVault(wallet.adapter, publicKey, amt);

  if (result.error?.includes("already in use")) {
    setError(
      "You already have an active position in this vault. " +
      "Each wallet can hold one position at a time. " +
      "Please wait for your lock period to expire before depositing again."
    );
    setLoading(false);
    return;
  }

  if (result.success && result.signature) {
    setTxSig(result.signature);
    setSuccess(`Deposit of ${formatUSDC(amt)} confirmed on-chain!`);
    await loadData();
  } else {
    setError(result.error || "Deposit failed. Check console for details.");
  }
  setLoading(false);
}

  async function handleWithdraw() {
    if (!publicKey || !wallet?.adapter) return setError("Connect your wallet first.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await withdrawFromVault(wallet.adapter, publicKey);

    if (result.success && result.signature) {
      setTxSig(result.signature);
      setSuccess("Withdrawal confirmed on-chain! Funds returned to your wallet.");
      setPosition(null);
      await loadData();
    } else {
      setError(result.error || "Withdrawal failed.");
    }
    setLoading(false);
  }

  const parsedAmount = parseFloat(amount) || 0;
  const walletStr    = publicKey?.toBase58() || "";

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      <div>
        <h1 className="text-3xl font-bold">Deposit / Withdraw</h1>
        <p className="text-gray-400 text-sm mt-1">
          Deposit USDC directly on-chain into SolNeutral vault via Anchor smart contract.
        </p>
      </div>

      {/* Program info */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-blue-400 text-xs font-medium">Smart contract · Solana Devnet</p>
          <p className="text-gray-400 text-xs font-mono mt-0.5">
            {PROGRAM_ID.toBase58().slice(0, 24)}...
          </p>
        </div>
        <a
          href={formatSolscanAccount(PROGRAM_ID.toBase58())}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 text-xs hover:underline"
        >
          Solscan →
        </a>
      </div>

      {/* Not connected */}
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
              Connect Phantom or Solflare to deposit USDC on-chain into SolNeutral.
            </p>
          </div>
          <WalletButton fullWidth className="py-3.5 text-base max-w-xs mx-auto" />
        </div>
      ) : (
        <>
          {/* Wallet info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-mono text-sm">{truncateAddress(walletStr, 6)}</p>
                  <p className="text-emerald-400 text-xs">Connected · Solana</p>
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
                  href={formatSolscanAccount(walletStr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline"
                >
                  Solscan →
                </a>
              </div>
            </div>
          </div>

          {/* Active position */}
          {position?.isActive && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-emerald-400 font-semibold">Your vault position</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  position.isLocked
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {position.isLocked ? `Locked · ${position.daysRemaining}d left` : "Unlocked ✓"}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Deposited</p>
                  <p className="text-white font-bold">{formatUSDC(position.depositedAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Yield earned</p>
                  <p className="text-emerald-400 font-bold">{formatUSDC(accruedYield)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Current value</p>
                  <p className="text-white font-bold">{formatUSDC(position.depositedAmount + accruedYield)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Days in vault</p>
                  <p className="text-white font-bold">{position.daysInVault}d</p>
                </div>
              </div>
              {position.unlockDate && (
                <p className="text-gray-500 text-xs mt-3">
                  Unlocks on {formatDate(position.unlockDate.toISOString())}
                </p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-900 border border-gray-800 rounded-xl">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); setTxSig(null); }}
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
              <div>
                <h2 className="font-semibold text-lg">Deposit USDC on-chain</h2>
                <p className="text-gray-500 text-xs mt-1">
                  USDC only · Min 10 USDC · 90-day lock · {NET_APY}% net APY
                </p>
              </div>

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
                  {[10, 50, 100, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className={`flex-1 py-2 text-xs rounded-lg transition-colors ${
                        parsedAmount === v
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
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
                  {[
                    { label: "1 hour",  mult: 1 / (365 * 24) },
                    { label: "1 day",   mult: 1 / 365         },
                    { label: "90 days", mult: 90 / 365        },
                    { label: "1 year",  mult: 1               },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="text-emerald-400 font-medium">
                        +{formatUSDC(parsedAmount * (NET_APY / 100) * row.mult)}
                      </span>
                    </div>
                  ))}
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
                    Deposits are locked on-chain for 90 days. The smart contract enforces this automatically.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={loading || parsedAmount < 10}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-bold text-lg rounded-xl transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                    Signing on-chain transaction...
                  </span>
                ) : parsedAmount >= 10 ? (
                  `Deposit ${formatUSDC(parsedAmount)} on-chain`
                ) : (
                  "Enter amount to deposit"
                )}
              </button>

              {txSig && (
                <a
                  href={formatSolscanTx(txSig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-blue-400 text-sm hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Transaction confirmed on Solana · View on Solscan
                </a>
              )}
            </div>
          )}

          {/* Withdraw form */}
          {tab === "withdraw" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-lg">Withdraw USDC</h2>
                <p className="text-gray-500 text-xs mt-1">
                  Available after 90-day lock · Principal + yield returned on-chain
                </p>
              </div>

              {position?.isActive ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="You will receive"
                      value={formatUSDC(position.depositedAmount + accruedYield)}
                      sub="Principal + yield"
                      accent="green"
                    />
                    <StatCard
                      label="Lock status"
                      value={position.isLocked ? "Locked" : "Ready"}
                      sub={position.isLocked ? `${position.daysRemaining} days left` : "Withdraw now ✓"}
                      accent={position.isLocked ? "amber" : "green"}
                    />
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || position.isLocked}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-lg rounded-xl transition-all"
                  >
                    {loading
                      ? "Processing on-chain..."
                      : position.isLocked
                      ? `Locked · ${position.daysRemaining} days remaining`
                      : "Withdraw USDC + yield"}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-gray-500">No active on-chain position found.</p>
                  <button onClick={() => setTab("deposit")} className="text-emerald-400 text-sm hover:underline">
                    Make a deposit →
                  </button>
                </div>
              )}

              {txSig && (
                <a
                  href={formatSolscanTx(txSig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-blue-400 text-sm hover:underline"
                >
                  Transaction confirmed · View on Solscan →
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
              {success}
            </div>
          )}
        </>
      )}
    </div>
  );
}