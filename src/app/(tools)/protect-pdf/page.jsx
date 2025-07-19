"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, Eye, EyeOff, Lock } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Memoized PDF Preview Component
const PDFPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError, onRemove, isHealthy, isPasswordProtected }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)
  const elementRef = useRef(null)

  // Individual intersection observer for each preview
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoadError = useCallback(
    (error) => {
      setHasError(true)
      onLoadError(error, file.id)
    },
    [file.id, onLoadError],
  )

  const handleLoadSuccess = useCallback(
    (pdf) => {
      setHasError(false)
      onLoadSuccess(pdf, file.id)
    },
    [file.id, onLoadSuccess],
  )

  const renderPreview = () => {
    // Show lock icon for password-protected files
    if (isPasswordProtected) {
      return (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
          <IoMdLock className="text-4xl" />
          {/* Password dots */}
          <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      )
    }

    if (!isVisible || hasError || !isHealthy) {
      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
          <FileText className="w-16 h-16 text-gray-400" />
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
          {!isHealthy && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Preview Issue
            </div>
          )}
        </div>
      )
    }

    if (file.type === "application/pdf" && file.stableData) {
      return (
        <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
          {!isLoading ? (
            <Document
              file={file.stableData.dataUrl}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                </div>
              }
              error={
                <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
                  <FileText className="w-12 h-12 text-red-400 mb-2" />
                  <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
                </div>
              }
              className="w-full h-full flex items-center justify-center border"
              options={{
                cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              }}
            >
              <Page
                pageNumber={1}
                width={180}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-200 shadow-sm"
                loading={
                  <div className="w-[180px] h-[240px] bg-gray-100 flex items-center justify-center">
                    <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                  </div>
                }
              />
            </Document>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
          {file.type.split("/")[1]?.toUpperCase() || "FILE"}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isPasswordProtected
          ? "border-yellow-300 bg-yellow-50"
          : isHealthy
            ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
            : "border-yellow-300 bg-yellow-50"
        }`}
    >
      {/* File Preview Area */}
      <div className="relative h-56 p-3 pt-10">
        <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>

        {/* Remove Button */}
        <div className="absolute top-1 right-2 flex gap-1 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(file.id)
            }}
            className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
            title="Remove file"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* File Info Footer */}
      <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">{file.size}</p>
        </div>
      </div>
    </div>
  )
})

PDFPreview.displayName = "PDFPreview"

export default function ProtectPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pdfPages, setPdfPages] = useState({})
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({})
  const router = useRouter()

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[A-Z]/.test(password)) strength += 15
    if (/[a-z]/.test(password)) strength += 15
    if (/[0-9]/.test(password)) strength += 10
    if (/[^A-Za-z0-9]/.test(password)) strength += 10
    return Math.min(strength, 100)
  }, [password])

  // Password strength color
  const strengthColor = useMemo(() => {
    if (passwordStrength < 30) return "bg-red-500"
    if (passwordStrength < 60) return "bg-yellow-500"
    if (passwordStrength < 80) return "bg-blue-500"
    return "bg-green-500"
  }, [passwordStrength])

  // Password strength text
  const strengthText = useMemo(() => {
    if (passwordStrength < 30) return "Weak"
    if (passwordStrength < 60) return "Fair"
    if (passwordStrength < 80) return "Good"
    return "Strong"
  }, [passwordStrength])

  // Check if a file is password protected by trying to read it
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      try {
        // Try to load the PDF with PDF.js
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "", // Empty password
        })

        const pdf = await loadingTask.promise

        // If we reach here, PDF loaded successfully - not password protected
        console.log(`File ${file.name} loaded successfully - not password protected`)
        return false
      } catch (pdfError) {
        // Check if the error is specifically about password protection
        if (
          pdfError.name === "PasswordException" ||
          pdfError.name === "MissingPDFException" ||
          pdfError.message?.includes("password") ||
          pdfError.message?.includes("encrypted")
        ) {
          console.log(`File ${file.name} requires password:`, pdfError.message)
          setPasswordProtectedFiles((prev) => new Set([...prev, id]))
          return true
        }

        // Other PDF errors don't necessarily mean password protection
        console.warn(`PDF load error for ${file.name}:`, pdfError)
        return false
      }
    } catch (error) {
      console.warn("Error checking password protection with PDF.js:", error)
      return false
    }
  }, [])

  // Optimized file data creation with object URLs
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id]
      }

      try {
        // Check for password protection first
        const isPasswordProtected = await checkPasswordProtection(file, id)

        if (isPasswordProtected) {
          // For password protected files, don't create data URL to avoid browser prompt
          const stableData = {
            blob: null,
            dataUrl: null,
            uint8Array: null,
            isPasswordProtected: true,
          }
          fileDataCache.current[id] = stableData
          return stableData
        }

        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const blob = new Blob([uint8Array], { type: file.type })

        // Use object URL instead of data URL for better performance
        const objectUrl = URL.createObjectURL(blob)

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array.slice(),
          isPasswordProtected: false,
        }

        fileDataCache.current[id] = stableData
        return stableData
      } catch (error) {
        console.error("Error creating stable file data:", error)
        return null
      }
    },
    [checkPasswordProtection],
  )

  // Optimized file handling
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileObjects = await Promise.all(
        newFiles.map(async (file, index) => {
          const id = Date.now() + index + Math.random()
          const stableData = await createStableFileData(file, id)

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
          }
        }),
      )

      setFiles((prev) => [...prev, ...fileObjects])
    },
    [createStableFileData],
  )

  // Optimized remove function with cleanup
  const removeFile = useCallback((id) => {
    // Clean up object URL
    const fileData = fileDataCache.current[id]
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }

    // Clean up all other references
    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    setPasswordProtectedFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    delete fileDataCache.current[id]

    if (pdfDocumentCache.current[id]) {
      try {
        if (pdfDocumentCache.current[id].destroy) {
          pdfDocumentCache.current[id].destroy()
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e)
      }
      delete pdfDocumentCache.current[id]
    }

    setPdfHealthCheck((prev) => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    setFiles((prev) => prev.filter((file) => file.id !== id))

    setPdfPages((prev) => {
      const newPages = { ...prev }
      delete newPages[id]
      return newPages
    })
  }, [])

  // Optimized sort function
  const sortFilesByName = useCallback((order = "asc") => {
    setFiles((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (order === "asc") {
          return a.name.localeCompare(b.name)
        } else {
          return b.name.localeCompare(a.name)
        }
      })
      return sorted
    })
  }, [])

  // Optimized PDF load handlers
  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setPdfPages((prev) => ({
      ...prev,
      [fileId]: pdf.numPages,
    }))

    pdfDocumentCache.current[fileId] = pdf

    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: true,
    }))
  }, [])

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: false,
    }))
  }, [])

  // Handle password submission for already protected files
  const handlePasswordSubmit = useCallback(
    async (passwords) => {
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()

        files.forEach((file) => {
          formData.append("files", file.file)
        })

        // Send new password for protection
        formData.append("newPassword", password)

        // Send passwords for already protected files
        const filePasswords = {}
        files.forEach((file) => {
          if (passwordProtectedFiles.has(file.id)) {
            filePasswords[file.name] = passwords[file.id] || ""
          }
        })
        formData.append("passwords", JSON.stringify(filePasswords))

        const response = await Api.post("/tools/protect", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          },
        })

        if (response.data) {
          const encodedZipPath = encodeURIComponent(response.data.data.fileUrl);
          const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}`
          router.push(downloadUrl)
        } else {
          toast.error("No protected files received from server")
        }
      } catch (error) {
        console.error("Protect error:", error)
        toast.error(error?.response?.data?.message || "Error protecting files")
        alert("Failed to protect PDFs. Please try again.")
      } finally {
        setIsUploading(false)
      }
    },
    [files, password, passwordProtectedFiles, router],
  )

  // Handle protect function
  const handleProtect = useCallback(async () => {
    if (files.length === 0) return

    // Validate passwords
    if (!password) {
      toast.error("Please enter a password")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Removed password length check to allow any password

    // Get current password-protected files
    const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }

    // No password-protected files, proceed normally
    await handlePasswordSubmit({})
  }, [files, password, confirmPassword, passwordProtectedFiles, handlePasswordSubmit])

  // Memoized total size calculation
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
    [files],
  )

  // Memoized health check status
  const hasUnhealthyFiles = useMemo(
    () => Object.values(pdfHealthCheck).some((health) => health === false),
    [pdfHealthCheck],
  )

  // Get password protected files for modal
  const protectedFilesForModal = useMemo(
    () => files.filter((file) => passwordProtectedFiles.has(file.id)),
    [files, passwordProtectedFiles],
  )

  const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all object URLs
      Object.values(fileDataCache.current).forEach((data) => {
        if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(data.dataUrl)
        }
      })
    }
  }, [])

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />
  }

  if (files.length === 0) {
    return (
      <SafeFileUploader
        isMultiple={true}
        onFilesSelect={handleFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF files"
        pageTitle="Protect PDF file"
        pageSubTitle="Encrypt your PDF with a password to keep sensitive data confidential."
      />
    )
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".pdf"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Protect PDF file"
              pageSubTitle="Encrypt your PDF with a password to keep sensitive data confidential."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
                <PDFPreview
                  file={file}
                  isLoading={loadingPdfs.has(file.id)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  onRemove={removeFile}
                  isHealthy={pdfHealthCheck[file.id] !== false}
                  isPasswordProtected={passwordProtectedFiles.has(file.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 overflow-y-auto custom-scrollbar border-l flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Protect PDF</h3>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">Set a password to protect your PDF file</p>
            </div>

            {/* Password Fields */}
            <div className="space-y-4 mb-6">
              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3 text-white" /> : <Eye className="w-3 h-3 text-white" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3 h-3 text-white" />
                    ) : (
                      <Eye className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${strengthColor.replace("bg-", "text-")}`}>{strengthText}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Password Mismatch Warning */}
              {confirmPassword && password !== confirmPassword && (
                <div className="text-sm text-red-600">Passwords do not match</div>
              )}
            </div>

            {hasUnhealthyFiles && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Some files have preview issues but can still be protected. Check the yellow-highlighted files.
                </p>
              </div>
            )}

            {passwordProtectedFiles.size > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  {passwordProtectedFiles.size} file{passwordProtectedFiles.size > 1 ? "s are" : " is"} already
                  password-protected. You'll need to enter the current password
                  {passwordProtectedFiles.size > 1 ? "s" : ""} to apply new protection.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Files selected:</span>
                <span className="font-semibold text-gray-900">{files.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total size:</span>
                <span className="font-semibold text-gray-900">{totalSize} MB</span>
              </div>
              {passwordProtectedFiles.size > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Already protected:</span>
                  <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleProtect}
              disabled={files.length === 0 || !password || password !== confirmPassword}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && password && password === confirmPassword
                  ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Protect PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to protect</p>
            )}
            {files.length > 0 && !password && (
              <p className="text-xs text-gray-500 text-center mt-2">Enter a password to protect files</p>
            )}
            {files.length > 0 && password && password !== confirmPassword && (
              <p className="text-xs text-gray-500 text-center mt-2">Passwords must match</p>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal for already protected files */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        passwordProtectedFiles={protectedFilesForModal}
        onSubmit={handlePasswordSubmit}
      />

      <style jsx>{`
        .pdf-preview-page canvas {
          border-radius: 8px;
          max-width: 100% !important;
          height: auto !important;
        }

        .pdf-preview-page > div {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
      `}</style>
    </div>
  )
}
