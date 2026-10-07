"use client";

import { formatIdr } from "@/lib/money";
import type { ProfitSummary as ProfitSummaryType } from "@/lib/types";

type Props = {
  summary: ProfitSummaryType;
  refreshing?: boolean;
};

export function ProfitSummary({ summary, refreshing }: Props) {
  const cards: {
    label: string;
    value: number;
    hint?: string;
    highlight?: "emerald" | "amber" | "green";
  }[] = [
    {
      label: "Item revenue",
      value: summary.totalRevenue,
      hint: "Selling price × qty (no ongkir)",
    },
    { label: "Total cost (COGS)", value: summary.totalCost },
    { label: "Gross profit (items)", value: summary.grossProfit },
    {
      label: "Total ongkir",
      value: summary.totalOngkir,
      hint: "Shipping collected per customer — deducted below",
      highlight: "amber",
    },
    {
      label: "Net profit",
      value: summary.netProfit,
      hint: "Gross profit − total ongkir",
      highlight: "emerald",
    },
    {
      label: "Paid item revenue",
      value: summary.paidRevenue,
      hint: "Lines: Paid / Completed / Shipped",
    },
    {
      label: "Gross profit (paid items)",
      value: summary.paidGrossProfit,
      highlight: "green",
    },
    {
      label: "Ongkir (orders lunas)",
      value: summary.paidOngkir,
      hint: "Ongkir for fully paid orders",
      highlight: "amber",
    },
    {
      label: "Net profit (paid)",
      value: summary.paidNetProfit,
      hint: "Paid item gross − ongkir (lunas)",
      highlight: "emerald",
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
        Item profit and ongkir are separate. Net profit = item gross profit minus
        ongkir.
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
                  : c.highlight === "amber"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-100 bg-slate-50"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            {c.hint ? (
              <p className="mt-0.5 text-[11px] text-slate-400">{c.hint}</p>
            ) : null}
            <p
              className={`mt-1 text-xl font-semibold tabular-nums ${
                c.highlight === "emerald"
                  ? "text-emerald-800"
                  : c.highlight === "green"
                    ? "text-green-800"
                    : c.highlight === "amber"
                      ? "text-amber-900"
                      : "text-slate-900"
              }`}
            >
              {formatIdr(c.value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
