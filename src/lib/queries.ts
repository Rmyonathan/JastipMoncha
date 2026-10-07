import { lineProfit, lineTotal } from "@/lib/money";
import { getSql } from "@/lib/db";
import type {
  OrderItemRow,
  OrderRow,
  OrderWithItems,
  ProfitSummary,
} from "@/lib/types";

function enrichOrder(order: OrderRow, items: OrderItemRow[]): OrderWithItems {
  const ongkir = order.ongkir_per_orang ?? 0;
  const itemsSubtotal = items.reduce(
    (sum, i) => sum + lineTotal(i.qty, i.unit_price),
    0,
  );
  const order_total = itemsSubtotal + ongkir;
  const order_profit = items.reduce(
    (sum, i) => sum + lineProfit(i.qty, i.unit_price, i.unit_cost),
    0,
  ) + ongkir;
  return {
    ...order,
    ongkir_per_orang: ongkir,
    items,
    order_total,
    order_profit,
    remaining_balance: order_total - order.deposit_paid,
  };
}

export async function fetchOrdersWithItems(): Promise<OrderWithItems[]> {
  const sql = getSql();
  const orders = (await sql`
    SELECT * FROM orders ORDER BY created_at DESC, id DESC
  `) as OrderRow[];

  if (orders.length === 0) return [];

  const items = (await sql`
    SELECT * FROM order_items ORDER BY id ASC
  `) as OrderItemRow[];

  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }

  return orders.map((o) => enrichOrder(o, byOrder.get(o.id) ?? []));
}

export async function fetchProfitSummary(): Promise<ProfitSummary> {
  const sql = getSql();
  const totals = (await sql`
    SELECT
      COALESCE(SUM(qty * unit_price), 0)::int AS revenue,
      COALESCE(SUM(qty * unit_cost), 0)::int AS cost
    FROM order_items
  `) as { revenue: number; cost: number }[];

  const paidTotals = (await sql`
    SELECT
      COALESCE(SUM(qty * unit_price), 0)::int AS revenue,
      COALESCE(SUM(qty * unit_cost), 0)::int AS cost
    FROM order_items
    WHERE item_status IN ('Paid', 'Completed', 'Shipped to Customer')
  `) as { revenue: number; cost: number }[];

  const ongkirTotals = (await sql`
    SELECT COALESCE(SUM(ongkir_per_orang), 0)::int AS total_ongkir
    FROM orders
  `) as { total_ongkir: number }[];

  const paidOngkir = (await sql`
    SELECT COALESCE(SUM(o.ongkir_per_orang), 0)::int AS paid_ongkir
    FROM orders o
    WHERE (
      COALESCE((
        SELECT SUM(oi.qty * oi.unit_price)
        FROM order_items oi
        WHERE oi.order_id = o.id
      ), 0) + o.ongkir_per_orang - o.deposit_paid
    ) <= 0
  `) as { paid_ongkir: number }[];

  const settings = (await sql`
    SELECT estimated_expenses FROM app_settings WHERE id = 1
  `) as { estimated_expenses: number }[];

  const totalOngkir = ongkirTotals[0]?.total_ongkir ?? 0;
  const totalRevenue = (totals[0]?.revenue ?? 0) + totalOngkir;
  const totalCost = totals[0]?.cost ?? 0;
  const grossProfit = totalRevenue - totalCost;
  const estimatedExpenses = settings[0]?.estimated_expenses ?? 0;
  const netProfit = grossProfit - estimatedExpenses;

  const paidItemsRevenue = paidTotals[0]?.revenue ?? 0;
  const paidItemsCost = paidTotals[0]?.cost ?? 0;
  const paidOngkirAmount = paidOngkir[0]?.paid_ongkir ?? 0;
  const paidRevenue = paidItemsRevenue + paidOngkirAmount;
  const paidGrossProfit =
    paidItemsRevenue - paidItemsCost + paidOngkirAmount;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    estimatedExpenses,
    netProfit,
    paidRevenue,
    paidGrossProfit,
    totalOngkir,
  };
}

