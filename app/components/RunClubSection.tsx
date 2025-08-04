'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export default function RunClubSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      className="max-w-4xl mx-auto p-3 sm:p-4"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.h2 
        className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Join Our Run Club
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-2 items-center">
        {/* Image/Video Section */}
        <motion.div
          className="relative overflow-hidden rounded-lg sm:rounded-xl shadow-lg"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Image
            src="/images/run-club-1.jpeg"
            alt="Another Bowl Run Club"
            width={600}
            height={400}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          className="space-y-4 sm:space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Weekly Community Runs
            </h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Every week, we gather for energizing runs through Ipswich. Whether you're a seasoned runner or just starting out, 
              our inclusive community welcomes all paces and experience levels.
            </p>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6">
              After each run, refuel with our signature bowls and smoothies while connecting with fellow runners. 
              It's more than just running—it's building community through movement and healthy living.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm sm:text-base text-gray-700">All fitness levels welcome</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm sm:text-base text-gray-700">Weekly meetups</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm sm:text-base text-gray-700">Post-run refreshments</span>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Join the Club
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
} 