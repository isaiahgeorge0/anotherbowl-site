import type { BasketItem, PersistedOrder, ReceiptSnapshot } from '@/types/order';

export const RESTAURANT_NAME = 'Another Bowl';
export const RECEIPT_FOOTER = 'Thank you for your order';

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const createReceiptSnapshot = (params: {
  orderNumber: string;
  customerName: string;
  orderType: PersistedOrder['orderType'];
  tableNumber?: string | null;
  collectionTime?: string | null;
  items: BasketItem[];
  total: number;
  status?: PersistedOrder['status'];
  paymentStatus?: PersistedOrder['paymentStatus'];
  timestamp?: string;
}): ReceiptSnapshot => {
  const receiptItems = params.items.map((entry) => ({
    id: entry.item.id,
    name: entry.item.name,
    quantity: entry.quantity,
    unitPrice: roundMoney(entry.item.price),
    lineTotal: roundMoney(entry.item.price * entry.quantity),
  }));
  const subtotal = roundMoney(receiptItems.reduce((sum, item) => sum + item.lineTotal, 0));

  return {
    restaurantName: RESTAURANT_NAME,
    orderNumber: params.orderNumber,
    timestamp: params.timestamp ?? new Date().toISOString(),
    customerName: params.customerName,
    orderType: params.orderType,
    tableNumber: params.tableNumber ?? null,
    collectionTime: params.collectionTime ?? null,
    items: receiptItems,
    subtotal,
    total: roundMoney(params.total),
    orderStatus: params.status ?? 'new',
    paymentStatus: params.paymentStatus ?? 'pending',
    footerMessage: RECEIPT_FOOTER,
  };
};
