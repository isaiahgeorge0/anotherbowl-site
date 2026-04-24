import type { ReceiptSnapshot } from '@/types/order';

type ReceiptDocumentProps = {
  receipt: ReceiptSnapshot;
};

export default function ReceiptDocument({ receipt }: ReceiptDocumentProps) {
  return (
    <section className="mx-auto w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 print:max-w-[76mm] print:rounded-none print:border-0 print:p-2">
      <header className="text-center border-b border-gray-200 pb-3">
        <h1 className="text-lg font-bold tracking-wide">{receipt.restaurantName}</h1>
        <p className="mt-1">Order {receipt.orderNumber}</p>
        <p className="text-xs text-gray-600">{new Date(receipt.timestamp).toLocaleString()}</p>
      </header>

      <div className="mt-3 space-y-1">
        <p>
          <span className="font-semibold">Customer:</span> {receipt.customerName}
        </p>
        <p>
          <span className="font-semibold">Order type:</span> {receipt.orderType}
        </p>
        <p>
          <span className="font-semibold">
            {receipt.orderType === 'table' ? 'Table number:' : 'Collection time:'}
          </span>{' '}
          {receipt.orderType === 'table' ? receipt.tableNumber || '-' : receipt.collectionTime || '-'}
        </p>
      </div>

      <div className="mt-4 border-t border-b border-gray-200 py-3">
        <h2 className="font-semibold mb-2">Items</h2>
        <ul className="space-y-2">
          {receipt.items.map((item) => (
            <li key={`${receipt.orderNumber}-${item.id}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium leading-tight">{item.name}</p>
                <p className="text-xs text-gray-600">Qty {item.quantity}</p>
              </div>
              <p className="font-medium whitespace-nowrap">GBP {item.lineTotal.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 space-y-1">
        <p className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>GBP {receipt.subtotal.toFixed(2)}</span>
        </p>
        <p className="flex items-center justify-between font-semibold text-base">
          <span>Total</span>
          <span>GBP {receipt.total.toFixed(2)}</span>
        </p>
        <p className="flex items-center justify-between text-xs text-gray-700">
          <span>Status</span>
          <span>{receipt.orderStatus}</span>
        </p>
        <p className="flex items-center justify-between text-xs text-gray-700">
          <span>Payment</span>
          <span>{receipt.paymentStatus} (placeholder)</span>
        </p>
      </div>

      <footer className="mt-4 border-t border-gray-200 pt-3 text-center text-xs font-medium text-gray-700">
        {receipt.footerMessage}
      </footer>
    </section>
  );
}
