export type OrderItemRow = {
  id: number;
  order_id: number;
  item_name: string;
  qty: number;
  unit_cost: number;
  unit_price: number;
  item_status: string;
};

export type OrderRow = {
  id: number;
  order_code: string;
  customer_name: string;
  contact: string | null;
  order_date: string;
  shipping_address: string | null;
  tracking_number: string | null;
  order_status: string;
  deposit_paid: number;
  ongkir_per_orang: number;
  created_at: string;
};

export type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
  order_total: number;
  order_profit: number;
  remaining_balance: number;
};

export type CreateOrderPayload = {
  orderCode: string;
  customerName: string;
  contact?: string;
  orderDate: string;
  shippingAddress?: string;
  trackingNumber?: string;
  orderStatus: string;
  depositPaid: number;
  ongkirPerOrang: number;
  items: {
    itemName: string;
    qty: number;
    unitCost: number;
    unitPrice: number;
    itemStatus: string;
  }[];
};

export type ProfitSummary = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalOngkir: number;
  netProfit: number;
  paidRevenue: number;
  paidGrossProfit: number;
  paidOngkir: number;
  paidNetProfit: number;
};

export type UpdateOrderPayload = {
  orderCode?: string;
  customerName?: string;
  contact?: string | null;
  orderDate?: string;
  shippingAddress?: string | null;
  trackingNumber?: string | null;
  orderStatus?: string;
  depositPaid?: number;
  ongkirPerOrang?: number;
};

export type UpdateOrderItemPayload = {
  itemName?: string;
  qty?: number;
  unitCost?: number;
  unitPrice?: number;
  itemStatus?: string;
};
