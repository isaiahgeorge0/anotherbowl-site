import { Metadata } from 'next';
import BlogSection from '../components/BlogSection';

export const metadata: Metadata = {
  title: 'Blog - Another Bowl',
  description: 'Read about healthy eating, nutrition tips, and the latest news from Another Bowl. Discover recipes, wellness advice, and our community stories.',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-brandPink/10 to-brandGreen/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6">
            Blog
          </h1>
          <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto">
            Read about healthy eating, nutrition tips, and the latest news
          </p>
        </div>
      </div>

      {/* Blog Content */}
      <BlogSection />
    </div>
  );
}
