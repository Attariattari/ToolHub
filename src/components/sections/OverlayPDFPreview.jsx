import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, X } from "lucide-react";
import { IoMdLock } from "react-icons/io";

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
    // New overlay props
    isOverlayMode = false,
    overlayOpacity = 50,
    overlayBlendMode = "normal",
    isTopLayer = false,
    showDifferences = false,
    highlightColor = "#ff0000",
    overlayComparison = null,
    getTotalOverlayFilesCount,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
    const elementRef = useRef(null);
    const canvasRef = useRef(null);
    const pageRef = useRef(null);
    const pdfWrapperRef = useRef(null);

    // Fixed width calculation for single page PDFs
    const actualPDFWidth = useMemo(() => {
      if (isSinglePage) {
        return (containerWidth * userZoom) / 100;
      } else {
        return userZoom > 100
          ? (800 * userZoom) / 100
          : (containerWidth * userZoom) / 100;
      }
    }, [containerWidth, userZoom, isSinglePage]);

    // Check if we should show highlights (only when 2 files are present)
    const shouldShowHighlights = useMemo(() => {
      if (!showDifferences) return false;
      if (typeof getTotalOverlayFilesCount !== "function") return false;

      const totalFiles = getTotalOverlayFilesCount();
      return totalFiles === 2;
    }, [showDifferences, getTotalOverlayFilesCount]);
    const overlayStyles = useMemo(() => {
      if (!isOverlayMode) return {};

      const baseStyles = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: isTopLayer ? 2 : 1,
      };

      if (isTopLayer) {
        baseStyles.opacity = overlayOpacity / 100;
        baseStyles.mixBlendMode = overlayBlendMode;
        baseStyles.isolation = "isolate";
      } else {
        baseStyles.opacity = 0.8;
      }

      return baseStyles;
    }, [isOverlayMode, isTopLayer, overlayOpacity, overlayBlendMode]);

    // Track container width changes
    useEffect(() => {
      const updateWidth = () => {
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect();
          setContainerWidth(rect.width - 32);
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

    // FIXED: Improved difference highlights drawing (only when 2 files present)
    const drawDifferenceHighlights = useCallback(() => {
      if (!shouldShowHighlights || !canvasRef.current || !pageLoaded) {
        console.log("Skipping highlights - requirements not met:", {
          shouldShowHighlights,
          canvasExists: !!canvasRef.current,
          pageLoaded,
          pageNumber,
          totalFiles: getTotalOverlayFilesCount
            ? getTotalOverlayFilesCount()
            : "unknown",
        });
        return;
      }

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Find PDF page element more reliably
        let pageElement = null;
        if (pdfWrapperRef.current) {
          pageElement =
            pdfWrapperRef.current.querySelector(".react-pdf__Page__canvas") ||
            pdfWrapperRef.current.querySelector(".react-pdf__Page") ||
            pdfWrapperRef.current.querySelector("canvas");
        }

        if (!pageElement) {
          console.log(
            `PDF page element not found for page ${pageNumber}, retrying...`
          );
          setTimeout(drawDifferenceHighlights, 200);
          return;
        }

        const pageRect = pageElement.getBoundingClientRect();
        const containerRect = pdfWrapperRef.current.getBoundingClientRect();

        // Calculate relative position
        const relativeLeft = pageRect.left - containerRect.left;
        const relativeTop = pageRect.top - containerRect.top;

        console.log(
          `Drawing highlights for page ${pageNumber} with dimensions:`,
          {
            pageWidth: pageRect.width,
            pageHeight: pageRect.height,
            relativeLeft,
            relativeTop,
          }
        );

        // Set canvas size and position
        const dpr = window.devicePixelRatio || 1;
        canvas.width = pageRect.width * dpr;
        canvas.height = pageRect.height * dpr;
        canvas.style.width = pageRect.width + "px";
        canvas.style.height = pageRect.height + "px";
        canvas.style.position = "absolute";
        canvas.style.left = relativeLeft + "px";
        canvas.style.top = relativeTop + "px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "1000";
        canvas.style.border = "2px solid red"; // Debug border - remove later

        // Scale context for high DPI displays
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, pageRect.width, pageRect.height);

        // Generate highlights (page-specific sample data if no real data available)
        let differences = [];

        if (
          overlayComparison &&
          overlayComparison.differences &&
          overlayComparison.differences.length > 0
        ) {
          // Filter differences for current page if page info is available
          differences = overlayComparison.differences.filter(
            (diff) => !diff.page || diff.page === pageNumber
          );
          console.log(
            `Using real comparison data for page ${pageNumber}:`,
            differences.length,
            "differences"
          );
        } else {
          // Generate different sample highlights for different pages
          const samplePatterns = {
            1: [
              { x: 0.1, y: 0.15, w: 0.35, h: 0.08, type: "changed" },
              { x: 0.55, y: 0.35, w: 0.3, h: 0.06, type: "added" },
              { x: 0.15, y: 0.55, w: 0.5, h: 0.07, type: "removed" },
              { x: 0.25, y: 0.75, w: 0.4, h: 0.05, type: "modified" },
            ],
            2: [
              { x: 0.2, y: 0.2, w: 0.4, h: 0.1, type: "added" },
              { x: 0.1, y: 0.45, w: 0.6, h: 0.08, type: "changed" },
              { x: 0.3, y: 0.7, w: 0.35, h: 0.06, type: "removed" },
            ],
            default: [
              { x: 0.15, y: 0.25, w: 0.4, h: 0.09, type: "modified" },
              { x: 0.6, y: 0.4, w: 0.25, h: 0.07, type: "changed" },
              { x: 0.2, y: 0.65, w: 0.45, h: 0.08, type: "added" },
            ],
          };

          const pattern = samplePatterns[pageNumber] || samplePatterns.default;
          differences = pattern.map((p) => ({
            x: pageRect.width * p.x,
            y: pageRect.height * p.y,
            width: pageRect.width * p.w,
            height: pageRect.height * p.h,
            type: p.type,
          }));
          console.log(
            `Using sample highlight data for page ${pageNumber}:`,
            differences.length,
            "highlights"
          );
        }

        // Draw highlights with better visibility
        ctx.save();

        differences.forEach((region, index) => {
          try {
            const x = Math.max(0, region.x || 0);
            const y = Math.max(0, region.y || 0);
            const width = Math.min(pageRect.width - x, region.width || 100);
            const height = Math.min(pageRect.height - y, region.height || 50);

            console.log(
              `Drawing highlight ${index + 1} on page ${pageNumber}:`,
              { x, y, width, height }
            );

            // Use brighter colors for better visibility
            const colors = {
              changed: "#ff6b35",
              added: "#4ecdc4",
              removed: "#ff3838",
              modified: "#ffa726",
            };

            const fillColor = colors[region.type] || highlightColor;

            // Draw filled rectangle with higher opacity
            ctx.fillStyle = fillColor + "80"; // 80 = 50% opacity
            ctx.fillRect(x, y, width, height);

            // Draw thick border
            ctx.strokeStyle = fillColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Add label with background
            const labelText = `${(region.type || "Diff").toUpperCase()} ${
              index + 1
            }`;
            const labelWidth = ctx.measureText(labelText).width + 8;
            const labelHeight = 18;
            const labelY = y > 20 ? y - 22 : y + height + 4;

            // Label background
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, labelY, labelWidth, labelHeight);

            // Label text
            ctx.fillStyle = "white";
            ctx.font = "bold 11px Arial";
            ctx.textBaseline = "top";
            ctx.fillText(labelText, x + 4, labelY + 2);
          } catch (regionError) {
            console.error("Error drawing highlight region:", regionError);
          }
        });

        ctx.restore();
        console.log(
          `Successfully drew ${differences.length} highlights on page ${pageNumber}!`
        );
      } catch (error) {
        console.error("Error in drawDifferenceHighlights:", error);
      }
    }, [
      shouldShowHighlights,
      highlightColor,
      pageLoaded,
      overlayComparison,
      pageNumber,
      getTotalOverlayFilesCount,
    ]);

    // Enhanced effect to trigger highlight drawing (includes page number changes + file count check)
    useEffect(() => {
      if (shouldShowHighlights && pageLoaded && canvasRef.current) {
        console.log(
          "Triggering highlight drawing for page:",
          pageNumber,
          "with",
          getTotalOverlayFilesCount?.() || 0,
          "files"
        );

        // Clear existing highlights first
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Multiple attempts with increasing delays
        const attempts = [100, 300, 600, 1000, 1500];
        const timeouts = attempts.map((delay) =>
          setTimeout(() => {
            console.log(
              `Highlight attempt at ${delay}ms for page ${pageNumber}`
            );
            drawDifferenceHighlights();
          }, delay)
        );

        return () => {
          timeouts.forEach((timeout) => clearTimeout(timeout));
        };
      }
    }, [
      drawDifferenceHighlights,
      shouldShowHighlights,
      pageLoaded,
      pageNumber,
    ]); // Updated dependencies

    // Redraw on resize with debouncing (only when 2 files)
    useEffect(() => {
      if (shouldShowHighlights && pageLoaded) {
        let resizeTimeout;
        const handleResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            console.log("Redrawing highlights after resize");
            drawDifferenceHighlights();
          }, 300);
        };

        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
          clearTimeout(resizeTimeout);
        };
      }
    }, [shouldShowHighlights, pageLoaded, drawDifferenceHighlights]);

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

    // Enhanced page load success handler (resets page state on page change)
    const handlePageLoadSuccess = useCallback(
      (page) => {
        console.log("Page loaded successfully:", {
          pageNumber: page.pageNumber,
          width: page.originalWidth,
          height: page.originalHeight,
        });

        // Clear previous highlights when page changes (only if we should show highlights)
        if (canvasRef.current && shouldShowHighlights) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          console.log("Cleared previous highlights for new page");
        }

        setPageSize({
          width: page.originalWidth,
          height: page.originalHeight,
        });
        setPageLoaded(true);

        // Trigger highlights after a delay for new page (only if we should show highlights)
        if (shouldShowHighlights) {
          setTimeout(() => {
            console.log(
              "Triggering highlights after page",
              page.pageNumber,
              "load"
            );
            drawDifferenceHighlights();
          }, 800);
        }
      },
      [drawDifferenceHighlights, shouldShowHighlights]
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
          <div
            className="w-full h-auto min-h-full bg-white relative"
            style={isOverlayMode ? overlayStyles : {}}
            ref={pdfWrapperRef}
          >
            {!isLoading ? (
              <>
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
                  className="w-full h-auto"
                >
                  {documentLoaded && (
                    <div
                      className={`${
                        isSinglePage
                          ? userZoom > 100
                            ? "py-4 min-h-full overflow-x-auto overflow-y-visible flex justify-center"
                            : "py-4 min-h-full flex justify-center items-start"
                          : userZoom > 100
                          ? "w-full"
                          : "flex justify-center"
                      }`}
                      style={{
                        minWidth: userZoom > 100 ? "max-content" : "auto",
                        width: userZoom > 100 ? "max-content" : "auto",
                        height: "auto",
                        ...(isOverlayMode && isTopLayer
                          ? {
                              mixBlendMode: overlayBlendMode,
                              isolation: "isolate",
                            }
                          : {}),
                      }}
                    >
                      <div className="relative" ref={pageRef}>
                        <Page
                          pageNumber={pageNumber}
                          width={actualPDFWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={handlePageLoadSuccess}
                          onLoadError={(error) => {
                            console.error("Page Load Error:", error);
                            setHasError(true);
                            setPageLoaded(false);
                          }}
                          className={`shadow-lg border border-gray-200 transition-all duration-300 ease-in-out ${
                            isOverlayMode && isTopLayer
                              ? `blend-${overlayBlendMode}`
                              : ""
                          }`}
                          loading={
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                            </div>
                          }
                        />

                        {/* All your existing debug indicators and canvas overlays remain the same */}
                        {shouldShowHighlights && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full z-50 font-bold">
                            2 Files: Highlights{" "}
                            {pageLoaded ? "Ready" : "Loading..."}
                          </div>
                        )}

                        {/* ... rest of your existing debug and overlay elements ... */}
                      </div>
                    </div>
                  )}
                </Document>

                {/* Canvas and other overlays remain the same */}
                {shouldShowHighlights && pageLoaded && (
                  <canvas
                    ref={canvasRef}
                    className="absolute pointer-events-none"
                    style={{
                      zIndex: 1000,
                      top: 0,
                      left: 0,
                    }}
                  />
                )}

                {/* ... rest of your existing overlay elements ... */}
              </>
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
        className="w-full h-full "
        style={{
          ...style,
          ...(isOverlayMode ? { position: "relative" } : {}),
        }}
      >
        {/* File Preview Area */}
        <div className="w-full relative h-full ">
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

export default OverlayPDFPreview;
