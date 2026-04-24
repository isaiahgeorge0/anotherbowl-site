'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MENU } from '@/data/menu';

export default function DesktopMenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Delay closing to allow moving to dropdown
    setTimeout(() => {
      if (!isHovered) {
        setIsOpen(false);
      }
    }, 100);
  };

  const handleDropdownMouseEnter = () => {
    setIsHovered(true);
  };

  const handleDropdownMouseLeave = () => {
    setIsHovered(false);
    setIsOpen(false);
  };

  const getCategoryHash = (categoryId: string) => {
    return `/menu#${categoryId}`;
  };

  const getThemeColor = (theme?: string) => {
    switch (theme) {
      case 'pink':
        return 'bg-[var(--brand-pink)]';
      case 'peach':
        return 'bg-orange-400';
      case 'green':
        return 'bg-[var(--brand-green)]';
      case 'beige':
        return 'bg-stone-400';
      default:
        return 'bg-stone-400';
    }
  };

  // Group categories by theme for better organization
  const groupedCategories = [
    {
      title: 'Main Menu',
      categories: MENU.slice(0, 5) // First 5 (pink theme)
    },
    {
      title: 'Bowls & Drinks',
      categories: MENU.slice(5, 10) // Next 5 (peach & green themes)
    },
    {
      title: 'Coffee & Extras',
      categories: MENU.slice(10) // Last 5 (beige theme)
    }
  ];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Delay to allow clicking on dropdown items
          setTimeout(() => {
            if (!isHovered) {
              setIsOpen(false);
            }
          }, 100);
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="menu-dropdown"
        className="group flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-stone-900 transition-all duration-200 hover:text-stone-700 hover:underline hover:decoration-[var(--brand-green)] hover:underline-offset-4"
      >
        Our Menu
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            id="menu-dropdown"
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
            className="absolute left-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-stone-200/80 bg-light/95 shadow-lg"
          >
            <div className="p-4">
              {groupedCategories.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={groupIndex > 0 ? 'mt-4 border-t border-stone-200/60 pt-4' : ''}
                >
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={getCategoryHash(category.id)}
                        onClick={() => setIsOpen(false)}
                        className="group/item flex items-center gap-2 rounded-lg p-2 text-left text-sm text-stone-700 transition-colors duration-200 hover:bg-mint/30 hover:text-stone-900"
                        role="menuitem"
                      >
                        <div
                          className={`h-2 w-2 flex-shrink-0 rounded-full ${getThemeColor(category.theme)}`}
                        />
                        <span className="truncate group-hover/item:text-stone-900">
                          {category.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
