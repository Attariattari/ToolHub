import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, X, ChevronUp, Edit, Type } from "lucide-react";
import { IoMdLock } from "react-icons/io";

// Resizable Text Element Component
const ResizableTextElement = ({
  textElement,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onTextChange,
  pageScale = 1,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [currentResizeHandle, setCurrentResizeHandle] = useState(null);
  const elementRef = useRef(null);

  const handleMouseDown = (e) => {
    // CRITICAL: Stop propagation to prevent page click
    e.stopPropagation();
    e.preventDefault();

    // Select this element
    onSelect(textElement.id);

    if (e.target.classList.contains("resize-handle")) {
      setIsResizing(true);
      setCurrentResizeHandle(e.target.dataset.direction);

      const rect = elementRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: textElement.width,
        height: textElement.height,
        elementX: rect.left,
        elementY: rect.top,
      });
    } else if (
      !e.target.classList.contains("delete-btn") &&
      !e.target.tagName.toLowerCase().includes("textarea")
    ) {
      // Start dragging
      setIsDragging(true);
      const rect = elementRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const pageElement = elementRef.current?.closest("[data-page-number]");
        if (!pageElement) return;

        // Get the actual PDF page element, not just the container
        const pdfPageElement = pageElement.querySelector(".react-pdf__Page");
        if (!pdfPageElement) return;

        const pageRect = pdfPageElement.getBoundingClientRect();
        const newX = Math.max(
          0,
          Math.min(
            pageRect.width - textElement.width,
            e.clientX - pageRect.left - dragStart.x
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            pageRect.height - textElement.height,
            e.clientY - pageRect.top - dragStart.y
          )
        );

        onUpdate({ x: newX, y: newY });
      } else if (isResizing && currentResizeHandle) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = textElement.x;
        let newY = textElement.y;

        // Minimum sizes
        const minWidth = 30;
        const minHeight = 20;

        switch (currentResizeHandle) {
          case "se": // Southeast
            newWidth = Math.max(minWidth, resizeStart.width + deltaX);
            newHeight = Math.max(minHeight, resizeStart.height + deltaY);
            break;
          case "sw": // Southwest
            newWidth = Math.max(minWidth, resizeStart.width - deltaX);
            newHeight = Math.max(minHeight, resizeStart.height + deltaY);
            newX = textElement.x + (resizeStart.width - newWidth);
            break;
          case "ne": // Northeast
            newWidth = Math.max(minWidth, resizeStart.width + deltaX);
            newHeight = Math.max(minHeight, resizeStart.height - deltaY);
            newY = textElement.y + (resizeStart.height - newHeight);
            break;
          case "nw": // Northwest
            newWidth = Math.max(minWidth, resizeStart.width - deltaX);
            newHeight = Math.max(minHeight, resizeStart.height - deltaY);
            newX = textElement.x + (resizeStart.width - newWidth);
            newY = textElement.y + (resizeStart.height - newHeight);
            break;
          case "n": // North
            newHeight = Math.max(minHeight, resizeStart.height - deltaY);
            newY = textElement.y + (resizeStart.height - newHeight);
            break;
          case "s": // South
            newHeight = Math.max(minHeight, resizeStart.height + deltaY);
            break;
          case "e": // East
            newWidth = Math.max(minWidth, resizeStart.width + deltaX);
            break;
          case "w": // West
            newWidth = Math.max(minWidth, resizeStart.width - deltaX);
            newX = textElement.x + (resizeStart.width - newWidth);
            break;
        }

        // Get PDF page boundaries for proper constraint
        const pageElement = elementRef.current?.closest("[data-page-number]");
        const pdfPageElement = pageElement?.querySelector(".react-pdf__Page");

        if (pdfPageElement) {
          const pageRect = pdfPageElement.getBoundingClientRect();
          const containerRect = pageElement.getBoundingClientRect();

          // Calculate relative boundaries
          const maxX = pageRect.width - newWidth;
          const maxY = pageRect.height - newHeight;

          // Apply boundary constraints
          newX = Math.max(0, Math.min(maxX, newX));
          newY = Math.max(0, Math.min(maxY, newY));
        } else {
          // Fallback boundary checks
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
        }

        onUpdate({ width: newWidth, height: newHeight, x: newX, y: newY });
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      currentResizeHandle,
      textElement,
      onUpdate,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setCurrentResizeHandle(null);
  }, []);

  // Add performance optimization for mouse move events
  const throttledMouseMove = useCallback(
    (e) => {
      // Use requestAnimationFrame for smooth movement
      requestAnimationFrame(() => {
        handleMouseMove(e);
      });
    },
    [handleMouseMove]
  );

  useEffect(() => {
    if (isDragging || isResizing) {
      // Use throttled mouse move for better performance
      document.addEventListener("mousemove", throttledMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", throttledMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, throttledMouseMove, handleMouseUp]);

  const getCursorStyle = (direction) => {
    const cursorMap = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
      n: "n-resize",
      s: "s-resize",
      e: "e-resize",
      w: "w-resize",
    };
    return cursorMap[direction] || "default";
  };

  const handleInputKeyDown = (e) => {
    // Stop propagation for keyboard events too
    e.stopPropagation();

    if (e.key === "Enter") {
      e.preventDefault();
      onUpdate({ isEditing: false });
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onUpdate({ isEditing: false });
    }
  };

  const handleTextareaChange = (e) => {
    e.stopPropagation();
    onTextChange(e.target.value);
  };

  const handleTextareaBlur = (e) => {
    e.stopPropagation();
    onUpdate({ isEditing: false });
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onUpdate({ isEditing: true });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  return (
    <div
      ref={elementRef}
      className={`absolute text-element select-none ${
        isSelected ? "ring-2 ring-blue-400 ring-opacity-60" : ""
      } ${
        isDragging
          ? "cursor-grabbing"
          : isSelected && !textElement.isEditing
          ? "cursor-grab"
          : "cursor-default"
      }`}
      style={{
        left: textElement.x,
        top: textElement.y,
        width: textElement.width,
        height: textElement.height,
        fontSize: textElement.fontSize * pageScale,
        fontFamily: textElement.fontFamily,
        color: textElement.color,
        backgroundColor:
          textElement.backgroundColor !== "transparent"
            ? textElement.backgroundColor
            : "rgba(255, 255, 255, 0.9)",
        fontWeight: textElement.isBold ? "bold" : "normal",
        fontStyle: textElement.isItalic ? "italic" : "normal",
        textDecoration: textElement.isUnderline ? "underline" : "none",
        textAlign: textElement.alignment,
        opacity: textElement.opacity || 1,
        padding: "2px 4px",
        borderRadius: "3px",
        zIndex: isSelected ? 1000 : 100,
        minWidth: "30px",
        minHeight: "20px",
        boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
        border: textElement.isEditing ? "1px solid #3b82f6" : "none",
        pointerEvents: "auto",
        transition: isDragging || isResizing ? "none" : "box-shadow 0.1s ease", // Remove transition delays during interaction
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Text content */}
      {textElement.isEditing ? (
        <textarea
          value={textElement.text}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onKeyDown={handleInputKeyDown}
          onClick={(e) => e.stopPropagation()} // Prevent click propagation
          className="w-full h-full bg-transparent border-none outline-none resize-none"
          style={{
            fontSize: "inherit",
            fontFamily: "inherit",
            color: "inherit",
            fontWeight: "inherit",
            fontStyle: "inherit",
            textDecoration: "inherit",
            textAlign: "inherit",
            padding: 0,
            margin: 0,
            lineHeight: "1.2",
          }}
          autoFocus
          spellCheck={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center overflow-hidden"
          onDoubleClick={handleDoubleClick}
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            lineHeight: "1.2",
            whiteSpace: "pre-wrap",
            pointerEvents: "auto", // Ensure this div can receive events
          }}
        >
          {textElement.text}
        </div>
      )}

      {/* Controls - only show when selected */}
      {isSelected && (
        <>
          {/* Resize handles - only show when not editing */}
          {!textElement.isEditing && (
            <>
              {/* Corner handles */}
              {["nw", "ne", "sw", "se"].map((direction) => (
                <div
                  key={direction}
                  className="resize-handle absolute bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600"
                  style={{
                    width: "8px",
                    height: "8px",
                    cursor: getCursorStyle(direction),
                    top: direction.includes("n") ? "-4px" : undefined,
                    bottom: direction.includes("s") ? "-4px" : undefined,
                    left: direction.includes("w") ? "-4px" : undefined,
                    right: direction.includes("e") ? "-4px" : undefined,
                    pointerEvents: "auto",
                    transition: "none", // Remove transition for immediate response
                  }}
                  data-direction={direction}
                />
              ))}

              {/* Side handles */}
              {["n", "s", "e", "w"].map((direction) => (
                <div
                  key={direction}
                  className="resize-handle absolute bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600"
                  style={{
                    width: "8px",
                    height: "8px",
                    cursor: getCursorStyle(direction),
                    top:
                      direction === "n"
                        ? "-4px"
                        : direction === "s"
                        ? undefined
                        : "50%",
                    bottom: direction === "s" ? "-4px" : undefined,
                    left:
                      direction === "w"
                        ? "-4px"
                        : direction === "e"
                        ? undefined
                        : "50%",
                    right: direction === "e" ? "-4px" : undefined,
                    transform: ["n", "s"].includes(direction)
                      ? "translateX(-50%)"
                      : ["e", "w"].includes(direction)
                      ? "translateY(-50%)"
                      : undefined,
                    pointerEvents: "auto",
                    transition: "none", // Remove transition for immediate response
                  }}
                  data-direction={direction}
                />
              ))}
            </>
          )}

          {/* Delete button - always show when selected */}
          <button
            className="delete-btn absolute bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
            style={{
              width: "20px",
              height: "20px",
              top: "-10px",
              right: "-10px",
              fontSize: "12px",
              fontWeight: "bold",
              lineHeight: 1,
              pointerEvents: "auto",
              transition: "none", // Remove transition for immediate response
            }}
            onClick={handleDeleteClick}
            title="Delete text"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
};

const Allpagespreview = memo(
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
    showAllPages = true,
    showSinglePage = false,
    showSpread = false,
    layoutType = "continuous",
    style = {},
    onPageChange,
    currentPage = 1,
    // Text editing props
    textEditingState = null,
    onTextAdd = null,
    onTextUpdate = null,
    onTextDelete = null,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const [numPages, setNumPages] = useState(null);
    const [pageLoadingStates, setPageLoadingStates] = useState({});
    const [visiblePages, setVisiblePages] = useState(new Set());
    const [textElements, setTextElements] = useState({});
    const [selectedTextId, setSelectedTextId] = useState(null);

    const elementRef = useRef(null);
    const pageRefs = useRef({});
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const lastUserClickedPageRef = useRef(null);

    // Calculate PDF width based on layout
    const actualPDFWidth = useMemo(() => {
      const baseWidth = 800;

      if (layoutType === "magazine") {
        return (baseWidth * 0.85 * userZoom) / 100;
      } else if (layoutType === "spread") {
        return (baseWidth * 0.48 * userZoom) / 100;
      } else {
        return userZoom > 100
          ? (baseWidth * userZoom) / 100
          : (containerWidth * userZoom) / 100;
      }
    }, [containerWidth, userZoom, layoutType]);

    const pageScale = useMemo(() => {
      return actualPDFWidth / 800; // Base scale factor
    }, [actualPDFWidth]);

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

    // PDF.js options
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

    // Intersection observer for component visibility
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

    // Handle currentPage changes from parent (thumbnail clicks)
    useEffect(() => {
      if (
        (layoutType === "continuous" || layoutType === "spread") &&
        documentLoaded &&
        currentPage &&
        pageRefs.current[currentPage]
      ) {
        const isUserClick = lastUserClickedPageRef.current === currentPage;

        if (isUserClick) {
          isUserScrollingRef.current = true;
          lastUserClickedPageRef.current = null;

          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          let scrollContainer = elementRef.current;
          while (
            scrollContainer &&
            !scrollContainer.classList.contains("overflow-auto")
          ) {
            scrollContainer = scrollContainer.parentElement;
          }

          if (scrollContainer && pageRefs.current[currentPage]) {
            pageRefs.current[currentPage].scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }

          scrollTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
          }, 1000);
        }
      }
    }, [currentPage, documentLoaded, layoutType]);

    // Page visibility tracking for current page detection
    useEffect(() => {
      if (
        (layoutType !== "continuous" && layoutType !== "spread") ||
        !documentLoaded ||
        !onPageChange
      )
        return;

      const pageObserver = new IntersectionObserver(
        (entries) => {
          if (isUserScrollingRef.current) {
            return;
          }

          const currentlyVisible = new Set();

          entries.forEach((entry) => {
            const pageNum = parseInt(
              entry.target.getAttribute("data-page-number")
            );
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              currentlyVisible.add(pageNum);
            }
          });

          if (currentlyVisible.size > 0) {
            setVisiblePages(currentlyVisible);
            const topVisiblePage = Math.min(...Array.from(currentlyVisible));
            if (topVisiblePage !== currentPage) {
              onPageChange(topVisiblePage);
            }
          }
        },
        {
          threshold: [0.1, 0.5, 0.9],
          rootMargin: "-10% 0px -10% 0px",
        }
      );

      Object.values(pageRefs.current).forEach((pageElement) => {
        if (pageElement) {
          pageObserver.observe(pageElement);
        }
      });

      return () => {
        pageObserver.disconnect();
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, [documentLoaded, layoutType, onPageChange, currentPage]);

    // PDF load handlers
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
        setNumPages(pdf.numPages);
        if (onLoadSuccess) {
          onLoadSuccess(pdf, file.id);
        }
      },
      [file.id, onLoadSuccess]
    );

    const handlePageLoadSuccess = useCallback((page) => {
      setPageLoadingStates((prev) => ({
        ...prev,
        [page.pageNumber]: false,
      }));
    }, []);

    const handlePageLoadError = useCallback((error, pageNumber) => {
      console.error(`Page ${pageNumber} load error:`, error);
      setPageLoadingStates((prev) => ({
        ...prev,
        [pageNumber]: false,
      }));
    }, []);

    // Text editing functions
    const handlePageClick = useCallback(
      (e, pageNumber) => {
        // IMPORTANT: Check if click came from text element or its children
        if (e.target.closest(".text-element")) {
          return; // Don't create new text if clicking on existing text
        }

        // Only add text if text tool is active
        if (!textEditingState?.showTextToolbar) {
          // If text tool is not active, just deselect any selected text
          setSelectedTextId(null);
          return;
        }

        const pageElement = e.currentTarget.querySelector(".react-pdf__Page");
        if (!pageElement) return;

        const rect = pageElement.getBoundingClientRect();
        const x = e.clientX - rect.left - 60;
        const y = e.clientY - rect.top - 15;

        const textId = `text_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newTextElement = {
          id: textId,
          pageNumber,
          x: Math.max(0, x),
          y: Math.max(0, y),
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

        setTextElements((prev) => ({
          ...prev,
          [pageNumber]: [...(prev[pageNumber] || []), newTextElement],
        }));

        setSelectedTextId(textId);

        if (onTextAdd) {
          onTextAdd(newTextElement);
        }
      },
      [textEditingState, onTextAdd]
    );

    const handleTextChange = useCallback(
      (textId, pageNumber, newText) => {
        setTextElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.map((text) =>
              text.id === textId ? { ...text, text: newText } : text
            ) || [],
        }));

        // Call parent callback
        if (onTextUpdate) {
          const updatedText = textElements[pageNumber]?.find(
            (t) => t.id === textId
          );
          if (updatedText) {
            onTextUpdate({ ...updatedText, text: newText });
          }
        }
      },
      [textElements, onTextUpdate]
    );

    const handleTextStyleUpdate = useCallback(
      (textId, pageNumber, styleUpdates) => {
        setTextElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.map((text) =>
              text.id === textId ? { ...text, ...styleUpdates } : text
            ) || [],
        }));

        // Call parent callback
        if (onTextUpdate) {
          const updatedText = textElements[pageNumber]?.find(
            (t) => t.id === textId
          );
          if (updatedText) {
            onTextUpdate({ ...updatedText, ...styleUpdates });
          }
        }
      },
      [textElements, onTextUpdate]
    );

    const handleTextDelete = useCallback(
      (textId, pageNumber) => {
        setTextElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((text) => text.id !== textId) || [],
        }));

        if (selectedTextId === textId) {
          setSelectedTextId(null);
        }

        // Call parent callback
        if (onTextDelete) {
          onTextDelete(textId, pageNumber);
        }
      },
      [selectedTextId, onTextDelete]
    );

    // Update text styles when parent state changes
    useEffect(() => {
      if (selectedTextId && textEditingState) {
        const pageNumber = Object.keys(textElements).find((page) =>
          textElements[page]?.some((text) => text.id === selectedTextId)
        );

        if (pageNumber) {
          handleTextStyleUpdate(selectedTextId, parseInt(pageNumber), {
            fontSize: textEditingState.selectedSize,
            fontFamily: textEditingState.selectedFont,
            color: textEditingState.selectedColor,
            backgroundColor: textEditingState.selectedBgColor,
            isBold: textEditingState.isBold,
            isItalic: textEditingState.isItalic,
            isUnderline: textEditingState.isUnderline,
            alignment: textEditingState.selectedAlignment,
            opacity: textEditingState.opacity,
          });
        }
      }
    }, [textEditingState, selectedTextId, textElements, handleTextStyleUpdate]);

    // Handle delete from parent toolbar
    useEffect(() => {
      if (textEditingState?.deleteRequested && selectedTextId) {
        const pageNumber = Object.keys(textElements).find((page) =>
          textElements[page]?.some((text) => text.id === selectedTextId)
        );

        if (pageNumber) {
          handleTextDelete(selectedTextId, parseInt(pageNumber));
        }
      }
    }, [
      textEditingState?.deleteRequested,
      selectedTextId,
      textElements,
      handleTextDelete,
    ]);

    useEffect(() => {
      const handleClickOutside = (e) => {
        // Don't do anything if clicking on text elements or their controls
        if (e.target.closest(".text-element")) return;

        // If text tool is active, only deselect when clicking outside PDF pages
        if (textEditingState?.showTextToolbar) {
          if (!e.target.closest("[data-page-number]")) {
            setSelectedTextId(null);
          }
          return;
        }

        // Normal behavior when text tool is not active
        if (!e.target.closest("[data-page-number]")) {
          setSelectedTextId(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside, true); // Use capture
      return () =>
        document.removeEventListener("mousedown", handleClickOutside, true);
    }, [textEditingState?.showTextToolbar]);
    const smoothTextEditingStyles = `
  .text-element {
    transition: none !important;
  }
  
  .text-element:not(.dragging):not(.resizing) {
    transition: box-shadow 0.1s ease !important;
  }
  
  .text-element.dragging,
  .text-element.resizing {
    transition: none !important;
    transform: translateZ(0); /* Enable GPU acceleration */
    will-change: transform;
  }
  
  .resize-handle {
    transition: none !important;
    transform: translateZ(0);
  }
  
  .delete-btn {
    transition: none !important;
  }
  
  /* Smooth text overlay container */
  .text-overlay {
    transform: translateZ(0);
    will-change: contents;
  }
`;
    // Text overlay component
    const renderTextOverlay = useCallback(
      (pageNumber) => {
        const pageTexts = textElements[pageNumber] || [];
        if (pageTexts.length === 0) return null;

        return (
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: "none", // Container doesn't block events
            }}
          >
            {pageTexts.map((textElement) => (
              <ResizableTextElement
                key={textElement.id}
                textElement={textElement}
                isSelected={selectedTextId === textElement.id}
                onSelect={setSelectedTextId}
                onUpdate={(updates) =>
                  handleTextStyleUpdate(textElement.id, pageNumber, updates)
                }
                onDelete={() => handleTextDelete(textElement.id, pageNumber)}
                onTextChange={(newText) =>
                  handleTextChange(textElement.id, pageNumber, newText)
                }
                pageScale={pageScale}
              />
            ))}
          </div>
        );
      },
      [
        textElements,
        selectedTextId,
        pageScale,
        handleTextStyleUpdate,
        handleTextDelete,
        handleTextChange,
      ]
    );

    // Function to render pages based on layout type
    const renderPages = () => {
      if (!documentLoaded || !numPages) return null;

      if (layoutType === "magazine") {
        const visiblePageCount = 3;
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(numPages, startPage + visiblePageCount - 1);
        const pagesToShow = [];

        for (let i = startPage; i <= endPage; i++) {
          pagesToShow.push(i);
        }

        return (
          <div className="flex justify-center items-start">
            <div className="flex gap-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-2 mb-4">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange && onPageChange(pageNum)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          pageNum === currentPage
                            ? "bg-blue-600 w-6"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    )
                  )}
                </div>

                <div className="relative" data-page-number={currentPage}>
                  <div
                    className="transition-all duration-300 hover:shadow-2xl relative cursor-pointer"
                    style={{ transformOrigin: "center center" }}
                    onClick={(e) => handlePageClick(e, currentPage)}
                  >
                    <Page
                      pageNumber={currentPage}
                      width={actualPDFWidth * 1.3}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-xl border-2 border-gray-200 rounded-lg transition-all duration-300 ease-in-out"
                      loading={
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center rounded-lg">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            <div className="text-blue-700 font-medium">
                              Loading page {currentPage}...
                            </div>
                          </div>
                        </div>
                      }
                      onLoadError={(error) => {
                        console.error("Page Load Error:", error);
                        setHasError(true);
                      }}
                    />
                    {renderTextOverlay(currentPage)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (layoutType === "spread") {
        const pageGroups = [];
        for (let i = 1; i <= numPages; i += 2) {
          pageGroups.push([i, i + 1 <= numPages ? i + 1 : null]);
        }

        return (
          <div className="flex justify-center items-start">
            <div className="space-y-8">
              {pageGroups.map(([leftPage, rightPage], groupIndex) => (
                <div
                  key={groupIndex}
                  className="flex justify-center items-start gap-4"
                  data-page-number={leftPage}
                  ref={(el) => {
                    if (el) {
                      pageRefs.current[leftPage] = el;
                      if (rightPage) {
                        pageRefs.current[rightPage] = el;
                      }
                    }
                  }}
                >
                  {/* Left page */}
                  <div className="flex-shrink-0" data-page-number={leftPage}>
                    <div
                      className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative cursor-pointer ${
                        currentPage === leftPage
                          ? "ring-2 ring-red-600 ring-offset-2"
                          : ""
                      }`}
                      style={{ transformOrigin: "top left" }}
                      onClick={(e) => handlePageClick(e, leftPage)}
                    >
                      <Page
                        pageNumber={leftPage}
                        width={actualPDFWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={handlePageLoadSuccess}
                        onLoadError={(error) =>
                          handlePageLoadError(error, leftPage)
                        }
                        className="shadow-lg border border-red-600 transition-all duration-300 ease-in-out hover:border-red-100"
                        loading={
                          <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                            <div className="w-4 h-4 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-red-600">
                              Loading page {leftPage}...
                            </span>
                          </div>
                        }
                      />
                      {renderTextOverlay(leftPage)}
                    </div>
                  </div>

                  {/* Right page (if exists) */}
                  {rightPage && (
                    <div className="flex-shrink-0" data-page-number={rightPage}>
                      <div
                        className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative cursor-pointer ${
                          currentPage === rightPage
                            ? "ring-2 ring-red-600 ring-offset-2"
                            : ""
                        }`}
                        style={{ transformOrigin: "top left" }}
                        onClick={(e) => handlePageClick(e, rightPage)}
                      >
                        <Page
                          pageNumber={rightPage}
                          width={actualPDFWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={handlePageLoadSuccess}
                          onLoadError={(error) =>
                            handlePageLoadError(error, rightPage)
                          }
                          className="shadow-lg border border-red-600 transition-all duration-300 ease-in-out hover:border-red-100"
                          loading={
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                              <div className="w-4 h-4 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                              <span className="ml-2 text-sm text-red-600">
                                Loading page {rightPage}...
                              </span>
                            </div>
                          }
                        />
                        {renderTextOverlay(rightPage)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      } else {
        // Continuous layout (default)
        return (
          <div className="flex justify-center items-start">
            <div className="space-y-8">
              {Array.from({ length: numPages }, (_, index) => {
                const currentPageNumber = index + 1;
                const isPageLoading =
                  pageLoadingStates[currentPageNumber] !== false;
                const isCurrentPage = currentPageNumber === currentPage;

                return (
                  <div
                    key={currentPageNumber}
                    className="relative"
                    data-page-number={currentPageNumber}
                    ref={(el) => {
                      if (el) {
                        pageRefs.current[currentPageNumber] = el;
                      }
                    }}
                  >
                    {/* Page loading indicator */}
                    {isPageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded z-10">
                        <div className="w-6 h-6 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {/* PDF Page */}
                    <div className="w-fit">
                      <div
                        className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative cursor-pointer ${
                          isCurrentPage
                            ? "ring-2 ring-red-600 ring-offset-2"
                            : ""
                        }`}
                        style={{ transformOrigin: "top left" }}
                        onClick={(e) => handlePageClick(e, currentPageNumber)}
                      >
                        <Page
                          pageNumber={currentPageNumber}
                          width={actualPDFWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={handlePageLoadSuccess}
                          onLoadError={(error) =>
                            handlePageLoadError(error, currentPageNumber)
                          }
                          className="shadow-lg border border-red-600 transition-all duration-300 ease-in-out hover:border-red-100"
                          loading={
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                              <div className="w-4 h-4 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                              <span className="ml-2 text-sm text-red-600">
                                Loading page {currentPageNumber}...
                              </span>
                            </div>
                          }
                        />
                        {renderTextOverlay(currentPageNumber)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    };

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
          <div className="w-full h-full bg-white overflow-auto custom-scrollbar">
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
                {documentLoaded && <div className="p-4">{renderPages()}</div>}
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

    // Expose method to handle thumbnail clicks from parent
    useEffect(() => {
      // Store a reference to mark when thumbnail was clicked
      window.markThumbnailClick = (pageNum) => {
        lastUserClickedPageRef.current = pageNum;
      };
    }, []);

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

          {/* Text editing indicator when text tool is active */}
          {textEditingState?.showTextToolbar && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-2 z-30 shadow-lg">
              <Type className="w-3 h-3" />
              <span>Click to add text</span>
            </div>
          )}

          {/* Selected text info */}
          {selectedTextId && textEditingState?.showTextToolbar && (
            <div className="absolute bottom-2 left-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Text selected - Use toolbar to edit
              </div>
            </div>
          )}
        </div>

        {/* Custom styles for resize cursors */}
        <style jsx>{`
          .cursor-nw-resize {
            cursor: nw-resize;
          }
          .cursor-ne-resize {
            cursor: ne-resize;
          }
          .cursor-sw-resize {
            cursor: sw-resize;
          }
          .cursor-se-resize {
            cursor: se-resize;
          }
          .cursor-n-resize {
            cursor: n-resize;
          }
          .cursor-s-resize {
            cursor: s-resize;
          }
          .cursor-e-resize {
            cursor: e-resize;
          }
          .cursor-w-resize {
            cursor: w-resize;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }

          /* Prevent text selection while dragging */
          .text-element {
            pointer-events: auto;
          }

          .text-element * {
            pointer-events: auto;
          }

          /* Smooth transitions for text elements */
          .text-element:not(.dragging) {
            transition: box-shadow 0.2s ease, transform 0.1s ease;
          }

          .text-element:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `}</style>
      </div>
    );
  }
);

Allpagespreview.displayName = "Allpagespreview";

export default Allpagespreview;
