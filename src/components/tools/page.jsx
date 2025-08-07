"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, ArrowRight, ImageIcon, Download } from "lucide-react";
import { IoMdLock } from "react-icons/io";
import { Document, Page, pdfjs } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import { BsCardImage } from "react-icons/bs";
import { BsLayersHalf, BsLayersFill } from "react-icons/bs";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFPreview = memo(
  ({
    file,
    pageNumber,
    isLoading,
    onLoadSuccess,
    onLoadError,
    onRemove,
    isHealthy,
    isPasswordProtected,
    selectedPositions,
    isMosaic,
    transparency,
    degree,
    layer,
    isInSelectedRange = true,
    currentPage,
    fromPage,
    toPage,
  }) => {
    const [isClient, setIsClient] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [containerWidth, setContainerWidth] = useState(200); // ✅ Add state for width
    const elementRef = useRef(null);

    // Position mapping array - same as your selector grid
    const positionMap = [
      "left-top",
      "center-top",
      "right-top",
      "left-center",
      "center-center",
      "right-center",
      "left-bottom",
      "center-bottom",
      "right-bottom",
    ];

    // Helper functions for transparency and rotation
    const getTransparencyValue = (transparencyOption) => {
      switch (transparencyOption) {
        case "25%":
          return "0.75";
        case "50%":
          return "0.5";
        case "75%":
          return "0.25";
        case "No transparency":
        default:
          return "1";
      }
    };

    const getRotationValue = (rotationOption) => {
      switch (rotationOption) {
        case "90°":
          return "90deg";
        case "180°":
          return "180deg";
        case "270°":
          return "270deg";
        case "Do not rotate":
        default:
          return "0deg";
      }
    };

    useEffect(() => {
      setIsClient(true);
    }, []);

    // ✅ Add ResizeObserver to track container width changes
    useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          setContainerWidth(Math.max(width - 24, 150)); // Subtract padding, minimum 150px
        }
      });

      if (elementRef.current) {
        resizeObserver.observe(elementRef.current);
      }

      return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1, rootMargin: "50px" }
      );
      if (elementRef.current) observer.observe(elementRef.current);
      return () => observer.disconnect();
    }, []);

    const handleLoadError = useCallback(
      (error) => {
        setHasError(true);
        onLoadError(error, file.id);
      },
      [file.id, onLoadError]
    );

    const pdfOptions = useMemo(
      () => ({
        cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      }),
      []
    );

    // ✅ Component for position dots overlay
    const PositionDotsOverlay = ({ zIndex }) => (
      <div className={`absolute inset-0 pointer-events-none z-${zIndex}`}>
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2">
          {positionMap.map((position, index) => {
            // Get grid position classes
            const getPositionClasses = (pos) => {
              switch (pos) {
                case "left-top":
                  return "justify-start items-start";
                case "center-top":
                  return "justify-center items-start";
                case "right-top":
                  return "justify-end items-start";
                case "left-center":
                  return "justify-start items-center";
                case "center-center":
                  return "justify-center items-center";
                case "right-center":
                  return "justify-end items-center";
                case "left-bottom":
                  return "justify-start items-end";
                case "center-bottom":
                  return "justify-center items-end";
                case "right-bottom":
                  return "justify-end items-end";
                default:
                  return "justify-start items-start";
              }
            };

            // ✅ Check if current page should show position dots
            const shouldShowPosition = () => {
              // If no fromPage/toPage props provided, show on all pages (backward compatibility)
              if (
                typeof fromPage === "undefined" ||
                typeof toPage === "undefined"
              ) {
                return (
                  selectedPositions && selectedPositions.includes(position)
                );
              }

              // Check if current page is within the selected range
              const isInRange =
                pageNumber >= (fromPage || 1) && pageNumber <= (toPage || 1);
              return (
                isInRange &&
                selectedPositions &&
                selectedPositions.includes(position)
              );
            };

            return (
              <div
                key={position}
                className={`flex ${getPositionClasses(position)} p-1`}
              >
                {shouldShowPosition() && (
                  <div
                    className="w-4 h-4 bg-red-600 rounded-full shadow-lg border border-red-700"
                    style={{
                      opacity: getTransparencyValue(
                        transparency || "No transparency"
                      ),
                      transform: `rotate(${getRotationValue(
                        degree || "Do not rotate"
                      )})`,
                      transition: "all 0.3s ease-in-out",
                    }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div
        ref={elementRef}
        className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden relative ${
          isPasswordProtected
            ? "border-yellow-300 bg-yellow-50"
            : isHealthy
            ? "border-gray-200 hover:border-red-300 hover:shadow-lg"
            : "border-yellow-300 bg-yellow-50"
        }`}
      >
        {/* ✅ Keep original height same as single page */}
        <div className="relative h-56 p-3 overflow-hidden">
          <div className="w-full h-full relative overflow-hidden rounded-lg flex items-center justify-center">
            {!file.stableData ? null : isPasswordProtected ? (
              <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center rounded-lg relative">
                <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Password required
                </div>
                <IoMdLock className="text-4xl text-gray-600 mb-2" />
                <div className="flex items-center gap-1 bg-black rounded-full py-1 px-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-white rounded-full"
                    ></div>
                  ))}
                </div>
              </div>
            ) : !isVisible || hasError || !isHealthy ? (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg relative">
                <FileText className="w-16 h-16 text-gray-400" />
                <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
                  PDF
                </div>
                {!isHealthy && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    Preview Issue
                  </div>
                )}
              </div>
            ) : (
              isClient && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* ✅ Render overlay BELOW PDF when layer is "below" */}
                  {isClient && layer === "below" && (
                    <PositionDotsOverlay zIndex="0" />
                  )}

                  <Document
                    file={file.stableData.dataUrl}
                    onLoadSuccess={(pdf) => {
                      if (pageNumber === 1) {
                        onLoadSuccess(pdf, file.id);
                      }
                    }}
                    onLoadError={handleLoadError}
                    loading={
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    }
                    error={
                      <div className="w-full bg-red-50 flex flex-col items-center justify-center rounded-lg p-4">
                        <FileText className="w-12 h-12 text-red-400 mb-2" />
                        <div className="text-sm text-red-600 font-medium text-center">
                          Could not load preview
                        </div>
                      </div>
                    }
                    options={pdfOptions}
                  >
                    {/* ✅ Improved centering with better container structure */}
                    <div className="flex items-center justify-center w-full relative z-5">
                      <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={containerWidth} // ✅ Use state instead of direct calculation
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </Document>

                  {/* ✅ Render overlay OVER PDF when layer is "over" (default) */}
                  {isClient && (layer === "over" || !layer) && (
                    <PositionDotsOverlay zIndex="10" />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }
);
PDFPreview.displayName = "PDFPreview";

const fontFamilies = [
  "Arial",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Lucida Console",
  "Palatino Linotype",
  "Book Antiqua",
  "Comic Sans MS",
  "Impact",
  "Segoe UI",
  "Candara",
  "Optima",
  "Lucida Sans Unicode",
  "Century Gothic",
  "Franklin Gothic Medium",
];

const colors = [
  ["#000000", "#444444", "#666666", "#999999", "#CCCCCC", "#E6E6E6", "#FFFFFF"],
  [
    "#F4CCCC",
    "#FCE5CD",
    "#FFF2CC",
    "#D9EAD3",
    "#D0E0E3",
    "#CFE2F3",
    "#D9D2E9",
    "#EAD1DC",
  ],
  [
    "#EA9999",
    "#F9CB9C",
    "#FFE599",
    "#B6D7A8",
    "#A2C4C9",
    "#9FC5E8",
    "#B4A7D6",
    "#D5A6BD",
  ],
  [
    "#E06666",
    "#F6B26B",
    "#FFD966",
    "#93C47D",
    "#76A5AF",
    "#6FA8DC",
    "#8E7CC3",
    "#C27BA0",
  ],
  [
    "#CC0000",
    "#E69138",
    "#F1C232",
    "#6AA84F",
    "#45818E",
    "#3D85C6",
    "#674EA7",
    "#A64D79",
  ],
  [
    "#990000",
    "#B45F06",
    "#BF9000",
    "#38761D",
    "#134F5C",
    "#0B5394",
    "#351C75",
    "#741B47",
  ],

  [
    "#FF0000",
    "#FF9900",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#0000FF",
    "#9900FF",
    "#FF00FF",
  ],
];

export default function comparepdf() {
  // 📦 State: File Uploading & PDF Handling
  const [files, setFiles] = useState([]);
  const [protectedFiles, setProtectedFiles] = useState([]);
  const [leftFiles, setLeftFiles] = useState([]);
  const [rightFiles, setRightFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPages, setPdfPages] = useState({});
  const [loadingPdfs, setLoadingPdfs] = useState(new Set());
  const [pdfHealthCheck, setPdfHealthCheck] = useState({});
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(
    new Set()
  );
  const [dropFile, setDropFile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // 🟢 Watermark Mode: Text or Image
  const [activeOption, setActiveOption] = useState("text"); // "text" | "image"

  // 🖼️ Image Watermark
  const [selectedImage, setSelectedImage] = useState(null);

  // ✍️ Text Formatting
  const [watermarkText, setWatermarkText] = useState("Pdf ToolsHub Watermark");
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState(14);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");

  // 🎛️ Dropdown Visibility
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 📍 Positioning & Mosaic
  const [selected, setSelected] = useState(["left-top"]);
  const [isMosaic, setIsMosaic] = useState(false);
  const [text, setText] = useState("This is a live preview text");

  // 🌫️ Transparency
  const [transparency, setTransparency] = useState("No transparency");
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);

  // 🔄 Rotation
  const [degree, setDegree] = useState("Do not rotate");
  const [isDegreeOpen, setIsDegreeOpen] = useState(false);

  // 📄 Page Range - Initialize with null to force proper updates
  const [fromPage, setFromPage] = useState(null);
  const [toPage, setToPage] = useState(null);

  // 🧱 Layer Control
  const [layer, setIsLayer] = useState("over"); // "over" | "below"

  // ⚙️ Conversion Options
  const [conversionMode, setConversionMode] = useState("pages");
  const [imageQuality, setImageQuality] = useState("normal");
  const [isDragging, setIsDragging] = useState({ left: false, right: false });
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);

  // 📌 Constants
  const fontSizeMin = 1;
  const fontSizeMax = 100;
  const fillPercent =
    ((selectedSize - fontSizeMin) / (fontSizeMax - fontSizeMin)) * 100;

  // 📌 Refs
  const fileRefs = useRef({});
  const fileDataCache = useRef({});
  const pdfDocumentCache = useRef({});
  const transparencyRef = useRef(null);
  const degreeRef = useRef(null);
  const router = useRouter();

  const handleClick = (index) => {
    const position = positionMap[index];
    setSelected((prev) =>
      prev.includes(position)
        ? prev.filter((pos) => pos !== position)
        : [...prev, position]
    );
  };

  useEffect(() => {
    if (selected.length === 0) {
      setSelected(["left-top"]);
    } else if (selected.length === 9) {
      setIsMosaic(true);
    } else {
      setIsMosaic(false);
    }
  }, [selected]);
  // 🔁 Effects
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        transparencyRef.current &&
        !transparencyRef.current.contains(event.target)
      ) {
        setIsTransparencyOpen(false);
      }
      if (degreeRef.current && !degreeRef.current.contains(event.target)) {
        setIsDegreeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // This useEffect will trigger whenever selectedFileId changes (including auto-selection)
  useEffect(() => {
    if (selectedFileId && files.length > 0) {
      const selectedFile = files.find((file) => file.id === selectedFileId);
      if (selectedFile && selectedFile.numPages) {
        setFromPage(1);
        setToPage(selectedFile.numPages);
      }
    }
  }, [selectedFileId, files]);

  useEffect(() => {
    const defaultPdfContent = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
    ]);
    const blob = new Blob([defaultPdfContent], { type: "application/pdf" });

    const defaultFile = {
      id: Date.now() + Math.random(),
      name: "facebook_com_watermark.pdf",
      size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
      type: "application/pdf",
      file: new File([blob], "facebook_com_watermark.pdf", {
        type: "application/pdf",
      }),
      stableData: {
        blob: blob,
        dataUrl: URL.createObjectURL(blob),
        isPasswordProtected: false,
        uint8Array: defaultPdfContent,
      },
    };

    setFiles([defaultFile]);
  }, []);

  // Check if a file is password protected by trying to read it
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      try {
        // Try to load the PDF with PDF.js
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "", // Empty password
        });

        const pdf = await loadingTask.promise;

        // If we reach here, PDF loaded successfully - not password protected
        console.log(
          `File ${file.name} loaded successfully - not password protected`
        );
        return false;
      } catch (pdfError) {
        // Check if the error is specifically about password protection
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

        // Other PDF errors don't necessarily mean password protection
        console.warn(`PDF load error for ${file.name}:`, pdfError);
        return false;
      }
    } catch (error) {
      console.warn("Error checking password protection with PDF.js:", error);
      return false;
    }
  }, []);

  // Optimized file data creation with object URLs
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id];
      }

      try {
        // Check for password protection first
        const isPasswordProtected = await checkPasswordProtection(file, id);

        if (isPasswordProtected) {
          // For password protected files, don't create data URL to avoid browser prompt
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

        // Use object URL instead of data URL for better performance
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
  // Modified handleFiles function
  const handleFiles = useCallback(
    async (newFiles) => {
      const fileObjects = await Promise.all(
        newFiles.map(async (file, index) => {
          const id = `${file.name}-${Date.now()}-${Math.random()}`;
          const stableData = await createStableFileData(file, id);

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
            numPages: null, // Initially null, will be set by onDocumentLoadSuccess
          };
        })
      );

      // Simply append new files - useEffect will handle page range setting
      setFiles((prev) => [...prev, ...fileObjects]);
    },
    [createStableFileData]
  );
  console.log("Files state:", files);
  // Modified onDocumentLoadSuccess function
  const onDocumentLoadSuccess = useCallback((pdf, fileId) => {
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

    // ✅ Update the file object with actual numPages
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId ? { ...file, numPages: pdf.numPages } : file
      )
    );

    // ✅ If this is the currently selected file, update page range immediately
    setSelectedFileId((currentSelectedId) => {
      if (currentSelectedId === fileId) {
        setFromPage(1);
        setToPage(pdf.numPages);
      }
      return currentSelectedId;
    });
  }, []);

  // Simplified useEffect for initial file selection
  useEffect(() => {
    if (files.length > 0) {
      // Auto-select first file if none selected
      if (!selectedFileId || !files.find((f) => f.id === selectedFileId)) {
        const firstFile = files[0];
        setSelectedFileId(firstFile.id);

        // Only set page range if numPages is already available
        if (firstFile.numPages) {
          setFromPage(1);
          setToPage(firstFile.numPages);
        } else {
          // Will be set by onDocumentLoadSuccess
          setFromPage(1);
          setToPage(1);
        }
      }
    } else {
      // Reset everything when no files
      setSelectedFileId(null);
      setFromPage(null);
      setToPage(null);
    }
  }, [files, selectedFileId]);

  // useEffect for page range setting when file selection changes
  useEffect(() => {
    if (selectedFileId && files.length > 0) {
      const selectedFile = files.find((file) => file.id === selectedFileId);
      if (selectedFile) {
        if (selectedFile.numPages) {
          // numPages is available, set immediately
          setFromPage(1);
          setToPage(selectedFile.numPages);
        } else {
          // numPages not yet available, set temporary values
          setFromPage(1);
          setToPage(1);
          // onDocumentLoadSuccess will update these when PDF loads
        }
      }
    }
  }, [selectedFileId, files]);

  // Modified getTotalPages function
  const getTotalPages = useCallback(() => {
    if (selectedFileId) {
      const selectedFile = files.find((file) => file.id === selectedFileId);
      if (selectedFile && selectedFile.numPages) {
        return selectedFile.numPages;
      }
    }
    // Fallback to first file if no specific selection
    if (files.length > 0 && files[0].numPages) {
      return files[0].numPages;
    }
    return 1; // default if no file or no numPages
  }, [selectedFileId, files]);

  // useEffect for real-time validation of page ranges
  useEffect(() => {
    if (fromPage === null || toPage === null) return;

    const totalPages = getTotalPages();

    // Skip validation if totalPages is still 1 (default) and file might not be loaded yet
    const selectedFile = files.find((file) => file.id === selectedFileId);
    if (selectedFile && selectedFile.numPages === null && totalPages === 1) {
      return; // Wait for actual numPages to be loaded
    }

    // Validate and correct fromPage
    if (fromPage < 1) {
      setFromPage(1);
    } else if (fromPage > totalPages) {
      setFromPage(totalPages);
    }

    // Validate and correct toPage
    if (toPage < fromPage) {
      setToPage(fromPage);
    } else if (toPage > totalPages) {
      setToPage(totalPages);
    }
  }, [fromPage, toPage, getTotalPages, selectedFileId, files]);

  // Handler for file selection with immediate page range update
  const handleFileSelection = (fileId) => {
    setSelectedFileId(fileId);
    // Immediate update of page range
    const selectedFile = files.find((file) => file.id === fileId);
    if (selectedFile) {
      if (selectedFile.numPages) {
        setFromPage(1);
        setToPage(selectedFile.numPages);
      } else {
        // Set temporary values, will be updated by onDocumentLoadSuccess
        setFromPage(1);
        setToPage(1);
      }
    }
  };
  // Simple onChange handlers - useEffect handles validation
  const handleFromPageChange = (e) => {
    const value = Number(e.target.value);
    setFromPage(value);
  };

  const handleToPageChange = (e) => {
    const value = Number(e.target.value);
    setToPage(value);
  };
  // Protected files ke liye - sirf password modal show karta hai
  const handleProtectedFiles = useCallback((passwordProtectedFiles) => {
    console.log("Password protected files detected:", passwordProtectedFiles);
    setProtectedFiles(passwordProtectedFiles); // Store temporarily for modal
    setShowPasswordModal(true); // Show password input modal
  }, []);

  const handleUnlockedFiles = useCallback(
    (unlockedFiles) => {
      console.log("✅ Final Unlocked Files:", unlockedFiles);

      unlockedFiles.forEach((file, index) => {
        console.log(`🔓 File #${index + 1}:`, {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          fileObj: file.file,
          stableData: file.stableData,
          isUnlocked: file.isUnlocked,
        });

        if (!file.stableData) {
          console.warn("⚠️ stableData missing for file:", file.id);
        } else {
          console.log("✅ stableData contains:", {
            dataUrl: file.stableData.dataUrl,
            password: file.stableData.password,
            uint8Array: file.stableData.uint8Array,
          });
        }
      });

      // ✅ Then continue with handleFiles:
      handleFiles(unlockedFiles);
    },
    [handleFiles]
  );

  // Optimized remove function with cleanup
  const removeFile = useCallback((id) => {
    // Clean up object URL
    const fileData = fileDataCache.current[id];
    if (fileData && fileData.dataUrl && fileData.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.dataUrl);
    }

    // Clean up all other references
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

  // Optimized sort function
  const sortFilesByName = useCallback((order = "asc") => {
    setFiles((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (order === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
      return sorted;
    });
  }, []);

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

  // Handle password submission for protected files with watermark data
  const handlePasswordSubmit = useCallback(
    async (passwords) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        const isSingleFile = files.length === 1;

        // ✅ Watermark + metadata payload
        const watermarkPayload = {
          filesMeta: files.map((file) => ({
            name: file.name,
            id: file.id,
          })),
          watermarkOptions: {
            font: selectedFont,
            size: selectedSize,
            bold,
            italic,
            underline,
            color: selectedColor,
            position: selected,
            isMosaic,
            transparency,
            rotation: degree,
            fromPage: isSingleFile ? fromPage : null,
            toPage: isSingleFile ? toPage : null,
            applyToAllPages: !isSingleFile,
            layer,
            type: activeOption,
            text: activeOption === "text" ? watermarkText : "",
            image: activeOption === "image" ? selectedImage : "",
          },
        };

        // ✅ Append all files
        files.forEach((file) => {
          formData.append("files", file.file);
        });

        // ✅ Append image file if selected
        if (activeOption === "image" && selectedImage instanceof File) {
          formData.append("watermarkImage", selectedImage);
        }

        // ✅ Append watermarkPayload as JSON string
        formData.append("watermarkPayload", JSON.stringify(watermarkPayload));

        // ✅ Prepare passwords mapping
        const filePasswords = {};
        files.forEach((file) => {
          if (passwordProtectedFiles.has(file.id)) {
            filePasswords[file.name] = passwords[file.id] || "";
          }
        });
        formData.append("passwords", JSON.stringify(filePasswords));

        // ✅ Append conversion options
        formData.append("conversionMode", conversionMode);
        formData.append("imageQuality", imageQuality);

        // ✅ Debug log for preview
        console.log("🚀 Final FormData Structure:");
        for (let [key, value] of formData.entries()) {
          if (key === "files" || key === "watermarkImage") {
            console.log(`${key}:`, value);
          } else {
            try {
              console.log(`${key}:`, JSON.parse(value));
            } catch {
              console.log(`${key}:`, value);
            }
          }
        }

        // ✅ API call
        const response = await Api.post("/tools/pdf-to-jpg", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        });

        // ✅ Success flow
        if (response.data) {
          const encodedZipPath = encodeURIComponent(
            response.data.data.zipFileUrl
          );
          const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}`;
          router.push(downloadUrl);
        } else {
          toast.error("No converted files received from server");
        }
      } catch (error) {
        console.error("Convert error:", error);
        toast.error(error?.response?.data?.message || "Error converting files");
      } finally {
        setIsUploading(false);
      }
    },
    [
      files,
      passwordProtectedFiles,
      conversionMode,
      imageQuality,
      router,
      selectedFont,
      selectedSize,
      bold,
      italic,
      underline,
      selectedColor,
      selected,
      isMosaic,
      transparency,
      degree,
      fromPage,
      toPage,
      layer,
      activeOption,
      watermarkText,
      selectedImage, // ✅ Required for condition
    ]
  );
  // Handle convert function
  const handleAddWatermark = useCallback(async () => {
    if (files.length === 0) return;
    // Get current password-protected files
    const currentProtectedFiles = files.filter((file) =>
      passwordProtectedFiles.has(file.id)
    );
    if (currentProtectedFiles.length > 0) {
      setShowPasswordModal(true);
      return;
    }
    // // No password-protected files, proceed normally
    await handlePasswordSubmit({});
  }, [files, passwordProtectedFiles, handlePasswordSubmit]);

  // Memoized total size calculation
  const totalSize = useMemo(
    () =>
      files
        .reduce((total, file) => total + Number.parseFloat(file.size), 0)
        .toFixed(2),
    [files]
  );

  // Memoized total pages calculation
  const totalPages = useMemo(
    () => Object.values(pdfPages).reduce((total, pages) => total + pages, 0),
    [pdfPages]
  );

  // Memoized health check status
  const hasUnhealthyFiles = useMemo(
    () => Object.values(pdfHealthCheck).some((health) => health === false),
    [pdfHealthCheck]
  );

  const SafeFileUploader = ({
    whileTap,
    whileHover,
    animate,
    initial,
    ...safeProps
  }) => {
    return <FileUploaderForWatermark {...safeProps} />;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all object URLs
      Object.values(fileDataCache.current).forEach((data) => {
        if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(data.dataUrl);
        }
      });
    };
  }, []);

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />;
  }

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the width between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add mouse move and mouse up listeners to document when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const UploadArea = ({
    side,
    isDragging: isDrag,
    isMultiple = true,
    allowedTypes = [".pdf"],

    onFilesSelect,
  }) => (
    <div
      className={`h-full border-2 border-dashed flex flex-col items-center justify-center relative transition-colors duration-200 ${
        isDrag
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      }`}
      isDragging={(e) => isDragging(e, side)}
      // onDragLeave={(e) => onDragLeave(e, side)}
      // onDrop={(e) => onDrop(e, side)}
    >
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-2 font-medium">Drag and drop</p>
        <p className="text-gray-500 text-sm mb-4">Or</p>
        <label className="cursor-pointer">
          <input
            id="file-upload"
            type="file"
            multiple={isMultiple}
            accept={allowedTypes.join(",")}
            onChange={(e) => onFilesSelect(e, side)}
            className="hidden"
          />
          <span className="inline-block bg-white text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition-colors duration-200 text-sm font-medium">
            Select file
          </span>
        </label>
      </div>
    </div>
  );
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  if (files.length === 0) {
    return (
      <SafeFileUploader
        isMultiple={true}
        onFilesSelect={handleFiles}
        onPasswordProtectedFile={handleProtectedFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF files"
        pageTitle="Compare PDF"
        pageSubTitle="Easily display the differences between two similar files."
      />
    );
  }
  const selectedFile = files.find((f) => f.id === selectedFileId);

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        <div
          className={`${
            isSidebarVisible ? "md:col-span-7" : "col-span-12"
          } bg-gray-100 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out transform`}
        >
          <div className="flex justify-between items-center sticky top-0 z-10 bg-white border-b">
            <div className="flex items-center">
              <div className="w-16 cursor-pointer hover:bg-slate-100 hover:text-red-600 p-3 border-r border-gray-300 flex items-center justify-center">
                <svg
                  width="18"
                  height="24"
                  viewBox="0 0 18 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {" "}
                  <path
                    d="M17.9529 10.8518L17.9507 6.69579C17.9507 5.45806 16.8918 4.45103 15.6483 4.45103C15.3427 4.45103 15.0405 4.51239 14.7383 4.62248V3.97368C14.7383 2.78287 13.8592 1.80471 12.6628 1.80471H12.4915C12.2379 1.80471 11.8952 1.8742 11.6689 1.9539C11.6314 0.717073 10.739 0 9.60939 0H9.43804C8.24193 0 7.48552 0.945971 7.48552 2.13678V2.30252C7.08541 2.1422 6.81736 2.1055 6.57439 2.1055H6.40304C5.20663 2.1055 4.16131 3.15584 4.16131 4.34666V10.2276C3.85911 9.9921 3.59348 9.81464 3.23174 9.71328C2.57294 9.52889 1.89934 9.61071 1.30219 9.94368C0.0782763 10.6265 -0.355986 12.1674 0.3149 13.3901C0.476577 13.7357 0.89301 14.6579 1.0157 15.1187C1.43183 16.6804 2.0728 18.7014 3.33238 20.4847C4.98028 22.8179 7.18574 24.0003 9.88863 24C9.93335 24 9.97929 23.9997 10.0243 23.9991C12.5039 23.963 14.3413 23.3175 15.6416 22.025C17.1623 20.513 18 18.5281 18 16.4304L17.9529 10.8518ZM14.615 21.0024C13.5954 22.016 12.0871 22.5237 10.0035 22.5538C9.96569 22.5544 9.92821 22.5547 9.89074 22.5547C6.26614 22.5547 3.82255 19.9995 2.42396 14.7481C2.24264 14.0675 1.605 12.7085 1.605 12.7085C1.30551 12.1773 1.49651 11.5023 2.03019 11.2046C2.28888 11.0602 2.58836 11.0247 2.87394 11.105C3.15921 11.185 3.39644 11.3709 3.5412 11.6284L5.81949 15.4138C6.02559 15.7561 6.47164 15.8677 6.81585 15.6625C7.16005 15.4574 7.26492 15.0134 7.05882 14.6708L5.67232 12.3782V4.34666C5.67232 3.95323 6.00746 3.60943 6.40304 3.60943H6.57439C6.96967 3.60943 7.48552 3.95323 7.48552 4.34666V11.0157C7.48552 11.4148 7.6889 11.7385 8.08992 11.7385C8.49095 11.7385 8.69433 11.4148 8.69433 11.0157V2.13678C8.69433 1.74335 8.90889 1.20314 9.30417 1.20314H9.60939C10.005 1.20314 10.2053 1.74335 10.2053 2.13678V11.3649C10.2053 11.764 10.5598 12.0877 10.9608 12.0877C11.3619 12.0877 11.7163 11.764 11.7163 11.3649V3.92706C11.6665 3.47979 11.9916 3.00786 12.3712 3.00786H12.5426C12.9378 3.00786 13.2273 3.57995 13.2273 3.97368V12.0642C13.2273 12.4634 13.5818 12.787 13.9828 12.787C14.3839 12.787 14.7383 12.4634 14.7383 12.0642V6.98244C14.7006 6.24131 15.2557 5.8963 15.6984 5.8963C16.1412 5.8963 16.5516 6.25514 16.5516 6.69579V10.548L16.5739 16.4367C16.5739 18.1419 15.861 19.7634 14.615 21.0024Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <div className="flex p-3 hover:bg-slate-100 hover:text-red-600 cursor-pointer items-center gap-2 text-sm">
                <svg
                  width="33"
                  height="26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14 13v7h-3.5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1H14Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14.764 1H9a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h5.764a2.997 2.997 0 0 1-.593-1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h5.17c.132-.373.336-.711.594-1Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M14 5.5v1h-3a.5.5 0 0 1 0-1h3ZM14 8.5v1h-3a.5.5 0 0 1 0-1h3Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M30 2H17a1 1 0 0 0-1 1v20a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1ZM17 1a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H17Z"
                    fill="currentColor"
                  ></path>
                  <rect
                    x="17.5"
                    y="13"
                    width="12"
                    height="7"
                    rx="1"
                    fill="currentColor"
                  ></rect>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M18.5 6a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5ZM18.5 9a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM.853 7.854a.5.5 0 1 1-.707-.708l2-2a.498.498 0 0 1 .708 0l2 2a.5.5 0 1 1-.708.708L2.5 6.207.853 7.854Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.5 5.625c.345 0 .625.28.625.625V10a.625.625 0 1 1-1.25 0V6.25c0-.345.28-.625.625-.625ZM4.147 18.146a.5.5 0 0 1 .707.708l-2 2a.498.498 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L2.5 19.793l1.647-1.647Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.5 20.375a.625.625 0 0 1-.625-.625V16a.625.625 0 1 1 1.25 0v3.75c0 .345-.28.625-.625.625Z"
                    fill="currentColor"
                  ></path>
                  <circle cx="2.5" cy="13" r="1" fill="currentColor"></circle>
                </svg>

                <h5>Scroll sync</h5>
              </div>
            </div>
            <div
              className="hidden md:flex w-16 cursor-pointer hover:text-red-600 p-3 border-r border-gray-300 items-center justify-center"
              onClick={toggleSidebar}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {" "}
                <rect
                  x="0.75"
                  y="0.75"
                  width="18.5"
                  height="18.5"
                  rx="3.25"
                  stroke="currentColor"
                  stroke-width="1.5"
                ></rect>{" "}
                <line
                  x1="13.75"
                  y1="1"
                  x2="13.75"
                  y2="20"
                  stroke="currentColor"
                  stroke-width="1.5"
                ></line>{" "}
              </svg>
            </div>
          </div>
          <div className="h-[calc(100%-3.2rem)] w-full bg-gray-100 p-4">
            <div
              ref={containerRef}
              className="h-full w-full relative flex bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Left Panel */}
              <div style={{ width: `${leftWidth}%` }} className="h-full">
                {leftFiles && leftFiles.length > 0 ? (
                  // Show PDF Preview when files are selected
                  <div className="h-full w-full overflow-auto">
                    {leftFiles.map((file) => {
                      return leftFiles.flatMap((file) => {
                        return Array.from(
                          { length: file.numPages || 1 },
                          (_, index) => {
                            const currentPageNumber = index + 1;
                            const isPageInRange =
                              currentPageNumber >= fromPage &&
                              currentPageNumber <= toPage;

                            return (
                              <div
                                key={`${file.id}-page-${currentPageNumber}`}
                                className="place-content-center justify-center items-center"
                              >
                                <PDFPreview
                                  file={file}
                                  pageNumber={currentPageNumber}
                                  isLoading={loadingPdfs.has(file.id)}
                                  onLoadSuccess={(pdf, fileId) => {
                                    file.numPages = pdf.numPages;
                                    onDocumentLoadSuccess(pdf, fileId);
                                  }}
                                  onLoadError={onDocumentLoadError}
                                  onRemove={removeFile}
                                  isHealthy={pdfHealthCheck[file.id] !== false}
                                  isPasswordProtected={passwordProtectedFiles.has(
                                    file.id
                                  )}
                                  selectedPositions={
                                    isPageInRange ? selected : []
                                  }
                                  isMosaic={isMosaic}
                                  transparency={transparency}
                                  degree={degree}
                                  isInSelectedRange={isPageInRange}
                                  currentPage={currentPageNumber}
                                  fromPage={fromPage}
                                  toPage={toPage}
                                  layer={layer}
                                />
                              </div>
                            );
                          }
                        );
                      });
                    })}
                  </div>
                ) : (
                  // Show Upload Area when no files are selected
                  <UploadArea
                    side="left"
                    isDragging={isDragging.left}
                    onFilesSelect={handleFiles}
                  />
                )}
              </div>

              {/* Resizer */}
              <div
                className={`w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors duration-200 relative group ${
                  isResizing ? "bg-blue-500" : ""
                }`}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
                </div>
              </div>

              {/* Right Panel */}
              <div style={{ width: `${100 - leftWidth}%` }} className="h-full">
                {rightFiles && rightFiles.length > 0 ? (
                  // Show PDF Preview when files are selected
                  <div className="h-full w-full overflow-auto">
                    {rightFiles.flatMap((file) => {
                      return Array.from(
                        { length: file.numPages || 1 },
                        (_, index) => {
                          const currentPageNumber = index + 1;
                          const isPageInRange =
                            currentPageNumber >= fromPage &&
                            currentPageNumber <= toPage;

                          return (
                            <div
                              key={`${file.id}-page-${currentPageNumber}`}
                              className="place-content-center justify-center items-center"
                            >
                              <PDFPreview
                                file={file}
                                pageNumber={currentPageNumber}
                                isLoading={loadingPdfs.has(file.id)}
                                onLoadSuccess={(pdf, fileId) => {
                                  file.numPages = pdf.numPages;
                                  onDocumentLoadSuccess(pdf, fileId);
                                }}
                                onLoadError={onDocumentLoadError}
                                onRemove={removeFile}
                                isHealthy={pdfHealthCheck[file.id] !== false}
                                isPasswordProtected={passwordProtectedFiles.has(
                                  file.id
                                )}
                                selectedPositions={
                                  isPageInRange ? selected : []
                                }
                                isMosaic={isMosaic}
                                transparency={transparency}
                                degree={degree}
                                isInSelectedRange={isPageInRange}
                                currentPage={currentPageNumber}
                                fromPage={fromPage}
                                toPage={toPage}
                                layer={layer}
                              />
                            </div>
                          );
                        }
                      );
                    })}
                  </div>
                ) : (
                  // Show Upload Area when no files are selected
                  <UploadArea
                    side="right"
                    isDragging={isDragging.right}
                    onFilesSelect={handleFiles}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        {isSidebarVisible && (
          <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
            <div className="">
              <h3 className="text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
                Watermark options
              </h3>

              {/* Conversion Mode Options */}
              <div className="w-full relative">
                <div className="flex w-full border border-gray-200 rounded-t overflow-hidden">
                  {/* Text Option */}
                  <div
                    onClick={() => setActiveOption("text")}
                    className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
    ${
      activeOption === "text"
        ? "bg-red-100 border-r border-red-600 border-b-0"
        : "bg-white border-r-0 border-b border-gray-300"
    }`}
                  >
                    {activeOption === "text" && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✔</span>
                      </div>
                    )}

                    {/* existing content remains same */}
                    <div className="flex flex-col p-0 m-0 items-center leading-none">
                      <div
                        className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${
                          activeOption === "text"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        A
                      </div>
                      <span
                        className={`w-12 h-[3px] ${
                          activeOption === "text" ? "bg-red-600" : "bg-gray-500"
                        }`}
                        style={{ marginTop: "1px" }}
                      />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        activeOption === "text"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      Place text
                    </p>
                  </div>

                  {/* Image Option */}
                  <div
                    onClick={() => setActiveOption("image")}
                    className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
    ${
      activeOption === "image"
        ? "bg-red-100 border-l border-red-600 border-b-0"
        : "bg-white border-l-0 border-b border-gray-300"
    }`}
                  >
                    {activeOption === "image" && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✔</span>
                      </div>
                    )}

                    {/* existing content remains same */}
                    <div className="flex flex-col p-0 m-0 items-center leading-none">
                      <div
                        className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${
                          activeOption === "image"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        <BsCardImage width="53px" height="43px" />
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        activeOption === "image"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      Place image
                    </p>
                  </div>
                </div>
              </div>
              {/* Label based on selection */}
              <div className="my-4 mx-6 text-lg font-semibold text-gray-700">
                {activeOption === "text" ? <>HEllo</> : <>Hello</>}
              </div>

              {hasUnhealthyFiles && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Some files have preview issues but can still be converted.
                    Check the yellow-highlighted files.
                  </p>
                </div>
              )}

              {passwordProtectedFiles.size > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    {passwordProtectedFiles.size} password-protected file
                    {passwordProtectedFiles.size > 1 ? "s" : ""} detected.
                    Passwords will be required for conversion.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={handleAddWatermark}
                disabled={files.length === 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                  files.length > 0
                    ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Add Watermark
                <ArrowRight className="w-5 h-5" />
              </button>

              {files.length === 0 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Select PDF files to add Watermark
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleAddWatermark}
          disabled={files.length === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            files.length > 0
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Add Watermark
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
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
              <h3 className="text-xl font-bold text-gray-900">
                Watermark options
              </h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Conversion Mode Options */}
            <div className="w-full relative">
              <div className="flex w-full border border-gray-200 rounded-t overflow-hidden">
                {/* Text Option */}
                <div
                  onClick={() => setActiveOption("text")}
                  className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
    ${
      activeOption === "text"
        ? "bg-red-100 border-r border-red-600 border-b-0"
        : "bg-white border-r-0 border-b border-gray-300"
    }`}
                >
                  {activeOption === "text" && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✔</span>
                    </div>
                  )}

                  {/* existing content remains same */}
                  <div className="flex flex-col p-0 m-0 items-center leading-none">
                    <div
                      className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${
                        activeOption === "text"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      A
                    </div>
                    <span
                      className={`w-12 h-[3px] ${
                        activeOption === "text" ? "bg-red-600" : "bg-gray-500"
                      }`}
                      style={{ marginTop: "1px" }}
                    />
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      activeOption === "text" ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    Place text
                  </p>
                </div>

                {/* Image Option */}
                <div
                  onClick={() => setActiveOption("image")}
                  className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
    ${
      activeOption === "image"
        ? "bg-red-100 border-l border-red-600 border-b-0"
        : "bg-white border-l-0 border-b border-gray-300"
    }`}
                >
                  {activeOption === "image" && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✔</span>
                    </div>
                  )}

                  {/* existing content remains same */}
                  <div className="flex flex-col p-0 m-0 items-center leading-none">
                    <div
                      className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${
                        activeOption === "image"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      <BsCardImage width="53px" height="43px" />
                    </div>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      activeOption === "image"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    Place image
                  </p>
                </div>
              </div>
            </div>
            {/* Label based on selection */}
            <div className="my-4 mx-6 text-lg font-semibold text-gray-700">
              {activeOption === "text" ? <>Hello</> : <>Hello</>}
            </div>

            <div className="space-y-4 mb-6">
              {passwordProtectedFiles.size > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Password protected:</span>
                  <span className="font-semibold text-yellow-600">
                    {passwordProtectedFiles.size}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PasswordModelPreveiw
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setProtectedFiles([]); // Clear protected files on modal close
        }}
        passwordProtectedFiles={protectedFiles}
        onPasswordVerified={handleUnlockedFiles} // ✅ ye important
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
      `}</style>
    </div>
  );
}
{
  /* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Selected Files ({files.length})
              </h2>
            </div>


            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 lg:gap-8">
                <div className="relative flex items-center gap-2 min-w-0 sm:flex-1">
                  <div className="relative inline-block w-full sm:w-64 lg:w-72 min-w-0">
                    <div
                      onClick={() => setDropFile(!dropFile)}
                      className="flex justify-between items-center px-3 py-2 border border-red-600 rounded-md bg-white cursor-pointer text-sm text-gray-800 hover:bg-red-50 transition-colors"
                    >
                      <span className="truncate flex-1 min-w-0 pr-2">
                        {selectedFile ? selectedFile.name : "No file selected"}
                      </span>
                      <ChevronDown
                        className={`text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                          dropFile ? "rotate-180" : ""
                        }`}
                        size={16}
                      />
                    </div>

                    {dropFile && (
                      <ul className="absolute z-50 w-full mt-1 custom-scrollbar bg-white border border-red-600 rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                        {files.map((file) => (
                          <li
                            key={file.id}
                            onClick={() => {
                              handleFileSelection(file.id);
                              setDropFile(false);
                            }}
                            className={`px-3 py-2 cursor-pointer truncate transition-colors ${
                              selectedFileId === file.id
                                ? "bg-red-600 text-white"
                                : "hover:bg-red-100"
                            }`}
                          >
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedFileId && (
                    <button
                      onClick={() => {
                        removeFile(selectedFileId);
                        setSelectedFileId("");
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete selected file"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>

                <div className="flex-shrink-0 self-end sm:self-auto">
                  <SafeFileUploader
                    isMultiple={true}
                    onFilesSelect={handleFiles}
                    onPasswordProtectedFile={handleProtectedFiles}
                    isDragOver={isDragOver}
                    setIsDragOver={setIsDragOver}
                    allowedTypes={[".pdf"]}
                    showFiles={true}
                    onSort={sortFilesByName}
                    selectedCount={files?.length}
                    pageTitle="Compare PDF"
                    pageSubTitle="Easily display the differences between two similar files."
                  />
                </div>
              </div>
            </div>
          </div> */
}
