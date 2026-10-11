"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function ConnectWallet({ compact = false }: { compact?: boolean }) {
  const { publicKey, connected } = useWallet();
  const pathname = usePathname();
  const router = useRouter();
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (connected && !wasConnected.current && pathname === '/') router.push('/dashboard');
    wasConnected.current = connected;
  }, [connected, pathname, router]);
  return <div className={`solneutral-wallet-control ${compact ? "solneutral-wallet-control--compact" : ""}`}>
    <WalletMultiButton aria-label={publicKey ? "Connected wallet menu" : "Connect Phantom or Solflare"} />
  </div>;
}
