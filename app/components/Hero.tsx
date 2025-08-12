'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Hero() {
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
      </div>

      {/* Bottom Fade Overlay - Natural fade using page background colors */}
      <div className="absolute bottom-0 left-0 right-0 h-48 hero-fade-gradient pointer-events-none z-10" />
    </section>
  );
}
