'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero({ toggleSection }: { toggleSection: (section: string) => void }) {
  return (
    <section className="relative min-h-[540px] lg:min-h-[680px] flex flex-col items-center justify-center overflow-hidden hero-stable scroll-mt-20 md:scroll-mt-24">
      {/* Branded Background */}
      <div className="absolute inset-0 section-brand-gradient" />
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-light to-mint/20">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, #FF3E86 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C8F6BA 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Dark Overlay for Better Contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center mb-12 pt-8 sm:pt-12 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">
            Fresh Food.
            <br />
            <span className="text-primary">Clean Energy.</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-md">
            Weekly run club. Made in Ipswich.
          </p>
        </motion.div>

        {/* Hero Images Grid */}
        <motion.div
          className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-4xl mx-auto mb-12 mt-3 sm:mt-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {[
            { src: '/images/another-bowl-1.jpeg', alt: 'Fresh healthy bowls' },
            { src: '/images/another-bowl-2.jpeg', alt: 'Nutritious smoothies' },
            { src: '/images/another-bowl-3.jpeg', alt: 'Fresh ingredients' }
          ].map((image, i) => (
            <motion.div
              key={i}
              className="relative overflow-hidden rounded-2xl shadow-2xl"
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={400}
                height={300}
                className="w-full h-auto max-w-[320px] object-cover hero-image-stable"
                priority={i === 0}
                sizes="(max-width: 640px) 28vw, (max-width: 768px) 30vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          ))}
        </motion.div>

        {/* Explore Our World Section - Integrated into Hero */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 sm:px-8 mb-16">
          {/* Subtle Brand Glow Behind Cards */}
          <div className="absolute inset-0 -z-10 flex justify-center items-center">
            <div className="w-96 h-32 bg-gradient-radial from-brandPink/8 via-brandGreen/5 to-transparent rounded-full blur-xl" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Explore Our World
            </h2>
            <p className="text-lg text-white/80">
              Discover what makes Another Bowl special
            </p>
          </motion.div>

          {/* Explore Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {[
              { id: 'about', label: 'About Us', icon: '👥' },
              { id: 'menu', label: 'Our Menu', icon: '🥗' },
              { id: 'blog', label: 'Blog', icon: '📝' },
              { id: 'run-club', label: 'Run Club', icon: '🏃‍♀️' }
            ].map((item, index) => (
              <motion.div
                key={item.id}
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.005, y: -1 }}
              >
                <button
                  onClick={() => {
                    if (item.id === 'menu') {
                      // Scroll to menu section instead of opening dropdown
                      document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      toggleSection(item.id);
                    }
                  }}
                  className="block relative overflow-hidden rounded-xl px-6 py-4 font-bold transition-all duration-300 ease-out text-sm sm:text-base cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:text-white hover:bg-white/30 hover:border-white/50 group"
                  aria-label={`${item.label} - Click to explore ${item.label.toLowerCase()}`}
                >
                  <span className="text-lg sm:text-xl mb-2 block group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade Overlay - Natural fade using page background colors */}
      <div className="absolute bottom-0 left-0 right-0 h-48 hero-fade-gradient pointer-events-none z-10" />
    </section>
  );
}
