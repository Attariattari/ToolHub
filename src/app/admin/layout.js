"use client"
import { useState, useEffect } from "react"
import DashboardSidebar from "@/components/admin/DashboardSidebar"
import DashboardNavbar from "@/components/admin/DashboardNavbar"
import "../globals.css"
import { InquiriesProvider } from "@/context/Inquiries.context"
import { BlogsProvider } from "@/context/Blog.context"
import { ToastContainer } from "react-toastify"
import { AdminProvider } from "@/context/Admin.context"
import { AnalyticsProvider } from "@/context/Analytics.context"
import { NotificationProvider } from "@/context/Notification.context"

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
      // On mobile, sidebar should be collapsed by default
      if (isMobileView && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }

    // Initial check
    checkIfMobile()
    // Add event listener
    window.addEventListener("resize", checkIfMobile)
    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <InquiriesProvider>
      <AdminProvider>
        <AnalyticsProvider>
          <NotificationProvider>
            <BlogsProvider>
              <div className="min-h-screen bg-gray-50 scrollbar-hide">
                <DashboardSidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                <div className={`transition-all duration-300 scrollbar-hide ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
                  <DashboardNavbar toggleSidebar={toggleSidebar} />
                  <main className="p-4 md:p-6 scrollbar-hide">{children}</main>
                </div>
              </div>
              <ToastContainer />
            </BlogsProvider>
          </NotificationProvider>
        </AnalyticsProvider>
      </AdminProvider>
    </InquiriesProvider>
  )
}
