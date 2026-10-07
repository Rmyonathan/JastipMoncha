import { getSql } from "@/lib/db";
import type {
  CreateOrderPayload,
  UpdateOrderItemPayload,
  UpdateOrderPayload,
} from "@/lib/types";

export async function createOrderRecord(payload: CreateOrderPayload): Promise<number> {
  const sql = getSql();
  const validItems = payload.items.filter((i) => i.itemName.trim());
  if (!payload.orderCode.trim() || !payload.customerName.trim()) {
    throw new Error("Order ID and customer name are required");
  }
  if (validItems.length === 0) {
    throw new Error("Add at least one item");
  }

  const inserted = (await sql`
    INSERT INTO orders (
      order_code, customer_name, contact, order_date,
      shipping_address, tracking_number, order_status, deposit_paid,
      ongkir_per_orang
    ) VALUES (
      ${payload.orderCode.trim()},
      ${payload.customerName.trim()},
      ${payload.contact?.trim() || null},
      ${payload.orderDate},
      ${payload.shippingAddress?.trim() || null},
      ${payload.trackingNumber?.trim() || null},
      ${payload.orderStatus},
      ${Math.max(0, Math.round(payload.depositPaid))},
      ${Math.max(0, Math.round(payload.ongkirPerOrang))}
    )
    RETURNING id
  `) as { id: number }[];

  const orderId = inserted[0].id;

  for (const item of validItems) {
    await sql`
      INSERT INTO order_items (
        order_id, item_name, qty, unit_cost, unit_price, item_status
      ) VALUES (
        ${orderId},
        ${item.itemName.trim()},
        ${Math.max(1, Math.round(item.qty))},
        ${Math.max(0, Math.round(item.unitCost))},
        ${Math.max(0, Math.round(item.unitPrice))},
        ${item.itemStatus}
      )
    `;
  }

  return orderId;
}

export async function patchOrderRecord(
  id: number,
  patch: UpdateOrderPayload,
): Promise<void> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM orders WHERE id = ${id}
  `) as { id: number }[];
  if (existing.length === 0) throw new Error("Order not found");

  if (patch.orderCode !== undefined) {
    await sql`UPDATE orders SET order_code = ${patch.orderCode.trim()} WHERE id = ${id}`;
  }
  if (patch.customerName !== undefined) {
    await sql`UPDATE orders SET customer_name = ${patch.customerName.trim()} WHERE id = ${id}`;
  }
  if (patch.contact !== undefined) {
    await sql`UPDATE orders SET contact = ${patch.contact?.trim() || null} WHERE id = ${id}`;
  }
  if (patch.orderDate !== undefined) {
    await sql`UPDATE orders SET order_date = ${patch.orderDate} WHERE id = ${id}`;
  }
  if (patch.shippingAddress !== undefined) {
    await sql`UPDATE orders SET shipping_address = ${patch.shippingAddress?.trim() || null} WHERE id = ${id}`;
  }
  if (patch.trackingNumber !== undefined) {
    await sql`UPDATE orders SET tracking_number = ${patch.trackingNumber?.trim() || null} WHERE id = ${id}`;
  }
  if (patch.orderStatus !== undefined) {
    await sql`UPDATE orders SET order_status = ${patch.orderStatus} WHERE id = ${id}`;
  }
  if (patch.depositPaid !== undefined) {
    await sql`UPDATE orders SET deposit_paid = ${Math.max(0, Math.round(patch.depositPaid))} WHERE id = ${id}`;
  }
  if (patch.ongkirPerOrang !== undefined) {
    await sql`UPDATE orders SET ongkir_per_orang = ${Math.max(0, Math.round(patch.ongkirPerOrang))} WHERE id = ${id}`;
  }
}

export async function patchOrderItemRecord(
  id: number,
  patch: UpdateOrderItemPayload,
): Promise<void> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM order_items WHERE id = ${id}
  `) as { id: number }[];
  if (existing.length === 0) throw new Error("Line item not found");

  if (patch.itemName !== undefined) {
    await sql`UPDATE order_items SET item_name = ${patch.itemName.trim()} WHERE id = ${id}`;
  }
  if (patch.qty !== undefined) {
    await sql`UPDATE order_items SET qty = ${Math.max(1, Math.round(patch.qty))} WHERE id = ${id}`;
  }
  if (patch.unitCost !== undefined) {
    await sql`UPDATE order_items SET unit_cost = ${Math.max(0, Math.round(patch.unitCost))} WHERE id = ${id}`;
  }
  if (patch.unitPrice !== undefined) {
    await sql`UPDATE order_items SET unit_price = ${Math.max(0, Math.round(patch.unitPrice))} WHERE id = ${id}`;
  }
  if (patch.itemStatus !== undefined) {
    await sql`UPDATE order_items SET item_status = ${patch.itemStatus} WHERE id = ${id}`;
  }
}

export async function deleteOrderItemRecord(id: number): Promise<number | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT order_id FROM order_items WHERE id = ${id}
  `) as { order_id: number }[];
  if (rows.length === 0) throw new Error("Line item not found");

  const orderId = rows[0].order_id;
  await sql`DELETE FROM order_items WHERE id = ${id}`;

  const remaining = (await sql`
    SELECT COUNT(*)::int AS count FROM order_items WHERE order_id = ${orderId}
  `) as { count: number }[];

  if ((remaining[0]?.count ?? 0) === 0) {
    await sql`DELETE FROM orders WHERE id = ${orderId}`;
    return null;
  }
  return orderId;
}

export async function deleteOrderRecord(id: number): Promise<void> {
  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM orders WHERE id = ${id}
  `) as { id: number }[];
  if (existing.length === 0) throw new Error("Order not found");
  await sql`DELETE FROM orders WHERE id = ${id}`;
}

export async function patchEstimatedExpenses(amount: number): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO app_settings (id, estimated_expenses)
    VALUES (1, ${Math.max(0, Math.round(amount))})
    ON CONFLICT (id) DO UPDATE SET estimated_expenses = EXCLUDED.estimated_expenses
  `;
}
