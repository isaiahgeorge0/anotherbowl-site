'use client';

import { useState, useRef } from 'react';
import { MENU, formatPrice, type MenuCategory, type MenuItem } from '../data/menu';

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState<string>(MENU[0].id);
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, categoryId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCategoryChange(categoryId);
    }
  };

  const currentCategory = MENU.find(cat => cat.id === activeCategory)!;

  // Get theme-based background class
  const getThemeBackground = (theme?: string) => {
    switch (theme) {
      case 'pink':
        return 'from-[var(--brand-pink-hex)]/10 to-white';
      case 'peach':
        return 'from-orange-200/10 to-white';
      case 'green':
        return 'from-[var(--brand-green-hex)]/10 to-white';
      case 'beige':
        return 'from-stone-100 to-white';
      default:
        return 'from-white to-white';
    }
  };

  return (
    <section className="py-12 sm:py-16 px-6 sm:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            Our Menu
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Fresh, nutritious food made with love. From hearty mains to refreshing drinks.
          </p>
        </div>

        {/* Sticky Tab Bar */}
        <div
          ref={tabListRef}
          className="sticky top-[var(--menu-sticky-top,64px)] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 mb-8"
          role="tablist"
          aria-label="Menu categories"
        >
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scrollbar-gutter-stable">
            {MENU.map((category) => (
              <button
                key={category.id}
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-controls={`panel-${category.id}`}
                data-testid={`tab-${category.id}`}
                onClick={() => handleCategoryChange(category.id)}
                onKeyDown={(e) => handleKeyDown(e, category.id)}
                className={`
                  flex-shrink-0 px-6 py-4 font-semibold text-sm sm:text-base transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-pink-hex)]
                  snap-start
                  ${activeCategory === category.id
                    ? 'text-slate-900 border-b-2 border-[var(--brand-pink-hex)]'
                    : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-gray-300'
                  }
                `}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Panel */}
        <div
          role="tabpanel"
          id={`panel-${activeCategory}`}
          aria-labelledby={`tab-${activeCategory}`}
          className="relative"
        >
          {/* Category ID for scroll targeting */}
          <div id={currentCategory.id} className="scroll-mt-24 lg:scroll-mt-32" />
          {/* Themed Background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${getThemeBackground(currentCategory.theme)} pointer-events-none`} />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Category Title */}
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {currentCategory.title}
              </h3>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentCategory.items.map((item, index) => (
                <div
                  key={`${currentCategory.id}-${index}`}
                  data-testid={`menu-item-${currentCategory.id}-${index}`}
                  className="menu-item-card bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-[var(--brand-pink-hex)] transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--brand-pink-hex)] focus-within:ring-offset-2"
                >
                  {/* Item Header with Name and Prices */}
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 text-lg leading-tight flex-1 pr-4">
                      {item.name}
                    </h4>
                    <div className="flex flex-col items-end flex-shrink-0">
                      {item.prices.map((price, priceIndex) => (
                        <span key={priceIndex} className="font-bold text-slate-900 text-lg">
                          {formatPrice(price)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-slate-600 text-sm mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${tag === 'V' ? 'bg-green-100 text-green-800' : ''}
                            ${tag === 'VE' ? 'bg-emerald-100 text-emerald-800' : ''}
                            ${tag === 'GF' ? 'bg-blue-100 text-blue-800' : ''}
                            ${tag === 'N' ? 'bg-orange-100 text-orange-800' : ''}
                          `}
                        >
                          {tag === 'V' && 'Vegetarian'}
                          {tag === 'VE' && 'Vegan'}
                          {tag === 'GF' && 'Gluten Free'}
                          {tag === 'N' && 'Contains Nuts'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {currentCategory.items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">
                  No items found in this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
