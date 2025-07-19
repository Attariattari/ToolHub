"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaBuilding,
  FaMapMarkerAlt,
  FaEdit,
  FaTimes,
  FaFileAlt,
  FaBoxes,
  FaCrown,
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaBell,
  FaSms,
  FaDesktop,
  FaChartLine,
  FaCloudUploadAlt,
  FaSignature,
} from "react-icons/fa"
import { Check, X, Mail, LinkIcon } from 'lucide-react'

// Custom Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
      </div>
      <div
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${enabled ? "bg-red-600" : "bg-gray-300"
          }`}
        onClick={() => onChange(!enabled)}
      >
        <motion.div
          className="w-4 h-4 bg-white rounded-full shadow-sm"
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  )
}

// Custom Input Component
const ProfileInput = ({ icon, label, value, onChange, type = "text", disabled = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`pl-10 w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${disabled ? "bg-gray-50 text-gray-500" : "bg-white"
            }`}
          placeholder={`Enter your ${label.toLowerCase()}`}
        />
      </div>
    </div>
  )
}

// Email Update Modal Component
const EmailUpdateModal = ({ isOpen, onClose, currentEmail, onUpdate }) => {
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!newEmail) {
      newErrors.newEmail = "New email is required"
    } else if (!/\S+@\S+\.\S+/.test(newEmail)) {
      newErrors.newEmail = "Please enter a valid email"
    }

    if (!confirmEmail) {
      newErrors.confirmEmail = "Please confirm your email"
    } else if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Emails do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onUpdate(newEmail)
      setNewEmail("")
      setConfirmEmail("")
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Update Email Address</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Email</label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.newEmail ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter new email address"
            />
            {errors.newEmail && <p className="text-red-500 text-sm mt-1">{errors.newEmail}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Email</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className={`w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.confirmEmail ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Re-enter new email address"
            />
            {errors.confirmEmail && <p className="text-red-500 text-sm mt-1">{errors.confirmEmail}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Update Email
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Social Connect Button Component
const SocialConnectButton = ({ icon, name, connected, onConnect, color }) => {
  return (
    <button
      onClick={onConnect}
      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${connected
          ? `border-${color}-200 bg-${color}-50`
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-${color}-600`}>{icon}</div>
        <div className="text-left">
          <div className="font-medium text-gray-900">{name}</div>
          <div className={`text-sm ${connected ? `text-${color}-600` : "text-gray-500"}`}>
            {connected ? "Connected" : "Not connected"}
          </div>
        </div>
      </div>
      <div className={`text-sm font-medium ${connected ? `text-${color}-600` : "text-gray-600"}`}>
        {connected ? "Disconnect" : "Connect"}
      </div>
    </button>
  )
}

export default function MyAccountPage() {
  const [profile, setProfile] = useState({
    name: "Rashid Ali",
    email: "rashid.ali@example.com",
    phone: "+1 234 567 8901",
    website: "www.example.com",
    company: "Example Corp",
    address: "123 Main St, City, Country",
  })

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [desktopNotifications, setDesktopNotifications] = useState(true)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const [socialConnections, setSocialConnections] = useState({
    google: true,
    facebook: false,
    twitter: false,
    linkedin: true,
    github: false,
    instagram: false,
  })

  const updateProfile = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleEmailUpdate = (newEmail) => {
    updateProfile("email", newEmail)
    console.log("Email updated to:", newEmail)
  }

  const handleSocialConnect = (platform) => {
    setSocialConnections((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }))
  }

  const stats = [
    {
      icon: <FaFileAlt className="text-red-600" size={24} />,
      label: "Files Processed",
      value: "128",
      change: "+12%",
      changeType: "positive",
    },
    {
      icon: <FaCloudUploadAlt className="text-blue-600" size={24} />,
      label: "Storage Used",
      value: "45 MB",
      change: "of 100 MB",
      changeType: "neutral",
    },
    {
      icon: <FaSignature className="text-green-600" size={24} />,
      label: "Documents Signed",
      value: "24",
      change: "+8%",
      changeType: "positive",
    },
    // {
    //   icon: <FaChartLine className="text-purple-600" size={24} />,
    //   label: "Monthly Usage",
    //   value: "87%",
    //   change: "This month",
    //   changeType: "neutral",
    // },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
          <button className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2">
            <Check size={16} />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Left Container - Main Content */}
          <div className="lg:col-span-5 space-y-4">
            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gray-50 p-2 rounded-lg">{stat.icon}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div
                    className={`text-xs ${stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                  >
                    {stat.change}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Profile Information */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-red-100 p-2 rounded-lg">
                  <FaUser className="text-red-600" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileInput
                  icon={<FaUser className="text-gray-400" size={18} />}
                  label="Full Name"
                  value={profile.name}
                  onChange={(value) => updateProfile("name", value)}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="pl-10 pr-20 w-full py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      <FaEdit size={14} className="mr-1" />
                      Edit
                    </button>
                  </div>
                </div>

                <ProfileInput
                  icon={<FaPhone className="text-gray-400" size={18} />}
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(value) => updateProfile("phone", value)}
                />

                <ProfileInput
                  icon={<FaGlobe className="text-gray-400" size={18} />}
                  label="Website"
                  value={profile.website}
                  onChange={(value) => updateProfile("website", value)}
                />

                <ProfileInput
                  icon={<FaBuilding className="text-gray-400" size={18} />}
                  label="Company"
                  value={profile.company}
                  onChange={(value) => updateProfile("company", value)}
                />

                <ProfileInput
                  icon={<FaMapMarkerAlt className="text-gray-400" size={18} />}
                  label="Address"
                  value={profile.address}
                  onChange={(value) => updateProfile("address", value)}
                />
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FaBell className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>

              <div className="space-y-1 divide-y divide-gray-100">
                <ToggleSwitch
                  enabled={emailNotifications}
                  onChange={setEmailNotifications}
                  label="Email Notifications"
                  description="Receive updates about your account, new features, and important announcements via email"
                />

                <ToggleSwitch
                  enabled={smsNotifications}
                  onChange={setSmsNotifications}
                  label="SMS Notifications"
                  description="Get critical alerts and security notifications via text message to your phone"
                />

                <ToggleSwitch
                  enabled={desktopNotifications}
                  onChange={setDesktopNotifications}
                  label="Desktop Notifications"
                  description="Show browser notifications for real-time updates when you're using our platform"
                />
              </div>
            </motion.div>

            {/* Subscription */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FaCrown className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Subscription Plan</h2>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">Free Plan</div>
                    <div className="text-gray-600">Perfect for getting started</div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Current</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="text-green-600" size={16} />
                    <span className="text-sm text-gray-700">Up to 100 MB storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="text-green-600" size={16} />
                    <span className="text-sm text-gray-700">Basic PDF tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="text-green-600" size={16} />
                    <span className="text-sm text-gray-700">5 documents per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="text-gray-400" size={16} />
                    <span className="text-sm text-gray-500">Advanced features</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Upgrade to unlock unlimited processing, advanced tools, priority support, and remove watermarks from
                  your documents.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors font-medium">
                  Upgrade to Pro - $9.99/month
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  View All Plans
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Container - Social Links */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-[100px] h-[calc(100vh-120px)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <LinkIcon className="text-green-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Social Accounts</h2>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                Connect your social accounts to easily sign in and share your documents across platforms. This helps
                streamline your workflow and keeps everything synchronized.
              </div>

              <div className="space-y-3">
                <SocialConnectButton
                  icon={<FaGoogle size={20} />}
                  name="Google"
                  connected={socialConnections.google}
                  onConnect={() => handleSocialConnect("google")}
                  color="red"
                />

                <SocialConnectButton
                  icon={<FaFacebook size={20} />}
                  name="Facebook"
                  connected={socialConnections.facebook}
                  onConnect={() => handleSocialConnect("facebook")}
                  color="blue"
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">Security Tip</div>
                <div className="text-xs text-blue-700">
                  Only connect accounts you trust. You can disconnect any account at any time from this page.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Email Update Modal */}
      <EmailUpdateModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={profile.email}
        onUpdate={handleEmailUpdate}
      />
    </div>
  )
}
