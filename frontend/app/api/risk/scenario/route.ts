import { NextResponse } from "next/server";
import { calculateScenario, validateScenario } from "@/lib/scenario";

export async function POST(request: Request) {
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON request body." }, { status: 400 });
  }
  if (!validateScenario(data)) {
    return NextResponse.json({ error: "Invalid scenario values.", limits: {
      spotNotionalUsd: [100, 1000000], hedgeRatioPct: [0, 150],
      priceMovePct: [-90, 300], annualFundingPct: [-100, 100], days: [1, 365]
    } }, { status: 422 });
  }
  return NextResponse.json({
    mode: "illustrative-simulation",
    input: data,
    result: calculateScenario(data),
    limitations: ["No fees/slippage", "No basis risk", "No liquidation or margin modeling", "No borrowing costs", "Not financial advice"],
  }, { headers: { "Cache-Control": "no-store" } });
}
