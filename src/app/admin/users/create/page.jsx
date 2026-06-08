"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter, useParams } from "next/navigation"
import { FaUser, FaEnvelope, FaUserShield, FaEye, FaEyeSlash, FaSave, FaSpinner } from "react-icons/fa"
import { AdminContext } from "@/context/Admin.context"
import { toast } from "react-toastify"

export default function CreateUserPage({ editMode = false, singleUserData = null }) {
  const router = useRouter()
  const params = useParams()
  const {
    createUser,
    updateUser,
    fetchSingleUser,
    isLoading,
    hasAdminAccess
  } = useContext(AdminContext)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "user",
    status: "approved",
    password: "",
    confirmPassword: "",
    phone: "",
    isActive: true
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [errors, setErrors] = useState({})

  // Load user data for editing
  useEffect(() => {
    const loadUserData = async () => {
      if (editMode && params.id && !singleUserData) {
        setIsLoadingUser(true)
        try {
          const userData = await fetchSingleUser(params.id)
          if (userData) {
            setFormData({
              username: userData.username || "",
              email: userData.email || "",
              role: userData.role || "user",
              status: userData.status || "approved",
              password: "",
              confirmPassword: "",
              phone: userData.phone || "",
              isActive: userData.isActive ?? true
            })
          }
        } catch (error) {
          // error
        } finally {
          setIsLoadingUser(false)
        }
      } else if (editMode && singleUserData) {
        setFormData({
          username: singleUserData.username || "",
          email: singleUserData.email || "",
          role: singleUserData.role || "user",
          status: singleUserData.status || "approved",
          password: "",
          confirmPassword: "",
          phone: singleUserData.phone || "",
          isActive: singleUserData.isActive ?? true
        })
      }
    }

    if (hasAdminAccess) {
      loadUserData()
    }
  }, [editMode, params.id, singleUserData, hasAdminAccess, fetchSingleUser])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!editMode) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    } else {
      // For edit mode, only validate password if it's provided
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long'
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (!formData.status) {
      newErrors.status = 'Status is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        isActive: formData.isActive,
        phone: formData.phone
      }

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password
      }

      let success
      if (editMode) {
        success = await updateUser(params.id, submitData)
      } else {
        success = await createUser(submitData)
      }

      if (success) {
        router.push('/admin/users')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state for edit mode
  if (editMode && isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin mx-auto h-8 w-8 text-blue-600 mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editMode ? 'Edit User' : 'Create New User'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {editMode
              ? 'Update user information and permissions'
              : 'Add a new user to your PDFDex platform'
            }
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            {editMode
              ? 'Update the user account details below'
              : 'Please fill in the details for the new user account'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div className="md:col-span-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" size={16} />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900 ${errors.username ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  placeholder="Enter username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-blue-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" size={16} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900 ${errors.email ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-blue-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                User Role *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserShield className="text-gray-400" size={16} />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-8 py-3 border rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900 appearance-none ${errors.role ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                >
                  <option value="user">User</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-blue-600">{errors.role}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Account Status *
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-3 border rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900 appearance-none ${errors.status ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-blue-600">{errors.status}</p>
              )}
            </div>

            {/* Active Status Checkbox */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active User Account
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Inactive users cannot log in to the system
              </p>
            </div>

            {/* Password - Only show for create mode or if admin wants to change password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password {editMode ? '(Leave blank to keep current)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required={!editMode}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 pl-3 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900 ${errors.password ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  placeholder={editMode ? "Enter new password" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-blue-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password {editMode ? '(If changing)' : '*'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  required={!editMode}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pr-10 pl-3 py-3 border rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900 ${errors.confirmPassword ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                    }`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-blue-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Role Description */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {formData.role === "user" && (
                <p>• Can view and use PDF tools • Cannot access admin features • Limited account settings</p>
              )}
              {formData.role === "content_manager" && (
                <p>
                  • Can create and manage blog posts • Can upload content • Access to content management tools • Cannot
                  manage users
                </p>
              )}
              {formData.role === "admin" && (
                <p>
                  • Full access to all features • Can manage users and roles • Access to analytics and settings • Can
                  moderate content
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500"
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" size={14} />
                  {editMode ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                {editMode ? (
                  <>
                    <li>Changes will be applied immediately to the user account</li>
                    <li>Leave password fields blank to keep the current password</li>
                    <li>User will be notified of any role or status changes</li>
                  </>
                ) : (
                  <>
                    <li>The user will receive an email notification with their login credentials</li>
                    <li>Users should change their password after first login</li>
                    <li>Admin users have full access to all platform features</li>
                    <li>Content Managers can only access blog and content management features</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import { FaUser, FaEnvelope, FaUserShield, FaEye, FaEyeSlash, FaSave } from "react-icons/fa"

// export default function CreateUserPage() {
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     role: "User",
//     status: "Active",
//     password: "",
//     confirmPassword: "",
//     phone: "",
//   })

//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setIsSubmitting(true)

//     // Simulate API call
//     setTimeout(() => {
//       console.log("User created:", formData)
//       setIsSubmitting(false)
//       // Here you would typically redirect or show success message
//     }, 2000)
//   }

//   return (
//     <div className="space-y-6">
//       {/* Page header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
//           <p className="mt-1 text-sm text-gray-500">Add a new user to your PDFDex platform</p>
//         </div>
//       </div>

//       {/* Form Card */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-medium text-gray-900">User Information</h3>
//           <p className="mt-1 text-sm text-gray-500">Please fill in the details for the new user account</p>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Username */}
//             <div className="md:col-span-2">
//               <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
//                 Username *
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FaUser className="text-gray-400" size={16} />
//                 </div>
//                 <input
//                   type="text"
//                   id="username"
//                   name="username"
//                   required
//                   value={formData.username}
//                   onChange={handleInputChange}
//                   className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
//                   placeholder="Enter username"
//                 />
//               </div>
//             </div>

//             {/* Email */}
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                 Email Address *
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FaEnvelope className="text-gray-400" size={16} />
//                 </div>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   required
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
//                   placeholder="Enter email address"
//                 />
//               </div>
//             </div>

//             {/* Phone */}
//             <div>
//               <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
//                 Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
//               </label>
//               <input
//                 type="tel"
//                 id="phone"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 className="block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
//                 placeholder="Enter phone number"
//               />
//             </div>

//             {/* Role */}
//             <div>
//               <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
//                 User Role *
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FaUserShield className="text-gray-400" size={16} />
//                 </div>
//                 <select
//                   id="role"
//                   name="role"
//                   required
//                   value={formData.role}
//                   onChange={handleInputChange}
//                   className="block w-full pl-10 pr-8 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900 appearance-none"
//                 >
//                   <option value="User">User</option>
//                   <option value="Content Manager">Content Manager</option>
//                   <option value="Admin">Admin</option>
//                 </select>
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                   </svg>
//                 </div>
//               </div>
//             </div>

//             {/* Status */}
//             <div>
//               <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
//                 Account Status *
//               </label>
//               <div className="relative">
//                 <select
//                   id="status"
//                   name="status"
//                   required
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900 appearance-none"
//                 >
//                   <option value="Active">Active</option>
//                   <option value="Inactive">Inactive</option>
//                   <option value="Pending">Pending</option>
//                 </select>
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                   </svg>
//                 </div>
//               </div>
//             </div>

//             {/* Password */}
//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//                 Password *
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   name="password"
//                   required
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
//                   placeholder="Enter password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
//                 </button>
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
//                 Confirm Password *
//               </label>
//               <div className="relative">
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   required
//                   value={formData.confirmPassword}
//                   onChange={handleInputChange}
//                   className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white text-gray-900"
//                   placeholder="Confirm password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
//                 >
//                   {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Role Description */}
//           <div className="mt-6 p-4 bg-gray-50 rounded-md">
//             <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
//             <div className="text-sm text-gray-600 space-y-1">
//               {formData.role === "User" && (
//                 <p>• Can view and use PDF tools • Cannot access admin features • Limited account settings</p>
//               )}
//               {formData.role === "Content Manager" && (
//                 <p>
//                   • Can create and manage blog posts • Can upload content • Access to content management tools • Cannot
//                   manage users
//                 </p>
//               )}
//               {formData.role === "Admin" && (
//                 <p>
//                   • Full access to all features • Can manage users and roles • Access to analytics and settings • Can
//                   moderate content
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div className="mt-8 flex items-center justify-end space-x-4">
//             <button
//               type="button"
//               onClick={() => window.history.back()}
//               className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-blue-500"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
//             >
//               {isSubmitting ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   Creating...
//                 </>
//               ) : (
//                 <>
//                   <FaSave className="mr-2" size={14} />
//                   Create User
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Additional Info Card */}
//       <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
//         <div className="flex">
//           <div className="flex-shrink-0">
//             <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
//               <path
//                 fillRule="evenodd"
//                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </div>
//           <div className="ml-3">
//             <h3 className="text-sm font-medium text-blue-800">Important Notes</h3>
//             <div className="mt-2 text-sm text-blue-700">
//               <ul className="list-disc list-inside space-y-1">
//                 <li>The user will receive an email notification with their login credentials</li>
//                 <li>Users can change their password after first login</li>
//                 <li>Admin users have full access to all platform features</li>
//                 <li>Content Managers can only access blog and content management features</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
