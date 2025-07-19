"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { Presentation, X, ArrowRight } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"

// Memoized PowerPoint Preview Component
const PowerPointPreview = memo(({ file, onRemove, isPasswordProtected }) => {
  const renderPreview = () => {
    // Show lock icon for password-protected files
    if (isPasswordProtected) {
      return (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
          <IoMdLock className="text-4xl text-gray-600" />
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

    // PowerPoint file preview with orange PowerPoint styling
    return (
      <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-100 flex flex-col items-center justify-center rounded-lg relative">
        <div className="relative">
          {/* PowerPoint icon background */}
          <div className="w-20 h-24 bg-red-600 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
            {/* PowerPoint slide pattern */}
            <div className="absolute inset-2 bg-white/20 rounded-sm">
              <div className="w-full h-2 bg-white/40 rounded-sm mb-1"></div>
              <div className="w-3/4 h-1 bg-white/30 rounded-sm mb-1"></div>
              <div className="w-full h-1 bg-white/30 rounded-sm mb-1"></div>
              <div className="w-2/3 h-1 bg-white/30 rounded-sm"></div>
            </div>
            <Presentation className="w-10 h-10 text-white relative z-10" />
          </div>

          {/* File type badge */}
          <div className="absolute -bottom-2 -right-2 bg-red-700 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
            {file.name.split(".").pop()?.toUpperCase() || "PPT"}
          </div>
        </div>

        {/* Decorative slide elements */}
        <div className="absolute top-4 left-4 w-3 h-2 bg-orange-300 rounded-sm opacity-60"></div>
        <div className="absolute bottom-4 right-4 w-4 h-3 bg-red-400 rounded-sm opacity-40"></div>
        <div className="absolute top-1/2 left-2 w-2 h-1 bg-red-500 rounded-sm opacity-50"></div>

        {/* Slide indicator dots */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isPasswordProtected ? "border-yellow-300 bg-yellow-50" : "border-gray-200 hover:border-red-300 hover:shadow-lg"
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

PowerPointPreview.displayName = "PowerPointPreview"

export default function PowerPointToPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const router = useRouter()

  // Check if a file is password protected (for PowerPoint files)
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      // For PowerPoint files, we'll check if they're password protected
      const fileName = file.name.toLowerCase()

      // Simulate password protection detection
      if (fileName.includes("password") || fileName.includes("protected")) {
        console.log(`File ${file.name} appears to be password protected`)
        setPasswordProtectedFiles((prev) => new Set([...prev, id]))
        return true
      }

      return false
    } catch (error) {
      console.warn("Error checking password protection:", error)
      return false
    }
  }, [])

  // Optimized file data creation
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id]
      }

      try {
        // Check for password protection first
        const isPasswordProtected = await checkPasswordProtection(file, id)

        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        const blob = new Blob([uint8Array], { type: file.type })

        // Use object URL for better performance
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
    setPasswordProtectedFiles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    delete fileDataCache.current[id]

    setFiles((prev) => prev.filter((file) => file.id !== id))
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

        // Send passwords for protected files
        const filePasswords = {}
        files.forEach((file) => {
          if (passwordProtectedFiles.has(file.id)) {
            filePasswords[file.name] = passwords[file.id] || ""
          }
        })
        formData.append("passwords", JSON.stringify(filePasswords))

        const response = await Api.post("/tools/powerpoint-to-pdf", formData, {
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
        alert("Failed to convert PowerPoint files to PDF. Please try again.")
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

  // Memoized total size calculation
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
    [files],
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
        allowedTypes={[".pptx", ".ppt", ".odp"]}
        showFiles={false}
        uploadButtonText="Select PowerPoint files"
        pageTitle="Convert POWERPOINT to PDF"
        pageSubTitle="Make PPT and PPTX slideshows easy to view by converting them to PDF."
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
              allowedTypes={[".pptx", ".ppt", ".odp"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Convert POWERPOINT to PDF"
              pageSubTitle="Make PPT and PPTX slideshows easy to view by converting them to PDF."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => (
              <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
                <PowerPointPreview
                  file={file}
                  onRemove={removeFile}
                  isPasswordProtected={passwordProtectedFiles.has(file.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PowerPoint to PDF</h3>

            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                Convert your PowerPoint presentations to PDF documents. All slides, animations, transitions, and
                formatting will be preserved in high-quality PDF format perfect for sharing and printing.
              </p>
            </div>

            {passwordProtectedFiles.size > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
                  detected. Passwords will be required for conversion.
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Supported Formats:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• PowerPoint (.pptx, .ppt)</li>
                <li>• OpenDocument (.odp)</li>
                <li>• All slides preserved</li>
                <li>• High-quality output</li>
                <li>• Animations & transitions noted</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-orange-900 mb-2">Conversion Features:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Maintains slide layouts</li>
                <li>• Preserves fonts & colors</li>
                <li>• Includes speaker notes</li>
                <li>• Professional PDF quality</li>
              </ul>
            </div>
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
                <span className="text-gray-600">Output format:</span>
                <span className="font-semibold text-gray-900">PDF (.pdf)</span>
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
              <p className="text-xs text-gray-500 text-center mt-2">Select PowerPoint files to convert</p>
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
              <h3 className="text-xl font-bold text-gray-900">PowerPoint to PDF</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PowerPoint to PDF</h3>

                <div className="bg-red-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    Convert your PowerPoint presentations to PDF documents. All slides, animations, transitions, and
                    formatting will be preserved in high-quality PDF format perfect for sharing and printing.
                  </p>
                </div>

                {passwordProtectedFiles.size > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
                      detected. Passwords will be required for conversion.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Supported Formats:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• PowerPoint (.pptx, .ppt)</li>
                    <li>• OpenDocument (.odp)</li>
                    <li>• All slides preserved</li>
                    <li>• High-quality output</li>
                    <li>• Animations & transitions noted</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-orange-900 mb-2">Conversion Features:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Maintains slide layouts</li>
                    <li>• Preserves fonts & colors</li>
                    <li>• Includes speaker notes</li>
                    <li>• Professional PDF quality</li>
                  </ul>
                </div>
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
                    <span className="text-gray-600">Output format:</span>
                    <span className="font-semibold text-gray-900">PDF (.pdf)</span>
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
                  <p className="text-xs text-gray-500 text-center mt-2">Select PowerPoint files to convert</p>
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
