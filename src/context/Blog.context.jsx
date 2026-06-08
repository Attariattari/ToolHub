'use client'
import React, { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./User.context";
import { toast } from "react-toastify";
import Api from "@/utils/Api";

// Create the context
const BlogsContext = createContext();

// Create a provider component
const BlogsProvider = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  // blogs query state
  const [blogsData, setBlogsData] = useState({
    blogs: [],
    stats: {
      total: 0,
      published: 0,
      draft: 0,
      thisWeek: 0
    },
    error: null,
    loading: false
  });

  // Published blogs state (separate for public blogs)
  const [publishedBlogsData, setPublishedBlogsData] = useState({
    blogs: [],
    loading: false,
    error: null
  });

  // Single blog state
  const [singleBlog, setSingleBlog] = useState({
    blog: null,
    loading: false,
    error: null
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all"
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalPages: 0,
    totalItems: 0
  });

  // Loading state for actions (create, update, delete)
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin privileges
  const hasAdminAccess = () => {
    if (!user || !user.role) {
      // toast.error("User authentication required");
      return false;
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      // toast.error("Access denied. Admin privileges required.");
      return false;
    }

    return true;
  };

  // Fetch all blogs (admin only)
  const fetchAllBlogs = async (page = 1, limit = 12) => {
    if (!hasAdminAccess()) return;

    setBlogsData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // Add filters if they exist and are not 'all'
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }

      const response = await Api.get(`/blogs/all?${params.toString()}`);

      if (response.data.success) {
        const { blogs, stats, pagination } = response.data.data;

        setBlogsData(prev => ({
          ...prev,
          blogs: blogs || [],
          stats: stats || {
            total: 0,
            published: 0,
            draft: 0,
            thisWeek: 0
          },
          loading: false,
          error: null
        }));

        setPagination(prev => ({
          ...prev,
          page: pagination.currentPage || page,
          totalPages: pagination.totalPages || 0,
          totalItems: pagination.totalItems || 0,
          limit: pagination.limit || limit
        }));

        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch blogs");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch blogs";
      setBlogsData(prev => ({
        ...prev,
        blogs: [],
        loading: false,
        error: errorMsg
      }));
      toast.error(errorMsg);
      return null;
    }
  };

  // Fetch published blogs (public access)
  const fetchPublishedBlogs = async (page = 1, limit = 12) => {
    setPublishedBlogsData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // const response = await Api.get(`/blogs/published?page=${page}&limit=${limit}&search=${filters.search}&category=${filters.category}`);
      const categoryParam = encodeURIComponent(filters.category);
      const response = await Api.get(`/blogs/published?page=${page}&limit=${limit}&search=${filters.search}&category=${categoryParam}`);

      if (response.data.success) {
        setPublishedBlogsData({
          blogs: response.data.data.blogs,
          loading: false,
          error: null
        });

        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch published blogs");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch published blogs";
      setPublishedBlogsData({
        blogs: [],
        loading: false,
        error: errorMsg
      });
      toast.error(errorMsg);
      return null;
    }
  };

  // Fetch single blog by ID
  const fetchSingleBlog = async (id) => {
    if (!id) {
      toast.error("Blog ID is required");
      return null;
    }

    setSingleBlog(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await Api.get(`/blogs/single/${id}`);

      if (response.data.success) {
        setSingleBlog({
          blog: response.data.data,
          loading: false,
          error: null
        });

        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch blog");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch blog";
      setSingleBlog({
        blog: null,
        loading: false,
        error: errorMsg
      });
      toast.error(errorMsg);
      return null;
    }
  };

  // Create new blog (admin only)
  const createBlog = async (blogData) => {
    if (!hasAdminAccess()) return null;

    // Required field validation
    if (!blogData.title?.trim()) {
      toast.error("Title is required");
      return null;
    }
    if (!blogData.slug?.trim()) {
      toast.error("Slug is required");
      return null;
    }
    if (!blogData.content?.trim() || blogData.content === '<p><br></p>') {
      toast.error("Content is required");
      return null;
    }
    if (!blogData.category?.trim()) {
      toast.error("Category is required");
      return null;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append all blog data to FormData
      Object.keys(blogData).forEach(key => {
        if (key === 'featuredImage' && blogData[key]) {
          formData.append('featuredImage', blogData[key]);
        } else if (blogData[key] !== null && blogData[key] !== undefined) {
          formData.append(key, blogData[key]);
        }
      });

      const response = await Api.post('/blogs/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Blog created successfully!");

        // Refresh blogs list
        await fetchAllBlogs(pagination.page, pagination.limit);

        // Navigate back
        if (typeof window !== 'undefined') {
          window.history.back();
        }

        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to create blog");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to create blog";
      toast.error(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update blog (admin only)
  const updateBlog = async (id, blogData) => {
    if (!hasAdminAccess()) return null;

    if (!id) {
      toast.error("Blog ID is required");
      return null;
    }

    // Required field validation
    if (!blogData.title?.trim()) {
      toast.error("Title is required");
      return null;
    }
    if (!blogData.slug?.trim()) {
      toast.error("Slug is required");
      return null;
    }
    if (!blogData.content?.trim() || blogData.content === '<p><br></p>') {
      toast.error("Content is required");
      return null;
    }
    if (!blogData.category?.trim()) {
      toast.error("Category is required");
      return null;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append all blog data to FormData
      Object.keys(blogData).forEach(key => {
        if (key === 'featuredImage' && blogData[key]) {
          formData.append('featuredImage', blogData[key]);
        } else if (blogData[key] !== null && blogData[key] !== undefined) {
          formData.append(key, blogData[key]);
        }
      });

      const response = await Api.put(`/blogs/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Blog updated successfully!");

        // Refresh blogs list
        await fetchAllBlogs(pagination.page, pagination.limit);

        // Update single blog if it's the same one
        if (singleBlog.blog && singleBlog.blog._id === id) {
          await fetchSingleBlog(id);
        }

        // Navigate back
        if (typeof window !== 'undefined') {
          window.history.back();
        }

        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to update blog");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update blog";
      toast.error(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete blog (admin only)
  const deleteBlog = async (id) => {
    if (!hasAdminAccess()) return false;

    if (!id) {
      toast.error("Blog ID is required");
      return false;
    }

    setIsLoading(true);

    try {
      const response = await Api.delete(`/blogs/delete/${id}`);

      if (response.data.success) {
        toast.success(response.data.message || "Blog deleted successfully!");

        // Refresh blogs list
        await fetchAllBlogs(pagination.page, pagination.limit);

        return true;
      } else {
        throw new Error(response.data.message || "Failed to delete blog");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete blog";
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Publish/Unpublish blog (admin only)
  const togglePublishBlog = async (id, isPublished) => {
    if (!hasAdminAccess()) return false;

    if (!id) {
      toast.error("Blog ID is required");
      return false;
    }

    setIsLoading(true);

    try {
      const response = await Api.put(`/blogs/update/${id}`, {
        isPublished: isPublished
      });

      if (response.data.success) {
        toast.success(`Blog ${isPublished ? 'published' : 'unpublished'} successfully!`);

        // Refresh blogs list
        await fetchAllBlogs(pagination.page, pagination.limit);

        return true;
      } else {
        throw new Error(response.data.message || "Failed to update blog status");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update blog status";
      toast.error(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAllBlogs(pagination.page, pagination.limit);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      category: "all"
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear single blog
  const clearSingleBlog = () => {
    setSingleBlog({
      blog: null,
      loading: false,
      error: null
    });
  };

  // Auto-fetch blogs when filters or pagination change (only for admin users)
  useEffect(() => {
    if (user && user.role && !loading) {
      fetchAllBlogs(pagination.page, pagination.limit);
    }
  }, [filters, user, loading]);

  useEffect(() => {
    fetchPublishedBlogs(pagination.page, pagination.limit)
  }, [filters]);

  return (
    <BlogsContext.Provider
      value={{
        // State
        blogsData,
        publishedBlogsData,
        singleBlog,
        filters,
        pagination,
        isLoading,

        // Actions
        fetchAllBlogs,
        fetchPublishedBlogs,
        fetchSingleBlog,
        createBlog,
        updateBlog,
        deleteBlog,
        togglePublishBlog,

        // Filters & Pagination
        updateFilters,
        resetFilters,
        setPagination,

        // Utilities
        clearSingleBlog,
        hasAdminAccess
      }}
    >
      {children}
    </BlogsContext.Provider>
  );
};

export { BlogsContext, BlogsProvider };