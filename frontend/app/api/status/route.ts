import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({
    project: "SolNeutral V2",
    version: "2.0.0-alpha.1",
    mode: "research-preview",
    executionEnabled: false,
    depositsEnabled: false,
    liveVaultMetricsAvailable: false,
    dataSource: "illustrative-local-model",
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
