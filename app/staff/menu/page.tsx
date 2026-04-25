'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffLogoutButton from '@/components/StaffLogoutButton';
import StaffNav from '@/components/StaffNav';
import { supabaseServer } from '@/lib/supabaseServer';
import type { StaffCategory, StaffProduct } from '@/types/menuManagement';

const primaryButtonClass =
  'button-staff rounded-xl px-4 py-2 shadow-sm active:scale-[0.98]';
const secondaryButtonClass =
  'button-staff rounded-xl px-4 py-2 shadow-sm';
const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 min-h-11 text-base font-medium text-stone-900 focus:border-[#D16A8C] focus:outline-none focus:ring-2 focus:ring-[#D16A8C]/25 sm:text-sm';
const textareaClass =
  'w-full min-h-24 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 focus:border-[#D16A8C] focus:outline-none focus:ring-2 focus:ring-[#D16A8C]/25 sm:text-sm';
const fieldLabelClass = 'block text-xs font-semibold uppercase tracking-wide text-stone-700';
const noticeBoxClass = 'rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-900/90';
const modalOverlayClass = 'fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center sm:p-6';
const modalPanelClass =
  'max-h-[min(100vh,42rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-400 bg-white p-5 shadow-[0_20px_45px_rgba(28,26,24,0.22)] sm:p-6';

type ProductDraft = {
  name: string;
  price: string;
  category: string;
  is_active: boolean;
  description: string;
};

const defaultDraft: ProductDraft = {
  name: '',
  price: '',
  category: '',
  is_active: true,
  description: '',
};

type CategoryEditDraft = { name: string; display_order: string };
const defaultCategoryDraft: CategoryEditDraft = { name: '', display_order: '0' };

export default function StaffMenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryOrder, setNewCategoryOrder] = useState('0');
  const [newProduct, setNewProduct] = useState<ProductDraft>(defaultDraft);

  const [editingProduct, setEditingProduct] = useState<StaffProduct | null>(null);
  const [editDraft, setEditDraft] = useState<ProductDraft>(defaultDraft);
  const [editingCategory, setEditingCategory] = useState<StaffCategory | null>(null);
  const [categoryEditDraft, setCategoryEditDraft] = useState<CategoryEditDraft>(defaultCategoryDraft);

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

  const getStaffAuthHeaders = useCallback(async () => {
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
  }, []);

  const fetchMenu = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setError('');
      setLoading(true);
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/menu', {
        cache: 'no-store',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error('Failed to load menu.');
      const data = (await response.json()) as { categories: StaffCategory[]; products: StaffProduct[] };
      setCategories(data.categories ?? []);
      setProducts(
        (data.products ?? []).map((product) => ({
          ...product,
          price: Number(product.price),
          description: product.description ?? '',
        }))
      );
    } catch {
      setError('Could not load staff menu data.');
    } finally {
      setLoading(false);
    }
  }, [getStaffAuthHeaders, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMenu();
  }, [fetchMenu, isAuthenticated]);

  const productsByCategory = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((category) => ({
        category,
        products: products
          .filter((product) => product.category === category.id)
          .sort(
            (a, b) =>
              (a.display_order ?? Number.MAX_SAFE_INTEGER) -
                (b.display_order ?? Number.MAX_SAFE_INTEGER) ||
              a.name.localeCompare(b.name)
          ),
      }));
  }, [categories, products]);

  const openEditModal = (product: StaffProduct) => {
    setEditingProduct(product);
    setEditDraft({
      name: product.name,
      price: product.price.toFixed(2),
      category: product.category,
      is_active: product.is_active,
      description: product.description ?? '',
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditDraft(defaultDraft);
  };

  const openCategoryModal = (category: StaffCategory) => {
    setEditingCategory(category);
    setCategoryEditDraft({
      name: category.name,
      display_order: String(category.display_order),
    });
  };

  const closeCategoryModal = () => {
    setEditingCategory(null);
    setCategoryEditDraft(defaultCategoryDraft);
  };

  const submitNewCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayOrder = Number(newCategoryOrder);
    if (!newCategoryName.trim() || !Number.isInteger(displayOrder) || displayOrder < 0) return;
    setSaving(true);
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch('/api/staff/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ name: newCategoryName.trim(), display_order: displayOrder }),
    });
    setSaving(false);
    if (!response.ok) {
      setError('Could not create category.');
      return;
    }
    setNewCategoryName('');
    setNewCategoryOrder('0');
    fetchMenu();
  };

  const submitNewProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(newProduct.price);
    if (!newProduct.name.trim() || !newProduct.category || Number.isNaN(price) || price < 0) return;
    setSaving(true);
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch('/api/staff/menu/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: newProduct.name.trim(),
        price,
        category: newProduct.category,
        is_active: newProduct.is_active,
        description: newProduct.description.trim(),
      }),
    });
    setSaving(false);
    if (!response.ok) {
      setError('Could not create product.');
      return;
    }
    setNewProduct(defaultDraft);
    fetchMenu();
  };

  const saveProductEdit = async () => {
    if (!editingProduct) return;
    const price = Number(editDraft.price);
    if (!editDraft.name.trim() || !editDraft.category || Number.isNaN(price) || price < 0) return;
    setSaving(true);
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch(`/api/staff/menu/products/${encodeURIComponent(editingProduct.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        name: editDraft.name.trim(),
        price,
        category: editDraft.category,
        is_active: editDraft.is_active,
        description: editDraft.description.trim(),
      }),
    });
    setSaving(false);
    if (!response.ok) {
      setError('Could not update product.');
      return;
    }
    closeEditModal();
    fetchMenu();
  };

  const setProductActiveState = async (product: StaffProduct, isActive: boolean) => {
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch(`/api/staff/menu/products/${encodeURIComponent(product.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!response.ok) {
      setError('Could not update product status.');
      return;
    }
    setProducts((prev) =>
      prev.map((entry) => (entry.id === product.id ? { ...entry, is_active: isActive } : entry))
    );
  };

  const saveCategoryEdit = async (category: StaffCategory, name: string, displayOrder: number) => {
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch(`/api/staff/menu/categories/${encodeURIComponent(category.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ name: name.trim(), display_order: displayOrder }),
    });
    if (!response.ok) {
      setError('Could not update category.');
      return false;
    }
    await fetchMenu();
    return true;
  };

  const saveCategoryFromModal = async () => {
    if (!editingCategory) return;
    const displayOrder = Number(categoryEditDraft.display_order);
    if (!categoryEditDraft.name.trim() || !Number.isInteger(displayOrder) || displayOrder < 0) {
      setError('Category name and a non-negative display order are required.');
      return;
    }
    setError('');
    setSaving(true);
    const ok = await saveCategoryEdit(editingCategory, categoryEditDraft.name, displayOrder);
    setSaving(false);
    if (ok) closeCategoryModal();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <p className="text-stone-600">Checking staff session...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Staff Menu Management</h1>
            <StaffLogoutButton className={secondaryButtonClass} />
          </div>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Internal staff management view only.</p>
            <p className="text-sm mt-1">
              Staff route access now uses Supabase session auth. Legacy API-key fallback remains temporarily
              during migration.
            </p>
            <p className="text-sm mt-1">
              Product deactivation uses soft delete (`is_active = false`) to preserve order history integrity.
            </p>
          </div>

          <StaffNav />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <form onSubmit={submitNewCategory} className="space-y-3 rounded-xl border border-stone-200/80 p-4">
              <h2 className="text-lg font-bold text-stone-900">Add category</h2>
              <div>
                <label className={fieldLabelClass} htmlFor="new-category-name">
                  Name
                </label>
                <input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Bowls"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="new-category-order">
                  Display order
                </label>
                <input
                  id="new-category-order"
                  value={newCategoryOrder}
                  onChange={(event) => setNewCategoryOrder(event.target.value)}
                  placeholder="0 = first"
                  type="number"
                  min={0}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full sm:w-auto`}>
                Create category
              </button>
            </form>

            <form onSubmit={submitNewProduct} className="space-y-3 rounded-xl border border-stone-200/80 p-4">
              <h2 className="text-lg font-bold text-stone-900">Add product</h2>
              <div>
                <label className={fieldLabelClass} htmlFor="new-product-name">
                  Name
                </label>
                <input
                  id="new-product-name"
                  value={newProduct.name}
                  onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Product name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="new-product-desc">
                  Description
                </label>
                <textarea
                  id="new-product-desc"
                  value={newProduct.description}
                  onChange={(event) =>
                    setNewProduct((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Optional — shown in staff; menu display may use static data until wired."
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabelClass} htmlFor="new-product-price">
                    Price (GBP)
                  </label>
                  <input
                    id="new-product-price"
                    value={newProduct.price}
                    onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
                    placeholder="0.00"
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="new-product-cat">
                    Category
                  </label>
                  <select
                    id="new-product-cat"
                    value={newProduct.category}
                    onChange={(event) =>
                      setNewProduct((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 rounded border-stone-300 text-primary"
                  checked={newProduct.is_active}
                  onChange={(event) =>
                    setNewProduct((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
                Available to sell (active)
              </label>
              <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full sm:w-auto`}>
                Create product
              </button>
            </form>
          </div>

          {error && <p className="mb-4 text-red-600">{error}</p>}
          {loading && <p className="mb-4 text-stone-600">Loading menu catalog...</p>}

          {!loading && !categories.length && (
            <p className="rounded-xl border border-dashed border-stone-300/90 bg-mint/10 p-4 text-stone-600">
              No categories yet. Add a category above, then add products.
            </p>
          )}

          <div className="space-y-6">
            {productsByCategory.map(({ category, products: categoryProducts }) => (
              <section
                key={category.id}
                className="rounded-xl border border-stone-200/75 bg-mint/20 p-4 sm:p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-stone-900">{category.name}</h2>
                    <p className="text-sm text-stone-600">
                      Sort order: {category.display_order} · {categoryProducts.length} item
                      {categoryProducts.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-stone-500 break-all">id: {category.id}</p>
                  </div>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full sm:w-auto`}
                    onClick={() => openCategoryModal(category)}
                  >
                    Edit category
                  </button>
                </div>

                {categoryProducts.length === 0 ? (
                  <p className="text-sm text-stone-600">No products in this category yet.</p>
                ) : (
                  <ul className="list-none space-y-3 p-0">
                    {categoryProducts.map((product) => (
                      <li key={product.id}>
                        <article
                          className={`rounded-xl border bg-light/90 p-4 ${
                            product.is_active
                              ? 'border-emerald-200'
                              : 'border-stone-300 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-stone-900">{product.name}</p>
                              {product.description ? (
                                <p className="mt-1 line-clamp-3 text-sm text-stone-600">
                                  {product.description}
                                </p>
                              ) : null}
                              <p className="mt-2 text-sm text-stone-800">
                                <span className="font-medium">£{Number(product.price).toFixed(2)}</span>
                                <span className="text-stone-500"> · {category.name}</span>
                              </p>
                              <p className="text-xs text-stone-500 break-all">id: {product.id}</p>
                            </div>
                            <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end">
                              <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-stone-800 sm:min-h-0">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded border-stone-300 text-primary"
                                  checked={product.is_active}
                                  onChange={(event) => setProductActiveState(product, event.target.checked)}
                                />
                                {product.is_active ? 'Available' : 'Hidden'}
                              </label>
                              <button
                                type="button"
                                className={secondaryButtonClass}
                                onClick={() => openEditModal(product)}
                              >
                                Edit details
                              </button>
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      {editingProduct && (
        <div
          className={modalOverlayClass}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-product-title"
        >
          <div className={modalPanelClass}>
            <h2 id="edit-product-title" className="mb-4 text-xl font-bold text-stone-900">
              Edit product
            </h2>
            <div className="space-y-3">
              <div>
                <label className={fieldLabelClass} htmlFor="edit-product-name">
                  Name
                </label>
                <input
                  id="edit-product-name"
                  value={editDraft.name}
                  onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="edit-product-desc">
                  Description
                </label>
                <textarea
                  id="edit-product-desc"
                  value={editDraft.description}
                  onChange={(event) =>
                    setEditDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={fieldLabelClass} htmlFor="edit-product-price">
                    Price (GBP)
                  </label>
                  <input
                    id="edit-product-price"
                    value={editDraft.price}
                    onChange={(event) => setEditDraft((prev) => ({ ...prev, price: event.target.value }))}
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="edit-product-cat">
                    Category
                  </label>
                  <select
                    id="edit-product-cat"
                    value={editDraft.category}
                    onChange={(event) =>
                      setEditDraft((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-stone-800 sm:min-h-0">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-stone-300 text-primary"
                  checked={editDraft.is_active}
                  onChange={(event) =>
                    setEditDraft((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
                Available to sell (active)
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={saveProductEdit}
                disabled={saving}
                className={`${primaryButtonClass} inline-flex w-full items-center justify-center sm:w-auto`}
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                className={`${secondaryButtonClass} w-full sm:w-auto`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div
          className={modalOverlayClass}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeCategoryModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-title"
        >
          <div className={modalPanelClass}>
            <h2 id="edit-category-title" className="mb-4 text-xl font-bold text-stone-900">
              Edit category
            </h2>
            <div className="space-y-3">
              <div>
                <label className={fieldLabelClass} htmlFor="edit-category-name">
                  Name
                </label>
                <input
                  id="edit-category-name"
                  value={categoryEditDraft.name}
                  onChange={(event) =>
                    setCategoryEditDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="edit-category-order">
                  Display order
                </label>
                <input
                  id="edit-category-order"
                  value={categoryEditDraft.display_order}
                  onChange={(event) =>
                    setCategoryEditDraft((prev) => ({ ...prev, display_order: event.target.value }))
                  }
                  type="number"
                  min={0}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-stone-500">Lower numbers appear first in the list above.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={saveCategoryFromModal}
                disabled={saving}
                className={`${primaryButtonClass} inline-flex w-full items-center justify-center sm:w-auto`}
              >
                Save category
              </button>
              <button
                type="button"
                onClick={closeCategoryModal}
                className={`${secondaryButtonClass} w-full sm:w-auto`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
