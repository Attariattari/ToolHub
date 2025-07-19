"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-8xl"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        😢
      </motion.div>
      <motion.h1
        className="text-4xl font-bold mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Oops! Page Not Found
      </motion.h1>
      <p className="text-gray-600 mt-2">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <motion.button
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go Home
        </motion.button>
      </Link>
    </motion.div>
  );
}