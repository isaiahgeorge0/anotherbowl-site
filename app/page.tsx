

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import ExploreGrid from './components/ExploreGrid';
import FollowJourney from './components/FollowJourney';
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

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      {/* Navigation Bar */}
      <NavBar toggleSection={toggleSection} />

      {/* Hero Section */}
      <Hero />

      {/* Explore Our World Section */}
      <ExploreGrid toggleSection={toggleSection} />

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
          {activeSection === 'run-club' && <RunClubSection />}
        </motion.div>
      </motion.div>

      {/* Follow Our Journey Section */}
      <FollowJourney />

      {/* Menu Section - Standalone with gradient blend */}
      <section id="menu" className="relative scroll-mt-24 lg:scroll-mt-32">
        {/* Blend hero → menu to remove the hard line */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white" />
        <MenuSection />
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
