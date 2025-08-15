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
        // For single page PDFs, use fixed base width like multi-page for consistency
        const baseWidth = 800; // Use same base width as multi-page
        return (baseWidth * userZoom) / 100;
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
                    className={`${
                      isSinglePage
                        ? userZoom > 100
                          ? "py-4 min-h-full overflow-x-auto overflow-y-hidden flex justify-start" // Single page zoomed in: horizontal scroll from left
                          : "py-4 min-h-full flex justify-start items-start" // Single page normal: start from left
                        : userZoom > 100
                        ? "w-full" // Multi-page zoomed: full width
                        : "flex justify-center" // Multi-page normal: center it
                    }`}
                    style={{
                      // Simplified width handling
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

export default PDFPreview;
