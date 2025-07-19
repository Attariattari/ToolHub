"use client"

import { motion } from "framer-motion"
import Link from "next/link"

const blogPosts = [
  {
    title: "How to Compress PDF Files Without Losing Quality",
    excerpt: "Learn the best techniques to reduce PDF file size while maintaining document quality and readability.",
    date: "December 15, 2024",
    readTime: "5 min read",
    image: "/blogs/1 (1).jpg",
    category: "Tips & Tricks",
  },
  {
    title: "New PDF Security Features: Protect Your Documents",
    excerpt: "Discover our latest security enhancements including advanced encryption and digital signature options.",
    date: "December 12, 2024",
    readTime: "3 min read",
    image: "/blogs/1 (3).jpg",
    category: "Updates",
  },
  {
    title: "Converting PDFs to Office Formats: Complete Guide",
    excerpt: "Step-by-step guide on converting PDF files to Word, Excel, and PowerPoint with maximum accuracy.",
    date: "December 10, 2024",
    readTime: "7 min read",
    image: "/blogs/1 (2).png",
    category: "Tutorials",
  },
]

export default function LatestNews() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-red-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Latest News & Updates</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest features, tips, and tutorials for getting the most out of your PDF tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="relative">
                <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-48 object-cover" />
                <div className="absolute top-4 left-4">
                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {post.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-red-600 transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-4">{post.excerpt}</p>

                <div className="flex items-center text-red-600 font-medium text-sm">
                  Read More
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/blogs"
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-2.5 rounded-full text-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300"
          >
            View All Articles
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
