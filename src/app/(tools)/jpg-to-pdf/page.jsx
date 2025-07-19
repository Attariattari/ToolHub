"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, X, ArrowRight, RotateCw, GripVertical, ChevronDown } from "lucide-react"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// Drag and Drop functionality
const DragDropContext = ({ children, onDragEnd }) => {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverItem(index)
  }

  const handleDragEnd = (e) => {
    e.preventDefault()
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      onDragEnd(draggedItem, dragOverItem)
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }

  return <div>{children({ handleDragStart, handleDragOver, handleDragEnd, draggedItem, dragOverItem })}</div>
}

// Memoized Image Preview Component
const ImagePreview = memo(
  ({
    file,
    index,
    onRemove,
    onRotate,
    rotation = 0,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    draggedItem,
    dragOverItem,
  }) => {
    const [imageUrl, setImageUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
      if (file.stableData?.dataUrl) {
        setImageUrl(file.stableData.dataUrl)
        setIsLoading(false)
      } else {
        // Create object URL for image preview
        const url = URL.createObjectURL(file.file)
        setImageUrl(url)
        setIsLoading(false)

        return () => {
          URL.revokeObjectURL(url)
        }
      }
    }, [file])

    const handleImageError = () => {
      setHasError(true)
      setIsLoading(false)
    }

    const isDragging = draggedItem === index
    const isDragOver = dragOverItem === index

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative cursor-move ${isDragging
            ? "opacity-50 scale-95 border-red-400"
            : isDragOver
              ? "border-red-400 shadow-lg scale-105"
              : "border-gray-200 hover:border-red-300 hover:shadow-lg"
          }`}
      >
        {/* Drag Handle */}
        <div className="absolute top-2 left-2 z-30 bg-white/90 rounded-full p-1 shadow-md">
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>

        {/* Image Preview Area */}
        <div className="relative h-56 p-3 pt-10">
          <div
            className="w-full h-full relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : hasError ? (
              <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
                <ImageIcon className="w-12 h-12 text-red-400 mb-2" />
                <div className="text-sm text-red-600 font-medium text-center">Could not load image</div>
              </div>
            ) : (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={handleImageError}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-1 right-2 flex gap-1 z-30">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRotate(file.id)
              }}
              className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
              title="Rotate image"
            >
              <RotateCw className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(file.id)
              }}
              className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
              title="Remove image"
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
            <p className="text-xs text-gray-500 mt-1">
              {file.size} • {file.type.split("/")[1]?.toUpperCase()}
              {rotation > 0 && <span className="ml-2 text-blue-600">↻ {rotation}°</span>}
            </p>
          </div>
        </div>
      </div>
    )
  },
)

ImagePreview.displayName = "ImagePreview"

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder }) => {
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

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-red-300 transition-colors duration-200"
      >
        <span className="text-gray-900 font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${value === option.value ? "bg-red-50 text-red-600 font-medium" : "text-gray-900"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function JPGToPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [fileRotations, setFileRotations] = useState({})

  // PDF Options
  const [pageOrientation, setPageOrientation] = useState("landscape") // "portrait" or "landscape"
  const [pageSize, setPageSize] = useState("fit") // "fit", "a4", "letter"
  const [margin, setMargin] = useState("none") // "none", "small", "big"
  const [mergeAllImages, setMergeAllImages] = useState(true)

  const fileDataCache = useRef({})
  const router = useRouter()

  // Page size options
  const pageSizeOptions = [
    { value: "fit", label: "Fit (Same page size as image)" },
    { value: "a4", label: "A4 (297x210 mm)" },
    { value: "letter", label: "US Letter (215x279.4 mm)" },
  ]

  // Supported image formats
  const supportedFormats = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".tif", ".svg"]

  // Optimized file data creation
  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) {
      return fileDataCache.current[id]
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const blob = new Blob([uint8Array], { type: file.type })
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

  // Handle file uploads
  const handleFiles = useCallback(
    async (newFiles) => {
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
    },
    [createStableFileData],
  )

  // Remove file with cleanup
  const removeFile = useCallback((id) => {
    const fileData = fileDataCache.current[id]
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }

    delete fileDataCache.current[id]
    setFiles((prev) => prev.filter((file) => file.id !== id))

    // Remove rotation data
    setFileRotations((prev) => {
      const newRotations = { ...prev }
      delete newRotations[id]
      return newRotations
    })
  }, [])

  // Rotate image
  const rotateImage = useCallback((id) => {
    setFileRotations((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 90) % 360,
    }))
  }, [])

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((draggedIndex, targetIndex) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      const draggedItem = newFiles[draggedIndex]
      newFiles.splice(draggedIndex, 1)
      newFiles.splice(targetIndex, 0, draggedItem)
      return newFiles
    })
  }, [])

  // Sort files
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

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()

      // Add files with their order and rotation
      files.forEach((file, index) => {
        formData.append("files", file.file)
        formData.append(`fileOrder_${index}`, index.toString())
        formData.append(`fileRotation_${index}`, (fileRotations[file.id] || 0).toString())
      })

      // Add PDF options
      formData.append("pageOrientation", pageOrientation)
      formData.append("pageSize", pageSize)
      formData.append("margin", margin)
      formData.append("mergeAllImages", mergeAllImages.toString())

      const response = await Api.post("/tools/jpg-to-pdf", formData, {
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
        toast.error("No converted files received from server")
      }
    } catch (error) {
      console.error("Convert error:", error)
      toast.error(error?.response?.data?.message || "Error converting images")
      alert("Failed to convert images to PDF. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }, [files, fileRotations, pageOrientation, pageSize, margin, mergeAllImages, router])

  // Memoized calculations
  const totalSize = useMemo(
    () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
    [files],
  )

  const SafeFileUploader = ({ whileTap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
        allowedTypes={supportedFormats}
        showFiles={false}
        uploadButtonText="Select image files"
        pageTitle="JPG to PDF"
        pageSubTitle="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
      />
    )
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="py-5 px-3 md:px-12 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Selected Images ({files.length})</h2>

            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={supportedFormats}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="JPG to PDF"
              pageSubTitle="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
            />
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            {({ handleDragStart, handleDragOver, handleDragEnd, draggedItem, dragOverItem }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <ImagePreview
                    key={file.id}
                    file={file}
                    index={index}
                    onRemove={removeFile}
                    onRotate={rotateImage}
                    rotation={fileRotations[file.id] || 0}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    draggedItem={draggedItem}
                    dragOverItem={dragOverItem}
                  />
                ))}
              </div>
            )}
          </DragDropContext>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Image to PDF options</h3>

            {/* Page Orientation */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Page orientation</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => setPageOrientation("portrait")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "portrait" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-10 border-2 rounded ${pageOrientation === "portrait" ? "border-red-500" : "border-gray-400"
                        }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${pageOrientation === "portrait" ? "text-red-600" : "text-gray-600"
                        }`}
                    >
                      Portrait
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setPageOrientation("landscape")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "landscape"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-8 border-2 rounded ${pageOrientation === "landscape" ? "border-red-500" : "border-gray-400"
                        }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${pageOrientation === "landscape" ? "text-red-600" : "text-gray-600"
                        }`}
                    >
                      Landscape
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Page Size */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Page size</h4>
              <CustomDropdown
                value={pageSize}
                onChange={setPageSize}
                options={pageSizeOptions}
                placeholder="Select page size"
              />
            </div>

            {/* Margin */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setMargin("none")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "none" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className={`w-6 h-6 ${margin === "none" ? "text-red-500" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${margin === "none" ? "text-red-600" : "text-gray-600"}`}>
                      No margin
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setMargin("small")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "small" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-6 h-6 border-2 border-dashed rounded ${margin === "small" ? "border-red-500" : "border-gray-400"
                        }`}
                    ></div>
                    <span className={`text-sm font-medium ${margin === "small" ? "text-red-600" : "text-gray-600"}`}>
                      Small
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setMargin("big")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "big" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-6 h-6 border-4 border-dashed rounded ${margin === "big" ? "border-red-500" : "border-gray-400"
                        }`}
                    ></div>
                    <span className={`text-sm font-medium ${margin === "big" ? "text-red-600" : "text-gray-600"}`}>
                      Big
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Merge Option */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={mergeAllImages}
                    onChange={(e) => setMergeAllImages(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${mergeAllImages ? "bg-green-500 border-green-500" : "border-gray-300"
                      }`}
                  >
                    {mergeAllImages && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 font-medium">Merge all images in one PDF file</span>
              </label>
            </div>
          </div>

          <div className="p-6 border-t">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Images selected:</span>
                <span className="font-semibold text-gray-900">{files.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total size:</span>
                <span className="font-semibold text-gray-900">{totalSize} MB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Page orientation:</span>
                <span className="font-semibold text-gray-900 capitalize">{pageOrientation}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Page size:</span>
                <span className="font-semibold text-gray-900">
                  {pageSizeOptions.find((opt) => opt.value === pageSize)?.label.split(" ")[0]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Output:</span>
                <span className="font-semibold text-gray-900">
                  {mergeAllImages ? "1 PDF file" : `${files.length} PDF files`}
                </span>
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
              Convert to PDF
              <ArrowRight className="w-5 h-5" />
            </button>

            {files.length === 0 && (
              <p className="text-xs text-gray-500 text-center mt-2">Select image files to convert</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleConvert}
          disabled={files.length === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 ? "bg-red-600 hover:bg-red-700" : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Convert to PDF
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Image to PDF options</h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              {/* Mobile Options - Same as desktop but in mobile layout */}
              <div className="space-y-6">
                {/* Page Orientation */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Page orientation</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPageOrientation("portrait")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "portrait"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-8 h-10 border-2 rounded ${pageOrientation === "portrait" ? "border-red-500" : "border-gray-400"
                            }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${pageOrientation === "portrait" ? "text-red-600" : "text-gray-600"
                            }`}
                        >
                          Portrait
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPageOrientation("landscape")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "landscape"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-10 h-8 border-2 rounded ${pageOrientation === "landscape" ? "border-red-500" : "border-gray-400"
                            }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${pageOrientation === "landscape" ? "text-red-600" : "text-gray-600"
                            }`}
                        >
                          Landscape
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Page Size */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Page size</h4>
                  <CustomDropdown
                    value={pageSize}
                    onChange={setPageSize}
                    options={pageSizeOptions}
                    placeholder="Select page size"
                  />
                </div>

                {/* Margin */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMargin("none")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "none" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className={`w-6 h-6 ${margin === "none" ? "text-red-500" : "text-gray-400"}`} />
                        <span className={`text-sm font-medium ${margin === "none" ? "text-red-600" : "text-gray-600"}`}>
                          No margin
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin("small")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "small" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-6 h-6 border-2 border-dashed rounded ${margin === "small" ? "border-red-500" : "border-gray-400"
                            }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${margin === "small" ? "text-red-600" : "text-gray-600"}`}
                        >
                          Small
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin("big")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === "big" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-6 h-6 border-4 border-dashed rounded ${margin === "big" ? "border-red-500" : "border-gray-400"
                            }`}
                        ></div>
                        <span className={`text-sm font-medium ${margin === "big" ? "text-red-600" : "text-gray-600"}`}>
                          Big
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Merge Option */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={mergeAllImages}
                        onChange={(e) => setMergeAllImages(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${mergeAllImages ? "bg-green-500 border-green-500" : "border-gray-300"
                          }`}
                      >
                        {mergeAllImages && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Merge all images in one PDF file</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
