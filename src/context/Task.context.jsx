'use client'
import React, { createContext, useState, useContext, useEffect } from "react";
import Api from "@/utils/Api";
import { UserContext } from "./User.context";

// Create the context
const TaskContext = createContext();

// Create a provider component
const TaskProvider = ({ children }) => {
  // Get user from UserContext
  const { user } = useContext(UserContext);

  // Single state for API data
  const [taskState, setTaskState] = useState({
    tasks: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null
    },
    loading: false,
    error: null
  });

  // Separate state for pagination control
  const [currentPage, setCurrentPage] = useState(1);

  // Auto fetch tasks when user changes
  useEffect(() => {
    if (user) {
      fetchTasks(1, 10); // Load first page with 10 items
    } else {
      // Reset state when user logs out
      setTaskState({
        tasks: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null
        },
        loading: false,
        error: null
      });
      setCurrentPage(1);
    }
  }, [user]); // Add user as dependency

  // Fetch tasks function - only if user exists
  const fetchTasks = async (page = 1, limit = 10) => {
    // Check if user exists
    if (!user) {
      console.log('No user found, skipping API call');
      return;
    }

    setTaskState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const response = await Api.get(`/tasks/user/tasks?page=${page}&limit=${limit}`);

      if (response.data.success) {
        setTaskState(prev => ({
          ...prev,
          tasks: response.data.data.tasks,
          pagination: response.data.data.pagination,
          loading: false,
          error: null
        }));
        setCurrentPage(page);
      } else {
        setTaskState(prev => ({
          ...prev,
          loading: false,
          error: response.data.message || 'Failed to fetch tasks'
        }));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTaskState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || 'Something went wrong'
      }));
    }
  };

  // Handle page change - only if user exists
  const handlePageChange = (page) => {
    if (!user) return;

    if (page !== currentPage && page >= 1 && page <= taskState.pagination.totalPages) {
      fetchTasks(page, taskState.pagination.itemsPerPage);
    }
  };

  // Refresh tasks (reload current page) - only if user exists
  const refreshTasks = () => {
    if (!user) return;

    fetchTasks(currentPage, taskState.pagination.itemsPerPage);
  };

  // Context value
  const contextValue = {
    // Data
    tasks: taskState.tasks,
    pagination: taskState.pagination,
    loading: taskState.loading,
    error: taskState.error,

    // Pagination state
    currentPage,

    // Functions
    fetchTasks,
    handlePageChange,

    // Clear error
    clearError: () => setTaskState(prev => ({ ...prev, error: null }))
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use the context
const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export { TaskContext, TaskProvider, useTask };