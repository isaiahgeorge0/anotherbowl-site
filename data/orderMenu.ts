import { MENU } from '@/data/menu';
import type { OrderMenuItem } from '@/types/order';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ORDER_MENU: OrderMenuItem[] = MENU.flatMap((category) =>
  category.items.map((item, index) => ({
    id: `${category.id}-${slugify(item.name)}-${index}`,
    name: item.name,
    description: item.description ?? '',
    price: item.prices[0]?.amount ?? 0,
    category: category.title,
    available: true,
    modifiers: [], // Placeholder for configurable add-ons/options
    allergens: [], // Placeholder for allergen data
    dietaryTags: item.tags ?? [], // Placeholder can be expanded from data source later
  }))
);

export const ORDER_MENU_BY_CATEGORY = ORDER_MENU.reduce<Record<string, OrderMenuItem[]>>(
  (acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  },
  {}
);
