import { Metadata } from 'next';
import AboutSection from '../components/AboutSection';

export const metadata: Metadata = {
  title: 'About Us - Another Bowl',
  description: 'Discover what makes Another Bowl special. Made with love, clean energy, and community first in Ipswich.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-brandPink/10 to-brandGreen/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6">
            About Us
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto">
            Discover what makes Another Bowl special
          </p>
        </div>
      </div>

      {/* About Content */}
      <AboutSection />
    </div>
  );
}
