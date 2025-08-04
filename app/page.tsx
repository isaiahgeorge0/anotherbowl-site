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
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      {/* Enhanced Sticky Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 bg-white/95 backdrop-blur-sm shadow-lg border-b border-primary/10">
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
            <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-primary">
              Another Bowl
            </h1>
          </motion.div>
        </Link>
      </header>

      {/* Dynamic Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
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

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Fresh Food.
              <br />
              <span className="text-primary">Clean Energy.</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Weekly run club. Made in Ipswich.
            </p>
          </motion.div>

          {/* Hero Images Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto"
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
                  className="h-64 sm:h-80 w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Another Bowl Section */}
      <section className="py-16 sm:py-24 px-6 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6">
              Why <span className="text-primary">Another Bowl?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              We're more than just food. We're a community built on clean eating, active living, and genuine connections.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                icon: (
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                ),
                title: "Made with Love",
                description: "Every bowl is crafted with fresh, local ingredients and a whole lot of care."
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Clean Energy",
                description: "Fuel your body with nutritious ingredients that keep you moving and feeling great."
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ),
                title: "Community First",
                description: "Join our weekly run club and connect with like-minded people who love to move."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-mint/20 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Buttons */}
      <section className="py-12 sm:py-16 px-6 sm:px-8 bg-gradient-to-r from-light to-mint/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Explore Our World
            </h3>
            <p className="text-gray-600">
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
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 25px -5px rgba(255, 62, 134, 0.3), 0 10px 10px -5px rgba(255, 62, 134, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                className={`relative overflow-hidden rounded-xl px-6 py-4 font-semibold transition-all duration-300 text-sm sm:text-base ${
                  activeSection === button.id 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-white text-primary border-2 border-primary/20 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <span className="text-lg sm:text-xl mb-2 block">{button.icon}</span>
                {button.label}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Dropdown Content with Smooth Animations */}
      <motion.div 
        className="px-6 sm:px-8 pb-16 sm:pb-24"
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

      {/* Instagram Feed Section */}
      <section className="py-16 sm:py-24 px-6 sm:px-8 bg-white">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Follow on Instagram
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
