"use client"

import { useState, useEffect, useContext } from "react"
import {
  FaUsers,
  FaUserShield,
  FaUserEdit,
  FaUser,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserTimes,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa"
import StatCard from "@/components/admin/StatCard"
import TableCard from "@/components/admin/TableCard"
import Pagination from "@/components/admin/Pagination"
import DeleteConfirmationModal from "@/components/admin/DeleteConfirmationModal"
import Link from "next/link"
import { AdminContext } from "@/context/Admin.context"
import useDebounce from "@/hooks/useDebounce"
import { toast } from "react-toastify"

export default function UsersPage() {
  const {
    usersData,
    isLoading,
    hasAdminAccess,
    fetchUsers,
    deleteUser,
    toggleUserStatus,
    updateUserStatus
  } = useContext(AdminContext);

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userName: ''
  });

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch users when filters change
  useEffect(() => {
    if (hasAdminAccess) {
      const filters = {
        page: currentPage,
        limit: 8,
        search: debouncedSearchTerm,
        role: roleFilter,
        status: statusFilter
      };
      fetchUsers(filters);
    }
  }, [debouncedSearchTerm, roleFilter, statusFilter, currentPage, hasAdminAccess]);

  // Reset to first page when filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    const success = await deleteUser(deleteModal.userId);
    if (success) {
      setDeleteModal({ isOpen: false, userId: null, userName: '' });
    }
  };

  // Handle user status toggle
  const handleToggleStatus = async (userId, currentStatus) => {
    await toggleUserStatus(userId, currentStatus);
  };

  // Handle status change (approve/reject/suspend)
  const handleStatusChange = async (userId, newStatus) => {
    await updateUserStatus(userId, newStatus);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FaUserShield className="mr-1 text-blue-600" size={12} />
      case "content_manager":
        return <FaUserEdit className="mr-1 text-blue-600" size={12} />
      case "user":
        return <FaUser className="mr-1 text-gray-600" size={12} />
      default:
        return <FaUser className="mr-1 text-gray-500" size={12} />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "content_manager":
        return "bg-blue-100 text-blue-800"
      case "user":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <FaCheckCircle className="mr-1 text-green-600" size={12} />
      case "pending":
        return <FaClock className="mr-1 text-yellow-600" size={12} />
      case "rejected":
        return <FaTimesCircle className="mr-1 text-blue-600" size={12} />
      case "suspended":
        return <FaUserTimes className="mr-1 text-orange-600" size={12} />
      default:
        return <FaTimesCircle className="mr-1 text-gray-500" size={12} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-blue-100 text-blue-800"
      case "suspended":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) return { date: 'Never', time: 'Not logged in' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };


  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your PDFDex users and their permissions</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/admin/users/create">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium">
              <FaPlus className="mr-2" size={14} />
              Add User
            </button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={usersData.stats.totalUsers.toString()}
          icon={<FaUsers className="text-blue-600" />}
          change="12%"
          changeType="increase"
          footer="This month"
        />
        <StatCard
          title="Active Users"
          value={usersData.stats.activeUsers.toString()}
          icon={<FaCheckCircle className="text-blue-600" />}
          change="8%"
          changeType="increase"
          footer="This month"
        />
        <StatCard
          title="Admins"
          value={usersData.stats.adminUsers.toString()}
          icon={<FaUserShield className="text-blue-600" />}
          change="0%"
          changeType="increase"
          footer="No change"
        />
        <StatCard
          title="New This Week"
          value={usersData.stats.newUsersThisWeek.toString()}
          icon={<FaUsers className="text-blue-600" />}
          change="25%"
          changeType="increase"
          footer="Users joined"
        />
      </div>

      {/* Users Table */}
      <TableCard
        title="All Users"
        actions={
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" size={14} />
              </div>
            </div>
            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="content_manager">Content Manager</option>
                <option value="user">User</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaFilter className="text-gray-400" size={12} />
              </div>
            </div>
          </div>
        }
      >
        {usersData.loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading users...</span>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.users.map((user) => {
                const lastLogin = formatLastLogin(user.lastLogin);
                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                          {user.profile?.avatar || user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                          user.role,
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          user.status,
                        )}`}
                      >
                        {getStatusIcon(user.status)}
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        disabled={isLoading}
                      >
                        {user.isActive ? (
                          <>
                            <FaToggleOn className="mr-1" size={12} />
                            Active
                          </>
                        ) : (
                          <>
                            <FaToggleOff className="mr-1" size={12} />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                      <div className="text-xs text-gray-500">Joined</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lastLogin.date}</div>
                      <div className="text-xs text-gray-500">{lastLogin.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="View User"
                        >
                          <FaEye size={14} />
                        </button>
                        <Link href={`/admin/users/update/${user._id}`}>
                          <button
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                            title="Edit User"
                          >
                            <FaEdit size={14} />
                          </button>
                        </Link>

                        {/* Status Actions Dropdown */}
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(user._id, 'approved')}
                              className="p-1 rounded-md hover:bg-green-100 text-green-600 hover:text-green-700"
                              title="Approve User"
                              disabled={isLoading}
                            >
                              <FaCheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(user._id, 'rejected')}
                              className="p-1 rounded-md hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              title="Reject User"
                              disabled={isLoading}
                            >
                              <FaTimesCircle size={14} />
                            </button>
                          </>
                        )}

                        {user.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(user._id, 'suspended')}
                            className="p-1 rounded-md hover:bg-orange-100 text-orange-600 hover:text-orange-700"
                            title="Suspend User"
                            disabled={isLoading}
                          >
                            <FaUserTimes size={14} />
                          </button>
                        )}

                        {user.status === 'suspended' && (
                          <button
                            onClick={() => handleStatusChange(user._id, 'approved')}
                            className="p-1 rounded-md hover:bg-green-100 text-green-600 hover:text-green-700"
                            title="Reactivate User"
                            disabled={isLoading}
                          >
                            <FaCheckCircle size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteModal({
                            isOpen: true,
                            userId: user._id,
                            userName: user.username
                          })}
                          className="p-1 rounded-md hover:bg-blue-100 text-blue-500 hover:text-blue-700"
                          title="Delete User"
                          disabled={isLoading}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Empty state */}
        {!usersData.loading && usersData.users.length === 0 && (
          <div className="text-center py-12">
            <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first user."}
            </p>
            {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
              <div className="mt-6">
                <Link href="/admin/users/create">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center mx-auto">
                    <FaPlus className="mr-2" size={14} />
                    Add Your First User
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </TableCard>

      {/* Pagination */}
      {usersData.users.length > 0 && (
        <Pagination
          currentPage={usersData.pagination.currentPage}
          totalPages={usersData.pagination.totalPages}
          totalItems={usersData.pagination.totalUsers}
          itemsPerPage={8}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Clear filters option */}
      {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && usersData.users.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              setSearchTerm("")
              setRoleFilter("all")
              setStatusFilter("all")
              setCurrentPage(1)
            }}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteModal.userName}"? This action cannot be undone and will permanently remove the user from the system.`}
        confirmText="Delete User"
        isLoading={isLoading}
      />

      {/* Error display */}
      {usersData.error && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimesCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Error</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{usersData.error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => fetchUsers()}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import {
//   FaUsers,
//   FaUserShield,
//   FaUserEdit,
//   FaUser,
//   FaEdit,
//   FaTrash,
//   FaEye,
//   FaSearch,
//   FaFilter,
//   FaPlus,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaClock,
// } from "react-icons/fa"
// import StatCard from "@/components/admin/StatCard"
// import TableCard from "@/components/admin/TableCard"
// import Pagination from "@/components/admin/Pagination"
// import Link from "next/link"

// export default function UsersPage() {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [roleFilter, setRoleFilter] = useState("all")
//   const [statusFilter, setStatusFilter] = useState("all")
//   const [currentPage, setCurrentPage] = useState(1)
//   const itemsPerPage = 8

//   // Sample users data
//   const users = [
//     {
//       id: 1,
//       name: "John Doe",
//       email: "john.doe@example.com",
//       role: "Admin",
//       status: "Active",
//       avatar: "JD",
//       joinDate: "2024-01-15",
//       lastLogin: "2024-01-29 14:30",
//       totalPosts: 12,
//     },
//     {
//       id: 2,
//       name: "Sarah Wilson",
//       email: "sarah.wilson@example.com",
//       role: "Content Manager",
//       status: "Active",
//       avatar: "SW",
//       joinDate: "2024-01-10",
//       lastLogin: "2024-01-29 10:15",
//       totalPosts: 25,
//     }
//   ]

//   // Filter users based on search, role, and status
//   const filteredUsers = users.filter((user) => {
//     const matchesSearch =
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter.toLowerCase()
//     const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()
//     return matchesSearch && matchesRole && matchesStatus
//   })

//   // Calculate pagination
//   const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
//   const startIndex = (currentPage - 1) * itemsPerPage
//   const endIndex = startIndex + itemsPerPage
//   const currentUsers = filteredUsers.slice(startIndex, endIndex)

//   // Reset to first page when filters change
//   const handleSearchChange = (value) => {
//     setSearchTerm(value)
//     setCurrentPage(1)
//   }

//   const handleRoleFilterChange = (value) => {
//     setRoleFilter(value)
//     setCurrentPage(1)
//   }

//   const handleStatusFilterChange = (value) => {
//     setStatusFilter(value)
//     setCurrentPage(1)
//   }

//   // Calculate stats
//   const totalUsers = users.length
//   const activeUsers = users.filter((user) => user.status === "Active").length
//   const adminUsers = users.filter((user) => user.role === "Admin").length
//   const contentManagers = users.filter((user) => user.role === "Content Manager").length

//   // Calculate new users this week
//   const newUsersThisWeek = users.filter((user) => {
//     const joinDate = new Date(user.joinDate)
//     const weekAgo = new Date()
//     weekAgo.setDate(weekAgo.getDate() - 7)
//     return joinDate >= weekAgo
//   }).length

//   const getRoleIcon = (role) => {
//     switch (role) {
//       case "Admin":
//         return <FaUserShield className="mr-1 text-blue-600" size={12} />
//       case "Content Manager":
//         return <FaUserEdit className="mr-1 text-blue-600" size={12} />
//       case "User":
//         return <FaUser className="mr-1 text-gray-600" size={12} />
//       default:
//         return <FaUser className="mr-1 text-gray-500" size={12} />
//     }
//   }

//   const getRoleColor = (role) => {
//     switch (role) {
//       case "Admin":
//         return "bg-blue-100 text-blue-800"
//       case "Content Manager":
//         return "bg-blue-100 text-blue-800"
//       case "User":
//         return "bg-gray-100 text-gray-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "Active":
//         return <FaCheckCircle className="mr-1 text-green-600" size={12} />
//       case "Inactive":
//         return <FaTimesCircle className="mr-1 text-blue-600" size={12} />
//       case "Pending":
//         return <FaClock className="mr-1 text-yellow-600" size={12} />
//       default:
//         return <FaTimesCircle className="mr-1 text-gray-500" size={12} />
//     }
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Active":
//         return "bg-green-100 text-green-800"
//       case "Inactive":
//         return "bg-blue-100 text-blue-800"
//       case "Pending":
//         return "bg-yellow-100 text-yellow-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
//           <p className="mt-1 text-sm text-gray-500">Manage your PDFDex users and their permissions</p>
//         </div>
//         <div className="mt-4 md:mt-0">
//           <Link href="/admin/users/create">
//             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium">
//               <FaPlus className="mr-2" size={14} />
//               Add User
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* Stats grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Users"
//           value={totalUsers.toString()}
//           icon={<FaUsers className="text-blue-600" />}
//           change="12%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Active Users"
//           value={activeUsers.toString()}
//           icon={<FaCheckCircle className="text-blue-600" />}
//           change="8%"
//           changeType="increase"
//           footer="This month"
//         />
//         <StatCard
//           title="Admins"
//           value={adminUsers.toString()}
//           icon={<FaUserShield className="text-blue-600" />}
//           change="0%"
//           changeType="increase"
//           footer="No change"
//         />
//         <StatCard
//           title="New This Week"
//           value={newUsersThisWeek.toString()}
//           icon={<FaUsers className="text-blue-600" />}
//           change="25%"
//           changeType="increase"
//           footer="Users joined"
//         />
//       </div>

//       {/* Users Table */}
//       <TableCard
//         title="All Users"
//         actions={
//           <div className="flex items-center space-x-3">
//             {/* Search */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search users..."
//                 value={searchTerm}
//                 onChange={(e) => handleSearchChange(e.target.value)}
//                 className="pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
//               />
//               <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
//                 <FaSearch className="text-gray-400" size={14} />
//               </div>
//             </div>
//             {/* Role Filter */}
//             <div className="relative">
//               <select
//                 value={roleFilter}
//                 onChange={(e) => handleRoleFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="all">All Roles</option>
//                 <option value="admin">Admin</option>
//                 <option value="content manager">Content Manager</option>
//                 <option value="user">User</option>
//               </select>
//               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                 <FaFilter className="text-gray-400" size={12} />
//               </div>
//             </div>
//             {/* Status Filter */}
//             <div className="relative">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => handleStatusFilterChange(e.target.value)}
//                 className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
//               >
//                 <option value="all">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//                 <option value="pending">Pending</option>
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
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Join Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Last Login
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {currentUsers.map((user) => (
//               <tr key={user.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4">
//                   <div className="flex items-center">
//                     <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
//                       {user.avatar}
//                     </div>
//                     <div className="ml-3">
//                       <p className="text-sm font-medium text-gray-900">{user.name}</p>
//                       <p className="text-xs text-gray-500">{user.email}</p>
//                     </div>
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
//                       user.role,
//                     )}`}
//                   >
//                     {getRoleIcon(user.role)}
//                     {user.role}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <span
//                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
//                       user.status,
//                     )}`}
//                   >
//                     {getStatusIcon(user.status)}
//                     {user.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{user.totalPosts}</div>
//                   <div className="text-xs text-gray-500">{user.totalPosts > 0 ? "Published" : "No posts"}</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">{user.joinDate}</div>
//                   <div className="text-xs text-gray-500">Joined</div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-900">
//                     {user.lastLogin === "Never" ? "Never" : user.lastLogin.split(" ")[0]}
//                   </div>
//                   <div className="text-xs text-gray-500">
//                     {user.lastLogin === "Never" ? "Not logged in" : user.lastLogin.split(" ")[1]}
//                   </div>
//                 </td>
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="flex items-center space-x-2">
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
//                       <FaEye size={14} />
//                     </button>
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700">
//                       <FaEdit size={14} />
//                     </button>
//                     <button className="p-1 rounded-md hover:bg-gray-100 text-blue-500 hover:text-blue-700">
//                       <FaTrash size={14} />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Empty state */}
//         {currentUsers.length === 0 && (
//           <div className="text-center py-12">
//             <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               {searchTerm || roleFilter !== "all" || statusFilter !== "all"
//                 ? "Try adjusting your search or filter criteria."
//                 : "Get started by adding your first user."}
//             </p>
//             {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
//               <div className="mt-6">
//                 <Link href="/admin/users/create">
//                   <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center mx-auto">
//                     <FaPlus className="mr-2" size={14} />
//                     Add Your First User
//                   </button>
//                 </Link>
//               </div>
//             )}
//           </div>
//         )}
//       </TableCard>

//       {/* Pagination */}
//       {filteredUsers.length > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           totalItems={filteredUsers.length}
//           itemsPerPage={itemsPerPage}
//           onPageChange={setCurrentPage}
//         />
//       )}

//       {/* Clear filters option */}
//       {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && filteredUsers.length > 0 && (
//         <div className="text-center">
//           <button
//             onClick={() => {
//               setSearchTerm("")
//               setRoleFilter("all")
//               setStatusFilter("all")
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
