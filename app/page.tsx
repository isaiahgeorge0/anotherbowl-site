'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AboutSection from './components/AboutSection';
import MenuSection from './components/MenuSection';
import BlogSection from './components/BlogSection';
import RunClubSection from './components/RunClubSection';
import Footer from './components/Footer';

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  const scrollToExplore = (section?: string) => {
    if (section === 'menu') {
      // Scroll directly to menu section
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Scroll to explore section and open dropdown
      const exploreSection = document.getElementById('explore-section');
      if (exploreSection) {
        exploreSection.scrollIntoView({ behavior: 'smooth' });
        if (section) {
          setTimeout(() => {
            setActiveSection(section);
          }, 500); // Wait for scroll to complete
        }
      }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: 50 } as const,
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' as const, staggerChildren: 0.3 },
    },
  };

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      {/* Enhanced Sticky Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 bg-white/90 backdrop-blur-md shadow-lg border-b border-brandPink/10">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Image 
              src="/images/another-bowl-logo.jpeg" 
              alt="Another Bowl Logo" 
              width={48} 
              height={48} 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md" 
            />
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-gray-900">
              Another Bowl
            </h1>
          </motion.div>
        </Link>

        {/* Menu Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="relative">
            <button
              onClick={() => scrollToExplore('menu')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary transition-colors duration-200 font-medium"
              aria-label="Open menu"
            >
              <span className="text-sm sm:text-base">Menu</span>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              whileHover={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="py-2">
                {[
                  { id: 'about', label: 'About Us', icon: '👥' },
                  { id: 'menu', label: 'Menu', icon: '🥗' },
                  { id: 'blog', label: 'Blog', icon: '📝' },
                  { id: 'runclub', label: 'Run Club', icon: '🏃‍♀️' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToExplore(item.id)}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors duration-200 flex items-center gap-3"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* Dynamic Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden hero-stable">
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
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center mb-12">
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
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-12"
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
                  className="h-64 sm:h-80 w-full object-cover hero-image-stable"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Explore Our World Menu - Now Inside Hero */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 mb-16">
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
            {[
              { id: 'about', label: 'About Us', icon: '👥' },
              { id: 'menu', label: 'Menu', icon: '🥗' },
              { id: 'blog', label: 'Blog', icon: '📝' },
              { id: 'runclub', label: 'Run Club', icon: '🏃‍♀️' }
            ].map((button, index) => (
              <motion.button
                key={button.id}
                onClick={() => toggleSection(button.id)}
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
                className={`relative overflow-hidden rounded-xl px-6 py-4 font-black transition-all duration-200 ease-out text-sm sm:text-base cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  activeSection === button.id 
                    ? 'bg-brandPink text-white shadow-xl ring-2 ring-brandPink/50 ring-offset-2 ring-offset-white/80' 
                    : 'explore-card'
                }`}
                aria-label={`${button.label} - Click to explore ${button.label.toLowerCase()}`}
                role="button"
                tabIndex={0}
              >
                <span className="text-lg sm:text-xl mb-2 block">{button.icon}</span>
                {button.label}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-brandPink/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bottom Fade Overlay - Natural fade using page background colors */}
        <div className="absolute bottom-0 left-0 right-0 h-48 hero-fade-gradient pointer-events-none z-0" />
      </section>






      {/* Dropdown Content with Smooth Animations */}
      <motion.div 
        className="px-6 sm:px-8 pb-16 sm:pb-24 -mt-8 pt-16 bg-gradient-to-b from-white/80 to-light/50 section-seamless"
        initial={false}
        animate={{ 
          height: activeSection ? 'auto' : 0,
          opacity: activeSection ? 1 : 0
        }}
        transition={{ 
          duration: 0.4, 
          ease: 'easeInOut',
          height: { duration: 0.3 }
        }}
        style={{ overflow: 'hidden' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: activeSection ? 1 : 0,
            y: activeSection ? 0 : -20
          }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {activeSection === 'about' && <AboutSection />}
          {activeSection === 'blog' && <BlogSection />}
          {activeSection === 'runclub' && <RunClubSection />}
        </motion.div>
      </motion.div>

      {/* Menu Section - Standalone with gradient blend */}
      <section id="menu" className="relative">
        {/* Blend hero → menu to remove the hard line */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white" />
        <MenuSection />
      </section>

      {/* Instagram Feed Section */}
      <section className="py-16 sm:py-24 px-6 sm:px-8 bg-white -mt-24 pt-40 relative section-seamless">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Follow Our Journey
            </h2>
            <p className="text-lg text-gray-600">
              See what's happening at Another Bowl
            </p>
          </motion.div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
             {[
               '/images/another-bowl-1.jpeg',
               '/images/another-bowl-2.jpeg', 
               '/images/another-bowl-3.jpeg',
               '/images/another-bowl-4.jpeg'
             ].map((image, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5, delay: index * 0.1 }}
                 whileHover={{ scale: 1.05 }}
                 className="relative overflow-hidden rounded-xl shadow-lg"
               >
                 <Image
                   src={image}
                   alt="Instagram feed"
                   width={300}
                   height={300}
                   className="w-full h-48 sm:h-64 object-cover"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
               </motion.div>
             ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Link 
              href="https://instagram.com/another.bowl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Another Bowl on Instagram"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandPink/40"
            >
              <svg className="w-6 h-6 text-brandPink" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="font-black text-lg instagram-gradient-text">
                Follow on Instagram
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
