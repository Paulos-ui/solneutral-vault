import Link from "next/link";
import { Brand } from "./Brand";
import { Icon } from "./Icons";
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="shell">
      <div className="footer-top">
        <div><span className="eyebrow">A BETTER QUESTION TO ASK</span><h2>What&apos;s under<br/><em>the yield?</em></h2></div>
        <div className="footer-cta"><p>Know the exposure. Understand the trade. Respect the risk.</p><Link href="/risk-lab" className="round-arrow" aria-label="Try the risk simulator"><Icon name="arrowUp" size={29}/></Link></div>
      </div>
      <div className="footer-bottom"><Brand footer/><div className="footer-links"><Link href="/terminal">Intelligence</Link><Link href="/trade">Trade Lab</Link><Link href="/analyst">AI Analyst</Link><Link href="/risk-engine">Risk Engine</Link><Link href="/wallet-lens">Wallet Lens</Link><Link href="/drift-lens">Drift Lens</Link><Link href="/about">About</Link><Link href="/docs">Documentation</Link><a href="https://x.com/instators" target="_blank" rel="noopener noreferrer">X / @instators <Icon name="arrowUp" size={12}/></a></div><span className="footer-credit">FOUNDED BY WEB3 SUPPORTER<br/>BUILT FOR THE SOLANA ECOSYSTEM</span></div>
      <div className="footer-legal"><span>© 2026 SOLNEUTRAL. EXPERIMENTAL RESEARCH + DEVNET LAB.</span><span>SIMULATIONS ARE NOT FINANCIAL ADVICE. DEVNET DRIFT TRANSACTIONS ONLY. NO LIVE VAULT DEPOSITS.</span></div>
    </div>
  </footer>;
}
