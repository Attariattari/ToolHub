"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { FiShield, FiArrowRight, FiRefreshCw } from "react-icons/fi"

export default function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleInputChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple characters

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i]
    }

    setCode(newCode)

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fullCode = code.join("")

    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      if (fullCode === "123456") {
        // Redirect to dashboard
        window.location.href = "/dashboard"
      } else {
        setError("Invalid verification code. Please try again.")
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    }, 2000)
  }

  const handleResendCode = () => {
    setIsLoading(true)
    // Simulate resend
    setTimeout(() => {
      setIsLoading(false)
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    }, 1000)
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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">Enter the 6-digit code sent to your email address to complete sign in.</p>
          </div>

          {/* 2FA Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Verification Code</label>
              <div className="flex justify-center space-x-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-xl font-semibold bg-gray-50 border-0 rounded-lg ring-1 ring-gray-300 focus:ring-red-500 outline-none transition-colors"
                  />
                ))}
              </div>
              {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Verify & Continue
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Resend code"}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Check your spam folder if you don't see the email.</p>
            <p className="mt-2">
              Having trouble?{" "}
              <Link href="/contact" className="text-red-600 hover:text-red-700">
                Contact support
              </Link>
            </p>
          </div>
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
            <h2 className="text-4xl font-bold mb-6">Enhanced Security</h2>
            <p className="text-xl text-red-100 mb-8 leading-relaxed">
              Two-factor authentication adds an extra layer of security to protect your account from unauthorized
              access.
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
                <span className="text-red-100">Double security verification</span>
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
                <span className="text-red-100">Protection against breaches</span>
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
                <span className="text-red-100">Secure account access</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
