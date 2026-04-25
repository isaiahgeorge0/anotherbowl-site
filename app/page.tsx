import NavBar from './components/NavBar';
import Hero from './components/Hero';
import FollowJourney from './components/FollowJourney';
import Footer from './components/Footer';
import { loadManagedContentSettings } from '@/lib/contentSettings';

export default async function HomePage() {
  const content = await loadManagedContentSettings();
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      {/* Navigation Bar */}
      <NavBar />

      {/* Hero Section with Integrated Explore */}
      <Hero
        announcementTitle={content.homepage.announcementTitle}
        shortMessage={content.homepage.shortMessage}
      />

      {/* Follow Our Journey Section */}
      <FollowJourney />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
