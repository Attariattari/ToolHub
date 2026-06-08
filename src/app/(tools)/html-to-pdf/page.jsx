"use client"

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react"
import { useRouter } from "next/navigation"
import { ImageIcon, X, ArrowRight, Settings, RefreshCw, ChevronDown } from "lucide-react"
import { FaGlobe } from "react-icons/fa"
import ProgressScreen from "@/components/tools/ProgressScreen"
import Htmluploader from "@/components/tools/Htmluploader"
import Api from "@/utils/Api"
import { toast } from "react-toastify"

// Utility functions
const validateUrl = (url) => {
  const trimmedUrl = url?.trim()
  if (!trimmedUrl) return false

  const hasExtension = /\.(com|org|net|io|co|edu|gov|in|info|biz|app|xyz|pk|uk|ca|au|de|fr|jp|cn|br|ru|it|es)$/i.test(trimmedUrl)
  const hasProtocol = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
  const hasWWW = trimmedUrl.startsWith("www.")

  if (trimmedUrl && !hasProtocol && (hasWWW || hasExtension)) {
    return { isValid: true, formattedUrl: `https://${trimmedUrl}` }
  }

  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
  return { isValid: urlPattern.test(trimmedUrl), formattedUrl: trimmedUrl }
}

// Custom Dropdown Component
const CustomDropdown = memo(({ value, onChange, options, placeholder }) => {
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

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-blue-300 transition-colors duration-200"
      >
        <span className="text-gray-900 font-medium">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
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
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${value === option.value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-900"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

// Preview Component
const PreviewSection = memo(({ url, previewUrl, isLoadingPreview, previewError, onLoadPreview }) => {
  if (!url) return null

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        <div className="overflow-hidden flex-1 flex flex-col">
          <div className="relative flex-1 flex flex-col">
            {isLoadingPreview ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : previewError ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center text-gray-500">
                  <X className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p>Failed to load preview</p>
                  <button
                    onClick={onLoadPreview}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="w-full">
                <img
                  src={previewUrl}
                  alt="Website Preview"
                  className="w-full h-auto object-contain border rounded"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
})

// Settings Section Component
const SettingsSection = memo(({
  url, setUrl, isValid, onLoadPreview,
  screenSize, setScreenSize, screenSizeOptions,
  pageSize, setPageSize, pageSizeOptions,
  pageOrientation, setPageOrientation,
  margin, setMargin,
  blockAds, setBlockAds,
  removePopups, setRemovePopups,
  onReset,
  isMobile = false
}) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
      {!isMobile && (
        <>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">HTML to PDF Converter</h3>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              Convert any website to PDF with customizable options. Adjust screen size, orientation, margins, and more.
            </p>
          </div>
        </>
      )}

      {/* Website URL */}
      <div className="mb-6">
        <h4 className="font-semibold text-blue-900 mb-3">Website URL</h4>
        <div className="w-full flex">
          <div className={`flex items-stretch border ${!isValid && url ? "border-red-500" : "border-gray-300"
            } w-full bg-white overflow-hidden rounded-l-xl`}>
            <div className="w-10 flex justify-center items-center px-3">
              <FaGlobe className={isValid ? "text-blue-500" : "text-gray-500"} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Example: https://google.com"
              className="w-full px-3 py-2 bg-white focus:outline-none"
            />
          </div>
          <button
            onClick={onLoadPreview}
            disabled={!isValid}
            className="w-12 h-12 flex justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-r-xl"
          >
            <RefreshCw className="text-white w-5 h-5" />
          </button>
        </div>
        {!isValid && url && (
          <p className="text-red-500 text-sm mt-1">Invalid URL format</p>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-6">
        {/* Screen Size */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-blue-900">Screen size</h4>
            <button
              onClick={onReset}
              className="text-sm font-semibold underline text-blue-600 hover:text-blue-700"
            >
              Reset all
            </button>
          </div>
          <CustomDropdown
            value={screenSize}
            onChange={setScreenSize}
            options={screenSizeOptions}
            placeholder="Select Screen size"
          />
        </div>

        {/* Page Size */}
        <div>
          <h4 className="font-semibold text-blue-900 mb-3">Page size</h4>
          <CustomDropdown
            value={pageSize}
            onChange={setPageSize}
            options={pageSizeOptions}
            placeholder="Select page size"
          />
        </div>

        {/* Page Orientation */}
        <div>
          <h4 className="font-semibold text-blue-900 mb-3">Page orientation</h4>
          <div className="flex gap-3">
            {[
              { value: "portrait", label: "Portrait", dimensions: "w-8 h-10" },
              { value: "landscape", label: "Landscape", dimensions: "w-10 h-8" }
            ].map((orientation) => (
              <button
                key={orientation.value}
                onClick={() => setPageOrientation(orientation.value)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === orientation.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`${orientation.dimensions} border-2 rounded ${pageOrientation === orientation.value ? "border-blue-500" : "border-gray-400"
                    }`}></div>
                  <span className={`text-sm font-medium ${pageOrientation === orientation.value ? "text-blue-600" : "text-gray-600"
                    }`}>
                    {orientation.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Margin */}
        <div>
          <h4 className="font-semibold text-blue-900 mb-3">Margin</h4>
          <div className="flex gap-2">
            {[
              { value: "none", label: "No margin", icon: ImageIcon },
              { value: "small", label: "Small", border: "border-2 border-dashed" },
              { value: "big", label: "Big", border: "border-4 border-dashed" }
            ].map((marginOption) => (
              <button
                key={marginOption.value}
                onClick={() => setMargin(marginOption.value)}
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === marginOption.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {marginOption.icon ? (
                    <marginOption.icon className={`w-6 h-6 ${margin === marginOption.value ? "text-blue-500" : "text-gray-400"
                      }`} />
                  ) : (
                    <div className={`w-6 h-6 rounded ${marginOption.border} ${margin === marginOption.value ? "border-blue-500" : "border-gray-400"
                      }`}></div>
                  )}
                  <span className={`text-sm font-medium ${margin === marginOption.value ? "text-blue-600" : "text-gray-600"
                    }`}>
                    {marginOption.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* HTML Settings */}
        <div>
          <h4 className="font-semibold text-blue-900 mb-3">HTML Settings</h4>
          <div className="space-y-4">
            {[
              { key: "blockAds", value: blockAds, setter: setBlockAds, label: "Try to block ads" },
              { key: "removePopups", value: removePopups, setter: setRemovePopups, label: "Remove overlay popups" }
            ].map((setting) => (
              <label key={setting.key} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={setting.value}
                    onChange={(e) => setting.setter(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${setting.value ? "bg-green-500 border-green-500" : "border-gray-300"
                    }`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-gray-700 font-medium">{setting.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Update Preview Button */}
        <button
          onClick={onLoadPreview}
          disabled={!isValid}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isValid
              ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border-2 border-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
            }`}
        >
          <RefreshCw className="w-5 h-5" />
          Update Preview
        </button>
      </div>
    </div>
  </div>
))

// Sidebar Component
const Sidebar = ({ settingsProps, onConvert, isValid, url }) => (
  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
    <SettingsSection {...settingsProps} />

    <div className="flex-shrink-0 p-4 border-t bg-gray-50 sticky bottom-4">
      <button
        onClick={onConvert}
        disabled={!url || !isValid}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${url && isValid
            ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
            : "bg-gray-300 cursor-not-allowed"
          }`}
      >
        Convert to PDF <ArrowRight className="w-5 h-5" />
      </button>
      {(!url || !isValid) && (
        <p className="text-xs text-gray-500 text-center mt-2">Enter a valid URL to convert</p>
      )}
    </div>
  </div>
)

// Main Component
export default function HTMLToPDFPage() {
  const [url, setUrl] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [actualScreenWidth, setActualScreenWidth] = useState(1600)

  // PDF Options
  const [pageOrientation, setPageOrientation] = useState("portrait")
  const [margin, setMargin] = useState("none")
  const [pageSize, setPageSize] = useState("fit")
  const [screenSize, setScreenSize] = useState("pcscreen")
  const [blockAds, setBlockAds] = useState(false)
  const [removePopups, setRemovePopups] = useState(false)

  const router = useRouter()

  // Handle URL submission from Htmluploader component
  const handleUrlSubmit = useCallback((newUrl) => {
    const validation = validateUrl(newUrl)
    setUrl(validation.formattedUrl)

    // Auto-load preview when URL is first submitted
    if (validation.isValid) {
      setTimeout(() => {
        loadPreviewForNewUrl(validation.formattedUrl)
      }, 100)
    }
  }, [])

  // Update screen width
  useEffect(() => {
    const updateWidth = () => setActualScreenWidth(window.innerWidth)
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  // Validate URL
  const isValid = useMemo(() => validateUrl(url).isValid, [url])

  // Handle URL changes with auto-formatting
  const handleUrlChange = useCallback((newUrl) => {
    const validation = validateUrl(newUrl)
    if (validation.formattedUrl !== newUrl) {
      setUrl(validation.formattedUrl)
    } else {
      setUrl(newUrl)
    }
  }, [])

  // Load preview for new URL (separate from manual preview loading)
  const loadPreviewForNewUrl = useCallback(async (urlToLoad) => {
    setIsLoadingPreview(true)
    setPreviewError(false)

    try {
      const response = await Api.get(
        `/tools/html-preview?url=${encodeURIComponent(urlToLoad)}&screenSize=${screenSize}&blockAds=${blockAds}&removePopups=${removePopups}`,
        { responseType: 'blob' }
      )

      const imageBlob = new Blob([response.data], { type: 'image/png' })
      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewUrl(imageUrl)
    } catch (error) {
      setPreviewError(true)
      toast.error("Failed to load website preview")
    } finally {
      setIsLoadingPreview(false)
    }
  }, [screenSize, blockAds, removePopups])

  // Load preview manually
  const loadPreview = useCallback(async () => {
    if (!url || !isValid) return

    setIsLoadingPreview(true)
    setPreviewError(false)

    try {
      const response = await Api.get(
        `/tools/html-preview?url=${encodeURIComponent(url)}&screenSize=${screenSize}&blockAds=${blockAds}&removePopups=${removePopups}`,
        { responseType: 'blob' }
      )

      const imageBlob = new Blob([response.data], { type: 'image/png' })
      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewUrl(imageUrl)
    } catch (error) {
      setPreviewError(true)
      toast.error("Failed to load website preview")
    } finally {
      setIsLoadingPreview(false)
    }
  }, [url, isValid, screenSize, blockAds, removePopups])

  // Handle PDF conversion
  const handleConvert = useCallback(async () => {
    if (!url || !isValid) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await Api.post("/tools/html-to-pdf", {
        url,
        orientation: pageOrientation,
        margin,
        pageSize,
        screenSize,
        blockAds,
        removePopups,
      }, {
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total))
        },
      })

      if (response.data) {
        const encodedFilePath = encodeURIComponent(response.data.data.fileUrl)
        const downloadUrl = `/downloads/document=${encodedFilePath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=html-to-pdf`
        router.push(downloadUrl)
      } else {
        toast.error("No converted file received from server")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error converting website to PDF")
    } finally {
      setIsUploading(false)
    }
  }, [url, pageOrientation, margin, pageSize, screenSize, blockAds, removePopups, router, isValid])

  // Reset settings
  const handleReset = useCallback(() => {
    setScreenSize("pcscreen")
    setPageOrientation("portrait")
    setMargin("none")
    setPageSize("fit")
    setBlockAds(false)
    setRemovePopups(false)
  }, [])

  // Options
  const pageSizeOptions = useMemo(() => [
    { value: "fit", label: "Fit (Same page size as website)" },
    { value: "a4", label: "A4 (297x210 mm)" },
    { value: "letter", label: "US Letter (215x279.4 mm)" },
  ], [])

  const screenSizeOptions = useMemo(() => [
    { value: "pcscreen", label: `Your screen (${actualScreenWidth}px)` },
    { value: "desktophd", label: "Desktop HD (1920px)" },
    { value: "desktop", label: "Desktop (1440px)" },
    { value: "tablet", label: "Tablet (768px)" },
    { value: "mobile", label: "Mobile (320px)" },
  ], [actualScreenWidth])

  // Settings props
  const settingsProps = {
    url, setUrl: handleUrlChange, isValid, onLoadPreview: loadPreview,
    screenSize, setScreenSize, screenSizeOptions,
    pageSize, setPageSize, pageSizeOptions,
    pageOrientation, setPageOrientation,
    margin, setMargin,
    blockAds, setBlockAds,
    removePopups, setRemovePopups,
    onReset: handleReset
  }

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />
  }

  // Initial state - show URL input using Htmluploader
  if (!url) {
    return (
      <Htmluploader
        showurl={false}
        uploadButtonText="Add Website URL"
        pageTitle="HTML to PDF Converter"
        pageSubTitle="Convert any website to PDF with customizable options"
        onUrlSubmit={handleUrlSubmit}
      />
    )
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-[100%]">
        {/* Main Content */}
        <div className="md:col-span-7 bg-gray-50 overflow-y-auto custom-scrollbar">
          <PreviewSection
            url={url}
            previewUrl={previewUrl}
            isLoadingPreview={isLoadingPreview}
            previewError={previewError}
            onLoadPreview={loadPreview}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 flex-col bg-white border-l h-[calc(100vh-50px)]">
          <Sidebar
            settingsProps={settingsProps}
            onConvert={handleConvert}
            isValid={isValid}
            url={url}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileSidebar(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto custom-scrollbar pb-16" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">HTML to PDF</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="px-2">
                <SettingsSection {...settingsProps} isMobile={true} />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Footer */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleConvert}
                disabled={!url || !isValid}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${url && isValid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                Convert to PDF <ArrowRight className="w-4 h-4" />
              </button>
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
    </div>
  )
}

// "use client"
// import { useRouter } from "next/navigation";
// import ProgressScreen from "@/components/tools/ProgressScreen";
// import Htmluploader from "@/components/tools/Htmluploader";
// import { ImageIcon, X, ArrowRight, ChevronDown, RefreshCw } from "lucide-react";
// import { HiOutlineRefresh } from "react-icons/hi";
// import React, {
//   useCallback,
//   useRef,
//   useEffect,
//   useState,
// } from "react";
// import { FaGlobe } from "react-icons/fa";
// import { toast } from "react-toastify";
// import Api from "@/utils/Api";

// function HTMLToPDFPage() {
//   const [url, setUrl] = useState("");
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [isUploading, setIsUploading] = useState(false);
//   const [showMobileSidebar, setShowMobileSidebar] = useState(false);
//   const [isValid, setIsValid] = useState(false);
//   const [isLoadingPreview, setIsLoadingPreview] = useState(false);
//   const [previewError, setPreviewError] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [actualScreenWidth, setActualScreenWidth] = useState(1600);

//   // PDF Options
//   const [pageOrientation, setPageOrientation] = useState("portrait");
//   const [margin, setMargin] = useState("none");
//   const [pageSize, setPageSize] = useState("fit");
//   const [screenSize, setScreenSize] = useState("pcscreen");
//   const [blockAds, setBlockAds] = useState(false);
//   const [removePopups, setRemovePopups] = useState(false);

//   const router = useRouter();

//   // Handle URL submission from Htmluploader component
//   const handleUrlSubmit = useCallback((newUrl) => {
//     console.log("📩 URL received from uploader:", newUrl);
//     setUrl(newUrl);
//     setIsValid(true); // URL is already validated in Htmluploader
//   }, []);

//   // Update screen width
//   useEffect(() => {
//     const updateWidth = () => setActualScreenWidth(window.innerWidth);
//     updateWidth();
//     window.addEventListener("resize", updateWidth);
//     return () => window.removeEventListener("resize", updateWidth);
//   }, []);

//   // Handle PDF conversion
//   const handleConvert = useCallback(async () => {
//     if (!url || !isValid) return;

//     setIsUploading(true);
//     setUploadProgress(0);

//     try {
//       const response = await Api.post("/tools/html-to-pdf", {
//         url: url,
//         orientation: pageOrientation,
//         margin: margin,
//         pageSize: pageSize,
//         screenSize: screenSize,
//         blockAds: blockAds,
//         removePopups: removePopups,
//       }, {
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round(
//             (progressEvent.loaded * 100) / progressEvent.total
//           );
//           setUploadProgress(progress);
//         },
//       });

//       if (response.data) {
//         const encodedFilePath = encodeURIComponent(response.data.data.fileUrl);
//         const downloadUrl = `/downloads/document=${encodedFilePath}?dbTaskId=${response.data.data.dbTaskId}&tool-type=html-to-pdf`;
//         router.push(downloadUrl);
//       } else {
//         toast.error("No converted file received from server");
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Error converting website to PDF");
//     } finally {
//       setIsUploading(false);
//     }
//   }, [url, pageOrientation, margin, pageSize, screenSize, blockAds, removePopups, router, isValid]);

//   // Load preview manually when preview button is clicked
//   const loadPreview = useCallback(async () => {
//     if (!url || !isValid) return;

//     setIsLoadingPreview(true);
//     setPreviewError(false);

//     try {
//       const response = await Api.get(`/tools/html-preview?url=${encodeURIComponent(url)}&screenSize=${screenSize}&blockAds=${blockAds}&removePopups=${removePopups}`, {
//         responseType: 'blob'
//       });

//       const imageBlob = new Blob([response.data], { type: 'image/png' });
//       const imageUrl = URL.createObjectURL(imageBlob);
//       setPreviewUrl(imageUrl);
//     } catch (error) {
//       setPreviewError(true);
//       toast.error("Failed to load website preview");
//     } finally {
//       setIsLoadingPreview(false);
//     }
//   }, [url, isValid, screenSize, blockAds, removePopups]);

//   // Load initial preview when URL is set
//   useEffect(() => {
//     if (isValid && url) {
//       loadPreview();
//     } else {
//       setPreviewUrl("");
//     }
//   }, [url, isValid]); // Only trigger on URL change, not on filter changes

//   // URL validation for manual input
//   useEffect(() => {
//     const trimmedUrl = url.trim();

//     if (!trimmedUrl) {
//       setIsValid(false);
//       return;
//     }

//     // Check for common domain extensions
//     const hasExtension = /\.(com|org|net|io|co|edu|gov|in|info|biz|app|xyz|pk|uk|ca|au|de|fr|jp|cn|br|ru|it|es)$/i.test(trimmedUrl);
//     const hasProtocol = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
//     const hasWWW = trimmedUrl.startsWith("www.");

//     // Auto-add https:// if needed
//     if (trimmedUrl && !hasProtocol && (hasWWW || hasExtension)) {
//       const formattedUrl = hasWWW || hasExtension ? `https://${trimmedUrl}` : trimmedUrl;
//       if (formattedUrl !== url) {
//         setUrl(formattedUrl);
//         return;
//       }
//     }

//     // Basic URL validation
//     const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

//     setIsValid(urlPattern.test(trimmedUrl));
//   }, [url]);

//   const getIframeWidth = () => {
//     switch (screenSize) {
//       case "pcscreen":
//         return actualScreenWidth;
//       case "desktophd":
//         return 1920;
//       case "desktop":
//         return 1440;
//       case "tablet":
//         return 768;
//       case "mobile":
//         return 320;
//       default:
//         return "100%";
//     }
//   };

//   // Page size options
//   const pageSizeOptions = [
//     { value: "fit", label: "Fit (Same page size as website)" },
//     { value: "a4", label: "A4 (297x210 mm)" },
//     { value: "letter", label: "US Letter (215x279.4 mm)" },
//   ];

//   const ScreensizeOptions = [
//     { value: "pcscreen", label: `Your screen (${actualScreenWidth}px)` },
//     { value: "desktophd", label: "Desktop HD (1920px)" },
//     { value: "desktop", label: "Desktop (1440px)" },
//     { value: "tablet", label: "Tablet (768px)" },
//     { value: "mobile", label: "Mobile (320px)" },
//   ];

//   // Custom Dropdown Component
//   const CustomDropdown = ({ value, onChange, options, placeholder }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const dropdownRef = useRef(null);

//     useEffect(() => {
//       const handleClickOutside = (event) => {
//         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//           setIsOpen(false);
//         }
//       };

//       document.addEventListener("mousedown", handleClickOutside);
//       return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const selectedOption = options.find((opt) => opt.value === value);

//     return (
//       <div className="relative" ref={dropdownRef}>
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-red-300 transition-colors duration-200"
//         >
//           <span className="text-gray-900 font-medium">
//             {selectedOption ? selectedOption.label : placeholder}
//           </span>
//           <ChevronDown
//             className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
//           />
//         </button>

//         {isOpen && (
//           <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
//             {options.map((option) => (
//               <button
//                 key={option.value}
//                 onClick={() => {
//                   onChange(option.value);
//                   setIsOpen(false);
//                 }}
//                 className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${value === option.value
//                   ? "bg-red-50 text-red-600 font-medium"
//                   : "text-gray-900"
//                   }`}
//               >
//                 {option.label}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const handleResetScreen = () => {
//     setScreenSize("pcscreen");
//     setPageOrientation("landscape");
//     setMargin("none");
//     setPageSize("fit");
//     setBlockAds(false);
//     setRemovePopups(false);
//   };

//   if (isUploading) {
//     return <ProgressScreen uploadProgress={uploadProgress} />;
//   }

//   // Initial state - show URL input using Htmluploader
//   if (!url) {
//     return (
//       <Htmluploader
//         showurl={false}
//         uploadButtonText="Add Website URL"
//         pageTitle="HTML to PDF"
//         pageSubTitle="Convert any website to PDF with customizable options"
//         onUrlSubmit={handleUrlSubmit}
//       />
//     );
//   }

//   return (
//     <div className="md:h-[calc(100vh-82px)]">
//       <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
//         {/* Main Content - Preview */}
//         <div className="md:col-span-7 overflow-y-auto custom-scrollbar">
//           <div className="w-full min-h-[calc(100vh-90px)] flex flex-col justify-center items-center bg-gray-50 p-4">
//             <div className="w-full max-w-5xl flex-1 flex flex-col">
//               <div className="overflow-hidden flex-1 flex flex-col">
//                 <div className="relative flex-1 flex flex-col" style={{ width: "100%" }}>
//                   {isLoadingPreview ? (
//                     <div className="flex-1 flex justify-center items-center">
//                       <div className="text-center">
//                         <div className="w-10 h-10 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
//                         <p className="text-gray-600">Loading preview...</p>
//                       </div>
//                     </div>
//                   ) : previewError ? (
//                     <div className="flex-1 flex justify-center items-center">
//                       <div className="text-center text-gray-500">
//                         <X className="w-12 h-12 mx-auto mb-4 text-red-400" />
//                         <p>Failed to load preview</p>
//                         <button
//                           onClick={loadPreview}
//                           className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//                         >
//                           Retry
//                         </button>
//                       </div>
//                     </div>
//                   ) : previewUrl ? (
//                     <div className="w-full">
//                       <img
//                         src={previewUrl}
//                         alt="Website Preview"
//                         className="w-full h-auto object-contain border rounded"
//                       />
//                     </div>
//                   ) : null}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Desktop Sidebar */}
//         <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between bg-white">
//           <div className="p-6">
//             <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
//               HTML to PDF options
//             </h3>

//             {/* Website URL */}
//             <div className="mb-6 py-6">
//               <h4 className="font-semibold text-gray-900 mb-3">Website URL</h4>
//               <div className="w-full flex">
//                 <div className={`flex items-stretch border ${!isValid && url ? "border-red-500" : "border-gray-300"
//                   } w-full bg-white overflow-hidden rounded-l-xl`}>
//                   <div className="w-10 flex justify-center items-center px-3">
//                     <FaGlobe className={`${isValid ? "text-red-500" : "text-gray-500"}`} />
//                   </div>
//                   <input
//                     type="url"
//                     value={url}
//                     onChange={(e) => setUrl(e.target.value)}
//                     placeholder="Example: https://google.com"
//                     className="w-full px-3 py-2 bg-white focus:outline-none"
//                   />
//                 </div>
//                 <button
//                   onClick={loadPreview}
//                   disabled={!isValid}
//                   className="w-12 h-12 flex justify-center items-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 rounded-r-xl"
//                 >
//                   <RefreshCw className="text-white w-5 h-5" />
//                 </button>
//               </div>
//               {!isValid && url && (
//                 <p className="text-red-500 text-sm mt-1">Invalid URL format</p>
//               )}
//             </div>

//             {/* Screen Size */}
//             <div className="mb-6">
//               <div className="w-full flex justify-between items-center">
//                 <h4 className="font-semibold text-gray-900 mb-3">Screen size</h4>
//                 <button
//                   onClick={handleResetScreen}
//                   className="font-semibold underline text-red-600 mb-3 cursor-pointer"
//                 >
//                   Reset all
//                 </button>
//               </div>
//               <CustomDropdown
//                 value={screenSize}
//                 onChange={setScreenSize}
//                 options={ScreensizeOptions}
//                 placeholder="Select Screen size"
//               />
//             </div>

//             {/* Page Size */}
//             <div className="mb-6">
//               <h4 className="font-semibold text-gray-900 mb-3">Page size</h4>
//               <CustomDropdown
//                 value={pageSize}
//                 onChange={setPageSize}
//                 options={pageSizeOptions}
//                 placeholder="Select page size"
//               />
//             </div>

//             {/* Page Orientation */}
//             <div className="mb-6">
//               <h4 className="font-semibold text-gray-900 mb-3">Page orientation</h4>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setPageOrientation("portrait")}
//                   className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "portrait"
//                     ? "border-red-500 bg-red-50"
//                     : "border-gray-200 hover:border-red-300"
//                     }`}
//                 >
//                   <div className="flex flex-col items-center gap-2">
//                     <div className={`w-8 h-10 border-2 rounded ${pageOrientation === "portrait" ? "border-red-500" : "border-gray-400"
//                       }`}></div>
//                     <span className={`text-sm font-medium ${pageOrientation === "portrait" ? "text-red-600" : "text-gray-600"
//                       }`}>
//                       Portrait
//                     </span>
//                   </div>
//                 </button>
//                 <button
//                   onClick={() => setPageOrientation("landscape")}
//                   className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "landscape"
//                     ? "border-red-500 bg-red-50"
//                     : "border-gray-200 hover:border-red-300"
//                     }`}
//                 >
//                   <div className="flex flex-col items-center gap-2">
//                     <div className={`w-10 h-8 border-2 rounded ${pageOrientation === "landscape" ? "border-red-500" : "border-gray-400"
//                       }`}></div>
//                     <span className={`text-sm font-medium ${pageOrientation === "landscape" ? "text-red-600" : "text-gray-600"
//                       }`}>
//                       Landscape
//                     </span>
//                   </div>
//                 </button>
//               </div>
//             </div>

//             {/* Margin */}
//             <div className="mb-6">
//               <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
//               <div className="flex gap-2">
//                 {[
//                   { value: "none", label: "No margin", icon: ImageIcon },
//                   { value: "small", label: "Small", border: "border-2 border-dashed" },
//                   { value: "big", label: "Big", border: "border-4 border-dashed" }
//                 ].map((marginOption) => (
//                   <button
//                     key={marginOption.value}
//                     onClick={() => setMargin(marginOption.value)}
//                     className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === marginOption.value
//                       ? "border-red-500 bg-red-50"
//                       : "border-gray-200 hover:border-red-300"
//                       }`}
//                   >
//                     <div className="flex flex-col items-center gap-2">
//                       {marginOption.icon ? (
//                         <marginOption.icon className={`w-6 h-6 ${margin === marginOption.value ? "text-red-500" : "text-gray-400"
//                           }`} />
//                       ) : (
//                         <div className={`w-6 h-6 rounded ${marginOption.border} ${margin === marginOption.value ? "border-red-500" : "border-gray-400"
//                           }`}></div>
//                       )}
//                       <span className={`text-sm font-medium ${margin === marginOption.value ? "text-red-600" : "text-gray-600"
//                         }`}>
//                         {marginOption.label}
//                       </span>
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* HTML Settings */}
//             <div className="mb-6">
//               <h4 className="font-semibold text-gray-900 mb-3">HTML Settings</h4>
//               <div className="space-y-4">
//                 {/* Block Ads */}
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <div className="relative">
//                     <input
//                       type="checkbox"
//                       checked={blockAds}
//                       onChange={(e) => setBlockAds(e.target.checked)}
//                       className="sr-only"
//                     />
//                     <div
//                       className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${blockAds
//                         ? "bg-green-500 border-green-500"
//                         : "border-gray-300"
//                         }`}
//                     >
//                       <svg
//                         className="w-3 h-3 text-white"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     </div>
//                   </div>
//                   <span className="text-sm text-gray-700 font-medium">
//                     Try to block ads
//                   </span>
//                 </label>

//                 {/* Remove Popups */}
//                 <label className="flex items-center gap-3 cursor-pointer">
//                   <div className="relative">
//                     <input
//                       type="checkbox"
//                       checked={removePopups}
//                       onChange={(e) => setRemovePopups(e.target.checked)}
//                       className="sr-only"
//                     />
//                     <div
//                       className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${removePopups
//                         ? "bg-green-500 border-green-500"
//                         : "border-gray-300"
//                         }`}
//                     >
//                       <svg
//                         className="w-3 h-3 text-white"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     </div>
//                   </div>
//                   <span className="text-sm text-gray-700 font-medium">
//                     Remove overlay popups
//                   </span>
//                 </label>
//               </div>
//             </div>

//             {/* Preview Button */}
//             <div className="mb-6">
//               <button
//                 onClick={loadPreview}
//                 disabled={!isValid}
//                 className={`w-full py-2 px-4 text-sm rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isValid
//                   ? "bg-blue-600 hover:bg-blue-700 text-white"
//                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                   }`}
//               >
//                 <RefreshCw className="w-5 h-5" />
//                 Update Preview
//               </button>
//             </div>
//           </div>

//           {/* Convert Button */}
//           <div className="w-full p-6 sticky bottom-0 bg-white border-t">
//             <button
//               onClick={handleConvert}
//               disabled={!url || !isValid}
//               className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${url && isValid
//                 ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                 : "bg-gray-300 cursor-not-allowed"
//                 }`}
//             >
//               Convert to PDF
//               <ArrowRight className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Bottom Bar */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
//         <button
//           onClick={handleConvert}
//           disabled={!url || !isValid}
//           className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${url && isValid
//             ? "bg-red-600 hover:bg-red-700"
//             : "bg-gray-300 cursor-not-allowed"
//             }`}
//         >
//           Convert to PDF
//           <ArrowRight className="w-5 h-5" />
//         </button>
//         <button
//           onClick={() => setShowMobileSidebar(true)}
//           className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"
//         >
//           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
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
//             className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="p-4 border-b flex items-center justify-between">
//               <h3 className="text-xl font-bold text-gray-900">
//                 HTML to PDF options
//               </h3>
//               <button
//                 onClick={() => setShowMobileSidebar(false)}
//                 className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600" />
//               </button>
//             </div>

//             <div className="p-4 space-y-6">
//               {/* Screen Size */}
//               <div>
//                 <div className="w-full flex justify-between items-center">
//                   <h4 className="font-semibold text-gray-900 mb-3">Screen size</h4>
//                   <button
//                     onClick={handleResetScreen}
//                     className="font-semibold underline text-red-600 mb-3 cursor-pointer"
//                   >
//                     Reset all
//                   </button>
//                 </div>
//                 <CustomDropdown
//                   value={screenSize}
//                   onChange={setScreenSize}
//                   options={ScreensizeOptions}
//                   placeholder="Select Screen size"
//                 />
//               </div>

//               {/* Page Size */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 mb-3">Page size</h4>
//                 <CustomDropdown
//                   value={pageSize}
//                   onChange={setPageSize}
//                   options={pageSizeOptions}
//                   placeholder="Select page size"
//                 />
//               </div>

//               {/* Page Orientation */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 mb-3">Page orientation</h4>
//                 <div className="flex gap-3">
//                   <button
//                     onClick={() => setPageOrientation("portrait")}
//                     className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "portrait"
//                       ? "border-red-500 bg-red-50"
//                       : "border-gray-200 hover:border-red-300"
//                       }`}
//                   >
//                     <div className="flex flex-col items-center gap-2">
//                       <div className={`w-8 h-10 border-2 rounded ${pageOrientation === "portrait" ? "border-red-500" : "border-gray-400"
//                         }`}></div>
//                       <span className={`text-sm font-medium ${pageOrientation === "portrait" ? "text-red-600" : "text-gray-600"
//                         }`}>
//                         Portrait
//                       </span>
//                     </div>
//                   </button>
//                   <button
//                     onClick={() => setPageOrientation("landscape")}
//                     className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${pageOrientation === "landscape"
//                       ? "border-red-500 bg-red-50"
//                       : "border-gray-200 hover:border-red-300"
//                       }`}
//                   >
//                     <div className="flex flex-col items-center gap-2">
//                       <div className={`w-10 h-8 border-2 rounded ${pageOrientation === "landscape" ? "border-red-500" : "border-gray-400"
//                         }`}></div>
//                       <span className={`text-sm font-medium ${pageOrientation === "landscape" ? "text-red-600" : "text-gray-600"
//                         }`}>
//                         Landscape
//                       </span>
//                     </div>
//                   </button>
//                 </div>
//               </div>

//               {/* Margin */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
//                 <div className="flex gap-2">
//                   {[
//                     { value: "none", label: "No margin", icon: ImageIcon },
//                     { value: "small", label: "Small", border: "border-2 border-dashed" },
//                     { value: "big", label: "Big", border: "border-4 border-dashed" }
//                   ].map((marginOption) => (
//                     <button
//                       key={marginOption.value}
//                       onClick={() => setMargin(marginOption.value)}
//                       className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${margin === marginOption.value
//                         ? "border-red-500 bg-red-50"
//                         : "border-gray-200 hover:border-red-300"
//                         }`}
//                     >
//                       <div className="flex flex-col items-center gap-2">
//                         {marginOption.icon ? (
//                           <marginOption.icon className={`w-6 h-6 ${margin === marginOption.value ? "text-red-500" : "text-gray-400"
//                             }`} />
//                         ) : (
//                           <div className={`w-6 h-6 rounded ${marginOption.border} ${margin === marginOption.value ? "border-red-500" : "border-gray-400"
//                             }`}></div>
//                         )}
//                         <span className={`text-sm font-medium ${margin === marginOption.value ? "text-red-600" : "text-gray-600"
//                           }`}>
//                           {marginOption.label}
//                         </span>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* HTML Settings */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 mb-3">HTML Settings</h4>
//                 <div className="space-y-4">
//                   {/* Block Ads */}
//                   <label className="flex items-center gap-3 cursor-pointer">
//                     <div className="relative">
//                       <input
//                         type="checkbox"
//                         checked={blockAds}
//                         onChange={(e) => setBlockAds(e.target.checked)}
//                         className="sr-only"
//                       />
//                       <div
//                         className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${blockAds
//                           ? "bg-green-500 border-green-500"
//                           : "border-gray-300"
//                           }`}
//                       >
//                         <svg
//                           className="w-3 h-3 text-white"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                     <span className="text-sm text-gray-700 font-medium">
//                       Try to block ads
//                     </span>
//                   </label>

//                   {/* Remove Popups */}
//                   <label className="flex items-center gap-3 cursor-pointer">
//                     <div className="relative">
//                       <input
//                         type="checkbox"
//                         checked={removePopups}
//                         onChange={(e) => setRemovePopups(e.target.checked)}
//                         className="sr-only"
//                       />
//                       <div
//                         className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${removePopups
//                           ? "bg-green-500 border-green-500"
//                           : "border-gray-300"
//                           }`}
//                       >
//                         <svg
//                           className="w-3 h-3 text-white"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                     </div>
//                     <span className="text-sm text-gray-700 font-medium">
//                       Remove overlay popups
//                     </span>
//                   </label>
//                 </div>
//               </div>

//               {/* Preview Button */}
//               <div>
//                 <button
//                   onClick={loadPreview}
//                   disabled={!isValid}
//                   className={`w-full py-2 px-4 text-sm rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isValid
//                     ? "bg-blue-600 hover:bg-blue-700 text-white"
//                     : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                     }`}
//                 >
//                   <RefreshCw className="w-5 h-5" />
//                   Update Preview
//                 </button>
//               </div>

//               {/* Convert Button for Mobile */}
//               <div className="pt-4 border-t">
//                 <button
//                   onClick={handleConvert}
//                   disabled={!url || !isValid}
//                   className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${url && isValid
//                     ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
//                     : "bg-gray-300 cursor-not-allowed"
//                     }`}
//                 >
//                   Convert to PDF
//                   <ArrowRight className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default HTMLToPDFPage;