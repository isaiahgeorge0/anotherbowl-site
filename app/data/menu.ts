export type MenuItem = {
  id: string;            // stable ID (slug-like)
  name: string;
  price?: string;        // e.g. "£8.25" (string so we can show ranges)
  description?: string;  // optional short line
  flags?: ("V"|"VG"|"GF"|"N")[]; // optional dietary badges
  subcategory?: string;  // e.g. "Wraps", "Porridges"
};

export type MenuCategory = {
  key: "mains"|"bowls"|"specials"|"drinks";
  label: string;
  color?: "pink"|"green";
  items: MenuItem[];
  subcategories?: string[]; // for sub-pills like "Wraps", "Porridges"
};

export const MENU: MenuCategory[] = [
  {
    key: "mains",
    label: "Mains",
    color: "pink",
    subcategories: ["Wraps", "Flatbreads & Bagels", "Toasts", "Porridges", "Sweet Treats"],
    items: [
      {
        id: "wrap-1",
        name: "Chicken & Avocado Wrap",
        price: "£8.50",
        description: "Grilled chicken, fresh avocado, mixed greens",
        subcategory: "Wraps",
        flags: ["GF"]
      },
      {
        id: "wrap-2",
        name: "Veggie Delight Wrap",
        price: "£7.50",
        description: "Roasted vegetables, hummus, rocket",
        subcategory: "Wraps",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "flatbread-1",
        name: "Smoked Salmon Flatbread",
        price: "£9.25",
        description: "Cream cheese, capers, red onion",
        subcategory: "Flatbreads & Bagels",
        flags: ["GF"]
      },
      {
        id: "toast-1",
        name: "Avocado Toast",
        price: "£6.75",
        description: "Sourdough, smashed avocado, sea salt",
        subcategory: "Toasts",
        flags: ["V", "VG"]
      },
      {
        id: "porridge-1",
        name: "Berry Porridge",
        price: "£5.50",
        description: "Oats, mixed berries, honey",
        subcategory: "Porridges",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "sweet-1",
        name: "Chocolate Brownie",
        price: "£3.50",
        description: "Rich chocolate, walnuts",
        subcategory: "Sweet Treats",
        flags: ["V", "GF"]
      }
    ]
  },
  {
    key: "bowls",
    label: "Bowls & Smoothies",
    color: "green",
    items: [
      {
        id: "bowl-1",
        name: "Acai Power Bowl",
        price: "£9.75",
        description: "Acai, granola, banana, berries",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "bowl-2",
        name: "Green Goddess Bowl",
        price: "£8.95",
        description: "Quinoa, kale, avocado, seeds",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "smoothie-1",
        name: "Berry Blast Smoothie",
        price: "£5.25",
        description: "Mixed berries, banana, almond milk",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "smoothie-2",
        name: "Green Machine Smoothie",
        price: "£5.75",
        description: "Spinach, apple, ginger, coconut water",
        flags: ["V", "VG", "GF"]
      }
    ]
  },
  {
    key: "specials",
    label: "Summer Specials",
    color: "pink",
    items: [
      {
        id: "special-1",
        name: "Summer Berry Salad",
        price: "£7.95",
        description: "Mixed greens, strawberries, blueberries, balsamic",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "special-2",
        name: "Iced Matcha Latte",
        price: "£4.50",
        description: "Premium matcha, oat milk, honey",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "special-3",
        name: "Coconut Chia Pudding",
        price: "£6.25",
        description: "Chia seeds, coconut milk, mango",
        flags: ["V", "VG", "GF"]
      }
    ]
  },
  {
    key: "drinks",
    label: "Drinks",
    color: "green",
    subcategories: ["Coffee (Iced/Hot)", "Iced Teas & Juices", "Shots"],
    items: [
      {
        id: "coffee-1",
        name: "Flat White",
        price: "£3.25",
        description: "Double espresso, steamed milk",
        subcategory: "Coffee (Iced/Hot)",
        flags: ["V"]
      },
      {
        id: "coffee-2",
        name: "Iced Latte",
        price: "£3.75",
        description: "Espresso, cold milk, ice",
        subcategory: "Coffee (Iced/Hot)",
        flags: ["V"]
      },
      {
        id: "tea-1",
        name: "Peach Iced Tea",
        price: "£3.50",
        description: "Black tea, peach syrup, lemon",
        subcategory: "Iced Teas & Juices",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "juice-1",
        name: "Fresh Orange Juice",
        price: "£3.00",
        description: "Cold-pressed, no pulp",
        subcategory: "Iced Teas & Juices",
        flags: ["V", "VG", "GF"]
      },
      {
        id: "shot-1",
        name: "Wheatgrass Shot",
        price: "£2.50",
        description: "Fresh wheatgrass, lemon",
        subcategory: "Shots",
        flags: ["V", "VG", "GF"]
      }
    ]
  }
];
