"use client"

import { useState, useRef, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Memoized PDF Preview Component
const PDFPreview = memo(({ file, pageNumber = 1, width = 180, className = "" }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const onLoadSuccess = useCallback(() => {
    setIsLoading(false)
    setHasError(false)
  }, [])

  const onLoadError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  if (!file?.stableData) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`w-full h-full flex justify-center items-center bg-gray-100 rounded-lg ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
      {hasError && (
        <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
          <FileText className="w-12 h-12 text-red-400 mb-2" />
          <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
        </div>
      )}
      {!hasError && (
        <Document
          file={file.stableData.dataUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={null}
          error={null}
          className="w-full h-full flex items-center justify-center"
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="border border-gray-200 shadow-sm"
          />
        </Document>
      )}
    </div>
  )
})

PDFPreview.displayName = "PDFPreview"

export default function PDFToPowerPointPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pdfPages, setPdfPages] = useState({})
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({})
  const router = useRouter()

  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) {
      return fileDataCache.current[id]
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: file.type })
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })

      const stableData = {
        blob,
        dataUrl,
        uint8Array: uint8Array.slice(),
      }

      fileDataCache.current[id] = stableData
      return stableData
    } catch (error) {
      console.error("Error creating stable file data:", error)
      return null
    }
  }, [])

  const handleFiles = async (newFiles) => {
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
  }

  const removeFile = (id) => {
    // Clean up all references
    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })

    // Clean up cached data
    if (fileDataCache.current[id]) {
      delete fileDataCache.current[id]
    }

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

    // Clean up health check
    setPdfHealthCheck((prev) => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    // Remove from files
    setFiles((prev) => prev.filter((file) => file.id !== id))

    // Clean up other states
    setPdfPages((prev) => {
      const newPages = { ...prev }
      delete newPages[id]
      return newPages
    })
  }

  const sortFilesByName = (order = "asc") => {
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
  }

  const onDocumentLoadSuccess = (pdf, fileId) => {
    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setPdfPages((prev) => ({
      ...prev,
      [fileId]: pdf.numPages,
    }))

    // Cache the PDF document
    pdfDocumentCache.current[fileId] = pdf

    // Mark as healthy
    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: true,
    }))
  }

  const onDocumentLoadError = (error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    // Mark as unhealthy
    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: false,
    }))
  }

  const renderFilePreview = (file) => {
    const isLoading = loadingPdfs.has(file.id)
    const isHealthy = pdfHealthCheck[file.id] !== false

    if (file.type === "application/pdf" && file.stableData && isHealthy) {
      return (
        <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
          {!isLoading ? (
            <Document
              key={`pdf-${file.id}`}
              file={file.stableData.dataUrl}
              onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
              onLoadError={(error) => onDocumentLoadError(error, file.id)}
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
              className="w-full h-full flex items-center justify-center"
            >
              <Page
                pageNumber={1}
                width={180}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-200 shadow-sm"
              />
            </Document>
          ) : (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}

          {pdfPages[file.id] && (
            <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              {pdfPages[file.id]} pages
            </div>
          )}
        </div>
      )
    }

    // Fallback for non-PDF files or unhealthy PDFs
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
          {file.type.split("/")[1]?.toUpperCase() || "FILE"}
        </div>
        {!isHealthy && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            Preview Issue
          </div>
        )}
      </div>
    )
  }

  const handleConvert = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData instance
      const formData = new FormData()

      // Add files to FormData
      files.forEach((file) => {
        formData.append("files", file.file)
      })

      // Make API call
      const response = await Api.post("/tools/pdf-to-powerpoint", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      // Handle successful response
      if (response.data) {
        const downloadUrl = `/downloads/document=${response.data.data.convertedFiles}?dbTaskId=${response.data.data.dbTaskId}`
        router.push(downloadUrl)
      } else {
        toast.error("No converted files received from server")
      }
    } catch (error) {
      console.error("Convert error:", error)
      toast.error(error?.response?.data?.message || "Error converting files")
      alert("Failed to convert PDFs to PowerPoint. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

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
        pageTitle="Convert PDF to POWERPOINT"
        pageSubTitle="Convert your PDFs to POWERPOINT."
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
              pageTitle="Convert PDF to POWERPOINT"
              pageSubTitle="Convert your PDFs to POWERPOINT."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((file) => {
              const isHealthy = pdfHealthCheck[file.id] !== false

              return (
                <div
                  key={file.id}
                  ref={(el) => (fileRefs.current[file.id] = el)}
                  className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative ${isHealthy
                      ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
                      : "border-yellow-300 bg-yellow-50"
                    }`}
                >
                  {/* File Preview Area */}
                  <div className="relative h-56 p-3 pt-10">
                    <div className="w-full h-full relative overflow-hidden rounded-lg">{renderFilePreview(file)}</div>

                    {/* Remove Button */}
                    <div className="absolute top-1 right-2 flex gap-1 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
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
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 overflow-y-auto custom-scrollbar border-l flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">PDF to PowerPoint</h3>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                Convert your PDF files to PowerPoint presentations. Each page will be converted to a slide with high
                quality preservation.
              </p>
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
                <span className="font-semibold text-gray-900">
                  {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total pages:</span>
                <span className="font-semibold text-gray-900">
                  {Object.values(pdfPages).reduce((total, pages) => total + pages, 0)} pages
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Output format:</span>
                <span className="font-semibold text-gray-900">PowerPoint (.pptx)</span>
              </div>
            </div>

            <button
              onClick={handleConvert}
              disabled={files.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
                  ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Convert to PowerPoint
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to convert</p>
            )}
          </div>
        </div>
      </div>

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
