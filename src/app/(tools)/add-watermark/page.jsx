"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, ArrowRight, ImageIcon, Download } from "lucide-react";
import { IoMdLock } from "react-icons/io";
import { Document, Page, pdfjs } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import FileUploader from "@/components/tools/FileUploader";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import PasswordModal from "@/components/tools/PasswordModal";
import { BsCardImage } from "react-icons/bs";
import { FaBold, FaItalic, FaUnderline, FaTextHeight } from "react-icons/fa";
import { MdFormatColorText } from "react-icons/md";
import { BsLayersHalf, BsLayersFill } from "react-icons/bs";
import { IoImageOutline } from "react-icons/io5";
import { Trash2, ChevronDown } from "lucide-react";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
import { motion } from "framer-motion";

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

export default function addwatermark() {
  // 📦 State: File Uploading & PDF Handling
  const [files, setFiles] = useState([]);
  const [protectedFiles, setProtectedFiles] = useState([]);
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

  // 📌 Constants
  const fontSizeMin = 1;
  const fontSizeMax = 100;
  const fillPercent =
    ((selectedSize - fontSizeMin) / (fontSizeMax - fontSizeMin)) * 100;

  const transparencyOptions = ["No transparency", "25%", "50%", "75%"];
  const degreeOptions = [
    "Do not rotate",
    "45 degrees",
    "90 degrees",
    "180 degrees",
    "270 degrees",
  ];

  const options = [
    { id: "over", label: "Over the PDF content", icon: BsLayersHalf },
    { id: "below", label: "Below the PDF content", icon: BsLayersFill },
  ];

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

  const handleMosaic = () => {
    setSelected(isMosaic ? ["left-top"] : positionMap);
  };

  const getBorderClass = (index) => {
    switch (index) {
      case 0:
        return "border";
      case 1:
        return "border-t border-b";
      case 2:
        return "border";
      case 3:
        return "border-l border-r";
      case 4:
        return "border-none";
      case 5:
        return "border-l border-r";
      case 6:
        return "border";
      case 7:
        return "border-t border-b";
      case 8:
        return "border-l border-r border-t border-b";
      default:
        return "border";
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setSelectedImage(imageURL); // ← Preview image set here
    }
  };

  const removeImage = (e) => {
    e.stopPropagation(); // So it doesn't trigger file input click
    setSelectedImage(null);
  };
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
        pageTitle="Add watermark into a PDF"
        pageSubTitle="Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position."
      />
    );
  }
  const selectedFile = files.find((f) => f.id === selectedFileId);
  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className="py-5 px-3 md:px-12 md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Title Section */}
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Selected Files ({files.length})
              </h2>
            </div>

            {/* Controls Section - Responsive Layout */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              {/* Controls Section - Responsive Layout */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 lg:gap-8">
                {/* File Dropdown Container */}
                <div className="relative flex items-center gap-2 min-w-0 sm:flex-1">
                  {/* Dropdown */}
                  <div className="relative inline-block w-full sm:w-64 lg:w-72 min-w-0">
                    {/* Dropdown Trigger */}
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

                    {/* Dropdown Items */}
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

                  {/* Delete Icon - Adjacent to dropdown */}
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

                {/* File Uploader */}
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
                    pageTitle="Add watermark into a PDF"
                    pageSubTitle="Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position."
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 r">
            {files
              .filter((file) => file.id === selectedFileId)
              .flatMap((file) => {
                const totalPages = file.numPages || 1;
                return Array.from({ length: totalPages }, (_, index) => {
                  const currentPageNumber = index + 1;

                  // ✅ Check if current page is within the selected range
                  const isPageInRange =
                    currentPageNumber >= (fromPage || 1) &&
                    currentPageNumber <= (toPage || totalPages);

                  return (
                    <div
                      key={`${file.id}-page-${currentPageNumber}`}
                      className="place-content-center justify-center items-cente"
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
                        selectedPositions={isPageInRange ? selected : []} // ✅ Conditional positions
                        isMosaic={isMosaic}
                        transparency={transparency}
                        degree={degree}
                        // ✅ Additional props to help with styling
                        isInSelectedRange={isPageInRange}
                        currentPage={currentPageNumber}
                        fromPage={fromPage}
                        toPage={toPage}
                        layer={layer}
                      />
                    </div>
                  );
                });
              })}
          </div>
        </div>

        {/* Desktop Sidebar */}
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
              {activeOption === "text" ? (
                <>
                  <div className="w-full">
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Text:
                      </label>
                      <input
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        type="text"
                        className="w-full px-3 py-2 text-base placeholder:text-sm placeholder:text-gray-400 border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                        placeholder="Type your watermark text here..."
                      />
                    </div>
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Text format:
                      </label>
                      <div className="flex flex-wrap items-center gap-3 mb-4 relative">
                        {/* Font Family */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowFontDropdown(!showFontDropdown);
                              setShowSizeDropdown(false);
                              setShowColorPicker(false);
                            }}
                            className={`px-2 py-1 border rounded text-sm ${
                              showFontDropdown || selectedFont !== "Arial"
                                ? "text-red-600 bg-red-100 border-l border-red-600"
                                : "text-gray-700 border-gray-300"
                            }`}
                          >
                            {selectedFont}
                          </button>

                          {showFontDropdown && (
                            <div className="absolute bottom-full left-0 mb-1 w-44 max-h-48 overflow-auto custom-scrollbar bg-white border border-gray-300 rounded shadow-md z-30">
                              {fontFamilies.map((font) => (
                                <div
                                  key={font}
                                  onClick={() => {
                                    setSelectedFont(font);
                                    setShowFontDropdown(false);
                                  }}
                                  className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                                    selectedFont === font
                                      ? "bg-red-600 text-white font-semibold"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                  style={{ fontFamily: font }}
                                >
                                  {font}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Font Size */}
                        <div className="">
                          <button
                            onClick={() => {
                              setShowSizeDropdown(!showSizeDropdown);
                              setShowFontDropdown(false);
                              setShowColorPicker(false);
                            }}
                            className={`px-2 py-1 border rounded text-sm flex items-center justify-center ${
                              showSizeDropdown || selectedSize !== null
                                ? "text-red-600 bg-red-100 border-l border-red-600"
                                : "text-gray-700 border-gray-300"
                            }`}
                          >
                            {selectedSize !== null ? (
                              `${selectedSize}px`
                            ) : (
                              <FaTextHeight className="w-4 h-4" />
                            )}
                          </button>

                          {showSizeDropdown && (
                            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-gray-300 rounded shadow-md z-30 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[200px] xl:max-w-[260px] min-w-[150px] sm:min-w-[180px] md:min-w-[200px]">
                              <label className="text-sm font-medium mb-2 block">
                                Font Size
                              </label>

                              <div className="flex items-center gap-3">
                                {/* Custom Slider */}
                                <div className="relative w-full h-4">
                                  {/* Background Bar */}
                                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 rounded -translate-y-1/2" />

                                  {/* Fill Progress */}
                                  <div
                                    className="absolute top-1/2 left-0 h-1 rounded -translate-y-1/2"
                                    style={{
                                      width: `${fillPercent}%`,
                                      backgroundColor: "#884400",
                                    }}
                                  />

                                  {/* Dot (Thumb) */}
                                  <div
                                    className="absolute w-4 h-4 bg-[#884400] rounded-full top-1/2 -translate-y-1/2"
                                    style={{
                                      left: `calc(${fillPercent}% - 8px)`,
                                    }}
                                  />

                                  {/* Real slider input (invisible) */}
                                  <input
                                    type="range"
                                    min={fontSizeMin}
                                    max={fontSizeMax}
                                    value={selectedSize}
                                    onChange={(e) =>
                                      setSelectedSize(Number(e.target.value))
                                    }
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>

                                {/* Manual input */}
                                <input
                                  type="number"
                                  min={fontSizeMin}
                                  max={fontSizeMax}
                                  value={selectedSize}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      fontSizeMin,
                                      Math.min(
                                        fontSizeMax,
                                        Number(e.target.value)
                                      )
                                    );
                                    setSelectedSize(val);
                                  }}
                                  className="input-hide-arrows w-14 text-center border border-gray-300 rounded p-1 text-sm bg-white text-black focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bold */}
                        <button
                          onClick={() => setBold(!bold)}
                          className={`p-1 border rounded ${
                            bold
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaBold />
                        </button>

                        {/* Italic */}
                        <button
                          onClick={() => setItalic(!italic)}
                          className={`p-1 border rounded ${
                            italic
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaItalic />
                        </button>

                        {/* Underline */}
                        <button
                          onClick={() => setUnderline(!underline)}
                          className={`p-1 border rounded ${
                            underline
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaUnderline />
                        </button>

                        {/* Font Color */}
                        <div className="">
                          <button
                            onClick={() => {
                              setShowColorPicker(!showColorPicker);
                              setShowFontDropdown(false);
                              setShowSizeDropdown(false);
                            }}
                            className={`p-1 border rounded ${
                              showColorPicker
                                ? "bg-red-100 border-l border-red-600"
                                : "border-gray-300"
                            }`}
                          >
                            <MdFormatColorText
                              style={{ color: selectedColor }}
                            />
                          </button>

                          {showColorPicker && (
                            <div className="absolute bottom-full right-0 mb-1 z-30 bg-white p-2 rounded-md shadow-lg border w-fit max-w-[90vw]  ">
                              <p className="text-sm text-gray-700 mb-2">
                                Font color:
                              </p>
                              <div className="grid gap-1">
                                {colors.map((row, rowIndex) => (
                                  <div key={rowIndex} className="flex gap-1">
                                    {row.map((color, colIndex) => (
                                      <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className="w-5 h-5 rounded cursor-pointer border border-gray-200 relative"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          setSelectedColor(color);
                                          setShowColorPicker(false);
                                        }}
                                      >
                                        {selectedColor === color && (
                                          <div className="absolute inset-0 flex justify-center items-center">
                                            <span className="text-white text-[10px] font-bold leading-none">
                                              ✓
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Position */}
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Position:
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Grid */}
                        <div className="grid grid-cols-3 grid-rows-3 w-[72px] h-[72px]">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleClick(index)}
                              title={positionMap[index]}
                              className={`w-6 h-6 flex items-center justify-center box-border 
            ${getBorderClass(index)} border-gray-300 
            ${
              selected.includes(positionMap[index]) ? "bg-red-100" : "bg-white"
            }`}
                            >
                              {selected.includes(positionMap[index]) && (
                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                        {/* Mosaic Checkbox */}
                        <label className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleMosaic}
                            className={`w-6 h-6 flex items-center justify-center box-border border 
          ${isMosaic ? "bg-red-100" : "bg-white"}`}
                          >
                            {isMosaic && (
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                          <span>Mosaic</span>
                        </label>
                      </div>
                    </div>
                    {/* Transparency Dropdown */}
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={transparencyRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Transparency:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() =>
                              setIsTransparencyOpen(!isTransparencyOpen)
                            }
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              transparency !== "No transparency"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {transparency}
                          </div>
                          {isTransparencyOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {transparencyOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setTransparency(option);
                                    setIsTransparencyOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    transparency === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Rotation Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={degreeRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Rotation:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() => setIsDegreeOpen(!isDegreeOpen)}
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              degree !== "Do not rotate"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {degree}
                          </div>
                          {isDegreeOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {degreeOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setDegree(option);
                                    setIsDegreeOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    degree === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Pages */}
                    <div className="mb-4">
                      {files.length > 1 ? (
                        <div className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded">
                          All pages will be stamped because multiple PDF have
                          been selected.
                        </div>
                      ) : (
                        <>
                          <label className="block text-base font-medium text-gray-800 mb-1">
                            Pages:{" "}
                            {files.length === 1 &&
                              `(Total: ${getTotalPages()} pages)`}
                          </label>
                          <div className="flex flex-col lg:flex-row gap-4 mt-2">
                            {/* From Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                from page
                              </span>
                              <input
                                type="number"
                                value={fromPage}
                                onChange={handleFromPageChange}
                                min={1}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>

                            {/* To Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                to
                              </span>
                              <input
                                type="number"
                                value={toPage}
                                onChange={handleToPageChange}
                                min={fromPage}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Layer */}
                    <div className="mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Layer
                      </label>

                      <div className="flex flex-row justify-center items-center gap-4 w-full">
                        {options.map((option) => {
                          const Icon = option.icon;
                          const isActive = layer === option.id;

                          return (
                            <div
                              key={option.id}
                              onClick={() => setIsLayer(option.id)}
                              className={`flex flex-col items-center justify-center w-full px-6 py-6 min-h-[120px] rounded-md cursor-pointer transition-colors duration-200 
            ${
              isActive
                ? "border border-red-600 text-red-600"
                : "border-transparent hover:border-black text-gray-700 hover:text-black"
            }
          `}
                              style={{
                                backgroundColor: isActive
                                  ? "#fef2f2"
                                  : "rgb(235, 235, 244)",
                              }}
                            >
                              <Icon
                                className={`w-8 h-8 mb-2 transition-colors ${
                                  isActive
                                    ? "text-red-600"
                                    : "text-gray-500 hover:text-black"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium text-center transition-colors ${
                                  isActive ? "text-red-600" : "hover:text-black"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full">
                    <div className="w-[70%] mb-4 mx-auto flex flex-col gap-2">
                      <label className="flex w-full cursor-pointer rounded-md overflow-hidden shadow-sm border border-red-600">
                        {/* Left: 30% */}
                        <div className="bg-red-600 h-12 flex items-center justify-center text-white text-3xl flex-[0.3]">
                          {!selectedImage ? (
                            <IoImageOutline />
                          ) : (
                            <img
                              src={selectedImage}
                              alt="preview"
                              className="px-3 w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Right: 70% */}
                        <div className="bg-white h-12 flex items-center justify-center text-black text-sm font-medium rounded-r-md flex-[0.7]">
                          {selectedImage ? "CHANGE IMAGE" : "ADD IMAGE"}
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>

                      {selectedImage && (
                        <button
                          onClick={removeImage}
                          className="text-xs text-red-600 underline ml-1 hover:text-red-800 w-fit"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Position:
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Grid */}
                        <div className="grid grid-cols-3 grid-rows-3 w-[72px] h-[72px]">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleClick(index)}
                              title={positionMap[index]}
                              className={`w-6 h-6 flex items-center justify-center box-border 
            ${getBorderClass(index)} border-gray-300 
            ${
              selected.includes(positionMap[index]) ? "bg-red-100" : "bg-white"
            }`}
                            >
                              {selected.includes(positionMap[index]) && (
                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                        {/* Mosaic Checkbox */}
                        <label className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleMosaic}
                            className={`w-6 h-6 flex items-center justify-center box-border border 
          ${isMosaic ? "bg-red-100" : "bg-white"}`}
                          >
                            {isMosaic && (
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                          <span>Mosaic</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                      {/* Transparency Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={transparencyRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Transparency:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() =>
                              setIsTransparencyOpen(!isTransparencyOpen)
                            }
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              transparency !== "No transparency"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {transparency}
                          </div>
                          {isTransparencyOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {transparencyOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setTransparency(option);
                                    setIsTransparencyOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    transparency === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Rotation Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={degreeRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Rotation:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() => setIsDegreeOpen(!isDegreeOpen)}
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              degree !== "Do not rotate"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {degree}
                          </div>
                          {isDegreeOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {degreeOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setDegree(option);
                                    setIsDegreeOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    degree === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      {files.length > 1 ? (
                        <div className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded">
                          All pages will be stamped because multiple PDF have
                          been selected.
                        </div>
                      ) : (
                        <>
                          <label className="block text-base font-medium text-gray-800 mb-1">
                            Pages:{" "}
                            {files.length === 1 &&
                              `(Total: ${getTotalPages()} pages)`}
                          </label>
                          <div className="flex flex-col lg:flex-row gap-4 mt-2">
                            {/* From Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                from page
                              </span>
                              <input
                                type="number"
                                value={fromPage}
                                onChange={handleFromPageChange}
                                min={1}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>

                            {/* To Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                to
                              </span>
                              <input
                                type="number"
                                value={toPage}
                                onChange={handleToPageChange}
                                min={fromPage}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Layer
                      </label>

                      <div className="flex flex-row justify-center items-center gap-4 w-full">
                        {options.map((option) => {
                          const Icon = option.icon;
                          const isActive = layer === option.id;

                          return (
                            <div
                              key={option.id}
                              onClick={() => setIsLayer(option.id)}
                              className={`flex flex-col items-center justify-center w-full px-6 py-6 min-h-[120px] rounded-md cursor-pointer transition-colors duration-200 
            ${
              isActive
                ? "border border-red-600 text-red-600"
                : "border-transparent hover:border-black text-gray-700 hover:text-black"
            }
          `}
                              style={{
                                backgroundColor: isActive
                                  ? "#fef2f2"
                                  : "rgb(235, 235, 244)",
                              }}
                            >
                              <Icon
                                className={`w-8 h-8 mb-2 transition-colors ${
                                  isActive
                                    ? "text-red-600"
                                    : "text-gray-500 hover:text-black"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium text-center transition-colors ${
                                  isActive ? "text-red-600" : "hover:text-black"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
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

          <div className="p-6 border-t sticky bottom-0 bg-white">
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
              {activeOption === "text" ? (
                <>
                  <div className="w-full">
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Text:
                      </label>
                      <input
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        type="text"
                        className="w-full px-3 py-2 text-base placeholder:text-sm placeholder:text-gray-400 border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200"
                        placeholder="Type your watermark text here..."
                      />
                    </div>
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Text format:
                      </label>
                      <div className="flex flex-wrap items-center gap-3 mb-4 relative">
                        {/* Font Family */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowFontDropdown(!showFontDropdown);
                              setShowSizeDropdown(false);
                              setShowColorPicker(false);
                            }}
                            className={`px-2 py-1 border rounded text-sm ${
                              showFontDropdown || selectedFont !== "Arial"
                                ? "text-red-600 bg-red-100 border-l border-red-600"
                                : "text-gray-700 border-gray-300"
                            }`}
                          >
                            {selectedFont}
                          </button>

                          {showFontDropdown && (
                            <div className="absolute bottom-full left-0 mb-1 w-44 max-h-48 overflow-auto custom-scrollbar bg-white border border-gray-300 rounded shadow-md z-30">
                              {fontFamilies.map((font) => (
                                <div
                                  key={font}
                                  onClick={() => {
                                    setSelectedFont(font);
                                    setShowFontDropdown(false);
                                  }}
                                  className={`px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                                    selectedFont === font
                                      ? "bg-red-600 text-white font-semibold"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                  style={{ fontFamily: font }}
                                >
                                  {font}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Font Size */}
                        <div className="">
                          <button
                            onClick={() => {
                              setShowSizeDropdown(!showSizeDropdown);
                              setShowFontDropdown(false);
                              setShowColorPicker(false);
                            }}
                            className={`px-2 py-1 border rounded text-sm flex items-center justify-center ${
                              showSizeDropdown || selectedSize !== null
                                ? "text-red-600 bg-red-100 border-l border-red-600"
                                : "text-gray-700 border-gray-300"
                            }`}
                          >
                            {selectedSize !== null ? (
                              `${selectedSize}px`
                            ) : (
                              <FaTextHeight className="w-4 h-4" />
                            )}
                          </button>

                          {showSizeDropdown && (
                            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-gray-300 rounded shadow-md z-30 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[200px] xl:max-w-[260px] min-w-[150px] sm:min-w-[180px] md:min-w-[200px]">
                              <label className="text-sm font-medium mb-2 block">
                                Font Size
                              </label>

                              <div className="flex items-center gap-3">
                                {/* Custom Slider */}
                                <div className="relative w-full h-4">
                                  {/* Background Bar */}
                                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 rounded -translate-y-1/2" />

                                  {/* Fill Progress */}
                                  <div
                                    className="absolute top-1/2 left-0 h-1 rounded -translate-y-1/2"
                                    style={{
                                      width: `${fillPercent}%`,
                                      backgroundColor: "#884400",
                                    }}
                                  />

                                  {/* Dot (Thumb) */}
                                  <div
                                    className="absolute w-4 h-4 bg-[#884400] rounded-full top-1/2 -translate-y-1/2"
                                    style={{
                                      left: `calc(${fillPercent}% - 8px)`,
                                    }}
                                  />

                                  {/* Real slider input (invisible) */}
                                  <input
                                    type="range"
                                    min={fontSizeMin}
                                    max={fontSizeMax}
                                    value={selectedSize}
                                    onChange={(e) =>
                                      setSelectedSize(Number(e.target.value))
                                    }
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>

                                {/* Manual input */}
                                <input
                                  type="number"
                                  min={fontSizeMin}
                                  max={fontSizeMax}
                                  value={selectedSize}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      fontSizeMin,
                                      Math.min(
                                        fontSizeMax,
                                        Number(e.target.value)
                                      )
                                    );
                                    setSelectedSize(val);
                                  }}
                                  className="input-hide-arrows w-14 text-center border border-gray-300 rounded p-1 text-sm bg-white text-black focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bold */}
                        <button
                          onClick={() => setBold(!bold)}
                          className={`p-1 border rounded ${
                            bold
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaBold />
                        </button>

                        {/* Italic */}
                        <button
                          onClick={() => setItalic(!italic)}
                          className={`p-1 border rounded ${
                            italic
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaItalic />
                        </button>

                        {/* Underline */}
                        <button
                          onClick={() => setUnderline(!underline)}
                          className={`p-1 border rounded ${
                            underline
                              ? "bg-red-100 border-l border-red-600 text-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          <FaUnderline />
                        </button>

                        {/* Font Color */}
                        <div className="">
                          <button
                            onClick={() => {
                              setShowColorPicker(!showColorPicker);
                              setShowFontDropdown(false);
                              setShowSizeDropdown(false);
                            }}
                            className={`p-1 border rounded ${
                              showColorPicker
                                ? "bg-red-100 border-l border-red-600"
                                : "border-gray-300"
                            }`}
                          >
                            <MdFormatColorText
                              style={{ color: selectedColor }}
                            />
                          </button>

                          {showColorPicker && (
                            <div className="absolute bottom-full right-0 mb-1 z-30 bg-white p-2 rounded-md shadow-lg border w-fit max-w-[90vw]  ">
                              <p className="text-sm text-gray-700 mb-2">
                                Font color:
                              </p>
                              <div className="grid gap-1">
                                {colors.map((row, rowIndex) => (
                                  <div key={rowIndex} className="flex gap-1">
                                    {row.map((color, colIndex) => (
                                      <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className="w-5 h-5 rounded cursor-pointer border border-gray-200 relative"
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          setSelectedColor(color);
                                          setShowColorPicker(false);
                                        }}
                                      >
                                        {selectedColor === color && (
                                          <div className="absolute inset-0 flex justify-center items-center">
                                            <span className="text-white text-[10px] font-bold leading-none">
                                              ✓
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Position */}
                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Position:
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Grid */}
                        <div className="grid grid-cols-3 grid-rows-3 w-[72px] h-[72px]">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleClick(index)}
                              title={positionMap[index]}
                              className={`w-6 h-6 flex items-center justify-center box-border 
            ${getBorderClass(index)} border-gray-300 
            ${
              selected.includes(positionMap[index]) ? "bg-red-100" : "bg-white"
            }`}
                            >
                              {selected.includes(positionMap[index]) && (
                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                        {/* Mosaic Checkbox */}
                        <label className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleMosaic}
                            className={`w-6 h-6 flex items-center justify-center box-border border 
          ${isMosaic ? "bg-red-100" : "bg-white"}`}
                          >
                            {isMosaic && (
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                          <span>Mosaic</span>
                        </label>
                      </div>
                    </div>
                    {/* Transparency Dropdown */}
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={transparencyRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Transparency:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() =>
                              setIsTransparencyOpen(!isTransparencyOpen)
                            }
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              transparency !== "No transparency"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {transparency}
                          </div>
                          {isTransparencyOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {transparencyOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setTransparency(option);
                                    setIsTransparencyOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    transparency === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Rotation Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={degreeRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Rotation:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() => setIsDegreeOpen(!isDegreeOpen)}
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              degree !== "Do not rotate"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {degree}
                          </div>
                          {isDegreeOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {degreeOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setDegree(option);
                                    setIsDegreeOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    degree === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Pages */}
                    <div className="mb-4">
                      {files.length > 1 ? (
                        <div className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded">
                          All pages will be stamped because multiple PDF have
                          been selected.
                        </div>
                      ) : (
                        <>
                          <label className="block text-base font-medium text-gray-800 mb-1">
                            Pages:{" "}
                            {files.length === 1 &&
                              `(Total: ${getTotalPages()} pages)`}
                          </label>
                          <div className="flex flex-col lg:flex-row gap-4 mt-2">
                            {/* From Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                from page
                              </span>
                              <input
                                type="number"
                                value={fromPage}
                                onChange={handleFromPageChange}
                                min={1}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>

                            {/* To Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                to
                              </span>
                              <input
                                type="number"
                                value={toPage}
                                onChange={handleToPageChange}
                                min={fromPage}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Layer */}
                    <div className="mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Layer
                      </label>

                      <div className="flex flex-row justify-center items-center gap-4 w-full">
                        {options.map((option) => {
                          const Icon = option.icon;
                          const isActive = layer === option.id;

                          return (
                            <div
                              key={option.id}
                              onClick={() => setIsLayer(option.id)}
                              className={`flex flex-col items-center justify-center w-full px-6 py-6 min-h-[120px] rounded-md cursor-pointer transition-colors duration-200 
            ${
              isActive
                ? "border border-red-600 text-red-600"
                : "border-transparent hover:border-black text-gray-700 hover:text-black"
            }
          `}
                              style={{
                                backgroundColor: isActive
                                  ? "#fef2f2"
                                  : "rgb(235, 235, 244)",
                              }}
                            >
                              <Icon
                                className={`w-8 h-8 mb-2 transition-colors ${
                                  isActive
                                    ? "text-red-600"
                                    : "text-gray-500 hover:text-black"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium text-center transition-colors ${
                                  isActive ? "text-red-600" : "hover:text-black"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full">
                    <div className="w-[70%] mb-4 mx-auto flex flex-col gap-2">
                      <label className="flex w-full cursor-pointer rounded-md overflow-hidden shadow-sm border border-red-600">
                        {/* Left: 30% */}
                        <div className="bg-red-600 h-12 flex items-center justify-center text-white text-3xl flex-[0.3]">
                          {!selectedImage ? (
                            <IoImageOutline />
                          ) : (
                            <img
                              src={selectedImage}
                              alt="preview"
                              className="px-3 w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Right: 70% */}
                        <div className="bg-white h-12 flex items-center justify-center text-black text-sm font-medium rounded-r-md flex-[0.7]">
                          {selectedImage ? "CHANGE IMAGE" : "ADD IMAGE"}
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>

                      {selectedImage && (
                        <button
                          onClick={removeImage}
                          className="text-xs text-red-600 underline ml-1 hover:text-red-800 w-fit"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Position:
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Grid */}
                        <div className="grid grid-cols-3 grid-rows-3 w-[72px] h-[72px]">
                          {Array.from({ length: 9 }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleClick(index)}
                              title={positionMap[index]}
                              className={`w-6 h-6 flex items-center justify-center box-border 
            ${getBorderClass(index)} border-gray-300 
            ${
              selected.includes(positionMap[index]) ? "bg-red-100" : "bg-white"
            }`}
                            >
                              {selected.includes(positionMap[index]) && (
                                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                        {/* Mosaic Checkbox */}
                        <label className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleMosaic}
                            className={`w-6 h-6 flex items-center justify-center box-border border 
          ${isMosaic ? "bg-red-100" : "bg-white"}`}
                          >
                            {isMosaic && (
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                            )}
                          </button>
                          <span>Mosaic</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
                      {/* Transparency Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={transparencyRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Transparency:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() =>
                              setIsTransparencyOpen(!isTransparencyOpen)
                            }
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              transparency !== "No transparency"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {transparency}
                          </div>
                          {isTransparencyOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {transparencyOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setTransparency(option);
                                    setIsTransparencyOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    transparency === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Rotation Dropdown */}
                      <div
                        className="flex flex-col w-full lg:w-1/2"
                        ref={degreeRef}
                      >
                        <label className="block text-base font-medium text-gray-800 mb-1">
                          Rotation:
                        </label>
                        <div className="relative w-full">
                          <div
                            onClick={() => setIsDegreeOpen(!isDegreeOpen)}
                            className={`bg-white border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer transition ${
                              degree !== "Do not rotate"
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {degree}
                          </div>
                          {isDegreeOpen && (
                            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
                              {degreeOptions.map((option) => (
                                <li
                                  key={option}
                                  onClick={() => {
                                    setDegree(option);
                                    setIsDegreeOpen(false);
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer ${
                                    degree === option
                                      ? "bg-red-600 text-white"
                                      : "hover:bg-red-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      {files.length > 1 ? (
                        <div className="bg-red-100 text-red-600 text-sm px-4 py-2 rounded">
                          All pages will be stamped because multiple PDF have
                          been selected.
                        </div>
                      ) : (
                        <>
                          <label className="block text-base font-medium text-gray-800 mb-1">
                            Pages:{" "}
                            {files.length === 1 &&
                              `(Total: ${getTotalPages()} pages)`}
                          </label>
                          <div className="flex flex-col lg:flex-row gap-4 mt-2">
                            {/* From Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                from page
                              </span>
                              <input
                                type="number"
                                value={fromPage}
                                onChange={handleFromPageChange}
                                min={1}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>

                            {/* To Page */}
                            <div className="flex w-full lg:w-1/2 border border-gray-300 rounded overflow-hidden">
                              <span className="px-3 py-2 text-sm text-gray-600 border-r border-gray-300 bg-white">
                                to
                              </span>
                              <input
                                type="number"
                                value={toPage}
                                onChange={handleToPageChange}
                                min={fromPage}
                                max={getTotalPages()}
                                className="custom-number w-full px-2 py-2 text-sm text-gray-800 outline-none bg-white border-0"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-base font-medium text-gray-800 mb-1">
                        Layer
                      </label>

                      <div className="flex flex-row justify-center items-center gap-4 w-full">
                        {options.map((option) => {
                          const Icon = option.icon;
                          const isActive = layer === option.id;

                          return (
                            <div
                              key={option.id}
                              onClick={() => setIsLayer(option.id)}
                              className={`flex flex-col items-center justify-center w-full px-6 py-6 min-h-[120px] rounded-md cursor-pointer transition-colors duration-200 
            ${
              isActive
                ? "border border-red-600 text-red-600"
                : "border-transparent hover:border-black text-gray-700 hover:text-black"
            }
          `}
                              style={{
                                backgroundColor: isActive
                                  ? "#fef2f2"
                                  : "rgb(235, 235, 244)",
                              }}
                            >
                              <Icon
                                className={`w-8 h-8 mb-2 transition-colors ${
                                  isActive
                                    ? "text-red-600"
                                    : "text-gray-500 hover:text-black"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium text-center transition-colors ${
                                  isActive ? "text-red-600" : "hover:text-black"
                                }`}
                              >
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
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

      {/* Password Modal */}

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
