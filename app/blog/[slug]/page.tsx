import { notFound } from 'next/navigation';
import { blogPosts } from '../../data/blogPosts';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }));
}

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
      <h1 className="mb-4 text-4xl font-bold text-primary">{post.title}</h1>
      <p className="mb-6 text-sm text-gray-500">{post.date}</p>
      <article className="prose prose-lg text-gray-800">
        <p>{post.content}</p>
      </article>
    </main>
  );
}
