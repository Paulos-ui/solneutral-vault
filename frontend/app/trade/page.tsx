import type {Metadata} from 'next';
import Link from 'next/link';
import {SolReserve} from '@/components/SolReserve';
export const metadata:Metadata={title:'SOL Reserve — SolNeutral Testnet',description:'Wallet-signed Solana testnet SOL reserve: move native SOL into your wallet-owned wSOL account and withdraw all back to native SOL.'};
export default function TradePage(){return <div className="shell inner-page trade-lab-page sn-trade-page"><div className="sn-trade-page-intro"><div><span className="sn-eyebrow"><i/> SOLNEUTRAL / SOLANA TESTNET</span><h1>Trade Lab.</h1><p>Your personal SOL reserve. Deposit and withdraw test SOL without Drift or USDC.</p></div><Link href="/docs">How it works ↗</Link></div><SolReserve/></div>}
