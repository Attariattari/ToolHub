"use client"

import { useState, useEffect, useContext } from "react"
import { FiSearch, FiCalendar, FiClock, FiUser, FiTag, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BlogsContext } from "@/context/Blog.context" // Adjust path as needed
import useDebounce from "@/hooks/useDebounce" // Adjust path as needed
import { API_URL } from "@/constants/constants"
import Image from "next/image"

// Static categories
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

export default function BlogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    publishedBlogsData,
    pagination,
    setPagination,
    fetchPublishedBlogs,
    updateFilters,
    filters
  } = useContext(BlogsContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Initialize state from URL params on component mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const searchFromUrl = searchParams.get('search')

    if (categoryFromUrl) {
      // Find matching category (case insensitive)
      const matchedCategory = categories.find(cat =>
        cat.toLowerCase().replace(/\s+/g, '').replace(/&/g, '') ===
        categoryFromUrl.toLowerCase().replace(/\s+/g, '').replace(/&/g, '')
      )
      if (matchedCategory) {
        setSelectedCategory(matchedCategory)
      }
    }

    if (searchFromUrl) {
      setSearchTerm(searchFromUrl)
    }
  }, [])

  // Update filters when debounced search term or category changes
  useEffect(() => {
    updateFilters({
      search: debouncedSearchTerm,
      category: selectedCategory === "All" ? "all" : selectedCategory.toLowerCase()
    })
  }, [debouncedSearchTerm, selectedCategory])

  // Handle category change with URL update
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())

    if (category === "All") {
      params.delete('category')
    } else {
      params.set('category', category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))
    }

    // Keep search param if it exists
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }

    // Replace URL without adding to history
    const newUrl = params.toString() ? `?${params.toString()}` : '/blogs'
    router.replace(newUrl, { shallow: true })
  }

  // Handle search with URL update
  useEffect(() => {
    if (debouncedSearchTerm !== (searchParams.get('search') || '')) {
      const params = new URLSearchParams(searchParams.toString())

      if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm)
      } else {
        params.delete('search')
      }

      // Keep category param if it exists and is not "All"
      if (selectedCategory !== "All") {
        params.set('category', selectedCategory.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'))
      }

      const newUrl = params.toString() ? `?${params.toString()}` : '/blogs'
      router.replace(newUrl, { shallow: true })
    }
  }, [debouncedSearchTerm, selectedCategory, router, searchParams])

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchPublishedBlogs(newPage, pagination.limit)
  }

  const { blogs, loading, error } = publishedBlogsData

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
        {/* Background SVG Elements */}
        <div className="absolute inset-0">
          <svg
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
            <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
            <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
          </svg>

          <svg
            className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
            width="300"
            height="300"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
            <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
          </svg>

          <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              PDFDEX Blog
            </h1>
            <p
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
            >
              Tips, tutorials, and insights to help you master PDFDEX and document management
            </p>

            {/* Search Bar */}
            <div
              // initial={{ opacity: 0, y: 30 }}
              // animate={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles, tips, and tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && blogs.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
            </div>
          )}

          {/* Blog Posts Grid */}
          {!loading && !error && blogs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((post, index) => (
                <article
                  key={post._id}
                  // initial={{ opacity: 0, y: 30 }}
                  // whileInView={{ opacity: 1, y: 0 }}
                  // transition={{ duration: 0.6, delay: index * 0.1 }}
                  // viewport={{ once: true }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <Link
                    href={`/blogs/${post.slug || post._id}`}
                  >
                    <div className="relative">
                      <Image
                        height={200}
                        width={300}
                        priority
                        src={API_URL + '/' + post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {post.category}
                        </span>
                      </div>
                      {post.featured && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                            Featured
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        <span className="mr-4">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <FiClock className="w-4 h-4 mr-1" />
                        <span>{post.readingTime || '5 min read'}</span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt || post.metaDescription || 'Read this interesting article...'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <FiUser className="w-4 h-4 mr-1" />
                          <span>{post.author?.username || 'PDFDEX Team'}</span>
                        </div>
                        <span
                          className="flex items-center text-blue-600 font-medium text-sm"
                        >
                          Read More
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>

                      {/* Tags */}
                      {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                            >
                              <FiTag className="w-3 h-3 mr-1" />
                              {typeof tag === 'string' ? tag : String(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div
              // initial={{ opacity: 0, y: 30 }}
              // whileInView={{ opacity: 1, y: 0 }}
              // transition={{ duration: 0.6 }}
              // viewport={{ once: true }}
              className="flex justify-center items-center mt-16 space-x-2"
            >
              <button
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium ${pagination.page === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


// "use client"

// import { useState, useMemo } from "react"
// import { motion } from "framer-motion"
// import { FiSearch, FiCalendar, FiClock, FiUser, FiTag, FiChevronLeft, FiChevronRight } from "react-icons/fi"
// import { blogPosts, categories } from "./data"
// import Link from "next/link"

// export default function BlogPage() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("All")
//   const [currentPage, setCurrentPage] = useState(1)
//   const postsPerPage = 6

//   // Filter posts based on search and category
//   const filteredPosts = useMemo(() => {
//     return blogPosts.filter((post) => {
//       const matchesSearch =
//         post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
//       const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
//       return matchesSearch && matchesCategory
//     })
//   }, [searchTerm, selectedCategory])

//   // Pagination
//   const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
//   const startIndex = (currentPage - 1) * postsPerPage
//   const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)

//   // Reset to first page when filters change
//   useMemo(() => {
//     setCurrentPage(1)
//   }, [searchTerm, selectedCategory])

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       {/* Hero Section */}
//       <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white overflow-hidden">
//         {/* Background SVG Elements */}
//         <div className="absolute inset-0">
//           <svg
//             className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
//             width="400"
//             height="400"
//             viewBox="0 0 400 400"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
//             <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
//             <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
//           </svg>

//           <svg
//             className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
//             width="300"
//             height="300"
//             viewBox="0 0 300 300"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
//             <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
//           </svg>

//           <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
//           <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
//           <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
//         </div>

//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//           <div className="text-center">
//             <motion.h1
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6 }}
//               className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
//             >
//               PDFDEX Blog
//             </motion.h1>
//             <motion.p
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: 0.2 }}
//               className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
//             >
//               Tips, tutorials, and insights to help you master PDFDEX and document management
//             </motion.p>

//             {/* Search Bar */}
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: 0.4 }}
//               className="max-w-2xl mx-auto"
//             >
//               <div className="relative">
//                 <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search articles, tips, and tutorials..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-12 pr-4 py-4 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
//                 />
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* Category Filter */}
//       <section className="py-8 bg-gray-100 border-b border-gray-200">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-wrap gap-2 justify-center">
//             {categories.map((category) => (
//               <button
//                 key={category}
//                 onClick={() => setSelectedCategory(category)}
//                 className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
//                   }`}
//               >
//                 {category}
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Blog Posts */}
//       <section className="py-16">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           {currentPosts.length === 0 ? (
//             <div className="text-center py-16">
//               <h3 className="text-2xl font-semibold text-gray-900 mb-4">No articles found</h3>
//               <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {currentPosts.map((post, index) => (
//                 <motion.article
//                   key={post.id}
//                   initial={{ opacity: 0, y: 30 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.6, delay: index * 0.1 }}
//                   viewport={{ once: true }}
//                   className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
//                 >
//                   <div className="relative">
//                     <img
//                       src={post.image || "/placeholder.svg"}
//                       alt={post.title}
//                       className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                     <div className="absolute top-4 left-4">
//                       <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
//                         {post.category}
//                       </span>
//                     </div>
//                     {post.featured && (
//                       <div className="absolute top-4 right-4">
//                         <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
//                           Featured
//                         </span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="p-6">
//                     <div className="flex items-center text-sm text-gray-500 mb-3">
//                       <FiCalendar className="w-4 h-4 mr-1" />
//                       <span className="mr-4">{post.date}</span>
//                       <FiClock className="w-4 h-4 mr-1" />
//                       <span>{post.readTime}</span>
//                     </div>

//                     <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
//                       {post.title}
//                     </h3>

//                     <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>

//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center text-sm text-gray-500">
//                         <FiUser className="w-4 h-4 mr-1" />
//                         <span>{post.author}</span>
//                       </div>
//                       <Link href={`/blogs/${post.id}`} className="flex items-center text-blue-600 font-medium text-sm">
//                         Read More
//                         <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                         </svg>
//                       </Link>
//                     </div>

//                     {/* Tags */}
//                     <div className="flex flex-wrap gap-2 mt-4">
//                       {post.tags.slice(0, 3).map((tag) => (
//                         <span
//                           key={tag}
//                           className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
//                         >
//                           <FiTag className="w-3 h-3 mr-1" />
//                           {tag}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </motion.article>
//               ))}
//             </div>
//           )}

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6 }}
//               viewport={{ once: true }}
//               className="flex justify-center items-center mt-16 space-x-2"
//             >
//               <button
//                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                 disabled={currentPage === 1}
//                 className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <FiChevronLeft className="w-4 h-4 mr-1" />
//                 Previous
//               </button>

//               <div className="flex space-x-1">
//                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                   <button
//                     key={page}
//                     onClick={() => setCurrentPage(page)}
//                     className={`px-4 py-2 rounded-lg font-medium ${currentPage === page
//                         ? "bg-blue-600 text-white"
//                         : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
//                       }`}
//                   >
//                     {page}
//                   </button>
//                 ))}
//               </div>

//               <button
//                 onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
//                 disabled={currentPage === totalPages}
//                 className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Next
//                 <FiChevronRight className="w-4 h-4 ml-1" />
//               </button>
//             </motion.div>
//           )}
//         </div>
//       </section>
//     </div>
//   )
// }
