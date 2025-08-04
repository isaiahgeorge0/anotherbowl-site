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

  const heroVariants = {
    hidden: { opacity: 0, y: 50 } as const,
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' as const, staggerChildren: 0.3 },
    },
  };

  return (
    <div className="min-h-screen scroll-smooth bg-light text-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-md">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image src="/images/another-bowl-logo.jpeg" alt="Another Bowl Logo" width={32} height={32} className="sm:w-10 sm:h-10" />
            <h1 className="text-lg sm:text-xl font-extrabold tracking-widest uppercase">Another Bowl</h1>
          </motion.div>
        </Link>
      </header>

      {/* Hero Section */}
      <motion.section
        className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 py-8 sm:py-10 text-center md:flex-row md:justify-center"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        {[
          { src: '/images/another-bowl-1.jpeg', alt: 'Fresh healthy bowls' },
          { src: '/images/another-bowl-2.jpeg', alt: 'Nutritious smoothies' },
          { src: '/images/another-bowl-3.jpeg', alt: 'Fresh ingredients' }
        ].map((image, i) => (
          <motion.div
            key={i}
            className="overflow-hidden rounded-lg sm:rounded-xl shadow-md"
            variants={heroVariants}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={300}
              height={200}
              className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </motion.div>
        ))}
      </motion.section>

      {/* Description */}
      <section className="max-w-xl px-3 sm:px-4 pb-6 mx-auto text-center">
        <p className="text-base sm:text-lg md:text-xl">
          Fresh food. Clean energy. Weekly run club. Made in Ipswich.
        </p>
      </section>

      {/* CTA Buttons */}
      <section className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 pb-6 sm:pb-8 sm:flex-row">
        <button
          onClick={() => toggleSection('about')}
          className={`rounded-md border px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
            activeSection === 'about' 
              ? 'bg-primary text-white border-primary shadow-lg' 
              : 'border-primary text-primary hover:bg-primary hover:text-white'
          }`}
        >
          About Us
        </button>
        <button
          onClick={() => toggleSection('menu')}
          className={`rounded-md border px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
            activeSection === 'menu' 
              ? 'bg-primary text-white border-primary shadow-lg' 
              : 'border-primary text-primary hover:bg-primary hover:text-white'
          }`}
        >
          Menu
        </button>
        <button
          onClick={() => toggleSection('blog')}
          className={`rounded-md border px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
            activeSection === 'blog' 
              ? 'bg-primary text-white border-primary shadow-lg' 
              : 'border-primary text-primary hover:bg-primary hover:text-white'
          }`}
        >
          Blog
        </button>
        <button
          onClick={() => toggleSection('runclub')}
          className={`rounded-md border px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
            activeSection === 'runclub' 
              ? 'bg-primary text-white border-primary shadow-lg' 
              : 'border-primary text-primary hover:bg-primary hover:text-white'
          }`}
        >
          Run Club
        </button>
      </section>

      {/* Dropdown Content with Smooth Animations */}
      <motion.div 
        className="px-3 sm:px-6 pb-12 sm:pb-16"
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
          {activeSection === 'menu' && <MenuSection />}
          {activeSection === 'blog' && <BlogSection />}
          {activeSection === 'runclub' && <RunClubSection />}
        </motion.div>
      </motion.div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
