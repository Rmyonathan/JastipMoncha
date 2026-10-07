import { patchOrderRecord } from "@/lib/mutations";
import type { UpdateOrderPayload } from "@/lib/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }
    const body = (await request.json()) as UpdateOrderPayload;
    await patchOrderRecord(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
