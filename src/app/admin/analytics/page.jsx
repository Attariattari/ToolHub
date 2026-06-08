"use client"

import React, { useState, useEffect } from "react"
import {
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaExclamationTriangle
} from "react-icons/fa"
import { TrendingUp, TrendingDown } from "lucide-react"
import StatCard from "@/components/admin/StatCard"
import ChartCard from "@/components/admin/ChartCard"
import { useAnalytics } from "@/context/Analytics.context"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function UsageAnalyticsPage() {
  const {
    usageAnalytics,
    analyticsLoading,
    analyticsError,
    hasAdminAccess,
    fetchUsageAnalytics,
    refreshAnalytics
  } = useAnalytics()

  const [timePeriod, setTimePeriod] = useState("this-month")

  // Fetch analytics when component mounts or period changes
  // useEffect(() => {
  //   if (hasAdminAccess) {
  //     fetchUsageAnalytics(timePeriod)
  //   }
  // }, [hasAdminAccess, timePeriod])

  // Check access
  // if (!hasAdminAccess) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="text-center">
  //         <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
  //         <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
  //         <p className="mt-1 text-sm text-gray-500">
  //           You need admin privileges to access this page.
  //         </p>
  //       </div>
  //     </div>
  //   )
  // }

  // Handle loading state
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (analyticsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Analytics</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">{analyticsError}</p>
          <button
            onClick={() => refreshAnalytics(timePeriod)}
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
  const {
    usageTrends = [],
    trendingUpTools = [],
    trendingDownTools = [],
    categoryUsageData = [],
    conversionToolsData = [],
    peakHoursData = [],
    stats = {}
  } = usageAnalytics

  const timePeriods = [
    { value: "this-week", label: "This Week" },
    { value: "this-month", label: "This Month" },
    { value: "this-year", label: "This Year" },
  ]

  const getXAxisKey = () => {
    switch (timePeriod) {
      case "this-week":
        return "day"
      case "this-month":
        return "period"
      case "this-year":
        return "period"
      default:
        return "period"
    }
  }

  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod)
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive analysis of PDF tool usage patterns and trends</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          {/* Time Period Filter */}
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => handleTimePeriodChange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {timePeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-400" size={12} />
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => refreshAnalytics(timePeriod)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center font-medium border"
          >
            <FaSpinner className="mr-2" size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Usage"
          value={stats.totalUsage?.toLocaleString() || '0'}
          icon={<FaChartLine className="text-blue-600" />}
          change="18%"
          changeType="increase"
          footer={`${timePeriod.replace("-", " ")}`}
        />
        <StatCard
          title="Unique Users"
          value={stats.totalUsers?.toLocaleString() || '0'}
          icon={<FaUsers className="text-blue-600" />}
          change="12%"
          changeType="increase"
          footer={`${timePeriod.replace("-", " ")}`}
        />
        <StatCard
          title="Daily Average"
          value={stats.avgDailyUsage?.toLocaleString() || '0'}
          icon={<FaClock className="text-blue-600" />}
          change="8%"
          changeType="increase"
          footer="Usage per day"
        />
        <StatCard
          title="Peak Day"
          value={stats.peakDay?.totalUsage?.toLocaleString() || '0'}
          icon={<TrendingUp className="text-blue-600" size={20} />}
          change="25%"
          changeType="increase"
          footer={`${stats.peakDay?.day || stats.peakDay?.period || 'N/A'}`}
        />
      </div>

      {/* Overall Usage Trends - Full Width */}
      {usageTrends.length > 0 && (
        <ChartCard
          title="Overall Usage Trends - All Tools Combined"
          actions={
            <div className="flex items-center space-x-2">
              <FaChartLine className="text-gray-400" size={14} />
              <span className="text-xs text-gray-500 capitalize">{timePeriod.replace("-", " ")}</span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={usageTrends}>
              <defs>
                <linearGradient id="colorTotalUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUniqueUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={getXAxisKey()} tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "totalUsage") return [value.toLocaleString(), "Total Usage"]
                  if (name === "uniqueUsers") return [value.toLocaleString(), "Unique Users"]
                  return [value, name]
                }}
                labelStyle={{ color: "#1f2937" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalUsage"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotalUsage)"
                name="Total Usage"
              />
              <Area
                type="monotone"
                dataKey="uniqueUsers"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorUniqueUsers)"
                name="Unique Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Trending Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Up */}
        <ChartCard
          title="Trending Up Tools"
          actions={
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-green-500" size={14} />
              <span className="text-xs text-green-600">Growing Fast</span>
            </div>
          }
        >
          <div className="space-y-4">
            {trendingUpTools.length > 0 ? (
              trendingUpTools.map((tool, index) => (
                <div key={tool.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                        {tool.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{tool.usage?.toLocaleString() || 0} uses</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <FaArrowUp size={12} />
                    <span className="text-sm font-semibold">+{tool.trend || 0}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No trending up tools found</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Trending Down */}
        <ChartCard
          title="Trending Down Tools"
          actions={
            <div className="flex items-center space-x-2">
              <TrendingDown className="text-blue-500" size={14} />
              <span className="text-xs text-blue-600">Declining</span>
            </div>
          }
        >
          <div className="space-y-4">
            {trendingDownTools.length > 0 ? (
              trendingDownTools.map((tool, index) => (
                <div key={tool.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tool.name}</p>
                      <p className="text-xs text-gray-500">{tool.usage?.toLocaleString() || 0} uses</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600">
                    <FaArrowDown size={12} />
                    <span className="text-sm font-semibold">{tool.trend || 0}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No trending down tools found</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Usage Distribution */}
        <ChartCard
          title="Usage by Category"
          actions={
            <div className="flex items-center space-x-2">
              <FaChartPie className="text-gray-400" size={14} />
              <span className="text-xs text-gray-500">Distribution</span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categoryUsageData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={140}
                paddingAngle={3}
                dataKey="usage"
              >
                {categoryUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value.toLocaleString(), "Usage Count"]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => <span style={{ color: entry.color, fontSize: "12px" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Conversion Tools */}
        <ChartCard
          title="Top Conversion Tools"
          actions={
            <div className="flex items-center space-x-2">
              <FaChartBar className="text-gray-400" size={14} />
              <span className="text-xs text-gray-500">Most Popular</span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={conversionToolsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "usage") return [value.toLocaleString(), "Usage Count"]
                  if (name === "successRate") return [`${value}%`, "Success Rate"]
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="usage" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Peak Usage Hours */}
      {peakHoursData.length > 0 && (
        <ChartCard
          title="Peak Usage Hours (24-Hour Pattern)"
          actions={
            <div className="flex items-center space-x-2">
              <FaClock className="text-gray-400" size={14} />
              <span className="text-xs text-gray-500">Daily Pattern</span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={peakHoursData}>
              <defs>
                <linearGradient id="colorHourlyUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#64748b" />
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
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHourlyUsage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Category Summary Cards */}
      {categoryUsageData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryUsageData.map((category) => (
            <div
              key={category.category}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">{category.category}</h4>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{category.usage?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Total Usage</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{category.tools || 0} tools</span>
                  <span className="text-xs font-medium text-green-600">{category.avgSuccess || 0}% success</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import {
//   FaChartLine,
//   FaChartBar,
//   FaChartPie,
//   FaCalendarAlt,
//   FaDownload,
//   FaUsers,
//   FaClock,
//   FaArrowUp,
//   FaArrowDown,
// } from "react-icons/fa"
// import { TrendingUp, TrendingDown } from "lucide-react"
// import StatCard from "@/components/admin/StatCard"
// import ChartCard from "@/components/admin/ChartCard"
// import {
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts"

// export default function UsageAnalyticsPage() {
//   const [timePeriod, setTimePeriod] = useState("this-month")
//   const [selectedCategory, setSelectedCategory] = useState("all")

//   // Overall usage trends data (all tools combined)
//   const overallUsageData = {
//     "this-week": [
//       { day: "Monday", totalUsage: 3245, uniqueUsers: 1456, topTool: "PDF to Word" },
//       { day: "Tuesday", totalUsage: 3567, uniqueUsers: 1623, topTool: "Compress PDF" },
//       { day: "Wednesday", totalUsage: 4890, uniqueUsers: 2134, topTool: "Merge PDF" },
//       { day: "Thursday", totalUsage: 5234, uniqueUsers: 2456, topTool: "PDF to Word" },
//       { day: "Friday", totalUsage: 6456, uniqueUsers: 2823, topTool: "JPG to PDF" },
//       { day: "Saturday", totalUsage: 4678, uniqueUsers: 2067, topTool: "Split PDF" },
//       { day: "Sunday", totalUsage: 3234, uniqueUsers: 1445, topTool: "Word to PDF" },
//     ],
//     "this-month": [
//       { period: "Week 1", totalUsage: 28456, uniqueUsers: 12345, topTool: "PDF to Word" },
//       { period: "Week 2", totalUsage: 32234, uniqueUsers: 14567, topTool: "Compress PDF" },
//       { period: "Week 3", totalUsage: 35567, uniqueUsers: 16234, topTool: "Merge PDF" },
//       { period: "Week 4", totalUsage: 38234, uniqueUsers: 17890, topTool: "PDF to Word" },
//     ],
//     "this-year": [
//       { period: "Jan", totalUsage: 125456, uniqueUsers: 48234 },
//       { period: "Feb", totalUsage: 138234, uniqueUsers: 52123 },
//       { period: "Mar", totalUsage: 145567, uniqueUsers: 55234 },
//       { period: "Apr", totalUsage: 139890, uniqueUsers: 53567 },
//       { period: "May", totalUsage: 153234, uniqueUsers: 58123 },
//       { period: "Jun", totalUsage: 165567, uniqueUsers: 62234 },
//       { period: "Jul", totalUsage: 178890, uniqueUsers: 67456 },
//       { period: "Aug", totalUsage: 172234, uniqueUsers: 65567 },
//       { period: "Sep", totalUsage: 185567, uniqueUsers: 70123 },
//       { period: "Oct", totalUsage: 198234, uniqueUsers: 75234 },
//       { period: "Nov", totalUsage: 205567, uniqueUsers: 78123 },
//       { period: "Dec", totalUsage: 218890, uniqueUsers: 82234 },
//     ],
//   }

//   // Trending tools data
//   const trendingUpTools = [
//     { name: "Edit PDF", usage: 6780, trend: 35, isNew: true },
//     { name: "Redact PDF", usage: 1560, trend: 28, isNew: true },
//     { name: "OCR PDF", usage: 6540, trend: 25 },
//     // { name: "Compare PDF", usage: 2180, trend: 22, isNew: true },
//     { name: "Sign PDF", usage: 5420, trend: 19 },
//     { name: "Crop PDF", usage: 3780, trend: 18, isNew: true },
//   ]

//   const trendingDownTools = [
//     { name: "HTML to PDF", usage: 3240, trend: -5 },
//     { name: "PowerPoint to PDF", usage: 7650, trend: -3 },
//     { name: "Rotate PDF", usage: 4560, trend: -2 },
//     { name: "Unlock PDF", usage: 5932, trend: -3 },
//     { name: "PDF to PDF/A", usage: 4560, trend: -2 }
//   ]

//   // Category-wise detailed data
//   const categoryUsageData = [
//     { category: "Conversion", usage: 89456, tools: 10, avgSuccess: 96.8, color: "#ef4444" },
//     { category: "Manipulation", usage: 67234, tools: 4, avgSuccess: 98.1, color: "#f97316" },
//     { category: "Editing", usage: 45678, tools: 4, avgSuccess: 97.4, color: "#eab308" },
//     { category: "Security", usage: 32145, tools: 4, avgSuccess: 97.1, color: "#22c55e" },
//     { category: "Utility", usage: 15234, tools: 6, avgSuccess: 92.3, color: "#3b82f6" },
//     { category: "Optimization", usage: 18750, tools: 1, avgSuccess: 97.8, color: "#8b5cf6" },
//   ]

//   // Top conversion tools
//   const conversionToolsData = [
//     { name: "PDF to Word", usage: 22340, successRate: 96.4 },
//     { name: "Word to PDF", usage: 19680, successRate: 98.9 },
//     { name: "JPG to PDF", usage: 16890, successRate: 99.4 },
//     { name: "PDF to JPG", usage: 14230, successRate: 99.1 },
//     { name: "PDF to Excel", usage: 11450, successRate: 94.2 },
//     { name: "Excel to PDF", usage: 9340, successRate: 98.1 },
//   ]

//   // Peak usage hours
//   const peakHoursData = [
//     { hour: "00:00", usage: 245 },
//     { hour: "02:00", usage: 123 },
//     { hour: "04:00", usage: 89 },
//     { hour: "06:00", usage: 156 },
//     { hour: "08:00", usage: 567 },
//     { hour: "10:00", usage: 1234 },
//     { hour: "12:00", usage: 1567 },
//     { hour: "14:00", usage: 1890 },
//     { hour: "16:00", usage: 2134 },
//     { hour: "18:00", usage: 1678 },
//     { hour: "20:00", usage: 1234 },
//     { hour: "22:00", usage: 789 },
//   ]

//   const timePeriods = [
//     { value: "this-week", label: "This Week" },
//     { value: "this-month", label: "This Month" },
//     { value: "this-year", label: "This Year" },
//   ]

//   const getXAxisKey = () => {
//     switch (timePeriod) {
//       case "this-week":
//         return "day"
//       case "this-month":
//         return "period"
//       case "this-year":
//         return "period"
//       default:
//         return "period"
//     }
//   }

//   // Calculate stats
//   const currentData = overallUsageData[timePeriod]
//   const totalUsage = currentData.reduce((sum, item) => sum + item.totalUsage, 0)
//   const totalUsers = currentData.reduce((sum, item) => sum + item.uniqueUsers, 0)
//   const avgDailyUsage = Math.round(totalUsage / currentData.length)
//   const peakDay = currentData.reduce((prev, current) => (prev.totalUsage > current.totalUsage ? prev : current))

//   return (
//     <div className="space-y-8">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
//           <p className="mt-1 text-sm text-gray-500">Comprehensive analysis of PDF tool usage patterns and trends</p>
//         </div>
//         <div className="mt-4 md:mt-0 flex items-center space-x-3">
//           {/* Time Period Filter */}
//           <div className="relative">
//             <select
//               value={timePeriod}
//               onChange={(e) => setTimePeriod(e.target.value)}
//               className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//             >
//               {timePeriods.map((period) => (
//                 <option key={period.value} value={period.value}>
//                   {period.label}
//                 </option>
//               ))}
//             </select>
//             <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//               <FaCalendarAlt className="text-gray-400" size={12} />
//             </div>
//             <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//               </svg>
//             </div>
//           </div>
//           <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium">
//             <FaDownload className="mr-2" size={14} />
//             Export Report
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Usage"
//           value={totalUsage.toLocaleString()}
//           icon={<FaChartLine className="text-blue-600" />}
//           change="18%"
//           changeType="increase"
//           footer={`${timePeriod.replace("-", " ")}`}
//         />
//         <StatCard
//           title="Unique Users"
//           value={totalUsers.toLocaleString()}
//           icon={<FaUsers className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer={`${timePeriod.replace("-", " ")}`}
//         />
//         <StatCard
//           title="Daily Average"
//           value={avgDailyUsage.toLocaleString()}
//           icon={<FaClock className="text-blue-600" />}
//           change="8%"
//           changeType="increase"
//           footer="Usage per day"
//         />
//         <StatCard
//           title="Peak Day"
//           value={peakDay.totalUsage.toLocaleString()}
//           icon={<TrendingUp className="text-blue-600" size={20} />}
//           change="25%"
//           changeType="increase"
//           footer={`${peakDay.day || peakDay.period}`}
//         />
//       </div>

//       {/* Overall Usage Trends - Full Width */}
//       <ChartCard
//         title="Overall Usage Trends - All Tools Combined"
//         actions={
//           <div className="flex items-center space-x-2">
//             <FaChartLine className="text-gray-400" size={14} />
//             <span className="text-xs text-gray-500 capitalize">{timePeriod.replace("-", " ")}</span>
//           </div>
//         }
//       >
//         <ResponsiveContainer width="100%" height={400}>
//           <AreaChart data={currentData}>
//             <defs>
//               <linearGradient id="colorTotalUsage" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
//                 <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
//               </linearGradient>
//               <linearGradient id="colorUniqueUsers" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
//                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//             <XAxis dataKey={getXAxisKey()} tick={{ fontSize: 12 }} stroke="#64748b" />
//             <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
//             <Tooltip
//               formatter={(value, name) => {
//                 if (name === "totalUsage") return [value.toLocaleString(), "Total Usage"]
//                 if (name === "uniqueUsers") return [value.toLocaleString(), "Unique Users"]
//                 return [value, name]
//               }}
//               labelStyle={{ color: "#1f2937" }}
//               contentStyle={{
//                 backgroundColor: "white",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "6px",
//                 boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//               }}
//             />
//             <Legend />
//             <Area
//               type="monotone"
//               dataKey="totalUsage"
//               stroke="#ef4444"
//               strokeWidth={3}
//               fillOpacity={1}
//               fill="url(#colorTotalUsage)"
//               name="Total Usage"
//             />
//             <Area
//               type="monotone"
//               dataKey="uniqueUsers"
//               stroke="#3b82f6"
//               strokeWidth={3}
//               fillOpacity={1}
//               fill="url(#colorUniqueUsers)"
//               name="Unique Users"
//             />
//           </AreaChart>
//         </ResponsiveContainer>
//       </ChartCard>

//       {/* Trending Tools Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Trending Up */}
//         <ChartCard
//           title="Trending Up Tools"
//           actions={
//             <div className="flex items-center space-x-2">
//               <TrendingUp className="text-green-500" size={14} />
//               <span className="text-xs text-green-600">Growing Fast</span>
//             </div>
//           }
//         >
//           <div className="space-y-4">
//             {trendingUpTools.map((tool, index) => (
//               <div key={tool.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
//                     {index + 1}
//                   </div>
//                   <div>
//                     <div className="flex items-center space-x-2">
//                       <p className="text-sm font-medium text-gray-900">{tool.name}</p>
//                       {tool.isNew && (
//                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                           New
//                         </span>
//                       )}
//                     </div>
//                     <p className="text-xs text-gray-500">{tool.usage.toLocaleString()} uses</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-1 text-green-600">
//                   <FaArrowUp size={12} />
//                   <span className="text-sm font-semibold">+{tool.trend}%</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </ChartCard>

//         {/* Trending Down */}
//         <ChartCard
//           title="Trending Down Tools"
//           actions={
//             <div className="flex items-center space-x-2">
//               <TrendingDown className="text-blue-500" size={14} />
//               <span className="text-xs text-blue-600">Declining</span>
//             </div>
//           }
//         >
//           <div className="space-y-4">
//             {trendingDownTools.map((tool, index) => (
//               <div key={tool.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
//                     {index + 1}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-900">{tool.name}</p>
//                     <p className="text-xs text-gray-500">{tool.usage.toLocaleString()} uses</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-1 text-blue-600">
//                   <FaArrowDown size={12} />
//                   <span className="text-sm font-semibold">{tool.trend}%</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </ChartCard>
//       </div>

//       {/* Category Analysis */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Category Usage Distribution */}
//         <ChartCard
//           title="Usage by Category"
//           actions={
//             <div className="flex items-center space-x-2">
//               <FaChartPie className="text-gray-400" size={14} />
//               <span className="text-xs text-gray-500">Distribution</span>
//             </div>
//           }
//         >
//           <ResponsiveContainer width="100%" height={350}>
//             <PieChart>
//               <Pie
//                 data={categoryUsageData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={70}
//                 outerRadius={140}
//                 paddingAngle={3}
//                 dataKey="usage"
//               >
//                 {categoryUsageData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value) => [value.toLocaleString(), "Usage Count"]}
//                 contentStyle={{
//                   backgroundColor: "white",
//                   border: "1px solid #e5e7eb",
//                   borderRadius: "6px",
//                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                 }}
//               />
//               <Legend
//                 verticalAlign="bottom"
//                 height={36}
//                 formatter={(value, entry) => <span style={{ color: entry.color, fontSize: "12px" }}>{value}</span>}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//         </ChartCard>

//         {/* Top Conversion Tools */}
//         <ChartCard
//           title="Top Conversion Tools"
//           actions={
//             <div className="flex items-center space-x-2">
//               <FaChartBar className="text-gray-400" size={14} />
//               <span className="text-xs text-gray-500">Most Popular</span>
//             </div>
//           }
//         >
//           <ResponsiveContainer width="100%" height={350}>
//             <BarChart data={conversionToolsData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//               <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" angle={-45} textAnchor="end" height={80} />
//               <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
//               <Tooltip
//                 formatter={(value, name) => {
//                   if (name === "usage") return [value.toLocaleString(), "Usage Count"]
//                   if (name === "successRate") return [`${value}%`, "Success Rate"]
//                   return [value, name]
//                 }}
//                 contentStyle={{
//                   backgroundColor: "white",
//                   border: "1px solid #e5e7eb",
//                   borderRadius: "6px",
//                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                 }}
//               />
//               <Bar dataKey="usage" fill="#ef4444" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </ChartCard>
//       </div>

//       {/* Peak Usage Hours */}
//       <ChartCard
//         title="Peak Usage Hours (24-Hour Pattern)"
//         actions={
//           <div className="flex items-center space-x-2">
//             <FaClock className="text-gray-400" size={14} />
//             <span className="text-xs text-gray-500">Daily Pattern</span>
//           </div>
//         }
//       >
//         <ResponsiveContainer width="100%" height={300}>
//           <AreaChart data={peakHoursData}>
//             <defs>
//               <linearGradient id="colorHourlyUsage" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
//                 <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//             <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#64748b" />
//             <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
//             <Tooltip
//               formatter={(value) => [value.toLocaleString(), "Usage Count"]}
//               labelStyle={{ color: "#1f2937" }}
//               contentStyle={{
//                 backgroundColor: "white",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: "6px",
//                 boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//               }}
//             />
//             <Area
//               type="monotone"
//               dataKey="usage"
//               stroke="#8b5cf6"
//               strokeWidth={2}
//               fillOpacity={1}
//               fill="url(#colorHourlyUsage)"
//             />
//           </AreaChart>
//         </ResponsiveContainer>
//       </ChartCard>

//       {/* Category Summary Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//         {categoryUsageData.map((category) => (
//           <div
//             key={category.category}
//             className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
//           >
//             <div className="flex items-center justify-between mb-3">
//               <h4 className="text-sm font-medium text-gray-900">{category.category}</h4>
//               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
//             </div>
//             <div className="space-y-2">
//               <div>
//                 <p className="text-lg font-semibold text-gray-900">{category.usage.toLocaleString()}</p>
//                 <p className="text-xs text-gray-500">Total Usage</p>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-xs text-gray-500">{category.tools} tools</span>
//                 <span className="text-xs font-medium text-green-600">{category.avgSuccess}% success</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }
