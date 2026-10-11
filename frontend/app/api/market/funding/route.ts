import { NextResponse } from 'next/server';
import { parseDriftFundingResponse } from '@/lib/funding';

export const dynamic = 'force-dynamic';
const SOURCE = 'https://data.api.drift.trade/fundingRates?marketName=SOL-PERP';
const headers = { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=60' };

export async function GET() {
  try {
    const response = await fetch(SOURCE, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`Indexer returned ${response.status}`);
    const records = parseDriftFundingResponse(await response.json());
    if (!records.length) throw new Error('No validated records from the indexer');
    const latest = records[0];
    const ageMinutes = Math.max(0, Math.round((Date.now() - Date.parse(latest.time)) / 60_000));
    return NextResponse.json({
      status: ageMinutes > 180 ? 'stale' : 'observed',
      market: 'SOL-PERP', source: SOURCE, fetchedAt: new Date().toISOString(),
      latest, records: records.slice(0, 24), ageMinutes,
      note: 'Market-wide indexed funding observations, not user positions or vault earnings. Annualization assumes the observed hourly rate persisted for a full year; it is NOT a forecast.',
    }, { headers });
  } catch {
    // Degraded state is explicit. Never invent a rate, backfill with old simulations,
    // or leak unexpected upstream errors to the browser.
    return NextResponse.json({
      status: 'unavailable', market: 'SOL-PERP', source: SOURCE,
      message: 'Drift funding records could not be verified. No live figures are displayed.',
      records: [], fetchedAt: new Date().toISOString(),
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
