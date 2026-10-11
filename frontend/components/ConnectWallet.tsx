"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export function ConnectWallet({ compact = false }: { compact?: boolean }) {
  const { publicKey } = useWallet();
  return <div className={`solneutral-wallet-control ${compact ? "solneutral-wallet-control--compact" : ""}`}>
    <WalletMultiButton aria-label={publicKey ? "Connected wallet menu" : "Connect Phantom or Solflare"} />
  </div>;
}
