import type { Metadata } from 'next';
import Link from 'next/link';
import { DriftTradingLab } from '@/components/DriftTradingLab';
export const metadata: Metadata = {title:'Trade Lab — Drift Devnet',description:'Wallet-signed Drift devnet account creation, test collateral actions and bounded SOL-PERP orders. Not a SolNeutral pooled vault.'};
export default function TradePage(){return <div className="shell inner-page trade-lab-page sn-trade-page">
 <div className="sn-trade-page-intro"><div><span className="sn-eyebrow"><i/> DRIFT / DEVNET EXECUTION</span><h1>Trade Lab.</h1><p>Connect your wallet, verify the network, then review each on-chain action before signing.</p></div><Link href="/docs">Safety & protocol guide ↗</Link></div>
 <DriftTradingLab/>
 </div>}
