"use client"

import { useMemo } from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronRight, Mail, Phone, CreditCard, FileText, User, RefreshCw, Menu } from "lucide-react"
import { pdfjs, Document, Page } from "react-pdf"
import ProgressScreen from "@/components/tools/ProgressScreen"
import FileUploader from "@/components/tools/FileUploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"
import PasswordModal from "@/components/tools/PasswordModal"
import PDFRedactViewer from "@/components/tools/PDFRedactViewer"
import MarkPagesModal from "@/components/tools/MarkPagesModal"
import { FaFilePdf } from "react-icons/fa"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const SEARCH_TYPES = [
  { id: "text", label: "Text", icon: FileText, description: "Search for specific text" },
  { id: "email", label: "Email", icon: Mail, description: "Find email addresses" },
  { id: "phone", label: "Phone", icon: Phone, description: "Find phone numbers" },
  { id: "credit-card", label: "Card", icon: CreditCard, description: "Find credit card numbers" },
  { id: "ssn", label: "SSN", icon: User, description: "Find social security numbers" },
]

export default function RedactPDFPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pdfPassword, setPdfPassword] = useState(null)
  const [passwordProtectedFileId, setPasswordProtectedFileId] = useState(null)
  const [redactionItems, setRedactionItems] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [numPages, setNumPages] = useState(0)
  const [pdfHealthCheck, setPdfHealthCheck] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showMarkPagesModal, setShowMarkPagesModal] = useState(false)
  const [showSearchOptions, setShowSearchOptions] = useState(false)
  const [selectedSearchTypes, setSelectedSearchTypes] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [selectedFoundItems, setSelectedFoundItems] = useState([])
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isManualMarkMode, setIsManualMarkMode] = useState(false)
  const router = useRouter()

  const fileDataCache = useRef(new Map())
  const pdfDocumentCache = useRef(new Map())
  const searchInputRef = useRef(null)

  // Memoize the document options
  const documentOptions = useMemo(
    () => ({
      cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      password: pdfPassword || undefined,
    }),
    [pdfPassword],
  )

  // Check password protection
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

  // Create stable file data
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

  // Handle file selection
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
        setRedactionItems([])
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

  // Handle password submission
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

  // Remove file
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
    setRedactionItems([])
    setCurrentPage(1)
    setZoomLevel(100)
    setNumPages(0)
    setPdfHealthCheck(true)
    setPdfPassword(null)
    setPasswordProtectedFileId(null)
    setSearchText("")
    setSearchResults([])
    setShowSearchOptions(false)
    setSelectedSearchTypes([])
    setFoundItems([])
    setSelectedFoundItems([])
    setIsManualMarkMode(false)
  }, [selectedFile])

  // PDF load handlers
  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    pdfDocumentCache.current.set(fileId, pdf)
    setNumPages(pdf.numPages)
    setPdfHealthCheck(true)
  }, [])

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)
    setPdfHealthCheck(false)
    setNumPages(0)
    toast.error("Failed to load PDF. It might be corrupted or password protected.")
  }, [])

  // Add redaction item
  const addRedactionItem = useCallback((item) => {
    setRedactionItems((prev) => [...prev, { ...item, id: Date.now() + Math.random() }])
  }, [])

  // Remove redaction item
  const removeRedactionItem = useCallback((itemId) => {
    setRedactionItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  // Clear all redactions
  const clearAllRedactions = useCallback(() => {
    setRedactionItems([])
    setSelectedFoundItems([])
  }, [])

  // Handle text search
  const handleTextSearch = useCallback(async () => {
    if (!searchText.trim() || !selectedFile?.stableData?.uint8Array) return

    try {
      const pdf = pdfDocumentCache.current.get(selectedFile.id)
      if (!pdf) return

      const allResults = []
      const pattern = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")

      // Search through all pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map((item) => item.str).join(" ")

          let match
          while ((match = pattern.exec(pageText)) !== null) {
            const matchText = match[0]
            const matchIndex = match.index

            allResults.push({
              id: `text-${pageNum}-${matchIndex}`,
              type: "text",
              typeLabel: "Text",
              page: pageNum,
              text: matchText,
              x: 100 + (matchIndex % 10) * 20,
              y: 200 + Math.floor(matchIndex / 100) * 25,
              width: matchText.length * 8,
              height: 20,
            })
          }
        } catch (pageError) {
          console.warn(`Error processing page ${pageNum}:`, pageError)
        }
      }

      // Add text type to selected types if not already there
      const textType = SEARCH_TYPES.find((type) => type.id === "text")
      if (!selectedSearchTypes.some((type) => type.id === "text")) {
        setSelectedSearchTypes((prev) => [...prev, textType])
      }

      setFoundItems((prev) => [...prev.filter((item) => item.type !== "text"), ...allResults])
      setSearchResults((prev) => [...prev.filter((item) => item.type !== "text"), ...allResults])

      // Auto-select all found items
      setSelectedFoundItems((prev) => [...prev.filter((item) => item.type !== "text"), ...allResults])

      if (allResults.length > 0) {
        toast.success(`Found ${allResults.length} text matches`)
      } else {
        toast.info("No text matches found")
      }
    } catch (error) {
      console.error("Text search failed:", error)
      toast.error("Text search failed")
    }
  }, [searchText, selectedFile, numPages, selectedSearchTypes])

  // Updated handleSearchTypeSelect to auto-search and auto-select
  const handleSearchTypeSelect = useCallback(
    async (searchType) => {
      const isAlreadySelected = selectedSearchTypes.some((type) => type.id === searchType.id)

      if (isAlreadySelected) {
        // Remove the type and its results
        setSelectedSearchTypes((prev) => prev.filter((type) => type.id !== searchType.id))
        setFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
        setSelectedFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
        setSearchResults((prev) => prev.filter((item) => item.type !== searchType.id))
        return
      }

      // Add the type
      setSelectedSearchTypes((prev) => [...prev, searchType])

      // Auto-search for this type
      if (!selectedFile?.stableData?.uint8Array) return

      try {
        const pdf = pdfDocumentCache.current.get(selectedFile.id)
        if (!pdf) return

        const allResults = []

        // Define regex patterns for different types
        const patterns = {
          email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          // phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
          phone: /\b\+?\d{9,14}\b/g,
          // phone: /\b(?:\+?1[-.\s]?)?$$?([0-9]{3})$$?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
          "credit-card": /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
          ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
        }

        const pattern = patterns[searchType.id]
        if (!pattern) return

        // Search through all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item) => item.str).join(" ")

            let match
            while ((match = pattern.exec(pageText)) !== null) {
              const matchText = match[0]
              const matchIndex = match.index

              allResults.push({
                id: `${searchType.id}-${pageNum}-${matchIndex}`,
                type: searchType.id,
                typeLabel: searchType.label,
                page: pageNum,
                text: matchText,
                x: 100 + (matchIndex % 10) * 20,
                y: 200 + Math.floor(matchIndex / 100) * 25,
                width: matchText.length * 8,
                height: 20,
              })
            }
          } catch (pageError) {
            console.warn(`Error processing page ${pageNum}:`, pageError)
          }
        }

        setFoundItems((prev) => [...prev.filter((item) => item.type !== searchType.id), ...allResults])
        setSearchResults((prev) => [...prev.filter((item) => item.type !== searchType.id), ...allResults])

        // Auto-select all found items
        setSelectedFoundItems((prev) => [...prev.filter((item) => item.type !== searchType.id), ...allResults])

        if (allResults.length > 0) {
          toast.success(`Found ${allResults.length} ${searchType.label.toLowerCase()} items`)
        } else {
          toast.info(`No ${searchType.label.toLowerCase()} items found`)
        }
      } catch (error) {
        console.error("Search failed:", error)
        toast.error("Search failed")
      }
    },
    [selectedSearchTypes, selectedFile, numPages],
  )

  // Handle found item selection
  const handleFoundItemToggle = useCallback((item) => {
    setSelectedFoundItems((prev) => {
      const exists = prev.find((selected) => selected.id === item.id)
      if (exists) {
        return prev.filter((selected) => selected.id !== item.id)
      } else {
        return [...prev, item]
      }
    })
  }, [])

  // Apply selected items for redaction
  const handleApplyRedaction = useCallback(() => {
    selectedFoundItems.forEach((item) => {
      addRedactionItem({
        type: item.type,
        page: item.page,
        text: item.text,
        coordinates: { x: item.x, y: item.y, width: item.width, height: item.height },
      })
    })

    toast.success(`Added ${selectedFoundItems.length} items for redaction`)
    setSelectedFoundItems([])
  }, [selectedFoundItems, addRedactionItem])

  // Handle page selection for redaction
  const handlePageSelection = useCallback(
    (pageSelection) => {
      const { type, pages, customPages } = pageSelection
      let pagesToRedact = []

      switch (type) {
        case "current":
          pagesToRedact = [currentPage]
          break
        case "all":
          pagesToRedact = Array.from({ length: numPages }, (_, i) => i + 1)
          break
        case "odd":
          pagesToRedact = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 1)
          break
        case "even":
          pagesToRedact = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0)
          break
        case "custom":
          pagesToRedact = customPages
          break
      }

      pagesToRedact.forEach((page) => {
        addRedactionItem({
          type: "page",
          page: page,
          text: `Page ${page}`,
          coordinates: { x: 0, y: 0, width: "100%", height: "100%" },
        })
      })

      setShowMarkPagesModal(false)
      toast.success(`Added ${pagesToRedact.length} pages for redaction`)
    },
    [currentPage, numPages, addRedactionItem],
  )

  // Handle redaction submission
  const handleRedact = useCallback(async () => {
    if (!selectedFile || !selectedFile.stableData || !selectedFile.stableData.uint8Array) {
      toast.error("No file selected or file data not available.")
      return
    }

    if (redactionItems.length === 0) {
      toast.error("No items marked for redaction.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile.file)
      formData.append("redactionItems", JSON.stringify(redactionItems))

      if (pdfPassword) {
        const passObj = {}
        passObj[selectedFile.file.name] = pdfPassword
        formData.append("passwords", JSON.stringify(passObj))
      }

      const response = await Api.post("/tools/redact-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      if (response.data?.data?.fileUrl) {
        const encodedFilePath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedFilePath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=redact-pdf`
        router.push(downloadUrl)
      } else {
        toast.error("No redacted file received from server")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error redacting PDF")
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, redactionItems, pdfPassword, router])

  // Group redaction items by page
  const redactionItemsByPage = {}
  redactionItems.forEach((item) => {
    if (!redactionItemsByPage[item.page]) {
      redactionItemsByPage[item.page] = []
    }
    redactionItemsByPage[item.page].push(item)
  })

  // Reusable Sidebar Component
  const RedactionSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? "h-full" : ""} flex flex-col bg-white justify-between overflow-y-auto custom-scrollbar`}>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Redact PDF</h3>

        {/* File Info and Remove Button */}
        <div className="flex items-center justify-between mb-6 px-3 py-2 bg-blue-100 border border-blue-500 rounded-sm">
          <div className="flex items-center gap-2">
            <FaFilePdf className="text-blue-500" size={25} />
            <div>
              <p className="text-blue-900 font-semibold -mb-1">{selectedFile.name}</p>
              <span className="text-sm">{numPages} pages</span>
            </div>
          </div>
          <button onClick={removeFile} className="p-1 bg-white rounded-full flex justify-center items-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          {/* Search Input */}
          <div className="mb-3">
            <div className="flex-1 relative border border-gray-300 rounded-md p-2 min-h-[40px] flex flex-wrap gap-1 items-center">
              {/* Selected Type Tags */}
              {selectedSearchTypes.map((type) => {
                const IconComponent = type.icon
                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{type.label}</span>
                    <button onClick={() => removeSearchType(type.id)} className="text-blue-600 hover:text-blue-800">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}

              {/* Fixed Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                // onKeyDown={(e) => {
                //   if (e.key === "Enter" && searchText.trim()) {
                //     e.preventDefault()
                //     handleTextSearch()
                //   }
                // }}
                placeholder="Search text"
                className="flex-1 min-w-[100px] outline-none bg-transparent text-sm border-none p-0 m-0"
                autoComplete="off"
              // onFocus={(e) => e.stopPropagation()}
              // onBlur={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Search Type Options */}
          <div className="space-y-2 mb-4">
            {SEARCH_TYPES.map((type) => {
              const IconComponent = type.icon
              const isSelected = selectedSearchTypes.some((selected) => selected.id === type.id)
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    if (type.id === "text" && searchText.trim()) {
                      // For text option, use the input text and search
                      handleTextSearch()
                    } else {
                      // For other options, auto-search
                      handleSearchTypeSelect(type)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md border transition-colors ${isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <IconComponent className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{type.label}</span>
                </button>
              )
            })}
          </div>

          {/* Found Items by Type - Only show if items exist and not applied */}
          {selectedSearchTypes.map((searchType) => {
            const typeFoundItems = foundItems.filter((item) => item.type === searchType.id)
            const hasSelectedItems = selectedFoundItems.filter((item) => item.type === searchType.id).length > 0

            if (typeFoundItems.length === 0) return null

            return (
              <div key={searchType.id} className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <searchType.icon className="h-4 w-4" />
                    {searchType.label}
                  </h5>
                  <button
                    onClick={() => {
                      const allTypeSelected = typeFoundItems.every((item) =>
                        selectedFoundItems.some((selected) => selected.id === item.id),
                      )
                      if (allTypeSelected) {
                        setSelectedFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
                      } else {
                        setSelectedFoundItems((prev) => [
                          ...prev.filter((item) => item.type !== searchType.id),
                          ...typeFoundItems,
                        ])
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {typeFoundItems.every((item) => selectedFoundItems.some((selected) => selected.id === item.id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {typeFoundItems.map((item) => {
                    const isSelected = selectedFoundItems.some((selected) => selected.id === item.id)
                    return (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleFoundItemToggle(item)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 bg-white border rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                              <FileText className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.text}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Page {item.page}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {hasSelectedItems && (
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
                      }
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const typeSelectedItems = selectedFoundItems.filter((item) => item.type === searchType.id)
                        typeSelectedItems.forEach((item) => {
                          addRedactionItem({
                            type: item.type,
                            page: item.page,
                            text: item.text,
                            coordinates: { x: item.x, y: item.y, width: item.width, height: item.height },
                          })
                        })
                        // Remove the search type and its results after applying
                        setSelectedSearchTypes((prev) => prev.filter((type) => type.id !== searchType.id))
                        setFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
                        setSelectedFoundItems((prev) => prev.filter((item) => item.type !== searchType.id))
                        setSearchResults((prev) => prev.filter((item) => item.type !== searchType.id))

                        toast.success(
                          `Added ${typeSelectedItems.length} ${searchType.label.toLowerCase()} items for redaction`,
                        )
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Accept ({selectedFoundItems.filter((item) => item.type === searchType.id).length})
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Marked for redaction section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Marked for redaction</h4>
            {redactionItems.length > 0 && (
              <button onClick={clearAllRedactions} className="text-xs text-blue-600 hover:text-blue-800">
                Clear all
              </button>
            )}
          </div>

          {redactionItems.length === 0 ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">Search and select items to start redacting sensitive content.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(redactionItemsByPage).map(([pageNum, items]) => (
                <div key={pageNum}>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Page {pageNum}</h5>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white border border-blue-200 rounded p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                            <FileText className="w-2 h-2 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.text}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeRedactionItem(item.id)}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status/Info */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">File selected:</span>
            <span className="font-semibold text-gray-900">{selectedFile.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total size:</span>
            <span className="font-semibold text-gray-900">{selectedFile.size}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total pages:</span>
            <span className="font-semibold text-gray-900">{numPages}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Items to redact:</span>
            <span className="font-semibold text-gray-900">{redactionItems.length}</span>
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

        {/* Warning Message */}
        {redactionItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm text-orange-800 font-medium">
                  Remember to review the result of your document before sending private information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
        <div className="p-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={handleRedact}
            disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || redactionItems.length === 0}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || redactionItems.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
              }`}
          >
            Redact
            <ChevronRight className="w-5 h-5" />
          </button>
          {redactionItems.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">Mark content for redaction to continue</p>
          )}
        </div>
    </div>
  )

  // Memoized total size calculation
  const totalSize = selectedFile ? selectedFile.size : "0.00 MB"

  // SafeFileUploader wrapper
  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
    return <FileUploader {...safeProps} />
  }

  // Cleanup on unmount
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

  // Maintain focus on search input
  useEffect(() => {
    if (searchInputRef.current && searchText !== "") {
      searchInputRef.current.focus()
    }
  }, [searchText])

  const removeSearchType = useCallback((typeId) => {
    setSelectedSearchTypes((prev) => prev.filter((type) => type.id !== typeId))
    setFoundItems((prev) => prev.filter((item) => item.type !== typeId))
    setSelectedFoundItems((prev) => prev.filter((item) => item.type !== typeId))
    setSearchResults((prev) => prev.filter((item) => item.type !== typeId))
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
        pageTitle="Redact PDF"
        pageSubTitle="Remove sensitive information from your PDF documents securely!"
      />
    )
  }

  const { stableData } = selectedFile
  const fileUrl = stableData?.dataUrl

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - PDF Viewer with Sidebar */}
        <div className="flex-1 flex overflow-hidden mb-20 md:mb-0">
          {/* Left Sidebar - Page Thumbnails */}
          <div className="hidden md:flex w-56 bg-gray-50 border-r border-gray-200 flex-col overflow-y-auto custom-scrollbar">
            {/* Page Thumbnails */}
            <div className="flex-1 p-4 px-5">
              {fileUrl && (
                <Document file={fileUrl} options={documentOptions} className="contents">
                  {Array.from(new Array(numPages), (el, index) => {
                    const pageNum = index + 1
                    const isCurrentPage = pageNum === currentPage

                    return (
                      <div
                        key={`thumb_${pageNum}`}
                        className={`mb-2 cursor-pointer`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        <div
                          className={`border-2 rounded ${isCurrentPage ? "border-blue-500" : "border-gray-200"
                            } bg-white overflow-hidden`}
                        >
                          <Page
                            pageNumber={pageNum}
                            width={160}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pointer-events-none"
                            loading={
                              <div className="w-40 h-52 bg-gray-100 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                              </div>
                            }
                          />
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-sm font-medium text-gray-700">{pageNum}</span>
                        </div>
                      </div>
                    )
                  })}
                </Document>
              )}
            </div>
          </div>

          {/* Main PDF Viewer */}
          <div className="flex-1 flex flex-col">
            <PDFRedactViewer
              fileUrl={selectedFile.stableData?.dataUrl}
              fileId={selectedFile.id}
              redactionItems={redactionItems}
              addRedactionItem={addRedactionItem}
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
              searchResults={searchResults}
              showMarkPagesModal={showMarkPagesModal}
              setShowMarkPagesModal={setShowMarkPagesModal}
              isManualMarkMode={isManualMarkMode}
              setIsManualMarkMode={setIsManualMarkMode}
            />
          </div>

          {/* Desktop Sidebar - Updated width */}
          <div className="hidden md:flex w-[460px] border-l">
            <RedactionSidebar />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar - Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleRedact}
          disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || redactionItems.length === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || redactionItems.length === 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          Redact
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Redact PDF</h2>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <RedactionSidebar isMobile={true} />
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          removeFile()
        }}
        passwordProtectedFiles={selectedFile ? [{ id: selectedFile.id, name: selectedFile.name }] : []}
        onSubmit={handlePasswordSubmit}
      />

      {/* Mark Pages Modal */}
      <MarkPagesModal
        isOpen={showMarkPagesModal}
        onClose={() => setShowMarkPagesModal(false)}
        onSubmit={handlePageSelection}
        numPages={numPages}
        currentPage={currentPage}
        fileUrl={selectedFile?.stableData?.dataUrl}
        password={pdfPassword}
      />
    </div>
  )
}