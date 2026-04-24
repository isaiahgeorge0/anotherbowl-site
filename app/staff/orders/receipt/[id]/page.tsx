'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReceiptDocument from '@/components/ReceiptDocument';
import KitchenTicketDocument from '@/components/KitchenTicketDocument';
import StaffLogoutButton from '@/components/StaffLogoutButton';
import { supabaseServer } from '@/lib/supabaseServer';
import type { ReceiptSnapshot } from '@/types/order';
import {
  DEFAULT_PRINT_DOCUMENT_TYPE,
  isPrintableDocumentType,
  type PrintableDocumentType,
  type PrintableOrderPayload,
} from '@/types/printing';
import { PRINTER_ROUTING } from '@/lib/printerRouting';

const primaryButtonClass =
  'px-4 py-2 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 print:hidden';
const secondaryButtonClass =
  'px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 print:hidden';

export default function StaffOrderReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null);
  const [printableOrder, setPrintableOrder] = useState<PrintableOrderPayload | null>(null);
  const [error, setError] = useState('');
  const documentTypeParam = searchParams.get('type');
  const documentType: PrintableDocumentType = isPrintableDocumentType(documentTypeParam)
    ? documentTypeParam
    : DEFAULT_PRINT_DOCUMENT_TYPE;

  const getStaffAuthHeaders = async () => {
    const headers: Record<string, string> = {};
    const { data } = await supabaseServer.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    // Deprecated fallback during transition; remove once all staff clients send session auth.
    const legacyStaffKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
    if (legacyStaffKey) {
      headers['x-staff-key'] = legacyStaffKey;
    }
    return headers;
  };

  // Supabase auth gate replaces temporary route protection for operational security.
  // x-staff-key remains temporarily in API requests until backend auth migration is complete.
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (!data.session) {
        router.replace('/staff/login');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    };

    checkSession();

    const { data: authSubscription } = supabaseServer.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace('/staff/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const run = async () => {
      setError('');
      try {
        const authHeaders = await getStaffAuthHeaders();
        const response = await fetch(`/api/orders/${encodeURIComponent(params.id)}/receipt`, {
          cache: 'no-store',
          headers: authHeaders,
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
  }, [isAuthenticated, params.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!receipt) return;
    if (searchParams.get('print') !== '1') return;
    const timer = window.setTimeout(() => window.print(), 200);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, receipt, searchParams]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-gray-700">Checking staff session...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-3xl print:max-w-none">
        <div className="mb-4 flex items-center justify-end gap-2 print:hidden">
          <StaffLogoutButton className={secondaryButtonClass} />
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
