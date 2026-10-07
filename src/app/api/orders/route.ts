import { NextResponse } from "next/server";
import { createOrderRecord } from "@/lib/mutations";
import { fetchOrdersWithItems } from "@/lib/queries";
import type { CreateOrderPayload } from "@/lib/types";

export async function GET() {
  try {
    const orders = await fetchOrdersWithItems();
    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderPayload;
    const id = await createOrderRecord(body);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save order" },
      { status: 400 },
    );
  }
}
