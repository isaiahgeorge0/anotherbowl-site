import { notFound } from 'next/navigation';
import { blogPosts } from '../../data/blogPosts'; // 3 dots because you're inside [slug] which is inside blog

// ✅ Correct type expected by Next.js App Router
interface PageProps {
  params: {
    slug: string;
  };
}

// ✅ Optional but good to include: SSG helper
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }));
}

export default function BlogPost({ params }: PageProps) {
  const post = blogPosts.find((p) => p.id === params.slug);

  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{post.date}</p>
      <div className="prose prose-lg text-gray-800">
        <p>{post.content}</p>
      </div>
    </main>
  );
}

