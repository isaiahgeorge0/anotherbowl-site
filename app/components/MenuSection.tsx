'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function MenuSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="max-w-xl mx-auto p-4 sm:p-6 border rounded-lg shadow-sm"
      initial={{ opacity: 0, x: 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.h2 
        className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Menu
      </motion.h2>
      <motion.p
        className="text-sm sm:text-base leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        Explore our signature bowls, smoothies, and juices. Nutritious, delicious, and made fresh daily.
      </motion.p>
    </motion.div>
  );
}
