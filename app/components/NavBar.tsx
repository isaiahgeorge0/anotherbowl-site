'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DesktopMenuDropdown from './DesktopMenuDropdown';

export default function NavBar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get active link based on current pathname
  const getActiveLink = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-lg border-b border-brandPink/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <Image 
                src="/images/another-bowl-logo.jpeg" 
                alt="Another Bowl Logo" 
                width={48} 
                height={48} 
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md" 
              />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900">
              Another Bowl
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/about"
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:underline hover:underline-offset-4 hover:decoration-[var(--brand-pink)] ${getActiveLink('/about') ? 'bg-[var(--brand-pink)]/15 text-slate-900 ring-1 ring-[var(--brand-pink)]/40' : 'text-slate-900 hover:text-slate-700'}`}
            >
              About
            </Link>

            {/* Menu Dropdown */}
            <DesktopMenuDropdown />

            <Link
              href="/blog"
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:underline hover:underline-offset-4 hover:decoration-[var(--brand-green)] ${getActiveLink('/blog') ? 'bg-[var(--brand-green)]/15 text-slate-900 ring-1 ring-[var(--brand-green)]/40' : 'text-slate-900 hover:text-slate-700'}`}
            >
              Blog
            </Link>

            <Link
              href="/run-club"
              className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:underline hover:underline-offset-4 hover:decoration-[var(--brand-pink)] ${getActiveLink('/run-club') ? 'bg-[var(--brand-pink)]/15 text-slate-900 ring-1 ring-[var(--brand-pink)]/40' : 'text-slate-900 hover:text-slate-700'}`}
            >
              Run Club
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-white border-t border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              {[
                { id: 'about', label: 'About Us', icon: '👥', href: '/about' },
                { id: 'menu', label: 'Menu', icon: '🥗', href: '/menu' },
                { id: 'blog', label: 'Blog', icon: '📝', href: '/blog' },
                { id: 'run-club', label: 'Run Club', icon: '🏃‍♀️', href: '/run-club' }
              ].map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-200 font-medium flex items-center gap-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
