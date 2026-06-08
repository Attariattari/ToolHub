"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiArrowRight, FiLoader } from "react-icons/fi"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import GoogleLoginButton from "@/components/shared/GoogleLoginButton"
import FacebookLoginButton from "@/components/shared/FacebookLoginButton"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState({})

  // Frontend validation functions
  const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_](?:[a-zA-Z0-9_ ]{1,28}[a-zA-Z0-9_])?$/
    if (!username) return "Username is required"
    if (!usernameRegex.test(username)) {
      return "Username must be 3-30 characters, can include letters, numbers, underscores, and spaces (no leading/trailing spaces)"
    }
    return ""
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email is required"
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return ""
  }

  const validatePassword = (password) => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters long"
    return ""
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }

    // Real-time validation
    if (name === "username" && value) {
      const error = validateUsername(value)
      setErrors(prev => ({ ...prev, username: error }))
    } else if (name === "email" && value) {
      const error = validateEmail(value)
      setErrors(prev => ({ ...prev, email: error }))
    } else if (name === "password" && value) {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    const usernameError = validateUsername(formData.username)
    if (usernameError) newErrors.username = usernameError

    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the Terms of Service and Privacy Policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await Api.post('/users/register', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      toast.success(response.data.message || 'Account created successfully! Please check your email for verification.')

      // Navigate to verify-email page with email as query parameter
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&purpose=email_verification`)

    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = error?.response?.data?.message || "Something went wrong. Please try again."
      toast.error(errorMessage)

      // Handle specific backend validation errors
      if (error?.response?.data?.field) {
        setErrors(prev => ({
          ...prev,
          [error.response.data.field]: errorMessage
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex w-full overflow-x-hidden">
      <div className="flex-1 flex items-center justify-center max-md:pt-12 p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join us and start using powerful PDFDEX</p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex space-x-2 mb-6">
            <GoogleLoginButton isLoading={isLoading} />
            <FacebookLoginButton isLoading={isLoading} />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-blue-50 to-orange-50 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg ring-1 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.username
                      ? 'ring-blue-500 focus:ring-blue-500'
                      : 'ring-gray-300 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-blue-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg ring-1 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.email
                      ? 'ring-blue-500 focus:ring-blue-500'
                      : 'ring-gray-300 focus:ring-blue-500'
                    }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-blue-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border-0 rounded-lg ring-1 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.password
                      ? 'ring-blue-500 focus:ring-blue-500'
                      : 'ring-gray-300 focus:ring-blue-500'
                    }`}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-blue-600">{errors.password}</p>
              )}
            </div>

            <div>
              <div className="flex items-start">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 disabled:opacity-50 disabled:cursor-not-allowed ${errors.agreeToTerms ? 'border-blue-500' : ''
                    }`}
                  required
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-blue-600">{errors.agreeToTerms}</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isLoading ? (
                <>
                  <FiLoader className="mr-2 w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <FiArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className={`text-blue-600 hover:text-blue-700 font-medium ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
            >
              Sign in
            </Link>
          </p>
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
            <h2 className="text-4xl font-bold mb-6">Join PDFDEX</h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Create your free account and unlock the full potential of our PDFDEX.
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
                <span className="text-blue-100">Save your processing history</span>
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
                <span className="text-blue-100">Access premium features</span>
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
                <span className="text-blue-100">Priority customer support</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// "use client"

// import { useState } from "react"
// import { motion } from "framer-motion"
// import Link from "next/link"
// import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"

// export default function SignupPage() {
//   const [showPassword, setShowPassword] = useState(false)
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     password: "",
//     agreeToTerms: false,
//   })

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//       const response = await Api.post('/users/register', formData)
//       toast.success(response.data.message || 'User Register Successfully')
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Something went wrong")
//     }
    
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex w-full overflow-x-hidden">
//       <div className="flex-1 flex items-center justify-center max-md:pt-12 p-8">
//         <motion.div
//           initial={{ opacity: 0, x: -50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.6 }}
//           className="w-full max-w-md"
//         >
//           {/* Header */}
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
//             <p className="text-gray-600">Join us and start using powerful PDFDEX</p>
//           </div>

//           {/* Social Login Buttons */}
//           <div className="flex space-x-2 mb-6">
//             <button className="w-full flex items-center justify-center px-1 py-3 border border-gray-300 bg-gray-50 rounded-lg hover:bg-white transition-colors">
//               <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
//                 <path
//                   fill="#4285F4"
//                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                 />
//                 <path
//                   fill="#34A853"
//                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                 />
//                 <path
//                   fill="#FBBC05"
//                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                 />
//                 <path
//                   fill="#EA4335"
//                   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                 />
//               </svg>
//               Google
//             </button>
//             <button className="w-full flex items-center justify-center px-1 py-3 border border-gray-300 bg-gray-50 rounded-lg hover:bg-white transition-colors">
//               <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
//                 <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//               </svg>
//               Facebook
//             </button>
//           </div>

//           {/* Divider */}
//           <div className="relative mb-6">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-300" />
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-2 bg-gradient-to-br from-blue-50 to-orange-50 text-gray-500">
//                 Or continue with email
//               </span>
//             </div>
//           </div>

//           {/* Signup Form */}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
//                 Full Name
//               </label>
//               <div className="relative">
//                 <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   id="username"
//                   name="username"
//                   value={formData.username}
//                   onChange={handleInputChange}
//                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg ring-1 ring-gray-300 focus:ring-blue-500 outline-none transition-colors"
//                   placeholder="Enter your full name"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg ring-1 ring-gray-300 focus:ring-blue-500 outline-none transition-colors"
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <div className="relative">
//                 <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   className="w-full pl-10 pr-12 py-3 bg-gray-50 border-0 rounded-lg ring-1 ring-gray-300 focus:ring-blue-500 outline-none transition-colors"
//                   placeholder="Create a password"
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center">
//               <input
//                 id="agreeToTerms"
//                 name="agreeToTerms"
//                 type="checkbox"
//                 checked={formData.agreeToTerms}
//                 onChange={handleInputChange}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                 required
//               />
//               <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
//                 I agree to the{" "}
//                 <Link href="/terms" className="text-blue-600 hover:text-blue-700">
//                   Terms of Service
//                 </Link>{" "}
//                 and{" "}
//                 <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
//                   Privacy Policy
//                 </Link>
//               </label>
//             </div>

//             <motion.button
//               whiletap={{ scale: 0.98 }}
//               type="submit"
//               className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
//             >
//               Create Account
//               <FiArrowRight className="ml-2 w-4 h-4" />
//             </motion.button>
//           </form>

//           {/* Sign In Link */}
//           <p className="mt-6 text-center text-sm text-gray-600">
//             Already have an account?{" "}
//             <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
//               Sign in
//             </Link>
//           </p>
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
//             <h2 className="text-4xl font-bold mb-6">Join PDFDEX</h2>
//             <p className="text-xl text-blue-100 mb-8 leading-relaxed">
//               Create your free account and unlock the full potential of our PDFDEX.
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
//                 <span className="text-blue-100">Save your processing history</span>
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
//                 <span className="text-blue-100">Access premium features</span>
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
//                 <span className="text-blue-100">Priority customer support</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   )
// }
