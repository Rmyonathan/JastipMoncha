"use client";

import { formatIdr } from "@/lib/money";
import type { ProfitSummary as ProfitSummaryType } from "@/lib/types";
import { useEffect, useState } from "react";

type Props = {
  summary: ProfitSummaryType;
  refreshing?: boolean;
  onSummaryChange: (summary: ProfitSummaryType) => void;
};

export function ProfitSummary({ summary, refreshing, onSummaryChange }: Props) {
  const [expensesInput, setExpensesInput] = useState(
    String(summary.estimatedExpenses),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExpensesInput(String(summary.estimatedExpenses));
  }, [summary.estimatedExpenses]);

  async function saveExpenses() {
    setSaving(true);
    try {
      const res = await fetch("/api/summary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedExpenses: Number(expensesInput.replace(/\D/g, "")) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSummaryChange(data.summary);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save expenses");
    } finally {
      setSaving(false);
    }
  }

  const cards = [
    { label: "Total revenue", value: summary.totalRevenue },
    { label: "Total cost (COGS)", value: summary.totalCost },
    { label: "Gross profit (all)", value: summary.grossProfit },
    { label: "Net profit", value: summary.netProfit, highlight: "emerald" as const },
    {
      label: "Paid revenue",
      value: summary.paidRevenue,
      hint: "Items marked Paid + ongkir (orders lunas)",
    },
    {
      label: "Gross profit (paid only)",
      value: summary.paidGrossProfit,
      highlight: "green" as const,
      hint: "Profit from paid lines & paid shipping",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Profit summary</h2>
        {refreshing && (
          <span className="text-xs text-slate-500">Updating totals…</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Live totals from all line items (qty × selling price and cost).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-4 ${
              c.highlight === "emerald"
                ? "border-emerald-200 bg-emerald-50"
                : c.highlight === "green"
                  ? "border-green-300 bg-green-50"
                  : "border-slate-100 bg-slate-50"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            {"hint" in c && c.hint ? (
              <p className="mt-0.5 text-[11px] text-slate-400">{c.hint}</p>
            ) : null}
            <p
              className={`mt-1 text-xl font-semibold tabular-nums ${
                c.highlight === "emerald"
                  ? "text-emerald-800"
                  : c.highlight === "green"
                    ? "text-green-800"
                    : "text-slate-900"
              }`}
            >
              {formatIdr(c.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            Estimated expenses (shipping, etc.)
          </span>
          <input
            type="text"
            inputMode="numeric"
            className="w-48 rounded-lg border border-slate-300 px-3 py-2"
            value={expensesInput}
            onChange={(e) => setExpensesInput(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={saveExpenses}
          disabled={saving}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update net profit"}
        </button>
      </div>
    </section>
  );
}
