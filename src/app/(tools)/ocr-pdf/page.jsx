"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { FileText, X, ArrowRight, Settings, RefreshCw, Search, ChevronDown } from "lucide-react"
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
  MAX_PAGES: 1000
}

// Language options for OCR
const LANGUAGE_OPTIONS = [
  { code: "afr", name: "Afrikaans" },
  { code: "sqi", name: "Albanian" },
  { code: "amh", name: "Amharic" },
  { code: "ara", name: "Arabic" },
  { code: "hye", name: "Armenian" },
  { code: "asm", name: "Assamese" },
  { code: "aze", name: "Azerbaijani" },
  { code: "aze_cyrl", name: "Azerbaijani - Cyrillic" },
  { code: "eus", name: "Basque" },
  { code: "bel", name: "Belarusian" },
  { code: "ben", name: "Bengali" },
  { code: "bod", name: "Tibetan" },
  { code: "bos", name: "Bosnian" },
  { code: "bre", name: "Breton" },
  { code: "bul", name: "Bulgarian" },
  { code: "cat", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "ces", name: "Czech" },
  { code: "chi_sim", name: "Chinese - Simplified" },
  { code: "chi_tra", name: "Chinese - Traditional" },
  { code: "chr", name: "Cherokee" },
  { code: "cos", name: "Corsican" },
  { code: "cym", name: "Welsh" },
  { code: "dan", name: "Danish" },
  { code: "deu", name: "German" },
  { code: "dzo", name: "Dzongkha" },
  { code: "ell", name: "Greek" },
  { code: "eng", name: "English" },
  { code: "enm", name: "English, Middle" },
  { code: "epo", name: "Esperanto" },
  { code: "est", name: "Estonian" },
  { code: "fao", name: "Faroese" },
  { code: "fas", name: "Persian" },
  { code: "fil", name: "Filipino" },
  { code: "fin", name: "Finnish" },
  { code: "fra", name: "French" },
  { code: "frk", name: "German Fraktur" },
  { code: "frm", name: "French, Middle" },
  { code: "fry", name: "Western Frisian" },
  { code: "gla", name: "Scottish Gaelic" },
  { code: "gle", name: "Irish" },
  { code: "glg", name: "Galician" },
  { code: "grc", name: "Greek, Ancient" },
  { code: "guj", name: "Gujarati" },
  { code: "hat", name: "Haitian" },
  { code: "heb", name: "Hebrew" },
  { code: "hin", name: "Hindi" },
  { code: "hrv", name: "Croatian" },
  { code: "hun", name: "Hungarian" },
  { code: "iku", name: "Inuktitut" },
  { code: "ind", name: "Indonesian" },
  { code: "isl", name: "Icelandic" },
  { code: "ita", name: "Italian" },
  { code: "ita_old", name: "Italian - Old" },
  { code: "jav", name: "Javanese" },
  { code: "jpn", name: "Japanese" },
  { code: "kan", name: "Kannada" },
  { code: "kat", name: "Georgian" },
  { code: "kat_old", name: "Georgian - Old" },
  { code: "kaz", name: "Kazakh" },
  { code: "khm", name: "Central Khmer" },
  { code: "kir", name: "Kirghiz" },
  { code: "kor", name: "Korean" },
  { code: "kor_vert", name: "Korean (vertical)" },
  { code: "kur", name: "Kurdish" },
  { code: "lao", name: "Lao" },
  { code: "lat", name: "Latin" },
  { code: "lav", name: "Latvian" },
  { code: "lit", name: "Lithuanian" },
  { code: "ltz", name: "Luxembourgish" },
  { code: "mal", name: "Malayalam" },
  { code: "mar", name: "Marathi" },
  { code: "mkd", name: "Macedonian" },
  { code: "mlt", name: "Maltese" },
  { code: "mon", name: "Mongolian" },
  { code: "mri", name: "Maori" },
  { code: "msa", name: "Malay" },
  { code: "mya", name: "Myanmar" },
  { code: "nep", name: "Nepali" },
  { code: "nld", name: "Dutch" },
  { code: "nor", name: "Norwegian" },
  { code: "oci", name: "Occitan" },
  { code: "ori", name: "Oriya" },
  { code: "pan", name: "Panjabi" },
  { code: "pol", name: "Polish" },
  { code: "por", name: "Portuguese" },
  { code: "pus", name: "Pushto" },
  { code: "que", name: "Quechua" },
  { code: "ron", name: "Romanian" },
  { code: "rus", name: "Russian" },
  { code: "san", name: "Sanskrit" },
  { code: "sin", name: "Sinhala" },
  { code: "slk", name: "Slovak" },
  { code: "slv", name: "Slovenian" },
  { code: "snd", name: "Sindhi" },
  { code: "spa", name: "Spanish" },
  { code: "spa_old", name: "Spanish - Old" },
  { code: "srp", name: "Serbian" },
  { code: "srp_latn", name: "Serbian - Latin" },
  { code: "sun", name: "Sundanese" },
  { code: "swa", name: "Swahili" },
  { code: "swe", name: "Swedish" },
  { code: "syr", name: "Syriac" },
  { code: "tam", name: "Tamil" },
  { code: "tat", name: "Tatar" },
  { code: "tel", name: "Telugu" },
  { code: "tgk", name: "Tajik" },
  { code: "tha", name: "Thai" },
  { code: "tir", name: "Tigrinya" },
  { code: "ton", name: "Tonga" },
  { code: "tur", name: "Turkish" },
  { code: "uig", name: "Uighur" },
  { code: "ukr", name: "Ukrainian" },
  { code: "urd", name: "Urdu" },
  { code: "uzb", name: "Uzbek" },
  { code: "uzb_cyrl", name: "Uzbek - Cyrillic" },
  { code: "vie", name: "Vietnamese" },
  { code: "yid", name: "Yiddish" },
  { code: "yor", name: "Yoruba" },
]

// Utility functions
const createFileId = (index) => Date.now() + index + Math.random()
const formatFileSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB"

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

    if (pdfDocumentCache.current[id]) {
      try {
        if (pdfDocumentCache.current[id].destroy) {
          pdfDocumentCache.current[id].destroy()
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e)
      }
      delete pdfDocumentCache.current[id]
    }
  }, [])

  const cleanupAll = useCallback(() => {
    Object.values(fileDataCache.current).forEach(data => {
      if (data.dataUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(data.dataUrl)
      }
    })
    Object.values(pdfDocumentCache.current).forEach(doc => {
      try {
        if (doc.destroy) {
          doc.destroy()
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e)
      }
    })
  }, [])

  return { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll }
}

// Language Selector Component
const LanguageSelector = memo(({ selectedLanguages, onLanguageChange, searchTerm, onSearchChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return LANGUAGE_OPTIONS
    return LANGUAGE_OPTIONS.filter((lang) => lang.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLanguageToggle = useCallback((language) => {
    const isSelected = selectedLanguages.some((lang) => lang.code === language.code)
    if (isSelected) {
      onLanguageChange(selectedLanguages.filter((lang) => lang.code !== language.code))
    } else {
      if (selectedLanguages.length >= 3) return
      onLanguageChange([...selectedLanguages, language])
    }
  }, [selectedLanguages, onLanguageChange])

  const removeLanguage = useCallback((languageCode) => {
    onLanguageChange(selectedLanguages.filter((lang) => lang.code !== languageCode))
  }, [selectedLanguages, onLanguageChange])

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedLanguages.map((lang) => (
            <div key={lang.code} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {lang.name}
              <button onClick={() => removeLanguage(lang.code)} className="hover:bg-blue-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search languages..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        />
        <button onClick={() => setIsOpen(!isOpen)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((language) => {
              const isSelected = selectedLanguages.some((lang) => lang.code === language.code)
              const isDisabled = !isSelected && selectedLanguages.length >= 3
              return (
                <div
                  key={language.code}
                  onClick={() => !isDisabled && handleLanguageToggle(language)}
                  className={`px-4 py-2 flex items-center gap-3 ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"} ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600" : isDisabled ? "border-gray-200" : "border-gray-300"}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                  </div>
                  <span className={`text-sm ${isSelected ? "text-blue-800 font-medium" : isDisabled ? "text-gray-400" : "text-gray-700"}`}>
                    {language.name}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No languages found</div>
          )}
        </div>
      )}
    </div>
  )
})

// PDF Preview Component
const PDFPreview = memo(({ file, onRemove, isHealthy, isPasswordProtected, onLoadSuccess, onLoadError }) => {
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

  const handleLoadError = useCallback((error) => {
    setHasError(true)
    onLoadError(error, file.id)
  }, [file.id, onLoadError])

  const handleLoadSuccess = useCallback((pdf) => {
    setHasError(false)
    onLoadSuccess(pdf, file.id)
  }, [file.id, onLoadSuccess])

  const renderPreview = () => {
    if (isPasswordProtected) {
      return (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
          <IoMdLock className="text-4xl text-gray-600" />
          <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
            ))}
          </div>
        </div>
      )
    }

    if (!isVisible || hasError || !isHealthy) {
      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
          <div className="relative">
            <div className="w-16 h-20 bg-blue-600 rounded-lg flex items-center justify-center relative">
              <FileText className="w-10 h-10 text-white" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
          {!isHealthy && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Preview Issue
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
        <Document
          file={file.stableData?.dataUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={<RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />}
          error={
            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
              <FileText className="w-12 h-12 text-red-400 mb-2" />
              <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
            </div>
          }
          options={{
            cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
          }}
        >
          <Page
            pageNumber={1}
            width={180}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<div className="w-[180px] h-[240px] bg-gray-100 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-gray-400 animate-spin" /></div>}
          />
        </Document>
      </div>
    )
  }

  const borderClasses = isPasswordProtected
    ? "border-yellow-300 bg-yellow-50"
    : isHealthy
      ? "border-gray-200 hover:border-blue-300 hover:shadow-lg"
      : "border-yellow-300 bg-yellow-50"

  return (
    <div ref={elementRef} className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${borderClasses}`}>
      <div className="relative h-56 p-3 pt-10">
        <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>
        <div className="absolute top-1 right-2 flex gap-1 z-30">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(file.id) }}
            className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
            title="Remove file"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
          <p className="text-xs text-gray-500 mt-1">{file.size}</p>
        </div>
      </div>
    </div>
  )
})

const FileInfoSection = ({ files, totalSize, totalPages, selectedLanguages }) => (
  <div className="mb-6">
    <h4 className="font-semibold text-blue-900 mb-3">Processing Information</h4>
    <div className="space-y-2 text-sm">
      {[
        ["Files selected:", files.length],
        ["Total size:", `${totalSize} MB`],
        ["Total pages:", `${totalPages} pages`],
        ["Languages:", selectedLanguages.length],
        ["Input format:", "PDF"],
        ["Output format:", "Text files"]
      ].map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-blue-700">{label}</span>
          <span className="font-semibold text-blue-900">{value}</span>
        </div>
      ))}
    </div>
  </div>
)

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

const Sidebar = ({ files, totalSize, totalPages, hasUnhealthyFiles, passwordProtectedFiles, limitsExceeded, selectedLanguages, onLanguageChange, languageSearchTerm, onLanguageSearchChange, onOCR }) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className="p-6 flex-1">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">OCR PDF Processor</h3>

      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          Extract text from your PDF files using OCR technology. Select document languages for better accuracy.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-blue-900">Document Languages</h4>
          <span className="text-sm text-blue-500">{selectedLanguages.length}/3</span>
        </div>
        <LanguageSelector
          selectedLanguages={selectedLanguages}
          onLanguageChange={onLanguageChange}
          searchTerm={languageSearchTerm}
          onSearchChange={onLanguageSearchChange}
        />
      </div>

      {hasUnhealthyFiles && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Some files have preview issues but can still be processed. Check the yellow-highlighted files.
          </p>
        </div>
      )}

      {passwordProtectedFiles > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            {passwordProtectedFiles} password-protected file{passwordProtectedFiles > 1 ? "s" : ""} detected. Passwords will be required for processing.
          </p>
        </div>
      )}

      {files.length > 0 && (
        <FileInfoSection
          files={files}
          totalSize={totalSize}
          totalPages={totalPages}
          selectedLanguages={selectedLanguages}
        />
      )}
    </div>

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      {!limitsExceeded.hasAnyExceeded ? (
        <button
          onClick={onOCR}
          disabled={files.length === 0 || selectedLanguages.length === 0}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && selectedLanguages.length > 0
              ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Apply OCR <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <LimitsExceeded
          limitsExceeded={limitsExceeded}
          files={files}
          totalSize={totalSize}
          totalPages={totalPages}
        />
      )}
      {(files.length === 0 || selectedLanguages.length === 0) && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {files.length === 0 ? "Select PDF files to process" : "Select at least one language"}
        </p>
      )}
    </div>
  </div>
)

// Main Component
export default function OCRPDFPage() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pdfPages, setPdfPages] = useState({})
  const [pdfHealthCheck, setPdfHealthCheck] = useState({})
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState([{ code: "eng", name: "English" }])
  const [languageSearchTerm, setLanguageSearchTerm] = useState("")
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const { fileDataCache, pdfDocumentCache, cleanupFile, cleanupAll } = useFileCache()
  const router = useRouter()

  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      try {
        const loadingTask = pdfjs.getDocument({ data: uint8Array, password: "" })
        await loadingTask.promise
        return false
      } catch (pdfError) {
        if (pdfError.name === "PasswordException" || pdfError.message?.includes("password") || pdfError.message?.includes("encrypted")) {
          setPasswordProtectedFiles(prev => new Set([...prev, id]))
          return true
        }
        return false
      }
    } catch (error) {
      console.warn("Error checking password protection:", error)
      return false
    }
  }, [])

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

  const handleFiles = useCallback(async (newFiles) => {
    const fileObjects = await Promise.all(
      newFiles.map(async (file, index) => {
        const id = createFileId(index)
        const stableData = await createStableFileData(file, id)

        setPdfHealthCheck(prev => ({ ...prev, [id]: true }))

        return {
          id,
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          stableData,
        }
      })
    )
    setFiles(prev => [...prev, ...fileObjects])
  }, [createStableFileData])

  const removeFile = useCallback((id) => {
    cleanupFile(id)
    setPasswordProtectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    setPdfHealthCheck(prev => { const { [id]: removed, ...rest } = prev; return rest })
    setFiles(prev => prev.filter(file => file.id !== id))
    setPdfPages(prev => { const { [id]: removed, ...rest } = prev; return rest })
  }, [cleanupFile])

  const sortFilesByName = useCallback((order = "asc") => {
    setFiles(prev => [...prev].sort((a, b) =>
      order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ))
  }, [])

  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    setPdfPages(prev => ({ ...prev, [fileId]: pdf.numPages }))
    pdfDocumentCache.current[fileId] = pdf
    setPdfHealthCheck(prev => ({ ...prev, [fileId]: true }))
  }, [pdfDocumentCache])

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error)
    setPdfHealthCheck(prev => ({ ...prev, [fileId]: false }))
  }, [])

  const handlePasswordSubmit = useCallback(async (passwords) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append("files", file.file))

      const languageCodes = selectedLanguages.map(lang => lang.code)
      formData.append("languages", JSON.stringify(languageCodes))

      const filePasswords = {}
      files.forEach(file => {
        if (passwordProtectedFiles.has(file.id)) {
          filePasswords[file.name] = passwords[file.id] || ""
        }
      })
      formData.append("passwords", JSON.stringify(filePasswords))

      const response = await Api.post("/tools/ocr-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedZipPath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=ocr-pdf`
        router.push(downloadUrl)
      } else {
        toast.error("No OCR files received from server")
      }
    } catch (error) {
      console.error("OCR error:", error)
      toast.error(error?.response?.data?.message || "Error processing OCR")
    } finally {
      setIsUploading(false)
    }
  }, [files, selectedLanguages, passwordProtectedFiles, router])

  const handleOCR = useCallback(async () => {
    if (files.length === 0) return
    if (selectedLanguages.length === 0) {
      toast.error("Please select at least one language for OCR")
      return
    }

    const currentProtectedFiles = files.filter(file => passwordProtectedFiles.has(file.id))
    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true)
      return
    }

    await handlePasswordSubmit({})
  }, [files, selectedLanguages, passwordProtectedFiles, handlePasswordSubmit])

  // Computed values
  const totalSize = useMemo(() => files.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(2), [files])

  const totalPages = useMemo(() => Object.values(pdfPages).reduce((total, pages) => total + pages, 0), [pdfPages])

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

  const hasUnhealthyFiles = useMemo(() => Object.values(pdfHealthCheck).some(health => health === false), [pdfHealthCheck])

  const protectedFilesForModal = useMemo(() => files.filter(file => passwordProtectedFiles.has(file.id)), [files, passwordProtectedFiles])

  const SafeFileUploader = ({ whiletap, whileHover, animate, initial, ...safeProps }) => <FileUploader {...safeProps} />

  useEffect(() => {
    return cleanupAll
  }, [cleanupAll])

  if (isUploading) return <ProgressScreen uploadProgress={uploadProgress} />

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
        pageTitle="OCR PDF Processor"
        pageSubTitle="Extract text from your PDF files using OCR technology. Select document languages for better accuracy!"
        maxFiles={LIMITS.MAX_FILES}
        maxSize={LIMITS.MAX_SIZE_MB}
      />
    )
  }

  const sidebarProps = {
    files,
    totalSize,
    totalPages,
    hasUnhealthyFiles,
    passwordProtectedFiles: passwordProtectedFiles.size,
    limitsExceeded,
    selectedLanguages,
    onLanguageChange: setSelectedLanguages,
    languageSearchTerm,
    onLanguageSearchChange: setLanguageSearchTerm,
    onOCR: handleOCR
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-[100%]">
        {/* Main Content */}
        <div className="p-4 md:col-span-7 bg-gray-50 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>
            <SafeFileUploader
              isMultiple={true}
              onFilesSelect={handleFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              allowedTypes={[".pdf"]}
              showFiles={true}
              onSort={sortFilesByName}
              selectedCount={files?.length}
              pageTitle="OCR PDF Processor"
              pageSubTitle="Extract text from your PDF files using OCR technology. Select document languages for better accuracy!"
              maxFiles={LIMITS.MAX_FILES}
              maxSize={LIMITS.MAX_SIZE_MB}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {files.map(file => (
              <PDFPreview
                key={file.id}
                file={file}
                onRemove={removeFile}
                isHealthy={pdfHealthCheck[file.id] !== false}
                isPasswordProtected={passwordProtectedFiles.has(file.id)}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
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
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileSidebar(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar pb-16" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">OCR PDF</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Extract text from your PDF files using OCR technology. Select document languages for better accuracy.
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-blue-900">Document Languages</h4>
                    <span className="text-sm text-blue-500">{selectedLanguages.length}/3</span>
                  </div>
                  <LanguageSelector
                    selectedLanguages={selectedLanguages}
                    onLanguageChange={setSelectedLanguages}
                    searchTerm={languageSearchTerm}
                    onSearchChange={setLanguageSearchTerm}
                  />
                </div>

                {files.length > 0 && (
                  <FileInfoSection
                    files={files}
                    totalSize={totalSize}
                    totalPages={totalPages}
                    selectedLanguages={selectedLanguages}
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
                    onClick={handleOCR}
                    disabled={files.length === 0 || selectedLanguages.length === 0}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && selectedLanguages.length > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                      }`}
                  >
                    Apply OCR <ArrowRight className="w-4 h-4" />
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
// import { FileText, X, ArrowRight, RefreshCw, Search, ChevronDown } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"
// import ProgressScreen from "@/components/tools/ProgressScreen"
// import FileUploader from "@/components/tools/FileUploader"
// import Api from "@/utils/Api"
// import { toast } from "react-toastify"
// import PasswordModal from "@/components/tools/PasswordModal"
// import { IoMdLock } from "react-icons/io"

// // PDF.js worker setup
// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// // Language options for OCR
// const LANGUAGE_OPTIONS = [
//   { code: "afr", name: "Afrikaans" },
//   { code: "sqi", name: "Albanian" },
//   { code: "amh", name: "Amharic" },
//   { code: "ara", name: "Arabic" },
//   { code: "hye", name: "Armenian" },
//   { code: "asm", name: "Assamese" },
//   { code: "aze", name: "Azerbaijani" },
//   { code: "aze_cyrl", name: "Azerbaijani - Cyrillic" },
//   { code: "eus", name: "Basque" },
//   { code: "bel", name: "Belarusian" },
//   { code: "ben", name: "Bengali" },
//   { code: "bod", name: "Tibetan" },
//   { code: "bos", name: "Bosnian" },
//   { code: "bre", name: "Breton" },
//   { code: "bul", name: "Bulgarian" },
//   { code: "cat", name: "Catalan" },
//   { code: "ceb", name: "Cebuano" },
//   { code: "ces", name: "Czech" },
//   { code: "chi_sim", name: "Chinese - Simplified" },
//   { code: "chi_tra", name: "Chinese - Traditional" },
//   { code: "chr", name: "Cherokee" },
//   { code: "cos", name: "Corsican" },
//   { code: "cym", name: "Welsh" },
//   { code: "dan", name: "Danish" },
//   { code: "deu", name: "German" },
//   { code: "dzo", name: "Dzongkha" },
//   { code: "ell", name: "Greek" },
//   { code: "eng", name: "English" },
//   { code: "enm", name: "English, Middle" },
//   { code: "epo", name: "Esperanto" },
//   { code: "est", name: "Estonian" },
//   { code: "eus", name: "Basque" },
//   { code: "fao", name: "Faroese" },
//   { code: "fas", name: "Persian" },
//   { code: "fil", name: "Filipino" },
//   { code: "fin", name: "Finnish" },
//   { code: "fra", name: "French" },
//   { code: "frk", name: "German Fraktur" },
//   { code: "frm", name: "French, Middle" },
//   { code: "fry", name: "Western Frisian" },
//   { code: "gla", name: "Scottish Gaelic" },
//   { code: "gle", name: "Irish" },
//   { code: "glg", name: "Galician" },
//   { code: "grc", name: "Greek, Ancient" },
//   { code: "guj", name: "Gujarati" },
//   { code: "hat", name: "Haitian" },
//   { code: "heb", name: "Hebrew" },
//   { code: "hin", name: "Hindi" },
//   { code: "hrv", name: "Croatian" },
//   { code: "hun", name: "Hungarian" },
//   { code: "hye", name: "Armenian" },
//   { code: "iku", name: "Inuktitut" },
//   { code: "ind", name: "Indonesian" },
//   { code: "isl", name: "Icelandic" },
//   { code: "ita", name: "Italian" },
//   { code: "ita_old", name: "Italian - Old" },
//   { code: "jav", name: "Javanese" },
//   { code: "jpn", name: "Japanese" },
//   { code: "kan", name: "Kannada" },
//   { code: "kat", name: "Georgian" },
//   { code: "kat_old", name: "Georgian - Old" },
//   { code: "kaz", name: "Kazakh" },
//   { code: "khm", name: "Central Khmer" },
//   { code: "kir", name: "Kirghiz" },
//   { code: "kor", name: "Korean" },
//   { code: "kor_vert", name: "Korean (vertical)" },
//   { code: "kur", name: "Kurdish" },
//   { code: "lao", name: "Lao" },
//   { code: "lat", name: "Latin" },
//   { code: "lav", name: "Latvian" },
//   { code: "lit", name: "Lithuanian" },
//   { code: "ltz", name: "Luxembourgish" },
//   { code: "mal", name: "Malayalam" },
//   { code: "mar", name: "Marathi" },
//   { code: "mkd", name: "Macedonian" },
//   { code: "mlt", name: "Maltese" },
//   { code: "mon", name: "Mongolian" },
//   { code: "mri", name: "Maori" },
//   { code: "msa", name: "Malay" },
//   { code: "mya", name: "Myanmar" },
//   { code: "nep", name: "Nepali" },
//   { code: "nld", name: "Dutch" },
//   { code: "nor", name: "Norwegian" },
//   { code: "oci", name: "Occitan" },
//   { code: "ori", name: "Oriya" },
//   { code: "pan", name: "Panjabi" },
//   { code: "pol", name: "Polish" },
//   { code: "por", name: "Portuguese" },
//   { code: "pus", name: "Pushto" },
//   { code: "que", name: "Quechua" },
//   { code: "ron", name: "Romanian" },
//   { code: "rus", name: "Russian" },
//   { code: "san", name: "Sanskrit" },
//   { code: "sin", name: "Sinhala" },
//   { code: "slk", name: "Slovak" },
//   { code: "slv", name: "Slovenian" },
//   { code: "snd", name: "Sindhi" },
//   { code: "spa", name: "Spanish" },
//   { code: "spa_old", name: "Spanish - Old" },
//   { code: "sqi", name: "Albanian" },
//   { code: "srp", name: "Serbian" },
//   { code: "srp_latn", name: "Serbian - Latin" },
//   { code: "sun", name: "Sundanese" },
//   { code: "swa", name: "Swahili" },
//   { code: "swe", name: "Swedish" },
//   { code: "syr", name: "Syriac" },
//   { code: "tam", name: "Tamil" },
//   { code: "tat", name: "Tatar" },
//   { code: "tel", name: "Telugu" },
//   { code: "tgk", name: "Tajik" },
//   { code: "tha", name: "Thai" },
//   { code: "tir", name: "Tigrinya" },
//   { code: "ton", name: "Tonga" },
//   { code: "tur", name: "Turkish" },
//   { code: "uig", name: "Uighur" },
//   { code: "ukr", name: "Ukrainian" },
//   { code: "urd", name: "Urdu" },
//   { code: "uzb", name: "Uzbek" },
//   { code: "uzb_cyrl", name: "Uzbek - Cyrillic" },
//   { code: "vie", name: "Vietnamese" },
//   { code: "yid", name: "Yiddish" },
//   { code: "yor", name: "Yoruba" },
// ]

// // Custom Language Selector Component
// const LanguageSelector = memo(({ selectedLanguages, onLanguageChange, searchTerm, onSearchChange }) => {
//   const [isOpen, setIsOpen] = useState(false)
//   const dropdownRef = useRef(null)

//   // Filter languages based on search term
//   const filteredLanguages = useMemo(() => {
//     if (!searchTerm) return LANGUAGE_OPTIONS
//     return LANGUAGE_OPTIONS.filter((lang) => lang.name.toLowerCase().includes(searchTerm.toLowerCase()))
//   }, [searchTerm])

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false)
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   const handleLanguageToggle = useCallback(
//     (language) => {
//       const isSelected = selectedLanguages.some((lang) => lang.code === language.code)
//       if (isSelected) {
//         onLanguageChange(selectedLanguages.filter((lang) => lang.code !== language.code))
//       } else {
//         // Add limit check - maximum 3 languages
//         if (selectedLanguages.length >= 3) {
//           return // Just return without doing anything, no toast
//         }
//         onLanguageChange([...selectedLanguages, language])
//       }
//     },
//     [selectedLanguages, onLanguageChange],
//   )

//   const removeLanguage = useCallback(
//     (languageCode) => {
//       onLanguageChange(selectedLanguages.filter((lang) => lang.code !== languageCode))
//     },
//     [selectedLanguages, onLanguageChange],
//   )

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {/* Selected Languages Tags */}
//       {selectedLanguages.length > 0 && (
//         <div className="flex flex-wrap gap-2 mb-3">
//           {selectedLanguages.map((lang) => (
//             <div
//               key={lang.code}
//               className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
//             >
//               {lang.name}
//               <button onClick={() => removeLanguage(lang.code)} className="hover:bg-blue-200 rounded-full p-0.5">
//                 <X className="w-3 h-3" />
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Search Input */}
//       <div className="relative mb-3">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//         <input
//           type="text"
//           placeholder="Search languages..."
//           value={searchTerm}
//           onChange={(e) => onSearchChange(e.target.value)}
//           onFocus={() => setIsOpen(true)}
//           className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
//         />
//         <button onClick={() => setIsOpen(!isOpen)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
//           <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
//         </button>
//       </div>

//       {/* Dropdown */}
//       {isOpen && (
//         <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
//           {filteredLanguages.length > 0 ? (
//             filteredLanguages.map((language) => {
//               const isSelected = selectedLanguages.some((lang) => lang.code === language.code)
//               const isDisabled = !isSelected && selectedLanguages.length >= 3
//               return (
//                 <div
//                   key={language.code}
//                   onClick={() => !isDisabled && handleLanguageToggle(language)}
//                   className={`px-4 py-2 flex items-center gap-3 ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"
//                     } ${isSelected ? "bg-red-50" : ""}`}
//                 >
//                   <div
//                     className={`w-4 h-4 border-2 rounded flex items-center justify-center ${isSelected ? "bg-red-600 border-red-600" : isDisabled ? "border-gray-200" : "border-gray-300"
//                       }`}
//                   >
//                     {isSelected && <div className="w-2 h-2 bg-white rounded-sm"></div>}
//                   </div>
//                   <span
//                     className={`text-sm ${isSelected ? "text-red-800 font-medium" : isDisabled ? "text-gray-400" : "text-gray-700"
//                       }`}
//                   >
//                     {language.name}
//                   </span>
//                 </div>
//               )
//             })
//           ) : (
//             <div className="px-4 py-2 text-sm text-gray-500">No languages found</div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// })

// LanguageSelector.displayName = "LanguageSelector"

// // Memoized PDF Preview Component
// const PDFPreview = memo(({ file, isLoading, onLoadSuccess, onLoadError, onRemove, isHealthy, isPasswordProtected }) => {
//   const [isVisible, setIsVisible] = useState(false)
//   const [hasError, setHasError] = useState(false)
//   const elementRef = useRef(null)

//   // Individual intersection observer for each preview
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

//   const handleLoadError = useCallback(
//     (error) => {
//       setHasError(true)
//       onLoadError(error, file.id)
//     },
//     [file.id, onLoadError],
//   )

//   const handleLoadSuccess = useCallback(
//     (pdf) => {
//       setHasError(false)
//       onLoadSuccess(pdf, file.id)
//     },
//     [file.id, onLoadSuccess],
//   )

//   const renderPreview = () => {
//     // Show simplified lock icon for password-protected files
//     if (isPasswordProtected) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg">
//           <IoMdLock className="text-4xl" />
//           {/* Password dots */}
//           <div className="flex items-center gap-1 mt-2 bg-black rounded-full py-1 px-2">
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//             <div className="w-1 h-1 bg-white rounded-full"></div>
//           </div>
//         </div>
//       )
//     }

//     if (!isVisible || hasError || !isHealthy) {
//       return (
//         <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//           <FileText className="w-16 h-16 text-gray-400" />
//           <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">PDF</div>
//           {!isHealthy && (
//             <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
//               Preview Issue
//             </div>
//           )}
//         </div>
//       )
//     }

//     if (file.type === "application/pdf" && file.stableData) {
//       return (
//         <div className="w-full h-full relative flex justify-center items-center bg-gray-100 rounded-lg">
//           {!isLoading ? (
//             <Document
//               file={file.stableData.dataUrl}
//               onLoadSuccess={handleLoadSuccess}
//               onLoadError={handleLoadError}
//               loading={
//                 <div className="flex items-center justify-center">
//                   <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//                 </div>
//               }
//               error={
//                 <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
//                   <FileText className="w-12 h-12 text-red-400 mb-2" />
//                   <div className="text-sm text-red-600 font-medium text-center">Could not load preview</div>
//                 </div>
//               }
//               className="w-full h-full flex items-center justify-center border"
//               options={{
//                 cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//                 cMapPacked: true,
//                 standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
//               }}
//             >
//               <Page
//                 pageNumber={1}
//                 width={180}
//                 renderTextLayer={false}
//                 renderAnnotationLayer={false}
//                 className="border border-gray-200 shadow-sm"
//                 loading={
//                   <div className="w-[180px] h-[240px] bg-gray-100 flex items-center justify-center">
//                     <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
//                   </div>
//                 }
//               />
//             </Document>
//           ) : (
//             <div className="flex items-center justify-center">
//               <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//             </div>
//           )}
//         </div>
//       )
//     }

//     return (
//       <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg">
//         <FileText className="w-16 h-16 text-gray-400" />
//         <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
//           {file.type.split("/")[1]?.toUpperCase() || "FILE"}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div
//       ref={elementRef}
//       className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${isPasswordProtected
//           ? "border-yellow-300 bg-yellow-50"
//           : isHealthy
//             ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
//             : "border-yellow-300 bg-yellow-50"
//         }`}
//     >
//       {/* File Preview Area */}
//       <div className="relative h-56 p-3 pt-10">
//         <div className="w-full h-full relative overflow-hidden rounded-lg">{renderPreview()}</div>
//         {/* Remove Button */}
//         <div className="absolute top-1 right-2 flex gap-1 z-30">
//           <button
//             onClick={(e) => {
//               e.stopPropagation()
//               onRemove(file.id)
//             }}
//             className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
//             title="Remove file"
//           >
//             <X className="w-4 h-4 text-red-500" />
//           </button>
//         </div>
//       </div>

//       {/* File Info Footer */}
//       <div className="p-3 bg-gray-50 h-20 flex flex-col justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
//             {file.name}
//           </p>
//           <p className="text-xs text-gray-500 mt-1">{file.size}</p>
//         </div>
//       </div>
//     </div>
//   )
// })

// PDFPreview.displayName = "PDFPreview"

// export default function OCRPDFPage() {
//   const [files, setFiles] = useState([])
//   const [isDragOver, setIsDragOver] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [pdfPages, setPdfPages] = useState({})
//   const [loadingPdfs, setLoadingPdfs] = useState(new Set())
//   const [pdfHealthCheck, setPdfHealthCheck] = useState({})
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false)
//   const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(new Set())
//   const [showPasswordModal, setShowPasswordModal] = useState(false)
//   const [selectedLanguages, setSelectedLanguages] = useState([{ code: "eng", name: "English" }])
//   const [languageSearchTerm, setLanguageSearchTerm] = useState("")

//   const fileRefs = useRef({})
//   const fileDataCache = useRef({})
//   const pdfDocumentCache = useRef({})
//   const router = useRouter()

//   // Updated password protection check using PDF.js
//   const checkPasswordProtection = useCallback(async (file, id) => {
//     try {
//       const arrayBuffer = await file.arrayBuffer()
//       const uint8Array = new Uint8Array(arrayBuffer)

//       try {
//         // Try to load the PDF with PDF.js
//         const loadingTask = pdfjs.getDocument({
//           data: uint8Array,
//           password: "", // Empty password
//         })
//         const pdf = await loadingTask.promise
//         // If we reach here, PDF loaded successfully - not password protected
//         console.log(`File ${file.name} loaded successfully - not password protected`)
//         return false
//       } catch (pdfError) {
//         // Check if the error is specifically about password protection
//         if (
//           pdfError.name === "PasswordException" ||
//           pdfError.name === "MissingPDFException" ||
//           pdfError.message?.includes("password") ||
//           pdfError.message?.includes("encrypted")
//         ) {
//           console.log(`File ${file.name} requires password:`, pdfError.message)
//           setPasswordProtectedFiles((prev) => new Set([...prev, id]))
//           return true
//         }
//         // Other PDF errors don't necessarily mean password protection
//         console.warn(`PDF load error for ${file.name}:`, pdfError)
//         return false
//       }
//     } catch (error) {
//       console.warn("Error checking password protection with PDF.js:", error)
//       return false
//     }
//   }, [])

//   // Optimized file data creation with object URLs
//   const createStableFileData = useCallback(
//     async (file, id) => {
//       if (fileDataCache.current[id]) {
//         return fileDataCache.current[id]
//       }
//       try {
//         // Check for password protection first
//         const isPasswordProtected = await checkPasswordProtection(file, id)
//         if (isPasswordProtected) {
//           // For password protected files, don't create data URL to avoid browser prompt
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
//         // Use object URL instead of data URL for better performance
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

//   // Optimized file handling with batching
//   const handleFiles = useCallback(
//     async (newFiles) => {
//       const batchSize = 5 // Process files in batches
//       const fileObjects = []

//       for (let i = 0; i < newFiles.length; i += batchSize) {
//         const batch = newFiles.slice(i, i + batchSize)
//         const batchPromises = batch.map(async (file, index) => {
//           const id = Date.now() + i + index + Math.random()
//           const stableData = await createStableFileData(file, id)
//           return {
//             id,
//             file,
//             name: file.name,
//             size: (file.size / 1024 / 1024).toFixed(2) + " MB",
//             type: file.type,
//             stableData,
//           }
//         })

//         const batchResults = await Promise.all(batchPromises)
//         fileObjects.push(...batchResults)
//       }

//       setFiles((prev) => [...prev, ...fileObjects])
//     },
//     [createStableFileData],
//   )

//   // Optimized remove function with cleanup
//   const removeFile = useCallback((id) => {
//     // Clean up object URL
//     const fileData = fileDataCache.current[id]
//     if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(fileData.dataUrl)
//     }

//     // Clean up all other references
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     setPasswordProtectedFiles((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(id)
//       return newSet
//     })

//     delete fileDataCache.current[id]
//     if (pdfDocumentCache.current[id]) {
//       try {
//         if (pdfDocumentCache.current[id].destroy) {
//           pdfDocumentCache.current[id].destroy()
//         }
//       } catch (e) {
//         console.warn("PDF cleanup warning:", e)
//       }
//       delete pdfDocumentCache.current[id]
//     }

//     setPdfHealthCheck((prev) => {
//       const newHealth = { ...prev }
//       delete newHealth[id]
//       return newHealth
//     })

//     setFiles((prev) => prev.filter((file) => file.id !== id))
//     setPdfPages((prev) => {
//       const newPages = { ...prev }
//       delete newPages[id]
//       return newPages
//     })
//   }, [])

//   // Optimized sort function
//   const sortFilesByName = useCallback((order = "asc") => {
//     setFiles((prev) => {
//       const sorted = [...prev].sort((a, b) => {
//         if (order === "asc") {
//           return a.name.localeCompare(b.name)
//         } else {
//           return b.name.localeCompare(a.name)
//         }
//       })
//       return sorted
//     })
//   }, [])

//   // Optimized PDF load handlers
//   const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setPdfPages((prev) => ({
//       ...prev,
//       [fileId]: pdf.numPages,
//     }))

//     pdfDocumentCache.current[fileId] = pdf
//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: true,
//     }))
//   }, [])

//   const onDocumentLoadError = useCallback((error, fileId) => {
//     console.warn(`PDF load error for file ${fileId}:`, error)
//     setLoadingPdfs((prev) => {
//       const newSet = new Set(prev)
//       newSet.delete(fileId)
//       return newSet
//     })

//     setPdfHealthCheck((prev) => ({
//       ...prev,
//       [fileId]: false,
//     }))
//   }, [])

//   // Handle password submission
//   const handlePasswordSubmit = useCallback(
//     async (passwords) => {
//       setIsUploading(true)
//       setUploadProgress(0)

//       try {
//         const formData = new FormData()
//         files.forEach((file) => {
//           formData.append("files", file.file)
//         })

//         // Send selected languages
//         const languageCodes = selectedLanguages.map((lang) => lang.code)
//         formData.append("languages", JSON.stringify(languageCodes))

//         // Send passwords for protected files
//         const filePasswords = {}
//         files.forEach((file) => {
//           if (passwordProtectedFiles.has(file.id)) {
//             filePasswords[file.name] = passwords[file.id] || ""
//           }
//         })
//         formData.append("passwords", JSON.stringify(filePasswords))

//         const response = await Api.post("/tools/ocr-pdf", formData, {
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
//           const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=ocr-pdf`
//           router.push(downloadUrl)
//         } else {
//           toast.error("No OCR files received from server")
//         }
//       } catch (error) {
//         toast.error(error?.response?.data?.message || "Error processing OCR")
//       } finally {
//         setIsUploading(false)
//       }
//     },
//     [files, selectedLanguages, passwordProtectedFiles, router],
//   )

//   // Handle OCR processing
//   const handleOCR = useCallback(async () => {
//     if (files.length === 0) return
//     if (selectedLanguages.length === 0) {
//       toast.error("Please select at least one language for OCR")
//       return
//     }

//     // Get current password-protected files
//     const currentProtectedFiles = files.filter((file) => passwordProtectedFiles.has(file.id))
//     console.log("Password protected files found:", currentProtectedFiles.length)

//     if (currentProtectedFiles.length > 0) {
//       setShowPasswordModal(true)
//       return
//     }

//     // No password-protected files, proceed normally
//     await handlePasswordSubmit({})
//   }, [files, selectedLanguages, passwordProtectedFiles, handlePasswordSubmit])

//   // Memoized total size calculation
//   const totalSize = useMemo(
//     () => files.reduce((total, file) => total + Number.parseFloat(file.size), 0).toFixed(2),
//     [files],
//   )

//   // Memoized health check status
//   const hasUnhealthyFiles = useMemo(
//     () => Object.values(pdfHealthCheck).some((health) => health === false),
//     [pdfHealthCheck],
//   )

//   // Get password protected files for modal
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
//       // Clean up all object URLs
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
//         pageTitle="OCR PDF"
//         pageSubTitle="Extract text from your PDF files using OCR technology. Select the document languages for better accuracy!"
//       />
//     )
//   }

//   return (
//     <div className="md:h-[calc(100vh-82px)]">
//       <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
//         {/* Main Content */}
//         <div className="p-4 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">Selected Files ({files.length})</h2>
//             <SafeFileUploader
//               isMultiple={true}
//               onFilesSelect={handleFiles}
//               isDragOver={isDragOver}
//               setIsDragOver={setIsDragOver}
//               allowedTypes={[".pdf"]}
//               showFiles={true}
//               onSort={sortFilesByName}
//               selectedCount={files?.length}
//               pageTitle="OCR PDF"
//               pageSubTitle="Extract text from your PDF files using OCR technology. Select the document languages for better accuracy!"
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {files.map((file) => (
//               <div key={file.id} ref={(el) => (fileRefs.current[file.id] = el)}>
//                 <PDFPreview
//                   file={file}
//                   isLoading={loadingPdfs.has(file.id)}
//                   onLoadSuccess={onDocumentLoadSuccess}
//                   onLoadError={onDocumentLoadError}
//                   onRemove={removeFile}
//                   isHealthy={pdfHealthCheck[file.id] !== false}
//                   isPasswordProtected={passwordProtectedFiles.has(file.id)}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">OCR PDF options</h3>

//             {/* Help text */}
//             <div className="bg-blue-50 rounded-xl p-4 mb-6">
//               <p className="text-sm text-blue-800">
//                 The accuracy of detection is increased by correctly selecting the document's languages.
//               </p>
//             </div>

//             {/* Language Selection */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-lg font-semibold text-gray-900">Document languages</h4>
//                 <span className="text-sm text-gray-500">{selectedLanguages.length}/3</span>
//               </div>

//               <LanguageSelector
//                 selectedLanguages={selectedLanguages}
//                 onLanguageChange={setSelectedLanguages}
//                 searchTerm={languageSearchTerm}
//                 onSearchChange={setLanguageSearchTerm}
//               />
//             </div>

//             {hasUnhealthyFiles && (
//               <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                 <p className="text-sm text-yellow-800">
//                   Some files have preview issues but can still be processed. Check the yellow-highlighted files.
//                 </p>
//               </div>
//             )}

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
//                 <span className="text-gray-600">Files selected:</span>
//                 <span className="font-semibold text-gray-900">{files.length}</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Total size:</span>
//                 <span className="font-semibold text-gray-900">{totalSize} MB</span>
//               </div>
//               <div className="flex items-center justify-between text-sm">
//                 <span className="text-gray-600">Languages selected:</span>
//                 <span className="font-semibold text-gray-900">{selectedLanguages.length}</span>
//               </div>
//               {passwordProtectedFiles.size > 0 && (
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600">Password protected:</span>
//                   <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                 </div>
//               )}
//             </div>

//             <button
//               onClick={handleOCR}
//               disabled={files.length === 0 || selectedLanguages.length === 0}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && selectedLanguages.length > 0
//                   ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                   : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Apply OCR
//               <ArrowRight className="w-5 h-5" />
//             </button>
//             {(files.length === 0 || selectedLanguages.length === 0) && (
//               <p className="text-xs text-gray-500 text-center mt-2">
//                 {files.length === 0 ? "Select PDF files to process" : "Select at least one language"}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleOCR}
//           disabled={files.length === 0 || selectedLanguages.length === 0}
//           className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && selectedLanguages.length > 0
//               ? "bg-red-600 hover:bg-red-700"
//               : "bg-gray-300 cursor-not-allowed"
//             }`}
//         >
//           Apply OCR
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
//               <h3 className="text-xl font-bold text-gray-900">OCR PDF options</h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>
//             <div className="p-4">
//               <div className="p-6">
//                 {/* Help text */}
//                 <div className="bg-blue-50 rounded-xl p-4 mb-6">
//                   <p className="text-sm text-blue-800">
//                     The accuracy of detection is increased by correctly selecting the document's languages.
//                   </p>
//                 </div>

//                 {/* Language Selection */}
//                 <div className="mb-6">
//                   <div className="flex items-center justify-between mb-3">
//                     <h4 className="text-lg font-semibold text-gray-900">Document languages</h4>
//                     <span className="text-sm text-gray-500">{selectedLanguages.length}/3</span>
//                   </div>

//                   <LanguageSelector
//                     selectedLanguages={selectedLanguages}
//                     onLanguageChange={setSelectedLanguages}
//                     searchTerm={languageSearchTerm}
//                     onSearchChange={setLanguageSearchTerm}
//                   />
//                 </div>

//                 {hasUnhealthyFiles && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       Some files have preview issues but can still be processed. Check the yellow-highlighted files.
//                     </p>
//                   </div>
//                 )}

//                 {passwordProtectedFiles.size > 0 && (
//                   <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//                     <p className="text-sm text-yellow-800">
//                       {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""}{" "}
//                       detected. Passwords will be required for processing.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="p-6 border-t">
//                 <div className="space-y-4 mb-6">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Files selected:</span>
//                     <span className="font-semibold text-gray-900">{files.length}</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Total size:</span>
//                     <span className="font-semibold text-gray-900">{totalSize} MB</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600">Languages selected:</span>
//                     <span className="font-semibold text-gray-900">{selectedLanguages.length}</span>
//                   </div>
//                   {passwordProtectedFiles.size > 0 && (
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-gray-600">Password protected:</span>
//                       <span className="font-semibold text-yellow-600">{passwordProtectedFiles.size}</span>
//                     </div>
//                   )}
//                 </div>

//                 <button
//                   onClick={handleOCR}
//                   disabled={files.length === 0 || selectedLanguages.length === 0}
//                   className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0 && selectedLanguages.length > 0
//                       ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                       : "bg-gray-300 cursor-not-allowed"
//                     }`}
//                 >
//                   Apply OCR
//                   <ArrowRight className="w-5 h-5" />
//                 </button>
//                 {(files.length === 0 || selectedLanguages.length === 0) && (
//                   <p className="text-xs text-gray-500 text-center mt-2">
//                     {files.length === 0 ? "Select PDF files to process" : "Select at least one language"}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Password Modal */}
//       <PasswordModal
//         isOpen={showPasswordModal}
//         onClose={() => setShowMobileSidebar(false)}
//         passwordProtectedFiles={protectedFilesForModal}
//         onSubmit={handlePasswordSubmit}
//       />
//     </div>
//   )
// }
