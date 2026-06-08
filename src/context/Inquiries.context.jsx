'use client'
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./User.context";
import { toast } from "react-toastify";
import Api from "@/utils/Api";

// Create the context
const InquiriesContext = createContext();

// Create a provider component
const InquiriesProvider = ({ children }) => {
  const { user } = useContext(UserContext);

  // Inquiries query state
  const [inquiriesQuery, setInquiriesQuery] = useState({
    inquiries: [],
    stats: {
      total: 0,
      unread: 0,
      unreplied: 0,
      thisWeek: 0
    },
    error: null,
    loading: false
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    isRead: "all", // all, read, unread
    isReplied: "all" // all, replied, pending
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 0,
    totalItems: 0
  });

  // Loading state for actions (markAsRead, markAsReply, delete)
  const [isLoading, setIsLoading] = useState(false);

  // Fetch inquiries function
  const fetchInquiries = async () => {
    // Check if user exists and has admin role
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return;
    }

    setInquiriesQuery(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.isRead !== 'all' && { isRead: filters.isRead === 'read' }),
        ...(filters.isReplied !== 'all' && { isReplied: filters.isReplied === 'replied' })
      };

      const response = await Api.get('/inquiries/fetch', { params });

      setInquiriesQuery({
        inquiries: response.data.data.queries || [],
        stats: {
          total: response.data.data.stats.total || 0,
          unread: response.data.data.stats.unread || 0,
          unreplied: response.data.data.stats.unreplied || 0,
          thisWeek: response.data.data.stats.thisWeek || 0
        },
        error: null,
        loading: false
      });

      setPagination(prev => ({
        ...prev,
        totalPages: response.data.data.pagination.totalPages || 0,
        totalItems: response.data.data.pagination.totalQueries || 0
      }));

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch inquiries';
      setInquiriesQuery({
        inquiries: [],
        stats: {
          total: 0,
          unread: 0,
          unreplied: 0,
          thisWeek: 0
        },
        error: errorMessage,
        loading: false
      });
      toast.error(errorMessage);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Update pagination
  const updatePagination = (newPagination) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  };

  // Mark as read - replace with response data
  const markAsRead = async (inquiryId) => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await Api.patch(`/inquiries/${inquiryId}/mark-read`);

      // Replace the inquiry with updated data from response
      setInquiriesQuery(prev => ({
        ...prev,
        inquiries: prev.inquiries.map(inquiry =>
          inquiry._id === inquiryId ? response.data.data : inquiry
        )
      }));

      toast.success('Query marked as read');
      return response.data.data; // Return updated inquiry for modal
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark as read';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark as replied - replace with response data
  const markAsReplied = async (inquiryId) => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Unauthorized access');
      return;
    }

    setIsLoading(true);
    try {
      const response = await Api.patch(`/inquiries/${inquiryId}/mark-replied`);

      // Replace the inquiry with updated data from response
      setInquiriesQuery(prev => ({
        ...prev,
        inquiries: prev.inquiries.map(inquiry =>
          inquiry._id === inquiryId ? response.data.data : inquiry
        )
      }));

      toast.success('Query marked as replied');
      return response.data.data; // Return updated inquiry for modal
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark as replied';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete inquiry - refetch data after deletion
  const deleteInquiry = async (inquiryId) => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Unauthorized access');
      return;
    }

    setIsLoading(true);
    try {
      await Api.delete(`/inquiries/delete/${inquiryId}`);
      toast.success('Query deleted successfully');
      // Refetch data to update the list (filters and pagination stay same)
      fetchInquiries();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete query';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      isRead: "all",
      isReplied: "all"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Fetch inquiries when filters or pagination changes
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchInquiries();
    }
  }, [user, filters, pagination.page]);

  return (
    <InquiriesContext.Provider
      value={{
        inquiriesQuery,
        filters,
        pagination,
        isLoading,
        updateFilters,
        updatePagination,
        markAsRead,
        markAsReplied,
        deleteInquiry,
        clearFilters,
        fetchInquiries
      }}
    >
      {children}
    </InquiriesContext.Provider>
  );
};

export { InquiriesContext, InquiriesProvider };