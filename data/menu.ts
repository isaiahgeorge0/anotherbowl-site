export type Price = {
  label?: string; // 'R' for Regular, 'L' for Large
  amount: number;
};

export type MenuItem = {
  name: string;
  description?: string;
  prices: Price[];
  tags?: string[]; // 'V' for Vegetarian, 'VE' for Vegan, 'GF' for Gluten Free, etc.
  notes?: string; // Additional info like add-ons, instructions, etc.
};

export type MenuCategory = {
  id: string;
  title: string;
  theme?: 'pink' | 'peach' | 'green' | 'beige';
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  // Page 1 (Pink Theme)
  {
    id: 'wraps-flatbreads-bagels',
    title: 'WRAPS FLATBREADS + BAGELS',
    theme: 'pink',
    items: [
      {
        name: 'AVO, EGG & CHEESE WRAP',
        description: 'avocado, egg & cheese wrap. add pesto free of charge.',
        prices: [{ amount: 7.25 }],
        tags: ['V'],
        notes: '418cals'
      },
      {
        name: 'TZATZIKI & HALLOUMI FLATBREAD',
        description: 'tzatziki, halloumi, spinach & cucumber flatbread.',
        prices: [{ amount: 8.95 }],
        tags: ['V'],
        notes: '440cals'
      },
      {
        name: 'SALMON & CREAM CHEESE BAGEL',
        description: 'bagel filled with salmon, black pepper & cream cheese.',
        prices: [{ amount: 7.95 }],
        notes: '374cals'
      },
      {
        name: 'AVO, TUNA, TOMATO & PESTO WRAP',
        description: 'tuna, avocado, tomato & pesto wrap.',
        prices: [{ amount: 7.25 }],
        notes: '432cals'
      },
      {
        name: 'AVO, EGG & HALLOUMI BAGEL',
        description: 'avocado, egg & halloumi bagel with sweet chilli jam. swap for pesto free of charge.',
        prices: [{ amount: 6.75 }],
        tags: ['V'],
        notes: '581cals'
      },
      {
        name: 'HOT HONEY HALLOUMI TACOS',
        description: '3 soft flour tacos, avocado cream, pico de gallo, red onion, spicy mayo, hot honey halloumi & lime.',
        prices: [{ amount: 11.95 }],
        tags: ['V'],
        notes: '740cals'
      },
      {
        name: 'BOWL OF HOMEMADE TORTILLA CHIPS',
        description: 'served with avocado cream, spicy mayo, pico de gallo.',
        prices: [{ amount: 5.95 }],
        tags: ['V'],
        notes: '610cals'
      }
    ]
  },
  {
    id: 'porridges',
    title: 'PORRIDGES',
    theme: 'pink',
    items: [
      {
        name: 'PLAIN PORRIDGE',
        description: 'have with honey or add any fruit of your choosing.',
        prices: [{ amount: 7.95 }],
        tags: ['V'],
        notes: '200cals'
      },
      {
        name: 'COCONUT PORRIDGE',
        description: 'rolled oats & coconut milk, topped with shredded coconut, drizzled almond butter & chia seeds.',
        prices: [{ amount: 7.95 }],
        tags: ['VE'],
        notes: '353cals'
      },
      {
        name: 'BLUBERRY PORRIDGE',
        description: 'rolled oats, blueberries, agave, almond milk topped with strawberries, blueberries & coconut flakes.',
        prices: [{ amount: 7.95 }],
        tags: ['VE'],
        notes: '388cals'
      },
      {
        name: 'CHOCOLATE BANANA',
        description: 'rolled oats, chocolate soya & cacao powder, topped with banana, cacao nibs, raspberries, blueberries, chocolate hazelnut butter & flaxseeds.',
        prices: [{ amount: 7.95 }],
        tags: ['V'],
        notes: '493cals'
      },
      {
        name: 'APPLE CINNAMON',
        description: 'rolled oats, cinnamon, oat milk & honey, topped with apple slices, chia seeds & dusted with cinnamon.',
        prices: [{ amount: 7.95 }],
        tags: ['V'],
        notes: '392cals'
      }
    ]
  },
  {
    id: 'toasts',
    title: 'TOASTS',
    theme: 'pink',
    items: [
      {
        name: 'AVOCADO TOAST',
        description: 'two slices of sourdough or granary bread, smashed avocado with salt & pepper and rocket and balsamic',
        prices: [{ amount: 7.25 }],
        tags: ['VE'],
        notes: '330cals. Add eggs for £1.50, Add halloumi for £2.50, Top with tomatoes for £1.'
      },
      {
        name: 'TUNA ON TOAST',
        description: 'two slices of sourdough topped with tuna, chilli flakes, balsamic and rocket.',
        prices: [{ amount: 8.25 }]
      },
      {
        name: 'SCRAMBLED EGG ON TOAST',
        description: 'scrambled egg on toasted sourdough or granary bread.',
        prices: [{ amount: 7.25 }],
        tags: ['V'],
        notes: '413cals. Please let us know if you would like your bread to be buttered, add avocado for £1.50.'
      },
      {
        name: 'PESTO, MOZZARELLA & TOMATO TOAST',
        description: 'melted mozzarella with pesto & tomato on toasted sourdough or granary bread.',
        prices: [{ amount: 8.25 }],
        tags: ['V'],
        notes: '434cals'
      },
      {
        name: 'MAKE YOUR OWN TOAST',
        description: '1. choose your bread. 2. choose your spread (pb, jam, nutella or almond butter). 3. add any of our available fruits.',
        prices: [{ amount: 7.25 }],
        notes: 'Add eggs for £2.75, Add halloumi for £2.50, Top with tomatoes for £1, Add pico de gallo & red onion for £3.25, Add salmon for £3.25.'
      }
    ]
  },
  {
    id: 'sweet-treats',
    title: 'SWEET TREATS',
    theme: 'pink',
    items: [
      {
        name: 'BANANA BREAD',
        description: 'add your own fruit, drizzle & toppings for an extra £1.50.',
        prices: [{ amount: 3.00 }],
        tags: ['V'],
        notes: '284cals'
      },
      {
        name: 'CHOCOLATE & BANANA PANCAKES',
        description: 'pancakes topped with sliced bananas, strawberries and drizzled with chocolate hazelnut spread, served with greek yoghurt and cacao nibs.',
        prices: [{ amount: 10.95 }],
        tags: ['V'],
        notes: '551cals'
      },
      {
        name: 'BERRY PANCAKES',
        description: 'pancakes topped with mixed berries and greek yoghurt, drizzled with berry coulis and sprinkled with shredded coconut.',
        prices: [{ amount: 10.95 }],
        tags: ['V'],
        notes: '380cals'
      },
      {
        name: 'MATCHA PANCAKES',
        description: 'matcha pancakes topped with raspberries, strawberries white chocolate, greek yoghurt and dusted with matcha powder.',
        prices: [{ amount: 10.95 }],
        tags: ['V'],
        notes: '477cals'
      }
    ]
  },
  {
    id: 'extra-toppings',
    title: 'EXTRA TOPPINGS',
    theme: 'pink',
    items: [
      {
        name: 'FRUITS',
        description: 'Banana, Strawberries, Blueberries, Kiwi, Mango, Passionfruit, Raspberries, Apple',
        prices: [{ amount: 1.00 }],
        notes: '£1 FOR FRUIT'
      },
      {
        name: 'SEEDS & NUTS',
        description: 'Chia Seeds, Flax Seeds, Sunflower Seeds, Almonds, Cashew Nuts, Granola, 70% Cacao Nibs, Coconut Flakes, Choc Chips',
        prices: [{ amount: 0.50 }],
        notes: '50P FOR SEEDS'
      },
      {
        name: 'SAUCES & SPREADS',
        description: 'Almond Butter, Peanut Butter, Chocolate Hazelnut Butter, Honey, Maple Syrup, Agave Nectar, Biscoff Sauce, White Chocolate Sauce',
        prices: [{ amount: 0.50 }],
        notes: '50P FOR SAUCES'
      }
    ]
  },

  // Page 2 (Peach & Green Themes)
  {
    id: 'bowls',
    title: 'ANOTHER BOWL',
    theme: 'peach',
    items: [
      {
        name: 'Açaí',
        description: 'frozen açaí topped with granola, 2 fruit toppings of your choice, and any seeds, nut butter or syrup of your choice (see bottom of page for options).',
        prices: [{ label: 'R', amount: 8.75 }, { label: 'L', amount: 10.25 }],
        tags: ['V'],
        notes: '530cals'
      },
      {
        name: 'CHOCOLATE BANANA BOWL',
        description: 'banana, avocado, cacao powder, chocolate soya, maca powder, topped with chocolate granola, bananas, chia seeds & chocolate hazelnut butter.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '563cals'
      },
      {
        name: 'STRAWBERRY MANGO BOWL',
        description: 'mango, strawberry & coconut milk, topped with granola, mango, kiwi & chia seeds.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '311cals'
      },
      {
        name: 'PINEAPPLE BOWL',
        description: 'pineapple, mango & coconut milk, topped with passionfruit, mixed berries & chia seeds.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['VE'],
        notes: '191cals'
      },
      {
        name: 'SUPERFOOD BOWL',
        description: 'spinach, banana, pineapple, avocado & honey, topped with banana, blueberries, kiwi, mango & coconut shavings.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '464cals'
      },
      {
        name: 'SUNRISE BOWL',
        description: 'mango, bananas, coconut milk, coconut water, agave, topped with chia seeds, strawberries, raspberries and blueberries, and drizzled with berry syrup',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['VE'],
        notes: '486cals'
      },
      {
        name: 'STRAWBERRIES & CREAM',
        description: 'banana, strawberries, vanilla, coconut milk, strawberry syrup & coconut cream drizzled around the bowl, topped with granola, strawberries, blueberries & coconut flakes.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '431cals'
      },
      {
        name: 'PB BOWL',
        description: 'banana, cacao, peanut butter, almond milk & ice, topped with banana, blueberries cacao nibs, granola & peanut butter.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '589cals'
      },
      {
        name: 'BISCOFF BOWL',
        description: 'banana, biscoff, cacao powder, maca powder, chocolate soya milk topped with chocolate granola, strawberries, crushed biscoff pieces, chia seeds, biscoff spread & chocolate sauce',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '597cals'
      },
      {
        name: 'YOGHURT BOWL',
        description: 'greek yoghurt topped with granola, 2 fruit toppings of your choice, any seeds, nut butter or syrup of your choice.',
        prices: [{ label: 'R', amount: 8.25 }, { label: 'L', amount: 9.75 }],
        tags: ['V'],
        notes: '421cals'
      }
    ]
  },
  {
    id: 'smoothies',
    title: 'ANOTHER SMOOTHIE',
    theme: 'peach',
    items: [
      {
        name: 'Açaí',
        description: 'frozen açaí, banana, mixed berries & coconut milk, topped with blueberries, raspberries & chia seeds.',
        prices: [{ amount: 6.95 }],
        tags: ['VE'],
        notes: '297cals'
      },
      {
        name: 'BREAKFAST SMOOTHIE',
        description: 'oats, bananas, peanut butter, agave, cinnamon & oat milk',
        prices: [{ amount: 6.50 }],
        tags: ['V'],
        notes: '365cals'
      },
      {
        name: 'SAHARA DESERT',
        description: 'mango, bananas, coconut milk, coconut water, agave with berry syrup drizzled around the cup.',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '386cals'
      },
      {
        name: 'BANANARAMA',
        description: 'banana, mango, chocolate soya with chocolate hazelnut butter & peanut butter drizzled around the cup, topped with cacao nibs (optional espresso shot).',
        prices: [{ amount: 6.50 }],
        tags: ['V'],
        notes: '587cals'
      },
      {
        name: 'PB LEGEND',
        description: 'banana, peanut butter, cacao powder, chocolate soya & ice, with a lined cup of peanut butter & chocolate',
        prices: [{ amount: 6.50 }],
        tags: ['V'],
        notes: '493cals'
      },
      {
        name: 'BLUE MOOD',
        description: 'blueberries, almond butter, banana, almond milk & coconut cream',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '298cals'
      },
      {
        name: 'SUPERGREEN',
        description: 'spinach, banana, avocado, mango & coconut milk (add ginger free of charge), topped with chia seeds.',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '293cals'
      },
      {
        name: 'EXOTIC',
        description: 'mango, pineapple, passionfruit syrup, coconut water & coconut cream, topped with shaved coconut pieces',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '300cals'
      },
      {
        name: 'WAVEY BABY',
        description: 'mango, pineapple, banana, coconut milk & coconut cream, topped with blueberries & shaved coconut flakes.',
        prices: [{ amount: 6.50 }],
        tags: ['V'],
        notes: '348cals'
      },
      {
        name: 'MANGO & STRAWBERRY',
        description: 'mango, strawberry, honey & coconut milk, topped with passionfruit, strawberries, chia seeds & orange slice.',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '190cals'
      },
      {
        name: 'SUNBURST SMOOTHIE',
        description: 'raspberry, pineapple, peach, mango juice & coconut water smoothie.',
        prices: [{ amount: 6.50 }],
        tags: ['VE'],
        notes: '282cals'
      },
      {
        name: 'CREATE YOUR OWN',
        description: '1. choose your milk or juice base. We recommend coconut or almond milk for the perfect texture. 2. choose up to 2 fruits for your base. 3. choose a sauce or extra.',
        prices: [{ amount: 6.50 }]
      }
    ]
  },
  {
    id: 'another-matcha',
    title: 'ANOTHER MATCHA',
    theme: 'green',
    items: [
      {
        name: 'VANILLA MATCHA',
        prices: [{ amount: 4.00 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'STRAWBERRY, MANGO JUICE & MATCHA',
        prices: [{ amount: 4.00 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'MATCHA FRUIT TWIST',
        prices: [{ amount: 4.00 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'BLUEBERRY MATCHA',
        prices: [{ amount: 4.00 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'WHITE CHOCOLATE MATCHA',
        prices: [{ amount: 4.00 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'WHITE CHOCOLATE & RASPBERRY',
        prices: [{ amount: 4.95 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'PISTACHIO & CHOCOLATE MATCHA',
        description: 'pistachio, matcha, chocolate & strawberry cold foam, dusting of chocolate',
        prices: [{ amount: 4.95 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'BANOFFEE PIE MATCHA',
        description: 'banana, matcha, banana cold foam, dusting of chocolate',
        prices: [{ amount: 4.95 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'RASPBERRY RIPPLE MATCHA',
        description: 'raspberry, vanilla, matcha & raspberry cold foam',
        prices: [{ amount: 4.95 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'EXOTIC MATCHA',
        description: 'passionfruit, matcha & mango cold foam',
        prices: [{ amount: 4.95 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      }
    ]
  },
  {
    id: 'another-sip',
    title: 'ANOTHER SIP',
    theme: 'green',
    items: [
      {
        name: 'PASSIONFRUIT LEMONADE',
        prices: [{ amount: 4.50 }]
      },
      {
        name: 'PINEAPPLE & AGAVE LEMONADE',
        prices: [{ amount: 4.50 }]
      },
      {
        name: 'RASPBERRY & LEMON COOLER',
        prices: [{ amount: 4.50 }]
      },
      {
        name: 'PINA-COOLER',
        prices: [{ amount: 4.25 }]
      },
      {
        name: 'PEACH ICED TEA',
        prices: [{ amount: 4.25 }]
      },
      {
        name: 'PEACH & PASSIONFRUIT ICED TEA',
        prices: [{ amount: 4.25 }]
      },
      {
        name: 'TROPICAL ICED TEA',
        prices: [{ amount: 4.25 }]
      },
      {
        name: 'BERRY ICED TEA',
        prices: [{ amount: 4.25 }]
      },
      {
        name: 'PINEAPPLE & MANGO JUICE',
        prices: [{ amount: 3.95 }]
      },
      {
        name: 'FRESHLY SQUEEZED ORANGE JUICE',
        prices: [{ amount: 3.95 }]
      }
    ]
  },
  {
    id: 'another-coffee',
    title: 'ANOTHER COFFEE',
    theme: 'green',
    items: [
      {
        name: 'ICED WHITE MOCHA',
        prices: [{ amount: 4.25 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'MIDNIGHT CITRUS MOCHA',
        description: 'raspberry & orange syrup, espresso & choc sauce with dried orange',
        prices: [{ amount: 4.25 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'BANANA MOCHA BLISS',
        description: 'banana syrup, espresso, choc sauce topped with dried bananas',
        prices: [{ amount: 4.25 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'CRUNCH & CREAM LATTE',
        description: 'caramel, espresso with biscoff',
        prices: [{ amount: 4.25 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      },
      {
        name: 'BLUSH & BREW',
        description: 'strawberry syrup, espresso & dried strawberry',
        prices: [{ amount: 4.25 }],
        notes: 'Served with milk of choice. Want some extra flavour? add a flavoured dairy cold foam or syrup to your matcha or coffee for £1. See drinks page for additional syrups & flavours.'
      }
    ]
  },

  // Page 4 (Beige Theme)
  {
    id: 'coffee',
    title: 'COFFEE (ICED / HOT)',
    theme: 'beige',
    items: [
      {
        name: 'ESPRESSO',
        prices: [{ amount: 2.75 }]
      },
      {
        name: 'LATTE',
        prices: [{ amount: 3.25 }]
      },
      {
        name: 'CAPPUCINO',
        prices: [{ amount: 3.25 }]
      },
      {
        name: 'AMERICANO',
        prices: [{ amount: 3.25 }]
      },
      {
        name: 'MOCHA',
        prices: [{ amount: 3.50 }]
      },
      {
        name: 'MATCHA LATTE',
        prices: [{ amount: 4.00 }]
      },
      {
        name: 'TEA / HERBAL TEA',
        prices: [{ amount: 2.75 }]
      }
    ]
  },
  {
    id: 'extra-flavours',
    title: 'EXTRA FLAVOURS',
    theme: 'beige',
    items: [
      {
        name: 'FLAVOURED SYRUPS & COLD FOAMS',
        description: 'additional syrups, cold foams & flavours for coffees. any syrups from this list can be dairy cold foams.',
        prices: [{ amount: 1.00 }],
        notes: 'EXTRAS ARE AT AN ADDITIONAL CHARGE, £1 FOR SYRUPS & ADDITIONAL FLAVOURS. SEASONAL SYRUPS SUBJECT TO AVAILABILITY.'
      },
      {
        name: 'AVAILABLE FLAVOURS',
        description: 'Vanilla, Caramel, Hazelnut, Chai, Biscoff, Belgium Choc, White Chocolate, Pistachio, Banana, Raspberry, Strawberry, Blueberry, Nutella, PB, Biscoff, Honey, Agave, Maple Syrup',
        prices: [{ amount: 1.00 }]
      }
    ]
  },
  {
    id: 'shots',
    title: 'SHOTS',
    theme: 'beige',
    items: [
      {
        name: 'HONEY, LEMON & GINGER SHOT',
        description: '60ml shot',
        prices: [{ amount: 2.50 }]
      },
      {
        name: 'ORANGE, GINGER, TURMERIC & HONEY SHOT',
        description: '60ml shot',
        prices: [{ amount: 2.50 }]
      }
    ]
  }
];

// Utility function to format prices consistently
export const formatPrice = (price: Price): string => {
  if (price.label) {
    return `${price.label} £${price.amount.toFixed(2)}`;
  }
  return `£${price.amount.toFixed(2)}`;
};

// Get category by ID
export const getCategoryById = (id: string): MenuCategory | undefined => {
  return MENU.find(category => category.id === id);
};

// Get all categories
export const getAllCategories = (): MenuCategory[] => {
  return MENU;
};
