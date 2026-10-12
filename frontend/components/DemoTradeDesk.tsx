'use client';
import {useEffect,useMemo,useState} from 'react';
import type {DemoMarket} from '@/components/TradeWorkspace';

type Direction='long'|'short';
type DemoPosition={id:string;market:DemoMarket;side:Direction;quantity:number;entry:number;leverage:number;marginUsd:number;openedAt:string};
type Quote={price:number|null;status:'loading'|'observed'|'stale'|'unavailable';asOf:string|null};
type MarketResponse={status?:string;price?:number;asOf?:string;message?:string;candles?:{close:number}[]};
type DemoLedger={positions:DemoPosition[];realizedPnlUsd:number};
const INITIAL_DEMO_BALANCE=10000;
const STORE_KEY='solneutral-paper-account-v762';
const emptyQuote:Quote={price:null,status:'loading',asOf:null};
const fmtUsd=(value:number)=>`${value<0?'−':''}$${Math.abs(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtPrice=(value:number,market:DemoMarket)=>`$${value.toLocaleString('en-US',{minimumFractionDigits:market==='BONK'?8:2,maximumFractionDigits:market==='BONK'?8:2})}`;
const fmtQuantity=(value:number,market:DemoMarket)=>value.toLocaleString('en-US',{maximumFractionDigits:market==='BONK'?0:4});
function validPosition(value:unknown):value is DemoPosition{
 if(!value||typeof value!=='object')return false;
 const item=value as Partial<DemoPosition>;
 return typeof item.id==='string'&&item.id.length<90&&(item.market==='SOL'||item.market==='BONK')&&(item.side==='long'||item.side==='short')&&
  [item.quantity,item.entry,item.leverage,item.marginUsd].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0)&&
  typeof item.openedAt==='string';
}
function getStoredLedger():DemoLedger{
 if(typeof window==='undefined')return {positions:[],realizedPnlUsd:0};
 try{const data=JSON.parse(window.localStorage.getItem(STORE_KEY)??'null') as Partial<DemoLedger>|null;
  return {positions:Array.isArray(data?.positions)?data.positions.filter(validPosition).slice(0,20):[],
   realizedPnlUsd:typeof data?.realizedPnlUsd==='number'&&Number.isFinite(data.realizedPnlUsd)?data.realizedPnlUsd:0};
 }catch{return {positions:[],realizedPnlUsd:0};}
}
function positionPnl(position:DemoPosition,price:number):number{
 return (price-position.entry)*position.quantity*(position.side==='long'?1:-1);
}
export function DemoTradeDesk({market}:{market:DemoMarket}){
 const [quotes,setQuotes]=useState<Record<DemoMarket,Quote>>({SOL:emptyQuote,BONK:emptyQuote});
 const [side,setSide]=useState<Direction>('long');
 const [marginInput,setMarginInput]=useState('100');
 const [leverage,setLeverage]=useState('2');
 const [ledger,setLedger]=useState<DemoLedger>({positions:[],realizedPnlUsd:0});
 const [hydrated,setHydrated]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{setLedger(getStoredLedger());setHydrated(true);},[]);
 useEffect(()=>{if(!hydrated)return;try{window.localStorage.setItem(STORE_KEY,JSON.stringify(ledger));}catch{}},[ledger,hydrated]);
 useEffect(()=>{
  let active=true;
  async function update(){
   await Promise.all((['SOL','BONK'] as const).map(async symbol=>{
    try{
     const response=await fetch(`/api/market/sol-chart?interval=1m&market=${symbol}`,{cache:'no-store'});
     const result=await response.json() as MarketResponse;
     const price=result.price;
     const status=result.status==='observed'?'observed':result.status==='stale'?'stale':'unavailable';
     const quote:Quote={price:response.ok&&typeof price==='number'&&Number.isFinite(price)&&price>0?price:null,status:response.ok?status:'unavailable',asOf:result.asOf??null};
     if(active)setQuotes(previous=>({...previous,[symbol]:quote}));
    }catch{if(active)setQuotes(previous=>({...previous,[symbol]:{price:null,status:'unavailable',asOf:null}}));}
   }));
  }
  void update();const timer=window.setInterval(()=>{void update();},30000);
  return()=>{active=false;window.clearInterval(timer);};
 },[]);
 const quote=quotes[market];
 const marginUsd=Number(marginInput);
 const leverageValue=Number(leverage);
 const tradeNotional=Number.isFinite(marginUsd)?marginUsd*leverageValue:null;
 const floating=useMemo(()=>ledger.positions.reduce((sum,position)=>{
  const current=quotes[position.market].price;
  return current===null?sum:sum+positionPnl(position,current);
 },0),[ledger.positions,quotes]);
 const reserved=useMemo(()=>ledger.positions.reduce((sum,position)=>sum+position.marginUsd,0),[ledger.positions]);
 const cash=INITIAL_DEMO_BALANCE+ledger.realizedPnlUsd;
 const buyingPower=cash-reserved;
 const missingValuation=ledger.positions.some(position=>quotes[position.market].price===null);
 const canTrade=hydrated&&quote.status==='observed'&&quote.price!==null;
 function openPosition(){
  setMessage('');
  if(!canTrade||quote.price===null){setMessage('Market quote is not fresh. Wait for an observed Coinbase price before paper trading.');return;}
  if(!Number.isFinite(marginUsd)||marginUsd<10||marginUsd>2000){setMessage('Use $10–$2,000 in demo margin.');return;}
  if(marginUsd>buyingPower){setMessage('Insufficient virtual cash. Close an open position or use a smaller demo margin.');return;}
  if(ledger.positions.length>=20){setMessage('Close an existing demo trade before adding more.');return;}
  const quantity=marginUsd*leverageValue/quote.price;
  if(!Number.isFinite(quantity)||quantity<=0){setMessage('Unable to calculate position size from the reference quote.');return;}
  const newPosition:DemoPosition={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,market,side,quantity,entry:quote.price,leverage:leverageValue,marginUsd,openedAt:new Date().toISOString()};
  setLedger(previous=>({...previous,positions:[newPosition,...previous.positions]}));
  setMessage(`Demo ${market} ${side.toUpperCase()} opened at ${fmtPrice(quote.price,market)}. No wallet transaction was created.`);
 }
 function closePosition(position:DemoPosition){
  const current=quotes[position.market];
  if(current.price===null||current.status!=='observed'){setMessage(`Can't close ${position.market} yet: a fresh market quote is required.`);return;}
  const pnl=positionPnl(position,current.price);
  setLedger(previous=>({positions:previous.positions.filter(item=>item.id!==position.id),realizedPnlUsd:previous.realizedPnlUsd+pnl}));
  setMessage(`Demo trade closed at ${fmtPrice(current.price,position.market)}. Realized simulated PnL ${fmtUsd(pnl)}.`);
 }
 function resetAccount(){
  if(ledger.positions.length>0){setMessage('Close each position before resetting the practice account.');return;}
  setLedger({positions:[],realizedPnlUsd:0});setMessage('Practice balance reset to $10,000.');
 }
 return <section className="sn-dash-card sn-demo-trade sn-v762-order-ticket" aria-label={`${market} demo order ticket`}>
   <div className="sn-dash-card-head"><div><span className="sn-eyebrow"><i/> PAPER ACCOUNT · {market}/USD</span><h2>Order ticket</h2><p>Practice long and short trades with a virtual USD balance.</p></div><span className="sn-dash-tag">DEMO</span></div>
   <div className="sn-v762-order-quote"><div><span>{market} spot reference</span><strong>{quote.price===null?'—':fmtPrice(quote.price,market)}</strong></div><span className={quote.status==='observed'?'sn-v762-quote-fresh':'sn-v762-quote-wait'}>{quote.status==='observed'?'● Observed':quote.status==='stale'?'Delayed price':'Awaiting quote'}</span></div>
   <div className="sn-v762-paper-balance"><div><span>Virtual equity</span><strong>{missingValuation?'—':fmtUsd(cash+floating)}</strong></div><div><span>Free demo cash</span><strong>{fmtUsd(buyingPower)}</strong></div></div>
   <div className="sn-demo-side-select" role="group" aria-label="Choose paper-trade direction"><button type="button" className={side==='long'?'active buy':'buy'} aria-pressed={side==='long'} onClick={()=>setSide('long')}>↗ Long</button><button type="button" className={side==='short'?'active sell':'sell'} aria-pressed={side==='short'} onClick={()=>setSide('short')}>↘ Short</button></div>
   <div className="sn-demo-inputs sn-v762-order-inputs"><label>Demo margin (USD)<input type="number" min="10" max="2000" step="10" inputMode="decimal" value={marginInput} onChange={event=>setMarginInput(event.target.value)}/></label><label>Leverage<select value={leverage} onChange={event=>setLeverage(event.target.value)}>{[1,2,3,5,10].map(value=><option key={value} value={value}>{value}x</option>)}</select></label></div>
   <div className="sn-v762-estimate"><div><span>Position notional</span><strong>{tradeNotional!==null&&Number.isFinite(tradeNotional)?fmtUsd(tradeNotional):'—'}</strong></div><div><span>Estimated token size</span><strong>{tradeNotional!==null&&quote.price!==null?`${fmtQuantity(tradeNotional/quote.price,market)} ${market}`:'—'}</strong></div></div>
   <button type="button" className="sn-demo-open sn-v762-order-submit" disabled={!canTrade} onClick={openPosition}>Open demo {side} ↗</button>
   <p className="sn-v762-learn-note">At {leverage}x leverage, a 1% price move changes your virtual margin by about {leverageValue}%, before costs. No real trade is sent.</p>
   {message&&<p className="sn-demo-message" role="status">{message}</p>}
   <div className="sn-demo-positions"><div className="sn-demo-positions-head"><strong>Open paper positions ({ledger.positions.length})</strong><button type="button" className="sn-inline-btn" disabled={ledger.positions.length>0} onClick={resetAccount}>Reset $10k</button></div>
    {ledger.positions.length===0?<div className="sn-demo-empty">Start with a $100 virtual margin and try a long or short. Your testnet SOL stays untouched.</div>:
     <div className="sn-demo-list">{ledger.positions.map(position=>{const current=quotes[position.market];const pnl=current.price===null?null:positionPnl(position,current.price);return <article key={position.id} className="sn-demo-position"><div><span className={`sn-demo-chip ${position.side}`}>{position.market} · {position.side.toUpperCase()}</span><strong>{fmtQuantity(position.quantity,position.market)} {position.market} · {position.leverage}x</strong><small>Entry {fmtPrice(position.entry,position.market)} · Margin {fmtUsd(position.marginUsd)}</small></div><div className="sn-demo-position-right"><strong className={pnl!==null&&pnl<0?'down':'up'}>{pnl===null?'—':fmtUsd(pnl)}</strong><button type="button" onClick={()=>closePosition(position)} disabled={current.status!=='observed'}>Close</button></div></article>})}</div>}
   </div>
   <p className="sn-fineprint">Demo capital, equity and PnL are simulated and browser-local. Quotes are external Coinbase spot references. No order fills, fees, funding, slippage, liquidations or real yield are modeled.</p>
 </section>;
}
