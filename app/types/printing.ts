import type { PaymentStatus, StaffOrderStatus } from '@/types/order';

export type PrintableDocumentType = 'customer_receipt' | 'kitchen_ticket';

export type PrintableOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: string[];
};

export type PrintableOrderPayload = {
  restaurantName: string;
  orderNumber: string;
  timestamp: string;
  customerName: string;
  orderType: 'collection' | 'table';
  tableNumber: string | null;
  collectionTime: string | null;
  notes: string | null;
  items: PrintableOrderItem[];
  subtotal: number;
  total: number;
  orderStatus: StaffOrderStatus;
  paymentStatus: PaymentStatus;
  footerMessage: string;
};

export const DEFAULT_PRINT_DOCUMENT_TYPE: PrintableDocumentType = 'customer_receipt';

export const isPrintableDocumentType = (value: string | null): value is PrintableDocumentType =>
  value === 'customer_receipt' || value === 'kitchen_ticket';
