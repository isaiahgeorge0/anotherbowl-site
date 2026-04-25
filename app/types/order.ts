export type OrderMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  modifiers: string[];
  allergens: string[];
  dietaryTags: string[];
};

export type BasketItem = {
  item: OrderMenuItem;
  quantity: number;
};

export type CheckoutOrderType = 'collection' | 'table';

export type CheckoutDetails = {
  customerName: string;
  email: string;
  phone: string;
  orderType: CheckoutOrderType;
  tableNumber?: string;
  collectionTime?: string;
  notes?: string;
};

export type StoredOrder = {
  orderNumber: string;
  createdAt: string;
  items: BasketItem[];
  subtotal: number;
  paymentStatus: 'pending';
  checkout: CheckoutDetails;
};

export type StaffOrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending';

export type ReceiptSnapshot = {
  restaurantName: string;
  orderNumber: string;
  timestamp: string;
  customerName: string;
  orderType: CheckoutOrderType;
  tableNumber: string | null;
  collectionTime: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  total: number;
  orderStatus: StaffOrderStatus;
  paymentStatus: PaymentStatus;
  footerMessage: string;
};

export type PersistedOrder = {
  id: string | number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  orderType: CheckoutOrderType;
  tableNumber: string | null;
  collectionTime: string | null;
  items: BasketItem[];
  total: number;
  status: StaffOrderStatus;
  paymentStatus: PaymentStatus;
  privacyAccepted?: boolean;
  marketingOptIn?: boolean;
  createdAt: string;
  notes?: string | null;
  receiptSnapshot?: ReceiptSnapshot | null;
};
