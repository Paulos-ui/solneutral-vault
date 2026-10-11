'use client';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/ConnectWallet';
import { useSolNeutralLive } from '@/lib/use-solneutral-live';
import { Icon } from '@/components/Icons';
export default function SettingsPage(){
 const {connected,disconnect}=useWallet();const data=useSolNeutralLive();
 return <div className="sn-dashboard sn-workspace-page"><div className="sn-dashboard-intro"><div><span className="sn-eyebrow"><i/> ACCOUNT / PREFERENCES</span><h1>Workspace settings.</h1><p>Control your wallet session and review the network and privacy model.</p></div></div>
 <div className="sn-settings-grid"><section className="sn-dash-card"><div className="sn-dash-card-head"><h2>Connected wallet</h2><span className="sn-dash-tag">{connected?'CONNECTED':'DISCONNECTED'}</span></div><p className="sn-settings-address">{data.address??'Connect a wallet to view account details.'}</p><div className="sn-settings-actions"><ConnectWallet/>{connected&&<button type="button" className="sn-plain-btn" onClick={()=>void disconnect()}>Disconnect wallet</button>}</div><p className="sn-fineprint">Wallet approval remains in Phantom or Solflare. SolNeutral never receives your secret key.</p></section>
 <section className="sn-dash-card"><div className="sn-dash-card-head"><h2>Network & execution</h2><span className="sn-dash-tag">DEVNET</span></div><div className="sn-settings-facts"><div><span>Transaction network</span><strong>Solana devnet only</strong></div><div><span>RPC verification</span><strong>{data.status==='verified'?'Confirmed':data.status}</strong></div><div><span>Trading</span><strong>Wallet-authorized test assets</strong></div><div><span>SolNeutral pooled vault</span><strong>Not live</strong></div></div><Link href="/trade" className="sn-inline-link">Open Trade Lab <Icon name="arrowUp" size={15}/></Link></section>
 <section className="sn-dash-card"><div className="sn-dash-card-head"><h2>Data and transparency</h2></div><p className="sn-settings-description">Actual wallet SOL comes from a verified public devnet RPC read. Indexed funding is market-level research. Strategy stress results are clearly marked simulations, not your portfolio PnL.</p><Link href="/docs" className="sn-inline-link">Read the technical documentation ↗</Link></section></div></div>
}
