import { NextRequest,NextResponse } from 'next/server';
import {parseSolCandles,solCandleFresh,SOL_INTERVALS,validInterval} from '@/lib/market/sol-candles';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const ORIGIN='https://api.exchange.coinbase.com';
const MARKET_PRODUCTS = {
 SOL: { product: 'SOL-USD', instrument: 'SOL/USD', name: 'SOL' },
 BONK: { product: 'BONK-USD', instrument: 'BONK/USD', name: 'BONK' },
} as const;
type SupportedMarket = keyof typeof MARKET_PRODUCTS;
const HEADER={'Cache-Control':'public, max-age=0, s-maxage=30, stale-while-revalidate=30'};

/** Public keyless allowlisted spot references, independent of Solana testnet wallet actions. */
export async function GET(request:NextRequest){
 const requested=request.nextUrl.searchParams.get('interval')??'5m';
 const requestedMarket=(request.nextUrl.searchParams.get('market')??'SOL').toUpperCase();
 if(!Object.prototype.hasOwnProperty.call(MARKET_PRODUCTS,requestedMarket))return NextResponse.json({error:'Unsupported market'},{status:400,headers:{'Cache-Control':'no-store'}});
 const market=MARKET_PRODUCTS[requestedMarket as SupportedMarket];
 if(!validInterval(requested))return NextResponse.json({error:'Unsupported candle interval'},{status:400,headers:{'Cache-Control':'no-store'}});
 const granularity=SOL_INTERVALS[requested];
 const url=`${ORIGIN}/products/${market.product}/candles?granularity=${granularity}`;
 try{
  const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'SolNeutral-Market-Research/1.0'},signal:AbortSignal.timeout(8500),next:{revalidate:30}});
  if(!response.ok)throw Error(`Coinbase returned ${response.status}`);
  const candles=parseSolCandles(await response.json());
  if(candles.length<2)throw Error('Insufficient verified candles');
  const last=candles[candles.length-1];
  const earlier=candles.length>1?candles[candles.length-2]:last;
  const status=solCandleFresh(last,granularity)?'observed':'stale';
  return NextResponse.json({status,instrument:market.instrument,venue:'Coinbase Exchange',marketType:'EXTERNAL SPOT REFERENCE — DEMO ONLY',interval:requested,source:url,
   asOf:new Date(last.time*1000).toISOString(),fetchedAt:new Date().toISOString(),price:last.close,changePct:earlier.close?((last.close-earlier.close)/earlier.close)*100:null,candles,
   note:`External Coinbase ${market.instrument} spot candles for paper-trading research. These are not Solana testnet execution prices. No actual orders are sent. Data may lag and the latest candle may still be forming.`},{headers:HEADER});
 }catch{
  return NextResponse.json({status:'unavailable',instrument:market.instrument,venue:'Coinbase Exchange',marketType:'EXTERNAL SPOT REFERENCE — DEMO ONLY',interval:requested,candles:[],fetchedAt:new Date().toISOString(),message:'Live reference candles could not be verified. No replacement or fabricated prices are displayed.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
