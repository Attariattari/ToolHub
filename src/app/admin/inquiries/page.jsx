"use client"

import { useState, useContext, useEffect } from "react"
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaClock,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa"
import StatCard from "@/components/admin/StatCard"
import TableCard from "@/components/admin/TableCard"
import Pagination from "@/components/admin/Pagination"
import InquiryModal from "@/components/admin/InquiryModal"
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal"
import { InquiriesContext } from "@/context/Inquiries.context"
import useDebounce from "@/hooks/useDebounce" // Import your debounce hook

export default function ContactInquiriesPage() {
  const {
    inquiriesQuery,
    filters,
    pagination,
    isLoading,
    updateFilters,
    updatePagination,
    markAsRead,
    markAsReplied,
    deleteInquiry,
    clearFilters
  } = useContext(InquiriesContext)

  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    inquiryId: null
  })

  // Local search state for immediate UI updates
  const [searchTerm, setSearchTerm] = useState(filters.search || "")

  // Debounced search value
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Sync local state with filters when filters change externally (like clear filters)
  useEffect(() => {
    setSearchTerm(filters.search || "")
  }, [filters.search])

  // Update filters when debounced search term changes
  useEffect(() => {
    // Only update if the debounced value is different from current filter
    if (debouncedSearchTerm !== filters.search) {
      updateFilters({ search: debouncedSearchTerm })
    }
  }, [debouncedSearchTerm]) // Remove updateFilters from dependency array

  const handleSearchChange = (value) => {
    setSearchTerm(value) // Update local state immediately for responsive UI
  }

  const handleReadFilterChange = (value) => {
    updateFilters({ isRead: value })
  }

  const handleReplyFilterChange = (value) => {
    updateFilters({ isReplied: value })
  }

  const handleViewInquiry = async (inquiry) => {
    // Mark as read when viewing if not already read
    if (!inquiry.isRead) {
      const updatedInquiry = await markAsRead(inquiry._id)
      // Use updated inquiry from API response for the modal
      setSelectedInquiry(updatedInquiry || { ...inquiry, isRead: true })
    } else {
      setSelectedInquiry(inquiry)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedInquiry(null)
  }

  const handleDeleteClick = (inquiryId) => {
    setDeleteModal({
      isOpen: true,
      inquiryId
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteModal.inquiryId) {
      await deleteInquiry(deleteModal.inquiryId)
      setDeleteModal({ isOpen: false, inquiryId: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, inquiryId: null })
  }

  const handlePageChange = (page) => {
    updatePagination({ page })
  }

  // Get stats from backend data
  const stats = inquiriesQuery.stats;

  const getReadStatusIcon = (isRead) => {
    return isRead ? (
      <FaEnvelopeOpen className="mr-1 text-blue-600" size={12} />
    ) : (
      <FaEnvelope className="mr-1 text-gray-600" size={12} />
    )
  }

  const getReadStatusColor = (isRead) => {
    return isRead ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
  }

  const getReplyStatusIcon = (isReplied) => {
    return isReplied ? (
      <FaCheckCircle className="mr-1 text-green-600" size={12} />
    ) : (
      <FaClock className="mr-1 text-yellow-600" size={12} />
    )
  }

  const getReplyStatusColor = (isReplied) => {
    return isReplied ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  const truncateMessage = (message, maxLength = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date'

      // Format: Jan 29, 2024
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }

      return date.toLocaleDateString('en-US', options)
    } catch (error) {
      return 'Invalid Date'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer inquiries and support requests</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inquiries"
          value={stats.total.toString()}
          icon={<FaEnvelope className="text-blue-600" />}
          change="15%"
          changeType="increase"
          footer="This month"
        />
        <StatCard
          title="Unread Inquiries"
          value={stats.unread.toString()}
          icon={<FaExclamationCircle className="text-blue-600" />}
          change="8%"
          changeType="decrease"
          footer="Need attention"
        />
        <StatCard
          title="Pending Replies"
          value={stats.unreplied.toString()}
          icon={<FaClock className="text-blue-600" />}
          change="12%"
          changeType="increase"
          footer="Awaiting response"
        />
        <StatCard
          title="This Week Inquiries"
          value={stats.thisWeek.toString()}
          icon={<FaEnvelopeOpen className="text-blue-600" />}
          change="22%"
          changeType="increase"
          footer="New inquiries"
        />
      </div>

      {/* Inquiries Table */}
      <TableCard
        title="All Contact Inquiries"
        actions={
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={14} />
              </div>
            </div>
            {/* Read Status Filter */}
            <div className="relative">
              <select
                value={filters.isRead}
                onChange={(e) => handleReadFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
            {/* Reply Status Filter */}
            <div className="relative">
              <select
                value={filters.isReplied}
                onChange={(e) => handleReplyFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Replies</option>
                <option value="replied">Replied</option>
                <option value="pending">Pending</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
          </div>
        }
      >
        {inquiriesQuery.loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
            <span className="ml-2 text-gray-600">Loading inquiries...</span>
          </div>
        ) : inquiriesQuery.error ? (
          <div className="text-center py-12">
            <FaExclamationCircle className="mx-auto h-12 w-12 text-blue-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading inquiries</h3>
            <p className="mt-1 text-sm text-gray-500">{inquiriesQuery.error}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reply</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inquiriesQuery.inquiries.map((inquiry) => (
                <tr key={inquiry._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inquiry.firstName} {inquiry.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{inquiry.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs">{inquiry.subject}</div>
                  </td>
                  <td className="px-6 py-4 w-96">
                    <div className="text-sm text-gray-600 max-w-sm line-clamp-2">{truncateMessage(inquiry.message)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReadStatusColor(
                        inquiry.isRead,
                      )}`}
                    >
                      {getReadStatusIcon(inquiry.isRead)}
                      {inquiry.isRead ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReplyStatusColor(
                        inquiry.isReplied,
                      )}`}
                    >
                      {getReplyStatusIcon(inquiry.isReplied)}
                      {inquiry.isReplied ? "Replied" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{formatDate(inquiry.createdAt)}</p>
                      {/* <p className="text-xs text-gray-500">{inquiry.createdAt.split(" ")[1]}</p> */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewInquiry(inquiry)}
                        disabled={isLoading}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(inquiry._id)}
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
        {!inquiriesQuery.loading && !inquiriesQuery.error && inquiriesQuery.inquiries.length === 0 && (
          <div className="text-center py-12">
            <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inquiries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filters.isRead !== "all" || filters.isReplied !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No contact inquiries have been received yet."}
            </p>
          </div>
        )}
      </TableCard>

      {/* Pagination */}
      {!inquiriesQuery.loading && pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Clear filters option */}
      {(searchTerm || filters.isRead !== "all" || filters.isReplied !== "all") && !inquiriesQuery.loading && (
        <div className="text-center">
          <button
            onClick={() => {
              setSearchTerm("") // Clear local search state
              clearFilters()
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {isModalOpen && selectedInquiry && (
        <InquiryModal
          inquiry={selectedInquiry}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onMarkAsReplied={markAsReplied}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Inquiry"
        message="Are you sure you want to delete this inquiry? This action cannot be undone."
        confirmText="Delete"
        isLoading={isLoading}
      />
    </div>
  )
}


// "use client"

// import { useState } from "react"
// import {
//   FaEnvelope,
//   FaEnvelopeOpen,
//   FaClock,
//   FaTrash,
//   FaEye,
//   FaSearch,
//   FaFilter,
//   FaExclamationCircle,
//   FaCheckCircle,
// } from "react-icons/fa"
// import StatCard from "@/components/admin/StatCard"
// import TableCard from "@/components/admin/TableCard"
// import Pagination from "@/components/admin/Pagination"
// import InquiryModal from "@/components/admin/InquiryModal"

// export default function ContactInquiriesPage() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [readFilter, setReadFilter] = useState("all")
//   const [replyFilter, setReplyFilter] = useState("all")
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 8

//   const [selectedInquiry, setSelectedInquiry] = useState(null)
//   const [isModalOpen, setIsModalOpen] = useState(false)

//   // Sample contact inquiries data
//   const inquiries = [
//     {
//       id: 1,
//       firstName: "John",
//       lastName: "Doe",
//       email: "john.doe@example.com",
//       subject: "PDF Compression Issue",
//       message:
//         "I'm having trouble compressing my PDF files. The quality seems to be degrading too much when I use your compression tool. Can you help me with better settings?",
//       isRead: true,
//       isReplied: true,
//       createdAt: "2024-01-29 14:30",
//       repliedAt: "2024-01-29 16:45",
//     },
//     {
//       id: 2,
//       firstName: "Sarah",
//       lastName: "Wilson",
//       email: "sarah.wilson@gmail.com",
//       subject: "Feature Request - Batch Processing",
//       message:
//         "Hi, I love your PDF tools! Would it be possible to add batch processing for multiple files? This would save me a lot of time for my work projects.",
//       isRead: true,
//       isReplied: false,
//       createdAt: "2024-01-29 12:15",
//       repliedAt: null,
//     },
//   ]

//   // Filter inquiries based on search, read status, and reply status
//   const filteredInquiries = inquiries.filter((inquiry) => {
//     const matchesSearch =
//       inquiry.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inquiry.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase())

//     const matchesRead =
//       readFilter === "all" || (readFilter === "read" && inquiry.isRead) || (readFilter === "unread" && !inquiry.isRead)

//     const matchesReply =
//       replyFilter === "all" ||
//       (replyFilter === "replied" && inquiry.isReplied) ||
//       (replyFilter === "pending" && !inquiry.isReplied)

//     return matchesSearch && matchesRead && matchesReply
//   })

//   // Calculate pagination
//   const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentInquiries = filteredInquiries.slice(startIndex, endIndex)

//   // Reset to first page when filters change
//   const handleSearchChange = (value) => {
//     setSearchTerm(value)
//     setCurrentPage(1)
//   }

//   const handleReadFilterChange = (value) => {
//     setReadFilter(value)
//     setCurrentPage(1)
//   }

//   const handleReplyFilterChange = (value) => {
//     setReplyFilter(value)
//     setCurrentPage(1)
//   }

//   const handleViewInquiry = (inquiry) => {
//     setSelectedInquiry(inquiry)
//     setIsModalOpen(true)
//   }

//   const handleCloseModal = () => {
//     setIsModalOpen(false)
//     setSelectedInquiry(null)
//   }

//   // Calculate stats
//   const totalInquiries = inquiries.length
//   const unreadInquiries = inquiries.filter((inquiry) => !inquiry.isRead).length
//   const pendingReplies = inquiries.filter((inquiry) => !inquiry.isReplied).length

//   // Calculate this week's inquiries
//   const thisWeekInquiries = inquiries.filter((inquiry) => {
//     const inquiryDate = new Date(inquiry.createdAt)
//     const weekAgo = new Date()
//     weekAgo.setDate(weekAgo.getDate() - 7)
//     return inquiryDate >= weekAgo
//   }).length

//   const getReadStatusIcon = (isRead) => {
//     return isRead ? (
//       <FaEnvelopeOpen className="mr-1 text-blue-600" size={12} />
//     ) : (
//       <FaEnvelope className="mr-1 text-gray-600" size={12} />
//     )
//   }

//   const getReadStatusColor = (isRead) => {
//     return isRead ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
//   }

//   const getReplyStatusIcon = (isReplied) => {
//     return isReplied ? (
//       <FaCheckCircle className="mr-1 text-green-600" size={12} />
//     ) : (
//       <FaClock className="mr-1 text-yellow-600" size={12} />
//     )
//   }

//   const getReplyStatusColor = (isReplied) => {
//     return isReplied ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
//   }

//   const truncateMessage = (message, maxLength = 80) => {
//     return message.length > maxLength ? message.substring(0, maxLength) + "..." : message
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Contact Inquiries</h1>
//           <p className="mt-1 text-sm text-gray-500">Manage customer inquiries and support requests</p>
//         </div>
//       </div>

//       {/* Stats grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Inquiries"
//           value={totalInquiries.toString()}
//           icon={<FaEnvelope className="text-blue-600" />}
//           change="15%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Unread Inquiries"
//           value={unreadInquiries.toString()}
//           icon={<FaExclamationCircle className="text-blue-600" />}
//           change="8%"
//           changeType="decrease"
//           footer="Need attention"
//         />
//         <StatCard
//           title="Pending Replies"
//           value={pendingReplies.toString()}
//           icon={<FaClock className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer="Awaiting response"
//         />
//         <StatCard
//           title="This Week Inquiries"
//           value={thisWeekInquiries.toString()}
//           icon={<FaEnvelopeOpen className="text-blue-600" />}
//           change="22%"
//           changeType="increase"
//           footer="New inquiries"
//         />
//       </div>

//       {/* Inquiries Table */}
//       <TableCard
//         title="All Contact Inquiries"
//         actions={
//           <div className="flex items-center space-x-3">
//             {/* Search */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search inquiries..."
//                 value={searchTerm}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//               />
//               <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//                 <FaSearch className="text-gray-400" size={14} />
//               </div>
//             </div>
//             {/* Read Status Filter */}
//             <div className="relative">
//               <select
//                 value={readFilter}
//                 onChange={(e) => handleReadFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="all">All Status</option>
//                 <option value="read">Read</option>
//                 <option value="unread">Unread</option>
//               </select>
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                 <FaFilter className="text-gray-400" size={12} />
//               </div>
//             </div>
//             {/* Reply Status Filter */}
//             <div className="relative">
//               <select
//                 value={replyFilter}
//                 onChange={(e) => handleReplyFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="all">All Replies</option>
//                 <option value="replied">Replied</option>
//                 <option value="pending">Pending</option>
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
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Contact
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Subject
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Message
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reply</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {currentInquiries.map((inquiry) => (
//               <tr key={inquiry.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4">
//                   <div>
//                     <p className="text-sm font-medium text-gray-900">
//                       {inquiry.firstName} {inquiry.lastName}
//                     </p>
//                     <p className="text-xs text-gray-500">{inquiry.email}</p>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4">
//                   <div className="text-sm font-medium text-gray-900 max-w-xs">{inquiry.subject}</div>
//                 </td>
//                 <td className="px-6 py-4">
//                   <div className="text-sm text-gray-600 max-w-sm">{truncateMessage(inquiry.message)}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReadStatusColor(
//                       inquiry.isRead,
//                     )}`}
//                   >
//                     {getReadStatusIcon(inquiry.isRead)}
//                     {inquiry.isRead ? "Read" : "Unread"}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReplyStatusColor(
//                       inquiry.isReplied,
//                     )}`}
//                   >
//                     {getReplyStatusIcon(inquiry.isReplied)}
//                     {inquiry.isReplied ? "Replied" : "Pending"}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div>
//                     <p className="text-sm text-gray-900">{inquiry.createdAt.split(" ")[0]}</p>
//                     <p className="text-xs text-gray-500">{inquiry.createdAt.split(" ")[1]}</p>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => handleViewInquiry(inquiry)}
//                       className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
//                     >
//                       <FaEye size={14} />
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
//         {currentInquiries.length === 0 && (
//           <div className="text-center py-12">
//             <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No inquiries found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               {searchTerm || readFilter !== "all" || replyFilter !== "all"
//                 ? "Try adjusting your search or filter criteria."
//                 : "No contact inquiries have been received yet."}
//             </p>
//           </div>
//         )}
//       </TableCard>

//       {/* Pagination */}
//       {filteredInquiries.length > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           totalItems={filteredInquiries.length}
//           itemsPerPage={itemsPerPage}
//           onPageChange={setCurrentPage}
//         />
//       )}

//       {/* Clear filters option */}
//       {(searchTerm || readFilter !== "all" || replyFilter !== "all") && filteredInquiries.length > 0 && (
//         <div className="text-center">
//           <button
//             onClick={() => {
//               setSearchTerm("")
//               setReadFilter("all")
//               setReplyFilter("all")
//               setCurrentPage(1)
//             }}
//             className="text-sm text-blue-600 hover:text-blue-700 underline"
//           >
//             Clear all filters
//           </button>
//         </div>
//       )}

//       {/* Inquiry Detail Modal */}
//       {isModalOpen && selectedInquiry && (
//         <InquiryModal inquiry={selectedInquiry} isOpen={isModalOpen} onClose={handleCloseModal} />
//       )}
//     </div>
//   )
// }
