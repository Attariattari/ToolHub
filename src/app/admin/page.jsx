"use client"

import { useState, useEffect } from "react"
import { useAnalytics } from "@/context/Analytics.context" // Import your context
import {
  FaUsers,
  FaFilePdf,
  FaChartLine,
  FaEllipsisH,
  FaDownload,
  FaSearch,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaBlog,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaSpinner,
} from "react-icons/fa"
import { TrendingUp } from "lucide-react"
import StatCard from "@/components/admin/StatCard"
import ChartCard from "@/components/admin/ChartCard"
import TableCard from "@/components/admin/TableCard"
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"
import Link from "next/link"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("7d")

  // Use the analytics context
  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    fetchDashboardData,
    getStats,
    getCharts,
    getTables,
    getNotifications,
    getPdfToolsUsage,
    getDailyUsage,
    getPerformanceCategories,
    hasAdminAccess
  } = useAnalytics()

  // Fetch dashboard data when time range changes
  // useEffect(() => {
  //   if (hasAdminAccess) {
  //     fetchDashboardData(timeRange)
  //   }
  // }, [timeRange, hasAdminAccess])

  // Handle time range change
  const handleTimeRangeChange = (e) => {
    const newRange = e.target.value
    setTimeRange(newRange)
    fetchDashboardData(newRange)
  }

  // Get data from context
  const stats = getStats()
  const charts = getCharts()
  const tables = getTables()
  const notifications = getNotifications()
  const pdfToolsUsage = getPdfToolsUsage()
  const dailyUsageData = getDailyUsage()
  const performanceCategories = getPerformanceCategories()
  const recentUsers = tables.recentUsers || []
  const recentPosts = tables.recentPosts || []
  const recentInquiries = tables.recentInquiries || []

  // Show loading state
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <p className="text-red-600 text-lg">{dashboardError}</p>
          <button
            onClick={() => fetchDashboardData(timeRange)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show access denied for non-admin users
  // if (!hasAdminAccess) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-4" />
  //         <p className="text-gray-600 text-lg">Access denied. Admin role required.</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDFDex Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome to your PDF tools management center</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          {/* <div className="relative">
            <select
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FaChartLine className="text-gray-400" size={12} />
            </div>
          </div>
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center">
            <FaDownload className="mr-2" size={12} />
            Export
          </button> */}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || "0"}
          icon={<FaUsers className="text-blue-600" />}
          change={stats.userGrowth || "0%"}
          changeType="increase"
          footer="Compared to last month"
        />
        <StatCard
          title="Total PDF Files Processed"
          value={stats.pdfFilesProcessed || "0"}
          icon={<FaFilePdf className="text-blue-600" />}
          change={stats.processedGrowth || "0%"}
          changeType="increase"
          footer="Compared to last month"
        />
        <StatCard
          title="Total Blog Posts"
          value={stats.blogPosts || "0"}
          icon={<FaBlog className="text-blue-600" />}
          change={stats.blogGrowth || "0%"}
          changeType="increase"
          footer="Compared to last month"
        />
        <StatCard
          title="Active Inquiries"
          value={stats.activeInquiries || "0"}
          icon={<FaEnvelope className="text-blue-600" />}
          change={stats.inquiriesChange || "0%"}
          changeType="decrease"
          footer="Compared to last month"
        />
      </div>

      {/* PDF Tools Usage Chart - Full Width */}
      <ChartCard
        title={`PDF Tools Usage Analytics (${pdfToolsUsage.length} Tools)`}
        actions={
          <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
            <FaEllipsisH size={16} />
          </button>
        }
      >
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pdfToolsUsage} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip
                formatter={(value) => [value.toLocaleString(), "Usage Count"]}
                labelStyle={{ color: "#374151" }}
              />
              <Bar dataKey="usage" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Daily Usage Trend and Categories Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend - Left Side */}
        <ChartCard
          title="Last Week Usage Trend"
          actions={
            <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
              <FaEllipsisH size={16} />
            </button>
          }
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) => [value.toLocaleString(), "Usage Count"]}
                  labelStyle={{ color: "#1f2937" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Categories Performance - Right Side (Custom) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Categories Performance</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-green-500" size={14} />
              <span className="text-xs text-gray-500">Overall trending up</span>
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-1">
              {performanceCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{category.category}</h4>
                      <p className="text-xs text-gray-500">{category.tools} tools</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{category.usage?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Usage</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{category.performance}%</p>
                      <p className="text-xs text-gray-500">Success</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {category.trend === "up" ? (
                        <FaArrowUp className="text-green-500" size={10} />
                      ) : (
                        <FaArrowDown className="text-blue-500" size={10} />
                      )}
                      <span
                        className={`text-xs font-medium ${category.trend === "up" ? "text-green-600" : "text-blue-600"}`}
                      >
                        {category.trend === "up" ? "+" : ""}
                        {category.trendValue}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Posts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latest Blog Posts - 70% width */}
        <div className="lg:col-span-8">
          <TableCard
            title="Latest Blog Posts"
            actions={
              <div className="flex items-center space-x-2">
                <Link href="/admin/blogs/create" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                  + New Post
                </Link>
              </div>
            }
          >
            <table className="min-w-full divide-y border divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{post.title}</p>
                      <p className="text-xs text-gray-500">by {post.author}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {post.status === "Published" ? (
                          <FaCheckCircle className="mr-1 text-green-600" size={12} />
                        ) : (
                          <FaClock className="mr-1 text-yellow-600" size={12} />
                        )}
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.views?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.publishDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-center">
              <Link href="/admin/blogs" className="text-sm text-blue-600 hover:underline">View all posts</Link>
            </div>
          </TableCard>
        </div>

        {/* Latest Notifications - 30% width */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Latest Notifications"
            actions={
              <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
                <FaEllipsisH size={16} />
              </button>
            }
          >
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${!notification.read ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {notification.type === "task_completed" && (
                          <FaCheckCircle className="text-green-500" />
                        )}
                        {notification.type === "task_failed" && (
                          <FaTimesCircle className="text-red-500" />
                        )}
                        {notification.type === "system" && (
                          <FaInfoCircle className="text-purple-500" />
                        )}
                        {notification.type === "other" && (
                          <FaBell className="text-blue-500" />
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 flex items-center justify-between">
                        {notification.title}
                        {!notification.read && <span className="h-2 w-2 bg-blue-600 rounded-full"></span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        <FaClock className="mr-1" size={10} />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:underline">View all notifications</button>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Latest Users and Inquiries - Swapped positions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latest Inquiries - 30% width - Left Side */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Latest Contact Inquiries"
            actions={
              <div className="flex items-center space-x-2">
                <Link href="/admin/inquiries" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                  View All
                </Link>
              </div>
            }
          >
            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
                      {inquiry.firstName?.charAt(0)}
                      {inquiry.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {inquiry.firstName} {inquiry.lastName}
                        </p>
                        <span className="text-xs text-gray-400">{inquiry.time}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{inquiry.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Link href="/admin/inquiries" className="mt-4 text-center">
                <button className="text-sm text-blue-600 hover:underline">View all inquiries →</button>
              </Link>
            </div>
          </ChartCard>
        </div>

        {/* Latest Users - 70% width - Right Side */}
        <div className="lg:col-span-8">
          <TableCard
            title="Latest Users"
            actions={
              <Link href='/admin/users' className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                  View All
              </Link>
            }
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "Premium" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {user.status === "Active" ? (
                          <FaCheckCircle className="mr-1 text-green-600" size={12} />
                        ) : (
                          <FaTimesCircle className="mr-1 text-gray-500" size={12} />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import {
//   FaUsers,
//   FaFilePdf,
//   FaChartLine,
//   FaEllipsisH,
//   FaDownload,
//   FaSearch,
//   FaEnvelope,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaExclamationTriangle,
//   FaInfoCircle,
//   FaClock,
//   FaBlog,
//   FaArrowUp,
//   FaArrowDown,
// } from "react-icons/fa"
// import { TrendingUp } from "lucide-react"
// import StatCard from "@/components/admin/StatCard"
// import ChartCard from "@/components/admin/ChartCard"
// import TableCard from "@/components/admin/TableCard"
// import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"

// export default function DashboardPage() {
//   const [timeRange, setTimeRange] = useState("7d")

//   // Sample data for 27 PDF tools usage
//   const pdfToolsUsage = [
//     { name: "PDF Compress", usage: 2450, color: "#ef4444" },
//     { name: "PDF Split", usage: 1890, color: "#f97316" },
//     { name: "PDF Merge", usage: 1650, color: "#eab308" },
//     { name: "PDF to Word", usage: 1420, color: "#22c55e" },
//     { name: "PDF to Excel", usage: 1180, color: "#06b6d4" },
//     { name: "PDF to PPT", usage: 980, color: "#3b82f6" },
//     { name: "Word to PDF", usage: 1350, color: "#8b5cf6" },
//     { name: "Excel to PDF", usage: 890, color: "#ec4899" },
//     { name: "PPT to PDF", usage: 750, color: "#f59e0b" },
//     { name: "PDF Lock", usage: 1120, color: "#10b981" },
//     { name: "PDF Unlock", usage: 980, color: "#f43f5e" },
//     { name: "Add Signature", usage: 1450, color: "#6366f1" },
//     { name: "Add Watermark", usage: 890, color: "#8b5cf6" },
//     { name: "PDF Edit", usage: 1680, color: "#06b6d4" },
//     { name: "PDF Rotate", usage: 650, color: "#84cc16" },
//     { name: "PDF Organize", usage: 720, color: "#ef4444" },
//     { name: "PDF to Image", usage: 1250, color: "#22c55e" },
//     { name: "Image to PDF", usage: 1150, color: "#eab308" },
//     { name: "PDF Extract", usage: 890, color: "#3b82f6" },
//     { name: "PDF Highlight", usage: 450, color: "#f59e0b" },
//     { name: "PDF Annotate", usage: 380, color: "#ec4899" },
//     { name: "PDF Redact", usage: 320, color: "#6b7280" },
//     { name: "PDF Stamp", usage: 280, color: "#10b981" },
//     { name: "PDF QR Code", usage: 180, color: "#f43f5e" },
//     { name: "PDF Barcode", usage: 150, color: "#8b5cf6" },
//     { name: "PDF Archive", usage: 120, color: "#06b6d4" },
//   ]

//   // Performance categories data
//   const performanceCategories = [
//     {
//       category: "Conversion Tools",
//       usage: 8945,
//       performance: 96.8,
//       trend: "up",
//       trendValue: 12,
//       tools: 10,
//       color: "bg-blue-500",
//     },
//     {
//       category: "Manipulation Tools",
//       usage: 6723,
//       performance: 98.1,
//       trend: "up",
//       trendValue: 8,
//       tools: 4,
//       color: "bg-orange-500",
//     },
//     {
//       category: "Editing Tools",
//       usage: 4567,
//       performance: 97.4,
//       trend: "up",
//       trendValue: 15,
//       tools: 4,
//       color: "bg-yellow-500",
//     },
//     {
//       category: "Security Tools",
//       usage: 3214,
//       performance: 97.1,
//       trend: "up",
//       trendValue: 22,
//       tools: 4,
//       color: "bg-green-500",
//     },
//     {
//       category: "Utility Tools",
//       usage: 1523,
//       performance: 92.3,
//       trend: "down",
//       trendValue: -3,
//       tools: 6,
//       color: "bg-blue-500",
//     },
//     {
//       category: "Optimization Tools",
//       usage: 1875,
//       performance: 97.8,
//       trend: "up",
//       trendValue: 18,
//       tools: 1,
//       color: "bg-purple-500",
//     },
//   ]

//   // Sample data for recent users - 6 items
//   const recentUsers = [
//     {
//       id: 1,
//       name: "Ahmed Khan",
//       email: "ahmed@example.com",
//       role: "User",
//       status: "Active",
//       joinDate: "2024-01-15",
//       lastActivity: "2 hours ago",
//     },
//     {
//       id: 2,
//       name: "Sarah Wilson",
//       email: "sarah@example.com",
//       role: "Premium",
//       status: "Active",
//       joinDate: "2024-01-14",
//       lastActivity: "5 hours ago",
//     },
//     {
//       id: 3,
//       name: "Muhammad Ali",
//       email: "muhammad@example.com",
//       role: "User",
//       status: "Active",
//       joinDate: "2024-01-13",
//       lastActivity: "1 day ago",
//     },
//     {
//       id: 4,
//       name: "Emily Davis",
//       email: "emily@example.com",
//       role: "Premium",
//       status: "Active",
//       joinDate: "2024-01-12",
//       lastActivity: "3 hours ago",
//     },
//     {
//       id: 5,
//       name: "Hassan Ahmed",
//       email: "hassan@example.com",
//       role: "User",
//       status: "Inactive",
//       joinDate: "2024-01-10",
//       lastActivity: "5 days ago",
//     },
//     {
//       id: 6,
//       name: "Fatima Ali",
//       email: "fatima@example.com",
//       role: "Premium",
//       status: "Active",
//       joinDate: "2024-01-09",
//       lastActivity: "1 hour ago",
//     },
//   ]

//   // Sample data for recent blog posts - 5 items
//   const recentPosts = [
//     {
//       id: 1,
//       title: "10 Best PDF Compression Techniques for 2024",
//       author: "Admin",
//       status: "Published",
//       views: 1250,
//       publishDate: "2024-01-15",
//       category: "Tips & Tricks",
//     },
//     {
//       id: 2,
//       title: "How to Secure Your PDF Documents",
//       author: "Admin",
//       status: "Published",
//       views: 890,
//       publishDate: "2024-01-12",
//       category: "Security",
//     },
//     {
//       id: 3,
//       title: "PDF to Word Conversion: Complete Guide",
//       author: "Admin",
//       status: "Draft",
//       views: 0,
//       publishDate: "2024-01-10",
//       category: "Tutorials",
//     },
//     {
//       id: 4,
//       title: "Best Practices for PDF Management",
//       author: "Admin",
//       status: "Published",
//       views: 650,
//       publishDate: "2024-01-08",
//       category: "Best Practices",
//     },
//     {
//       id: 5,
//       title: "Understanding PDF File Formats and Standards",
//       author: "Admin",
//       status: "Draft",
//       views: 0,
//       publishDate: "2024-01-05",
//       category: "Technical",
//     },
//   ]

//   // Sample data for notifications
//   const notifications = [
//     {
//       id: 1,
//       title: "High Server Load Detected",
//       message: "PDF compression service experiencing high load.",
//       time: "5 minutes ago",
//       read: false,
//       type: "alert",
//       icon: <FaExclamationTriangle className="text-yellow-500" />,
//     },
//     {
//       id: 2,
//       title: "New User Registration",
//       message: "50 new users registered in the last hour.",
//       time: "1 hour ago",
//       read: false,
//       type: "user",
//       icon: <FaUsers className="text-blue-500" />,
//     },
//     {
//       id: 3,
//       title: "Blog Post Published",
//       message: "New blog post about PDF security has been published.",
//       time: "3 hours ago",
//       read: true,
//       type: "content",
//       icon: <FaBlog className="text-green-500" />,
//     },
//     {
//       id: 4,
//       title: "Storage Usage Alert",
//       message: "Server storage usage has reached 85% capacity.",
//       time: "6 hours ago",
//       read: true,
//       type: "system",
//       icon: <FaInfoCircle className="text-purple-500" />,
//     },
//   ]

//   // Sample data for recent inquiries - Only 4 items
//   const recentInquiries = [
//     {
//       id: 1,
//       firstName: "John",
//       lastName: "Smith",
//       message:
//         "I'm having trouble compressing my PDF files. The quality seems to be degrading too much when I use your compression tool. Can you help me with better settings?",
//       time: "2 hours ago",
//     },
//     {
//       id: 2,
//       firstName: "Maria",
//       lastName: "Garcia",
//       message:
//         "Hi, I love your PDF tools! Would it be possible to add batch processing for multiple files? This would save me a lot of time for my work projects.",
//       time: "5 hours ago",
//     },
//     {
//       id: 3,
//       firstName: "David",
//       lastName: "Wilson",
//       message:
//         "Hello, I represent a software company and we're interested in integrating your PDF tools into our platform. Could we schedule a call to discuss partnership opportunities?",
//       time: "1 day ago",
//     },
//     {
//       id: 4,
//       firstName: "Lisa",
//       lastName: "Chen",
//       message:
//         "We're a marketing agency looking to purchase licenses for our entire team. Do you offer volume discounts for bulk purchases? We need about 25 licenses.",
//       time: "2 days ago",
//     },
//   ]

//   // Chart data for daily usage
//   const dailyUsageData = [
//     { name: "Mon", usage: 2400 },
//     { name: "Tue", usage: 2800 },
//     { name: "Wed", usage: 3200 },
//     { name: "Thu", usage: 2900 },
//     { name: "Fri", usage: 3500 },
//     { name: "Sat", usage: 2100 },
//     { name: "Sun", usage: 1800 },
//   ]

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">PDFDex Admin Dashboard</h1>
//           <p className="mt-1 text-sm text-gray-500">Welcome to your PDF tools management center</p>
//         </div>
//         <div className="mt-4 md:mt-0 flex items-center space-x-3">
//           <div className="relative">
//             <select
//               value={timeRange}
//               onChange={(e) => setTimeRange(e.target.value)}
//               className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="7d">Last 7 days</option>
//               <option value="30d">Last 30 days</option>
//               <option value="90d">Last 90 days</option>
//               <option value="12m">Last 12 months</option>
//             </select>
//             <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//               <FaChartLine className="text-gray-400" size={12} />
//             </div>
//           </div>
//           <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center">
//             <FaDownload className="mr-2" size={12} />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* Stats grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Users"
//           value="15,847"
//           icon={<FaUsers className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer="Compared to last month"
//         />
//         <StatCard
//           title="PDF Files Processed"
//           value="89,234"
//           icon={<FaFilePdf className="text-blue-600" />}
//           change="18%"
//           changeType="increase"
//           footer="Compared to last month"
//         />
//         <StatCard
//           title="Blog Posts"
//           value="156"
//           icon={<FaBlog className="text-blue-600" />}
//           change="5%"
//           changeType="increase"
//           footer="Compared to last month"
//         />
//         <StatCard
//           title="Active Inquiries"
//           value="23"
//           icon={<FaEnvelope className="text-blue-600" />}
//           change="3%"
//           changeType="decrease"
//           footer="Compared to last month"
//         />
//       </div>

//       {/* PDF Tools Usage Chart - Full Width */}
//       <ChartCard
//         title="PDF Tools Usage Analytics (27 Tools)"
//         actions={
//           <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
//             <FaEllipsisH size={16} />
//           </button>
//         }
//       >
//         <div className="h-96">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={pdfToolsUsage} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
//               <YAxis />
//               <Tooltip
//                 formatter={(value) => [value.toLocaleString(), "Usage Count"]}
//                 labelStyle={{ color: "#374151" }}
//               />
//               <Bar dataKey="usage" fill="#ef4444" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </ChartCard>

//       {/* Daily Usage Trend and Categories Performance */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Daily Usage Trend - Left Side */}
//         <ChartCard
//           title="Daily Usage Trend"
//           actions={
//             <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
//               <FaEllipsisH size={16} />
//             </button>
//           }
//         >
//           <div className="h-80">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={dailyUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                 <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
//                 <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
//                 <Tooltip
//                   formatter={(value) => [value.toLocaleString(), "Usage Count"]}
//                   labelStyle={{ color: "#1f2937" }}
//                   contentStyle={{
//                     backgroundColor: "white",
//                     border: "1px solid #e5e7eb",
//                     borderRadius: "6px",
//                     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                   }}
//                 />
//                 <Line
//                   type="monotone"
//                   dataKey="usage"
//                   stroke="#ef4444"
//                   strokeWidth={3}
//                   dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
//                   activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </ChartCard>

//         {/* Categories Performance - Right Side (Custom) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
//           <div className="flex items-center justify-between p-4 border-b border-gray-200">
//             <h3 className="text-sm font-medium text-gray-900">Categories Performance</h3>
//             <div className="flex items-center space-x-2">
//               <TrendingUp className="text-green-500" size={14} />
//               <span className="text-xs text-gray-500">Overall trending up</span>
//             </div>
//           </div>
//           <div className="p-4">
//             <div className="space-y-3">
//               {performanceCategories.map((category, index) => (
//                 <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-900">{category.category}</h4>
//                       <p className="text-xs text-gray-500">{category.tools} tools</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <div className="text-right">
//                       <p className="text-sm font-semibold text-gray-900">{category.usage.toLocaleString()}</p>
//                       <p className="text-xs text-gray-500">Usage</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-semibold text-gray-900">{category.performance}%</p>
//                       <p className="text-xs text-gray-500">Success</p>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       {category.trend === "up" ? (
//                         <FaArrowUp className="text-green-500" size={10} />
//                       ) : (
//                         <FaArrowDown className="text-blue-500" size={10} />
//                       )}
//                       <span
//                         className={`text-xs font-medium ${category.trend === "up" ? "text-green-600" : "text-blue-600"}`}
//                       >
//                         {category.trend === "up" ? "+" : ""}
//                         {category.trendValue}%
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Latest Posts and Notifications */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Latest Blog Posts - 70% width */}
//         <div className="lg:col-span-8">
//           <TableCard
//             title="Latest Blog Posts"
//             actions={
//               <div className="flex items-center space-x-2">
//                 <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
//                   + New Post
//                 </button>
//               </div>
//             }
//           >
//             <table className="min-w-full divide-y border divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Title
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Views
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {recentPosts.map((post) => (
//                   <tr key={post.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <p className="text-sm font-medium text-gray-900">{post.title}</p>
//                       <p className="text-xs text-gray-500">by {post.author}</p>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                         {post.category}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
//                           }`}
//                       >
//                         {post.status === "Published" ? (
//                           <FaCheckCircle className="mr-1 text-green-600" size={12} />
//                         ) : (
//                           <FaClock className="mr-1 text-yellow-600" size={12} />
//                         )}
//                         {post.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.views.toLocaleString()}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.publishDate}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <div className="mt-4 text-center">
//               <button className="text-sm text-blue-600 hover:underline">View all notifications</button>
//             </div>
//           </TableCard>
//         </div>

//         {/* Latest Notifications - 30% width */}
//         <div className="lg:col-span-4">
//           <ChartCard
//             title="Latest Notifications"
//             actions={
//               <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500">
//                 <FaEllipsisH size={16} />
//               </button>
//             }
//           >
//             <div className="space-y-1 max-h-[400px] overflow-y-auto">
//               {notifications.map((notification) => (
//                 <div
//                   key={notification.id}
//                   className={`p-3 rounded-lg ${!notification.read ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}
//                 >
//                   <div className="flex items-start">
//                     <div className="flex-shrink-0 mt-1">
//                       <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
//                         {notification.icon}
//                       </div>
//                     </div>
//                     <div className="ml-3 flex-1">
//                       <p className="text-sm font-medium text-gray-900 flex items-center justify-between">
//                         {notification.title}
//                         {!notification.read && <span className="h-2 w-2 bg-blue-600 rounded-full"></span>}
//                       </p>
//                       <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
//                       <div className="flex items-center mt-1 text-xs text-gray-400">
//                         <FaClock className="mr-1" size={10} />
//                         {notification.time}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="mt-4 text-center">
//               <button className="text-sm text-blue-600 hover:underline">View all notifications</button>
//             </div>
//           </ChartCard>
//         </div>
//       </div>

//       {/* Latest Users and Inquiries - Swapped positions */}
//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Latest Inquiries - 30% width - Left Side */}
//         <div className="lg:col-span-4">
//           <ChartCard
//             title="Latest Contact Inquiries"
//             actions={
//               <div className="flex items-center space-x-2">
//                 <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
//                   View All
//                 </button>
//               </div>
//             }
//           >
//             <div className="space-y-3">
//               {recentInquiries.map((inquiry) => (
//                 <div key={inquiry.id} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
//                   <div className="flex items-start space-x-3">
//                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
//                       {inquiry.firstName.charAt(0)}
//                       {inquiry.lastName.charAt(0)}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center justify-between mb-2">
//                         <p className="text-sm font-medium text-gray-900">
//                           {inquiry.firstName} {inquiry.lastName}
//                         </p>
//                         <span className="text-xs text-gray-400">{inquiry.time}</span>
//                       </div>
//                       <p className="text-xs text-gray-600 line-clamp-2">{inquiry.message}</p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="mt-4 text-center">
//               <button className="text-sm text-blue-600 hover:underline">View all inquiries →</button>
//             </div>
//           </ChartCard>
//         </div>

//         {/* Latest Users - 70% width - Right Side */}
//         <div className="lg:col-span-8">
//           <TableCard
//             title="Latest Users"
//             actions={
//               <div className="flex items-center space-x-2">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     placeholder="Search users..."
//                     className="pl-8 pr-4 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                   <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//                     <FaSearch className="text-gray-400" size={12} />
//                   </div>
//                 </div>
//               </div>
//             }
//           >
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     User
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Role
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Last Activity
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {recentUsers.map((user) => (
//                   <tr key={user.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
//                           {user.name.charAt(0)}
//                         </div>
//                         <div className="ml-3">
//                           <p className="text-sm font-medium text-gray-900">{user.name}</p>
//                           <p className="text-xs text-gray-500">{user.email}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "Premium" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
//                           }`}
//                       >
//                         {user.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
//                           }`}
//                       >
//                         {user.status === "Active" ? (
//                           <FaCheckCircle className="mr-1 text-green-600" size={12} />
//                         ) : (
//                           <FaTimesCircle className="mr-1 text-gray-500" size={12} />
//                         )}
//                         {user.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActivity}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </TableCard>
//         </div>
//       </div>
//     </div>
//   )
// }
