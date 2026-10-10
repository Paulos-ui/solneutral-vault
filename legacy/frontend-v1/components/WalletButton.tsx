"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";

// Truncate wallet address for display
function truncate(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

interface WalletButtonProps {
  className?: string;
  fullWidth?: boolean;
}

export default function WalletButton({
  className = "",
  fullWidth = false,
}: WalletButtonProps) {
  const { publicKey, connected, connecting, disconnect, select, wallets } =
    useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  const handleConnect = useCallback(() => {
    if (connected) {
      setShowMenu(!showMenu);
    } else {
      setShowWallets(true);
    }
  }, [connected, showMenu]);

  const handleSelectWallet = useCallback(
    (walletName: any) => {
      select(walletName);
      setShowWallets(false);
    },
    [select]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowMenu(false);
  }, [disconnect]);

  const baseClass = `relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  // ── Wallet selector modal ──────────────────
  if (showWallets) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">Connect wallet</h3>
            <button
              onClick={() => setShowWallets(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            Connect your Solana wallet to deposit into SolNeutral vault.
          </p>
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.adapter.name}
                onClick={() => handleSelectWallet(wallet.adapter.name)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500/40 rounded-xl transition-all"
              >
                {wallet.adapter.icon && (
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="w-8 h-8 rounded-lg"
                  />
                )}
                <span className="text-white font-medium">
                  {wallet.adapter.name}
                </span>
                <span className="ml-auto text-gray-500 text-xs">
                  {wallet.readyState === "Installed" ? "Detected" : "Install"}
                </span>
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-xs text-center">
            By connecting, you agree to use SolNeutral on Solana Devnet.
          </p>
        </div>
      </div>
    );
  }

  // ── Connected state ────────────────────────
  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className={`${baseClass} px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          {truncate(publicKey.toBase58())}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-gray-400 text-xs">Connected wallet</p>
              <p className="text-white text-sm font-mono mt-0.5">
                {truncate(publicKey.toBase58())}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey.toBase58());
                setShowMenu(false);
              }}
              className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-800 text-sm transition-colors"
            >
              Copy address
            </button>
            <a
              href={`https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2.5 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
              onClick={() => setShowMenu(false)}
            >
              View on Solscan →
            </a>
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10 text-sm transition-colors border-t border-gray-800"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Disconnected state ─────────────────────
  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className={`${baseClass} px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 text-sm`}
    >
      {connecting ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect wallet"
      )}
    </button>
  );
}
