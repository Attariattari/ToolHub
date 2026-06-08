"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { RefreshCw, FileText, Edit3, Copy, Trash2 } from "lucide-react"
import { IoMdLock } from "react-icons/io"
import { Rnd } from "react-rnd"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.entry.js`

export default function PDFSignViewer({
  fileUrl,
  fileId,
  signatureFields,
  addSignatureField,
  updateSignatureField,
  removeSignatureField,
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
  onCopyField,
  signatureData,
  onOpenSignatureModal,
  focusedFieldId,
  setFocusedFieldId,
}) {
  const [basePageWidth, setBasePageWidth] = useState(0)
  const [basePageHeight, setBasePageHeight] = useState(0)
  const [editingFieldId, setEditingFieldId] = useState(null)
  const [editingValue, setEditingValue] = useState("")
  const containerRef = useRef(null)
  const pageRefs = useRef({})

  // Calculate page width based on zoom level and container size
  const pageWidth = useMemo(() => {
    if (!basePageWidth) return 600 // Default fallback

    const calculatedWidth = basePageWidth * (zoomLevel / 100)
    const containerWidth = containerRef.current?.clientWidth || 800

    // Responsive width based on screen size
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        // Mobile: use 95% of container width, max 500px
        return Math.min(calculatedWidth, containerWidth * 0.95, 500)
      } else if (window.innerWidth < 768) {
        // Mobile landscape: use 90% of container width, max 600px
        return Math.min(calculatedWidth, containerWidth * 0.9, 600)
      } else if (window.innerWidth < 1024) {
        // Tablet: use 85% of container width, max 700px
        return Math.min(calculatedWidth, containerWidth * 0.85, 700)
      } else {
        // Desktop: use container width minus padding, max 800px
        return Math.min(calculatedWidth, containerWidth - 80, 800)
      }
    }

    return Math.min(calculatedWidth, containerWidth - 40)
  }, [basePageWidth, zoomLevel])

  const handlePageLoadSuccess = useCallback(
    (page) => {
      if (basePageWidth === 0 || basePageHeight === 0) {
        const viewport = page.getViewport({ scale: 1 })
        setBasePageWidth(viewport.width)
        setBasePageHeight(viewport.height)

        // Store actual PDF dimensions for accurate positioning
        if (typeof window !== "undefined") {
          window.pdfActualDimensions = {
            width: viewport.width,
            height: viewport.height,
            scale: 1
          }
        }
      }
    },
    [basePageWidth, basePageHeight],
  )

  const getPDFDimensions = useCallback(() => {
    return {
      actualWidth: basePageWidth,
      actualHeight: basePageHeight,
      viewerWidth: pageWidth,
      viewerHeight: pageWidth * (basePageHeight / basePageWidth),
      scaleX: basePageWidth / pageWidth,
      scaleY: basePageHeight / (pageWidth * (basePageHeight / basePageWidth))
    }
  }, [basePageWidth, basePageHeight, pageWidth])



  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      const fieldType = e.dataTransfer.getData("fieldType")
      if (!fieldType) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Get PDF dimensions for accurate positioning
      const pdfDims = getPDFDimensions()

      // Convert viewer coordinates to PDF coordinates (bottom-left origin)
      // The backend expects coordinates where Y=0 is at the bottom of the page
      const pdfX = x * pdfDims.scaleX
      // For PDF coordinates: Y=0 is at bottom, so we need to flip the Y coordinate
      const pdfY = pdfDims.actualHeight - (y * pdfDims.scaleY)

      const newFieldId = Date.now() + Math.random()
      addSignatureField({
        id: newFieldId,
        type: fieldType,
        page: currentPage,
        x: Math.max(0, Math.round((pdfX - 150) * 100) / 100), // PDF coordinates, rounded
        y: Math.max(0, Math.round((pdfY - 40) * 100) / 100),  // PDF coordinates, rounded
        width: 300, // PDF units
        height: 80, // PDF units
        // Store both PDF and viewer dimensions for reference
        pdfDimensions: {
          actualWidth: pdfDims.actualWidth,
          actualHeight: pdfDims.actualHeight,
          viewerWidth: pdfDims.viewerWidth,
          viewerHeight: pdfDims.viewerHeight
        }
      })

      setTimeout(() => setFocusedFieldId(newFieldId), 100)
    },
    [addSignatureField, currentPage, setFocusedFieldId, getPDFDimensions],
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

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

  useEffect(() => {
    if (pageRefs.current[currentPage]) {
      pageRefs.current[currentPage].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
    }
  }, [currentPage])

  const renderFieldContent = useCallback(
    (field) => {
      if (editingFieldId === field.id) {
        return (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => {
              setEditingValue(e.target.value)
              const textLength = e.target.value.length
              const newWidth = Math.max(100, Math.min(400, textLength * 8 + 40))
              updateSignatureField(field.id, { width: newWidth })
            }}
            onBlur={() => {
              updateSignatureField(field.id, { customText: editingValue })
              setEditingFieldId(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateSignatureField(field.id, { customText: editingValue })
                setEditingFieldId(null)
              }
              if (e.key === "Escape") {
                setEditingFieldId(null)
              }
            }}
            className="w-full h-full bg-transparent border-none outline-none text-center text-sm font-medium"
            autoFocus
          />
        )
      }

      const fieldData = signatureData[field.type]

      if (field.type === "signature") {
        if (fieldData?.text) {
          return (
            <span
              className={`text-sm font-medium ${fieldData.style === 0 ? "font-bold italic" : fieldData.style === 1 ? "italic" : fieldData.style === 2 ? "font-serif" : "font-mono"}`}
              style={{ color: fieldData.color, fontSize: `${Math.max(8, field.height * 0.3)}px` }}
            >
              {fieldData.text}
            </span>
          )
        } else if (fieldData && typeof fieldData === "string") {
          return <img src={fieldData || "/placeholder.svg"} alt="Signature" className="w-full h-full object-contain" />
        }
        return (
          <span
            className="text-sm text-blue-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.3)}px` }}
          >
            Signature
          </span>
        )
      }

      if (field.type === "initials") {
        if (fieldData?.text) {
          return (
            <span
              className={`text-sm font-medium ${fieldData.style === 0 ? "font-bold italic" : fieldData.style === 1 ? "italic" : fieldData.style === 2 ? "font-serif" : "font-mono"}`}
              style={{ color: fieldData.color, fontSize: `${Math.max(8, field.height * 0.4)}px` }}
            >
              {fieldData.text}
            </span>
          )
        } else if (fieldData && typeof fieldData === "string") {
          return <img src={fieldData || "/placeholder.svg"} alt="Initials" className="w-full h-full object-contain" />
        }
        return (
          <span
            className="text-sm text-blue-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.4)}px` }}
          >
            Initials
          </span>
        )
      }

      if (field.type === "name") {
        return (
          <span
            className="text-sm text-gray-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.4)}px` }}
          >
            {signatureData.name || "Name"}
          </span>
        )
      }

      if (field.type === "company") {
        if (signatureData.companyStamp) {
          return (
            <img
              src={signatureData.companyStamp || "/placeholder.svg"}
              alt="Company Stamp"
              className="w-full h-full object-contain"
            />
          )
        }
        return (
          <span
            className="text-sm text-blue-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.4)}px` }}
          >
            Company
          </span>
        )
      }

      if (field.type === "date") {
        return (
          <span
            className="text-sm text-blue-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.4)}px` }}
          >
            {field.customText || new Date().toLocaleDateString()}
          </span>
        )
      }

      if (field.type === "text") {
        return (
          <span
            className="text-sm text-blue-800 font-medium"
            style={{ fontSize: `${Math.max(8, field.height * 0.4)}px` }}
          >
            {field.customText || "Text"}
          </span>
        )
      }

      return null
    },
    [signatureData, editingFieldId, editingValue, updateSignatureField],
  )

  const handleFieldClick = useCallback(
    (field, e) => {
      e.stopPropagation()
      setFocusedFieldId(field.id)

      if (field.type === "text") {
        setEditingFieldId(field.id)
        setEditingValue(field.customText || "Text")
      }
    },
    [setFocusedFieldId],
  )

  const handleEditClick = useCallback(
    (field, e) => {
      e.stopPropagation()
      const modalFields = ["signature", "initials", "name", "company"]
      if (modalFields.includes(field.type)) {
        onOpenSignatureModal(field.type)
      } else if (field.type === "text") {
        setEditingFieldId(field.id)
        setEditingValue(field.customText || "Text")
      }
    },
    [onOpenSignatureModal],
  )

  const handlePageClick = useCallback(
    (pageNumber, e) => {
      if (e.target.closest(".signature-field-container")) return
      setCurrentPage(pageNumber)
      setFocusedFieldId(null)
    },
    [setCurrentPage, setFocusedFieldId],
  )

  const renderPage = useCallback(
    (pageNumber) => {
      const isActivePage = pageNumber === currentPage
      const pageSignatureFields = signatureFields.filter((field) => field.page === pageNumber)

      return (
        <div
          key={`page_${pageNumber}`}
          ref={(el) => (pageRefs.current[pageNumber] = el)}
          className={`relative my-2 md:my-4 bg-white mx-auto shadow-lg select-none transition-all duration-200 ${isActivePage ? "ring-2 ring-blue-500 shadow-xl" : "hover:shadow-lg"
            }`}
          onClick={(e) => handlePageClick(pageNumber, e)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
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
                <div
                  className="bg-gray-100 flex items-center justify-center"
                  style={{
                    width: `${pageWidth}px`,
                    height: `${pageWidth * 1.414}px`, // A4 aspect ratio
                  }}
                >
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              }
              className="pdf-page-container"
            />
          </div>

          {pageSignatureFields.map((field) => (
            <Rnd
              key={`signature-${field.id}`}
              size={{
                width: field.width / (basePageWidth / pageWidth), // Convert PDF units to viewer units
                height: field.height / (basePageHeight / (pageWidth * (basePageHeight / basePageWidth)))
              }}
              position={{
                x: field.x / (basePageWidth / pageWidth), // Convert PDF units to viewer units
                y: (basePageHeight - field.y - field.height) / (basePageHeight / (pageWidth * (basePageHeight / basePageWidth))) // Flip Y and convert
              }}
              onDragStop={(e, d) => {
                // Convert viewer coordinates to PDF coordinates (bottom-left origin)
                // The backend expects coordinates where Y=0 is at the bottom of the page
                const pdfDims = getPDFDimensions()
                const pdfX = d.x * pdfDims.scaleX
                // For PDF coordinates: Y=0 is at bottom, so we need to flip the Y coordinate
                const pdfY = pdfDims.actualHeight - (d.y * pdfDims.scaleY) - (field.height * pdfDims.scaleY)

                updateSignatureField(field.id, {
                  x: Math.round(pdfX * 100) / 100,
                  y: Math.round(pdfY * 100) / 100
                })
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const newWidth = Number.parseInt(ref.style.width)
                const newHeight = Number.parseInt(ref.style.height)

                // Convert viewer coordinates to PDF coordinates (bottom-left origin)
                // The backend expects coordinates where Y=0 is at the bottom of the page
                const pdfDims = getPDFDimensions()
                const pdfX = position.x * pdfDims.scaleX
                // For PDF coordinates: Y=0 is at bottom, so we need to flip the Y coordinate
                const pdfY = pdfDims.actualHeight - (position.y * pdfDims.scaleY) - (newHeight * pdfDims.scaleY)
                const pdfWidth = newWidth * pdfDims.scaleX
                const pdfHeight = newHeight * pdfDims.scaleY

                updateSignatureField(field.id, {
                  width: Math.round(pdfWidth * 100) / 100,
                  height: Math.round(pdfHeight * 100) / 100,
                  x: Math.round(pdfX * 100) / 100,
                  y: Math.round(pdfY * 100) / 100,
                })
              }}
              bounds="parent"
              className="signature-field-container"
              dragHandleClassName="field-drag-handle"
              onMouseDown={(e) => {
                if (field.type === "signature" || field.type === "initials" || field.type === "company") {
                  e.preventDefault()
                }
              }}
            >
              <div
                className={`w-full h-full border-[1px] rounded-md relative transition-all cursor-pointer field-drag-handle ${focusedFieldId === field.id
                    ? "bg-blue-50 bg-opacity-50 border-blue-600 shadow-md"
                    : "border-transparent bg-transparent hover:border-gray-300"
                  }`}
                onClick={(e) => handleFieldClick(field, e)}
              >
                {/* Field Content */}
                <div className="w-full h-full flex items-center justify-center p-2 pointer-events-none">
                  {renderFieldContent(field)}
                </div>

                {focusedFieldId === field.id && (
                  <div className="absolute -top-8 right-0 flex gap-1 bg-white rounded-md shadow-lg border p-1 pointer-events-auto z-10">
                    {["signature", "initials", "name", "company", "text"].includes(field.type) &&
                      field.type !== "date" && (
                        <button
                          onClick={(e) => handleEditClick(field, e)}
                          className="p-1.5 hover:bg-gray-100 rounded pointer-events-auto transition-colors"
                          title="Edit field"
                        >
                          <Edit3 className="w-3 h-3 text-gray-600" />
                        </button>
                      )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopyField(field)
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded pointer-events-auto transition-colors"
                      title="Copy field"
                    >
                      <Copy className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSignatureField(field.id)
                        setFocusedFieldId(null)
                      }}
                      className="p-1.5 hover:bg-blue-100 rounded pointer-events-auto transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-3 h-3 text-blue-600" />
                    </button>
                  </div>
                )}
              </div>
            </Rnd>
          ))}

          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
            {pageNumber}
          </div>
        </div>
      )
    },
    [
      currentPage,
      signatureFields,
      pageWidth,
      handlePageClick,
      handlePageLoadSuccess,
      updateSignatureField,
      removeSignatureField,
      onCopyField,
      handleDrop,
      handleDragOver,
      renderFieldContent,
      focusedFieldId,
      handleFieldClick,
      handleEditClick,
      setFocusedFieldId,
    ],
  )

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
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No PDF loaded</p>
        </div>
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
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-auto custom-scrollbar bg-gray-50 p-2 sm:p-4 md:p-6"
        style={{ scrollBehavior: "smooth" }}
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
          <div className="w-full max-w-none flex flex-col items-center space-y-2 md:space-y-4">
            {Array.from(new Array(numPages), (el, index) => renderPage(index + 1))}
          </div>
        </Document>
      </div>
    </div>
  )
}
