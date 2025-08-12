'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MENU } from '../data/menu';

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
    return `#${categoryId}`;
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
        return 'bg-slate-400';
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
        className="px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:text-slate-700 hover:underline hover:underline-offset-4 hover:decoration-[var(--brand-green)] text-slate-900 flex items-center gap-1 group"
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
            className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-4">
              {groupedCategories.map((group, groupIndex) => (
                <div key={groupIndex} className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-slate-100' : ''}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={getCategoryHash(category.id)}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-lg text-left text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-200 group/item"
                        role="menuitem"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getThemeColor(category.theme)}`} />
                        <span className="truncate group-hover/item:text-slate-900">
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
