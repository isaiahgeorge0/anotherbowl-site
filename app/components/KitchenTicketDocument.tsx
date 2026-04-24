import type { PrintableOrderPayload } from '@/types/printing';

type KitchenTicketDocumentProps = {
  order: PrintableOrderPayload;
};

export default function KitchenTicketDocument({ order }: KitchenTicketDocumentProps) {
  return (
    <section className="mx-auto w-full max-w-[420px] rounded-xl border border-gray-300 bg-white p-4 text-gray-900 print:max-w-[76mm] print:rounded-none print:border-0 print:p-2">
      <header className="border-b-2 border-gray-900 pb-3 text-center">
        <p className="text-base font-bold tracking-wide">{order.restaurantName}</p>
        <h1 className="text-xl font-black uppercase">Kitchen Order</h1>
        <p className="mt-1 text-base font-bold">#{order.orderNumber}</p>
        <p className="text-xs">{new Date(order.timestamp).toLocaleString()}</p>
      </header>

      <div className="mt-3 space-y-1 text-sm">
        <p>
          <span className="font-semibold">Type:</span> {order.orderType}
        </p>
        <p>
          <span className="font-semibold">
            {order.orderType === 'table' ? 'Table:' : 'Collection:'}
          </span>{' '}
          {order.orderType === 'table' ? order.tableNumber || '-' : order.collectionTime || '-'}
        </p>
        <p>
          <span className="font-semibold">Customer:</span> {order.customerName}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {order.orderStatus}
        </p>
      </div>

      {order.notes && (
        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-2 text-sm">
          <p className="font-semibold">Notes</p>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      <div className="mt-4 border-t border-b-2 border-gray-900 py-3">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Items</h2>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={`${order.orderNumber}-${item.id}`} className="border-b border-dashed border-gray-300 pb-2">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-base font-semibold">{item.name}</p>
                <p className="text-2xl font-black leading-none">{item.quantity}</p>
              </div>
              {item.modifiers.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                  {item.modifiers.map((modifier) => (
                    <li key={`${item.id}-${modifier}`}>+ {modifier}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[11px] text-gray-600">Payment: {order.paymentStatus} (info only)</p>
    </section>
  );
}
