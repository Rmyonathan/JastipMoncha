export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function lineTotal(qty: number, unitPrice: number): number {
  return qty * unitPrice;
}

export function lineProfit(qty: number, unitPrice: number, unitCost: number): number {
  return qty * (unitPrice - unitCost);
}
