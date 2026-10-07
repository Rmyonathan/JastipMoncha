/** Item status colors: unpaid = red, partial = blue, paid = green */
export function itemStatusSelectClass(status: string): string {
  const base =
    "w-full min-w-[7rem] rounded border px-1 py-1.5 text-sm font-medium focus:outline focus:outline-2";

  if (status === "Paid" || status === "Completed" || status === "Shipped to Customer") {
    return `${base} border-emerald-300 bg-emerald-100 text-emerald-900 focus:outline-emerald-500`;
  }
  if (status === "Partially Paid") {
    return `${base} border-blue-300 bg-blue-100 text-blue-900 focus:outline-blue-500`;
  }
  return `${base} border-red-300 bg-red-100 text-red-900 focus:outline-red-500`;
}
