"use client"
import { useState, useRef, useEffect, useContext } from "react"
import Link from "next/link"
import {
  FaBars,
  FaBell,
  FaSearch,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaQuestionCircle,
  FaExpand,
  FaCompress,
  FaTachometerAlt,
} from "react-icons/fa"
import { CgWebsite } from "react-icons/cg";
import LogoutModal from "./LogoutModal"
import { IoIosArrowDown } from "react-icons/io"
import { UserContext } from "@/context/User.context"
import { useNotifications } from "@/context/Notification.context"
import { useSocketIo } from "@/context/SocketIoContext";


export default function DashboardNavbar({ toggleSidebar }) {
  const { user } = useContext(UserContext)
  const {
    dropdownNotifications,
    unreadCount,
    fetchDropdownNotifications,
    markAsRead
  } = useNotifications()
  const { isConnected } = useSocketIo()

  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)

  // Fetch notifications on component mount
  useEffect(() => {
    fetchDropdownNotifications()
  }, [fetchDropdownNotifications])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle notification click
  const handleNotificationClick = async (notificationId, isRead) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
  }

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false)
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
      }
    }
  }

  // Update fullscreen state when it changes externally
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <FaBars size={20} />
        </button>
        {/* Search bar */}
        <div
          className={`relative ml-4 transition-all duration-300 ease-in-out ${searchFocused ? "w-64 md:w-80" : "w-40 md:w-64"
            }`}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search admin tools..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Connection Status */}
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} title={isConnected ? 'Connected' : 'Disconnected'} />

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
            aria-label="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  <Link
                    href="/admin/notifications"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto hide-scrollbar">
                {dropdownNotifications?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FaBell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p>No notifications</p>
                    {!isConnected && (
                      <p className="text-xs text-red-500 mt-1">Disconnected</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {dropdownNotifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? "bg-blue-50" : ""
                          }`}
                        onClick={() => handleNotificationClick(notification.id, notification.read)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-200 text-center">
                <Link
                  href="/admin/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => setNotificationsOpen(false)}
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 focus:outline-none"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white">
              <FaUser />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.username || "Admin User"}</p>
            </div>
            <IoIosArrowDown />
          </button>
          {/* Profile dropdown menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 border border-gray-200 py-1">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.username || "Admin User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || "admin@company.com"}</p>
              </div>
              <Link
                href="/admin"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setProfileOpen(false)}
              >
                <FaTachometerAlt className="mr-2 text-gray-500" />
                Dashboard
              </Link>
              <Link
                href="/admin/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setProfileOpen(false)}
              >
                <FaUser className="mr-2 text-gray-500" />
                Your Profile
              </Link>
              <Link
                href="/"
                target="_blank"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setProfileOpen(false)}
              >
                <CgWebsite className="mr-2 text-gray-500" />
                Visit Website
              </Link>
              <div className="border-t border-gray-200"></div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </header>
  )
}

// "use client"
// import { useState, useRef, useEffect, useContext } from "react"
// import Link from "next/link"
// import {
//   FaBars,
//   FaBell,
//   FaSearch,
//   FaUser,
//   FaCog,
//   FaSignOutAlt,
//   FaQuestionCircle,
//   FaExpand,
//   FaCompress,
// } from "react-icons/fa"
// import { CgWebsite } from "react-icons/cg";
// import LogoutModal from "./LogoutModal"
// import { IoIosArrowDown } from "react-icons/io"
// import { UserContext } from "@/context/User.context"

// export default function DashboardNavbar({ toggleSidebar }) {
//   const { user } = useContext(UserContext)
//   const [profileOpen, setProfileOpen] = useState(false)
//   const [notificationsOpen, setNotificationsOpen] = useState(false)
//   const [searchFocused, setSearchFocused] = useState(false)
//   const [logoutModalOpen, setLogoutModalOpen] = useState(false)
//   const [isFullscreen, setIsFullscreen] = useState(false)
//   const profileRef = useRef(null)
//   const notificationsRef = useRef(null)

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (profileRef.current && !profileRef.current.contains(event.target)) {
//         setProfileOpen(false)
//       }
//       if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
//         setNotificationsOpen(false)
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside)
//     }
//   }, [])

//   // Handle fullscreen toggle
//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen().then(() => {
//         setIsFullscreen(true)
//       }).catch(err => {
//         console.error(`Error attempting to enable fullscreen: ${err.message}`)
//       })
//     } else {
//       if (document.exitFullscreen) {
//         document.exitFullscreen().then(() => {
//           setIsFullscreen(false)
//         }).catch(err => {
//           console.error(`Error attempting to exit fullscreen: ${err.message}`)
//         })
//       }
//     }
//   }

//   // Update fullscreen state when it changes externally
//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement)
//     }
//     document.addEventListener('fullscreenchange', handleFullscreenChange)
//     return () => {
//       document.removeEventListener('fullscreenchange', handleFullscreenChange)
//     }
//   }, [])

//   // Sample notifications for PDF tools
//   const notifications = [
//     {
//       id: 1,
//       title: "PDF Compressed Successfully",
//       message: "Your document.pdf has been compressed by 65%.",
//       time: "5 minutes ago",
//       read: false,
//     },
//     {
//       id: 2,
//       title: "Merge Operation Complete",
//       message: "3 PDF files have been successfully merged.",
//       time: "1 hour ago",
//       read: false,
//     },
//     {
//       id: 3,
//       title: "Storage Usage Alert",
//       message: "You've used 80% of your storage quota.",
//       time: "3 hours ago",
//       read: true,
//     },
//   ]

//   if (!user) {
//     return null
//   }

//   return (
//     <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
//       {/* Left side */}
//       <div className="flex items-center">
//         <button
//           onClick={toggleSidebar}
//           className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
//           aria-label="Toggle sidebar"
//         >
//           <FaBars size={20} />
//         </button>
//         {/* Search bar */}
//         <div
//           className={`relative ml-4 transition-all duration-300 ease-in-out ${searchFocused ? "w-64 md:w-80" : "w-40 md:w-64"}`}
//         >
//           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//             <FaSearch className="text-gray-400" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search PDF tools..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//             onFocus={() => setSearchFocused(true)}
//             onBlur={() => setSearchFocused(false)}
//           />
//         </div>
//       </div>

//       {/* Right side */}
//       <div className="flex items-center space-x-3">
//         {/* Fullscreen toggle */}
//         <button
//           onClick={toggleFullscreen}
//           className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
//           aria-label="Toggle fullscreen"
//         >
//           {isFullscreen ? <FaCompress /> : <FaExpand />}
//         </button>

//         {/* Notifications */}
//         <div className="relative" ref={notificationsRef}>
//           <button
//             onClick={() => setNotificationsOpen(!notificationsOpen)}
//             className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
//             aria-label="Notifications"
//           >
//             <FaBell />
//             {notifications.some((n) => !n.read) && (
//               <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
//             )}
//           </button>
//           {/* Notifications dropdown */}
//           {notificationsOpen && (
//             <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden">
//               <div className="p-3 border-b border-gray-200 flex justify-between items-center">
//                 <h3 className="font-medium text-gray-900">Notifications</h3>
//                 <Link
//                   href="/admin/notifications"
//                   className="text-sm text-blue-600 hover:underline"
//                 >
//                   View all
//                 </Link>
//               </div>
//               <div className="max-h-96 overflow-y-auto">
//                 {notifications.length === 0 ? (
//                   <div className="p-4 text-center text-gray-500">No notifications</div>
//                 ) : (
//                   <div>
//                     {notifications.map((notification) => (
//                       <div
//                         key={notification.id}
//                         className={`p-3 border-b border-gray-200 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="flex-1">
//                             <p className="text-sm font-medium text-gray-900">{notification.title}</p>
//                             <p className="text-sm text-gray-500">{notification.message}</p>
//                             <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
//                           </div>
//                           {!notification.read && (
//                             <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//               <div className="p-2 border-t border-gray-200 text-center">
//                 <button className="text-sm text-gray-500 hover:text-gray-700">
//                   Mark all as read
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Profile dropdown */}
//         <div className="relative" ref={profileRef}>
//           <button
//             onClick={() => setProfileOpen(!profileOpen)}
//             className="flex items-center space-x-2 focus:outline-none"
//             aria-label="User menu"
//           >
//             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white">
//               <FaUser />
//             </div>
//             <div className="hidden md:block text-left">
//               <p className="text-sm font-medium text-gray-900">{user?.username || "Admin User"}</p>
//             </div>
//             <IoIosArrowDown />
//           </button>
//           {/* Profile dropdown menu */}
//           {profileOpen && (
//             <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 border border-gray-200 py-1">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <p className="text-sm font-medium text-gray-900">{user?.username || "Admin User"}</p>
//                 <p className="text-xs text-gray-500 truncate">{user?.email || "admin@pdfdex.com"}</p>
//               </div>
//               <Link
//                 href="/admin/profile"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 <FaUser className="mr-2 text-gray-500" />
//                 Your Profile
//               </Link>
//               <Link
//                 href="/admin/settings"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 <FaCog className="mr-2 text-gray-500" />
//                 Settings
//               </Link>
//               <Link
//                 href="/"
//                 target="_blank"
//                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//               >
//                 <CgWebsite className="mr-2 text-gray-500" />
//                 Visit Website
//               </Link>
//               <div className="border-t border-gray-200"></div>
//               <button
//                 onClick={() => {
//                   setProfileOpen(false);
//                   setLogoutModalOpen(true);
//                 }}
//                 className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
//               >
//                 <FaSignOutAlt className="mr-2" />
//                 Sign out
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Logout Modal */}
//       <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
//     </header>
//   )
// }
