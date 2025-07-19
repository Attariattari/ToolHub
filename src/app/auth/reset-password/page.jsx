"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { FiEye, FiEyeOff, FiLock, FiArrowRight, FiCheck } from "react-icons/fi"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle reset password logic here
    console.log("Reset password data:", formData)
    setIsSubmitted(true)
  }

  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains number", met: /\d/.test(formData.password) },
    { text: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex w-full overflow-x-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h1>
                <p className="text-gray-600">Your new password must be different from previous passwords.</p>
              </div>

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border-0 ring-1 ring-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                    <div className="space-y-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center mr-3 ${req.met ? "bg-green-500" : "bg-gray-300"
                              }`}
                          >
                            {req.met && <FiCheck className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${req.met ? "text-green-600" : "text-gray-500"}`}>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border-0 ring-1 ring-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={
                    !passwordRequirements.every((req) => req.met) || formData.password !== formData.confirmPassword
                  }
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Password
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </motion.button>
              </form>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Password Reset Successfully</h1>
                <p className="text-gray-600 mb-8">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Sign In Now
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Right Side - Information */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden"
      >
        {/* Background SVG Elements */}
        <div className="absolute inset-0">
          <svg
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
            width="400"
            height="400"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
            <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
            <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
          </svg>
          <svg
            className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
            width="300"
            height="300"
            viewBox="0 0 300 300"
            fill="none"
          >
            <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
            <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
          </svg>
          <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">Strong Password Security</h2>
            <p className="text-xl text-red-100 mb-8 leading-relaxed">
              Create a strong, secure password to protect your account and personal information.
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-red-100">Advanced encryption protection</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-red-100">Secure password requirements</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-red-100">Account security guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
