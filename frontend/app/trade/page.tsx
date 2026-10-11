import type { Metadata } from 'next';
import Link from 'next/link';
import { DriftTradingLab } from '@/components/DriftTradingLab';
import { Icon } from '@/components/Icons';

export const metadata: Metadata = {
 title: 'Trade Lab — Wallet-Signed Drift Devnet Transactions',
 description: 'Connect Phantom or Solflare and test real Drift account initialization, SOL collateral deposit, withdrawal and bounded SOL-PERP orders on Solana devnet only.',
};
export default function TradePage(){return <div className="shell inner-page trade-lab-page">
 <div className="page-kicker"><span className="small-disc"/> SOLNEUTRAL / EXECUTION LAB <span>DEVNET / NO REAL FUNDS</span></div>
 <div className="trade-page-hero"><div><span className="eyebrow">WALLET-SIGNED · AUDITABLE · PROTOCOL DIRECT</span><h1>FROM INSIGHT<br/>TO <em>ACTION.</em></h1></div><div><p>Genuine transactions, an explicit network identity, and an evidence trail. We test on Solana devnet first, then harden before mainnet.</p><Link href="/docs">UNDERSTAND THE SAFETY MODEL <Icon name="arrowUp" size={16}/></Link></div></div>
 <DriftTradingLab/>
 </div>}
