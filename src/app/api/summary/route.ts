import { NextResponse } from "next/server";
import { patchEstimatedExpenses } from "@/lib/mutations";
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

export async function PATCH(request: Request) {
  try {
    const { estimatedExpenses } = (await request.json()) as {
      estimatedExpenses: number;
    };
    await patchEstimatedExpenses(estimatedExpenses ?? 0);
    const summary = await fetchProfitSummary();
    return NextResponse.json({ summary });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update expenses" },
      { status: 400 },
    );
  }
}
