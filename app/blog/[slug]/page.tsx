import { notFound } from 'next/navigation';
import { blogPosts } from '../../data/blogPosts';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }));
}

// ✅ Add this line to fix build issues on platforms like Netlify
export const dynamicParams = true;

interface PageProps {
  params: {
    slug: string;
  };
}

export default function BlogPost({ params }: PageProps) {
  const post = blogPosts.find((p) => p.id === params.slug);

  if (!post) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-primary mb-4">{post.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{post.date}</p>
      <article className="prose prose-lg text-gray-800">
        <p>{post.content}</p>
      </article>
    </main>
  );
}

