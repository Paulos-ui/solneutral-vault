"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

/** Only the DEVNET RPC is used for signed actions. An RPC configured for another network fails closed. */
export const DEVNET_RPC_FALLBACK = "https://api.devnet.solana.com";

export function SolanaSessionProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() =>
    process.env.NEXT_PUBLIC_DEVNET_RPC_URL?.trim() || DEVNET_RPC_FALLBACK, []);
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
