"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, ChevronDown, ArrowRight, RefreshCw, X, Palette, Type, Minus, Plus, Settings } from "lucide-react"
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
  MAX_FILES: 2,
  MAX_SIZE_MB: 100,
  MAX_PAGES: 4000
}

// Memoized PDF options to prevent unnecessary reloads
const PDF_OPTIONS = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
}

// File color mapping
const FILE_COLORS = [
  { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-800", accent: "bg-blue-500" },
  { border: "border-green-300", bg: "bg-green-50", text: "text-green-800", accent: "bg-green-500" },
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

// Position Grid Component
const PositionGrid = memo(({ selectedPosition, onPositionChange }) => {
  const positions = [
    { vertical: "top", horizontal: "left" },
    { vertical: "top", horizontal: "center" },
    { vertical: "top", horizontal: "right" },
    { vertical: "middle", horizontal: "left" },
    { vertical: "middle", horizontal: "center" },
    { vertical: "middle", horizontal: "right" },
    { vertical: "bottom", horizontal: "left" },
    { vertical: "bottom", horizontal: "center" },
    { vertical: "bottom", horizontal: "right" },
  ]

  return (
    <div className="grid grid-cols-3 gap-1 w-20 h-20 border border-gray-300 rounded p-1 bg-white">
      {positions.map((position, index) => {
        const isSelected =
          selectedPosition.vertical === position.vertical && selectedPosition.horizontal === position.horizontal

        return (
          <button
            key={index}
            onClick={() => onPositionChange(position)}
            className={`w-5 h-5 rounded-sm border transition-all duration-200 ${isSelected ? "bg-blue-500 border-blue-600" : "bg-gray-100 border-gray-300 hover:bg-gray-200"
              }`}
          />
        )
      })}
    </div>
  )
})

PositionGrid.displayName = "PositionGrid"

// Custom File Dropdown Component
const CustomFileDropdown = memo(({ files, selectedIndex, onSelect, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="truncate">
          {files[selectedIndex]?.name || "Select file"} ({files[selectedIndex]?.totalPages || 0} pages)
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto custom-scrollbar">
          {files.map((file, index) => (
            <div
              key={file.id}
              className={`p-3 flex items-center justify-between hover:bg-gray-50 ${index === selectedIndex ? "bg-blue-50" : ""
                }`}
            >
              <button
                onClick={() => {
                  onSelect(index)
                  setIsOpen(false)
                }}
                className="flex-1 text-left truncate"
              >
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-gray-500 ml-2">({file.totalPages || 0} pages)</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(file.id)
                  if (files.length === 1) setIsOpen(false)
                }}
                className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors duration-200 ml-2"
                title="Remove file"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

CustomFileDropdown.displayName = "CustomFileDropdown"

// Compact Control Button Component
const CompactControlButton = memo(({ icon: Icon, label, isActive, onClick, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1" ref={buttonRef}>
      <button
        onClick={() => {
          if (children) {
            setIsOpen(!isOpen)
          } else {
            onClick()
          }
        }}
        className={`w-10 h-8 border rounded text-sm transition-colors flex items-center justify-center ${isActive ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        title={label}
      >
        {Icon ? <Icon className="w-4 h-4" /> : label}
      </button>

      {children && isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2 min-w-48 max-w-xs">
          <div className="mb-2 text-xs font-medium text-gray-700">{label}</div>
          {children}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
})

CompactControlButton.displayName = "CompactControlButton"

// File Info Section Component
const FileInfoSection = ({ files, totalSize, totalPages, passwordProtectedFiles }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">File Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", `${files.length} / ${LIMITS.MAX_FILES}`],
        ["Total size:", `${totalSize} / ${LIMITS.MAX_SIZE_MB} MB`],
        ["Total pages:", `${totalPages} / ${LIMITS.MAX_PAGES} pages`],
        ["Password protected:", passwordProtectedFiles.size]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-blue-700">{label}</span>
          <span className="font-semibold text-blue-900">{value}</span>
        </div>
      ))}
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

// FacingPagesPreview component
const FacingPagesPreview = memo(({ leftPage, rightPage, settings, shouldShowLeftNumber, shouldShowRightNumber }) => {
  const getPageNumberPosition = (isLeft) => {
    const { vertical, horizontal } = settings.position
    const margin = settings.margin === "small" ? 8 : settings.margin === "big" ? 24 : 16

    let positionClasses = "absolute text-xs font-medium pointer-events-none z-20 "

    if (vertical === "top") {
      positionClasses += "top-2 "
    } else if (vertical === "middle") {
      positionClasses += "top-1/2 -translate-y-1/2 "
    } else {
      positionClasses += "bottom-2 "
    }

    if (isLeft) {
      if (horizontal === "left") {
        positionClasses += "left-2 "
      } else if (horizontal === "center") {
        positionClasses += "left-1/2 -translate-x-1/2 "
      } else {
        positionClasses += "right-2 "
      }
    } else {
      if (horizontal === "left") {
        positionClasses += "right-2 "
      } else if (horizontal === "center") {
        positionClasses += "left-1/2 -translate-x-1/2 "
      } else {
        positionClasses += "left-2 "
      }
    }

    return positionClasses
  }

  const getPageNumberText = (page) => {
    const actualPageNumber = page.pageNumber + (settings.firstNumber - 1)
    return settings.customText
      .replace("{n}", actualPageNumber.toString())
      .replace("{p}", page.totalPages?.toString() || "1")
  }

  const renderPage = (page, shouldShowNumber, isLeft) => {
    if (!page) {
      return <div className="w-1/2 h-full bg-gray-100 rounded-lg"></div>
    }

    return (
      <div className="w-1/2 h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
        <Document
          file={page.pdfData}
          loading={
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          }
          error={
            <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
              <FileText className="w-12 h-12 text-blue-400 mb-2" />
              <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
            </div>
          }
          className="w-full h-full flex items-center justify-center"
          options={PDF_OPTIONS}
        >
          <div className="relative">
            <Page
              pageNumber={page.pageNumber}
              width={150}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-gray-200 shadow-sm"
              loading={
                <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              }
            />

            {shouldShowNumber && (
              <div
                className={getPageNumberPosition(isLeft)}
                style={{
                  color: settings.fontColor,
                  fontSize: `${Math.max(8, settings.fontSize * 0.6)}px`,
                  fontFamily: settings.fontFamily,
                  fontWeight: settings.bold ? "bold" : "normal",
                  fontStyle: settings.italic ? "italic" : "normal",
                  textDecoration: settings.underline ? "underline" : "none",
                  textAlign: settings.textAlign,
                  backgroundColor: settings.backgroundColor !== "transparent" ? settings.backgroundColor : undefined,
                  padding: settings.backgroundColor !== "transparent" ? "1px 3px" : undefined,
                  borderRadius: settings.backgroundColor !== "transparent" ? "2px" : undefined,
                  opacity: settings.opacity / 100,
                }}
              >
                {getPageNumberText(page)}
              </div>
            )}
          </div>
        </Document>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative hover:border-blue-300 hover:shadow-lg">
      <div className="flex gap-0.5 h-56 p-3">
        {renderPage(leftPage, shouldShowLeftNumber, true)}
        {renderPage(rightPage, shouldShowRightNumber, false)}
      </div>
      <div className="p-3 bg-gray-50 h-16 flex flex-col justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">
            {leftPage && rightPage
              ? `Pages ${leftPage.pageNumber}-${rightPage.pageNumber}`
              : leftPage
                ? `Page ${leftPage.pageNumber}`
                : rightPage
                  ? `Page ${rightPage.pageNumber}`
                  : "Empty"}
          </p>
        </div>
      </div>
    </div>
  )
})

FacingPagesPreview.displayName = "FacingPagesPreview"

// Password Protected Preview Component
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

// Generic Preview Component
const GenericPreview = ({ isHealthy }) => (
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

// Enhanced PDF Page Preview Component
const PDFPagePreview = memo(({ page, pageNumber, settings, fileColor, isPasswordProtected, shouldShowPageNumber, isHealthy }) => {
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

  const getPageNumberPosition = () => {
    const { vertical, horizontal } = settings.position
    const marginValue = settings.margin === "small" ? 8 : settings.margin === "big" ? 24 : 16

    let positionClasses = "absolute text-xs font-medium pointer-events-none z-20 "

    if (vertical === "top") {
      positionClasses += `top-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
    } else if (vertical === "middle") {
      positionClasses += "top-1/2 -translate-y-1/2 "
    } else {
      positionClasses += `bottom-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
    }

    if (horizontal === "left") {
      positionClasses += `left-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
    } else if (horizontal === "center") {
      positionClasses += "left-1/2 -translate-x-1/2 "
    } else {
      positionClasses += `right-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
    }

    return positionClasses
  }

  const getPageNumberText = () => {
    const actualPageNumber = pageNumber + (settings.firstNumber - 1)
    return settings.customText
      .replace("{n}", actualPageNumber.toString())
      .replace("{p}", page.totalPages?.toString() || "1")
  }

  const renderPreview = () => {
    if (isPasswordProtected) return <PasswordProtectedPreview />
    if (!isVisible || hasError || !isHealthy) return <GenericPreview isHealthy={isHealthy} />

    if (page.pdfData) {
      return (
        <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
          <Document
            file={page.pdfData}
            onLoadError={() => setHasError(true)}
            loading={
              <div className="flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            }
            error={
              <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
                <FileText className="w-12 h-12 text-blue-400 mb-2" />
                <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
              </div>
            }
            className="w-full h-full flex items-center justify-center"
            options={PDF_OPTIONS}
          >
            <div className="relative">
              <Page
                pageNumber={page.pageNumber}
                width={150}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-200 shadow-sm"
                loading={
                  <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                }
              />

              {shouldShowPageNumber && (
                <div
                  className={getPageNumberPosition()}
                  style={{
                    color: settings.fontColor,
                    fontSize: `${Math.max(8, settings.fontSize * 0.6)}px`,
                    fontFamily: settings.fontFamily,
                    fontWeight: settings.bold ? "bold" : "normal",
                    fontStyle: settings.italic ? "italic" : "normal",
                    textDecoration: settings.underline ? "underline" : "none",
                    textAlign: settings.textAlign,
                    backgroundColor: settings.backgroundColor !== "transparent" ? settings.backgroundColor : undefined,
                    padding: settings.backgroundColor !== "transparent" ? "1px 3px" : undefined,
                    borderRadius: settings.backgroundColor !== "transparent" ? "2px" : undefined,
                    opacity: settings.opacity / 100,
                  }}
                >
                  {getPageNumberText()}
                </div>
              )}
            </div>
          </Document>
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <div className="text-xs text-gray-500 font-medium">Blank Page</div>
        </div>
      </div>
    )
  }

  const borderClasses = isPasswordProtected
    ? "border-yellow-300 bg-yellow-50"
    : isHealthy
      ? "border-gray-200 hover:border-blue-300 hover:shadow-lg"
      : "border-yellow-300 bg-yellow-50"

  return (
    <div
      ref={elementRef}
      className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${borderClasses}`}
    >
      <div className="relative h-56 p-3">
        <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>
      </div>

      <div className="p-3 bg-gray-50 h-16 flex flex-col justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800 line-clamp-1">
            {String.fromCharCode(65 + page.colorIndex)}: {page.fileName}
          </p>
        </div>
      </div>
    </div>
  )
})

PDFPagePreview.displayName = "PDFPagePreview"

// Sidebar Component
const Sidebar = ({
  settings,
  updateSettings,
  files,
  selectedFileIndex,
  setSelectedFileIndex,
  removeFile,
  pages,
  totalSize,
  totalPages,
  passwordProtectedFiles,
  limitsExceeded,
  onAddPageNumbers
}) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className="p-6 flex-1">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Page Number Options</h3>

      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          Configure page number position, style, and formatting. Preview shows how numbers will appear on your PDF pages.
        </p>
      </div>

      {passwordProtectedFiles.size > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords will be required for processing.
          </p>
        </div>
      )}

      {/* File selector dropdown */}
      {files.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select file to preview:</label>
          <CustomFileDropdown
            files={files}
            selectedIndex={selectedFileIndex}
            onSelect={(index) => {
              setSelectedFileIndex(index)
              const selectedFile = files[index]
              const totalPages = pages.filter((p) => p.fileId === selectedFile.id).length
              updateSettings("selectedFileIndex", index)
              updateSettings("pageFrom", 1)
              updateSettings("pageTo", totalPages)
            }}
            onRemove={removeFile}
          />
        </div>
      )}

      {/* Page Mode */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900">Page mode</h4>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="pageMode"
              value="single"
              checked={settings.pageMode === "single"}
              onChange={(e) => updateSettings("pageMode", e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-500 outline-none"
            />
            <span className="ml-2 text-sm text-gray-700">Single page</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="pageMode"
              value="facing"
              checked={settings.pageMode === "facing"}
              onChange={(e) => updateSettings("pageMode", e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-500 outline-none"
            />
            <span className="ml-2 text-sm text-gray-700">Facing pages</span>
          </label>
        </div>

        {settings.pageMode === "facing" && (
          <div className="mt-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.firstPageCover}
                onChange={(e) => updateSettings("firstPageCover", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 accent-blue-500 outline-none"
              />
              <span className="ml-2 text-sm text-gray-700">First page is cover page</span>
            </label>
          </div>
        )}
      </div>

      {/* Position and Margin */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position:</label>
            <PositionGrid
              selectedPosition={settings.position}
              onPositionChange={(position) => updateSettings("position", position)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin:</label>
            <div className="relative">
              <select
                value={settings.margin}
                onChange={(e) => updateSettings("margin", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
              >
                <option value="small">Small</option>
                <option value="medium">Recommended</option>
                <option value="big">Big</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Pages</label>

        <div className="space-y-3">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg w-full">
            <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">
              First number:
            </span>
            <input
              type="number"
              value={settings.firstNumber}
              onChange={(e) => updateSettings("firstNumber", Number(e.target.value))}
              className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
              min="1"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-600 mb-1">Which pages do you want to number?</label>
            <div className="flex gap-2">
              <div className="flex items-center bg-white border border-gray-300 rounded-lg flex-1 min-w-0">
                <span className="px-2 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">
                  From:
                </span>
                <input
                  type="number"
                  value={settings.pageFrom}
                  onChange={(e) => updateSettings("pageFrom", Number(e.target.value))}
                  className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
                  min="1"
                />
              </div>
              <div className="flex items-center bg-white border border-gray-300 rounded-lg flex-1 min-w-0">
                <span className="px-2 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">To:</span>
                <input
                  type="number"
                  value={settings.pageTo}
                  onChange={(e) => updateSettings("pageTo", Number(e.target.value))}
                  className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Which pages do you want to number?</label>
            <div className="relative">
              <select
                value={settings.pageRange}
                onChange={(e) => updateSettings("pageRange", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
              >
                <option value="all">All pages from the beginning</option>
                <option value="exclude-first-1">Exclude the first page</option>
                <option value="exclude-first-2">Exclude the first 2 pages</option>
                <option value="exclude-first-3">Exclude the first 3 pages</option>
                <option value="exclude-last-1">Exclude the last page</option>
                <option value="exclude-last-2">Exclude the last 2 pages</option>
                <option value="exclude-last-3">Exclude the last 3 pages</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Text:</label>
        <div className="relative">
          <select
            value={settings.textFormat}
            onChange={(e) => updateSettings("textFormat", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
          >
            <option value="{n}">Insert only page number (recommended)</option>
            <option value="Page {n}">{"Page {n}"}</option>
            <option value="Page {n} of {p}">{"Page {n} of {p}"}</option>
            <option value="custom">Custom</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {settings.textFormat === "custom" && (
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Custom text:</label>
            <input
              type="text"
              value={settings.customText}
              onChange={(e) => updateSettings("customText", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Page {n} of {p}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {"{n}"} for page number, {"{p}"} for total pages
            </p>
          </div>
        )}
      </div>

      {/* Text Format - Compact Controls */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Text format:</label>

        <div className="flex gap-1 flex-wrap">
          <CompactControlButton
            label="B"
            isActive={settings.bold}
            onClick={() => updateSettings("bold", !settings.bold)}
          />
          <CompactControlButton
            label="I"
            isActive={settings.italic}
            onClick={() => updateSettings("italic", !settings.italic)}
          />
          <CompactControlButton
            label="U"
            isActive={settings.underline}
            onClick={() => updateSettings("underline", !settings.underline)}
          />

          <CompactControlButton icon={Type} label="Font" isActive={false}>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings("fontFamily", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none"
              style={{ fontFamily: settings.fontFamily }}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Courier">Courier</option>
              <option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option>
            </select>
          </CompactControlButton>

          <CompactControlButton label="Size" isActive={false}>
            <div className="space-y-2">
              <div className="text-center text-sm">{settings.fontSize}px</div>
              <input
                type="range"
                min="8"
                max="72"
                value={settings.fontSize}
                onChange={(e) => updateSettings("fontSize", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider outline-none"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => updateSettings("fontSize", Math.max(8, settings.fontSize - 1))}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => updateSettings("fontSize", Math.min(72, settings.fontSize + 1))}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </CompactControlButton>

          <CompactControlButton icon={Palette} label="Color" isActive={false}>
            <div className="space-y-2">
              <input
                type="color"
                value={settings.fontColor}
                onChange={(e) => updateSettings("fontColor", e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer outline-none"
              />
              <div className="text-xs text-gray-600">{settings.fontColor}</div>
            </div>
          </CompactControlButton>

          <CompactControlButton label="BG" isActive={settings.backgroundColor !== "transparent"}>
            <div className="space-y-2">
              <input
                type="color"
                value={settings.backgroundColor === "transparent" ? "#ffffff" : settings.backgroundColor}
                onChange={(e) => updateSettings("backgroundColor", e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer outline-none"
                disabled={settings.backgroundColor === "transparent"}
              />
              <button
                onClick={() =>
                  updateSettings(
                    "backgroundColor",
                    settings.backgroundColor === "transparent" ? "#ffffff" : "transparent",
                  )
                }
                className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                {settings.backgroundColor === "transparent" ? "Add Background" : "Remove Background"}
              </button>
            </div>
          </CompactControlButton>

          <CompactControlButton label="Op" isActive={false}>
            <div className="space-y-2">
              <div className="text-center text-sm">{settings.opacity}%</div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.opacity}
                onChange={(e) => updateSettings("opacity", Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider outline-none"
              />
            </div>
          </CompactControlButton>
        </div>
      </div>

      {files.length > 0 && (
        <FileInfoSection
          files={files}
          totalSize={totalSize}
          totalPages={totalPages}
          passwordProtectedFiles={passwordProtectedFiles}
        />
      )}
    </div>

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onAddPageNumbers}
          disabled={pages.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0
              ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Add Page Numbers
          <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded limitsExceeded={limitsExceeded} files={files} totalSize={totalSize} totalPages={totalPages} />
      )}
      {pages.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Add PDF files to continue</p>}
    </div>
  </div>
)

// Main Component
export default function AddPageNumbersPage() {
  const [files, setFiles] = useState([])
  const [pages, setPages] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedFileIndex, setSelectedFileIndex] = useState(0)
  const [loadingPdfs, setLoadingPdfs] = useState(new Set())
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})

  const { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll } = useFileCache()
  const { passwordProtectedFiles, checkPasswordProtection, removePasswordProtected } = usePasswordProtection()
  const router = useRouter()

  // Page numbering settings
  const [settings, setSettings] = useState({
    pageMode: "single",
    firstPageCover: false,
    position: { vertical: "bottom", horizontal: "right" },
    margin: "medium",
    firstNumber: 1,
    pageRange: "all",
    excludeFirst: 0,
    excludeLast: 0,
    textFormat: "{n}",
    customText: "{n}",
    fontFamily: "Times New Roman",
    fontSize: 12,
    bold: false,
    italic: false,
    underline: false,
    fontColor: "#000000",
    backgroundColor: "transparent",
    textAlign: "center",
    opacity: 100,
    pageFrom: 1,
    pageTo: 100,
    selectedFileIndex: 0,
  })

  // Create stable file data
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

  // Extract pages from PDF - Optimized for performance
  const extractPagesFromPDF = useCallback(async (file, fileId, fileIndex) => {
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
            pdfData: null,
            isPasswordProtected: true,
            colorIndex: fileIndex % FILE_COLORS.length,
            totalPages: 1,
          },
        ]
      }

      const loadingTask = pdfjs.getDocument({ data: stableData.uint8Array })
      const pdf = await loadingTask.promise
      pdfDocumentCache.current[fileId] = pdf

      // Optimize: Only create page objects, don't load actual pages yet
      const extractedPages = []
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        extractedPages.push({
          id: `${fileId}_page_${pageNum}`,
          fileId,
          fileName: file.name,
          pageNumber: pageNum,
          displayNumber: pageNum,
          pdfData: stableData.dataUrl,
          isPasswordProtected: false,
          colorIndex: fileIndex % FILE_COLORS.length,
          totalPages: pdf.numPages,
        })
      }

      setPdfHealthCheck(prev => ({ ...prev, [fileId]: true }))
      return extractedPages
    } catch (error) {
      console.error("Error extracting pages from PDF:", error)
      setPdfHealthCheck(prev => ({ ...prev, [fileId]: false }))
      return []
    }
  }, [createStableFileData, pdfDocumentCache])

  // Handle file uploads
  const handleFiles = useCallback(async (newFiles) => {
    const fileObjects = []
    const allPages = []

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
        totalPages: 0, // Will be updated after PDF load
      }

      fileObjects.push(fileObject)

      const extractedPages = await extractPagesFromPDF(file, fileId, fileIndex)
      allPages.push(...extractedPages)

      // Update total pages for the file
      fileObject.totalPages = extractedPages.length
    }

    setFiles(prev => [...prev, ...fileObjects])
    setPages(prev => [...prev, ...allPages])
  }, [files.length, extractPagesFromPDF])

  // Remove file
  const removeFile = useCallback((fileId) => {
    cleanupFile(fileId)
    removePasswordProtected(fileId)

    setLoadingPdfs(prev => { const newSet = new Set(prev); newSet.delete(fileId); return newSet })
    setPdfHealthCheck(prev => { const { [fileId]: removed, ...rest } = prev; return rest })
    setFiles(prev => prev.filter(file => file.id !== fileId))
    setPages(prev => prev.filter(page => page.fileId !== fileId))
  }, [cleanupFile, removePasswordProtected])

  // Update settings
  const updateSettings = useCallback((key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }

      if (key === "textFormat" && value !== "custom") {
        newSettings.customText = value
      }

      return newSettings
    })
  }, [])

  // Check if page should show page number
  const shouldShowPageNumber = useCallback((pageIndex) => {
    if (settings.firstPageCover && pageIndex === 0) {
      return false
    }

    const totalPages = pages.length

    if (settings.pageRange === "exclude-first-1" && pageIndex === 0) return false
    if (settings.pageRange === "exclude-first-2" && pageIndex < 2) return false
    if (settings.pageRange === "exclude-first-3" && pageIndex < 3) return false
    if (settings.pageRange === "exclude-last-1" && pageIndex === totalPages - 1) return false
    if (settings.pageRange === "exclude-last-2" && pageIndex >= totalPages - 2) return false
    if (settings.pageRange === "exclude-last-3" && pageIndex >= totalPages - 3) return false

    return true
  }, [settings.firstPageCover, settings.pageRange, pages.length])

  // Handle password submission
  const handlePasswordSubmit = useCallback(async (passwords, currentSettings) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("settings", JSON.stringify(currentSettings))

      files.forEach(file => {
        formData.append("files", file.file)
        formData.append(`fileId_${file.id}`, file.id.toString())
      })

      const filePasswords = {}
      files.forEach(file => {
        if (passwordProtectedFiles.has(file.id)) {
          filePasswords[file.id] = passwords[file.id] || ""
        }
      })
      formData.append("passwords", JSON.stringify(filePasswords))

      const response = await Api.post("/tools/add-page-numbers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=add-page-numbers`
        router.push(downloadUrl)
      } else {
        toast.error("No processed PDF received from server")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error adding page numbers")
    } finally {
      setIsUploading(false)
    }
  }, [files, passwordProtectedFiles, router])

  // Handle organize
  const handleAddPageNumbers = useCallback(async () => {
    if (pages.length === 0) return

    const currentProtectedFiles = files.filter(file => passwordProtectedFiles.has(file.id))
    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }

    await handlePasswordSubmit({}, settings)
  }, [files, pages, passwordProtectedFiles, settings, handlePasswordSubmit])

  // Computed values
  const totalSize = useMemo(() =>
    files.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2),
    [files]
  )

  const totalPages = useMemo(() =>
    pages.length,
    [pages.length]
  )

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

  const hasUnhealthyFiles = useMemo(() =>
    Object.values(pdfHealthCheck).some(health => health === false),
    [pdfHealthCheck]
  )

  const protectedFilesForModal = useMemo(
    () => files.filter(file => passwordProtectedFiles.has(file.id)),
    [files, passwordProtectedFiles]
  )

  // Generate filtered pages for preview - Optimize to show only visible range
  const filteredPages = useMemo(() => {
    if (files.length === 0) return []
    const selectedFile = files[selectedFileIndex]
    if (!selectedFile) return []

    const from = settings.pageFrom || 1
    const to = settings.pageTo || 1

    // Optimize: Only return pages in the visible range to prevent performance issues
    return pages
      .filter(page => page.fileId === selectedFile.id)
      .filter(page => page.displayNumber >= from && page.displayNumber <= to)
      .slice(0, 100) // Limit preview to first 100 pages for performance
  }, [pages, selectedFileIndex, files, settings.pageFrom, settings.pageTo])

  // Generate facing pages pairs
  const facingPagesPairs = useMemo(() => {
    if (settings.pageMode !== "facing") return []
    const pagesForPreview = filteredPages

    const pairs = []
    let startIndex = 0

    if (settings.firstPageCover && pagesForPreview.length > 0) {
      pairs.push({
        leftPage: pagesForPreview[0],
        rightPage: null,
        isCover: true,
      })
      startIndex = 1
    }

    for (let i = startIndex; i < pagesForPreview.length; i += 2) {
      pairs.push({
        leftPage: pagesForPreview[i] || null,
        rightPage: pagesForPreview[i + 1] || null,
        isCover: false,
      })
    }

    return pairs
  }, [filteredPages, settings.pageMode, settings.firstPageCover])

  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => (
    <FileUploader {...safeProps} />
  )

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
        pageTitle="Add Page Numbers"
        pageSubTitle="Add page numbers to your PDF files with customizable position, style, and formatting options."
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
        maxPages={LIMITS.MAX_PAGES}
      />
    )
  }

  const sidebarProps = {
    settings,
    updateSettings,
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    removeFile,
    pages,
    totalSize,
    totalPages,
    passwordProtectedFiles,
    limitsExceeded,
    onAddPageNumbers: handleAddPageNumbers
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="p-4 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">PDF Pages ({filteredPages.length})</h2>
            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".pdf"]}
              showFiles={true}
              selectedCount={files?.length}
              pageTitle="Add Page Numbers"
              pageSubTitle="Add page numbers to your PDF files with customizable position, style, and formatting options."
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
              maxPages={LIMITS.MAX_PAGES}
            />
          </div>

          {/* Performance Warning for Large Files */}
          {totalPages > 500 && (
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Large PDF detected ({totalPages} pages). Preview is limited to first 100 pages for performance. All pages will be processed during conversion.
              </p>
            </div>
          )}

          {hasUnhealthyFiles && (
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800">
                Some files have preview issues but can still be processed. Check the yellow-highlighted files.
              </p>
            </div>
          )}

          <div
            className={`grid gap-4 mb-20 md:mb-4 ${settings.pageMode === "facing"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
          >
            {settings.pageMode === "single"
              ? filteredPages.map((page, index) => (
                <PDFPagePreview
                  key={page.id}
                  page={page}
                  pageNumber={page.displayNumber}
                  settings={settings}
                  fileColor={FILE_COLORS[page.colorIndex]}
                  isPasswordProtected={page.isPasswordProtected}
                  shouldShowPageNumber={shouldShowPageNumber(index)}
                  isHealthy={pdfHealthCheck[page.fileId] !== false}
                />
              ))
              : facingPagesPairs.map((pair, index) => (
                <FacingPagesPreview
                  key={`pair-${index}`}
                  leftPage={pair.leftPage}
                  rightPage={pair.rightPage}
                  settings={settings}
                  shouldShowLeftNumber={
                    pair.isCover ? false : shouldShowPageNumber(pair.leftPage ? pair.leftPage.pageNumber - 1 : -1)
                  }
                  shouldShowRightNumber={pair.rightPage ? shouldShowPageNumber(pair.rightPage.pageNumber - 1) : false}
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
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowMobileSidebar(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar pb-16"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Page Number Options</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-4">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Configure page number position, style, and formatting. Preview shows how numbers will appear on your PDF pages.
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
                  <FileInfoSection
                    files={files}
                    totalSize={totalSize}
                    totalPages={totalPages}
                    passwordProtectedFiles={passwordProtectedFiles}
                  />
                )}
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
                    onClick={handleAddPageNumbers}
                    disabled={pages.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                      }`}
                  >
                    Add Page Numbers
                    <ArrowRight className="w-4 h-4" />
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
        </div>

        {/* Password Modal */}
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          passwordProtectedFiles={protectedFilesForModal}
          onSubmit={(passwords) => handlePasswordSubmit(passwords, settings)}
        />
      </div>
    </div>
  )
}


// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
// import { useRouter } from "next/navigation"
// import { FileText, ChevronDown, ArrowRight, RefreshCw, X, Palette, Type, Minus, Plus } from "lucide-react"
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
//   { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-800", accent: "bg-blue-500" },
//   { border: "border-green-300", bg: "bg-green-50", text: "text-green-800", accent: "bg-green-500" },
//   { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-800", accent: "bg-purple-500" },
//   { border: "border-yellow-300", bg: "bg-yellow-50", text: "text-yellow-800", accent: "bg-yellow-500" },
// ]

// // Position Grid Component
// const PositionGrid = memo(({ selectedPosition, onPositionChange }) => {
//   const positions = [
//     { vertical: "top", horizontal: "left" },
//     { vertical: "top", horizontal: "center" },
//     { vertical: "top", horizontal: "right" },
//     { vertical: "middle", horizontal: "left" },
//     { vertical: "middle", horizontal: "center" },
//     { vertical: "middle", horizontal: "right" },
//     { vertical: "bottom", horizontal: "left" },
//     { vertical: "bottom", horizontal: "center" },
//     { vertical: "bottom", horizontal: "right" },
//   ]

//   return (
//     <div className="grid grid-cols-3 gap-1 w-20 h-20 border border-gray-300 rounded p-1 bg-white">
//       {positions.map((position, index) => {
//         const isSelected =
//           selectedPosition.vertical === position.vertical && selectedPosition.horizontal === position.horizontal

//         return (
//           <button
//             key={index}
//             onClick={() => onPositionChange(position)}
//             className={`w-5 h-5 rounded-sm border transition-all duration-200 ${isSelected ? "bg-blue-500 border-blue-600" : "bg-gray-100 border-gray-300 hover:bg-gray-200"
//               }`}
//           />
//         )
//       })}
//     </div>
//   )
// })

// PositionGrid.displayName = "PositionGrid"

// // Custom File Dropdown Component - Add outside click and positioning
// const CustomFileDropdown = memo(({ files, selectedIndex, onSelect, onRemove }) => {
//   const [isOpen, setIsOpen] = useState(false)
//   const dropdownRef = useRef(null)

//   // Close on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//       >
//         <span className="truncate">
//           {files[selectedIndex]?.name || "Select file"} ({files[selectedIndex]?.totalPages || 0} pages)
//         </span>
//         <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
//       </button>

//       {isOpen && (
//         <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
//           {files.map((file, index) => (
//             <div
//               key={file.id}
//               className={`p-3 flex items-center justify-between hover:bg-gray-50 ${index === selectedIndex ? "bg-blue-50" : ""
//                 }`}
//             >
//               <button
//                 onClick={() => {
//                   onSelect(index)
//                   setIsOpen(false)
//                 }}
//                 className="flex-1 text-left truncate"
//               >
//                 <span className="font-medium">{file.name}</span>
//                 <span className="text-sm text-gray-500 ml-2">({file.totalPages || 0} pages)</span>
//               </button>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   onRemove(file.id)
//                   if (files.length === 1) setIsOpen(false)
//                 }}
//                 className="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors duration-200 ml-2"
//                 title="Remove file"
//               >
//                 <X className="w-3 h-3 text-blue-500" />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// })

// CustomFileDropdown.displayName = "CustomFileDropdown"

// // Compact Control Button Component - Add outside click
// const CompactControlButton = memo(({ icon: Icon, label, isActive, onClick, children }) => {
//   const [isOpen, setIsOpen] = useState(false)
//   const buttonRef = useRef(null)

//   // Close on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (buttonRef.current && !buttonRef.current.contains(event.target)) {
//         setIsOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   return (
//     <div className="relative flex-1" ref={buttonRef}>
//       <button
//         onClick={() => {
//           if (children) {
//             setIsOpen(!isOpen)
//           } else {
//             onClick()
//           }
//         }}
//         className={`w-10 h-8 border rounded text-sm transition-colors flex items-center justify-center ${isActive ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//           }`}
//         title={label}
//       >
//         {Icon ? <Icon className="w-4 h-4" /> : label}
//       </button>

//       {children && isOpen && (
//         <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2 min-w-48 max-w-xs">
//           <div className="mb-2 text-xs font-medium text-gray-700">{label}</div>
//           {children}
//           <button
//             onClick={() => setIsOpen(false)}
//             className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
//           >
//             Close
//           </button>
//         </div>
//       )}
//     </div>
//   )
// })

// CompactControlButton.displayName = "CompactControlButton"

// // FacingPagesPreview component
// const FacingPagesPreview = memo(({ leftPage, rightPage, settings, shouldShowLeftNumber, shouldShowRightNumber }) => {
//   const getMarginValue = () => {
//     switch (settings.margin) {
//       case "small":
//         return 8
//       case "medium":
//         return 16
//       case "big":
//         return 24
//       default:
//         return 16
//     }
//   }

//   const getPageNumberPosition = (isLeft) => {
//     const { vertical, horizontal } = settings.position
//     const margin = getMarginValue()

//     let positionClasses = "absolute text-xs font-medium pointer-events-none z-20 "

//     // Vertical positioning (same for both pages)
//     if (vertical === "top") {
//       positionClasses += "top-2 "
//     } else if (vertical === "middle") {
//       positionClasses += "top-1/2 -translate-y-1/2 "
//     } else {
//       positionClasses += "bottom-2 "
//     }

//     // Horizontal positioning (opposite for facing pages)
//     if (isLeft) {
//       // Left page gets the selected position
//       if (horizontal === "left") {
//         positionClasses += "left-2 "
//       } else if (horizontal === "center") {
//         positionClasses += "left-1/2 -translate-x-1/2 "
//       } else {
//         positionClasses += "right-2 "
//       }
//     } else {
//       // Right page gets the opposite position
//       if (horizontal === "left") {
//         positionClasses += "right-2 "
//       } else if (horizontal === "center") {
//         positionClasses += "left-1/2 -translate-x-1/2 "
//       } else {
//         positionClasses += "left-2 "
//       }
//     }

//     return positionClasses
//   }

//   const getPageNumberText = (page) => {
//     const actualPageNumber = page.pageNumber + (settings.firstNumber - 1)
//     return settings.customText
//       .replace("{n}", actualPageNumber.toString())
//       .replace("{p}", page.totalPages?.toString() || "1")
//   }

//   const renderPage = (page, shouldShowNumber, isLeft) => {
//     if (!page) {
//       return <div className="w-1/2 h-full bg-gray-100 rounded-lg"></div>
//     }

//     return (
//       <div className="w-1/2 h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//         <Document
//           file={page.pdfData}
//           loading={
//             <div className="flex items-center justify-center">
//               <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//             </div>
//           }
//           error={
//             <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
//               <FileText className="w-12 h-12 text-blue-400 mb-2" />
//               <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
//             </div>
//           }
//           className="w-full h-full flex items-center justify-center"
//           options={PDF_OPTIONS}
//         >
//           <div className="relative">
//             <Page
//               pageNumber={page.pageNumber}
//               width={150}
//               renderTextLayer={false}
//               renderAnnotationLayer={false}
//               className="border border-gray-200 shadow-sm"
//               loading={
//                 <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
//                   <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                 </div>
//               }
//             />

//             {/* Page Number Overlay */}
//             {shouldShowNumber && (
//               <div
//                 className={getPageNumberPosition(isLeft)}
//                 style={{
//                   color: settings.fontColor,
//                   fontSize: `${Math.max(8, settings.fontSize * 0.6)}px`,
//                   fontFamily: settings.fontFamily,
//                   fontWeight: settings.bold ? "bold" : "normal",
//                   fontStyle: settings.italic ? "italic" : "normal",
//                   textDecoration: settings.underline ? "underline" : "none",
//                   textAlign: settings.textAlign,
//                   backgroundColor: settings.backgroundColor !== "transparent" ? settings.backgroundColor : undefined,
//                   padding: settings.backgroundColor !== "transparent" ? "1px 3px" : undefined,
//                   borderRadius: settings.backgroundColor !== "transparent" ? "2px" : undefined,
//                   opacity: settings.opacity / 100,
//                 }}
//               >
//                 {getPageNumberText(page)}
//               </div>
//             )}
//           </div>
//         </Document>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative hover:border-blue-300 hover:shadow-lg">
//       <div className="flex gap-0.5 h-56 p-3">
//         {renderPage(leftPage, shouldShowLeftNumber, true)}
//         {renderPage(rightPage, shouldShowRightNumber, false)}
//       </div>
//       <div className="p-3 bg-gray-50 h-16 flex flex-col justify-center">
//         <div className="text-center">
//           <p className="text-sm font-medium text-gray-800">
//             {leftPage && rightPage
//               ? `Pages ${leftPage.pageNumber}-${rightPage.pageNumber}`
//               : leftPage
//                 ? `Page ${leftPage.pageNumber}`
//                 : rightPage
//                   ? `Page ${rightPage.pageNumber}`
//                   : "Empty"}
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// })

// FacingPagesPreview.displayName = "FacingPagesPreview"

// // Enhanced PDF Page Preview Component
// const PDFPagePreview = memo(({ page, pageNumber, settings, fileColor, isPasswordProtected, shouldShowPageNumber }) => {
//   const [isVisible, setIsVisible] = useState(false)
//   const [hasError, setHasError] = useState(false)
//   const elementRef = useRef(null)

//   // Intersection observer for lazy loading
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

//   const getMarginValue = () => {
//     switch (settings.margin) {
//       case "small":
//         return 8
//       case "medium":
//         return 16
//       case "big":
//         return 24
//       default:
//         return 16
//     }
//   }

//   const getPageNumberText = () => {
//     const actualPageNumber = pageNumber + (settings.firstNumber - 1)
//     return settings.customText
//       .replace("{n}", actualPageNumber.toString())
//       .replace("{p}", page.totalPages?.toString() || "1")
//   }

//   const getPageNumberPosition = () => {
//     const { vertical, horizontal } = settings.position
//     const marginValue = getMarginValue()

//     let positionClasses = "absolute text-xs font-medium pointer-events-none z-20 "

//     // Vertical positioning with margin
//     if (vertical === "top") {
//       positionClasses += `top-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
//     } else if (vertical === "middle") {
//       positionClasses += "top-1/2 -translate-y-1/2 "
//     } else {
//       positionClasses += `bottom-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
//     }

//     // Horizontal positioning with margin
//     if (horizontal === "left") {
//       positionClasses += `left-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
//     } else if (horizontal === "center") {
//       positionClasses += "left-1/2 -translate-x-1/2 "
//     } else {
//       positionClasses += `right-${marginValue === 8 ? "1" : marginValue === 16 ? "2" : "3"} `
//     }

//     return positionClasses
//   }

//   const renderPreview = () => {
//     if (isPasswordProtected) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
//           <IoMdLock className="text-4xl" />
//           <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
//             {[...Array(5)].map((_, i) => (
//               <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
//             ))}
//           </div>
//         </div>
//       )
//     }

//     if (!isVisible || hasError) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//           <FileText className="w-16 h-16 text-gray-400" />
//           <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
//         </div>
//       )
//     }

//     if (page.pdfData) {
//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           <Document
//             file={page.pdfData}
//             onLoadError={() => setHasError(true)}
//             loading={
//               <div className="flex items-center justify-center">
//                 <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//               </div>
//             }
//             error={
//               <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center rounded-lg p-4">
//                 <FileText className="w-12 h-12 text-blue-400 mb-2" />
//                 <div className="text-sm text-blue-600 font-medium text-center">Could not load preview</div>
//               </div>
//             }
//             className="w-full h-full flex items-center justify-center"
//             options={PDF_OPTIONS}
//           >
//             <div className="relative">
//               <Page
//                 pageNumber={page.pageNumber}
//                 width={150}
//                 renderTextLayer={false}
//                 renderAnnotationLayer={false}
//                 className="border border-gray-200 shadow-sm"
//                 loading={
//                   <div className="w-[150px] h-[200px] bg-gray-100 flex items-center justify-center">
//                     <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                   </div>
//                 }
//               />

//               {/* Page Number Overlay */}
//               {shouldShowPageNumber && (
//                 <div
//                   className={getPageNumberPosition()}
//                   style={{
//                     color: settings.fontColor,
//                     fontSize: `${Math.max(8, settings.fontSize * 0.6)}px`,
//                     fontFamily: settings.fontFamily,
//                     fontWeight: settings.bold ? "bold" : "normal",
//                     fontStyle: settings.italic ? "italic" : "normal",
//                     textDecoration: settings.underline ? "underline" : "none",
//                     textAlign: settings.textAlign,
//                     backgroundColor: settings.backgroundColor !== "transparent" ? settings.backgroundColor : undefined,
//                     padding: settings.backgroundColor !== "transparent" ? "1px 3px" : undefined,
//                     borderRadius: settings.backgroundColor !== "transparent" ? "2px" : undefined,
//                     opacity: settings.opacity / 100,
//                   }}
//                 >
//                   {getPageNumberText()}
//                 </div>
//               )}
//             </div>
//           </Document>
//         </div>
//       )
//     }

//     return (
//       <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
//         <div className="text-center">
//           <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//           <div className="text-xs text-gray-500 font-medium">Blank Page</div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div
//       ref={elementRef}
//       className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative hover:border-blue-300 hover:shadow-lg`}
//     >
//       {/* Page Preview Area */}
//       <div className="relative h-56 p-3">
//         <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>
//       </div>

//       {/* Page Info Footer */}
//       <div className={`p-3 bg-gray-50 h-16 flex flex-col justify-center`}>
//         <div className="text-center">
//           <p className={`text-sm font-medium text-gray-800 line-clamp-1`}>
//             {String.fromCharCode(65 + page.colorIndex)}: {page.fileName}
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// })

// PDFPagePreview.displayName = "PDFPagePreview"

// export default function AddPageNumbersPage() {
//   const [files, setFiles] = useState([])
//   const [pages, setPages] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [selectedFileIndex, setSelectedFileIndex] = useState(0)

//   // Page numbering settings
//   const [settings, setSettings] = useState({
//     pageMode: "single", // 'single' or 'facing'
//     firstPageCover: false,
//     position: { vertical: "bottom", horizontal: "right" },
//     margin: "medium",
//     firstNumber: 1,
//     pageRange: "all",
//     excludeFirst: 0,
//     excludeLast: 0,
//     textFormat: "{n}",
//     customText: "{n}",
//     fontFamily: "Times New Roman",
//     fontSize: 12,
//     bold: false,
//     italic: false,
//     underline: false,
//     fontColor: "#000000",
//     backgroundColor: "transparent",
//     textAlign: "center",
//     opacity: 100,
//     pageFrom: 1,
//     pageTo: 100,
//     selectedFileIndex: 0,
//   })

//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

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
//               pdfData: null,
//               isPasswordProtected: true,
//               colorIndex: fileIndex % FILE_COLORS.length,
//               totalPages: 1,
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
//             pdfData: stableData.dataUrl,
//             isPasswordProtected: false,
//             colorIndex: fileIndex % FILE_COLORS.length,
//             totalPages: pdf.numPages,
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
//     setPages((prev) => prev.filter((page) => page.fileId !== fileId))
//   }, [])

//   // Update settings
//   const updateSettings = useCallback((key, value) => {
//     setSettings((prev) => {
//       const newSettings = { ...prev, [key]: value }

//       // Update custom text when text format changes
//       if (key === "textFormat" && value !== "custom") {
//         newSettings.customText = value
//       }

//       return newSettings
//     })
//   }, [])

//   // Check if page should show page number
//   const shouldShowPageNumber = useCallback(
//     (pageIndex) => {
//       // If first page is cover and this is the first page, don't show number
//       if (settings.firstPageCover && pageIndex === 0) {
//         return false
//       }

//       // Handle page range exclusions
//       const totalPages = pages.length

//       if (settings.pageRange === "exclude-first-1" && pageIndex === 0) return false
//       if (settings.pageRange === "exclude-first-2" && pageIndex < 2) return false
//       if (settings.pageRange === "exclude-first-3" && pageIndex < 3) return false
//       if (settings.pageRange === "exclude-last-1" && pageIndex === totalPages - 1) return false
//       if (settings.pageRange === "exclude-last-2" && pageIndex >= totalPages - 2) return false
//       if (settings.pageRange === "exclude-last-3" && pageIndex >= totalPages - 3) return false

//       return true
//     },
//     [settings.firstPageCover, settings.pageRange, pages.length],
//   )

//   // Handle organize
//   const handleAddPageNumbers = useCallback(async () => {
//     if (pages.length === 0) return

//     const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))

//     if (currentProtectedFiles.length > 0) {
//       setShowPasswordModal(true)
//       return
//     }

//     await handlePasswordSubmit({}, settings)
//   }, [files, pages, passwordProtectedFiles, settings])

//   // Handle password submission
//   const handlePasswordSubmit = async (passwords, currentSettings) => {
//     setIsUploading(true)
//     setUploadProgress(0)

//     try {
//       const formData = new FormData()

//       // Add settings
//       formData.append("settings", JSON.stringify(currentSettings))

//       files.forEach((file) => {
//         formData.append("files", file.file)
//         formData.append(`fileId_${file.id}`, file.id.toString())
//       })

//       const filePasswords = {}
//       files.forEach((file) => {
//         if (passwordProtectedFiles.has(file.id)) {
//           filePasswords[file.id] = passwords[file.id] || ""
//         }
//       })
//       formData.append("passwords", JSON.stringify(filePasswords))

//       const response = await Api.post("/tools/add-page-numbers", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
//           setUploadProgress(progress)
//         },
//       })

//       if (response.data) {
//         const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
//         const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=add-page-numbers`
//         router.push(downloadUrl)
//       } else {
//         toast.error("No processed PDF received from server")
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Error adding page numbers")
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   // Memoized calculations
//   const totalSize = useMemo(
//     () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
//     [files],
//   )

//   const protectedFilesForModal = useMemo(
//     () => files.filter((file) => passwordProtectedFiles.has(file.id)),
//     [files, passwordProtectedFiles],
//   )

//   // Generate facing pages pairs
//   const filteredPages = useMemo(() => {
//     if (files.length === 0) return []
//     const selectedFile = files[selectedFileIndex]
//     if (!selectedFile) return []
//     const from = settings.pageFrom || 1
//     const to = settings.pageTo || 1
//     return pages
//       .filter((page) => page.fileId === selectedFile.id)
//       .filter((page) => page.displayNumber >= from && page.displayNumber <= to)
//   }, [pages, selectedFileIndex, files, settings.pageFrom, settings.pageTo])

//   // Generate facing pages pairs
//   const facingPagesPairs = useMemo(() => {
//     if (settings.pageMode !== "facing") return []
//     const pagesForPreview = filteredPages

//     const pairs = []
//     let startIndex = 0

//     // If first page is cover, add it as a separate card
//     if (settings.firstPageCover && pagesForPreview.length > 0) {
//       pairs.push({
//         leftPage: pagesForPreview[0],
//         rightPage: null,
//         isCover: true,
//       })
//       startIndex = 1
//     }

//     // Create pairs from remaining pages
//     for (let i = startIndex; i < pagesForPreview.length; i += 2) {
//       pairs.push({
//         leftPage: pagesForPreview[i] || null,
//         rightPage: pagesForPreview[i + 1] || null,
//         isCover: false,
//       })
//     }

//     return pairs
//   }, [filteredPages, settings.pageMode, settings.firstPageCover])

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
//         pageTitle="Add Page Numbers"
//         pageSubTitle="Add page numbers to your PDF files with customizable position, style, and formatting options."
//       />
//     )
//   }

//   return (
//     <div className="h-full">
//       <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
//         {/* Main Content */}
//         <div className="p-4 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">PDF Pages ({filteredPages.length})</h2>
//             <SafeFileUploader
//               isMultiple={true}
//               onFilesSelect={handleFiles}
//               isDragOver={isDragOver}
//               setIsDragOver={setIsDragOver}
//               allowedTypes={[".pdf"]}
//               showFiles={true}
//               selectedCount={files?.length}
//               pageTitle="Add Page Numbers"
//               pageSubTitle="Add page numbers to your PDF files with customizable position, style, and formatting options."
//             />
//           </div>

//           {/* File selector dropdown */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">Select file to preview:</label>
//             <CustomFileDropdown
//               files={files}
//               selectedIndex={selectedFileIndex}
//               onSelect={(index) => {
//                 setSelectedFileIndex(index)
//                 const selectedFile = files[index]
//                 const totalPages = pages.filter((p) => p.fileId === selectedFile.id).length
//                 updateSettings("selectedFileIndex", index)
//                 updateSettings("pageFrom", 1)
//                 updateSettings("pageTo", totalPages)
//               }}
//               onRemove={removeFile}
//             />
//           </div>

//           <div
//             className={`grid gap-4 ${settings.pageMode === "facing"
//                 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
//                 : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
//               }`}
//           >
//             {settings.pageMode === "single"
//               ? filteredPages.map((page, index) => (
//                 <PDFPagePreview
//                   key={page.id}
//                   page={page}
//                   pageNumber={page.displayNumber}
//                   settings={settings}
//                   fileColor={FILE_COLORS[page.colorIndex]}
//                   isPasswordProtected={page.isPasswordProtected}
//                   shouldShowPageNumber={shouldShowPageNumber(index)}
//                 />
//               ))
//               : facingPagesPairs.map((pair, index) => (
//                 <FacingPagesPreview
//                   key={`pair-${index}`}
//                   leftPage={pair.leftPage}
//                   rightPage={pair.rightPage}
//                   settings={settings}
//                   shouldShowLeftNumber={
//                     pair.isCover ? false : shouldShowPageNumber(pair.leftPage ? pair.leftPage.pageNumber - 1 : -1)
//                   }
//                   shouldShowRightNumber={pair.rightPage ? shouldShowPageNumber(pair.rightPage.pageNumber - 1) : false}
//                 />
//               ))}
//           </div>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Page Number Options</h3>

//             {/* Page Mode */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-lg font-semibold text-gray-900">Page mode</h4>
//               </div>
//               <div className="flex gap-4">
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="pageMode"
//                     value="single"
//                     checked={settings.pageMode === "single"}
//                     onChange={(e) => updateSettings("pageMode", e.target.value)}
//                     className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-500 outline-none"
//                   />
//                   <span className="ml-2 text-sm text-gray-700">Single page</span>
//                 </label>
//                 <label className="flex items-center">
//                   <input
//                     type="radio"
//                     name="pageMode"
//                     value="facing"
//                     checked={settings.pageMode === "facing"}
//                     onChange={(e) => updateSettings("pageMode", e.target.value)}
//                     className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-500 outline-none"
//                   />
//                   <span className="ml-2 text-sm text-gray-700">Facing pages</span>
//                 </label>
//               </div>

//               {settings.pageMode === "facing" && (
//                 <div className="mt-3">
//                   <label className="flex items-center">
//                     <input
//                       type="checkbox"
//                       checked={settings.firstPageCover}
//                       onChange={(e) => updateSettings("firstPageCover", e.target.checked)}
//                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 accent-blue-500 outline-none"
//                     />
//                     <span className="ml-2 text-sm text-gray-700">First page is cover page</span>
//                   </label>
//                 </div>
//               )}
//             </div>

//             {/* Position and Margin */}
//             <div className="mb-6">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Position:</label>
//                   <PositionGrid
//                     selectedPosition={settings.position}
//                     onPositionChange={(position) => updateSettings("position", position)}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">Margin:</label>
//                   <div className="relative">
//                     <select
//                       value={settings.margin}
//                       onChange={(e) => updateSettings("margin", e.target.value)}
//                       className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
//                     >
//                       <option value="small">Small</option>
//                       <option value="medium">Recommended</option>
//                       <option value="big">Big</option>
//                     </select>
//                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Pages */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-3">Pages</label>

//               <div className="space-y-3">
//                 {/* Page number input with label on left */}
//                 <div className="flex items-center bg-white border border-gray-300 rounded-lg w-full">
//                   <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">
//                     First number:
//                   </span>
//                   <input
//                     type="number"
//                     value={settings.firstNumber}
//                     onChange={(e) => updateSettings("firstNumber", Number(e.target.value))}
//                     className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
//                     min="1"
//                   />
//                 </div>

//                 {/* Page range section */}
//                 <div className="mb-6">
//                   <label className="block text-xs text-gray-600 mb-1">Which pages do you want to number?</label>
//                   <div className="flex gap-2">
//                     <div className="flex items-center bg-white border border-gray-300 rounded-lg flex-1 min-w-0">
//                       <span className="px-2 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">
//                         From:
//                       </span>
//                       <input
//                         type="number"
//                         value={settings.pageFrom}
//                         onChange={(e) => updateSettings("pageFrom", Number(e.target.value))}
//                         className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
//                         min="1"
//                       />
//                     </div>
//                     <div className="flex items-center bg-white border border-gray-300 rounded-lg flex-1 min-w-0">
//                       <span className="px-2 py-2 text-sm text-gray-700 bg-gray-50 border-r whitespace-nowrap">To:</span>
//                       <input
//                         type="number"
//                         value={settings.pageTo}
//                         onChange={(e) => updateSettings("pageTo", Number(e.target.value))}
//                         className="flex-1 p-2 border-0 rounded-r-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-0 outline-none"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">Which pages do you want to number?</label>
//                   <div className="relative">
//                     <select
//                       value={settings.pageRange}
//                       onChange={(e) => updateSettings("pageRange", e.target.value)}
//                       className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
//                     >
//                       <option value="all">All pages from the beginning</option>
//                       <option value="exclude-first-1">Exclude the first page</option>
//                       <option value="exclude-first-2">Exclude the first 2 pages</option>
//                       <option value="exclude-first-3">Exclude the first 3 pages</option>
//                       <option value="exclude-last-1">Exclude the last page</option>
//                       <option value="exclude-last-2">Exclude the last 2 pages</option>
//                       <option value="exclude-last-3">Exclude the last 3 pages</option>
//                     </select>
//                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Text */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-3">Text:</label>
//               <div className="relative">
//                 <select
//                   value={settings.textFormat}
//                   onChange={(e) => updateSettings("textFormat", e.target.value)}
//                   className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none"
//                 >
//                   <option value="{n}">Insert only page number (recommended)</option>
//                   <option value="Page {n}">{"Page {n}"}</option>
//                   <option value="Page {n} of {p}">
//                     {"Page {n} of {p}"}
//                   </option>
//                   <option value="custom">Custom</option>
//                 </select>
//                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//               </div>

//               {settings.textFormat === "custom" && (
//                 <div className="mt-3">
//                   <label className="block text-xs text-gray-600 mb-1">Custom text:</label>
//                   <input
//                     type="text"
//                     value={settings.customText}
//                     onChange={(e) => updateSettings("customText", e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                     placeholder="Page {pageNumber} of {totalPages}"
//                   />
//                   <p className="text-xs text-gray-500 mt-1">
//                     Text samples: {"{pageNumber}"}, Page {"{pageNumber}"}, Page {"{pageNumber}"} of {"{totalPages}"}
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Text Format - Compact Controls */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-3">Text format:</label>

//               <div className="flex gap-1 flex-wrap">
//                 {/* Bold, Italic, Underline */}
//                 <CompactControlButton
//                   label="B"
//                   isActive={settings.bold}
//                   onClick={() => updateSettings("bold", !settings.bold)}
//                 />
//                 <CompactControlButton
//                   label="I"
//                   isActive={settings.italic}
//                   onClick={() => updateSettings("italic", !settings.italic)}
//                 />
//                 <CompactControlButton
//                   label="U"
//                   isActive={settings.underline}
//                   onClick={() => updateSettings("underline", !settings.underline)}
//                 />

//                 {/* Font Family */}
//                 <CompactControlButton icon={Type} label="Font" isActive={false}>
//                   <select
//                     value={settings.fontFamily}
//                     onChange={(e) => updateSettings("fontFamily", e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none"
//                     style={{ fontFamily: settings.fontFamily }}
//                   >
//                     <option value="Arial">Arial</option>
//                     <option value="Times New Roman">Times New Roman</option>
//                     <option value="Helvetica">Helvetica</option>
//                     <option value="Courier">Courier</option>
//                     <option value="Verdana">Verdana</option>
//                     <option value="Impact">Impact</option>
//                   </select>
//                 </CompactControlButton>

//                 {/* Font Size */}
//                 <CompactControlButton label="Size" isActive={false}>
//                   <div className="space-y-2">
//                     <div className="text-center text-sm">{settings.fontSize}px</div>
//                     <input
//                       type="range"
//                       min="8"
//                       max="72"
//                       value={settings.fontSize}
//                       onChange={(e) => updateSettings("fontSize", Number(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider outline-none"
//                     />
//                     <div className="flex gap-1">
//                       <button
//                         onClick={() => updateSettings("fontSize", Math.max(8, settings.fontSize - 1))}
//                         className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
//                       >
//                         <Minus className="w-3 h-3" />
//                       </button>
//                       <button
//                         onClick={() => updateSettings("fontSize", Math.min(72, settings.fontSize + 1))}
//                         className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
//                       >
//                         <Plus className="w-3 h-3" />
//                       </button>
//                     </div>
//                   </div>
//                 </CompactControlButton>

//                 {/* Font Color */}
//                 <CompactControlButton icon={Palette} label="Color" isActive={false}>
//                   <div className="space-y-2">
//                     <input
//                       type="color"
//                       value={settings.fontColor}
//                       onChange={(e) => updateSettings("fontColor", e.target.value)}
//                       className="w-full h-8 border border-gray-300 rounded cursor-pointer outline-none"
//                     />
//                     <div className="text-xs text-gray-600">{settings.fontColor}</div>
//                   </div>
//                 </CompactControlButton>

//                 {/* Background Color */}
//                 <CompactControlButton label="BG" isActive={settings.backgroundColor !== "transparent"}>
//                   <div className="space-y-2">
//                     <input
//                       type="color"
//                       value={settings.backgroundColor === "transparent" ? "#ffffff" : settings.backgroundColor}
//                       onChange={(e) => updateSettings("backgroundColor", e.target.value)}
//                       className="w-full h-8 border border-gray-300 rounded cursor-pointer outline-none"
//                       disabled={settings.backgroundColor === "transparent"}
//                     />
//                     <button
//                       onClick={() =>
//                         updateSettings(
//                           "backgroundColor",
//                           settings.backgroundColor === "transparent" ? "#ffffff" : "transparent",
//                         )
//                       }
//                       className="w-full px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
//                     >
//                       {settings.backgroundColor === "transparent" ? "Add Background" : "Remove Background"}
//                     </button>
//                   </div>
//                 </CompactControlButton>

//                 {/* Opacity */}
//                 <CompactControlButton label="Op" isActive={false}>
//                   <div className="space-y-2">
//                     <div className="text-center text-sm">{settings.opacity}%</div>
//                     <input
//                       type="range"
//                       min="0"
//                       max="100"
//                       value={settings.opacity}
//                       onChange={(e) => updateSettings("opacity", Number(e.target.value))}
//                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider outline-none"
//                     />
//                   </div>
//                 </CompactControlButton>
//               </div>
//             </div>

//             {/* Help text */}
//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 Configure page number position, style, and formatting. Preview shows how numbers will appear on your PDF
//                 pages.
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
//               onClick={handleAddPageNumbers}
//               disabled={pages.length === 0}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0
//                   ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Add Page Numbers
//               <ArrowRight className="w-5 h-5" />
//             </button>
//             {pages.length === 0 && <p className="text-xs text-gray-500 text-center mt-2">Add PDF files to continue</p>}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleAddPageNumbers}
//           disabled={pages.length === 0}
//           className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${pages.length > 0 ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
//             }`}
//         >
//           Add Page Numbers
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
//               <h3 className="text-xl font-bold text-gray-900">Page Number Options</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>

//             <div className="p-4">
//               {/* Mobile content - same as desktop sidebar content */}
//               <div className="space-y-6">
//                 {/* Same content structure as desktop but optimized for mobile */}
//                 <div className="text-center text-sm text-gray-500">Mobile settings panel - same options as desktop</div>
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
//         onSubmit={(passwords) => handlePasswordSubmit(passwords, settings)}
//       />
//     </div>
//   )
// }