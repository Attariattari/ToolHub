"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Type,
  Palette,
  Square,
} from "lucide-react";
import { createPortal } from "react-dom";

import { pdfjs, Document, Page } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
import ZoomControls from "@/components/sections/EditZoomControls";
import Allpagespreview from "@/components/sections/Allpagespreview";

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Memoized options for PDF Document to prevent unnecessary reloads
const PDF_OPTIONS = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  disableWorker: false,
  isEvalSupported: false,
  disableCreateObjectURL: false,
};

// Fixed PDFThumbnail Component with updated styling
const PDFThumbnail = memo(({ file, pageNum, isActive, onClick, zoom = 25 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const elementRef = useRef(null);

  // Individual intersection observer for each thumbnail
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll into view when active
  useEffect(() => {
    if (isActive && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isActive]);

  const handleLoadError = useCallback(
    (error) => {
      console.error(`Error loading thumbnail for page ${pageNum}:`, error);
      setHasError(true);
      setIsLoading(false);
    },
    [pageNum]
  );

  const handleLoadSuccess = useCallback(
    (pdf) => {
      console.log(`Thumbnail loaded successfully for page ${pageNum}`);
      setHasError(false);
      setIsLoading(false);
    },
    [pageNum]
  );

  const renderThumbnail = () => {
    if (file.stableData?.isPasswordProtected) {
      return (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded">
          <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
          <div className="text-xs text-gray-600 font-medium">Protected</div>
        </div>
      );
    }

    if (!isVisible || hasError || !file.stableData) {
      return (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded">
          <FileText className="w-8 h-8 text-gray-400 mb-1" />
          <div className="text-xs text-gray-600 font-medium">
            {hasError ? "Error" : "PDF"}
          </div>
        </div>
      );
    }

    if (file.stableData && !file.stableData.isPasswordProtected) {
      return (
        <div className="w-[100%] h-full relative flex justify-center items-center bg-white rounded">
          <Document
            file={file.stableData.dataUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            loading={
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            }
            error={
              <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center rounded">
                <FileText className="w-6 h-6 text-red-400 mb-1" />
                <div className="text-xs text-red-600 font-medium">Error</div>
              </div>
            }
            className="w-full h-full flex items-center justify-center"
            options={PDF_OPTIONS}
          >
            <Page
              pageNumber={pageNum}
              width={90}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-sm"
              loading={
                <div className="w-[90px] h-[120px] bg-gray-100 flex items-center justify-center rounded">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                </div>
              }
              onLoadSuccess={() => {
                setIsLoading(false);
                setHasError(false);
              }}
              onLoadError={(error) => {
                console.error(`Page ${pageNum} load error:`, error);
                setHasError(true);
                setIsLoading(false);
              }}
            />
          </Document>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded">
        <FileText className="w-8 h-8 text-gray-400 mb-1" />
        <div className="text-xs text-gray-600 font-medium">PDF</div>
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      className={`
        border cursor-pointer transition-all duration-200 mb-2 relative bg-white rounded
        ${
          isActive
            ? "border-red-600 shadow-md"
            : file.stableData?.isPasswordProtected
            ? "border-yellow-300 hover:border-yellow-400"
            : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
        }
      `}
      onClick={onClick}
    >
      <div className="w-full h-36 bg-gray-100 rounded-t overflow-hidden flex items-center justify-center p-1">
        {renderThumbnail()}
      </div>

      <div className="text-center py-2 bg-white rounded-b">
        <div
          className={`text-xs font-medium ${
            isActive ? "text-red-600" : "text-gray-600"
          }`}
        >
          {pageNum}
        </div>
      </div>

      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
      )}

      {isLoading && isVisible && !file.stableData?.isPasswordProtected && (
        <div className="absolute inset-1 bg-white/80 rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

PDFThumbnail.displayName = "PDFThumbnail";

export default function PDFViewer() {
  // 📦 State: File Handling & PDF Processing
  const [files, setFiles] = useState([]);
  const [protectedFiles, setProtectedFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPages, setPdfPages] = useState({});
  const [loadingPdfs, setLoadingPdfs] = useState(new Set());
  const [pdfHealthCheck, setPdfHealthCheck] = useState({});
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(
    new Set()
  );

  const [isThumbnailVisible, setIsThumbnailVisible] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Zoom states
  const [zoom, setZoom] = useState(50);
  const [showControls, setShowControls] = useState(false);
  const initialTextState = {
    showTextToolbar: false,
    selectedSize: 16,
    selectedFont: "Arial",
    selectedColor: "#000000",
    selectedBgColor: "transparent",
    isBold: false,
    isItalic: false,
    isUnderline: false,
    selectedAlignment: "left",
    opacity: 1,
    deleteRequested: false,
    addTextToPage: false, // ✅ NEW: Flag to trigger text addition
    onTextAdded: null, // ✅ NEW: Callback after text is added
  };
  const [textEditingState, setTextEditingState] = useState(initialTextState);
  const [allTextElements, setAllTextElements] = useState([]);

  const fonts = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Georgia",
    "Tahoma",
  ];
  const fontSizes = [
    "8",
    "9",
    "10",
    "11",
    "12",
    "14",
    "16",
    "18",
    "20",
    "24",
    "28",
    "32",
    "36",
    "48",
    "72",
  ];
  const zoomLevels = [
    "25%",
    "50%",
    "75%",
    "100%",
    "125%",
    "150%",
    "200%",
    "300%",
    "400%",
  ];
  // Refs
  const fileDataCache = useRef({});
  const pdfDocumentCache = useRef({});
  const mainViewerRef = useRef(null);

  // Check if a file is password protected
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      try {
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "",
        });

        const pdf = await loadingTask.promise;
        console.log(
          `File ${file.name} loaded successfully - not password protected`
        );
        return false;
      } catch (pdfError) {
        if (
          pdfError.name === "PasswordException" ||
          pdfError.name === "MissingPDFException" ||
          pdfError.message?.includes("password") ||
          pdfError.message?.includes("encrypted")
        ) {
          console.log(`File ${file.name} requires password:`, pdfError.message);
          setPasswordProtectedFiles((prev) => new Set([...prev, id]));
          return true;
        }

        console.warn(`PDF load error for ${file.name}:`, pdfError);
        return false;
      }
    } catch (error) {
      console.warn("Error checking password protection:", error);
      return false;
    }
  }, []);

  // Create stable file data
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id];
      }

      try {
        const isPasswordProtected = await checkPasswordProtection(file, id);

        if (isPasswordProtected) {
          const stableData = {
            blob: null,
            dataUrl: null,
            uint8Array: null,
            isPasswordProtected: true,
          };
          fileDataCache.current[id] = stableData;
          return stableData;
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = new Blob([uint8Array], { type: file.type });
        const objectUrl = URL.createObjectURL(blob);

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array.slice(),
          isPasswordProtected: false,
        };

        fileDataCache.current[id] = stableData;
        return stableData;
      } catch (error) {
        console.error("Error creating stable file data:", error);
        return null;
      }
    },
    [checkPasswordProtection]
  );

  // Handle file uploads
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileArray = Array.from(newFiles);
      console.log("Processing files:", fileArray);

      const fileObjects = await Promise.all(
        fileArray.map(async (file, index) => {
          const id = `${file.name}-${Date.now()}-${Math.random()}`;
          const stableData = await createStableFileData(file, id);

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
            numPages: null,
          };
        })
      );

      setFiles([fileObjects[0]]);
      setCurrentPage(1);

      if (fileObjects.length > 1) {
        toast.info(
          "Only one PDF can be viewed at a time. Using the first file."
        );
      }
    },
    [createStableFileData]
  );

  // PDF document load success handler
  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
    console.log("📄 PDF Loaded Successfully:", {
      fileId,
      numPages: pdf.numPages,
    });

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });

    setPdfPages((prev) => ({
      ...prev,
      [fileId]: pdf.numPages,
    }));

    pdfDocumentCache.current[fileId] = pdf;

    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: true,
    }));

    setFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          return { ...file, numPages: pdf.numPages };
        }
        return file;
      })
    );
  }, []);

  // PDF document load error handler
  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error);

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });

    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: false,
    }));
  }, []);

  // Remove file function
  const removeFile = useCallback((id) => {
    const fileData = fileDataCache.current[id];
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl);
    }

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    setPasswordProtectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    delete fileDataCache.current[id];

    if (pdfDocumentCache.current[id]) {
      try {
        if (pdfDocumentCache.current[id].destroy) {
          pdfDocumentCache.current[id].destroy();
        }
      } catch (e) {
        console.warn("PDF cleanup warning:", e);
      }
      delete pdfDocumentCache.current[id];
    }

    setPdfHealthCheck((prev) => {
      const newHealth = { ...prev };
      delete newHealth[id];
      return newHealth;
    });

    setFiles((prev) => prev.filter((file) => file.id !== id));

    setPdfPages((prev) => {
      const newPages = { ...prev };
      delete newPages[id];
      return newPages;
    });
  }, []);

  // Handle thumbnail click - scroll to specific page
  const handleThumbnailClick = useCallback((pageNumber) => {
    console.log("Thumbnail clicked for page:", pageNumber);

    // Mark this as a thumbnail click to prevent scroll interference
    if (window.markThumbnailClick) {
      window.markThumbnailClick(pageNumber);
    }

    // Set the current page first
    setCurrentPage(pageNumber);

    // Small delay to ensure the page state is updated
    setTimeout(() => {
      const pageElement = document.querySelector(
        `[data-page-number="${pageNumber}"]`
      );
      if (pageElement && mainViewerRef.current) {
        // Find the scrollable container
        let scrollContainer =
          mainViewerRef.current.querySelector(".overflow-auto");
        if (!scrollContainer) {
          scrollContainer = mainViewerRef.current;
        }

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = pageElement.getBoundingClientRect();

        scrollContainer.scrollTo({
          top:
            scrollContainer.scrollTop +
            (elementRect.top - containerRect.top) -
            50,
          behavior: "smooth",
        });
      }
    }, 50); // Reduced timeout for better responsiveness
  }, []);

  // Handle page change from main viewer
  const handlePageChange = useCallback((newPage) => {
    console.log("Page changed to:", newPage);
    setCurrentPage(newPage);
  }, []);

  // Handle protected files
  const handleProtectedFiles = useCallback((passwordProtectedFiles) => {
    console.log("Password protected files detected:", passwordProtectedFiles);
    setProtectedFiles(passwordProtectedFiles);
    setShowPasswordModal(true);
  }, []);

  // Handle unlocked files
  const handleUnlockedFiles = useCallback((unlockedFiles) => {
    console.log("✅ Unlocked Files:", unlockedFiles);
    setFiles([unlockedFiles[0]]);
  }, []);

  // Check for unhealthy files
  const hasUnhealthyFiles = useMemo(
    () => Object.values(pdfHealthCheck).some((health) => health === false),
    [pdfHealthCheck]
  );

  // Safe FileUploader wrapper
  const SafeFileUploader = ({
    whileTap,
    whileHover,
    animate,
    initial,
    ...safeProps
  }) => {
    return <FileUploaderForWatermark {...safeProps} />;
  };

  // Enhanced zoom control functions
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  // Fit to width function
  const handleFitToWidth = () => {
    if (mainViewerRef.current) {
      const container = mainViewerRef.current.querySelector(".overflow-auto");
      if (container) {
        const containerWidth = container.clientWidth - 64; // Account for padding
        const idealZoom = Math.floor((containerWidth / 800) * 100);
        setZoom(Math.max(25, Math.min(300, idealZoom)));
      }
    }
  };

  // Download function
  const handleDownload = () => {
    if (currentFile && currentFile.stableData?.dataUrl) {
      const link = document.createElement("a");
      link.href = currentFile.stableData.dataUrl;
      link.download = currentFile.name || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Page navigation functions
  const handlePageNavigation = (newPage) => {
    if (newPage >= 1 && newPage <= currentFilePages) {
      handleThumbnailClick(newPage);
    }
  };

  // Get current file
  const currentFile = files[0];
  const currentFilePages = currentFile ? pdfPages[currentFile.id] || 0 : 0;

  // Generate page numbers array
  const pageNumbers = useMemo(() => {
    if (!currentFilePages) return [];
    return Array.from({ length: currentFilePages }, (_, i) => i + 1);
  }, [currentFilePages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(fileDataCache.current).forEach((data) => {
        if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(data.dataUrl);
        }
      });
    };
  }, []);
  const [currentLayout, setCurrentLayout] = useState("continuous"); // New state for layout

  // Add this handler function:
  const handleLayoutChange = useCallback((layoutType) => {
    console.log("Layout changed to:", layoutType);
    setCurrentLayout(layoutType);
  }, []);
  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />;
  }

  // //////////////////////////////////////// //
  // For Text Exit
  // //////////////////////////////////////// //
  // toggle function

  // NEW: Function to add text directly to current page
  const addTextToCurrentPage = useCallback(() => {
    if (!currentFile || !currentPage) return;

    const textId = `text_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newTextElement = {
      id: textId,
      pageNumber: currentPage,
      x: 100, // Default position
      y: 100, // Default position
      width: 120,
      height: 30,
      text: "New Text",
      fontSize: textEditingState?.selectedSize || 16,
      fontFamily: textEditingState?.selectedFont || "Arial",
      color: textEditingState?.selectedColor || "#000000",
      backgroundColor: textEditingState?.selectedBgColor || "transparent",
      isBold: textEditingState?.isBold || false,
      isItalic: textEditingState?.isItalic || false,
      isUnderline: textEditingState?.isUnderline || false,
      alignment: textEditingState?.selectedAlignment || "left",
      opacity: textEditingState?.opacity || 1,
      isEditing: true,
    };

    setAllTextElements((prev) => [...prev, newTextElement]);

    if (onTextAdd) {
      onTextAdd(newTextElement);
    }
  }, [currentFile, currentPage, textEditingState]);

  // UPDATED: Toggle text editing mode - ab direct text add hoga
  const handleTextButtonClick = () => {
    setTextEditingState((prev) => {
      if (prev.showTextToolbar) {
        // Close text editing mode - reset to initial state
        return initialTextState;
      }

      // Open text editing mode aur direct text add karo
      const newState = {
        ...initialTextState,
        showTextToolbar: true,
        addTextToPage: true, // ✅ Signal child to add text
        onTextAdded: () => {
          // ✅ Reset flag after text is added
          setTextEditingState((prev) => ({
            ...prev,
            addTextToPage: false,
            onTextAdded: null,
          }));
        },
      };

      return newState;
    });
  };

  // Text formatting handlers
  const handleBold = () => {
    setTextEditingState((prev) => ({
      ...prev,
      isBold: !prev.isBold,
    }));
  };

  const handleItalic = () => {
    setTextEditingState((prev) => ({
      ...prev,
      isItalic: !prev.isItalic,
    }));
  };

  const handleUnderline = () => {
    setTextEditingState((prev) => ({
      ...prev,
      isUnderline: !prev.isUnderline,
    }));
  };

  const handleColorChange = (color) => {
    setTextEditingState((prev) => ({
      ...prev,
      selectedColor: color,
    }));
  };

  const handleBgColorChange = (color) => {
    setTextEditingState((prev) => ({
      ...prev,
      selectedBgColor: color,
    }));
  };

  const handleFontChange = (font) => {
    setTextEditingState((prev) => ({
      ...prev,
      selectedFont: font,
    }));
  };

  const handleSizeChange = (size) => {
    setTextEditingState((prev) => ({
      ...prev,
      selectedSize: parseInt(size),
    }));
  };
  const handleOpacityChange = (opacity) => {
    setTextEditingState((prev) => ({
      ...prev,
      opacity: parseFloat(opacity),
    }));
  };

  // Text element callbacks
  const handleTextAdd = (textElement) => {
    console.log("Text added:", textElement);
    setAllTextElements((prev) => [...prev, textElement]);
  };

  const handleTextUpdate = (updatedTextElement) => {
    console.log("Text updated:", updatedTextElement);
    setAllTextElements((prev) =>
      prev.map((text) =>
        text.id === updatedTextElement.id ? updatedTextElement : text
      )
    );
  };

  const handleTextDelete = (textId, pageNumber) => {
    console.log("Text deleted:", textId, "from page", pageNumber);
    setAllTextElements((prev) => prev.filter((text) => text.id !== textId));

    // Reset the delete request flag
    setTextEditingState((prev) => ({
      ...prev,
      deleteRequested: false,
    }));
  };

  const fontOptions = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Helvetica",
    "Georgia",
    "Verdana",
    "Comic Sans MS",
    "Impact",
  ];

  const sizeOptions = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
  const handleAlignment = (align) => {
    setTextEditingState((prev) => ({
      ...prev,
      selectedAlignment: align,
      isAlignmentDropdownOpen: false, // 👈 dropdown close ho jayega
    }));

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      if (align === "left") document.execCommand("justifyLeft", false, null);
      else if (align === "center")
        document.execCommand("justifyCenter", false, null);
      else if (align === "right")
        document.execCommand("justifyRight", false, null);
    }
  };

  const handleDelete = () => {
    document.execCommand("delete");
  };

  const options = [
    { value: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { value: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { value: "right", icon: <AlignRight className="w-4 h-4" /> },
  ];

  const current = options.find(
    (opt) => opt.value === textEditingState.selectedAlignment
  );
  // //////////////////////////////////////// //
  // For Text Exit
  // //////////////////////////////////////// //
  // Show upload screen if no files
  if (files.length === 0) {
    return (
      <SafeFileUploader
        isMultiple={false}
        onFilesSelect={handleFiles}
        onPasswordProtectedFile={handleProtectedFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF file"
        pageTitle="PDF Viewer"
        pageSubTitle="View and navigate through PDF documents easily."
      />
    );
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-12 border h-full">
        {/* Thumbnails Sidebar - Left (1.5 columns) */}
        {isThumbnailVisible && (
          <div className="hidden md:h-[calc(100vh-82px)] md:flex justify-center items-start md:col-span-1 lg:col-span-2 bg-gray-50 border-r overflow-y-auto custom-scrollbar">
            <div className="w-[80%] p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Pages ({currentFilePages})
              </h3>

              {currentFile &&
                pageNumbers.map((pageNum) => (
                  <PDFThumbnail
                    key={`${currentFile.id}-page-${pageNum}`}
                    file={currentFile}
                    pageNum={pageNum}
                    isActive={currentPage === pageNum}
                    onClick={() => handleThumbnailClick(pageNum)}
                    zoom={25}
                  />
                ))}

              {!currentFile && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No PDF loaded
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Takes remaining space */}
        <div
          className={`${
            isThumbnailVisible ? "md:col-span-8 lg:col-span-7" : "md:col-span-9"
          } bg-gray-100 transition-all duration-500 ease-in-out transform relative`}
        >
          {/* Vertical Separator with Arrow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[15px] bg-gray-200 border-r cursor-pointer hover:bg-gray-300 flex items-center justify-center transition-colors duration-200 z-10"
            onClick={() => setIsThumbnailVisible(!isThumbnailVisible)}
            title="Hide Thumbnails"
          >
            {isThumbnailVisible ? <ChevronLeft /> : <ChevronRight />}
          </div>
          <div className="w-full">
            <div className="flex items-center gap-3 p-2 pl-10 bg-white border-b border-gray-20 relative">
              <button className="p-2 rounded hover:bg-gray-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15.959"
                  height="19.44"
                >
                  <path
                    fill="#707078"
                    fill-rule="evenodd"
                    d="M12.213 19.44H7.37c-1.35 0-2.6-.677-3.263-1.774l-3.94-6.23c-.34-.462-.102-.795.115-.983s.74-.353 1.237-.324c.51.033.98.248 1.298.593l1.208 1.27c.093.097.246.134.384.09s.23-.155.23-.28l.007-8.732C4.65 2.474 5.162 2 5.793 2c.617 0 1.12.462 1.145 1.038l.001 6.78c0 .08.036.155.1.2s.153.087.244.086h.001c.09.001.18-.03.244-.085s.1-.13.102-.21V1.075C7.63.48 8.143 0 8.775 0H8.8c.63 0 1.155.476 1.155 1.072V9.8c0 .165.155.298.346.298s.346-.134.346-.298v-7.61c0-.596.503-1.08 1.134-1.08s1.138.484 1.138 1.08V9.8c0 .165.155.298.346.298s.346-.134.346-.298V5.325c0-.596.525-1.062 1.157-1.062h.033c.63 0 1.144.472 1.145 1.066l-.002 10.64c-.002 1.916-1.68 3.47-3.74 3.47z"
                  ></path>
                </svg>
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 ${
                  textEditingState.showTextToolbar
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-400"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={handleTextButtonClick}
                title="Add Text Tool"
              >
                <Type className="w-5 h-5" />
              </button>
              <button className="p-2 rounded hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" width="20">
                  <path
                    fill="#707078"
                    fill-rule="evenodd"
                    d="M17.298 16c1.8 0 2.702-.923 2.702-2.732V2.723C20 .923 19.087 0 17.298 0H2.702C.913 0 0 .914 0 2.723v10.545C0 15.077.913 16 2.702 16h14.595zm-15.82-3.746v-9.43c0-.877.456-1.316 1.28-1.316h14.488c.814 0 1.28.44 1.28 1.316v9.393l-4.43-4.25c-.376-.338-.814-.52-1.27-.52a1.8 1.8 0 0 0-1.271.512l-3.82 3.49-1.566-1.444c-.358-.33-.752-.493-1.145-.493-.385 0-.743.155-1.092.484l-2.452 2.257zM8.403 6.05c0 1.133-.904 2.047-2.004 2.047-1.1 0-2.004-.914-2.004-2.047 0-1.124.895-2.056 2.004-2.056 1.1 0 2.004.932 2.004 2.056z"
                  ></path>
                </svg>
              </button>
              <button className="p-2 rounded hover:bg-gray-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="15.999"
                  width="15.999"
                  fill="#707078"
                  fill-rule="evenodd"
                >
                  <path d="M1.53 11.443l9.382-9.383 3.026 3.026-9.382 9.383-3.026-3.026zM0 16l3.344-.926-2.418-2.418L0 16zM14.776.47a1.61 1.61 0 0 0-2.272 0l-.68.68 3.026 3.026.68-.68a1.61 1.61 0 0 0 0-2.272L14.776.47z"></path>
                </svg>
              </button>
              <button className="p-2 rounded hover:bg-gray-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24.001"
                  height="24"
                  fill="#707078"
                  fill-rule="evenodd"
                >
                  <path d="M13.716 10.286v4.286h5.534l.182.613c.188.63.284 1.29.284 1.96A6.86 6.86 0 0 1 12.858 24a6.86 6.86 0 0 1-6.857-6.857 6.86 6.86 0 0 1 6.857-6.857h.857zm-.857 4.418v-3.56a6 6 0 0 0 0 12 6 6 0 0 0 5.752-7.714h-5.026c-.4 0-.725-.325-.725-.725z"></path>
                  <path d="M.12 14.134L8.264.42a.86.86 0 0 1 1.474 0l3.857 6.497c.08.132.12.283.12.437v2.93c0 .474-.384.857-.857.857l-.23.004c-2.372.1-4.453 1.568-5.334 3.746-.13.324-.445.536-.794.536H.858a.86.86 0 0 1-.737-1.295zm12.737-6.78L9 .857.858 14.57H6.5a6.86 6.86 0 0 1 6.359-4.286v-2.93z"></path>
                  <path d="M23.144 4.286h-9.43c-.473 0-.857.384-.857.857v9.43c0 .473.384.857.857.857h9.43c.473 0 .857-.384.857-.857v-9.43c0-.473-.384-.857-.857-.857z"></path>
                </svg>
              </button>
            </div>
            {textEditingState.showTextToolbar && (
              <div className="absolute z-50 flex items-center justify-center gap-2 p-2 ml-[15px] bg-gray-50 border-b border-gray-200">
                {/* Text Icon */}
                <span className="font-bold text-lg px-2">T</span>

                {/* Font Family Dropdown */}
                <div className="relative w-[60px]">
                  <select
                    value={textEditingState.selectedFont}
                    onChange={(e) => handleFontChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded px-2 py-1 pr-6 text-xs focus:outline-none focus:border-blue-500 w-full"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>

                {/* Font Size */}
                <span className="text-sm font-medium">Т</span>
                <div className="relative">
                  <select
                    value={textEditingState.selectedSize}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:border-blue-500 w-16"
                  >
                    {sizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Bold, Italic, Underline */}
                <button
                  onClick={handleBold}
                  className={`p-2 rounded transition-colors ${
                    textEditingState.isBold
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  onClick={handleItalic}
                  className={`p-2 rounded transition-colors ${
                    textEditingState.isItalic
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  onClick={handleUnderline}
                  className={`p-2 rounded transition-colors ${
                    textEditingState.isUnderline
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Underline className="w-4 h-4" />
                </button>

                {/* Text Color */}
                <div className="relative">
                  <div className="flex items-center p-1 border border-gray-300 rounded hover:bg-gray-50">
                    <div className="w-6 h-4 flex flex-col">
                      <div className="w-6 h-3 bg-black rounded-t"></div>
                      <div
                        className={`w-6 h-1 rounded-b`}
                        style={{
                          backgroundColor: textEditingState.selectedColor,
                        }}
                      ></div>
                    </div>
                    <input
                      type="color"
                      value={textEditingState.selectedColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ChevronDown className="w-3 h-3 ml-1 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Background Color */}
                <div className="relative">
                  <div className="flex items-center p-1 border border-gray-300 rounded hover:bg-gray-50">
                    <div className="w-6 h-4 flex flex-col relative">
                      <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
                        <path
                          d="M2 2h12v8H2z"
                          fill="white"
                          stroke="black"
                          strokeWidth="1"
                        />
                        <path d="M4 4h8v4H4z" fill="currentColor" />
                      </svg>
                      <div
                        className={`w-6 h-1 rounded-b`}
                        style={{
                          backgroundColor: textEditingState.selectedBgColor,
                        }}
                      ></div>
                    </div>
                    <input
                      type="color"
                      value={textEditingState.selectedBgColor}
                      onChange={(e) => handleBgColorChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ChevronDown className="w-3 h-3 ml-1 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Alignment (dropdown wala logic tumhare functions ke sath adjust ho jayega) */}
                <div className="relative inline-block">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() =>
                        setTextEditingState((prev) => ({
                          ...prev,
                          isAlignmentDropdownOpen:
                            !prev.isAlignmentDropdownOpen,
                        }))
                      }
                      className="p-1 flex items-center gap-1 hover:bg-gray-50"
                    >
                      {current.icon}
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  {textEditingState.isAlignmentDropdownOpen && (
                    <div className="absolute mt-1 w-28 bg-white border border-gray-200 rounded shadow-md z-10">
                      {options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleAlignment(opt.value)}
                          className={`w-full flex items-center gap-2 p-1 text-sm hover:bg-gray-100 ${
                            textEditingState.selectedAlignment === opt.value
                              ? "bg-blue-100 text-blue-600"
                              : ""
                          }`}
                        >
                          {opt.icon}
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={textEditingState.opacity}
                    onChange={(e) => handleOpacityChange(e.target.value)}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                        textEditingState.opacity * 100
                      }%, #e5e7eb ${
                        textEditingState.opacity * 100
                      }%, #e5e7eb 100%)`,
                    }}
                  />
                  <span className="text-xs text-gray-700 w-8">
                    {Math.round(textEditingState.opacity * 100)}%
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  className="p-2 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* PDF Preview Area */}
          <div className="md:h-[calc(100vh-143px)] h-[calc(100vh-82px)] md w-full bg-gray-100 overflow-hidden">
            <div
              ref={mainViewerRef}
              className="h-full w-full max-w-5xl mx-auto overflow-auto custom-scrollbar"
            >
              <div
                className="relative"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {files.map((file) => {
                  const isFileLoading = loadingPdfs.has(file.id);

                  return (
                    <div
                      key={file.id}
                      className="w-full flex justify-center py-4"
                    >
                      <div className="w-full max-w-3xl">
                        <Allpagespreview
                          file={file}
                          isLoading={isFileLoading}
                          onLoadSuccess={onDocumentLoadSuccess}
                          onLoadError={onDocumentLoadError}
                          isHealthy={pdfHealthCheck[file.id] !== false}
                          isPasswordProtected={passwordProtectedFiles.has(
                            file.id
                          )}
                          showRemoveButton={false} // ✅ CHANGED: No remove button
                          onRemove={() => removeFile(file.id)}
                          userZoom={zoom}
                          currentPage={currentPage}
                          showSinglePage={currentLayout === "single"}
                          showAllPages={currentLayout === "continuous"}
                          showSpread={currentLayout === "spread"}
                          layoutType={currentLayout}
                          onPageChange={handlePageChange}
                          // Text editing props
                          textEditingState={textEditingState}
                          onTextAdd={handleTextAdd}
                          onTextUpdate={handleTextUpdate}
                          onTextDelete={handleTextDelete}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Zoom Controls Overlay */}

              <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-20">
                <ZoomControls
                  zoom={zoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomChange={handleZoomChange}
                  onFitToWidth={handleFitToWidth}
                  onDownload={handleDownload}
                  currentPage={currentPage}
                  totalPages={currentFilePages}
                  onPageChange={handlePageNavigation}
                  onLayoutChange={handleLayoutChange} // New prop
                  currentLayout={currentLayout} // New prop
                  show={files.length > 0}
                  className=""
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Same as before (3 columns) */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col">
          <div className="p-4">
            <div className="space-y-4">
              {/* File Info Section */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  File Information
                </h3>

                {files.length > 0 && (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800 truncate">
                            {file.name}
                          </h4>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove file"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Size: {file.size}</div>
                          {file.numPages && <div>Pages: {file.numPages}</div>}
                          <div>Current: Page {currentPage}</div>
                          <div className="flex items-center gap-1">
                            Status:
                            {passwordProtectedFiles.has(file.id) ? (
                              <span className="text-yellow-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Password Protected
                              </span>
                            ) : pdfHealthCheck[file.id] === false ? (
                              <span className="text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            ) : (
                              <span className="text-green-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Ready
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload New File Section */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Upload New File
                </h3>
                <SafeFileUploader
                  isMultiple={false}
                  onFilesSelect={handleFiles}
                  onPasswordProtectedFile={handleProtectedFiles}
                  isDragOver={isDragOver}
                  setIsDragOver={setIsDragOver}
                  allowedTypes={[".pdf"]}
                  showFiles={true}
                  uploadButtonText="Select PDF"
                  hideTitle={true}
                  compact={true}
                />
              </div>

              {/* Health Check */}
              {hasUnhealthyFiles && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">File Issues Detected</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Some files could not be loaded properly. Please check the
                    file format.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModelPreveiw
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setProtectedFiles([]);
        }}
        passwordProtectedFiles={protectedFiles}
        onPasswordVerified={handleUnlockedFiles}
      />

      <style jsx>{`
        .pdf-preview-page canvas {
          border-radius: 8px;
          max-width: 100% !important;
          height: auto !important;
        }

        .pdf-preview-page > div {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }

        .pdf-document {
          min-height: max-content;
        }
      `}</style>
    </div>
  );
}
