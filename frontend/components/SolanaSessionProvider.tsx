"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

/** Testnet RPC is verified against its genesis hash before any signed action. */
export const TESTNET_RPC_FALLBACK = "https://api.testnet.solana.com";

export function SolanaSessionProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() =>
    process.env.NEXT_PUBLIC_TESTNET_RPC_URL?.trim() || TESTNET_RPC_FALLBACK, []);
  // Wallet Standard discovers Phantom and Solflare without importing dozens of legacy adapters.
  const wallets = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
