"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { FiLoader, FiCheckCircle, FiXCircle, FiArrowRight, FiUser, FiShield } from "react-icons/fi"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

export default function FacebookCallback() {
  const router = useRouter()
  const [loadingState, setLoadingState] = useState("authenticating") // authenticating, creating, success, error
  const [errorMessage, setErrorMessage] = useState("")
  const [progress, setProgress] = useState(0)
  const hasRun = useRef(false)

  useEffect(() => {
    // Prevent double execution
    if (hasRun.current) return
    hasRun.current = true

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const error = urlParams.get("error")

    // Handle OAuth error
    if (error) {
      setLoadingState("error")
      setErrorMessage("Facebook authentication was cancelled or failed. Please try again.")
      return
    }

    if (!code) {
      setLoadingState("error")
      setErrorMessage("No authorization code received from Facebook. Please try again.")
      return
    }

    // Start authentication process
    authenticateWithFacebook(code)
  }, [])

  const authenticateWithFacebook = async (code) => {
    try {
      setLoadingState("authenticating")
      setProgress(30)

      // Simulate some processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await Api.post("/users/facebook-auth", { code })
      const { data } = response.data

      setProgress(60)
      setLoadingState("creating")

      // Simulate account creation/update process
      await new Promise(resolve => setTimeout(resolve, 1500))

      setProgress(100)
      setLoadingState("success")

      // Show success message
      toast.success(response.data.message || "Successfully signed in with Facebook!")

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/user'
      }, 2000)

    } catch (error) {
      setLoadingState("error")

      const errorMessage = error?.response?.data?.message || "Facebook authentication failed. Please try again."
      setErrorMessage(errorMessage)
      toast.error(errorMessage)

      // Redirect to login page after error
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    }
  }

  const getLoadingMessage = () => {
    switch (loadingState) {
      case "authenticating":
        return "Verifying your Facebook credentials..."
      case "creating":
        return "Setting up your account..."
      case "success":
        return "Welcome! Redirecting you now..."
      case "error":
        return "Authentication failed"
      default:
        return "Processing..."
    }
  }

  const getLoadingIcon = () => {
    switch (loadingState) {
      case "authenticating":
        return <FiShield className="w-12 h-12" />
      case "creating":
        return <FiUser className="w-12 h-12" />
      case "success":
        return <FiCheckCircle className="w-12 h-12" />
      case "error":
        return <FiXCircle className="w-12 h-12" />
      default:
        return <FiLoader className="w-12 h-12" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex w-full overflow-x-hidden">

      {/* Left Side - Callback Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${loadingState === "success" ? "bg-green-100 text-green-600" :
                  loadingState === "error" ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-600"
                }`}
            >
              {loadingState === "authenticating" || loadingState === "creating" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {getLoadingIcon()}
                </motion.div>
              ) : (
                getLoadingIcon()
              )}
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {loadingState === "success" ? "Welcome Back!" :
                loadingState === "error" ? "Authentication Failed" :
                  "Facebook Authentication"}
            </h1>
            <p className={`text-gray-600 ${loadingState === "error" ? "text-red-600" : ""}`}>
              {loadingState === "error" ? errorMessage : getLoadingMessage()}
            </p>
          </div>

          {/* Progress Section */}
          {loadingState !== "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">{progress}% Complete</p>
            </motion.div>
          )}

          {/* Status Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8"
          >
            <div className={`flex items-center space-x-4 p-3 rounded-lg ${loadingState === "authenticating" || loadingState === "creating" || loadingState === "success"
                ? "bg-blue-50" : "bg-gray-50"
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loadingState === "authenticating" || loadingState === "creating" || loadingState === "success"
                  ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500"
                }`}>
                {loadingState === "creating" || loadingState === "success" ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <span className={`font-medium ${loadingState === "authenticating" || loadingState === "creating" || loadingState === "success"
                  ? "text-blue-900" : "text-gray-500"
                }`}>
                Verifying credentials
              </span>
            </div>

            <div className={`flex items-center space-x-4 p-3 rounded-lg ${loadingState === "creating" || loadingState === "success"
                ? "bg-blue-50" : "bg-gray-50"
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loadingState === "creating" || loadingState === "success"
                  ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-500"
                }`}>
                {loadingState === "success" ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <span className={`font-medium ${loadingState === "creating" || loadingState === "success"
                  ? "text-blue-900" : "text-gray-500"
                }`}>
                Setting up account
              </span>
            </div>

            <div className={`flex items-center space-x-4 p-3 rounded-lg ${loadingState === "success" ? "bg-green-50" : "bg-gray-50"
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${loadingState === "success" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500"
                }`}>
                {loadingState === "success" ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <span className={`font-medium ${loadingState === "success" ? "text-green-900" : "text-gray-500"
                }`}>
                Redirecting
              </span>
            </div>
          </motion.div>

          {/* Action Button for Error State */}
          {loadingState === "error" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/auth/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              Back to Login
              <FiArrowRight className="ml-2 w-4 h-4" />
            </motion.button>
          )}

          {/* Success Message */}
          {loadingState === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-green-50 p-4 rounded-lg text-center"
            >
              <p className="text-green-700 font-medium">
                🎉 Authentication successful! Welcome to PDFDEX
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right Side - Information (Same as Login Page) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden"
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
            <h2 className="text-4xl font-bold mb-6">Welcome to PDFDEX</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Access powerful PDFDEX to merge, split, compress, and convert your documents with ease.
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
                <span className="text-blue-100">Free PDFDEX for everyone</span>
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
                <span className="text-blue-100">Secure and private processing</span>
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
                <span className="text-blue-100">No software installation required</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}