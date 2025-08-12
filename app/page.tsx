

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

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
            {/* Navigation Bar */}
      <NavBar />

      {/* Hero Section */}
      <Hero />

      {/* Explore Our World Section */}
      <ExploreGrid />






      {/* Follow Our Journey Section */}
      <FollowJourney />

      {/* Menu Section - Standalone with gradient blend */}
      <section id="menu" className="relative scroll-mt-24 lg:scroll-mt-32">
        {/* Blend hero → menu to remove the hard line */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white" />
        <MenuSection />
      </section>

      {/* About Section - Standalone */}
      <section id="about" className="py-16 sm:py-24 px-6 sm:px-8 bg-white scroll-mt-24 lg:scroll-mt-32">
        <AboutSection />
      </section>

      {/* Blog Section - Standalone */}
      <section id="blog" className="py-16 sm:py-24 px-6 sm:px-8 bg-slate-50 scroll-mt-24 lg:scroll-mt-32">
        <BlogSection />
      </section>

      {/* Run Club Section - Standalone */}
      <section id="run-club" className="py-16 sm:py-24 px-6 sm:px-8 bg-white scroll-mt-24 lg:scroll-mt-32">
        <RunClubSection />
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
