import { NextRequest,NextResponse } from 'next/server';
import {parseSolCandles,solCandleFresh,SOL_INTERVALS,validInterval} from '@/lib/market/sol-candles';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const ORIGIN='https://api.exchange.coinbase.com';
const SOURCE='Coinbase Exchange SOL/USD spot';
const HEADER={'Cache-Control':'public, max-age=0, s-maxage=30, stale-while-revalidate=30'};

/** Public and keyless reference chart. Separate from devnet Drift transactions. */
export async function GET(request:NextRequest){
 const requested=request.nextUrl.searchParams.get('interval')??'5m';
 if(!validInterval(requested))return NextResponse.json({error:'Unsupported candle interval'},{status:400,headers:{'Cache-Control':'no-store'}});
 const granularity=SOL_INTERVALS[requested];
 const url=`${ORIGIN}/products/SOL-USD/candles?granularity=${granularity}`;
 try{
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'SolNeutral-Market-Research/1.0'},signal:AbortSignal.timeout(8500),next:{revalidate:30}});
  if(!response.ok)throw Error(`Coinbase returned ${response.status}`);
  const candles=parseSolCandles(await response.json());
  if(candles.length<2)throw Error('Insufficient verified candles');
  const last=candles[candles.length-1];
  const earlier=candles.length>1?candles[candles.length-2]:last;
  const status=solCandleFresh(last,granularity)?'observed':'stale';
  return NextResponse.json({status,instrument:'SOL/USD',venue:'Coinbase Exchange',marketType:'SPOT REFERENCE — NOT DRIFT PERP',interval:requested,source:url,
   asOf:new Date(last.time*1000).toISOString(),fetchedAt:new Date().toISOString(),price:last.close,changePct:earlier.close?((last.close-earlier.close)/earlier.close)*100:null,candles,
   note:'Market-wide Coinbase SOL/USD spot candles, not Drift SOL-PERP mark/oracle, order fills, or wallet performance. Updates approximately every 30 seconds; provider data may lag. The latest bar may still be forming.'},{headers:HEADER});
 }catch{
  return NextResponse.json({status:'unavailable',instrument:'SOL/USD',venue:'Coinbase Exchange',marketType:'SPOT REFERENCE — NOT DRIFT PERP',interval:requested,candles:[],fetchedAt:new Date().toISOString(),message:'Live reference candles could not be verified. No replacement or fabricated prices are displayed.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
