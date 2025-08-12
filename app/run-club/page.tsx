import { Metadata } from 'next';
import RunClubSection from '../components/RunClubSection';

export const metadata: Metadata = {
  title: 'Run Club - Another Bowl',
  description: 'Join our weekly run club in Ipswich. Stay active, build community, and enjoy healthy food together. All fitness levels welcome.',
};

export default function RunClubPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-brandPink/10 to-brandGreen/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6">
            Run Club
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto">
            Join our weekly run club in Ipswich. Stay active, build community.
          </p>
        </div>
      </div>

      {/* Run Club Content */}
      <RunClubSection />
    </div>
  );
}
