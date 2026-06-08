"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { RefreshCw, FileText } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import CropBox from "@/components/tools/CropBox"

export default function PDFViewer({
  fileUrl,
  fileId,
  cropAreas,
  setCropAreaForPage,
  currentPage,
  setCurrentPage,
  zoomLevel,
  numPages,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  isPasswordProtected,
  password,
  applyToAllPages,
  onPageDimensionsChange,
}) {
  const [basePageWidth, setBasePageWidth] = useState(0)
  const [basePageHeight, setBasePageHeight] = useState(0)
  const containerRef = useRef(null)
  const pageRefs = useRef({})

  // Get container width for responsive sizing - fit PDF to container
  const [containerWidth, setContainerWidth] = useState(0)

  // Update container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const padding = 32 // Standard padding
        setContainerWidth(rect.width - padding)
      }
    }

    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)
    return () => window.removeEventListener('resize', updateContainerWidth)
  }, [])

  const handlePageLoadSuccess = useCallback(
    (page) => {
      // Only set base dimensions once (at 100% zoom)
      if (basePageWidth === 0 || basePageHeight === 0) {
        const viewport = page.getViewport({ scale: 1 })
        const width = viewport.width
        const height = viewport.height
        setBasePageWidth(width)
        setBasePageHeight(height)

        // Send page dimensions to parent for accurate cropping
        if (onPageDimensionsChange) {
          onPageDimensionsChange(width, height)
        }
      }
    },
    [basePageWidth, basePageHeight, onPageDimensionsChange],
  )

  // Calculate actual page dimensions - fit to container width while maintaining aspect ratio
  const { pageWidth, pageHeight, scaleFactor } = useMemo(() => {
    if (!basePageWidth || !basePageHeight || !containerWidth) {
      return { pageWidth: 0, pageHeight: 0, scaleFactor: 1 }
    }

    // Apply zoom level first
    const zoomAdjustedWidth = basePageWidth * (zoomLevel / 100)
    const zoomAdjustedHeight = basePageHeight * (zoomLevel / 100)

    // Fit to container width if needed (responsive behavior)
    const maxWidth = containerWidth
    let finalWidth = zoomAdjustedWidth
    let finalHeight = zoomAdjustedHeight
    let actualScale = zoomLevel / 100

    if (zoomAdjustedWidth > maxWidth) {
      // Scale down to fit container
      const fitScale = maxWidth / zoomAdjustedWidth
      finalWidth = maxWidth
      finalHeight = zoomAdjustedHeight * fitScale
      actualScale = (zoomLevel / 100) * fitScale
    }

    return {
      pageWidth: finalWidth,
      pageHeight: finalHeight,
      scaleFactor: actualScale
    }
  }, [basePageWidth, basePageHeight, zoomLevel, containerWidth])

  // Get the crop for display (scaled to current display size)
  const getDisplayCrop = useCallback((pageNumber) => {
    const cropKey = applyToAllPages ? 1 : pageNumber
    const crop = cropAreas.get(cropKey)

    // Only return crop if it actually exists
    if (!crop) return null

    // Scale crop coordinates to current display size using scaleFactor
    return {
      x: crop.x * scaleFactor,
      y: crop.y * scaleFactor,
      width: crop.width * scaleFactor,
      height: crop.height * scaleFactor
    }
  }, [cropAreas, applyToAllPages, scaleFactor])

  // Handle crop change (convert back to base coordinates)
  const handleCropChange = useCallback(
    (newCrop) => {
      // Convert the crop back to base coordinates using scaleFactor
      const baseCrop = {
        x: newCrop.x / scaleFactor,
        y: newCrop.y / scaleFactor,
        width: newCrop.width / scaleFactor,
        height: newCrop.height / scaleFactor
      }
      setCropAreaForPage(currentPage, baseCrop)
    },
    [currentPage, setCropAreaForPage, scaleFactor],
  )

  // State for drawing a new crop box
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [currentDrawingCrop, setCurrentDrawingCrop] = useState(null)

  const handleMouseDown = useCallback(
    (e) => {
      const cropKey = applyToAllPages ? 1 : currentPage
      const hasExistingCrop = cropAreas.has(cropKey)

      if (e.target === e.currentTarget && !hasExistingCrop) {
        setIsDrawing(true)
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setStartPoint({ x, y })
        setCurrentDrawingCrop({ x, y, width: 0, height: 0 })
      }
    },
    [cropAreas, currentPage, applyToAllPages],
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing) return

      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      const newX = Math.min(startPoint.x, currentX)
      const newY = Math.min(startPoint.y, currentY)
      const newWidth = Math.abs(currentX - startPoint.x)
      const newHeight = Math.abs(currentY - startPoint.y)

      setCurrentDrawingCrop({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      })
    },
    [isDrawing, startPoint],
  )

  const handleMouseUp = useCallback(
    (e) => {
      if (!isDrawing) return

      setIsDrawing(false)
      if (currentDrawingCrop && (currentDrawingCrop.width > 20 || currentDrawingCrop.height > 20)) {
        // Convert to base coordinates before storing using scaleFactor
        const baseCrop = {
          x: currentDrawingCrop.x / scaleFactor,
          y: currentDrawingCrop.y / scaleFactor,
          width: currentDrawingCrop.width / scaleFactor,
          height: currentDrawingCrop.height / scaleFactor
        }
        setCropAreaForPage(currentPage, baseCrop)
      }
      setCurrentDrawingCrop(null)
    },
    [isDrawing, currentDrawingCrop, currentPage, setCropAreaForPage, scaleFactor],
  )

  // Enhanced scroll handling with better page detection
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const containerTop = container.scrollTop
      const containerHeight = container.clientHeight
      const containerCenter = containerTop + containerHeight / 2

      let closestPage = 1
      let minDistance = Infinity

      Object.keys(pageRefs.current).forEach(pageNum => {
        const pageElement = pageRefs.current[pageNum]
        if (pageElement) {
          const pageTop = pageElement.offsetTop - containerTop
          const pageHeight = pageElement.offsetHeight
          const pageCenter = pageTop + pageHeight / 2
          const distance = Math.abs(pageCenter - containerHeight / 2)

          if (distance < minDistance) {
            minDistance = distance
            closestPage = parseInt(pageNum)
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

    container.addEventListener('scroll', throttledScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', throttledScroll)
    }
  }, [currentPage, setCurrentPage])

  // Scroll to current page when currentPage changes (from control bar)
  useEffect(() => {
    if (pageRefs.current[currentPage]) {
      pageRefs.current[currentPage].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [currentPage])

  const renderPage = useCallback(
    (pageNumber) => {
      const isActivePage = pageNumber === currentPage
      const displayCrop = getDisplayCrop(pageNumber)

      // Check if crop exists using proper key
      const cropKey = applyToAllPages ? 1 : pageNumber
      const hasCropArea = cropAreas.has(cropKey)

      // Show crop preview logic - ONLY show if crop actually exists
      const showCropPreview = hasCropArea
      const showInteractiveCrop = isActivePage && showCropPreview && !isDrawing

      // Determine if drawing is allowed on this page
      const canDraw = isActivePage && !hasCropArea && basePageWidth > 0 && basePageHeight > 0

      return (
        <div
          key={`page_${pageNumber}`}
          ref={(el) => pageRefs.current[pageNumber] = el}
          className={`relative my-2 md:my-4 shadow-md border border-gray-200 bg-white mx-auto ${isActivePage ? 'ring-2 ring-blue-500' : ''
            } ${canDraw ? "cursor-crosshair" : ""}`}
          onClick={() => setCurrentPage(pageNumber)}
          style={{
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
          }}
          onMouseDown={canDraw ? handleMouseDown : undefined}
          onMouseMove={canDraw ? handleMouseMove : undefined}
          onMouseUp={canDraw ? handleMouseUp : undefined}
          onMouseLeave={canDraw && isDrawing ? handleMouseUp : undefined}
        >
          {/* PDF Page */}
          <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: "none" }}>
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onLoadSuccess={handlePageLoadSuccess}
              loading={
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              }
              canvasBackground="transparent"
            />
          </div>

          {/* Crop preview for non-active pages */}
          {showCropPreview && displayCrop && !isActivePage && (
            <div
              style={{
                position: "absolute",
                left: displayCrop.x,
                top: displayCrop.y,
                width: displayCrop.width,
                height: displayCrop.height,
                border: "2px dashed #1e90ff",
                backgroundColor: "rgba(30, 144, 255, 0.1)",
                zIndex: 5,
                pointerEvents: "none",
                borderRadius: "2px",
              }}
            />
          )}

          {/* Interactive crop box for active page - ONLY when crop exists */}
          {isActivePage && showCropPreview && displayCrop && basePageWidth > 0 && basePageHeight > 0 && (
            <CropBox
              initialCrop={displayCrop}
              onCropChange={handleCropChange}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
            />
          )}

          {/* Drawing crop box */}
          {isActivePage && isDrawing && currentDrawingCrop && (
            <div
              style={{
                position: "absolute",
                left: currentDrawingCrop.x,
                top: currentDrawingCrop.y,
                width: currentDrawingCrop.width,
                height: currentDrawingCrop.height,
                border: "2px dashed #1e90ff",
                backgroundColor: "rgba(30, 144, 255, 0.2)",
                zIndex: 9,
                pointerEvents: "none",
                borderRadius: "2px",
              }}
            />
          )}

          {/* Page number indicator for mobile */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs md:hidden">
            {pageNumber}
          </div>
        </div>
      )
    },
    [
      currentPage,
      cropAreas,
      basePageWidth,
      basePageHeight,
      pageWidth,
      pageHeight,
      setCurrentPage,
      handleCropChange,
      handlePageLoadSuccess,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      isDrawing,
      currentDrawingCrop,
      applyToAllPages,
      getDisplayCrop,
      scaleFactor,
    ],
  )

  // Memoize the options object to prevent unnecessary reloads
  const documentOptions = useMemo(
    () => ({
      cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      password: password || undefined,
    }),
    [password],
  )

  // Conditional rendering based on fileUrl and password protection status
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
    <div ref={containerRef} className="relative w-full h-full overflow-y-auto">
      <Document
        file={fileUrl}
        onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, fileId)}
        onLoadError={(error) => onDocumentLoadError(error, fileId)}
        loading={
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        }
        error={
          <div className="w-full h-96 bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
            <FileText className="w-12 h-12 text-red-400 mb-2" />
            <div className="text-sm text-red-600 font-medium text-center">Could not load PDF</div>
          </div>
        }
        options={documentOptions}
        className="flex flex-col items-center"
      >
        {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
      </Document>
    </div>
  )
}

// "use client"

// import { useState, useRef, useCallback, useMemo, useEffect } from "react"
// import { Document, Page, pdfjs } from "react-pdf"
// import { RefreshCw, FileText } from "lucide-react"
// import { IoMdLock } from "react-icons/io"
// import CropBox from "@/components/tools/CropBox"

// export default function PDFViewer({
//   fileUrl,
//   fileId,
//   cropAreas,
//   setCropAreaForPage,
//   currentPage,
//   setCurrentPage,
//   zoomLevel,
//   numPages,
//   onDocumentLoadSuccess,
//   onDocumentLoadError,
//   isPasswordProtected,
//   password,
//   applyToAllPages,
// }) {
//   const [basePageWidth, setBasePageWidth] = useState(0)
//   const [basePageHeight, setBasePageHeight] = useState(0)
//   const containerRef = useRef(null)
//   const pageRefs = useRef({})

//   const handlePageLoadSuccess = useCallback(
//     (page) => {
//       // Only set base dimensions once (at 100% zoom)
//       if (basePageWidth === 0 || basePageHeight === 0) {
//         const viewport = page.getViewport({ scale: 1 })
//         setBasePageWidth(viewport.width)
//         setBasePageHeight(viewport.height)
//       }
//     },
//     [basePageWidth, basePageHeight],
//   )

//   // Calculate actual page dimensions based on zoom level
//   const pageWidth = useMemo(() => basePageWidth * (zoomLevel / 100), [basePageWidth, zoomLevel])
//   const pageHeight = useMemo(() => basePageHeight * (zoomLevel / 100), [basePageHeight, zoomLevel])

//   // Get the crop for display (scaled to current zoom level)
//   const getDisplayCrop = useCallback((pageNumber) => {
//     const cropKey = applyToAllPages ? 1 : pageNumber
//     const crop = cropAreas.get(cropKey)

//     // Only return crop if it actually exists - NO DEFAULT CROP
//     if (!crop) return null

//     // Scale the crop coordinates to current zoom level
//     const scaleFactor = zoomLevel / 100
//     return {
//       x: crop.x * scaleFactor,
//       y: crop.y * scaleFactor,
//       width: crop.width * scaleFactor,
//       height: crop.height * scaleFactor
//     }
//   }, [cropAreas, applyToAllPages, zoomLevel])

//   // Handle crop change (convert back to base coordinates)
//   const handleCropChange = useCallback(
//     (newCrop) => {
//       // Convert the crop back to base coordinates (100% zoom) before storing
//       const scaleFactor = 100 / zoomLevel
//       const baseCrop = {
//         x: newCrop.x * scaleFactor,
//         y: newCrop.y * scaleFactor,
//         width: newCrop.width * scaleFactor,
//         height: newCrop.height * scaleFactor
//       }
//       setCropAreaForPage(currentPage, baseCrop)
//     },
//     [currentPage, setCropAreaForPage, zoomLevel],
//   )

//   // State for drawing a new crop box
//   const [isDrawing, setIsDrawing] = useState(false)
//   const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
//   const [currentDrawingCrop, setCurrentDrawingCrop] = useState(null)

//   const handleMouseDown = useCallback(
//     (e) => {
//       const cropKey = applyToAllPages ? 1 : currentPage
//       const hasExistingCrop = cropAreas.has(cropKey)

//       if (e.target === e.currentTarget && !hasExistingCrop) {
//         setIsDrawing(true)
//         const rect = e.currentTarget.getBoundingClientRect()
//         const x = e.clientX - rect.left
//         const y = e.clientY - rect.top
//         setStartPoint({ x, y })
//         setCurrentDrawingCrop({ x, y, width: 0, height: 0 })
//       }
//     },
//     [cropAreas, currentPage, applyToAllPages],
//   )

//   const handleMouseMove = useCallback(
//     (e) => {
//       if (!isDrawing) return

//       const rect = e.currentTarget.getBoundingClientRect()
//       const currentX = e.clientX - rect.left
//       const currentY = e.clientY - rect.top

//       const newX = Math.min(startPoint.x, currentX)
//       const newY = Math.min(startPoint.y, currentY)
//       const newWidth = Math.abs(currentX - startPoint.x)
//       const newHeight = Math.abs(currentY - startPoint.y)

//       setCurrentDrawingCrop({
//         x: newX,
//         y: newY,
//         width: newWidth,
//         height: newHeight,
//       })
//     },
//     [isDrawing, startPoint],
//   )

//   const handleMouseUp = useCallback(
//     (e) => {
//       if (!isDrawing) return

//       setIsDrawing(false)
//       if (currentDrawingCrop && (currentDrawingCrop.width > 20 || currentDrawingCrop.height > 20)) {
//         // Convert to base coordinates before storing
//         const scaleFactor = 100 / zoomLevel
//         const baseCrop = {
//           x: currentDrawingCrop.x * scaleFactor,
//           y: currentDrawingCrop.y * scaleFactor,
//           width: currentDrawingCrop.width * scaleFactor,
//           height: currentDrawingCrop.height * scaleFactor
//         }
//         setCropAreaForPage(currentPage, baseCrop)
//       }
//       setCurrentDrawingCrop(null)
//     },
//     [isDrawing, currentDrawingCrop, currentPage, setCropAreaForPage, zoomLevel],
//   )

//   // Enhanced scroll handling with better page detection
//   useEffect(() => {
//     const container = containerRef.current
//     if (!container) return

//     const handleScroll = () => {
//       const containerTop = container.scrollTop
//       const containerHeight = container.clientHeight
//       const containerCenter = containerTop + containerHeight / 2

//       let closestPage = 1
//       let minDistance = Infinity

//       Object.keys(pageRefs.current).forEach(pageNum => {
//         const pageElement = pageRefs.current[pageNum]
//         if (pageElement) {
//           const pageTop = pageElement.offsetTop - containerTop
//           const pageHeight = pageElement.offsetHeight
//           const pageCenter = pageTop + pageHeight / 2
//           const distance = Math.abs(pageCenter - containerHeight / 2)

//           if (distance < minDistance) {
//             minDistance = distance
//             closestPage = parseInt(pageNum)
//           }
//         }
//       })

//       if (closestPage !== currentPage) {
//         setCurrentPage(closestPage)
//       }
//     }

//     const throttledScroll = (() => {
//       let timeoutId = null
//       return () => {
//         if (timeoutId) clearTimeout(timeoutId)
//         timeoutId = setTimeout(handleScroll, 50)
//       }
//     })()

//     container.addEventListener('scroll', throttledScroll, { passive: true })
//     return () => {
//       container.removeEventListener('scroll', throttledScroll)
//     }
//   }, [currentPage, setCurrentPage])

//   // Scroll to current page when currentPage changes (from control bar)
//   useEffect(() => {
//     if (pageRefs.current[currentPage]) {
//       pageRefs.current[currentPage].scrollIntoView({
//         behavior: 'smooth',
//         block: 'center'
//       })
//     }
//   }, [currentPage])

//   const renderPage = useCallback(
//     (pageNumber) => {
//       const isActivePage = pageNumber === currentPage
//       const displayCrop = getDisplayCrop(pageNumber)

//       // Check if crop exists using proper key
//       const cropKey = applyToAllPages ? 1 : pageNumber
//       const hasCropArea = cropAreas.has(cropKey)

//       // Show crop preview logic - ONLY show if crop actually exists
//       const showCropPreview = hasCropArea
//       const showInteractiveCrop = isActivePage && showCropPreview && !isDrawing

//       // Determine if drawing is allowed on this page
//       const canDraw = isActivePage && !hasCropArea && basePageWidth > 0 && basePageHeight > 0

//       return (
//         <div
//           key={`page_${pageNumber}`}
//           ref={(el) => pageRefs.current[pageNumber] = el}
//           className={`relative my-4 shadow-md border border-gray-200 bg-white mx-auto ${isActivePage ? 'ring-2 ring-blue-500' : ''
//             } ${canDraw ? "cursor-crosshair" : ""}`}
//           onClick={() => setCurrentPage(pageNumber)}
//           style={{
//             width: `${pageWidth}px`,
//             height: `${pageHeight}px`,
//           }}
//           onMouseDown={canDraw ? handleMouseDown : undefined}
//           onMouseMove={canDraw ? handleMouseMove : undefined}
//           onMouseUp={canDraw ? handleMouseUp : undefined}
//           onMouseLeave={canDraw && isDrawing ? handleMouseUp : undefined}
//         >
//           {/* PDF Page */}
//           <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: "none" }}>
//             <Page
//               pageNumber={pageNumber}
//               width={pageWidth}
//               renderTextLayer={false}
//               renderAnnotationLayer={false}
//               onLoadSuccess={handlePageLoadSuccess}
//               loading={
//                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
//                   <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                 </div>
//               }
//               canvasBackground="transparent"
//             />
//           </div>

//           {/* Crop preview for non-active pages */}
//           {showCropPreview && displayCrop && !isActivePage && (
//             <div
//               style={{
//                 position: "absolute",
//                 left: displayCrop.x,
//                 top: displayCrop.y,
//                 width: displayCrop.width,
//                 height: displayCrop.height,
//                 border: "2px dashed #1e90ff",
//                 backgroundColor: "rgba(30, 144, 255, 0.1)",
//                 zIndex: 5,
//                 pointerEvents: "none",
//                 borderRadius: "2px",
//               }}
//             />
//           )}

//           {/* Interactive crop box for active page - ONLY when crop exists */}
//           {isActivePage && showCropPreview && displayCrop && basePageWidth > 0 && basePageHeight > 0 && (
//             <CropBox
//               initialCrop={displayCrop}
//               onCropChange={handleCropChange}
//               pageWidth={pageWidth}
//               pageHeight={pageHeight}
//             />
//           )}

//           {/* Drawing crop box */}
//           {isActivePage && isDrawing && currentDrawingCrop && (
//             <div
//               style={{
//                 position: "absolute",
//                 left: currentDrawingCrop.x,
//                 top: currentDrawingCrop.y,
//                 width: currentDrawingCrop.width,
//                 height: currentDrawingCrop.height,
//                 border: "2px dashed #1e90ff",
//                 backgroundColor: "rgba(30, 144, 255, 0.2)",
//                 zIndex: 9,
//                 pointerEvents: "none",
//                 borderRadius: "2px",
//               }}
//             />
//           )}
//         </div>
//       )
//     },
//     [
//       currentPage,
//       cropAreas,
//       basePageWidth,
//       basePageHeight,
//       pageWidth,
//       pageHeight,
//       zoomLevel,
//       setCurrentPage,
//       handleCropChange,
//       handlePageLoadSuccess,
//       handleMouseDown,
//       handleMouseMove,
//       handleMouseUp,
//       isDrawing,
//       currentDrawingCrop,
//       applyToAllPages,
//       getDisplayCrop,
//     ],
//   )

//   // Memoize the options object to prevent unnecessary reloads
//   const documentOptions = useMemo(
//     () => ({
//       cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//       cMapPacked: true,
//       standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
//       password: password || undefined,
//     }),
//     [password],
//   )

//   // Conditional rendering based on fileUrl and password protection status
//   if (!fileUrl && !isPasswordProtected) {
//     return (
//       <div className="w-full h-96 bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
//       </div>
//     )
//   }

//   if (isPasswordProtected && !password) {
//     return (
//       <div className="w-full h-96 bg-yellow-50 flex flex-col items-center justify-center rounded-lg border border-yellow-300">
//         <IoMdLock className="text-4xl text-yellow-600" />
//         <p className="mt-2 text-yellow-800">Enter password to view PDF</p>
//         <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
//           <div className="w-1 h-1 bg-white rounded-full"></div>
//           <div className="w-1 h-1 bg-white rounded-full"></div>
//           <div className="w-1 h-1 bg-white rounded-full"></div>
//           <div className="w-1 h-1 bg-white rounded-full"></div>
//           <div className="w-1 h-1 bg-white rounded-full"></div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div ref={containerRef} className="relative w-full h-full overflow-y-auto">
//       <Document
//         file={fileUrl}
//         onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, fileId)}
//         onLoadError={(error) => onDocumentLoadError(error, fileId)}
//         loading={
//           <div className="flex items-center justify-center h-96">
//             <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//           </div>
//         }
//         error={
//           <div className="w-full h-96 bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
//             <FileText className="w-12 h-12 text-red-400 mb-2" />
//             <div className="text-sm text-red-600 font-medium text-center">Could not load PDF</div>
//           </div>
//         }
//         options={documentOptions}
//         className="flex flex-col items-center"
//       >
//         {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
//       </Document>
//     </div>
//   )
// }

// // "use client"

// // import { useState, useRef, useCallback, useMemo, useEffect } from "react"
// // import { Document, Page, pdfjs } from "react-pdf"
// // import { RefreshCw, FileText } from "lucide-react"
// // import { IoMdLock } from "react-icons/io"
// // import CropBox from "@/components/tools/CropBox"

// // export default function PDFViewer({
// //   fileUrl,
// //   fileId,
// //   cropAreas,
// //   setCropAreaForPage,
// //   currentPage,
// //   setCurrentPage,
// //   zoomLevel,
// //   numPages,
// //   onDocumentLoadSuccess,
// //   onDocumentLoadError,
// //   isPasswordProtected,
// //   password,
// //   applyToAllPages,
// // }) {
// //   const [basePageWidth, setBasePageWidth] = useState(0)
// //   const [basePageHeight, setBasePageHeight] = useState(0)
// //   const containerRef = useRef(null)
// //   const pageRefs = useRef({})

// //   const handlePageLoadSuccess = useCallback(
// //     (page) => {
// //       // Only set base dimensions once (at 100% zoom)
// //       if (basePageWidth === 0 || basePageHeight === 0) {
// //         const viewport = page.getViewport({ scale: 1 })
// //         setBasePageWidth(viewport.width)
// //         setBasePageHeight(viewport.height)
// //       }
// //     },
// //     [basePageWidth, basePageHeight],
// //   )

// //   // Calculate actual page dimensions based on zoom level
// //   const pageWidth = useMemo(() => basePageWidth * (zoomLevel / 100), [basePageWidth, zoomLevel])
// //   const pageHeight = useMemo(() => basePageHeight * (zoomLevel / 100), [basePageHeight, zoomLevel])

// //   // Get the crop for display (scaled to current zoom level) - FIXED LOGIC
// //   const getDisplayCrop = useCallback((pageNumber) => {
// //     const cropKey = applyToAllPages ? 1 : pageNumber
// //     const crop = cropAreas.get(cropKey)

// //     // If no crop exists, return default full page crop (like in old code)
// //     if (!crop && basePageWidth > 0 && basePageHeight > 0) {
// //       return {
// //         x: 0,
// //         y: 0,
// //         width: pageWidth,
// //         height: pageHeight
// //       }
// //     }

// //     if (!crop) return null

// //     // Scale the crop coordinates to current zoom level
// //     const scaleFactor = zoomLevel / 100
// //     return {
// //       x: crop.x * scaleFactor,
// //       y: crop.y * scaleFactor,
// //       width: crop.width * scaleFactor,
// //       height: crop.height * scaleFactor
// //     }
// //   }, [cropAreas, applyToAllPages, zoomLevel, basePageWidth, basePageHeight, pageWidth, pageHeight])

// //   // Handle crop change (convert back to base coordinates)
// //   const handleCropChange = useCallback(
// //     (newCrop) => {
// //       // Convert the crop back to base coordinates (100% zoom) before storing
// //       const scaleFactor = 100 / zoomLevel
// //       const baseCrop = {
// //         x: newCrop.x * scaleFactor,
// //         y: newCrop.y * scaleFactor,
// //         width: newCrop.width * scaleFactor,
// //         height: newCrop.height * scaleFactor
// //       }
// //       setCropAreaForPage(currentPage, baseCrop)
// //     },
// //     [currentPage, setCropAreaForPage, zoomLevel],
// //   )

// //   // State for drawing a new crop box
// //   const [isDrawing, setIsDrawing] = useState(false)
// //   const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
// //   const [currentDrawingCrop, setCurrentDrawingCrop] = useState(null)

// //   const handleMouseDown = useCallback(
// //     (e) => {
// //       const cropKey = applyToAllPages ? 1 : currentPage
// //       const hasExistingCrop = cropAreas.has(cropKey)

// //       if (e.target === e.currentTarget && !hasExistingCrop) {
// //         setIsDrawing(true)
// //         const rect = e.currentTarget.getBoundingClientRect()
// //         const x = e.clientX - rect.left
// //         const y = e.clientY - rect.top
// //         setStartPoint({ x, y })
// //         setCurrentDrawingCrop({ x, y, width: 0, height: 0 })
// //       }
// //     },
// //     [cropAreas, currentPage, applyToAllPages],
// //   )

// //   const handleMouseMove = useCallback(
// //     (e) => {
// //       if (!isDrawing) return

// //       const rect = e.currentTarget.getBoundingClientRect()
// //       const currentX = e.clientX - rect.left
// //       const currentY = e.clientY - rect.top

// //       const newX = Math.min(startPoint.x, currentX)
// //       const newY = Math.min(startPoint.y, currentY)
// //       const newWidth = Math.abs(currentX - startPoint.x)
// //       const newHeight = Math.abs(currentY - startPoint.y)

// //       setCurrentDrawingCrop({
// //         x: newX,
// //         y: newY,
// //         width: newWidth,
// //         height: newHeight,
// //       })
// //     },
// //     [isDrawing, startPoint],
// //   )

// //   const handleMouseUp = useCallback(
// //     (e) => {
// //       if (!isDrawing) return

// //       setIsDrawing(false)
// //       if (currentDrawingCrop && (currentDrawingCrop.width > 20 || currentDrawingCrop.height > 20)) {
// //         // Convert to base coordinates before storing
// //         const scaleFactor = 100 / zoomLevel
// //         const baseCrop = {
// //           x: currentDrawingCrop.x * scaleFactor,
// //           y: currentDrawingCrop.y * scaleFactor,
// //           width: currentDrawingCrop.width * scaleFactor,
// //           height: currentDrawingCrop.height * scaleFactor
// //         }
// //         setCropAreaForPage(currentPage, baseCrop)
// //       }
// //       setCurrentDrawingCrop(null)
// //     },
// //     [isDrawing, currentDrawingCrop, currentPage, setCropAreaForPage, zoomLevel],
// //   )

// //   // Enhanced scroll handling with better page detection
// //   useEffect(() => {
// //     const container = containerRef.current
// //     if (!container) return

// //     const handleScroll = () => {
// //       const containerTop = container.scrollTop
// //       const containerHeight = container.clientHeight
// //       const containerCenter = containerTop + containerHeight / 2

// //       let closestPage = 1
// //       let minDistance = Infinity

// //       Object.keys(pageRefs.current).forEach(pageNum => {
// //         const pageElement = pageRefs.current[pageNum]
// //         if (pageElement) {
// //           const pageTop = pageElement.offsetTop - containerTop
// //           const pageHeight = pageElement.offsetHeight
// //           const pageCenter = pageTop + pageHeight / 2
// //           const distance = Math.abs(pageCenter - containerHeight / 2)

// //           if (distance < minDistance) {
// //             minDistance = distance
// //             closestPage = parseInt(pageNum)
// //           }
// //         }
// //       })

// //       if (closestPage !== currentPage) {
// //         setCurrentPage(closestPage)
// //       }
// //     }

// //     const throttledScroll = (() => {
// //       let timeoutId = null
// //       return () => {
// //         if (timeoutId) clearTimeout(timeoutId)
// //         timeoutId = setTimeout(handleScroll, 50)
// //       }
// //     })()

// //     container.addEventListener('scroll', throttledScroll, { passive: true })
// //     return () => {
// //       container.removeEventListener('scroll', throttledScroll)
// //     }
// //   }, [currentPage, setCurrentPage])

// //   // Scroll to current page when currentPage changes (from control bar)
// //   useEffect(() => {
// //     if (pageRefs.current[currentPage]) {
// //       pageRefs.current[currentPage].scrollIntoView({
// //         behavior: 'smooth',
// //         block: 'center'
// //       })
// //     }
// //   }, [currentPage])

// //   const renderPage = useCallback(
// //     (pageNumber) => {
// //       const isActivePage = pageNumber === currentPage
// //       const displayCrop = getDisplayCrop(pageNumber)

// //       // FIXED: Check if crop exists using proper key
// //       const cropKey = applyToAllPages ? 1 : pageNumber
// //       const hasCropArea = cropAreas.has(cropKey)

// //       // Show crop preview logic - ALWAYS show if crop exists (like old code)
// //       const showCropPreview = hasCropArea || (basePageWidth > 0 && basePageHeight > 0)
// //       const showInteractiveCrop = isActivePage && showCropPreview && !isDrawing

// //       // Determine if drawing is allowed on this page
// //       const canDraw = isActivePage && !hasCropArea && basePageWidth > 0 && basePageHeight > 0

// //       return (
// //         <div
// //           key={`page_${pageNumber}`}
// //           ref={(el) => pageRefs.current[pageNumber] = el}
// //           className={`relative my-4 shadow-md border border-gray-200 bg-white mx-auto ${isActivePage ? 'ring-2 ring-blue-500' : ''
// //             } ${canDraw ? "cursor-crosshair" : ""}`}
// //           onClick={() => setCurrentPage(pageNumber)}
// //           style={{
// //             width: `${pageWidth}px`,
// //             height: `${pageHeight}px`,
// //           }}
// //           onMouseDown={canDraw ? handleMouseDown : undefined}
// //           onMouseMove={canDraw ? handleMouseMove : undefined}
// //           onMouseUp={canDraw ? handleMouseUp : undefined}
// //           onMouseLeave={canDraw && isDrawing ? handleMouseUp : undefined}
// //         >
// //           {/* PDF Page */}
// //           <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: "none" }}>
// //             <Page
// //               pageNumber={pageNumber}
// //               width={pageWidth}
// //               renderTextLayer={false}
// //               renderAnnotationLayer={false}
// //               onLoadSuccess={handlePageLoadSuccess}
// //               loading={
// //                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
// //                   <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
// //                 </div>
// //               }
// //               canvasBackground="transparent"
// //             />
// //           </div>

// //           {/* Crop preview for non-active pages */}
// //           {showCropPreview && displayCrop && !isActivePage && (
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 left: displayCrop.x,
// //                 top: displayCrop.y,
// //                 width: displayCrop.width,
// //                 height: displayCrop.height,
// //                 border: "2px dashed #1e90ff",
// //                 backgroundColor: "rgba(30, 144, 255, 0.1)",
// //                 zIndex: 5,
// //                 pointerEvents: "none",
// //                 borderRadius: "2px",
// //               }}
// //             />
// //           )}

// //           {/* Interactive crop box for active page - FIXED CONDITION */}
// //           {isActivePage && showCropPreview && displayCrop && basePageWidth > 0 && basePageHeight > 0 && (
// //             <CropBox
// //               initialCrop={displayCrop}
// //               onCropChange={handleCropChange}
// //               pageWidth={pageWidth}
// //               pageHeight={pageHeight}
// //             />
// //           )}

// //           {/* Drawing crop box */}
// //           {isActivePage && isDrawing && currentDrawingCrop && (
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 left: currentDrawingCrop.x,
// //                 top: currentDrawingCrop.y,
// //                 width: currentDrawingCrop.width,
// //                 height: currentDrawingCrop.height,
// //                 border: "2px dashed #1e90ff",
// //                 backgroundColor: "rgba(30, 144, 255, 0.2)",
// //                 zIndex: 9,
// //                 pointerEvents: "none",
// //                 borderRadius: "2px",
// //               }}
// //             />
// //           )}
// //         </div>
// //       )
// //     },
// //     [
// //       currentPage,
// //       cropAreas,
// //       basePageWidth,
// //       basePageHeight,
// //       pageWidth,
// //       pageHeight,
// //       zoomLevel,
// //       setCurrentPage,
// //       handleCropChange,
// //       handlePageLoadSuccess,
// //       handleMouseDown,
// //       handleMouseMove,
// //       handleMouseUp,
// //       isDrawing,
// //       currentDrawingCrop,
// //       applyToAllPages,
// //       getDisplayCrop,
// //     ],
// //   )

// //   // Memoize the options object to prevent unnecessary reloads
// //   const documentOptions = useMemo(
// //     () => ({
// //       cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
// //       cMapPacked: true,
// //       standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
// //       password: password || undefined,
// //     }),
// //     [password],
// //   )

// //   // Conditional rendering based on fileUrl and password protection status
// //   if (!fileUrl && !isPasswordProtected) {
// //     return (
// //       <div className="w-full h-96 bg-gray-50 flex items-center justify-center rounded-lg">
// //         <FileText className="w-16 h-16 text-gray-400" />
// //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
// //       </div>
// //     )
// //   }

// //   if (isPasswordProtected && !password) {
// //     return (
// //       <div className="w-full h-96 bg-yellow-50 flex flex-col items-center justify-center rounded-lg border border-yellow-300">
// //         <IoMdLock className="text-4xl text-yellow-600" />
// //         <p className="mt-2 text-yellow-800">Enter password to view PDF</p>
// //         <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
// //           <div className="w-1 h-1 bg-white rounded-full"></div>
// //           <div className="w-1 h-1 bg-white rounded-full"></div>
// //           <div className="w-1 h-1 bg-white rounded-full"></div>
// //           <div className="w-1 h-1 bg-white rounded-full"></div>
// //           <div className="w-1 h-1 bg-white rounded-full"></div>
// //         </div>
// //       </div>
// //     )
// //   }

// //   return (
// //     <div ref={containerRef} className="relative w-full h-full overflow-y-auto">
// //       <Document
// //         file={fileUrl}
// //         onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, fileId)}
// //         onLoadError={(error) => onDocumentLoadError(error, fileId)}
// //         loading={
// //           <div className="flex items-center justify-center h-96">
// //             <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
// //           </div>
// //         }
// //         error={
// //           <div className="w-full h-96 bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
// //             <FileText className="w-12 h-12 text-red-400 mb-2" />
// //             <div className="text-sm text-red-600 font-medium text-center">Could not load PDF</div>
// //           </div>
// //         }
// //         options={documentOptions}
// //         className="flex flex-col items-center"
// //       >
// //         {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
// //       </Document>
// //     </div>
// //   )
// // }

// // // // "use client"

// // // // import { useState, useRef, useCallback, useMemo } from "react"
// // // // import { Document, Page, pdfjs } from "react-pdf"
// // // // import { RefreshCw, FileText } from "lucide-react"
// // // // import { IoMdLock } from "react-icons/io"
// // // // import CropBox from "@/components/tools/CropBox" // Import Custom CropBox

// // // // export default function PDFViewer({
// // // //   fileUrl, // Now accepts dataUrl string
// // // //   fileId, // Added fileId for caching
// // // //   cropAreas,
// // // //   setCropAreaForPage,
// // // //   currentPage,
// // // //   setCurrentPage,
// // // //   zoomLevel,
// // // //   numPages,
// // // //   onDocumentLoadSuccess,
// // // //   onDocumentLoadError,
// // // //   isPasswordProtected,
// // // //   password,
// // // // }) {
// // // //   const [pageWidth, setPageWidth] = useState(0)
// // // //   const [pageHeight, setPageHeight] = useState(0)
// // // //   const containerRef = useRef(null)

// // // //   const handlePageLoadSuccess = useCallback(
// // // //     (page) => {
// // // //       // Only set dimensions once, assuming all pages have same size
// // // //       if (pageWidth === 0 || pageHeight === 0) {
// // // //         const viewport = page.getViewport({ scale: 1 })
// // // //         setPageWidth(viewport.width)
// // // //         setPageHeight(viewport.height)
// // // //       }
// // // //     },
// // // //     [pageWidth, pageHeight],
// // // //   )

// // // //   const handleCropChange = useCallback(
// // // //     (newCrop) => {
// // // //       setCropAreaForPage(currentPage, newCrop)
// // // //     },
// // // //     [currentPage, setCropAreaForPage],
// // // //   )

// // // //   const renderPage = useCallback(
// // // //     (pageNumber) => {
// // // //       const isActivePage = pageNumber === currentPage
// // // //       // Get the crop area for the current page, or default to full page if not set
// // // //       // Ensure initial crop is based on actual page dimensions if available
// // // //       const currentCrop = cropAreas.get(pageNumber) || { x: 0, y: 0, width: pageWidth, height: pageHeight }

// // // //       return (
// // // //         <div
// // // //           key={`page_${pageNumber}`}
// // // //           className="relative my-4 shadow-md border border-gray-200 bg-white"
// // // //           onClick={() => setCurrentPage(pageNumber)}
// // // //           style={{
// // // //             width: `${pageWidth * (zoomLevel / 100)}px`,
// // // //             height: `${pageHeight * (zoomLevel / 100)}px`,
// // // //             margin: "0 auto", // Center the page
// // // //           }}
// // // //         >
// // // //           {/* Wrap Page in a div to control z-index and pointer events */}
// // // //           <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: "none" }}>
// // // //             <Page
// // // //               pageNumber={pageNumber}
// // // //               width={pageWidth * (zoomLevel / 100)}
// // // //               renderTextLayer={false}
// // // //               renderAnnotationLayer={false}
// // // //               onLoadSuccess={handlePageLoadSuccess}
// // // //               loading={
// // // //                 <div className="w-full h-full bg-gray-100 flex items-center justify-center">
// // // //                   <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
// // // //                 </div>
// // // //               }
// // // //               canvasBackground="transparent" // Ensure no background interferes
// // // //             />
// // // //           </div>
// // // //           {isActivePage && pageWidth > 0 && pageHeight > 0 && (
// // // //             <CropBox
// // // //               initialCrop={currentCrop}
// // // //               onCropChange={handleCropChange}
// // // //               pageWidth={pageWidth * (zoomLevel / 100)} // Pass scaled dimensions
// // // //               pageHeight={pageHeight * (zoomLevel / 100)} // Pass scaled dimensions
// // // //             />
// // // //           )}
// // // //         </div>
// // // //       )
// // // //     },
// // // //     [currentPage, cropAreas, pageWidth, pageHeight, zoomLevel, setCurrentPage, handleCropChange, handlePageLoadSuccess],
// // // //   )

// // // //   // Memoize the options object to prevent unnecessary reloads of the Document
// // // //   const documentOptions = useMemo(
// // // //     () => ({
// // // //       cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
// // // //       cMapPacked: true,
// // // //       standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
// // // //       password: password || undefined, // Pass password if available
// // // //     }),
// // // //     [password],
// // // //   ) // Only re-create if password changes

// // // //   // Conditional rendering based on fileUrl and password protection status
// // // //   if (!fileUrl && !isPasswordProtected) {
// // // //     return (
// // // //       <div className="w-full h-96 bg-gray-50 flex items-center justify-center rounded-lg">
// // // //         <FileText className="w-16 h-16 text-gray-400" />
// // // //         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   if (isPasswordProtected && !password) {
// // // //     return (
// // // //       <div className="w-full h-96 bg-yellow-50 flex flex-col items-center justify-center rounded-lg border border-yellow-300">
// // // //         <IoMdLock className="text-4xl text-yellow-600" />
// // // //         <p className="mt-2 text-yellow-800">Enter password to view PDF</p>
// // // //         <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
// // // //           <div className="w-1 h-1 bg-white rounded-full"></div>
// // // //           <div className="w-1 h-1 bg-white rounded-full"></div>
// // // //           <div className="w-1 h-1 bg-white rounded-full"></div>
// // // //           <div className="w-1 h-1 bg-white rounded-full"></div>
// // // //           <div className="w-1 h-1 bg-white rounded-full"></div>
// // // //         </div>
// // // //       </div>
// // // //     )
// // // //   }

// // // //   return (
// // // //     <div ref={containerRef} className="relative w-full h-full">
// // // //       {" "}
// // // //       {/* Removed overflow-y-auto */}
// // // //       <Document
// // // //         file={fileUrl} // Pass dataUrl string
// // // //         onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, fileId)} // Pass fileId for caching
// // // //         onLoadError={(error) => onDocumentLoadError(error, fileId)} // Pass fileId for caching
// // // //         loading={
// // // //           <div className="flex items-center justify-center h-96">
// // // //             <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
// // // //           </div>
// // // //         }
// // // //         error={
// // // //           <div className="w-full h-96 bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
// // // //             <FileText className="w-12 h-12 text-red-400 mb-2" />
// // // //             <div className="text-sm text-red-600 font-medium text-center">Could not load PDF</div>
// // // //           </div>
// // // //         }
// // // //         options={documentOptions} // Use memoized options
// // // //         className="flex flex-col items-center"
// // // //       >
// // // //         {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
// // // //       </Document>
// // // //     </div>
// // // //   )
// // // // }

// // // "use client"