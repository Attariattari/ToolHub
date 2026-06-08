'use client'
import React, { createContext, useState, useContext, useEffect } from "react";
import Api from "@/utils/Api";
import { UserContext } from "./User.context";

// Create the context
const SignatureContext = createContext();

// Create a provider component
const SignatureProvider = ({ children }) => {
  // Get user from UserContext
  const { user } = useContext(UserContext);

  // Single state for API data
  const [signatureState, setSignatureState] = useState({
    signatures: [],
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
    error: null,
    // Filter states
    filters: {
      status: [], // ['signed', 'pending', 'declined', etc.]
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  });

  // Separate state for pagination control
  const [currentPage, setCurrentPage] = useState(1);

  // Auto fetch signatures when user changes
  useEffect(() => {
    if (user) {
      fetchSignatures(1, 10); // Load first page with 10 items
    } else {
      // Reset state when user logs out
      setSignatureState({
        signatures: [],
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
        error: null,
        filters: {
          status: [],
          search: '',
          startDate: '',
          endDate: '',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      setCurrentPage(1);
    }
  }, [user]);

  // Fetch signatures function - only if user exists
  const fetchSignatures = async (page = 1, limit = 10, customFilters = null) => {
    // Check if user exists
    if (!user) {
      console.log('No user found, skipping API call');
      return;
    }

    setSignatureState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Use custom filters if provided, otherwise use current filters
      const filters = customFilters || signatureState.filters;

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      // Add filters if they exist
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => queryParams.append('status', status));
      }

      const response = await Api.get(`/signature/requests?${queryParams}`);

      if (response.data.success) {
        setSignatureState(prev => ({
          ...prev,
          signatures: response.data.data.signatures,
          pagination: response.data.data.pagination,
          loading: false,
          error: null
        }));
        setCurrentPage(page);
      } else {
        setSignatureState(prev => ({
          ...prev,
          loading: false,
          error: response.data.message || 'Failed to fetch signatures'
        }));
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setSignatureState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || error.message || 'Something went wrong'
      }));
    }
  };

  // Fetch signatures by status (pending, signed, etc.)
  const fetchSignaturesByStatus = async (status, page = 1, limit = 10) => {
    if (!user) return;

    const customFilters = {
      ...signatureState.filters,
      status: [status]
    };

    await fetchSignatures(page, limit, customFilters);
  };

  // Apply filters
  const applyFilters = (newFilters) => {
    const updatedFilters = {
      ...signatureState.filters,
      ...newFilters
    };

    setSignatureState(prev => ({
      ...prev,
      filters: updatedFilters
    }));

    // Fetch with new filters
    fetchSignatures(1, signatureState.pagination.itemsPerPage, updatedFilters);
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    const defaultFilters = {
      status: [],
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    setSignatureState(prev => ({
      ...prev,
      filters: defaultFilters
    }));

    fetchSignatures(1, signatureState.pagination.itemsPerPage, defaultFilters);
    setCurrentPage(1);
  };

  // Handle page change - only if user exists
  const handlePageChange = (page) => {
    if (!user) return;

    if (page !== currentPage && page >= 1 && page <= signatureState.pagination.totalPages) {
      fetchSignatures(page, signatureState.pagination.itemsPerPage);
    }
  };

  // Refresh signatures (reload current page) - only if user exists
  const refreshSignatures = () => {
    if (!user) return;

    fetchSignatures(currentPage, signatureState.pagination.itemsPerPage);
  };

  // Download signed document
  const downloadSignedDocument = async (signatureId, fileName) => {
    if (!user) return;

    try {
      setSignatureState(prev => ({ ...prev, loading: true }));

      const response = await Api.get(`/signature/download/signed/${signatureId}`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'signed_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSignatureState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error downloading document:', error);
      setSignatureState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to download document'
      }));
    }
  };

  // Download audit trail
  const downloadAuditTrail = async (signatureId, fileName) => {
    if (!user) return;

    try {
      setSignatureState(prev => ({ ...prev, loading: true }));

      const response = await Api.get(`/signature/download/audit/${signatureId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}_audit.pdf` || 'audit_trail.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSignatureState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error downloading audit trail:', error);
      setSignatureState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to download audit trail'
      }));
    }
  };

  // Download original document
  const downloadOriginalDocument = async (signatureId, fileName) => {
    if (!user) return;

    try {
      setSignatureState(prev => ({ ...prev, loading: true }));

      const response = await Api.get(`/signature/download/original/${signatureId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'original_document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSignatureState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error downloading original document:', error);
      setSignatureState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to download original document'
      }));
    }
  };

  // Delete signature request
  const deleteSignatureRequest = async (signatureId) => {
    if (!user) return;

    try {
      setSignatureState(prev => ({ ...prev, loading: true }));

      const response = await Api.delete(`/signature/requests/${signatureId}`);

      if (response.data.success) {
        // Refresh the current page
        refreshSignatures();
      } else {
        setSignatureState(prev => ({
          ...prev,
          loading: false,
          error: response.data.message || 'Failed to delete signature request'
        }));
      }
    } catch (error) {
      console.error('Error deleting signature request:', error);
      setSignatureState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to delete signature request'
      }));
    }
  };

  // Get signature details
  const getSignatureDetails = async (signatureId) => {
    if (!user) return null;

    try {
      const response = await Api.get(`/signature/requests/${signatureId}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch signature details');
      }
    } catch (error) {
      console.error('Error fetching signature details:', error);
      setSignatureState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to fetch signature details'
      }));
      return null;
    }
  };

  // Context value
  const contextValue = {
    // Data
    signatures: signatureState.signatures,
    pagination: signatureState.pagination,
    loading: signatureState.loading,
    error: signatureState.error,
    filters: signatureState.filters,

    // Pagination state
    currentPage,

    // Functions
    fetchSignatures,
    fetchSignaturesByStatus,
    handlePageChange,
    refreshSignatures,
    applyFilters,
    clearFilters,

    // Document actions
    downloadSignedDocument,
    downloadAuditTrail,
    downloadOriginalDocument,
    deleteSignatureRequest,
    getSignatureDetails,

    // Clear error
    clearError: () => setSignatureState(prev => ({ ...prev, error: null }))
  };

  return (
    <SignatureContext.Provider value={contextValue}>
      {children}
    </SignatureContext.Provider>
  );
};

// Custom hook to use the context
const useSignature = () => {
  const context = useContext(SignatureContext);
  if (!context) {
    throw new Error('useSignature must be used within a SignatureProvider');
  }
  return context;
};

export { SignatureContext, SignatureProvider, useSignature };