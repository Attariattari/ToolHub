
"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X, ChevronRight, Edit3, RefreshCw } from "lucide-react"
import { pdfjs, Document, Page } from "react-pdf"
import { FaFilePdf } from "react-icons/fa"
import { toast } from "react-toastify"
import FileUploader from "@/components/tools/FileUploader"
import PDFSignViewer from "@/components/tools/PDFSignViewer"
import PlacementModal from "@/components/tools/PlacementModal"
import ProgressScreen from "@/components/tools/ProgressScreen"
import SigningOptionsModal from "@/components/tools/SigningOptionsModal"
import SignatureModal from "@/components/tools/SignatureModal"
import PasswordModal from "@/components/tools/PasswordModelPreveiw"
import { GrDrag } from "react-icons/gr"
import Api from "@/utils/Api"

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const SIGNATURE_FIELD_TYPES = [
  { id: "signature", label: "Signature", icon: Edit3, color: "blue", required: true, editModal: true },
  { id: "initials", label: "Initials", icon: "AC", color: "blue", required: false, editModal: true },
  { id: "name", label: "Name", icon: "N", color: "gray", required: false, editModal: true },
  { id: "date", label: "Date", icon: "D", color: "blue", required: false },
  { id: "text", label: "Text", icon: "T", color: "blue", required: false },
  { id: "company", label: "Company", icon: "C", color: "blue", required: false, editModal: true },
]

export default function SignPDFPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pdfPassword, setPdfPassword] = useState(null)
  const [passwordProtectedFileId, setPasswordProtectedFileId] = useState(null)
  const [signatureFields, setSignatureFields] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [numPages, setNumPages] = useState(0)
  const [pdfHealthCheck, setPdfHealthCheck] = useState(true)
  const [showSigningModal, setShowSigningModal] = useState(false)
  const [signingMode, setSigningMode] = useState(null)
  const [signers, setSigners] = useState([])
  const [showPlacementModal, setShowPlacementModal] = useState(false)
  const [currentField, setCurrentField] = useState(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [focusedFieldId, setFocusedFieldId] = useState(null)

  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [currentFieldType, setCurrentFieldType] = useState(null)
  const [signatureData, setSignatureData] = useState({
    signature: null,
    initials: null,
    name: "PdfDex",
    company: null,
    companyStamp: null,
  })

  const [documentSettings, setDocumentSettings] = useState({
    signingOrder: false,
    expireEnabled: true,
    expireDays: 15,
    multiRequest: false,
    emailNotif: true,
    remindersEnabled: true,
    reminderDays: 1,
    customizeEmail: false,
    subject: "Please sign the document",
    body: "Hi,\nKindly review and sign the attached document.\nThanks.",
    uuidEnabled: true,
    verifyCode: true,
  })

  const router = useRouter()

  const fileDataCache = useRef(new Map())
  const pdfDocumentCache = useRef(new Map())

  // Calculate page width based on zoom level and container size
  const pageWidth = useMemo(() => {
    if (!numPages) return 600 // Default fallback

    // Get container width for responsive sizing
    const containerWidth = typeof window !== "undefined" ? window.innerWidth : 800

    // Base PDF width (A4 standard in points)
    const basePdfWidth = 595.28 // A4 width in points
    const calculatedWidth = basePdfWidth * (zoomLevel / 100)

    // Responsive width based on screen size
    if (containerWidth < 640) {
      // Mobile: use 95% of container width, max 500px
      return Math.min(calculatedWidth, containerWidth * 0.95, 500)
    } else if (containerWidth < 768) {
      // Mobile landscape: use 90% of container width, max 600px
      return Math.min(calculatedWidth, containerWidth * 0.9, 600)
    } else if (containerWidth < 1024) {
      // Tablet: use 85% of container width, max 700px
      return Math.min(calculatedWidth, containerWidth * 0.85, 700)
    } else {
      // Desktop: use container width minus padding, max 800px
      return Math.min(calculatedWidth, containerWidth - 80, 800)
    }
  }, [numPages, zoomLevel])

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
        setSignatureFields([])
        setFocusedFieldId(null)
        if (stableData.isPasswordProtected) {
          setPasswordProtectedFileId(id)
          setShowPasswordModal(true)
        } else {
          setShowSigningModal(false)
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
        setShowSigningModal(true)
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
    setSignatureFields([])
    setCurrentPage(1)
    setZoomLevel(100)
    setNumPages(0)
    setPdfHealthCheck(true)
    setPdfPassword(null)
    setPasswordProtectedFileId(null)
    setSigningMode(null)
    setSigners([])
    setShowSigningModal(false)
    setFocusedFieldId(null)
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

  // Signature field management
  const addSignatureField = useCallback((field) => {
    setSignatureFields((prev) => [...prev, { ...field, id: Date.now() + Math.random() }])
  }, [])

  const updateSignatureField = useCallback((fieldId, updates) => {
    setSignatureFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
  }, [])

  const removeSignatureField = useCallback((fieldId) => {
    setSignatureFields((prev) => prev.filter((field) => field.id !== fieldId))
  }, [])

  // Handle signing mode selection
  const handleSigningModeSelect = useCallback((mode) => {
    setSigningMode(mode)
    if (mode === "only-me") {
      setShowSigningModal(false)
    }
    // For 'several-people', modal stays open to show settings
  }, [])

  // Handle signer management
  const handleAddSigner = useCallback((signer) => {
    setSigners((prev) => [...prev, { ...signer, id: Date.now() + Math.random() }])
  }, [])

  const handleRemoveSigner = useCallback((signerId) => {
    setSigners((prev) => prev.filter((s) => s.id !== signerId))
  }, [])

  const handleUpdateSigner = useCallback((signerId, updatedSigner) => {
    setSigners((prev) => prev.map((s) => (s.id === signerId ? { ...s, ...updatedSigner } : s)))
  }, [])

  // Handle field copying/placement
  const handleCopyField = useCallback((field) => {
    setCurrentField(field)
    setShowPlacementModal(true)
  }, [])

  const handlePlacementApply = useCallback(
    (placement) => {
      if (!currentField || !placement) return

      const newFields = []
      const { type, pages } = placement

      let pagesToPlace = []
      switch (type) {
        case "only-this-page":
          pagesToPlace = [currentField.page]
          break
        case "all-pages":
          pagesToPlace = Array.from({ length: numPages }, (_, i) => i + 1)
          break
        case "all-pages-but-last":
          pagesToPlace = Array.from({ length: numPages - 1 }, (_, i) => i + 1)
          break
        case "last-page":
          pagesToPlace = [numPages]
          break
        case "custom-pages":
          pagesToPlace = pages || []
          break
      }

      pagesToPlace.forEach((pageNum) => {
        if (pageNum !== currentField.page) {
          // Don't duplicate on the same page
          newFields.push({
            ...currentField,
            id: Date.now() + Math.random() + pageNum,
            page: pageNum,
          })
        }
      })

      setSignatureFields((prev) => [...prev, ...newFields])
      setShowPlacementModal(false)
      setCurrentField(null)
      toast.success(`Added field to ${newFields.length} pages`)
    },
    [currentField, numPages],
  )

  const handleOpenSignatureModal = useCallback((fieldType) => {
    setCurrentFieldType(fieldType)
    setShowSignatureModal(true)
  }, [])

  const handleSignatureDataSave = useCallback((data) => {
    setSignatureData((prev) => ({ ...prev, ...data }))
    setShowSignatureModal(false)
  }, [])

  const handleFieldDragStart = useCallback((e, fieldType) => {
    e.dataTransfer.setData("fieldType", fieldType.id)
    e.dataTransfer.effectAllowed = "copy"
  }, [])

  const handleFieldClick = useCallback(
    (fieldType) => {
      const newFieldId = Date.now() + Math.random()
      addSignatureField({
        id: newFieldId,
        type: fieldType.id,
        page: currentPage,
        x: 100 + Math.random() * 100,
        y: 200 + Math.random() * 100,
        width: 300, // Doubled from 150
        height: 80, // Doubled from 40
      })

      setTimeout(() => setFocusedFieldId(newFieldId), 100)
    },
    [addSignatureField, currentPage],
  )

  const handleSign = useCallback(async () => {
    if (!selectedFile || !selectedFile.stableData) {
      toast.error("No file selected.")
      return
    }

    if (signatureFields.length === 0) {
      toast.error("No signature fields added.")
      return
    }

    // Check if we have required fields
    const requiredFields = SIGNATURE_FIELD_TYPES.filter(type => type.required)
    const hasRequiredFields = requiredFields.every(type => {
      const fields = signatureFields.filter(field => field.type === type.id)
      return fields.length > 0
    })

    if (!hasRequiredFields) {
      toast.error("Please add all required signature fields.")
      return
    }

    // Check if we have signers for several-people mode
    if (signingMode === "several-people" && signers.length === 0) {
      toast.error("Please add at least one signer for multiple people signing.")
      return
    }

    // Check if we have signature data for required fields
    const hasSignatureData = requiredFields.every(type => {
      if (type.id === "signature" && !signatureData.signature) {
        return false
      }
      if (type.id === "initials" && !signatureData.initials) {
        return false
      }
      if (type.id === "name" && !signatureData.name) {
        return false
      }
      return true
    })

    if (!hasSignatureData) {
      toast.error("Please configure your signature data for all required fields.")
      return
    }

    // Check if document settings are configured for several-people mode
    if (signingMode === "several-people") {
      if (!documentSettings.subject || !documentSettings.body) {
        toast.error("Please configure email subject and body for signature requests.")
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()

      // Add the PDF file
      formData.append("file", selectedFile.file)

      // Add password if file is password protected
      if (selectedFile.stableData?.isPasswordProtected && pdfPassword) {
        const filePasswords = {}
        filePasswords[selectedFile.name] = pdfPassword
        formData.append("passwords", JSON.stringify(filePasswords))
      }

      // Get PDF actual dimensions from window if available (set by PDFSignViewer)
      const pdfDimensions = window.pdfActualDimensions || {
        width: 595.28, // A4 default width in points
        height: 841.89, // A4 default height in points
        scale: 1
      }

      // Calculate actual PDF dimensions in points
      const actualPdfWidth = pdfDimensions.width || 595.28
      const actualPdfHeight = pdfDimensions.height || 841.89

      // Prepare the signing payload with accurate positioning
      const signingPayload = {
        // Document information
        document: {
          id: selectedFile.id,
          originalName: selectedFile.name,
          size: selectedFile.size,
          sizeInBytes: selectedFile.file.size,
          type: selectedFile.type,
          numPages: numPages,
          isPasswordProtected: selectedFile.stableData?.isPasswordProtected || false,
          password: pdfPassword || null,
          uploadTimestamp: new Date().toISOString(),
          checksum: "sha256_hash_placeholder",
          // Add PDF dimensions for accurate positioning
          pdfDimensions: {
            width: actualPdfWidth,
            height: actualPdfHeight,
            pointsPerInch: 72, // PDF standard
            scale: pdfDimensions.scale || 1
          }
        },

        // Signing mode and participants
        signingMode: signingMode || "only-me",
        signers: signingMode === "several-people" ? signers.map((signer, index) => ({
          id: signer.id,
          name: signer.name,
          email: signer.email,
          role: "Signer",
          order: documentSettings.signingOrder ? index + 1 : null,
          status: "pending",
          addedAt: new Date().toISOString()
        })) : [],

        // Document settings
        documentSettings: {
          signingOrder: documentSettings.signingOrder,
          expireEnabled: documentSettings.expireEnabled,
          expireDays: documentSettings.expireDays,
          expirationDate: documentSettings.expireEnabled ?
            new Date(Date.now() + documentSettings.expireDays * 24 * 60 * 60 * 1000).toISOString() : null,
          multiRequest: documentSettings.multiRequest,
          emailNotif: documentSettings.emailNotif,
          remindersEnabled: documentSettings.remindersEnabled,
          reminderDays: documentSettings.reminderDays,
          customizeEmail: documentSettings.customizeEmail,
          subject: documentSettings.subject,
          body: documentSettings.body,
          uuidEnabled: documentSettings.uuidEnabled,
          verifyCode: documentSettings.verifyCode
        },

        // Signature fields with accurate PDF coordinates
        signatureFields: signatureFields.map(field => ({
          id: field.id,
          type: field.type,
          page: field.page,
          // Coordinates are already in PDF points from the viewer
          x: Math.round(field.x * 100) / 100, // Round to 2 decimal places
          y: Math.round(field.y * 100) / 100, // Round to 2 decimal places
          width: Math.round(field.width * 100) / 100, // Round to 2 decimal places
          height: Math.round(field.height * 100) / 100, // Round to 2 decimal places
          required: SIGNATURE_FIELD_TYPES.find(type => type.id === field.type)?.required || false,
          assignedTo: signingMode === "several-people" && signers.length > 0 ?
            (field.order || signers[0]?.id) : null,
          value: null,
          signedAt: null,
          signedBy: null,
          // Add font size based on field height for better text rendering
          fontSize: Math.max(8, Math.min(field.height * 0.4, 16)),
          fontFamily: "Helvetica",
          // Add field metadata for backend processing
          fieldMetadata: {
            originalType: field.type,
            isDraggable: true,
            isResizable: true,
            minWidth: 50,
            minHeight: 20
          }
        })),

        // Signature data (pre-created signatures/stamps)
        signatureData: {
          signature: signatureData.signature,
          initials: signatureData.initials,
          name: signatureData.name,
          company: signatureData.company,
          companyStamp: signatureData.companyStamp
        },

        // PDF viewer state with dimensions
        viewerState: {
          currentPage: currentPage,
          zoomLevel: zoomLevel,
          totalPages: numPages,
          focusedFieldId: focusedFieldId,
          pdfDimensions: pdfDimensions,
          viewerDimensions: {
            width: pageWidth,
            height: pageWidth * (pdfDimensions.height / pdfDimensions.width)
          }
        },

        // Submission metadata
        submission: {
          submittedAt: new Date().toISOString(),
          submittedBy: {
            name: "Document Creator",
            email: "creator@example.com",
            ip: "192.168.1.1",
            userAgent: navigator.userAgent
          },
          status: "pending_signatures",
          trackingId: `TRK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        }
      }

      // Append the signing payload as JSON
      formData.append("signingPayload", JSON.stringify(signingPayload))

      // Debug logging
      console.log("🚀 Signing PDF - Enhanced Payload:")
      console.log("PDF Dimensions:", pdfDimensions)
      console.log("Signature Fields with Coordinates:", signingPayload.signatureFields)
      console.log("Viewer State:", signingPayload.viewerState)

      // API call to sign PDF
      const response = await Api.post("/tools/sign-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      if (response.data) {
        // Handle success - redirect to download or show success message
        if (response.data.data?.fileUrl) {
          const encodedUrl = encodeURIComponent(response.data.data.fileUrl)
          const downloadUrl = `/downloads/document=${encodedUrl}?dbTaskId=${response.data.data.dbTaskId}&tool-type=sign-pdf`
          toast.success("Document signed successfully! Redirecting to download...")
          router.push(downloadUrl)
        } else if (response.data.data?.trackingId) {
          // For multiple signers, show tracking info
          toast.success(`Document sent for signing! Tracking ID: ${response.data.data.trackingId}`)
          // You could redirect to a tracking page here
        } else if (response.data.message) {
          toast.success(response.data.message)
        } else {
          toast.success("Document signed successfully!")
        }
      } else {
        toast.error("No response received from server")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Server error. Please try again later.")
    } finally {
      setIsUploading(false)
    }
  }, [
    selectedFile,
    signatureFields,
    signingMode,
    signers,
    documentSettings,
    numPages,
    pdfPassword,
    currentPage,
    zoomLevel,
    focusedFieldId,
    signatureData,
    router,
    pageWidth // Add pageWidth dependency
  ])

  const handleSettingsSave = useCallback((settings) => {
    setDocumentSettings(settings)
    setShowSigningModal(false)
  }, [])

  // Group signature fields by type
  const fieldsByType = SIGNATURE_FIELD_TYPES.reduce((acc, type) => {
    acc[type.id] = signatureFields.filter((field) => field.type === type.id)
    return acc
  }, {})

  const SigningSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? "h-full" : ""} flex flex-col justify-between w-full`}>
      <div className="p-6 overflow-y-auto custom-scrollbar" style={{ scrollBehavior: "auto" }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign PDF</h3>

        {/* File Info and Remove Button */}
        <div className="flex items-center justify-between mb-6 px-3 py-2 bg-blue-100 border border-blue-500 rounded-sm">
          <div className="flex items-center gap-2">
            <FaFilePdf className="text-blue-500" size={25} />
            <div>
              <p className="text-blue-900 text-sm -mb-1">{selectedFile.name}</p>
              <span className="text-sm">{numPages} pages</span>
            </div>
          </div>
          <button onClick={removeFile} className="p-1 bg-white rounded-full flex justify-center items-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Required Fields */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Required fields</h4>
          <div className="space-y-3">
            {SIGNATURE_FIELD_TYPES.filter((type) => type.required).map((type) => {
              const fields = fieldsByType[type.id] || []
              const previewData = signatureData[type.id]

              return (
                <div key={type.id} className="border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center">
                    <div
                      className="flex items-center gap-2 flex-1 cursor-move hover:bg-gray-50 p-2 rounded transition-colors"
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, type)}
                      onClick={() => handleFieldClick(type)}
                    >
                      <GrDrag className="w-4 h-4 text-gray-400" />
                      <div className="w-6 h-6 bg-blue-600 text-white rounded text-xs flex items-center justify-center">
                        <Edit3 className="h-3 w-3" />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        {previewData && (
                          <div className="ml-auto w-16 h-6 border rounded overflow-hidden bg-gray-50">
                            {/* Only show image preview for signature, initials, and company fields */}
                            {(type.id === "signature" || type.id === "initials" || type.id === "company") &&
                              typeof previewData === "string" ? (
                              <img
                                src={previewData || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            ) : type.id === "name" && signatureData.name ? (
                              <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
                                {signatureData.name}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit signature"
                      onClick={() => handleOpenSignatureModal(type.id)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  {fields.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">{fields.length} field(s) added</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Optional Fields */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Optional fields</h4>
          <div className="space-y-3">
            {SIGNATURE_FIELD_TYPES.filter((type) => !type.required).map((type) => {
              const fields = fieldsByType[type.id] || []
              const previewData = signatureData[type.id] || (type.id === "company" ? signatureData.companyStamp : null)

              return (
                <div key={type.id} className="border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center">
                    <div
                      className="flex items-center gap-2 flex-1 cursor-move hover:bg-gray-50 p-2 rounded transition-colors"
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, type)}
                      onClick={() => handleFieldClick(type)}
                    >
                      <GrDrag className="w-4 h-4 text-gray-400" />
                      <div
                        className={`w-6 h-6 ${type.color === "blue" ? "bg-blue-600" : "bg-gray-600"
                          } text-white rounded text-xs flex items-center justify-center font-bold`}
                      >
                        {typeof type.icon === "string" ? type.icon : <type.icon className="w-3 h-3" />}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        {previewData && (
                          <div className="ml-auto w-16 h-6 border rounded overflow-hidden bg-gray-50">
                            {/* Only show image preview for signature, initials, and company fields */}
                            {(type.id === "signature" || type.id === "initials" || type.id === "company") &&
                              typeof previewData === "string" ? (
                              <img
                                src={previewData || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            ) : previewData?.text ? (
                              <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
                                {previewData.text}
                              </div>
                            ) : type.id === "name" && signatureData.name ? (
                              <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
                                {signatureData.name}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                    {type.editModal && (
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title={`Edit ${type.label.toLowerCase()}`}
                        onClick={() => handleOpenSignatureModal(type.id)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {fields.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">{fields.length} field(s) added</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Status/Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-10 text-sm">
            <span className="text-gray-600">File selected:</span>
            <span className="font-semibold text-gray-900 flex-1 line-clamp-1">{selectedFile.name}</span>
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
            <span className="text-gray-600">Signature fields:</span>
            <span className="font-semibold text-gray-900">{signatureFields.length}</span>
          </div>
          {selectedFile.stableData?.isPasswordProtected && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Password protected:</span>
              <span className="font-semibold text-yellow-600">Yes</span>
            </div>
          )}
        </div>
      </div>
        <div className="p-4 border-t">
          <button
            onClick={handleSign}
            disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
              }`}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                Sign
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
          {signatureFields.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">Add signature fields to continue</p>
          )}
        </div>
    </div>
  )

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
        pageTitle="Sign PDF"
        pageSubTitle="Upload a PDF document to add your signature and send for signing!"
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
          {/* Left Sidebar - Page Thumbnails - Responsive */}
          <div className="hidden lg:flex w-48 bg-gray-50 border-r border-gray-200 flex-col overflow-y-auto custom-scrollbar">
            {/* Page Thumbnails */}
            <div className="flex-1 p-3 xl:p-4 px-4 xl:px-5">
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
                            } overflow-hidden`}
                        >
                          <Page
                            pageNumber={pageNum}
                            width={140}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pointer-events-none"
                            loading={
                              <div className="w-[140px] h-[180px] bg-gray-100 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                              </div>
                            }
                          />
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-xs xl:text-sm font-medium text-gray-700">{pageNum}</span>
                        </div>
                      </div>
                    )
                  })}
                </Document>
              )}
            </div>
          </div>

          {/* Main PDF Viewer - Responsive */}
          <div className="flex-1 flex flex-col min-w-0">
            <PDFSignViewer
              fileUrl={selectedFile.stableData?.dataUrl}
              fileId={selectedFile.id}
              signatureFields={signatureFields}
              addSignatureField={addSignatureField}
              updateSignatureField={updateSignatureField}
              removeSignatureField={removeSignatureField}
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
              onCopyField={handleCopyField}
              signatureData={signatureData}
              onOpenSignatureModal={handleOpenSignatureModal}
              focusedFieldId={focusedFieldId}
              setFocusedFieldId={setFocusedFieldId} // Added missing prop
            />
          </div>

          {/* Desktop Sidebar - Increased width and responsive */}
          <div className="hidden md:flex w-[380px] lg:w-[420px] xl:w-[460px] border-l bg-white">
            <SigningSidebar />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar - Updated with Settings icon */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleSign}
          disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Signing...
            </>
          ) : (
            <>
              Sign
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
          title="Settings"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar - Improved responsive design */}
      {showMobileSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-[90vw] max-w-sm bg-white shadow-lg">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100vh-73px)] overflow-hidden">
              <SigningSidebar isMobile={true} />
            </div>
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

      {/* Signing Options Modal */}
      <SigningOptionsModal
        isOpen={showSigningModal}
        onClose={() => setShowSigningModal(false)}
        onModeSelect={handleSigningModeSelect}
        signingMode={signingMode}
        signers={signers}
        onAddSigner={handleAddSigner}
        onRemoveSigner={handleRemoveSigner}
        onUpdateSigner={handleUpdateSigner}
        fileName={selectedFile?.name}
        onSettingsSave={handleSettingsSave} // Added settings save handler
      />

      {/* Placement Modal */}
      <PlacementModal
        isOpen={showPlacementModal}
        onClose={() => setShowPlacementModal(false)}
        onApply={handlePlacementApply}
        fileName={selectedFile?.name}
        numPages={numPages}
      />

      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureDataSave}
        fieldType={currentFieldType}
        initialData={signatureData}
      />
    </div>
  )
}


// "use client"

// import { useState, useRef, useCallback, useEffect, useMemo } from "react"
// import { useRouter } from "next/navigation"
// import { X, ChevronRight, Edit3, RefreshCw, ExternalLink } from "lucide-react"
// import { pdfjs, Document, Page } from "react-pdf"
// import { FaFilePdf } from "react-icons/fa"
// import { IoMdLock } from "react-icons/io"
// import { toast } from "react-toastify"
// import FileUploader from "@/components/tools/FileUploader"
// import PDFSignViewer from "@/components/tools/PDFSignViewer"
// import PlacementModal from "@/components/tools/PlacementModal"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import SigningOptionsModal from "@/components/tools/SigningOptionsModal"
// import SignatureModal from "@/components/tools/SignatureModal"
// import PasswordModal from "@/components/tools/PasswordModelPreveiw"
// import { GrDrag } from "react-icons/gr"
// import Api from "@/utils/Api"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// const SIGNATURE_FIELD_TYPES = [
//   { id: "signature", label: "Signature", icon: Edit3, color: "blue", required: true, editModal: true },
//   { id: "initials", label: "Initials", icon: "AC", color: "blue", required: false, editModal: true },
//   { id: "name", label: "Name", icon: "N", color: "gray", required: false, editModal: true },
//   { id: "date", label: "Date", icon: "D", color: "blue", required: false },
//   { id: "text", label: "Text", icon: "T", color: "blue", required: false },
//   { id: "company", label: "Company", icon: "C", color: "blue", required: false, editModal: true },
// ]

// // Constants for limits - Updated to 100MB only
// const LIMITS = {
//   MAX_SIZE_MB: 100
// }

// export default function SignPDFPage() {
//   const [selectedFile, setSelectedFile] = useState(null)
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [pdfPassword, setPdfPassword] = useState(null)
//   const [passwordProtectedFileId, setPasswordProtectedFileId] = useState(null)
//   const [signatureFields, setSignatureFields] = useState([])
//   const [currentPage, setCurrentPage] = useState(1)
//   const [zoomLevel, setZoomLevel] = useState(100)
//   const [numPages, setNumPages] = useState(0)
//   const [pdfHealthCheck, setPdfHealthCheck] = useState(true)
//   const [showSigningModal, setShowSigningModal] = useState(false)
//   const [signingMode, setSigningMode] = useState(null)
//   const [signers, setSigners] = useState([])
//   const [showPlacementModal, setShowPlacementModal] = useState(false)
//   const [currentField, setCurrentField] = useState(null)
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)
//   const [focusedFieldId, setFocusedFieldId] = useState(null)

//   const [showSignatureModal, setShowSignatureModal] = useState(false)
//   const [currentFieldType, setCurrentFieldType] = useState(null)
//   const [signatureData, setSignatureData] = useState({
//     signature: null,
//     initials: null,
//     name: "PdfDex",
//     company: null,
//     companyStamp: null,
//   })

//   const [documentSettings, setDocumentSettings] = useState({
//     signingOrder: false,
//     expireEnabled: true,
//     expireDays: 15,
//     multiRequest: false,
//     emailNotif: true,
//     remindersEnabled: true,
//     reminderDays: 1,
//     customizeEmail: false,
//     subject: "Please sign the document",
//     body: "Hi,\nKindly review and sign the attached document.\nThanks.",
//     uuidEnabled: true,
//     verifyCode: true,
//   })

//   const router = useRouter()

//   const fileDataCache = useRef(new Map())
//   const pdfDocumentCache = useRef(new Map())

//   // Calculate page width based on zoom level and container size
//   const pageWidth = useMemo(() => {
//     if (!numPages) return 600 // Default fallback

//     // Get container width for responsive sizing
//     const containerWidth = typeof window !== "undefined" ? window.innerWidth : 800

//     // Base PDF width (A4 standard in points)
//     const basePdfWidth = 595.28 // A4 width in points
//     const calculatedWidth = basePdfWidth * (zoomLevel / 100)

//     // Responsive width based on screen size
//     if (containerWidth < 640) {
//       // Mobile: use 95% of container width, max 500px
//       return Math.min(calculatedWidth, containerWidth * 0.95, 500)
//     } else if (containerWidth < 768) {
//       // Mobile landscape: use 90% of container width, max 600px
//       return Math.min(calculatedWidth, containerWidth * 0.9, 600)
//     } else if (containerWidth < 1024) {
//       // Tablet: use 85% of container width, max 700px
//       return Math.min(calculatedWidth, containerWidth * 0.85, 700)
//     } else {
//       // Desktop: use container width minus padding, max 800px
//       return Math.min(calculatedWidth, containerWidth - 80, 800)
//     }
//   }, [numPages, zoomLevel])

//   // Memoize the document options
//   const documentOptions = useMemo(
//     () => ({
//       cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//       cMapPacked: true,
//       standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
//       password: pdfPassword || undefined,
//     }),
//     [pdfPassword],
//   )

//   // Check if file exceeds size limit
//   const checkFileSizeLimit = useCallback((file) => {
//     const fileSizeMB = file.size / 1024 / 1024
//     return fileSizeMB <= LIMITS.MAX_SIZE_MB
//   }, [])

//   // Check password protection
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

//   // Create stable file data
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

//   // Handle file selection
//   const handleFiles = useCallback(
//     async (newFiles) => {
//       if (newFiles.length === 0) return
//       const file = newFiles[0]

//       // Check file size limit
//       if (!checkFileSizeLimit(file)) {
//         toast.error(`File size exceeds ${LIMITS.MAX_SIZE_MB}MB limit. Please select a smaller file.`)
//         return
//       }

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
//         setSignatureFields([])
//         setFocusedFieldId(null)
//         if (stableData.isPasswordProtected) {
//           setPasswordProtectedFileId(id)
//           setShowPasswordModal(true)
//         } else {
//           setShowSigningModal(true)
//         }
//       } else {
//         toast.error("Failed to process file.")
//       }
//     },
//     [createStableFileData, checkFileSizeLimit],
//   )

//   // Handle password submission
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
//         setShowSigningModal(true)
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

//   // Remove file
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
//     setSignatureFields([])
//     setCurrentPage(1)
//     setZoomLevel(100)
//     setNumPages(0)
//     setPdfHealthCheck(true)
//     setPdfPassword(null)
//     setPasswordProtectedFileId(null)
//     setSigningMode(null)
//     setSigners([])
//     setShowSigningModal(false)
//     setFocusedFieldId(null)
//   }, [selectedFile])

//   // PDF load handlers
//   const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
//     pdfDocumentCache.current.set(fileId, pdf)
//     setNumPages(pdf.numPages)
//     setPdfHealthCheck(true)
//   }, [])

//   const onDocumentLoadError = useCallback((error, fileId) => {
//     console.warn(`PDF load error for file ${fileId}:`, error)
//     setPdfHealthCheck(false)
//     setNumPages(0)
//     toast.error("Failed to load PDF. It might be corrupted or password protected.")
//   }, [])

//   // Signature field management
//   const addSignatureField = useCallback((field) => {
//     setSignatureFields((prev) => [...prev, { ...field, id: Date.now() + Math.random() }])
//   }, [])

//   const updateSignatureField = useCallback((fieldId, updates) => {
//     setSignatureFields((prev) => prev.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
//   }, [])

//   const removeSignatureField = useCallback((fieldId) => {
//     setSignatureFields((prev) => prev.filter((field) => field.id !== fieldId))
//   }, [])

//   // Handle signing mode selection
//   const handleSigningModeSelect = useCallback((mode) => {
//     setSigningMode(mode)
//     if (mode === "only-me") {
//       setShowSigningModal(false)
//     }
//     // For 'several-people', modal stays open to show settings
//   }, [])

//   // Handle signer management
//   const handleAddSigner = useCallback((signer) => {
//     setSigners((prev) => [...prev, { ...signer, id: Date.now() + Math.random() }])
//   }, [])

//   const handleRemoveSigner = useCallback((signerId) => {
//     setSigners((prev) => prev.filter((s) => s.id !== signerId))
//   }, [])

//   const handleUpdateSigner = useCallback((signerId, updatedSigner) => {
//     setSigners((prev) => prev.map((s) => (s.id === signerId ? { ...s, ...updatedSigner } : s)))
//   }, [])

//   // Handle field copying/placement
//   const handleCopyField = useCallback((field) => {
//     setCurrentField(field)
//     setShowPlacementModal(true)
//   }, [])

//   const handlePlacementApply = useCallback(
//     (placement) => {
//       if (!currentField || !placement) return

//       const newFields = []
//       const { type, pages } = placement

//       let pagesToPlace = []
//       switch (type) {
//         case "only-this-page":
//           pagesToPlace = [currentField.page]
//           break
//         case "all-pages":
//           pagesToPlace = Array.from({ length: numPages }, (_, i) => i + 1)
//           break
//         case "all-pages-but-last":
//           pagesToPlace = Array.from({ length: numPages - 1 }, (_, i) => i + 1)
//           break
//         case "last-page":
//           pagesToPlace = [numPages]
//           break
//         case "custom-pages":
//           pagesToPlace = pages || []
//           break
//       }

//       pagesToPlace.forEach((pageNum) => {
//         if (pageNum !== currentField.page) {
//           // Don't duplicate on the same page
//           newFields.push({
//             ...currentField,
//             id: Date.now() + Math.random() + pageNum,
//             page: pageNum,
//           })
//         }
//       })

//       setSignatureFields((prev) => [...prev, ...newFields])
//       setShowPlacementModal(false)
//       setCurrentField(null)
//       toast.success(`Added field to ${newFields.length} pages`)
//     },
//     [currentField, numPages],
//   )

//   const handleOpenSignatureModal = useCallback((fieldType) => {
//     setCurrentFieldType(fieldType)
//     setShowSignatureModal(true)
//   }, [])

//   const handleSignatureDataSave = useCallback((data) => {
//     setSignatureData((prev) => ({ ...prev, ...data }))
//     setShowSignatureModal(false)
//   }, [])

//   const handleFieldDragStart = useCallback((e, fieldType) => {
//     e.dataTransfer.setData("fieldType", fieldType.id)
//     e.dataTransfer.effectAllowed = "copy"
//   }, [])

//   const handleFieldClick = useCallback(
//     (fieldType) => {
//       const newFieldId = Date.now() + Math.random()
//       addSignatureField({
//         id: newFieldId,
//         type: fieldType.id,
//         page: currentPage,
//         x: 100 + Math.random() * 100,
//         y: 200 + Math.random() * 100,
//         width: 300, // Doubled from 150
//         height: 80, // Doubled from 40
//       })

//       setTimeout(() => setFocusedFieldId(newFieldId), 100)
//     },
//     [addSignatureField, currentPage],
//   )

//   const handleSign = useCallback(async () => {
//     if (!selectedFile || !selectedFile.stableData) {
//       toast.error("No file selected.")
//       return
//     }

//     if (signatureFields.length === 0) {
//       toast.error("No signature fields added.")
//       return
//     }

//     // Check if we have required fields
//     const requiredFields = SIGNATURE_FIELD_TYPES.filter(type => type.required)
//     const hasRequiredFields = requiredFields.every(type => {
//       const fields = signatureFields.filter(field => field.type === type.id)
//       return fields.length > 0
//     })

//     if (!hasRequiredFields) {
//       toast.error("Please add all required signature fields.")
//       return
//     }

//     // Check if we have signers for several-people mode
//     if (signingMode === "several-people" && signers.length === 0) {
//       toast.error("Please add at least one signer for multiple people signing.")
//       return
//     }

//     // Check if we have signature data for required fields
//     const hasSignatureData = requiredFields.every(type => {
//       if (type.id === "signature" && !signatureData.signature) {
//         return false
//       }
//       if (type.id === "initials" && !signatureData.initials) {
//         return false
//       }
//       if (type.id === "name" && !signatureData.name) {
//         return false
//       }
//       return true
//     })

//     if (!hasSignatureData) {
//       toast.error("Please configure your signature data for all required fields.")
//       return
//     }

//     // Check if document settings are configured for several-people mode
//     if (signingMode === "several-people") {
//       if (!documentSettings.subject || !documentSettings.body) {
//         toast.error("Please configure email subject and body for signature requests.")
//         return
//       }
//     }

//     setIsUploading(true)
//     setUploadProgress(0)

//     try {
//       const formData = new FormData()

//       // Add the PDF file
//       formData.append("file", selectedFile.file)

//       // Add password if file is password protected
//       if (selectedFile.stableData?.isPasswordProtected && pdfPassword) {
//         const filePasswords = {}
//         filePasswords[selectedFile.name] = pdfPassword
//         formData.append("passwords", JSON.stringify(filePasswords))
//       }

//       // Get PDF actual dimensions from window if available (set by PDFSignViewer)
//       const pdfDimensions = window.pdfActualDimensions || {
//         width: 595.28, // A4 default width in points
//         height: 841.89, // A4 default height in points
//         scale: 1
//       }

//       // Calculate actual PDF dimensions in points
//       const actualPdfWidth = pdfDimensions.width || 595.28
//       const actualPdfHeight = pdfDimensions.height || 841.89

//       // Prepare the signing payload with accurate positioning
//       const signingPayload = {
//         // Document information
//         document: {
//           id: selectedFile.id,
//           originalName: selectedFile.name,
//           size: selectedFile.size,
//           sizeInBytes: selectedFile.file.size,
//           type: selectedFile.type,
//           numPages: numPages,
//           isPasswordProtected: selectedFile.stableData?.isPasswordProtected || false,
//           password: pdfPassword || null,
//           uploadTimestamp: new Date().toISOString(),
//           checksum: "sha256_hash_placeholder",
//           // Add PDF dimensions for accurate positioning
//           pdfDimensions: {
//             width: actualPdfWidth,
//             height: actualPdfHeight,
//             pointsPerInch: 72, // PDF standard
//             scale: pdfDimensions.scale || 1
//           }
//         },

//         // Signing mode and participants
//         signingMode: signingMode || "only-me",
//         signers: signingMode === "several-people" ? signers.map((signer, index) => ({
//           id: signer.id,
//           name: signer.name,
//           email: signer.email,
//           role: "Signer",
//           order: documentSettings.signingOrder ? index + 1 : null,
//           status: "pending",
//           addedAt: new Date().toISOString()
//         })) : [],

//         // Document settings
//         documentSettings: {
//           signingOrder: documentSettings.signingOrder,
//           expireEnabled: documentSettings.expireEnabled,
//           expireDays: documentSettings.expireDays,
//           expirationDate: documentSettings.expireEnabled ?
//             new Date(Date.now() + documentSettings.expireDays * 24 * 60 * 60 * 1000).toISOString() : null,
//           multiRequest: documentSettings.multiRequest,
//           emailNotif: documentSettings.emailNotif,
//           remindersEnabled: documentSettings.remindersEnabled,
//           reminderDays: documentSettings.reminderDays,
//           customizeEmail: documentSettings.customizeEmail,
//           subject: documentSettings.subject,
//           body: documentSettings.body,
//           uuidEnabled: documentSettings.uuidEnabled,
//           verifyCode: documentSettings.verifyCode
//         },

//         // Signature fields with accurate PDF coordinates
//         signatureFields: signatureFields.map(field => ({
//           id: field.id,
//           type: field.type,
//           page: field.page,
//           // Coordinates are already in PDF points from the viewer
//           x: Math.round(field.x * 100) / 100, // Round to 2 decimal places
//           y: Math.round(field.y * 100) / 100, // Round to 2 decimal places
//           width: Math.round(field.width * 100) / 100, // Round to 2 decimal places
//           height: Math.round(field.height * 100) / 100, // Round to 2 decimal places
//           required: SIGNATURE_FIELD_TYPES.find(type => type.id === field.type)?.required || false,
//           assignedTo: signingMode === "several-people" && signers.length > 0 ?
//             (field.order || signers[0]?.id) : null,
//           value: null,
//           signedAt: null,
//           signedBy: null,
//           // Add font size based on field height for better text rendering
//           fontSize: Math.max(8, Math.min(field.height * 0.4, 16)),
//           fontFamily: "Helvetica",
//           // Add field metadata for backend processing
//           fieldMetadata: {
//             originalType: field.type,
//             isDraggable: true,
//             isResizable: true,
//             minWidth: 50,
//             minHeight: 20
//           }
//         })),

//         // Signature data (pre-created signatures/stamps)
//         signatureData: {
//           signature: signatureData.signature,
//           initials: signatureData.initials,
//           name: signatureData.name,
//           company: signatureData.company,
//           companyStamp: signatureData.companyStamp
//         },

//         // PDF viewer state with dimensions
//         viewerState: {
//           currentPage: currentPage,
//           zoomLevel: zoomLevel,
//           totalPages: numPages,
//           focusedFieldId: focusedFieldId,
//           pdfDimensions: pdfDimensions,
//           viewerDimensions: {
//             width: pageWidth,
//             height: pageWidth * (pdfDimensions.height / pdfDimensions.width)
//           }
//         },

//         // Submission metadata
//         submission: {
//           submittedAt: new Date().toISOString(),
//           submittedBy: {
//             name: "Document Creator",
//             email: "creator@example.com",
//             ip: "192.168.1.1",
//             userAgent: navigator.userAgent
//           },
//           status: "pending_signatures",
//           trackingId: `TRK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
//         }
//       }

//       // Append the signing payload as JSON
//       formData.append("signingPayload", JSON.stringify(signingPayload))

//       // Debug logging
//       console.log("🚀 Signing PDF - Enhanced Payload:")
//       console.log("PDF Dimensions:", pdfDimensions)
//       console.log("Signature Fields with Coordinates:", signingPayload.signatureFields)
//       console.log("Viewer State:", signingPayload.viewerState)

//       // API call to sign PDF
//       const response = await Api.post("/tools/sign-pdf", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
//           setUploadProgress(progress)
//         },
//       })

//       if (response.data) {
//         // Handle success - redirect to download or show success message
//         if (response.data.data?.fileUrl) {
//           const encodedUrl = encodeURIComponent(response.data.data.fileUrl)
//           const downloadUrl = `/downloads/document=${encodedUrl}?dbTaskId=${response.data.data.dbTaskId}&tool-type=sign-pdf`
//           toast.success("Document signed successfully! Redirecting to download...")
//           router.push(downloadUrl)
//         } else if (response.data.data?.trackingId) {
//           // For multiple signers, show tracking info
//           toast.success(`Document sent for signing! Tracking ID: ${response.data.data.trackingId}`)
//           // You could redirect to a tracking page here
//         } else if (response.data.message) {
//           toast.success(response.data.message)
//         } else {
//           toast.success("Document signed successfully!")
//         }
//       } else {
//         toast.error("No response received from server")
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Server error. Please try again later.")
//     } finally {
//       setIsUploading(false)
//     }
//   }, [
//     selectedFile,
//     signatureFields,
//     signingMode,
//     signers,
//     documentSettings,
//     numPages,
//     pdfPassword,
//     currentPage,
//     zoomLevel,
//     focusedFieldId,
//     signatureData,
//     router,
//     pageWidth // Add pageWidth dependency
//   ])

//   const handleSettingsSave = useCallback((settings) => {
//     setDocumentSettings(settings)
//     setShowSigningModal(false)
//   }, [])

//   // Group signature fields by type
//   const fieldsByType = SIGNATURE_FIELD_TYPES.reduce((acc, type) => {
//     acc[type.id] = signatureFields.filter((field) => field.type === type.id)
//     return acc
//   }, {})

//   // Check if file is password protected and not unlocked
//   const isPasswordProtectedAndLocked = selectedFile?.stableData?.isPasswordProtected && !selectedFile?.stableData?.dataUrl

//   // Define SigningSidebar component inside main component
//   const SigningSidebar = ({ isMobile = false }) => (
//     <div className={`${isMobile ? "h-full" : ""} flex flex-col w-full`}>
//       {/* Main Content Area */}
//       <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ scrollBehavior: "auto" }}>
//         <div className="p-6">
//           <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign PDF</h3>

//           {/* File Info and Remove Button */}
//           <div className="flex items-center justify-between mb-6 px-3 py-2 bg-blue-100 border border-blue-500 rounded-sm">
//             <div className="flex items-center gap-2">
//               <FaFilePdf className="text-blue-500" size={25} />
//               <div>
//                 <p className="text-blue-900 text-sm -mb-1">{selectedFile.name}</p>
//                 <span className="text-sm">{numPages} pages</span>
//               </div>
//             </div>
//             <button onClick={removeFile} className="p-1 bg-white rounded-full flex justify-center items-center">
//               <X className="w-4 h-4" />
//             </button>
//           </div>

//           {/* Password Protected Message - Updated */}
//           {isPasswordProtectedAndLocked ? (
//             <div className="mb-6">
//               <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-center">
//                 <IoMdLock className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
//                 <h4 className="text-lg font-semibold text-yellow-800 mb-2">Password Protected File</h4>
//                 <p className="text-sm text-yellow-700 mb-4">
//                   This PDF is password protected. Please unlock it first before adding signature fields.
//                 </p>
//                 <button
//                   onClick={() => router.push('/unlock-pdf')}
//                   className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
//                 >
//                   Unlock PDF
//                   <ExternalLink className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* Required Fields */}
//               <div className="mb-6">
//                 <h4 className="text-lg font-semibold text-gray-900 mb-3">Required fields</h4>
//                 <div className="space-y-3">
//                   {SIGNATURE_FIELD_TYPES.filter((type) => type.required).map((type) => {
//                     const fields = fieldsByType[type.id] || []
//                     const previewData = signatureData[type.id]

//                     return (
//                       <div key={type.id} className="border border-gray-300 rounded-lg p-3">
//                         <div className="flex items-center">
//                           <div
//                             className="flex items-center gap-2 flex-1 cursor-move hover:bg-gray-50 p-2 rounded transition-colors"
//                             draggable
//                             onDragStart={(e) => handleFieldDragStart(e, type)}
//                             onClick={() => handleFieldClick(type)}
//                           >
//                             <GrDrag className="w-4 h-4 text-gray-400" />
//                             <div className="w-6 h-6 bg-blue-600 text-white rounded text-xs flex items-center justify-center">
//                               <Edit3 className="h-3 w-3" />
//                             </div>
//                             <div className="flex items-center gap-2 flex-1">
//                               <span className="text-sm font-medium text-gray-900">{type.label}</span>
//                               {previewData && (
//                                 <div className="ml-auto w-16 h-6 border rounded overflow-hidden bg-gray-50">
//                                   {/* Only show image preview for signature, initials, and company fields */}
//                                   {(type.id === "signature" || type.id === "initials" || type.id === "company") &&
//                                     typeof previewData === "string" ? (
//                                     <img
//                                       src={previewData || "/placeholder.svg"}
//                                       alt="Preview"
//                                       className="w-full h-full object-contain"
//                                     />
//                                   ) : type.id === "name" && signatureData.name ? (
//                                     <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
//                                       {signatureData.name}
//                                     </div>
//                                   ) : null}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                           <button
//                             className="p-1 hover:bg-gray-100 rounded"
//                             title="Edit signature"
//                             onClick={() => handleOpenSignatureModal(type.id)}
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                         </div>
//                         {fields.length > 0 && (
//                           <div className="mt-2 text-xs text-gray-500">{fields.length} field(s) added</div>
//                         )}
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>

//               {/* Optional Fields */}
//               <div className="mb-6">
//                 <h4 className="text-lg font-semibold text-gray-900 mb-3">Optional fields</h4>
//                 <div className="space-y-3">
//                   {SIGNATURE_FIELD_TYPES.filter((type) => !type.required).map((type) => {
//                     const fields = fieldsByType[type.id] || []
//                     const previewData = signatureData[type.id] || (type.id === "company" ? signatureData.companyStamp : null)

//                     return (
//                       <div key={type.id} className="border border-gray-300 rounded-lg p-3">
//                         <div className="flex items-center">
//                           <div
//                             className="flex items-center gap-2 flex-1 cursor-move hover:bg-gray-50 p-2 rounded transition-colors"
//                             draggable
//                             onDragStart={(e) => handleFieldDragStart(e, type)}
//                             onClick={() => handleFieldClick(type)}
//                           >
//                             <GrDrag className="w-4 h-4 text-gray-400" />
//                             <div
//                               className={`w-6 h-6 ${type.color === "blue" ? "bg-blue-600" : "bg-gray-600"
//                                 } text-white rounded text-xs flex items-center justify-center font-bold`}
//                             >
//                               {typeof type.icon === "string" ? type.icon : <type.icon className="w-3 h-3" />}
//                             </div>
//                             <div className="flex items-center gap-2 flex-1">
//                               <span className="text-sm font-medium text-gray-900">{type.label}</span>
//                               {previewData && (
//                                 <div className="ml-auto w-16 h-6 border rounded overflow-hidden bg-gray-50">
//                                   {/* Only show image preview for signature, initials, and company fields */}
//                                   {(type.id === "signature" || type.id === "initials" || type.id === "company") &&
//                                     typeof previewData === "string" ? (
//                                     <img
//                                       src={previewData || "/placeholder.svg"}
//                                       alt="Preview"
//                                       className="w-full h-full object-contain"
//                                     />
//                                   ) : previewData?.text ? (
//                                     <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
//                                       {previewData.text}
//                                     </div>
//                                   ) : type.id === "name" && signatureData.name ? (
//                                     <div className="w-full h-full flex items-center justify-center text-xs font-medium truncate px-1">
//                                       {signatureData.name}
//                                     </div>
//                                   ) : null}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                           {type.editModal && (
//                             <button
//                               className="p-1 hover:bg-gray-100 rounded"
//                               title={`Edit ${type.label.toLowerCase()}`}
//                               onClick={() => handleOpenSignatureModal(type.id)}
//                             >
//                               <Edit3 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                         {fields.length > 0 && (
//                           <div className="mt-2 text-xs text-gray-500">{fields.length} field(s) added</div>
//                         )}
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             </>
//           )}

//           {/* File Information Section */}
//           <div className="space-y-4 mb-6">
//             <h4 className="font-semibold text-blue-900">File Information</h4>
//             <div className="space-y-2 text-sm">
//               <div className="flex items-center justify-between">
//                 <span className="text-blue-700">File selected:</span>
//                 <span className="font-semibold text-blue-900 truncate ml-2">{selectedFile.name}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-blue-700">Total size:</span>
//                 <span className="font-semibold text-blue-900">{selectedFile.size}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-blue-700">Total pages:</span>
//                 <span className="font-semibold text-blue-900">{numPages}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-blue-700">Signature fields:</span>
//                 <span className="font-semibold text-blue-900">{signatureFields.length}</span>
//               </div>
//               {selectedFile.stableData?.isPasswordProtected && (
//                 <div className="flex items-center justify-between">
//                   <span className="text-blue-700">Password protected:</span>
//                   <span className="font-semibold text-yellow-600">Yes</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Sticky Bottom Footer - Updated similar to PDF to Word */}
//       <div className="flex-shrink-0 border-t bg-gray-50 sticky bottom-0">
//         <div className="p-6">

//           {/* Submit Button or Password Message */}
//           {isPasswordProtectedAndLocked ? (
//             <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-center">
//               <IoMdLock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
//               <p className="text-sm text-yellow-700 mb-3">
//                 Please unlock this password-protected PDF first
//               </p>
//               <button
//                 onClick={() => router.push('/unlock-pdf')}
//                 className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
//               >
//                 Unlock PDF
//                 <ExternalLink className="w-4 h-4" />
//               </button>
//             </div>
//           ) : (
//             <>
//               <button
//                 onClick={handleSign}
//                 disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading}
//                 className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading
//                   ? "bg-gray-300 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
//                   }`}
//               >
//                 {isUploading ? (
//                   <>
//                     <RefreshCw className="w-5 h-5 animate-spin" />
//                     Signing...
//                   </>
//                 ) : (
//                   <>
//                     Sign
//                     <ChevronRight className="w-5 h-5" />
//                   </>
//                 )}
//               </button>
//               {signatureFields.length === 0 && (
//                 <p className="text-xs text-gray-500 text-center mt-2">Add signature fields to continue</p>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   )

//   // SafeFileUploader wrapper
//   const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => {
//     return <FileUploader {...safeProps} />
//   }

//   // Cleanup on unmount
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
//         pageTitle="Sign PDF"
//         pageSubTitle="Upload a PDF document to add your signature and send for signing!"
//         maxSize={LIMITS.MAX_SIZE_MB}
//       />
//     )
//   }

//   const { stableData } = selectedFile
//   const fileUrl = stableData?.dataUrl

//   return (
//     <div className="h-full flex flex-col">
//       <div className="flex flex-1 overflow-hidden">
//         {/* Main Content - PDF Viewer with Sidebar */}
//         <div className="flex-1 flex overflow-hidden mb-20 md:mb-0">
//           {/* Left Sidebar - Page Thumbnails - Responsive */}
//           <div className="hidden lg:flex w-48 xl:w-56 bg-gray-50 border-r border-gray-200 flex-col overflow-y-auto custom-scrollbar">
//             {/* Page Thumbnails */}
//             <div className="flex-1 p-3 xl:p-4 px-4 xl:px-5">
//               {fileUrl && !isPasswordProtectedAndLocked && (
//                 <Document file={fileUrl} options={documentOptions} className="contents">
//                   {Array.from(new Array(numPages), (el, index) => {
//                     const pageNum = index + 1
//                     const isCurrentPage = pageNum === currentPage

//                     return (
//                       <div
//                         key={`thumb_${pageNum}`}
//                         className={`mb-2 cursor-pointer`}
//                         onClick={() => setCurrentPage(pageNum)}
//                       >
//                         <div
//                           className={`border-2 rounded ${isCurrentPage ? "border-blue-500" : "border-gray-200"
//                             } bg-white overflow-hidden`}
//                         >
//                           <Page
//                             pageNumber={pageNum}
//                             width={140}
//                             renderTextLayer={false}
//                             renderAnnotationLayer={false}
//                             className="pointer-events-none"
//                             loading={
//                               <div className="w-[140px] h-[180px] bg-gray-100 flex items-center justify-center">
//                                 <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
//                               </div>
//                             }
//                           />
//                         </div>
//                         <div className="text-center mt-1">
//                           <span className="text-xs xl:text-sm font-medium text-gray-700">{pageNum}</span>
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </Document>
//               )}
//               {isPasswordProtectedAndLocked && (
//                 <div className="flex items-center justify-center h-full">
//                   <div className="text-center">
//                     <IoMdLock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//                     <p className="text-sm text-gray-500">Password protected</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Main PDF Viewer - Responsive */}
//           <div className="flex-1 flex flex-col min-w-0">
//             {isPasswordProtectedAndLocked ? (
//               <div className="flex-1 flex items-center justify-center bg-gray-50">
//                 <div className="text-center">
//                   <IoMdLock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                   <h3 className="text-xl font-semibold text-gray-700 mb-2">Password Protected PDF</h3>
//                   <p className="text-gray-500 mb-4">Please unlock this PDF to view and add signature fields.</p>
//                   <button
//                     onClick={() => router.push('/unlock-pdf')}
//                     className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
//                   >
//                     Unlock PDF
//                     <ExternalLink className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <PDFSignViewer
//                 fileUrl={selectedFile.stableData?.dataUrl}
//                 fileId={selectedFile.id}
//                 signatureFields={signatureFields}
//                 addSignatureField={addSignatureField}
//                 updateSignatureField={updateSignatureField}
//                 removeSignatureField={removeSignatureField}
//                 currentPage={currentPage}
//                 setCurrentPage={setCurrentPage}
//                 zoomLevel={zoomLevel}
//                 setZoomLevel={setZoomLevel}
//                 numPages={numPages}
//                 setNumPages={setNumPages}
//                 onDocumentLoadSuccess={onDocumentLoadSuccess}
//                 onDocumentLoadError={onDocumentLoadError}
//                 isPasswordProtected={selectedFile.stableData?.isPasswordProtected || false}
//                 password={pdfPassword}
//                 onCopyField={handleCopyField}
//                 signatureData={signatureData}
//                 onOpenSignatureModal={handleOpenSignatureModal}
//                 focusedFieldId={focusedFieldId}
//                 setFocusedFieldId={setFocusedFieldId}
//               />
//             )}
//           </div>

//           {/* Desktop Sidebar - Increased width and responsive */}
//           <div className="hidden md:flex w-[380px] lg:w-[420px] xl:w-[460px] border-l bg-white h-[calc(100vh-50px)]">
//             <SigningSidebar />
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar - Updated */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         {isPasswordProtectedAndLocked ? (
//           <button
//             onClick={() => router.push('/unlock-pdf')}
//             className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-yellow-600 hover:bg-yellow-700 transition-all duration-200 flex items-center justify-center gap-2"
//           >
//             <IoMdLock className="w-4 h-4" />
//             Unlock PDF
//             <ExternalLink className="w-4 h-4" />
//           </button>
//         ) : (
//           <button
//             onClick={handleSign}
//             disabled={!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading}
//             className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || !pdfHealthCheck || numPages === 0 || signatureFields.length === 0 || isUploading
//               ? "bg-gray-300 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700"
//               }`}
//           >
//             {isUploading ? (
//               <>
//                 <RefreshCw className="w-4 h-4 animate-spin" />
//                 Signing...
//               </>
//             ) : (
//               <>
//                 Sign
//                 <ChevronRight className="w-4 h-4" />
//               </>
//             )}
//           </button>
//         )}
//         <button
//           onClick={() => setShowMobileSidebar(true)}
//           className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
//           title="Settings"
//         >
//           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//             />
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//           </svg>
//         </button>
//       </div>

//       {/* Mobile Sidebar - Improved responsive design */}
//       {showMobileSidebar && (
//         <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
//           <div className="absolute right-0 top-0 h-full w-[90vw] max-w-sm bg-white shadow-lg">
//             <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
//               <h2 className="text-lg font-semibold">Settings</h2>
//               <button onClick={() => setShowMobileSidebar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//             <div className="h-[calc(100vh-73px)] overflow-hidden">
//               <SigningSidebar isMobile={true} />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Password Modal */}
//       <PasswordModal
//         isOpen={showPasswordModal}
//         onClose={() => {
//           setShowPasswordModal(false)
//           removeFile()
//         }}
//         passwordProtectedFiles={selectedFile ? [{ id: selectedFile.id, name: selectedFile.name }] : []}
//         onSubmit={handlePasswordSubmit}
//       />

//       {/* Signing Options Modal */}
//       <SigningOptionsModal
//         isOpen={showSigningModal}
//         onClose={() => setShowSigningModal(false)}
//         onModeSelect={handleSigningModeSelect}
//         signingMode={signingMode}
//         signers={signers}
//         onAddSigner={handleAddSigner}
//         onRemoveSigner={handleRemoveSigner}
//         onUpdateSigner={handleUpdateSigner}
//         fileName={selectedFile?.name}
//         onSettingsSave={handleSettingsSave}
//       />

//       {/* Placement Modal */}
//       <PlacementModal
//         isOpen={showPlacementModal}
//         onClose={() => setShowPlacementModal(false)}
//         onApply={handlePlacementApply}
//         fileName={selectedFile?.name}
//         numPages={numPages}
//       />

//       <SignatureModal
//         isOpen={showSignatureModal}
//         onClose={() => setShowSignatureModal(false)}
//         onSave={handleSignatureDataSave}
//         fieldType={currentFieldType}
//         initialData={signatureData}
//       />
//     </div>
//   )
// }
