"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  FiMenu,
  FiX,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiMinus,
  FiFileText,
} from "react-icons/fi"
import { ComparePDFIcon, CompressPDFIcon, CropPDFIcon, EditPDFIcon, ExcelToPDFIcon, HTMLToPDFIcon, JPGToPDFIcon, MergePDFIcon, OcrPDFIcon, OrganizePDFIcon, PageNumberIcon, PDFtoExcelIcon, PDFToJPGIcon, PDFToPDFAIcon, PDFtoPowerPointIcon, PDFToWordIcon, PowerPintToPDFIcon, ProtectPDFIcon, RedactPDFIcon, RepairPDFIcon, RotatePDFIcon, ScanPDFIcon, SignPDFIcon, SplitPDFIcon, UnlockPDFIcon, WatermarkIcon, WordToPDFIcon } from "../icons/pdfIcons"
import { usePathname } from "next/navigation"

const toolCategories = {
  "ORGANIZE PDF": [
    { name: "Merge PDF", icon: MergePDFIcon, url: "/merge-pdf" },
    { name: "Split PDF", icon: SplitPDFIcon, url: "/split-pdf" },
    // { name: "Remove pages", icon: FiMinus, url: "/remove-pages" },
    // { name: "Extract pages", icon: FiFileText, url: "/extract-pages" },
    { name: "Organize PDF", icon: OrganizePDFIcon, url: "/organize-pdf" },
    { name: "Scan to PDF", icon: ScanPDFIcon, url: "/scan-to-pdf" },
  ],
  "OPTIMIZE PDF": [
    { name: "Compress PDF", icon: CompressPDFIcon, url: "/compress-pdf" },
    { name: "Repair PDF", icon: RepairPDFIcon, url: "/repair-pdf" },
    { name: "OCR PDF", icon: OcrPDFIcon, url: "/ocr-pdf" },
  ],
  "CONVERT TO PDF": [
    { name: "JPG to PDF", icon: JPGToPDFIcon, url: "/jpg-to-pdf" },
    { name: "Word to PDF", icon: WordToPDFIcon, url: "/word-to-pdf" },
    { name: "PowerPoint to PDF", icon: PowerPintToPDFIcon, url: "/powerpoint-to-pdf" },
    { name: "Excel to PDF", icon: ExcelToPDFIcon, url: "/excel-to-pdf" },
    { name: "HTML to PDF", icon: HTMLToPDFIcon, url: "/html-to-pdf" },
  ],
  "CONVERT FROM PDF": [
    { name: "PDF to JPG", icon: PDFToJPGIcon, url: "/pdf-to-jpg" },
    { name: "PDF to Word", icon: PDFToWordIcon, url: "/pdf-to-word" },
    { name: "PDF to PowerPoint", icon: PDFtoPowerPointIcon, url: "/pdf-to-powerpoint" },
    { name: "PDF to Excel", icon: PDFtoExcelIcon, url: "/pdf-to-excel" },
    { name: "PDF to PDF/A", icon: PDFToPDFAIcon, url: "/pdf-to-pdfa" },
  ],
  "EDIT PDF": [
    { name: "Rotate PDF", icon: RotatePDFIcon, url: "/rotate-pdf" },
    { name: "Add page numbers", icon: PageNumberIcon, url: "/add-page-numbers" },
    { name: "Add watermark", icon: WatermarkIcon, url: "/add-watermark" },
    { name: "Crop PDF", icon: CropPDFIcon, url: "/crop-pdf" },
    { name: "Edit PDF", icon: EditPDFIcon, url: "/edit-pdf" },
  ],
  "PDF SECURITY": [
    { name: "Unlock PDF", icon: UnlockPDFIcon, url: "/unlock-pdf" },
    { name: "Protect PDF", icon: ProtectPDFIcon, url: "/protect-pdf" },
    { name: "Sign PDF", icon: SignPDFIcon, url: "/sign-pdf" },
    { name: "Redact PDF", icon: RedactPDFIcon, url: "/redact-pdf" },
    { name: "Compare PDF", icon: ComparePDFIcon, url: "/compare-pdf" },
  ],
}

export default function Navbar({ className = "container"}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [activeAccordion, setActiveAccordion] = useState(null)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false) // Dummy state
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const handleMouseEnter = (dropdown) => {
    setActiveDropdown(dropdown)
  }

  const handleMouseLeave = () => {
    setActiveDropdown(null)
  }

  const handleToolClick = () => {
    setActiveDropdown(null)
    setIsMobileMenuOpen(false)
  }

  const toggleAccordion = (category) => {
    setActiveAccordion(activeAccordion === category ? null : category)
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white backdrop-blur-md border-b border-gray-200/50 shadow-md"
    >
      <div className={className}>
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14,2 14,8 20,8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="10,9 9,9 8,9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">PDF ToolsHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className={`text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg${pathname === "/" ? " text-red-600" : ""}`}
            >
              Home
            </Link>

            {/* Convert PDF Dropdown */}
            <div className="relative" onMouseEnter={() => handleMouseEnter("convert")} onMouseLeave={handleMouseLeave}>
              <button className="text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg flex items-center">
                Convert PDF
                <FiChevronDown className="w-4 h-4 ml-1" />
              </button>

              <AnimatePresence>
                {activeDropdown === "convert" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4"
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">CONVERT TO PDF</h3>
                        {toolCategories["CONVERT TO PDF"].slice(0, 3).map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.url}
                            onClick={handleToolClick}
                            className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-red-100 transition-colors${pathname === tool.url ? " text-red-600 bg-red-100" : ""}`}
                          >
                            <tool.icon className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-700">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">CONVERT FROM PDF</h3>
                        {toolCategories["CONVERT FROM PDF"].slice(0, 3).map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.url}
                            onClick={handleToolClick}
                            className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-red-100 transition-colors${pathname === tool.url ? " text-red-600 bg-red-100" : ""}`}
                          >
                            <tool.icon className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-700">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Tools Dropdown */}
            <div className="relative" onMouseEnter={() => handleMouseEnter("all")} onMouseLeave={handleMouseLeave}>
              <button className="text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg flex items-center">
                All PDF Tools
                <FiChevronDown className="w-4 h-4 ml-1" />
              </button>

              <AnimatePresence>
                {activeDropdown === "all" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-[800px] bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                  >
                    <div className="grid grid-cols-3 gap-6">
                      {Object.entries(toolCategories).map(([category, tools]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">{category}</h3>
                          <div className="space-y-1">
                            {tools.map((tool) => (
                              <Link
                                key={tool.name}
                                href={tool.url}
                                onClick={handleToolClick}
                                className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-red-100 transition-colors${pathname === tool.url ? " text-red-600 bg-red-100" : ""}`}
                              >
                                <tool.icon className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-gray-700">{tool.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/blogs"
              className={`text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg${pathname === "/blogs" ? " text-red-600" : ""}`}
            >
              Blogs
            </Link>
            <Link
              href="/contact"
              className={`text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg${pathname === "/contact" ? " text-red-600" : ""}`}
            > 
              Contact
            </Link>

            {/* User Profile / Sign In */}
            {isUserLoggedIn ? (
              <div
                className="relative"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <button className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors font-medium px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <span>John Doe</span>
                  <FiChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-2"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FiUser className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FiSettings className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Settings</span>
                      </Link>
                      <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-100 transition-colors w-full text-left">
                        <FiLogOut className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/login"
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-shadow ml-4"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden h-screen"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="fixed top-0 left-0 h-screen w-80 bg-white z-50 lg:hidden flex flex-col"
              >
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-white"
                        >
                          <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="14,2 14,8 20,8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="16"
                            y1="13"
                            x2="8"
                            y2="13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line
                            x1="16"
                            y1="17"
                            x2="8"
                            y2="17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="10,9 9,9 8,9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="text-lg font-bold text-gray-900">PDF ToolsHub</span>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-4">
                  <div className="space-y-4">
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block text-gray-700 hover:text-red-600 transition-colors font-medium py-2${pathname === "/" ? " text-red-600" : ""}`}
                    >
                      Home
                    </Link>

                    {/* Mobile Tool Categories */}
                    {Object.entries(toolCategories).map(([category, tools]) => (
                      <div key={category} className="border-b border-gray-100 pb-2">
                        <button
                          onClick={() => toggleAccordion(category)}
                          className="flex items-center justify-between w-full text-left text-gray-700 hover:text-red-600 transition-colors font-medium py-1"
                        >
                          <span>{category}</span>
                          {activeAccordion === category ? (
                            <FiChevronDown className="w-4 h-4" />
                          ) : (
                            <FiChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <AnimatePresence>
                          {activeAccordion === category && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-4 pt-2 space-y-2">
                                {tools.map((tool) => (
                                  <Link
                                    key={tool.name}
                                    href={tool.url}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-red-100 transition-colors${pathname === tool.url ? " text-red-600 bg-red-100" : ""}`}
                                  >
                                    <tool.icon className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-gray-600">{tool.name}</span>
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    <Link
                      href="/blogs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block text-gray-700 hover:text-red-600 transition-colors font-medium py-2${pathname === "/blogs" ? " text-red-600" : ""}`}
                    >
                      Blogs
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block text-gray-700 hover:text-red-600 transition-colors font-medium py-2${pathname === "/contact" ? " text-red-600" : ""}`}
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                {/* Sticky Footer */}
                {!isUserLoggedIn && (
                  <div className="sticky bottom-0 bg-white border-t flex border-gray-100 p-6">
                    <Link href="/auth/login" className="w-full text-center bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-full font-medium">
                      Sign In
                    </Link>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
