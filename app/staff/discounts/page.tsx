'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffNav from '@/components/StaffNav';
import { supabaseServer } from '@/lib/supabaseServer';
import type { StaffRole } from '@/lib/staffAuth';

type DiscountCodeRow = {
  id: string;
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  minimum_order_total: number | null;
  created_at: string;
  updated_at: string;
};

type CreateDiscountForm = {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minimumOrderTotal: string;
  maxUses: string;
};

type EditDiscountForm = {
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minimumOrderTotal: string;
  maxUses: string;
};

const actionButtonClass =
  'button-staff inline-flex min-h-[42px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm';
const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function StaffDiscountsPage() {
  const router = useRouter();
  const [discountCodes, setDiscountCodes] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmittingId, setDeleteSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('staff');
  const [form, setForm] = useState<CreateDiscountForm>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minimumOrderTotal: '',
    maxUses: '',
  });
  const [editForm, setEditForm] = useState<EditDiscountForm>({
    description: '',
    discountType: 'percent',
    discountValue: '',
    minimumOrderTotal: '',
    maxUses: '',
  });

  const activeCount = useMemo(
    () => discountCodes.filter((discountCode) => discountCode.is_active).length,
    [discountCodes]
  );

  const getStaffAuthHeaders = async () => {
    const headers: Record<string, string> = {};
    const { data } = await supabaseServer.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    // Deprecated fallback during transition; remove after session auth rollout is complete.
    const legacyStaffKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
    if (legacyStaffKey) {
      headers['x-staff-key'] = legacyStaffKey;
    }
    return headers;
  };

  const loadDiscountCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/discounts', { cache: 'no-store', headers: authHeaders });
      const payload = (await response.json()) as { error?: string; discountCodes?: DiscountCodeRow[] };
      if (!response.ok) {
        setError(payload.error ?? 'Could not load discount codes.');
        setLoading(false);
        return;
      }
      setDiscountCodes(payload.discountCodes ?? []);
      setLoading(false);
    } catch {
      setError('Could not load discount codes.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (!data.session) {
        router.replace('/staff/login');
        return;
      }
      if (!active) return;
      try {
        const authHeaders = await getStaffAuthHeaders();
        const meResponse = await fetch('/api/staff/me', {
          cache: 'no-store',
          headers: authHeaders,
        });
        if (meResponse.ok) {
          const mePayload = (await meResponse.json()) as { role?: StaffRole };
          if (mePayload.role === 'owner' || mePayload.role === 'staff') {
            setStaffRole(mePayload.role);
          }
        }
      } catch {
        setStaffRole('staff');
      }
      await loadDiscountCodes();
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const onCreateDiscountCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          discount_type: form.discountType,
          discount_value: Number(form.discountValue),
          minimum_order_total: form.minimumOrderTotal ? Number(form.minimumOrderTotal) : null,
          max_uses: form.maxUses ? Number(form.maxUses) : null,
          is_active: true,
        }),
      });

      const payload = (await response.json()) as { error?: string; discountCode?: DiscountCodeRow };
      if (!response.ok || !payload.discountCode) {
        setError(payload.error ?? 'Could not create discount code.');
        setSubmitting(false);
        return;
      }

      setDiscountCodes((prev) => [payload.discountCode as DiscountCodeRow, ...prev]);
      setForm({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: '',
        minimumOrderTotal: '',
        maxUses: '',
      });
      setSuccessMessage('Discount code created.');
      setSubmitting(false);
    } catch {
      setError('Could not create discount code.');
      setSubmitting(false);
    }
  };

  const onToggleActive = async (discountCode: DiscountCodeRow, nextActive: boolean) => {
    try {
      setError('');
      setSuccessMessage('');
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch(`/api/staff/discounts/${discountCode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ is_active: nextActive }),
      });
      const payload = (await response.json()) as { error?: string; discountCode?: DiscountCodeRow };
      if (!response.ok || !payload.discountCode) {
        setError(payload.error ?? 'Could not update discount code.');
        return;
      }
      setDiscountCodes((prev) =>
        prev.map((current) => (current.id === discountCode.id ? (payload.discountCode as DiscountCodeRow) : current))
      );
      setSuccessMessage(`Discount code ${nextActive ? 'activated' : 'deactivated'}.`);
      await loadDiscountCodes();
    } catch {
      setError('Could not update discount code.');
    }
  };

  const beginEdit = (discountCode: DiscountCodeRow) => {
    setEditingDiscountId(discountCode.id);
    setEditForm({
      description: discountCode.description ?? '',
      discountType: discountCode.discount_type,
      discountValue: String(discountCode.discount_value),
      minimumOrderTotal:
        discountCode.minimum_order_total === null ? '' : String(discountCode.minimum_order_total),
      maxUses: discountCode.max_uses === null ? '' : String(discountCode.max_uses),
    });
    setError('');
    setSuccessMessage('');
  };

  const cancelEdit = () => {
    setEditingDiscountId(null);
    setEditSubmitting(false);
  };

  const saveEdit = async (discountCodeId: string) => {
    if (editSubmitting) return;
    setEditSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch(`/api/staff/discounts/${discountCodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          description: editForm.description,
          discount_type: editForm.discountType,
          discount_value: Number(editForm.discountValue),
          minimum_order_total: editForm.minimumOrderTotal ? Number(editForm.minimumOrderTotal) : null,
          max_uses: editForm.maxUses ? Number(editForm.maxUses) : null,
        }),
      });
      const payload = (await response.json()) as { error?: string; discountCode?: DiscountCodeRow };
      if (!response.ok || !payload.discountCode) {
        setError(payload.error ?? 'Could not update discount code.');
        setEditSubmitting(false);
        return;
      }
      setDiscountCodes((prev) =>
        prev.map((current) => (current.id === discountCodeId ? (payload.discountCode as DiscountCodeRow) : current))
      );
      setEditingDiscountId(null);
      setEditSubmitting(false);
      setSuccessMessage('Discount code updated.');
      await loadDiscountCodes();
    } catch {
      setError('Could not update discount code.');
      setEditSubmitting(false);
    }
  };

  const deleteDiscountCode = async (discountCode: DiscountCodeRow) => {
    if (deleteSubmittingId) return;
    const confirmed = window.confirm(
      `Delete discount code ${discountCode.code}? This permanently removes it.`
    );
    if (!confirmed) return;
    setDeleteSubmittingId(discountCode.id);
    setError('');
    setSuccessMessage('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch(`/api/staff/discounts/${discountCode.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const payload = (await response.json()) as { error?: string; deletedId?: string };
      if (!response.ok || !payload.deletedId) {
        setError(payload.error ?? 'Could not delete discount code.');
        setDeleteSubmittingId(null);
        return;
      }
      setDiscountCodes((prev) => prev.filter((entry) => entry.id !== discountCode.id));
      if (editingDiscountId === discountCode.id) {
        setEditingDiscountId(null);
      }
      setDeleteSubmittingId(null);
      setSuccessMessage('Discount code deleted.');
      await loadDiscountCodes();
    } catch {
      setError('Could not delete discount code.');
      setDeleteSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
        <section className="rounded-2xl border border-stone-200/70 bg-light/90 p-5 shadow-[0_6px_28px_rgba(28,26,24,0.06)] sm:p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Discount Codes</h1>
            <p className="mt-1 text-sm text-stone-600">
              Create and manage customer discount codes for checkout.
            </p>
          </div>

          <StaffNav />

          <div className="mb-4 rounded-xl border border-stone-200/80 bg-white p-4 text-sm text-stone-700">
            <p>
              Active codes: <span className="font-bold text-stone-900">{activeCount}</span> / Total:{' '}
              <span className="font-bold text-stone-900">{discountCodes.length}</span>
            </p>
          </div>

          {staffRole === 'owner' ? (
            <form onSubmit={onCreateDiscountCode} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-stone-200/80 bg-white p-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                className={inputClass}
                placeholder="WELCOME10"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className={inputClass}
                placeholder="10% off first order"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Type</label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, discountType: e.target.value as 'percent' | 'fixed' }))
                }
                className={inputClass}
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Value</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                className={inputClass}
                placeholder={form.discountType === 'percent' ? '10' : '2.50'}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Minimum total (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minimumOrderTotal}
                onChange={(e) => setForm((prev) => ({ ...prev, minimumOrderTotal: e.target.value }))}
                className={inputClass}
                placeholder="15.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">Max uses (optional)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.maxUses}
                onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
                className={inputClass}
                placeholder="100"
              />
            </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting} className={actionButtonClass}>
                  {submitting ? 'Creating...' : 'Create discount code'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 rounded-xl border border-stone-200/80 bg-white p-4 text-sm text-stone-600">
              Your role is <span className="font-semibold text-stone-900">staff</span>. You can view discount
              codes, but only owners can create or edit them.
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          )}
          {successMessage && (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-stone-600">Loading discount codes...</p>
          ) : (
            <div className="space-y-3">
              {discountCodes.map((discountCode) => (
                <article key={discountCode.id} className="rounded-xl border border-stone-200/80 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-stone-900">{discountCode.code}</p>
                      <p className="text-sm text-stone-600">
                        {discountCode.discount_type === 'percent'
                          ? `${discountCode.discount_value}% off`
                          : `GBP ${Number(discountCode.discount_value).toFixed(2)} off`}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        discountCode.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {discountCode.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {editingDiscountId === discountCode.id ? (
                    <div className="mt-3 space-y-3 rounded-lg border border-stone-200/80 bg-stone-50/60 p-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                          Description
                        </label>
                        <input
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                            Type
                          </label>
                          <select
                            value={editForm.discountType}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                discountType: e.target.value as 'percent' | 'fixed',
                              }))
                            }
                            className={inputClass}
                          >
                            <option value="percent">Percent</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                            Value
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editForm.discountValue}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                            Minimum total
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.minimumOrderTotal}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, minimumOrderTotal: e.target.value }))
                            }
                            className={inputClass}
                            placeholder="optional"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                            Max uses
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={editForm.maxUses}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, maxUses: e.target.value }))}
                            className={inputClass}
                            placeholder="optional"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => saveEdit(discountCode.id)}
                          disabled={editSubmitting}
                        >
                          {editSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={cancelEdit}
                          disabled={editSubmitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {discountCode.description && (
                        <p className="mt-2 text-sm text-stone-600">{discountCode.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                        <span>Used: {discountCode.used_count}</span>
                        {discountCode.max_uses !== null && <span>Max uses: {discountCode.max_uses}</span>}
                        {discountCode.minimum_order_total !== null && (
                          <span>Min total: GBP {Number(discountCode.minimum_order_total).toFixed(2)}</span>
                        )}
                      </div>
                    </>
                  )}
                  {staffRole === 'owner' && editingDiscountId !== discountCode.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {discountCode.is_active ? (
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => onToggleActive(discountCode, false)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={() => onToggleActive(discountCode, true)}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        className={actionButtonClass}
                        onClick={() => beginEdit(discountCode)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={actionButtonClass}
                        onClick={() => deleteDiscountCode(discountCode)}
                        disabled={deleteSubmittingId === discountCode.id}
                      >
                        {deleteSubmittingId === discountCode.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {!discountCodes.length && <p className="text-sm text-stone-600">No discount codes yet.</p>}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
