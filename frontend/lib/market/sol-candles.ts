/** Defensive Coinbase Exchange OHLCV parser. Data is SPOT SOL/USD only, never Drift perpetual data. */
export type SolCandle={time:number;open:number;high:number;low:number;close:number;volume:number};
export type SolGranularity=60|300|900|3600|21600|86400;
export const SOL_INTERVALS={"1m":60,"5m":300,"15m":900,"1h":3600,"6h":21600,"1d":86400} as const;
export type SolInterval=keyof typeof SOL_INTERVALS;
export function validInterval(value:unknown):value is SolInterval {return typeof value==='string'&&Object.prototype.hasOwnProperty.call(SOL_INTERVALS,value);}
export function parseSolCandles(payload:unknown,now=Date.now()):SolCandle[]{
 if(!Array.isArray(payload))return [];
 const parsed:SolCandle[]=[];
 for(const row of payload){
  if(!Array.isArray(row)||row.length<6)continue;
  const values=row.slice(0,6).map(Number);
  const [time,low,high,open,close,volume]=values;
  if(!values.every(Number.isFinite)||!Number.isSafeInteger(time)||time<=0||time*1000>now+120000||low<=0||high<low||open<low||open>high||close<low||close>high||volume<0)continue;
  parsed.push({time,low,high,open,close,volume});
 }
 const unique=new Map<number,SolCandle>();
 for(const candle of parsed)unique.set(candle.time,candle);
 return Array.from(unique.values()).sort((a,b)=>a.time-b.time).slice(-220);
}
export function solCandleFresh(last:SolCandle|undefined,granularity:SolGranularity,now=Date.now()):boolean{
 return Boolean(last&&last.time*1000<=now+120000&&now-last.time*1000<=Math.max(180000,granularity*1000+180000));
}

/** Pure, bounded historical-window navigation. Never invent candles. */
export function solVisibleWindow(candles: readonly SolCandle[], offsetFromLatest: number, visibleBars = 70): SolCandle[] {
  const size = Number.isFinite(visibleBars) ? Math.max(10, Math.min(150, Math.trunc(visibleBars))) : 70;
  const maxOffset = Math.max(0, candles.length - size);
  const offset = Number.isFinite(offsetFromLatest) ? Math.min(maxOffset, Math.max(0, Math.trunc(offsetFromLatest))) : 0;
  return candles.slice(Math.max(0, candles.length - size - offset), candles.length - offset);
}
export function shiftSolWindow(candleCount: number, currentOffset: number, delta: number, visibleBars = 70): number {
  const max = Math.max(0, candleCount - visibleBars);
  return Math.min(max, Math.max(0, currentOffset + delta));
}
