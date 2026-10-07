export const ITEM_STATUS_OPTIONS = [
  "Ordered",
  "Paid",
  "Partially Paid",
  "Shipped to Customer",
  "Completed",
  "Cancelled",
] as const;

export const ORDER_STATUS_OPTIONS = [
  "Pending Payment",
  "Processing",
  "Ready to Ship",
  "Shipped",
  "Pending Pickup",
  "Delivered",
  "Cancelled",
] as const;
