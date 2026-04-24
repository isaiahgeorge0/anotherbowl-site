import NavBar from './components/NavBar';
import Hero from './components/Hero';
import FollowJourney from './components/FollowJourney';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      {/* Navigation Bar */}
      <NavBar />

      {/* Hero Section with Integrated Explore */}
      <Hero />

      {/* Follow Our Journey Section */}
      <FollowJourney />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
