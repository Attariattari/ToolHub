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
  FlipVertical,
  FlipHorizontal,
  RotateCw,
  Edit,
  GripVertical,
} from "lucide-react";

import { pdfjs, Document, Page } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
import ZoomControls from "@/components/sections/EditZoomControls";
import Allpagespreview from "@/components/sections/Allpagespreview";
import { FaRegImage, FaShapes } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";

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

  const initialImageState = {
    showImageToolbar: false,
    opacity: 100, // Changed to 100 for better default
    showOpacityDropdown: false,
    images: [],
    selectedImageId: null,
    currentImageIndex: 0,
    addImageToPage: false, // ✅ NEW: Flag to trigger image addition
    onImageAdded: null, // ✅ NEW: Callback after image is added
    deleteRequested: false,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  };
  const initialDrawState = {
    showDrawToolbar: false,
    selectedTool: "brush", // brush, line, arrow
    selectedColor: "#000000",
    strokeWidth: 2,
    drawings: [], // All drawings storage
    isDrawing: false,
    deleteRequested: false,
    addDrawingToPage: false,
    onDrawingAdded: null,
  };
  const initialShapeState = {
    showShapeToolbar: false,
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
  const [imageEditingState, setImageEditingState] = useState(initialImageState);
  const [drawEditingState, setDrawEditingState] = useState(initialDrawState);
  const [shapeEditingState, setShapeEditingState] = useState(initialShapeState);
  const [allTextElements, setAllTextElements] = useState([]);
  const [clearAllTextElements, setClearAllTextElements] = useState(false);
  const [deleteSpecificElement, setDeleteSpecificElement] = useState(null);
  // 2. Add these new state variables after your existing states
  const [allImageElements, setAllImageElements] = useState([]);
  const [clearAllImageElements, setClearAllImageElements] = useState(false);
  const [deleteSpecificImageElement, setDeleteSpecificImageElement] =
    useState(null);
  // States for draw operations
  const [allDrawElements, setAllDrawElements] = useState([]);
  const [clearAllDrawElements, setClearAllDrawElements] = useState(false);
  const [deleteSpecificDrawElement, setDeleteSpecificDrawElement] =
    useState(null);
  const [allShapeElements, setAllShapeElements] = useState([]);
  const [clearAllShapeElements, setClearAllShapeElements] = useState(false);
  const [deleteSpecificShapeElement, setDeleteSpecificShapeElement] =
    useState(null);
  // drag side bar
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOverElement, setDragOverElement] = useState(null);
  // Refs
  const fileDataCache = useRef({});
  const pdfDocumentCache = useRef({});
  const mainViewerRef = useRef(null);
  const handleDeleteSpecificComplete = () => {
    setDeleteSpecificElement(null);
  };
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
  // UPDATED: Toggle text editing mode - ab direct text add hoga
  const handleTextButtonClick = () => {
    // Sabse pehle sab toolbars band karo
    setImageEditingState((prev) => ({
      ...prev,
      showImageToolbar: false,
    }));
    setDrawEditingState((prev) => ({
      ...prev,
      showDrawToolbar: false,
      addDrawingToPage: false,
    }));
    setShapeEditingState((prev) => ({
      ...prev,
      showShapeToolbar: false,
    }));

    // Phir text toolbar kholo
    setTextEditingState((prev) => {
      const newState = {
        ...initialTextState,
        showTextToolbar: true,
        addTextToPage: true,
        onTextAdded: () => {
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
    setTextEditingState((prev) => ({
      ...prev,
      showTextToolbar: false,
    }));
    setImageEditingState((prev) => ({
      ...prev,
      showImageToolbar: false,
    }));
  };

  const options = [
    { value: "left", icon: <AlignLeft className="w-4 h-4" /> },
    { value: "center", icon: <AlignCenter className="w-4 h-4" /> },
    { value: "right", icon: <AlignRight className="w-4 h-4" /> },
  ];

  const current = options.find(
    (opt) => opt.value === textEditingState.selectedAlignment
  );

  // 3. Update your handleImageButtonClick function
  const handleImageButtonClick = () => {
    // Sabse pehle sab toolbars band karo
    setTextEditingState((prev) => ({
      ...prev,
      showTextToolbar: false,
      addTextToPage: false,
      onTextAdded: null,
    }));
    setDrawEditingState((prev) => ({
      ...prev,
      showDrawToolbar: false,
      addDrawingToPage: false,
    }));
    setShapeEditingState((prev) => ({
      ...prev,
      showShapeToolbar: false,
    }));

    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target.result;

          // Set state to show toolbar and add image
          setImageEditingState((prev) => ({
            ...prev,
            showImageToolbar: true,
            addImageToPage: true,
            selectedImageSrc: imageSrc,
            selectedImageFile: file,
            onImageAdded: () => {
              setImageEditingState((prev) => ({
                ...prev,
                addImageToPage: false,
                onImageAdded: null,
                selectedImageSrc: null,
                selectedImageFile: null,
              }));
            },
          }));
        };
        reader.readAsDataURL(file);
      }

      // Clean up
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  };
  // 4. Add image callback handlers (similar to text handlers)
  const handleImageAdd = (imageElement) => {
    console.log("Image added:", imageElement);
    setAllImageElements((prev) => [...prev, imageElement]);
  };

  const handleImageUpdate = (updatedImageElement) => {
    console.log("Image updated:", updatedImageElement);
    setAllImageElements((prev) =>
      prev.map((image) =>
        image.id === updatedImageElement.id ? updatedImageElement : image
      )
    );
  };

  const handleImageDelete = (imageId, pageNumber) => {
    console.log("Image deleted:", imageId, "from page", pageNumber);
    setAllImageElements((prev) => prev.filter((image) => image.id !== imageId));

    // Reset the delete request flag
    setImageEditingState((prev) => ({
      ...prev,
      deleteRequested: false,
    }));
  };

  // 5. Add image toolbar event handlers
  const handleImageOpacityChange = (opacity) => {
    setImageEditingState((prev) => ({
      ...prev,
      opacity: opacity,
      showOpacityDropdown: false,
    }));
  };

  const handleImageRotateLeft = () => {
    setImageEditingState((prev) => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }));
  };

  const handleImageRotateRight = () => {
    setImageEditingState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleImageFlipHorizontal = () => {
    setImageEditingState((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  const handleImageFlipVertical = () => {
    setImageEditingState((prev) => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  };
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
  const getCombinedElements = () => {
    return [
      ...allTextElements,
      ...allImageElements,
      ...allDrawElements,
      ...allShapeElements,
    ].sort((a, b) => {
      // First sort by page number
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      // Then sort by order within the same page
      return (a.order || 0) - (b.order || 0);
    });
  };

  // FIXED: Shape elements ko bhi reorder kiya ja raha hai
  const reorderElements = (draggedId, targetId, draggedType, targetType) => {
    const combinedElements = getCombinedElements();
    const draggedIndex = combinedElements.findIndex(
      (el) => el.id === draggedId
    );
    const targetIndex = combinedElements.findIndex((el) => el.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const draggedElement = combinedElements[draggedIndex];
    const targetElement = combinedElements[targetIndex];

    // Only reorder if they're on the same page
    if (draggedElement.pageNumber !== targetElement.pageNumber) return;

    // Create a copy of elements for the specific page
    const pageElements = combinedElements.filter(
      (el) => el.pageNumber === draggedElement.pageNumber
    );

    // Remove dragged element from its current position
    const draggedPageIndex = pageElements.findIndex(
      (el) => el.id === draggedId
    );
    const targetPageIndex = pageElements.findIndex((el) => el.id === targetId);

    if (draggedPageIndex === -1 || targetPageIndex === -1) return;

    // Create new array with reordered elements
    const reorderedPageElements = [...pageElements];
    const [movedElement] = reorderedPageElements.splice(draggedPageIndex, 1);
    reorderedPageElements.splice(targetPageIndex, 0, movedElement);

    // Update order values for all elements on this page
    reorderedPageElements.forEach((element, index) => {
      element.order = index;
    });

    // FIXED: Shape elements ko bhi update kiya ja raha hai
    // Update Text Elements
    const updatedTextElements = allTextElements.map((textEl) => {
      if (textEl.pageNumber === draggedElement.pageNumber) {
        const reorderedEl = reorderedPageElements.find(
          (el) => el.id === textEl.id
        );
        return reorderedEl || textEl;
      }
      return textEl;
    });

    // Update Image Elements
    const updatedImageElements = allImageElements.map((imageEl) => {
      if (imageEl.pageNumber === draggedElement.pageNumber) {
        const reorderedEl = reorderedPageElements.find(
          (el) => el.id === imageEl.id
        );
        return reorderedEl || imageEl;
      }
      return imageEl;
    });

    // Update Draw Elements
    const updatedDrawElements = allDrawElements.map((drawEl) => {
      if (drawEl.pageNumber === draggedElement.pageNumber) {
        const reorderedEl = reorderedPageElements.find(
          (el) => el.id === drawEl.id
        );
        return reorderedEl || drawEl;
      }
      return drawEl;
    });

    // Update Shape Elements
    const updatedShapeElements = allShapeElements.map((shapeEl) => {
      if (shapeEl.pageNumber === draggedElement.pageNumber) {
        const reorderedEl = reorderedPageElements.find(
          (el) => el.id === shapeEl.id
        );
        return reorderedEl || shapeEl;
      }
      return shapeEl;
    });

    // Update state with reordered elements
    setAllTextElements(updatedTextElements);
    setAllImageElements(updatedImageElements);
    setAllDrawElements(updatedDrawElements);
    setAllShapeElements(updatedShapeElements); // FIXED: Shape elements bhi update ho rahe hain
  };

  // Enhanced drag handlers with better feedback
  const handleDragStart = (e, element, elementType) => {
    setDraggedElement({ ...element, type: elementType });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ""); // For better browser support
  };

  const handleDragOver = (e, element, elementType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Only allow drop if on same page
    if (draggedElement && draggedElement.pageNumber === element.pageNumber) {
      setDragOverElement({ ...element, type: elementType });
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the element completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverElement(null);
    }
  };

  const handleDrop = (e, targetElement, targetType) => {
    e.preventDefault();

    if (!draggedElement || draggedElement.id === targetElement.id) {
      setDraggedElement(null);
      setDragOverElement(null);
      return;
    }

    // Only allow reordering within the same page
    if (draggedElement.pageNumber !== targetElement.pageNumber) {
      setDraggedElement(null);
      setDragOverElement(null);
      return;
    }

    reorderElements(
      draggedElement.id,
      targetElement.id,
      draggedElement.type,
      targetType
    );

    setDraggedElement(null);
    setDragOverElement(null);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragOverElement(null);
  };

  // Function to render individual element item
  const renderElementItem = (element, index, pageElements) => {
    // Element type detection
    const isText = element.text !== undefined;
    const isImage =
      element.src !== undefined &&
      element.text === undefined &&
      element.type === undefined;
    const isDraw = element.type !== undefined;

    const isDragging = draggedElement?.id === element.id;
    const isDragOver = dragOverElement?.id === element.id;
    const canDrop =
      draggedElement && draggedElement.pageNumber === element.pageNumber;

    return (
      <div
        key={element.id}
        draggable
        onDragStart={(e) =>
          handleDragStart(
            e,
            element,
            isText ? "text" : isDraw ? "draw" : "image"
          )
        }
        onDragOver={(e) =>
          handleDragOver(
            e,
            element,
            isText ? "text" : isDraw ? "draw" : "image"
          )
        }
        onDragLeave={handleDragLeave}
        onDrop={(e) =>
          handleDrop(e, element, isText ? "text" : isDraw ? "draw" : "image")
        }
        onDragEnd={handleDragEnd}
        className={`flex items-center justify-between p-3 rounded-lg transition-all group mb-2 cursor-move relative
          ${
            isText
              ? "bg-gray-50 hover:bg-gray-100"
              : isDraw
              ? "bg-red-50 hover:bg-red-100"
              : "bg-red-50 hover:bg-red-100"
          }
          ${isDragging ? "opacity-50 scale-95 z-10" : ""}
          ${
            isDragOver && canDrop
              ? "ring-2 ring-red-400 bg-red-100 transform scale-[1.02]"
              : ""
          }
          ${
            draggedElement &&
            !canDrop &&
            draggedElement.pageNumber !== element.pageNumber
              ? "opacity-60"
              : ""
          }
        `}
      >
        {/* Visual drop indicator */}
        {isDragOver && canDrop && (
          <div className="absolute inset-0 border-2 border-dashed border-red-400 rounded-lg bg-red-100/50 pointer-events-none" />
        )}

        {/* Order indicator */}
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          {(element.order || 0) + 1}
        </div>

        {/* Drag Handle & Element Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Element Icon */}
          <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center text-gray-600 overflow-hidden">
            {isText ? (
              <Type className="w-4 h-4" />
            ) : isDraw ? (
              element.type === "brush" ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08-2 2.5-4 4-4z"
                  />
                </svg>
              ) : element.type === "line" ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7"
                  />
                </svg>
              ) : element.type === "arrow" ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7"
                  />
                  <polyline
                    points="7,7 17,7 17,17"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              )
            ) : element.src ? (
              <img
                src={element.src}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Element Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {isText
                ? (() => {
                    const text = element.text || `New Text ${index + 1}`;
                    return text.length > 20
                      ? text.substring(0, 20) + "..."
                      : text;
                  })()
                : isDraw
                ? `${
                    element.type?.charAt(0).toUpperCase() +
                      element.type?.slice(1) || "Drawing"
                  } ${index + 1}`
                : `Image ${index + 1}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {isText ? (
                <>
                  <span>{element.fontFamily}</span>
                  <span>•</span>
                  <span>{element.fontSize}px</span>
                </>
              ) : isDraw ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: element.color || "#000000" }}
                  />
                  <span>{element.color || "#000000"}</span>
                  <span>•</span>
                  <span>{element.strokeWidth || 2}px stroke</span>
                </>
              ) : (
                <>
                  <span>
                    {Math.round(element.width)}×{Math.round(element.height)}
                  </span>
                  <span>•</span>
                  <span>{element.opacity}% opacity</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to page and select element
              if (window.markThumbnailClick) {
                window.markThumbnailClick(parseInt(element.pageNumber));
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title={`Edit ${isText ? "text" : isDraw ? "drawing" : "image"}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();

              if (isText) {
                // Delete text element
                setAllTextElements((prev) =>
                  prev.filter((t) => t.id !== element.id)
                );
                setDeleteSpecificElement({
                  textId: element.id,
                  pageNumber: element.pageNumber,
                });
              } else if (isDraw) {
                // Delete draw element
                setAllDrawElements((prev) =>
                  prev.filter((draw) => draw.id !== element.id)
                );
                setDeleteSpecificDrawElement({
                  drawId: element.id,
                  pageNumber: element.pageNumber,
                });
              } else {
                // Delete image element
                setAllImageElements((prev) =>
                  prev.filter((img) => img.id !== element.id)
                );
                setDeleteSpecificImageElement({
                  imageId: element.id,
                  pageNumber: element.pageNumber,
                });
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title={`Delete ${isText ? "text" : isDraw ? "drawing" : "image"}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  // Draw Button Handler
  const handleDrawButtonClick = () => {
    // Sabse pehle sab toolbars band karo
    setTextEditingState((prev) => ({
      ...prev,
      showTextToolbar: false,
      addTextToPage: false,
      onTextAdded: null,
    }));
    setImageEditingState((prev) => ({
      ...prev,
      showImageToolbar: false,
    }));
    setShapeEditingState((prev) => ({
      ...prev,
      showShapeToolbar: false,
    }));

    // Phir draw toolbar kholo AUR line tool select karo
    setDrawEditingState((prev) => ({
      ...prev,
      showDrawToolbar: true,
      selectedTool: "line", // Default line tool select kar do
      addDrawingToPage: true, // Drawing mode activate kar do
    }));
  };
  const handleDrawAdd = (drawElement) => {
    console.log("Draw added:", drawElement);
    setAllDrawElements((prev) => [...prev, drawElement]);
  };
  const handleDrawUpdate = (drawingId, updates) => {
    setAllDrawElements((prev) =>
      prev.map((drawing) =>
        drawing.id === drawingId ? { ...drawing, ...updates } : drawing
      )
    );
  };
  const handleDrawDelete = (drawingId) => {
    setAllDrawElements((prev) =>
      prev.filter((drawing) => drawing.id !== drawingId)
    );
  };
  // Shape Button Handler
  const handleShapeButtonClick = () => {
    // Sabse pehle sab toolbars band karo
    setTextEditingState((prev) => ({
      ...prev,
      showTextToolbar: false,
      addTextToPage: false,
      onTextAdded: null,
    }));
    setImageEditingState((prev) => ({
      ...prev,
      showImageToolbar: false,
    }));
    setDrawEditingState((prev) => ({
      ...prev,
      showDrawToolbar: false,
      addDrawingToPage: false, // Drawing mode bhi band kar do
    }));

    // Phir Shape toolbar kholo
    setShapeEditingState((prev) => ({
      ...prev,
      showShapeToolbar: true,
    }));
  };

  const handleShapeAdd = (ShapeElement) => {
    console.log("Shape added:", ShapeElement);
    setAllShapeElements((prev) => [...prev, ShapeElement]);
  };

  const handleShapeUpdate = (ShapeingId, updates) => {
    setAllShapeElements((prev) =>
      prev.map((Shapeing) =>
        Shapeing.id === ShapeingId ? { ...Shapeing, ...updates } : Shapeing
      )
    );
  };

  const handleShapeDelete = (ShapeingId) => {
    setAllShapeElements((prev) =>
      prev.filter((Shapeing) => Shapeing.id !== ShapeingId)
    );
  };

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
                    fillRule="evenodd"
                    d="M12.213 19.44H7.37c-1.35 0-2.6-.677-3.263-1.774l-3.94-6.23c-.34-.462-.102-.795.115-.983s.74-.353 1.237-.324c.51.033.98.248 1.298.593l1.208 1.27c.093.097.246.134.384.09s.23-.155.23-.28l.007-8.732C4.65 2.474 5.162 2 5.793 2c.617 0 1.12.462 1.145 1.038l.001 6.78c0 .08.036.155.1.2s.153.087.244.086h.001c.09.001.18-.03.244-.085s.1-.13.102-.21V1.075C7.63.48 8.143 0 8.775 0H8.8c.63 0 1.155.476 1.155 1.072V9.8c0 .165.155.298.346.298s.346-.134.346-.298v-7.61c0-.596.503-1.08 1.134-1.08s1.138.484 1.138 1.08V9.8c0 .165.155.298.346.298s.346-.134.346-.298V5.325c0-.596.525-1.062 1.157-1.062h.033c.63 0 1.144.472 1.145 1.066l-.002 10.64c-.002 1.916-1.68 3.47-3.74 3.47z"
                  ></path>
                </svg>
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 ${
                  textEditingState.showTextToolbar
                    ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                    : "hover:bg-red-100 text-gray-700"
                }`}
                onClick={handleTextButtonClick}
                title="Add Text Tool"
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 ${
                  imageEditingState.showImageToolbar
                    ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                    : "hover:bg-red-100 text-gray-700"
                }`}
                onClick={handleImageButtonClick}
              >
                <FaRegImage className="w-5 h-5" />
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 ${
                  drawEditingState.showDrawToolbar
                    ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                    : "hover:bg-red-100 text-gray-700"
                }`}
                onClick={handleDrawButtonClick}
              >
                <MdOutlineEdit className="w-5 h-5" />
              </button>
              <button
                className={`p-3 rounded-lg transition-all duration-200 ${
                  shapeEditingState.showShapeToolbar
                    ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                    : "hover:bg-red-100 text-gray-700"
                }`}
                onClick={handleShapeButtonClick}
              >
                <FaShapes className="w-5 h-5" />
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
                    className="appearance-none bg-white border border-gray-300 rounded px-2 py-1 pr-6 text-xs focus:outline-none focus:border-red-500 w-full"
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
                    className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:border-red-500 w-16"
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
                      ? "bg-red-100 text-red-600"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  onClick={handleItalic}
                  className={`p-2 rounded transition-colors ${
                    textEditingState.isItalic
                      ? "bg-red-100 text-red-600"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  onClick={handleUnderline}
                  className={`p-2 rounded transition-colors ${
                    textEditingState.isUnderline
                      ? "bg-red-100 text-red-600"
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
                              ? "bg-red-100 text-red-600"
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
            {imageEditingState.showImageToolbar && (
              <div className="absolute z-50 flex items-center justify-center gap-2 p-2 ml-[15px] bg-gray-50 border-b border-gray-200 rounded-lg shadow-lg">
                {/* Image Icon */}
                <span className="text-lg px-2">🖼️</span>

                {/* Opacity dropdown */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setImageEditingState((prev) => ({
                        ...prev,
                        showOpacityDropdown: !prev.showOpacityDropdown,
                      }))
                    }
                    className="flex items-center gap-1 px-3 py-2 hover:bg-gray-200 rounded text-sm font-medium"
                    title="Opacity"
                  >
                    {imageEditingState.opacity}%
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {imageEditingState.showOpacityDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[80px]">
                      {[25, 50, 75, 100].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleImageOpacityChange(option)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            imageEditingState.opacity === option
                              ? "bg-red-50 text-red-600"
                              : "text-gray-700"
                          }`}
                        >
                          {option}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                {/* Rotate left */}
                <button
                  onClick={handleImageRotateLeft}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Rotate Left"
                >
                  <RotateCcw size={16} className="text-gray-700" />
                </button>

                {/* Rotate right */}
                <button
                  onClick={handleImageRotateRight}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Rotate Right"
                >
                  <RotateCw size={16} className="text-gray-700" />
                </button>

                {/* Separator */}
                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                {/* Flip horizontal */}
                <button
                  onClick={handleImageFlipHorizontal}
                  className={`p-2 hover:bg-gray-200 rounded ${
                    imageEditingState.flipHorizontal
                      ? "bg-red-100 text-red-600"
                      : ""
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal size={16} className="text-gray-700" />
                </button>

                {/* Flip vertical */}
                <button
                  onClick={handleImageFlipVertical}
                  className={`p-2 hover:bg-gray-200 rounded ${
                    imageEditingState.flipVertical
                      ? "bg-red-100 text-red-600"
                      : ""
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical size={16} className="text-gray-700" />
                </button>

                {/* Separator */}
                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                {/* Delete */}
                <button
                  className="p-2 hover:bg-red-100 rounded text-red-600"
                  title="Delete Image"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            {drawEditingState.showDrawToolbar && (
              <div className="absolute z-50 flex items-center justify-center gap-2 p-2 ml-[15px] bg-gray-50 border-b border-gray-200 rounded-lg shadow-lg">
                {/* Line Tool - FIRST */}

                {/* Color Picker */}
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer bg-white"
                    value={drawEditingState.selectedColor}
                    onChange={(e) =>
                      setDrawEditingState((prev) => ({
                        ...prev,
                        selectedColor: e.target.value,
                      }))
                    }
                    title="Color"
                  />
                </div>

                {/* Stroke Width Input with Lines Icon */}
                <div className="flex items-center gap-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" strokeWidth="1" />
                    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
                    <line x1="3" y1="18" x2="21" y2="18" strokeWidth="3" />
                  </svg>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="w-12 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-black"
                    value={drawEditingState.strokeWidth}
                    onChange={(e) =>
                      setDrawEditingState((prev) => ({
                        ...prev,
                        strokeWidth: parseInt(e.target.value) || 2,
                      }))
                    }
                    title="Stroke Width"
                  />
                  <span className="text-xs text-gray-600">pt</span>
                </div>
                <button
                  className={`p-2 rounded transition-colors ${
                    drawEditingState.selectedTool === "line"
                      ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    setDrawEditingState((prev) => ({
                      ...prev,
                      selectedTool: "line",
                      addDrawingToPage: true,
                    }))
                  }
                  title="Line"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                  </svg>
                </button>
                {/* Brush Tool */}
                <button
                  className={`p-2 rounded transition-colors ${
                    drawEditingState.selectedTool === "brush"
                      ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    setDrawEditingState((prev) => ({
                      ...prev,
                      selectedTool: "brush",
                      addDrawingToPage: true,
                    }))
                  }
                  title="Brush"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
                    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08-2 2.5-4 4-4z" />
                  </svg>
                </button>

                {/* Arrow Tool */}
                <button
                  className={`p-2 rounded transition-colors ${
                    drawEditingState.selectedTool === "arrow"
                      ? "bg-red-100 text-red-600 ring-2 ring-red-400"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    setDrawEditingState((prev) => ({
                      ...prev,
                      selectedTool: "arrow",
                      addDrawingToPage: true,
                    }))
                  }
                  title="Arrow"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7,7 17,7 17,17" />
                  </svg>
                </button>

                {/* Undo */}
                <button
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();

                    // Only proceed if there are elements to undo
                    if (allDrawElements.length > 0) {
                      const lastElement =
                        allDrawElements[allDrawElements.length - 1];

                      // Remove the last element
                      setAllDrawElements((prev) => prev.slice(0, -1));

                      // Handle the deletion logic for the last element
                      handleDrawDelete(lastElement.id);
                      setDeleteSpecificDrawElement({
                        drawId: lastElement.id,
                        pageNumber: lastElement.pageNumber,
                      });
                    }
                  }}
                  title="Undo"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 7v6h6" />
                    <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                  </svg>
                </button>

                {/* Delete/Clear All */}
                <button
                  className="p-2 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                  onClick={() =>
                    setDrawEditingState((prev) => ({
                      ...prev,
                      showDrawToolbar: false,
                      addDrawingToPage: false,
                      selectedTool: "line", // Reset to default
                    }))
                  }
                  title="Clear All Drawings"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="m19,6v14a2,2 0 01-2,2H7a2,2 0 01-2-2V6m3,0V4a2,2 0 012-2h4a2,2 0 012,2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>

                {/* Close Toolbar */}
              </div>
            )}
            {shapeEditingState.showShapeToolbar && (
              <div className="absolute z-50 flex items-center justify-center gap-2 p-2 ml-[15px] bg-gray-50 border-b border-gray-200 rounded-lg shadow-lg">
                Hello
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
                          layoutType={currentLayout}
                          onPageChange={handlePageChange}
                          // Text editing props
                          textEditingState={textEditingState}
                          onTextAdd={handleTextAdd}
                          onTextUpdate={handleTextUpdate}
                          onTextDelete={handleTextDelete}
                          clearAllTextElements={clearAllTextElements} // ✅ NEW PROP
                          onClearAllComplete={() =>
                            setClearAllTextElements(false)
                          } // ✅ CALLBACK
                          deleteSpecificElement={deleteSpecificElement} // NEW PROP
                          onDeleteSpecificComplete={() =>
                            setDeleteSpecificElement(null)
                          }
                          // Image editing props ✅ NEW
                          imageEditingState={imageEditingState}
                          onImageAdd={handleImageAdd}
                          onImageUpdate={handleImageUpdate}
                          onImageDelete={handleImageDelete}
                          clearAllImageElements={clearAllImageElements}
                          onClearAllImageComplete={() =>
                            setClearAllImageElements(false)
                          }
                          deleteSpecificImageElement={
                            deleteSpecificImageElement
                          }
                          onDeleteSpecificImageComplete={() =>
                            setDeleteSpecificImageElement(null)
                          }
                          // Draw editing props ✅ NEW
                          drawEditingState={drawEditingState}
                          onDrawAdd={handleDrawAdd}
                          onDrawUpdate={handleDrawUpdate}
                          onDrawDelete={handleDrawDelete}
                          clearAllDrawElements={clearAllDrawElements}
                          onClearAllDrawComplete={() =>
                            setClearAllDrawElements(false)
                          }
                          deleteSpecificDrawElement={deleteSpecificDrawElement}
                          onDeleteSpecificDrawComplete={() =>
                            setDeleteSpecificDrawElement(null)
                          }
                          // Combined elements for easier management
                          combinedElements={getCombinedElements()}
                          allTextElements={allTextElements}
                          allImageElements={allImageElements}
                          allDrawElements={allDrawElements} // ✅ NEW
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

        {/* Right Sidebar - Text Elements List */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-gray-100">
              <h3 className="sticky top-0 bg-white text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
                Edit PDF
              </h3>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4">
              {/* Remove All Button */}
              {(allTextElements.length > 0 ||
                allImageElements.length > 0 ||
                allDrawElements.length > 0) && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      // Clear all elements
                      setAllTextElements([]);
                      setAllImageElements([]);
                      setAllDrawElements([]);
                      setClearAllTextElements(true);
                      setClearAllImageElements(true);
                      setClearAllDrawElements(true);
                      console.log("Removing all elements");
                    }}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    Remove all
                  </button>
                </div>
              )}

              {/* Elements by Page */}
              {allTextElements.length === 0 &&
              allImageElements.length === 0 &&
              allDrawElements.length === 0 ? (
                <div className="text-center bg-red-50 border-2 border-dashed border-red-200 p-8 rounded-lg text-red-600 mt-8 transition-colors hover:bg-red-100 hover:border-red-300">
                  <Type className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">
                    No elements added
                  </h3>
                  <p className="text-red-500 mb-4">
                    Get started by adding text, images, or drawings to your PDF
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group elements by page and show in order */}
                  {Object.entries(
                    getCombinedElements().reduce((acc, element) => {
                      const page = element.pageNumber;
                      if (!acc[page]) acc[page] = [];
                      acc[page].push(element);
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([pageNumber, pageElements]) => (
                      <div key={`page-${pageNumber}`}>
                        {/* Page Header */}
                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                          <h4 className="text-sm font-semibold text-gray-700">
                            Page {pageNumber}
                          </h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {pageElements.length} element
                            {pageElements.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Ordered Elements */}
                        {pageElements
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((element, index) =>
                            renderElementItem(element, index, pageElements)
                          )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer Action Button */}
            {(allTextElements.length > 0 ||
              allImageElements.length > 0 ||
              allDrawElements.length > 0) && (
              <div className="border-t border-gray-100 p-4">
                <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <span>Edit PDF</span>
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-red-500" />
                  </div>
                </button>
              </div>
            )}
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
