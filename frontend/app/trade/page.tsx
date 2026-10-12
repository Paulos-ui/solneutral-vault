import type {Metadata} from 'next';
import Link from 'next/link';
import {SolReserve} from '@/components/SolReserve';
import {TradeWorkspace} from '@/components/TradeWorkspace';

export const metadata:Metadata={
 title:'Trade Lab — SolNeutral Testnet',
 description:'Explore SOL and BONK demo markets, practice long and short trades, and manage a wallet-owned Solana testnet SOL reserve.'
};

export default function TradePage(){return <div className="shell inner-page trade-lab-page sn-trade-page">
 <div className="sn-trade-page-intro sn-trade-page-branding"><div><span className="sn-eyebrow"><i/> SOLNEUTRAL · TRADE LAB</span><h1>Trade Lab.</h1><p>Learn Solana markets through live-price research and paper trading. Testnet SOL reserve actions remain separate.</p></div><div className="sn-trade-page-links"><Link href="/dashboard">Dashboard ↗</Link><Link href="/docs">Trading guide ↗</Link></div></div>
 <TradeWorkspace/>
 <div className="sn-v762-reserve-section"><div className="sn-v762-reserve-heading"><span className="sn-eyebrow"><i/> TESTNET WALLET</span><h2>Manage your SOL reserve</h2><p>When you are ready to use testnet SOL, request test funds, then sign a wallet-owned reserve deposit or withdrawal. This does not fund demo positions.</p></div><SolReserve/></div>
 </div>}
