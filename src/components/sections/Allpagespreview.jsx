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

// Updated ResizableTextElement with proper font size handling and textarea focus
const ResizableTextElement = ({
  textElement,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onTextChange,
  zoom = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0,
  });
  const [currentResizeHandle, setCurrentResizeHandle] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const elementRef = useRef(null);
  const textareaRef = useRef(null);
  const measureRef = useRef(null); // For measuring text dimensions
  const clickTimeoutRef = useRef(null);

  // Calculate scaled dimensions from base coordinates
  const scaledWidth = (textElement.width * zoom) / 100;
  const scaledHeight = (textElement.height * zoom) / 100;
  const scaledX = (textElement.x * zoom) / 100;
  const scaledY = (textElement.y * zoom) / 100;

  // Calculate proper font size
  const calculatedFontSize = useMemo(() => {
    return Math.max(8, textElement.fontSize);
  }, [textElement.fontSize]);

  // Function to measure text dimensions
  const measureTextDimensions = useCallback((text, width) => {
    if (!measureRef.current) return { width: 0, height: 0 };

    measureRef.current.style.width = width + "px";
    measureRef.current.textContent = text || "A"; // Use 'A' as fallback for empty text

    return {
      width: measureRef.current.scrollWidth,
      height: measureRef.current.scrollHeight,
    };
  }, []);

  // Auto-resize function
  const autoResizeElement = useCallback(
    (text) => {
      if (!elementRef.current || textElement.isEditing) return;

      const currentWidth = textElement.width;
      const currentHeight = textElement.height;
      const minWidth = Math.max(80, calculatedFontSize * 4);
      const minHeight = Math.max(40, calculatedFontSize * 2);

      // Measure text with current width
      const measured = measureTextDimensions(text, (currentWidth * zoom) / 100);
      const measuredBaseHeight = (measured.height * 100) / zoom;

      let newHeight = Math.max(minHeight, measuredBaseHeight + 16); // Add padding
      let newWidth = currentWidth;

      // If text is overflowing horizontally, we might need to increase width
      const lines = (text || "").split("\n");
      const maxLineLength = Math.max(...lines.map((line) => line.length));

      // Rough estimation: if line is too long, expand width
      const charWidth = calculatedFontSize * 0.6; // Approximate character width
      const estimatedWidth = maxLineLength * charWidth;
      const maxWidthForPage =
        ((elementRef.current
          ?.closest("[data-page-number]")
          ?.querySelector(".react-pdf__Page")
          ?.getBoundingClientRect()?.width || 500) *
          100) /
        zoom;

      if (
        estimatedWidth > currentWidth &&
        newWidth < maxWidthForPage - textElement.x
      ) {
        newWidth = Math.min(
          maxWidthForPage - textElement.x,
          Math.max(currentWidth, estimatedWidth + 20)
        );
      }

      // Only update if dimensions actually changed
      if (
        Math.abs(newHeight - currentHeight) > 5 ||
        Math.abs(newWidth - currentWidth) > 5
      ) {
        onUpdate({
          width: newWidth,
          height: newHeight,
        });
      }
    },
    [textElement, calculatedFontSize, zoom, measureTextDimensions, onUpdate]
  );

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (textElement.isEditing && textareaRef.current) {
      const timeoutId = setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [textElement.isEditing]);

  // Function to dynamically adjust text layout based on element dimensions
  const adjustTextLayout = useCallback(() => {
    if (!elementRef.current || !measureRef.current || textElement.isEditing)
      return;

    const currentWidth = (textElement.width * zoom) / 100;
    const text = textElement.text || "";

    if (!text) return;

    // Set the measuring element to match current element width and styling
    measureRef.current.style.width = Math.max(60, currentWidth - 12) + "px"; // Subtract padding
    measureRef.current.style.fontSize = `${calculatedFontSize}px`;
    measureRef.current.style.fontFamily = textElement.fontFamily;
    measureRef.current.style.fontWeight = textElement.isBold
      ? "bold"
      : "normal";
    measureRef.current.style.fontStyle = textElement.isItalic
      ? "italic"
      : "normal";
    measureRef.current.textContent = text;

    // Force a reflow to get accurate measurements
    measureRef.current.offsetHeight;

    const measuredHeight = measureRef.current.scrollHeight;
    const baseHeight = (measuredHeight * 100) / zoom;
    const minHeight = Math.max(40, calculatedFontSize * 2);
    const newHeight = Math.max(minHeight, baseHeight + 16); // Add padding

    // Update height if there's a significant difference
    if (Math.abs(newHeight - textElement.height) > 8) {
      onUpdate({ height: newHeight });
    }
  }, [
    textElement.width,
    textElement.height,
    textElement.text,
    textElement.fontFamily,
    textElement.fontSize,
    textElement.isBold,
    textElement.isItalic,
    textElement.isEditing,
    zoom,
    calculatedFontSize,
    onUpdate,
  ]);

  // Auto-adjust layout when dimensions or text changes
  useEffect(() => {
    if (!textElement.isEditing && textElement.text) {
      const timeoutId = setTimeout(() => {
        adjustTextLayout();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [
    textElement.width,
    textElement.text,
    textElement.fontSize,
    textElement.fontFamily,
    textElement.isBold,
    textElement.isItalic,
    adjustTextLayout,
  ]);

  // Separate effect for immediate text changes
  useEffect(() => {
    if (!textElement.isEditing && textElement.text) {
      adjustTextLayout();
    }
  }, [textElement.text, adjustTextLayout]);

  // Function to get PDF page boundaries
  const getPageBoundaries = useCallback(() => {
    const pageElement = elementRef.current?.closest("[data-page-number]");
    if (!pageElement) return null;

    const pdfPageElement = pageElement.querySelector(".react-pdf__Page");
    if (!pdfPageElement) return null;

    const pageRect = pdfPageElement.getBoundingClientRect();
    return {
      width: pageRect.width,
      height: pageRect.height,
      element: pdfPageElement,
    };
  }, []);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Don't handle mouse down if we're in editing mode and clicking on textarea
    if (textElement.isEditing && e.target.tagName === "TEXTAREA") {
      return;
    }

    // If currently editing, exit edit mode first
    if (textElement.isEditing) {
      onUpdate({ isEditing: false });
      return;
    }

    // Handle resize handles
    if (e.target.classList.contains("resize-handle")) {
      setIsResizing(true);
      setCurrentResizeHandle(e.target.dataset.direction);

      const rect = elementRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: textElement.width,
        height: textElement.height,
        elementX: textElement.x,
        elementY: textElement.y,
      });
      return;
    }

    // Handle delete button
    if (e.target.classList.contains("delete-btn")) {
      return; // Let the delete handler handle this
    }

    // Select this element if not selected
    if (!isSelected) {
      onSelect(textElement.id);
      return;
    }

    // Start dragging if already selected
    setIsDragging(true);
    const rect = elementRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const pageBounds = getPageBoundaries();
        if (!pageBounds) return;

        const pageRect = pageBounds.element.getBoundingClientRect();

        // Calculate new position in current zoom scale
        const newScaledX = Math.max(
          0,
          Math.min(
            pageBounds.width - scaledWidth,
            e.clientX - pageRect.left - dragStart.x
          )
        );
        const newScaledY = Math.max(
          0,
          Math.min(
            pageBounds.height - scaledHeight,
            e.clientY - pageRect.top - dragStart.y
          )
        );

        // Convert back to base coordinates (zoom-independent)
        const newX = (newScaledX * 100) / zoom;
        const newY = (newScaledY * 100) / zoom;

        onUpdate({ x: newX, y: newY });
      } else if (isResizing && currentResizeHandle) {
        const pageBounds = getPageBoundaries();
        if (!pageBounds) return;

        // Calculate delta in screen coordinates
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // Convert delta to base coordinates (zoom-independent)
        const baseDeltaX = (deltaX * 100) / zoom;
        const baseDeltaY = (deltaY * 100) / zoom;

        // Work with base coordinates for consistency
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        // Calculate minimum sizes in base coordinates
        const minWidth = Math.max(80, calculatedFontSize * 4);
        const minHeight = Math.max(40, calculatedFontSize * 2);

        // Apply resize based on handle direction using base coordinates
        switch (currentResizeHandle) {
          case "se": // Southeast - increase width and height
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            break;
          case "sw": // Southwest - decrease width, increase height, move left
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
          case "ne": // Northeast - increase width, decrease height, move up
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "nw": // Northwest - decrease both, move both
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "n": // North - decrease height, move up
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "s": // South - increase height
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            break;
          case "e": // East - increase width
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            break;
          case "w": // West - decrease width, move left
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
        }

        // Apply boundary constraints in base coordinates
        const pageBaseWidth = (pageBounds.width * 100) / zoom;
        const pageBaseHeight = (pageBounds.height * 100) / zoom;

        // Ensure element stays within page boundaries
        if (newX < 0) {
          newWidth = newWidth + newX;
          newX = 0;
        }

        if (newY < 0) {
          newHeight = newHeight + newY;
          newY = 0;
        }

        // Limit to page boundaries
        if (newX + newWidth > pageBaseWidth) {
          newWidth = pageBaseWidth - newX;
        }

        if (newY + newHeight > pageBaseHeight) {
          newHeight = pageBaseHeight - newY;
        }

        // Ensure minimum dimensions are maintained
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        // Final position adjustment to stay within bounds
        newX = Math.max(0, Math.min(pageBaseWidth - newWidth, newX));
        newY = Math.max(0, Math.min(pageBaseHeight - newHeight, newY));

        // Update with base coordinates and trigger immediate layout adjustment
        const newUpdate = {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        };

        onUpdate(newUpdate);
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      currentResizeHandle,
      onUpdate,
      getPageBoundaries,
      scaledWidth,
      scaledHeight,
      zoom,
      calculatedFontSize,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setCurrentResizeHandle(null);

    // Adjust text layout after resizing is complete
    if (isResizing) {
      setTimeout(() => {
        adjustTextLayout();
      }, 100);
    }
  }, [isResizing, adjustTextLayout]);

  // Throttled mouse move for better performance
  const throttledMouseMove = useCallback(
    (e) => {
      requestAnimationFrame(() => {
        handleMouseMove(e);
      });
    },
    [handleMouseMove]
  );

  useEffect(() => {
    if (isDragging || isResizing) {
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
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onUpdate({ isEditing: false });
    } else if (e.key === "Enter" && e.shiftKey) {
      // Allow new line and trigger resize
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          const scrollHeight = textareaRef.current.scrollHeight;
          textareaRef.current.style.height = scrollHeight + "px";

          const newElementHeight = Math.max(
            40,
            (scrollHeight * 100) / zoom + 16
          );
          if (Math.abs(newElementHeight - textElement.height) > 5) {
            onUpdate({ height: newElementHeight });
          }
        }
      }, 10);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onUpdate({ isEditing: false });
    }
  };

  const handleTextareaChange = (e) => {
    e.stopPropagation();
    const newText = e.target.value;
    onTextChange(newText);

    // Auto-resize textarea during typing to fit content
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";

      // Update element height based on textarea content
      const newElementHeight = Math.max(40, (scrollHeight * 100) / zoom + 16);
      if (Math.abs(newElementHeight - textElement.height) > 5) {
        onUpdate({ height: newElementHeight });
      }
    }
  };

  const handleTextareaBlur = (e) => {
    e.stopPropagation();
    if (!isDragging && !isResizing) {
      onUpdate({ isEditing: false });
      // Adjust layout after editing ends
      setTimeout(() => {
        adjustTextLayout();
      }, 100);
    }
  };

  const handleTextareaClick = (e) => {
    e.stopPropagation();
  };

  // Handle single and double click logic
  const handleClick = (e) => {
    e.stopPropagation();

    // If not selected, select it (first click)
    if (!isSelected) {
      onSelect(textElement.id);
      setClickCount(1);
      return;
    }

    // If already selected, handle double-click logic
    if (isSelected) {
      setClickCount((prev) => prev + 1);

      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // Set timeout for single click action
      clickTimeoutRef.current = setTimeout(() => {
        if (clickCount + 1 === 2 && !textElement.isEditing) {
          // Double click - enter edit mode
          onUpdate({ isEditing: true });
        }
        setClickCount(0);
      }, 250); // 250ms timeout for double-click detection
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Hidden element for measuring text dimensions */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          fontSize: `${calculatedFontSize}px`,
          fontFamily: textElement.fontFamily,
          fontWeight: textElement.isBold ? "bold" : "normal",
          fontStyle: textElement.isItalic ? "italic" : "normal",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          padding: "4px 6px",
          boxSizing: "border-box",
        }}
      />

      <div
        ref={elementRef}
        className={`absolute text-element select-none ${
          isSelected ? "ring-2 ring-red-400 ring-opacity-60" : ""
        } ${
          isDragging
            ? "cursor-grabbing"
            : isSelected && !textElement.isEditing
            ? "cursor-grab"
            : "cursor-default"
        }`}
        style={{
          left: scaledX,
          top: scaledY,
          width: scaledWidth,
          height: scaledHeight,
          fontSize: `${calculatedFontSize}px`,
          fontFamily: textElement.fontFamily,
          color: textElement.color,
          backgroundColor:
            textElement.backgroundColor !== "transparent"
              ? textElement.backgroundColor
              : "transparent",
          fontWeight: textElement.isBold ? "bold" : "normal",
          fontStyle: textElement.isItalic ? "italic" : "normal",
          textDecoration: textElement.isUnderline ? "underline" : "none",
          textAlign: textElement.alignment,
          opacity: textElement.opacity || 1,
          padding: "4px 6px",
          borderRadius: "4px",
          zIndex: isSelected ? 20 : 10,
          minWidth: Math.max(60, calculatedFontSize * 3) + "px",
          minHeight: Math.max(30, calculatedFontSize * 1.8) + "px",
          boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
          border: textElement.isEditing
            ? "2px solid #3b82f6"
            : isSelected
            ? "1px solid #3b82f6"
            : "1px solid rgba(0,0,0,0.1)",
          pointerEvents: "auto",
          transition: isDragging || isResizing ? "none" : "all 0.2s ease",
          transform: "translateZ(0)",
          willChange: isDragging || isResizing ? "transform" : "auto",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Text content */}
        {textElement.isEditing ? (
          <textarea
            ref={textareaRef}
            value={textElement.text}
            onChange={handleTextareaChange}
            onBlur={handleTextareaBlur}
            onKeyDown={handleInputKeyDown}
            onClick={handleTextareaClick}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden"
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
              lineHeight: "1.4",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              boxSizing: "border-box",
            }}
            placeholder="Enter text..."
            spellCheck={false}
            autoComplete="off"
          />
        ) : (
          <div
            className="w-full h-full flex items-start"
            style={{
              wordWrap: "break-word",
              overflowWrap: "break-word",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              pointerEvents: "auto",
              alignItems:
                textElement.alignment === "center"
                  ? "center"
                  : textElement.alignment === "right"
                  ? "flex-end"
                  : "flex-start",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                textAlign: textElement.alignment,
                wordWrap: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {textElement.text || "Click to edit"}
            </div>
          </div>
        )}

        {/* Controls - show on selection OR hover */}
        {(isSelected || isHovered) && (
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
                      width: "12px",
                      height: "12px",
                      cursor: getCursorStyle(direction),
                      top: direction.includes("n") ? "-6px" : undefined,
                      bottom: direction.includes("s") ? "-6px" : undefined,
                      left: direction.includes("w") ? "-6px" : undefined,
                      right: direction.includes("e") ? "-6px" : undefined,
                      pointerEvents: "auto",
                      transition: "none",
                      zIndex: 1001,
                      opacity: isSelected ? 1 : 0.8, // Slightly transparent on hover-only
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
                      width: "10px",
                      height: "10px",
                      cursor: getCursorStyle(direction),
                      top:
                        direction === "n"
                          ? "-5px"
                          : direction === "s"
                          ? undefined
                          : "50%",
                      bottom: direction === "s" ? "-5px" : undefined,
                      left:
                        direction === "w"
                          ? "-5px"
                          : direction === "e"
                          ? undefined
                          : "50%",
                      right: direction === "e" ? "-5px" : undefined,
                      transform: ["n", "s"].includes(direction)
                        ? "translateX(-50%)"
                        : ["e", "w"].includes(direction)
                        ? "translateY(-50%)"
                        : undefined,
                      pointerEvents: "auto",
                      transition: "none",
                      zIndex: 1001,
                      opacity: isSelected ? 1 : 0.8, // Slightly transparent on hover-only
                    }}
                    data-direction={direction}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};
const ResizableImageElement = ({
  imageElement,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  zoom = 100,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    elementX: 0,
    elementY: 0,
  });
  const [currentResizeHandle, setCurrentResizeHandle] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const elementRef = useRef(null);
  const imageRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  // Calculate scaled dimensions from base coordinates
  const scaledWidth = (imageElement.width * zoom) / 100;
  const scaledHeight = (imageElement.height * zoom) / 100;
  const scaledX = (imageElement.x * zoom) / 100;
  const scaledY = (imageElement.y * zoom) / 100;

  // Function to get PDF page boundaries
  const getPageBoundaries = useCallback(() => {
    const pageElement = elementRef.current?.closest("[data-page-number]");
    if (!pageElement) return null;

    const pdfPageElement = pageElement.querySelector(".react-pdf__Page");
    if (!pdfPageElement) return null;

    const pageRect = pdfPageElement.getBoundingClientRect();
    return {
      width: pageRect.width,
      height: pageRect.height,
      element: pdfPageElement,
    };
  }, []);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Handle resize handles
    if (e.target.classList.contains("resize-handle")) {
      setIsResizing(true);
      setCurrentResizeHandle(e.target.dataset.direction);

      const rect = elementRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: imageElement.width,
        height: imageElement.height,
        elementX: imageElement.x,
        elementY: imageElement.y,
      });
      return;
    }

    // Handle delete button
    if (e.target.classList.contains("delete-btn")) {
      return;
    }

    // Select this element if not selected
    if (!isSelected) {
      onSelect(imageElement.id);
      return;
    }

    // Start dragging if already selected
    setIsDragging(true);
    const rect = elementRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const pageBounds = getPageBoundaries();
        if (!pageBounds) return;

        const pageRect = pageBounds.element.getBoundingClientRect();

        // Calculate new position in current zoom scale
        const newScaledX = Math.max(
          0,
          Math.min(
            pageBounds.width - scaledWidth,
            e.clientX - pageRect.left - dragStart.x
          )
        );
        const newScaledY = Math.max(
          0,
          Math.min(
            pageBounds.height - scaledHeight,
            e.clientY - pageRect.top - dragStart.y
          )
        );

        // Convert back to base coordinates (zoom-independent)
        const newX = (newScaledX * 100) / zoom;
        const newY = (newScaledY * 100) / zoom;

        onUpdate({ x: newX, y: newY });
      } else if (isResizing && currentResizeHandle) {
        const pageBounds = getPageBoundaries();
        if (!pageBounds) return;

        // Calculate delta in screen coordinates
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        // Convert delta to base coordinates (zoom-independent)
        const baseDeltaX = (deltaX * 100) / zoom;
        const baseDeltaY = (deltaY * 100) / zoom;

        // Work with base coordinates for consistency
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        // Calculate minimum sizes in base coordinates
        const minWidth = 50;
        const minHeight = 50;

        // Maintain aspect ratio by default
        const aspectRatio = imageElement.width / imageElement.height;

        // Apply resize based on handle direction
        switch (currentResizeHandle) {
          case "se": // Southeast - increase width and height
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = newWidth / aspectRatio;
            break;
          case "sw": // Southwest - decrease width, increase height, move left
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = newWidth / aspectRatio;
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
          case "ne": // Northeast - increase width, decrease height, move up
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = newWidth / aspectRatio;
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "nw": // Northwest - decrease both, move both
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = newWidth / aspectRatio;
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "n": // North - maintain aspect ratio, resize from top
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newWidth = newHeight * aspectRatio;
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "s": // South - maintain aspect ratio, resize from bottom
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            newWidth = newHeight * aspectRatio;
            break;
          case "e": // East - maintain aspect ratio, resize from right
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = newWidth / aspectRatio;
            break;
          case "w": // West - maintain aspect ratio, resize from left
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = newWidth / aspectRatio;
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
        }

        // Apply boundary constraints in base coordinates
        const pageBaseWidth = (pageBounds.width * 100) / zoom;
        const pageBaseHeight = (pageBounds.height * 100) / zoom;

        // Ensure element stays within page boundaries
        if (newX < 0) {
          newWidth = newWidth + newX;
          newHeight = newWidth / aspectRatio;
          newX = 0;
        }

        if (newY < 0) {
          newHeight = newHeight + newY;
          newWidth = newHeight * aspectRatio;
          newY = 0;
        }

        // Limit to page boundaries
        if (newX + newWidth > pageBaseWidth) {
          newWidth = pageBaseWidth - newX;
          newHeight = newWidth / aspectRatio;
        }

        if (newY + newHeight > pageBaseHeight) {
          newHeight = pageBaseHeight - newY;
          newWidth = newHeight * aspectRatio;
        }

        // Ensure minimum dimensions are maintained
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        // Final position adjustment to stay within bounds
        newX = Math.max(0, Math.min(pageBaseWidth - newWidth, newX));
        newY = Math.max(0, Math.min(pageBaseHeight - newHeight, newY));

        // Update with base coordinates
        const newUpdate = {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        };

        onUpdate(newUpdate);
      }
    },
    [
      isDragging,
      isResizing,
      dragStart,
      resizeStart,
      currentResizeHandle,
      onUpdate,
      getPageBoundaries,
      scaledWidth,
      scaledHeight,
      zoom,
      imageElement.width,
      imageElement.height,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setCurrentResizeHandle(null);
  }, []);

  // Throttled mouse move for better performance
  const throttledMouseMove = useCallback(
    (e) => {
      requestAnimationFrame(() => {
        handleMouseMove(e);
      });
    },
    [handleMouseMove]
  );

  useEffect(() => {
    if (isDragging || isResizing) {
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

  // Handle single and double click logic
  const handleClick = (e) => {
    e.stopPropagation();

    // If not selected, select it (first click)
    if (!isSelected) {
      onSelect(imageElement.id);
      setClickCount(1);
      return;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error("Failed to load image:", imageElement.src);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Calculate transform styles for rotation and flipping
  const getTransformStyle = () => {
    let transform = "";

    if (imageElement.rotation) {
      transform += `rotate(${imageElement.rotation}deg) `;
    }

    if (imageElement.flipHorizontal || imageElement.flipVertical) {
      const scaleX = imageElement.flipHorizontal ? -1 : 1;
      const scaleY = imageElement.flipVertical ? -1 : 1;
      transform += `scale(${scaleX}, ${scaleY}) `;
    }

    return transform.trim();
  };

  return (
    <div
      ref={elementRef}
      className={`absolute image-element select-none ${
        isSelected ? "ring-2 ring-blue-400 ring-opacity-60" : ""
      } ${
        isDragging
          ? "cursor-grabbing"
          : isSelected
          ? "cursor-grab"
          : "cursor-default"
      }`}
      style={{
        left: scaledX,
        top: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        opacity: (imageElement.opacity || 100) / 100,
        zIndex: isSelected ? 20 : 10,
        minWidth: "30px",
        minHeight: "30px",
        boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
        border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(0,0,0,0.1)",
        pointerEvents: "auto",
        transition: isDragging || isResizing ? "none" : "all 0.2s ease",
        transform: "translateZ(0)",
        willChange: isDragging || isResizing ? "transform" : "auto",
        borderRadius: "4px",
        overflow: "hidden",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image content */}
      <img
        ref={imageRef}
        src={imageElement.src}
        alt="PDF Image"
        className="w-full h-full object-contain"
        style={{
          transform: getTransformStyle(),
          transformOrigin: "center center",
          transition: isDragging || isResizing ? "none" : "transform 0.2s ease",
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
      />

      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Controls - show on selection OR hover */}
      {(isSelected || isHovered) && (
        <>
          {/* Resize handles */}
          {["nw", "ne", "sw", "se"].map((direction) => (
            <div
              key={direction}
              className="resize-handle absolute bg-blue-500 border-2 border-white rounded-full shadow-md hover:bg-blue-600"
              style={{
                width: "12px",
                height: "12px",
                cursor: getCursorStyle(direction),
                top: direction.includes("n") ? "-6px" : undefined,
                bottom: direction.includes("s") ? "-6px" : undefined,
                left: direction.includes("w") ? "-6px" : undefined,
                right: direction.includes("e") ? "-6px" : undefined,
                pointerEvents: "auto",
                transition: "none",
                zIndex: 1001,
                opacity: isSelected ? 1 : 0.8,
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
                width: "10px",
                height: "10px",
                cursor: getCursorStyle(direction),
                top:
                  direction === "n"
                    ? "-5px"
                    : direction === "s"
                    ? undefined
                    : "50%",
                bottom: direction === "s" ? "-5px" : undefined,
                left:
                  direction === "w"
                    ? "-5px"
                    : direction === "e"
                    ? undefined
                    : "50%",
                right: direction === "e" ? "-5px" : undefined,
                transform: ["n", "s"].includes(direction)
                  ? "translateX(-50%)"
                  : ["e", "w"].includes(direction)
                  ? "translateY(-50%)"
                  : undefined,
                pointerEvents: "auto",
                transition: "none",
                zIndex: 1001,
                opacity: isSelected ? 1 : 0.8,
              }}
              data-direction={direction}
            />
          ))}
        </>
      )}
    </div>
  );
};
const Allpagespreview = memo(
  ({
    file,
    isLoading,
    onLoadSuccess,
    onLoadError,
    isHealthy,
    isPasswordProtected,
    userZoom = 100,
    layoutType = "continuous",
    style = {},
    onPageChange,
    currentPage = 1,
    // Text editing props
    textEditingState = null,
    onTextAdd = null,
    onTextUpdate = null,
    onTextDelete = null,
    clearAllTextElements = false,
    onClearAllComplete = null,
    deleteSpecificElement = null,
    onDeleteSpecificComplete = null,
    // Image editing props
    imageEditingState = null,
    onImageAdd = null,
    onImageUpdate = null,
    onImageDelete = null,
    clearAllImageElements = null,
    onClearAllImageComplete = null,
    deleteSpecificImageElement = null,
    onDeleteSpecificImageComplete = null,
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
    const [currentZoom, setCurrentZoom] = useState(userZoom);
    const elementRef = useRef(null);
    const pageRefs = useRef({});
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);
    const lastUserClickedPageRef = useRef(null);
    const [imageElements, setImageElements] = useState({});
    const [selectedImageId, setSelectedImageId] = useState(null);

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

    // Handle delete specific text element
    useEffect(() => {
      if (deleteSpecificElement) {
        console.log(
          "🗑️ Deleting specific text element:",
          deleteSpecificElement
        );

        const { textId, pageNumber } = deleteSpecificElement;

        // Remove from textElements state
        setTextElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((text) => text.id !== textId) || [],
        }));

        // Clear selection if this element was selected
        if (selectedTextId === textId) {
          setSelectedTextId(null);
        }

        // Notify parent that deletion is complete
        if (onDeleteSpecificComplete) {
          onDeleteSpecificComplete();
        }
      }
    }, [deleteSpecificElement, selectedTextId, onDeleteSpecificComplete]);

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

    // Page visibility tracking with dynamic threshold based on zoom
    useEffect(() => {
      if (
        (layoutType !== "continuous" && layoutType !== "spread") ||
        !documentLoaded ||
        !onPageChange
      )
        return;

      // Dynamic threshold based on zoom level
      const getThresholdForZoom = (zoom) => {
        if (zoom <= 50) return [0.1, 0.3, 0.6];
        if (zoom <= 75) return [0.15, 0.4, 0.7];
        if (zoom <= 100) return [0.2, 0.5, 0.8];
        return [0.25, 0.5, 0.9];
      };

      // Dynamic root margin based on zoom level
      const getRootMarginForZoom = (zoom) => {
        if (zoom <= 50) return "-5% 0px -5% 0px";
        if (zoom <= 75) return "-8% 0px -8% 0px";
        if (zoom <= 100) return "-10% 0px -10% 0px";
        return "-15% 0px -15% 0px";
      };

      const pageObserver = new IntersectionObserver(
        (entries) => {
          if (isUserScrollingRef.current) {
            return;
          }

          const currentlyVisible = new Set();
          let bestVisibilityRatio = 0;
          let bestVisiblePage = null;

          entries.forEach((entry) => {
            const pageNum = parseInt(
              entry.target.getAttribute("data-page-number")
            );

            const minThreshold = userZoom <= 75 ? 0.3 : 0.5;

            if (
              entry.isIntersecting &&
              entry.intersectionRatio > minThreshold
            ) {
              currentlyVisible.add(pageNum);

              if (entry.intersectionRatio > bestVisibilityRatio) {
                bestVisibilityRatio = entry.intersectionRatio;
                bestVisiblePage = pageNum;
              }
            }
          });

          if (currentlyVisible.size > 0 && bestVisiblePage) {
            setVisiblePages(currentlyVisible);

            if (bestVisiblePage !== currentPage) {
              onPageChange(bestVisiblePage);
            }
          }
        },
        {
          threshold: getThresholdForZoom(userZoom),
          rootMargin: getRootMarginForZoom(userZoom),
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
    }, [documentLoaded, layoutType, onPageChange, currentPage, userZoom]);

    // Monitor zoom changes and trigger re-render
    useEffect(() => {
      if (userZoom !== currentZoom) {
        setCurrentZoom(userZoom);
        setTextElements((prevElements) => {
          const updatedElements = { ...prevElements };
          Object.keys(updatedElements).forEach((pageNum) => {
            updatedElements[pageNum] = [...updatedElements[pageNum]];
          });
          return updatedElements;
        });
      }
    }, [userZoom, currentZoom]);

    // Additional effect to handle real-time zoom updates for selected text
    useEffect(() => {
      if (selectedTextId && userZoom !== currentZoom) {
        const pageNumber = Object.keys(textElements).find((page) =>
          textElements[page]?.some((text) => text.id === selectedTextId)
        );

        if (pageNumber) {
          const element = textElements[pageNumber]?.find(
            (t) => t.id === selectedTextId
          );
          if (element) {
            setTextElements((prev) => ({ ...prev }));
          }
        }
      }
    }, [userZoom, currentZoom, selectedTextId, textElements]);

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

    const handleTextChange = useCallback(
      (textId, pageNumber, newText) => {
        setTextElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.map((text) =>
              text.id === textId ? { ...text, text: newText } : text
            ) || [],
        }));

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

    const handleImageStyleUpdate = useCallback(
      (imageId, pageNumber, styleUpdates) => {
        setImageElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.map((image) =>
              image.id === imageId ? { ...image, ...styleUpdates } : image
            ) || [],
        }));

        if (onImageUpdate) {
          const updatedImage = imageElements[pageNumber]?.find(
            (img) => img.id === imageId
          );
          if (updatedImage) {
            onImageUpdate({ ...updatedImage, ...styleUpdates });
          }
        }
      },
      [imageElements, onImageUpdate]
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

        if (onTextDelete) {
          onTextDelete(textId, pageNumber);
        }
      },
      [selectedTextId, onTextDelete]
    );

    const handleImageDelete = useCallback(
      (imageId, pageNumber) => {
        setImageElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((image) => image.id !== imageId) || [],
        }));

        if (selectedImageId === imageId) {
          setSelectedImageId(null);
        }

        if (onImageDelete) {
          onImageDelete(imageId, pageNumber);
        }
      },
      [selectedImageId, onImageDelete]
    );

    // Handle clear all text elements from parent
    useEffect(() => {
      if (clearAllTextElements) {
        console.log("🗑️ Clearing all text elements from PDF preview");

        const textElementNodes = document.querySelectorAll(".text-element");
        textElementNodes.forEach((node) => {
          node.style.transition = "opacity 0.3s ease-out";
          node.style.opacity = "0";
        });

        setTimeout(() => {
          setTextElements({});
          setSelectedTextId(null);

          if (onClearAllComplete) {
            onClearAllComplete();
          }
        }, 300);
      }
    }, [clearAllTextElements, onClearAllComplete]);

    // Listen for text additions from parent
    useEffect(() => {
      if (textEditingState?.addTextToPage && currentPage) {
        const pageNumber = currentPage;
        const textId = `text_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newTextElement = {
          id: textId,
          pageNumber,
          x: 100,
          y: 100,
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

        if (textEditingState.onTextAdded) {
          textEditingState.onTextAdded();
        }
      }
    }, [
      textEditingState?.addTextToPage,
      currentPage,
      textEditingState,
      onTextAdd,
    ]);

    // Update selected text styles from toolbar
    useEffect(() => {
      if (selectedTextId && textEditingState) {
        const pageNumber = Object.keys(textElements).find((page) =>
          textElements[page]?.some((text) => text.id === selectedTextId)
        );

        if (pageNumber) {
          const currentElement = textElements[pageNumber]?.find(
            (text) => text.id === selectedTextId
          );

          if (currentElement) {
            const hasChanges =
              currentElement.fontSize !== textEditingState.selectedSize ||
              currentElement.fontFamily !== textEditingState.selectedFont ||
              currentElement.color !== textEditingState.selectedColor ||
              currentElement.backgroundColor !==
                textEditingState.selectedBgColor ||
              currentElement.isBold !== textEditingState.isBold ||
              currentElement.isItalic !== textEditingState.isItalic ||
              currentElement.isUnderline !== textEditingState.isUnderline ||
              currentElement.alignment !== textEditingState.selectedAlignment ||
              currentElement.opacity !== textEditingState.opacity;

            if (hasChanges) {
              const updatedStyle = {
                fontSize: textEditingState.selectedSize,
                fontFamily: textEditingState.selectedFont,
                color: textEditingState.selectedColor,
                backgroundColor: textEditingState.selectedBgColor,
                isBold: textEditingState.isBold,
                isItalic: textEditingState.isItalic,
                isUnderline: textEditingState.isUnderline,
                alignment: textEditingState.selectedAlignment,
                opacity: textEditingState.opacity,
                x: currentElement.x,
                y: currentElement.y,
                width: currentElement.width,
                height: currentElement.height,
              };

              handleTextStyleUpdate(
                selectedTextId,
                parseInt(pageNumber),
                updatedStyle
              );
            }
          }
        }
      }
    }, [textEditingState, selectedTextId, textElements, handleTextStyleUpdate]);

    // Handle font size changes with smooth transitions
    useEffect(() => {
      if (selectedTextId && textEditingState?.selectedSize) {
        const pageNumber = Object.keys(textElements).find((page) =>
          textElements[page]?.some((text) => text.id === selectedTextId)
        );

        if (pageNumber) {
          const currentElement = textElements[pageNumber]?.find(
            (text) => text.id === selectedTextId
          );

          if (
            currentElement &&
            currentElement.fontSize !== textEditingState.selectedSize
          ) {
            const timeoutId = setTimeout(() => {
              const fontSizeRatio =
                textEditingState.selectedSize / currentElement.fontSize;
              const newHeight = Math.max(
                currentElement.height * fontSizeRatio,
                textEditingState.selectedSize * 1.5
              );

              handleTextStyleUpdate(selectedTextId, parseInt(pageNumber), {
                fontSize: textEditingState.selectedSize,
                height: newHeight,
                x: currentElement.x,
                y: currentElement.y,
                width: currentElement.width,
              });
            }, 50);

            return () => clearTimeout(timeoutId);
          }
        }
      }
    }, [
      textEditingState?.selectedSize,
      selectedTextId,
      textElements,
      handleTextStyleUpdate,
    ]);

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

    // FIXED: Click outside handler for both text and image elements
    useEffect(() => {
      const handleClickOutside = (e) => {
        // Don't do anything if clicking on text or image elements or their controls
        if (
          e.target.closest(".text-element") ||
          e.target.closest(".image-element")
        )
          return;

        // If image tool is active, only deselect when clicking outside PDF pages
        if (imageEditingState?.showImageToolbar) {
          if (!e.target.closest("[data-page-number]")) {
            setSelectedImageId(null);
          }
          return;
        }

        // If text tool is active, only deselect when clicking outside PDF pages
        if (textEditingState?.showTextToolbar) {
          if (!e.target.closest("[data-page-number]")) {
            setSelectedTextId(null);
          }
          return;
        }

        // Normal behavior when no tool is active
        if (!e.target.closest("[data-page-number]")) {
          setSelectedTextId(null);
          setSelectedImageId(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside, true);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside, true);
    }, [
      textEditingState?.showTextToolbar,
      imageEditingState?.showImageToolbar,
    ]);

    // Text overlay component
    const renderTextOverlay = useCallback(
      (pageNumber) => {
        const pageTexts = textElements[pageNumber] || [];
        if (pageTexts.length === 0) return null;

        return (
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: "none",
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
                zoom={userZoom}
              />
            ))}
          </div>
        );
      },
      [
        textElements,
        selectedTextId,
        pageScale,
        userZoom,
        handleTextStyleUpdate,
        handleTextDelete,
        handleTextChange,
      ]
    );

    // FIXED: Image overlay component
    const renderImageOverlay = useCallback(
      (pageNumber) => {
        const pageImages = imageElements[pageNumber] || [];
        if (pageImages.length === 0) return null;

        return (
          <div
            className="absolute inset-0"
            style={{
              pointerEvents: "none",
            }}
          >
            {pageImages.map((imageElement) => (
              <ResizableImageElement
                key={imageElement.id}
                imageElement={imageElement}
                isSelected={selectedImageId === imageElement.id}
                onSelect={setSelectedImageId}
                onUpdate={(updates) =>
                  handleImageStyleUpdate(imageElement.id, pageNumber, updates)
                }
                onDelete={() => handleImageDelete(imageElement.id, pageNumber)}
                pageScale={pageScale}
                zoom={userZoom}
              />
            ))}
          </div>
        );
      },
      [
        imageElements,
        selectedImageId,
        pageScale,
        userZoom,
        handleImageStyleUpdate,
        handleImageDelete,
      ]
    );

    // Listen for image additions from parent
    useEffect(() => {
      if (
        imageEditingState?.addImageToPage &&
        currentPage &&
        imageEditingState?.selectedImageSrc
      ) {
        const pageNumber = currentPage;
        const imageId = `image_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newImageElement = {
          id: imageId,
          pageNumber,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          src: imageEditingState.selectedImageSrc,
          opacity: imageEditingState?.opacity || 100,
          rotation: imageEditingState?.rotation || 0,
          flipHorizontal: imageEditingState?.flipHorizontal || false,
          flipVertical: imageEditingState?.flipVertical || false,
        };

        setImageElements((prev) => ({
          ...prev,
          [pageNumber]: [...(prev[pageNumber] || []), newImageElement],
        }));

        setSelectedImageId(imageId);

        if (onImageAdd) {
          onImageAdd(newImageElement);
        }

        if (imageEditingState.onImageAdded) {
          imageEditingState.onImageAdded();
        }
      }
    }, [
      imageEditingState?.addImageToPage,
      currentPage,
      imageEditingState?.selectedImageSrc,
      imageEditingState,
      onImageAdd,
    ]);

    // Update selected image styles from toolbar
    useEffect(() => {
      if (selectedImageId && imageEditingState) {
        const pageNumber = Object.keys(imageElements).find((page) =>
          imageElements[page]?.some((image) => image.id === selectedImageId)
        );

        if (pageNumber) {
          const currentElement = imageElements[pageNumber]?.find(
            (image) => image.id === selectedImageId
          );

          if (currentElement) {
            const hasChanges =
              currentElement.opacity !== imageEditingState.opacity ||
              currentElement.rotation !== imageEditingState.rotation ||
              currentElement.flipHorizontal !==
                imageEditingState.flipHorizontal ||
              currentElement.flipVertical !== imageEditingState.flipVertical;

            if (hasChanges) {
              const updatedStyle = {
                opacity: imageEditingState.opacity,
                rotation: imageEditingState.rotation,
                flipHorizontal: imageEditingState.flipHorizontal,
                flipVertical: imageEditingState.flipVertical,
                x: currentElement.x,
                y: currentElement.y,
                width: currentElement.width,
                height: currentElement.height,
              };

              handleImageStyleUpdate(
                selectedImageId,
                parseInt(pageNumber),
                updatedStyle
              );
            }
          }
        }
      }
    }, [
      imageEditingState,
      selectedImageId,
      imageElements,
      handleImageStyleUpdate,
    ]);

    // Handle image delete from parent toolbar
    useEffect(() => {
      if (imageEditingState?.deleteRequested && selectedImageId) {
        const pageNumber = Object.keys(imageElements).find((page) =>
          imageElements[page]?.some((image) => image.id === selectedImageId)
        );

        if (pageNumber) {
          handleImageDelete(selectedImageId, parseInt(pageNumber));
        }
      }
    }, [
      imageEditingState?.deleteRequested,
      selectedImageId,
      imageElements,
      handleImageDelete,
    ]);

    // Handle clear all images
    useEffect(() => {
      if (clearAllImageElements) {
        console.log("🗑️ Clearing all image elements from PDF preview");

        setImageElements({});
        setSelectedImageId(null);

        if (onClearAllImageComplete) {
          onClearAllImageComplete();
        }
      }
    }, [clearAllImageElements, onClearAllImageComplete]);

    // Handle delete specific image
    useEffect(() => {
      if (deleteSpecificImageElement) {
        console.log(
          "🗑️ Deleting specific image element:",
          deleteSpecificImageElement
        );

        const { imageId, pageNumber } = deleteSpecificImageElement;

        setImageElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((image) => image.id !== imageId) || [],
        }));

        if (selectedImageId === imageId) {
          setSelectedImageId(null);
        }

        if (onDeleteSpecificImageComplete) {
          onDeleteSpecificImageComplete();
        }
      }
    }, [
      deleteSpecificImageElement,
      selectedImageId,
      onDeleteSpecificImageComplete,
    ]);

    // FIXED: Function to render pages based on layout type
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
                    className="transition-all duration-300 hover:shadow-2xl relative"
                    style={{ transformOrigin: "center center" }}
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
                    {/* FIXED: Add missing overlays for magazine layout */}
                    {renderTextOverlay(currentPage)}
                    {renderImageOverlay(currentPage)}
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
                      className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative ${
                        currentPage === leftPage
                          ? "ring-2 ring-red-600 ring-offset-2"
                          : ""
                      }`}
                      style={{ transformOrigin: "top left" }}
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
                      {/* FIXED: Add missing overlays for left page */}
                      {renderTextOverlay(leftPage)}
                      {renderImageOverlay(leftPage)}
                    </div>
                  </div>

                  {/* Right page (if exists) */}
                  {rightPage && (
                    <div className="flex-shrink-0" data-page-number={rightPage}>
                      <div
                        className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative ${
                          currentPage === rightPage
                            ? "ring-2 ring-red-600 ring-offset-2"
                            : ""
                        }`}
                        style={{ transformOrigin: "top left" }}
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
                        {/* FIXED: Add missing overlays for right page */}
                        {renderTextOverlay(rightPage)}
                        {renderImageOverlay(rightPage)}
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
                        className={`transition-all duration-300 hover:ring-red-100 hover:ring-4 hover:ring-offset-2 relative ${
                          isCurrentPage
                            ? "ring-2 ring-red-600 ring-offset-2"
                            : ""
                        }`}
                        style={{ transformOrigin: "top left" }}
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
                        {/* FIXED: Correct overlays for continuous layout */}
                        {renderTextOverlay(currentPageNumber)}
                        {renderImageOverlay(currentPageNumber)}
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

          {/* Selected text info */}
          {selectedTextId && textEditingState?.showTextToolbar && (
            <div className="absolute bottom-2 left-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Text selected - Use toolbar to edit
              </div>
            </div>
          )}

          {/* FIXED: Selected image info */}
          {selectedImageId && imageEditingState?.showImageToolbar && (
            <div className="absolute bottom-2 right-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Image selected - Use toolbar to edit
              </div>
            </div>
          )}
        </div>

        {/* Custom styles for resize cursors and elements */}
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

          /* FIXED: Add missing image element styles */
          .image-element {
            pointer-events: auto;
          }

          .image-element * {
            pointer-events: auto;
          }

          /* Smooth transitions for both text and image elements */
          .text-element:not(.dragging),
          .image-element:not(.dragging) {
            transition: box-shadow 0.2s ease, transform 0.1s ease;
          }

          .text-element:hover,
          .image-element:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `}</style>
      </div>
    );
  }
);

Allpagespreview.displayName = "Allpagespreview";

export default Allpagespreview;
