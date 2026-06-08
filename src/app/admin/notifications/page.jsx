"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, User, Shield, AlertTriangle, Info, Mail, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { useNotifications } from "@/context/Notification.context"

export default function AdminNotificationsPage() {
  const {
    notifications,
    unreadCount,
    totalNotifications,
    loading,
    error,
    pagination,
    fetchAllNotifications,
    fetchDropdownNotifications,
    markAsRead,
    markAllAsRead,
    isConnected
  } = useNotifications()

  const [activeTab, setActiveTab] = useState("all")
  const [refreshing, setRefreshing] = useState(false)

  // Fetch notifications on component mount and tab change
  useEffect(() => {
    fetchAllNotifications(1, activeTab)
  }, [activeTab, fetchAllNotifications])

  // Auto-refresh dropdown notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        fetchDropdownNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDropdownNotifications, isConnected])

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchAllNotifications(pagination.current, activeTab)
      await fetchDropdownNotifications()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePageChange = (page) => {
    fetchAllNotifications(page, activeTab)
  }

  const getFilteredNotifications = () => {
    if (activeTab === "unread") {
      return notifications.filter(n => !n.isRead)
    }
    return notifications
  }

  const getIconComponent = (iconName) => {
    const icons = {
      CheckCheck,
      AlertTriangle,
      Info,
      User,
      Shield,
      Mail,
      Bell
    }
    return icons[iconName] || Bell
  }

  const filteredNotifications = getFilteredNotifications()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-blue-600" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-gray-900">Admin Notifications</h1>
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" title="Connected" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" title="Disconnected" />
                )}
              </div>
              <p className="text-gray-600">Stay updated with system activities</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700 mt-1">{error}</div>
                <button
                  onClick={handleRefresh}
                  className="text-sm text-red-800 underline mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{totalNotifications}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">{unreadCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-bold text-green-600">{totalNotifications - unreadCount}</p>
              </div>
              <CheckCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                All ({totalNotifications})
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "unread"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                Unread ({unreadCount})
              </button>
            </nav>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading notifications...</span>
            </div>
          )}

          {/* Notifications List */}
          {!loading && (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const IconComponent = getIconComponent(notification.icon)
                return (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50/30 border-l-4 border-l-blue-500" : ""
                      }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${notification.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${notification.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                New
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border">
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('_', ' ')}
                          </span>

                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm transition-colors"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "unread"
                  ? "All caught up! No unread notifications."
                  : "No notifications to display."
                }
              </p>
              {!isConnected && (
                <p className="text-sm text-red-600">
                  Connection lost. Notifications will appear when reconnected.
                </p>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.total > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.total}
                  <span className="ml-1">({pagination.totalItems} total)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.total) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 border rounded text-sm ${page === pagination.current
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.total}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import { Bell, Check, CheckCheck, User, Shield, AlertTriangle, Info, Mail } from "lucide-react"

// export default function AdminNotificationsPage() {
//   const [notifications, setNotifications] = useState([
//     {
//       id: 1,
//       type: "user",
//       title: "New User Registration",
//       message: "John Smith has registered and is pending approval",
//       time: "2 minutes ago",
//       isRead: false,
//       icon: User,
//       color: "text-blue-600",
//       bgColor: "bg-blue-100",
//     },
//     {
//       id: 2,
//       type: "security",
//       title: "Security Alert",
//       message: "Multiple failed login attempts detected for user admin@company.com",
//       time: "15 minutes ago",
//       isRead: false,
//       icon: Shield,
//       color: "text-blue-600",
//       bgColor: "bg-blue-100",
//     },
//     {
//       id: 3,
//       type: "system",
//       title: "System Update",
//       message: "System maintenance scheduled for tonight at 2:00 AM",
//       time: "1 hour ago",
//       isRead: true,
//       icon: Info,
//       color: "text-green-600",
//       bgColor: "bg-green-100",
//     },
//     {
//       id: 4,
//       type: "user",
//       title: "User Profile Updated",
//       message: "Sarah Johnson updated her profile information",
//       time: "2 hours ago",
//       isRead: true,
//       icon: User,
//       color: "text-blue-600",
//       bgColor: "bg-blue-100",
//     },
//     {
//       id: 5,
//       type: "security",
//       title: "Password Changed",
//       message: "User mike@company.com successfully changed their password",
//       time: "3 hours ago",
//       isRead: false,
//       icon: Shield,
//       color: "text-orange-600",
//       bgColor: "bg-orange-100",
//     },
//     {
//       id: 6,
//       type: "system",
//       title: "Backup Completed",
//       message: "Daily backup completed successfully at 3:00 AM",
//       time: "5 hours ago",
//       isRead: true,
//       icon: CheckCheck,
//       color: "text-green-600",
//       bgColor: "bg-green-100",
//     },
//     {
//       id: 7,
//       type: "user",
//       title: "Contact Form Submission",
//       message: "New contact form submission from potential client",
//       time: "6 hours ago",
//       isRead: false,
//       icon: Mail,
//       color: "text-purple-600",
//       bgColor: "bg-purple-100",
//     },
//     {
//       id: 8,
//       type: "security",
//       title: "Suspicious Activity",
//       message: "Unusual login pattern detected from IP 192.168.1.100",
//       time: "8 hours ago",
//       isRead: true,
//       icon: AlertTriangle,
//       color: "text-yellow-600",
//       bgColor: "bg-yellow-100",
//     },
//   ])

//   const [activeTab, setActiveTab] = useState("all")

//   const markAsRead = (id) => {
//     setNotifications((prev) =>
//       prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
//     )
//   }

//   const markAllAsRead = () => {
//     setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
//   }

//   const getFilteredNotifications = () => {
//     if (activeTab === "unread") {
//       return notifications.filter((n) => !n.isRead)
//     }
//     return notifications
//   }

//   const unreadCount = notifications.filter((n) => !n.isRead).length

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center space-x-3">
//             <Bell className="h-8 w-8 text-blue-600" />
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
//               <p className="text-gray-600">Stay updated with system activities</p>
//             </div>
//           </div>
//           {unreadCount > 0 && (
//             <button
//               onClick={markAllAsRead}
//               className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
//             >
//               <CheckCheck className="h-4 w-4 mr-2" />
//               Mark All as Read
//             </button>
//           )}
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="bg-white rounded-lg shadow-sm p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Total Notifications</p>
//                 <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
//               </div>
//               <Bell className="h-8 w-8 text-blue-600" />
//             </div>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Unread</p>
//                 <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
//               </div>
//               <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
//                 <span className="text-orange-600 font-bold">{unreadCount}</span>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-lg shadow-sm p-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600">Read</p>
//                 <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
//               </div>
//               <CheckCheck className="h-8 w-8 text-green-600" />
//             </div>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-lg shadow-sm mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="flex space-x-8 px-6">
//               <button
//                 onClick={() => setActiveTab("all")}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "all"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700"
//                   }`}
//               >
//                 All ({notifications.length})
//               </button>
//               <button
//                 onClick={() => setActiveTab("unread")}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "unread"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700"
//                   }`}
//               >
//                 Unread ({unreadCount})
//               </button>
//             </nav>
//           </div>

//           {/* Notifications List */}
//           <div className="divide-y divide-gray-200">
//             {getFilteredNotifications().map((notification) => {
//               const IconComponent = notification.icon
//               return (
//                 <div
//                   key={notification.id}
//                   className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50/30" : ""}`}
//                 >
//                   <div className="flex items-start space-x-4">
//                     <div className={`p-2 rounded-full ${notification.bgColor}`}>
//                       <IconComponent className={`h-5 w-5 ${notification.color}`} />
//                     </div>

//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center justify-between mb-1">
//                         <h3 className="text-sm font-semibold text-gray-900 truncate">{notification.title}</h3>
//                         <div className="flex items-center space-x-2">
//                           {!notification.isRead && (
//                             <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
//                               New
//                             </span>
//                           )}
//                           <span className="text-xs text-gray-500">{notification.time}</span>
//                         </div>
//                       </div>

//                       <p className="text-sm text-gray-600 mb-3">{notification.message}</p>

//                       <div className="flex items-center justify-between">
//                         <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border">
//                           {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
//                         </span>

//                         {!notification.isRead && (
//                           <button
//                             onClick={() => markAsRead(notification.id)}
//                             className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
//                           >
//                             <Check className="h-4 w-4 mr-1" />
//                             Mark as Read
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>

//           {getFilteredNotifications().length === 0 && (
//             <div className="text-center py-12">
//               <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
//               <p className="text-gray-600">
//                 {activeTab === "unread" ? "All caught up! No unread notifications." : "No notifications to display."}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
