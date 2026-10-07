"use client";

import {
  ITEM_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from "@/lib/constants";
import { formatDisplayDate } from "@/lib/dates";
import { formatIdr, lineProfit, lineTotal } from "@/lib/money";
import { itemStatusSelectClass } from "@/lib/payment-style";
import type { OrderWithItems } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  orders: OrderWithItems[];
  onSaved?: () => void | Promise<void>;
  saving?: boolean;
};

type FlatRow = {
  key: string;
  orderDbId: number;
  itemId: number;
  orderCode: string;
  customerName: string;
  contact: string;
  orderDate: string;
  itemName: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
  itemStatus: string;
  orderStatus: string;
  shippingAddress: string;
  trackingNumber: string;
  depositPaid: number;
  ongkirPerOrang: number;
  orderTotal: number;
  remainingBalance: number;
};

const cellInput =
  "w-full min-w-0 border-0 bg-transparent px-2 py-1.5 text-sm focus:bg-white focus:outline focus:outline-1 focus:outline-blue-500";
const cellSelect =
  "w-full min-w-[7rem] border-0 bg-transparent px-1 py-1.5 text-sm focus:bg-white focus:outline focus:outline-1 focus:outline-blue-500";

function flattenOrders(orders: OrderWithItems[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      rows.push({
        key: `${order.id}-${item.id}`,
        orderDbId: order.id,
        itemId: item.id,
        orderCode: order.order_code,
        customerName: order.customer_name,
        contact: order.contact ?? "",
        orderDate: formatDisplayDate(order.order_date),
        itemName: item.item_name,
        qty: item.qty,
        unitCost: item.unit_cost,
        unitPrice: item.unit_price,
        itemStatus: item.item_status,
        orderStatus: order.order_status,
        shippingAddress: order.shipping_address ?? "",
        trackingNumber: order.tracking_number ?? "",
        depositPaid: order.deposit_paid,
        ongkirPerOrang: order.ongkir_per_orang ?? 0,
        orderTotal: order.order_total,
        remainingBalance: order.remaining_balance,
      });
    }
  }
  return rows;
}

type PaymentFilter = "all" | "unpaid" | "paid";

export function OrdersTable({ orders, onSaved, saving }: Props) {
  const [rows, setRows] = useState<FlatRow[]>(() => flattenOrders(orders));
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [itemStatusFilter, setItemStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  useEffect(() => {
    setRows(flattenOrders(orders));
  }, [orders]);

  const afterSave = useCallback(async () => {
    await onSaved?.();
  }, [onSaved]);

  const saveOrder = useCallback(
    async (orderDbId: number, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/orders/${orderDbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      await afterSave();
    },
    [afterSave],
  );

  const saveItem = useCallback(
    async (itemId: number, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      await afterSave();
    },
    [afterSave],
  );

  const updateRow = (key: string, patch: Partial<FlatRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const syncOrderField = (orderDbId: number, patch: Partial<FlatRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.orderDbId === orderDbId ? { ...r, ...patch } : r)),
    );
  };

  async function commitOrderField(
    row: FlatRow,
    field: keyof FlatRow,
    apiField: string,
    transform?: (v: string) => unknown,
  ) {
    setSavingKey(row.key);
    try {
      const raw = row[field];
      const value = transform ? transform(String(raw)) : raw;
      await saveOrder(row.orderDbId, { [apiField]: value });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingKey(null);
    }
  }

  async function commitItemField(
    row: FlatRow,
    field: keyof FlatRow,
    apiField: string,
    transform?: (v: string) => unknown,
  ) {
    setSavingKey(row.key);
    try {
      const raw = row[field];
      const value = transform ? transform(String(raw)) : raw;
      await saveItem(row.itemId, { [apiField]: value });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingKey(null);
    }
  }

  const filteredRows = useMemo(() => {
    const orderIdQ = orderIdFilter.trim().toLowerCase();
    const customerQ = customerFilter.trim().toLowerCase();

    return rows.filter((row) => {
      if (orderIdQ && !row.orderCode.toLowerCase().includes(orderIdQ)) {
        return false;
      }
      if (customerQ && !row.customerName.toLowerCase().includes(customerQ)) {
        return false;
      }
      if (itemStatusFilter !== "all" && row.itemStatus !== itemStatusFilter) {
        return false;
      }
      if (paymentFilter === "unpaid" && row.remainingBalance <= 0) {
        return false;
      }
      if (paymentFilter === "paid" && row.remainingBalance > 0) {
        return false;
      }
      return true;
    });
  }, [rows, orderIdFilter, customerFilter, itemStatusFilter, paymentFilter]);

  const hasActiveFilters =
    orderIdFilter.trim() !== "" ||
    customerFilter.trim() !== "" ||
    itemStatusFilter !== "all" ||
    paymentFilter !== "all";

  const filterInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2F5496] focus:outline-none focus:ring-1 focus:ring-[#2F5496]";

  const headerClass =
    "border border-slate-400 bg-[#2F5496] px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap";
  const bodyCell = "border border-slate-300 p-0 align-middle text-sm";

  const isEmpty = useMemo(() => rows.length === 0, [rows.length]);

  if (isEmpty) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        No orders yet. Click <strong>New jastip order</strong> to add your first row.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Calculations</h2>
          <p className="text-sm text-slate-500">
            Excel-style table — edit cells; payment & shipping status save when you change the dropdown.
          </p>
        </div>
        {(savingKey || saving) && (
          <span className="text-xs text-slate-500">Saving…</span>
        )}
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium text-slate-600">
          Payment
          <select
            className={`${filterInputClass} mt-1`}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
          >
            <option value="all">All</option>
            <option value="unpaid">Not paid in full (remaining &gt; 0)</option>
            <option value="paid">Paid in full</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Order ID
          <input
            className={`${filterInputClass} mt-1`}
            placeholder="e.g. 001"
            value={orderIdFilter}
            onChange={(e) => setOrderIdFilter(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Customer name
          <input
            className={`${filterInputClass} mt-1`}
            placeholder="Search customer"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Item status
          <select
            className={`${filterInputClass} mt-1`}
            value={itemStatusFilter}
            onChange={(e) => setItemStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            {ITEM_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col justify-end gap-1">
          <p className="text-xs text-slate-500">
            Showing {filteredRows.length} of {rows.length} rows
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="text-left text-sm font-medium text-[#2F5496] hover:underline"
              onClick={() => {
                setOrderIdFilter("");
                setCustomerFilter("");
                setItemStatusFilter("all");
                setPaymentFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-500">
          No rows match these filters.{" "}
          {hasActiveFilters && (
            <button
              type="button"
              className="font-medium text-[#2F5496] hover:underline"
              onClick={() => {
                setOrderIdFilter("");
                setCustomerFilter("");
                setItemStatusFilter("all");
                setPaymentFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </p>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr>
              <th className={headerClass}>Order ID</th>
              <th className={headerClass}>Customer</th>
              <th className={headerClass}>Contact</th>
              <th className={headerClass}>Date</th>
              <th className={headerClass}>Item</th>
              <th className={headerClass}>Qty</th>
              <th className={headerClass}>Cost</th>
              <th className={headerClass}>Selling</th>
              <th className={headerClass}>Line total</th>
              <th className={headerClass}>Line profit</th>
              <th className={headerClass}>Item status</th>
              <th className={headerClass}>Order status</th>
              <th className={headerClass}>Shipping</th>
              <th className={headerClass}>Tracking</th>
              <th className={headerClass}>Deposit</th>
              <th className={headerClass}>Ongkir / org</th>
              <th className={headerClass}>Order total</th>
              <th className={headerClass}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const lineTot = lineTotal(row.qty, row.unitPrice);
              const lineProf = lineProfit(row.qty, row.unitPrice, row.unitCost);
              const zebra = index % 2 === 1 ? "bg-[#D6DCE4]/60" : "bg-white";

              return (
                <tr key={row.key} className={zebra}>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.orderCode}
                      onChange={(e) => {
                        updateRow(row.key, { orderCode: e.target.value });
                        syncOrderField(row.orderDbId, { orderCode: e.target.value });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "orderCode", "orderCode")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.customerName}
                      onChange={(e) => {
                        updateRow(row.key, { customerName: e.target.value });
                        syncOrderField(row.orderDbId, {
                          customerName: e.target.value,
                        });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "customerName", "customerName")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.contact}
                      onChange={(e) => {
                        updateRow(row.key, { contact: e.target.value });
                        syncOrderField(row.orderDbId, { contact: e.target.value });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "contact", "contact")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      type="date"
                      className={cellInput}
                      value={row.orderDate === "—" ? "" : row.orderDate}
                      onChange={(e) => {
                        updateRow(row.key, { orderDate: e.target.value });
                        syncOrderField(row.orderDbId, {
                          orderDate: e.target.value,
                        });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "orderDate", "orderDate")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.itemName}
                      onChange={(e) =>
                        updateRow(row.key, { itemName: e.target.value })
                      }
                      onBlur={() =>
                        commitItemField(row, "itemName", "itemName")
                      }
                    />
                  </td>
                  <td className={`${bodyCell} w-16`}>
                    <input
                      type="number"
                      min={1}
                      className={`${cellInput} text-center`}
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(row.key, { qty: Number(e.target.value) })
                      }
                      onBlur={() =>
                        commitItemField(row, "qty", "qty", (v) => Number(v))
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      type="number"
                      min={0}
                      className={`${cellInput} text-right`}
                      value={row.unitCost}
                      onChange={(e) =>
                        updateRow(row.key, {
                          unitCost: Number(e.target.value),
                        })
                      }
                      onBlur={() =>
                        commitItemField(row, "unitCost", "unitCost", (v) =>
                          Number(v),
                        )
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      type="number"
                      min={0}
                      className={`${cellInput} text-right`}
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateRow(row.key, {
                          unitPrice: Number(e.target.value),
                        })
                      }
                      onBlur={() =>
                        commitItemField(row, "unitPrice", "unitPrice", (v) =>
                          Number(v),
                        )
                      }
                    />
                  </td>
                  <td className={`${bodyCell} whitespace-nowrap px-2 text-right tabular-nums`}>
                    {formatIdr(lineTot)}
                  </td>
                  <td className={`${bodyCell} whitespace-nowrap px-2 text-right tabular-nums text-emerald-800`}>
                    {formatIdr(lineProf)}
                  </td>
                  <td className={bodyCell}>
                    <select
                      className={itemStatusSelectClass(row.itemStatus)}
                      value={row.itemStatus}
                      onChange={async (e) => {
                        const itemStatus = e.target.value;
                        updateRow(row.key, { itemStatus });
                        setSavingKey(row.key);
                        try {
                          await saveItem(row.itemId, { itemStatus });
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Save failed");
                        } finally {
                          setSavingKey(null);
                        }
                      }}
                    >
                      {ITEM_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={bodyCell}>
                    <select
                      className={cellSelect}
                      value={row.orderStatus}
                      onChange={async (e) => {
                        const orderStatus = e.target.value;
                        syncOrderField(row.orderDbId, { orderStatus });
                        setSavingKey(row.key);
                        try {
                          await saveOrder(row.orderDbId, { orderStatus });
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Save failed");
                        } finally {
                          setSavingKey(null);
                        }
                      }}
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.shippingAddress}
                      onChange={(e) => {
                        updateRow(row.key, { shippingAddress: e.target.value });
                        syncOrderField(row.orderDbId, {
                          shippingAddress: e.target.value,
                        });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "shippingAddress", "shippingAddress")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      className={cellInput}
                      value={row.trackingNumber}
                      onChange={(e) => {
                        updateRow(row.key, { trackingNumber: e.target.value });
                        syncOrderField(row.orderDbId, {
                          trackingNumber: e.target.value,
                        });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "trackingNumber", "trackingNumber")
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      type="number"
                      min={0}
                      className={`${cellInput} text-right`}
                      value={row.depositPaid}
                      onChange={(e) => {
                        const depositPaid = Number(e.target.value) || 0;
                        updateRow(row.key, { depositPaid });
                        syncOrderField(row.orderDbId, { depositPaid });
                      }}
                      onBlur={() =>
                        commitOrderField(row, "depositPaid", "depositPaid", (v) =>
                          Number(v),
                        )
                      }
                    />
                  </td>
                  <td className={bodyCell}>
                    <input
                      type="number"
                      min={0}
                      className={`${cellInput} text-right`}
                      value={row.ongkirPerOrang}
                      onChange={(e) => {
                        const ongkirPerOrang = Number(e.target.value) || 0;
                        updateRow(row.key, { ongkirPerOrang });
                        syncOrderField(row.orderDbId, { ongkirPerOrang });
                      }}
                      onBlur={() =>
                        commitOrderField(
                          row,
                          "ongkirPerOrang",
                          "ongkirPerOrang",
                          (v) => Number(v),
                        )
                      }
                    />
                  </td>
                  <td className={`${bodyCell} whitespace-nowrap px-2 text-right tabular-nums font-medium`}>
                    {formatIdr(row.orderTotal)}
                  </td>
                  <td className={`${bodyCell} whitespace-nowrap px-2 text-right tabular-nums font-medium`}>
                    {formatIdr(row.remainingBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
