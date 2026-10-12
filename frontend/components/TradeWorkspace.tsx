'use client';
import {useState} from 'react';
import {SolPriceChart} from '@/components/SolPriceChart';
import {DemoTradeDesk} from '@/components/DemoTradeDesk';

export type DemoMarket = 'SOL'|'BONK';
export function TradeWorkspace(){
 const [market,setMarket]=useState<DemoMarket>('SOL');
 return <section className="sn-v762-trade-suite" aria-label="SOL and BONK paper trading">
   <header className="sn-v762-trade-head"><div><span className="sn-eyebrow"><i/> MARKET DESK · LEARN TO TRADE</span><h2>Explore the market. Practice the trade.</h2><p>Study external spot candles on the left. Open simulated long or short positions on the right.</p></div><span className="sn-dash-tag">PAPER TRADING</span></header>
   <div className="sn-v762-market-selector" role="group" aria-label="Choose trading pair">
    <button type="button" className={market==='SOL'?'selected':''} onClick={()=>setMarket('SOL')} aria-pressed={market==='SOL'}>◎ SOL <small>SOL / USD</small></button>
    <button type="button" className={market==='BONK'?'selected':''} onClick={()=>setMarket('BONK')} aria-pressed={market==='BONK'}>◈ BONK <small>BONK / USD</small></button>
    <span>Solana ecosystem markets · Coinbase USD reference</span>
   </div>
   <div className="sn-v762-trade-columns"><div className="sn-v762-chart-column"><SolPriceChart market={market}/><div className="sn-v762-learn-strip"><strong>Learn the trade</strong><span>Long = benefits if price rises</span><span>Short = benefits if price falls</span><span>Higher leverage = larger simulated gains and losses</span></div></div><div className="sn-v762-ticket-column"><DemoTradeDesk market={market}/></div></div>
   <p className="sn-v762-trade-disclaimer">The markets are external USD spot references, not Solana testnet token liquidity. Demo positions are stored in your browser; no live swap, testnet market fill, or blockchain order is represented.</p>
 </section>;
}
