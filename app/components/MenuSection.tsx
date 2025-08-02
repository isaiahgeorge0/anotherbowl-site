'use client';
import { motion } from 'framer-motion';

export default function MenuSection() {
  return (
    <motion.div
      className="max-w-xl mx-auto p-4 border rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <h2 className="text-2xl font-bold mb-2">Menu</h2>
      <p>
        Explore our signature bowls, smoothies, and juices. Nutritious, delicious, and made fresh daily.
      </p>
    </motion.div>
  );
}
