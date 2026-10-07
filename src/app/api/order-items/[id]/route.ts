import { deleteOrderItemRecord, patchOrderItemRecord } from "@/lib/mutations";
import type { UpdateOrderItemPayload } from "@/lib/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }
    const body = (await request.json()) as UpdateOrderItemPayload;
    await patchOrderItemRecord(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }
    const orderId = await deleteOrderItemRecord(id);
    return NextResponse.json({ ok: true, orderDeleted: orderId === null });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}
