'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffLogoutButton from '@/components/StaffLogoutButton';
import { supabaseServer } from '@/lib/supabaseServer';
import type { StaffCategory, StaffProduct } from '@/types/menuManagement';

const primaryButtonClass =
  'px-4 py-2 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const inputClass =
  'w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';

type ProductDraft = {
  name: string;
  price: string;
  category: string;
  is_active: boolean;
};

const defaultDraft: ProductDraft = {
  name: '',
  price: '',
  category: '',
  is_active: true,
};

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
      setProducts((data.products ?? []).map((product) => ({ ...product, price: Number(product.price) })));
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
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [categories, products]);

  const openEditModal = (product: StaffProduct) => {
    setEditingProduct(product);
    setEditDraft({
      name: product.name,
      price: product.price.toFixed(2),
      category: product.category,
      is_active: product.is_active,
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditDraft(defaultDraft);
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
      return;
    }
    fetchMenu();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <p className="text-gray-700">Checking staff session...</p>
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Staff Menu Management</h1>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <form onSubmit={submitNewCategory} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Add Category</h2>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Category name"
                className={inputClass}
              />
              <input
                value={newCategoryOrder}
                onChange={(event) => setNewCategoryOrder(event.target.value)}
                placeholder="Display order"
                type="number"
                min={0}
                className={inputClass}
              />
              <button disabled={saving} className={primaryButtonClass}>
                Create category
              </button>
            </form>

            <form onSubmit={submitNewProduct} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="text-lg font-bold text-gray-900">Add Product</h2>
              <input
                value={newProduct.name}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Product name"
                className={inputClass}
              />
              <input
                value={newProduct.price}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="Price"
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
              />
              <select
                value={newProduct.category}
                onChange={(event) => setNewProduct((prev) => ({ ...prev, category: event.target.value }))}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={newProduct.is_active}
                  onChange={(event) =>
                    setNewProduct((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
                Active product
              </label>
              <button disabled={saving} className={primaryButtonClass}>
                Create product
              </button>
            </form>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {loading && <p className="text-gray-600 mb-4">Loading menu catalog...</p>}

          <div className="space-y-6">
            {productsByCategory.map(({ category, products: categoryProducts }) => (
              <section key={category.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                    <p className="text-sm text-gray-600">
                      Order: {category.display_order} | Products: {categoryProducts.length}
                    </p>
                  </div>
                  <button
                    className={secondaryButtonClass}
                    onClick={() => {
                      const renamed = window.prompt('Rename category', category.name);
                      if (!renamed) return;
                      const displayOrder = window.prompt(
                        'Display order',
                        String(category.display_order)
                      );
                      if (displayOrder === null) return;
                      const parsed = Number(displayOrder);
                      if (!Number.isInteger(parsed) || parsed < 0) return;
                      saveCategoryEdit(category, renamed, parsed);
                    }}
                  >
                    Edit category
                  </button>
                </div>

                {categoryProducts.length === 0 ? (
                  <p className="text-sm text-gray-600">No products in this category.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryProducts.map((product) => (
                      <article
                        key={product.id}
                        className={`rounded-xl border bg-white p-4 ${
                          product.is_active
                            ? 'border-emerald-200'
                            : 'border-gray-300 opacity-80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-sm text-gray-700">
                              GBP {Number(product.price).toFixed(2)} | {category.name}
                            </p>
                            <p className="text-xs text-gray-500">{product.id}</p>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <input
                              type="checkbox"
                              checked={product.is_active}
                              onChange={(event) => setProductActiveState(product, event.target.checked)}
                            />
                            {product.is_active ? 'Active' : 'Inactive'}
                          </label>
                          <button className={secondaryButtonClass} onClick={() => openEditModal(product)}>
                            Edit
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Product</h2>
            <div className="space-y-3">
              <input
                value={editDraft.name}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClass}
              />
              <input
                value={editDraft.price}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, price: event.target.value }))}
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
              />
              <select
                value={editDraft.category}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, category: event.target.value }))}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                <input
                  type="checkbox"
                  checked={editDraft.is_active}
                  onChange={(event) =>
                    setEditDraft((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                />
                Active product
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={saveProductEdit} disabled={saving} className={primaryButtonClass}>
                Save changes
              </button>
              <button onClick={closeEditModal} className={secondaryButtonClass}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
