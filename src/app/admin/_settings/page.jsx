"use client"

import { useState } from "react"
import {
  FaKey,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaDropbox,
  FaEnvelope,
  FaPhone,
  FaDesktop,
  FaShieldAlt,
} from "react-icons/fa"

export default function AdminSettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Simplified settings data based on your schema
  const [settings, setSettings] = useState({
    // Two Factor Authentication
    twoFactorAuth: {
      isEnabled: true,
      method: "email",
    },
    // Notification Preferences
    notificationPreferences: {
      email: true,
      sms: false,
      desktop: true,
    },
    // Cloud Storage
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

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handlePasswordChange = (e) => {
    e.preventDefault()
    console.log("Changing password:", passwordForm)
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    alert("Password changed successfully!")
  }

  const toggleTwoFactor = () => {
    setSettings((prev) => ({
      ...prev,
      twoFactorAuth: {
        ...prev.twoFactorAuth,
        isEnabled: !prev.twoFactorAuth.isEnabled,
      },
    }))
  }

  const toggleNotification = (type) => {
    setSettings((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: !prev.notificationPreferences[type],
      },
    }))
  }

  const toggleCloudStorage = (service) => {
    setSettings((prev) => ({
      ...prev,
      cloudStorage: {
        ...prev.cloudStorage,
        [service]: {
          ...prev.cloudStorage[service],
          isConnected: !prev.cloudStorage[service].isConnected,
        },
      },
    }))
  }

  const changeTwoFactorMethod = (method) => {
    setSettings((prev) => ({
      ...prev,
      twoFactorAuth: {
        ...prev.twoFactorAuth,
        method: method,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account security and preferences</p>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaKey className="mr-2 text-blue-600" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showCurrentPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="block w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
          >
            <FaKey className="mr-2" size={14} />
            Update Password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FaShieldAlt className="mr-2 text-blue-600" />
            Two-Factor Authentication
          </h3>
          <button
            onClick={toggleTwoFactor}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.twoFactorAuth.isEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.twoFactorAuth.isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {settings.twoFactorAuth.isEnabled && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Choose your preferred 2FA method:</p>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="twoFactorMethod"
                  value="email"
                  checked={settings.twoFactorAuth.method === "email"}
                  onChange={(e) => changeTwoFactorMethod(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="twoFactorMethod"
                  value="sms"
                  checked={settings.twoFactorAuth.method === "sms"}
                  onChange={(e) => changeTwoFactorMethod(e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">SMS</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            {
              key: "email",
              label: "Email Notifications",
              description: "Receive notifications via email",
              icon: FaEnvelope,
            },
            {
              key: "sms",
              label: "SMS Notifications",
              description: "Receive notifications via SMS",
              icon: FaPhone,
            },
            {
              key: "desktop",
              label: "Desktop Notifications",
              description: "Show browser notifications",
              icon: FaDesktop,
            },
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <notification.icon className="text-gray-400" size={20} />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{notification.label}</h4>
                  <p className="text-xs text-gray-500">{notification.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotification(notification.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationPreferences[notification.key] ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationPreferences[notification.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Storage Integrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cloud Storage</h3>
        <div className="space-y-4">
          {/* Google Drive */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaGoogle className="text-blue-500" size={24} />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Google Drive</h4>
                {settings.cloudStorage.googleDrive.isConnected && (
                  <p className="text-xs text-gray-500">{settings.cloudStorage.googleDrive.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleCloudStorage("googleDrive")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                settings.cloudStorage.googleDrive.isConnected
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {settings.cloudStorage.googleDrive.isConnected ? "Disconnect" : "Connect"}
            </button>
          </div>

          {/* Dropbox */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaDropbox className="text-blue-600" size={24} />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Dropbox</h4>
                <p className="text-xs text-gray-500">
                  {settings.cloudStorage.dropbox.isConnected ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleCloudStorage("dropbox")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                settings.cloudStorage.dropbox.isConnected
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {settings.cloudStorage.dropbox.isConnected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
