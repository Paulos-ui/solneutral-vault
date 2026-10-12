import type { Metadata } from 'next';
import { RiskAnalyst } from '@/components/RiskAnalyst';
export const metadata: Metadata = { title: 'SolNeutral AI' };
export default function AnalystPage(){return <div className="shell inner-page sn-v6-inner"><header className="sn-v6-page-head"><div><span className="sn-eyebrow"><i/> EVIDENCE-LED INTELLIGENCE</span><h1>SolNeutral AI</h1><p>Ask about SOL reserves, withdrawals, testnet setup, hedging, or anything else, naturally.</p></div><span className="sn-v6-page-note">READ ONLY · NO TRADE AUTHORITY</span></header><RiskAnalyst/></div>}
