'use client';

import { useState, useEffect, useRef } from 'react';
import { MENU, type MenuCategory, type MenuItem } from '../data/menu';

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory['key']>('mains');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  // URL sync
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') as MenuCategory['key'];
    const sub = urlParams.get('sub');
    
    if (category && MENU.find(cat => cat.key === category)) {
      setActiveCategory(category);
    }
    if (sub) {
      setActiveSubcategory(sub);
    }
  }, []);

  const updateURL = (category: string, sub?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    if (sub) {
      url.searchParams.set('sub', sub);
    } else {
      url.searchParams.delete('sub');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleCategoryChange = (category: MenuCategory['key']) => {
    setActiveCategory(category);
    setActiveSubcategory(null);
    updateURL(category);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
    updateURL(activeCategory, subcategory);
  };

  const handleKeyDown = (event: React.KeyboardEvent, category: MenuCategory['key']) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryChange(category);
    }
  };

  const currentCategory = MENU.find(cat => cat.key === activeCategory)!;
  const filteredItems = activeSubcategory 
    ? currentCategory.items.filter(item => item.subcategory === activeSubcategory)
    : currentCategory.items;

  return (
    <section className="py-12 sm:py-16 px-6 sm:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Our Menu
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fresh, nutritious food made with love. From hearty mains to refreshing drinks.
          </p>
        </div>

        {/* Primary Tabs */}
        <div 
          ref={tabListRef}
          className="sticky top-[var(--menu-sticky-top,64px)] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 mb-8"
          role="tablist"
          aria-label="Menu categories"
        >
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scrollbar-gutter-stable">
            {MENU.map((category) => (
              <button
                key={category.key}
                role="tab"
                aria-selected={activeCategory === category.key}
                aria-controls={`panel-${category.key}`}
                data-testid={`tab-${category.key}`}
                onClick={() => handleCategoryChange(category.key)}
                onKeyDown={(e) => handleKeyDown(e, category.key)}
                className={`
                  flex-shrink-0 px-6 py-4 font-semibold text-sm sm:text-base transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-pink-hex)]
                  snap-start
                  ${activeCategory === category.key 
                    ? 'menu-tab-active border-b-2 border-transparent bg-gradient-to-r from-[var(--brand-pink-hex)] to-[var(--brand-green-hex)] bg-clip-border' 
                    : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-pills for categories that have them */}
        {currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleSubcategoryChange('')}
                className={`
                  px-4 py-2 text-sm font-medium rounded-full transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-pink-hex)]
                  ${!activeSubcategory 
                    ? 'bg-[var(--brand-pink-hex)] text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                All {currentCategory.label}
              </button>
              {currentCategory.subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => handleSubcategoryChange(sub)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-full transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-pink-hex)]
                    ${activeSubcategory === sub 
                      ? 'bg-[var(--brand-green-hex)] text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div 
          role="tabpanel"
          id={`panel-${activeCategory}`}
          aria-labelledby={`tab-${activeCategory}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              data-testid={`menu-item-${item.id}`}
              className="menu-item-card bg-white rounded-xl shadow-sm p-6 focus-within:ring-2 focus-within:ring-[var(--brand-pink-hex)] focus-within:ring-offset-2"
            >
              {/* Item Header with Name and Price */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1 pr-4">
                  {item.name}
                </h3>
                <span className="font-bold text-[var(--brand-ink)] text-lg flex-shrink-0">
                  {item.price}
                </span>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Dietary Flags */}
              {item.flags && item.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.flags.map((flag) => (
                    <span
                      key={flag}
                      className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${flag === 'V' ? 'bg-green-100 text-green-800' : ''}
                        ${flag === 'VG' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${flag === 'GF' ? 'bg-blue-100 text-blue-800' : ''}
                        ${flag === 'N' ? 'bg-orange-100 text-orange-800' : ''}
                      `}
                    >
                      {flag === 'V' && 'Vegetarian'}
                      {flag === 'VG' && 'Vegan'}
                      {flag === 'GF' && 'Gluten Free'}
                      {flag === 'N' && 'Contains Nuts'}
                    </span>
                  ))}
                </div>
              )}

              {/* Subcategory Badge */}
              {item.subcategory && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    {item.subcategory}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No items found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
