"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, RotateCw, GripVertical, RefreshCw, Plus, RotateCcw, Settings } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"
import { IoMdLock } from "react-icons/io"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Constants
const LIMITS = {
  MAX_FILES: 5,
  MAX_SIZE_MB: 100,
  MAX_PAGES: 4000
}

const PDF_OPTIONS = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

const FILE_COLORS = [
  { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-800", accent: "bg-blue-500" },
  { border: "border-green-300", bg: "bg-green-50", text: "text-green-800", accent: "bg-green-500" },
  { border: "border-red-300", bg: "bg-red-50", text: "text-red-800", accent: "bg-red-500" },
  { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-800", accent: "bg-purple-500" },
  { border: "border-yellow-300", bg: "bg-yellow-50", text: "text-yellow-800", accent: "bg-yellow-500" },
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

// Enhanced Drag and Drop Context
const DragDropContext = ({ children, onPageDragEnd, onFileDragEnd }) => {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [dragType, setDragType] = useState(null)

  const handleDragStart = useCallback((e, itemId, type) => {
    setDraggedItem(itemId)
    setDragType(type)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", itemId)
  }, [])

  const handleDragOver = useCallback((e, itemId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(itemId)
  }, [])

  const handleDragEnd = useCallback(
    (e) => {
      e.preventDefault()
      if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
        if (dragType === "page") {
          onPageDragEnd?.(draggedItem, dragOverItem)
        } else if (dragType === "file") {
          onFileDragEnd?.(draggedItem, dragOverItem)
        }
      }
      setDraggedItem(null)
      setDragOverItem(null)
      setDragType(null)
    },
    [draggedItem, dragOverItem, dragType, onPageDragEnd, onFileDragEnd],
  )

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null)
    }
  }, [])

  return (
    <div>
      {children({
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragLeave,
        draggedItem,
        dragOverItem,
        dragType,
      })}
    </div>
  )
}

// Optimized PDF Page Preview Component with virtualization support
const PDFPagePreview = memo(
  ({
    page,
    onRemove,
    onRotate,
    onCreatePage,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragLeave,
    draggedItem,
    dragOverItem,
    fileColor,
    isPasswordProtected,
  }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [showAddButtons, setShowAddButtons] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const elementRef = useRef(null)
    const hoverTimeoutRef = useRef(null)

    // Optimized intersection observer with larger root margin for better performance
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // Delay visibility to prevent too many simultaneous renders
            setTimeout(() => setIsVisible(true), Math.random() * 100)
          }
        },
        {
          threshold: 0.05,
          rootMargin: "100px",
        },
      )

      if (elementRef.current) {
        observer.observe(elementRef.current)
      }

      return () => observer.disconnect()
    }, [])

    const handleMouseEnter = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      setShowAddButtons(true)
    }, [])

    const handleMouseLeave = useCallback(() => {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowAddButtons(false)
      }, 150)
    }, [])

    const isDragging = draggedItem === page.id
    const isDragOver = dragOverItem === page.id

    const renderPreview = () => {
      if (isPasswordProtected) {
        return <PasswordProtectedPreview />
      }

      if (!isVisible || hasError) {
        return <GenericPreview />
      }

      if (page.pdfData) {
        return (
          <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
            <Document
              file={page.pdfData}
              onLoadError={() => setHasError(true)}
              onLoadSuccess={() => setIsLoaded(true)}
              loading={<LoadingSpinner />}
              error={<ErrorPreview />}
              className="w-full h-full flex items-center justify-center"
              options={PDF_OPTIONS}
            >
              <div style={{ transform: `rotate(${page.rotation}deg)` }}>
                <Page
                  pageNumber={page.pageNumber}
                  width={150}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-200 shadow-sm"
                  loading={
                    <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  }
                />
              </div>
            </Document>
          </div>
        )
      }

      return <BlankPagePreview />
    }

    return (
      <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Page Creation Buttons */}
        {showAddButtons && (
          <div
            className="absolute inset-0 pointer-events-none z-30"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => onCreatePage(page.id, "before")}
              onMouseEnter={handleMouseEnter}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
              title="Add page before"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={() => onCreatePage(page.id, "after")}
              onMouseEnter={handleMouseEnter}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
              title="Add page after"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div
          ref={elementRef}
          draggable
          onDragStart={(e) => handleDragStart(e, page.id, "page")}
          onDragOver={(e) => handleDragOver(e, page.id)}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative cursor-move ${isDragging
            ? "opacity-50 scale-95 border-blue-400"
            : isDragOver
              ? "border-blue-400 shadow-lg scale-105"
              : `${fileColor.border} hover:border-blue-300 hover:shadow-lg`
            }`}
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-30 bg-white/90 rounded-full p-1 shadow-md">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>

          {/* Page Preview Area */}
          <div className="relative h-56 p-3 pt-10">
            <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>

            {/* Action Buttons */}
            <div className="absolute top-1 right-2 flex gap-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRotate(page.id)
                }}
                className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                title="Rotate page"
              >
                <RotateCw className="w-4 h-4 text-blue-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(page.id)
                }}
                className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                title="Remove page"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Rotation indicator */}
            {page.rotation > 0 && (
              <div className="absolute top-2 left-12 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {page.rotation}°
              </div>
            )}
          </div>

          {/* Page Info Footer */}
          <div className={`p-3 ${fileColor.bg} h-16 flex flex-col justify-center`}>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Page {page.displayNumber}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{page.fileName}</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

// Optimized preview components
const PasswordProtectedPreview = () => (
  <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
    <IoMdLock className="text-4xl text-gray-600" />
    <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
      ))}
    </div>
  </div>
)

const GenericPreview = () => (
  <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
    <FileText className="w-16 h-16 text-gray-400" />
    <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
  </div>
)

const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
  </div>
)

const ErrorPreview = () => (
  <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
    <FileText className="w-12 h-12 text-blue-400 mb-2" />
    <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
  </div>
)

const BlankPagePreview = () => (
  <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
      <div className="text-xs text-gray-500 font-medium">Blank Page</div>
    </div>
  </div>
)

PDFPagePreview.displayName = "PDFPagePreview"

// Draggable File Item Component
const DraggableFileItem = memo(
  ({
    file,
    index,
    filePages,
    onRemove,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragLeave,
    draggedItem,
    dragOverItem,
    dragType,
  }) => {
    const fileColor = FILE_COLORS[file.colorIndex]
    const isDragging = draggedItem === file.id && dragType === "file"
    const isDragOver = dragOverItem === file.id && dragType === "file"

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, file.id, "file")}
        onDragOver={(e) => handleDragOver(e, file.id)}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-move ${isDragging
          ? "opacity-50 scale-95"
          : isDragOver
            ? "border-blue-400 shadow-lg scale-105"
            : `${fileColor.border} ${fileColor.bg}`
          } flex items-center justify-between`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className={`w-3 h-3 rounded-full ${fileColor.accent} flex-shrink-0`}></div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${fileColor.text} truncate`} title={file.name}>
              {String.fromCharCode(65 + index)}: {file.name}
            </p>
            <p className="text-xs text-gray-500">{filePages.length} pages</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(file.id)}
          className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0"
          title="Remove file"
        >
          <X className="w-3 h-3 text-red-500" />
        </button>
      </div>
    )
  },
)

DraggableFileItem.displayName = "DraggableFileItem"

// File Information Section Component
const FileInfoSection = ({ files, totalSize, totalPages, passwordProtectedFiles }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">File Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", files.length],
        ["Total size:", `${totalSize} MB`],
        ["Total pages:", `${totalPages} pages`],
        ["Output format:", "Organized PDF"]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-blue-700">{label}</span>
          <span className="font-semibold text-blue-900">{value}</span>
        </div>
      ))}
      {passwordProtectedFiles.size > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-blue-700">Password protected:</span>
          <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
        </div>
      )}
    </div>
  </div>
)

// Limits Exceeded Component
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

// Sidebar Component
const Sidebar = ({
  files,
  totalSize,
  totalPages,
  passwordProtectedFiles,
  limitsExceeded,
  onOrganize,
  onResetChanges,
  children
}) => (
  <div className="flex flex-col h-[calc(100vh-70px)] overflow-hidden">
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Organize PDF</h3>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.
          </p>
        </div>

        {passwordProtectedFiles.size > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords will be required for processing.
            </p>
          </div>
        )}

        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Files:</h4>
              <button
                onClick={onResetChanges}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                title="Reset all changes"
              >
                <RotateCcw className="w-3 h-3" />
                Reset changes
              </button>
            </div>
            {children}
            <div className="mt-6 mb-3 bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                Drag and drop pages to reorder them. Hover over pages to add blank pages. Use the rotate and delete buttons to modify individual pages.
              </p>
            </div>
            <FileInfoSection
              files={files}
              totalSize={totalSize}
              totalPages={totalPages}
              passwordProtectedFiles={passwordProtectedFiles}
            />
          </>
        )}
      </div>
    </div>

    {/* Sticky Footer */}
    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-0">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onOrganize}
          disabled={files.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
            ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Organize PDF <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} totalPages={totalPages} />
      )}
      {files.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Add PDF files to organize</p>}
    </div>
  </div>
)

export default function OrganizePDFPage() {
  const [files, setFiles] = useState([])
  const [pages, setPages] = useState([])
  const [originalFileOrder, setOriginalFileOrder] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll } = useFileCache()
  const { passwordProtectedFiles, checkPasswordProtection, removePasswordProtected } = usePasswordProtection()
  const router = useRouter()

  // Store original file order when files are first loaded
  useEffect(() => {
    if (files.length > 0 && originalFileOrder.length === 0) {
      setOriginalFileOrder(files.map((file) => file.id))
    }
  }, [files, originalFileOrder])

  // Create stable file data
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id]
      }

      try {
        const isPasswordProtected = await checkPasswordProtection(file, id)

        if (isPasswordProtected) {
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
    [checkPasswordProtection, fileDataCache],
  )

  // Optimized page extraction with batching to prevent UI freezing
  const extractPagesFromPDF = useCallback(
    async (file, fileId, fileIndex) => {
      try {
        const stableData = await createStableFileData(file, fileId)

        if (!stableData || stableData.isPasswordProtected) {
          return [
            {
              id: `${fileId}_page_1`,
              fileId,
              fileName: file.name,
              pageNumber: 1,
              displayNumber: 1,
              rotation: 0,
              pdfData: null,
              isPasswordProtected: true,
              colorIndex: fileIndex % FILE_COLORS.length,
            },
          ]
        }

        const loadingTask = pdfjs.getDocument({ data: stableData.uint8Array })
        const pdf = await loadingTask.promise
        pdfDocumentCache.current[fileId] = pdf

        const extractedPages = []
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          extractedPages.push({
            id: `${fileId}_page_${pageNum}`,
            fileId,
            fileName: file.name,
            pageNumber: pageNum,
            displayNumber: pageNum,
            rotation: 0,
            pdfData: stableData.dataUrl,
            isPasswordProtected: false,
            colorIndex: fileIndex % FILE_COLORS.length,
          })
        }

        return extractedPages
      } catch (error) {
        console.error("Error extracting pages from PDF:", error)
        return []
      }
    },
    [createStableFileData, pdfDocumentCache],
  )

  // Handle file uploads with batch processing
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileObjects = []
      const allPages = []

      // Process files in batches to prevent UI freezing
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i]
        const fileId = createFileId(i)
        const fileIndex = files.length + i

        const fileObject = {
          id: fileId,
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          colorIndex: fileIndex % FILE_COLORS.length,
        }

        fileObjects.push(fileObject)

        // Extract pages with small delay to prevent UI blocking
        if (i > 0 && i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        const extractedPages = await extractPagesFromPDF(file, fileId, fileIndex)
        allPages.push(...extractedPages)
      }

      setFiles((prev) => [...prev, ...fileObjects])
      setPages((prev) => [...prev, ...allPages])
    },
    [files.length, extractPagesFromPDF],
  )

  // Create new blank page
  const createPage = useCallback(
    (pageId, position) => {
      const pageIndex = pages.findIndex((p) => p.id === pageId)
      if (pageIndex === -1) return

      const sourcePage = pages[pageIndex]
      const newPageId = `${Date.now()}_blank_${Math.random()}`

      const newPage = {
        id: newPageId,
        fileId: sourcePage.fileId,
        fileName: sourcePage.fileName,
        pageNumber: 1,
        displayNumber: sourcePage.displayNumber,
        rotation: 0,
        pdfData: null,
        isPasswordProtected: false,
        colorIndex: sourcePage.colorIndex,
        isBlankPage: true,
      }

      setPages((prev) => {
        const newPages = [...prev]
        const insertIndex = position === "before" ? pageIndex : pageIndex + 1
        newPages.splice(insertIndex, 0, newPage)

        // Update display numbers
        return newPages.map((page, index) => ({
          ...page,
          displayNumber: index + 1,
        }))
      })
    },
    [pages],
  )

  // Remove page
  const removePage = useCallback((pageId) => {
    setPages((prev) => {
      const newPages = prev.filter((page) => page.id !== pageId)
      return newPages.map((page, index) => ({
        ...page,
        displayNumber: index + 1,
      }))
    })
  }, [])

  // Rotate page
  const rotatePage = useCallback((pageId) => {
    setPages((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, rotation: (page.rotation + 90) % 360 } : page)),
    )
  }, [])

  // Handle page drag and drop
  const handlePageDragEnd = useCallback((draggedPageId, targetPageId) => {
    setPages((prev) => {
      const newPages = [...prev]
      const draggedIndex = newPages.findIndex((page) => page.id === draggedPageId)
      const targetIndex = newPages.findIndex((page) => page.id === targetPageId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const draggedPage = newPages[draggedIndex]
        newPages.splice(draggedIndex, 1)
        newPages.splice(targetIndex, 0, draggedPage)

        // Update display numbers
        return newPages.map((page, index) => ({
          ...page,
          displayNumber: index + 1,
        }))
      }

      return newPages
    })
  }, [])

  // Handle file drag and drop - also reorders pages
  const handleFileDragEnd = useCallback((draggedFileId, targetFileId) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const draggedIndex = newFiles.findIndex((file) => file.id === draggedFileId)
      const targetIndex = newFiles.findIndex((file) => file.id === targetFileId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const draggedFile = newFiles[draggedIndex]
        newFiles.splice(draggedIndex, 1)
        newFiles.splice(targetIndex, 0, draggedFile)

        // Reorder pages based on new file order
        setPages((prevPages) => {
          const pagesByFile = {}
          prevPages.forEach((page) => {
            if (!pagesByFile[page.fileId]) {
              pagesByFile[page.fileId] = []
            }
            pagesByFile[page.fileId].push(page)
          })

          const reorderedPages = []
          newFiles.forEach((file) => {
            if (pagesByFile[file.id]) {
              reorderedPages.push(...pagesByFile[file.id])
            }
          })

          // Update display numbers
          return reorderedPages.map((page, index) => ({
            ...page,
            displayNumber: index + 1,
          }))
        })
      }

      return newFiles
    })
  }, [])

  // Remove file
  const removeFile = useCallback((fileId) => {
    cleanupFile(fileId)
    removePasswordProtected(fileId)

    setFiles((prev) => prev.filter((file) => file.id !== fileId))
    setPages((prev) => {
      const newPages = prev.filter((page) => page.fileId !== fileId)
      return newPages.map((page, index) => ({
        ...page,
        displayNumber: index + 1,
      }))
    })
  }, [cleanupFile, removePasswordProtected])

  // Reset changes only (not files)
  const resetChanges = useCallback(() => {
    // Reset file order to original
    if (originalFileOrder.length > 0) {
      setFiles((prev) => {
        const fileMap = {}
        prev.forEach((file) => {
          fileMap[file.id] = file
        })

        return originalFileOrder.map((fileId) => fileMap[fileId]).filter(Boolean)
      })
    }

    // Reset pages to original order and remove blank pages, reset rotations
    setPages((prev) => {
      const originalPages = prev.filter((page) => !page.isBlankPage)

      // Group pages by file and sort by original page number
      const pagesByFile = {}
      originalPages.forEach((page) => {
        if (!pagesByFile[page.fileId]) {
          pagesByFile[page.fileId] = []
        }
        pagesByFile[page.fileId].push({
          ...page,
          rotation: 0, // Reset rotation
        })
      })

      // Sort pages within each file by original page number
      Object.keys(pagesByFile).forEach((fileId) => {
        pagesByFile[fileId].sort((a, b) => a.pageNumber - b.pageNumber)
      })

      // Reorder based on original file order
      const reorderedPages = []
      if (originalFileOrder.length > 0) {
        originalFileOrder.forEach((fileId) => {
          if (pagesByFile[fileId]) {
            reorderedPages.push(...pagesByFile[fileId])
          }
        })
      } else {
        // Fallback to current file order
        files.forEach((file) => {
          if (pagesByFile[file.id]) {
            reorderedPages.push(...pagesByFile[file.id])
          }
        })
      }

      // Update display numbers
      return reorderedPages.map((page, index) => ({
        ...page,
        displayNumber: index + 1,
      }))
    })
  }, [originalFileOrder, files])

  // Handle password submission
  const handlePasswordSubmit = useCallback(
    async (passwords) => {
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()

        const fileIdMap = {}
        files.forEach((file) => {
          const safeFileId = file.id.toString().replace(/\./g, '_')
          fileIdMap[file.id] = safeFileId
        })

        const pagesData = pages.map((page, index) => ({
          fileId: fileIdMap[page.fileId] || page.fileId.replace(/\./g, '_'),
          pageNumber: page.pageNumber,
          rotation: page.rotation,
          order: index,
          isBlankPage: page.isBlankPage || false,
        }))

        formData.append("pagesData", JSON.stringify(pagesData))
        formData.append("firstFileName", files[0]?.file?.name || "organized")

        files.forEach((file) => {
          const safeFileId = fileIdMap[file.id]
          formData.append(`fileId_${safeFileId}`, safeFileId)
          formData.append("files", file.file, `fileId_${safeFileId}`)
        })

        const filePasswords = {}
        files.forEach((file) => {
          if (passwordProtectedFiles.has(file.id)) {
            const safeFileId = fileIdMap[file.id]
            filePasswords[safeFileId] = passwords[file.id] || ""
          }
        })
        formData.append("passwords", JSON.stringify(filePasswords))

        const response = await Api.post("/tools/organize-pdf", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          },
        })

        if (response.data) {
          const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
          const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=organize-pdf`
          router.push(downloadUrl)
        } else {
          toast.error("No organized PDF received from server")
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Error organizing PDF")
      } finally {
        setIsUploading(false)
      }
    },
    [files, pages, passwordProtectedFiles, router],
  )

  // Handle organize
  const handleOrganize = useCallback(async () => {
    if (pages.length === 0) return

    const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }

    await handlePasswordSubmit({})
  }, [files, pages, passwordProtectedFiles, handlePasswordSubmit])

  // Sort files by name
  const sortFilesByName = useCallback((order = "asc") => {
    setFiles(prev => [...prev].sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ))
  }, [])

  // Computed values
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2),
    [files],
  )

  const totalPages = useMemo(() => pages.length, [pages.length])

  const limitsExceeded = useMemo(() => {
    const exceedsFiles = files.length > LIMITS.MAX_FILES
    const exceedsSize = parseFloat(totalSize) > LIMITS.MAX_SIZE_MB
    const exceedsPages = totalPages > LIMITS.MAX_PAGES
    return {
      exceedsFiles,
      exceedsSize,
      exceedsPages,
      hasAnyExceeded: exceedsFiles || exceedsSize || exceedsPages
    }
  }, [files.length, totalSize, totalPages])

  const protectedFilesForModal = useMemo(
    () => files.filter((file) => passwordProtectedFiles.has(file.id)),
    [files, passwordProtectedFiles],
  )

  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanupAll
  }, [cleanupAll])

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
        pageTitle="Organize PDF"
        pageSubTitle="Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience."
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
        maxPages={LIMITS.MAX_PAGES}
      />
    )
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="p-4 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar pb-20 md:pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">PDF Pages ({pages.length})</h2>
            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".pdf"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="Organize PDF"
              pageSubTitle="Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience."
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
              maxPages={LIMITS.MAX_PAGES}
            />
          </div>

          <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
            {({
              handleDragStart,
              handleDragOver,
              handleDragEnd,
              handleDragLeave,
              draggedItem,
              dragOverItem,
              dragType,
            }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pages.map((page) => (
                  <PDFPagePreview
                    key={page.id}
                    page={page}
                    onRemove={removePage}
                    onRotate={rotatePage}
                    onCreatePage={createPage}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    handleDragLeave={handleDragLeave}
                    draggedItem={draggedItem}
                    dragOverItem={dragOverItem}
                    fileColor={FILE_COLORS[page.colorIndex]}
                    isPasswordProtected={page.isPasswordProtected}
                  />
                ))}
              </div>
            )}
          </DragDropContext>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 bg-white border-l h-full">
          <Sidebar
            files={files}
            totalSize={totalSize}
            totalPages={totalPages}
            passwordProtectedFiles={passwordProtectedFiles}
            limitsExceeded={limitsExceeded}
            onOrganize={handleOrganize}
            onResetChanges={resetChanges}
          >
            <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
              {({
                handleDragStart,
                handleDragOver,
                handleDragEnd,
                handleDragLeave,
                draggedItem,
                dragOverItem,
                dragType,
              }) => (
                <div className="space-y-2">
                  {files.map((file, index) => {
                    const filePages = pages.filter((page) => page.fileId === file.id)
                    return (
                      <DraggableFileItem
                        key={file.id}
                        file={file}
                        index={index}
                        filePages={filePages}
                        onRemove={removeFile}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDragEnd={handleDragEnd}
                        handleDragLeave={handleDragLeave}
                        draggedItem={draggedItem}
                        dragOverItem={dragOverItem}
                        dragType={dragType}
                      />
                    )
                  })}
                </div>
              )}
            </DragDropContext>
          </Sidebar>
        </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMobileSidebar(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Organize PDF</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-4 pb-20">
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.
                      </p>
                    </div>

                    {passwordProtectedFiles.size > 0 && (
                      <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                          {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords will be required for processing.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">Files:</h4>
                      <button
                        onClick={resetChanges}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>

                    <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
                      {({
                        handleDragStart,
                        handleDragOver,
                        handleDragEnd,
                        handleDragLeave,
                        draggedItem,
                        dragOverItem,
                        dragType,
                      }) => (
                        <div className="space-y-2 mb-6">
                          {files.map((file, index) => {
                            const filePages = pages.filter((page) => page.fileId === file.id)
                            return (
                              <DraggableFileItem
                                key={file.id}
                                file={file}
                                index={index}
                                filePages={filePages}
                                onRemove={removeFile}
                                handleDragStart={handleDragStart}
                                handleDragOver={handleDragOver}
                                handleDragEnd={handleDragEnd}
                                handleDragLeave={handleDragLeave}
                                draggedItem={draggedItem}
                                dragOverItem={dragOverItem}
                                dragType={dragType}
                              />
                            )
                          })}
                        </div>
                      )}
                    </DragDropContext>

                    <FileInfoSection
                      files={files}
                      totalSize={totalSize}
                      totalPages={totalPages}
                      passwordProtectedFiles={passwordProtectedFiles}
                    />
                  </div>
                </div>

                {/* Mobile Sidebar Sticky Footer */}
                <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                  {!limitsExceeded.hasAnyExceeded ? (
                    <button
                      onClick={handleOrganize}
                      disabled={pages.length === 0}
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                      Organize PDF <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} totalPages={totalPages} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
          <div className="flex-1">
            {!limitsExceeded.hasAnyExceeded ? (
              <button
                onClick={handleOrganize}
                disabled={pages.length === 0}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                Organize PDF <ArrowRight className="w-4 h-4" />
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

// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
// import { useRouter } from "next/navigation"
// import { FileText, X, ArrowRight, RotateCw, GripVertical, RefreshCw, Plus, RotateCcw } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"
// import { IoMdLock } from "react-icons/io"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// // Memoized PDF options to prevent unnecessary reloads
// const PDF_OPTIONS = {
//   cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//   cMapPacked: true,
//   standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
// }

// // File color mapping
// const FILE_COLORS = [
//   { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-800", accent: "bg-blue-500" },
//   { border: "border-green-300", bg: "bg-green-50", text: "text-green-800", accent: "bg-green-500" },
//   { border: "border-red-300", bg: "bg-red-50", text: "text-red-800", accent: "bg-red-500" },
//   { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-800", accent: "bg-purple-500" },
//   { border: "border-yellow-300", bg: "bg-yellow-50", text: "text-yellow-800", accent: "bg-yellow-500" },
// ]

// // Enhanced Drag and Drop Context
// const DragDropContext = ({ children, onPageDragEnd, onFileDragEnd }) => {
//   const [draggedItem, setDraggedItem] = useState(null)
//   const [dragOverItem, setDragOverItem] = useState(null)
//   const [dragType, setDragType] = useState(null)

//   const handleDragStart = useCallback((e, itemId, type) => {
//     setDraggedItem(itemId)
//     setDragType(type)
//     e.dataTransfer.effectAllowed = "move"
//     e.dataTransfer.setData("text/plain", itemId)
//   }, [])

//   const handleDragOver = useCallback((e, itemId) => {
//     e.preventDefault()
//     e.dataTransfer.dropEffect = "move"
//     setDragOverItem(itemId)
//   }, [])

//   const handleDragEnd = useCallback(
//     (e) => {
//       e.preventDefault()
//       if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
//         if (dragType === "page") {
//           onPageDragEnd?.(draggedItem, dragOverItem)
//         } else if (dragType === "file") {
//           onFileDragEnd?.(draggedItem, dragOverItem)
//         }
//       }
//       setDraggedItem(null)
//       setDragOverItem(null)
//       setDragType(null)
//     },
//     [draggedItem, dragOverItem, dragType, onPageDragEnd, onFileDragEnd],
//   )

//   const handleDragLeave = useCallback((e) => {
//     if (!e.currentTarget.contains(e.relatedTarget)) {
//       setDragOverItem(null)
//     }
//   }, [])

//   return (
//     <div>
//       {children({
//         handleDragStart,
//         handleDragOver,
//         handleDragEnd,
//         handleDragLeave,
//         draggedItem,
//         dragOverItem,
//         dragType,
//       })}
//     </div>
//   )
// }

// // Enhanced PDF Page Preview Component with improved hover behavior
// const PDFPagePreview = memo(
//   ({
//     page,
//     onRemove,
//     onRotate,
//     onCreatePage,
//     handleDragStart,
//     handleDragOver,
//     handleDragEnd,
//     handleDragLeave,
//     draggedItem,
//     dragOverItem,
//     fileColor,
//     isPasswordProtected,
//   }) => {
//     const [isVisible, setIsVisible] = useState(false)
//     const [hasError, setHasError] = useState(false)
//     const [showAddButtons, setShowAddButtons] = useState(false)
//     const elementRef = useRef(null)
//     const hoverTimeoutRef = useRef(null)

//     // Intersection observer for lazy loading
//     useEffect(() => {
//       const observer = new IntersectionObserver(
//         ([entry]) => {
//           if (entry.isIntersecting) {
//             setIsVisible(true)
//           }
//         },
//         {
//           threshold: 0.1,
//           rootMargin: "50px",
//         },
//       )

//       if (elementRef.current) {
//         observer.observe(elementRef.current)
//       }

//       return () => observer.disconnect()
//     }, [])

//     const handleMouseEnter = useCallback(() => {
//       if (hoverTimeoutRef.current) {
//         clearTimeout(hoverTimeoutRef.current)
//       }
//       setShowAddButtons(true)
//     }, [])

//     const handleMouseLeave = useCallback(() => {
//       hoverTimeoutRef.current = setTimeout(() => {
//         setShowAddButtons(false)
//       }, 100)
//     }, [])

//     const isDragging = draggedItem === page.id
//     const isDragOver = dragOverItem === page.id

//     const renderPreview = () => {
//       if (isPasswordProtected) {
//         return (
//           <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
//             <IoMdLock className="text-4xl" />
//             <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
//               {[...Array(5)].map((_, i) => (
//                 <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
//               ))}
//             </div>
//           </div>
//         )
//       }

//       if (!isVisible || hasError) {
//         return (
//           <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//             <FileText className="w-16 h-16 text-gray-400" />
//             <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
//           </div>
//         )
//       }

//       if (page.pdfData) {
//         return (
//           <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//             <Document
//               file={page.pdfData}
//               onLoadError={() => setHasError(true)}
//               loading={
//                 <div className="flex items-center justify-center">
//                   <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//                 </div>
//               }
//               error={
//                 <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
//                   <FileText className="w-12 h-12 text-blue-400 mb-2" />
//                   <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
//                 </div>
//               }
//               className="w-full h-full flex items-center justify-center"
//               options={PDF_OPTIONS}
//             >
//               <div style={{ transform: `rotate(${page.rotation}deg)` }}>
//                 <Page
//                   pageNumber={page.pageNumber}
//                   width={150}
//                   renderTextLayer={false}
//                   renderAnnotationLayer={false}
//                   className="border border-gray-200 shadow-sm"
//                   loading={
//                     <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
//                       <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                     </div>
//                   }
//                 />
//               </div>
//             </Document>
//           </div>
//         )
//       }

//       // Blank page
//       return (
//         <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
//           <div className="text-center">
//             <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//             <div className="text-xs text-gray-500 font-medium">Blank Page</div>
//           </div>
//         </div>
//       )
//     }

//     return (
//       <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
//         {/* Page Creation Buttons - Enhanced hover behavior */}
//         {showAddButtons && (
//           <div
//             className="absolute inset-0 pointer-events-none z-30"
//             onMouseEnter={handleMouseEnter}
//             onMouseLeave={handleMouseLeave}
//           >
//             {/* Left Add Button */}
//             <button
//               onClick={() => onCreatePage(page.id, "before")}
//               onMouseEnter={handleMouseEnter}
//               className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
//               title="Add page before"
//             >
//               <Plus className="w-4 h-4" />
//             </button>

//             {/* Right Add Button */}
//             <button
//               onClick={() => onCreatePage(page.id, "after")}
//               onMouseEnter={handleMouseEnter}
//               className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
//               title="Add page after"
//             >
//               <Plus className="w-4 h-4" />
//             </button>
//           </div>
//         )}

//         <div
//           ref={elementRef}
//           draggable
//           onDragStart={(e) => handleDragStart(e, page.id, "page")}
//           onDragOver={(e) => handleDragOver(e, page.id)}
//           onDragLeave={handleDragLeave}
//           onDragEnd={handleDragEnd}
//           className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative cursor-move ${isDragging
//               ? "opacity-50 scale-95 border-blue-400"
//               : isDragOver
//                 ? "border-blue-400 shadow-lg scale-105"
//                 : `${fileColor.border} hover:border-blue-300 hover:shadow-lg`
//             }`}
//         >
//           {/* Drag Handle */}
//           <div className="absolute top-2 left-2 z-30 bg-white/90 rounded-full p-1 shadow-md">
//             <GripVertical className="w-4 h-4 text-gray-500" />
//           </div>

//           {/* Page Preview Area */}
//           <div className="relative h-56 p-3 pt-10">
//             <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>

//             {/* Action Buttons */}
//             <div className="absolute top-1 right-2 flex gap-1 z-30">
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   onRotate(page.id)
//                 }}
//                 className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
//                 title="Rotate page"
//               >
//                 <RotateCw className="w-4 h-4 text-blue-500" />
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   onRemove(page.id)
//                 }}
//                 className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
//                 title="Remove page"
//               >
//                 <X className="w-4 h-4 text-blue-500" />
//               </button>
//             </div>

//             {/* Rotation indicator */}
//             {page.rotation > 0 && (
//               <div className="absolute top-2 left-12 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
//                 {page.rotation}°
//               </div>
//             )}
//           </div>

//           {/* Page Info Footer */}
//           <div className={`p-3 ${fileColor.bg} h-16 flex flex-col justify-center`}>
//             <div className="text-center">
//               <p className="text-sm font-medium text-gray-900">Page {page.displayNumber}</p>
//               <p className="text-xs text-gray-500 mt-1">{page.fileName}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   },
// )

// PDFPagePreview.displayName = "PDFPagePreview"

// // Draggable File Item Component
// const DraggableFileItem = memo(
//   ({
//     file,
//     index,
//     filePages,
//     onRemove,
//     handleDragStart,
//     handleDragOver,
//     handleDragEnd,
//     handleDragLeave,
//     draggedItem,
//     dragOverItem,
//     dragType,
//   }) => {
//     const fileColor = FILE_COLORS[file.colorIndex]
//     const isDragging = draggedItem === file.id && dragType === "file"
//     const isDragOver = dragOverItem === file.id && dragType === "file"

//     return (
//       <div
//         draggable
//         onDragStart={(e) => handleDragStart(e, file.id, "file")}
//         onDragOver={(e) => handleDragOver(e, file.id)}
//         onDragLeave={handleDragLeave}
//         onDragEnd={handleDragEnd}
//         className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-move ${isDragging
//             ? "opacity-50 scale-95"
//             : isDragOver
//               ? "border-blue-400 shadow-lg scale-105"
//               : `${fileColor.border} ${fileColor.bg}`
//           } flex items-center justify-between`}
//       >
//         <div className="flex items-center gap-3">
//           <GripVertical className="w-4 h-4 text-gray-400" />
//           <div className={`w-3 h-3 rounded-full ${fileColor.accent}`}></div>
//           <div>
//             <p className={`text-sm font-medium ${fileColor.text}`}>
//               {String.fromCharCode(65 + index)}: {file.name}
//             </p>
//             <p className="text-xs text-gray-500">{filePages.length} pages</p>
//           </div>
//         </div>
//         <button
//           onClick={() => onRemove(file.id)}
//           className="w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors duration-200"
//           title="Remove file"
//         >
//           <X className="w-3 h-3 text-blue-500" />
//         </button>
//       </div>
//     )
//   },
// )

// DraggableFileItem.displayName = "DraggableFileItem"

// export default function OrganizePDFPage() {
//   const [files, setFiles] = useState([])
//   const [pages, setPages] = useState([])
//   const [originalFileOrder, setOriginalFileOrder] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)

//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

//   // Store original file order when files are first loaded
//   useEffect(() => {
//     if (files.length > 0 && originalFileOrder.length === 0) {
//       setOriginalFileOrder(files.map((file) => file.id))
//     }
//   }, [files, originalFileOrder])

//   // Password protection check
//   const checkPasswordProtection = useCallback(async (file, id) => {
//     try {
//       const arrayBuffer = await file.arrayBuffer()
//       const uint8Array = new Uint8Array(arrayBuffer)

//       try {
//         const loadingTask = pdfjs.getDocument({
//           data: uint8Array,
//           password: "",
//         })
//         await loadingTask.promise
//         return false
//       } catch (pdfError) {
//         if (
//           pdfError.name === "PasswordException" ||
//           pdfError.name === "MissingPDFException" ||
//           pdfError.message?.includes("password") ||
//           pdfError.message?.includes("encrypted")
//         ) {
//           setPasswordProtectedFiles((prev) => new Set([...prev, id]))
//           return true
//         }
//         return false
//       }
//     } catch (error) {
//       console.warn("Error checking password protection:", error)
//       return false
//     }
//   }, [])

//   // Create stable file data
//   const createStableFileData = useCallback(
//     async (file, id) => {
//       if (fileDataCache.current[id]) {
//         return fileDataCache.current[id]
//       }

//       try {
//         const isPasswordProtected = await checkPasswordProtection(file, id)

//         if (isPasswordProtected) {
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

//   // Extract pages from PDF
//   const extractPagesFromPDF = useCallback(
//     async (file, fileId, fileIndex) => {
//       try {
//         const stableData = await createStableFileData(file, fileId)

//         if (!stableData || stableData.isPasswordProtected) {
//           return [
//             {
//               id: `${fileId}_page_1`,
//               fileId,
//               fileName: file.name,
//               pageNumber: 1,
//               displayNumber: 1,
//               rotation: 0,
//               pdfData: null,
//               isPasswordProtected: true,
//               colorIndex: fileIndex % FILE_COLORS.length,
//             },
//           ]
//         }

//         const loadingTask = pdfjs.getDocument({ data: stableData.uint8Array })
//         const pdf = await loadingTask.promise
//         pdfDocumentCache.current[fileId] = pdf

//         const extractedPages = []
//         for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//           extractedPages.push({
//             id: `${fileId}_page_${pageNum}`,
//             fileId,
//             fileName: file.name,
//             pageNumber: pageNum,
//             displayNumber: pageNum,
//             rotation: 0,
//             pdfData: stableData.dataUrl,
//             isPasswordProtected: false,
//             colorIndex: fileIndex % FILE_COLORS.length,
//           })
//         }

//         return extractedPages
//       } catch (error) {
//         console.error("Error extracting pages from PDF:", error)
//         return []
//       }
//     },
//     [createStableFileData],
//   )

//   // Handle file uploads
//   const handleFiles = useCallback(
//     async (newFiles) => {
//       const fileObjects = []
//       const allPages = []

//       for (let i = 0; i < newFiles.length; i++) {
//         const file = newFiles[i]
//         const fileId = Date.now() + i + Math.random()
//         const fileIndex = files.length + i

//         const fileObject = {
//           id: fileId,
//           file,
//           name: file.name,
//           size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//           type: file.type,
//           colorIndex: fileIndex % FILE_COLORS.length,
//         }

//         fileObjects.push(fileObject)

//         const extractedPages = await extractPagesFromPDF(file, fileId, fileIndex)
//         allPages.push(...extractedPages)
//       }

//       setFiles((prev) => [...prev, ...fileObjects])
//       setPages((prev) => [...prev, ...allPages])
//     },
//     [files.length, extractPagesFromPDF],
//   )

//   // Create new blank page
//   const createPage = useCallback(
//     (pageId, position) => {
//       const pageIndex = pages.findIndex((p) => p.id === pageId)
//       if (pageIndex === -1) return

//       const sourcePage = pages[pageIndex]
//       const newPageId = `${Date.now()}_blank_${Math.random()}`

//       const newPage = {
//         id: newPageId,
//         fileId: sourcePage.fileId,
//         fileName: sourcePage.fileName,
//         pageNumber: 1,
//         displayNumber: sourcePage.displayNumber,
//         rotation: 0,
//         pdfData: null, // This will show as a blank page
//         isPasswordProtected: false,
//         colorIndex: sourcePage.colorIndex,
//         isBlankPage: true,
//       }

//       setPages((prev) => {
//         const newPages = [...prev]
//         const insertIndex = position === "before" ? pageIndex : pageIndex + 1
//         newPages.splice(insertIndex, 0, newPage)

//         // Update display numbers
//         return newPages.map((page, index) => ({
//           ...page,
//           displayNumber: index + 1,
//         }))
//       })
//     },
//     [pages],
//   )

//   // Remove page
//   const removePage = useCallback((pageId) => {
//     setPages((prev) => {
//       const newPages = prev.filter((page) => page.id !== pageId)
//       return newPages.map((page, index) => ({
//         ...page,
//         displayNumber: index + 1,
//       }))
//     })
//   }, [])

//   // Rotate page
//   const rotatePage = useCallback((pageId) => {
//     setPages((prev) =>
//       prev.map((page) => (page.id === pageId ? { ...page, rotation: (page.rotation + 90) % 360 } : page)),
//     )
//   }, [])

//   // Handle page drag and drop
//   const handlePageDragEnd = useCallback((draggedPageId, targetPageId) => {
//     setPages((prev) => {
//       const newPages = [...prev]
//       const draggedIndex = newPages.findIndex((page) => page.id === draggedPageId)
//       const targetIndex = newPages.findIndex((page) => page.id === targetPageId)

//       if (draggedIndex !== -1 && targetIndex !== -1) {
//         const draggedPage = newPages[draggedIndex]
//         newPages.splice(draggedIndex, 1)
//         newPages.splice(targetIndex, 0, draggedPage)

//         // Update display numbers
//         return newPages.map((page, index) => ({
//           ...page,
//           displayNumber: index + 1,
//         }))
//       }

//       return newPages
//     })
//   }, [])

//   // Handle file drag and drop - also reorders pages
//   const handleFileDragEnd = useCallback((draggedFileId, targetFileId) => {
//     setFiles((prev) => {
//       const newFiles = [...prev]
//       const draggedIndex = newFiles.findIndex((file) => file.id === draggedFileId)
//       const targetIndex = newFiles.findIndex((file) => file.id === targetFileId)

//       if (draggedIndex !== -1 && targetIndex !== -1) {
//         const draggedFile = newFiles[draggedIndex]
//         newFiles.splice(draggedIndex, 1)
//         newFiles.splice(targetIndex, 0, draggedFile)

//         // Reorder pages based on new file order
//         setPages((prevPages) => {
//           const pagesByFile = {}
//           prevPages.forEach((page) => {
//             if (!pagesByFile[page.fileId]) {
//               pagesByFile[page.fileId] = []
//             }
//             pagesByFile[page.fileId].push(page)
//           })

//           const reorderedPages = []
//           newFiles.forEach((file) => {
//             if (pagesByFile[file.id]) {
//               reorderedPages.push(...pagesByFile[file.id])
//             }
//           })

//           // Update display numbers
//           return reorderedPages.map((page, index) => ({
//             ...page,
//             displayNumber: index + 1,
//           }))
//         })
//       }

//       return newFiles
//     })
//   }, [])

//   // Remove file
//   const removeFile = useCallback((fileId) => {
//     const fileData = fileDataCache.current[fileId]
//     if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(fileData.dataUrl)
//     }
//     delete fileDataCache.current[fileId]

//     if (pdfDocumentCache.current[fileId]) {
//       try {
//         if (pdfDocumentCache.current[fileId].destroy) {
//           pdfDocumentCache.current[fileId].destroy()
//         }
//       } catch (e) {
//         console.warn("PDF cleanup warning:", e)
//       }
//       delete pdfDocumentCache.current[fileId]
//     }

//     setPasswordProtectedFiles((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setFiles((prev) => prev.filter((file) => file.id !== fileId))
//     setPages((prev) => {
//       const newPages = prev.filter((page) => page.fileId !== fileId)
//       return newPages.map((page, index) => ({
//         ...page,
//         displayNumber: index + 1,
//       }))
//     })
//   }, [])

//   // Reset changes only (not files)
//   const resetChanges = useCallback(() => {
//     // Reset file order to original
//     if (originalFileOrder.length > 0) {
//       setFiles((prev) => {
//         const fileMap = {}
//         prev.forEach((file) => {
//           fileMap[file.id] = file
//         })

//         return originalFileOrder.map((fileId) => fileMap[fileId]).filter(Boolean)
//       })
//     }

//     // Reset pages to original order and remove blank pages, reset rotations
//     setPages((prev) => {
//       const originalPages = prev.filter((page) => !page.isBlankPage)

//       // Group pages by file and sort by original page number
//       const pagesByFile = {}
//       originalPages.forEach((page) => {
//         if (!pagesByFile[page.fileId]) {
//           pagesByFile[page.fileId] = []
//         }
//         pagesByFile[page.fileId].push({
//           ...page,
//           rotation: 0, // Reset rotation
//         })
//       })

//       // Sort pages within each file by original page number
//       Object.keys(pagesByFile).forEach((fileId) => {
//         pagesByFile[fileId].sort((a, b) => a.pageNumber - b.pageNumber)
//       })

//       // Reorder based on original file order
//       const reorderedPages = []
//       if (originalFileOrder.length > 0) {
//         originalFileOrder.forEach((fileId) => {
//           if (pagesByFile[fileId]) {
//             reorderedPages.push(...pagesByFile[fileId])
//           }
//         })
//       } else {
//         // Fallback to current file order
//         files.forEach((file) => {
//           if (pagesByFile[file.id]) {
//             reorderedPages.push(...pagesByFile[file.id])
//           }
//         })
//       }

//       // Update display numbers
//       return reorderedPages.map((page, index) => ({
//         ...page,
//         displayNumber: index + 1,
//       }))
//     })
//   }, [originalFileOrder, files])

//   // Handle password submission
//   const handlePasswordSubmit = useCallback(
//     async (passwords) => {
//       setIsUploading(true)
//       setUploadProgress(0)

//       try {
//         const formData = new FormData()

//         const fileIdMap = {} // originalId -> safeId
//         files.forEach((file) => {
//           const safeFileId = file.id.toString().replace(/\./g, '_')
//           fileIdMap[file.id] = safeFileId
//         })

//         // ✅ pagesData with safe fileIds
//         const pagesData = pages.map((page, index) => ({
//           fileId: fileIdMap[page.fileId] || page.fileId.replace(/\./g, '_'),
//           pageNumber: page.pageNumber,
//           rotation: page.rotation,
//           order: index,
//           isBlankPage: page.isBlankPage || false,
//         }))

//         formData.append("pagesData", JSON.stringify(pagesData))

//         // ✅ Append files with safe fileId
//         files.forEach((file) => {
//           const safeFileId = fileIdMap[file.id]
//           formData.append(`fileId_${safeFileId}`, safeFileId)
//           formData.append("files", file.file, `fileId_${safeFileId}`)
//         })

//         // ✅ Passwords with original fileId (converted safely)
//         const filePasswords = {}
//         files.forEach((file) => {
//           if (passwordProtectedFiles.has(file.id)) {
//             const safeFileId = fileIdMap[file.id]
//             filePasswords[safeFileId] = passwords[file.id] || ""
//           }
//         })
//         formData.append("passwords", JSON.stringify(filePasswords))

//         const response = await Api.post("/tools/organize-pdf", formData, {
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
//           const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=organize-pdf`
//           router.push(downloadUrl)
//         } else {
//           toast.error("No organized PDF received from server")
//         }
//       } catch (error) {
//         toast.error(error?.response?.data?.message || "Error organizing PDF")
//       } finally {
//         setIsUploading(false)
//       }
//     },
//     [files, pages, passwordProtectedFiles, router],
//   )

//   // Handle organize
//   const handleOrganize = useCallback(async () => {
//     if (pages.length === 0) return

//     const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

//     if (currentProtectedFiles.length > 0) {
//       setShowPasswordModal(true)
//       return
//     }

//     await handlePasswordSubmit({})
//   }, [files, pages, passwordProtectedFiles, handlePasswordSubmit])

//   // Memoized calculations
//   const totalSize = useMemo(
//     () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
//     [files],
//   )

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
//         pageTitle="Organize PDF"
//         pageSubTitle="Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience."
//       />
//     )
//   }

//   return (
//     <div className="h-full">
//       <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
//         {/* Main Content */}
//         <div className="p-4 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">PDF Pages ({pages.length})</h2>
//             <SafeFileUploader
//               isMultiple={true}
//               onFilesSelect={handleFiles}
//               isDragOver={isDragOver}
//               setIsDragOver={setIsDragOver}
//               allowedTypes={[".pdf"]}
//               showFiles={true}
//               selectedCount={files?.length}
//               pageTitle="Organize PDF"
//               pageSubTitle="Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience."
//             />
//           </div>

//           <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
//             {({
//               handleDragStart,
//               handleDragOver,
//               handleDragEnd,
//               handleDragLeave,
//               draggedItem,
//               dragOverItem,
//               dragType,
//             }) => (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                 {pages.map((page) => (
//                   <PDFPagePreview
//                     key={page.id}
//                     page={page}
//                     onRemove={removePage}
//                     onRotate={rotatePage}
//                     onCreatePage={createPage}
//                     handleDragStart={handleDragStart}
//                     handleDragOver={handleDragOver}
//                     handleDragEnd={handleDragEnd}
//                     handleDragLeave={handleDragLeave}
//                     draggedItem={draggedItem}
//                     dragOverItem={dragOverItem}
//                     fileColor={FILE_COLORS[page.colorIndex]}
//                     isPasswordProtected={page.isPasswordProtected}
//                   />
//                 ))}
//               </div>
//             )}
//           </DragDropContext>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Organize PDF</h3>

//             {/* Files List with Drag and Drop */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-lg font-semibold text-gray-900">Files:</h4>
//                 <button
//                   onClick={resetChanges}
//                   className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
//                   title="Reset all changes"
//                 >
//                   <RotateCcw className="w-3 h-3" />
//                   Reset changes
//                 </button>
//               </div>

//               <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
//                 {({
//                   handleDragStart,
//                   handleDragOver,
//                   handleDragEnd,
//                   handleDragLeave,
//                   draggedItem,
//                   dragOverItem,
//                   dragType,
//                 }) => (
//                   <div className="space-y-2">
//                     {files.map((file, index) => {
//                       const filePages = pages.filter((page) => page.fileId === file.id)
//                       return (
//                         <DraggableFileItem
//                           key={file.id}
//                           file={file}
//                           index={index}
//                           filePages={filePages}
//                           onRemove={removeFile}
//                           handleDragStart={handleDragStart}
//                           handleDragOver={handleDragOver}
//                           handleDragEnd={handleDragEnd}
//                           handleDragLeave={handleDragLeave}
//                           draggedItem={draggedItem}
//                           dragOverItem={dragOverItem}
//                           dragType={dragType}
//                         />
//                       )
//                     })}
//                   </div>
//                 )}
//               </DragDropContext>
//             </div>

//             {/* Help text */}
//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 Drag and drop pages to reorder them. Hover over pages to add blank pages. Use the rotate and delete
//                 buttons to modify individual pages.
//               </p>
//             </div>

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
//                 <span className="text-gray-600">Files loaded:</span>
//                 <span className="font-semibold text-gray-900">{files.length}</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Total pages:</span>
//                 <span className="font-semibold text-gray-900">{pages.length}</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Total size:</span>
//                 <span className="font-semibold text-gray-900">{totalSize} MB</span>
//               </div>
//               {passwordProtectedFiles.size > 0 && (
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Password protected:</span>
//                   <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={handleOrganize}
//               disabled={pages.length === 0}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0
//                   ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Organize
//               <ArrowRight className="w-5 h-5" />
//             </button>
//             {pages.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Add PDF files to organize</p>}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleOrganize}
//           disabled={pages.length === 0}
//           className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
//             }`}
//         >
//           Organize
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
//             className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-4 border-b flex items-center justify-between">
//               <h3 className="text-xl font-bold text-gray-900">Organize PDF</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>

//             <div className="p-4">
//               {/* Mobile Files List */}
//               <div className="mb-6">
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-lg font-semibold text-gray-900">Files:</h4>
//                   <button
//                     onClick={resetChanges}
//                     className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
//                   >
//                     <RotateCcw className="w-3 h-3" />
//                     Reset
//                   </button>
//                 </div>

//                 <DragDropContext onPageDragEnd={handlePageDragEnd} onFileDragEnd={handleFileDragEnd}>
//                   {({
//                     handleDragStart,
//                     handleDragOver,
//                     handleDragEnd,
//                     handleDragLeave,
//                     draggedItem,
//                     dragOverItem,
//                     dragType,
//                   }) => (
//                     <div className="space-y-2">
//                       {files.map((file, index) => {
//                         const filePages = pages.filter((page) => page.fileId === file.id)
//                         return (
//                           <DraggableFileItem
//                             key={file.id}
//                             file={file}
//                             index={index}
//                             filePages={filePages}
//                             onRemove={removeFile}
//                             handleDragStart={handleDragStart}
//                             handleDragOver={handleDragOver}
//                             handleDragEnd={handleDragEnd}
//                             handleDragLeave={handleDragLeave}
//                             draggedItem={draggedItem}
//                             dragOverItem={dragOverItem}
//                             dragType={dragType}
//                           />
//                         )
//                       })}
//                     </div>
//                   )}
//                 </DragDropContext>
//               </div>

//               {/* Mobile Help text */}
//               <div className="bg-blue-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-blue-800">
//                   Drag and drop pages to reorder them. Hover over pages to add blank pages. Use the rotate and delete
//                   buttons to modify individual pages.
//                 </p>
//               </div>

//               {passwordProtectedFiles.size > 0 && (
//                 <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                   <p className="text-sm text-yellow-800">
//                     {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                     detected. Passwords will be required for processing.
//                   </p>
//                 </div>
//               )}

//               {/* Mobile Stats */}
//               <div className="space-y-4 mb-6">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Files loaded:</span>
//                   <span className="font-semibold text-gray-900">{files.length}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Total pages:</span>
//                   <span className="font-semibold text-gray-900">{pages.length}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Total size:</span>
//                   <span className="font-semibold text-gray-900">{totalSize} MB</span>
//                 </div>
//                 {passwordProtectedFiles.size > 0 && (
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Password protected:</span>
//                     <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                   </div>
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
