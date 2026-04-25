import { notFound } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { loadManagedContentSettings } from '@/lib/contentSettings';

// ✅ Correct type expected by Next.js App Router
interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const content = await loadManagedContentSettings();
  const post = content.blogPosts.find((entry) => entry.slug === slug && entry.status === 'published');

  if (!post) return notFound();

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
        <p className="text-gray-500 text-sm mb-6">{new Date(post.createdAt).toLocaleDateString('en-GB')}</p>
        {post.featuredImageUrl ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-stone-200">
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}
        <div className="prose prose-lg text-gray-800">
          <p className="whitespace-pre-line">{post.body}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

