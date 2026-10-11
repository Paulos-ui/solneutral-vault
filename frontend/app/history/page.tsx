'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectWallet } from '@/components/ConnectWallet';
import { useSolNeutralLive } from '@/lib/use-solneutral-live';
import { shortSignature } from '@/lib/dashboard-view';
import { Icon } from '@/components/Icons';
export default function HistoryPage(){
 const {connected}=useWallet();const data=useSolNeutralLive();
 return <div className="sn-dashboard sn-workspace-page"><div className="sn-dashboard-intro"><div><span className="sn-eyebrow"><i/> WALLET / PUBLIC LEDGER</span><h1>Activity history.</h1><p>Recent confirmed devnet wallet signatures, linked to Solana Explorer.</p></div><button className="sn-plain-btn" disabled={!connected} onClick={data.refresh}><Icon name="pulse" size={17}/> Refresh</button></div>
 {!connected?<section className="sn-dash-card sn-gated-section"><h2>Connect to inspect history</h2><p>Your wallet is the only source of identity. SolNeutral never asks for your private keys.</p><ConnectWallet/></section>:
 <section className="sn-dash-card"><div className="sn-dash-card-head"><div><h2>Recent wallet activity</h2><p>Up to 12 latest devnet signatures · {data.address?.slice(0,6)}…{data.address?.slice(-5)}</p></div><span className="sn-dash-tag">{data.status==='verified'?'DEVNET VERIFIED':data.status.toUpperCase()}</span></div>
 {data.status==='failed'?<p role="alert">{data.message}</p>:!data.historyAvailable?<p>Loading public history, or the RPC is temporarily unavailable.</p>:data.signatures.length===0?<p>No devnet wallet transactions were returned. This is not evidence of a zero trading balance.</p>:<div className="sn-history-table"><div className="sn-history-row sn-history-labels"><span>Transaction</span><span>Status</span><span>Observed time</span><span>Explorer</span></div>{data.signatures.map(item=><div className="sn-history-row" key={item.signature}><span><Icon name="history" size={17}/>{shortSignature(item.signature)}</span><strong className={item.err?'sn-history-failed':'sn-history-success'}>{item.err?'Failed':'Recorded'}</strong><time>{item.blockTime?new Date(item.blockTime*1000).toLocaleString():'Block time unavailable'}</time><a href={`https://explorer.solana.com/tx/${item.signature}?cluster=devnet`} target="_blank" rel="noreferrer">View ↗</a></div>)}</div>}
 <p className="sn-fineprint">These signatures are genuine public RPC observations but are not labeled as deposits, withdrawals, or trading fills without instruction decoding.</p></section>}
 </div>
}
