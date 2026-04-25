import NavBar from '../components/NavBar';
import RunClubSection from '../components/RunClubSection';
import Footer from '../components/Footer';
import { loadManagedContentSettings } from '@/lib/contentSettings';

export default async function RunClubPage() {
  const content = await loadManagedContentSettings();

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <div className="px-6 sm:px-8 pb-16 sm:pb-24 pt-16 bg-gradient-to-b from-white/80 to-light/50 section-seamless">
        <RunClubSection
          announcement={content.runClub.announcement}
          nextEventDateTime={content.runClub.nextEventDateTime}
          meetingPoint={content.runClub.meetingPoint}
        />
      </div>
      <Footer />
    </div>
  );
}
