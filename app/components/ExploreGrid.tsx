'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ExploreGrid() {
  const exploreItems = [
    { id: 'about', label: 'About Us', icon: '👥', href: '#about' },
    { id: 'menu', label: 'Menu', icon: '🥗', href: '#menu' },
    { id: 'blog', label: 'Blog', icon: '📝', href: '#blog' },
    { id: 'run-club', label: 'Run Club', icon: '🏃‍♀️', href: '#run-club' }
  ];

  return (
    <section className="relative -mt-24 pt-24 pb-16 bg-gradient-to-b from-transparent to-white">
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 sm:px-8">
        {/* Subtle Brand Glow Behind Cards */}
        <div className="absolute inset-0 -z-10 flex justify-center items-center">
          <div className="w-96 h-32 bg-gradient-radial from-brandPink/8 via-brandGreen/5 to-transparent rounded-full blur-xl" />
        </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 drop-shadow-lg">
          Explore Our World
        </h3>
        <p className="text-white/90 font-medium drop-shadow-md">
          Discover what makes Another Bowl special
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {exploreItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              scale: { type: "spring", stiffness: 300, damping: 20 }
            }}
            whileHover={{ 
              scale: 1.01,
              y: -2,
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1)"
            }}
            whileTap={{ scale: 0.98, y: 0 }}
            whileFocus={{ scale: 1.005, y: -1 }}
          >
            <Link
              href={item.href}
              className="block relative overflow-hidden rounded-xl px-6 py-4 font-black transition-all duration-200 ease-out text-sm sm:text-base cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 explore-card"
              aria-label={`${item.label} - Click to explore ${item.label.toLowerCase()}`}
            >
              <span className="text-lg sm:text-xl mb-2 block">{item.icon}</span>
              {item.label}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brandPink/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
            </Link>
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
}
