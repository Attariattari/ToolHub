"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { FiMail, FiArrowRight, FiRefreshCw } from "react-icons/fi"

export default function VerifyEmailPage() {
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleResendEmail = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setCountdown(60)
      setCanResend(false)
    }, 2000)
  }

  const handleVerify = () => {
    setIsLoading(true)
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false)
      setIsVerified(true)
    }, 2000)
  }

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
          {!isVerified ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiMail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
                <p className="text-gray-600">
                  We've sent a verification link to <strong>john@example.com</strong>
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">To verify your email:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>Return to this page to continue</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      I've Verified My Email
                      <FiArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Didn't receive the email?</p>
                  <button
                    onClick={handleResendEmail}
                    disabled={!canResend || isLoading}
                    className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <FiRefreshCw className="w-4 h-4 animate-spin mr-1" />
                        Sending...
                      </span>
                    ) : canResend ? (
                      "Resend verification email"
                    ) : (
                      `Resend in ${countdown}s`
                    )}
                  </button>
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Check your spam folder if you don't see the email.</p>
                <p className="mt-2">
                  Need help?{" "}
                  <Link href="/contact" className="text-red-600 hover:text-red-700">
                    Contact support
                  </Link>
                </p>
              </div>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h1>
                <p className="text-gray-600 mb-8">
                  Your email has been successfully verified. You can now access all features of PDF ToolsHub.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Go to Dashboard
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
            <h2 className="text-4xl font-bold mb-6">Secure Email Verification</h2>
            <p className="text-xl text-red-100 mb-8 leading-relaxed">
              Email verification helps us ensure the security of your account and enables important notifications.
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
                <span className="text-red-100">Account security protection</span>
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
                <span className="text-red-100">Important notifications</span>
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
                <span className="text-red-100">Password recovery access</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
