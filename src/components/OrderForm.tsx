"use client";

import {
  ITEM_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from "@/lib/constants";
import { formatIdr, lineProfit, lineTotal } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ItemDraft = {
  itemName: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
  itemStatus: string;
};

const emptyItem = (): ItemDraft => ({
  itemName: "",
  qty: 1,
  unitCost: 0,
  unitPrice: 0,
  itemStatus: ITEM_STATUS_OPTIONS[0],
});

type OrderFormProps = {
  onClose?: () => void;
  onSaved?: () => void | Promise<void>;
};

export function OrderForm({ onClose, onSaved }: OrderFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [orderCode, setOrderCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [orderDate, setOrderDate] = useState(today);
  const [shippingAddress, setShippingAddress] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>(ORDER_STATUS_OPTIONS[0]);
  const [depositPaid, setDepositPaid] = useState("");
  const [ongkirPerOrang, setOngkirPerOrang] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([emptyItem(), emptyItem()]);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => {
    const filled = items.filter((i) => i.itemName.trim());
    const itemsSubtotal = filled.reduce(
      (s, i) => s + lineTotal(i.qty, i.unitPrice),
      0,
    );
    const ongkir = Number(ongkirPerOrang.replace(/\D/g, "")) || 0;
    const orderTotal = itemsSubtotal + ongkir;
    const orderProfit =
      filled.reduce(
        (s, i) => s + lineProfit(i.qty, i.unitPrice, i.unitCost),
        0,
      ) + ongkir;
    const deposit = Number(depositPaid.replace(/\D/g, "")) || 0;
    return { orderTotal, orderProfit, remaining: orderTotal - deposit, ongkir };
  }, [items, depositPaid, ongkirPerOrang]);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addItemRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode,
          customerName,
          contact,
          orderDate,
          shippingAddress,
          trackingNumber,
          orderStatus,
          depositPaid: Number(depositPaid.replace(/\D/g, "")) || 0,
          ongkirPerOrang: Number(ongkirPerOrang.replace(/\D/g, "")) || 0,
          items: items.map((i) => ({
            ...i,
            qty: Number(i.qty) || 1,
            unitCost: Number(i.unitCost) || 0,
            unitPrice: Number(i.unitPrice) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setOrderCode("");
      setCustomerName("");
      setContact("");
      setOrderDate(today);
      setShippingAddress("");
      setTrackingNumber("");
      setOrderStatus(ORDER_STATUS_OPTIONS[0]);
      setDepositPaid("");
      setOngkirPerOrang("");
      setItems([emptyItem(), emptyItem()]);
      await onSaved?.();
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save order");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

  return (
    <form onSubmit={onSubmit} className="pb-2">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Customer
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            Order ID
            <input
              required
              className={inputClass}
              placeholder="#001"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Customer name
            <input
              required
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact / IG
            <input
              className={inputClass}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Order date
            <input
              type="date"
              required
              className={inputClass}
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-8 space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Shipping & payment
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Shipping address
            <textarea
              rows={2}
              className={inputClass}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Tracking number
            <input
              className={inputClass}
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Order / shipping status
            <select
              className={inputClass}
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              {ORDER_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Ongkir per orang (IDR)
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="Shipping fee for this customer"
              value={ongkirPerOrang}
              onChange={(e) => setOngkirPerOrang(e.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Deposit paid (IDR)
            <input
              className={inputClass}
              inputMode="numeric"
              value={depositPaid}
              onChange={(e) => setDepositPaid(e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Items & profit
        </legend>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#2F5496] text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Selling</th>
                <th className="px-3 py-2">Line total</th>
                <th className="px-3 py-2">Line profit</th>
                <th className="px-3 py-2">Item status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => {
                const total = lineTotal(row.qty, row.unitPrice);
                const profit = lineProfit(row.qty, row.unitPrice, row.unitCost);
                return (
                  <tr key={index} className="border-t border-slate-100 odd:bg-slate-50">
                    <td className="px-2 py-2">
                      <input
                        className="w-full min-w-[140px] rounded border border-slate-300 px-2 py-1"
                        value={row.itemName}
                        onChange={(e) =>
                          updateItem(index, { itemName: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={1}
                        className="w-16 rounded border border-slate-300 px-2 py-1"
                        value={row.qty}
                        onChange={(e) =>
                          updateItem(index, { qty: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-slate-300 px-2 py-1"
                        value={row.unitCost || ""}
                        onChange={(e) =>
                          updateItem(index, { unitCost: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        className="w-28 rounded border border-slate-300 px-2 py-1"
                        value={row.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(index, { unitPrice: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {formatIdr(total)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-emerald-700">
                      {formatIdr(profit)}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="rounded border border-slate-300 px-2 py-1"
                        value={row.itemStatus}
                        onChange={(e) =>
                          updateItem(index, { itemStatus: e.target.value })
                        }
                      >
                        {ITEM_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addItemRow}
          className="mt-3 text-sm font-medium text-blue-700 hover:underline"
        >
          + Add another item
        </button>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-600">
          <span className="mr-4">
            Ongkir: <strong>{formatIdr(preview.ongkir)}</strong>
          </span>
          <span className="mr-4">
            Order total: <strong>{formatIdr(preview.orderTotal)}</strong>
          </span>
          <span className="mr-4">
            Order profit: <strong className="text-emerald-700">{formatIdr(preview.orderProfit)}</strong>
          </span>
          <span>
            Remaining: <strong>{formatIdr(preview.remaining)}</strong>
          </span>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#2F5496] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#244170] disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>
    </form>
  );
}
