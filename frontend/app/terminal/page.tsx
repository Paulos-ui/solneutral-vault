import type { Metadata } from 'next';
import Link from 'next/link';
import { IntelligenceTerminal } from '@/components/IntelligenceTerminal';
export const metadata:Metadata={title:'Intelligence Terminal'};
export default function TerminalPage(){return <div className="shell inner-page terminal-page"><div className="page-kicker"><span className="small-disc"/> SOLNEUTRAL / INTELLIGENCE TERMINAL <span>01 / RESEARCH PLATFORM</span></div><div className="terminal-heading"><div><span className="eyebrow">A CLEARER PICTURE OF THE HEDGE</span><h1>THE MARKET<br/><em>BEHIND THE YIELD.</em></h1><p>One integrated instrument for observed Drift funding, deterministic position stress, risk findings and strategy comparison. No manufactured APY.</p></div><Link className="text-link" href="/docs">HOW THE SIGNALS WORK ↗</Link></div><IntelligenceTerminal/></div>}
