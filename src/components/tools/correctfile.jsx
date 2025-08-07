"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  X,
  ArrowRight,
  ImageIcon,
  Download,
  Search,
  Type,
  Image,
  AlertCircle,
  Check,
  Loader2,
  Upload,
} from "lucide-react";
import { IoMdLock } from "react-icons/io";
import { Document, Page, pdfjs } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import { BsCardImage } from "react-icons/bs";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
// Import diff library for text comparison
import * as Diff from "diff";
import jsPDF from "jspdf";
import { IoImageOutline } from "react-icons/io5";
import PDFDualPanel from "@/components/sections/PDFDualPanel";
import ZoomControls from "@/components/sections/ZoomControls";
import ComparisonResults from "@/components/sections/ComparisonResults";
import OCRNotification from "@/components/sections/OCRNotification";
// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Custom text processing utilities (replacing natural.js)
const textUtils = {
  // Simple sentence tokenizer
  tokenizeSentences: (text) => {
    if (!text) return [];
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  },

  // Simple word tokenizer
  tokenizeWords: (text) => {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);
  },

  // Simple Levenshtein distance calculation
  levenshteinDistance: (str1, str2) => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  },

  // Generate n-grams (phrases)
  getNGrams: (tokens, n = 3) => {
    if (!tokens || tokens.length < n) return [];
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(" "));
    }
    return ngrams;
  },

  // Calculate Jaccard similarity
  jaccardSimilarity: (set1, set2) => {
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : (intersection.size / union.size) * 100;
  },
};

const PDFPreview = memo(
  ({
    file,
    pageNumber = 1,
    isLoading,
    onLoadSuccess,
    onLoadError,
    onRemove,
    isHealthy,
    isPasswordProtected,
    showRemoveButton = true,
    userZoom = 100,
    isSinglePage = false,
    style = {},
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const elementRef = useRef(null);

    // Fixed width calculation for single page PDFs
    const actualPDFWidth = useMemo(() => {
      if (isSinglePage) {
        // For single page PDFs, always use container-based calculation
        return (containerWidth * userZoom) / 100;
      } else {
        // Multi-page logic remains the same
        return userZoom > 100
          ? (800 * userZoom) / 100 // Multi-page zoomed: fixed base width
          : (containerWidth * userZoom) / 100; // Multi-page normal: container * zoom
      }
    }, [containerWidth, userZoom, isSinglePage]);

    // Track container width changes
    useEffect(() => {
      const updateWidth = () => {
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect();
          setContainerWidth(rect.width - 32); // Account for padding
        }
      };

      updateWidth();
      window.addEventListener("resize", updateWidth);

      const resizeObserver = new ResizeObserver(updateWidth);
      if (elementRef.current) {
        resizeObserver.observe(elementRef.current);
      }

      return () => {
        window.removeEventListener("resize", updateWidth);
        resizeObserver.disconnect();
      };
    }, []);

    // Memoize PDF.js options
    const pdfOptions = useMemo(
      () => ({
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        httpHeaders: {},
        withCredentials: false,
      }),
      []
    );

    // Intersection observer
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

    const handleLoadError = useCallback(
      (error) => {
        console.error("PDF Load Error:", error);
        setHasError(true);
        setDocumentLoaded(false);
        if (onLoadError) {
          onLoadError(error, file.id);
        }
      },
      [file.id, onLoadError]
    );

    const handleLoadSuccess = useCallback(
      (pdf) => {
        console.log("PDF Loaded Successfully:", pdf);
        setHasError(false);
        setDocumentLoaded(true);
        if (onLoadSuccess) {
          onLoadSuccess(pdf, file.id);
        }
      },
      [file.id, onLoadSuccess]
    );

    const renderPreview = () => {
      // Show lock icon for password-protected files
      if (isPasswordProtected) {
        return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              Password required
            </div>
            <IoMdLock className="text-4xl text-gray-600 mb-2" />
            <div className="flex items-center gap-1 bg-black rounded-full py-1 px-2">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        );
      }

      if (!isVisible || hasError || !isHealthy) {
        return (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center relative">
            <FileText className="w-16 h-16 text-gray-400" />
            <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
              PDF
            </div>
            {!isHealthy && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Preview Issue
              </div>
            )}
            {hasError && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Load Error
              </div>
            )}
          </div>
        );
      }

      if (
        file.type === "application/pdf" &&
        file.stableData &&
        containerWidth > 0
      ) {
        return (
          <div className="w-full h-full bg-white">
            {!isLoading ? (
              <Document
                file={file.stableData.dataUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={handleLoadError}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                  </div>
                }
                error={
                  <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-4">
                    <FileText className="w-12 h-12 text-red-400 mb-2" />
                    <div className="text-sm text-red-600 font-medium text-center">
                      Could not load preview
                    </div>
                  </div>
                }
                options={pdfOptions}
                className="w-full h-full"
              >
                {documentLoaded && (
                  <div
                    className={`${isSinglePage
                      ? userZoom > 100
                        ? "py-4 min-h-full overflow-x-auto overflow-y-hidden flex justify-center" // Single page zoomed: horizontal scroll with center
                        : "py-4 min-h-full flex justify-center items-center" // Single page normal: center it
                      : userZoom > 100
                        ? "w-full" // Multi-page zoomed: full width
                        : "flex justify-center" // Multi-page normal: center it
                      }`}
                    style={{
                      // Simplified width handling
                      minWidth: userZoom > 100 ? "max-content" : "auto",
                      width: userZoom > 100 ? "max-content" : "auto",
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={actualPDFWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-lg border border-gray-200 transition-all duration-300 ease-in-out"
                      loading={
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        </div>
                      }
                      onLoadError={(error) => {
                        console.error("Page Load Error:", error);
                        setHasError(true);
                      }}
                    />
                  </div>
                )}
              </Document>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center relative">
          <FileText className="w-16 h-16 text-gray-400" />
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
            {file.type.split("/")[1]?.toUpperCase() || "FILE"}
          </div>
        </div>
      );
    };

    return (
      <div
        ref={elementRef}
        className="w-full h-full overflow-hidden"
        style={style}
      >
        {/* File Preview Area */}
        <div className="w-full relative h-full overflow-hidden">
          {renderPreview()}

          {/* Remove Button - Only show if showRemoveButton is true */}
          {showRemoveButton && onRemove && (
            <div className="absolute top-2 right-2 flex gap-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                title="Remove file"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
PDFPreview.displayName = "PDFPreview";

const OverlayPDFPreview = memo(
  ({
    file,
    pageNumber = 1,
    isLoading,
    onLoadSuccess,
    onLoadError,
    onRemove,
    isHealthy,
    isPasswordProtected,
    showRemoveButton = true,
    userZoom = 100,
    isSinglePage = false,
    style = {},
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const elementRef = useRef(null);

    // Fixed width calculation for single page PDFs
    const actualPDFWidth = useMemo(() => {
      if (isSinglePage) {
        // For single page PDFs, always use container-based calculation
        return (containerWidth * userZoom) / 100;
      } else {
        // Multi-page logic remains the same
        return userZoom > 100
          ? (800 * userZoom) / 100 // Multi-page zoomed: fixed base width
          : (containerWidth * userZoom) / 100; // Multi-page normal: container * zoom
      }
    }, [containerWidth, userZoom, isSinglePage]);

    // Track container width changes
    useEffect(() => {
      const updateWidth = () => {
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect();
          setContainerWidth(rect.width - 32); // Account for padding
        }
      };

      updateWidth();
      window.addEventListener("resize", updateWidth);

      const resizeObserver = new ResizeObserver(updateWidth);
      if (elementRef.current) {
        resizeObserver.observe(elementRef.current);
      }

      return () => {
        window.removeEventListener("resize", updateWidth);
        resizeObserver.disconnect();
      };
    }, []);

    // Memoize PDF.js options
    const pdfOptions = useMemo(
      () => ({
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        httpHeaders: {},
        withCredentials: false,
      }),
      []
    );

    // Intersection observer
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

    const handleLoadError = useCallback(
      (error) => {
        console.error("PDF Load Error:", error);
        setHasError(true);
        setDocumentLoaded(false);
        if (onLoadError) {
          onLoadError(error, file.id);
        }
      },
      [file.id, onLoadError]
    );

    const handleLoadSuccess = useCallback(
      (pdf) => {
        console.log("PDF Loaded Successfully:", pdf);
        setHasError(false);
        setDocumentLoaded(true);
        if (onLoadSuccess) {
          onLoadSuccess(pdf, file.id);
        }
      },
      [file.id, onLoadSuccess]
    );

    const renderPreview = () => {
      // Show lock icon for password-protected files
      if (isPasswordProtected) {
        return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              Password required
            </div>
            <IoMdLock className="text-4xl text-gray-600 mb-2" />
            <div className="flex items-center gap-1 bg-black rounded-full py-1 px-2">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        );
      }

      if (!isVisible || hasError || !isHealthy) {
        return (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center relative">
            <FileText className="w-16 h-16 text-gray-400" />
            <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
              PDF
            </div>
            {!isHealthy && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Preview Issue
              </div>
            )}
            {hasError && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Load Error
              </div>
            )}
          </div>
        );
      }

      if (
        file.type === "application/pdf" &&
        file.stableData &&
        containerWidth > 0
      ) {
        return (
          <div className="w-full h-full bg-white">
            {!isLoading ? (
              <Document
                file={file.stableData.dataUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={handleLoadError}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                  </div>
                }
                error={
                  <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-4">
                    <FileText className="w-12 h-12 text-red-400 mb-2" />
                    <div className="text-sm text-red-600 font-medium text-center">
                      Could not load preview
                    </div>
                  </div>
                }
                options={pdfOptions}
                className="w-full h-full"
              >
                {documentLoaded && (
                  <div
                    className={`${isSinglePage
                      ? userZoom > 100
                        ? "py-4 min-h-full overflow-x-auto overflow-y-hidden flex justify-center" // Single page zoomed: horizontal scroll with center
                        : "py-4 min-h-full flex justify-center items-center" // Single page normal: center it
                      : userZoom > 100
                        ? "w-full" // Multi-page zoomed: full width
                        : "flex justify-center" // Multi-page normal: center it
                      }`}
                    style={{
                      // Simplified width handling
                      minWidth: userZoom > 100 ? "max-content" : "auto",
                      width: userZoom > 100 ? "max-content" : "auto",
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={actualPDFWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-lg border border-gray-200 transition-all duration-300 ease-in-out"
                      loading={
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                        </div>
                      }
                      onLoadError={(error) => {
                        console.error("Page Load Error:", error);
                        setHasError(true);
                      }}
                    />
                  </div>
                )}
              </Document>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center relative">
          <FileText className="w-16 h-16 text-gray-400" />
          <div className="absolute bottom-2 left-2 text-xs text-gray-600 font-semibold">
            {file.type.split("/")[1]?.toUpperCase() || "FILE"}
          </div>
        </div>
      );
    };

    return (
      <div
        ref={elementRef}
        className="w-full h-full overflow-hidden"
        style={style}
      >
        {/* File Preview Area */}
        <div className="w-full relative h-full overflow-hidden">
          {renderPreview()}

          {/* Remove Button - Only show if showRemoveButton is true */}
          {showRemoveButton && onRemove && (
            <div className="absolute top-2 right-2 flex gap-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="w-8 h-8 bg-white/90 border hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                title="Remove file"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);
OverlayPDFPreview.displayName = "OverlayPDFPreview";
export default function comparepdf() {
  // 📦 State: File Uploading & PDF Handling
  const [files, setFiles] = useState([]);
  // sementic text base
  const [leftFiles, setLeftFiles] = useState([]);
  const [rightFiles, setRightFiles] = useState([]);
  // Overlay PDF states
  const [overlayUp, setOverlayUp] = useState([]); // Top layer
  const [overlayDown, setOverlayDown] = useState([]); // Bottom layer

  const [activeSide, setActiveSide] = useState(null);
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  // Overlay comparison specific states
  const [overlayAnalysis, setOverlayAnalysis] = useState(null);
  const [isOverlayAnalyzing, setIsOverlayAnalyzing] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(50); // Control overlay transparency
  const [showDifferences, setShowDifferences] = useState(true);
  const [overlayComparison, setOverlayComparison] = useState(null);
  const [overlayBlendMode, setOverlayBlendMode] = useState("difference");
  const [isDragging, setIsDragging] = useState({ left: false, right: false });
  const [activeOption, setActiveOption] = useState("semantic");
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);
  // NEW: Zoom states for left and right panels
  const [leftZoom, setLeftZoom] = useState(100);
  const [rightZoom, setRightZoom] = useState(100);
  const [showLeftControls, setShowLeftControls] = useState(false);
  const [showRightControls, setShowRightControls] = useState(false);

  // NEW: Text Analysis States
  const [leftAnalysis, setLeftAnalysis] = useState(null);
  const [rightAnalysis, setRightAnalysis] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComparisonResults, setShowComparisonResults] = useState(false);

  // pages Number For Overlay
  const [selectedPageDown, setSelectedPageDown] = useState(1);
  const [selectedPageUp, setSelectedPageUp] = useState(1);

  // 📌 Refs
  const fileDataCache = useRef({});
  const pdfDocumentCache = useRef({});

  useEffect(() => {
    const savedOption = localStorage.getItem("selectedOption");
    if (savedOption) {
      setActiveOption(savedOption);
    }
  }, []);

  // NEW: Text Extraction and Analysis Functions
  const extractTextFromPDF = async (file) => {
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let totalText = "";
      let pageAnalysis = [];
      let textBasedPages = 0;
      let imageBasedPages = 0;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Extract text from page
        const pageText = textContent.items
          .map((item) => item.str)
          .join(" ")
          .trim();

        // Check if page has meaningful text content
        const hasText = pageText.length > 50; // Minimum threshold

        if (hasText) {
          textBasedPages++;
          totalText += pageText + "\n\n";
        } else {
          imageBasedPages++;
        }

        pageAnalysis.push({
          pageNumber: pageNum,
          hasText,
          textLength: pageText.length,
          text: pageText,
        });
      }

      // Clean and normalize text
      const cleanedText = totalText
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,!?;:()\-]/g, "")
        .trim();

      return {
        fileName: file.name,
        totalPages: pdf.numPages,
        textBasedPages,
        imageBasedPages,
        totalText: cleanedText,
        pageAnalysis,
        fileType:
          textBasedPages > imageBasedPages ? "text-based" : "image-based",
        confidence: Math.round(
          (Math.max(textBasedPages, imageBasedPages) / pdf.numPages) * 100
        ),
        wordCount: cleanedText.split(/\s+/).filter((word) => word.length > 0)
          .length,
        charCount: cleanedText.length,
      };
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(
        `Failed to extract text from ${file.name}: ${error.message}`
      );
    }
  };

  // NEW: Advanced Text Comparison Function (using custom utilities)
  const performTextComparison = (leftAnalysis, rightAnalysis) => {
    if (!leftAnalysis?.totalText || !rightAnalysis?.totalText) {
      return null;
    }

    const leftText = leftAnalysis.totalText.toLowerCase();
    const rightText = rightAnalysis.totalText.toLowerCase();

    // 1. Character-level diff using diff library
    const charDiff = Diff.diffChars(leftText, rightText);

    // 2. Word-level diff
    const wordDiff = Diff.diffWords(leftText, rightText);

    // 3. Sentence-level diff using custom tokenizer
    const leftSentences = textUtils.tokenizeSentences(leftText);
    const rightSentences = textUtils.tokenizeSentences(rightText);
    const sentenceDiff = Diff.diffArrays(leftSentences, rightSentences);

    // 4. Calculate similarity metrics using custom utilities
    const leftWords = new Set(
      textUtils.tokenizeWords(leftText).filter((word) => word.length > 2)
    );
    const rightWords = new Set(
      textUtils.tokenizeWords(rightText).filter((word) => word.length > 2)
    );

    const intersection = new Set(
      [...leftWords].filter((word) => rightWords.has(word))
    );
    const union = new Set([...leftWords, ...rightWords]);

    // Jaccard similarity using custom function
    const jaccardSimilarity = textUtils.jaccardSimilarity(
      leftWords,
      rightWords
    );

    // 5. Levenshtein distance for overall similarity using custom function
    const levenshteinDistance = textUtils.levenshteinDistance(
      leftText,
      rightText
    );
    const maxLength = Math.max(leftText.length, rightText.length);
    const levenshteinSimilarity =
      ((maxLength - levenshteinDistance) / maxLength) * 100;

    // 6. Find common phrases using custom n-gram function
    const leftTokens = textUtils.tokenizeWords(leftText);
    const rightTokens = textUtils.tokenizeWords(rightText);

    const leftTrigrams = textUtils.getNGrams(leftTokens, 3);
    const rightTrigrams = textUtils.getNGrams(rightTokens, 3);
    const commonPhrases = leftTrigrams.filter((phrase) =>
      rightTrigrams.includes(phrase)
    );

    // 7. Analyze changes
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    wordDiff.forEach((part) => {
      const wordCount = part.value
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      if (part.added) {
        addedCount += wordCount;
      } else if (part.removed) {
        removedCount += wordCount;
      } else {
        unchangedCount += wordCount;
      }
    });

    // 8. Calculate change percentage
    const totalWords = addedCount + removedCount + unchangedCount;
    const changePercentage =
      totalWords > 0 ? ((addedCount + removedCount) / totalWords) * 100 : 0;

    return {
      similarity: {
        jaccard: Math.round(jaccardSimilarity),
        levenshtein: Math.round(levenshteinSimilarity),
        overall: Math.round((jaccardSimilarity + levenshteinSimilarity) / 2),
      },
      changes: {
        added: addedCount,
        removed: removedCount,
        unchanged: unchangedCount,
        changePercentage: Math.round(changePercentage),
      },
      commonWords: intersection.size,
      uniqueWordsLeft: leftWords.size - intersection.size,
      uniqueWordsRight: rightWords.size - intersection.size,
      commonPhrases: [...new Set(commonPhrases)].slice(0, 10),
      wordDiff: wordDiff.slice(0, 50), // Limit for performance
      sentenceDiff: sentenceDiff.slice(0, 20),
      leftWordCount: leftAnalysis.wordCount,
      rightWordCount: rightAnalysis.wordCount,
      fileTypes: {
        left: leftAnalysis.fileType,
        right: rightAnalysis.fileType,
      },
    };
  };

  // Auto comparison useEffect - ye code aapke existing useEffects ke baad add karein
  useEffect(() => {
    localStorage.setItem("selectedOption", activeOption);
  }, [activeOption]);

  const handleOptionChange = (option) => {
    setActiveOption(option);
  };

  useEffect(() => {
    const shouldAutoCompare =
      leftFiles.length > 0 &&
      rightFiles.length > 0 &&
      !isAnalyzing &&
      !comparisonResult;

    if (shouldAutoCompare) {
      console.log("🚀 Auto-starting comparison...");

      // Small delay add karte hain taake UI properly render ho jaye
      const timer = setTimeout(() => {
        handleCompareDocuments();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [leftFiles, rightFiles, isAnalyzing, comparisonResult]);

  // Optional: Reset comparison jab koi file remove ho jaye
  useEffect(() => {
    // Agar koi ek side empty ho gaya hai toh comparison reset kar do
    if (leftFiles.length === 0 || rightFiles.length === 0) {
      if (comparisonResult) {
        console.log("🔄 Resetting comparison due to file removal");
        setComparisonResult(null);
        setLeftAnalysis(null);
        setRightAnalysis(null);
        setShowComparisonResults(false);
      }
    }
  }, [leftFiles.length, rightFiles.length, comparisonResult]);

  // Enhanced handleCompareDocuments function with better error handling
  const handleCompareDocuments = async () => {
    if (leftFiles.length === 0 || rightFiles.length === 0) {
      toast.error("Please upload both PDF files to compare");
      return;
    }

    if (isAnalyzing) {
      console.log("⚠️ Comparison already in progress");
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log("📊 Starting document analysis...");

      // Extract text from both files
      const [leftResult, rightResult] = await Promise.all([
        extractTextFromPDF(leftFiles[0]),
        extractTextFromPDF(rightFiles[0]),
      ]);

      setLeftAnalysis(leftResult);
      setRightAnalysis(rightResult);

      // Check if both files are image-based
      const leftIsImageBased = leftResult.fileType === "image-based";
      const rightIsImageBased = rightResult.fileType === "image-based";
      const hasImageBasedFile = leftIsImageBased || rightIsImageBased;

      if (hasImageBasedFile) {
        console.log("🖼️ Image-based PDF detected, OCR required");

        // Set special state for OCR requirement
        setComparisonResult({
          requiresOCR: true,
          leftIsImageBased,
          rightIsImageBased,
          leftAnalysis: leftResult,
          rightAnalysis: rightResult,
        });

        // Don't show regular comparison results
        setShowComparisonResults(false);

        toast.warning(
          "Image-based PDF detected. OCR processing required for text comparison."
        );
        return;
      }

      // Proceed with normal text comparison for text-based PDFs
      const comparison = performTextComparison(leftResult, rightResult);
      setComparisonResult(comparison);

      console.log("✅ Comparison completed successfully");
      toast.success("Documents compared successfully!");
    } catch (error) {
      console.error("❌ Error analyzing documents:", error);
      toast.error(`Error analyzing documents: ${error.message}`);

      setLeftAnalysis(null);
      setRightAnalysis(null);
      setComparisonResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };


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

  const handleFiles = useCallback(
    async (newFiles, targetSide = null) => {
      const fileArray = Array.from(newFiles);
      console.log("fileArray:", fileArray);

      const fileObjects = await Promise.all(
        fileArray.map(async (file) => {
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

      if (fileObjects.length === 0) return; // No files to process

      if (activeOption === "semantic") {
        console.log("Handling files for semantic comparison");

        const isFirstTime = leftFiles.length === 0 && rightFiles.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setLeftFiles([fileObjects[0]]);
          setRightFiles([fileObjects[1]]);

          if (fileObjects.length > 2) {
            console.log("More than 2 files selected, ignoring the rest");
          }
        } else {
          const sideToUse = targetSide || activeSide || "left";
          const singleFile = fileObjects[0];

          if (sideToUse === "right") {
            setRightFiles([singleFile]);
          } else {
            setLeftFiles([singleFile]);
          }

          if (fileObjects.length > 1) {
            console.log("Multiple files selected, only using the first one");
          }
        }

        setActiveSide(null); // Reset after adding files
      } else if (activeOption === "overlay") {
        const isFirstTime = overlayDown.length === 0 && overlayUp.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setOverlayDown([fileObjects[0]]);
          setOverlayUp([fileObjects[1]]);
          console.log("✅ First time: bottom + top assigned");
        } else {
          const singleFile = fileObjects[0];

          if (targetSide === "bottom" || overlayDown.length === 0) {
            setOverlayDown([singleFile]);
            console.log("✅ File assigned to bottom layer");
          } else if (targetSide === "top" || overlayUp.length === 0) {
            setOverlayUp([singleFile]);
            console.log("✅ File assigned to top layer");
          } else {
            setOverlayUp([singleFile]);
            console.log("✅ Replaced top layer");
          }

          if (fileObjects.length > 1) {
            console.log(
              "Multiple files selected for overlay, only using the first one"
            );
          }
        }
      }
    },
    [
      createStableFileData,
      activeSide,
      leftFiles.length,
      rightFiles.length,
      activeOption,
      overlayDown.length,
      overlayUp.length,
    ]
  );

  // Add this useEffect to handle option changes and file transfers
  useEffect(() => {
    // Transfer files when option changes from semantic to overlay
    if (
      activeOption === "overlay" &&
      (leftFiles.length > 0 || rightFiles.length > 0)
    ) {
      console.log("Transferring files from semantic to overlay");

      // Transfer left file to overlay down, right file to overlay up
      if (leftFiles.length > 0) {
        setOverlayDown([leftFiles[0]]);
      }
      if (rightFiles.length > 0) {
        setOverlayUp([rightFiles[0]]);
      }

      // Clear semantic files
      setLeftFiles([]);
      setRightFiles([]);
    }

    // Transfer files when option changes from overlay to semantic
    else if (
      activeOption === "semantic" &&
      (overlayDown.length > 0 || overlayUp.length > 0)
    ) {
      console.log("Transferring files from overlay to semantic");

      // Transfer overlay down to left, overlay up to right
      if (overlayDown.length > 0) {
        setLeftFiles([overlayDown[0]]);
      }
      if (overlayUp.length > 0) {
        setRightFiles([overlayUp[0]]);
      }

      // Clear overlay files
      setOverlayDown([]);
      setOverlayUp([]);
    }
  }, [activeOption]); // Only depend on activeOption change

  // Updated onDocumentLoadSuccess function - condition wise
  const onDocumentLoadSuccess = useCallback(
    (pdf, fileId) => {
      console.log("📄 PDF Loaded Successfully:", {
        fileId,
        numPages: pdf.numPages,
        currentActiveOption: activeOption,
        timestamp: new Date().toISOString(),
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

      // Helper function to update numPages in array
      const updateFileNumPages = (fileArray, arrayName) => {
        const updated = fileArray.map((file) => {
          if (file.id === fileId) {
            console.log(
              `✅ Updated ${arrayName} file:`,
              file.name,
              "numPages:",
              pdf.numPages
            );
            return { ...file, numPages: pdf.numPages };
          }
          return file;
        });
        return updated;
      };

      // Update all possible locations where this file might exist
      setLeftFiles((prev) => {
        console.log("🔍 Checking leftFiles for fileId:", fileId, prev);
        return updateFileNumPages(prev, "leftFiles");
      });

      setRightFiles((prev) => {
        console.log("🔍 Checking rightFiles for fileId:", fileId, prev);
        return updateFileNumPages(prev, "rightFiles");
      });

      setOverlayDown((prev) => {
        console.log("🔍 Checking overlayDown for fileId:", fileId, prev);
        return updateFileNumPages(prev, "overlayDown");
      });

      setOverlayUp((prev) => {
        console.log("🔍 Checking overlayUp for fileId:", fileId, prev);
        return updateFileNumPages(prev, "overlayUp");
      });
    },
    [activeOption] // Adding back for debugging
  );

  // Optimized remove function with cleanup - condition wise
  const removeFile = useCallback(
    (id) => {
      // Clean up object URL
      const fileData = fileDataCache.current[id];
      if (
        fileData &&
        fileData.dataUrl &&
        fileData.dataUrl.startsWith("blob:")
      ) {
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

      // Remove from main files array (if still being used)
      setFiles((prev) => prev.filter((file) => file.id !== id));

      // Remove files based on activeOption
      if (activeOption === "semantic") {
        // Remove from semantic comparison arrays
        setLeftFiles((prev) => prev.filter((file) => file.id !== id));
        setRightFiles((prev) => prev.filter((file) => file.id !== id));

        // Reset semantic analysis results when files are removed
        setLeftAnalysis(null);
        setRightAnalysis(null);
        setComparisonResult(null);
      } else if (activeOption === "overlay") {
        // Remove from overlay comparison states - updated for arrays
        setOverlayDown((prev) => prev.filter((file) => file.id !== id));
        setOverlayUp((prev) => prev.filter((file) => file.id !== id));

        // Reset overlay analysis results when files are removed
        // Add your overlay-specific state resets here if any
        // setOverlayAnalysis(null); // example if you have overlay analysis
      }

      setPdfPages((prev) => {
        const newPages = { ...prev };
        delete newPages[id];
        return newPages;
      });
    },
    [activeOption]
  );

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

  // Protected files ke liye - condition wise
  const handleProtectedFiles = useCallback(
    (passwordProtectedFiles) => {
      console.log("Password protected files detected:", passwordProtectedFiles);
      console.log("Current active option:", activeOption);

      setProtectedFiles(passwordProtectedFiles); // Store temporarily for modal
      setShowPasswordModal(true); // Show password input modal
    },
    [activeOption]
  );

  const handleUnlockedFiles = useCallback(
    (unlockedFiles) => {
      console.log("✅ Final Unlocked Files:", unlockedFiles);
      console.log("Processing for mode:", activeOption);

      unlockedFiles.forEach((file, index) => {
        console.log(`🔓 File #${index + 1} (${activeOption} mode):`, {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          fileObj: file.file,
          stableData: file.stableData,
          isUnlocked: file.isUnlocked,
          activeOption: activeOption,
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

      // Apply same conditional logic as handleFiles
      if (activeOption === "semantic") {
        console.log("🔄 Processing unlocked files for semantic comparison");

        // Check if this is first time (both sides empty) and user selected multiple files
        const isFirstTime = leftFiles.length === 0 && rightFiles.length === 0;
        const hasMultipleFiles = unlockedFiles.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setLeftFiles([unlockedFiles[0]]); // Only first file to left
          setRightFiles([unlockedFiles[1]]); // Only second file to right

          // If more than 2 files, ignore the rest
          if (unlockedFiles.length > 2) {
            console.log("More than 2 unlocked files, ignoring the rest");
          }
        } else {
          // Normal behavior - add to specific side (only one file at a time)
          const sideToUse = activeSide || "left";
          console.log("sideToUse for unlocked file:", sideToUse);

          // Take only the first file (limit to one file per side)
          const singleFile = unlockedFiles[0];

          if (sideToUse === "right") {
            setRightFiles([singleFile]); // Replace with single file
          } else {
            setLeftFiles([singleFile]); // Replace with single file
          }

          // If multiple files selected but not first time, show warning or ignore
          if (unlockedFiles.length > 1) {
            console.log(
              "Multiple unlocked files selected, only using the first one"
            );
          }
        }

        setActiveSide(null); // Reset after adding files
      } else if (activeOption === "overlay") {
        console.log("🔄 Processing unlocked files for overlay comparison");

        // Check if this is first time (both overlay arrays empty) and user selected multiple files
        const isFirstTime = overlayDown.length === 0 && overlayUp.length === 0;
        const hasMultipleFiles = unlockedFiles.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          // First file goes to overlayDown, second to overlayUp
          setOverlayDown([unlockedFiles[0]]); // Bottom layer - first selected
          setOverlayUp([unlockedFiles[1]]); // Top layer - second selected

          // If more than 2 files, ignore the rest
          if (unlockedFiles.length > 2) {
            console.log(
              "More than 2 unlocked files for overlay, ignoring the rest"
            );
          }
        } else {
          // Sequential file selection - updated for arrays
          const singleFile = unlockedFiles[0]; // Take only first file

          if (overlayDown.length === 0) {
            // First file selection goes to bottom layer
            setOverlayDown([singleFile]);
            console.log(
              "First unlocked file added to overlay down (bottom layer)"
            );
          } else if (overlayUp.length === 0) {
            // Second file selection goes to top layer
            setOverlayUp([singleFile]);
            console.log("Second unlocked file added to overlay up (top layer)");
          } else {
            // Both positions filled - replace overlayUp
            setOverlayUp([singleFile]);
            console.log(
              "Both overlay positions filled, replacing top layer with unlocked file"
            );
          }

          // If multiple files selected, show warning
          if (unlockedFiles.length > 1) {
            console.log(
              "Multiple unlocked files selected for overlay, only using the first one"
            );
          }
        }
      }
    },
    [
      activeOption,
      activeSide,
      leftFiles.length,
      rightFiles.length,
      overlayDown.length,
      overlayUp.length,
    ]
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

  // NEW: Zoom control functions for left panel
  const handleLeftZoomIn = () => {
    setLeftZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleLeftZoomOut = () => {
    setLeftZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleLeftZoomChange = (newZoom) => {
    setLeftZoom(newZoom);
  };

  // NEW: Zoom control functions for right panel
  const handleRightZoomIn = () => {
    setRightZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleRightZoomOut = () => {
    setRightZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRightZoomChange = (newZoom) => {
    setRightZoom(newZoom);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const performOverlayAnalysis = async (overlayDownFile, overlayUpFile) => {
    try {
      console.log("🔍 Starting overlay analysis...");

      // Extract visual and text data from both PDFs
      const [downAnalysis, upAnalysis] = await Promise.all([
        extractOverlayData(overlayDownFile, selectedPageDown),
        extractOverlayData(overlayUpFile, selectedPageUp),
      ]);

      // Compare the overlays
      const comparison = {
        timestamp: new Date().toISOString(),
        downLayer: {
          fileName: overlayDownFile.name,
          pageNumber: selectedPageDown,
          textContent: downAnalysis.textContent,
          dimensions: downAnalysis.dimensions,
          hasImages: downAnalysis.hasImages,
          wordCount: downAnalysis.wordCount,
        },
        upLayer: {
          fileName: overlayUpFile.name,
          pageNumber: selectedPageUp,
          textContent: upAnalysis.textContent,
          dimensions: upAnalysis.dimensions,
          hasImages: upAnalysis.hasImages,
          wordCount: upAnalysis.wordCount,
        },
        differences: {
          textDifferences: calculateTextDifferences(
            downAnalysis.textContent,
            upAnalysis.textContent
          ),
          dimensionMatch: compareDimensions(
            downAnalysis.dimensions,
            upAnalysis.dimensions
          ),
          similarityScore: calculateOverlaySimilarity(downAnalysis, upAnalysis),
        },
        overlaySettings: {
          opacity: overlayOpacity,
          blendMode: overlayBlendMode,
          showDifferences: showDifferences,
        },
      };

      return comparison;
    } catch (error) {
      console.error("Error in overlay analysis:", error);
      throw error;
    }
  };

  // ================================
  // 3. EXTRACT OVERLAY DATA FUNCTION
  // ================================

  const extractOverlayData = async (file, pageNumber) => {
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNumber);

      // Get text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ")
        .trim();

      // Get page dimensions
      const viewport = page.getViewport({ scale: 1.0 });

      // Check for images/graphics
      const operatorList = await page.getOperatorList();
      const hasImages = operatorList.fnArray.includes(
        pdfjs.OPS.paintImageXObject
      );

      return {
        textContent: pageText,
        dimensions: {
          width: viewport.width,
          height: viewport.height,
        },
        hasImages,
        wordCount: pageText.split(/\s+/).filter((word) => word.length > 0)
          .length,
        viewport,
      };
    } catch (error) {
      console.error("Error extracting overlay data:", error);
      throw error;
    }
  };

  // ================================
  // 4. COMPARISON UTILITY FUNCTIONS
  // ================================

  const calculateTextDifferences = (downText, upText) => {
    // Use the existing Diff library
    const wordDiff = Diff.diffWords(
      downText.toLowerCase(),
      upText.toLowerCase()
    );

    let added = 0,
      removed = 0,
      unchanged = 0;

    wordDiff.forEach((part) => {
      const wordCount = part.value
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      if (part.added) {
        added += wordCount;
      } else if (part.removed) {
        removed += wordCount;
      } else {
        unchanged += wordCount;
      }
    });

    const totalWords = added + removed + unchanged;

    return {
      added,
      removed,
      unchanged,
      totalWords,
      changePercentage:
        totalWords > 0 ? Math.round(((added + removed) / totalWords) * 100) : 0,
      wordDiff: wordDiff.slice(0, 30), // Limit for performance
    };
  };

  const compareDimensions = (dim1, dim2) => {
    const widthMatch = Math.abs(dim1.width - dim2.width) < 5; // 5px tolerance
    const heightMatch = Math.abs(dim1.height - dim2.height) < 5;

    return {
      widthMatch,
      heightMatch,
      perfectMatch: widthMatch && heightMatch,
      widthDiff: Math.abs(dim1.width - dim2.width),
      heightDiff: Math.abs(dim1.height - dim2.height),
    };
  };

  const calculateOverlaySimilarity = (downAnalysis, upAnalysis) => {
    // Text similarity using Jaccard index
    const downWords = new Set(
      textUtils.tokenizeWords(downAnalysis.textContent)
    );
    const upWords = new Set(textUtils.tokenizeWords(upAnalysis.textContent));

    const intersection = new Set(
      [...downWords].filter((word) => upWords.has(word))
    );
    const union = new Set([...downWords, ...upWords]);

    const textSimilarity =
      union.size > 0 ? (intersection.size / union.size) * 100 : 0;

    // Dimension similarity
    const dimensionSimilarity = compareDimensions(
      downAnalysis.dimensions,
      upAnalysis.dimensions
    ).perfectMatch
      ? 100
      : 70;

    // Overall similarity (weighted average)
    const overallSimilarity = textSimilarity * 0.7 + dimensionSimilarity * 0.3;

    return {
      textSimilarity: Math.round(textSimilarity),
      dimensionSimilarity: Math.round(dimensionSimilarity),
      overall: Math.round(overallSimilarity),
    };
  };

  // ================================
  // 5. AUTO OVERLAY ANALYSIS EFFECT
  // ================================

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const shouldAutoAnalyze =
      overlayDown.length > 0 &&
      overlayUp.length > 0 &&
      !isOverlayAnalyzing &&
      !overlayComparison;

    if (shouldAutoAnalyze) {
      console.log("🚀 Auto-starting overlay analysis...");

      const timer = setTimeout(() => {
        handleOverlayAnalysis();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [
    overlayDown,
    overlayUp,
    isOverlayAnalyzing,
    overlayComparison,
    selectedPageDown,
    selectedPageUp,
  ]);

  // Reset overlay analysis when files are removed
  useEffect(() => {
    if (overlayDown.length === 0 || overlayUp.length === 0) {
      if (overlayComparison) {
        console.log("🔄 Resetting overlay analysis due to file removal");
        setOverlayComparison(null);
        setOverlayAnalysis(null);
      }
    }
  }, [overlayDown.length, overlayUp.length, overlayComparison]);

  // ================================
  // 6. HANDLE OVERLAY ANALYSIS FUNCTION
  // ================================

  const handleOverlayAnalysis = async () => {
    if (overlayDown.length === 0 || overlayUp.length === 0) {
      toast.error("Please upload both PDF files for overlay comparison");
      return;
    }

    if (isOverlayAnalyzing) {
      console.log("⚠️ Overlay analysis already in progress");
      return;
    }

    setIsOverlayAnalyzing(true);

    try {
      console.log("📊 Starting overlay analysis...", {
        downFile: overlayDown[0].name,
        upFile: overlayUp[0].name,
        downPage: selectedPageDown,
        upPage: selectedPageUp,
      });

      const comparison = await performOverlayAnalysis(
        overlayDown[0],
        overlayUp[0]
      );
      setOverlayComparison(comparison);
      setOverlayAnalysis(comparison);

      console.log("✅ Overlay analysis completed successfully");
      toast.success("Overlay comparison completed!");
    } catch (error) {
      console.error("❌ Error in overlay analysis:", error);
      toast.error(`Error analyzing overlay: ${error.message}`);

      setOverlayAnalysis(null);
      setOverlayComparison(null);
    } finally {
      setIsOverlayAnalyzing(false);
    }
  };

  // ================================
  // 7. OVERLAY CONTROLS COMPONENT
  // ================================

  // ================================
  // 8. OVERLAY ANALYSIS RESULTS COMPONENT
  // ================================

  const OverlayAnalysisResults = () => {
    if (!overlayComparison) return null;

    return (
      <div className="space-y-3">
        {/* Similarity Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {overlayComparison.differences.similarityScore.overall}%
            </div>
            <div className="text-xs text-purple-700">Overall Similarity</div>
          </div>
        </div>

        {/* Layer Information */}
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-800">
                Bottom Layer
              </span>
              <span className="text-xs text-blue-600">
                Page {overlayComparison.downLayer.pageNumber}
              </span>
            </div>
            <p className="text-xs text-blue-600 truncate mb-1">
              {overlayComparison.downLayer.fileName}
            </p>
            <div className="text-xs text-blue-600">
              Words: {overlayComparison.downLayer.wordCount} • Size:{" "}
              {Math.round(overlayComparison.downLayer.dimensions.width)}×
              {Math.round(overlayComparison.downLayer.dimensions.height)}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-red-800">
                Top Layer
              </span>
              <span className="text-xs text-red-600">
                Page {overlayComparison.upLayer.pageNumber}
              </span>
            </div>
            <p className="text-xs text-red-600 truncate mb-1">
              {overlayComparison.upLayer.fileName}
            </p>
            <div className="text-xs text-red-600">
              Words: {overlayComparison.upLayer.wordCount} • Size:{" "}
              {Math.round(overlayComparison.upLayer.dimensions.width)}×
              {Math.round(overlayComparison.upLayer.dimensions.height)}
            </div>
          </div>
        </div>

        {/* Text Differences */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-semibold text-gray-800 mb-2">
            Text Changes
          </h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-green-600">
                {overlayComparison.differences.textDifferences.added}
              </div>
              <div className="text-xs text-gray-600">Added</div>
            </div>
            <div>
              <div className="text-sm font-bold text-red-600">
                {overlayComparison.differences.textDifferences.removed}
              </div>
              <div className="text-xs text-gray-600">Removed</div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-600">
                {overlayComparison.differences.textDifferences.unchanged}
              </div>
              <div className="text-xs text-gray-600">Same</div>
            </div>
          </div>
        </div>

        {/* Dimension Match */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-xs font-semibold text-gray-800 mb-2">
            Dimension Match
          </h5>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Perfect Match:</span>
            <span
              className={`font-medium ${overlayComparison.differences.dimensionMatch.perfectMatch
                ? "text-green-600"
                : "text-orange-600"
                }`}
            >
              {overlayComparison.differences.dimensionMatch.perfectMatch
                ? "Yes"
                : "No"}
            </span>
          </div>
          {!overlayComparison.differences.dimensionMatch.perfectMatch && (
            <div className="text-xs text-gray-500 mt-1">
              Diff: {overlayComparison.differences.dimensionMatch.widthDiff}×
              {overlayComparison.differences.dimensionMatch.heightDiff}px
            </div>
          )}
        </div>
      </div>
    );
  };

  // ================================
  // 9. UPDATED OVERLAY DISPLAY COMPONENT
  // ================================

  // 2. FIXED: Enhanced Overlay Display Component
  const EnhancedOverlayDisplay = () => {
    // Show upload prompt if no files
    if (overlayDown.length === 0 && overlayUp.length === 0) {
      return (
        <div className="h-full w-full bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No files uploaded</p>
            <p className="text-gray-400 text-sm">
              Upload PDF files to start overlay comparison
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full bg-gray-100 relative overflow-hidden">
        {/* Main overlay container */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="relative bg-white shadow-lg rounded-lg overflow-hidden"
            style={{
              width: rightZoom > 100 ? "auto" : "90%",
              height: rightZoom > 100 ? "auto" : "90%",
              maxWidth: rightZoom > 100 ? "none" : "800px",
              maxHeight: rightZoom > 100 ? "none" : "900px",
            }}
          >
            {/* Bottom Layer (overlayDown) */}
            {overlayDown.length > 0 && (
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
                  <button
                    onClick={() => removeFile(overlayDown[0].id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md transition-all duration-200"
                    title="Remove Bottom Layer"
                  >
                    ×
                  </button>
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Page {selectedPageDown}
                  </div>
                </div>

                <OverlayPDFPreview
                  file={overlayDown[0]}
                  pageNumber={selectedPageDown}
                  isLoading={loadingPdfs.has(overlayDown[0].id)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  isHealthy={pdfHealthCheck[overlayDown[0].id] !== false}
                  isPasswordProtected={passwordProtectedFiles.has(
                    overlayDown[0].id
                  )}
                  showRemoveButton={false}
                  userZoom={rightZoom}
                  isSinglePage={true}
                  style={{
                    width: "100%",
                    height: "100%",
                    opacity: 0.8,
                  }}
                />
              </div>
            )}

            {/* Top Layer (overlayUp) */}
            {overlayUp.length > 0 && (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  mixBlendMode: overlayBlendMode,
                  opacity: overlayOpacity / 100,
                  zIndex: 10,
                }}
              >
                <div className="absolute top-2 right-2 z-30 flex flex-col gap-1 items-end">
                  <button
                    onClick={() => removeFile(overlayUp[0].id)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md transition-all duration-200"
                    title="Remove Top Layer"
                  >
                    ×
                  </button>
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Page {selectedPageUp}
                  </div>
                </div>

                <OverlayPDFPreview
                  file={overlayUp[0]}
                  pageNumber={selectedPageUp}
                  isLoading={loadingPdfs.has(overlayUp[0].id)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  isHealthy={pdfHealthCheck[overlayUp[0].id] !== false}
                  isPasswordProtected={passwordProtectedFiles.has(
                    overlayUp[0].id
                  )}
                  showRemoveButton={false}
                  userZoom={rightZoom}
                  isSinglePage={true}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            )}

            {/* Single file placeholder */}
            {overlayDown.length > 0 && overlayUp.length === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
                <div className="bg-white rounded-lg p-6 text-center shadow-lg">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    Add Top Layer
                  </p>
                  <p className="text-gray-500 text-sm">
                    Upload another PDF for overlay comparison
                  </p>
                </div>
              </div>
            )}

            {overlayDown.length === 0 && overlayUp.length > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
                <div className="bg-white rounded-lg p-6 text-center shadow-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    Add Bottom Layer
                  </p>
                  <p className="text-gray-500 text-sm">
                    Upload another PDF for overlay comparison
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-40">
          <ZoomControls
            zoom={rightZoom}
            onZoomIn={handleRightZoomIn}
            onZoomOut={handleRightZoomOut}
            onZoomChange={handleRightZoomChange}
          />
        </div>
      </div>
    );
  };

  // 3. FIXED: Updated Overlay Sidebar Content
  const OverlaySidebarContent = () => (
    <div className="w-full flex justify-center items-center flex-col gap-4">
      <div>
        <p className="border border-red-600 text-center bg-red-50 text-sm text-red-600 rounded-lg p-4">
          Overlay content from two files and display any changes in a separate
          color.
        </p>
      </div>

      {/* Overlay Controls */}
      {overlayDown.length > 0 && overlayUp.length > 0 && <OverlayControls />}

      {/* Analysis Results */}
      {overlayComparison && <OverlayAnalysisResults />}

      {/* File Upload Sections */}
      <div className="w-full flex flex-col items-center leading-none gap-4 p-4">
        {/* Bottom Layer Upload Section */}
        <div className="w-full max-w-lg">
          <div
            className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${overlayDown.length > 0
              ? "border border-blue-100 bg-white"
              : "border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100"
              }`}
            onClick={() => {
              if (overlayDown.length === 0) {
                // Trigger file upload for bottom layer
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.onchange = (e) => {
                  if (e.target.files?.length > 0) {
                    handleFiles(e.target.files, "bottom");
                  }
                };
                input.click();
              }
            }}
          >
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium mb-2 ${overlayDown.length > 0 ? "text-gray-800" : "text-blue-600"
                  }`}
              >
                {overlayDown.length > 0
                  ? overlayDown[0].name.length > 30
                    ? overlayDown[0].name.substring(0, 30) + "..."
                    : overlayDown[0].name
                  : "Click to select - Bottom Layer"}
                {overlayDown.length > 0 && overlayDown[0].numPages && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Total: {overlayDown[0].numPages} pages)
                  </span>
                )}
              </div>
              {overlayDown.length > 0 && (
                <input
                  type="number"
                  value={selectedPageDown}
                  min="1"
                  max={overlayDown[0].numPages || 1}
                  className="w-full text-sm border border-blue-100 rounded-lg px-3 py-2 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
                  placeholder="Page number"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxPages = overlayDown[0].numPages || 1;
                    setSelectedPageDown(Math.min(Math.max(value, 1), maxPages));
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
            <div className="flex-shrink-0">
              {overlayDown.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs text-green-600 font-medium"
                    title="✓ Loaded"
                  >
                    ✓
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(overlayDown[0].id);
                      setSelectedPageDown(1);
                    }}
                    className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Top Layer Upload Section */}
        <div className="w-full max-w-lg">
          <div
            className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${overlayUp.length > 0
              ? "border border-red-100 bg-white"
              : "border-2 border-dashed border-red-300 bg-red-50 hover:bg-red-100"
              }`}
            onClick={() => {
              if (overlayUp.length === 0) {
                // Trigger file upload for top layer
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.onchange = (e) => {
                  if (e.target.files?.length > 0) {
                    handleFiles(e.target.files, "top");
                  }
                };
                input.click();
              }
            }}
          >
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="flex-1">
              <div
                className={`text-sm font-medium mb-2 ${overlayUp.length > 0 ? "text-gray-800" : "text-red-600"
                  }`}
              >
                {overlayUp.length > 0
                  ? overlayUp[0].name.length > 30
                    ? overlayUp[0].name.substring(0, 30) + "..."
                    : overlayUp[0].name
                  : "Click to select - Top Layer"}
                {overlayUp.length > 0 && overlayUp[0].numPages && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Total: {overlayUp[0].numPages} pages)
                  </span>
                )}
              </div>
              {overlayUp.length > 0 && (
                <input
                  type="number"
                  value={selectedPageUp}
                  min="1"
                  max={overlayUp[0].numPages || 1}
                  className="w-full text-sm border border-red-100 rounded-lg px-3 py-2 bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all duration-200 outline-none"
                  placeholder="Page number"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxPages = overlayUp[0].numPages || 1;
                    setSelectedPageUp(Math.min(Math.max(value, 1), maxPages));
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
            <div className="flex-shrink-0">
              {overlayUp.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs text-green-600 font-medium"
                    title="✓ Loaded"
                  >
                    ✓
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(overlayUp[0].id);
                      setSelectedPageUp(1);
                    }}
                    className="w-5 h-5 text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Instructions */}
      {overlayDown.length === 0 && overlayUp.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mx-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">
            How to use:
          </h5>
          <ol className="text-xs text-gray-600 space-y-1">
            <li>1. Click on "Bottom Layer" to upload first PDF</li>
            <li>2. Click on "Top Layer" to upload second PDF</li>
            <li>3. Adjust opacity and blend modes</li>
            <li>4. Compare overlaid content visually</li>
          </ol>
        </div>
      )}
    </div>
  );

  // 4. FIXED: Overlay Controls Component
  const OverlayControls = () => {
    if (overlayDown.length === 0 || overlayUp.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 w-full max-w-lg shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">
          Overlay Controls
        </h4>

        {/* Opacity Control */}
        <div className="mb-4">
          <label
            htmlFor="opacity-slider"
            className="text-sm text-gray-600 mb-2 block"
          >
            Top Layer Opacity: {overlayOpacity}%
          </label>
          <input
            id="opacity-slider"
            type="range"
            min="0"
            max="100"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Blend Mode */}
        <div className="mb-4">
          <label
            htmlFor="blend-mode"
            className="text-sm text-gray-600 mb-2 block"
          >
            Blend Mode
          </label>
          <select
            id="blend-mode"
            value={overlayBlendMode}
            onChange={(e) => setOverlayBlendMode(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="overlay">Overlay</option>
            <option value="difference">Difference</option>
            <option value="screen">Screen</option>
            <option value="hard-light">Hard Light</option>
            <option value="soft-light">Soft Light</option>
          </select>
        </div>

        {/* Show Differences Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Highlight Differences</span>
          <button
            onClick={() => setShowDifferences(!showDifferences)}
            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${showDifferences ? "bg-red-500" : "bg-gray-300"
              }`}
            aria-label="Toggle Differences"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${showDifferences ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
          </button>
        </div>
      </div>
    );
  };

  const downloadOverlayReport = () => {
    if (!overlayComparison) {
      toast.error("No overlay analysis available to download");
      return;
    }

    try {
      // Create comprehensive overlay report
      const report = {
        reportType: "PDF Overlay Comparison",
        timestamp: new Date().toISOString(),
        analysis: overlayComparison,
        settings: {
          opacity: overlayOpacity,
          blendMode: overlayBlendMode,
          showDifferences: showDifferences,
        },
        summary: {
          overallSimilarity:
            overlayComparison.differences.similarityScore.overall,
          textChanges:
            overlayComparison.differences.textDifferences.changePercentage,
          dimensionMatch:
            overlayComparison.differences.dimensionMatch.perfectMatch,
          recommendation: getOverlayRecommendation(overlayComparison),
        },
      };

      // Download as JSON
      const dataStr = JSON.stringify(report, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `overlay-comparison-${Date.now()}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success("Overlay report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading overlay report:", error);
      toast.error("Failed to download overlay report");
    }
  };

  // Helper function for recommendations
  const getOverlayRecommendation = (comparison) => {
    const similarity = comparison.differences.similarityScore.overall;
    const textChange = comparison.differences.textDifferences.changePercentage;

    if (similarity > 90) {
      return "Files are very similar with minimal differences";
    } else if (similarity > 70) {
      return "Files have moderate similarities with some notable differences";
    } else if (similarity > 50) {
      return "Files show significant differences but maintain some common elements";
    } else {
      return "Files are substantially different";
    }
  };
  const resetOverlayAnalysisOnPageChange = () => {
    if (overlayComparison) {
      setOverlayComparison(null);
      setOverlayAnalysis(null);
      console.log("🔄 Overlay analysis reset due to page change");
    }
  };

  // Add this useEffect to handle page number changes
  useEffect(() => {
    if (overlayDown.length > 0 && overlayUp.length > 0) {
      // Reset analysis when page numbers change
      const timer = setTimeout(() => {
        resetOverlayAnalysisOnPageChange();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedPageDown, selectedPageUp]);
  const handleOpacityChange = (newOpacity) => {
    setOverlayOpacity(newOpacity);
    // Trigger re-analysis if needed
    if (
      overlayComparison &&
      Math.abs(newOpacity - overlayComparison.overlaySettings.opacity) > 10
    ) {
      // Optionally trigger re-analysis for significant opacity changes
      setTimeout(() => {
        if (overlayDown.length > 0 && overlayUp.length > 0) {
          handleOverlayAnalysis();
        }
      }, 500);
    }
  };

  // Feature 2: Keyboard shortcuts for overlay controls
  const handleKeyboardShortcuts = (e) => {
    if (
      activeOption === "overlay" &&
      overlayDown.length > 0 &&
      overlayUp.length > 0
    ) {
      switch (e.key) {
        case "ArrowUp":
          if (e.ctrlKey) {
            e.preventDefault();
            setOverlayOpacity((prev) => Math.min(prev + 5, 100));
          }
          break;
        case "ArrowDown":
          if (e.ctrlKey) {
            e.preventDefault();
            setOverlayOpacity((prev) => Math.max(prev - 5, 0));
          }
          break;
        case "d":
          if (e.ctrlKey) {
            e.preventDefault();
            setShowDifferences((prev) => !prev);
          }
          break;
        case "r":
          if (e.ctrlKey) {
            e.preventDefault();
            handleOverlayAnalysis();
          }
          break;
      }
    }
  };

  const advancedBlendModes = [
    { value: "normal", label: "Normal" },
    { value: "multiply", label: "Multiply" },
    { value: "screen", label: "Screen" },
    { value: "overlay", label: "Overlay" },
    { value: "soft-light", label: "Soft Light" },
    { value: "hard-light", label: "Hard Light" },
    { value: "color-dodge", label: "Color Dodge" },
    { value: "color-burn", label: "Color Burn" },
    { value: "difference", label: "Difference" },
    { value: "exclusion", label: "Exclusion" },
  ];

  // Feature 4: Export overlay as image
  const exportOverlayAsImage = async () => {
    try {
      toast.info("Image export feature - requires html2canvas library");
    } catch (error) {
      console.error("Error exporting overlay as image:", error);
      toast.error("Failed to export overlay as image");
    }
  };
  // Direct inline condition
  if (
    (activeOption === "semantic" &&
      leftFiles.length === 0 &&
      rightFiles.length === 0) ||
    (activeOption === "overlay" &&
      overlayDown.length === 0 &&
      overlayUp.length === 0)
  ) {
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
        pageTitle={activeOption === "semantic" ? "Compare PDF" : "Overlay PDF"}
        pageSubTitle={
          activeOption === "semantic"
            ? "Easily display the differences between two similar files."
            : "Overlay two PDF files for visual comparison."
        }
      />
    );
  }

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <ComparisonResults
        isOpen={showComparisonResults}
        onClose={() => setShowComparisonResults(false)}
        isAnalyzing={isAnalyzing}
        comparisonResult={comparisonResult}
        leftAnalysis={leftAnalysis}
        rightAnalysis={rightAnalysis}
      />

      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        <div
          className={`${isSidebarVisible ? "md:col-span-7" : "col-span-12"
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
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14 13v7h-3.5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1H14Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.764 1H9a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h5.764a2.997 2.997 0 0 1-.593-1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h5.17c.132-.373.336-.711.594-1Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14 5.5v1h-3a.5.5 0 0 1 0-1h3ZM14 8.5v1h-3a.5.5 0 0 1 0-1h3Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M30 2H17a1 1 0 0 0-1 1v20a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V3a1 1 0 0 0-1-2H17Z"
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
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18.5 6a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5ZM18.5 9a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM.853 7.854a.5.5 0 1 1-.707-.708l2-2a.498.498 0 0 1 .708 0l2 2a.5.5 0 1 1-.708.708L2.5 6.207.853 7.854Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.5 5.625c.345 0 .625.28.625.625V10a.625.625 0 1 1-1.25 0V6.25c0-.345.28-.625.625-.625ZM4.147 18.146a.5.5 0 0 1 .707.708l-2 2a.498.498 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L2.5 19.793l1.647-1.647Z"
                    fill="currentColor"
                  ></path>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
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
                  strokeWidth="1.5"
                ></rect>{" "}
                <line
                  x1="13.75"
                  y1="1"
                  x2="13.75"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                ></line>{" "}
              </svg>
            </div>
          </div>
          {activeOption === "semantic" ? (
            <div className="h-[calc(100%-3.2rem)] w-full bg-gray-100 p-4">
              <PDFDualPanel
                // Container props
                containerRef={containerRef}
                leftWidth={leftWidth}
                // Left panel props
                leftFiles={leftFiles}
                leftZoom={leftZoom}
                showLeftControls={showLeftControls}
                setShowLeftControls={setShowLeftControls}
                handleLeftZoomIn={handleLeftZoomIn}
                handleLeftZoomOut={handleLeftZoomOut}
                handleLeftZoomChange={handleLeftZoomChange}
                // Right panel props
                rightFiles={rightFiles}
                rightZoom={rightZoom}
                showRightControls={showRightControls}
                setShowRightControls={setShowRightControls}
                handleRightZoomIn={handleRightZoomIn}
                handleRightZoomOut={handleRightZoomOut}
                handleRightZoomChange={handleRightZoomChange}
                // Common props
                loadingPdfs={loadingPdfs}
                pdfHealthCheck={pdfHealthCheck}
                passwordProtectedFiles={passwordProtectedFiles}
                removeFile={removeFile}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                onDocumentLoadError={onDocumentLoadError}
                // Resizer props
                isResizing={isResizing}
                handleMouseDown={handleMouseDown}
                // File uploader props
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                setActiveSide={setActiveSide}
                handleFiles={handleFiles}
                allowedTypes={[".pdf"]}
                // Component props
                PDFPreview={PDFPreview}
                ZoomControls={ZoomControls}
                SafeFileUploader={SafeFileUploader}
              />
            </div>
          ) : (
            <EnhancedOverlayDisplay />
          )}
        </div>

        {/* Desktop Sidebar */}
        {isSidebarVisible && (
          <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
            <div className="">
              <h3 className="text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
                Compare PDF
              </h3>

              {/* Conversion Mode Options */}
              <div className="w-full relative">
                <div className="flex w-full border border-gray-200 rounded-t overflow-hidden">
                  <div
                    onClick={() => handleOptionChange("semantic")}
                    className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
        ${activeOption === "semantic"
                        ? "bg-red-100 border-l border-red-600 border-b-0"
                        : "bg-white border-l-0 border-b border-gray-300"
                      }`}
                  >
                    {activeOption === "semantic" && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✔</span>
                      </div>
                    )}
                    <div className="flex flex-col p-0 m-0 items-center leading-none">
                      <div
                        className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${activeOption === "semantic"
                          ? "text-red-600"
                          : "text-gray-500"
                          }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                        >
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M19 9.5H4A2.5 2.5 0 0 0 1.5 12v24A2.5 2.5 0 0 0 4 38.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 19 9.5ZM4 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H4ZM44 9.5H29a2.5 2.5 0 0 0-2.5 2.5v24a2.5 2.5 0 0 0 2.5 2.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 44 9.5ZM29 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H29Z"
                            clipRule="evenodd"
                          ></path>
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M15 18H5v-3h10v3ZM40 18H30v-3h10v3ZM18 21H5v-1h13v1ZM43 21H30v-1h13v1ZM18 25H5v-1h13v1ZM43 25H30v-1h13v1ZM18 29H5v-1h13v1ZM43 29H30v-1h13v1ZM18 33H5v-1h13v1ZM43 33H30v-1h13v1Z"
                            clipRule="evenodd"
                          ></path>
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M10 26H5v-3h5v3ZM35 26h-5v-3h5v3ZM18 30h-5v-3h5v3ZM43 30h-5v-3h5v3Z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium ${activeOption === "semantic"
                        ? "text-red-600"
                        : "text-gray-500"
                        }`}
                    >
                      Semantic Text
                    </p>
                  </div>

                  <div
                    onClick={() => handleOptionChange("overlay")}
                    className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
        ${activeOption === "overlay"
                        ? "bg-red-100 border-l border-red-600 border-b-0"
                        : "bg-white border-l-0 border-b border-gray-300"
                      }`}
                  >
                    {activeOption === "overlay" && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✔</span>
                      </div>
                    )}
                    <div className="flex flex-col p-0 m-0 items-center leading-none">
                      <div
                        className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${activeOption === "overlay"
                          ? "text-red-600"
                          : "text-gray-500"
                          }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                        >
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M27 18.5H8A2.5 2.5 0 0 0 5.5 21v19A2.5 2.5 0 0 0 8 42.5h19a2.5 2.5 0 0 0 2.5-2.5V21a2.5 2.5 0 0 0-2.5-2.5ZM8 17a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V21a4 4 0 0 0-4-4H8Z"
                            clipRule="evenodd"
                          ></path>
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M40 5.5H21A2.5 2.5 0 0 0 18.5 8v19a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 40 5.5ZM21 4a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H21Z"
                            clipRule="evenodd"
                          ></path>
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="m22 18-4 4-.707-.707 4-4L22 18ZM31 27l-4 4-.707-.707 4-4L31 27ZM25 18l-7 7-.707-.707 7-7L25 18ZM31 24l-7 7-.707-.707 7-7L31 24ZM28 18 18 28l-.707-.707 10-10L28 18ZM31 21 21 31l-.707-.707 10-10L31 21ZM30 19 19 30l-.707-.707 11-11L30 19Z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium ${activeOption === "overlay"
                        ? "text-red-600"
                        : "text-gray-500"
                        }`}
                    >
                      Content Overlay
                    </p>
                  </div>
                </div>
              </div>

              {/* Label based on selection */}
              <div className="my-4 mx-6 text-lg font-semibold text-gray-700">
                {activeOption === "semantic" ? (
                  <div className="w-full flex justify-center items-center flex-col">
                    <div>
                      <p className="border border-red-600 text-center bg-red-50 text-sm text-red-600 rounded-lg p-4">
                        Compare text changes between two PDFs using advanced
                        semantic analysis.
                      </p>
                    </div>

                    {/* File Analysis Status */}
                    {(leftFiles.length > 0 || rightFiles.length > 0) && (
                      <div className="mt-4 w-full space-y-3">
                        {leftFiles.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-800">
                                Left Document
                              </span>
                              {leftAnalysis ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Type className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              {leftFiles[0].name}
                            </p>
                            {leftAnalysis && (
                              <div className="text-xs text-blue-600 mt-1">
                                {leftAnalysis.fileType} •{" "}
                                {leftAnalysis.wordCount} words
                              </div>
                            )}
                          </div>
                        )}

                        {rightFiles.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-800">
                                Right Document
                              </span>
                              {rightAnalysis ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Type className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              {rightFiles[0].name}
                            </p>
                            {rightAnalysis && (
                              <div className="text-xs text-green-600 mt-1">
                                {rightAnalysis.fileType} •{" "}
                                {rightAnalysis.wordCount} words
                              </div>
                            )}
                          </div>
                        )}

                        {comparisonResult?.requiresOCR ? (

                          <OCRNotification
                            requiresOCR={comparisonResult?.requiresOCR}
                            leftIsImageBased={comparisonResult?.leftIsImageBased}
                            rightIsImageBased={comparisonResult?.rightIsImageBased}
                            leftAnalysis={comparisonResult?.leftAnalysis}
                            rightAnalysis={comparisonResult?.rightAnalysis}
                            ocrToolUrl="/ocr-pdf" // Optional, defaults to "/ocr-pdf"
                          />
                        ) : (
                          <>
                            {/* Original comparison ready section */}
                            {comparisonResult &&
                              !comparisonResult.requiresOCR && (
                                <div
                                  className="bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors duration-200 mx-3 sm:mx-4 md:mx-2 my-4"
                                  onClick={() => setShowComparisonResults(true)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-medium text-purple-800">
                                      Comparison Ready
                                    </span>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <Search className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                                      <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
                                    </div>
                                  </div>
                                  <div className="text-xs text-purple-600 mt-1">
                                    {comparisonResult.similarity?.overall}%
                                    similarity •{" "}
                                    {comparisonResult.changes?.changePercentage}
                                    % changed
                                  </div>
                                  <div className="text-xs text-purple-500 mt-2 font-medium">
                                    Click to view detailed report →
                                  </div>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <OverlaySidebarContent />
                )}
              </div>

              {hasUnhealthyFiles && (
                <div className="bg-yellow-50 rounded-xl p-4 mx-4 mb-6">
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

            <div className="p-4 border-t">
              {/* Semantic Text Button */}
              {activeOption === "semantic" && (
                <button
                  onClick={() => {
                    if (comparisonResult && !comparisonResult.requiresOCR) {
                      // Normal case - download report
                      const dataStr = JSON.stringify(comparisonResult, null, 2);
                      const dataUri =
                        "data:application/json;charset=utf-8," +
                        encodeURIComponent(dataStr);
                      const exportFileDefaultName = "comparison-report.json";
                      const linkElement = document.createElement("a");
                      linkElement.setAttribute("href", dataUri);
                      linkElement.setAttribute(
                        "download",
                        exportFileDefaultName
                      );
                      linkElement.click();
                      toast.success("Report downloaded successfully!");
                    }
                  }}
                  disabled={
                    leftFiles.length === 0 ||
                    rightFiles.length === 0 ||
                    comparisonResult?.requiresOCR // Disable when OCR is required
                  }
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${comparisonResult?.requiresOCR
                    ? "bg-orange-300 cursor-not-allowed" // Disabled state for OCR
                    : comparisonResult && !comparisonResult.requiresOCR
                      ? "bg-green-600 hover:bg-green-700 hover:scale-105 shadow-lg"
                      : "bg-red-300 cursor-not-allowed"
                    }`}
                >
                  {comparisonResult?.requiresOCR ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      OCR Required
                    </>
                  ) : comparisonResult ? (
                    <>
                      <Download className="w-5 h-5" />
                      Download Report
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Upload Both Files
                    </>
                  )}
                </button>
              )}

              {/* Content Overlay Button */}
              {activeOption === "overlay" && (
                <button
                  onClick={() => {
                    // Handle create report functionality for overlay
                    console.log("Creating overlay report...");
                    // Add your overlay report creation logic here
                    toast.success("Overlay report created successfully!");
                  }}
                  disabled={leftFiles.length === 0 || rightFiles.length === 0}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${leftFiles.length > 0 && rightFiles.length > 0
                    ? "bg-red-300 hover:bg-red-600 hover:scale-105 shadow-lg"
                    : "bg-gray-300 cursor-not-allowed"
                    }`}
                >
                  <FileText className="w-5 h-5" />
                  Download Report
                </button>
              )}

              {/* Common error messages */}
              {(leftFiles.length === 0 || rightFiles.length === 0) && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Upload both PDF files to{" "}
                  {activeOption === "semantic"
                    ? "compare"
                    : "create overlay report"}
                </p>
              )}

              {activeOption === "semantic" && comparisonResult?.requiresOCR && (
                <p className="text-xs text-orange-600 text-center mt-2">
                  Please process your image-based PDFs with OCR first
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          // onClick={handleAddWatermark}
          disabled={files.length === 0}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${files.length > 0
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          Comapre PDF
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSidebar}
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
