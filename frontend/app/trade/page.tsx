import type {Metadata} from 'next';
import Link from 'next/link';
import {SolReserve} from '@/components/SolReserve';
import {DemoTradeDesk} from '@/components/DemoTradeDesk';
import {SolPriceChart} from '@/components/SolPriceChart';

export const metadata:Metadata={
  title:'Trade Lab — SolNeutral Testnet',
  description:'SolNeutral Trade Lab combines real wallet-owned SOL reserve actions on Solana testnet with local demo SOL trading.'
};

export default function TradePage(){
  return <div className="shell inner-page trade-lab-page sn-trade-page">
    <div className="sn-trade-page-intro sn-trade-page-branding">
      <div>
        <span className="sn-eyebrow"><i/> SOLNEUTRAL / SOLANA TESTNET</span>
        <h1>Trade Lab.</h1>
        <p>Use real wallet-owned testnet SOL on one side and try demo SOL trading on the other — in one cleaner workspace.</p>
      </div>
      <div className="sn-trade-page-links">
        <Link href="/dashboard">Open dashboard ↗</Link>
        <Link href="/docs">How it works ↗</Link>
      </div>
    </div>

    <SolReserve/>

    <section className="sn-trade-dual-grid" aria-label="Trade workspace">
      <DemoTradeDesk/>
      <section className="sn-dash-card sn-trade-guide">
        <div className="sn-dash-card-head">
          <div>
            <span className="sn-eyebrow"><i/> SOLNEUTRAL · QUICK START</span>
            <h2>How users interact now</h2>
            <p>Keep the flow simple: fund testnet SOL, move it into the reserve if needed, and practice ideas with demo trades.</p>
          </div>
          <span className="sn-dash-tag">3 STEPS</span>
        </div>
        <div className="sn-trade-steps">
          <article><strong>01</strong><div><h3>Get test SOL</h3><p>Connect Phantom or Solflare, switch to Solana Testnet, and use the in-app <strong>Get 0.5 test SOL</strong> button.</p></div></article>
          <article><strong>02</strong><div><h3>Manage reserve</h3><p>Deposit SOL into your wallet-owned reserve or withdraw it back. Every real action requires your signature.</p></div></article>
          <article><strong>03</strong><div><h3>Trade in demo mode</h3><p>Open a simulated long or short using the live SOL/USD reference. No real order is sent.</p></div></article>
        </div>
        <div className="sn-trade-guide-note">
          <strong>Important</strong>
          <p>Demo trades are not tied to the reserve balance yet. They exist so users can interact with a clean trading experience without Drift setup friction.</p>
        </div>
      </section>
    </section>

    <section className="sn-trade-chart-block">
      <SolPriceChart/>
    </section>
  </div>;
}
