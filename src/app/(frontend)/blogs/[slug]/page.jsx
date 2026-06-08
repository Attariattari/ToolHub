"use client"

import { useState, useEffect, useContext, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BlogsContext } from "@/context/Blog.context"
import { toast } from "react-toastify"
import { API_URL } from "@/constants/constants"
import Image from "next/image"

const categories = [
  "All",
  "Tips & Tricks",
  "Tutorials",
  "Security",
  "Best Practices",
  "Technical",
  "Reviews",
  "Help",
  "News",
]

export default function BlogDetailPage({ params }) {
  const router = useRouter()
  const {
    singleBlog,
    fetchSingleBlog,
    clearSingleBlog,
    publishedBlogsData,
    updateFilters
  } = useContext(BlogsContext)
  const unwrappedParams = use(params); // unwrap the promise
  const slug = unwrappedParams?.slug || unwrappedParams?.id;

  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    // Extract slug from params (assuming params.slug or params.id)
    // const slug = params?.slug || params?.id

    if (slug) {
      fetchSingleBlog(slug)
    }

    // Cleanup when component unmounts
    return () => {
      clearSingleBlog()
    }
  }, [params])

  useEffect(() => {
    // Get related posts from publishedBlogsData when current post and published blogs are available
    if (singleBlog.blog && publishedBlogsData.blogs.length > 0) {
      const related = publishedBlogsData.blogs
        .filter(post =>
          post.category === singleBlog.blog.category &&
          post._id !== singleBlog.blog._id
        )
        .slice(0, 3)
      setRelatedPosts(related)
    }
  }, [singleBlog.blog, publishedBlogsData.blogs])

  const handleCategoryClick = (category) => {
    updateFilters({
      search: "",
      category: category === "All" ? "all" : category.toLowerCase()
    })
    router.push('/blogs')
  }

  const handleShareClick = async (platform) => {
    if (!singleBlog.blog) return

    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(singleBlog.blog.title)
    const description = encodeURIComponent(singleBlog.blog.excerpt || singleBlog.blog.metaDescription || '')

    let shareUrl = ''

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        break
      case 'copy':
        try {
          await navigator.clipboard.writeText(window.location.href)
          // You can add a toast notification here if you have one
          toast.success('Link copied to clipboard!')
        } catch (err) {
          console.error('Failed to copy: ', err)
        }
        return
      default:
        return
    }

    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  // Loading state
  if (singleBlog.loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Error state
  if (singleBlog.error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section with Error */}
        <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
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

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <div
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Oops! Article Not Found</h1>
                <p className="text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl mx-auto">
                  The article you're looking for doesn't exist or may have been moved.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div
                // initial={{ opacity: 0, y: 30 }}
                // animate={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-xl p-8 shadow-sm"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article Not Available</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We couldn't find the article you're looking for. It might have been removed, renamed, or is temporarily unavailable.
                </p>

                <div className="space-y-4">
                  <Link
                    href="/blogs"
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Browse All Articles
                  </Link>

                  <div className="text-sm text-gray-500">
                    or try searching for something specific
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div
                // initial={{ opacity: 0, y: 30 }}
                // animate={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">You might be interested in:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/blogs?category=tutorials" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Tutorials</h4>
                    <p className="text-sm text-gray-600 mt-1">Step-by-step guides</p>
                  </Link>
                  <Link href="/blogs?category=tips" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Tips & Tricks</h4>
                    <p className="text-sm text-gray-600 mt-1">Quick helpful tips</p>
                  </Link>
                  <Link href="/blogs?category=features" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Features</h4>
                    <p className="text-sm text-gray-600 mt-1">Latest updates</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // No blog data
  if (!singleBlog.blog) {
    return null
  }

  const currentPost = singleBlog.blog
  const nextPost = currentPost.nextBlog
  const prevPost = currentPost.prevBlog

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div>
            {/* Back to Blog */}
            <div
              // initial={{ opacity: 0, x: -20 }}
              // animate={{ opacity: 1, x: 0 }}
              // transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Link href="/blogs" className="inline-flex items-center text-white hover:text-blue-200 transition-colors">
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </div>

            <div>
              <div className="flex items-center mb-4">
                <span className="bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full font-medium mr-4">
                  {currentPost.category}
                </span>
                {currentPost.featured && (
                  <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">Featured</span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{currentPost.title}</h1>

              <div className="flex flex-wrap items-center text-blue-100 text-sm gap-6 mb-6">
                <div className="flex items-center">
                  <FiUser className="w-4 h-4 mr-2" />
                  <span>{currentPost.author?.username || 'PDFDEX Team'}</span>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(currentPost.publishedAt || currentPost.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-2" />
                  <span>{currentPost.readingTime || '5'} min read</span>
                </div>
              </div>

              <p className="text-xl text-blue-100 leading-relaxed">
                {currentPost.excerpt || currentPost.metaDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              {/* Main Content */}
              <div
                // initial={{ opacity: 0, y: 30 }}
                // animate={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-3"
              >
                {/* Featured Image */}
                {currentPost.featuredImage && (
                  <div className="mb-8">
                    <Image
                      // fill
                      height={250}
                      width={1000}
                      priority
                      src={API_URL + '/' + currentPost.featuredImage}
                      alt={currentPost.title}
                      className="w-full h-64 md:h-80 object-cover rounded-xl shadow-sm"
                    />
                  </div>
                )}

                {/* Article Content */}
                <div
                  className="blog-content prose prose-lg max-w-none
                    prose-headings:text-gray-900 prose-headings:font-semibold
                    prose-p:text-gray-700 prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900
                    prose-ul:text-gray-700 prose-ol:text-gray-700
                    prose-li:text-gray-700
                    prose-blockquote:border-l-blue-600 prose-blockquote:text-gray-700
                    prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                  "
                  dangerouslySetInnerHTML={{ __html: currentPost.content }}
                />

                {/* Tags */}
                {currentPost.tags && Array.isArray(currentPost.tags) && currentPost.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-sm text-gray-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 px-3 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          <FiTag className="w-3 h-3 mr-1" />
                          {typeof tag === 'string' ? tag : String(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleShareClick('twitter')}
                      className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <FiTwitter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareClick('facebook')}
                      className="flex items-center justify-center w-10 h-10 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors"
                    >
                      <FiFacebook className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareClick('linkedin')}
                      className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <FiLinkedin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareClick('copy')}
                      className="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                    >
                      <FiShare2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div
                // initial={{ opacity: 0, x: 30 }}
                // animate={{ opacity: 1, x: 0 }}
                // transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-1"
              >
                {/* Author Info */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {(currentPost.author?.username || 'PDFDEX Team').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {currentPost.author?.username || 'PDFDEX Team'}
                      </h4>
                      <p className="text-sm text-gray-600">Content Writer</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Passionate about helping users get the most out of PDFDEX and document management solutions.
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
                          <button
                            onClick={() => handleCategoryClick(category)}
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors block py-1 text-left w-full"
                          >
                            {category}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Previous Post */}
              {prevPost && (
                <div
                // initial={{ opacity: 0, x: -30 }}
                // whileInView={{ opacity: 1, x: 0 }}
                // transition={{ duration: 0.6 }}
                // viewport={{ once: true }}
                >
                  <Link
                    href={`/blogs/${prevPost.slug}`}
                    className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <FiChevronLeft className="w-4 h-4 mr-1" />
                      Previous Article
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {prevPost.title}
                    </h3>
                    {prevPost.excerpt && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{prevPost.excerpt}</p>
                    )}
                  </Link>
                </div>
              )}

              {/* Next Post */}
              {nextPost && (
                <div
                  // initial={{ opacity: 0, x: 30 }}
                  // whileInView={{ opacity: 1, x: 0 }}
                  // transition={{ duration: 0.6 }}
                  // viewport={{ once: true }}
                  className={!prevPost ? "md:col-start-2" : ""}
                >
                  <Link
                    href={`/blogs/${nextPost.slug}`}
                    className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-end text-sm text-gray-500 mb-2">
                      Next Article
                      <FiChevronRight className="w-4 h-4 ml-1" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-right">
                      {nextPost.title}
                    </h3>
                    {nextPost.excerpt && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2 text-right">{nextPost.excerpt}</p>
                    )}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div>
              <h2
                // initial={{ opacity: 0, y: 30 }}
                // whileInView={{ opacity: 1, y: 0 }}
                // transition={{ duration: 0.6 }}
                // viewport={{ once: true }}
                className="text-3xl font-bold text-gray-900 text-center mb-12"
              >
                Related Articles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((post, index) => (
                  <article
                    key={post._id}
                    // initial={{ opacity: 0, y: 30 }}
                    // whileInView={{ opacity: 1, y: 0 }}
                    // transition={{ duration: 0.6, delay: index * 0.1 }}
                    // viewport={{ once: true }}
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <Link href={`/blogs/${post.slug || post._id}`}>
                      <div className="relative">
                        <img
                          src={post.featuredImage || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          <span className="mr-4">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <FiClock className="w-4 h-4 mr-1" />
                          <span>{post.readTime || '5 min read'}</span>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 leading-relaxed line-clamp-3">
                          {post.excerpt || post.metaDescription}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}


// "use client"

// import { useState, useEffect } from "react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import {
//   FiCalendar,
//   FiClock,
//   FiUser,
//   FiTag,
//   FiShare2,
//   FiTwitter,
//   FiFacebook,
//   FiLinkedin,
//   FiChevronLeft,
//   FiChevronRight,
//   FiArrowLeft,
// } from "react-icons/fi"
// import { blogPosts, categories } from "../data"

// export default function BlogDetailPage({ params }) {
//   const [currentPost, setCurrentPost] = useState(null)
//   const [relatedPosts, setRelatedPosts] = useState([])
//   const [nextPost, setNextPost] = useState(null)
//   const [prevPost, setPrevPost] = useState(null)

//   useEffect(() => {
//     // Find current post (in real app, you'd use the slug from params)
//     const post = blogPosts.find((p) => p.id === 1) // Using first post as example
//     setCurrentPost(post)

//     if (post) {
//       // Find related posts (same category, excluding current)
//       const related = blogPosts.filter((p) => p.category === post.category && p.id !== post.id).slice(0, 3)
//       setRelatedPosts(related)

//       // Find next and previous posts
//       const currentIndex = blogPosts.findIndex((p) => p.id === post.id)
//       setNextPost(currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null)
//       setPrevPost(currentIndex > 0 ? blogPosts[currentIndex - 1] : null)
//     }
//   }, [params])

//   if (!currentPost) {
//     return <div>Loading...</div>
//   }

//   const fullContent = `
//     <p>PDF compression is one of the most frequently requested features by our users. Whether you're trying to email a large document, upload files to a website with size restrictions, or simply save storage space, knowing how to compress PDF files effectively is essential.</p>

//     <h2>Why Compress PDF Files?</h2>
//     <p>Large PDF files can be problematic for several reasons:</p>
//     <ul>
//       <li><strong>Email limitations:</strong> Most email providers have attachment size limits (usually 25MB)</li>
//       <li><strong>Storage costs:</strong> Large files consume more storage space</li>
//       <li><strong>Slow loading:</strong> Big files take longer to load and view</li>
//       <li><strong>Bandwidth usage:</strong> Large files consume more internet bandwidth</li>
//     </ul>

//     <h2>Understanding PDF Compression</h2>
//     <p>PDF compression works by reducing the file size through various techniques:</p>
//     <ul>
//       <li><strong>Image compression:</strong> Reducing image quality and resolution</li>
//       <li><strong>Font optimization:</strong> Removing unused fonts and optimizing font data</li>
//       <li><strong>Content stream compression:</strong> Compressing the actual content data</li>
//       <li><strong>Object removal:</strong> Removing unnecessary metadata and objects</li>
//     </ul>

//     <h2>Best Practices for PDF Compression</h2>
//     <p>To achieve the best results when compressing your PDF files, follow these professional tips:</p>

//     <h3>1. Choose the Right Compression Level</h3>
//     <p>Most PDF compression tools offer different compression levels:</p>
//     <ul>
//       <li><strong>Low compression:</strong> Minimal size reduction, highest quality</li>
//       <li><strong>Medium compression:</strong> Balanced approach between size and quality</li>
//       <li><strong>High compression:</strong> Maximum size reduction, some quality loss</li>
//     </ul>

//     <h3>2. Optimize Images Before Adding to PDF</h3>
//     <p>If you're creating a PDF from scratch, optimize your images first. Use appropriate resolution (72-150 DPI for web, 300 DPI for print) and compress images using tools like JPEG compression for photos and PNG for graphics with transparency.</p>

//     <h3>3. Remove Unnecessary Elements</h3>
//     <p>Before compressing, remove any unnecessary elements from your PDF:</p>
//     <ul>
//       <li>Unused bookmarks</li>
//       <li>Form fields that aren't needed</li>
//       <li>Comments and annotations</li>
//       <li>Hidden layers</li>
//     </ul>

//     <h2>Using Our PDF Compression Tool</h2>
//     <p>Our online PDF compressor uses advanced algorithms to reduce file size while maintaining quality. Here's how to use it effectively:</p>
//     <ol>
//       <li>Upload your PDF file (up to 100MB for free users)</li>
//       <li>Choose your compression level based on your needs</li>
//       <li>Click "Compress PDF" and wait for processing</li>
//       <li>Download your compressed file</li>
//     </ol>

//     <h2>When NOT to Compress</h2>
//     <p>While compression is useful in many situations, there are times when you should avoid it:</p>
//     <ul>
//       <li><strong>Legal documents:</strong> Where every detail must be preserved</li>
//       <li><strong>High-quality prints:</strong> When the PDF will be professionally printed</li>
//       <li><strong>Technical drawings:</strong> Where precision is critical</li>
//       <li><strong>Already optimized files:</strong> Files that are already well-compressed</li>
//     </ul>

//     <h2>Conclusion</h2>
//     <p>PDF compression is a powerful tool when used correctly. By understanding the different compression techniques and following best practices, you can significantly reduce file sizes while maintaining acceptable quality for your specific use case.</p>

//     <p>Remember, the key is finding the right balance between file size and quality based on your intended use. Our PDF compression tool makes this process simple and efficient, allowing you to achieve professional results in just a few clicks.</p>
//   `

//   return (
//     <div className="bg-white min-h-screen">
//       {/* Hero Section */}
//       <section className="relative py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
//         {/* Background Elements */}
//         <div className="absolute inset-0">
//           <svg
//             className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
//             width="300"
//             height="300"
//             viewBox="0 0 300 300"
//             fill="none"
//           >
//             <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
//             <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
//           </svg>
//           <div className="absolute bottom-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
//           <div className="absolute top-32 right-32 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-700"></div>
//         </div>

//         <div className="container relative z-10">
//           <div>
//             {/* Back to Blog */}
//             <motion.div
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               className="mb-8"
//             >
//               <Link href="/blogs" className="inline-flex items-center text-white hover:text-blue-200 transition-colors">
//                 <FiArrowLeft className="w-4 h-4 mr-2" />
//                 Back to Blog
//               </Link>
//             </motion.div>

//             <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
//               <div className="flex items-center mb-4">
//                 <span className="bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full font-medium mr-4">
//                   {currentPost.category}
//                 </span>
//                 {currentPost.featured && (
//                   <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium">Featured</span>
//                 )}
//               </div>

//               <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{currentPost.title}</h1>

//               <div className="flex flex-wrap items-center text-blue-100 text-sm gap-6 mb-6">
//                 <div className="flex items-center">
//                   <FiUser className="w-4 h-4 mr-2" />
//                   <span>{currentPost.author}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <FiCalendar className="w-4 h-4 mr-2" />
//                   <span>{currentPost.date}</span>
//                 </div>
//                 <div className="flex items-center">
//                   <FiClock className="w-4 h-4 mr-2" />
//                   <span>{currentPost.readTime}</span>
//                 </div>
//               </div>

//               <p className="text-xl text-blue-100 leading-relaxed">{currentPost.excerpt}</p>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Article Content */}
//       <section className="py-16">
//         <div className="container">
//           <div>
//             <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
//               {/* Main Content */}
//               <motion.div
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: 0.2 }}
//                 className="lg:col-span-3"
//               >
//                 {/* Featured Image */}
//                 <div className="mb-8">
//                   <img
//                     src={currentPost.image || "/placeholder.svg"}
//                     alt={currentPost.title}
//                     className="w-full h-64 md:h-80 object-cover rounded-xl shadow-sm"
//                   />
//                 </div>

//                 {/* Article Content */}
//                 <div className="blog-content" dangerouslySetInnerHTML={{ __html: fullContent }} />

//                 {/* Tags */}
//                 <div className="mt-12 pt-8 border-t border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
//                   <div className="flex flex-wrap gap-2">
//                     {currentPost.tags.map((tag) => (
//                       <span
//                         key={tag}
//                         className="inline-flex items-center text-sm text-gray-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 px-3 py-1 rounded-full transition-colors cursor-pointer"
//                       >
//                         <FiTag className="w-3 h-3 mr-1" />
//                         {tag}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Share */}
//                 <div className="mt-8 pt-8 border-t border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
//                   <div className="flex space-x-4">
//                     <button className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
//                       <FiTwitter className="w-4 h-4" />
//                     </button>
//                     <button className="flex items-center justify-center w-10 h-10 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors">
//                       <FiFacebook className="w-4 h-4" />
//                     </button>
//                     <button className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
//                       <FiLinkedin className="w-4 h-4" />
//                     </button>
//                     <button className="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors">
//                       <FiShare2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//               </motion.div>

//               {/* Sidebar */}
//               <motion.div
//                 initial={{ opacity: 0, x: 30 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.6, delay: 0.4 }}
//                 className="lg:col-span-1"
//               >
//                 {/* Author Info */}
//                 <div className="bg-gray-50 rounded-xl p-6 mb-8">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
//                   <div className="flex items-center mb-4">
//                     <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
//                       {currentPost.author.charAt(0)}
//                     </div>
//                     <div>
//                       <h4 className="font-semibold text-gray-900">{currentPost.author}</h4>
//                       <p className="text-sm text-gray-600">Content Writer</p>
//                     </div>
//                   </div>
//                   <p className="text-sm text-gray-600">
//                     Passionate about helping users get the most out of PDFDEX and document management solutions.
//                   </p>
//                 </div>

//                 {/* Categories */}
//                 <div className="bg-gray-50 rounded-xl p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
//                   <ul className="space-y-2">
//                     {categories
//                       .filter((cat) => cat !== "All")
//                       .map((category) => (
//                         <li key={category}>
//                           <Link
//                             href={`/blogs?category=${encodeURIComponent(category)}`}
//                             className="text-sm text-gray-600 hover:text-blue-600 transition-colors block py-1"
//                           >
//                             {category}
//                           </Link>
//                         </li>
//                       ))}
//                   </ul>
//                 </div>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Navigation */}
//       <section className="py-12 bg-gray-50">
//         <div className="container">
//           <div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Previous Post */}
//               {prevPost && (
//                 <motion.div
//                   initial={{ opacity: 0, x: -30 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.6 }}
//                   viewport={{ once: true }}
//                 >
//                   <Link
//                     href={`/blogs/${prevPost.id}`}
//                     className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
//                   >
//                     <div className="flex items-center text-sm text-gray-500 mb-2">
//                       <FiChevronLeft className="w-4 h-4 mr-1" />
//                       Previous Article
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
//                       {prevPost.title}
//                     </h3>
//                     <p className="text-sm text-gray-600 mt-2 line-clamp-2">{prevPost.excerpt}</p>
//                   </Link>
//                 </motion.div>
//               )}

//               {/* Next Post */}
//               {nextPost && (
//                 <motion.div
//                   initial={{ opacity: 0, x: 30 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.6 }}
//                   viewport={{ once: true }}
//                   className={!prevPost ? "md:col-start-2" : ""}
//                 >
//                   <Link
//                     href={`/blogs/${nextPost.id}`}
//                     className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
//                   >
//                     <div className="flex items-center justify-end text-sm text-gray-500 mb-2">
//                       Next Article
//                       <FiChevronRight className="w-4 h-4 ml-1" />
//                     </div>
//                     <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-right">
//                       {nextPost.title}
//                     </h3>
//                     <p className="text-sm text-gray-600 mt-2 line-clamp-2 text-right">{nextPost.excerpt}</p>
//                   </Link>
//                 </motion.div>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Related Posts */}
//       {relatedPosts.length > 0 && (
//         <section className="py-16">
//           <div className="container">
//             <div>
//               <motion.h2
//                 initial={{ opacity: 0, y: 30 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6 }}
//                 viewport={{ once: true }}
//                 className="text-3xl font-bold text-gray-900 text-center mb-12"
//               >
//                 Related Articles
//               </motion.h2>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//                 {relatedPosts.map((post, index) => (
//                   <motion.article
//                     key={post.id}
//                     initial={{ opacity: 0, y: 30 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.6, delay: index * 0.1 }}
//                     viewport={{ once: true }}
//                     className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
//                   >
//                     <Link href={`/blogs/${post.id}`}>
//                       <div className="relative">
//                         <img
//                           src={post.image || "/placeholder.svg"}
//                           alt={post.title}
//                           className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
//                         />
//                         <div className="absolute top-4 left-4">
//                           <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
//                             {post.category}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="p-6">
//                         <div className="flex items-center text-sm text-gray-500 mb-3">
//                           <FiCalendar className="w-4 h-4 mr-1" />
//                           <span className="mr-4">{post.date}</span>
//                           <FiClock className="w-4 h-4 mr-1" />
//                           <span>{post.readTime}</span>
//                         </div>

//                         <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
//                           {post.title}
//                         </h3>

//                         <p className="text-gray-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
//                       </div>
//                     </Link>
//                   </motion.article>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </section>
//       )}
//     </div>
//   )
// }
