 import { blogPosts } from '../../data/blogPosts';// Adjust this path if you move it
import { notFound } from 'next/navigation';

type Props = {
  params: { slug: string };
};

export default function BlogPost({ params }: Props) {
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
