"use client";

import { NewOrderModal } from "@/components/NewOrderModal";
import { OrdersTable } from "@/components/OrdersTable";
import { ProfitSummary } from "@/components/ProfitSummary";
import type { OrderWithItems, ProfitSummary as ProfitSummaryType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  initialOrders: OrderWithItems[];
  initialSummary: ProfitSummaryType;
};

async function fetchDashboardData(): Promise<{
  orders: OrderWithItems[];
  summary: ProfitSummaryType;
}> {
  const [ordersRes, summaryRes] = await Promise.all([
    fetch("/api/orders", { cache: "no-store" }),
    fetch("/api/summary", { cache: "no-store" }),
  ]);
  const ordersJson = await ordersRes.json();
  const summaryJson = await summaryRes.json();
  if (!ordersRes.ok) {
    throw new Error(ordersJson.error ?? "Failed to load orders");
  }
  if (!summaryRes.ok) {
    throw new Error(summaryJson.error ?? "Failed to load summary");
  }
  return { orders: ordersJson.orders, summary: summaryJson.summary };
}

export function Dashboard({ initialOrders, initialSummary }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [summary, setSummary] = useState(initialSummary);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setOrders(initialOrders);
    setSummary(initialSummary);
  }, [initialOrders, initialSummary]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchDashboardData();
      setOrders(data.orders);
      setSummary(data.summary);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  return (
    <>
      <ProfitSummary
        summary={summary}
        refreshing={refreshing}
        onSummaryChange={setSummary}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Add orders via the button; edits in the table update profit totals automatically.
        </p>
        <NewOrderModal onSaved={reload} />
      </div>

      <OrdersTable orders={orders} onSaved={reload} saving={refreshing} />
    </>
  );
}
