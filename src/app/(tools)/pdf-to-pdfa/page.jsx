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
}

const conformanceLevels = [
  {
    value: "pdfa-2b",
    label: "PDF/A-2b",
    description: "Based on PDF 1.7 (ISO 32000-1). Level B (basic) conformance requirements plus new features: JPEG 2000 image compression, support for transparency effects and layers, embedding of OpenType fonts, provisions for digital signatures, and the option of embedding PDF/A files."
  },
  {
    value: "pdfa-1b",
    label: "PDF/A-1b",
    description: "Based on PDF 1.4 (ISO 19005-1). Level B (basic) conformance ensures that the visual appearance of the document is preserved over time."
  }
]

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

const FileInfoSection = ({ files, totalSize, selectedConformanceLevel }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">File Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", files.length],
        ["Total size:", `${totalSize} MB`],
        ["Conformance Level:", conformanceLevels.find(level => level.value === selectedConformanceLevel)?.label || "N/A"],
        ["Output format:", "PDF/A"]
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

const Sidebar = ({
  files,
  totalSize,
  hasUnhealthyFiles,
  passwordProtectedFiles,
  limitsExceeded,
  selectedConformanceLevel,
  setSelectedConformanceLevel,
  onConvert
}) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className="p-6 flex-1">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to PDF/A Converter</h3>

      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          PDF/A is an ISO-standardized version of the Portable Document Format (PDF) specialized for use in the archiving and long-term preservation of electronic documents.
        </p>
      </div>

      {/* Conformance Level Selection */}
      <div className="mb-6">
        <label htmlFor="conformance-level" className="text-lg font-semibold text-blue-900 mb-3 block">
          Set the PDF/A conformance level
        </label>
        <div className="relative">
          <select
            id="conformance-level"
            value={selectedConformanceLevel}
            onChange={(e) => setSelectedConformanceLevel(e.target.value)}
            className="w-full bg-white border border-blue-300 rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
          >
            {conformanceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          {conformanceLevels.find(level => level.value === selectedConformanceLevel)?.description}
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

      {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} selectedConformanceLevel={selectedConformanceLevel} />}
    </div>

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onConvert}
          disabled={files.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg" : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Convert to PDF/A <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} />
      )}
      {files.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to convert</p>}
    </div>
  </div>
)

// Main Component
export default function PdfToPdfAPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [selectedConformanceLevel, setSelectedConformanceLevel] = useState("pdfa-2b")

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
  }, [cleanupFile, removePasswordProtected])

  const sortFilesByName = useCallback((order = "asc") => {
    setFiles(prev => [...prev].sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ))
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    setLoadingPdfs(prev => { const newSet = new Set(prev); newSet.delete(fileId); return newSet })
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
      formData.append("conformanceLevel", selectedConformanceLevel)

      const filePasswords = {}
      files.forEach(file => {
        if (passwordProtectedFiles.has(file.id)) {
          filePasswords[file.name] = passwords[file.id] || ""
        }
      })
      formData.append("passwords", JSON.stringify(filePasswords))

      const response = await Api.post("/tools/pdf-to-pdfa", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=pdf-to-pdfa`
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
  }, [files, passwordProtectedFiles, selectedConformanceLevel, router])

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

  const limitsExceeded = useMemo(() => {
    const exceedsFiles = files.length > LIMITS.MAX_FILES
    const exceedsSize = parseFloat(totalSize) > LIMITS.MAX_SIZE_MB
    return { exceedsFiles, exceedsSize, hasAnyExceeded: exceedsFiles || exceedsSize }
  }, [files.length, totalSize])

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
        pageTitle="PDF to PDF/A Converter"
        pageSubTitle="Convert your PDF files to PDF/A for long-term archiving and preservation."
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
      />
    )
  }

  const sidebarProps = {
    files, totalSize, hasUnhealthyFiles,
    passwordProtectedFiles, limitsExceeded,
    selectedConformanceLevel, setSelectedConformanceLevel,
    onConvert: handleConvert
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
              pageTitle="PDF to PDF/A Converter"
              pageSubTitle="Convert your PDF files to PDF/A for long-term archiving and preservation."
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
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
                <h3 className="text-xl font-bold text-gray-900">PDF to PDF/A</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    PDF/A is an ISO-standardized version of PDF specialized for archiving and long-term preservation of electronic documents.
                  </p>
                </div>

                {/* Conformance Level Selection for Mobile */}
                <div className="mb-6">
                  <label className="text-lg font-semibold text-blue-900 mb-3 block">
                    Set the PDF/A conformance level
                  </label>
                  <select
                    value={selectedConformanceLevel}
                    onChange={(e) => setSelectedConformanceLevel(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {conformanceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-2">
                    {conformanceLevels.find(level => level.value === selectedConformanceLevel)?.description}
                  </p>
                </div>

                {files.length > 0 && <FileInfoSection files={files} totalSize={totalSize} selectedConformanceLevel={selectedConformanceLevel} />}
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
                    Convert to PDF/A <ArrowRight className="w-4 h-4" />
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
// import { FileText, X, ArrowRight, RefreshCw, Settings } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"
// import { IoMdLock } from "react-icons/io"

// // User-specified imports from OCR example
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// // PDF/A Conformance Levels
// const conformanceLevels = [
//   {
//     value: "pdfa-2b",
//     label: "PDF/A-2b",
//     description:
//       "Based on a PDF 1.7 (ISO 32000-1). Level B (basic) conformance requirements plus new features: JPEG 2000 image compression, support for transparency effects and layers, embedding of OpenType fonts, provisions for digital signatures in accordance with the PDF Advanced Electronic Signatures, and the option of embedding PDF/A files to facilitate archiving of sets of documents with a single file.",
//   },
//   {
//     value: "pdfa-1b",
//     label: "PDF/A-1b",
//     description:
//       "Based on PDF 1.4 (ISO 19005-1). Level B (basic) conformance ensures that the visual appearance of the document is preserved over time.",
//   },
//   // {
//   //   value: "pdfa-1a",
//   //   label: "PDF/A-1a",
//   //   description:
//   //     "Based on PDF 1.4 (ISO 19005-1). Level A (accessible) conformance includes all requirements of PDF/A-1b, plus structural and semantic information to ensure accessibility and extractability of text.",
//   // },
//   // {
//   //   value: "pdfa-2u",
//   //   label: "PDF/A-2u",
//   //   description:
//   //     "Based on PDF 1.7 (ISO 32000-1). Level U (Unicode) conformance ensures that all text in the document can be reliably extracted and searched, even if the original fonts are not embedded.",
//   // },
//   // {
//   //   value: "pdfa-2a",
//   //   label: "PDF/A-2a",
//   //   description:
//   //     "Based on PDF 1.7 (ISO 32000-1). Level A (accessible) conformance includes all requirements of PDF/A-2b and PDF/A-2u, plus structural and semantic information for accessibility.",
//   // },
//   // {
//   //   value: "pdfa-3b",
//   //   label: "PDF/A-3b",
//   //   description:
//   //     "Based on PDF 1.7 (ISO 32000-1). Level B (basic) conformance, similar to PDF/A-2b, but allows embedding of arbitrary file formats (e.g., XML, CSV, CAD files) within the PDF/A document.",
//   // },
//   // {
//   //   value: "pdfa-3u",
//   //   label: "PDF/A-3u",
//   //   description:
//   //   "Based on PDF 1.7 (ISO 32000-1). Level U (Unicode) conformance, similar to PDF/A-2u, but allows embedding of arbitrary file formats.",
//   // },
//   // {
//   //   value: "pdfa-3a",
//   //   label: "PDF/A-3a",
//   //   description:
//   //     "PDF 1.7 (ISO 32000-1). Level A (accessible) conformance, similar to PDF/A-2a, but allows embedding of arbitrary file formats.",
//   // },
// ]

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
//     // Show simplified lock icon for password-protected files
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

//     if (file.type === "application/pdf" && file.stableData?.dataUrl) {
//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           {!isLoading ? (
//             <Document
//               file={file.stableData.dataUrl}
//               onLoadSuccess={handleLoadSuccess}
//               onLoadError={handleLoadError}
//               loading={
//                 <div className="flex items-center justify-center">
//                   <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
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
//                     <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                   </div>
//                 }
//               />
//             </Document>
//           ) : (
//             <div className="flex items-center justify-center">
//               <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
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

// export default function PdfToPdfAPage() {
//   const [files, setFiles] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [pdfPages, setPdfPages] = useState({})
//   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
//   const [pdfHealthCheck, setPdfHealthCheck] = useState({})
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [selectedConformanceLevel, setSelectedConformanceLevel] = useState("pdfa-2b")
//   const [allowDowngrade, setAllowDowngrade] = useState(false)

//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

//   // Updated password protection check using PDF.js
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

//   // Optimized file handling with batching
//   const handleFiles = useCallback(
//     async (newFiles) => {
//       const batchSize = 5 // Process files in batches
//       const fileObjects = []
//       for (let i = 0; i < newFiles.length; i += batchSize) {
//         const batch = Array.from(newFiles).slice(i, i + batchSize)
//         const batchPromises = batch.map(async (file, index) => {
//           const id = Date.now() + i + index + Math.random().toString(36).substring(7)
//           const stableData = await createStableFileData(file, id)
//           return {
//             id,
//             file,
//             name: file.name,
//             size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//             type: file.type,
//             stableData,
//           }
//         })
//         const batchResults = await Promise.all(batchPromises)
//         fileObjects.push(...batchResults.filter(Boolean))
//       }
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

//   // Handle password submission
//   const handlePasswordSubmit = useCallback(
//     async (passwords) => {
//       setIsUploading(true)
//       setUploadProgress(0)
//       try {
//         const formData = new FormData()
//         files.forEach((file) => {
//           formData.append("files", file.file)
//         })
//         formData.append("conformanceLevel", selectedConformanceLevel)
//         formData.append("allowDowngrade", String(allowDowngrade))

//         // Send passwords for protected files
//         const filePasswords = {}
//         files.forEach((file) => {
//           if (passwordProtectedFiles.has(file.id)) {
//             filePasswords[file.name] = passwords[file.id] || ""
//           }
//         })
//         formData.append("passwords", JSON.stringify(filePasswords))

//         const response = await Api.post("/tools/pdf-to-pdfa", formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//           onUploadProgress: (progressEvent) => {
//             const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
//             setUploadProgress(progress)
//           },
//         })
//         if (response.data) {
//           const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
//           const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=pdf-to-pdfa`
//           router.push(downloadUrl)
//         } else {
//           toast.error("No converted files received from server")
//         }
//       } catch (error) {
//         toast.error(error?.response?.data?.message || "Error converting PDF to PDF/A")
//       } finally {
//         setIsUploading(false)
//       }
//     },
//     [files, selectedConformanceLevel, allowDowngrade, passwordProtectedFiles, router],
//   )

//   // Handle PDF/A conversion
//   const handleConvert = useCallback(async () => {
//     if (files.length === 0) {
//       toast.error("Please select PDF files to convert.")
//       return
//     }

//     // Get current password-protected files
//     const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))
//     console.log("Password protected files found:", currentProtectedFiles.length)
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

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       // Clean up all object URLs
//       Object.values(fileDataCache.current).forEach((data) => {
//         if (data && data.dataUrl && data.dataUrl.startsWith("blob:")) {
//           URL.revokeObjectURL(data.dataUrl)
//         }
//       })
//     }
//   }, [])

//   const currentDescription = useMemo(() => {
//     return conformanceLevels.find((level) => level.value === selectedConformanceLevel)?.description || ""
//   }, [selectedConformanceLevel])

//   if (isUploading) {
//     return <ProgressScreen uploadProgress={uploadProgress} />
//   }

//   if (files.length === 0) {
//     return (
//       <FileUploader
//         isMultiple={true}
//         onFilesSelect={handleFiles}
//         isDragOver={isDragOver}
//         setIsDragOver={setIsDragOver}
//         allowedTypes={[".pdf"]}
//         showFiles={false}
//         uploadButtonText="Select PDF files"
//         pageTitle="PDF to PDF/A Converter"
//         pageSubTitle="Convert your PDF files to PDF/A for long-term archiving and preservation."
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
//             <FileUploader
//               isMultiple={true}
//               onFilesSelect={handleFiles}
//               isDragOver={isDragOver}
//               setIsDragOver={setIsDragOver}
//               allowedTypes={[".pdf"]}
//               showFiles={true}
//               uploadButtonText="Add More Files"
//               pageTitle="PDF to PDF/A Converter"
//               pageSubTitle="Convert your PDF files to PDF/A for long-term archiving and preservation."
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
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to PDF/A options</h3>
//             {/* Help text */}
//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 PDF/A is an ISO-standardized version of the Portable Document Format (PDF) specialized for use in the
//                 archiving and long-term preservation of electronic documents. Choose with what conformance level you
//                 want to convert your document:
//               </p>
//             </div>
//             {/* Conformance Level Selection */}
//             <div className="mb-6">
//               <label htmlFor="conformance-level" className="text-lg font-semibold text-gray-900 mb-3 block">
//                 Set the PDF/A conformance level
//               </label>
//               <div className="relative">
//                 <select
//                   id="conformance-level"
//                   value={selectedConformanceLevel}
//                   onChange={(e) => setSelectedConformanceLevel(e.target.value)}
//                   className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none"
//                 >
//                   {conformanceLevels.map((level) => (
//                     <option key={level.value} value={level.value}>
//                       {level.label}
//                     </option>
//                   ))}
//                 </select>
//                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
//                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
//                     <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
//                   </svg>
//                 </div>
//               </div>
//               {currentDescription && <p className="text-xs text-gray-600 mt-2">{currentDescription}</p>}
//             </div>
//             {/* Allow Downgrade Checkbox */}
//             {/* <div className="mb-6 flex items-start space-x-2">
//               <input
//                 type="checkbox"
//                 id="allow-downgrade"
//                 checked={allowDowngrade}
//                 onChange={(e) => setAllowDowngrade(e.target.checked)}
//                 className="h-6 w-6 bg-white accent-red-500 border-gray-300 rounded "
//               />
//               <label
//                 htmlFor="allow-downgrade"
//                 className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//               >
//                 Allow Downgrade of PDF/A Compliance Level
//                 <p className="text-xs text-gray-500 mt-1">
//                   In order to convert to PDF/A, when certain elements are found in the original PDF, it's possible that
//                   a conformance downgrade is needed to be able to perform the conversion.
//                 </p>
//               </label>
//             </div> */}
//             {hasUnhealthyFiles && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   Some files have preview issues but can still be processed. Check the yellow-highlighted files.
//                 </p>
//               </div>
//             )}
//             {passwordProtectedFiles.size > 0 && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                   detected. Passwords will be required for processing.
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
//                 <span className="text-gray-600">Conformance Level:</span>
//                 <span className="font-semibold text-gray-900">
//                   {conformanceLevels.find((level) => level.value === selectedConformanceLevel)?.label || "N/A"}
//                 </span>
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
//               Convert to PDF/A
//               <ArrowRight className="w-5 h-5" />
//             </button>
//             {files.length === 0 && (
//               <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to process</p>
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
//           Convert to PDF/A
//           <ArrowRight className="w-4 h-4" />
//         </button>
//         <button
//           onClick={() => setShowMobileSidebar(true)}
//           className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
//         >
//           <Settings className="w-5 h-5 text-gray-600" />
//         </button>
//       </div>
//       {/* Mobile Sidebar Overlay */}
//       {showMobileSidebar && (
//         <div
//           className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
//           onClick={() => setShowMobileSidebar(false)}
//         >
//           <div
//             className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-4 border-b flex items-center justify-between">
//               <h3 className="text-xl font-bold text-gray-900">PDF to PDF/A options</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//             <div className="p-4">
//               {/* Re-use sidebar content for mobile */}
//               <div className="p-6">
//                 {/* Help text */}
//                 <div className="bg-blue-50 rounded-xl p-4 mb-6">
//                   <p className="text-sm text-blue-800">
//                     PDF/A is an ISO-standardized version of the Portable Document Format (PDF) specialized for use in
//                     the archiving and long-term preservation of electronic documents. Choose with what conformance level
//                     you want to convert your document:
//                   </p>
//                 </div>
//                 {/* Conformance Level Selection */}
//                 <div className="mb-6">
//                   <label htmlFor="conformance-level-mobile" className="text-lg font-semibold text-gray-900 mb-3 block">
//                     Set the PDF/A conformance level
//                   </label>
//                   <div className="relative">
//                     <select
//                       id="conformance-level-mobile"
//                       value={selectedConformanceLevel}
//                       onChange={(e) => setSelectedConformanceLevel(e.target.value)}
//                       className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none"
//                     >
//                       {conformanceLevels.map((level) => (
//                         <option key={level.value} value={level.value}>
//                           {level.label}
//                         </option>
//                       ))}
//                     </select>
//                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
//                       <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
//                         <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
//                       </svg>
//                     </div>
//                   </div>
//                   {currentDescription && <p className="text-xs text-gray-600 mt-2">{currentDescription}</p>}
//                 </div>
//                 {/* Allow Downgrade Checkbox */}
//                 <div className="mb-6 flex items-center space-x-2">
//                   <input
//                     type="checkbox"
//                     id="allow-downgrade-mobile"
//                     checked={allowDowngrade}
//                     onChange={(e) => setAllowDowngrade(e.target.checked)}
//                     className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 checked:bg-red-600 checked:border-red-600"
//                   />
//                   <label
//                     htmlFor="allow-downgrade-mobile"
//                     className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
//                   >
//                     Allow Downgrade of PDF/A Compliance Level
//                     <p className="text-xs text-gray-500 mt-1">
//                       In order to convert to PDF/A, when certain elements are found in the original PDF, it's possible
//                       that a conformance downgrade is needed to be able to perform the conversion.
//                     </p>
//                   </label>
//                 </div>
//                 {hasUnhealthyFiles && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       Some files have preview issues but can still be processed. Check the yellow-highlighted files.
//                     </p>
//                   </div>
//                 )}
//                 {passwordProtectedFiles.size > 0 && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                       detected. Passwords will be required for processing.
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
//                     <span className="text-gray-600">Conformance Level:</span>
//                     <span className="font-semibold text-gray-900">
//                       {conformanceLevels.find((level) => level.value === selectedConformanceLevel)?.label || "N/A"}
//                     </span>
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
//                   Convert to PDF/A
//                   <ArrowRight className="w-5 h-5" />
//                 </button>
//                 {files.length === 0 && (
//                   <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to process</p>
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
