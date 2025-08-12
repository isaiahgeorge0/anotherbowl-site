'use client';

import { motion } from 'framer-motion';

export default function ExploreGrid({ toggleSection }: { toggleSection: (section: string) => void }) {
  const exploreItems = [
    { id: 'about', label: 'About Us', icon: '👥' },
    { id: 'menu', label: 'Our Menu', icon: '🥗' },
    { id: 'blog', label: 'Blog', icon: '📝' },
    { id: 'run-club', label: 'Run Club', icon: '🏃‍♀️' }
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
            <button
              onClick={() => toggleSection(item.id)}
              className="block relative overflow-hidden rounded-xl px-6 py-4 font-bold transition-all duration-300 ease-out text-sm sm:text-base cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandPink/50 bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl hover:scale-105 hover:border-brandPink/30 text-slate-800 hover:text-slate-900 group"
              aria-label={`${item.label} - Click to explore ${item.label.toLowerCase()}`}
            >
              <span className="text-lg sm:text-xl mb-2 block group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-brandPink/10 via-brandGreen/5 to-transparent opacity-0 group-hover:opacity-100"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent rounded-xl" />
            </button>
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
}
