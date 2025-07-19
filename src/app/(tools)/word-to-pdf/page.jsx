"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight } from "lucide-react"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"

// Memoized Word Document Preview Component
const WordPreview = memo(({ file, onRemove, isHealthy }) => {
  const [isVisible, setIsVisible] = useState(false)
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

  const renderPreview = () => {
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    const isDoc = file.type === "application/msword"

    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
        <div className="relative">
          {/* Word Document Icon */}
          <div className="w-16 h-20 bg-blue-600 rounded-lg flex items-center justify-center relative">
            <FileText className="w-10 h-10 text-white" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
          {isDocx ? "DOCX" : isDoc ? "DOC" : "WORD"}
        </div>
        {!isHealthy && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            Preview Issue
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isHealthy ? "border-gray-200 hover:border-red-300 hover:shadow-lg" : "border-yellow-300 bg-yellow-50"
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

WordPreview.displayName = "WordPreview"

export default function WordToPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileHealthCheck, setFileHealthCheck] = useState({})
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const router = useRouter()

  // Check if a Word file is password protected (basic check)
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      // For Word files, we'll do a basic check
      // In a real implementation, you might want to use a library to check for password protection
      // For now, we'll assume Word files are not password protected unless specified
      return false
    } catch (error) {
      console.warn("Error checking password protection:", error)
      return false
    }
  }, [])

  // Create stable file data for Word documents
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id]
      }

      try {
        const isPasswordProtected = await checkPasswordProtection(file, id)

        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const blob = new Blob([uint8Array], { type: file.type })
        const objectUrl = URL.createObjectURL(blob)

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array.slice(),
          isPasswordProtected,
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

  // Handle new Word files
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileObjects = await Promise.all(
        newFiles.map(async (file, index) => {
          const id = Date.now() + index + Math.random()
          const stableData = await createStableFileData(file, id)

          // Set health check to true for Word files (they don't need PDF.js preview)
          setFileHealthCheck((prev) => ({
            ...prev,
            [id]: true,
          }))

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

  // Remove file with cleanup
  const removeFile = useCallback((id) => {
    // Clean up object URL
    const fileData = fileDataCache.current[id]
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }

    // Clean up all references
    setPasswordProtectedFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    delete fileDataCache.current[id]

    setFileHealthCheck((prev) => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    setFiles((prev) => prev.filter((file) => file.id !== id))
  }, [])

  // Sort files by name
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

  // Handle password submission for protected files
  const handlePasswordSubmit = useCallback(
    async (passwords) => {
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()

        files.forEach((file) => {
          formData.append("files", file.file)
        })

        // Send passwords for protected files (if any)
        const filePasswords = {}
        files.forEach((file) => {
          if (passwordProtectedFiles.has(file.id)) {
            filePasswords[file.name] = passwords[file.id] || ""
          }
        })
        formData.append("passwords", JSON.stringify(filePasswords))

        const response = await Api.post("/tools/word-to-pdf", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          },
        })

        if (response.data) {
          const downloadUrl = `/downloads/document=${response.data.data.convertedFiles}?dbTaskId=${response.data.data.dbTaskId}`
          router.push(downloadUrl)
        } else {
          toast.error("No converted files received from server")
        }
      } catch (error) {
        console.error("Convert error:", error)
        toast.error(error?.response?.data?.message || "Error converting files")
        alert("Failed to convert Word files to PDF. Please try again.")
      } finally {
        setIsUploading(false)
      }
    },
    [files, passwordProtectedFiles, router],
  )

  // Handle convert function
  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    // Get current password-protected files
    const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }

    // No password-protected files, proceed normally
    await handlePasswordSubmit({})
  }, [files, passwordProtectedFiles, handlePasswordSubmit])

  // Memoized calculations
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
    [files],
  )

  const hasUnhealthyFiles = useMemo(
    () => Object.values(fileHealthCheck).some((health) => health === false),
    [fileHealthCheck],
  )

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
        allowedTypes={[".doc", ".docx"]}
        showFiles={false}
        uploadButtonText="Select Word files"
        pageTitle="Convert WORD to PDF"
        pageSubTitle="Make DOC and DOCX files easy to read by converting them to PDF."
      />
    )
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="py-5 px-3 md:px-12 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".doc", ".docx"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Convert WORD to PDF"
              pageSubTitle="Make DOC and DOCX files easy to read by converting them to PDF."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
                <WordPreview file={file} onRemove={removeFile} isHealthy={fileHealthCheck[file.id] !== false} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Word to PDF</h3>

            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                Convert your Word documents (.doc, .docx) to PDF format. All formatting, images, and layouts will be
                preserved in the converted PDF files.
              </p>
            </div>

            {hasUnhealthyFiles && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Some files have issues but can still be converted. Check the yellow-highlighted files.
                </p>
              </div>
            )}

            {passwordProtectedFiles.size > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
                  detected. Passwords will be required for conversion.
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
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Input formats:</span>
                <span className="font-semibold text-gray-900">DOC, DOCX</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Output format:</span>
                <span className="font-semibold text-gray-900">PDF</span>
              </div>
              {passwordProtectedFiles.size > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Password protected:</span>
                  <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleConvert}
              disabled={files.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
                  ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Convert to PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select Word files to convert</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleConvert}
          disabled={files.length === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Convert to PDF
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Word to PDF</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Word to PDF</h3>

                <div className="bg-red-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    Convert your Word documents (.doc, .docx) to PDF format. All formatting, images, and layouts will be
                    preserved in the converted PDF files.
                  </p>
                </div>

                {hasUnhealthyFiles && (
                  <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      Some files have issues but can still be converted. Check the yellow-highlighted files.
                    </p>
                  </div>
                )}

                {passwordProtectedFiles.size > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
                      detected. Passwords will be required for conversion.
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Input formats:</span>
                    <span className="font-semibold text-gray-900">DOC, DOCX</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Output format:</span>
                    <span className="font-semibold text-gray-900">PDF</span>
                  </div>
                  {passwordProtectedFiles.size > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password protected:</span>
                      <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConvert}
                  disabled={files.length === 0}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
                      ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                      : "bg-gray-300 cursor-not-allowed"
                    }`}
                >
                  Convert to PDF
                  <ArrowRight className="w-5 h-5" />
                </button>

                {files.length === 0 && (
                  <p className="text-xs text-gray-500 text-center mt-2">Select Word files to convert</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        passwordProtectedFiles={protectedFilesForModal}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  )
}
