'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ReceiptDocument from '@/components/ReceiptDocument';
import KitchenTicketDocument from '@/components/KitchenTicketDocument';
import type { ReceiptSnapshot } from '@/types/order';
import {
  DEFAULT_PRINT_DOCUMENT_TYPE,
  isPrintableDocumentType,
  type PrintableDocumentType,
  type PrintableOrderPayload,
} from '@/types/printing';
import { PRINTER_ROUTING } from '@/lib/printerRouting';

const STAFF_KEY = process.env.NEXT_PUBLIC_STAFF_API_KEY ?? '';
const primaryButtonClass =
  'px-4 py-2 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 print:hidden';
const secondaryButtonClass =
  'px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 print:hidden';

export default function StaffOrderReceiptPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null);
  const [printableOrder, setPrintableOrder] = useState<PrintableOrderPayload | null>(null);
  const [error, setError] = useState('');
  const documentTypeParam = searchParams.get('type');
  const documentType: PrintableDocumentType = isPrintableDocumentType(documentTypeParam)
    ? documentTypeParam
    : DEFAULT_PRINT_DOCUMENT_TYPE;

  useEffect(() => {
    const run = async () => {
      setError('');
      if (!STAFF_KEY) {
        setError('Staff API key is not configured for receipt view.');
        return;
      }

      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(params.id)}/receipt`, {
          cache: 'no-store',
          headers: { 'x-staff-key': STAFF_KEY },
        });
        if (!response.ok) {
          let serverMessage = '';
          try {
            const body = (await response.json()) as { error?: string };
            serverMessage = body.error ?? '';
          } catch {
            // Ignore JSON parse issues for non-JSON error responses.
          }
          console.error('Receipt fetch failed.', {
            status: response.status,
            statusText: response.statusText,
            orderId: params.id,
            serverMessage: serverMessage || undefined,
          });
          setError(
            `Could not load receipt (HTTP ${response.status}${serverMessage ? `: ${serverMessage}` : ''}).`
          );
          return;
        }
        const data = (await response.json()) as {
          receipt: ReceiptSnapshot;
          printableOrder?: PrintableOrderPayload;
        };
        setReceipt(data.receipt);
        setPrintableOrder(data.printableOrder ?? null);
      } catch {
        console.error('Receipt fetch failed due to network/runtime error.', { orderId: params.id });
        setError('Could not load receipt (network error).');
      }
    };
    run();
  }, [params.id]);

  useEffect(() => {
    if (!receipt) return;
    if (searchParams.get('print') !== '1') return;
    const timer = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(timer);
  }, [receipt, searchParams]);

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-3xl print:max-w-none">
        <div className="mb-4 flex items-center justify-end gap-2 print:hidden">
          <button onClick={() => window.print()} className={primaryButtonClass}>
            Print
          </button>
          <button onClick={() => window.close()} className={secondaryButtonClass}>
            Close
          </button>
        </div>

        {error && <p className="text-red-600 mb-3 print:hidden">{error}</p>}
        {!receipt && !error && <p className="text-gray-700 print:hidden">Loading receipt...</p>}
        {receipt && (
          <>
            <p className="mb-3 text-xs text-gray-600 print:hidden">
              Document: {documentType.replace('_', ' ')} | Route target: {PRINTER_ROUTING[documentType]}
            </p>
            {documentType === 'kitchen_ticket' && printableOrder ? (
              <KitchenTicketDocument order={printableOrder} />
            ) : (
              <ReceiptDocument receipt={receipt} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
