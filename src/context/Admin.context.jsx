'use client'
import React, { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import Api from "@/utils/Api";
import { useRouter } from "next/navigation";
import { UserContext } from "./User.context";

// Create the context
const AdminContext = createContext();

// Create a provider component
const AdminProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const router = useRouter();

  // State management
  const [usersData, setUsersData] = useState({
    users: [],
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      contentManagers: 0,
      newUsersThisWeek: 0,
      pendingUsers: 0,
      suspendedUsers: 0
    },
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalUsers: 0,
      hasNext: false,
      hasPrev: false
    },
    loading: false,
    error: null
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = user && (user.role === 'admin' || user.role === 'super_admin');

  // Fetch single user by ID
  const fetchSingleUser = async (userId) => {
    if (!hasAdminAccess) {
      toast.error("Access denied. Admin privileges required.");
      return null;
    }

    try {
      const response = await Api.get(`/admin/users/${userId}`);

      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch user";
      toast.error(errorMessage);
      return null;
    }
  };

  // Fetch all users with filters
  const fetchUsers = async (filters = {}) => {
    if (!hasAdminAccess) {
      return;
    }

    setUsersData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();

      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await Api.get(`/admin/users?${queryParams.toString()}`);

      if (response.data.success) {
        setUsersData(prev => ({
          ...prev,
          users: response.data.data.users,
          stats: response.data.data.stats,
          pagination: response.data.data.pagination,
          loading: false,
          error: null
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch users";
      setUsersData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
    }
  };

  // Create new user
  const createUser = async (userData) => {
    if (!hasAdminAccess) {
      toast.error("Access denied. Admin privileges required.");
      return false;
    }

    setIsLoading(true);

    try {
      const response = await Api.post('/admin/users', userData);

      if (response.data.success) {
        toast.success(response.data.message || "User created successfully");

        // Refresh users list
        await fetchUsers();

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create user";
      toast.error(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Update user
  const updateUser = async (userId, userData) => {
    if (!hasAdminAccess) {
      toast.error("Access denied. Admin privileges required.");
      return false;
    }

    setIsLoading(true);

    try {
      const response = await Api.put(`/admin/users/${userId}`, userData);

      if (response.data.success) {
        toast.success(response.data.message || "User updated successfully");

        // Update user in local state
        setUsersData(prev => ({
          ...prev,
          users: prev.users.map(user =>
            user._id === userId ? { ...user, ...response.data.data } : user
          )
        }));

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update user";
      toast.error(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!hasAdminAccess) {
      toast.error("Access denied. Admin privileges required.");
      return false;
    }

    setIsLoading(true);

    try {
      const response = await Api.delete(`/admin/users/${userId}`);

      if (response.data.success) {
        toast.success(response.data.message || "User deleted successfully");

        // Remove user from local state or refresh the list
        await fetchUsers();

        setIsLoading(false);
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete user";
      toast.error(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Toggle user status (activate/deactivate)
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus ? false : true;
    return await updateUser(userId, { isActive: newStatus });
  };

  // Change user role
  const changeUserRole = async (userId, newRole) => {
    return await updateUser(userId, { role: newRole });
  };

  // Approve/Reject user
  const updateUserStatus = async (userId, status) => {
    return await updateUser(userId, { status });
  };

  // Refresh users data
  const refreshUsers = async () => {
    await fetchUsers();
  };

  // Initial load when user changes
  useEffect(() => {
    if (hasAdminAccess) {
      fetchUsers();
    }
  }, [user]);

  // Context value
  const contextValue = {
    // Data
    usersData,
    isLoading,
    hasAdminAccess,

    // Actions
    fetchUsers,
    fetchSingleUser,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changeUserRole,
    updateUserStatus,
    refreshUsers,

    // Utilities
    setUsersData
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export { AdminContext, AdminProvider };