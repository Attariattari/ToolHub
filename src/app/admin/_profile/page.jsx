"use client"

import { useState } from "react"
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaGlobe,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaCheckCircle,
  FaUserShield,
  FaCog,
  FaShieldAlt,
} from "react-icons/fa"

export default function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Dummy user data based on your schema
  const [userData, setUserData] = useState({
    username: "admin_user",
    email: "admin@pdfdex.com",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=120&width=120",
    address: "123 Tech Street, San Francisco, CA 94105",
    company: "PDFDex Inc.",
    website: "https://pdfdex.com",
    jobTitle: "System Administrator",
    role: "admin",
    isVerified: true,
    isActive: true,
    status: "approved",
    timezone: "America/Los_Angeles",
    locale: "en",
    // Settings data
    twoFactorAuth: {
      isEnabled: true,
      method: "email",
    },
    notificationPreferences: {
      email: true,
      sms: false,
      desktop: true,
    },
    cloudStorage: {
      googleDrive: {
        isConnected: true,
        email: "admin@pdfdex.com",
      },
      dropbox: {
        isConnected: false,
      },
    },
  })

  const [editForm, setEditForm] = useState({ ...userData })

  const handleEdit = () => {
    setIsEditing(true)
    setEditForm({ ...userData })
  }

  const handleSave = () => {
    setUserData({ ...editForm })
    setIsEditing(false)
    console.log("Saving user data:", editForm)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({ ...userData })
  }

  const handleInputChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "content_manager":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your profile information and settings</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center font-medium"
            >
              <FaEdit className="mr-2" size={14} />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center font-medium"
              >
                <FaSave className="mr-2" size={14} />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center font-medium"
              >
                <FaTimes className="mr-2" size={14} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <div className="relative">
              <img
                src={userData.avatar || "/placeholder.svg"}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white"
              />
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg">
                  <FaCamera size={12} />
                </button>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex-1">
              <h2 className="text-2xl font-bold text-white">{userData.username}</h2>
              <p className="text-gray-300 mt-1">
                {userData.jobTitle} at {userData.company}
              </p>
              <div className="flex items-center space-x-3 mt-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}
                >
                  <FaUserShield className="mr-1" size={12} />
                  {userData.role.replace("_", " ").toUpperCase()}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userData.status)}`}
                >
                  <FaCheckCircle className="mr-1 text-green-600" size={12} />
                  {userData.status.toUpperCase()}
                </span>
                {userData.isVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FaCheckCircle className="mr-1 text-blue-600" size={12} />
                    VERIFIED
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "profile", label: "Profile Information", icon: FaUser },
              { id: "settings", label: "Account Settings", icon: FaCog },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.username}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBriefcase className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.jobTitle}
                        onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.jobTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBriefcase className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.company}
                      </div>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGlobe className="text-gray-400" size={16} />
                    </div>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                      />
                    ) : (
                      <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                        {userData.website}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" size={16} />
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editForm.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      rows={3}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    />
                  ) : (
                    <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900 min-h-[80px]">
                      {userData.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Timezone and Locale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  {isEditing ? (
                    <select
                      value={editForm.timezone}
                      onChange={(e) => handleInputChange("timezone", e.target.value)}
                      className="block w-full py-3 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  ) : (
                    <div className="block w-full py-3 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                      {userData.timezone}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  {isEditing ? (
                    <select
                      value={editForm.locale}
                      onChange={(e) => handleInputChange("locale", e.target.value)}
                      className="block w-full py-3 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-white text-gray-900"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  ) : (
                    <div className="block w-full py-3 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
                      {userData.locale === "en" ? "English" : userData.locale}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Security Settings */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaShieldAlt className="mr-2 text-blue-600" />
                  Security Settings
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h5>
                      <p className="text-xs text-gray-500">
                        {userData.twoFactorAuth.isEnabled ? `Enabled via ${userData.twoFactorAuth.method}` : "Disabled"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.twoFactorAuth.isEnabled ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {userData.twoFactorAuth.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Email Notifications</h5>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.notificationPreferences.email
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {userData.notificationPreferences.email ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">SMS Notifications</h5>
                        <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.notificationPreferences.sms
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {userData.notificationPreferences.sms ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Desktop Notifications</h5>
                        <p className="text-xs text-gray-500">Show browser notifications</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.notificationPreferences.desktop
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {userData.notificationPreferences.desktop ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connected Accounts */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Google Drive</h5>
                        <p className="text-xs text-gray-500">
                          {userData.cloudStorage.googleDrive.isConnected
                            ? userData.cloudStorage.googleDrive.email
                            : "Not connected"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.cloudStorage.googleDrive.isConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {userData.cloudStorage.googleDrive.isConnected ? "Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Dropbox</h5>
                        <p className="text-xs text-gray-500">
                          {userData.cloudStorage.dropbox.isConnected ? "Connected" : "Not connected"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData.cloudStorage.dropbox.isConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {userData.cloudStorage.dropbox.isConnected ? "Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
