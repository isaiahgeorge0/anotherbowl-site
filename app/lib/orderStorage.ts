import type { BasketItem, StoredOrder } from '@/types/order';

const BASKET_KEY = 'another-bowl-order-basket';
const LAST_ORDER_KEY = 'another-bowl-last-order';

const canUseStorage = () => typeof window !== 'undefined';

export const getBasket = (): BasketItem[] => {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(BASKET_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as BasketItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBasket = (basket: BasketItem[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
};

export const clearBasket = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(BASKET_KEY);
};

export const saveLastOrder = (order: StoredOrder) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
};

export const getLastOrder = (): StoredOrder | null => {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(LAST_ORDER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredOrder;
  } catch {
    return null;
  }
};
