"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiShare2,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
} from "react-icons/fi"
import { blogPosts, categories } from "../data"

export default function BlogDetailPage({ params }) {
  const [currentPost, setCurrentPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [nextPost, setNextPost] = useState(null)
  const [prevPost, setPrevPost] = useState(null)

  useEffect(() => {
    // Find current post (in real app, you'd use the slug from params)
    const post = blogPosts.find((p) => p.id === 1) // Using first post as example
    setCurrentPost(post)

    if (post) {
      // Find related posts (same category, excluding current)
      const related = blogPosts.filter((p) => p.category === post.category && p.id !== post.id).slice(0, 3)
      setRelatedPosts(related)

      // Find next and previous posts
      const currentIndex = blogPosts.findIndex((p) => p.id === post.id)
      setNextPost(currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null)
      setPrevPost(currentIndex > 0 ? blogPosts[currentIndex - 1] : null)
    }
  }, [params])

  if (!currentPost) {
    return <div>Loading...</div>
  }

  const fullContent = `
    <p>PDF compression is one of the most frequently requested features by our users. Whether you're trying to email a large document, upload files to a website with size restrictions, or simply save storage space, knowing how to compress PDF files effectively is essential.</p>

    <h2>Why Compress PDF Files?</h2>
    <p>Large PDF files can be problematic for several reasons:</p>
    <ul>
      <li><strong>Email limitations:</strong> Most email providers have attachment size limits (usually 25MB)</li>
      <li><strong>Storage costs:</strong> Large files consume more storage space</li>
      <li><strong>Slow loading:</strong> Big files take longer to load and view</li>
      <li><strong>Bandwidth usage:</strong> Large files consume more internet bandwidth</li>
    </ul>

    <h2>Understanding PDF Compression</h2>
    <p>PDF compression works by reducing the file size through various techniques:</p>
    <ul>
      <li><strong>Image compression:</strong> Reducing image quality and resolution</li>
      <li><strong>Font optimization:</strong> Removing unused fonts and optimizing font data</li>
      <li><strong>Content stream compression:</strong> Compressing the actual content data</li>
      <li><strong>Object removal:</strong> Removing unnecessary metadata and objects</li>
    </ul>

    <h2>Best Practices for PDF Compression</h2>
    <p>To achieve the best results when compressing your PDF files, follow these professional tips:</p>

    <h3>1. Choose the Right Compression Level</h3>
    <p>Most PDF compression tools offer different compression levels:</p>
    <ul>
      <li><strong>Low compression:</strong> Minimal size reduction, highest quality</li>
      <li><strong>Medium compression:</strong> Balanced approach between size and quality</li>
      <li><strong>High compression:</strong> Maximum size reduction, some quality loss</li>
    </ul>

    <h3>2. Optimize Images Before Adding to PDF</h3>
    <p>If you're creating a PDF from scratch, optimize your images first. Use appropriate resolution (72-150 DPI for web, 300 DPI for print) and compress images using tools like JPEG compression for photos and PNG for graphics with transparency.</p>

    <h3>3. Remove Unnecessary Elements</h3>
    <p>Before compressing, remove any unnecessary elements from your PDF:</p>
    <ul>
      <li>Unused bookmarks</li>
      <li>Form fields that aren't needed</li>
      <li>Comments and annotations</li>
      <li>Hidden layers</li>
    </ul>

    <h2>Using Our PDF Compression Tool</h2>
    <p>Our online PDF compressor uses advanced algorithms to reduce file size while maintaining quality. Here's how to use it effectively:</p>
    <ol>
      <li>Upload your PDF file (up to 100MB for free users)</li>
      <li>Choose your compression level based on your needs</li>
      <li>Click "Compress PDF" and wait for processing</li>
      <li>Download your compressed file</li>
    </ol>

    <h2>When NOT to Compress</h2>
    <p>While compression is useful in many situations, there are times when you should avoid it:</p>
    <ul>
      <li><strong>Legal documents:</strong> Where every detail must be preserved</li>
      <li><strong>High-quality prints:</strong> When the PDF will be professionally printed</li>
      <li><strong>Technical drawings:</strong> Where precision is critical</li>
      <li><strong>Already optimized files:</strong> Files that are already well-compressed</li>
    </ul>

    <h2>Conclusion</h2>
    <p>PDF compression is a powerful tool when used correctly. By understanding the different compression techniques and following best practices, you can significantly reduce file sizes while maintaining acceptable quality for your specific use case.</p>

    <p>Remember, the key is finding the right balance between file size and quality based on your intended use. Our PDF compression tool makes this process simple and efficient, allowing you to achieve professional results in just a few clicks.</p>
  `

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-red-600 to-red-700 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <svg
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
            width="300"
            height="300"
            viewBox="0 0 300 300"
            fill="none"
          >
            <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
            <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
          </svg>
          <div className="absolute bottom-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-32 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="container relative z-10">
          <div>
            {/* Back to Blog */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Link href="/blogs" className="inline-flex items-center text-white hover:text-red-200 transition-colors">
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center mb-4">
                <span className="bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full font-medium mr-4">
                  {currentPost.category}
                </span>
                {currentPost.featured && (
                  <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">Featured</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{currentPost.title}</h1>

              <div className="flex flex-wrap items-center text-red-100 text-sm gap-6 mb-6">
                <div className="flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  <span>{currentPost.author}</span>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span>{currentPost.date}</span>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-2" />
                  <span>{currentPost.readTime}</span>
                </div>
              </div>

              <p className="text-xl text-red-100 leading-relaxed">{currentPost.excerpt}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-3"
              >
                {/* Featured Image */}
                <div className="mb-8">
                  <img
                    src={currentPost.image || "/placeholder.svg"}
                    alt={currentPost.title}
                    className="w-full h-64 md:h-80 object-cover rounded-xl shadow-sm"
                  />
                </div>

                {/* Article Content */}
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: fullContent }} />

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-sm text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-600 px-3 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        <FiTag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
                  <div className="flex space-x-4">
                    <button className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                      <FiTwitter className="w-4 h-4" />
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors">
                      <FiFacebook className="w-4 h-4" />
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                      <FiLinkedin className="w-4 h-4" />
                    </button>
                    <button className="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors">
                      <FiShare2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-1"
              >
                {/* Author Info */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {currentPost.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{currentPost.author}</h4>
                      <p className="text-sm text-gray-600">Content Writer</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Passionate about helping users get the most out of PDF tools and document management solutions.
                  </p>
                </div>

                {/* Categories */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                  <ul className="space-y-2">
                    {categories
                      .filter((cat) => cat !== "All")
                      .map((category) => (
                        <li key={category}>
                          <Link
                            href={`/blogs?category=${encodeURIComponent(category)}`}
                            className="text-sm text-gray-600 hover:text-red-600 transition-colors block py-1"
                          >
                            {category}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Previous Post */}
              {prevPost && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/blogs/${prevPost.id}`}
                    className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <FiChevronLeft className="w-4 h-4 mr-1" />
                      Previous Article
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                      {prevPost.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{prevPost.excerpt}</p>
                  </Link>
                </motion.div>
              )}

              {/* Next Post */}
              {nextPost && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className={!prevPost ? "md:col-start-2" : ""}
                >
                  <Link
                    href={`/blogs/${nextPost.id}`}
                    className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-end text-sm text-gray-500 mb-2">
                      Next Article
                      <FiChevronRight className="w-4 h-4 ml-1" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 text-right">
                      {nextPost.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2 text-right">{nextPost.excerpt}</p>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-gray-900 text-center mb-12"
              >
                Related Articles
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <Link href={`/blogs/${post.id}`}>
                      <div className="relative">
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          <span className="mr-4">{post.date}</span>
                          <FiClock className="w-4 h-4 mr-1" />
                          <span>{post.readTime}</span>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
