import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
export const metadata: Metadata = { title: "Vault Status" };
export default function DepositStatus() {
  return <div className="shell inner-page deposit-page"><div className="page-kicker"><span className="small-disc"/> VAULT / RELEASE STATUS <span>GUARDED / NON-CUSTODIAL PREVIEW</span></div><div className="deposit-shell"><div className="deposit-icon"><Icon name="shield" size={43}/></div><span className="micro-label">TRANSACTION LAYER / IN DEVELOPMENT</span><h1>NOT OPEN<br/><em>FOR DEPOSITS.</em></h1><p>We are rebuilding SolNeutral&apos;s on-chain accounting and risk controls before reintroducing fund-moving functionality. This preview does not request wallet signatures, accept USDC, or promise yield.</p><div className="deposit-badges"><span>DEPOSIT: DISABLED</span><span>WITHDRAW: DISABLED</span><span>LIVE PNL: UNAVAILABLE</span></div><div className="inline-buttons"><Link href="/risk-lab" className="button-primary">EXPLORE THE SIMULATOR <Icon name="arrowUp" size={18}/></Link><Link href="/docs" className="text-link">READ THE RELEASE POLICY <Icon name="arrowUp" size={15}/></Link></div></div></div>;
}
