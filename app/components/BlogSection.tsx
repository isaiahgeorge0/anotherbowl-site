'use client';
import { motion } from 'framer-motion';
import { blogPosts } from '@/data/blogPosts';


export default function BlogSection() {
  return (
    <motion.div
      className="max-w-xl mx-auto p-4 border rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <h2 className="text-2xl font-bold mb-4">From the Blog</h2>

      {blogPosts.map((post) => (
        <motion.div
          key={post.id}
          className="mb-4 rounded-md border px-4 py-3 shadow-sm transition-all hover:shadow-md"
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-sm text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
          <p className="mt-1 text-sm text-gray-700">{post.summary}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
