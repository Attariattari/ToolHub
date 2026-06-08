"use client"

import { useState, useEffect } from 'react'
import { FaDownload, FaFileAlt, FaImage, FaFilePdf, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import Pagination from '@/components/admin/Pagination'
import { useTask } from '@/context/Task.context'
import { toast } from 'react-toastify'
import { API_URL } from '@/constants/constants'


export default function UserTasks() {
  const {
    tasks,
    pagination,
    loading,
    error,
    currentPage,
    user,
    handlePageChange,
    clearError
  } = useTask();

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-600" size={16} />
      case 'processing':
        return <FaSpinner className="text-blue-600 animate-spin" size={16} />
      case 'failed':
        return <FaTimesCircle className="text-blue-600" size={16} />
      case 'pending':
        return <FaClock className="text-yellow-600" size={16} />
      case 'deleted':
        return <FaTimesCircle className="text-gray-600" size={16} />
      default:
        return <FaClock className="text-gray-600" size={16} />
    }
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </span>
    )
  }

  const getToolIcon = (toolType) => {
    if (!toolType) return <FaFileAlt className="text-gray-600" size={16} />

    if (toolType.toLowerCase().includes('pdf')) {
      return <FaFilePdf className="text-blue-600" size={16} />
    } else if (toolType.toLowerCase().includes('image')) {
      return <FaImage className="text-blue-600" size={16} />
    }
    return <FaFileAlt className="text-gray-600" size={16} />
  }

  const handleDownloadError = (taskId, fileName) => {
    console.error('Download failed for task:', taskId);
    toast.error(`Failed to download ${fileName}. Please try again later.`);
  }

  const handleRetry = () => {
    clearError();
    // Context will automatically fetch tasks when user is available
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-8 text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">Error Loading Tasks</h3>
            <p className="text-blue-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-2">View and download your completed tasks (Last 30 days)</p>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Task History</h3>
              {pagination.totalItems > 0 && (
                <span className="text-sm text-gray-500">
                  {pagination.totalItems} total tasks
                </span>
              )}
            </div>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="p-12 text-center">
              <FaSpinner className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading tasks...</h3>
              <p className="text-gray-500">Please wait while we fetch your tasks.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">You haven't completed any tasks in the last 30 days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool & Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getToolIcon(task.toolType)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {task.toolType}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {task.taskType?.replace(/_/g, ' ') || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {task.originalFiles?.length || 0} file{(task.originalFiles?.length || 0) > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: {formatFileSize(
                              task.originalFiles?.reduce((sum, file) => sum + (file.size || 0), 0) || 0
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(task.status)}
                        {task.error && (
                          <div className="text-xs text-blue-600 mt-1 max-w-xs truncate" title={task.error}>
                            {task.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(task.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.status === 'deleted' ? (
                          <span className="text-blue-500 font-medium">File Deleted</span>
                        ) : task.resultFile ? (
                          <div>
                            <div className="font-medium max-w-xs truncate" title={task.resultFile.name}>
                              {task.resultFile.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(task.resultFile.size)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No result</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {task.status === 'completed' && task.resultFile && task.status !== 'deleted' ? (
                          <a
                            href={`${API_URL}/api/v1/tasks/download/${task._id}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onError={() => handleDownloadError(task._id, task.resultFile?.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FaDownload className="mr-2" size={12} />
                            Download
                          </a>
                        ) : task.status === 'deleted' ? (
                          <span className="text-blue-500 font-medium">Deleted</span>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Loading overlay for pagination */}
              {loading && tasks.length > 0 && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                  <FaSpinner className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}


// "use client"

// import { useState } from 'react'
// import { FaDownload, FaFileAlt, FaImage, FaFilePdf, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa'
// import Pagination from '@/components/admin/Pagination'

// export default function UserTasks() {
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 10

//   // Dummy data based on ToolTask schema
//   const allTasks = [
//     {
//       id: '1',
//       userId: 'user123',
//       toolType: 'PDF Tools',
//       taskType: 'merge',
//       originalFiles: [
//         { name: 'document1.pdf', path: '/uploads/doc1.pdf', size: 2048000 },
//         { name: 'document2.pdf', path: '/uploads/doc2.pdf', size: 1536000 }
//       ],
//       resultFile: {
//         name: 'merged_document.pdf',
//         path: '/results/merged_doc.pdf',
//         size: 3584000
//       },
//       startTime: new Date('2024-01-15T10:30:00'),
//       estimatedTime: 30,
//       status: 'completed',
//       createdAt: new Date('2024-01-15T10:30:00'),
//       updatedAt: new Date('2024-01-15T10:30:30')
//     },
//     {
//       id: '2',
//       userId: 'user123',
//       toolType: 'Image Tools',
//       taskType: 'compress',
//       originalFiles: [
//         { name: 'photo1.jpg', path: '/uploads/photo1.jpg', size: 5242880 },
//         { name: 'photo2.png', path: '/uploads/photo2.png', size: 3145728 }
//       ],
//       resultFile: {
//         name: 'compressed_images.zip',
//         path: '/results/compressed.zip',
//         size: 2097152
//       },
//       startTime: new Date('2024-01-15T09:15:00'),
//       estimatedTime: 45,
//       status: 'completed',
//       createdAt: new Date('2024-01-15T09:15:00'),
//       updatedAt: new Date('2024-01-15T09:15:45')
//     }
//   ]

//   // Filter out deleted tasks
//   const tasks = allTasks.filter(task => task.status !== 'deleted')

//   // Pagination logic
//   const totalItems = tasks.length
//   const totalPages = Math.ceil(totalItems / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentTasks = tasks.slice(startIndex, endIndex)

//   const handlePageChange = (page) => {
//     setCurrentPage(page)
//   }

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes'
//     const k = 1024
//     const sizes = ['Bytes', 'KB', 'MB', 'GB']
//     const i = Math.floor(Math.log(bytes) / Math.log(k))
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
//   }

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'completed':
//         return <FaCheckCircle className="text-green-600" size={16} />
//       case 'processing':
//         return <FaSpinner className="text-blue-600 animate-spin" size={16} />
//       case 'failed':
//         return <FaTimesCircle className="text-blue-600" size={16} />
//       case 'pending':
//         return <FaClock className="text-yellow-600" size={16} />
//       default:
//         return <FaClock className="text-gray-600" size={16} />
//     }
//   }

//   const getStatusBadge = (status) => {
//     const statusClasses = {
//       completed: 'bg-green-100 text-green-800',
//       processing: 'bg-blue-100 text-blue-800',
//       failed: 'bg-blue-100 text-blue-800',
//       pending: 'bg-yellow-100 text-yellow-800'
//     }

//     return (
//       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
//         {getStatusIcon(status)}
//         <span className="ml-1 capitalize">{status}</span>
//       </span>
//     )
//   }

//   const getToolIcon = (toolType) => {
//     if (toolType.toLowerCase().includes('pdf')) {
//       return <FaFilePdf className="text-blue-600" size={16} />
//     } else if (toolType.toLowerCase().includes('image')) {
//       return <FaImage className="text-blue-600" size={16} />
//     }
//     return <FaFileAlt className="text-gray-600" size={16} />
//   }

//   const handleDownload = (task) => {
//     if (task.status === 'completed' && task.resultFile) {
//       console.log('Downloading file:', task.resultFile.name)
//       // Here you would implement the actual download logic
//       alert(`Downloading ${task.resultFile.name}`)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div>
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
//           <p className="text-gray-600 mt-2">View and download your completed tasks</p>
//         </div>

//         {/* Tasks Table */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h3 className="text-lg font-medium text-gray-900">Task History</h3>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Tool & Task
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Files
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Result
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {currentTasks.map((task) => (
//                   <tr key={task.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="flex-shrink-0">
//                           {getToolIcon(task.toolType)}
//                         </div>
//                         <div className="ml-3">
//                           <div className="text-sm font-medium text-gray-900">
//                             {task.toolType}
//                           </div>
//                           <div className="text-sm text-gray-500 capitalize">
//                             {task.taskType.replace(/_/g, ' ')}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="text-sm text-gray-900">
//                         <div className="font-medium">
//                           {task.originalFiles.length} file{task.originalFiles.length > 1 ? 's' : ''}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           Total: {formatFileSize(task.originalFiles.reduce((sum, file) => sum + file.size, 0))}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {getStatusBadge(task.status)}
//                       {task.error && (
//                         <div className="text-xs text-blue-600 mt-1">
//                           {task.error}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {formatDate(task.createdAt)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                       {task.resultFile ? (
//                         <div>
//                           <div className="font-medium">{task.resultFile.name}</div>
//                           <div className="text-xs text-gray-500">
//                             {formatFileSize(task.resultFile.size)}
//                           </div>
//                         </div>
//                       ) : (
//                         <span className="text-gray-400">No result</span>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       {task.status === 'completed' && task.resultFile ? (
//                         <button
//                           onClick={() => handleDownload(task)}
//                           className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
//                         >
//                           <FaDownload className="mr-2" size={12} />
//                           Download
//                         </button>
//                       ) : (
//                         <span className="text-gray-400">Not available</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {currentTasks.length === 0 && (
//             <div className="p-12 text-center">
//               <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
//               <p className="text-gray-500">You haven't completed any tasks yet.</p>
//             </div>
//           )}
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="mt-6">
//             <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               totalItems={totalItems}
//               itemsPerPage={itemsPerPage}
//               onPageChange={handlePageChange}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
