import { Metadata } from 'next';
import MenuSection from '../components/MenuSection';

export const metadata: Metadata = {
  title: 'Our Menu - Another Bowl',
  description: 'Fresh, nutritious food made with love. From hearty mains to refreshing drinks. Explore our complete menu with wraps, bowls, smoothies, and more.',
};

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-brandPink/10 to-brandGreen/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6">
            Our Menu
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto">
            Fresh, nutritious food made with love. From hearty mains to refreshing drinks.
          </p>
        </div>
      </div>

      {/* Menu Content */}
      <MenuSection />
    </div>
  );
}
