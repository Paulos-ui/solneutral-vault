import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = rel => readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
test('V6 keeps four top navigation routes with the dashboard as home',()=>{
 const h=read('components/SiteHeader.tsx');
 assert.match(h,/href:'\/dashboard'/);assert.match(h,/href:'\/observatory'/);
 assert.match(h,/href:'\/trade'/);assert.match(h,/href:'\/docs'/);
 const b=read('components/Brand.tsx');assert.match(b,/inApp \? '\/dashboard'/);
});
test('Docs remain in the persistent sidebar workspace',()=>{
 assert.match(read('components/AppShell.tsx'),/'\/docs'\]/);
 assert.match(read('app/docs/page.tsx'),/className="docs-layout"/);
});
test('Trade desk organizes signed actions into four distinct safe panes',()=>{
 const s=read('components/DriftTradingLab.tsx');
 for(const tab of ['trade','collateral','account','orders'])assert.ok(s.includes(`id:'${tab}'`));
 assert.match(s,/assertDevnetGenesis/);assert.match(s,/validateDevnetAmount/);
 assert.match(s,/executeDriftDevnetAction/);assert.match(s,/aria-selected={tab===item.id}/);
 assert.match(s,/disabled={!ready\|\|!approved}/);
 assert.match(s,/Trading collateral \/ PnL/);
});
test('Analyst actions remain read-only and optional model has private gate',()=>{
 const s=read('components/RiskAnalyst.tsx');
 assert.match(s,/buildResearchBrief/);assert.match(s,/x-solneutral-demo-token/);
 assert.match(s,/READ ONLY/);assert.doesNotMatch(s,/executeDriftDevnetAction/);
});
test('Risk and market states do not misrepresent model as live portfolio',()=>{
 assert.match(read('app/observatory/page.tsx'),/ILLUSTRATIVE \/ NOT YOUR POSITION/);
 assert.match(read('app/risk-lab/page.tsx'),/HYPOTHETICAL \/ NOT A FORECAST/);
 assert.match(read('components/SolNeutralDashboard.tsx'),/Refresh source/);
 assert.match(read('components/SolNeutralDashboard.tsx'),/Not verified|not yet decoded|Inspect Drift/);
});
