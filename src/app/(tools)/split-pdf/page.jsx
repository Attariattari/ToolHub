"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, Plus, Move, Check } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const pdfOptions = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

// Memoized PDF Preview Component with consistent height
const PDFPreview = memo(({ file, pageNumber = 1, width = 120, isVisible, className = "" }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const elementRef = useRef(null)
  const [shouldRender, setShouldRender] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
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

  useEffect(() => {
    if (shouldRender) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [shouldRender, file, pageNumber])

  const handleLoadError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
  }, [])

  const handleLoadSuccess = useCallback(() => {
    setHasError(false)
    setIsLoading(false)
  }, [])

  const renderPreview = () => {
    if (!shouldRender) {
      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
          <div style={{ height: `${width * 1.4}px` }} />
        </div>
      )
    }

    if (hasError) {
      return (
        <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-2">
          <FileText className="w-8 h-8 text-red-400 mb-1" />
          <div className="text-xs text-red-600 font-medium text-center">Could not load</div>
        </div>
      )
    }

    if (file?.stableData) {
      return (
        <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
              <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}
          <Document
            file={file.stableData.dataUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            loading={null}
            error={null}
            className="w-full h-full flex items-center justify-center"
            options={pdfOptions}
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-gray-200 shadow-sm"
              loading={null}
              onRenderSuccess={handleLoadSuccess}
              onRenderError={handleLoadError}
            />
          </Document>
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
    )
  }

  return (
    <div ref={elementRef} className={`w-full h-full ${className}`}>
      {renderPreview()}
    </div>
  )
})

PDFPreview.displayName = "PDFPreview"

export default function SplitPDFPage() {
  const [file, setFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pdfPages, setPdfPages] = useState(0)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [pdfHealthCheck, setPdfHealthCheck] = useState(true)
  const [activeTab, setActiveTab] = useState("range")

  // Range mode states
  const [rangeMode, setRangeMode] = useState("custom")
  const [ranges, setRanges] = useState([{ id: 1, from: 1, to: 1 }])
  const [mergeRanges, setMergeRanges] = useState(false)
  const [fixedRangeSize, setFixedRangeSize] = useState(1)
  const [draggedRangeIndex, setDraggedRangeIndex] = useState(null)
  const [dragOverRangeIndex, setDragOverRangeIndex] = useState(null)

  // Pages mode states
  const [selectedPages, setSelectedPages] = useState(new Set())
  const [extractMode, setExtractMode] = useState("extract-all")
  const [pagesInput, setPagesInput] = useState("")
  const [mergeExtracted, setMergeExtracted] = useState(false)

  // Size mode states
  const [maxSize, setMaxSize] = useState(25)
  const [sizeUnit, setSizeUnit] = useState("MB")
  const [allowCompression, setAllowCompression] = useState(true)
  const [sizeInputValue, setSizeInputValue] = useState("25")

  const fileRef = useRef(null)
  const fileDataCache = useRef(null)
  const pdfDocumentCache = useRef(null)
  const router = useRouter()

  // Get file size in MB for validation
  const fileSizeInMB = useMemo(() => {
    if (!file) return 0
    return Number.parseFloat(file.size.replace(" MB", ""))
  }, [file])

  // Format pages selection to ranges (e.g., "1-8,10-14,17-20")
  const formatPagesSelection = useCallback((pages) => {
    if (pages.size === 0) return ""

    const sortedPages = Array.from(pages).sort((a, b) => a - b)
    const ranges = []
    let start = sortedPages[0]
    let end = sortedPages[0]

    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === end + 1) {
        end = sortedPages[i]
      } else {
        if (start === end) {
          ranges.push(start.toString())
        } else {
          ranges.push(`${start}-${end}`)
        }
        start = sortedPages[i]
        end = sortedPages[i]
      }
    }

    if (start === end) {
      ranges.push(start.toString())
    } else {
      ranges.push(`${start}-${end}`)
    }

    return ranges.join(",")
  }, [])

  // Update pages input when selection changes
  useEffect(() => {
    if (extractMode === "select") {
      const formatted = formatPagesSelection(selectedPages)
      setPagesInput(formatted)
    }
  }, [selectedPages, extractMode, formatPagesSelection])

  // Initialize all pages selection when PDF loads
  useEffect(() => {
    if (pdfPages > 0 && extractMode === "extract-all") {
      const allPages = new Set()
      for (let i = 1; i <= pdfPages; i++) {
        allPages.add(i)
      }
      setSelectedPages(allPages)
    }
  }, [pdfPages, extractMode])

  // Optimized file data creation with object URLs
  const createStableFileData = useCallback(async (file) => {
    if (fileDataCache.current) {
      return fileDataCache.current
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
      fileDataCache.current = stableData
      return stableData
    } catch (error) {
      console.error("Error creating stable file data:", error)
      return null
    }
  }, [])

  // Handle size input with proper validation
  const handleSizeInputChange = useCallback(
    (value) => {
      setSizeInputValue(value)

      if (value === "" || value === "0") {
        return
      }

      const numValue = Number.parseInt(value) || 1

      if (sizeUnit === "MB") {
        const maxMB = Math.floor(fileSizeInMB)
        if (numValue > maxMB) {
          setMaxSize(maxMB)
          setSizeInputValue(maxMB.toString())
        } else {
          setMaxSize(numValue)
        }
      } else {
        const maxKB = Math.floor(fileSizeInMB * 1024)
        if (numValue > maxKB) {
          setMaxSize(maxKB)
          setSizeInputValue(maxKB.toString())
        } else {
          setMaxSize(numValue)
        }
      }
    },
    [fileSizeInMB, sizeUnit],
  )

  const handleSizeInputBlur = useCallback(() => {
    if (sizeInputValue === "" || sizeInputValue === "0") {
      setSizeInputValue("1")
      setMaxSize(1)
    }
  }, [sizeInputValue])

  const handleSizeUnitChange = useCallback(
    (newUnit) => {
      if (newUnit === sizeUnit) return

      if (newUnit === "KB" && sizeUnit === "MB") {
        const newValue = maxSize * 1024
        setMaxSize(newValue)
        setSizeInputValue(newValue.toString())
      } else if (newUnit === "MB" && sizeUnit === "KB") {
        const newValue = Math.max(1, Math.floor(maxSize / 1024))
        setMaxSize(newValue)
        setSizeInputValue(newValue.toString())
      }
      setSizeUnit(newUnit)
    },
    [maxSize, sizeUnit],
  )

  const handleFiles = useCallback(
    async (newFiles) => {
      if (newFiles.length === 0) return

      const selectedFile = newFiles[0]
      const stableData = await createStableFileData(selectedFile)

      const fileObject = {
        id: Date.now(),
        file: selectedFile,
        name: selectedFile.name,
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + " MB",
        type: selectedFile.type,
        stableData,
      }

      setFile(fileObject)
      setLoadingPdf(true)
      setPdfPages(0)
      setPdfHealthCheck(true)
    },
    [createStableFileData],
  )

  const removeFile = useCallback(() => {
    setLoadingPdf(false)

    // Clean up object URL
    if (fileDataCache.current && fileDataCache.current.dataUrl && fileDataCache.current.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileDataCache.current.dataUrl)
    }

    fileDataCache.current = null

    if (pdfDocumentCache.current) {
      try {
        if (pdfDocumentCache.current.destroy) {
          pdfDocumentCache.current.destroy()
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e)
      }
      pdfDocumentCache.current = null
    }

    setFile(null)
    setPdfPages(0)
    setPdfHealthCheck(true)
    setRanges([{ id: 1, from: 1, to: 1 }])
    setSelectedPages(new Set())
    setPagesInput("")
  }, [])

  const onDocumentLoadSuccess = useCallback(
    (pdf) => {
      console.log("PDF loaded successfully with", pdf.numPages, "pages")
      setLoadingPdf(false)
      setPdfPages(pdf.numPages)
      pdfDocumentCache.current = pdf
      setPdfHealthCheck(true)

      if (rangeMode === "custom") {
        setRanges([{ id: 1, from: 1, to: pdf.numPages }])
      }

      if (extractMode === "extract-all") {
        const allPages = new Set()
        for (let i = 1; i <= pdf.numPages; i++) {
          allPages.add(i)
        }
        setSelectedPages(allPages)
      }
    },
    [rangeMode, extractMode],
  )

  const onDocumentLoadError = useCallback((error) => {
    console.warn("PDF load error:", error)
    setLoadingPdf(false)
    setPdfHealthCheck(false)
  }, [])

  // Range management functions
  const addRange = useCallback(() => {
    const newId = Math.max(...ranges.map((r) => r.id)) + 1
    setRanges((prev) => [...prev, { id: newId, from: 1, to: pdfPages }])
  }, [ranges, pdfPages])

  const removeRange = useCallback(
    (id) => {
      if (ranges.length > 1) {
        setRanges((prev) => prev.filter((r) => r.id !== id))
      }
    },
    [ranges.length],
  )

  const updateRange = useCallback(
    (id, field, value) => {
      const numValue = Math.max(1, Math.min(pdfPages, Number.parseInt(value) || 1))
      setRanges((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: numValue } : r)))
    },
    [pdfPages],
  )

  // Generate fixed ranges
  const fixedRanges = useMemo(() => {
    if (rangeMode !== "fixed" || pdfPages === 0) return []

    const newRanges = []
    let currentPage = 1
    let rangeId = 1

    while (currentPage <= pdfPages) {
      const endPage = Math.min(currentPage + fixedRangeSize - 1, pdfPages)
      newRanges.push({
        id: rangeId++,
        from: currentPage,
        to: endPage,
      })
      currentPage = endPage + 1
    }

    return newRanges
  }, [rangeMode, fixedRangeSize, pdfPages])

  // Page selection functions
  const togglePageSelection = useCallback(
    (pageNum) => {
      setSelectedPages((prev) => {
        const newSelected = new Set(prev)
        if (newSelected.has(pageNum)) {
          newSelected.delete(pageNum)
        } else {
          newSelected.add(pageNum)
        }

        if (extractMode === "extract-all" && newSelected.size < pdfPages) {
          setExtractMode("select")
        }

        return newSelected
      })
    },
    [extractMode, pdfPages],
  )

  const selectAllPages = useCallback(() => {
    const allPages = new Set()
    for (let i = 1; i <= pdfPages; i++) {
      allPages.add(i)
    }
    setSelectedPages(allPages)
  }, [pdfPages])

  const clearPageSelection = useCallback(() => {
    setSelectedPages(new Set())
  }, [])

  const handleExtractModeChange = useCallback(
    (mode) => {
      setExtractMode(mode)
      if (mode === "extract-all") {
        selectAllPages()
      } else {
        setSelectedPages(new Set())
      }
    },
    [selectAllPages],
  )

  // Optimized drag handlers
  const handleRangeDragStart = useCallback((e, index) => {
    setDraggedRangeIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleRangeDragOver = useCallback(
    (e, index) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (draggedRangeIndex !== null && draggedRangeIndex !== index) {
        setDragOverRangeIndex(index)
      }
    },
    [draggedRangeIndex],
  )

  const handleRangeDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault()
      if (draggedRangeIndex === null || draggedRangeIndex === dropIndex) {
        setDragOverRangeIndex(null)
        setDraggedRangeIndex(null)
        return
      }

      const currentRanges = rangeMode === "fixed" ? fixedRanges : ranges
      const newRanges = [...currentRanges]
      const [movedItem] = newRanges.splice(draggedRangeIndex, 1)
      newRanges.splice(dropIndex, 0, movedItem)

      if (rangeMode === "custom") {
        setRanges(newRanges)
      }

      setDragOverRangeIndex(null)
      setDraggedRangeIndex(null)
    },
    [draggedRangeIndex, rangeMode, fixedRanges, ranges],
  )

  // Memoized range cards with consistent heights
  const customRangeCards = useMemo(() => {
    if (rangeMode !== "custom" || ranges.length === 0) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {ranges.map((range, index) => (
          <div
            key={range.id}
            className={`bg-white rounded-xl border-2 p-4 cursor-move transition-all duration-200 ${dragOverRangeIndex === index
                ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
                : draggedRangeIndex === index
                  ? "border-red-500 opacity-50"
                  : "border-gray-200 hover:border-red-300 hover:shadow-lg"
              }`}
            draggable="true"
            onDragStart={(e) => handleRangeDragStart(e, index)}
            onDragOver={(e) => handleRangeDragOver(e, index)}
            onDrop={(e) => handleRangeDrop(e, index)}
            onDragEnd={() => {
              setDragOverRangeIndex(null)
              setDraggedRangeIndex(null)
            }}
          >
            {/* Fixed height container for previews - same as merge PDF */}
            <div className="flex gap-2 h-32">
              <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                <PDFPreview file={file} pageNumber={range.from} width={120} />
                <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                  {range.from}
                </div>
              </div>
              <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                <PDFPreview file={file} pageNumber={range.to} width={120} />
                <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                  {range.to}
                </div>
              </div>
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-medium text-gray-900">Range {index + 1}</p>
              <p className="text-xs text-gray-500">
                {range.from === range.to ? `Page ${range.from}` : `Pages ${range.from}-${range.to}`}
              </p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Move className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    )
  }, [
    rangeMode,
    ranges,
    file,
    dragOverRangeIndex,
    draggedRangeIndex,
    handleRangeDragStart,
    handleRangeDragOver,
    handleRangeDrop,
  ])

  // Memoized content renderers
  const rangeContent = useMemo(() => {
    if (rangeMode === "custom") {
      return (
        customRangeCards || (
          <div className="flex justify-center items-center h-full">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 max-w-md">
              {/* Fixed height container - same as merge PDF */}
              <div className="relative h-96 flex justify-center items-center bg-gray-100 rounded-lg mb-4">
                <PDFPreview file={file} pageNumber={1} width={250} />
                <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {pdfPages}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 truncate" title={file?.name}>
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{file?.size}</p>
              </div>
            </div>
          </div>
        )
      )
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {fixedRanges.map((range, index) => (
            <div
              key={range.id}
              className={`bg-white rounded-xl border-2 p-4 cursor-move transition-all duration-200 ${dragOverRangeIndex === index
                  ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
                  : draggedRangeIndex === index
                    ? "border-red-500 opacity-50"
                    : "border-gray-200 hover:border-red-300 hover:shadow-lg"
                }`}
              draggable="true"
              onDragStart={(e) => handleRangeDragStart(e, index)}
              onDragOver={(e) => handleRangeDragOver(e, index)}
              onDrop={(e) => handleRangeDrop(e, index)}
              onDragEnd={() => {
                setDragOverRangeIndex(null)
                setDraggedRangeIndex(null)
              }}
            >
              {/* Fixed height container - same as merge PDF */}
              <div className="flex gap-2 h-32">
                <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                  <PDFPreview file={file} pageNumber={range.from} width={120} />
                  <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                    {range.from}
                  </div>
                </div>
                <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                  <PDFPreview file={file} pageNumber={range.to} width={120} />
                  <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                    {range.to}
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-medium text-gray-900">Range {index + 1}</p>
                <p className="text-xs text-gray-500">
                  {range.from === range.to ? `Page ${range.from}` : `Pages ${range.from}-${range.to}`}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <Move className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      )
    }
  }, [
    rangeMode,
    customRangeCards,
    file,
    pdfPages,
    fixedRanges,
    dragOverRangeIndex,
    draggedRangeIndex,
    handleRangeDragStart,
    handleRangeDragOver,
    handleRangeDrop,
  ])

  const pagesContent = useMemo(() => {
    const pageNumbers = Array.from({ length: pdfPages }, (_, i) => i + 1)

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pageNumbers.map((pageNum) => (
          <div
            key={pageNum}
            className={`bg-white rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 ${selectedPages.has(pageNum) ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"
              }`}
            onClick={() => togglePageSelection(pageNum)}
          >
            {/* Fixed height container - same as merge PDF */}
            <div className="relative h-48 flex justify-center items-center bg-gray-100 rounded-lg mb-3">
              {selectedPages.has(pageNum) && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <PDFPreview file={file} pageNumber={pageNum} width={120} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-900">{pageNum}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }, [pdfPages, selectedPages, file, togglePageSelection])

  const sizeContent = useMemo(
    () => (
      <div className="flex justify-center items-center h-full">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 max-w-md">
          {/* Fixed height container - same as merge PDF */}
          <div className="relative h-96 flex justify-center items-center bg-gray-100 rounded-lg mb-4">
            <PDFPreview file={file} pageNumber={1} width={250} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 truncate" title={file?.name}>
              {file?.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">{file?.size}</p>
          </div>
        </div>
      </div>
    ),
    [file],
  )

  const renderMainContent = useCallback(() => {
    switch (activeTab) {
      case "range":
        return rangeContent
      case "pages":
        return pagesContent
      case "size":
        return sizeContent
      default:
        return rangeContent
    }
  }, [activeTab, rangeContent, pagesContent, sizeContent])

  const handleSplit = useCallback(async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file.file)
      formData.append("splitMode", activeTab)

      if (activeTab === "range") {
        formData.append("rangeMode", rangeMode)
        const rangesToUse = rangeMode === "fixed" ? fixedRanges : ranges
        formData.append("ranges", JSON.stringify(rangesToUse))
        formData.append("mergeRanges", mergeRanges.toString())
        if (rangeMode === "fixed") {
          formData.append("fixedRangeSize", fixedRangeSize.toString())
        }
      } else if (activeTab === "pages") {
        formData.append("extractMode", extractMode)
        if (extractMode === "select") {
          formData.append("selectedPages", JSON.stringify(Array.from(selectedPages)))
        }
        formData.append("mergeExtracted", mergeExtracted.toString())
      } else if (activeTab === "size") {
        formData.append("maxSize", maxSize.toString())
        formData.append("sizeUnit", sizeUnit)
        formData.append("allowCompression", allowCompression.toString())
      }

      const response = await Api.post("/tools/split", formData, {
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
        toast.error("No split files received from server")
      }
    } catch (error) {
      console.error("Split error:", error)
      toast.error(error?.response?.data?.message || "Error splitting file")
      alert("Failed to split PDF. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [
    file,
    activeTab,
    rangeMode,
    fixedRanges,
    ranges,
    mergeRanges,
    fixedRangeSize,
    extractMode,
    selectedPages,
    mergeExtracted,
    maxSize,
    sizeUnit,
    allowCompression,
    router,
  ])

  const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount 
  useEffect(() => {
    return () => {
      if (fileDataCache.current && fileDataCache.current.dataUrl && fileDataCache.current.dataUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileDataCache.current.dataUrl)
      }
    }
  }, [])

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />
  }

  if (!file) {
    return (
      <SafeFileUploader
        isMultiple={false}
        onFilesSelect={handleFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF file"
        pageTitle="Split PDF file"
        pageSubTitle="Separate one page or a whole set for easy conversion into independent PDF files."
      />
    )
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      {/* Hidden Document component for page count */}
      {file && file.stableData && (
        <Document
          file={file.stableData.dataUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
          className="hidden"
        />
      )}
      <div className="grid grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="py-5 px-3 md:px-12 col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "range" &&
                rangeMode === "custom" &&
                `${ranges.length} Custom Range${ranges.length > 1 ? "s" : ""}`}
              {activeTab === "range" && rangeMode === "fixed" && `${fixedRanges.length} Fixed Ranges`}
              {activeTab === "pages" && `${selectedPages.size} Pages Selected`}
              {activeTab === "size" && "Split by Size"}
            </h2>

            <button
              onClick={removeFile}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Remove File
            </button>
          </div>

          {renderMainContent()}
        </div>

        {/* Sidebar */}
        <div className="col-span-3 overflow-y-auto custom-scrollbar border-l flex flex-col">
          <div className="p-6 border-b">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Split</h3>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("range")}
                className={`relative flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-2 ${activeTab === "range"
                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {activeTab === "range" && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="w-6 h-6 border-2 border-current rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-current rounded-sm"></div>
                </div>
                Range
              </button>
              <button
                onClick={() => setActiveTab("pages")}
                className={`relative flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-2 ${activeTab === "pages"
                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {activeTab === "pages" && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 border border-current rounded-sm"></div>
                  <div className="w-2 h-2 border border-current rounded-sm"></div>
                  <div className="w-2 h-2 border border-current rounded-sm"></div>
                  <div className="w-2 h-2 border border-current rounded-sm"></div>
                </div>
                Pages
              </button>
              <button
                onClick={() => setActiveTab("size")}
                className={`relative flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-2 ${activeTab === "size"
                    ? "bg-green-100 text-green-800 border-2 border-green-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {activeTab === "size" && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="w-6 h-6 border-2 border-current rounded flex items-center justify-center">
                  <div className="text-xs font-bold">S</div>
                </div>
                Size
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {activeTab === "range" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Range mode:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRangeMode("custom")}
                      className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${rangeMode === "custom"
                          ? "bg-red-100 text-red-800 border-2 border-red-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Custom ranges
                    </button>
                    <button
                      onClick={() => setRangeMode("fixed")}
                      className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${rangeMode === "fixed"
                          ? "bg-red-100 text-red-800 border-2 border-red-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Fixed ranges
                    </button>
                  </div>
                </div>

                {rangeMode === "custom" && (
                  <div className="space-y-4">
                    {ranges.map((range, index) => (
                      <div key={range.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Range {index + 1}</span>
                          {ranges.length > 1 && (
                            <button
                              onClick={() => removeRange(range.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">from page</label>
                            <input
                              type="number"
                              min="1"
                              max={pdfPages}
                              value={range.from}
                              onChange={(e) => updateRange(range.id, "from", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                            />
                          </div>
                          <span className="text-gray-500 mt-5">to</span>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">to</label>
                            <input
                              type="number"
                              min="1"
                              max={pdfPages}
                              value={range.to}
                              onChange={(e) => updateRange(range.id, "to", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addRange}
                      className="w-full p-2 border-2 border-dashed border-red-300 text-red-600 rounded-lg hover:border-red-400 hover:text-red-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Range
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mergeRanges"
                        checked={mergeRanges}
                        onChange={(e) => setMergeRanges(e.target.checked)}
                        className="w-4 h-4 bg-gray-100 border-red-300 rounded focus:ring-red-500 text-red-600"
                      />
                      <label htmlFor="mergeRanges" className="text-sm text-gray-700">
                        Merge all ranges in one PDF file.
                      </label>
                    </div>
                  </div>
                )}

                {rangeMode === "fixed" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Split into page ranges of:</label>
                      <input
                        type="number"
                        min="1"
                        max={pdfPages}
                        value={fixedRangeSize}
                        onChange={(e) => setFixedRangeSize(Number.parseInt(e.target.value) || 1)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        This PDF will be split into files of {fixedRangeSize} pages.{" "}
                        {Math.ceil(pdfPages / fixedRangeSize)} PDFs will be created.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pages" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Extract mode:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExtractModeChange("extract-all")}
                      className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${extractMode === "extract-all"
                          ? "bg-gray-100 text-gray-800 border-2 border-gray-300"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      Extract all pages
                    </button>
                    <button
                      onClick={() => handleExtractModeChange("select")}
                      className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${extractMode === "select"
                          ? "bg-red-100 text-red-800 border-2 border-red-300"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      Select pages
                    </button>
                  </div>
                </div>

                {extractMode === "select" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pages to extract:</label>
                      <input
                        type="text"
                        placeholder="1-3,5-6,8-196"
                        value={pagesInput}
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={selectAllPages}
                        className="flex-1 p-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearPageSelection}
                        className="flex-1 p-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mergeExtracted"
                        checked={mergeExtracted}
                        onChange={(e) => setMergeExtracted(e.target.checked)}
                        className="w-4 h-4 bg-gray-100 border-red-300 rounded focus:ring-red-500 text-red-600"
                      />
                      <label htmlFor="mergeExtracted" className="text-sm text-gray-700">
                        Merge extracted pages into one PDF file.
                      </label>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Selected pages will be converted into separate PDF files. {selectedPages.size} PDF will be
                        created.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "size" && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Original file size:</span>
                    <span className="font-semibold">{file.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total pages:</span>
                    <span className="font-semibold">{pdfPages}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum size per file:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sizeInputValue}
                      onChange={(e) => handleSizeInputChange(e.target.value)}
                      onBlur={handleSizeInputBlur}
                      className="flex-1 p-3 border border-gray-300 rounded-lg bg-white"
                      placeholder="Enter size"
                    />
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleSizeUnitChange("KB")}
                        className={`px-4 py-3 text-sm font-medium ${sizeUnit === "KB" ? "bg-gray-200 text-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        KB
                      </button>
                      <button
                        onClick={() => handleSizeUnitChange("MB")}
                        className={`px-4 py-3 text-sm font-medium ${sizeUnit === "MB" ? "bg-gray-200 text-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        MB
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This PDF will be split into files no larger than {maxSize} {sizeUnit} each.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowCompression"
                    checked={allowCompression}
                    onChange={(e) => setAllowCompression(e.target.checked)}
                    className="w-4 h-4 bg-gray-100 border-red-300 rounded focus:ring-red-500 text-red-600"
                  />
                  <label htmlFor="allowCompression" className="text-sm text-gray-700">
                    Allow compression
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Split Button */}
          <div className="p-6 border-t">
            <button
              onClick={handleSplit}
              disabled={
                (activeTab === "pages" && extractMode === "select" && selectedPages.size === 0) || !pdfHealthCheck
              }
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${(activeTab === "pages" && extractMode === "select" && selectedPages.size === 0) || !pdfHealthCheck
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                }`}
            >
              Split PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {activeTab === "pages" && extractMode === "select" && selectedPages.size === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select at least 1 page to extract</p>
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

        /* Custom checkbox styles */
        input[type="checkbox"] {
          appearance: none;
          background-color: #f3f4f6;
          border: 2px solid #ef4444;
          border-radius: 4px;
          cursor: pointer;
        }

        input[type="checkbox"]:checked {
          background-color: #ef4444;
          border-color: #ef4444;
        }

        input[type="checkbox"]:checked::before {
          content: '✓';
          display: block;
          text-align: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        input[type="checkbox"]:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  )
}
