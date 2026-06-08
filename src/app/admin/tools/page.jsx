"use client"

import React, { useState, useEffect } from "react"
import {
  FaTools,
  FaChartLine,
  FaUsers,
  FaClock,
  FaSearch,
  FaFilter,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa"
import StatCard from "@/components/admin/StatCard"
import TableCard from "@/components/admin/TableCard"
import Pagination from "@/components/admin/Pagination"
import { useAnalytics } from "@/context/Analytics.context"
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
  ScanPDFIcon,
  SignPDFIcon,
  SplitPDFIcon,
  UnlockPDFIcon,
  WatermarkIcon,
  WordToPDFIcon,
} from "@/components/icons/pdfIcons"
import Link from "next/link"

// Icon mapping based on iconName from backend
const iconMap = {
  'MergePDFIcon': MergePDFIcon,
  'SplitPDFIcon': SplitPDFIcon,
  'CompressPDFIcon': CompressPDFIcon,
  'PDFToWordIcon': PDFToWordIcon,
  'PDFtoPowerPointIcon': PDFtoPowerPointIcon,
  'PDFtoExcelIcon': PDFtoExcelIcon,
  'WordToPDFIcon': WordToPDFIcon,
  'PowerPintToPDFIcon': PowerPintToPDFIcon,
  'ExcelToPDFIcon': ExcelToPDFIcon,
  'EditPDFIcon': EditPDFIcon,
  'PDFToJPGIcon': PDFToJPGIcon,
  'JPGToPDFIcon': JPGToPDFIcon,
  'SignPDFIcon': SignPDFIcon,
  'WatermarkIcon': WatermarkIcon,
  'RotatePDFIcon': RotatePDFIcon,
  'HTMLToPDFIcon': HTMLToPDFIcon,
  'UnlockPDFIcon': UnlockPDFIcon,
  'ProtectPDFIcon': ProtectPDFIcon,
  'OrganizePDFIcon': OrganizePDFIcon,
  'PDFToPDFAIcon': PDFToPDFAIcon,
  'RepairPDFIcon': RepairPDFIcon,
  'PageNumberIcon': PageNumberIcon,
  'ScanPDFIcon': ScanPDFIcon,
  'OcrPDFIcon': OcrPDFIcon,
  'ComparePDFIcon': ComparePDFIcon,
  'RedactPDFIcon': RedactPDFIcon,
  'CropPDFIcon': CropPDFIcon,
}

export default function ToolsOverviewPage() {
  const { tools, toolsLoading, toolsError, hasAdminAccess, fetchTools, refreshTools } = useAnalytics()

  // Local state for filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("usage")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch tools on component mount
  // useEffect(() => {
  //   if (hasAdminAccess && tools.length === 0 && !toolsLoading) {
  //     fetchTools()
  //   }
  // }, [hasAdminAccess])

  // Handle loading state
  if (toolsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Loading tools data...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (toolsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Data</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">{toolsError}</p>
          <button
            onClick={refreshTools}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaSpinner className="mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Extract data from API response
  const toolsData = tools.tools || []
  const stats = tools.stats || {}

  // Transform tools data to include icons
  const transformedTools = toolsData.map(tool => ({
    ...tool,
    icon: iconMap[tool.iconName] || MergePDFIcon, // fallback icon
    lastUsedFormatted: new Date(tool.lastUsed).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }))

  // Filter and sort tools (frontend logic)
  const filteredTools = transformedTools
    .filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || tool.category.toLowerCase() === categoryFilter.toLowerCase()
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return (b.usageCount || 0) - (a.usageCount || 0)
        case "users":
          return (b.uniqueUsers || 0) - (a.uniqueUsers || 0)
        case "success":
          return (b.successRate || 0) - (a.successRate || 0)
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return (b.usageCount || 0) - (a.usageCount || 0)
      }
    })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTools = filteredTools.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value)
    setCurrentPage(1)
  }

  const handleSortChange = (value) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  // Get categories from actual data
  const availableCategories = ["all", ...new Set(toolsData.map(tool => tool.category.toLowerCase()))]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools Overview</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor and analyze PDF tool usage and performance</p>
        </div>
        <button
          onClick={refreshTools}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaSpinner className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tools"
          value={stats.totalTools?.toString() || '0'}
          icon={<FaTools className="text-blue-600" />}
          change="4%"
          changeType="increase"
          footer="Active tools"
        />
        <StatCard
          title="Total Usage"
          value={stats.totalUsage?.toLocaleString() || '0'}
          icon={<FaChartLine className="text-blue-600" />}
          change="18%"
          changeType="increase"
          footer="All time"
        />
        <StatCard
          title="Unique Users"
          value={stats.totalUsers?.toLocaleString() || '0'}
          icon={<FaUsers className="text-blue-600" />}
          change="12%"
          changeType="increase"
          footer="All time"
        />
        <StatCard
          title="Avg Success Rate"
          value={`${stats.avgSuccessRate || 0}%`}
          icon={<FaClock className="text-blue-600" />}
          change="2%"
          changeType="increase"
          footer="Overall performance"
        />
      </div>

      {/* Most Popular Tool Card */}
      {stats.mostPopularTool && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Tool</h3>
          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center`}
            >
              {React.createElement(iconMap[stats.mostPopularTool.iconName] || MergePDFIcon, {
                className: "w-6 h-6 text-white"
              })}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900">{stats.mostPopularTool.name}</h4>
              <p className="text-sm text-gray-500">{stats.mostPopularTool.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm font-medium text-gray-900">
                  {(stats.mostPopularTool.usageCount || 0).toLocaleString()} uses
                </span>
                <span className="text-sm text-gray-500">{(stats.mostPopularTool.uniqueUsers || 0).toLocaleString()} users</span>
                <span className="text-sm text-gray-500">{stats.mostPopularTool.successRate || 0}% success rate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tools Table */}
      <TableCard
        title="All PDF Tools"
        actions={
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={14} />
              </div>
            </div>
            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="usage">Sort by Usage</option>
                <option value="users">Sort by Users</option>
                <option value="success">Sort by Success Rate</option>
                <option value="name">Sort by Name</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
          </div>
        }
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTools.map((tool) => (
              <tr key={tool._id || tool.slug} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center`}
                    >
                      {React.createElement(tool.icon, { className: "w-4 h-4 text-white" })}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                        {tool.isNew && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 max-w-xs truncate">{tool.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tool.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{(tool.usageCount || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Avg: {tool.avgProcessingTime || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{(tool.uniqueUsers || 0).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{tool.successRate || 0}%</div>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${tool.successRate || 0}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {tool.trend === "up" ? (
                      <FaArrowUp className="text-green-500 mr-1" size={12} />
                    ) : (
                      <FaArrowDown className="text-red-500 mr-1" size={12} />
                    )}
                    <span className={`text-xs font-medium ${tool.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {tool.trendPercent || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{tool.lastUsedFormatted?.split(',')[0] || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{tool.lastUsedFormatted?.split(',')[1] || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={tool.url || '#'} target="_blank" rel="noopener noreferrer">
                    <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                      <FaEye size={14} />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {currentTools.length === 0 && (
          <div className="text-center py-12">
            <FaTools className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tools found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No tools available."}
            </p>
          </div>
        )}
      </TableCard>

      {/* Pagination */}
      {filteredTools.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTools.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Clear filters option */}
      {(searchTerm || categoryFilter !== "all") && filteredTools.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              setSearchTerm("")
              setCategoryFilter("all")
              setCurrentPage(1)
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import {
//   FaTools,
//   FaChartLine,
//   FaUsers,
//   FaClock,
//   FaSearch,
//   FaFilter,
//   FaEye,
//   FaArrowUp,
//   FaArrowDown,
// } from "react-icons/fa"
// import StatCard from "@/components/admin/StatCard"
// import TableCard from "@/components/admin/TableCard"
// import Pagination from "@/components/admin/Pagination"
// import {
//   ComparePDFIcon,
//   CompressPDFIcon,
//   CropPDFIcon,
//   EditPDFIcon,
//   ExcelToPDFIcon,
//   HTMLToPDFIcon,
//   JPGToPDFIcon,
//   MergePDFIcon,
//   OcrPDFIcon,
//   OrganizePDFIcon,
//   PageNumberIcon,
//   PDFtoExcelIcon,
//   PDFToJPGIcon,
//   PDFToPDFAIcon,
//   PDFtoPowerPointIcon,
//   PDFToWordIcon,
//   PowerPintToPDFIcon,
//   ProtectPDFIcon,
//   RedactPDFIcon,
//   RepairPDFIcon,
//   RotatePDFIcon,
//   ScanPDFIcon,
//   SignPDFIcon,
//   SplitPDFIcon,
//   UnlockPDFIcon,
//   WatermarkIcon,
//   WordToPDFIcon,
// } from "@/components/icons/pdfIcons"

// export default function ToolsOverviewPage() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [categoryFilter, setCategoryFilter] = useState("all")
//   const [sortBy, setSortBy] = useState("usage")
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 10

//   // Tools data with usage statistics
//   const toolsData = [
//     {
//       name: "Merge PDF",
//       description: "Combine PDFs in the order you want with the easiest PDF merger available.",
//       icon: MergePDFIcon,
//       color: "from-blue-50 to-blue-50",
//       url: "/merge-pdf",
//       category: "Manipulation",
//       usageCount: 15420,
//       uniqueUsers: 8934,
//       avgProcessingTime: "2.3s",
//       successRate: 98.5,
//       lastUsed: "2024-01-29 16:45",
//       trend: "up",
//       trendPercent: 12,
//     },
//     {
//       name: "Split PDF",
//       description: "Separate one page or a whole set for easy conversion into independent PDF files.",
//       icon: SplitPDFIcon,
//       color: "from-orange-50 to-orange-50",
//       url: "/split-pdf",
//       category: "Manipulation",
//       usageCount: 12890,
//       uniqueUsers: 7234,
//       avgProcessingTime: "1.8s",
//       successRate: 99.2,
//       lastUsed: "2024-01-29 16:30",
//       trend: "up",
//       trendPercent: 8,
//     },
//     {
//       name: "Compress PDF",
//       description: "Reduce file size while optimizing for maximal PDF quality.",
//       icon: CompressPDFIcon,
//       color: "from-green-50 to-green-50",
//       url: "/compress-pdf",
//       category: "Optimization",
//       usageCount: 18750,
//       uniqueUsers: 11245,
//       avgProcessingTime: "4.2s",
//       successRate: 97.8,
//       lastUsed: "2024-01-29 16:50",
//       trend: "up",
//       trendPercent: 15,
//     },
//     {
//       name: "PDF to Word",
//       description: "Easily convert your PDF files into easy to edit DOC and DOCX documents.",
//       icon: PDFToWordIcon,
//       color: "from-blue-50 to-blue-50",
//       url: "/pdf-to-word",
//       category: "Conversion",
//       usageCount: 22340,
//       uniqueUsers: 13567,
//       avgProcessingTime: "3.7s",
//       successRate: 96.4,
//       lastUsed: "2024-01-29 16:48",
//       trend: "up",
//       trendPercent: 18,
//     },
//     {
//       name: "PDF to PowerPoint",
//       description: "Turn your PDF files into easy to edit PPT and PPTX slideshows.",
//       icon: PDFtoPowerPointIcon,
//       color: "from-purple-50 to-purple-50",
//       url: "/pdf-to-powerpoint",
//       category: "Conversion",
//       usageCount: 8920,
//       uniqueUsers: 5234,
//       avgProcessingTime: "5.1s",
//       successRate: 95.7,
//       lastUsed: "2024-01-29 15:20",
//       trend: "up",
//       trendPercent: 6,
//     },
//     {
//       name: "PDF to Excel",
//       description: "Pull data straight from PDFs into Excel spreadsheets in a few short seconds.",
//       icon: PDFtoExcelIcon,
//       color: "from-emerald-50 to-emerald-50",
//       url: "/pdf-to-excel",
//       category: "Conversion",
//       usageCount: 11450,
//       uniqueUsers: 6789,
//       avgProcessingTime: "4.8s",
//       successRate: 94.2,
//       lastUsed: "2024-01-29 14:35",
//       trend: "up",
//       trendPercent: 10,
//     },
//     {
//       name: "Word to PDF",
//       description: "Make DOC and DOCX files easy to read by converting them to PDF.",
//       icon: WordToPDFIcon,
//       color: "from-indigo-50 to-indigo-50",
//       url: "/word-to-pdf",
//       category: "Conversion",
//       usageCount: 19680,
//       uniqueUsers: 12340,
//       avgProcessingTime: "2.9s",
//       successRate: 98.9,
//       lastUsed: "2024-01-29 16:42",
//       trend: "up",
//       trendPercent: 14,
//     },
//     {
//       name: "PowerPoint to PDF",
//       description: "Make PPT and PPTX slideshows easy to view by converting them to PDF.",
//       icon: PowerPintToPDFIcon,
//       color: "from-pink-50 to-pink-50",
//       url: "/powerpoint-to-pdf",
//       category: "Conversion",
//       usageCount: 7650,
//       uniqueUsers: 4523,
//       avgProcessingTime: "3.4s",
//       successRate: 97.6,
//       lastUsed: "2024-01-29 13:15",
//       trend: "down",
//       trendPercent: 3,
//     },
//     {
//       name: "Excel to PDF",
//       description: "Make EXCEL spreadsheets easy to read by converting them to PDF.",
//       icon: ExcelToPDFIcon,
//       color: "from-teal-50 to-teal-50",
//       url: "/excel-to-pdf",
//       category: "Conversion",
//       usageCount: 9340,
//       uniqueUsers: 5678,
//       avgProcessingTime: "3.1s",
//       successRate: 98.1,
//       lastUsed: "2024-01-29 15:50",
//       trend: "up",
//       trendPercent: 7,
//     },
//     {
//       name: "Edit PDF",
//       description: "Add text, images, shapes or freehand annotations to a PDF document.",
//       icon: EditPDFIcon,
//       color: "from-violet-50 to-violet-50",
//       url: "/edit-pdf",
//       category: "Editing",
//       usageCount: 6780,
//       uniqueUsers: 4123,
//       avgProcessingTime: "6.2s",
//       successRate: 96.8,
//       lastUsed: "2024-01-29 16:25",
//       trend: "up",
//       trendPercent: 22,
//       isNew: true,
//     },
//     {
//       name: "PDF to JPG",
//       description: "Convert each PDF page into a JPG or extract all images contained in a PDF.",
//       icon: PDFToJPGIcon,
//       color: "from-yellow-50 to-yellow-50",
//       url: "/pdf-to-jpg",
//       category: "Conversion",
//       usageCount: 14230,
//       uniqueUsers: 8567,
//       avgProcessingTime: "2.7s",
//       successRate: 99.1,
//       lastUsed: "2024-01-29 16:38",
//       trend: "up",
//       trendPercent: 11,
//     },
//     {
//       name: "JPG to PDF",
//       description: "Convert JPG images to PDF in seconds. Easily adjust orientation and margins.",
//       icon: JPGToPDFIcon,
//       color: "from-cyan-50 to-cyan-50",
//       url: "/jpg-to-pdf",
//       category: "Conversion",
//       usageCount: 16890,
//       uniqueUsers: 9876,
//       avgProcessingTime: "1.9s",
//       successRate: 99.4,
//       lastUsed: "2024-01-29 16:52",
//       trend: "up",
//       trendPercent: 16,
//     },
//     {
//       name: "Sign PDF",
//       description: "Sign yourself or request electronic signatures from others.",
//       icon: SignPDFIcon,
//       color: "from-blue-50 to-pink-50",
//       url: "/sign-pdf",
//       category: "Security",
//       usageCount: 5420,
//       uniqueUsers: 3234,
//       avgProcessingTime: "8.5s",
//       successRate: 97.2,
//       lastUsed: "2024-01-29 14:20",
//       trend: "up",
//       trendPercent: 19,
//     },
//     {
//       name: "Watermark",
//       description: "Stamp an image or text over your PDF in seconds.",
//       icon: WatermarkIcon,
//       color: "from-blue-50 to-cyan-50",
//       url: "/add-watermark",
//       category: "Editing",
//       usageCount: 8760,
//       uniqueUsers: 5123,
//       avgProcessingTime: "3.8s",
//       successRate: 98.3,
//       lastUsed: "2024-01-29 15:45",
//       trend: "up",
//       trendPercent: 9,
//     },
//     {
//       name: "Rotate PDF",
//       description: "Rotate your PDFs the way you need them.",
//       icon: RotatePDFIcon,
//       color: "from-green-50 to-teal-50",
//       url: "/rotate-pdf",
//       category: "Manipulation",
//       usageCount: 4560,
//       uniqueUsers: 2890,
//       avgProcessingTime: "1.2s",
//       successRate: 99.7,
//       lastUsed: "2024-01-29 12:30",
//       trend: "down",
//       trendPercent: 2,
//     },
//     {
//       name: "HTML to PDF",
//       description: "Convert webpages in HTML to PDF.",
//       icon: HTMLToPDFIcon,
//       color: "from-orange-50 to-blue-50",
//       url: "/html-to-pdf",
//       category: "Conversion",
//       usageCount: 3240,
//       uniqueUsers: 1987,
//       avgProcessingTime: "7.3s",
//       successRate: 93.8,
//       lastUsed: "2024-01-29 11:15",
//       trend: "up",
//       trendPercent: 5,
//     },
//     {
//       name: "Unlock PDF",
//       description: "Remove PDF password security.",
//       icon: UnlockPDFIcon,
//       color: "from-emerald-50 to-green-50",
//       url: "/unlock-pdf",
//       category: "Security",
//       usageCount: 6890,
//       uniqueUsers: 4123,
//       avgProcessingTime: "1.5s",
//       successRate: 96.5,
//       lastUsed: "2024-01-29 13:45",
//       trend: "up",
//       trendPercent: 13,
//     },
//     {
//       name: "Protect PDF",
//       description: "Protect PDF files with a password.",
//       icon: ProtectPDFIcon,
//       color: "from-blue-50 to-orange-50",
//       url: "/protect-pdf",
//       category: "Security",
//       usageCount: 7230,
//       uniqueUsers: 4567,
//       avgProcessingTime: "2.1s",
//       successRate: 98.7,
//       lastUsed: "2024-01-29 14:55",
//       trend: "up",
//       trendPercent: 17,
//     },
//     {
//       name: "Organize PDF",
//       description: "Sort pages of your PDF file however you like.",
//       icon: OrganizePDFIcon,
//       color: "from-purple-50 to-pink-50",
//       url: "/organize-pdf",
//       category: "Manipulation",
//       usageCount: 5670,
//       uniqueUsers: 3456,
//       avgProcessingTime: "4.7s",
//       successRate: 97.9,
//       lastUsed: "2024-01-29 16:10",
//       trend: "up",
//       trendPercent: 8,
//     },
//     {
//       name: "PDF to PDF/A",
//       description: "Transform your PDF to PDF/A for long-term archiving.",
//       icon: PDFToPDFAIcon,
//       color: "from-indigo-50 to-purple-50",
//       url: "/pdf-to-pdfa",
//       category: "Conversion",
//       usageCount: 2340,
//       uniqueUsers: 1456,
//       avgProcessingTime: "5.8s",
//       successRate: 95.3,
//       lastUsed: "2024-01-29 10:20",
//       trend: "up",
//       trendPercent: 4,
//     },
//     {
//       name: "Repair PDF",
//       description: "Repair a damaged PDF and recover data from corrupt PDF.",
//       icon: RepairPDFIcon,
//       color: "from-yellow-50 to-orange-50",
//       url: "/repair-pdf",
//       category: "Utility",
//       usageCount: 1890,
//       uniqueUsers: 1234,
//       avgProcessingTime: "9.2s",
//       successRate: 87.4,
//       lastUsed: "2024-01-29 09:45",
//       trend: "up",
//       trendPercent: 15,
//     },
//     {
//       name: "Page numbers",
//       description: "Add page numbers into PDFs with ease.",
//       icon: PageNumberIcon,
//       color: "from-teal-50 to-cyan-50",
//       url: "/add-pdf-page-number",
//       category: "Editing",
//       usageCount: 4320,
//       uniqueUsers: 2678,
//       avgProcessingTime: "2.8s",
//       successRate: 98.6,
//       lastUsed: "2024-01-29 15:30",
//       trend: "up",
//       trendPercent: 12,
//     },
//     {
//       name: "Scan to PDF",
//       description: "Capture document scans from your mobile device.",
//       icon: ScanPDFIcon,
//       color: "from-green-50 to-emerald-50",
//       url: "/scan-to-pdf",
//       category: "Creation",
//       usageCount: 3450,
//       uniqueUsers: 2123,
//       avgProcessingTime: "6.7s",
//       successRate: 94.7,
//       lastUsed: "2024-01-29 14:10",
//       trend: "up",
//       trendPercent: 21,
//     },
//     {
//       name: "OCR PDF",
//       description: "Easily convert scanned PDF into searchable documents.",
//       icon: OcrPDFIcon,
//       color: "from-blue-50 to-indigo-50",
//       url: "/ocr-pdf",
//       category: "Utility",
//       usageCount: 6540,
//       uniqueUsers: 3890,
//       avgProcessingTime: "12.4s",
//       successRate: 91.2,
//       lastUsed: "2024-01-29 16:15",
//       trend: "up",
//       trendPercent: 25,
//     },
//     {
//       name: "Compare PDF",
//       description: "Show a side-by-side document comparison.",
//       icon: ComparePDFIcon,
//       color: "from-violet-50 to-purple-50",
//       url: "/compare-pdf",
//       category: "Utility",
//       usageCount: 2180,
//       uniqueUsers: 1345,
//       avgProcessingTime: "8.9s",
//       successRate: 93.6,
//       lastUsed: "2024-01-29 13:25",
//       trend: "up",
//       trendPercent: 28,
//       isNew: true,
//     },
//     {
//       name: "Redact PDF",
//       description: "Redact text and graphics to permanently remove sensitive information.",
//       icon: RedactPDFIcon,
//       color: "from-blue-50 to-pink-50",
//       url: "/redact-pdf",
//       category: "Security",
//       usageCount: 1560,
//       uniqueUsers: 987,
//       avgProcessingTime: "7.1s",
//       successRate: 96.8,
//       lastUsed: "2024-01-29 11:50",
//       trend: "up",
//       trendPercent: 35,
//       isNew: true,
//     },
//     {
//       name: "Crop PDF",
//       description: "Crop margins of PDF documents or select specific areas.",
//       icon: CropPDFIcon,
//       color: "from-orange-50 to-yellow-50",
//       url: "/crop-pdf",
//       category: "Editing",
//       usageCount: 3780,
//       uniqueUsers: 2234,
//       avgProcessingTime: "3.6s",
//       successRate: 97.4,
//       lastUsed: "2024-01-29 15:05",
//       trend: "up",
//       trendPercent: 18,
//       isNew: true,
//     },
//   ]

//   // Filter and sort tools
//   const filteredTools = toolsData
//     .filter((tool) => {
//       const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase())
//       const matchesCategory = categoryFilter === "all" || tool.category.toLowerCase() === categoryFilter.toLowerCase()
//       return matchesSearch && matchesCategory
//     })
//     .sort((a, b) => {
//       switch (sortBy) {
//         case "usage":
//           return b.usageCount - a.usageCount
//         case "users":
//           return b.uniqueUsers - a.uniqueUsers
//         case "success":
//           return b.successRate - a.successRate
//         case "name":
//           return a.name.localeCompare(b.name)
//         default:
//           return b.usageCount - a.usageCount
//       }
//     })

//   // Calculate pagination
//   const totalPages = Math.ceil(filteredTools.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentTools = filteredTools.slice(startIndex, endIndex)

//   // Reset to first page when filters change
//   const handleSearchChange = (value) => {
//     setSearchTerm(value)
//     setCurrentPage(1)
//   }

//   const handleCategoryFilterChange = (value) => {
//     setCategoryFilter(value)
//     setCurrentPage(1)
//   }

//   const handleSortChange = (value) => {
//     setSortBy(value)
//     setCurrentPage(1)
//   }

//   // Calculate stats
//   const totalTools = toolsData.length
//   const totalUsage = toolsData.reduce((sum, tool) => sum + tool.usageCount, 0)
//   const totalUsers = toolsData.reduce((sum, tool) => sum + tool.uniqueUsers, 0)
//   const avgSuccessRate = (toolsData.reduce((sum, tool) => sum + tool.successRate, 0) / totalTools).toFixed(1)

//   // Get most popular tool
//   const mostPopularTool = toolsData.reduce((prev, current) => (prev.usageCount > current.usageCount ? prev : current))

//   const categories = ["all", "conversion", "manipulation", "editing", "security", "utility", "optimization", "creation"]

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Tools Overview</h1>
//           <p className="mt-1 text-sm text-gray-500">Monitor and analyze PDF tool usage and performance</p>
//         </div>
//       </div>

//       {/* Stats grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Tools"
//           value={totalTools.toString()}
//           icon={<FaTools className="text-blue-600" />}
//           change="4%"
//           changeType="increase"
//           footer="Active tools"
//         />
//         <StatCard
//           title="Total Usage"
//           value={totalUsage.toLocaleString()}
//           icon={<FaChartLine className="text-blue-600" />}
//           change="18%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Unique Users"
//           value={totalUsers.toLocaleString()}
//           icon={<FaUsers className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Avg Success Rate"
//           value={`${avgSuccessRate}%`}
//           icon={<FaClock className="text-blue-600" />}
//           change="2%"
//           changeType="increase"
//           footer="Overall performance"
//         />
//       </div>

//       {/* Most Popular Tool Card */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Tool</h3>
//         <div className="flex items-center space-x-4">
//           <div
//             className={`w-12 h-12 rounded-lg bg-gradient-to-r ${mostPopularTool.color} flex items-center justify-center`}
//           >
//             <mostPopularTool.icon className="w-6 h-6 text-white" />
//           </div>
//           <div className="flex-1">
//             <h4 className="text-xl font-semibold text-gray-900">{mostPopularTool.name}</h4>
//             <p className="text-sm text-gray-500">{mostPopularTool.description}</p>
//             <div className="flex items-center space-x-4 mt-2">
//               <span className="text-sm font-medium text-gray-900">
//                 {mostPopularTool.usageCount.toLocaleString()} uses
//               </span>
//               <span className="text-sm text-gray-500">{mostPopularTool.uniqueUsers.toLocaleString()} users</span>
//               <span className="text-sm text-gray-500">{mostPopularTool.successRate}% success rate</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tools Table */}
//       <TableCard
//         title="All PDF Tools"
//         actions={
//           <div className="flex items-center space-x-3">
//             {/* Search */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search tools..."
//                 value={searchTerm}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//               />
//               <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//                 <FaSearch className="text-gray-400" size={14} />
//               </div>
//             </div>
//             {/* Category Filter */}
//             <div className="relative">
//               <select
//                 value={categoryFilter}
//                 onChange={(e) => handleCategoryFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 {categories.map((category) => (
//                   <option key={category} value={category}>
//                     {category.charAt(0).toUpperCase() + category.slice(1)}
//                   </option>
//                 ))}
//               </select>
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                 <FaFilter className="text-gray-400" size={12} />
//               </div>
//             </div>
//             {/* Sort By */}
//             <div className="relative">
//               <select
//                 value={sortBy}
//                 onChange={(e) => handleSortChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="usage">Sort by Usage</option>
//                 <option value="users">Sort by Users</option>
//                 <option value="success">Sort by Success Rate</option>
//                 <option value="name">Sort by Name</option>
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
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Category
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Success Rate
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Last Used
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {currentTools.map((tool) => (
//               <tr key={tool.name} className="hover:bg-gray-50">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center">
//                     <div
//                       className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tool.color} flex items-center justify-center`}
//                     >
//                       <tool.icon className="w-4 h-4 text-white" />
//                     </div>
//                     <div className="ml-3">
//                       <div className="flex items-center">
//                         <p className="text-sm font-medium text-gray-900">{tool.name}</p>
//                         {tool.isNew && (
//                           <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                             New
//                           </span>
//                         )}
//                       </div>
//                       <p className="text-xs text-gray-500 max-w-xs truncate">{tool.description}</p>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//                     {tool.category}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">{tool.usageCount.toLocaleString()}</div>
//                   <div className="text-xs text-gray-500">Avg: {tool.avgProcessingTime}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{tool.uniqueUsers.toLocaleString()}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     <div className="text-sm font-medium text-gray-900">{tool.successRate}%</div>
//                     <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
//                       <div className="bg-green-600 h-2 rounded-full" style={{ width: `${tool.successRate}%` }}></div>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center">
//                     {tool.trend === "up" ? (
//                       <FaArrowUp className="text-green-500 mr-1" size={12} />
//                     ) : (
//                       <FaArrowDown className="text-blue-500 mr-1" size={12} />
//                     )}
//                     <span className={`text-xs font-medium ${tool.trend === "up" ? "text-green-600" : "text-blue-600"}`}>
//                       {tool.trendPercent}%
//                     </span>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{tool.lastUsed.split(" ")[0]}</div>
//                   <div className="text-xs text-gray-500">{tool.lastUsed.split(" ")[1]}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
//                     <FaEye size={14} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Empty state */}
//         {currentTools.length === 0 && (
//           <div className="text-center py-12">
//             <FaTools className="mx-auto h-12 w-12 text-gray-400" />
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No tools found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               {searchTerm || categoryFilter !== "all"
//                 ? "Try adjusting your search or filter criteria."
//                 : "No tools available."}
//             </p>
//           </div>
//         )}
//       </TableCard>

//       {/* Pagination */}
//       {filteredTools.length > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           totalItems={filteredTools.length}
//           itemsPerPage={itemsPerPage}
//           onPageChange={setCurrentPage}
//         />
//       )}

//       {/* Clear filters option */}
//       {(searchTerm || categoryFilter !== "all") && filteredTools.length > 0 && (
//         <div className="text-center">
//           <button
//             onClick={() => {
//               setSearchTerm("")
//               setCategoryFilter("all")
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
