"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  FaLock,
  FaShieldAlt,
  FaMobileAlt,
  FaQrcode,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaExclamationTriangle,
  FaDesktop,
  FaGlobe,
  FaClock,
} from "react-icons/fa"
import { Shield } from "lucide-react"

// Custom Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-4">
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

// Password Change Modal Component
const PasswordChangeModal = ({ isOpen, onClose, onUpdate }) => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onUpdate(newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
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
          <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full py-3 px-4 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.currentPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full py-3 px-4 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.newPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full py-3 px-4 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
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
              Update Password
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [authenticatorEnabled, setAuthenticatorEnabled] = useState(false)
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  const handlePasswordUpdate = (newPassword) => {
    console.log("Password updated")
  }

  const activeSessions = [
    {
      device: "Current Device",
      browser: "Chrome on Windows",
      location: "New York, USA",
      lastActive: "Just now",
      current: true,
    },
    {
      device: "Mobile Device",
      browser: "Safari on iPhone",
      location: "New York, USA",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      device: "Work Computer",
      browser: "Firefox on macOS",
      location: "New York, USA",
      lastActive: "1 day ago",
      current: false,
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account security, two-factor authentication, and monitor your active sessions
          </p>
        </div>

        <div className="space-y-6">
          {/* Password Section */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-2 rounded-lg">
                <FaLock className="text-red-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Password</h2>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-gray-900">Account Password</div>
                  <div className="text-sm text-gray-500">
                    A strong password helps protect your account from unauthorized access. We recommend using a
                    combination of letters, numbers, and special characters.
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 whitespace-nowrap rounded-lg transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
              <div className="text-sm text-gray-500">Last changed: 30 days ago</div>
            </div>
          </motion.div>

          {/* Two-Factor Authentication */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaShieldAlt className="text-green-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-600 mt-1" size={20} />
                  <div>
                    <div className="font-medium text-blue-900 mb-1">Enhanced Security</div>
                    <div className="text-sm text-blue-700">
                      Two-factor authentication adds an extra layer of security to your account. Even if someone knows
                      your password, they won't be able to access your account without the second factor.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <ToggleSwitch
                  enabled={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  label="SMS Two-Factor Authentication"
                  description="Receive verification codes via text message to your registered phone number"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Authenticator App</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Use an authenticator app like Google Authenticator or Authy for more secure verification codes
                    </div>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${authenticatorEnabled ? "bg-red-600" : "bg-gray-300"
                      }`}
                    onClick={() => {
                      setAuthenticatorEnabled(!authenticatorEnabled)
                      if (!authenticatorEnabled) {
                        setShowQRCode(true)
                      }
                    }}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                      animate={{ x: authenticatorEnabled ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                {showQRCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-gray-200 pt-4 mt-4"
                  >
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <FaQrcode className="text-gray-600" size={20} />
                        <div className="font-medium text-gray-900">Setup Authenticator App</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 text-center">
                            <FaQrcode className="mx-auto text-gray-400 mb-2" size={80} />
                            <div className="text-sm text-gray-600">QR Code would appear here</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-700 mb-4">
                            <div className="font-medium mb-2">Setup Instructions:</div>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Download an authenticator app</li>
                              <li>Scan the QR code with your app</li>
                              <li>Enter the 6-digit code below</li>
                            </ol>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                            <input
                              type="text"
                              placeholder="Enter 6-digit code"
                              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>

                          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                            Verify & Enable
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Login Alerts */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <FaExclamationTriangle className="text-yellow-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Login Alerts</h2>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <ToggleSwitch
                enabled={loginAlertsEnabled}
                onChange={setLoginAlertsEnabled}
                label="Suspicious Login Alerts"
                description="Get notified when someone signs in to your account from an unrecognized device or location"
              />
            </div>
          </motion.div>

          {/* Active Sessions */}
          <motion.div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FaDesktop className="text-purple-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              These are the devices and browsers currently signed in to your account. If you see any unfamiliar
              activity, you should sign out of all sessions and change your password immediately.
            </div>

            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg">
                        {session.device.includes("Mobile") ? (
                          <FaMobileAlt className="text-gray-600" size={16} />
                        ) : (
                          <FaDesktop className="text-gray-600" size={16} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{session.device}</div>
                          {session.current && (
                            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Current</div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{session.browser}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <FaGlobe size={12} />
                            {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock size={12} />
                            {session.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">Sign Out</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                Sign Out of All Other Sessions
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onUpdate={handlePasswordUpdate}
      />
    </div>
  )
}
