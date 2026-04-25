import type { BasketItem, CheckoutOrderType } from '@/types/order';

type OrderConfirmationEmailPayload = {
  orderNumber: string;
  customerName: string;
  email: string;
  orderType: CheckoutOrderType;
  tableNumber?: string | null;
  collectionTime?: string | null;
  items: BasketItem[];
  total: number;
};

type EmailPreviewData = {
  to: string;
  subject: string;
  text: string;
  html: string;
  meta: {
    provider: 'console-preview';
    storeName: string;
    orderNumber: string;
  };
};

const STORE_NAME = 'Another Bowl';

const formatLineItems = (items: BasketItem[]) =>
  items.map((entry) => ({
    quantity: entry.quantity,
    name: entry.item.name,
    lineTotal: Number((entry.item.price * entry.quantity).toFixed(2)),
  }));

const buildEmailPreview = (order: OrderConfirmationEmailPayload): EmailPreviewData => {
  const lineItems = formatLineItems(order.items);
  const orderContext =
    order.orderType === 'collection'
      ? `Collection time: ${order.collectionTime ?? '-'}`
      : `Table number: ${order.tableNumber ?? '-'}`;

  const textLines = [
    `${STORE_NAME} order confirmation`,
    '',
    `Order number: ${order.orderNumber}`,
    `Order type: ${order.orderType === 'collection' ? 'Collection' : 'Table'}`,
    orderContext,
    '',
    'Items:',
    ...lineItems.map((item) => `- ${item.quantity} x ${item.name} (GBP ${item.lineTotal.toFixed(2)})`),
    '',
    `Order total: GBP ${order.total.toFixed(2)}`,
  ];

  const html = `
    <h2>${STORE_NAME} order confirmation</h2>
    <p><strong>Order number:</strong> ${order.orderNumber}</p>
    <p><strong>Order type:</strong> ${order.orderType === 'collection' ? 'Collection' : 'Table'}</p>
    <p><strong>${order.orderType === 'collection' ? 'Collection time' : 'Table number'}:</strong> ${
      order.orderType === 'collection' ? order.collectionTime ?? '-' : order.tableNumber ?? '-'
    }</p>
    <h3>Items</h3>
    <ul>
      ${lineItems
        .map((item) => `<li>${item.quantity} x ${item.name} (GBP ${item.lineTotal.toFixed(2)})</li>`)
        .join('')}
    </ul>
    <p><strong>Order total:</strong> GBP ${order.total.toFixed(2)}</p>
  `;

  return {
    to: order.email,
    subject: `${STORE_NAME} order confirmation - ${order.orderNumber}`,
    text: textLines.join('\n'),
    html,
    meta: {
      provider: 'console-preview',
      storeName: STORE_NAME,
      orderNumber: order.orderNumber,
    },
  };
};

export async function sendOrderConfirmationEmail(order: OrderConfirmationEmailPayload): Promise<void> {
  const emailData = buildEmailPreview(order);
  // Future provider integration point (Resend / SendGrid / SMTP / Mailtrap).
  console.log('Order confirmation email preview:', emailData);
}

