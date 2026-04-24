import NavBar from '../components/NavBar';
import RunClubSection from '../components/RunClubSection';
import Footer from '../components/Footer';

export default function RunClubPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <div className="px-6 sm:px-8 pb-16 sm:pb-24 pt-16 bg-gradient-to-b from-white/80 to-light/50 section-seamless">
        <RunClubSection />
      </div>
      <Footer />
    </div>
  );
}
