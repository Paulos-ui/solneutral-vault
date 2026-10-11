'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import type {SolCandle,SolInterval} from '@/lib/market/sol-candles';

const INTERVALS:SolInterval[]=['1m','5m','15m','1h','6h','1d'];
type SolChartResult={status:'observed'|'stale'|'unavailable';instrument:string;venue:string;marketType:string;interval:string;asOf?:string;fetchedAt:string;price?:number;changePct?:number|null;candles:SolCandle[];note?:string;message?:string};
const WIDTH=1000,HEIGHT=300,LEFT=12,RIGHT=64,TOP=18,BOTTOM=34;
const formatPrice=(n:number)=>`$${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const formatTime=(seconds:number,granularity:SolInterval)=>new Intl.DateTimeFormat('en-US',granularity==='1d'||granularity==='6h'?{month:'short',day:'numeric',timeZone:'UTC'}:{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(seconds*1000));

export function SolPriceChart(){
 const [interval,setChartInterval]=useState<SolInterval>('5m');
 const [response,setResponse]=useState<SolChartResult|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [active,setActive]=useState<number|null>(null);
 const refresh=useCallback(async(signal:AbortSignal)=>{
  try{
   const r=await fetch(`/api/market/sol-chart?interval=${interval}`,{signal,cache:'no-store'});
   const payload:SolChartResult=await r.json();
   if(!r.ok||!Array.isArray(payload.candles)||payload.candles.length<2)throw Error(payload.message??'Price data unavailable');
   if(!signal.aborted){setResponse(payload);setError('');}
  }catch(e){if(!signal.aborted){setResponse(null);setError(e instanceof Error?e.message:'Market data unavailable');}}
  finally{if(!signal.aborted)setLoading(false);}
 },[interval]);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setActive(null);void refresh(controller.signal);const timer=setInterval(()=>void refresh(controller.signal),30000);return()=>{clearInterval(timer);controller.abort();};},[refresh]);
 const candles=response?.candles??[];
 const drawing=useMemo(()=>{
  if(candles.length<2)return null;
  const min=Math.min(...candles.map(c=>c.low)),max=Math.max(...candles.map(c=>c.high));
  const spread=Math.max(max-min,max*.001),floor=min-spread*.12,ceil=max+spread*.12;
  const graphW=WIDTH-LEFT-RIGHT,graphH=HEIGHT-TOP-BOTTOM;
  const step=graphW/candles.length;
  const y=(price:number)=>TOP+(ceil-price)/(ceil-floor)*graphH;
  return {min,max,floor,ceil,graphW,graphH,step,y};
 },[candles]);
 const last=candles[candles.length-1];
 const selected=active===null?last:candles[active]??last;
 const status=response?.status??'unavailable';
 return <section className="sn-v7-chart" aria-label="SOL USD market reference chart">
  <div className="sn-v7-chart-head">
   <div><div className="sn-v7-pair"><span className="sn-v7-coin">◎</span><div><strong>SOL / USD</strong><small>Coinbase spot reference · Drift execution remains devnet</small></div></div><div className="sn-v7-quote"><strong>{last?formatPrice(last.close):'—'}</strong><span className={response?.changePct!==undefined&&response.changePct!==null&&response.changePct<0?'down':'up'}>{response?.changePct===undefined||response.changePct===null?'No verified change':`${response.changePct>=0?'+':''}${response.changePct.toFixed(2)}% last bar`}</span></div></div>
   <div className="sn-v7-chart-controls"><div className="sn-v7-chart-intervals" aria-label="Candlestick timeframe">{INTERVALS.map(i=><button type="button" aria-pressed={interval===i} className={interval===i?'active':''} key={i} onClick={()=>setChartInterval(i)}>{i}</button>)}</div><span className={`sn-v7-chart-status ${status}`}>{loading?'Loading':status==='observed'?'Updated':status==='stale'?'Delayed':'Unavailable'}</span></div>
  </div>
  {drawing&&candles.length>1?<div className="sn-v7-chart-body"><div className="sn-v7-ohlc">{selected?<><span>O <b>{formatPrice(selected.open)}</b></span><span>H <b>{formatPrice(selected.high)}</b></span><span>L <b>{formatPrice(selected.low)}</b></span><span>C <b>{formatPrice(selected.close)}</b></span></>:null}<span>{selected?new Date(selected.time*1000).toLocaleString('en-US',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'}):'—'} UTC</span></div>
   <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Observed ${interval} OHLC candles for SOL USD from Coinbase`} preserveAspectRatio="none">
    {[0,1,2,3,4].map(index=>{const val=drawing.floor+(drawing.ceil-drawing.floor)*(index/4);const y=drawing.y(val);return <g key={index}><line x1={LEFT} y1={y} x2={WIDTH-RIGHT+10} y2={y} className="sn-v7-gridline"/><text x={WIDTH-RIGHT+14} y={y+4} className="sn-v7-price-label">{val.toFixed(2)}</text></g>})}
    {candles.map((c,index)=>{const x=LEFT+(index+.5)*drawing.step;const up=c.close>=c.open;const y1=drawing.y(c.high),y2=drawing.y(c.low),barTop=Math.min(drawing.y(c.open),drawing.y(c.close));const h=Math.max(1.4,Math.abs(drawing.y(c.open)-drawing.y(c.close)));return <g key={c.time} onMouseEnter={()=>setActive(index)} onMouseLeave={()=>setActive(null)}><line x1={x} x2={x} y1={y1} y2={y2} stroke={up?'#82eba8':'#eaa989'} strokeWidth="1.3"/><rect x={x-Math.max(1,drawing.step*.33)} y={barTop} width={Math.max(2,drawing.step*.66)} height={h} fill={up?'#84edaa':'#e68d78'}/><rect x={x-drawing.step/2} y={TOP} width={drawing.step} height={drawing.graphH} fill="transparent"/></g>})}
    {active!==null&&selected?<line x1={LEFT+(active+.5)*drawing.step} x2={LEFT+(active+.5)*drawing.step} y1={TOP} y2={HEIGHT-BOTTOM} className="sn-v7-crosshair"/>:null}
    {[0,1,2,3,4].map(index=>{const i=Math.min(candles.length-1,Math.round((candles.length-1)*index/4));return <text key={index} x={LEFT+i*drawing.step} y={HEIGHT-9} className="sn-v7-time-label">{formatTime(candles[i].time,interval)}</text>})}
   </svg>
  </div>:<div className="sn-v7-chart-empty"><strong>{loading?'Loading verified SOL price candles…':'Market feed unavailable'}</strong><p>{error||'The chart will display only when the external provider responds with validated OHLC candles.'}</p><button type="button" onClick={()=>{const controller=new AbortController();setLoading(true);void refresh(controller.signal);}}>Retry feed ↻</button></div>}
  <footer className="sn-v7-chart-foot"><span>SPOT REFERENCE · NO TRADE EXECUTION PRICE</span><span>{response?.asOf?`Latest candle: ${new Date(response.asOf).toLocaleString('en-US',{timeZone:'UTC'})} UTC`:'Live feed not verified'}</span><a href="https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles" target="_blank" rel="noopener noreferrer">Data source ↗</a></footer>
 </section>;
}
