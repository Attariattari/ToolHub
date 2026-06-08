"use client"

import { useState, useContext } from "react"
import { FaTimes, FaReply, FaEnvelope, FaUser, FaCalendar, FaCheckCircle, FaClock } from "react-icons/fa"
import { InquiriesContext } from "@/context/Inquiries.context"

export default function InquiryModal({ inquiry, isOpen, onClose }) {
  const { markAsReplied, isLoading } = useContext(InquiriesContext)
  const [selectedInquiry, setSelectedInquiry] = useState(inquiry)

  if (!isOpen || !inquiry) return null

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date'

      // Format: Jan 29, 2024 at 2:30 PM
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }

      return date.toLocaleDateString('en-US', options).replace(',', ' at')
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const handleReply = async () => {
    const subject = `Re: ${inquiry.subject}`
    const body = `Hello ${inquiry.firstName},\n\nThank you for contacting us regarding "${inquiry.subject}".\n\n\n\nBest regards,\nPDFDex Support Team`

    const mailtoLink = `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, "_blank")

    // Mark as replied after opening email client
    if (!inquiry.isReplied) {
      const updatedInquiry = await markAsReplied(inquiry._id)
      if (updatedInquiry) {
        setSelectedInquiry(updatedInquiry)
      }
    }
  }

  const getStatusBadge = (isRead, isReplied) => {
    if (isReplied) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" size={12} />
          Replied
        </span>
      )
    } else if (isRead) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FaEnvelope className="mr-1" size={12} />
          Read
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FaClock className="mr-1" size={12} />
          Unread
        </span>
      )
    }
  }

  // Use selectedInquiry for displaying data (gets updated after API calls)
  const currentInquiry = selectedInquiry || inquiry

  return (
    <div className="fixed inset-0 top-[-30px] bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {currentInquiry.firstName.charAt(0)}
              {currentInquiry.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Inquiry Details</h2>
              <p className="text-sm text-gray-500">
                From {currentInquiry.firstName} {currentInquiry.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar max-h-[calc(90vh-200px)]">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="flex items-center space-x-2">
                  <FaUser className="text-gray-400" size={14} />
                  <span className="text-sm text-gray-900">
                    {currentInquiry.firstName} {currentInquiry.lastName}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="flex items-center space-x-2">
                  <FaEnvelope className="text-gray-400" size={14} />
                  <span className="text-sm text-gray-900">{currentInquiry.email}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Submitted</label>
                <div className="flex items-center space-x-2">
                  <FaCalendar className="text-gray-400" size={14} />
                  <span className="text-sm text-gray-900">{formatDate(currentInquiry.createdAt)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div>{getStatusBadge(currentInquiry.isRead, currentInquiry.isReplied)}</div>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">{currentInquiry.subject}</p>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{currentInquiry.message}</p>
            </div>
          </div>

          {/* Reply Information */}
          {currentInquiry.isReplied && currentInquiry.repliedAt && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <FaCheckCircle className="text-green-600" size={16} />
                <span className="text-sm font-medium text-green-800">Reply Sent</span>
              </div>
              <p className="text-sm text-green-700">Replied on {formatDate(currentInquiry.repliedAt)}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleReply}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center focus:outline-none disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <FaReply className="mr-2" size={14} />
                Reply via Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}



// "use client"

// import { FaTimes, FaReply, FaEnvelope, FaUser, FaCalendar, FaCheckCircle, FaClock } from "react-icons/fa"

// export default function InquiryModal({ inquiry, isOpen, onClose }) {
//   if (!isOpen || !inquiry) return null

//   const handleReply = () => {
//     const subject = `Re: ${inquiry.subject}`
//     const body = `Hello ${inquiry.firstName},\n\nThank you for contacting us regarding "${inquiry.subject}".\n\n\n\nBest regards,\nPDFDex Support Team`

//     const mailtoLink = `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
//     window.open(mailtoLink, "_blank")
//   }

//   const getStatusBadge = (isRead, isReplied) => {
//     if (isReplied) {
//       return (
//         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//           <FaCheckCircle className="mr-1" size={12} />
//           Replied
//         </span>
//       )
//     } else if (isRead) {
//       return (
//         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//           <FaEnvelope className="mr-1" size={12} />
//           Read
//         </span>
//       )
//     } else {
//       return (
//         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
//           <FaClock className="mr-1" size={12} />
//           Unread
//         </span>
//       )
//     }
//   }

//   return (
//     <div className="fixed inset-0 top-[-30px] bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
//         {/* Modal Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
//               {inquiry.firstName.charAt(0)}
//               {inquiry.lastName.charAt(0)}
//             </div>
//             <div>
//               <h2 className="text-lg font-semibold text-gray-900">Contact Inquiry Details</h2>
//               <p className="text-sm text-gray-500">
//                 From {inquiry.firstName} {inquiry.lastName}
//               </p>
//             </div>
//           </div>
//           <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
//             <FaTimes size={16} />
//           </button>
//         </div>

//         {/* Modal Body */}
//         <div className="p-6 overflow-y-auto custom-scrollbar max-h-[calc(90vh-200px)]">
//           {/* Contact Information */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
//                 <div className="flex items-center space-x-2">
//                   <FaUser className="text-gray-400" size={14} />
//                   <span className="text-sm text-gray-900">
//                     {inquiry.firstName} {inquiry.lastName}
//                   </span>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
//                 <div className="flex items-center space-x-2">
//                   <FaEnvelope className="text-gray-400" size={14} />
//                   <span className="text-sm text-gray-900">{inquiry.email}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Date Submitted</label>
//                 <div className="flex items-center space-x-2">
//                   <FaCalendar className="text-gray-400" size={14} />
//                   <span className="text-sm text-gray-900">{inquiry.createdAt}</span>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                 <div>{getStatusBadge(inquiry.isRead, inquiry.isReplied)}</div>
//               </div>
//             </div>
//           </div>

//           {/* Subject */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
//             <div className="bg-gray-50 rounded-md p-3">
//               <p className="text-sm font-medium text-gray-900">{inquiry.subject}</p>
//             </div>
//           </div>

//           {/* Message */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
//             <div className="bg-gray-50 rounded-md p-4">
//               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
//             </div>
//           </div>

//           {/* Reply Information */}
//           {inquiry.isReplied && inquiry.repliedAt && (
//             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
//               <div className="flex items-center space-x-2 mb-2">
//                 <FaCheckCircle className="text-green-600" size={16} />
//                 <span className="text-sm font-medium text-green-800">Reply Sent</span>
//               </div>
//               <p className="text-sm text-green-700">Replied on {inquiry.repliedAt}</p>
//             </div>
//           )}
//         </div>

//         {/* Modal Footer */}
//         <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500"
//           >
//             Close
//           </button>
//           <button
//             onClick={handleReply}
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center focus:outline-none"
//           >
//             <FaReply className="mr-2" size={14} />
//             Reply via Email
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
