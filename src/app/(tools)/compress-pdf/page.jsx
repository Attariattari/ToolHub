"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, Check } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Memoized PDF Preview Component with lazy loading
const PDFPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError, onRemove, isHealthy }) => {
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
              key={`pdf-${file.id}`}
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
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isHealthy ? "border-gray-200 hover:border-red-300 hover:shadow-lg" : "border-yellow-300 bg-yellow-50"
        }`}
    >
      {/* File Preview Area - Fixed height same as merge PDF */}
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

      {/* File Info Footer - Fixed height same as merge PDF */}
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

export default function CompressPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compressionLevel, setCompressionLevel] = useState("recommended")
  const [pdfPages, setPdfPages] = useState({})
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({})
  const router = useRouter()

  // Optimized file data creation with object URLs (same as merge PDF)
  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) {
      return fileDataCache.current[id]
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: file.type })

      // Use object URL instead of data URL for better performance
      const objectUrl = URL.createObjectURL(blob)

      const stableData = {
        blob,
        dataUrl: objectUrl,
        uint8Array: uint8Array.slice(),
      }

      fileDataCache.current[id] = stableData
      return stableData
    } catch (error) {
      console.error("Error creating stable file data:", error)
      return null
    }
  }, [])

  // Optimized file handling with batching (same as merge PDF)
  const handleFiles = useCallback(
    async (newFiles) => {
      const batchSize = 5 // Process files in batches
      const fileObjects = []

      for (let i = 0; i < newFiles.length; i += batchSize) {
        const batch = newFiles.slice(i, i + batchSize)
        const batchPromises = batch.map(async (file, index) => {
          const id = Date.now() + i + index + Math.random()
          const stableData = await createStableFileData(file, id)

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
          }
        })

        const batchResults = await Promise.all(batchPromises)
        fileObjects.push(...batchResults)
      }

      setFiles((prev) => [...prev, ...fileObjects])
    },
    [createStableFileData],
  )

  // Optimized remove function with cleanup (same as merge PDF)
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

  // Optimized compress function
  const handleCompress = useCallback(async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()

      files.forEach((file) => {
        formData.append("files", file.file)
      })

      formData.append("compressionLevel", compressionLevel)

      const response = await Api.post("/tools/compress", formData, {
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
        toast.error("No compressed files received from server")
      }
    } catch (error) {
      console.error("Compress error:", error)
      toast.error(error?.response?.data?.message || "Error compressing files")
      alert("Failed to compress PDFs. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [files, compressionLevel, router])

  // Memoized compression options
  const compressionOptions = useMemo(
    () => [
      {
        id: "extreme",
        title: "EXTREME COMPRESSION",
        description: "Less quality, high compression",
        color: "red",
        icon: "1",
      },
      {
        id: "recommended",
        title: "RECOMMENDED COMPRESSION",
        description: "Good quality, good compression",
        color: "green",
        icon: "check",
      },
      {
        id: "less",
        title: "LESS COMPRESSION",
        description: "High quality, less compression",
        color: "blue",
        icon: "3",
      },
    ],
    [],
  )

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
        pageTitle="Compress PDF files"
        pageSubTitle="Reduce file size while optimizing for maximal PDF quality."
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
              pageTitle="Compress PDF files"
              pageSubTitle="Reduce file size while optimizing for maximal PDF quality."
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
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 overflow-y-auto custom-scrollbar border-l flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Compression level</h3>

            <div className="space-y-4">
              {compressionOptions.map((option) => (
                <div
                  key={option.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${compressionLevel === option.id
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  onClick={() => setCompressionLevel(option.id)}
                >
                  {/* Selection Indicator */}
                  <div className="absolute top-3 left-3">
                    {compressionLevel === option.id ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${option.color === "red"
                            ? "bg-red-500"
                            : option.color === "blue"
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                      >
                        {option.icon === "check" ? <Check className="w-3 h-3" /> : option.icon}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-10">
                    <h4 className="text-sm font-bold text-red-600 mb-1">{option.title}</h4>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-800">
                {compressionLevel === "extreme" &&
                  "Maximum compression will significantly reduce file size but may affect quality."}
                {compressionLevel === "recommended" &&
                  "Balanced compression provides good file size reduction while maintaining quality."}
                {compressionLevel === "less" &&
                  "Minimal compression preserves maximum quality with moderate size reduction."}
              </p>
            </div>

            {hasUnhealthyFiles && (
              <div className="bg-yellow-50 rounded-xl p-4 mt-4">
                <p className="text-sm text-yellow-800">
                  Some files have preview issues but can still be compressed. Check the yellow-highlighted files.
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
                <span className="text-gray-600">Compression level:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {compressionLevel === "recommended" ? "Recommended" : compressionLevel}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={files.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
                  ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Compress PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to compress</p>
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


// "use client"

// import { useState, useRef, useCallback, memo } from "react"
// import { useRouter } from "next/navigation"
// import { FileText, X, ArrowRight, Check } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// // Memoized PDF Preview Component
// const PDFPreview = memo(({ file, pageNumber = 1, width = 180, className = "" }) => {
//   const [isLoading, setIsLoading] = useState(true)
//   const [hasError, setHasError] = useState(false)

//   const onLoadSuccess = useCallback(() => {
//     setIsLoading(false)
//     setHasError(false)
//   }, [])

//   const onLoadError = useCallback(() => {
//     setIsLoading(false)
//     setHasError(true)
//   }, [])

//   if (!file?.stableData) {
//     return (
//       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//       </div>
//     )
//   }

//   return (
//     <div className={`w-full h-full flex justify-center items-center bg-gray-100 rounded-lg ${className}`}>
//       {isLoading && (
//         <div className="flex items-center justify-center">
//           <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
//         </div>
//       )}
//       {hasError && (
//         <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
//           <FileText className="w-12 h-12 text-red-400 mb-2" />
//           <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
//         </div>
//       )}
//       {!hasError && (
//         <Document
//           file={file.stableData.dataUrl}
//           onLoadSuccess={onLoadSuccess}
//           onLoadError={onLoadError}
//           loading={null}
//           error={null}
//           className="w-full h-full flex items-center justify-center"
//         >
//           <Page
//             pageNumber={pageNumber}
//             width={width}
//             renderTextLayer={false}
//             renderAnnotationLayer={false}
//             className="border border-gray-200 shadow-sm"
//           />
//         </Document>
//       )}
//     </div>
//   )
// })

// PDFPreview.displayName = "PDFPreview"

// export default function CompressPDFPage() {
//   const [files, setFiles] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [compressionLevel, setCompressionLevel] = useState("recommended") // extreme, recommended, less
//   const [pdfPages, setPdfPages] = useState({})
//   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
//   const [pdfHealthCheck, setPdfHealthCheck] = useState({})

//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

//   const createStableFileData = useCallback(async (file, id) => {
//     if (fileDataCache.current[id]) {
//       return fileDataCache.current[id]
//     }

//     try {
//       const arrayBuffer = await file.arrayBuffer()
//       const uint8Array = new Uint8Array(arrayBuffer)
//       const blob = new Blob([uint8Array], { type: file.type })
//       const dataUrl = await new Promise((resolve) => {
//         const reader = new FileReader()
//         reader.onload = () => resolve(reader.result)
//         reader.readAsDataURL(blob)
//       })

//       const stableData = {
//         blob,
//         dataUrl,
//         uint8Array: uint8Array.slice(),
//       }

//       fileDataCache.current[id] = stableData
//       return stableData
//     } catch (error) {
//       console.error("Error creating stable file data:", error)
//       return null
//     }
//   }, [])

//   const handleFiles = async (newFiles) => {
//     const fileObjects = await Promise.all(
//       newFiles.map(async (file, index) => {
//         const id = Date.now() + index + Math.random()
//         const stableData = await createStableFileData(file, id)

//         return {
//           id,
//           file,
//           name: file.name,
//           size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//           type: file.type,
//           stableData,
//         }
//       }),
//     )
//     setFiles((prev) => [...prev, ...fileObjects])
//   }

//   const removeFile = (id) => {
//     // Clean up all references
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     // Clean up cached data
//     if (fileDataCache.current[id]) {
//       delete fileDataCache.current[id]
//     }

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

//     // Clean up health check
//     setPdfHealthCheck((prev) => {
//       const newHealth = { ...prev }
//       delete newHealth[id]
//       return newHealth
//     })

//     // Remove from files
//     setFiles((prev) => prev.filter((file) => file.id !== id))

//     // Clean up other states
//     setPdfPages((prev) => {
//       const newPages = { ...prev }
//       delete newPages[id]
//       return newPages
//     })
//   }

//   const sortFilesByName = (order = "asc") => {
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
//   }

//   const onDocumentLoadSuccess = (pdf, fileId) => {
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setPdfPages((prev) => ({
//       ...prev,
//       [fileId]: pdf.numPages,
//     }))

//     // Cache the PDF document
//     pdfDocumentCache.current[fileId] = pdf

//     // Mark as healthy
//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: true,
//     }))
//   }

//   const onDocumentLoadError = (error, fileId) => {
//     console.warn(`PDF load error for file ${fileId}:`, error)

//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     // Mark as unhealthy
//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: false,
//     }))
//   }

//   const renderFilePreview = (file) => {
//     const isLoading = loadingPdfs.has(file.id)
//     const isHealthy = pdfHealthCheck[file.id] !== false

//     if (file.type === "application/pdf" && file.stableData && isHealthy) {
//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           {!isLoading ? (
//             <Document
//               key={`pdf-${file.id}`}
//               file={file.stableData.dataUrl}
//               onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
//               onLoadError={(error) => onDocumentLoadError(error, file.id)}
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
//               className="w-full h-full flex items-center justify-center"
//             >
//               <Page
//                 pageNumber={1}
//                 width={180}
//                 renderTextLayer={false}
//                 renderAnnotationLayer={false}
//                 className="border border-gray-200 shadow-sm"
//               />
//             </Document>
//           ) : (
//             <div className="flex items-center justify-center">
//               <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
//             </div>
//           )}

//           {pdfPages[file.id] && (
//             <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
//               {pdfPages[file.id]} pages
//             </div>
//           )}
//         </div>
//       )
//     }

//     // Fallback for non-PDF files or unhealthy PDFs
//     return (
//       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
//           {file.type.split("/")[1]?.toUpperCase() || "FILE"}
//         </div>
//         {!isHealthy && (
//           <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
//             Preview Issue
//           </div>
//         )}
//       </div>
//     )
//   }

//   const handleCompress = async () => {
//     if (files.length === 0) return

//     setIsUploading(true)
//     setUploadProgress(0)

//     try {
//       // Create FormData instance
//       const formData = new FormData()

//       // Add files to FormData
//       files.forEach((file) => {
//         formData.append("files", file.file)
//       })

//       // Add compression level
//       formData.append("compressionLevel", compressionLevel)

//       // Make API call
//       const response = await Api.post("/tools/compress", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
//           setUploadProgress(progress)
//         },
//       })

//       // Handle successful response
//       if (response.data) {
//         const downloadUrl = `/downloads/document=${response.data.data.compressedFiles}?dbTaskId=${response.data.data.dbTaskId}`
//         router.push(downloadUrl)
//       } else {
//         toast.error("No compressed files received from server")
//       }
//     } catch (error) {
//       console.error("Compress error:", error)
//       toast.error(error?.response?.data?.message || "Error compressing files")
//       alert("Failed to compress PDFs. Please try again.")
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
//     return <FileUploader {...safeProps} />
//   }

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
//       />
//     )
//   }

//   const compressionOptions = [
//     {
//       id: "extreme",
//       title: "EXTREME COMPRESSION",
//       description: "Less quality, high compression",
//       color: "red",
//       icon: "1",
//     },
//     {
//       id: "recommended",
//       title: "RECOMMENDED COMPRESSION",
//       description: "Good quality, good compression",
//       color: "green",
//       icon: "check",
//     },
//     {
//       id: "less",
//       title: "LESS COMPRESSION",
//       description: "High quality, less compression",
//       color: "blue",
//       icon: "3",
//     },
//   ]

//   return (
//     <div className="md:h-[calc(100vh-82px)]">
//       <div className="grid grid-cols-10 border h-full">
//         {/* Main Content */}
//         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
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
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {files.map((file) => {
//               const isHealthy = pdfHealthCheck[file.id] !== false

//               return (
//                 <div
//                   key={file.id}
//                   ref={(el) => (fileRefs.current[file.id] = el)}
//                   className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative ${isHealthy
//                       ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
//                       : "border-yellow-300 bg-yellow-50"
//                     }`}
//                 >
//                   {/* File Preview Area */}
//                   <div className="relative h-56 p-3 pt-10">
//                     <div className="w-full h-full relative overflow-hidden rounded-lg">{renderFilePreview(file)}</div>

//                     {/* Remove Button */}
//                     <div className="absolute top-1 right-2 flex gap-1 z-30">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation()
//                           removeFile(file.id)
//                         }}
//                         className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
//                         title="Remove file"
//                       >
//                         <X className="w-4 h-4 text-red-500" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* File Info Footer */}
//                   <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
//                         {file.name}
//                       </p>
//                       <p className="text-xs text-gray-500 mt-1">{file.size}</p>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="col-span-3 overflow-y-auto custom-scrollbar border-l flex flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Compression level</h3>

//             <div className="space-y-4">
//               {compressionOptions.map((option) => (
//                 <div
//                   key={option.id}
//                   className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${compressionLevel === option.id
//                       ? "border-green-300 bg-green-50"
//                       : "border-gray-200 hover:border-gray-300 bg-white"
//                     }`}
//                   onClick={() => setCompressionLevel(option.id)}
//                 >
//                   {/* Selection Indicator */}
//                   <div className="absolute top-3 left-3">
//                     {compressionLevel === option.id ? (
//                       <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
//                         <Check className="w-4 h-4 text-white" />
//                       </div>
//                     ) : (
//                       <div
//                         className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${option.color === "red"
//                             ? "bg-red-500"
//                             : option.color === "blue"
//                               ? "bg-blue-500"
//                               : "bg-gray-400"
//                           }`}
//                       >
//                         {option.icon === "check" ? <Check className="w-3 h-3" /> : option.icon}
//                       </div>
//                     )}
//                   </div>

//                   {/* Content */}
//                   <div className="ml-10">
//                     <h4 className="text-sm font-bold text-red-600 mb-1">{option.title}</h4>
//                     <p className="text-sm text-gray-600">{option.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="bg-blue-50 rounded-xl p-4 mt-6">
//               <p className="text-sm text-blue-800">
//                 {compressionLevel === "extreme" &&
//                   "Maximum compression will significantly reduce file size but may affect quality."}
//                 {compressionLevel === "recommended" &&
//                   "Balanced compression provides good file size reduction while maintaining quality."}
//                 {compressionLevel === "less" &&
//                   "Minimal compression preserves maximum quality with moderate size reduction."}
//               </p>
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
//                 <span className="font-semibold text-gray-900">
//                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
//                 </span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Compression level:</span>
//                 <span className="font-semibold text-gray-900 capitalize">
//                   {compressionLevel === "recommended" ? "Recommended" : compressionLevel}
//                 </span>
//               </div>
//             </div>

//             <button
//               onClick={handleCompress}
//               disabled={files.length === 0}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
//                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Compress PDF
//               <ArrowRight className="w-5 h-5" />
//             </button>

//             {files.length === 0 && (
//               <p className="text-xs text-gray-500 text-center mt-2">Select PDF files to compress</p>
//             )}
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         .pdf-preview-page canvas {
//           border-radius: 8px;
//           max-width: 100% !important;
//           height: auto !important;
//         }

//         .pdf-preview-page > div {
//           display: flex !important;
//           justify-content: center !important;
//           align-items: center !important;
//         }
//       `}</style>
//     </div>
//   )
// }
