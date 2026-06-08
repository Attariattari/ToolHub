
"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { RefreshCw, FileText } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import { FaRegHandPaper } from "react-icons/fa"
import { MdFileCopy } from "react-icons/md"
import { AiOutlineFileSearch } from "react-icons/ai"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.entry.js`

export default function PDFRedactViewer({
  fileUrl,
  fileId,
  redactionItems,
  addRedactionItem,
  currentPage,
  setCurrentPage,
  zoomLevel,
  setZoomLevel,
  numPages,
  setNumPages,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  isPasswordProtected,
  password,
  searchResults,
  showMarkPagesModal,
  setShowMarkPagesModal,
}) {
  const [basePageWidth, setBasePageWidth] = useState(0)
  const [basePageHeight, setBasePageHeight] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 })
  const [activeMode, setActiveMode] = useState("hand") // 'hand', 'redact'
  const containerRef = useRef(null)
  const pageRefs = useRef({})

  const handlePageLoadSuccess = useCallback(
    (page) => {
      if (basePageWidth === 0 || basePageHeight === 0) {
        const viewport = page.getViewport({ scale: 1 })
        setBasePageWidth(viewport.width)
        setBasePageHeight(viewport.height)
      }
    },
    [basePageWidth, basePageHeight],
  )

  // Calculate actual page dimensions based on zoom level with container constraints
  const pageWidth = useMemo(() => {
    const calculatedWidth = basePageWidth * (zoomLevel / 100)
    const containerWidth = containerRef.current?.clientWidth || 800

    // Auto-adjust width based on screen size
    if (window.innerWidth < 768) {
      // Mobile: use 95% of container width
      return Math.min(calculatedWidth, containerWidth * 0.95)
    } else if (window.innerWidth < 1024) {
      // Tablet: use 90% of container width
      return Math.min(calculatedWidth, containerWidth * 0.9)
    } else {
      // Desktop: use container width minus padding
      return Math.min(calculatedWidth, containerWidth - 40)
    }
  }, [basePageWidth, zoomLevel])

  const pageHeight = useMemo(() => basePageHeight * (zoomLevel / 100), [basePageHeight, zoomLevel])

  // Handle drag scrolling (only in hand mode)
  const handleMouseDown = useCallback(
    (e) => {
      if (activeMode === "hand" && e.button === 0) {
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setScrollStart({
          x: containerRef.current?.scrollLeft || 0,
          y: containerRef.current?.scrollTop || 0,
        })
        e.preventDefault()
      }
    },
    [activeMode],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging && containerRef.current && activeMode === "hand") {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        containerRef.current.scrollLeft = scrollStart.x - deltaX
        containerRef.current.scrollTop = scrollStart.y - deltaY
      }
    },
    [isDragging, dragStart, scrollStart, activeMode],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for drag scrolling
  useEffect(() => {
    if (isDragging && activeMode === "hand") {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, activeMode])

  // Enhanced scroll handling for page detection
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerTop = container.scrollTop
      const containerHeight = container.clientHeight
      let closestPage = 1
      let minDistance = Number.POSITIVE_INFINITY

      Object.keys(pageRefs.current).forEach((pageNum) => {
        const pageElement = pageRefs.current[pageNum]
        if (pageElement) {
          const pageTop = pageElement.offsetTop - containerTop
          const pageHeight = pageElement.offsetHeight
          const pageCenter = pageTop + pageHeight / 2
          const distance = Math.abs(pageCenter - containerHeight / 2)

          if (distance < minDistance) {
            minDistance = distance
            closestPage = Number.parseInt(pageNum)
          }
        }
      })

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage)
      }
    }

    const throttledScroll = (() => {
      let timeoutId = null
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(handleScroll, 50)
      }
    })()

    container.addEventListener("scroll", throttledScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", throttledScroll)
    }
  }, [currentPage, setCurrentPage])

  // Scroll to current page when currentPage changes
  useEffect(() => {
    if (pageRefs.current[currentPage]) {
      pageRefs.current[currentPage].scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [currentPage])

  const renderPage = useCallback(
    (pageNumber) => {
      const isActivePage = pageNumber === currentPage
      const pageRedactionItems = redactionItems.filter((item) => item.page === pageNumber)

      return (
        <div
          key={`page_${pageNumber}`}
          ref={(el) => (pageRefs.current[pageNumber] = el)}
          className={`relative my-2 md:my-4 bg-white mx-auto shadow-sm select-none ${isActivePage ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setCurrentPage(pageNumber)}
          style={{
            width: `${pageWidth}px`,
            height: "auto",
            maxWidth: "100%",
          }}
        >
          <div className="relative">
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={handlePageLoadSuccess}
              loading={
                <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              }
              className="pdf-page-container"
            />
          </div>
          {/* Page number indicator */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {pageNumber}
          </div>
        </div>
      )
    },
    [currentPage, redactionItems, pageWidth, setCurrentPage, handlePageLoadSuccess],
  )

  const getCursorStyle = () => {
    switch (activeMode) {
      case "hand":
        return isDragging ? "grabbing" : "grab"
      case "redact":
        return "crosshair"
      default:
        return "default"
    }
  }

  // Memoize the options object
  const documentOptions = useMemo(
    () => ({
      cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      password: password || undefined,
    }),
    [password],
  )

  // Conditional rendering
  if (!fileUrl && !isPasswordProtected) {
    return (
      <div className="w-full h-96 bg-gray-50 flex items-center justify-center rounded-lg">
        <FileText className="w-16 h-16 text-gray-400" />
        <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
      </div>
    )
  }

  if (isPasswordProtected && !password) {
    return (
      <div className="w-full h-96 bg-yellow-50 flex flex-col items-center justify-center rounded-lg border border-yellow-300">
        <IoMdLock className="text-4xl text-yellow-600" />
        <p className="mt-2 text-yellow-800">Enter password to view PDF</p>
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      <div className="p-2 border-b border-gray-200 bg-white z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode("hand")}
            className={`py-2 px-3 rounded ${activeMode === "hand" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
            title="Hand Tool - Drag to scroll"
          >
            <FaRegHandPaper />
          </button>
          <button
            onClick={() => setActiveMode("redact")}
            className={`py-2 px-3 rounded flex items-center gap-1 ${activeMode === "redact" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
            title="Redact Mode"
          >
            <AiOutlineFileSearch className="text-blue-500" />
            <span className="text-sm text-blue-600 font-medium">Redact</span>
          </button>
          <button
            onClick={() => setShowMarkPagesModal(true)}
            className="py-2 px-3 hover:bg-gray-200 rounded"
            title="Mark Pages"
          >
            <MdFileCopy />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-auto custom-scrollbar bg-gray-50 p-2 md:p-4"
        onMouseDown={handleMouseDown}
        style={{ cursor: getCursorStyle() }}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={(pdf) => {
            setNumPages(pdf.numPages)
            onDocumentLoadSuccess(pdf, fileId)
          }}
          onLoadError={(error) => onDocumentLoadError(error, fileId)}
          loading={
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          }
          error={
            <div className="w-full h-96 bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
              <FileText className="w-12 h-12 text-blue-400 mb-2" />
              <div className="text-sm text-blue-600 font-medium text-center">Could not load PDF</div>
            </div>
          }
          options={documentOptions}
          className="flex flex-col items-center"
        >
          {/* Show all pages with responsive sizing */}
          {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
        </Document>
      </div>
    </div>
  )
}