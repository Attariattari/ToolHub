// Enhanced PDFPreview Component with Professional Highlighting

import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, X, Eye, EyeOff, Zap, Target, Info } from "lucide-react";
import { IoMdLock } from "react-icons/io";

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
    // Enhanced highlighting props
    side = "left",
    comparisonComplete = false,
    showHighlights = true,
    differences = [],
    highlightColor = "red",
    onHighlightClick,
    highlightOpacity = 0.7,
    showHighlightInfo = true,
    animateHighlights = true,
    highlightStyle = "modern",
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [pageScale, setPageScale] = useState(1);
    const [originalPageDimensions, setOriginalPageDimensions] = useState({
      width: 0,
      height: 0,
    });
    const [renderedPageWidth, setRenderedPageWidth] = useState(0);
    const [renderedPageHeight, setRenderedPageHeight] = useState(0);
    const [hoveredHighlight, setHoveredHighlight] = useState(null);
    const [highlightStats, setHighlightStats] = useState({
      added: 0,
      removed: 0,
    });

    const elementRef = useRef(null);
    const pageRef = useRef(null);
    const highlightLayerRef = useRef(null);

    // Enhanced PDF width calculation
    const actualPDFWidth = useMemo(() => {
      if (containerWidth === 0) return 600;

      let baseWidth;
      if (isSinglePage) {
        baseWidth =
          userZoom > 100
            ? Math.min(containerWidth * 0.9, 1200)
            : Math.min(containerWidth * 0.95, 900);
      } else {
        baseWidth =
          userZoom > 100
            ? Math.min(containerWidth * 0.9, 1000)
            : Math.min(containerWidth * 0.95, 700);
      }

      const scaledWidth = (baseWidth * userZoom) / 100;
      return Math.max(300, Math.round(scaledWidth));
    }, [containerWidth, userZoom, isSinglePage]);

    // Enhanced container width tracking
    useEffect(() => {
      const updateWidth = () => {
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect();
          const newWidth = Math.round(rect.width - 40);
          if (Math.abs(newWidth - containerWidth) > 5) {
            setContainerWidth(newWidth);
          }
        }
      };

      const debouncedUpdate = debounce(updateWidth, 100);

      updateWidth();
      window.addEventListener("resize", debouncedUpdate);

      const resizeObserver = new ResizeObserver(debouncedUpdate);
      if (elementRef.current) {
        resizeObserver.observe(elementRef.current);
      }

      return () => {
        window.removeEventListener("resize", debouncedUpdate);
        resizeObserver.disconnect();
      };
    }, [containerWidth]);

    // Debounce utility
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Enhanced PDF options
    const pdfOptions = useMemo(
      () => ({
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        httpHeaders: {},
        withCredentials: false,
        verbosity: 0,
      }),
      []
    );

    // Intersection observer for lazy loading
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
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
        setPageLoaded(false);
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

    const handlePageLoadSuccess = useCallback(
      (page) => {
        setPageLoaded(true);

        // Get precise page dimensions
        const viewport = page.getViewport({ scale: 1.0 });
        setOriginalPageDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        // Calculate exact scale factors
        const scaleX = actualPDFWidth / viewport.width;
        const scaleY = scaleX; // Maintain aspect ratio
        setPageScale(scaleX);

        const calculatedHeight = viewport.height * scaleX;
        setRenderedPageWidth(actualPDFWidth);
        setRenderedPageHeight(calculatedHeight);

        console.log(
          `📏 Page ${pageNumber} (${side}) - Scale: ${scaleX.toFixed(
            3
          )}, Size: ${actualPDFWidth}x${calculatedHeight.toFixed(0)}`
        );
      },
      [actualPDFWidth, pageNumber, side]
    );

    // Enhanced current page differences with better filtering and categorization
    const currentPageDifferences = useMemo(() => {
      if (!differences || differences.length === 0 || !pageLoaded) return [];

      const validDifferences = differences
        .filter((diff) => {
          // Must match current page
          if (diff.pageNumber !== pageNumber) return false;

          // Must have valid coordinates
          if (
            typeof diff.x !== "number" ||
            typeof diff.y !== "number" ||
            diff.x < 0 ||
            diff.y < 0
          )
            return false;

          // Must have meaningful text
          if (!diff.text || diff.text.trim().length < 2) return false;

          // Must have reasonable dimensions
          if (diff.originalPdfWidth === 0 || diff.originalPdfHeight === 0)
            return false;

          return true;
        })
        .map((diff, index) => ({
          ...diff,
          uniqueId: `${side}-${pageNumber}-${index}-${diff.text?.substring(
            0,
            15
          )}`,
          confidence: diff.confidence || 0.8,
          // Normalize coordinates if needed
          normalizedX: Math.max(
            0,
            Math.min(diff.x, diff.originalPdfWidth - 10)
          ),
          normalizedY: Math.max(
            0,
            Math.min(diff.y, diff.originalPdfHeight - 10)
          ),
          // Categorize by confidence
          confidenceLevel:
            (diff.confidence || 0.8) > 0.85
              ? "high"
              : (diff.confidence || 0.8) > 0.65
              ? "medium"
              : "low",
          // Categorize by type
          changeType: diff.type || (side === "left" ? "removed" : "added"),
        }))
        .sort(
          (a, b) =>
            a.normalizedY - b.normalizedY || a.normalizedX - b.normalizedX
        );

      // Calculate stats
      const stats = validDifferences.reduce(
        (acc, diff) => {
          if (diff.changeType === "added") acc.added++;
          else if (diff.changeType === "removed") acc.removed++;
          return acc;
        },
        { added: 0, removed: 0 }
      );

      setHighlightStats(stats);

      console.log(
        `🎯 Page ${pageNumber} (${side}): ${validDifferences.length} valid highlights (${stats.added} added, ${stats.removed} removed)`
      );
      return validDifferences;
    }, [differences, pageNumber, side, pageLoaded]);

    // Professional highlight styles
    const getHighlightStyles = (diff) => {
      const baseStyle = {
        position: "absolute",
        pointerEvents: "auto",
        borderRadius: highlightStyle === "minimal" ? "2px" : "4px",
        transition: animateHighlights
          ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          : "none",
        zIndex: 20,
        fontSize: "10px",
        fontWeight: "500",
        boxSizing: "border-box",
        cursor: onHighlightClick ? "pointer" : "default",
        opacity: highlightOpacity,
      };

      // Style variations
      const styleVariants = {
        modern: {
          removed: {
            backgroundColor: "rgba(255, 59, 48, 0.15)",
            border: "2px solid rgba(255, 59, 48, 0.4)",
            boxShadow:
              "0 2px 8px rgba(255, 59, 48, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(1px)",
          },
          added: {
            backgroundColor: "rgba(52, 199, 89, 0.15)",
            border: "2px solid rgba(52, 199, 89, 0.4)",
            boxShadow:
              "0 2px 8px rgba(52, 199, 89, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(1px)",
          },
        },
        classic: {
          removed: {
            backgroundColor: "rgba(255, 0, 0, 0.2)",
            border: "1px solid rgba(255, 0, 0, 0.5)",
            boxShadow: "0 1px 3px rgba(255, 0, 0, 0.2)",
          },
          added: {
            backgroundColor: "rgba(0, 255, 0, 0.2)",
            border: "1px solid rgba(0, 255, 0, 0.5)",
            boxShadow: "0 1px 3px rgba(0, 255, 0, 0.2)",
          },
        },
        minimal: {
          removed: {
            backgroundColor: "rgba(255, 59, 48, 0.1)",
            borderLeft: "3px solid rgba(255, 59, 48, 0.6)",
          },
          added: {
            backgroundColor: "rgba(52, 199, 89, 0.1)",
            borderLeft: "3px solid rgba(52, 199, 89, 0.6)",
          },
        },
      };

      const variant = styleVariants[highlightStyle] || styleVariants.modern;
      const typeStyle = variant[diff.changeType] || variant.removed;

      // Confidence-based opacity adjustments
      const confidenceMultiplier =
        diff.confidenceLevel === "high"
          ? 1.0
          : diff.confidenceLevel === "medium"
          ? 0.8
          : 0.6;

      return {
        ...baseStyle,
        ...typeStyle,
        opacity: highlightOpacity * confidenceMultiplier,
      };
    };

    // Enhanced highlight rendering with professional positioning
    const renderHighlights = () => {
      if (
        !comparisonComplete ||
        !showHighlights ||
        !pageLoaded ||
        !currentPageDifferences.length ||
        pageScale === 0 ||
        originalPageDimensions.width === 0
      ) {
        return null;
      }

      const highlightCount = currentPageDifferences.length;
      console.log(
        `🎨 Rendering ${highlightCount} professional highlights for page ${pageNumber} (${side})`
      );

      return (
        <div
          ref={highlightLayerRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 15 }}
        >
          {currentPageDifferences.map((diff, index) => {
            // Enhanced coordinate transformation
            const scaleX = renderedPageWidth / originalPageDimensions.width;
            const scaleY = renderedPageHeight / originalPageDimensions.height;

            // Use the actual scale factors calculated during page load
            const transformedX = Math.round(diff.normalizedX * scaleX);
            const transformedY = Math.round(diff.normalizedY * scaleY);

            // Enhanced width and height calculation
            let transformedWidth = Math.max(
              diff.width * scaleX,
              diff.text.length * 6 * scaleX,
              25 * scaleX
            );
            let transformedHeight = Math.max(
              diff.height * scaleY,
              18 * scaleY,
              14 * scaleY
            );

            // Ensure minimum readable size
            transformedWidth = Math.max(transformedWidth, 20);
            transformedHeight = Math.max(transformedHeight, 14);

            // Enhanced boundary clamping
            const maxX = renderedPageWidth - transformedWidth;
            const maxY = renderedPageHeight - transformedHeight;

            const finalX = Math.max(0, Math.min(transformedX, maxX));
            const finalY = Math.max(0, Math.min(transformedY, maxY));
            const finalWidth = Math.min(
              transformedWidth,
              renderedPageWidth - finalX
            );
            const finalHeight = Math.min(
              transformedHeight,
              renderedPageHeight - finalY
            );

            // Skip if too small or invalid
            if (finalWidth < 10 || finalHeight < 8) {
              return null;
            }

            // Enhanced highlight title
            const confidencePercent = Math.round(
              (diff.confidence || 0.8) * 100
            );
            const highlightTitle = `${
              diff.changeType === "removed" ? "Removed" : "Added"
            }: "${diff.text.substring(0, 60)}${
              diff.text.length > 60 ? "..." : ""
            }" (${confidencePercent}% confidence, ${
              diff.matchType || "exact"
            } match)`;

            const isHovered = hoveredHighlight === diff.uniqueId;

            return (
              <div
                key={diff.uniqueId}
                className={`absolute transition-all duration-300 ${
                  animateHighlights ? "highlight-animation" : ""
                }`}
                style={{
                  ...getHighlightStyles(diff),
                  left: `${finalX}px`,
                  top: `${finalY}px`,
                  width: `${finalWidth}px`,
                  height: `${finalHeight}px`,
                  animationDelay: animateHighlights ? `${index * 0.05}s` : "0s",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                  zIndex: isHovered ? 25 : 20,
                }}
                title={highlightTitle}
                onMouseEnter={() => setHoveredHighlight(diff.uniqueId)}
                onMouseLeave={() => setHoveredHighlight(null)}
                onClick={() => onHighlightClick && onHighlightClick(diff)}
              >
                {/* Confidence indicator */}
                {diff.confidenceLevel === "low" && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-80 flex items-center justify-center"
                    title="Low confidence match"
                  >
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}

                {/* High confidence indicator */}
                {diff.confidenceLevel === "high" && (
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-80 flex items-center justify-center"
                    title="High confidence match"
                  >
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}

                {/* Hover information panel */}
                {isHovered &&
                  showHighlightInfo &&
                  finalWidth > 50 &&
                  finalHeight > 25 && (
                    <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 max-w-xs">
                      <div className="font-semibold">
                        {diff.changeType === "removed"
                          ? "🗑️ Removed"
                          : "✅ Added"}
                      </div>
                      <div className="truncate">
                        "{diff.text.substring(0, 40)}..."
                      </div>
                      <div className="text-gray-300">
                        {confidencePercent}% • {diff.matchType || "exact"}
                      </div>
                    </div>
                  )}

                {/* Click indicator */}
                {onHighlightClick && isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      Click for details
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    const renderPreview = () => {
      // Password protection handling
      if (isPasswordProtected) {
        return (
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              Password required
            </div>
            <IoMdLock className="text-4xl text-gray-600 mb-2" />
            <div className="flex items-center gap-1 bg-black rounded-full py-1 px-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
              ))}
            </div>
          </div>
        );
      }

      // Error or unhealthy state
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

      // PDF rendering
      if (
        file.type === "application/pdf" &&
        file.stableData &&
        containerWidth > 0
      ) {
        return (
          <div className="w-full h-full bg-white relative">
            {!isLoading ? (
              <Document
                file={file.stableData.dataUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={handleLoadError}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                }
                error={
                  <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-4">
                    <FileText className="w-12 h-12 text-red-400 mb-2" />
                    <div className="text-sm text-red-600 font-medium text-center">
                      Could not load PDF preview
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      Check file integrity or try re-uploading
                    </div>
                  </div>
                }
                options={pdfOptions}
                className="w-full h-full"
              >
                {documentLoaded && (
                  <div
                    className={`relative ${
                      isSinglePage
                        ? userZoom > 100
                          ? "py-4 min-h-full overflow-x-auto overflow-y-hidden flex justify-start"
                          : "py-4 min-h-full flex justify-center items-center"
                        : userZoom > 100
                        ? "w-full overflow-x-auto"
                        : "flex justify-center"
                    }`}
                    style={{
                      minWidth:
                        (isSinglePage && userZoom > 100) ||
                        (!isSinglePage && userZoom > 100)
                          ? "max-content"
                          : "auto",
                      width:
                        (isSinglePage && userZoom > 100) ||
                        (!isSinglePage && userZoom > 100)
                          ? "max-content"
                          : "auto",
                    }}
                  >
                    <div className="relative inline-block">
                      <Page
                        ref={pageRef}
                        pageNumber={pageNumber}
                        width={actualPDFWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg border border-gray-200 transition-all duration-300 ease-in-out bg-white"
                        onLoadSuccess={handlePageLoadSuccess}
                        loading={
                          <div
                            className="w-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-lg"
                            style={{
                              width: actualPDFWidth,
                              height: Math.round(actualPDFWidth * 1.414),
                            }} // A4 aspect ratio
                          >
                            <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          </div>
                        }
                        onLoadError={(error) => {
                          console.error("Page Load Error:", error);
                          setHasError(true);
                        }}
                      />
                      {/* Enhanced professional highlight overlay */}
                      {renderHighlights()}
                    </div>
                  </div>
                )}
              </Document>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        );
      }

      // Fallback for non-PDF files
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
        {/* Enhanced CSS for professional highlight animations */}
        <style jsx>{`
          @keyframes highlight-fade-in {
            0% {
              opacity: 0;
              transform: scale(0.95) translateY(5px);
            }
            50% {
              opacity: 0.9;
              transform: scale(1.02) translateY(-1px);
            }
            100% {
              opacity: ${highlightOpacity};
              transform: scale(1) translateY(0);
            }
          }

          @keyframes highlight-pulse {
            0%,
            100% {
              opacity: ${highlightOpacity};
            }
            50% {
              opacity: ${Math.min(1, highlightOpacity + 0.3)};
            }
          }

          .highlight-animation {
            animation: highlight-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1)
              forwards;
          }

          .highlight-animation:hover {
            animation: highlight-pulse 1.5s ease-in-out infinite;
            transform: scale(1.02) !important;
            z-index: 25 !important;
          }

          /* Professional hover effects */
          .highlight-animation:hover {
            filter: brightness(1.1);
            backdrop-filter: blur(2px);
          }
        `}</style>

        {/* File Preview Area */}
        <div className="w-full relative h-full overflow-hidden">
          {renderPreview()}

          {/* Enhanced Remove Button */}
          {showRemoveButton && onRemove && (
            <div className="absolute top-2 right-2 flex gap-1 z-30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="w-8 h-8 bg-white/95 border border-gray-300 hover:bg-white hover:border-red-300 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg"
                title="Remove file"
              >
                <X className="w-4 h-4 text-red-500 hover:text-red-600" />
              </button>
            </div>
          )}

          {/* Professional highlight status indicator */}
          {comparisonComplete && currentPageDifferences.length > 0 && (
            <div className="absolute bottom-3 right-3 z-30">
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900">
                    {currentPageDifferences.length} changes
                  </span>
                </div>
                {showHighlights ? (
                  <Eye className="w-3 h-3 text-blue-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PDFPreview.displayName = "PDFPreview";

export default PDFPreview;
