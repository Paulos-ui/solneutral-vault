"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="50" height="50" rx="13" stroke="currentColor" strokeOpacity=".25" />
      <path d="M10 33.5C17 33.5 16.5 18.5 25.5 18.5S35 33.5 42 33.5" stroke="#C7FF91" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M10 18.5C17 18.5 16.5 33.5 25.5 33.5S35 18.5 42 18.5" stroke="#7DE6AB" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="25.5" cy="26" r="3" fill="#EDF1DF" />
    </svg>
  );
}

export function Brand({ footer = false }: { footer?: boolean }) {
  const pathname = usePathname();
  const inApp = ['/dashboard','/terminal','/observatory','/trade','/analyst','/history','/risk-lab','/risk-engine','/wallet-lens','/drift-lens','/settings','/docs'].some(path=>pathname===path || pathname.startsWith(path+'/'));
  return (
    <Link href={footer ? '/' : inApp ? '/dashboard' : '/'} className={`brand ${footer ? "brand-footer" : ""}`} aria-label={inApp && !footer ? "SolNeutral dashboard" : "SolNeutral home"}>
      <BrandMark size={40} />
      <span className="brand-word">SOL<span>NEUTRAL</span><small className="sn-brand-network">SOL TESTNET</small></span>
    </Link>
  );
}
