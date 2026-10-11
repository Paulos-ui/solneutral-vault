import { NextRequest, NextResponse } from 'next/server';
import { calculatePositionStress, validatePositionRiskInput } from '@/lib/position-risk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 2048) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413, headers: noStore });
    }
    const input: unknown = await request.json();
    if (!validatePositionRiskInput(input)) {
      return NextResponse.json({ error: 'Invalid hypothetical position parameters' }, { status: 422, headers: noStore });
    }
    return NextResponse.json({
      source: 'user-supplied-hypothesis',
      verifiedOnChain: false,
      venueLiquidationModel: false,
      ...calculatePositionStress(input),
    }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400, headers: noStore });
  }
}
