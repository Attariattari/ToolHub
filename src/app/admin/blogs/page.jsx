"use client"

import { useState, useEffect, useContext } from "react"
import {
  FaBlog,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaPlus,
  FaCheckCircle,
} from "react-icons/fa"
import StatCard from "@/components/admin/StatCard"
import TableCard from "@/components/admin/TableCard"
import Pagination from "@/components/admin/Pagination"
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal"
import Link from "next/link"
import { BlogsContext } from "@/context/Blog.context"
import useDebounce from "@/hooks/useDebounce"
import { UserContext } from "@/context/User.context"

export default function BlogsPage() {
  const { user } = useContext(UserContext)
  const {
    blogsData,
    fetchAllBlogs,
    deleteBlog,
    filters,
    updateFilters,
    resetFilters,
    pagination,
    setPagination,
    isLoading,
    hasAdminAccess
  } = useContext(BlogsContext)

  // Local state for search input
  const [searchInput, setSearchInput] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [blogToDelete, setBlogToDelete] = useState(null)

  // Debounced search value
  const debouncedSearch = useDebounce(searchInput, 500)

  // Update search filter when debounced value changes
  useEffect(() => {
    updateFilters({ search: debouncedSearch })
  }, [debouncedSearch])

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchInput(value)
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    updateFilters({ status: value })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle category filter change
  const handleCategoryFilterChange = (value) => {
    updateFilters({ category: value })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if(user){
      fetchAllBlogs(page, pagination.limit)
    }
  }

  // Handle delete blog
  const handleDeleteClick = (blog) => {
    setBlogToDelete(blog)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (blogToDelete) {
      const success = await deleteBlog(blogToDelete._id)
      if (success) {
        setShowDeleteModal(false)
        setBlogToDelete(null)
      }
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setBlogToDelete(null)
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("")
    resetFilters()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return <FaCheckCircle className="mr-1 text-green-600" size={12} />
      case "draft":
        return <FaEdit className="mr-1 text-yellow-600" size={12} />
      default:
        return <FaEdit className="mr-1 text-gray-500" size={12} />
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get unique categories for filter
  const uniqueCategories = [...new Set(blogsData.blogs.map(blog => blog.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your PDFDex blog posts and content</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/admin/blogs/create">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium">
              <FaPlus className="mr-2" size={14} />
              Create Post
            </button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={blogsData.stats.total.toString()}
          icon={<FaBlog className="text-blue-600" />}
          change="8%"
          changeType="increase"
          footer="This month"
        />
        <StatCard
          title="Published Posts"
          value={blogsData.stats.published.toString()}
          icon={<FaCheckCircle className="text-blue-600" />}
          change="12%"
          changeType="increase"
          footer="This month"
        />
        <StatCard
          title="Draft Posts"
          value={blogsData.stats.draft.toString()}
          icon={<FaEdit className="text-blue-600" />}
          change="2%"
          changeType="decrease"
          footer="This month"
        />
        <StatCard
          title="This Week Posts"
          value={blogsData.stats.thisWeek.toString()}
          icon={<FaBlog className="text-blue-600" />}
          change="15%"
          changeType="increase"
          footer="Posts uploaded"
        />
      </div>

      {/* Blog Posts Table */}
      <TableCard
        title="All Blog Posts"
        actions={
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={14} />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>

            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FaFilter className="text-gray-400" size={12} />
                </div>
              </div>
            )}
          </div>
        }
      >
        {/* Loading state */}
        {blogsData.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">Loading blogs...</span>
          </div>
        )}

        {/* Error state */}
        {blogsData.error && !blogsData.loading && (
          <div className="text-center py-12">
            <div className="text-blue-500 mb-2">Error loading blogs</div>
            <button
              onClick={() => fetchAllBlogs(pagination.page, pagination.limit)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Table content */}
        {!blogsData.loading && !blogsData.error && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blogsData.blogs.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last modified: {formatDateTime(post.updatedAt)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {post.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {post.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        post.status,
                      )}`}
                    >
                      {getStatusIcon(post.status)}
                      {post.status?.charAt(0).toUpperCase() + post.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
                        {post.author?.username?.charAt(0) || 'A'}
                      </div>
                      <span className="ml-2 text-sm text-gray-900">
                        {post.author?.username || 'Admin'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {post.status === 'published' && post.publishedAt ? (
                        <>
                          <p className="text-sm text-gray-900">{formatDate(post.publishedAt)}</p>
                          <p className="text-xs text-gray-500">Published</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-900">{formatDate(post.createdAt)}</p>
                          <p className="text-xs text-gray-500">Created</p>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {/* View button */}
                      {post.status === 'published' && (
                        <Link href={`/blogs/${post.slug}`} target="_blank">
                          <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                            <FaEye size={14} />
                          </button>
                        </Link>
                      )}

                      {/* Edit button */}
                      <Link href={`/admin/blogs/update/${post._id}`}>
                        <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                          <FaEdit size={14} />
                        </button>
                      </Link>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteClick(post)}
                        disabled={isLoading}
                        className="p-1 rounded-md hover:bg-gray-100 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Empty state */}
        {!blogsData.loading && !blogsData.error && blogsData.blogs.length === 0 && (
          <div className="text-center py-12">
            <FaBlog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchInput || filters.status !== "all" || filters.category !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first blog post."}
            </p>
            {!searchInput && filters.status === "all" && filters.category === "all" && (
              <div className="mt-6">
                <Link href="/admin/blogs/create">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center mx-auto">
                    <FaPlus className="mr-2" size={14} />
                    Create Your First Post
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </TableCard>

      {/* Pagination */}
      {!blogsData.loading && blogsData.blogs.length > 0 && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Clear filters option */}
      {(searchInput || filters.status !== "all" || filters.category !== "all") &&
        !blogsData.loading && blogsData.blogs.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Clear all filters
            </button>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${blogToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isLoading}
      />
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import {
//   FaBlog,
//   FaEdit,
//   FaTrash,
//   FaEye,
//   FaSearch,
//   FaFilter,
//   FaPlus,
//   FaCheckCircle,
//   FaTimesCircle,
// } from "react-icons/fa"
// import StatCard from "@/components/admin/StatCard"
// import TableCard from "@/components/admin/TableCard"
// import Pagination from "@/components/admin/Pagination"
// import Link from "next/link"

// export default function BlogsPage() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState("all")
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 5 // You can adjust this

//   // Sample blog posts data (expanded for pagination demo)
//   const blogPosts = [
//     {
//       id: 1,
//       title: "10 Best PDF Compression Techniques for 2024",
//       author: "Admin",
//       status: "Published",
//       category: "Tips & Tricks",
//       publishDate: "2024-01-15",
//       lastModified: "2024-01-15 14:30",
//     },
//     {
//       id: 2,
//       title: "How to Secure Your PDF Documents Effectively",
//       author: "Admin",
//       status: "Published",
//       category: "Security",
//       publishDate: "2024-01-12",
//       lastModified: "2024-01-12 16:45",
//     }
//   ]

//   // Filter posts based on search and status
//   const filteredPosts = blogPosts.filter((post) => {
//     const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesStatus = statusFilter === "all" || post.status.toLowerCase() === statusFilter.toLowerCase()
//     return matchesSearch && matchesStatus
//   })

//   // Calculate pagination
//   const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentPosts = filteredPosts.slice(startIndex, endIndex)

//   // Reset to first page when filters change
//   const handleSearchChange = (value) => {
//     setSearchTerm(value)
//     setCurrentPage(1)
//   }

//   const handleStatusFilterChange = (value) => {
//     setStatusFilter(value)
//     setCurrentPage(1)
//   }

//   // Calculate stats
//   const totalPosts = blogPosts.length
//   const publishedPosts = blogPosts.filter((post) => post.status === "Published").length
//   const draftPosts = blogPosts.filter((post) => post.status === "Draft").length

//   // Calculate last week posts (posts from last 7 days)
//   const lastWeekPosts = blogPosts.filter((post) => {
//     if (!post.publishDate) return false
//     const postDate = new Date(post.publishDate)
//     const weekAgo = new Date()
//     weekAgo.setDate(weekAgo.getDate() - 7)
//     return postDate >= weekAgo
//   }).length

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "Published":
//         return <FaCheckCircle className="mr-1 text-green-600" size={12} />
//       case "Draft":
//         return <FaEdit className="mr-1 text-yellow-600" size={12} />
//       default:
//         return <FaTimesCircle className="mr-1 text-gray-500" size={12} />
//     }
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Published":
//         return "bg-green-100 text-green-800"
//       case "Draft":
//         return "bg-yellow-100 text-yellow-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
//           <p className="mt-1 text-sm text-gray-500">Manage your PDFDex blog posts and content</p>
//         </div>
//         <div className="mt-4 md:mt-0">
//           <Link href="/admin/blogs/create">
//             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium">
//               <FaPlus className="mr-2" size={14} />
//               Create Post
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* Stats grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Posts"
//           value={totalPosts.toString()}
//           icon={<FaBlog className="text-blue-600" />}
//           change="8%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Published Posts"
//           value={publishedPosts.toString()}
//           icon={<FaCheckCircle className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Drafts Posts"
//           value={draftPosts.toString()}
//           icon={<FaEdit className="text-blue-600" />}
//           change="2%"
//           changeType="decrease"
//           footer="This month"
//         />
//         <StatCard
//           title="Last Week Posts"
//           value={lastWeekPosts.toString()}
//           icon={<FaBlog className="text-blue-600" />}
//           change="15%"
//           changeType="increase"
//           footer="Posts uploaded"
//         />
//       </div>

//       {/* Blog Posts Table */}
//       <TableCard
//         title="All Blog Posts"
//         actions={
//           <div className="flex items-center space-x-3">
//             {/* Search */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search posts..."
//                 value={searchTerm}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//               />
//               <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//                 <FaSearch className="text-gray-400" size={14} />
//               </div>
//             </div>
//             {/* Status Filter */}
//             <div className="relative">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => handleStatusFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="all">All Status</option>
//                 <option value="published">Published</option>
//                 <option value="draft">Draft</option>
//               </select>
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                 <FaFilter className="text-gray-400" size={12} />
//               </div>
//             </div>
//           </div>
//         }
//       >
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Category
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {currentPosts.map((post) => (
//               <tr key={post.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4">
//                   <div>
//                     <p className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</p>
//                     <p className="text-xs text-gray-500 mt-1">Last modified: {post.lastModified}</p>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                     {post.category}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
//                       post.status,
//                     )}`}
//                   >
//                     {getStatusIcon(post.status)}
//                     {post.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">
//                       {post.author.charAt(0)}
//                     </div>
//                     <span className="ml-2 text-sm text-gray-900">{post.author}</span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div>
//                     {post.publishDate ? (
//                       <>
//                         <p className="text-sm text-gray-900">{post.publishDate}</p>
//                         <p className="text-xs text-gray-500">Published</p>
//                       </>
//                     ) : (
//                       <p className="text-sm text-gray-500">Not published</p>
//                     )}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center space-x-2">
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
//                       <FaEye size={14} />
//                     </button>
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
//                       <FaEdit size={14} />
//                     </button>
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-blue-500 hover:text-blue-700">
//                       <FaTrash size={14} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Empty state */}
//         {currentPosts.length === 0 && (
//           <div className="text-center py-12">
//             <FaBlog className="mx-auto h-12 w-12 text-gray-400" />
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No posts found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               {searchTerm || statusFilter !== "all"
//                 ? "Try adjusting your search or filter criteria."
//                 : "Get started by creating your first blog post."}
//             </p>
//             {!searchTerm && statusFilter === "all" && (
//               <div className="mt-6">
//                 <Link href="/admin/blogs/create">
//                   <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center mx-auto">
//                     <FaPlus className="mr-2" size={14} />
//                     Create Your First Post
//                   </button>
//                 </Link>
//               </div>
//             )}
//           </div>
//         )}
//       </TableCard>

//       {/* Pagination */}
//       {filteredPosts.length > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           totalItems={filteredPosts.length}
//           itemsPerPage={itemsPerPage}
//           onPageChange={setCurrentPage}
//         />
//       )}

//       {/* Clear filters option */}
//       {(searchTerm || statusFilter !== "all") && filteredPosts.length > 0 && (
//         <div className="text-center">
//           <button
//             onClick={() => {
//               setSearchTerm("")
//               setStatusFilter("all")
//               setCurrentPage(1)
//             }}
//             className="text-sm text-blue-600 hover:text-blue-700 underline"
//           >
//             Clear all filters
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }
