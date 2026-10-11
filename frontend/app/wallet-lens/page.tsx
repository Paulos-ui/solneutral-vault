import type { Metadata } from 'next';
import Link from 'next/link';
import { WalletLens } from '@/components/WalletLens';
import { FundingPulse } from '@/components/FundingPulse';
import { Icon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'Wallet Lens — Read-only Solana Intelligence',
  description: 'Verify native SOL and USDC balances via public Solana RPC. No wallet connection, signatures, deposits or trading.',
};

export default function WalletLensPage() {
  return <div className="shell inner-page wallet-lens-page">
    <div className="page-kicker"><span className="small-disc"/> INSTRUMENT / 03 — CHAIN INTELLIGENCE <span>MAINNET / READ-ONLY</span></div>
    <div className="wallet-page-hero">
      <div><span className="micro-label">THE PUBLIC LEDGER / RESEARCH SERIES</span><h1>VERIFY<br/><em>THE SIGNAL.</em></h1></div>
      <div><p>Markets can tell stories. The chain gives us evidence. Inspect public wallet balances alongside independently indexed funding conditions, without mixing the two.</p><span className="wallet-page-count">01 / WALLET STATE <span>↗</span> 02 / MARKET FUNDING</span></div>
    </div>
    <WalletLens />
    <div className="wallet-market-divider"><span>02 / MARKET CONTEXT</span><strong>THE OTHER SIDE OF THE SIGNAL.</strong><span>↘</span></div>
    <FundingPulse/>
    <div className="drift-page-bridge"><span className="micro-label">NEXT INSTRUMENT / DRIFT SUBACCOUNTS</span><p>Explore program ownership and indexer records for a Drift V2 User account.</p><Link href="/drift-lens">OPEN DRIFT LENS <Icon name="arrowUp" size={16}/></Link></div>
    <div className="wallet-research-cta"><div><span className="micro-label">NEXT / UNDERSTAND THE EXPOSURE</span><h2>Balances are not <em>a hedge.</em></h2><p>Combine public-chain observations with a transparent scenario model. Never mistake wallet holdings or market-wide funding for realized portfolio performance.</p></div><Link className="button-primary" href="/risk-lab">OPEN THE RISK LAB <Icon name="arrowUp" size={17}/></Link></div>
  </div>;
}
