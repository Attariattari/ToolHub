"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileSpreadsheet, X, ArrowRight, Settings } from "lucide-react"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// Constants
const LIMITS = {
  MAX_FILES: 2,
  MAX_SIZE_MB: 100
}

// Utility functions
const createFileId = (index) => Date.now() + index + Math.random()
const formatFileSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB"

// Custom hooks
const useFileCache = () => {
  const fileDataCache = useRef({})

  const cleanupFile = useCallback((id) => {
    const fileData = fileDataCache.current[id]
    if (fileData?.dataUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }
    delete fileDataCache.current[id]
  }, [])

  const cleanupAll = useCallback(() => {
    Object.values(fileDataCache.current).forEach(data => {
      if (data.dataUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(data.dataUrl)
      }
    })
  }, [])

  return { fileDataCache, cleanupFile, cleanupAll }
}

// Components
const ExcelPreview = memo(({ file, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1, rootMargin: "50px" }
    )

    if (elementRef.current) observer.observe(elementRef.current)
    return () => observer.disconnect()
  }, [])

  const renderPreview = () => {
    return (
      <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center rounded-lg relative">
        <div className="relative">
          {/* Excel icon background */}
          <div className="w-20 h-24 bg-green-600 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
            {/* Excel grid pattern */}
            <div className="absolute inset-2 grid grid-cols-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white/30 rounded-sm"></div>
              ))}
            </div>
            <FileSpreadsheet className="w-10 h-10 text-white relative z-10" />
          </div>

          {/* File type badge */}
          <div className="absolute -bottom-2 -right-2 bg-green-700 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
            {file.name.split(".").pop()?.toUpperCase() || "EXCEL"}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-green-300 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-green-400 rounded-full opacity-40"></div>
        <div className="absolute top-1/2 left-2 w-1 h-1 bg-green-500 rounded-full opacity-50"></div>
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden relative"
    >
      <div className="relative h-56 p-3 pt-10">
        <div className="w-full h-full relative overflow-hidden rounded-lg">
          {isVisible && renderPreview()}
        </div>
        <div className="absolute top-1 right-2 flex gap-1 z-30">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(file.id) }}
            className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
            title="Remove file"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
          <p className="text-xs text-gray-500 mt-1">{file.size}</p>
        </div>
      </div>
    </div>
  )
})

const FileInfoSection = ({ files, totalSize }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">File Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", files.length],
        ["Total size:", `${totalSize} MB`],
        ["Output format:", "PDF (.pdf)"]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-blue-700">{label}</span>
          <span className="font-semibold text-blue-900">{value}</span>
        </div>
      ))}
    </div>
  </div>
)

const LimitsExceeded = ({ limitsExceeded, files, totalSize }) => (
  <div className="bg-white rounded-xl border-2 border-red-200 p-4">
    <h4 className="font-semibold text-red-600 mb-3 text-center">Limits Exceeded</h4>
    <div className="space-y-2 text-sm">
      {limitsExceeded.exceedsFiles && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Files:</span>
          <span className="font-semibold text-red-600">{files.length} / {LIMITS.MAX_FILES}</span>
        </div>
      )}
      {limitsExceeded.exceedsSize && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total size:</span>
          <span className="font-semibold text-red-600">{totalSize} / {LIMITS.MAX_SIZE_MB} MB</span>
        </div>
      )}
    </div>
    <p className="text-xs text-red-600 text-center mt-3">Please reduce files or size to continue.</p>
  </div>
)

const Sidebar = ({ files, totalSize, limitsExceeded, onConvert }) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className="p-6 flex-1">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Excel to PDF</h3>

      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          Convert your Excel spreadsheets to PDF documents. All sheets, formatting, charts, and data will be
          preserved in the PDF output with professional quality.
        </p>
      </div>

      <div className="bg-green-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-green-900 mb-2">Supported Formats:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Excel (.xlsx, .xls)</li>
          <li>• CSV files (.csv)</li>
          <li>• Multiple sheets supported</li>
          <li>• Charts and formatting preserved</li>
        </ul>
      </div>

      <div className="bg-orange-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-orange-900 mb-2">Conversion Features:</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Preserves all worksheets</li>
          <li>• Maintains cell formatting</li>
          <li>• Includes charts & graphs</li>
          <li>• Professional PDF layout</li>
        </ul>
      </div>

      {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} />}
    </div>

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onConvert}
          disabled={files.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
              ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Convert to PDF <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} />
      )}
      {files.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Select Excel files to convert</p>}
    </div>
  </div>
)

// Main Component
export default function ExcelToPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const { fileDataCache, cleanupFile, cleanupAll } = useFileCache()
  const router = useRouter()

  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) return fileDataCache.current[id]

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: file.type })
      const objectUrl = URL.createObjectURL(blob)

      const stableData = { blob, dataUrl: objectUrl, uint8Array: uint8Array.slice() }
      fileDataCache.current[id] = stableData
      return stableData
    } catch (error) {
      console.error("Error creating stable file data:", error)
      return null
    }
  }, [fileDataCache])

  const handleFiles = useCallback(async (newFiles) => {
    const fileObjects = await Promise.all(
      newFiles.map(async (file, index) => {
        const id = createFileId(index)
        const stableData = await createStableFileData(file, id)
        return {
          id, file, name: file.name, size: formatFileSize(file.size), type: file.type, stableData
        }
      })
    )
    setFiles(prev => [...prev, ...fileObjects])
  }, [createStableFileData])

  const removeFile = useCallback((id) => {
    cleanupFile(id)
    setFiles(prev => prev.filter(file => file.id !== id))
  }, [cleanupFile])

  const sortFilesByName = useCallback((order = "asc") => {
    setFiles(prev => [...prev].sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ))
  }, [])

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append("files", file.file))

      const response = await Api.post("/tools/excel-to-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=excel-to-pdf`
        router.push(downloadUrl)
      } else {
        toast.error("No converted files received from server")
      }
    } catch (error) {
      console.error("Convert error:", error)
      toast.error(error?.response?.data?.message || "Error converting files")
    } finally {
      setIsUploading(false)
    }
  }, [files, router])

  // Computed values
  const totalSize = useMemo(() => files.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2), [files])

  const limitsExceeded = useMemo(() => {
    const exceedsFiles = files.length > LIMITS.MAX_FILES
    const exceedsSize = parseFloat(totalSize) > LIMITS.MAX_SIZE_MB
    return { exceedsFiles, exceedsSize, hasAnyExceeded: exceedsFiles || exceedsSize }
  }, [files.length, totalSize])

  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => <FileUploader {...safeProps} />

  useEffect(() => {
    return cleanupAll
  }, [cleanupAll])

  if (isUploading) return <ProgressScreen uploadProgress={uploadProgress} />

  if (files.length === 0) {
    return (
      <SafeFileUploader
        isMultiple={true}
        onFilesSelect={handleFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".xlsx", ".xls", ".csv"]}
        showFiles={false}
        uploadButtonText="Select Excel files"
        pageTitle="Convert EXCEL to PDF"
        pageSubTitle="Make EXCEL spreadsheets easy to read by converting them to PDF."
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
      />
    )
  }

  const sidebarProps = { files, totalSize, limitsExceeded, onConvert: handleConvert }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-[100%]">
        {/* Main Content */}
        <div className="p-4 md:col-span-7 bg-gray-50 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>
            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".xlsx", ".xls", ".csv"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Convert EXCEL to PDF"
              pageSubTitle="Make EXCEL spreadsheets easy to read by converting them to PDF."
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {files.map(file => (
              <ExcelPreview
                key={file.id}
                file={file}
                onRemove={removeFile}
              />
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 flex-col bg-white border-l h-[calc(100vh-50px)]">
          <Sidebar {...sidebarProps} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileSidebar(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar pb-16" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Excel to PDF</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Convert your Excel spreadsheets to PDF documents. All sheets, formatting, charts, and data will be
                    preserved in the PDF output with professional quality.
                  </p>
                </div>
                {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} />}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {!limitsExceeded.hasAnyExceeded ? (
                  <button
                    onClick={handleConvert}
                    disabled={files.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                      }`}
                  >
                    Convert to PDF <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-sm text-red-600 font-medium">Limits exceeded!</p>
                    <p className="text-xs text-red-500 mt-1">Reduce files/size to continue</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="flex-shrink-0 w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <Settings className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
// import { useRouter } from "next/navigation"
// import { FileSpreadsheet, X, ArrowRight } from "lucide-react"
// import { IoMdLock } from "react-icons/io"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"

// // Memoized Excel Preview Component
// const ExcelPreview = memo(({ file, onRemove, isPasswordProtected }) => {
//   const renderPreview = () => {
//     // Show lock icon for password-protected files
//     if (isPasswordProtected) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
//           <IoMdLock className="text-4xl text-gray-600" />
//           {/* Password dots */}
//           <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//           </div>
//         </div>
//       )
//     }

//     // Excel file preview with green Excel styling
//     return (
//       <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center rounded-lg relative">
//         <div className="relative">
//           {/* Excel icon background */}
//           <div className="w-20 h-24 bg-red-600 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
//             {/* Excel grid pattern */}
//             <div className="absolute inset-2 grid grid-cols-3 gap-0.5">
//               {[...Array(9)].map((_, i) => (
//                 <div key={i} className="bg-white/30 rounded-sm"></div>
//               ))}
//             </div>
//             <FileSpreadsheet className="w-10 h-10 text-white relative z-10" />
//           </div>

//           {/* File type badge */}
//           <div className="absolute -bottom-2 -right-2 bg-red-700 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
//             {file.name.split(".").pop()?.toUpperCase() || "EXCEL"}
//           </div>
//         </div>

//         {/* Decorative elements */}
//         <div className="absolute top-4 left-4 w-2 h-2 bg-red-300 rounded-full opacity-60"></div>
//         <div className="absolute bottom-4 right-4 w-3 h-3 bg-red-400 rounded-full opacity-40"></div>
//         <div className="absolute top-1/2 left-2 w-1 h-1 bg-red-500 rounded-full opacity-50"></div>
//       </div>
//     )
//   }

//   return (
//     <div
//       className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isPasswordProtected
//           ? "border-yellow-300 bg-yellow-50"
//           : "border-gray-200 hover:border-red-300 hover:shadow-lg"
//         }`}
//     >
//       {/* File Preview Area */}
//       <div className="relative h-56 p-3 pt-10">
//         <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>

//         {/* Remove Button */}
//         <div className="absolute top-1 right-2 flex gap-1 z-30">
//           <button
//             onClick={(e) => {
//               e.stopPropagation()
//               onRemove(file.id)
//             }}
//             className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
//             title="Remove file"
//           >
//             <X className="w-4 h-4 text-red-500" />
//           </button>
//         </div>
//       </div>

//       {/* File Info Footer */}
//       <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
//             {file.name}
//           </p>
//           <p className="text-xs text-gray-500 mt-1">{file.size}</p>
//         </div>
//       </div>
//     </div>
//   )
// })

// ExcelPreview.displayName = "ExcelPreview"

// export default function ExcelToPDFPage() {
//   const [files, setFiles] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)

//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const router = useRouter()

//   // Check if a file is password protected (for Excel files)
//   const checkPasswordProtection = useCallback(async (file, id) => {
//     try {
//       // For Excel files, we'll check if they're password protected
//       // This is a simplified check - in real implementation, you'd use a library like xlsx
//       const fileName = file.name.toLowerCase()

//       // For now, we'll simulate password protection detection
//       // In real implementation, you'd try to read the Excel file
//       if (fileName.includes("password") || fileName.includes("protected")) {
//         console.log(`File ${file.name} appears to be password protected`)
//         setPasswordProtectedFiles((prev) => new Set([...prev, id]))
//         return true
//       }

//       return false
//     } catch (error) {
//       console.warn("Error checking password protection:", error)
//       return false
//     }
//   }, [])

//   // Optimized file data creation
//   const createStableFileData = useCallback(
//     async (file, id) => {
//       if (fileDataCache.current[id]) {
//         return fileDataCache.current[id]
//       }

//       try {
//         // Check for password protection first
//         const isPasswordProtected = await checkPasswordProtection(file, id)

//         const arrayBuffer = await file.arrayBuffer()
//         const uint8Array = new Uint8Array(arrayBuffer)
//         const blob = new Blob([uint8Array], { type: file.type })

//         // Use object URL for better performance
//         const objectUrl = URL.createObjectURL(blob)

//         const stableData = {
//           blob,
//           dataUrl: objectUrl,
//           uint8Array: uint8Array.slice(),
//           isPasswordProtected,
//         }

//         fileDataCache.current[id] = stableData
//         return stableData
//       } catch (error) {
//         console.error("Error creating stable file data:", error)
//         return null
//       }
//     },
//     [checkPasswordProtection],
//   )

//   // Optimized file handling
//   const handleFiles = useCallback(
//     async (newFiles) => {
//       const fileObjects = await Promise.all(
//         newFiles.map(async (file, index) => {
//           const id = Date.now() + index + Math.random()
//           const stableData = await createStableFileData(file, id)

//           return {
//             id,
//             file,
//             name: file.name,
//             size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//             type: file.type,
//             stableData,
//           }
//         }),
//       )

//       setFiles((prev) => [...prev, ...fileObjects])
//     },
//     [createStableFileData],
//   )

//   // Optimized remove function with cleanup
//   const removeFile = useCallback((id) => {
//     // Clean up object URL
//     const fileData = fileDataCache.current[id]
//     if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(fileData.dataUrl)
//     }

//     // Clean up all other references
//     setPasswordProtectedFiles((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     delete fileDataCache.current[id]

//     setFiles((prev) => prev.filter((file) => file.id !== id))
//   }, [])

//   // Optimized sort function
//   const sortFilesByName = useCallback((order = "asc") => {
//     setFiles((prev) => {
//       const sorted = [...prev].sort((a, b) => {
//         if (order === "asc") {
//           return a.name.localeCompare(b.name)
//         } else {
//           return b.name.localeCompare(a.name)
//         }
//       })
//       return sorted
//     })
//   }, [])

//   // Handle password submission for protected files
//   const handlePasswordSubmit = useCallback(
//     async (passwords) => {
//       setIsUploading(true)
//       setUploadProgress(0)

//       try {
//         const formData = new FormData()

//         files.forEach((file) => {
//           formData.append("files", file.file)
//         })

//         // Send passwords for protected files
//         const filePasswords = {}
//         files.forEach((file) => {
//           if (passwordProtectedFiles.has(file.id)) {
//             filePasswords[file.name] = passwords[file.id] || ""
//           }
//         })
//         formData.append("passwords", JSON.stringify(filePasswords))

//         const response = await Api.post("/tools/excel-to-pdf", formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//           onUploadProgress: (progressEvent) => {
//             const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
//             setUploadProgress(progress)
//           },
//         })

//         if (response.data) {
//           const encodedZipPath = encodeURIComponent(response.data.data.fileUrl);
//           const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=excel-to-pdf`
//           router.push(downloadUrl)
//         } else {
//           toast.error("No converted files received from server")
//         }
//       } catch (error) {
//         toast.error(error?.response?.data?.message || "Error converting files")
//       } finally {
//         setIsUploading(false)
//       }
//     },
//     [files, passwordProtectedFiles, router],
//   )

//   // Handle convert function
//   const handleConvert = useCallback(async () => {
//     if (files.length === 0) return

//     // Get current password-protected files
//     const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

//     if (currentProtectedFiles.length > 0) {
//       setShowPasswordModal(true)
//       return
//     }

//     // No password-protected files, proceed normally
//     await handlePasswordSubmit({})
//   }, [files, passwordProtectedFiles, handlePasswordSubmit])

//   // Memoized total size calculation
//   const totalSize = useMemo(
//     () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
//     [files],
//   )

//   // Get password protected files for modal
//   const protectedFilesForModal = useMemo(
//     () => files.filter((file) => passwordProtectedFiles.has(file.id)),
//     [files, passwordProtectedFiles],
//   )

//   const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
//     return <FileUploader {...safeProps} />
//   }

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       // Clean up all object URLs
//       Object.values(fileDataCache.current).forEach((data) => {
//         if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
//           URL.revokeObjectURL(data.dataUrl)
//         }
//       })
//     }
//   }, [])

//   if (isUploading) {
//     return <ProgressScreen uploadProgress={uploadProgress} />
//   }

//   if (files.length === 0) {
//     return (
//       <SafeFileUploader
//         isMultiple={true}
//         onFilesSelect={handleFiles}
//         isDragOver={isDragOver}
//         setIsDragOver={setIsDragOver}
//         allowedTypes={[".xlsx", ".xls", ".csv"]}
//         showFiles={false}
//         uploadButtonText="Select Excel files"
//         pageTitle="Convert EXCEL to PDF"
//         pageSubTitle="Make EXCEL spreadsheets easy to read by converting them to PDF."
//       />
//     )
//   }

//   return (
//     <div className="md:h-[calc(100vh-82px)]">
//       <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
//         {/* Main Content */}
//         <div className="py-5 px-3 md:px-12 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

//             <SafeFileUploader
//               isMultiple={true}
//               onFilesSelect={handleFiles}
//               isDragOver={isDragOver}
//               setIsDragOver={setIsDragOver}
//               allowedTypes={[".xlsx", ".xls", ".csv"]}
//               showFiles={true}
//               onSort={sortFilesByName}
//               selectedCount={files?.length}
//               pageTitle="Convert EXCEL to PDF"
//               pageSubTitle="Make EXCEL spreadsheets easy to read by converting them to PDF."
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {files.map((file) => (
//               <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
//                 <ExcelPreview
//                   file={file}
//                   onRemove={removeFile}
//                   isPasswordProtected={passwordProtectedFiles.has(file.id)}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Excel to PDF</h3>

//             <div className="bg-red-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-red-800">
//                 Convert your Excel spreadsheets to PDF documents. All sheets, formatting, charts, and data will be
//                 preserved in the PDF output with professional quality.
//               </p>
//             </div>

//             {passwordProtectedFiles.size > 0 && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                   detected. Passwords will be required for conversion.
//                 </p>
//               </div>
//             )}

//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <h4 className="font-semibold text-blue-900 mb-2">Supported Formats:</h4>
//               <ul className="text-sm text-blue-800 space-y-1">
//                 <li>• Excel (.xlsx, .xls)</li>
//                 <li>• CSV files (.csv)</li>
//                 <li>• Multiple sheets supported</li>
//                 <li>• Charts and formatting preserved</li>
//               </ul>
//             </div>
//           </div>

//           <div className="p-6 border-t">
//             <div className="space-y-4 mb-6">
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Files selected:</span>
//                 <span className="font-semibold text-gray-900">{files.length}</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Total size:</span>
//                 <span className="font-semibold text-gray-900">{totalSize} MB</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Output format:</span>
//                 <span className="font-semibold text-gray-900">PDF (.pdf)</span>
//               </div>
//               {passwordProtectedFiles.size > 0 && (
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Password protected:</span>
//                   <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={handleConvert}
//               disabled={files.length === 0}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
//                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Convert to PDF
//               <ArrowRight className="w-5 h-5" />
//             </button>

//             {files.length === 0 && (
//               <p className="text-xs text-gray-500 text-center mt-2">Select Excel files to convert</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleConvert}
//           disabled={files.length === 0}
//           className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"
//             }`}
//         >
//           Convert to PDF
//           <ArrowRight className="w-4 h-4" />
//         </button>
//         <button
//           onClick={() => setShowMobileSidebar(true)}
//           className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
//         >
//           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//             />
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//           </svg>
//         </button>
//       </div>

//       {/* Mobile Sidebar Overlay */}
//       {showMobileSidebar && (
//         <div
//           className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
//           onClick={() => setShowMobileSidebar(false)}
//         >
//           <div
//             className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-4 border-b flex items-center justify-between">
//               <h3 className="text-xl font-bold text-gray-900">Excel to PDF</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//             <div className="p-4">
//               <div className="p-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Excel to PDF</h3>

//                 <div className="bg-red-50 rounded-xl p-4 mb-6">
//                   <p className="text-sm text-red-800">
//                     Convert your Excel spreadsheets to PDF documents. All sheets, formatting, charts, and data will be
//                     preserved in the PDF output with professional quality.
//                   </p>
//                 </div>

//                 {passwordProtectedFiles.size > 0 && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                       detected. Passwords will be required for conversion.
//                     </p>
//                   </div>
//                 )}

//                 <div className="bg-blue-50 rounded-xl p-4 mb-6">
//                   <h4 className="font-semibold text-blue-900 mb-2">Supported Formats:</h4>
//                   <ul className="text-sm text-blue-800 space-y-1">
//                     <li>• Excel (.xlsx, .xls)</li>
//                     <li>• CSV files (.csv)</li>
//                     <li>• Multiple sheets supported</li>
//                     <li>• Charts and formatting preserved</li>
//                   </ul>
//                 </div>
//               </div>

//               <div className="p-6 border-t">
//                 <div className="space-y-4 mb-6">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Files selected:</span>
//                     <span className="font-semibold text-gray-900">{files.length}</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Total size:</span>
//                     <span className="font-semibold text-gray-900">{totalSize} MB</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Output format:</span>
//                     <span className="font-semibold text-gray-900">PDF (.pdf)</span>
//                   </div>
//                   {passwordProtectedFiles.size > 0 && (
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-gray-600">Password protected:</span>
//                       <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   onClick={handleConvert}
//                   disabled={files.length === 0}
//                   className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
//                       ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                       : "bg-gray-300 cursor-not-allowed"
//                     }`}
//                 >
//                   Convert to PDF
//                   <ArrowRight className="w-5 h-5" />
//                 </button>

//                 {files.length === 0 && (
//                   <p className="text-xs text-gray-500 text-center mt-2">Select Excel files to convert</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Password Modal */}
//       <PasswordModal
//         isOpen={showPasswordModal}
//         onClose={() => setShowPasswordModal(false)}
//         passwordProtectedFiles={protectedFilesForModal}
//         onSubmit={handlePasswordSubmit}
//       />
//     </div>
//   )
// }
