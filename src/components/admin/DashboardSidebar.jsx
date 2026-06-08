"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FaTachometerAlt,
  FaChevronLeft,
  FaSignOutAlt,
  FaFilePdf,
  FaUsers,
  FaBlog,
  FaEnvelope,
  FaTools,
  FaChartLine,
  FaCog,
  FaComments,
  FaQuestionCircle,
  FaFileAlt,
  FaDownload,
  FaShieldAlt,
  FaDatabase,
  FaBell,
  FaKey,
  FaServer,
  FaGlobe,
  FaUser,
  FaRegClock,
  FaPaperPlane,
  FaInbox,
  FaSignature,
  FaAddressBook,
} from "react-icons/fa"
import LogoutModal from "./LogoutModal"
import { CgWebsite } from "react-icons/cg";
import { Settings } from "lucide-react"

export default function DashboardSidebar({ collapsed, toggleSidebar }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isMobileOpen && !event.target.closest(".sidebar")) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isMobileOpen])

  const navGroups = [
    {
      id: "overview",
      title: "Overview",
      links: [
        { title: "Dashboard", link: "/admin", icon: <FaTachometerAlt />, exactMatch: true },
        { title: "Visit Website", link: "/", icon: <CgWebsite />, exactMatch: true },
      ],
    },
    {
      id: "content",
      title: "Content Management",
      links: [
        { title: "Blog Posts", link: "/admin/blogs", icon: <FaBlog />, exactMatch: true },
        { title: "Create Post", link: "/admin/blogs/create", icon: <FaFileAlt />, exactMatch: true },
      ],
    },
    {
      id: "users",
      title: "User Management",
      links: [
        { title: "All Users", link: "/admin/users", icon: <FaUsers />, exactMatch: true },
        { title: "Create User", link: "/admin/users/create", icon: <FaFileAlt />, exactMatch: true },
      ],
    },
    {
      id: "inquiries",
      title: "Communications",
      links: [
        { title: "Contact Inquiries", link: "/admin/inquiries", icon: <FaEnvelope />, exactMatch: true },
        { title: "Notifications", link: "/admin/notifications", icon: <FaBell />, exactMatch: true },
      ],
    },
    {
      id: "tools",
      title: "Tools Management",
      links: [
        { title: "Tools Overview", link: "/admin/tools", icon: <FaTools />, exactMatch: true },
        { title: "Usage Analytics", link: "/admin/analytics", icon: <FaChartLine />, exactMatch: true },
      ],
    },
    {
      id: "signatures",
      title: "My Tasks",
      links: [
        { title: "My Tasks", link: "/admin/tasks", icon: <FaRegClock />, exactMatch: true },
        { title: "Signed", link: "/admin/signatures/signed", icon: <FaSignature />, exactMatch: true },
      ],
    },
    {
      id: "settings",
      title: "System Settings",
      links: [
        { title: "Profile", link: "/admin/profile", icon: <FaUser className="w-6" />, exactMatch: true },
      ],
    },
  ]

  const isLinkActive = (link, exactMatch = false) => {
    if (exactMatch) {
      return pathname === link
    } else {
      return pathname === link || pathname.startsWith(`${link}/`)
    }
  }

  return (
    <>
      <aside
        className={`sidebar bg-white border-r border-gray-200 transition-all duration-300 fixed z-40 h-screen flex flex-col
          ${collapsed ? "w-16" : "w-64"} 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <Link href="/admin" className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <FaFilePdf className="text-xl" />
            </div>
            {!collapsed && <span className="ml-3 text-xl font-bold text-gray-900">PDFDEX</span>}
          </Link>
          {!collapsed && (
            <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:block hidden">
              <FaChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation - Scrollable area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <nav className="px-2 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {navGroups.map((group, index) => (
              <div
                key={group.id}
                className={`pb-4 ${index < navGroups.length - 1 ? "mt-5 border-b border-gray-200 mb-4" : ""}`}
              >
                {/* Group Title */}
                {!collapsed && (
                  <h3 className="px-3 mt-5 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                {/* Group Links */}
                <div className="space-y-1">
                  {group.links.map((item) => {
                    const isActive = isLinkActive(item.link, item.exactMatch);
                    return (
                      <Link
                        key={item.title}
                        href={item.link}
                        className={`group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                          ${collapsed ? "justify-center" : ""}
                          ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                      >
                        <div
                          className={`flex items-center justify-center
                            ${collapsed ? "w-8 h-8 rounded-full" : ""}
                            ${isActive && collapsed ? "bg-blue-100" : ""}`}
                        >
                          <span
                            className={`transition-colors
                              ${collapsed ? "text-lg" : "text-base"}
                              ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}
                          >
                            {item.icon}
                          </span>
                        </div>
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                        {/* Tooltip for collapsed mode */}
                        {collapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                            {item.title}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout - Sticky at bottom */}
        <div className="px-2 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => setLogoutModalOpen(true)}
            className={`w-full flex items-center justify-center bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${collapsed ? "justify-center" : ""}
              text-blue-600 hover:bg-blue-100`}
          >
            <div className={`flex items-center justify-center ${collapsed ? "w-8 h-8 rounded-full" : ""}`}>
              <FaSignOutAlt className={collapsed ? "text-lg" : "text-base"} />
            </div>
            {!collapsed && <span className="ml-3">Sign out</span>}
            {/* Tooltip for collapsed mode */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                Sign out
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Logout Modal */}
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </>
  )
}

// "use client"
// import { useState, useEffect } from "react"
// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import {
//   FaTachometerAlt,
//   FaChevronLeft,
//   FaSignOutAlt,
//   FaFilePdf,
//   FaUsers,
//   FaBlog,
//   FaEnvelope,
//   FaTools,
//   FaChartLine,
//   FaCog,
//   FaComments,
//   FaQuestionCircle,
//   FaFileAlt,
//   FaDownload,
//   FaShieldAlt,
//   FaDatabase,
//   FaBell,
//   FaKey,
//   FaServer,
//   FaGlobe,
//   FaUser,
//   FaRegClock,
//   FaPaperPlane,
//   FaInbox,
//   FaSignature,
//   FaAddressBook,
// } from "react-icons/fa"
// import LogoutModal from "./LogoutModal"
// import { CgWebsite } from "react-icons/cg";
// import { Settings } from "lucide-react"

// export default function DashboardSidebar({ collapsed, toggleSidebar }) {
//   const pathname = usePathname()
//   const [isMobileOpen, setIsMobileOpen] = useState(false)
//   const [logoutModalOpen, setLogoutModalOpen] = useState(false)

//   // Close sidebar on mobile when route changes
//   useEffect(() => {
//     setIsMobileOpen(false)
//   }, [pathname])

//   // Close sidebar when clicking outside on mobile
//   useEffect(() => {
//     const handleOutsideClick = (event) => {
//       if (isMobileOpen && !event.target.closest(".sidebar")) {
//         setIsMobileOpen(false)
//       }
//     }
//     document.addEventListener("mousedown", handleOutsideClick)
//     return () => {
//       document.removeEventListener("mousedown", handleOutsideClick)
//     }
//   }, [isMobileOpen])

//   const navGroups = [
//     {
//       id: "overview",
//       title: "Overview",
//       links: [
//         { title: "Dashboard", link: "/admin", icon: <FaTachometerAlt />, isSame: true },
//         { title: "Visit Website", link: "/", icon: <CgWebsite />, isSame: true },
//         // { title: "My Tasks", link: "/admin/tasks", icon: <FaRegClock /> },
//       ],
//     },
//     {
//       id: "content",
//       title: "Content Management",
//       links: [
//         { title: "Blog Posts", link: "/admin/blogs", icon: <FaBlog /> },
//         { title: "Create Post", link: "/admin/blogs/create", icon: <FaFileAlt /> },
//         // { title: "Media Library", link: "/admin/media", icon: <FaDownload /> },
//       ],
//     },
//     {
//       id: "users",
//       title: "User Management",
//       links: [
//         { title: "All Users", link: "/admin/users", icon: <FaUsers /> },
//         { title: "Create User", link: "/admin/users/create", icon: <FaFileAlt /> },
//         // { title: "User Roles", link: "/admin/users/roles", icon: <FaShieldAlt /> },
//         // { title: "User Activity", link: "/admin/users/activity", icon: <FaChartLine /> },
//       ],
//     },
//     {
//       id: "inquiries",
//       title: "Communications",
//       links: [
//         { title: "Contact Inquiries", link: "/admin/inquiries", icon: <FaEnvelope /> },
//         // { title: "Support Tickets", link: "/admin/support", icon: <FaQuestionCircle /> },
//         // { title: "Comments", link: "/admin/comments", icon: <FaComments /> },
//         { title: "Notifications", link: "/admin/notifications", icon: <FaBell /> },
//       ],
//     },
//     {
//       id: "tools",
//       title: "Tools Management",
//       links: [
//         { title: "Tools Overview", link: "/admin/tools", icon: <FaTools /> },
//         { title: "Usage Analytics", link: "/admin/analytics", icon: <FaChartLine /> },
//         // { title: "Tool Settings", link: "/admin/tools/settings", icon: <FaCog /> },
//         // { title: "File Management", link: "/admin/tools/files", icon: <FaFilePdf /> },
//       ],
//     },
//     {
//       id: "signatures",
//       title: "My Tasks",
//       links: [
//         // { title: "Signatures", link: "/admin/signatures", icon: <FaFileAlt />, isSame: true },
//         // { title: "Sent", link: "/admin/signatures/requests", icon: <FaPaperPlane /> },
//         // { title: "Inbox", link: "/admin/signatures/pending", icon: <FaInbox /> },
//         { title: "My Tasks", link: "/admin/tasks", icon: <FaRegClock /> },
//         { title: "Signed", link: "/admin/signatures/signed", icon: <FaSignature /> },
//         // { title: "Contacts", link: "/admin/signatures/contacts", icon: <FaAddressBook /> },
//         // { title: "Settings", link: "/admin/signatures/settings", icon: <FaCog /> },
//       ],
//     },
//     {
//       id: "settings",
//       title: "System Settings",
//       links: [
//         // { title: "Settings", link: "/admin/settings", icon: <Settings /> },
//         { title: "Profile", link: "/admin/profile", icon: <FaUser className="w-6" /> },
//         // { title: "API Keys", link: "/admin/api-keys", icon: <FaKey /> },
//         // { title: "Server Status", link: "/admin/server", icon: <FaServer /> },
//         // { title: "Database", link: "/admin/database", icon: <FaDatabase /> },
//         // { title: "Website Settings", link: "/admin/settings", icon: <FaGlobe /> },
//       ],
//     },
//   ]

//   const isLinkActive = (link, isSame) => {
//     if (isSame) {
//       return pathname === link
//     } else {
//       return pathname === link || pathname.startsWith(`${link}/`)
//     }
//   }

//   return (
//     <>
//       <aside
//         className={`sidebar bg-white border-r border-gray-200 transition-all duration-300 fixed z-40 h-screen flex flex-col
//           ${collapsed ? "w-16" : "w-64"} 
//           ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
//       >
//         {/* Logo */}
//         <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
//           <Link href="/admin" className="flex items-center">
//             <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
//               <FaFilePdf className="text-xl" />
//             </div>
//             {!collapsed && <span className="ml-3 text-xl font-bold text-gray-900">PDFDEX</span>}
//           </Link>
//           {!collapsed && (
//             <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:block hidden">
//               <FaChevronLeft size={16} />
//             </button>
//           )}
//         </div>

//         {/* Navigation - Scrollable area */}
//         <div className="flex-1 overflow-hidden flex flex-col">
//           <nav className="px-2 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
//             {navGroups.map((group, index) => (
//               <div
//                 key={group.id}
//                 className={`pb-4 ${index < navGroups.length - 1 ? "mt-5 border-b border-gray-200 mb-4" : ""}`}
//               >
//                 {/* Group Title */}
//                 {!collapsed && (
//                   <h3 className="px-3 mt-5 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                     {group.title}
//                   </h3>
//                 )}
//                 {/* Group Links */}
//                 <div className="space-y-1">
//                   {group.links.map((item) => {
//                     const isActive = isLinkActive(item.link, item.isSame ? true : false);
//                     return (
//                       <Link
//                         key={item.title}
//                         href={item.link}
//                         className={`group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
//                           ${collapsed ? "justify-center" : ""}
//                           ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
//                       >
//                         <div
//                           className={`flex items-center justify-center
//                             ${collapsed ? "w-8 h-8 rounded-full" : ""}
//                             ${isActive && collapsed ? "bg-blue-100" : ""}`}
//                         >
//                           <span
//                             className={`transition-colors
//                               ${collapsed ? "text-lg" : "text-base"}
//                               ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}
//                           >
//                             {item.icon}
//                           </span>
//                         </div>
//                         {!collapsed && <span className="ml-3">{item.title}</span>}
//                         {/* Tooltip for collapsed mode */}
//                         {collapsed && (
//                           <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
//                             {item.title}
//                           </div>
//                         )}
//                       </Link>
//                     )
//                   })}
//                 </div>
//               </div>
//             ))}
//           </nav>
//         </div>

//         {/* Logout - Sticky at bottom */}
//         <div className="px-2 py-4 border-t border-gray-200 flex-shrink-0">
//           <button
//             onClick={() => setLogoutModalOpen(true)}
//             className={`w-full flex items-center justify-center bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors
//               ${collapsed ? "justify-center" : ""}
//               text-blue-600 hover:bg-blue-100`}
//           >
//             <div className={`flex items-center justify-center ${collapsed ? "w-8 h-8 rounded-full" : ""}`}>
//               <FaSignOutAlt className={collapsed ? "text-lg" : "text-base"} />
//             </div>
//             {!collapsed && <span className="ml-3">Sign out</span>}
//             {/* Tooltip for collapsed mode */}
//             {collapsed && (
//               <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
//                 Sign out
//               </div>
//             )}
//           </button>
//         </div>
//       </aside>

//       {/* Overlay for mobile */}
//       {isMobileOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
//       )}

//       {/* Logout Modal */}
//       <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
//     </>
//   )
// }
