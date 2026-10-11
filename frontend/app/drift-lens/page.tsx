import type { Metadata } from 'next';
import Link from 'next/link';
import { DriftAccountLens } from '@/components/DriftAccountLens';
import { Icon } from '@/components/Icons';
export const metadata: Metadata = {
  title: 'Drift Lens — Account Provenance',
  description: 'Read-only Drift V2 User subaccount verification and indexed position record observations. No signing or deposits.',
};
export default function DriftLensPage() {
  return <div className="shell inner-page drift-lens-page">
    <div className="page-kicker"><span className="small-disc"/> INSTRUMENT / 04 — DRIFT INTELLIGENCE <span>RPC + INDEXER / NO EXECUTION</span></div>
    <div className="drift-page-hero"><div><span className="micro-label">THE VERIFICATION LAYER / VOL. 001</span><h1>TRACE<br/><em>THE POSITION.</em></h1></div><div><p>Before we talk about leverage, risk or returns, we establish the most basic fact: <strong>is this actually a Drift account?</strong></p><span className="drift-page-counter">01 / PROGRAM OWNERSHIP &nbsp;↗&nbsp; 02 / INDEXED RECORDS</span></div></div>
    <DriftAccountLens/>
    <div className="drift-page-bridge"><span className="micro-label">NEXT / MANUAL STRESS TEST</span><p>Want to explore hypothetical price shocks and collateral buffers without claiming live position accuracy?</p><Link href="/risk-engine">OPEN POSITION RISK ENGINE <Icon name="arrowUp" size={16}/></Link></div>
    <div className="drift-page-bridge"><span className="micro-label">PUBLIC HOLDINGS ≠ PROTOCOL COLLATERAL</span><p>Need native SOL or canonical USDC wallet balances instead?</p><Link href="/wallet-lens">OPEN WALLET LENS <Icon name="arrowUp" size={16}/></Link></div>
  </div>;
}
