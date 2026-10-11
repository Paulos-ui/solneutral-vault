import type { Metadata } from 'next';
import { RiskAnalyst } from '@/components/RiskAnalyst';
export const metadata:Metadata={title:'Explainable Risk Analyst'};
export default function AnalystPage(){return <div className="shell inner-page terminal-page"><div className="page-kicker"><span className="small-disc"/> RISK INTELLIGENCE / EXPLAINABLE ANALYST <span>NO AUTONOMOUS EXECUTION</span></div><div className="terminal-heading"><div><span className="eyebrow">CLARITY BEFORE CONVICTION</span><h1>QUESTION<br/><em>THE YIELD.</em></h1><p>Ask about hedge mechanics, hypothetical market shocks, and funding reversals. Every answer is tied to identified evidence and transparent calculations.</p></div></div><RiskAnalyst/></div>}
