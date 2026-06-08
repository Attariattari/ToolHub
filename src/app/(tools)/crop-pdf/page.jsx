"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Settings, X } from "lucide-react"
import { pdfjs } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"
import PDFViewer from "@/components/tools/PDFViewer"
import { FaFilePdf } from "react-icons/fa"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function CropPDFPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pdfPassword, setPdfPassword] = useState(null)
  const [passwordProtectedFileId, setPasswordProtectedFileId] = useState(null)

  const [cropAreas, setCropAreas] = useState(new Map())
  const [applyToAllPages, setApplyToAllPages] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [numPages, setNumPages] = useState(0)
  const [pdfHealthCheck, setPdfHealthCheck] = useState(true)
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 })

  const router = useRouter()

  const fileDataCache = useRef(new Map())
  const pdfDocumentCache = useRef(new Map())

  // Store page dimensions for accurate cropping
  const handlePageDimensionsChange = useCallback((width, height) => {
    setPageDimensions({ width, height })
  }, [])

  const setCropAreaForPage = useCallback(
    (pageNumber, crop) => {
      setCropAreas((prev) => {
        const newMap = new Map(prev)
        if (applyToAllPages) {
          // Apply crop to ALL pages when applyToAllPages is true
          for (let i = 1; i <= numPages; i++) {
            newMap.set(i, crop)
          }
        } else {
          // Apply only to specific page
          newMap.set(pageNumber, crop)
        }
        return newMap
      })
    },
    [applyToAllPages, numPages],
  )

  const checkPasswordProtection = useCallback(async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      try {
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "",
        })
        await loadingTask.promise
        return false
      } catch (pdfError) {
        if (
          pdfError.name === "PasswordException" ||
          pdfError.message?.includes("password") ||
          pdfError.message?.includes("encrypted")
        ) {
          return true
        }
        console.warn(`PDF load error for ${file.name}:`, pdfError)
        return false
      }
    } catch (error) {
      console.warn("Error checking password protection with PDF.js:", error)
      return false
    }
  }, [])

  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current.has(id)) {
        return fileDataCache.current.get(id)
      }
      try {
        const isPasswordProtected = await checkPasswordProtection(file)
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        let stableData
        if (isPasswordProtected) {
          stableData = {
            blob: new Blob([uint8Array], { type: file.type }),
            dataUrl: null,
            uint8Array: null,
            isPasswordProtected: true,
          }
        } else {
          const blob = new Blob([uint8Array], { type: file.type })
          const objectUrl = URL.createObjectURL(blob)
          stableData = {
            blob,
            dataUrl: objectUrl,
            uint8Array: uint8Array,
            isPasswordProtected: false,
          }
        }
        fileDataCache.current.set(id, stableData)
        return stableData
      } catch (error) {
        console.error("Error creating stable file data:", error)
        return null
      }
    },
    [checkPasswordProtection],
  )

  const handleFiles = useCallback(
    async (newFiles) => {
      if (newFiles.length === 0) return

      const file = newFiles[0]
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)

      const fileObject = {
        id,
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        type: file.type,
        stableData: null,
      }

      const stableData = await createStableFileData(file, id)
      if (stableData) {
        setSelectedFile({ ...fileObject, stableData })
        setPdfHealthCheck(true)
        setPdfPassword(null)
        if (stableData.isPasswordProtected) {
          setPasswordProtectedFileId(id)
          setShowPasswordModal(true)
        }
      } else {
        toast.error("Failed to process file.")
      }
    },
    [createStableFileData],
  )

  const handlePasswordSubmit = useCallback(
    async (passwords) => {
      if (!selectedFile || !passwordProtectedFileId) return

      const password = passwords[passwordProtectedFileId] || ""
      setPdfPassword(password)

      try {
        const arrayBuffer = await selectedFile.file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: password,
        })
        await loadingTask.promise

        const blob = new Blob([uint8Array], { type: selectedFile.file.type })
        const objectUrl = URL.createObjectURL(blob)

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array,
          isPasswordProtected: true,
        }
        setSelectedFile((prev) => (prev ? { ...prev, stableData } : null))
        fileDataCache.current.set(selectedFile.id, stableData)
        setPdfHealthCheck(true)
        setShowPasswordModal(false)
        toast.success("Password accepted. PDF loaded.")
      } catch (error) {
        console.error("Error loading PDF with password:", error)
        toast.error(error?.message || "Incorrect password or PDF error.")
        setPdfHealthCheck(false)
        setPdfPassword(null)
      }
    },
    [selectedFile, passwordProtectedFileId],
  )

  const removeFile = useCallback(() => {
    if (!selectedFile) return

    const fileData = fileDataCache.current.get(selectedFile.id)
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl)
    }
    fileDataCache.current.delete(selectedFile.id)
    if (pdfDocumentCache.current.has(selectedFile.id)) {
      try {
        const pdfDoc = pdfDocumentCache.current.get(selectedFile.id)
        if (pdfDoc && typeof pdfDoc.destroy === "function") {
          pdfDoc.destroy()
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e)
      }
      pdfDocumentCache.current.delete(selectedFile.id)
    }
    setSelectedFile(null)
    setCropAreas(new Map())
    setCurrentPage(1)
    setZoomLevel(100)
    setNumPages(0)
    setPdfHealthCheck(true)
    setPdfPassword(null)
    setPasswordProtectedFileId(null)
    setPageDimensions({ width: 0, height: 0 })
  }, [selectedFile])

  const onDocumentLoadSuccess = useCallback(
    (pdf, fileId) => {
      pdfDocumentCache.current.set(fileId, pdf)
      setNumPages(pdf.numPages)
      setPdfHealthCheck(true)
    },
    [],
  )

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)
    setPdfHealthCheck(false)
    setNumPages(0)
    toast.error("Failed to load PDF. It might be corrupted or password protected.")
  }, [])

  const handleCrop = useCallback(async () => {
    if (!selectedFile || !selectedFile.stableData || !selectedFile.stableData.uint8Array) {
      toast.error("No file selected or file data not available.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile.file)

      const cropDataToSend = {}
      if (applyToAllPages) {
        const crop = cropAreas.get(1) // Use the crop from the first page for all
        if (crop) {
          for (let i = 1; i <= numPages; i++) {
            cropDataToSend[i] = crop
          }
        }
      } else {
        cropAreas.forEach((crop, pageNum) => {
          cropDataToSend[pageNum] = crop
        })
      }

      if (Object.keys(cropDataToSend).length === 0) {
        toast.error("No crop area defined.")
        setIsUploading(false)
        return
      }

      formData.append("cropAreas", JSON.stringify(cropDataToSend))
      formData.append("applyToAllPages", String(applyToAllPages))

      // Send page dimensions for accurate cropping
      formData.append("pageDimensions", JSON.stringify(pageDimensions))

      if (pdfPassword) {
        formData.append("password", pdfPassword)
      }

      const response = await Api.post("/tools/crop-pdf", formData, {
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
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=crop-pdf`
        router.push(downloadUrl)
      } else {
        toast.error("No cropped files received from server")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error cropping PDF")
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, applyToAllPages, cropAreas, numPages, pdfPassword, pageDimensions, router])

  const totalSize = useMemo(() => (selectedFile ? selectedFile.size : "0.00 MB"), [selectedFile])

  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  const hasCropArea = useMemo(() => {
    if (cropAreas.size === 0) return false
    if (applyToAllPages) {
      return cropAreas.size > 0 // Any crop exists
    } else {
      return cropAreas.has(currentPage) // Current page has crop
    }
  }, [cropAreas, applyToAllPages, currentPage])

  useEffect(() => {
    return () => {
      fileDataCache.current.forEach((data) => {
        if (data && data.dataUrl && data.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(data.dataUrl)
        }
      })
      pdfDocumentCache.current.forEach((pdfDoc) => {
        if (pdfDoc && typeof pdfDoc.destroy === "function") {
          pdfDoc.destroy()
        }
      })
    }
  }, [])

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />
  }

  if (!selectedFile) {
    return (
      <SafeFileUploader
        isMultiple={false}
        onFilesSelect={handleFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF file"
        pageTitle="Crop PDF"
        pageSubTitle="Select an area to crop your PDF. Apply to all pages or just the current one!"
      />
    )
  }

  return (
    <div className="h-full flex">
      <div className="grid grid-cols-1 md:grid-cols-10 border w-full">
        <div className="p-4 md:col-span-7 bg-gray-100 relative flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex-grow flex flex-col items-center p-2">
            <PDFViewer
              fileUrl={selectedFile.stableData?.dataUrl}
              fileId={selectedFile.id}
              cropAreas={cropAreas}
              setCropAreaForPage={setCropAreaForPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              numPages={numPages}
              setNumPages={setNumPages}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              onDocumentLoadError={onDocumentLoadError}
              isPasswordProtected={selectedFile.stableData?.isPasswordProtected || false}
              password={pdfPassword}
              applyToAllPages={applyToAllPages}
              onPageDimensionsChange={handlePageDimensionsChange}
            />
          </div>
          {/* Simplified mobile controls */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-2 flex items-center justify-center gap-2 shadow-lg z-20">
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = Math.min(numPages, Math.max(1, Number(e.target.value)))
                setCurrentPage(page)
              }}
              className="flex h-9 w-14 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
            />
            <span className="text-gray-600">/ {numPages}</span>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
              onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
              onClick={() => setZoomLevel((prev) => Math.max(10, prev - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-14 text-center font-medium text-sm">{zoomLevel}%</span>
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
              onClick={() => setZoomLevel((prev) => Math.min(400, prev + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex md:col-span-3 border-l flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Crop PDF</h3>

            <div className="flex items-center justify-between mb-6 px-3 py-2 bg-red-100 border border-red-500 rounded-sm">
              <div className="flex items-center gap-2">
                <FaFilePdf className="text-red-500" size={25} />
                <div>
                  <p className="text-red-900 font-semibold -mb-1">
                    {selectedFile.name}
                  </p>
                  <span className="text-sm">{numPages} pages</span>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-1 bg-white rounded-full flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                Click and drag to select the area you want to keep. Resize if needed.
              </p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Pages:</h4>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="all-pages"
                    name="apply-to-pages"
                    value="all"
                    checked={applyToAllPages}
                    onChange={() => setApplyToAllPages(true)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 accent-red-500"
                  />
                  <label htmlFor="all-pages" className="text-sm font-medium text-gray-700">
                    All pages
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="current-page"
                    name="apply-to-pages"
                    value="current"
                    checked={!applyToAllPages}
                    onChange={() => setApplyToAllPages(false)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 accent-red-500 bg-white"
                  />
                  <label htmlFor="current-page" className="text-sm font-medium text-gray-700">
                    Current page
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (applyToAllPages) {
                  setCropAreas(new Map()) // Clear all crops
                } else {
                  setCropAreas((prev) => {
                    const newMap = new Map(prev)
                    newMap.delete(currentPage) // Delete crop for current page only
                    return newMap
                  })
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium mb-6"
            >
              Reset current crop
            </button>

            <div className="pt-4 border-t">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">File selected:</span>
                  <span className="font-semibold text-gray-900">{selectedFile.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total size:</span>
                  <span className="font-semibold text-gray-900">{totalSize}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total pages:</span>
                  <span className="font-semibold text-gray-900">{numPages}</span>
                </div>
                {selectedFile.stableData?.isPasswordProtected && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password protected:</span>
                    <span className="font-semibold text-yellow-600">Yes</span>
                  </div>
                )}
                {!pdfHealthCheck && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Preview issue:</span>
                    <span className="font-semibold text-yellow-600">Yes</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCrop}
                disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  }`}
              >
                Crop PDF
                <ArrowRight className="w-5 h-5" />
              </button>
              {!selectedFile && <p className="text-xs text-gray-500 text-center mt-2">Select a PDF file to crop</p>}
            </div>
          </div>
        </div>

        {/* Mobile bottom action bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
          <button
            onClick={handleCrop}
            disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
              }`}
          >
            Crop PDF
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              toast.info("Use page controls above the PDF to adjust settings.")
            }}
            className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false)
            removeFile()
          }}
          passwordProtectedFiles={selectedFile ? [{ id: selectedFile.id, name: selectedFile.name }] : []}
          onSubmit={handlePasswordSubmit}
        />
      </div>
    </div>
  )
}

// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo } from "react"
// import { useRouter } from "next/navigation"
// import { ArrowRight, ZoomIn, ZoomOut, Maximize, Minimize, ChevronUp, ChevronDown, Settings, X } from "lucide-react"
// import { pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"
// import PDFViewer from "@/components/tools/PDFViewer"
// import { FaFilePdf } from "react-icons/fa"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// export default function CropPDFPage() {
//   const [selectedFile, setSelectedFile] = useState(null)
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [pdfPassword, setPdfPassword] = useState(null)
//   const [passwordProtectedFileId, setPasswordProtectedFileId] = useState(null)

//   const [cropAreas, setCropAreas] = useState(new Map())
//   const [applyToAllPages, setApplyToAllPages] = useState(true)
//   const [currentPage, setCurrentPage] = useState(1)
//   const [zoomLevel, setZoomLevel] = useState(100)
//   const [numPages, setNumPages] = useState(0)
//   const [pdfHealthCheck, setPdfHealthCheck] = useState(true)

//   const router = useRouter()

//   const fileDataCache = useRef(new Map())
//   const pdfDocumentCache = useRef(new Map())

//   // FIXED: setCropAreaForPage function
//   const setCropAreaForPage = useCallback(
//     (pageNumber, crop) => {
//       setCropAreas((prev) => {
//         const newMap = new Map(prev)
//         if (applyToAllPages) {
//           // Apply crop to ALL pages when applyToAllPages is true
//           for (let i = 1; i <= numPages; i++) {
//             newMap.set(i, crop)
//           }
//         } else {
//           // Apply only to specific page
//           newMap.set(pageNumber, crop)
//         }
//         return newMap
//       })
//     },
//     [applyToAllPages, numPages], // Added numPages dependency
//   )

//   const checkPasswordProtection = useCallback(async (file) => {
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
//           pdfError.message?.includes("password") ||
//           pdfError.message?.includes("encrypted")
//         ) {
//           return true
//         }
//         console.warn(`PDF load error for ${file.name}:`, pdfError)
//         return false
//       }
//     } catch (error) {
//       console.warn("Error checking password protection with PDF.js:", error)
//       return false
//     }
//   }, [])

//   const createStableFileData = useCallback(
//     async (file, id) => {
//       if (fileDataCache.current.has(id)) {
//         return fileDataCache.current.get(id)
//       }
//       try {
//         const isPasswordProtected = await checkPasswordProtection(file)
//         const arrayBuffer = await file.arrayBuffer()
//         const uint8Array = new Uint8Array(arrayBuffer)

//         let stableData
//         if (isPasswordProtected) {
//           stableData = {
//             blob: new Blob([uint8Array], { type: file.type }),
//             dataUrl: null,
//             uint8Array: null,
//             isPasswordProtected: true,
//           }
//         } else {
//           const blob = new Blob([uint8Array], { type: file.type })
//           const objectUrl = URL.createObjectURL(blob)
//           stableData = {
//             blob,
//             dataUrl: objectUrl,
//             uint8Array: uint8Array,
//             isPasswordProtected: false,
//           }
//         }
//         fileDataCache.current.set(id, stableData)
//         return stableData
//       } catch (error) {
//         console.error("Error creating stable file data:", error)
//         return null
//       }
//     },
//     [checkPasswordProtection],
//   )

//   const handleFiles = useCallback(
//     async (newFiles) => {
//       if (newFiles.length === 0) return

//       const file = newFiles[0]
//       const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)

//       const fileObject = {
//         id,
//         file,
//         name: file.name,
//         size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//         type: file.type,
//         stableData: null,
//       }

//       const stableData = await createStableFileData(file, id)
//       if (stableData) {
//         setSelectedFile({ ...fileObject, stableData })
//         setPdfHealthCheck(true)
//         setPdfPassword(null)
//         if (stableData.isPasswordProtected) {
//           setPasswordProtectedFileId(id)
//           setShowPasswordModal(true)
//         }
//       } else {
//         toast.error("Failed to process file.")
//       }
//     },
//     [createStableFileData],
//   )

//   const handlePasswordSubmit = useCallback(
//     async (passwords) => {
//       if (!selectedFile || !passwordProtectedFileId) return

//       const password = passwords[passwordProtectedFileId] || ""
//       setPdfPassword(password)

//       try {
//         const arrayBuffer = await selectedFile.file.arrayBuffer()
//         const uint8Array = new Uint8Array(arrayBuffer)

//         const loadingTask = pdfjs.getDocument({
//           data: uint8Array,
//           password: password,
//         })
//         await loadingTask.promise

//         const blob = new Blob([uint8Array], { type: selectedFile.file.type })
//         const objectUrl = URL.createObjectURL(blob)

//         const stableData = {
//           blob,
//           dataUrl: objectUrl,
//           uint8Array: uint8Array,
//           isPasswordProtected: true,
//         }
//         setSelectedFile((prev) => (prev ? { ...prev, stableData } : null))
//         fileDataCache.current.set(selectedFile.id, stableData)
//         setPdfHealthCheck(true)
//         setShowPasswordModal(false)
//         toast.success("Password accepted. PDF loaded.")
//       } catch (error) {
//         console.error("Error loading PDF with password:", error)
//         toast.error(error?.message || "Incorrect password or PDF error.")
//         setPdfHealthCheck(false)
//         setPdfPassword(null)
//       }
//     },
//     [selectedFile, passwordProtectedFileId],
//   )

//   const removeFile = useCallback(() => {
//     if (!selectedFile) return

//     const fileData = fileDataCache.current.get(selectedFile.id)
//     if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(fileData.dataUrl)
//     }
//     fileDataCache.current.delete(selectedFile.id)
//     if (pdfDocumentCache.current.has(selectedFile.id)) {
//       try {
//         const pdfDoc = pdfDocumentCache.current.get(selectedFile.id)
//         if (pdfDoc && typeof pdfDoc.destroy === "function") {
//           pdfDoc.destroy()
//         }
//       } catch (e) {
//         console.warn("PDF cleanup warning:", e)
//       }
//       pdfDocumentCache.current.delete(selectedFile.id)
//     }
//     setSelectedFile(null)
//     setCropAreas(new Map())
//     setCurrentPage(1)
//     setZoomLevel(100)
//     setNumPages(0)
//     setPdfHealthCheck(true)
//     setPdfPassword(null)
//     setPasswordProtectedFileId(null)
//   }, [selectedFile])

//   const onDocumentLoadSuccess = useCallback(
//     (pdf, fileId) => {
//       pdfDocumentCache.current.set(fileId, pdf)
//       setNumPages(pdf.numPages)
//       setPdfHealthCheck(true)
//     },
//     [],
//   )

//   const onDocumentLoadError = useCallback((error, fileId) => {
//     console.warn(`PDF load error for file ${fileId}:`, error)
//     setPdfHealthCheck(false)
//     setNumPages(0)
//     toast.error("Failed to load PDF. It might be corrupted or password protected.")
//   }, [])

//   const handleCrop = useCallback(async () => {
//     if (!selectedFile || !selectedFile.stableData || !selectedFile.stableData.uint8Array) {
//       toast.error("No file selected or file data not available.")
//       return
//     }

//     setIsUploading(true)
//     setUploadProgress(0)

//     try {
//       const formData = new FormData()
//       formData.append("file", selectedFile.file)

//       const cropDataToSend = {}
//       if (applyToAllPages) {
//         const crop = cropAreas.get(1) // Use the crop from the first page for all
//         if (crop) {
//           for (let i = 1; i <= numPages; i++) {
//             cropDataToSend[i] = crop
//           }
//         }
//       } else {
//         cropAreas.forEach((crop, pageNum) => {
//           cropDataToSend[pageNum] = crop
//         })
//       }

//       if (Object.keys(cropDataToSend).length === 0) {
//         toast.error("No crop area defined.")
//         setIsUploading(false)
//         return
//       }

//       formData.append("cropAreas", JSON.stringify(cropDataToSend))
//       formData.append("applyToAllPages", String(applyToAllPages))

//       if (pdfPassword) {
//         formData.append("password", pdfPassword)
//       }

//       const response = await Api.post("/tools/crop-pdf", formData, {
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
//         const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=crop-pdf`
//         router.push(downloadUrl)
//       } else {
//         toast.error("No cropped files received from server")
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Error cropping PDF")
//     } finally {
//       setIsUploading(false)
//     }
//   }, [selectedFile, applyToAllPages, cropAreas, numPages, pdfPassword, router])

//   const totalSize = useMemo(() => (selectedFile ? selectedFile.size : "0.00 MB"), [selectedFile])

//   const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
//     return <FileUploader {...safeProps} />
//   }

//   // FIXED: Better crop validation for button enable/disable
//   const hasCropArea = useMemo(() => {
//     if (cropAreas.size === 0) return false
//     if (applyToAllPages) {
//       return cropAreas.size > 0 // Any crop exists
//     } else {
//       return cropAreas.has(currentPage) // Current page has crop
//     }
//   }, [cropAreas, applyToAllPages, currentPage])

//   useEffect(() => {
//     return () => {
//       fileDataCache.current.forEach((data) => {
//         if (data && data.dataUrl && data.dataUrl.startsWith("blob:")) {
//           URL.revokeObjectURL(data.dataUrl)
//         }
//       })
//       pdfDocumentCache.current.forEach((pdfDoc) => {
//         if (pdfDoc && typeof pdfDoc.destroy === "function") {
//           pdfDoc.destroy()
//         }
//       })
//     }
//   }, [])

//   if (isUploading) {
//     return <ProgressScreen uploadProgress={uploadProgress} />
//   }

//   if (!selectedFile) {
//     return (
//       <SafeFileUploader
//         isMultiple={false}
//         onFilesSelect={handleFiles}
//         isDragOver={isDragOver}
//         setIsDragOver={setIsDragOver}
//         allowedTypes={[".pdf"]}
//         showFiles={false}
//         uploadButtonText="Select PDF file"
//         pageTitle="Crop PDF"
//         pageSubTitle="Select an area to crop your PDF. Apply to all pages or just the current one!"
//       />
//     )
//   }

//   return (
//     <div className="h-full flex">
//       <div className="grid grid-cols-1 md:grid-cols-10 border w-full">
//         <div className="p-4 md:col-span-7 bg-gray-100 relative flex flex-col overflow-y-auto custom-scrollbar">
//           <div className="flex-grow flex flex-col items-center">
//             <PDFViewer
//               fileUrl={selectedFile.stableData?.dataUrl}
//               fileId={selectedFile.id}
//               cropAreas={cropAreas}
//               setCropAreaForPage={setCropAreaForPage}
//               currentPage={currentPage}
//               setCurrentPage={setCurrentPage}
//               zoomLevel={zoomLevel}
//               setZoomLevel={setZoomLevel}
//               numPages={numPages}
//               setNumPages={setNumPages}
//               onDocumentLoadSuccess={onDocumentLoadSuccess}
//               onDocumentLoadError={onDocumentLoadError}
//               isPasswordProtected={selectedFile.stableData?.isPasswordProtected || false}
//               password={pdfPassword}
//               applyToAllPages={applyToAllPages}
//             />
//           </div>
//           <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-2 flex items-center justify-center gap-2 shadow-lg z-20">
//             <button
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
//               onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//               disabled={currentPage <= 1}
//             >
//               <ChevronUp className="h-4 w-4" />
//             </button>
//             <input
//               type="number"
//               value={currentPage}
//               onChange={(e) => {
//                 const page = Math.min(numPages, Math.max(1, Number(e.target.value)))
//                 setCurrentPage(page)
//               }}
//               className="flex h-9 w-14 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
//             />
//             <span className="text-gray-600">/ {numPages}</span>
//             <button
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
//               onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
//               disabled={currentPage >= numPages}
//             >
//               <ChevronDown className="h-4 w-4" />
//             </button>
//             <div className="h-6 w-px bg-gray-200 mx-1" />
//             <button
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
//               onClick={() => setZoomLevel((prev) => Math.max(10, prev - 10))}
//             >
//               <ZoomOut className="h-4 w-4" />
//             </button>
//             <span className="w-14 text-center font-medium text-sm">{zoomLevel}%</span>
//             <button
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
//               onClick={() => setZoomLevel((prev) => Math.min(400, prev + 10))}
//             >
//               <ZoomIn className="h-4 w-4" />
//             </button>
//             <input
//               type="range"
//               value={zoomLevel}
//               onChange={(e) => setZoomLevel(Number(e.target.value))}
//               min={10}
//               max={400}
//               step={10}
//               className="w-24 mx-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
//             />
//             <button
//               className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9"
//               onClick={() => setZoomLevel(100)}
//             >
//               <Maximize className="h-4 w-4" />
//             </button>
//             <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
//               <Minimize className="h-4 w-4" />
//             </button>
//             <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
//               <Settings className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//         <div className="hidden md:flex md:col-span-3 border-l flex-col justify-between overflow-y-auto custom-scrollbar">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Crop PDF</h3>

//             <div className="flex items-center justify-between mb-6 px-3 py-2 bg-red-100 border border-red-500 rounded-sm">
//               <div className="flex items-center gap-2">
//                 <FaFilePdf className="text-red-500" size={25} />
//                 <div>
//                   <p className="text-red-900 font-semibold -mb-1">
//                     {selectedFile.name}
//                   </p>
//                   <span className="text-sm">{numPages} pages</span>
//                 </div>
//               </div>
//               <button
//                 onClick={removeFile}
//                 className="p-1 bg-white rounded-full flex justify-center items-center"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 Click and drag to select the area you want to keep. Resize if needed.
//               </p>
//             </div>

//             <div className="mb-6">
//               <h4 className="text-lg font-semibold text-gray-900 mb-3">Pages:</h4>
//               <div className="flex gap-4">
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="all-pages"
//                     name="apply-to-pages"
//                     value="all"
//                     checked={applyToAllPages}
//                     onChange={() => setApplyToAllPages(true)}
//                     className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 accent-red-500"
//                   />
//                   <label htmlFor="all-pages" className="text-sm font-medium text-gray-700">
//                     All pages
//                   </label>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="current-page"
//                     name="apply-to-pages"
//                     value="current"
//                     checked={!applyToAllPages}
//                     onChange={() => setApplyToAllPages(false)}
//                     className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 accent-red-500 bg-white"
//                   />
//                   <label htmlFor="current-page" className="text-sm font-medium text-gray-700">
//                     Current page
//                   </label>
//                 </div>
//               </div>
//             </div>

//             <button
//               onClick={() => {
//                 // FIXED: Reset crop logic
//                 if (applyToAllPages) {
//                   setCropAreas(new Map()) // Clear all crops
//                 } else {
//                   setCropAreas((prev) => {
//                     const newMap = new Map(prev)
//                     newMap.delete(currentPage) // Delete crop for current page only
//                     return newMap
//                   })
//                 }
//               }}
//               className="text-red-600 hover:text-red-800 text-sm font-medium mb-6"
//             >
//               Reset current crop
//             </button>

//             <div className="pt-4 border-t">
//               <div className="space-y-4 mb-6">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">File selected:</span>
//                   <span className="font-semibold text-gray-900">{selectedFile.name}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Total size:</span>
//                   <span className="font-semibold text-gray-900">{totalSize}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Total pages:</span>
//                   <span className="font-semibold text-gray-900">{numPages}</span>
//                 </div>
//                 {selectedFile.stableData?.isPasswordProtected && (
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Password protected:</span>
//                     <span className="font-semibold text-yellow-600">Yes</span>
//                   </div>
//                 )}
//                 {!pdfHealthCheck && (
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Preview issue:</span>
//                     <span className="font-semibold text-yellow-600">Yes</span>
//                   </div>
//                 )}
//               </div>
//               <button
//                 onClick={handleCrop}
//                 disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea}
//                 className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea
//                   ? "bg-gray-300 cursor-not-allowed"
//                   : "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                   }`}
//               >
//                 Crop PDF
//                 <ArrowRight className="w-5 h-5" />
//               </button>
//               {!selectedFile && <p className="text-xs text-gray-500 text-center mt-2">Select a PDF file to crop</p>}
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleCrop}
//           disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea}
//           className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || !hasCropArea
//             ? "bg-gray-300 cursor-not-allowed"
//             : "bg-red-600 hover:bg-red-700"
//             }`}
//         >
//           Crop PDF
//           <ArrowRight className="w-4 h-4" />
//         </button>
//         <button
//           onClick={() => {
//             toast.info("Mobile sidebar for settings not implemented yet.")
//           }}
//           className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
//         >
//           <Settings className="w-5 h-5 text-gray-600" />
//         </button>
//       </div>
//       <PasswordModal
//         isOpen={showPasswordModal}
//         onClose={() => {
//           setShowPasswordModal(false)
//           removeFile()
//         }}
//         passwordProtectedFiles={selectedFile ? [{ id: selectedFile.id, name: selectedFile.name }] : []}
//         onSubmit={handlePasswordSubmit}
//       />
//     </div>
//   )
// }