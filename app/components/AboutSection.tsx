'use client';
import { motion } from 'framer-motion';

export default function AboutSection() {
  return (
    <motion.div
      className="max-w-xl mx-auto p-4 border rounded-lg shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <h2 className="text-2xl font-bold mb-2">About Us</h2>
      <p>
        Another Bowl is dedicated to clean eating, strong community, and active lifestyles.
        Join our weekly run club and fuel up with refreshing bowls made with care.
      </p>
    </motion.div>
  );
}
