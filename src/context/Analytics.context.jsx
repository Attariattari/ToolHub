'use client'
import React, { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import Api from "@/utils/Api";
import { useRouter } from "next/navigation";
import { UserContext } from "./User.context";

// Create the context
const AnalyticsContext = createContext();

// Create a provider component
const AnalyticsProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  // Tools state
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState(null);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Usage analytics state
  const [usageAnalytics, setUsageAnalytics] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Check if user has admin access
  const hasAdminAccess = user && (user.role === 'admin' || user.role === 'super_admin');

  // Fetch dashboard data - NEW MAIN METHOD
  const fetchDashboardData = async (period = '7d') => {
    if (!hasAdminAccess) {
      setDashboardError("Access denied. Admin role required.");
      return;
    }

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const response = await Api.get(`/admin/dashboard?period=${period}`);

      if (response.data?.success) {
        const data = response.data.data;
        setDashboardData(data);

        // DON'T update legacy states here - let them maintain their own data
        // This was causing the conflict
      } else {
        throw new Error(response.data?.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
      setDashboardError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch all tools - SEPARATE API CALL
  const fetchTools = async () => {
    if (!hasAdminAccess) {
      setToolsError("Access denied. Admin role required.");
      return;
    }

    setToolsLoading(true);
    setToolsError(null);

    try {
      const response = await Api.get('/admin/tools/fetch');

      if (response.data?.success) {
        setTools(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch tools');
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tools';
      setToolsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setToolsLoading(false);
    }
  };

  // Fetch usage analytics - SEPARATE API CALL
  const fetchUsageAnalytics = async (period = 'this-month') => {
    if (!hasAdminAccess) {
      setAnalyticsError("Access denied. Admin role required.");
      return;
    }

    setAnalyticsLoading(true);
    setAnalyticsError(null);

    try {
      const response = await Api.get(`/admin/analytics/usage?period=${period}`);

      if (response.data?.success) {
        setUsageAnalytics(response.data.data || {});
      } else {
        throw new Error(response.data?.message || 'Failed to fetch usage analytics');
      }
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch usage analytics';
      setAnalyticsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Refresh methods
  const refreshTools = () => {
    fetchTools();
  };

  const refreshAnalytics = (period = 'this-month') => {
    fetchUsageAnalytics(period);
  };

  const refreshDashboard = (period = '7d') => {
    fetchDashboardData(period);
  };

  // FIXED: Separate useEffects with proper dependency arrays
  // Auto-fetch tools when user gains admin access (only if tools array is empty)
  useEffect(() => {
    if (hasAdminAccess && tools.length === 0 && !toolsLoading) {
      fetchTools();
    }
  }, [hasAdminAccess]); // Only depend on hasAdminAccess

  // Auto-fetch analytics when user gains admin access (only if analytics object is empty)
  useEffect(() => {
    if (hasAdminAccess && Object.keys(usageAnalytics).length === 0 && !analyticsLoading) {
      fetchUsageAnalytics();
    }
  }, [hasAdminAccess]); // Only depend on hasAdminAccess

  // Auto-fetch dashboard when user gains admin access (only if dashboard object is empty)
  useEffect(() => {
    if (hasAdminAccess && Object.keys(dashboardData).length === 0 && !dashboardLoading) {
      fetchDashboardData();
    }
  }, [hasAdminAccess]); // Only depend on hasAdminAccess

  // Derived data getters for easy access
  const getStats = () => dashboardData.stats || {};
  const getCharts = () => dashboardData.charts || {};
  const getTables = () => dashboardData.tables || {};
  const getNotifications = () => dashboardData.notifications || [];
  const getRecentUsers = () => dashboardData.tables?.recentUsers || [];
  const getRecentPosts = () => dashboardData.tables?.recentPosts || [];
  const getRecentInquiries = () => dashboardData.tables?.recentInquiries || [];

  // For backward compatibility, these methods will return dashboard data if available,
  // otherwise they'll return from the separate tools API
  const getPdfToolsUsage = () => {
    // First try dashboard data, then fall back to tools data
    return dashboardData.charts?.pdfToolsUsage || tools.tools || [];
  };

  const getDailyUsage = () => dashboardData.charts?.dailyUsageData || [];
  const getPerformanceCategories = () => dashboardData.charts?.performanceCategories || [];

  const contextValue = {
    // Dashboard data (NEW)
    dashboardData,
    dashboardLoading,
    dashboardError,
    fetchDashboardData,
    refreshDashboard,

    // Tools data (SEPARATE)
    tools,
    toolsLoading,
    toolsError,
    fetchTools,
    refreshTools,

    // Analytics data (SEPARATE)
    usageAnalytics,
    analyticsLoading,
    analyticsError,
    fetchUsageAnalytics,
    refreshAnalytics,

    // Access control
    hasAdminAccess,

    // Getter methods for easy access
    getStats,
    getCharts,
    getTables,
    getNotifications,
    getRecentUsers,
    getRecentPosts,
    getRecentInquiries,
    getPdfToolsUsage,
    getDailyUsage,
    getPerformanceCategories,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use the analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export { AnalyticsContext, AnalyticsProvider };


// 'use client'
// import React, { createContext, useState, useEffect, useContext } from "react";
// import { toast } from "react-toastify";
// import Api from "@/utils/Api";
// import { useRouter } from "next/navigation";
// import { UserContext } from "./User.context";

// // Create the context
// const AnalyticsContext = createContext();

// // Create a provider component
// const AnalyticsProvider = ({ children }) => {
//   const { user } = useContext(UserContext);
//   const router = useRouter();

//   // Tools state
//   const [tools, setTools] = useState([]);
//   const [toolsLoading, setToolsLoading] = useState(false);
//   const [toolsError, setToolsError] = useState(null);

//   // Dashboard state
//   const [dashboardData, setDashboardData] = useState({});
//   const [dashboardLoading, setDashboardLoading] = useState(false);
//   const [dashboardError, setDashboardError] = useState(null);

//   // Usage analytics state
//   const [usageAnalytics, setUsageAnalytics] = useState({});
//   const [analyticsLoading, setAnalyticsLoading] = useState(false);
//   const [analyticsError, setAnalyticsError] = useState(null);

//   // Check if user has admin access
//   const hasAdminAccess = user && (user.role === 'admin' || user.role === 'super_admin');


//   // Fetch dashboard data - NEW MAIN METHOD
//   const fetchDashboardData = async (period = '7d') => {
//     if (!hasAdminAccess) {
//       setDashboardError("Access denied. Admin role required.");
//       return;
//     }

//     setDashboardLoading(true);
//     setDashboardError(null);

//     try {
//       const response = await Api.get(`/admin/dashboard?period=${period}`);

//       if (response.data?.success) {
//         const data = response.data.data;
//         setDashboardData(data);

//         // Update legacy states for backward compatibility
//         setTools(data.charts?.pdfToolsUsage || []);
//         setUsageAnalytics(data.charts || {});
//       } else {
//         throw new Error(response.data?.message || 'Failed to fetch dashboard data');
//       }
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard data';
//       setDashboardError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setDashboardLoading(false);
//     }
//   };


//   // Fetch all tools
//   const fetchTools = async () => {
//     if (!hasAdminAccess) {
//       setToolsError("Access denied. Admin role required.");
//       return;
//     }

//     setToolsLoading(true);
//     setToolsError(null);

//     try {
//       const response = await Api.get('/admin/tools/fetch');

//       if (response.data?.success) {
//         setTools(response.data.data || []);
//       } else {
//         throw new Error(response.data?.message || 'Failed to fetch tools');
//       }
//     } catch (error) {
//       console.error('Error fetching tools:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tools';
//       setToolsError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setToolsLoading(false);
//     }
//   };

//   // Fetch usage analytics
//   const fetchUsageAnalytics = async (period = 'this-month') => {
//     if (!hasAdminAccess) {
//       setAnalyticsError("Access denied. Admin role required.");
//       return;
//     }

//     setAnalyticsLoading(true);
//     setAnalyticsError(null);

//     try {
//       const response = await Api.get(`/admin/analytics/usage?period=${period}`);

//       if (response.data?.success) {
//         setUsageAnalytics(response.data.data || {});
//       } else {
//         throw new Error(response.data?.message || 'Failed to fetch usage analytics');
//       }
//     } catch (error) {
//       console.error('Error fetching usage analytics:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch usage analytics';
//       setAnalyticsError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setAnalyticsLoading(false);
//     }
//   };

//   // Refresh tools data
//   const refreshTools = () => {
//     fetchTools();
//   };

//   // Refresh analytics data
//   const refreshAnalytics = (period = 'this-month') => {
//     fetchUsageAnalytics(period);
//   };

//   // Auto-fetch tools when user changes and has admin access
//   useEffect(() => {
//     if (hasAdminAccess && tools.length === 0) {
//       fetchTools();
//     }
//   }, [hasAdminAccess]);

//   // Auto-fetch analytics when user changes and has admin access
//   useEffect(() => {
//     if (hasAdminAccess && Object.keys(usageAnalytics).length === 0) {
//       fetchUsageAnalytics();
//     }
//   }, [hasAdminAccess]);

//   useEffect(() => {
//     if (hasAdminAccess && Object.keys(dashboardData).length === 0) {
//       fetchDashboardData();
//     }
//   }, [hasAdminAccess]);


//   // Derived data getters for easy access
//   const getStats = () => dashboardData.stats || {};
//   const getCharts = () => dashboardData.charts || {};
//   const getTables = () => dashboardData.tables || {};
//   const getNotifications = () => dashboardData.notifications || [];
//   const getRecentUsers = () => dashboardData.tables?.recentUsers || [];
//   const getRecentPosts = () => dashboardData.tables?.recentPosts || [];
//   const getRecentInquiries = () => dashboardData.tables?.recentInquiries || [];
//   const getPdfToolsUsage = () => dashboardData.charts?.pdfToolsUsage || [];
//   const getDailyUsage = () => dashboardData.charts?.dailyUsageData || [];
//   const getPerformanceCategories = () => dashboardData.charts?.performanceCategories || [];
  

//   const contextValue = {
//     // Dashboard data (NEW)
//     dashboardData,
//     dashboardLoading,
//     dashboardError,
//     fetchDashboardData,
    
//     // Tools data
//     tools,
//     toolsLoading,
//     toolsError,
//     hasAdminAccess,

//     // Getter methods for easy access
//     getStats,
//     getCharts,
//     getTables,
//     getNotifications,
//     getRecentUsers,
//     getRecentPosts,
//     getRecentInquiries,
//     getPdfToolsUsage,
//     getDailyUsage,
//     getPerformanceCategories,

//     // Usage analytics data
//     usageAnalytics,
//     analyticsLoading,
//     analyticsError,

//     // Tools methods
//     fetchTools,
//     refreshTools,

//     // Analytics methods
//     fetchUsageAnalytics,
//     refreshAnalytics
//   };

//   return (
//     <AnalyticsContext.Provider value={contextValue}>
//       {children}
//     </AnalyticsContext.Provider>
//   );
// };

// // Custom hook to use the analytics context
// export const useAnalytics = () => {
//   const context = useContext(AnalyticsContext);
//   if (context === undefined) {
//     throw new Error('useAnalytics must be used within an AnalyticsProvider');
//   }
//   return context;
// };

// export { AnalyticsContext, AnalyticsProvider };