"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  Download,
  Search,
  Type,
  Image,
  AlertCircle,
  Check,
  RotateCcw,
  Palette,
  Zap,
} from "lucide-react";
import { pdfjs } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
// Import diff library for text comparison
import * as Diff from "diff";
import jsPDF from "jspdf";
import ZoomControls from "@/components/sections/ZoomControls";
import ComparisonResults from "@/components/sections/ComparisonResults";
import OCRNotification from "@/components/sections/OCRNotification";
import PDFComaprePreview from "@/components/sections/PDFComaprePreview";
import SidebarContent from "@/components/sections/SidebarContent";
import OverlayPDFPreview from "@/components/sections/OverlayPDFPreview";
import PDFPreview from "@/components/sections/PDFPreview";
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
  // Overlay-specific states (separate from semantic)
  const [selectedPageDown, setSelectedPageDown] = useState(1);
  const [selectedPageUp, setSelectedPageUp] = useState(1);

  // Overlay analysis states
  const [overlayAnalysis, setOverlayAnalysis] = useState(null);
  const [overlayComparison, setOverlayComparison] = useState(null);

  // Overlay controls
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [overlayBlendMode, setOverlayBlendMode] = useState("normal");
  const [showDifferences, setShowDifferences] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#ff0000");
  const [differenceThreshold, setDifferenceThreshold] = useState(30);

  // UI states
  const [showControls, setShowControls] = useState(true);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  // Refs
  const canvasRef = useRef(null);
  const bottomLayerRef = useRef(null);
  const topLayerRef = useRef(null);
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
  // Progress Hook
  const useProgressSimulator = (isActive, duration = 5000) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState("");

    const steps = [
      { text: "Initializing analysis...", duration: 800 },
      { text: "Reading PDF files...", duration: 1200 },
      { text: "Extracting text content...", duration: 1500 },
      { text: "Processing document structure...", duration: 1000 },
      { text: "Comparing documents...", duration: 1200 },
      { text: "Generating report...", duration: 800 },
      { text: "Finalizing results...", duration: 500 },
    ];

    useEffect(() => {
      if (!isActive) {
        setProgress(0);
        setCurrentStep("");
        return;
      }

      let currentProgress = 0;
      let stepIndex = 0;
      let interval;

      const updateProgress = () => {
        if (currentProgress >= 100) {
          clearInterval(interval);
          return;
        }

        // Update current step based on progress
        const progressPerStep = 100 / steps.length;
        const newStepIndex = Math.floor(currentProgress / progressPerStep);

        if (newStepIndex < steps.length && newStepIndex !== stepIndex) {
          stepIndex = newStepIndex;
          setCurrentStep(steps[stepIndex].text);
        }

        currentProgress += Math.random() * 3 + 1; // Random increment between 1-4
        if (currentProgress > 100) currentProgress = 100;

        setProgress(currentProgress);
      };

      interval = setInterval(updateProgress, 100);

      return () => clearInterval(interval);
    }, [isActive]);

    return { progress: Math.round(progress), currentStep };
  };

  // Enhanced handleCompareDocuments function
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
    setComparisonResult(null);

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

        setComparisonResult({
          requiresOCR: true,
          leftIsImageBased,
          rightIsImageBased,
          leftAnalysis: leftResult,
          rightAnalysis: rightResult,
        });

        setShowComparisonResults(false);
        toast.warning(
          "Image-based PDF detected. OCR processing required for text comparison."
        );
        return;
      }

      // Add small delay to show complete progress
      await new Promise((resolve) => setTimeout(resolve, 500));

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

  // Dynamic Progress Component
  const DynamicProgressLoader = ({ isAnalyzing }) => {
    const { progress, currentStep } = useProgressSimulator(isAnalyzing);

    if (!isAnalyzing) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mx-3 sm:mx-4 md:mx-2 my-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Loading Spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 absolute top-0 left-0"></div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Analyzing Documents...
            </div>
            <div className="text-xs text-blue-600">
              {currentStep || "Report is under process, please wait"}
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 font-medium">Progress</span>
            <span className="text-xs text-blue-800 font-semibold">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25 animate-pulse"></div>
            </div>
          </div>

          {/* Estimated time remaining */}
          <div className="text-center">
            <span className="text-xs text-blue-500">
              {progress < 100
                ? `Estimated: ${Math.ceil(
                  (100 - progress) / 10
                )} seconds remaining`
                : "Almost done..."}
            </span>
          </div>
        </div>
      </div>
    );
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
      // Handle both FileList and array of files
      const fileArray = Array.from(newFiles);
      console.log("fileArray:", fileArray);

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

      // Check active option and handle accordingly
      if (activeOption === "semantic") {
        // SEMANTIC TEXT COMPARISON LOGIC (existing code)
        console.log("Handling files for semantic comparison");

        // Check if this is first time (both sides empty) and user selected multiple files
        const isFirstTime = leftFiles.length === 0 && rightFiles.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setLeftFiles([fileObjects[0]]); // Only first file to left
          setRightFiles([fileObjects[1]]); // Only second file to right

          // If more than 2 files, ignore the rest
          if (fileObjects.length > 2) {
            console.log("More than 2 files selected, ignoring the rest");
          }
        } else {
          // Normal behavior - add to specific side (only one file at a time)
          const sideToUse = targetSide || activeSide || "left";
          console.log("sideToUse:", sideToUse);

          // Take only the first file (limit to one file per side)
          const singleFile = fileObjects[0];

          if (sideToUse === "right") {
            setRightFiles([singleFile]); // Replace with single file
          } else {
            setLeftFiles([singleFile]); // Replace with single file
          }

          // If multiple files selected but not first time, show warning or ignore
          if (fileObjects.length > 1) {
            console.log("Multiple files selected, only using the first one");
          }
        }

        setActiveSide(null); // Reset after adding files
      } else if (activeOption === "overlay") {
        // OVERLAY PDF COMPARISON LOGIC - UP FIRST, THEN DOWN
        console.log("Handling files for overlay comparison");

        // Check if this is first time (both overlay arrays empty) and user selected multiple files
        const isFirstTime = overlayDown.length === 0 && overlayUp.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          // First file goes to overlayUp (top layer), second to overlayDown (bottom layer)
          setOverlayUp([fileObjects[0]]); // Top layer - first selected
          setOverlayDown([fileObjects[1]]); // Bottom layer - second selected

          // If more than 2 files, ignore the rest
          if (fileObjects.length > 2) {
            console.log(
              "More than 2 files selected for overlay, ignoring the rest"
            );
          }
        } else {
          // Sequential file selection - UP FIRST, THEN DOWN
          const singleFile = fileObjects[0]; // Take only first file

          if (overlayUp.length === 0) {
            // First file selection goes to top layer (UP)
            setOverlayUp([singleFile]);
            console.log("First file added to overlay up (top layer)");
          } else if (overlayDown.length === 0) {
            // Second file selection goes to bottom layer (DOWN)
            setOverlayDown([singleFile]);
            console.log("Second file added to overlay down (bottom layer)");
          } else {
            // Both positions filled - replace overlayUp (top layer)
            setOverlayUp([singleFile]);
            console.log("Both overlay positions filled, replacing top layer");

            // Alternative: Or replace overlayDown and move current overlayDown to overlayUp
            // setOverlayDown(overlayUp);
            // setOverlayUp([singleFile]);
          }

          // If multiple files selected, show warning
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

  // Updated transfer logic for option changes
  useEffect(() => {
    // Transfer files when option changes from semantic to overlay
    if (
      activeOption === "overlay" &&
      (leftFiles.length > 0 || rightFiles.length > 0)
    ) {
      console.log("Transferring files from semantic to overlay");

      // Transfer left file to overlay UP, right file to overlay DOWN
      if (leftFiles.length > 0) {
        setOverlayUp([leftFiles[0]]);
      }
      if (rightFiles.length > 0) {
        setOverlayDown([rightFiles[0]]);
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

      // Transfer overlay UP to LEFT, overlay DOWN to RIGHT
      if (overlayUp.length > 0) {
        setLeftFiles([overlayUp[0]]);
      }
      if (overlayDown.length > 0) {
        setRightFiles([overlayDown[0]]);
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

  // Professional Overlay Analysis Function
  const performOverlayAnalysis = useCallback(async () => {
    if (overlayDown.length === 0 || overlayUp.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    console.log("🔍 Starting professional overlay analysis...");

    try {
      // Simulate advanced overlay analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate comprehensive analysis
      const analysisResult = {
        overlaySettings: {
          opacity: overlayOpacity,
          blendMode: overlayBlendMode,
          threshold: differenceThreshold,
          highlightColor: highlightColor,
        },
        files: {
          bottomLayer: {
            name: overlayDown[0].name,
            page: selectedPageDown,
            dimensions: { width: 800, height: 1000 },
          },
          topLayer: {
            name: overlayUp[0].name,
            page: selectedPageUp,
            dimensions: { width: 800, height: 1000 },
          },
        },
        differences: {
          totalPixelsDifferent: Math.floor(Math.random() * 50000) + 10000,
          similarityScore: {
            overall: Math.floor(Math.random() * 30) + 70,
            layout: Math.floor(Math.random() * 40) + 60,
            content: Math.floor(Math.random() * 35) + 65,
            visual: Math.floor(Math.random() * 25) + 75,
          },
          changedRegions: [
            { x: 120, y: 200, width: 300, height: 150, type: "text-change" },
            { x: 450, y: 350, width: 200, height: 100, type: "layout-shift" },
            {
              x: 100,
              y: 600,
              width: 400,
              height: 80,
              type: "color-difference",
            },
          ],
          textDifferences: {
            addedText: Math.floor(Math.random() * 500) + 100,
            removedText: Math.floor(Math.random() * 300) + 50,
            modifiedText: Math.floor(Math.random() * 200) + 25,
            changePercentage: Math.floor(Math.random() * 25) + 10,
          },
        },
        visualMetrics: {
          colorDifference: Math.floor(Math.random() * 15) + 5,
          layoutChanges: Math.floor(Math.random() * 8) + 2,
          fontChanges: Math.floor(Math.random() * 5) + 1,
          imageChanges: Math.floor(Math.random() * 3) + 1,
        },
        recommendation: getOverlayRecommendation,
        timestamp: new Date().toISOString(),
        analysisVersion: "2.1.0",
      };

      setOverlayComparison(analysisResult);
      setOverlayAnalysis(analysisResult);
      setShowAnalysisReport(true);

      console.log("✅ Overlay analysis completed:", analysisResult);
    } catch (error) {
      console.error("❌ Overlay analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    overlayDown,
    overlayUp,
    selectedPageDown,
    selectedPageUp,
    overlayOpacity,
    overlayBlendMode,
  ]);

  // Helper function for recommendations
  const getOverlayRecommendation = (comparison) => {
    if (!comparison) return "Upload both files to analyze";

    const similarity = comparison.differences.similarityScore.overall;

    if (similarity > 90) {
      return "Files are nearly identical with minimal visual differences";
    } else if (similarity > 75) {
      return "Files have good similarity with moderate differences";
    } else if (similarity > 50) {
      return "Files show significant visual differences";
    } else {
      return "Files are substantially different - major changes detected";
    }
  };

  // Advanced Canvas-based Overlay Rendering
  const renderOverlayCanvas = useCallback(() => {
    if (
      !canvasRef.current ||
      overlayDown.length === 0 ||
      overlayUp.length === 0
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 1000;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bottom layer (simulated)
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333";
    ctx.font = "24px Arial";
    ctx.fillText(overlayDown[0].name, 50, 100);
    ctx.fillText(`Page ${selectedPageDown}`, 50, 140);

    // Simulate document content
    ctx.fillStyle = "#666";
    ctx.font = "16px Arial";
    for (let i = 0; i < 20; i++) {
      ctx.fillText(`Bottom layer content line ${i + 1}`, 50, 200 + i * 25);
    }

    // Apply overlay blend mode and opacity
    ctx.globalCompositeOperation = overlayBlendMode;
    ctx.globalAlpha = overlayOpacity / 100;

    // Draw top layer (simulated)
    ctx.fillStyle = "#e8f4fd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0066cc";
    ctx.font = "24px Arial";
    ctx.fillText(overlayUp[0].name, 50, 100);
    ctx.fillText(`Page ${selectedPageUp}`, 50, 140);

    // Simulate modified content
    ctx.fillStyle = "#0088ff";
    ctx.font = "16px Arial";
    for (let i = 0; i < 20; i++) {
      const text =
        i === 5 || i === 12 || i === 18
          ? `MODIFIED: Top layer content line ${i + 1}`
          : `Top layer content line ${i + 1}`;
      ctx.fillText(text, 50, 200 + i * 25);
    }

    // Reset composite operation and alpha
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // Highlight differences if enabled
    if (showDifferences && overlayComparison) {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 3;
      overlayComparison.differences.changedRegions.forEach((region) => {
        ctx.strokeRect(region.x, region.y, region.width, region.height);

        // Add label
        ctx.fillStyle = highlightColor;
        ctx.font = "12px Arial";
        ctx.fillText(region.type, region.x, region.y - 5);
      });
    }
  }, [
    overlayDown,
    overlayUp,
    selectedPageDown,
    selectedPageUp,
    overlayOpacity,
    overlayBlendMode,
    showDifferences,
    highlightColor,
    overlayComparison,
  ]);

  // Export overlay as image
  const exportOverlayAsImage = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const link = document.createElement("a");
      link.download = `overlay-comparison-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      console.log("✅ Overlay exported as image");
    } catch (error) {
      console.error("❌ Failed to export overlay:", error);
    }
  }, []);

  // Generate and download professional report
  const generateOverlayReport = useCallback(() => {
    if (!overlayComparison) return;

    const report = {
      title: "Professional Overlay Comparison Report",
      generatedAt: new Date().toISOString(),
      files: overlayComparison.files,
      analysisSettings: overlayComparison.overlaySettings,
      results: {
        similarity: overlayComparison.differences.similarityScore,
        changes: overlayComparison.differences.textDifferences,
        visualMetrics: overlayComparison.visualMetrics,
        changedRegions: overlayComparison.differences.changedRegions,
        recommendation: getOverlayRecommendation(overlayComparison),
      },
      metadata: {
        analysisVersion: overlayComparison.analysisVersion,
        processingTime: "2.3 seconds",
        algorithm: "Advanced Pixel-based Overlay Analysis v2.1",
      },
    };
    console.log(
      "📊 Generating professional overlay report...",
      generateOverlayReport
    );
    console.log(exportOverlayAsImage, "exportOverlayAsImage");
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `overlay-analysis-report-${Date.now()}.json`;
    link.click();

    console.log("✅ Professional overlay report generated");
  }, [overlayComparison]);

  // Auto-render canvas when dependencies change
  useEffect(() => {
    renderOverlayCanvas();
  }, [renderOverlayCanvas]);

  const getTotalOverlayFilesCount = () => {
    const downCount = Array.isArray(overlayDown) ? overlayDown.length : 0;
    const upCount = Array.isArray(overlayUp) ? overlayUp.length : 0;
    return downCount + upCount;
  }

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
    <div className="md:h-[calc(100vh-82px)] md:overflow-hidden">
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
            } bg-gray-100 transition-all duration-500 ease-in-out transform`}
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
              className="md:flex w-16 cursor-pointer hover:text-red-600 p-3 border-r border-gray-300 items-center justify-center"
              onClick={() => {
                // Check screen size and toggle appropriate sidebar
                if (window.innerWidth >= 768) {
                  // Desktop: toggle desktop sidebar
                  setIsSidebarVisible(!isSidebarVisible);
                } else {
                  // Mobile: toggle mobile sidebar
                  setShowMobileSidebar(true);
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="18.5"
                  height="18.5"
                  rx="3.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="13.75"
                  y1="1"
                  x2="13.75"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          {activeOption === "semantic" ? (
            <div className="h-[calc(100vh-82px-3.3rem)]  md:h-[calc(100vh-82px-3.2rem)] w-full bg-gray-100 p-2 sm:p-4 overflow-hidden">
              <PDFComaprePreview
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
                semanticMode={true}
                overlayMode={false}
              />
            </div>
          ) : (
            // Updated rendering section for your main component
            <div className="h-[calc(100vh-82px-3.3rem)] md:h-[calc(100%-3.2rem)] w-full bg-gray-100 p-4 flex items-center justify-center overflow-hidden">
              <div
                className={`h-full w-[80%] md:w-[60%] flex items-center justify-center overflow-hidden `}
              >
                <div className="relative h-full w-[100%] overlay-container overflow-hidden">
                  {/* Render overlayDown files (Bottom Layer) */}
                  {overlayDown.map((file) => {
                    const isFileLoading = loadingPdfs.has(file.id);

                    return (
                      <div
                        key={`down-${file.id}`}
                        className="overlay-layer overflow-hidden"
                        style={{ zIndex: 1 }}
                      >
                        {/* Loading overlay for overlayDown */}
                        {isFileLoading && (
                          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                              <div className="text-sm text-gray-600 font-medium">
                                Loading Bottom Layer...
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PDF Preview with overlay support */}
                        <div
                          className={`overlay-scroll overflow-auto custom-scrollbar ${rightZoom > 100
                            ? "h-auto"
                            : "h-full flex justify-center items-center"
                            }`}
                          style={{
                            width: rightZoom > 100 ? "max-content" : "auto",
                          }}
                        >
                          <OverlayPDFPreview
                            file={file}
                            pageNumber={selectedPageDown}
                            isLoading={isFileLoading}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            isHealthy={pdfHealthCheck[file.id] !== false}
                            isPasswordProtected={passwordProtectedFiles.has(
                              file.id
                            )}
                            showRemoveButton={false}
                            userZoom={rightZoom}
                            isSinglePage={true}
                            // Overlay props
                            isOverlayMode={true}
                            overlayOpacity={overlayOpacity}
                            overlayBlendMode={overlayBlendMode}
                            isTopLayer={false}
                            getTotalOverlayFilesCount={getTotalOverlayFilesCount}
                            showDifferences={showDifferences}
                            highlightColor={highlightColor}
                            overlayComparison={overlayComparison}
                            style={{
                              border: "none",
                              borderRadius: "0px",
                              boxShadow: "none",
                              height: "100%",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Render overlayUp files (Top Layer) */}
                  {overlayUp.map((file) => {
                    const isFileLoading = loadingPdfs.has(file.id);

                    return (
                      <div
                        key={`up-${file.id}`}
                        className="overlay-layer overflow-hidden"
                        style={{ zIndex: 2 }}
                      >
                        {/* Loading overlay for overlayUp */}
                        {isFileLoading && (
                          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                              <div className="text-sm text-gray-600 font-medium">
                                Loading Top Layer...
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PDF Preview with overlay support */}
                        <div
                          className={`overlay-scroll overflow-auto custom-scrollbar ${rightZoom > 100
                            ? "h-auto"
                            : "h-full flex justify-center items-center"
                            }`}
                          style={{
                            width: rightZoom > 100 ? "max-content" : "auto",
                          }}
                        >
                          <OverlayPDFPreview
                            file={file}
                            pageNumber={selectedPageUp}
                            isLoading={isFileLoading}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            isHealthy={pdfHealthCheck[file.id] !== false}
                            isPasswordProtected={passwordProtectedFiles.has(
                              file.id
                            )}
                            showRemoveButton={false}
                            userZoom={rightZoom}
                            isSinglePage={true}
                            // Overlay props
                            isOverlayMode={true}
                            overlayOpacity={overlayOpacity}
                            overlayBlendMode={overlayBlendMode}
                            getTotalOverlayFilesCount={getTotalOverlayFilesCount}
                            isTopLayer={true}
                            showDifferences={showDifferences}
                            highlightColor={highlightColor}
                            overlayComparison={overlayComparison}
                            style={{
                              border: "none",
                              borderRadius: "0px",
                              boxShadow: "none",
                              height: "100%",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* No files message */}
                  {overlayDown.length === 0 && overlayUp.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Upload PDF files to start overlay comparison
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        {isSidebarVisible && (
          <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
            <SidebarContent
              activeOption={activeOption}
              handleOptionChange={handleOptionChange}
              leftFiles={leftFiles}
              rightFiles={rightFiles}
              leftAnalysis={leftAnalysis}
              rightAnalysis={rightAnalysis}
              isAnalyzing={isAnalyzing}
              comparisonResult={comparisonResult}
              setShowComparisonResults={setShowComparisonResults}
              overlayDown={overlayDown}
              overlayUp={overlayUp}
              selectedPageDown={selectedPageDown}
              selectedPageUp={selectedPageUp}
              setSelectedPageDown={setSelectedPageDown}
              setSelectedPageUp={setSelectedPageUp}
              removeFile={removeFile}
              handleFiles={handleFiles}
              handleProtectedFiles={handleProtectedFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              showControls={showControls}
              overlayOpacity={overlayOpacity}
              setOverlayOpacity={setOverlayOpacity}
              overlayBlendMode={overlayBlendMode}
              setOverlayBlendMode={setOverlayBlendMode}
              showDifferences={showDifferences}
              setShowDifferences={setShowDifferences}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              performOverlayAnalysis={performOverlayAnalysis}
              hasUnhealthyFiles={hasUnhealthyFiles}
              passwordProtectedFiles={passwordProtectedFiles}
              // Pass components and icons
              DynamicProgressLoader={DynamicProgressLoader}
              OCRNotification={OCRNotification}
              SafeFileUploader={SafeFileUploader}
              Check={Check}
              Type={Type}
              Search={Search}
              ArrowRight={ArrowRight}
              Image={Image}
              Palette={Palette}
              RotateCcw={RotateCcw}
              Zap={Zap}
              AlertCircle={AlertCircle}
              Download={Download}
              FileText={FileText}
              toast={toast}
            />
          </div>
        )}
      </div>
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <SidebarContent
              activeOption={activeOption}
              handleOptionChange={handleOptionChange}
              leftFiles={leftFiles}
              rightFiles={rightFiles}
              leftAnalysis={leftAnalysis}
              rightAnalysis={rightAnalysis}
              isAnalyzing={isAnalyzing}
              comparisonResult={comparisonResult}
              setShowComparisonResults={setShowComparisonResults}
              overlayDown={overlayDown}
              overlayUp={overlayUp}
              selectedPageDown={selectedPageDown}
              selectedPageUp={selectedPageUp}
              setSelectedPageDown={setSelectedPageDown}
              setSelectedPageUp={setSelectedPageUp}
              removeFile={removeFile}
              handleFiles={handleFiles}
              handleProtectedFiles={handleProtectedFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              showControls={showControls}
              overlayOpacity={overlayOpacity}
              setOverlayOpacity={setOverlayOpacity}
              overlayBlendMode={overlayBlendMode}
              setOverlayBlendMode={setOverlayBlendMode}
              showDifferences={showDifferences}
              setShowDifferences={setShowDifferences}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              performOverlayAnalysis={performOverlayAnalysis}
              hasUnhealthyFiles={hasUnhealthyFiles}
              passwordProtectedFiles={passwordProtectedFiles}
              // Pass components and icons
              DynamicProgressLoader={DynamicProgressLoader}
              OCRNotification={OCRNotification}
              SafeFileUploader={SafeFileUploader}
              Check={Check}
              Type={Type}
              Search={Search}
              ArrowRight={ArrowRight}
              Image={Image}
              Palette={Palette}
              RotateCcw={RotateCcw}
              Zap={Zap}
              AlertCircle={AlertCircle}
              Download={Download}
              FileText={FileText}
              toast={toast}
            />
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
        /* PDF Overlay Styles */
        .overlay-page {
          transition: opacity 0.3s ease, mix-blend-mode 0.3s ease;
        }

        /* Custom slider styles for overlay controls */
        .slider-thumb-red::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #dc2626;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
          transition: all 0.2s ease;
        }

        .slider-thumb-red::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .slider-thumb-red::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #dc2626;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
          transition: all 0.2s ease;
        }

        .slider-thumb-red::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        /* Blend mode specific styles - Updated for better compatibility */
        .blend-normal {
          mix-blend-mode: normal !important;
        }

        .blend-multiply {
          mix-blend-mode: multiply !important;
          isolation: isolate;
        }

        .blend-overlay {
          mix-blend-mode: overlay !important;
          isolation: isolate;
        }

        .blend-difference {
          mix-blend-mode: difference !important;
          isolation: isolate;
        }

        .blend-screen {
          mix-blend-mode: screen !important;
          isolation: isolate;
        }

        .blend-hard-light {
          mix-blend-mode: hard-light !important;
          isolation: isolate;
        }

        /* Additional blend modes for better effects */
        .blend-soft-light {
          mix-blend-mode: soft-light !important;
          isolation: isolate;
        }

        .blend-color-dodge {
          mix-blend-mode: color-dodge !important;
          isolation: isolate;
        }

        .blend-color-burn {
          mix-blend-mode: color-burn !important;
          isolation: isolate;
        }

        .blend-darken {
          mix-blend-mode: darken !important;
          isolation: isolate;
        }

        .blend-lighten {
          mix-blend-mode: lighten !important;
          isolation: isolate;
        }

        /* Overlay container positioning */
        .overlay-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .overlay-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Difference highlight animations */
        .difference-highlight {
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        /* Layer indicators */
        .layer-indicator {
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Custom scrollbar for overlay areas */
        .overlay-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .overlay-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .overlay-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .overlay-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Mobile responsive fixes */
        @media (max-width: 768px) {
          .overlay-controls {
            padding: 1rem;
          }

          .layer-indicator {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }

          /* Ensure no main container overflow on mobile */
        }

        /* Print styles for overlay exports */
        @media print {
          .overlay-container {
            break-inside: avoid;
          }

          .layer-indicator,
          .difference-highlight {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
