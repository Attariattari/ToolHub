"use client"

import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FiMail, FiArrowRight, FiRefreshCw, FiLoader, FiAlertCircle } from "react-icons/fi"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import { UserContext } from "@/context/User.context"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { reFetchUser } = useContext(UserContext)
 
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState("")
  const [purpose, setPurpose] = useState("email_verification")
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Get email and purpose from URL params
    const emailParam = searchParams.get('email')
    const purposeParam = searchParams.get('purpose') || 'email_verification'

    if (!emailParam) {
      setIsValidUrl(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailParam)) {
      setIsValidUrl(false)
      return
    }

    // Validate purpose
    const validPurposes = ['email_verification', 'password_reset', 'two_factor_auth']
    if (!validPurposes.includes(purposeParam)) {
      setIsValidUrl(false)
      return
    }

    setEmail(emailParam)
    setPurpose(purposeParam)
  }, [searchParams])

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Clear errors when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: "" }))
    }

    // Auto-focus next input
    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const pastedOtp = pastedData.replace(/\D/g, "").slice(0, 6).split("")

    const newOtp = [...otp]
    pastedOtp.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit
    })
    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === "")
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    const inputToFocus = document.getElementById(`otp-${focusIndex}`)
    if (inputToFocus) inputToFocus.focus()
  }

  const validateOtp = () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit verification code" })
      return false
    }
    if (!/^\d{6}$/.test(otpString)) {
      setErrors({ otp: "Verification code must contain only numbers" })
      return false
    }
    return true
  }

  const handleVerify = async () => {
    if (!validateOtp()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await Api.post('/users/verify-otp', {
        email,
        otp: otp.join(""),
        purpose
      })

      const { data } = response.data
      toast.success(response.data.message || 'Verification successful!')

      // Handle different purposes
      switch (purpose) {
        case 'email_verification':
          setIsVerified(true)
          reFetchUser()
          break

        case 'password_reset':
          // Redirect to reset password page
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&token=verified&otp=${otp.join("")}`)
          break

        case 'two_factor_auth':
          // Login successful, redirect to dashboard
          // router.push('/admin')
          if (data?.role === 'user') {
            window.location.href = '/user'
          } else {
            window.location.href = '/admin'
          }
          // reFetchUser()
          break

        default:
          setIsVerified(true)
      }

    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Verification failed. Please try again."
      toast.error(errorMessage)

      if (errorMessage.includes('Invalid verification code')) {
        setErrors({ otp: "Invalid verification code. Please check and try again." })
      } else if (errorMessage.includes('expired')) {
        setErrors({ otp: "Verification code has expired. Please request a new one." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      await Api.post('/users/resend-otp', {
        email,
        purpose
      })

      toast.success('New verification code sent to your email!')
      setCountdown(60)
      setCanResend(false)
      setOtp(["", "", "", "", "", ""]) // Clear current OTP

    } catch (error) {
      console.error('Resend OTP error:', error)
      const errorMessage = error?.response?.data?.message || "Failed to resend code. Please try again."
      toast.error(errorMessage)

      if (error?.response?.status === 429) {
        // Rate limit hit, show countdown anyway
        setCountdown(60)
        setCanResend(false)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPurposeText = () => {
    switch (purpose) {
      case 'email_verification':
        return {
          title: "Verify Your Email",
          description: "Enter the 6-digit verification code sent to your email",
          instruction: "verify your email address"
        }
      case 'password_reset':
        return {
          title: "Reset Your Password",
          description: "Enter the 6-digit code sent to your email to reset your password",
          instruction: "reset your password"
        }
      case 'two_factor_auth':
        return {
          title: "Two-Factor Authentication",
          description: "Enter the 6-digit security code sent to your email",
          instruction: "complete your login"
        }
      default:
        return {
          title: "Verify Your Account",
          description: "Enter the 6-digit verification code sent to your email",
          instruction: "verify your account"
        }
    }
  }

  // Handle invalid URL
  if (!isValidUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-8">
            This verification link is invalid or has been tampered with. Please try again or contact support.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/signup"
              className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
            >
              Go to Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="block w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const purposeText = getPurposeText()

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
          {!isVerified ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiMail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{purposeText.title}</h1>
                <p className="text-gray-600">
                  {purposeText.description}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Sent to <strong>{email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center space-x-3 mb-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className={`w-12 h-12 text-center text-lg font-semibold bg-gray-50 border-0 rounded-lg ring-1 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.otp
                          ? 'ring-blue-500 focus:ring-blue-500'
                          : 'ring-gray-300 focus:ring-blue-500'
                        }`}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-sm text-blue-600 text-center">{errors.otp}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  onClick={handleVerify}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="mr-2 w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <FiArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                  <button
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <FiRefreshCw className="w-4 h-4 animate-spin mr-1" />
                        Sending...
                      </span>
                    ) : canResend ? (
                      "Resend verification code"
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
                  <Link href="/contact" className="text-blue-600 hover:text-blue-700">
                    Contact support
                  </Link>
                </p>
                <p className="mt-2">
                  Wrong email?{" "}
                  <Link
                    href={purpose === 'password_reset' ? '/auth/forgot-password' : '/auth/signup'}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Try again
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
                  Your email has been successfully verified. You can now access all features of PDFDEX.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                >
                  Continue to Login
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
            <h2 className="text-4xl font-bold mb-6">Secure Verification</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              We've sent a secure 6-digit code to {purposeText.instruction}. This helps protect your account and data.
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
                <span className="text-blue-100">Enhanced security protection</span>
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
                <span className="text-blue-100">Quick 6-digit verification</span>
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
                <span className="text-blue-100">Expires in 10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// "use client"

// import { useState, useEffect } from "react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import { FiMail, FiArrowRight, FiRefreshCw } from "react-icons/fi"

// export default function VerifyEmailPage() {
//   const [isVerified, setIsVerified] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [countdown, setCountdown] = useState(60)
//   const [canResend, setCanResend] = useState(false)

//   useEffect(() => {
//     if (countdown > 0 && !canResend) {
//       const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
//       return () => clearTimeout(timer)
//     } else if (countdown === 0) {
//       setCanResend(true)
//     }
//   }, [countdown, canResend])

//   const handleResendEmail = () => {
//     setIsLoading(true)
//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false)
//       setCountdown(60)
//       setCanResend(false)
//     }, 2000)
//   }

//   const handleVerify = () => {
//     setIsLoading(true)
//     // Simulate verification
//     setTimeout(() => {
//       setIsLoading(false)
//       setIsVerified(true)
//     }, 2000)
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
//           {!isVerified ? (
//             <>
//               {/* Header */}
//               <div className="text-center mb-8">
//                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                   <FiMail className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
//                 <p className="text-gray-600">
//                   We've sent a verification link to <strong>john@example.com</strong>
//                 </p>
//               </div>

//               {/* Instructions */}
//               <div className="bg-gray-50 rounded-lg p-6 mb-6">
//                 <h3 className="font-semibold text-gray-900 mb-3">To verify your email:</h3>
//                 <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
//                   <li>Check your email inbox</li>
//                   <li>Click the verification link in the email</li>
//                   <li>Return to this page to continue</li>
//                 </ol>
//               </div>

//               {/* Action Buttons */}
//               <div className="space-y-4">
//                 <motion.button
//                   whiletap={{ scale: 0.98 }}
//                   onClick={handleVerify}
//                   disabled={isLoading}
//                   className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50"
//                 >
//                   {isLoading ? (
//                     <FiRefreshCw className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <>
//                       I've Verified My Email
//                       <FiArrowRight className="ml-2 w-4 h-4" />
//                     </>
//                   )}
//                 </motion.button>

//                 <div className="text-center">
//                   <p className="text-sm text-gray-600 mb-2">Didn't receive the email?</p>
//                   <button
//                     onClick={handleResendEmail}
//                     disabled={!canResend || isLoading}
//                     className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {isLoading ? (
//                       <span className="flex items-center">
//                         <FiRefreshCw className="w-4 h-4 animate-spin mr-1" />
//                         Sending...
//                       </span>
//                     ) : canResend ? (
//                       "Resend verification email"
//                     ) : (
//                       `Resend in ${countdown}s`
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Help Text */}
//               <div className="mt-6 text-center text-sm text-gray-500">
//                 <p>Check your spam folder if you don't see the email.</p>
//                 <p className="mt-2">
//                   Need help?{" "}
//                   <Link href="/contact" className="text-blue-600 hover:text-blue-700">
//                     Contact support
//                   </Link>
//                 </p>
//               </div>
//             </>
//           ) : (
//             <>
//               {/* Success Message */}
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                   <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                   </svg>
//                 </div>
//                 <h1 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h1>
//                 <p className="text-gray-600 mb-8">
//                   Your email has been successfully verified. You can now access all features of PDFDEX.
//                 </p>
//                 <Link
//                   href="/dashboard"
//                   className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
//                 >
//                   Go to Dashboard
//                   <FiArrowRight className="ml-2 w-4 h-4" />
//                 </Link>
//               </div>
//             </>
//           )}
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
//             <h2 className="text-4xl font-bold mb-6">Secure Email Verification</h2>
//             <p className="text-xl text-blue-100 mb-8 leading-relaxed">
//               Email verification helps us ensure the security of your account and enables important notifications.
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
//                 <span className="text-blue-100">Account security protection</span>
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
//                 <span className="text-blue-100">Important notifications</span>
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
//                 <span className="text-blue-100">Password recovery access</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   )
// }
