"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaUser,
  FaLock,
  FaUsers,
  FaClock,
  FaFileAlt,
  FaPaperPlane,
  FaInbox,
  FaSignature,
  FaFileContract,
  FaAddressBook,
  FaCog,
  FaBoxes,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const sidebarItems = [
    {
      section: "Profile",
      items: [
        { href: "/user", icon: FaUser, label: "My account" },
        { href: "/user/security", icon: FaLock, label: "Security" },
        { href: "/user/team", icon: FaUsers, label: "Team" },
      ],
    },
    {
      section: "Activity",
      items: [{ href: "/user/last-tasks", icon: FaClock, label: "Last tasks" }],
    },
    {
      section: "Signatures",
      items: [
        { href: "/user/overview", icon: FaFileAlt, label: "Overview" },
        { href: "/user/sent", icon: FaPaperPlane, label: "Sent" },
        { href: "/user/inbox", icon: FaInbox, label: "Inbox" },
        { href: "/user/signed", icon: FaSignature, label: "Signed" },
        { href: "/user/templates", icon: FaFileContract, label: "Templates" },
        { href: "/user/contacts", icon: FaAddressBook, label: "Contacts" },
        { href: "/user/settings", icon: FaCog, label: "Settings" },
      ],
    },
    {
      section: "Billing",
      items: [
        { href: "/user/plans", icon: FaBoxes, label: "Plans & Packages" },
        { href: "/user/business-details", icon: FaBuilding, label: "Business details" },
      ],
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{
          x: 0,
          opacity: 1,
          width: isCollapsed ? "80px" : "256px"
        }}
        transition={{ duration: 0.3 }}
        className={`hidden md:block fixed left-0 top-0 bg-white border-r border-gray-200 shadow-sm z-40 ${isCollapsed ? "w-20" : "w-64"
          }`}
        style={{ height: "100%", top: "80px" }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 md:hidden top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isCollapsed ? (
            <FaChevronRight className="text-gray-600" size={12} />
          ) : (
            <FaChevronLeft className="text-gray-600" size={12} />
          )}
        </button>

        {/* User Profile Section */}
        <div className="p-8 border-gray-200 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-gray-400" size={16} />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-red-600 font-medium text-sm">Registered</div>
                  <div className="text-gray-800 text-sm">Rashid Ali</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-4 px-2 overflow-y-auto custom-scrollbar pb-12" style={{ height: "calc(100% - 120px)" }}>
          {sidebarItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b"
                  >
                    {section.section}
                  </motion.div>
                )}
              </AnimatePresence>

              <nav className="mt-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 mx-2 transition-all duration-200 group ${isActive
                          ? "bg-red-100 text-red-600 border-r-2 border-red-600"
                          : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <Icon
                        size={18}
                        className={`flex-shrink-0 ${isActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                          }`}
                      />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-medium"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsCollapsed(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-64 bg-white h-full shadow-xl"
              style={{ height: "calc(100vh - 100px)", marginTop: "100px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Profile Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400" size={16} />
                  </div>
                  <div>
                    <div className="text-red-600 font-medium text-sm">Registered</div>
                    <div className="text-gray-800 text-sm">Rashid Ali</div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="py-4 overflow-y-auto" style={{ height: "calc(100% - 120px)" }}>
                {sidebarItems.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {section.section}
                    </div>

                    <nav className="mt-1">
                      {section.items.map((item, itemIndex) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                          <Link
                            key={itemIndex}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${isActive
                                ? "bg-red-50 text-red-600 border-r-2 border-red-600"
                                : "text-gray-700 hover:bg-gray-100"
                              }`}
                            onClick={() => setIsCollapsed(false)}
                          >
                            <Icon
                              size={18}
                              className={`${isActive ? "text-red-600" : "text-gray-500"}`}
                            />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="md:hidden fixed left-4 bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 z-30"
        style={{ top: "110px" }}
      >
        <FaChevronRight className="text-gray-600" size={14} />
      </button>
    </>
  )
}

export default Sidebar
