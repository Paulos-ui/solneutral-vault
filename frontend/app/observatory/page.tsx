import type { Metadata } from "next";
import Link from "next/link";
import { HedgeField } from "@/components/HedgeField";
import { ExposureChart } from "@/components/ExposureChart";
import { FundingPulse } from "@/components/FundingPulse";
import { Icon } from "@/components/Icons";
export const metadata: Metadata = { title: "Observatory" };
export default function Observatory() {
 return <div className="shell inner-page sn-v6-inner">
  <header className="sn-v6-page-head"><div><span className="sn-eyebrow"><i/> RESEARCH / OBSERVATORY</span><h1>Hedge Observatory</h1><p>Adjust the balance, inspect indexed SOL-PERP funding and track which data is verified.</p></div><Link href="/trade" className="sn-trade-cta">Open Trade Lab <Icon name="arrowUp" size={16}/></Link></header>
  <div className="sn-v6-observe-grid"><section className="sn-v6-instrument"><div className="sn-v6-instrument-head"><span>HEDGE BALANCE</span><strong>ILLUSTRATIVE / NOT YOUR POSITION</strong></div><HedgeField/></section><aside className="sn-v6-explain"><div className="sn-v6-explain-tag">WHAT YOU'RE SEEING</div><h2>One hedge.<br/>Two exposures.</h2><p>Moving the counterweight shows a theoretical spot/perpetual balance. The diagram does not read an open trade, vault balance or liquidation level.</p><div className="sn-v6-evidence-row"><span>Exposure diagram</span><strong>MODELED</strong></div><div className="sn-v6-evidence-row"><span>Funding source</span><strong>DRIFT INDEXER</strong></div><div className="sn-v6-evidence-row"><span>Collateral & PnL</span><strong>NOT VERIFIED HERE</strong></div><Link href="/drift-lens" className="sn-inline-link">Inspect a Drift account ↗</Link></aside></div>
  <div className="sn-v6-observed"><FundingPulse/></div>
  <details className="sn-v6-details"><summary>Explore the theoretical exposure chart <Icon name="arrowUp" size={16}/></summary><div className="sn-v6-details-body"><ExposureChart/></div></details>
 </div>;
}
