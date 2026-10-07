import { NextResponse } from "next/server";
import { fetchProfitSummary } from "@/lib/queries";

export async function GET() {
  try {
    const summary = await fetchProfitSummary();
    return NextResponse.json(
      { summary },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load summary" },
      { status: 500 },
    );
  }
}
