"use client"

import { useContext, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { FiMenu, FiX, FiUser, FiHome, FiChevronDown, FiLogOut } from "react-icons/fi"
import {
  ComparePDFIcon,
  CompressPDFIcon,
  CropPDFIcon,
  EditPDFIcon,
  ExcelToPDFIcon,
  HTMLToPDFIcon,
  JPGToPDFIcon,
  MergePDFIcon,
  OcrPDFIcon,
  OrganizePDFIcon,
  PageNumberIcon,
  PDFtoExcelIcon,
  PDFToJPGIcon,
  PDFToPDFAIcon,
  PDFtoPowerPointIcon,
  PDFToWordIcon,
  PowerPintToPDFIcon,
  ProtectPDFIcon,
  RedactPDFIcon,
  RepairPDFIcon,
  RotatePDFIcon,
  SignPDFIcon,
  SplitPDFIcon,
  UnlockPDFIcon,
  WatermarkIcon,
  WordToPDFIcon,
} from "@/components/icons/pdfIcons"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { UserContext } from "@/context/User.context"
import { ToastContainer } from "react-toastify"

const toolCategories = {
  "ORGANIZE PDF": {
    icon: OrganizePDFIcon,
    tools: [
      { name: "Merge PDF", icon: MergePDFIcon, url: "/merge-pdf" },
      { name: "Split PDF", icon: SplitPDFIcon, url: "/split-pdf" },
      { name: "Organize PDF", icon: OrganizePDFIcon, url: "/organize-pdf" },
    ],
  },
  "OPTIMIZE PDF": {
    icon: CompressPDFIcon,
    tools: [
      { name: "Compress PDF", icon: CompressPDFIcon, url: "/compress-pdf" },
      { name: "Repair PDF", icon: RepairPDFIcon, url: "/repair-pdf" },
      { name: "OCR PDF", icon: OcrPDFIcon, url: "/ocr-pdf" },
    ],
  },
  "CONVERT TO PDF": {
    icon: JPGToPDFIcon,
    tools: [
      { name: "JPG to PDF", icon: JPGToPDFIcon, url: "/jpg-to-pdf" },
      { name: "Word to PDF", icon: WordToPDFIcon, url: "/word-to-pdf" },
      { name: "PowerPoint to PDF", icon: PowerPintToPDFIcon, url: "/powerpoint-to-pdf" },
      { name: "Excel to PDF", icon: ExcelToPDFIcon, url: "/excel-to-pdf" },
      { name: "HTML to PDF", icon: HTMLToPDFIcon, url: "/html-to-pdf" },
    ],
  },
  "CONVERT FROM PDF": {
    icon: PDFToJPGIcon,
    tools: [
      { name: "PDF to JPG", icon: PDFToJPGIcon, url: "/pdf-to-jpg" },
      { name: "PDF to Word", icon: PDFToWordIcon, url: "/pdf-to-word" },
      { name: "PDF to PowerPoint", icon: PDFtoPowerPointIcon, url: "/pdf-to-powerpoint" },
      { name: "PDF to Excel", icon: PDFtoExcelIcon, url: "/pdf-to-excel" },
      { name: "PDF to PDF/A", icon: PDFToPDFAIcon, url: "/pdf-to-pdfa" },
    ],
  },
  "EDIT PDF": {
    icon: EditPDFIcon,
    tools: [
      { name: "Rotate PDF", icon: RotatePDFIcon, url: "/rotate-pdf" },
      { name: "Add page numbers", icon: PageNumberIcon, url: "/add-pdf-page-number" },
      { name: "Add watermark", icon: WatermarkIcon, url: "/add-watermark" },
      { name: "Crop PDF", icon: CropPDFIcon, url: "/crop-pdf" },
      { name: "Edit PDF", icon: EditPDFIcon, url: "/edit-pdf" },
    ],
  },
  "SECURITY PDF": {
    icon: ProtectPDFIcon,
    tools: [
      { name: "Unlock PDF", icon: UnlockPDFIcon, url: "/unlock-pdf" },
      { name: "Protect PDF", icon: ProtectPDFIcon, url: "/protect-pdf" },
      { name: "Sign PDF", icon: SignPDFIcon, url: "/sign-pdf" },
      { name: "Redact PDF", icon: RedactPDFIcon, url: "/redact-pdf" },
      { name: "Compare PDF", icon: ComparePDFIcon, url: "/compare-pdf" },
    ],
  },
  "ADVANCED TOOLS": {
    icon: RepairPDFIcon,
    tools: [
      { name: "Repair PDF", icon: RepairPDFIcon, url: "/repair-pdf" },
      { name: "OCR PDF", icon: OcrPDFIcon, url: "/ocr-pdf" },
      { name: "Compare PDF", icon: ComparePDFIcon, url: "/compare-pdf" },
    ],
  },
}

export default function ToolsLayout({ children }) {
  const { user, logout } = useContext(UserContext)
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const handleMouseEnter = (category) => {
    setActiveDropdown(category)
  }

  const handleMouseLeave = () => {
    setActiveDropdown(null)
  }

  const handleProfileClick = () => {
    if (user) {
      window.location.href = "/user"
    } else {
      window.location.href = "/auth/login"
    }
  }

  const getDashboardUrl = () => {
    if (!user) return "/auth/login"
    return user.role === "user" ? "/user" : "/admin"
  }

  const getProfileUrl = () => {
    if (!user) return "/auth/login"
    return user.role === "user" ? "/user/profile" : "/admin/profile"
  }

  const handleLogout = () => {
    logout()
    setShowUserDropdown(false)
  }



  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 shadow-sm w-full flex-shrink-0">
        <div className="px-5 py-2 h-[70px]">
          <div className="flex justify-between items-center">
            {/* Left - Logo and Mobile Menu */}
            <div className="flex items-center max-md:gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-blue-600">
                <FiMenu className="w-6 h-6" />
              </button>
              <Link href="/" className="flex items-center">
                <Image src="/logo.png" alt="PDFDex Logo" height={30} width={120} />
              </Link>
            </div>

            {/* Right - Profile/Login */}
            <div className="flex items-center">
              {user ? (
                <div
                  className="relative"
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors font-medium px-4 py-2 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                      <FiUser className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block">{user.username || "User"}</span>
                    <FiChevronDown className="w-4 h-4 hidden sm:block" />
                  </button>

                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                      >
                        {/* User Header */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.username || "User"}</p>
                              <p className="text-sm text-gray-500">{user.email || "user@example.com"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href={getDashboardUrl()}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FiHome className="w-4 h-4" />
                            <span className="font-medium">Dashboard</span>
                          </Link>
                          {user.role !== 'user' && 
                            <Link
                              href={getProfileUrl()}
                              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FiUser className="w-4 h-4" />
                              <span className="font-medium">Profile</span>
                            </Link>
                          }
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                          >
                            <FiLogOut className="w-4 h-4" />
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 ml-4"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex flex-col w-20 bg-white border-r border-gray-200 shadow-sm">
          {/* Category Icons */}
          <div className="flex-1 py-4">
            {Object.entries(toolCategories).map(([category, data]) => (
              <div
                key={category}
                className="relative"
                onMouseEnter={() => handleMouseEnter(category)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="p-2 mx-2 mb-2 rounded-lg hover:bg-blue-50 cursor-pointer group flex flex-col items-center">
                  <data.icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mb-1" />
                  <span className="text-[10px] text-gray-500 group-hover:text-blue-600 text-center leading-tight lowercase first-letter:uppercase">
                    {category.split(" ")[0]}
                  </span>
                </div>

                <AnimatePresence>
                  {activeDropdown === category && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-0 ml-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">{category}</h3>
                      <div className="space-y-1">
                        {data.tools.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.url}
                            className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors ${pathname === tool.url ? "text-blue-600 bg-blue-50" : "text-gray-700"
                              }`}
                          >
                            <tool.icon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div
              onClick={handleProfileClick}
              className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <FiUser className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1 h-full">
          <main className="h-full max-md:pb-20 max-md:bg-gray-100">{children}</main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 h-screen w-80 bg-white z-50 lg:hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <Link href="/" className="flex items-center">
                  <Image src="/logo.png" alt="PDFDex Logo" height={30} width={120} />
                </Link>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {Object.entries(toolCategories).map(([category, data]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <data.icon className="w-4 h-4 text-blue-600" />
                      <span>{category}</span>
                    </h3>
                    <div className="space-y-1 pl-6">
                      {data.tools.map((tool) => (
                        <Link
                          key={tool.name}
                          href={tool.url}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors ${pathname === tool.url ? "text-blue-600 bg-blue-50" : "text-gray-700"
                            }`}
                        >
                          <tool.icon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                {user ? (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false)
                      handleProfileClick()
                    }}
                    className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                  >
                    <FiHome className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center block"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
  )
}




// import { Geist, Geist_Mono } from "next/font/google";
// import '@/app/globals.css'
// import Navbar from "@/components/layout/Navbar";
// import SocketIoProvider from "@/context/SocketIoContext";
// import { ToastContainer } from "react-toastify";

// export default function RootLayout({ children }) {
//   return (
//     <main className="bg-gray-50 min-h-screen">
//       <SocketIoProvider>
//         <Navbar className='px-4 md:px-12' />
//         {children}
//         <ToastContainer />
//       </SocketIoProvider>
//     </main>
//   )
// }
