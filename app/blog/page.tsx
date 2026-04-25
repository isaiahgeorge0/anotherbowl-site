import NavBar from '../components/NavBar';
import BlogSection from '../components/BlogSection';
import Footer from '../components/Footer';
import { loadManagedContentSettings } from '@/lib/contentSettings';

export default async function BlogPage() {
  const content = await loadManagedContentSettings();
  const publishedPosts = content.blogPosts.filter((post) => post.status === 'published');

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <div className="px-6 sm:px-8 pb-16 sm:pb-24 pt-16 bg-gradient-to-b from-white/80 to-light/50 section-seamless">
        <BlogSection posts={publishedPosts} />
      </div>
      <Footer />
    </div>
  );
}
