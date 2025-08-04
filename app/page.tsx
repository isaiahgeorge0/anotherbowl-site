'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AboutSection from './components/AboutSection';
import MenuSection from './components/MenuSection';
import BlogSection from './components/BlogSection';

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
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image src="/logo.png" alt="Another Bowl Logo" width={40} height={40} />
            <h1 className="text-xl font-extrabold tracking-widest uppercase">Another Bowl</h1>
          </motion.div>
        </Link>
      </header>

      {/* Hero Section */}
      <motion.section
        className="flex flex-col gap-4 px-4 py-10 text-center sm:px-8 md:flex-row md:justify-center"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        {['healthy-food', 'bowl', 'juice'].map((query, i) => (
          <motion.div
            key={i}
            className="overflow-hidden rounded-xl shadow-md"
            variants={heroVariants}
          >
            <Image
              src={`https://source.unsplash.com/featured/?${query}`}
              alt={`Hero ${i + 1}`}
              width={300}
              height={200}
              className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </motion.div>
        ))}
      </motion.section>

      {/* Description */}
      <section className="max-w-xl px-4 pb-6 mx-auto text-center">
        <p className="text-lg md:text-xl">
          Fresh food. Clean energy. Weekly run club. Made in Ipswich.
        </p>
      </section>

      {/* CTA Buttons */}
      <section className="flex flex-col items-center justify-center gap-4 px-4 pb-12 sm:flex-row">
        <button
          onClick={() => toggleSection('about')}
          className="rounded-md border border-primary px-6 py-2 font-medium transition-all duration-300 hover:bg-primary hover:text-white"
        >
          About Us
        </button>
        <button
          onClick={() => toggleSection('menu')}
          className="rounded-md border border-primary px-6 py-2 font-medium transition-all duration-300 hover:bg-primary hover:text-white"
        >
          Menu
        </button>
        <button
          onClick={() => toggleSection('blog')}
          className="rounded-md border border-primary px-6 py-2 font-medium transition-all duration-300 hover:bg-primary hover:text-white"
        >
          Blog
        </button>
      </section>

      {/* Dropdown Content */}
      <div className="px-6 pb-16">
        {activeSection === 'about' && <AboutSection />}
        {activeSection === 'menu' && <MenuSection />}
        {activeSection === 'blog' && <BlogSection />}
      </div>
    </div>
  );
}
