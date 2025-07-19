"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function MergePDFPage() {
  const [files, setFiles] = useState([])
  const [displayOrder, setDisplayOrder] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileRotations, setFileRotations] = useState({})
  const [pdfPages, setPdfPages] = useState({})
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({}) // Track PDF health
  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({}) // Cache PDF documents
  const router = useRouter()

  // Initialize display order when files change
  useEffect(() => {
    if (files.length > 0 && displayOrder.length !== files.length) {
      setDisplayOrder(files.map((_, index) => index))
    }
  }, [files.length, displayOrder.length])

  // PDF Health Check - verify if PDF can be safely manipulated
  const checkPdfHealth = useCallback((fileId) => {
    const element = fileRefs.current[fileId]
    if (!element) return false

    try {
      const pdfDoc = element.querySelector('.react-pdf__Document')
      if (pdfDoc && pdfDoc._pdfDocument) {
        // Check if PDF document is still valid
        const doc = pdfDoc._pdfDocument
        return doc && !doc.destroyed && doc.loadingTask && !doc.loadingTask.destroyed
      }
    } catch (error) {
      console.warn(`PDF health check failed for ${fileId}:`, error)
      return false
    }
    return true
  }, [])

  // Create stable file data
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
      console.error('Error creating stable file data:', error)
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
      })
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
        console.warn('PDF cleanup warning:', e)
      }
      delete pdfDocumentCache.current[id]
    }

    // Clean up health check
    setPdfHealthCheck(prev => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    // Remove from files and update display order
    setFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id)
      setDisplayOrder(newFiles.map((_, index) => index))
      return newFiles
    })

    // Clean up other states
    setFileRotations((prev) => {
      const newRotations = { ...prev }
      delete newRotations[id]
      return newRotations
    })
    setPdfPages((prev) => {
      const newPages = { ...prev }
      delete newPages[id]
      return newPages
    })
  }

  const rotateFile = (id) => {
    // Check PDF health before rotation
    if (!checkPdfHealth(id)) {
      console.warn('Skipping rotation - PDF not healthy')
      return
    }

    setFileRotations((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 90) % 360,
    }))
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
      // Reset display order to match new file order
      setDisplayOrder(sorted.map((_, index) => index))
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
    setPdfHealthCheck(prev => ({
      ...prev,
      [fileId]: true
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
    setPdfHealthCheck(prev => ({
      ...prev,
      [fileId]: false
    }))
  }

  const CustomErrorComponent = ({ errorType, ...otherProps }) => {
    return (
      <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
        <FileText className="w-12 h-12 text-red-400 mb-2" />
        <div className="text-sm text-red-600 font-medium text-center">
          Could not load preview
        </div>
        <div className="text-xs text-red-500 mt-1">
          {errorType || 'Unknown error'}
        </div>
      </div>
    )
  }

  const renderFilePreview = (file) => {
    const rotation = fileRotations[file.id] || 0
    const isLoading = loadingPdfs.has(file.id)
    const isHealthy = pdfHealthCheck[file.id] !== false

    if (file.type === "application/pdf" && file.stableData && isHealthy) {
      const pdfSource = file.stableData.dataUrl

      return (
        <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
          {!isLoading ? (
            <Document
              key={`pdf-${file.id}-${rotation}`} // Include rotation in key to force re-render
              file={pdfSource}
              onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
              onLoadError={(error) => onDocumentLoadError(error, file.id)}
              loading={
                <div className="flex items-center justify-center">
                  <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              }
              error={<CustomErrorComponent />}
              className="w-full h-full flex items-center justify-center border"
            >
              <div style={{ transform: `rotate(${rotation}deg)` }}>
                <Page
                  pageNumber={1}
                  width={180}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-200 shadow-sm"
                />
              </div>
            </Document>
          ) : (
            <div className="flex items-center justify-center">
              <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}

          {/* {pdfPages[file.id] && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {pdfPages[file.id]} pages
            </div>
          )} */}
        </div>
      )
    }

    // Fallback for non-PDF files or unhealthy PDFs
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
        </div>
        {!isHealthy && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            Preview Issue
          </div>
        )}
      </div>
    )
  }

  // Improved drag and drop - only changes display order
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null)
      setDraggedIndex(null)
      return
    }

    // Check if both files are healthy before allowing drop
    const draggedFile = files[displayOrder[draggedIndex]]
    const dropFile = files[displayOrder[dropIndex]]

    if (draggedFile && dropFile) {
      const draggedHealthy = pdfHealthCheck[draggedFile.id] !== false
      const dropHealthy = pdfHealthCheck[dropFile.id] !== false

      if (!draggedHealthy || !dropHealthy) {
        console.warn('Skipping drop - one or both files not healthy')
        setDragOverIndex(null)
        setDraggedIndex(null)
        return
      }
    }

    // Only change display order, not the actual files array
    setDisplayOrder(currentOrder => {
      const newOrder = [...currentOrder]
      const [movedItem] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(dropIndex, 0, movedItem)
      return newOrder
    })

    setDragOverIndex(null)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDragOverIndex(null)
    setDraggedIndex(null)
  }

  const handleMerge = async () => {
    if (files.length < 2) return

    // Get files in display order for merging
    const orderedFiles = displayOrder.map(index => files[index])

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData instance
      const formData = new FormData()

      // Add files to FormData
      orderedFiles.forEach(file => {
        formData.append('files', file.file)
      })

      // Add rotations to FormData
      const rotations = {}
      orderedFiles.forEach(file => {
        rotations[file.name] = fileRotations[file.id] || 0
      })
      formData.append('rotations', JSON.stringify(rotations))

      // Make API call
      const response = await Api.post('/tools/merge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })

      // Handle successful response
      if (response.data) {
        const downloadUrl = `/downloads/document=${response.data.data.mergedFile}?dbTaskId=${response.data.data.dbTaskId}`
        router.push(downloadUrl)
      } else {
        toast.error('No merged file received from server')
      }
    } catch (error) {
      console.error('Merge error:', error)
      toast.error(error?.response?.data?.message || 'Error merging files')
      // Handle error - you might want to show an error message to the user
      alert('Failed to merge PDFs. Please try again.')
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
      />
    )
  }

  // Get ordered files for display
  const orderedFiles = displayOrder.map(index => files[index]).filter(Boolean)

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
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orderedFiles.map((file, displayIndex) => {
              const actualIndex = displayOrder[displayIndex]
              const isHealthy = pdfHealthCheck[file.id] !== false

              return (
                <div
                  key={`${file.id}-${displayIndex}`} // Stable key with position
                  ref={(el) => (fileRefs.current[file.id] = el)}
                  className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative cursor-grab active:cursor-grabbing ${dragOverIndex === displayIndex
                    ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
                    : draggedIndex === displayIndex
                      ? "border-red-500 opacity-50"
                      : isHealthy
                        ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, displayIndex)}
                  onDragOver={(e) => handleDragOver(e, displayIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, displayIndex)}
                  onDragEnd={handleDragEnd}
                >
                  {/* File Preview Area */}
                  <div className="relative h-56 p-3 pt-10">
                    <div className="w-full h-full relative overflow-hidden rounded-lg">
                      {renderFilePreview(file)}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-1 right-2 flex gap-1 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          rotateFile(file.id)
                        }}
                        disabled={!isHealthy}
                        className={`w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 ${!isHealthy ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        title={isHealthy ? "Rotate file" : "Cannot rotate - PDF issue"}
                      >
                        <RotateCw className="w-4 h-4 text-gray-600" />
                      </button>
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

                    {/* Drag Handle */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                      <div className={`bg-black/30 text-white rounded-full p-2 ${!isHealthy ? 'bg-yellow-500/30' : ''}`}>
                        <Move className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Position indicator */}
                    <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {displayIndex + 1}
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
        <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
              </p>
            </div>

            {/* Health status */}
            {Object.values(pdfHealthCheck).some(health => health === false) && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Some files have preview issues but can still be merged. Check the yellow-highlighted files.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border">
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
            </div>

            <button
              onClick={handleMerge}
              disabled={files.length < 2}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
                ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              Merge PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length < 2 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
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

        .dragging-active {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .drop-zone-active {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}

// "use client"

// import { useState, useRef, useCallback, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// export default function MergePDFPage() {
//   const [files, setFiles] = useState([])
//   const [displayOrder, setDisplayOrder] = useState([]) // Separate display order from files
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [fileRotations, setFileRotations] = useState({})
//   const [pdfPages, setPdfPages] = useState({})
//   const [draggedIndex, setDraggedIndex] = useState(null)
//   const [dragOverIndex, setDragOverIndex] = useState(null)
//   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
//   const [pdfHealthCheck, setPdfHealthCheck] = useState({}) // Track PDF health
//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({}) // Cache PDF documents
//   const router = useRouter()

//   // Initialize display order when files change
//   useEffect(() => {
//     if (files.length > 0 && displayOrder.length !== files.length) {
//       setDisplayOrder(files.map((_, index) => index))
//     }
//   }, [files.length, displayOrder.length])

//   // PDF Health Check - verify if PDF can be safely manipulated
//   const checkPdfHealth = useCallback((fileId) => {
//     const element = fileRefs.current[fileId]
//     if (!element) return false

//     try {
//       const pdfDoc = element.querySelector('.react-pdf__Document')
//       if (pdfDoc && pdfDoc._pdfDocument) {
//         // Check if PDF document is still valid
//         const doc = pdfDoc._pdfDocument
//         return doc && !doc.destroyed && doc.loadingTask && !doc.loadingTask.destroyed
//       }
//     } catch (error) {
//       console.warn(`PDF health check failed for ${fileId}:`, error)
//       return false
//     }
//     return true
//   }, [])

//   // Create stable file data
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
//       console.error('Error creating stable file data:', error)
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
//       })
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
//         console.warn('PDF cleanup warning:', e)
//       }
//       delete pdfDocumentCache.current[id]
//     }

//     // Clean up health check
//     setPdfHealthCheck(prev => {
//       const newHealth = { ...prev }
//       delete newHealth[id]
//       return newHealth
//     })

//     // Remove from files and update display order
//     setFiles((prev) => {
//       const newFiles = prev.filter((file) => file.id !== id)
//       setDisplayOrder(newFiles.map((_, index) => index))
//       return newFiles
//     })

//     // Clean up other states
//     setFileRotations((prev) => {
//       const newRotations = { ...prev }
//       delete newRotations[id]
//       return newRotations
//     })
//     setPdfPages((prev) => {
//       const newPages = { ...prev }
//       delete newPages[id]
//       return newPages
//     })
//   }

//   const rotateFile = (id) => {
//     // Check PDF health before rotation
//     if (!checkPdfHealth(id)) {
//       console.warn('Skipping rotation - PDF not healthy')
//       return
//     }

//     setFileRotations((prev) => ({
//       ...prev,
//       [id]: ((prev[id] || 0) + 90) % 360,
//     }))
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
//       // Reset display order to match new file order
//       setDisplayOrder(sorted.map((_, index) => index))
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
//     setPdfHealthCheck(prev => ({
//       ...prev,
//       [fileId]: true
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
//     setPdfHealthCheck(prev => ({
//       ...prev,
//       [fileId]: false
//     }))
//   }

//   const CustomErrorComponent = ({ errorType, ...otherProps }) => {
//     return (
//       <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
//         <FileText className="w-12 h-12 text-red-400 mb-2" />
//         <div className="text-sm text-red-600 font-medium text-center">
//           Could not load preview
//         </div>
//         <div className="text-xs text-red-500 mt-1">
//           {errorType || 'Unknown error'}
//         </div>
//       </div>
//     )
//   }

//   const renderFilePreview = (file) => {
//     const rotation = fileRotations[file.id] || 0
//     const isLoading = loadingPdfs.has(file.id)
//     const isHealthy = pdfHealthCheck[file.id] !== false

//     if (file.type === "application/pdf" && file.stableData && isHealthy) {
//       const pdfSource = file.stableData.dataUrl

//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           {!isLoading ? (
//             <Document
//               key={`pdf-${file.id}-${rotation}`} // Include rotation in key to force re-render
//               file={pdfSource}
//               onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
//               onLoadError={(error) => onDocumentLoadError(error, file.id)}
//               loading={
//                 <div className="flex items-center justify-center">
//                   <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
//                 </div>
//               }
//               error={<CustomErrorComponent />}
//               className="w-full h-full flex items-center justify-center border"
//             >
//               <div style={{ transform: `rotate(${rotation}deg)` }}>
//                 <Page
//                   pageNumber={1}
//                   width={180}
//                   renderTextLayer={false}
//                   renderAnnotationLayer={false}
//                   className="border border-gray-200 shadow-sm"
//                 />
//               </div>
//             </Document>
//           ) : (
//             <div className="flex items-center justify-center">
//               <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
//             </div>
//           )}

//           {/* {pdfPages[file.id] && (
//             <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
//               {pdfPages[file.id]} pages
//             </div>
//           )} */}
//         </div>
//       )
//     }

//     // Fallback for non-PDF files or unhealthy PDFs
//     return (
//       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
//           {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
//         </div>
//         {!isHealthy && (
//           <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
//             Preview Issue
//           </div>
//         )}
//       </div>
//     )
//   }

//   // Improved drag and drop - only changes display order
//   const handleDragStart = (e, index) => {
//     setDraggedIndex(index)
//     e.dataTransfer.effectAllowed = 'move'
//     e.dataTransfer.setData('text/plain', index.toString())
//   }

//   const handleDragOver = (e, index) => {
//     e.preventDefault()
//     e.dataTransfer.dropEffect = 'move'

//     if (draggedIndex !== null && draggedIndex !== index) {
//       setDragOverIndex(index)
//     }
//   }

//   const handleDragLeave = (e) => {
//     if (!e.currentTarget.contains(e.relatedTarget)) {
//       setDragOverIndex(null)
//     }
//   }

//   const handleDrop = (e, dropIndex) => {
//     e.preventDefault()

//     if (draggedIndex === null || draggedIndex === dropIndex) {
//       setDragOverIndex(null)
//       setDraggedIndex(null)
//       return
//     }

//     // Check if both files are healthy before allowing drop
//     const draggedFile = files[displayOrder[draggedIndex]]
//     const dropFile = files[displayOrder[dropIndex]]

//     if (draggedFile && dropFile) {
//       const draggedHealthy = pdfHealthCheck[draggedFile.id] !== false
//       const dropHealthy = pdfHealthCheck[dropFile.id] !== false

//       if (!draggedHealthy || !dropHealthy) {
//         console.warn('Skipping drop - one or both files not healthy')
//         setDragOverIndex(null)
//         setDraggedIndex(null)
//         return
//       }
//     }

//     // Only change display order, not the actual files array
//     setDisplayOrder(currentOrder => {
//       const newOrder = [...currentOrder]
//       const [movedItem] = newOrder.splice(draggedIndex, 1)
//       newOrder.splice(dropIndex, 0, movedItem)
//       return newOrder
//     })

//     setDragOverIndex(null)
//     setDraggedIndex(null)
//   }

//   const handleDragEnd = () => {
//     setDragOverIndex(null)
//     setDraggedIndex(null)
//   }

//   const handleMerge = async () => {
//     if (files.length < 2) return

//     // Get files in display order for merging
//     const orderedFiles = displayOrder.map(index => files[index])

//     setIsUploading(true)
//     setUploadProgress(0)

//     const interval = setInterval(() => {
//       setUploadProgress((prev) => {
//         if (prev >= 100) {
//           clearInterval(interval)
//           setTimeout(() => {
//             router.push("/downloads/merged-pdf-" + Date.now())
//           }, 1000)
//           return 100
//         }
//         return prev + 10
//       })
//     }, 200)
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

//   // Get ordered files for display
//   const orderedFiles = displayOrder.map(index => files[index]).filter(Boolean)

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
//             {orderedFiles.map((file, displayIndex) => {
//               const actualIndex = displayOrder[displayIndex]
//               const isHealthy = pdfHealthCheck[file.id] !== false

//               return (
//                 <div
//                   key={`${file.id}-${displayIndex}`} // Stable key with position
//                   ref={(el) => (fileRefs.current[file.id] = el)}
//                   className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative cursor-grab active:cursor-grabbing ${dragOverIndex === displayIndex
//                       ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
//                       : draggedIndex === displayIndex
//                         ? "border-red-500 opacity-50"
//                         : isHealthy
//                           ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
//                           : "border-yellow-300 bg-yellow-50"
//                     }`}
//                   draggable="true"
//                   onDragStart={(e) => handleDragStart(e, displayIndex)}
//                   onDragOver={(e) => handleDragOver(e, displayIndex)}
//                   onDragLeave={handleDragLeave}
//                   onDrop={(e) => handleDrop(e, displayIndex)}
//                   onDragEnd={handleDragEnd}
//                 >
//                   {/* File Preview Area */}
//                   <div className="relative h-56 p-3 pt-10">
//                     <div className="w-full h-full relative overflow-hidden rounded-lg">
//                       {renderFilePreview(file)}
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="absolute top-1 right-2 flex gap-1 z-30">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation()
//                           rotateFile(file.id)
//                         }}
//                         disabled={!isHealthy}
//                         className={`w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 ${!isHealthy ? 'opacity-50 cursor-not-allowed' : ''
//                           }`}
//                         title={isHealthy ? "Rotate file" : "Cannot rotate - PDF issue"}
//                       >
//                         <RotateCw className="w-4 h-4 text-gray-600" />
//                       </button>
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

//                     {/* Drag Handle */}
//                     <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
//                       <div className={`bg-black/30 text-white rounded-full p-2 ${!isHealthy ? 'bg-yellow-500/30' : ''}`}>
//                         <Move className="w-5 h-5" />
//                       </div>
//                     </div>

//                     {/* Position indicator */}
//                     <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
//                       {displayIndex + 1}
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
//         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
//               </p>
//             </div>

//             {/* Health status */}
//             {Object.values(pdfHealthCheck).some(health => health === false) && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   Some files have preview issues but can still be merged. Check the yellow-highlighted files.
//                 </p>
//               </div>
//             )}
//           </div>

//           <div className="p-6 border">
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
//             </div>

//             <button
//               onClick={handleMerge}
//               disabled={files.length < 2}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
//                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Merge PDF
//               <ArrowRight className="w-5 h-5" />
//             </button>

//             {files.length < 2 && (
//               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
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

//         .dragging-active {
//           transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//         }
        
//         .drop-zone-active {
//           background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
//           border-color: #3b82f6;
//           transform: scale(1.02);
//         }
//       `}</style>
//     </div>
//   )
// }


// // "use client"

// // import { useState, useRef, useCallback } from "react"
// // import { useRouter } from "next/navigation"
// // import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
// // import { Document, Page, pdfjs } from "react-pdf"
// // import ProgressScreen from "@/components/tools/ProgressScreen"
// // import FileUploader from "@/components/tools/FileUploader"

// // // PDF.js worker setup
// // pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// // export default function MergePDFPage() {
// //   const [files, setFiles] = useState([])
// //   const [isDragOver, setIsDragOver] = useState(false)
// //   const [isUploading, setIsUploading] = useState(false)
// //   const [uploadProgress, setUploadProgress] = useState(0)
// //   const [fileRotations, setFileRotations] = useState({})
// //   const [pdfPages, setPdfPages] = useState({})
// //   const [draggedFile, setDraggedFile] = useState(null)
// //   const [dragOverIndex, setDragOverIndex] = useState(null)
// //   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
// //   const fileRefs = useRef({})
// //   const fileDataCache = useRef({}) // Cache for stable file data
// //   const pdfLoadingTimeouts = useRef({}) // Track loading timeouts
// //   const router = useRouter()

// //   // Create stable file data that won't get detached
// //   const createStableFileData = useCallback(async (file, id) => {
// //     if (fileDataCache.current[id]) {
// //       return fileDataCache.current[id]
// //     }

// //     try {
// //       const arrayBuffer = await file.arrayBuffer()
// //       // Create a new Uint8Array to prevent detachment
// //       const uint8Array = new Uint8Array(arrayBuffer)
// //       const blob = new Blob([uint8Array], { type: file.type })
// //       const dataUrl = await new Promise((resolve) => {
// //         const reader = new FileReader()
// //         reader.onload = () => resolve(reader.result)
// //         reader.readAsDataURL(blob)
// //       })

// //       const stableData = {
// //         blob,
// //         dataUrl,
// //         uint8Array: uint8Array.slice(), // Create a copy
// //       }

// //       fileDataCache.current[id] = stableData
// //       return stableData
// //     } catch (error) {
// //       console.error('Error creating stable file data:', error)
// //       return null
// //     }
// //   }, [])

// //   const handleFiles = async (newFiles) => {
// //     const fileObjects = await Promise.all(
// //       newFiles.map(async (file, index) => {
// //         const id = Date.now() + index + Math.random()
// //         const stableData = await createStableFileData(file, id)

// //         return {
// //           id,
// //           file,
// //           name: file.name,
// //           size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// //           type: file.type,
// //           stableData,
// //         }
// //       })
// //     )
// //     setFiles((prev) => [...prev, ...fileObjects])
// //   }

// //   const removeFile = (id) => {
// //     // Clean up cached data
// //     if (fileDataCache.current[id]) {
// //       delete fileDataCache.current[id]
// //     }

// //     // Clear any pending timeouts
// //     if (pdfLoadingTimeouts.current[id]) {
// //       clearTimeout(pdfLoadingTimeouts.current[id])
// //       delete pdfLoadingTimeouts.current[id]
// //     }

// //     setFiles((prev) => prev.filter((file) => file.id !== id))
// //     setFileRotations((prev) => {
// //       const newRotations = { ...prev }
// //       delete newRotations[id]
// //       return newRotations
// //     })
// //     setPdfPages((prev) => {
// //       const newPages = { ...prev }
// //       delete newPages[id]
// //       return newPages
// //     })
// //     setLoadingPdfs((prev) => {
// //       const newSet = new Set(prev)
// //       newSet.delete(id)
// //       return newSet
// //     })
// //   }

// //   const rotateFile = (id) => {
// //     setFileRotations((prev) => ({
// //       ...prev,
// //       [id]: ((prev[id] || 0) + 90) % 360,
// //     }))
// //   }

// //   const sortFilesByName = (order = "asc") => {
// //     setFiles((prev) => {
// //       const sorted = [...prev].sort((a, b) => {
// //         if (order === "asc") {
// //           return a.name.localeCompare(b.name)
// //         } else {
// //           return b.name.localeCompare(a.name)
// //         }
// //       })
// //       return sorted
// //     })
// //   }

// //   const onDocumentLoadSuccess = (pdf, fileId) => {
// //     // Clear loading timeout
// //     if (pdfLoadingTimeouts.current[fileId]) {
// //       clearTimeout(pdfLoadingTimeouts.current[fileId])
// //       delete pdfLoadingTimeouts.current[fileId]
// //     }

// //     setLoadingPdfs((prev) => {
// //       const newSet = new Set(prev)
// //       newSet.delete(fileId)
// //       return newSet
// //     })

// //     setPdfPages((prev) => ({
// //       ...prev,
// //       [fileId]: pdf.numPages,
// //     }))
// //   }

// //   const onDocumentLoadError = (error, fileId) => {
// //     console.warn(`PDF load error for file ${fileId}:`, error)

// //     // Clear loading timeout
// //     if (pdfLoadingTimeouts.current[fileId]) {
// //       clearTimeout(pdfLoadingTimeouts.current[fileId])
// //       delete pdfLoadingTimeouts.current[fileId]
// //     }

// //     setLoadingPdfs((prev) => {
// //       const newSet = new Set(prev)
// //       newSet.delete(fileId)
// //       return newSet
// //     })
// //   }

// //   const CustomErrorComponent = ({ errorType, ...otherProps }) => {
// //     return (
// //       <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
// //         <FileText className="w-12 h-12 text-red-400 mb-2" />
// //         <div className="text-sm text-red-600 font-medium text-center">
// //           Could not load preview
// //         </div>
// //         <div className="text-xs text-red-500 mt-1">
// //           {errorType || 'Unknown error'}
// //         </div>
// //       </div>
// //     )
// //   }

// //   const renderFilePreview = (file) => {
// //     const rotation = fileRotations[file.id] || 0
// //     const isLoading = loadingPdfs.has(file.id)

// //     if (file.type === "application/pdf" && file.stableData) {
// //       // Use the stable data URL for PDF.js
// //       const pdfSource = file.stableData.dataUrl

// //       return (
// //         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
// //           {!isLoading ? (
// //             <Document
// //               file={pdfSource}
// //               onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
// //               onLoadError={(error) => onDocumentLoadError(error, file.id)}
// //               loading={
// //                 <div className="flex items-center justify-center">
// //                   <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
// //                 </div>
// //               }
// //               error={<CustomErrorComponent />}
// //               className="w-full h-full flex items-center justify-center"
// //             >
// //               <div style={{ transform: `rotate(${rotation}deg)` }}>
// //                 <Page
// //                   pageNumber={1}
// //                   width={180}
// //                   renderTextLayer={false}
// //                   renderAnnotationLayer={false}
// //                   className="border border-gray-200 shadow-sm"
// //                 />
// //               </div>
// //             </Document>
// //           ) : (
// //             <div className="flex items-center justify-center">
// //               <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
// //             </div>
// //           )}

// //           {pdfPages[file.id] && (
// //             <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
// //               {pdfPages[file.id]} pages
// //             </div>
// //           )}
// //         </div>
// //       )
// //     }

// //     // Fallback for non-PDF files
// //     return (
// //       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
// //         <FileText className="w-16 h-16 text-gray-400" />
// //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
// //           {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
// //         </div>
// //       </div>
// //     )
// //   }

// //   // Improved drag and drop handlers
// //   const handleDragStart = (e, file, index) => {
// //     setDraggedFile({ file, index })
// //     e.dataTransfer.effectAllowed = 'move'
// //     e.dataTransfer.setData('text/plain', file.id.toString())
// //   }

// //   const handleDragOver = (e, index) => {
// //     e.preventDefault()
// //     e.dataTransfer.dropEffect = 'move'

// //     if (draggedFile && draggedFile.index !== index) {
// //       setDragOverIndex(index)
// //     }
// //   }

// //   const handleDragLeave = (e) => {
// //     // Only clear if we're actually leaving the drop zone
// //     if (!e.currentTarget.contains(e.relatedTarget)) {
// //       setDragOverIndex(null)
// //     }
// //   }

// //   const handleDrop = (e, index) => {
// //     e.preventDefault()

// //     if (!draggedFile || draggedFile.index === index) {
// //       setDragOverIndex(null)
// //       setDraggedFile(null)
// //       return
// //     }

// //     // Set loading state for PDFs that are being moved
// //     const movedFile = files[draggedFile.index]
// //     if (movedFile.type === "application/pdf") {
// //       setLoadingPdfs((prev) => new Set(prev).add(movedFile.id))

// //       // Set a timeout to prevent infinite loading
// //       pdfLoadingTimeouts.current[movedFile.id] = setTimeout(() => {
// //         setLoadingPdfs((prev) => {
// //           const newSet = new Set(prev)
// //           newSet.delete(movedFile.id)
// //           return newSet
// //         })
// //         delete pdfLoadingTimeouts.current[movedFile.id]
// //       }, 3000) // 3 second timeout
// //     }

// //     // Reorder files without recreating file objects
// //     setFiles(currentFiles => {
// //       const newFiles = [...currentFiles]
// //       const [movedFileObj] = newFiles.splice(draggedFile.index, 1)
// //       newFiles.splice(index, 0, movedFileObj)
// //       return newFiles
// //     })

// //     setDragOverIndex(null)
// //     setDraggedFile(null)
// //   }

// //   const handleDragEnd = () => {
// //     setDragOverIndex(null)
// //     setDraggedFile(null)
// //   }

// //   const handleMerge = async () => {
// //     if (files.length < 2) return

// //     setIsUploading(true)
// //     setUploadProgress(0)

// //     const interval = setInterval(() => {
// //       setUploadProgress((prev) => {
// //         if (prev >= 100) {
// //           clearInterval(interval)
// //           setTimeout(() => {
// //             router.push("/downloads/merged-pdf-" + Date.now())
// //           }, 1000)
// //           return 100
// //         }
// //         return prev + 10
// //       })
// //     }, 200)
// //   }

// //   // FileUploader wrapper to filter out framer motion props
// //   const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
// //     return <FileUploader {...safeProps} />
// //   }

// //   if (isUploading) {
// //     return <ProgressScreen uploadProgress={uploadProgress} />
// //   }

// //   if (files.length === 0) {
// //     return (
// //       <SafeFileUploader
// //         isMultiple={true}
// //         onFilesSelect={handleFiles}
// //         isDragOver={isDragOver}
// //         setIsDragOver={setIsDragOver}
// //         allowedTypes={[".pdf"]}
// //         showFiles={false}
// //         uploadButtonText="Select PDF files"
// //       />
// //     )
// //   }

// //   return (
// //     <div className="md:h-[calc(100vh-82px)]">
// //       <div className="grid grid-cols-10 border h-full">
// //         {/* Main Content */}
// //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// //           <div className="flex items-center justify-between mb-6">
// //             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

// //             <SafeFileUploader
// //               isMultiple={true}
// //               onFilesSelect={handleFiles}
// //               isDragOver={isDragOver}
// //               setIsDragOver={setIsDragOver}
// //               allowedTypes={[".pdf"]}
// //               showFiles={true}
// //               onSort={sortFilesByName}
// //               selectedCount={files?.length}
// //             />
// //           </div>

// //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
// //             {files.map((file, index) => (
// //               <div
// //                 key={`file-${file.id}`} // Stable key
// //                 ref={(el) => (fileRefs.current[file.id] = el)}
// //                 className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative cursor-grab active:cursor-grabbing ${dragOverIndex === index
// //                     ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
// //                     : draggedFile?.file.id === file.id
// //                       ? "border-red-500 opacity-50"
// //                       : "border-gray-200 hover:border-red-300 hover:shadow-lg"
// //                   }`}
// //                 draggable="true"
// //                 onDragStart={(e) => handleDragStart(e, file, index)}
// //                 onDragOver={(e) => handleDragOver(e, index)}
// //                 onDragLeave={handleDragLeave}
// //                 onDrop={(e) => handleDrop(e, index)}
// //                 onDragEnd={handleDragEnd}
// //               >
// //                 {/* File Preview Area */}
// //                 <div className="relative h-56 p-3 pt-10">
// //                   <div className="w-full h-full relative overflow-hidden rounded-lg">
// //                     {renderFilePreview(file)}
// //                   </div>

// //                   {/* Action Buttons */}
// //                   <div className="absolute top-1 right-2 flex gap-1 z-30">
// //                     <button
// //                       onClick={(e) => {
// //                         e.stopPropagation()
// //                         rotateFile(file.id)
// //                       }}
// //                       className="w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// //                       title="Rotate file"
// //                     >
// //                       <RotateCw className="w-4 h-4 text-gray-600" />
// //                     </button>
// //                     <button
// //                       onClick={(e) => {
// //                         e.stopPropagation()
// //                         removeFile(file.id)
// //                       }}
// //                       className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// //                       title="Remove file"
// //                     >
// //                       <X className="w-4 h-4 text-red-500" />
// //                     </button>
// //                   </div>

// //                   {/* Drag Handle */}
// //                   <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
// //                     <div className="bg-black/30 text-white rounded-full p-2">
// //                       <Move className="w-5 h-5" />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 {/* File Info Footer */}
// //                 <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
// //                   <div>
// //                     <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
// //                       {file.name}
// //                     </p>
// //                     <p className="text-xs text-gray-500 mt-1">{file.size}</p>
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Sidebar */}
// //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// //           <div className="p-6">
// //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// //               <p className="text-sm text-blue-800">
// //                 Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
// //               </p>
// //             </div>
// //           </div>

// //           <div className="p-6 border">
// //             <div className="space-y-4 mb-6">
// //               <div className="flex items-center justify-between text-sm">
// //                 <span className="text-gray-600">Files selected:</span>
// //                 <span className="font-semibold text-gray-900">{files.length}</span>
// //               </div>
// //               <div className="flex items-center justify-between text-sm">
// //                 <span className="text-gray-600">Total size:</span>
// //                 <span className="font-semibold text-gray-900">
// //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// //                 </span>
// //               </div>
// //             </div>

// //             <button
// //               onClick={handleMerge}
// //               disabled={files.length < 2}
// //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// //                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// //                   : "bg-gray-300 cursor-not-allowed"
// //                 }`}
// //             >
// //               Merge PDF
// //               <ArrowRight className="w-5 h-5" />
// //             </button>

// //             {files.length < 2 && (
// //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       <style jsx>{`
// //         .pdf-preview-page canvas {
// //           border-radius: 8px;
// //           max-width: 100% !important;
// //           height: auto !important;
// //         }
        
// //         .pdf-preview-page > div {
// //           display: flex !important;
// //           justify-content: center !important;
// //           align-items: center !important;
// //         }
// //       `}</style>
// //     </div>
// //   )
// // }

// // "use client"

// // import { useState } from "react"
// // import { useRouter } from "next/navigation"
// // import { Upload, FileText, X, GripVertical, ArrowRight } from "lucide-react"
// // import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
// // import ProgressScreen from "@/components/tools/ProgressScreen"
// // import FileUploader from "@/components/tools/FileUploader"

// // export default function MergePDFPage() {
// //   const [files, setFiles] = useState([])
// //   const [isDragOver, setIsDragOver] = useState(false)
// //   const [isUploading, setIsUploading] = useState(false)
// //   const [uploadProgress, setUploadProgress] = useState(0)
// //   const router = useRouter()

// //   const handleFiles = (newFiles) => {
// //     const fileObjects = newFiles.map((file, index) => ({
// //       id: Date.now() + index,
// //       file,
// //       name: file.name,
// //       size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// //       preview: URL.createObjectURL(file),
// //     }))
// //     setFiles((prev) => [...prev, ...fileObjects])
// //   }

// //   const removeFile = (id) => {
// //     setFiles((prev) => prev.filter((file) => file.id !== id))
// //   }

// //   const onDragEnd = (result) => {
// //     if (!result.destination) return

// //     const items = Array.from(files)
// //     const [reorderedItem] = items.splice(result.source.index, 1)
// //     items.splice(result.destination.index, 0, reorderedItem)

// //     setFiles(items)
// //   }

// //   const handleMerge = async () => {
// //     if (files.length < 2) return

// //     setIsUploading(true)
// //     setUploadProgress(0)

// //     // Simulate upload progress
// //     const interval = setInterval(() => {
// //       setUploadProgress((prev) => {
// //         if (prev >= 100) {
// //           clearInterval(interval)
// //           // Simulate processing time
// //           setTimeout(() => {
// //             router.push("/downloads/merged-pdf-" + Date.now())
// //           }, 1000)
// //           return 100
// //         }
// //         return prev + 10
// //       })
// //     }, 200)
// //   }

// //   // Progress screen
// //   if (isUploading) {
// //     return <ProgressScreen uploadProgress={uploadProgress} />
// //   }

// //   // Upload screen
// //   if (files.length === 0) {
// //     return (
// //       <FileUploader
// //         isMultiple={true}
// //         onFilesSelect={handleFiles}
// //         isDragOver={isDragOver}
// //         setIsDragOver={setIsDragOver}
// //       />
// //     )
// //   }

// //   // Files selected screen
// //   return (
// //     <div className="md:h-[calc(100vh-82px)] ">
// //       <div className="grid grid-cols-10 border h-full">
// //         {/* Main Content */}
// //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// //           <div className="flex items-center justify-between mb-6">
// //             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>
// //             <label
// //               htmlFor="add-more"
// //               className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg cursor-pointer transition-colors"
// //             >
// //               <Upload className="w-5 h-5" />
// //               <input
// //                 id="add-more"
// //                 type="file"
// //                 multiple
// //                 accept=".pdf"
// //                 onChange={(e) => handleFiles(Array.from(e.target.files))}
// //                 className="hidden"
// //               />
// //             </label>
// //           </div>

// //           <DragDropContext onDragEnd={onDragEnd}>
// //             <Droppable droppableId="files">
// //               {(provided) => (
// //                 <div
// //                   {...provided.droppableProps}
// //                   ref={provided.innerRef}
// //                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
// //                 >
// //                   {files.map((file, index) => (
// //                     <Draggable key={file.id} draggableId={file.id.toString()} index={index}>
// //                       {(provided, snapshot) => (
// //                         <div
// //                           ref={provided.innerRef}
// //                           {...provided.draggableProps}
// //                           className={`bg-gray-50 rounded-xl p-4 border-2 transition-all duration-200 ${snapshot.isDragging
// //                             ? "border-red-500 shadow-lg scale-105"
// //                             : "border-gray-200 hover:border-red-300"
// //                             }`}
// //                         >
// //                           <div className="flex items-start justify-between mb-3">
// //                             <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
// //                               <GripVertical className="w-5 h-5 text-gray-400" />
// //                             </div>
// //                             <button
// //                               onClick={() => removeFile(file.id)}
// //                               className="text-red-500 hover:text-red-700 transition-colors"
// //                             >
// //                               <X className="w-5 h-5" />
// //                             </button>
// //                           </div>

// //                           <div className="flex items-center mb-3">
// //                             <FileText className="w-8 h-8 text-red-600 mr-3" />
// //                             <div className="flex-1 min-w-0">
// //                               <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
// //                               <p className="text-xs text-gray-500">{file.size}</p>
// //                             </div>
// //                           </div>

// //                           <div className="text-xs text-gray-500 text-center">Page {index + 1}</div>
// //                         </div>
// //                       )}
// //                     </Draggable>
// //                   ))}
// //                   {provided.placeholder}
// //                 </div>
// //               )}
// //             </Droppable>
// //           </DragDropContext>
// //         </div>

// //         {/* Sidebar */}
// //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// //           <div className="p-6">
// //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// //               <p className="text-sm text-blue-800">
// //                 To change the order of your PDFs, drag and drop the files as you want.
// //               </p>
// //             </div>
// //           </div>

// //           <div className="p-6 border">
// //             <div className="space-y-4 mb-6">
// //               <div className="flex items-center justify-between text-sm">
// //                 <span className="text-gray-600">Files selected:</span>
// //                 <span className="font-semibold text-gray-900">{files.length}</span>
// //               </div>
// //               <div className="flex items-center justify-between text-sm">
// //                 <span className="text-gray-600">Total size:</span>
// //                 <span className="font-semibold text-gray-900">
// //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// //                 </span>
// //               </div>
// //             </div>

// //             <button
// //               onClick={handleMerge}
// //               disabled={files.length < 2}
// //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// //                 ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// //                 : "bg-gray-300 cursor-not-allowed"
// //                 }`}
// //             >
// //               Merge PDF
// //               <ArrowRight className="w-5 h-5" />
// //             </button>

// //             {files.length < 2 && (
// //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // // "use client"

// // // import { useState, useCallback } from "react"
// // // import { useRouter } from "next/navigation"
// // // import { Upload, FileText, X, GripVertical, Download, ArrowRight } from "lucide-react"
// // // import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// // // export default function MergePDFPage() {
// // //   const [files, setFiles] = useState([])
// // //   const [isDragOver, setIsDragOver] = useState(false)
// // //   const [isUploading, setIsUploading] = useState(false)
// // //   const [uploadProgress, setUploadProgress] = useState(0)
// // //   const router = useRouter()

// // //   const handleDragOver = useCallback((e) => {
// // //     e.preventDefault()
// // //     setIsDragOver(true)
// // //   }, [])

// // //   const handleDragLeave = useCallback((e) => {
// // //     e.preventDefault()
// // //     setIsDragOver(false)
// // //   }, [])

// // //   const handleDrop = useCallback((e) => {
// // //     e.preventDefault()
// // //     setIsDragOver(false)
// // //     const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
// // //     handleFiles(droppedFiles)
// // //   }, [])

// // //   const handleFileSelect = (e) => {
// // //     const selectedFiles = Array.from(e.target.files)
// // //     handleFiles(selectedFiles)
// // //   }

// // //   const handleFiles = (newFiles) => {
// // //     const fileObjects = newFiles.map((file, index) => ({
// // //       id: Date.now() + index,
// // //       file,
// // //       name: file.name,
// // //       size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// // //       preview: URL.createObjectURL(file),
// // //     }))
// // //     setFiles((prev) => [...prev, ...fileObjects])
// // //   }

// // //   const removeFile = (id) => {
// // //     setFiles((prev) => prev.filter((file) => file.id !== id))
// // //   }

// // //   const onDragEnd = (result) => {
// // //     if (!result.destination) return

// // //     const items = Array.from(files)
// // //     const [reorderedItem] = items.splice(result.source.index, 1)
// // //     items.splice(result.destination.index, 0, reorderedItem)

// // //     setFiles(items)
// // //   }

// // //   const handleMerge = async () => {
// // //     if (files.length < 2) return

// // //     setIsUploading(true)
// // //     setUploadProgress(0)

// // //     // Simulate upload progress
// // //     const interval = setInterval(() => {
// // //       setUploadProgress((prev) => {
// // //         if (prev >= 100) {
// // //           clearInterval(interval)
// // //           // Simulate processing time
// // //           setTimeout(() => {
// // //             router.push("/downloads/merged-pdf-" + Date.now())
// // //           }, 1000)
// // //           return 100
// // //         }
// // //         return prev + 10
// // //       })
// // //     }, 200)
// // //   }

// // //   if (isUploading) {
// // //     return (
// // //       <div className="md:h-[calc(100vh-82px)] bg-gray-50 flex items-center justify-center">
// // //         <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
// // //           <div className="text-center">
// // //             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
// // //               <Download className="w-8 h-8 text-red-600 animate-bounce" />
// // //             </div>
// // //             <h2 className="text-2xl font-bold text-gray-900 mb-2">Merging PDFs...</h2>
// // //             <p className="text-gray-600 mb-6">Please wait while we combine your files</p>

// // //             <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
// // //               <div
// // //                 className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300 ease-out"
// // //                 style={{ width: `${uploadProgress}%` }}
// // //               ></div>
// // //             </div>
// // //             <p className="text-sm text-gray-500">{uploadProgress}% Complete</p>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   if (files.length === 0) {
// // //     return (
// // //       <div className="md:h-[calc(100vh-82px)] bg-gray-50">
// // //         <div className="container mx-auto px-4 py-8">
// // //           <div className="text-center mb-8">
// // //             <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF files</h1>
// // //             <p className="text-xl text-gray-600">
// // //               Combine PDFs in the order you want with the easiest PDF merger available.
// // //             </p>
// // //           </div>

// // //           <div className="max-w-2xl mx-auto">
// // //             <div
// // //               className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragOver
// // //                 ? "border-red-500 bg-red-50"
// // //                 : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"
// // //                 }`}
// // //               onDragOver={handleDragOver}
// // //               onDragLeave={handleDragLeave}
// // //               onDrop={handleDrop}
// // //             >
// // //               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
// // //                 <Upload className="w-10 h-10 text-red-600" />
// // //               </div>

// // //               <label htmlFor="file-upload" className="cursor-pointer">
// // //                 <div className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 mb-4">
// // //                   Select PDF files
// // //                 </div>
// // //                 <input
// // //                   id="file-upload"
// // //                   type="file"
// // //                   multiple
// // //                   accept=".pdf"
// // //                   onChange={handleFileSelect}
// // //                   className="hidden"
// // //                 />
// // //               </label>

// // //               <p className="text-gray-500 text-lg">or drop PDFs here</p>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
// // //           © PDF ToolsHub 2025 • Your PDF Editor
// // //         </footer>
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div className="md:h-[calc(100vh-82px)] ">
// // //       <div className="grid grid-cols-10 border h-full">
// // //         {/* Main Content */}
// // //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// // //             <div className="flex items-center justify-between mb-6">
// // //               <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>
// // //               <label
// // //                 htmlFor="add-more"
// // //                 className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg cursor-pointer transition-colors"
// // //               >
// // //                 <Upload className="w-5 h-5" />
// // //                 <input
// // //                   id="add-more"
// // //                   type="file"
// // //                   multiple
// // //                   accept=".pdf"
// // //                   onChange={handleFileSelect}
// // //                   className="hidden"
// // //                 />
// // //               </label>
// // //             </div>

// // //             <DragDropContext onDragEnd={onDragEnd}>
// // //               <Droppable droppableId="files">
// // //                 {(provided) => (
// // //                   <div
// // //                     {...provided.droppableProps}
// // //                     ref={provided.innerRef}
// // //                     className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
// // //                   >
// // //                     {files.map((file, index) => (
// // //                       <Draggable key={file.id} draggableId={file.id.toString()} index={index}>
// // //                         {(provided, snapshot) => (
// // //                           <div
// // //                             ref={provided.innerRef}
// // //                             {...provided.draggableProps}
// // //                             className={`bg-gray-50 rounded-xl p-4 border-2 transition-all duration-200 ${snapshot.isDragging
// // //                               ? "border-red-500 shadow-lg scale-105"
// // //                               : "border-gray-200 hover:border-red-300"
// // //                               }`}
// // //                           >
// // //                             <div className="flex items-start justify-between mb-3">
// // //                               <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
// // //                                 <GripVertical className="w-5 h-5 text-gray-400" />
// // //                               </div>
// // //                               <button
// // //                                 onClick={() => removeFile(file.id)}
// // //                                 className="text-red-500 hover:text-red-700 transition-colors"
// // //                               >
// // //                                 <X className="w-5 h-5" />
// // //                               </button>
// // //                             </div>

// // //                             <div className="flex items-center mb-3">
// // //                               <FileText className="w-8 h-8 text-red-600 mr-3" />
// // //                               <div className="flex-1 min-w-0">
// // //                                 <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
// // //                                 <p className="text-xs text-gray-500">{file.size}</p>
// // //                               </div>
// // //                             </div>

// // //                             <div className="text-xs text-gray-500 text-center">Page {index + 1}</div>
// // //                           </div>
// // //                         )}
// // //                       </Draggable>
// // //                     ))}
// // //                     {provided.placeholder}
// // //                   </div>
// // //                 )}
// // //               </Droppable>
// // //             </DragDropContext>
// // //         </div>

// // //         {/* Sidebar */}
// // //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// // //             <div className="p-6">
// // //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// // //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// // //               <p className="text-sm text-blue-800">
// // //                 To change the order of your PDFs, drag and drop the files as you want.
// // //               </p>
// // //             </div>
// // //             </div>

// // //           <div className="p-6 border">
// // //             <div className="space-y-4 mb-6">
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Files selected:</span>
// // //                 <span className="font-semibold text-gray-900">{files.length}</span>
// // //               </div>
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Total size:</span>
// // //                 <span className="font-semibold text-gray-900">
// // //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// // //                 </span>
// // //               </div>
// // //             </div>

// // //             <button
// // //               onClick={handleMerge}
// // //               disabled={files.length < 2}
// // //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// // //                 ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// // //                 : "bg-gray-300 cursor-not-allowed"
// // //                 }`}
// // //             >
// // //               Merge PDF
// // //               <ArrowRight className="w-5 h-5" />
// // //             </button>

// // //             {files.length < 2 && (
// // //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// // //             )}
// // //           </div>
// // //           </div>
// // //       </div>
// // //     </div>
// // //   )
// // // }



// // // "use client"

// // // import { useState, useRef } from "react"
// // // import { useRouter } from "next/navigation"
// // // import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
// // // import { Document, Page, pdfjs } from "react-pdf"
// // // import ProgressScreen from "@/components/tools/ProgressScreen"
// // // import FileUploader from "@/components/tools/FileUploader"
// // // // Removed react-file-viewer import as it was causing whileTap prop error
// // // // Removed unused motion import

// // // // PDF.js worker setup
// // // // pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
// // // pdfjs.GlobalWorkerOptions.workerSrc = new URL(
// // //   -  'pdfjs-dist/build/pdf.worker.min.mjs',
// // //   +  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
// // //   import.meta.url,
// // // ).toString();


// // // export default function MergePDFPage() {
// // //   const [files, setFiles] = useState([])
// // //   const [isDragOver, setIsDragOver] = useState(false)
// // //   const [isUploading, setIsUploading] = useState(false)
// // //   const [uploadProgress, setUploadProgress] = useState(0)
// // //   const [fileRotations, setFileRotations] = useState({})
// // //   const [pdfPages, setPdfPages] = useState({})
// // //   const [draggedFile, setDraggedFile] = useState(null)
// // //   const [dragOverIndex, setDragOverIndex] = useState(null)
// // //   const fileRefs = useRef({})
// // //   const router = useRouter()

// // //   const handleFiles = (newFiles) => {
// // //     const fileObjects = newFiles.map((file, index) => {
// // //       const blobUrl = URL.createObjectURL(file)
// // //       return {
// // //         id: Date.now() + index + Math.random(),
// // //         file: file, // 👈 React-PDF needs the actual File object here!
// // //         name: file.name,
// // //         size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// // //         preview: blobUrl, // 👈 You can still use this for <embed> or images
// // //         type: file.type,
// // //       }
// // //     })
// // //     setFiles((prev) => [...prev, ...fileObjects])
// // //   }


// // //   const removeFile = (id) => {
// // //     setFiles((prev) => prev.filter((file) => file.id !== id))
// // //     setFileRotations((prev) => {
// // //       const newRotations = { ...prev }
// // //       delete newRotations[id]
// // //       return newRotations
// // //     })
// // //     setPdfPages((prev) => {
// // //       const newPages = { ...prev }
// // //       delete newPages[id]
// // //       return newPages
// // //     })
// // //   }

// // //   const rotateFile = (id) => {
// // //     setFileRotations((prev) => ({
// // //       ...prev,
// // //       [id]: ((prev[id] || 0) + 90) % 360,
// // //     }))
// // //   }

// // //   const sortFilesByName = (order = "asc") => {
// // //     setFiles((prev) => {
// // //       const sorted = [...prev].sort((a, b) => {
// // //         if (order === "asc") {
// // //           return a.name.localeCompare(b.name)
// // //         } else {
// // //           return b.name.localeCompare(a.name)
// // //         }
// // //       })
// // //       return sorted
// // //     })
// // //   }

// // //   const onDocumentLoadSuccess = (pdf, fileId) => {
// // //     setPdfPages((prev) => ({
// // //       ...prev,
// // //       [fileId]: pdf.numPages,
// // //     }))
// // //   }

// // //   const CustomErrorComponent = ({ errorType, ...otherProps }) => {
// // //     return (
// // //       <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
// // //         <FileText className="w-12 h-12 text-red-400 mb-2" />
// // //         <div className="text-sm text-red-600 font-medium text-center">
// // //           Could not load preview
// // //         </div>
// // //         <div className="text-xs text-red-500 mt-1">
// // //           {errorType || 'Unknown error'}
// // //         </div>
// // //       </div>
// // //     );
// // //   };


// // //   const renderFilePreview = (file) => {
// // //     const rotation = fileRotations[file.id] || 0;

// // //     if (file.type === "application/pdf") {
// // //       return (
// // //         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
// // //           <Document
// // //             file={file.file}
// // //             onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
// // //             loading={
// // //               <div className="flex items-center justify-center">
// // //                 <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
// // //               </div>
// // //             }
// // //             error={<CustomErrorComponent />}
// // //             className="w-full h-full flex items-center justify-center"
// // //           >
// // //             <div style={{ transform: `rotate(${rotation}deg)` }}>
// // //               <Page
// // //                 pageNumber={1}
// // //                 width={180}
// // //                 renderTextLayer={false}
// // //                 renderAnnotationLayer={false}
// // //                 className="border border-gray-200 shadow-sm"
// // //               />
// // //             </div>
// // //           </Document>

// // //           {pdfPages[file.id] && (
// // //             <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
// // //               {pdfPages[file.id]} pages
// // //             </div>
// // //           )}
// // //         </div>
// // //       );
// // //     }

// // //     // Fallback for non-PDF files
// // //     return (
// // //       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
// // //         <FileText className="w-16 h-16 text-gray-400" />
// // //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
// // //           {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
// // //         </div>
// // //       </div>
// // //     );
// // //   };


// // //   // const renderFilePreview = (file) => {
// // //   //   const rotation = fileRotations[file.id] || 0

// // //   //   if (file.type === "application/pdf") {
// // //   //     return (
// // //   //       <div className="w-full h-full relative">
// // //   //         <Document
// // //   //           file={file.file}
// // //   //           onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
// // //   //           loading={
// // //   //             <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
// // //   //               <FileText className="w-12 h-12 text-red-400 animate-pulse" />
// // //   //             </div>
// // //   //           }
// // //   //           error={
// // //   //             <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
// // //   //               <FileText className="w-12 h-12 text-red-400" />
// // //   //               <div className="absolute bottom-2 left-2 text-xs text-red-600 font-semibold">PDF</div>
// // //   //             </div>
// // //   //           }
// // //   //         >
// // //   //           <Page
// // //   //             pageNumber={1}
// // //   //             scale={0.8}
// // //   //             renderTextLayer={false}
// // //   //             renderAnnotationLayer={false}
// // //   //             className="pdf-preview-page"
// // //   //             style={{
// // //   //               transform: `rotate(${rotation}deg)`,
// // //   //               maxWidth: "100%",
// // //   //               height: "auto",
// // //   //             }}
// // //   //           />
// // //   //         </Document>
// // //   //         {pdfPages[file.id] && (
// // //   //           <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
// // //   //             {pdfPages[file.id]} pages
// // //   //           </div>
// // //   //         )}
// // //   //       </div>
// // //   //     )
// // //   //   } else if (file.type.startsWith("image/")) {
// // //   //     return (
// // //   //       <img
// // //   //         src={file.preview || "/placeholder.svg"}
// // //   //         alt={file.name}
// // //   //         className="w-full h-full object-cover rounded-lg"
// // //   //         style={{ transform: `rotate(${rotation}deg)` }}
// // //   //       />
// // //   //     )
// // //   //   } else if (file.type.includes("powerpoint") || file.type.includes("presentation")) {
// // //   //     return (
// // //   //       <div
// // //   //         className="w-full h-full bg-orange-50 flex items-center justify-center rounded-lg"
// // //   //         style={{ transform: `rotate(${rotation}deg)` }}
// // //   //       >
// // //   //         <FileText className="w-16 h-16 text-orange-400" />
// // //   //         <div className="absolute bottom-2 left-2 text-xs text-orange-600 font-semibold">PPT</div>
// // //   //       </div>
// // //   //     )
// // //   //   } else if (file.type.includes("xml")) {
// // //   //     return (
// // //   //       <div
// // //   //         className="w-full h-full bg-green-50 flex items-center justify-center rounded-lg"
// // //   //         style={{ transform: `rotate(${rotation}deg)` }}
// // //   //       >
// // //   //         <FileText className="w-16 h-16 text-green-400" />
// // //   //         <div className="absolute bottom-2 left-2 text-xs text-green-600 font-semibold">XML</div>
// // //   //       </div>
// // //   //     )
// // //   //   } else {
// // //   //     return (
// // //   //       <div
// // //   //         className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg"
// // //   //         style={{ transform: `rotate(${rotation}deg)` }}
// // //   //       >
// // //   //         <FileText className="w-16 h-16 text-gray-400" />
// // //   //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">FILE</div>
// // //   //       </div>
// // //   //     )
// // //   //   }
// // //   // };

// // //   // Custom drag and drop handlers
// // //   const handleDragStart = (e, file, index) => {
// // //     // Store the dragged file and its index
// // //     setDraggedFile({ file, index })

// // //     // Create a ghost image for dragging
// // //     const ghostElement = document.createElement("div")
// // //     ghostElement.classList.add("ghost-element")
// // //     ghostElement.innerHTML = `<div class="p-2 bg-white rounded shadow-lg border border-red-500">
// // //       <div class="flex items-center gap-2">
// // //         <div class="w-4 h-4 text-red-500">⚡</div>
// // //         <span class="text-sm font-medium">${file.name}</span>
// // //       </div>
// // //     </div>`
// // //     document.body.appendChild(ghostElement)
// // //     ghostElement.style.position = "absolute"
// // //     ghostElement.style.top = "-1000px"
// // //     ghostElement.style.opacity = "0"

// // //     e.dataTransfer.setDragImage(ghostElement, 20, 20)

// // //     // Clean up the ghost element after a short delay
// // //     setTimeout(() => {
// // //       document.body.removeChild(ghostElement)
// // //     }, 100)
// // //   }

// // //   const handleDragOver = (e, index) => {
// // //     e.preventDefault()
// // //     if (draggedFile && draggedFile.index !== index) {
// // //       setDragOverIndex(index)
// // //     }
// // //   }

// // //   const handleDragLeave = () => {
// // //     setDragOverIndex(null)
// // //   }

// // //   const handleDrop = (e, index) => {
// // //     e.preventDefault()

// // //     if (!draggedFile || draggedFile.index === index) {
// // //       setDragOverIndex(null)
// // //       setDraggedFile(null)
// // //       return
// // //     }

// // //     // Create a new array with the file moved to the new position
// // //     const newFiles = [...files]
// // //     const [movedFile] = newFiles.splice(draggedFile.index, 1)
// // //     newFiles.splice(index, 0, movedFile)

// // //     setFiles(newFiles)
// // //     setDragOverIndex(null)
// // //     setDraggedFile(null)
// // //   }

// // //   const handleDragEnd = () => {
// // //     setDragOverIndex(null)
// // //     setDraggedFile(null)
// // //   }

// // //   const handleMerge = async () => {
// // //     if (files.length < 2) return

// // //     setIsUploading(true)
// // //     setUploadProgress(0)

// // //     const interval = setInterval(() => {
// // //       setUploadProgress((prev) => {
// // //         if (prev >= 100) {
// // //           clearInterval(interval)
// // //           setTimeout(() => {
// // //             router.push("/downloads/merged-pdf-" + Date.now())
// // //           }, 1000)
// // //           return 100
// // //         }
// // //         return prev + 10
// // //       })
// // //     }, 200)
// // //   }

// // //   if (isUploading) {
// // //     return <ProgressScreen uploadProgress={uploadProgress} />
// // //   }

// // //   if (files.length === 0) {
// // //     return (
// // //       <FileUploader
// // //         isMultiple={true}
// // //         onFilesSelect={handleFiles}
// // //         isDragOver={isDragOver}
// // //         setIsDragOver={setIsDragOver}
// // //         allowedTypes={[".pdf"]}
// // //         showFiles={false}
// // //         uploadButtonText="Select PDF files"
// // //       />
// // //     )
// // //   }

// // //   return (
// // //     <div className="md:h-[calc(100vh-82px)]">
// // //       <div className="grid grid-cols-10 border h-full">
// // //         {/* Main Content */}
// // //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// // //           <div className="flex items-center justify-between mb-6">
// // //             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

// // //             <FileUploader
// // //               isMultiple={true}
// // //               onFilesSelect={handleFiles}
// // //               isDragOver={isDragOver}
// // //               setIsDragOver={setIsDragOver}
// // //               allowedTypes={[".pdf"]}
// // //               showFiles={true}
// // //               onSort={sortFilesByName}
// // //               selectedCount={files?.length}
// // //             />
// // //           </div>

// // //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
// // //             {files.map((file, index) => (
// // //               <div
// // //                 key={file.id}
// // //                 ref={(el) => (fileRefs.current[file.id] = el)}
// // //                 className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative ${dragOverIndex === index
// // //                   ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
// // //                   : draggedFile?.file.id === file.id
// // //                     ? "border-red-500 opacity-50"
// // //                     : "border-gray-200 hover:border-red-300 hover:shadow-lg"
// // //                   }`}
// // //                 draggable="true"
// // //                 onDragStart={(e) => handleDragStart(e, file, index)}
// // //                 onDragOver={(e) => handleDragOver(e, index)}
// // //                 onDragLeave={handleDragLeave}
// // //                 onDrop={(e) => handleDrop(e, index)}
// // //                 onDragEnd={handleDragEnd}
// // //               >
// // //                 {/* File Preview Area */}
// // //                 <div className="relative h-56 p-3 pt-10">
// // //                   <div className="w-full h-full relative overflow-hidden rounded-lg">{renderFilePreview(file)}</div>

// // //                   {/* Action Buttons */}
// // //                   <div className="absolute top-1 right-2 flex gap-1 z-30">
// // //                     <button
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         rotateFile(file.id)
// // //                       }}
// // //                       className="w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // //                       title="Rotate file"
// // //                     >
// // //                       <RotateCw className="w-4 h-4 text-gray-600" />
// // //                     </button>
// // //                     <button
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         removeFile(file.id)
// // //                       }}
// // //                       className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // //                       title="Remove file"
// // //                     >
// // //                       <X className="w-4 h-4 text-red-500" />
// // //                     </button>
// // //                   </div>

// // //                   {/* Page Number */}
// // //                   {/* <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-30">
// // //                     #{index + 1}
// // //                   </div> */}

// // //                   {/* Drag Handle */}
// // //                   <div className="absolute inset-0 cursor-grab active:cursor-grabbing z-20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
// // //                     <div className="bg-black/30 text-white rounded-full p-2">
// // //                       <Move className="w-5 h-5" />
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 {/* File Info Footer */}
// // //                 <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
// // //                   <div>
// // //                     <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
// // //                       {file.name}
// // //                     </p>
// // //                     <p className="text-xs text-gray-500 mt-1">{file.size}</p>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </div>

// // //         {/* Sidebar */}
// // //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// // //           <div className="p-6">
// // //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// // //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// // //               <p className="text-sm text-blue-800">
// // //                 Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
// // //               </p>
// // //             </div>
// // //           </div>

// // //           <div className="p-6 border">
// // //             <div className="space-y-4 mb-6">
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Files selected:</span>
// // //                 <span className="font-semibold text-gray-900">{files.length}</span>
// // //               </div>
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Total size:</span>
// // //                 <span className="font-semibold text-gray-900">
// // //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// // //                 </span>
// // //               </div>
// // //             </div>

// // //             <button
// // //               onClick={handleMerge}
// // //               disabled={files.length < 2}
// // //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// // //                 ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// // //                 : "bg-gray-300 cursor-not-allowed"
// // //                 }`}
// // //             >
// // //               Merge PDF
// // //               <ArrowRight className="w-5 h-5" />
// // //             </button>

// // //             {files.length < 2 && (
// // //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <style jsx>{`
// // //         .pdf-preview-page canvas {
// // //           border-radius: 8px;
// // //           max-width: 100% !important;
// // //           height: auto !important;
// // //         }
        
// // //         .pdf-preview-page > div {
// // //           display: flex !important;
// // //           justify-content: center !important;
// // //           align-items: center !important;
// // //         }
// // //       `}</style>
// // //     </div>
// // //   )
// // // }

// // // // "use client"

// // // // import { useState, useRef } from "react"
// // // // import { useRouter } from "next/navigation"
// // // // import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
// // // // import { Document, Page, pdfjs } from "react-pdf"
// // // // import ProgressScreen from "@/components/tools/ProgressScreen"
// // // // import FileUploader from "@/components/tools/FileUploader"
// // // // import FileViewer from 'react-file-viewer';
// // // // import { motion } from "framer-motion"

// // // // // PDF.js worker setup
// // // // pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// // // // export default function MergePDFPage() {
// // // //   const [files, setFiles] = useState([])
// // // //   const [isDragOver, setIsDragOver] = useState(false)
// // // //   const [isUploading, setIsUploading] = useState(false)
// // // //   const [uploadProgress, setUploadProgress] = useState(0)
// // // //   const [fileRotations, setFileRotations] = useState({})
// // // //   const [pdfPages, setPdfPages] = useState({})
// // // //   const [draggedFile, setDraggedFile] = useState(null)
// // // //   const [dragOverIndex, setDragOverIndex] = useState(null)
// // // //   const fileRefs = useRef({})
// // // //   const router = useRouter()

// // // //   const handleFiles = (newFiles) => {
// // // //     const fileObjects = newFiles.map((file, index) => ({
// // // //       id: Date.now() + index + Math.random(),
// // // //       file,
// // // //       name: file.name,
// // // //       size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// // // //       preview: URL.createObjectURL(file),
// // // //       type: file.type,
// // // //     }))
// // // //     setFiles((prev) => [...prev, ...fileObjects])
// // // //   }

// // // //   const removeFile = (id) => {
// // // //     setFiles((prev) => prev.filter((file) => file.id !== id))
// // // //     setFileRotations((prev) => {
// // // //       const newRotations = { ...prev }
// // // //       delete newRotations[id]
// // // //       return newRotations
// // // //     })
// // // //     setPdfPages((prev) => {
// // // //       const newPages = { ...prev }
// // // //       delete newPages[id]
// // // //       return newPages
// // // //     })
// // // //   }

// // // //   const rotateFile = (id) => {
// // // //     setFileRotations((prev) => ({
// // // //       ...prev,
// // // //       [id]: ((prev[id] || 0) + 90) % 360,
// // // //     }))
// // // //   }

// // // //   const sortFilesByName = (order = "asc") => {
// // // //     setFiles((prev) => {
// // // //       const sorted = [...prev].sort((a, b) => {
// // // //         if (order === "asc") {
// // // //           return a.name.localeCompare(b.name)
// // // //         } else {
// // // //           return b.name.localeCompare(a.name)
// // // //         }
// // // //       })
// // // //       return sorted
// // // //     })
// // // //   }

// // // //   const onDocumentLoadSuccess = (pdf, fileId) => {
// // // //     setPdfPages((prev) => ({
// // // //       ...prev,
// // // //       [fileId]: pdf.numPages,
// // // //     }))
// // // //   }

// // // //   const CustomErrorComponent = ({ errorType, ...otherProps }) => {
// // // //     return (
// // // //       <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
// // // //         <FileText className="w-16 h-16 text-red-400" />
// // // //         <div className="absolute bottom-2 left-2 text-xs text-red-600 font-semibold">
// // // //           Error loading file
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   };

// // // //   // Function to get file extension from file name or mime type
// // // //   const getFileExtension = (file) => {
// // // //     if (file.name) {
// // // //       return file.name.split('.').pop().toLowerCase();
// // // //     }

// // // //     // Fallback: derive extension from mime type
// // // //     const mimeTypeMap = {
// // // //       'application/pdf': 'pdf',
// // // //       'image/jpeg': 'jpg',
// // // //       'image/png': 'png',
// // // //       'image/gif': 'gif',
// // // //       'text/plain': 'txt',
// // // //       'application/msword': 'doc',
// // // //       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
// // // //       'application/vnd.ms-excel': 'xls',
// // // //       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
// // // //       'application/vnd.ms-powerpoint': 'ppt',
// // // //       'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
// // // //       'text/csv': 'csv',
// // // //       'application/json': 'json',
// // // //       'text/xml': 'xml',
// // // //       'application/xml': 'xml'
// // // //     };

// // // //     return mimeTypeMap[file.type] || 'unknown';
// // // //   };

// // // //   // Error handler for react-file-viewer
// // // //   const onError = (e) => {
// // // //     console.log('File viewer error:', e);
// // // //   };

// // // //   const renderFilePreview = (file) => {
// // // //     const rotation = fileRotations[file.id] || 0;
// // // //     const fileExtension = getFileExtension(file);

// // // //     return (
// // // //       <div
// // // //         className="w-full h-full relative"
// // // //         style={{ transform: `rotate(${rotation}deg)` }}
// // // //       >
// // // //         <FileViewer
// // // //           fileType={fileExtension}
// // // //           filePath={file.preview || URL.createObjectURL(file.file)}
// // // //           errorComponent={CustomErrorComponent}
// // // //           onError={onError}
// // // //           width="100%"
// // // //           height="100%"
// // // //         />
// // // //       </div>
// // // //     );
// // // //   };

// // // //   // Custom drag and drop handlers
// // // //   const handleDragStart = (e, file, index) => {
// // // //     // Store the dragged file and its index
// // // //     setDraggedFile({ file, index })

// // // //     // Create a ghost image for dragging
// // // //     const ghostElement = document.createElement("div")
// // // //     ghostElement.classList.add("ghost-element")
// // // //     ghostElement.innerHTML = `<div class="p-2 bg-white rounded shadow-lg border border-red-500">
// // // //       <div class="flex items-center gap-2">
// // // //         <Move class="w-4 h-4 text-red-500" />
// // // //         <span class="text-sm font-medium">${file.name}</span>
// // // //       </div>
// // // //     </div>`
// // // //     document.body.appendChild(ghostElement)
// // // //     ghostElement.style.position = "absolute"
// // // //     ghostElement.style.top = "-1000px"
// // // //     ghostElement.style.opacity = "0"

// // // //     e.dataTransfer.setDragImage(ghostElement, 20, 20)

// // // //     // Clean up the ghost element after a short delay
// // // //     setTimeout(() => {
// // // //       document.body.removeChild(ghostElement)
// // // //     }, 100)
// // // //   }

// // // //   const handleDragOver = (e, index) => {
// // // //     e.preventDefault()
// // // //     if (draggedFile && draggedFile.index !== index) {
// // // //       setDragOverIndex(index)
// // // //     }
// // // //   }

// // // //   const handleDragLeave = () => {
// // // //     setDragOverIndex(null)
// // // //   }

// // // //   const handleDrop = (e, index) => {
// // // //     e.preventDefault()

// // // //     if (!draggedFile || draggedFile.index === index) {
// // // //       setDragOverIndex(null)
// // // //       setDraggedFile(null)
// // // //       return
// // // //     }

// // // //     // Create a new array with the file moved to the new position
// // // //     const newFiles = [...files]
// // // //     const [movedFile] = newFiles.splice(draggedFile.index, 1)
// // // //     newFiles.splice(index, 0, movedFile)

// // // //     setFiles(newFiles)
// // // //     setDragOverIndex(null)
// // // //     setDraggedFile(null)
// // // //   }

// // // //   const handleDragEnd = () => {
// // // //     setDragOverIndex(null)
// // // //     setDraggedFile(null)
// // // //   }

// // // //   const handleMerge = async () => {
// // // //     if (files.length < 2) return

// // // //     setIsUploading(true)
// // // //     setUploadProgress(0)

// // // //     const interval = setInterval(() => {
// // // //       setUploadProgress((prev) => {
// // // //         if (prev >= 100) {
// // // //           clearInterval(interval)
// // // //           setTimeout(() => {
// // // //             router.push("/downloads/merged-pdf-" + Date.now())
// // // //           }, 1000)
// // // //           return 100
// // // //         }
// // // //         return prev + 10
// // // //       })
// // // //     }, 200)
// // // //   }

// // // //   if (isUploading) {
// // // //     return <ProgressScreen uploadProgress={uploadProgress} />
// // // //   }

// // // //   if (files.length === 0) {
// // // //     return (
// // // //       <FileUploader
// // // //         isMultiple={true}
// // // //         onFilesSelect={handleFiles}
// // // //         isDragOver={isDragOver}
// // // //         setIsDragOver={setIsDragOver}
// // // //         allowedTypes={[".pdf"]}
// // // //         showFiles={false}
// // // //         uploadButtonText="Select PDF files"
// // // //       />
// // // //     )
// // // //   }

// // // //   return (
// // // //     <div className="md:h-[calc(100vh-82px)]">
// // // //       <div className="grid grid-cols-10 border h-full">
// // // //         {/* Main Content */}
// // // //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// // // //           <div className="flex items-center justify-between mb-6">
// // // //             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

// // // //             <FileUploader
// // // //               isMultiple={true}
// // // //               onFilesSelect={handleFiles}
// // // //               isDragOver={isDragOver}
// // // //               setIsDragOver={setIsDragOver}
// // // //               allowedTypes={[".pdf"]}
// // // //               showFiles={true}
// // // //               onSort={sortFilesByName}
// // // //               selectedCount={files?.length}
// // // //             />
// // // //           </div>

// // // //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
// // // //             {files.map((file, index) => (
// // // //               <div
// // // //                 key={file.id}
// // // //                 ref={(el) => (fileRefs.current[file.id] = el)}
// // // //                 className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative ${dragOverIndex === index
// // // //                     ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
// // // //                     : draggedFile?.file.id === file.id
// // // //                       ? "border-red-500 opacity-50"
// // // //                       : "border-gray-200 hover:border-red-300 hover:shadow-lg"
// // // //                   }`}
// // // //                 draggable="true"
// // // //                 onDragStart={(e) => handleDragStart(e, file, index)}
// // // //                 onDragOver={(e) => handleDragOver(e, index)}
// // // //                 onDragLeave={handleDragLeave}
// // // //                 onDrop={(e) => handleDrop(e, index)}
// // // //                 onDragEnd={handleDragEnd}
// // // //               >
// // // //                 {/* File Preview Area */}
// // // //                 <div className="relative h-56 p-3 pt-10">
// // // //                   <div className="w-full h-full relative overflow-hidden rounded-lg">{renderFilePreview(file)}</div>

// // // //                   {/* Action Buttons */}
// // // //                   <div className="absolute top-1 right-2 flex gap-1 z-30">
// // // //                     <button
// // // //                       onClick={(e) => {
// // // //                         e.stopPropagation()
// // // //                         rotateFile(file.id)
// // // //                       }}
// // // //                       className="w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // // //                       title="Rotate file"
// // // //                     >
// // // //                       <RotateCw className="w-4 h-4 text-gray-600" />
// // // //                     </button>
// // // //                     <button
// // // //                       onClick={(e) => {
// // // //                         e.stopPropagation()
// // // //                         removeFile(file.id)
// // // //                       }}
// // // //                       className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // // //                       title="Remove file"
// // // //                     >
// // // //                       <X className="w-4 h-4 text-red-500" />
// // // //                     </button>
// // // //                   </div>

// // // //                   {/* Page Number */}
// // // //                   {/* <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-30">
// // // //                     #{index + 1}
// // // //                   </div> */}

// // // //                   {/* Drag Handle */}
// // // //                   <div className="absolute inset-0 cursor-grab active:cursor-grabbing z-20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
// // // //                     <div className="bg-black/30 text-white rounded-full p-2">
// // // //                       <Move className="w-5 h-5" />
// // // //                     </div>
// // // //                   </div>
// // // //                 </div>

// // // //                 {/* File Info Footer */}
// // // //                 <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
// // // //                   <div>
// // // //                     <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
// // // //                       {file.name}
// // // //                     </p>
// // // //                     <p className="text-xs text-gray-500 mt-1">{file.size}</p>
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         </div>

// // // //         {/* Sidebar */}
// // // //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// // // //           <div className="p-6">
// // // //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// // // //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// // // //               <p className="text-sm text-blue-800">
// // // //                 Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
// // // //               </p>
// // // //             </div>
// // // //           </div>

// // // //           <div className="p-6 border">
// // // //             <div className="space-y-4 mb-6">
// // // //               <div className="flex items-center justify-between text-sm">
// // // //                 <span className="text-gray-600">Files selected:</span>
// // // //                 <span className="font-semibold text-gray-900">{files.length}</span>
// // // //               </div>
// // // //               <div className="flex items-center justify-between text-sm">
// // // //                 <span className="text-gray-600">Total size:</span>
// // // //                 <span className="font-semibold text-gray-900">
// // // //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// // // //                 </span>
// // // //               </div>
// // // //             </div>

// // // //             <button
// // // //               onClick={handleMerge}
// // // //               disabled={files.length < 2}
// // // //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// // // //                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// // // //                   : "bg-gray-300 cursor-not-allowed"
// // // //                 }`}
// // // //             >
// // // //               Merge PDF
// // // //               <ArrowRight className="w-5 h-5" />
// // // //             </button>

// // // //             {files.length < 2 && (
// // // //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// // // //             )}
// // // //           </div>
// // // //         </div>
// // // //       </div>

// // // //       <style jsx>{`
// // // //         .pdf-preview-page canvas {
// // // //           border-radius: 8px;
// // // //           max-width: 100% !important;
// // // //           height: auto !important;
// // // //         }
        
// // // //         .pdf-preview-page > div {
// // // //           display: flex !important;
// // // //           justify-content: center !important;
// // // //           align-items: center !important;
// // // //         }
// // // //       `}</style>
// // // //     </div>
// // // //   )
// // // // }





// // // "use client"

// // // import { useState, useRef } from "react"
// // // import { useRouter } from "next/navigation"
// // // import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
// // // import { Document, Page, pdfjs } from "react-pdf"
// // // import ProgressScreen from "@/components/tools/ProgressScreen"
// // // import FileUploader from "@/components/tools/FileUploader"

// // // // PDF.js worker setup
// // // pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


// // // export default function MergePDFPage() {
// // //   const [files, setFiles] = useState([])
// // //   const [isDragOver, setIsDragOver] = useState(false)
// // //   const [isUploading, setIsUploading] = useState(false)
// // //   const [uploadProgress, setUploadProgress] = useState(0)
// // //   const [fileRotations, setFileRotations] = useState({})
// // //   const [pdfPages, setPdfPages] = useState({})
// // //   const [draggedFile, setDraggedFile] = useState(null)
// // //   const [dragOverIndex, setDragOverIndex] = useState(null)
// // //   const fileRefs = useRef({})
// // //   const router = useRouter()

// // //   const handleFiles = (newFiles) => {
// // //     const fileObjects = newFiles.map((file, index) => {
// // //       const blobUrl = URL.createObjectURL(file)
// // //       return {
// // //         id: Date.now() + index + Math.random(),
// // //         file: file,
// // //         name: file.name,
// // //         size: (file.size / 1024 / 1024).toFixed(2) + " MB",
// // //         preview: blobUrl,
// // //         type: file.type,
// // //       }
// // //     })
// // //     setFiles((prev) => [...prev, ...fileObjects])
// // //   }

// // //   const removeFile = (id) => {
// // //     setFiles((prev) => prev.filter((file) => file.id !== id))
// // //     setFileRotations((prev) => {
// // //       const newRotations = { ...prev }
// // //       delete newRotations[id]
// // //       return newRotations
// // //     })
// // //     setPdfPages((prev) => {
// // //       const newPages = { ...prev }
// // //       delete newPages[id]
// // //       return newPages
// // //     })
// // //   }

// // //   const rotateFile = (id) => {
// // //     setFileRotations((prev) => ({
// // //       ...prev,
// // //       [id]: ((prev[id] || 0) + 90) % 360,
// // //     }))
// // //   }

// // //   const sortFilesByName = (order = "asc") => {
// // //     setFiles((prev) => {
// // //       const sorted = [...prev].sort((a, b) => {
// // //         if (order === "asc") {
// // //           return a.name.localeCompare(b.name)
// // //         } else {
// // //           return b.name.localeCompare(a.name)
// // //         }
// // //       })
// // //       return sorted
// // //     })
// // //   }

// // //   const onDocumentLoadSuccess = (pdf, fileId) => {
// // //     setPdfPages((prev) => ({
// // //       ...prev,
// // //       [fileId]: pdf.numPages,
// // //     }))
// // //   }

// // //   const CustomErrorComponent = ({ errorType, ...otherProps }) => {
// // //     return (
// // //       <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
// // //         <FileText className="w-12 h-12 text-red-400 mb-2" />
// // //         <div className="text-sm text-red-600 font-medium text-center">
// // //           Could not load preview
// // //         </div>
// // //         <div className="text-xs text-red-500 mt-1">
// // //           {errorType || 'Unknown error'}
// // //         </div>
// // //       </div>
// // //     );
// // //   };

// // //   const renderFilePreview = (file) => {
// // //     const rotation = fileRotations[file.id] || 0;

// // //     if (file.type === "application/pdf") {
// // //       return (
// // //         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
// // //           <Document
// // //             file={file.file}
// // //             onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, file.id)}
// // //             loading={
// // //               <div className="flex items-center justify-center">
// // //                 <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
// // //               </div>
// // //             }
// // //             error={<CustomErrorComponent />}
// // //             className="w-full h-full flex items-center justify-center"
// // //           >
// // //             <div style={{ transform: `rotate(${rotation}deg)` }}>
// // //               <Page
// // //                 pageNumber={1}
// // //                 width={180}
// // //                 renderTextLayer={false}
// // //                 renderAnnotationLayer={false}
// // //                 className="border border-gray-200 shadow-sm"
// // //               />
// // //             </div>
// // //           </Document>

// // //           {pdfPages[file.id] && (
// // //             <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
// // //               {pdfPages[file.id]} pages
// // //             </div>
// // //           )}
// // //         </div>
// // //       );
// // //     }

// // //     // Fallback for non-PDF files
// // //     return (
// // //       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
// // //         <FileText className="w-16 h-16 text-gray-400" />
// // //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
// // //           {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
// // //         </div>
// // //       </div>
// // //     );
// // //   };

// // //   // Custom drag and drop handlers
// // //   const handleDragStart = (e, file, index) => {
// // //     setDraggedFile({ file, index })

// // //     // Create a ghost image for dragging
// // //     const ghostElement = document.createElement("div")
// // //     ghostElement.classList.add("ghost-element")
// // //     ghostElement.innerHTML = `<div class="p-2 bg-white rounded shadow-lg border border-red-500">
// // //       <div class="flex items-center gap-2">
// // //         <div class="w-4 h-4 text-red-500">⚡</div>
// // //         <span class="text-sm font-medium">${file.name}</span>
// // //       </div>
// // //     </div>`
// // //     document.body.appendChild(ghostElement)
// // //     ghostElement.style.position = "absolute"
// // //     ghostElement.style.top = "-1000px"
// // //     ghostElement.style.opacity = "0"

// // //     e.dataTransfer.setDragImage(ghostElement, 20, 20)

// // //     // Clean up the ghost element after a short delay
// // //     setTimeout(() => {
// // //       if (document.body.contains(ghostElement)) {
// // //         document.body.removeChild(ghostElement)
// // //       }
// // //     }, 100)
// // //   }

// // //   const handleDragOver = (e, index) => {
// // //     e.preventDefault()
// // //     if (draggedFile && draggedFile.index !== index) {
// // //       setDragOverIndex(index)
// // //     }
// // //   }

// // //   const handleDragLeave = () => {
// // //     setDragOverIndex(null)
// // //   }

// // //   const handleDrop = (e, index) => {
// // //     e.preventDefault()

// // //     if (!draggedFile || draggedFile.index === index) {
// // //       setDragOverIndex(null)
// // //       setDraggedFile(null)
// // //       return
// // //     }

// // //     // Create a new array with the file moved to the new position
// // //     const newFiles = [...files]
// // //     const [movedFile] = newFiles.splice(draggedFile.index, 1)
// // //     newFiles.splice(index, 0, movedFile)

// // //     setFiles(newFiles)
// // //     setDragOverIndex(null)
// // //     setDraggedFile(null)
// // //   }

// // //   const handleDragEnd = () => {
// // //     setDragOverIndex(null)
// // //     setDraggedFile(null)
// // //   }

// // //   const handleMerge = async () => {
// // //     if (files.length < 2) return

// // //     setIsUploading(true)
// // //     setUploadProgress(0)

// // //     const interval = setInterval(() => {
// // //       setUploadProgress((prev) => {
// // //         if (prev >= 100) {
// // //           clearInterval(interval)
// // //           setTimeout(() => {
// // //             router.push("/downloads/merged-pdf-" + Date.now())
// // //           }, 1000)
// // //           return 100
// // //         }
// // //         return prev + 10
// // //       })
// // //     }, 200)
// // //   }

// // //   if (isUploading) {
// // //     return <ProgressScreen uploadProgress={uploadProgress} />
// // //   }

// // //   if (files.length === 0) {
// // //     return (
// // //       <FileUploader
// // //         isMultiple={true}
// // //         onFilesSelect={handleFiles}
// // //         isDragOver={isDragOver}
// // //         setIsDragOver={setIsDragOver}
// // //         allowedTypes={[".pdf"]}
// // //         showFiles={false}
// // //         uploadButtonText="Select PDF files"
// // //       />
// // //     )
// // //   }

// // //   return (
// // //     <div className="md:h-[calc(100vh-82px)]">
// // //       <div className="grid grid-cols-10 border h-full">
// // //         {/* Main Content */}
// // //         <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
// // //           <div className="flex items-center justify-between mb-6">
// // //             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>

// // //             <FileUploader
// // //               isMultiple={true}
// // //               onFilesSelect={handleFiles}
// // //               isDragOver={isDragOver}
// // //               setIsDragOver={setIsDragOver}
// // //               allowedTypes={[".pdf"]}
// // //               showFiles={true}
// // //               onSort={sortFilesByName}
// // //               selectedCount={files?.length}
// // //             />
// // //           </div>

// // //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
// // //             {files.map((file, index) => (
// // //               <div
// // //                 key={file.id}
// // //                 ref={(el) => (fileRefs.current[file.id] = el)}
// // //                 className={`bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden relative cursor-grab active:cursor-grabbing ${dragOverIndex === index
// // //                     ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
// // //                     : draggedFile?.file.id === file.id
// // //                       ? "border-red-500 opacity-50"
// // //                       : "border-gray-200 hover:border-red-300 hover:shadow-lg"
// // //                   }`}
// // //                 draggable="true"
// // //                 onDragStart={(e) => handleDragStart(e, file, index)}
// // //                 onDragOver={(e) => handleDragOver(e, index)}
// // //                 onDragLeave={handleDragLeave}
// // //                 onDrop={(e) => handleDrop(e, index)}
// // //                 onDragEnd={handleDragEnd}
// // //               >
// // //                 {/* File Preview Area */}
// // //                 <div className="relative h-56 p-3 pt-10">
// // //                   <div className="w-full h-full relative overflow-hidden rounded-lg">
// // //                     {renderFilePreview(file)}
// // //                   </div>

// // //                   {/* Action Buttons */}
// // //                   <div className="absolute top-1 right-2 flex gap-1 z-30">
// // //                     <button
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         rotateFile(file.id)
// // //                       }}
// // //                       className="w-8 h-8 border bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // //                       title="Rotate file"
// // //                     >
// // //                       <RotateCw className="w-4 h-4 text-gray-600" />
// // //                     </button>
// // //                     <button
// // //                       onClick={(e) => {
// // //                         e.stopPropagation()
// // //                         removeFile(file.id)
// // //                       }}
// // //                       className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
// // //                       title="Remove file"
// // //                     >
// // //                       <X className="w-4 h-4 text-red-500" />
// // //                     </button>
// // //                   </div>

// // //                   {/* Drag Handle */}
// // //                   <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
// // //                     <div className="bg-black/30 text-white rounded-full p-2">
// // //                       <Move className="w-5 h-5" />
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 {/* File Info Footer */}
// // //                 <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
// // //                   <div>
// // //                     <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
// // //                       {file.name}
// // //                     </p>
// // //                     <p className="text-xs text-gray-500 mt-1">{file.size}</p>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </div>

// // //         {/* Sidebar */}
// // //         <div className="col-span-3 overflow-y-auto border-l flex flex-col justify-between">
// // //           <div className="p-6">
// // //             <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Merge PDF</h3>

// // //             <div className="bg-blue-50 rounded-xl p-4 mb-6">
// // //               <p className="text-sm text-blue-800">
// // //                 Drag any file to reorder. The files will merge in the order shown. Works with 50+ files.
// // //               </p>
// // //             </div>
// // //           </div>

// // //           <div className="p-6 border">
// // //             <div className="space-y-4 mb-6">
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Files selected:</span>
// // //                 <span className="font-semibold text-gray-900">{files.length}</span>
// // //               </div>
// // //               <div className="flex items-center justify-between text-sm">
// // //                 <span className="text-gray-600">Total size:</span>
// // //                 <span className="font-semibold text-gray-900">
// // //                   {files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2)} MB
// // //                 </span>
// // //               </div>
// // //             </div>

// // //             <button
// // //               onClick={handleMerge}
// // //               disabled={files.length < 2}
// // //               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length >= 2
// // //                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
// // //                   : "bg-gray-300 cursor-not-allowed"
// // //                 }`}
// // //             >
// // //               Merge PDF
// // //               <ArrowRight className="w-5 h-5" />
// // //             </button>

// // //             {files.length < 2 && (
// // //               <p className="text-xs text-gray-500 text-center mt-2">Select at least 2 PDF files to merge</p>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>

// // //       <style jsx>{`
// // //         .pdf-preview-page canvas {
// // //           border-radius: 8px;
// // //           max-width: 100% !important;
// // //           height: auto !important;
// // //         }
        
// // //         .pdf-preview-page > div {
// // //           display: flex !important;
// // //           justify-content: center !important;
// // //           align-items: center !important;
// // //         }
// // //       `}</style>
// // //     </div>
// // //   )
// // // }