"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { FiShield, FiArrowRight, FiRefreshCw, FiAlertCircle, FiCheck } from "react-icons/fi"

export default function TwoFactorPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const inputRefs = useRef([])

  useEffect(() => {
    // Get email from localStorage or URL params (set during login)
    const email = localStorage.getItem('pendingVerificationEmail') ||
      new URLSearchParams(window.location.search).get('email')
    if (email) {
      setUserEmail(email)
    }

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
    setSuccess("")

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

  const verifyOTP = async (otpCode) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: userEmail,
          otp: otpCode,
          purpose: 'two_factor_auth'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullCode = code.join("")

    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code")
      return
    }

    if (!userEmail) {
      setError("Session expired. Please sign in again.")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await verifyOTP(fullCode)

      setSuccess("Verification successful! Redirecting to dashboard...")

      // Clear stored email
      localStorage.removeItem('pendingVerificationEmail')

      // Store user data if needed
      if (result.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user))
      }

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)

    } catch (error) {
      console.error('2FA verification error:', error)

      // Handle specific error cases
      if (error.message.includes('expired')) {
        setError("Verification code has expired. Please request a new one.")
      } else if (error.message.includes('Invalid')) {
        setError("Invalid verification code. Please try again.")
      } else {
        setError(error.message || "Verification failed. Please try again.")
      }

      // Clear the code and focus first input
      setCode(["", "", "", "", "", ""])
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (!userEmail) {
      setError("Session expired. Please sign in again.")
      return
    }

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          purpose: 'two_factor_auth'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError("")
    setSuccess("")

    try {
      await resendOTP()
      setSuccess("New verification code sent to your email!")
      setCode(["", "", "", "", "", ""])

      setTimeout(() => {
        setSuccess("")
        inputRefs.current[0]?.focus()
      }, 3000)

    } catch (error) {
      console.error('Resend OTP error:', error)

      if (error.message.includes('wait')) {
        setError("Please wait before requesting a new code.")
      } else {
        setError(error.message || "Failed to send new code. Please try again.")
      }
    } finally {
      setIsResending(false)
    }
  }

  const maskEmail = (email) => {
    if (!email) return "your email"
    const [username, domain] = email.split('@')
    if (username.length <= 2) return email
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    return `${maskedUsername}@${domain}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex w-full overflow-x-hidden">
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
            <p className="text-gray-600">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-gray-800">{maskEmail(userEmail)}</span>{" "}
              to complete sign in.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"
            >
              <FiCheck className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center"
            >
              <FiAlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
              <p className="text-blue-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* 2FA Form */}
          <div className="space-y-6">
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
                    disabled={isLoading || success}
                    className={`w-12 h-12 text-center text-xl font-semibold bg-gray-50 border-0 rounded-lg ring-1 transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${error
                        ? 'ring-blue-300 focus:ring-blue-500'
                        : success
                          ? 'ring-green-300 focus:ring-green-500'
                          : 'ring-gray-300 focus:ring-blue-500'
                      }`}
                  />
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || code.join("").length !== 6 || success}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : success ? (
                <>
                  <FiCheck className="w-4 h-4 mr-2" />
                  Verified
                </>
              ) : (
                <>
                  Verify & Continue
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendCode}
              disabled={isResending || isLoading || success}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isResending ? (
                <>
                  <FiRefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Check your spam folder if you don't see the email.</p>
            <p className="mt-2">
              Having trouble?{" "}
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 transition-colors">
                Contact support
              </Link>
            </p>
          </div>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Information */}
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
            <h2 className="text-4xl font-bold mb-6">Enhanced Security</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
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
                <span className="text-blue-100">Double security verification</span>
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
                <span className="text-blue-100">Protection against breaches</span>
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
                <span className="text-blue-100">Secure account access</span>
              </div>
            </div>

            {/* Security Tips */}
            <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-3">Security Tips</h3>
              <ul className="text-sm text-blue-100 space-y-2 text-left">
                <li>• Never share your verification code with anyone</li>
                <li>• The code expires in 10 minutes for your security</li>
                <li>• Contact support if you suspect suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// "use client"

// import { useState, useRef, useEffect } from "react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import { FiShield, FiArrowRight, FiRefreshCw } from "react-icons/fi"

// export default function TwoFactorPage() {
//   const [code, setCode] = useState(["", "", "", "", "", ""])
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState("")
//   const inputRefs = useRef([])

//   useEffect(() => {
//     // Focus first input on mount
//     if (inputRefs.current[0]) {
//       inputRefs.current[0].focus()
//     }
//   }, [])

//   const handleInputChange = (index, value) => {
//     if (value.length > 1) return // Prevent multiple characters

//     const newCode = [...code]
//     newCode[index] = value
//     setCode(newCode)
//     setError("")

//     // Auto-focus next input
//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus()
//     }
//   }

//   const handleKeyDown = (index, e) => {
//     // Handle backspace
//     if (e.key === "Backspace" && !code[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus()
//     }
//   }

//   const handlePaste = (e) => {
//     e.preventDefault()
//     const pastedData = e.clipboardData.getData("text").slice(0, 6)
//     const newCode = [...code]

//     for (let i = 0; i < pastedData.length && i < 6; i++) {
//       newCode[i] = pastedData[i]
//     }

//     setCode(newCode)

//     // Focus the next empty input or the last one
//     const nextIndex = Math.min(pastedData.length, 5)
//     inputRefs.current[nextIndex]?.focus()
//   }

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     const fullCode = code.join("")

//     if (fullCode.length !== 6) {
//       setError("Please enter the complete 6-digit code")
//       return
//     }

//     setIsLoading(true)
//     setError("")

//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false)
//       if (fullCode === "123456") {
//         // Redirect to dashboard
//         window.location.href = "/dashboard"
//       } else {
//         setError("Invalid verification code. Please try again.")
//         setCode(["", "", "", "", "", ""])
//         inputRefs.current[0]?.focus()
//       }
//     }, 2000)
//   }

//   const handleResendCode = () => {
//     setIsLoading(true)
//     // Simulate resend
//     setTimeout(() => {
//       setIsLoading(false)
//       setCode(["", "", "", "", "", ""])
//       inputRefs.current[0]?.focus()
//     }, 1000)
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex w-full overflow-x-hidden">
//       {/* Left Side - Form */}
//       <div className="flex-1 flex items-center justify-center p-8">
//         <motion.div
//           initial={{ opacity: 0, x: -50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.6 }}
//           className="w-full max-w-md"
//         >

//           {/* Header */}
//           <div className="text-center mb-8">
//             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <FiShield className="w-8 h-8 text-blue-600" />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
//             <p className="text-gray-600">Enter the 6-digit code sent to your email address to complete sign in.</p>
//           </div>

//           {/* 2FA Form */}
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Verification Code</label>
//               <div className="flex justify-center space-x-3">
//                 {code.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => (inputRefs.current[index] = el)}
//                     type="text"
//                     inputMode="numeric"
//                     pattern="[0-9]*"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleInputChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     onPaste={index === 0 ? handlePaste : undefined}
//                     className="w-12 h-12 text-center text-xl font-semibold bg-gray-50 border-0 rounded-lg ring-1 ring-gray-300 focus:ring-blue-500 outline-none transition-colors"
//                   />
//                 ))}
//               </div>
//               {error && <p className="mt-2 text-sm text-blue-600 text-center">{error}</p>}
//             </div>

//             <motion.button
//               whiletap={{ scale: 0.98 }}
//               type="submit"
//               disabled={isLoading || code.join("").length !== 6}
//               className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <FiRefreshCw className="w-4 h-4 animate-spin" />
//               ) : (
//                 <>
//                   Verify & Continue
//                   <FiArrowRight className="ml-2 w-4 h-4" />
//                 </>
//               )}
//             </motion.button>
//           </form>

//           {/* Resend Code */}
//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
//             <button
//               onClick={handleResendCode}
//               disabled={isLoading}
//               className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
//             >
//               {isLoading ? "Sending..." : "Resend code"}
//             </button>
//           </div>

//           {/* Help Text */}
//           <div className="mt-6 text-center text-sm text-gray-500">
//             <p>Check your spam folder if you don't see the email.</p>
//             <p className="mt-2">
//               Having trouble?{" "}
//               <Link href="/contact" className="text-blue-600 hover:text-blue-700">
//                 Contact support
//               </Link>
//             </p>
//           </div>
//         </motion.div>
//       </div>

//       {/* Right Side - Information */}
//       <motion.div
//         initial={{ opacity: 0, x: 50 }}
//         animate={{ opacity: 1, x: 0 }}
//         transition={{ duration: 0.6, delay: 0.2 }}
//         className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden"
//       >
//         {/* Background SVG Elements */}
//         <div className="absolute inset-0">
//           <svg
//             className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"
//             width="400"
//             height="400"
//             viewBox="0 0 400 400"
//             fill="none"
//           >
//             <circle cx="200" cy="200" r="200" fill="rgba(255,255,255,0.1)" />
//             <circle cx="200" cy="200" r="150" fill="rgba(255,255,255,0.05)" />
//             <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
//           </svg>
//           <svg
//             className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2"
//             width="300"
//             height="300"
//             viewBox="0 0 300 300"
//             fill="none"
//           >
//             <circle cx="150" cy="150" r="150" fill="rgba(255,255,255,0.08)" />
//             <circle cx="150" cy="150" r="100" fill="rgba(255,255,255,0.04)" />
//           </svg>
//           <div className="absolute top-20 left-20 w-4 h-4 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
//           <div className="absolute top-40 right-40 w-6 h-6 bg-white bg-opacity-15 rounded-full animate-pulse delay-1000"></div>
//           <div className="absolute bottom-32 right-20 w-3 h-3 bg-white bg-opacity-25 rounded-full animate-pulse delay-500"></div>
//         </div>

//         <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
//           <div className="text-center">
//             <h2 className="text-4xl font-bold mb-6">Enhanced Security</h2>
//             <p className="text-xl text-blue-100 mb-8 leading-relaxed">
//               Two-factor authentication adds an extra layer of security to protect your account from unauthorized
//               access.
//             </p>

//             <div className="space-y-4 text-left">
//               <div className="flex items-center">
//                 <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path
//                       fillRule="evenodd"
//                       d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//                 <span className="text-blue-100">Double security verification</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path
//                       fillRule="evenodd"
//                       d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//                 <span className="text-blue-100">Protection against breaches</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path
//                       fillRule="evenodd"
//                       d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                 </div>
//                 <span className="text-blue-100">Secure account access</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   )
// }
