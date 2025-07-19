"use client"

import { useState, useCallback, useEffect } from "react"
import { X, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { pdfjs } from "react-pdf"

export default function PasswordModal({ isOpen, onClose, passwordProtectedFiles, onSubmit }) {
  const [passwords, setPasswords] = useState({})
  const [showPasswords, setShowPasswords] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState({}) // 'valid', 'invalid', 'checking', null
  const [validationErrors, setValidationErrors] = useState({})

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPasswords({})
      setShowPasswords({})
      setPasswordStatus({})
      setValidationErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Validate password for a specific file
  const validatePassword = useCallback(async (file, password, fileId) => {
    if (!password || password.trim() === '') {
      setPasswordStatus(prev => ({ ...prev, [fileId]: null }))
      setValidationErrors(prev => ({ ...prev, [fileId]: null }))
      return
    }

    setPasswordStatus(prev => ({ ...prev, [fileId]: 'checking' }))
    setValidationErrors(prev => ({ ...prev, [fileId]: null }))

    try {
      // Get file data
      const arrayBuffer = await file.file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Try to load PDF with the provided password
      const loadingTask = pdfjs.getDocument({
        data: uint8Array,
        password: password.trim()
      })

      try {
        const pdf = await loadingTask.promise

        // If we reach here, password is correct
        setPasswordStatus(prev => ({ ...prev, [fileId]: 'valid' }))
        setValidationErrors(prev => ({ ...prev, [fileId]: null }))

        // Clean up
        pdf.destroy()

      } catch (pdfError) {
        // Check if it's a password error
        if (pdfError.name === 'PasswordException' ||
          pdfError.message?.toLowerCase().includes('password') ||
          pdfError.message?.toLowerCase().includes('invalid')) {

          setPasswordStatus(prev => ({ ...prev, [fileId]: 'invalid' }))
          setValidationErrors(prev => ({
            ...prev,
            [fileId]: 'Incorrect password. Please try again.'
          }))
        } else {
          // Other PDF errors
          setPasswordStatus(prev => ({ ...prev, [fileId]: 'invalid' }))
          setValidationErrors(prev => ({
            ...prev,
            [fileId]: 'Unable to validate password. File may be corrupted.'
          }))
        }
      }
    } catch (error) {
      console.error('Password validation error:', error)
      setPasswordStatus(prev => ({ ...prev, [fileId]: 'invalid' }))
      setValidationErrors(prev => ({
        ...prev,
        [fileId]: 'Error validating password. Please try again.'
      }))
    }
  }, [])

  // Debounced password validation
  const [validationTimeouts, setValidationTimeouts] = useState({})

  const handlePasswordChange = useCallback((fileId, password) => {
    setPasswords((prev) => ({
      ...prev,
      [fileId]: password,
    }))

    // Clear existing timeout
    if (validationTimeouts[fileId]) {
      clearTimeout(validationTimeouts[fileId])
    }

    // Find the file
    const file = passwordProtectedFiles.find(f => f.id === fileId)
    if (!file) return

    // Set new timeout for validation (debounce)
    const timeoutId = setTimeout(() => {
      validatePassword(file, password, fileId)
    }, 1000) // Wait 1 second after user stops typing

    setValidationTimeouts(prev => ({
      ...prev,
      [fileId]: timeoutId
    }))
  }, [passwordProtectedFiles, validatePassword, validationTimeouts])

  const togglePasswordVisibility = useCallback((fileId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    // Check if all files have valid passwords
    const allFilesHavePasswords = passwordProtectedFiles.every(file =>
      passwords[file.id] && passwords[file.id].trim() !== ''
    )

    if (!allFilesHavePasswords) {
      // Highlight missing passwords
      passwordProtectedFiles.forEach(file => {
        if (!passwords[file.id] || passwords[file.id].trim() === '') {
          setValidationErrors(prev => ({
            ...prev,
            [file.id]: 'Password is required'
          }))
        }
      })
      return
    }

    // Check if any passwords are invalid
    const hasInvalidPasswords = Object.values(passwordStatus).some(status => status === 'invalid')
    const isStillChecking = Object.values(passwordStatus).some(status => status === 'checking')

    if (hasInvalidPasswords) {
      return // Don't submit if there are invalid passwords
    }

    if (isStillChecking) {
      return // Don't submit while still validating
    }

    setIsSubmitting(true)
    try {
      await onSubmit(passwords)
      onClose()
    } catch (error) {
      console.error("Password submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [passwords, passwordStatus, passwordProtectedFiles, onSubmit, onClose])

  const handleClose = useCallback(() => {
    // Clear all timeouts
    Object.values(validationTimeouts).forEach(timeoutId => {
      if (timeoutId) clearTimeout(timeoutId)
    })

    setPasswords({})
    setShowPasswords({})
    setPasswordStatus({})
    setValidationErrors({})
    setValidationTimeouts({})
    setIsSubmitting(false)
    onClose()
  }, [onClose, validationTimeouts])

  // Get status icon and color for password input
  const getPasswordInputStatus = (fileId) => {
    const status = passwordStatus[fileId]
    const hasPassword = passwords[fileId] && passwords[fileId].trim() !== ''

    if (!hasPassword) return null

    switch (status) {
      case 'checking':
        return {
          icon: <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />,
          borderColor: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
        }
      case 'valid':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          borderColor: 'border-green-300 focus:border-green-500 focus:ring-green-500'
        }
      case 'invalid':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          borderColor: 'border-red-300 focus:border-red-500 focus:ring-red-500'
        }
      default:
        return {
          icon: null,
          borderColor: 'border-gray-300 focus:border-red-500 focus:ring-red-500'
        }
    }
  }

  // Check if form is valid for submission
  const isFormValid = passwordProtectedFiles.every(file => {
    const hasPassword = passwords[file.id] && passwords[file.id].trim() !== ''
    const isValid = passwordStatus[file.id] === 'valid'
    const isNotChecking = passwordStatus[file.id] !== 'checking'

    return hasPassword && (isValid || passwordStatus[file.id] === null) && isNotChecking
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Enter Passwords</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              {passwordProtectedFiles.length} file{passwordProtectedFiles.length > 1 ? 's' : ''} require{passwordProtectedFiles.length === 1 ? 's' : ''} password{passwordProtectedFiles.length > 1 ? 's' : ''} to process.
            </p>
          </div>

          {passwordProtectedFiles.map((file) => {
            const inputStatus = getPasswordInputStatus(file.id)

            return (
              <div key={file.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate flex-1" title={file.name}>
                    {file.name}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showPasswords[file.id] ? "text" : "password"}
                    placeholder="Enter password"
                    value={passwords[file.id] || ""}
                    onChange={(e) => handlePasswordChange(file.id, e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full p-3 pr-20 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 ${inputStatus?.borderColor || 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                      }`}
                  />

                  {/* Status Icon */}
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    {inputStatus?.icon}
                  </div>

                  {/* Show/Hide Password Button */}
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(file.id)}
                    disabled={isSubmitting}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center transition-colors duration-200"
                  >
                    {showPasswords[file.id] ? (
                      <EyeOff className="w-3 h-3 text-white" />
                    ) : (
                      <Eye className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {validationErrors[file.id] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {validationErrors[file.id]}
                  </p>
                )}

                {/* Success Message */}
                {passwordStatus[file.id] === 'valid' && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Password verified successfully
                  </p>
                )}

                {/* Checking Message */}
                {passwordStatus[file.id] === 'checking' && (
                  <p className="text-sm text-blue-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 animate-pulse" />
                    Validating password...
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting || !isFormValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Process Files
                {!isFormValid && (
                  <span className="text-xs opacity-75 ml-1">
                    (Enter valid passwords)
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}