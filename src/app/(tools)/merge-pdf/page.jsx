"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, RotateCw, Move } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Memoized PDF Preview Component
const PDFPreview = memo(({ file, rotation, isLoading, onLoadSuccess, onLoadError, onRotate, onRemove, displayIndex, isHealthy, isDragging, isDragOver }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)
  const elementRef = useRef(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

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
    if (!isVisible || hasError || !isHealthy) {
      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
          <FileText className="w-16 h-16 text-gray-400" />
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
            PDF
          </div>
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
              key={`pdf-${file.id}-${rotation}`}
              file={file.stableData.dataUrl}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={
                <div className="flex items-center justify-center">
                  <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              }
              error={
                <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
                  <FileText className="w-12 h-12 text-red-400 mb-2" />
                  <div className="text-sm text-red-600 font-medium text-center">
                    Could not load preview
                  </div>
                </div>
              }
              className="w-full h-full flex items-center justify-center border"
              options={{
                // Reduce quality for better performance
                cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                cMapPacked: true,
                standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              }}
            >
              <div style={{ transform: `rotate(${rotation}deg)` }}>
                <Page
                  pageNumber={1}
                  width={180}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-200 shadow-sm"
                  loading={
                    <div className="w-[180px] h-[240px] bg-gray-100 flex items-center justify-center">
                      <RotateCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  }
                />
              </div>
            </Document>
          ) : (
            <div className="flex items-center justify-center">
              <RotateCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
          {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative cursor-grab active:cursor-grabbing ${isDragOver
          ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
          : isDragging
            ? "border-red-500 opacity-50"
            : isHealthy
              ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
              : "border-yellow-300 bg-yellow-50"
        }`}
    >
      {/* File Preview Area */}
      <div className="relative h-56 p-3 pt-10">
        <div className="w-full h-full relative overflow-hidden rounded-lg">
          {renderPreview()}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-1 right-2 flex gap-1 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRotate(file.id)
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
              onRemove(file.id)
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
})

PDFPreview.displayName = 'PDFPreview'

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
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})

  const fileRefs = useRef({})
  const fileDataCache = useRef({})
  const pdfDocumentCache = useRef({})
  const router = useRouter()

  // Initialize display order when files change
  useEffect(() => {
    if (files.length > 0 && displayOrder.length !== files.length) {
      setDisplayOrder(files.map((_, index) => index))
    }
  }, [files.length, displayOrder.length])

  // Optimized PDF Health Check - throttled
  const checkPdfHealth = useCallback((fileId) => {
    const element = fileRefs.current[fileId]
    if (!element) return false

    try {
      const pdfDoc = element.querySelector('.react-pdf__Document')
      if (pdfDoc && pdfDoc._pdfDocument) {
        const doc = pdfDoc._pdfDocument
        return doc && !doc.destroyed && doc.loadingTask && !doc.loadingTask.destroyed
      }
    } catch (error) {
      console.warn(`PDF health check failed for ${fileId}:`, error)
      return false
    }
    return true
  }, [])

  // Optimized file data creation with caching
  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) {
      return fileDataCache.current[id]
    }

    try {
      // Use smaller chunks for large files
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Create blob without copying data
      const blob = new Blob([uint8Array], { type: file.type })

      // Use createObjectURL instead of data URL for better performance
      const objectUrl = URL.createObjectURL(blob)

      const stableData = {
        blob,
        dataUrl: objectUrl, // Using object URL instead of data URL
        uint8Array: uint8Array.slice(),
      }

      fileDataCache.current[id] = stableData
      return stableData
    } catch (error) {
      console.error('Error creating stable file data:', error)
      return null
    }
  }, [])

  // Optimized file handling with batching
  const handleFiles = useCallback(async (newFiles) => {
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
  }, [createStableFileData])

  // Optimized remove function with cleanup
  const removeFile = useCallback((id) => {
    // Clean up URL object
    const fileData = fileDataCache.current[id]
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith('blob:')) {
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
        console.warn('PDF cleanup warning:', e)
      }
      delete pdfDocumentCache.current[id]
    }

    setPdfHealthCheck(prev => {
      const newHealth = { ...prev }
      delete newHealth[id]
      return newHealth
    })

    setFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id)
      setDisplayOrder(newFiles.map((_, index) => index))
      return newFiles
    })

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
  }, [])

  // Optimized rotate function
  const rotateFile = useCallback((id) => {
    if (!checkPdfHealth(id)) {
      console.warn('Skipping rotation - PDF not healthy')
      return
    }

    setFileRotations((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 90) % 360,
    }))
  }, [checkPdfHealth])

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
      setDisplayOrder(sorted.map((_, index) => index))
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

    setPdfHealthCheck(prev => ({
      ...prev,
      [fileId]: true
    }))
  }, [])

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })

    setPdfHealthCheck(prev => ({
      ...prev,
      [fileId]: false
    }))
  }, [])

  // Optimized drag handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }, [])

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null)
    }
  }, [])

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null)
      setDraggedIndex(null)
      return
    }

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

    setDisplayOrder(currentOrder => {
      const newOrder = [...currentOrder]
      const [movedItem] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(dropIndex, 0, movedItem)
      return newOrder
    })

    setDragOverIndex(null)
    setDraggedIndex(null)
  }, [draggedIndex, files, displayOrder, pdfHealthCheck])

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null)
    setDraggedIndex(null)
  }, [])

  // Optimized merge function
  const handleMerge = useCallback(async () => {
    if (files.length < 2) return

    const orderedFiles = displayOrder.map(index => files[index])
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()

      orderedFiles.forEach(file => {
        formData.append('files', file.file)
      })

      const rotations = {}
      orderedFiles.forEach(file => {
        rotations[file.name] = fileRotations[file.id] || 0
      })
      formData.append('rotations', JSON.stringify(rotations))

      const response = await Api.post('/tools/merge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        }
      })

      if (response.data) {
        const downloadUrl = `/downloads/document=${response.data.data.mergedFile}?dbTaskId=${response.data.data.dbTaskId}`
        router.push(downloadUrl)
      } else {
        toast.error('No merged file received from server')
      }
    } catch (error) {
      console.error('Merge error:', error)
      toast.error(error?.response?.data?.message || 'Error merging files')
      alert('Failed to merge PDFs. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [files, displayOrder, fileRotations, router])

  // Memoized ordered files
  const orderedFiles = useMemo(() =>
    displayOrder.map(index => files[index]).filter(Boolean),
    [displayOrder, files]
  )

  // Memoized total size calculation
  const totalSize = useMemo(() =>
    files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
    [files]
  )

  // Memoized health check status
  const hasUnhealthyFiles = useMemo(() =>
    Object.values(pdfHealthCheck).some(health => health === false),
    [pdfHealthCheck]
  )

  const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all object URLs
      Object.values(fileDataCache.current).forEach(data => {
        if (data.dataUrl && data.dataUrl.startsWith('blob:')) {
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
        pageTitle="Merge PDF files"
        pageSubTitle="Combine PDFs in the order you want with the easiest PDF merger available."
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
              pageTitle="Merge PDF files"
              pageSubTitle="Combine PDFs in the order you want with the easiest PDF merger available."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orderedFiles.map((file, displayIndex) => (
              <div
                key={`${file.id}-${displayIndex}`}
                ref={(el) => (fileRefs.current[file.id] = el)}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, displayIndex)}
                onDragOver={(e) => handleDragOver(e, displayIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, displayIndex)}
                onDragEnd={handleDragEnd}
              >
                <PDFPreview
                  file={file}
                  rotation={fileRotations[file.id] || 0}
                  isLoading={loadingPdfs.has(file.id)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  onRotate={rotateFile}
                  onRemove={removeFile}
                  displayIndex={displayIndex}
                  isHealthy={pdfHealthCheck[file.id] !== false}
                  isDragging={draggedIndex === displayIndex}
                  isDragOver={dragOverIndex === displayIndex}
                />
              </div>
            ))}
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

            {hasUnhealthyFiles && (
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
                <span className="font-semibold text-gray-900">{totalSize} MB</span>
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