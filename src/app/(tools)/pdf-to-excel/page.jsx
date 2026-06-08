"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, Settings } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Constants
const LIMITS = {
  MAX_FILES: 2,
  MAX_SIZE_MB: 100,
  MAX_PAGES: 1000
}

// Utility functions
const createFileId = (index) => Date.now() + index + Math.random()
const formatFileSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB"
const isPasswordError = (error) =>
  error.name === "PasswordException" ||
  error.name === "MissingPDFException" ||
  error.message?.includes("password") ||
  error.message?.includes("encrypted")

// Custom hooks
const useFileCache = () => {
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({})

  const cleanupFile = useCallback((id) => {
    const fileData = fileDataCache.current[id]
    if (fileData?.dataUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }
    delete fileDataCache.current[id]

    const pdfDoc = pdfDocumentCache.current[id]
    if (pdfDoc?.destroy) {
      try { pdfDoc.destroy() } catch (e) { console.warn("PDF cleanup warning:", e) }
    }
    delete pdfDocumentCache.current[id]
  }, [])

  const cleanupAll = useCallback(() => {
    Object.values(fileDataCache.current).forEach(data => {
      if (data.dataUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(data.dataUrl)
      }
    })
  }, [])

  return { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll }
}

const usePasswordProtection = () => {
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())

  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const loadingTask = pdfjs.getDocument({ data: uint8Array, password: "" })
      await loadingTask.promise
      return false
    } catch (error) {
      if (isPasswordError(error)) {
        setPasswordProtectedFiles(prev => new Set([...prev, id]))
        return true
      }
      return false
    }
  }, [])

  const removePasswordProtected = useCallback((id) => {
    setPasswordProtectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  return { passwordProtectedFiles, checkPasswordProtection, removePasswordProtected }
}

// Components
const PasswordProtectedPreview = () => (
  <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg relative">
    <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
      Password required
    </div>
    <IoMdLock className="text-4xl text-gray-600 mb-2" />
    <div className="flex items-center gap-1 bg-black rounded-full py-1 px-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="w-1 h-1 bg-white rounded-full" />
      ))}
    </div>
  </div>
)

const GenericPreview = ({ file, isHealthy }) => (
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

const PDFDocumentPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError }) => (
  <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
    {isLoading ? (
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    ) : (
      <Document
        file={file.stableData.dataUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={<div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
        error={
          <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
            <FileText className="w-12 h-12 text-red-400 mb-2" />
            <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
          </div>
        }
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
              <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          }
        />
      </Document>
    )}
  </div>
))

const PDFPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError, onRemove, isHealthy, isPasswordProtected }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1, rootMargin: "50px" }
    )

    if (elementRef.current) observer.observe(elementRef.current)
    return () => observer.disconnect()
  }, [])

  const handleLoadError = useCallback((error) => {
    setHasError(true)
    onLoadError(error, file.id)
  }, [file.id, onLoadError])

  const handleLoadSuccess = useCallback((pdf) => {
    setHasError(false)
    onLoadSuccess(pdf, file.id)
  }, [file.id, onLoadSuccess])

  const renderPreview = () => {
    if (isPasswordProtected) return <PasswordProtectedPreview />
    if (!isVisible || hasError || !isHealthy) return <GenericPreview file={file} isHealthy={isHealthy} />
    if (file.type === "application/pdf" && file.stableData) {
      return <PDFDocumentPreview file={file} isLoading={isLoading} onLoadSuccess={handleLoadSuccess} onLoadError={handleLoadError} />
    }
    return <GenericPreview file={file} isHealthy={isHealthy} />
  }

  const borderClasses = isPasswordProtected
    ? "border-yellow-300 bg-yellow-50"
    : isHealthy
      ? "border-gray-200 hover:border-blue-300 hover:shadow-lg"
      : "border-yellow-300 bg-yellow-50"

  return (
    <div ref={elementRef} className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${borderClasses}`}>
      <div className="relative h-56 p-3 pt-10">
        <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>
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

const FileInfoSection = ({ files, totalSize, totalPages }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">File Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", files.length],
        ["Total size:", `${totalSize} MB`],
        ["Total pages:", `${totalPages} pages`],
        ["Output format:", "Excel (.xlsx)"]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-blue-700">{label}</span>
          <span className="font-semibold text-blue-900">{value}</span>
        </div>
      ))}
    </div>
  </div>
)

const LimitsExceeded = ({ limitsExceeded, files, totalSize, totalPages }) => (
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
      {limitsExceeded.exceedsPages && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total pages:</span>
          <span className="font-semibold text-red-600">{totalPages} / {LIMITS.MAX_PAGES}</span>
        </div>
      )}
    </div>
    <p className="text-xs text-red-600 text-center mt-3">Please reduce files, size, or pages to continue.</p>
  </div>
)

const Sidebar = ({
  files,
  totalSize,
  totalPages,
  hasUnhealthyFiles,
  passwordProtectedFiles,
  limitsExceeded,
  onConvert
}) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className="p-6 flex-1">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to Excel Converter</h3>

      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          Convert your PDF files to Excel spreadsheets. Tables and data will be extracted and converted to editable Excel format with preserved formatting.
        </p>
      </div>

      {hasUnhealthyFiles && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Some files have preview issues but can still be converted. Check the yellow-highlighted files.
          </p>
        </div>
      )}

      {passwordProtectedFiles.size > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords will be required for conversion.
          </p>
        </div>
      )}

      {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} totalPages={totalPages} />}
    </div>

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onConvert}
          disabled={files.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg" : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Convert to Excel <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} totalPages={totalPages} />
      )}
      {files.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to convert</p>}
    </div>
  </div>
)

// Main Component
export default function PDFToExcelPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pdfPages, setPdfPages] = useState({})
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll } = useFileCache()
  const { passwordProtectedFiles, checkPasswordProtection, removePasswordProtected } = usePasswordProtection()
  const router = useRouter()

  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) return fileDataCache.current[id]

    try {
      const isPasswordProtected = await checkPasswordProtection(file, id)
      if (isPasswordProtected) {
        const stableData = { blob: null, dataUrl: null, uint8Array: null, isPasswordProtected: true }
        fileDataCache.current[id] = stableData
        return stableData
      }

      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: file.type })
      const objectUrl = URL.createObjectURL(blob)

      const stableData = { blob, dataUrl: objectUrl, uint8Array: uint8Array.slice(), isPasswordProtected: false }
      fileDataCache.current[id] = stableData
      return stableData
    } catch (error) {
      console.error("Error creating stable file data:", error)
      return null
    }
  }, [checkPasswordProtection, fileDataCache])

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
    removePasswordProtected(id)

    setLoadingPdfs(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet })
    setPdfHealthCheck(prev => { const { [id]: removed, ...rest } = prev; return rest })
    setFiles(prev => prev.filter(file => file.id !== id))
    setPdfPages(prev => { const { [id]: removed, ...rest } = prev; return rest })
  }, [cleanupFile, removePasswordProtected])

  const sortFilesByName = useCallback((order = "asc") => {
    setFiles(prev => [...prev].sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ))
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    setLoadingPdfs(prev => { const newSet = new Set(prev); newSet.delete(fileId); return newSet })
    setPdfPages(prev => ({ ...prev, [fileId]: pdf.numPages }))
    pdfDocumentCache.current[fileId] = pdf
    setPdfHealthCheck(prev => ({ ...prev, [fileId]: true }))
  }, [pdfDocumentCache])

  const onDocumentLoadError = useCallback((error, fileId) => {
    setLoadingPdfs(prev => { const newSet = new Set(prev); newSet.delete(fileId); return newSet })
    setPdfHealthCheck(prev => ({ ...prev, [fileId]: false }))
  }, [])

  const handlePasswordSubmit = useCallback(async (passwords) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append("files", file.file))

      const filePasswords = {}
      files.forEach(file => {
        if (passwordProtectedFiles.has(file.id)) {
          filePasswords[file.name] = passwords[file.id] || ""
        }
      })
      formData.append("passwords", JSON.stringify(filePasswords))

      const response = await Api.post("/tools/pdf-to-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=pdf-to-excel`
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
  }, [files, passwordProtectedFiles, router])

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    const currentProtectedFiles = files.filter(file => passwordProtectedFiles.has(file.id))
    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }
    await handlePasswordSubmit({})
  }, [files, passwordProtectedFiles, handlePasswordSubmit])

  // Computed values
  const totalSize = useMemo(() => files.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2), [files])
  const totalPages = useMemo(() => Object.values(pdfPages).reduce((total, pages) => total + pages, 0), [pdfPages])

  const limitsExceeded = useMemo(() => {
    const exceedsFiles = files.length > LIMITS.MAX_FILES
    const exceedsSize = parseFloat(totalSize) > LIMITS.MAX_SIZE_MB
    const exceedsPages = totalPages > LIMITS.MAX_PAGES
    return { exceedsFiles, exceedsSize, exceedsPages, hasAnyExceeded: exceedsFiles || exceedsSize || exceedsPages }
  }, [files.length, totalSize, totalPages])

  const hasUnhealthyFiles = useMemo(() => Object.values(pdfHealthCheck).some(health => health === false), [pdfHealthCheck])
  const protectedFilesForModal = useMemo(() => files.filter(file => passwordProtectedFiles.has(file.id)), [files, passwordProtectedFiles])

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
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF files"
        pageTitle="Convert PDF to Excel"
        pageSubTitle="Convert PDF Data to Excel Spreadsheets."
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
        maxPages={LIMITS.MAX_PAGES}
      />
    )
  }

  const sidebarProps = {
    files, totalSize, totalPages, hasUnhealthyFiles,
    passwordProtectedFiles, limitsExceeded, onConvert: handleConvert
  }

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
              allowedTypes={[".pdf"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Convert PDF to Excel"
              pageSubTitle="Convert PDF Data to Excel Spreadsheets."
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
              maxPages={LIMITS.MAX_PAGES}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {files.map(file => (
              <PDFPreview
                key={file.id}
                file={file}
                isLoading={loadingPdfs.has(file.id)}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onRemove={removeFile}
                isHealthy={pdfHealthCheck[file.id] !== false}
                isPasswordProtected={passwordProtectedFiles.has(file.id)}
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
                <h3 className="text-xl font-bold text-gray-900">PDF to Excel</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Convert your PDF files to Excel spreadsheets. Tables and data will be extracted and converted to editable Excel format with preserved formatting.
                  </p>
                </div>
                {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} totalPages={totalPages} />}
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
                    Convert to Excel <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-sm text-red-600 font-medium">Limits exceeded!</p>
                    <p className="text-xs text-red-500 mt-1">Reduce files/size/pages to continue</p>
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

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          passwordProtectedFiles={protectedFilesForModal}
          onSubmit={handlePasswordSubmit}
        />
      </div>
    </div>
  )
}

// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
// import { useRouter } from "next/navigation"
// import { FileText, X, ArrowRight } from "lucide-react"
// import { IoMdLock } from "react-icons/io"
// import { Document, Page, pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// // Memoized PDF Preview Component
// const PDFPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError, onRemove, isHealthy, isPasswordProtected }) => {
//   const [isVisible, setIsVisible] = useState(false)
//   const [hasError, setHasError] = useState(false)
//   const elementRef = useRef(null)

//   // Individual intersection observer for each preview
//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setIsVisible(true)
//         }
//       },
//       {
//         threshold: 0.1,
//         rootMargin: "50px",
//       },
//     )

//     if (elementRef.current) {
//       observer.observe(elementRef.current)
//     }

//     return () => observer.disconnect()
//   }, [])

//   const handleLoadError = useCallback(
//     (error) => {
//       setHasError(true)
//       onLoadError(error, file.id)
//     },
//     [file.id, onLoadError],
//   )

//   const handleLoadSuccess = useCallback(
//     (pdf) => {
//       setHasError(false)
//       onLoadSuccess(pdf, file.id)
//     },
//     [file.id, onLoadSuccess],
//   )

//   const renderPreview = () => {
//     // Show lock icon for password-protected files
//     if (isPasswordProtected) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
//           <IoMdLock className="text-4xl" />
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

//     if (!isVisible || hasError || !isHealthy) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//           <FileText className="w-16 h-16 text-gray-400" />
//           <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
//           {!isHealthy && (
//             <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
//               Preview Issue
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (file.type === "application/pdf" && file.stableData) {
//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           {!isLoading ? (
//             <Document
//               file={file.stableData.dataUrl}
//               onLoadSuccess={handleLoadSuccess}
//               onLoadError={handleLoadError}
//               loading={
//                 <div className="flex items-center justify-center">
//                   <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
//                 </div>
//               }
//               error={
//                 <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
//                   <FileText className="w-12 h-12 text-red-400 mb-2" />
//                   <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
//                 </div>
//               }
//               className="w-full h-full flex items-center justify-center border"
//               options={{
//                 cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//                 cMapPacked: true,
//                 standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
//               }}
//             >
//               <Page
//                 pageNumber={1}
//                 width={180}
//                 renderTextLayer={false}
//                 renderAnnotationLayer={false}
//                 className="border border-gray-200 shadow-sm"
//                 loading={
//                   <div className="w-[180px] h-[240px] bg-gray-100 flex items-center justify-center">
//                     <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
//                   </div>
//                 }
//               />
//             </Document>
//           ) : (
//             <div className="flex items-center justify-center">
//               <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
//             </div>
//           )}
//         </div>
//       )
//     }

//     return (
//       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
//           {file.type.split("/")[1]?.toUpperCase() || "FILE"}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div
//       ref={elementRef}
//       className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isPasswordProtected
//           ? "border-yellow-300 bg-yellow-50"
//           : isHealthy
//             ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
//             : "border-yellow-300 bg-yellow-50"
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

// PDFPreview.displayName = "PDFPreview"

// export default function PDFToExcelPage() {
//   const [files, setFiles] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [pdfPages, setPdfPages] = useState({})
//   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
//   const [pdfHealthCheck, setPdfHealthCheck] = useState({})
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)

//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

//   // Check if a file is password protected by trying to read it
//   const checkPasswordProtection = useCallback(async (file, id) => {
//     try {
//       const arrayBuffer = await file.arrayBuffer()
//       const uint8Array = new Uint8Array(arrayBuffer)

//       try {
//         // Try to load the PDF with PDF.js
//         const loadingTask = pdfjs.getDocument({
//           data: uint8Array,
//           password: "", // Empty password
//         })

//         const pdf = await loadingTask.promise

//         // If we reach here, PDF loaded successfully - not password protected
//         console.log(`File ${file.name} loaded successfully - not password protected`)
//         return false
//       } catch (pdfError) {
//         // Check if the error is specifically about password protection
//         if (
//           pdfError.name === "PasswordException" ||
//           pdfError.name === "MissingPDFException" ||
//           pdfError.message?.includes("password") ||
//           pdfError.message?.includes("encrypted")
//         ) {
//           console.log(`File ${file.name} requires password:`, pdfError.message)
//           setPasswordProtectedFiles((prev) => new Set([...prev, id]))
//           return true
//         }

//         // Other PDF errors don't necessarily mean password protection
//         console.warn(`PDF load error for ${file.name}:`, pdfError)
//         return false
//       }
//     } catch (error) {
//       console.warn("Error checking password protection with PDF.js:", error)
//       return false
//     }
//   }, [])

//   // Optimized file data creation with object URLs
//   const createStableFileData = useCallback(
//     async (file, id) => {
//       if (fileDataCache.current[id]) {
//         return fileDataCache.current[id]
//       }

//       try {
//         // Check for password protection first
//         const isPasswordProtected = await checkPasswordProtection(file, id)

//         if (isPasswordProtected) {
//           // For password protected files, don't create data URL to avoid browser prompt
//           const stableData = {
//             blob: null,
//             dataUrl: null,
//             uint8Array: null,
//             isPasswordProtected: true,
//           }
//           fileDataCache.current[id] = stableData
//           return stableData
//         }

//         const arrayBuffer = await file.arrayBuffer()
//         const uint8Array = new Uint8Array(arrayBuffer)
//         const blob = new Blob([uint8Array], { type: file.type })

//         // Use object URL instead of data URL for better performance
//         const objectUrl = URL.createObjectURL(blob)

//         const stableData = {
//           blob,
//           dataUrl: objectUrl,
//           uint8Array: uint8Array.slice(),
//           isPasswordProtected: false,
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
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     setPasswordProtectedFiles((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     delete fileDataCache.current[id]

//     if (pdfDocumentCache.current[id]) {
//       try {
//         if (pdfDocumentCache.current[id].destroy) {
//           pdfDocumentCache.current[id].destroy()
//         }
//       } catch (e) {
//         console.warn("PDF cleanup warning:", e)
//       }
//       delete pdfDocumentCache.current[id]
//     }

//     setPdfHealthCheck((prev) => {
//       const newHealth = { ...prev }
//       delete newHealth[id]
//       return newHealth
//     })

//     setFiles((prev) => prev.filter((file) => file.id !== id))

//     setPdfPages((prev) => {
//       const newPages = { ...prev }
//       delete newPages[id]
//       return newPages
//     })
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

//   // Optimized PDF load handlers
//   const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setPdfPages((prev) => ({
//       ...prev,
//       [fileId]: pdf.numPages,
//     }))

//     pdfDocumentCache.current[fileId] = pdf

//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: true,
//     }))
//   }, [])

//   const onDocumentLoadError = useCallback((error, fileId) => {
//     console.warn(`PDF load error for file ${fileId}:`, error)

//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: false,
//     }))
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

//         const response = await Api.post("/tools/pdf-to-excel", formData, {
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
//           const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=pdf-to-excel`
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

//   // Memoized total pages calculation
//   const totalPages = useMemo(() => Object.values(pdfPages).reduce((total, pages) => total + pages, 0), [pdfPages])

//   // Memoized health check status
//   const hasUnhealthyFiles = useMemo(
//     () => Object.values(pdfHealthCheck).some((health) => health === false),
//     [pdfHealthCheck],
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
//         allowedTypes={[".pdf"]}
//         showFiles={false}
//         uploadButtonText="Select PDF files"
//         pageTitle="Convert PDF to EXCEL"
//         pageSubTitle="Convert PDF Data to EXCEL Spreadsheets."
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
//               allowedTypes={[".pdf"]}
//               showFiles={true}
//               onSort={sortFilesByName}
//               selectedCount={files?.length}
//               pageTitle="Convert PDF to EXCEL"
//               pageSubTitle="Convert PDF Data to EXCEL Spreadsheets."
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {files.map((file) => (
//               <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
//                 <PDFPreview
//                   file={file}
//                   isLoading={loadingPdfs.has(file.id)}
//                   onLoadSuccess={onDocumentLoadSuccess}
//                   onLoadError={onDocumentLoadError}
//                   onRemove={removeFile}
//                   isHealthy={pdfHealthCheck[file.id] !== false}
//                   isPasswordProtected={passwordProtectedFiles.has(file.id)}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to Excel</h3>

//             <div className="bg-red-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-red-800">
//                 Convert your PDF files to Excel spreadsheets. Tables and data will be extracted and converted to
//                 editable Excel format with preserved formatting.
//               </p>
//             </div>

//             {hasUnhealthyFiles && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   Some files have preview issues but can still be converted. Check the yellow-highlighted files.
//                 </p>
//               </div>
//             )}

//             {passwordProtectedFiles.size > 0 && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                   detected. Passwords will be required for conversion.
//                 </p>
//               </div>
//             )}
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
//                 <span className="text-gray-600">Total pages:</span>
//                 <span className="font-semibold text-gray-900">{totalPages} pages</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Output format:</span>
//                 <span className="font-semibold text-gray-900">Excel (.xlsx)</span>
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
//               Convert to Excel
//               <ArrowRight className="w-5 h-5" />
//             </button>

//             {files.length === 0 && (
//               <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to convert</p>
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
//           Convert to Excel
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
//               <h3 className="text-xl font-bold text-gray-900">PDF to Excel</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//             <div className="p-4">
//               <div className="p-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to Excel</h3>

//                 <div className="bg-red-50 rounded-xl p-4 mb-6">
//                   <p className="text-sm text-red-800">
//                     Convert your PDF files to Excel spreadsheets. Tables and data will be extracted and converted to
//                     editable Excel format with preserved formatting.
//                   </p>
//                 </div>

//                 {hasUnhealthyFiles && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       Some files have preview issues but can still be converted. Check the yellow-highlighted files.
//                     </p>
//                   </div>
//                 )}

//                 {passwordProtectedFiles.size > 0 && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                       detected. Passwords will be required for conversion.
//                     </p>
//                   </div>
//                 )}
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
//                     <span className="text-gray-600">Total pages:</span>
//                     <span className="font-semibold text-gray-900">{totalPages} pages</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Output format:</span>
//                     <span className="font-semibold text-gray-900">Excel (.xlsx)</span>
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
//                   Convert to Excel
//                   <ArrowRight className="w-5 h-5" />
//                 </button>

//                 {files.length === 0 && (
//                   <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to convert</p>
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
