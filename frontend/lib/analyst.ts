import { analyzeSnapshot, type IntelligenceSnapshot } from './intelligence.ts';
import { calculatePositionStress } from './position-risk.ts';

export function isValidQuestion(question: unknown): question is string {
 return typeof question==='string' && question.trim().length>=8 && question.length<=500 && !/[\u0000-\u001f]/.test(question);
}

export function buildResearchBrief(snapshot: IntelligenceSnapshot, question:string){
 if(!isValidQuestion(question))throw new RangeError('Question must be 8–500 characters');
 const results=calculatePositionStress(snapshot.assumptions);
 const findings=analyzeSnapshot(snapshot);
 const min=Math.min(...results.shocks.map(s=>s.estimatedBufferUsd));
 const maxLoss=Math.min(...results.shocks.map(s=>s.combinedPnlUsd));
 const factual=`In your hypothetical model the net delta is ${results.netDeltaBaseSol.toFixed(2)} SOL (${results.residualDeltaPctOfGross.toFixed(2)}% of gross notional). The lowest modeled collateral buffer across seven shocks is $${min.toFixed(2)} and the worst illustrated PnL is $${maxLoss.toFixed(2)}. ${snapshot.funding.status==='observed'?`The latest INDEXED market-wide funding observation was ${snapshot.funding.hourlyPct?.toFixed(5)}%/hour and ${snapshot.funding.ageMinutes} minutes old.`:'No fresh market funding has been verified.'}`;
 const questionLower=question.toLowerCase();
 let focus='The main things to investigate are the model assumptions, hedge drift, available margin collateral, and the freshness of funding records.';
 if(/fund|yield|apy|carry|earn/.test(questionLower)) focus='Funding can reverse and accumulated returns depend on actual executed exposure. An indexed hourly value is not realized vault yield and annualizing it does not create a forecast.';
 else if(/liquid|collat|leverage|margin|buffer/.test(questionLower))focus='The collateral buffer is a user-chosen proxy, not Drift margin health. For real liquidation analysis you would need decoded positions, collateral weights, oracle prices, and current Drift risk rules.';
 else if(/drop|fall|crash|rise|pump|price|sol/.test(questionLower))focus='In the shock matrix, spot PnL and perpetual PnL move in opposing directions. The hedge only offsets price movement to the extent that base quantities and execution remain aligned.';
 const caveat='These figures are hypothetical and are not a recommendation, executed trade, guaranteed return, or a real-time Drift margin/liquidation calculation.';
 return { mode:'deterministic' as const, answer:`${factual}\n\n${focus}\n\n${caveat}`, findings, provenance:['Manual scenario assumptions','SolNeutral deterministic position stress engine',snapshot.funding.status==='observed'?'Drift indexed market funding (not on-chain vault earnings)':'Funding unavailable or delayed'], warnings:[caveat] };
}
