import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText } from "lucide-react";
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
  const [isManuallyResized, setIsManuallyResized] = useState(false); // Track manual resize
  const elementRef = useRef(null);
  const textareaRef = useRef(null);
  const measureRef = useRef(null);
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
    measureRef.current.textContent = text || "A";

    return {
      width: measureRef.current.scrollWidth,
      height: measureRef.current.scrollHeight,
    };
  }, []);

  // Modified auto-resize function - respects manual resize
  const autoResizeElement = useCallback(
    (text) => {
      if (!elementRef.current || textElement.isEditing) return;

      const currentWidth = textElement.width;
      const currentHeight = textElement.height;
      const minWidth = Math.max(80, calculatedFontSize * 4);
      const minHeight = Math.max(40, calculatedFontSize * 2);

      // Always measure and adjust height for text content
      const measured = measureTextDimensions(text, (currentWidth * zoom) / 100);
      const measuredBaseHeight = (measured.height * 100) / zoom;
      let newHeight = Math.max(minHeight, measuredBaseHeight + 16);

      // Only auto-adjust width if NOT manually resized
      let newWidth = currentWidth;
      if (!isManuallyResized) {
        const lines = (text || "").split("\n");
        const maxLineLength = Math.max(...lines.map((line) => line.length));
        const charWidth = calculatedFontSize * 0.6;
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
      }

      // Update dimensions
      const updates = {};
      if (Math.abs(newHeight - currentHeight) > 5) {
        updates.height = newHeight;
      }
      if (!isManuallyResized && Math.abs(newWidth - currentWidth) > 5) {
        updates.width = newWidth;
      }

      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    },
    [
      textElement,
      calculatedFontSize,
      zoom,
      measureTextDimensions,
      onUpdate,
      isManuallyResized,
    ]
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

  // Modified function to adjust text layout - respects manual resize
  const adjustTextLayout = useCallback(() => {
    if (!elementRef.current || !measureRef.current || textElement.isEditing)
      return;

    const currentWidth = (textElement.width * zoom) / 100;
    const text = textElement.text || "";

    if (!text) return;

    // Set the measuring element to match current element width and styling
    measureRef.current.style.width = Math.max(60, currentWidth - 12) + "px";
    measureRef.current.style.fontSize = `${calculatedFontSize}px`;
    measureRef.current.style.fontFamily = textElement.fontFamily;
    measureRef.current.style.fontWeight = textElement.isBold
      ? "bold"
      : "normal";
    measureRef.current.style.fontStyle = textElement.isItalic
      ? "italic"
      : "normal";
    measureRef.current.textContent = text;

    measureRef.current.offsetHeight;

    const measuredHeight = measureRef.current.scrollHeight;
    const baseHeight = (measuredHeight * 100) / zoom;
    const minHeight = Math.max(40, calculatedFontSize * 2);
    const newHeight = Math.max(minHeight, baseHeight + 16);

    // Only update height, respect manual width adjustments
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

    if (textElement.isEditing && e.target.tagName === "TEXTAREA") {
      return;
    }

    if (textElement.isEditing) {
      onUpdate({ isEditing: false });
      return;
    }

    // Handle resize handles - mark as manually resized
    if (e.target.classList.contains("resize-handle")) {
      setIsResizing(true);
      setIsManuallyResized(true); // Mark as manually resized
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

    if (e.target.classList.contains("delete-btn")) {
      return;
    }

    if (!isSelected) {
      onSelect(textElement.id);
      return;
    }

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

        const newX = (newScaledX * 100) / zoom;
        const newY = (newScaledY * 100) / zoom;

        onUpdate({ x: newX, y: newY });
      } else if (isResizing && currentResizeHandle) {
        const pageBounds = getPageBoundaries();
        if (!pageBounds) return;

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const baseDeltaX = (deltaX * 100) / zoom;
        const baseDeltaY = (deltaY * 100) / zoom;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.elementX;
        let newY = resizeStart.elementY;

        const minWidth = Math.max(80, calculatedFontSize * 4);
        const minHeight = Math.max(40, calculatedFontSize * 2);

        switch (currentResizeHandle) {
          case "se":
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            break;
          case "sw":
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
          case "ne":
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "nw":
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "n":
            newHeight = Math.max(minHeight, resizeStart.height - baseDeltaY);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
            break;
          case "s":
            newHeight = Math.max(minHeight, resizeStart.height + baseDeltaY);
            break;
          case "e":
            newWidth = Math.max(minWidth, resizeStart.width + baseDeltaX);
            break;
          case "w":
            newWidth = Math.max(minWidth, resizeStart.width - baseDeltaX);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
            break;
        }

        const pageBaseWidth = (pageBounds.width * 100) / zoom;
        const pageBaseHeight = (pageBounds.height * 100) / zoom;

        if (newX < 0) {
          newWidth = newWidth + newX;
          newX = 0;
        }

        if (newY < 0) {
          newHeight = newHeight + newY;
          newY = 0;
        }

        if (newX + newWidth > pageBaseWidth) {
          newWidth = pageBaseWidth - newX;
        }

        if (newY + newHeight > pageBaseHeight) {
          newHeight = pageBaseHeight - newY;
        }

        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        newX = Math.max(0, Math.min(pageBaseWidth - newWidth, newX));
        newY = Math.max(0, Math.min(pageBaseHeight - newHeight, newY));

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

    if (isResizing) {
      setTimeout(() => {
        adjustTextLayout();
      }, 100);
    }
  }, [isResizing, adjustTextLayout]);

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

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";

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
      setTimeout(() => {
        adjustTextLayout();
      }, 100);
    }
  };

  const handleTextareaClick = (e) => {
    e.stopPropagation();
  };

  const handleClick = (e) => {
    e.stopPropagation();

    if (!isSelected) {
      onSelect(textElement.id);
      setClickCount(1);
      return;
    }

    if (isSelected) {
      setClickCount((prev) => prev + 1);

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        if (clickCount + 1 === 2 && !textElement.isEditing) {
          onUpdate({ isEditing: true });
        }
        setClickCount(0);
      }, 250);
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

  // Reset manual resize flag when text element changes (new element created)
  useEffect(() => {
    if (textElement.id) {
      setIsManuallyResized(false);
    }
  }, [textElement.id]);

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
                    className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-md hover:bg-red-600"
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
                    className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-md hover:bg-red-600"
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
    e.preventDefault();

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
    <>
      {/* Main container - prevent other selection systems */}
      <div
        ref={elementRef}
        className={`absolute image-element select-none ${
          isSelected ? "ring-2 ring-red-500 ring-opacity-60" : ""
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
          zIndex: isSelected ? 30 : 10, // Higher z-index to prevent other controls
          minWidth: "30px",
          minHeight: "30px",
          boxShadow: isSelected ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
          pointerEvents: "auto",
          transition: isDragging || isResizing ? "none" : "all 0.2s ease",
          transform: "translateZ(0)",
          willChange: isDragging || isResizing ? "transform" : "auto",
          borderRadius: "4px",
          overflow: "visible",
          // Prevent other selection systems
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-no-external-controls="true"
      >
        {/* Image content container */}
        <div
          className="relative w-full h-full"
          style={{
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <img
            ref={imageRef}
            src={imageElement.src}
            alt="PDF Image"
            className="w-full h-full object-contain"
            style={{
              transform: getTransformStyle(),
              transformOrigin: "center center",
              transition:
                isDragging || isResizing ? "none" : "transform 0.2s ease",
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />

          {/* Loading overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Controls - show on selection OR hover - positioned outside the main container */}
        {(isSelected || isHovered) && (
          <>
            {/* Corner resize handles - positioned relative to the container */}
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "14px",
                height: "14px",
                cursor: getCursorStyle("nw"),
                top: "-7px",
                left: "-7px",
                pointerEvents: "auto",
                zIndex: 20, // Even higher than main container
              }}
              data-direction="nw"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "14px",
                height: "14px",
                cursor: getCursorStyle("ne"),
                top: "-7px",
                right: "-7px",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="ne"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "14px",
                height: "14px",
                cursor: getCursorStyle("sw"),
                bottom: "-7px",
                left: "-7px",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="sw"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "14px",
                height: "14px",
                cursor: getCursorStyle("se"),
                bottom: "-7px",
                right: "-7px",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="se"
            />

            {/* Side handles */}
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "12px",
                height: "12px",
                cursor: getCursorStyle("n"),
                top: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="n"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "12px",
                height: "12px",
                cursor: getCursorStyle("s"),
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="s"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "12px",
                height: "12px",
                cursor: getCursorStyle("e"),
                top: "50%",
                right: "-6px",
                transform: "translateY(-50%)",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="e"
            />
            <div
              className="resize-handle absolute bg-red-500 border-2 border-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-150"
              style={{
                width: "12px",
                height: "12px",
                cursor: getCursorStyle("w"),
                top: "50%",
                left: "-6px",
                transform: "translateY(-50%)",
                pointerEvents: "auto",
                zIndex: 21,
              }}
              data-direction="w"
            />
          </>
        )}
      </div>
    </>
  );
};
// Enhanced DrawElement Component with Resizable Controls
const DrawElement = ({
  drawEditingState,
  onDrawAdd,
  onDrawUpdate,
  onDrawDelete,
  clearAllDrawElements,
  onClearAllDrawComplete,
  deleteSpecificDrawElement,
  onDeleteSpecificDrawComplete,
  zoom = 100,
  pageNumber,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentElement, setCurrentElement] = useState(null);
  const [allDrawElements, setAllDrawElements] = useState([]);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    elementX: 0,
    elementY: 0,
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentResizeHandle, setCurrentResizeHandle] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingIdRef = useRef(1);
  const lastPointRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Clear all elements when parent requests
  useEffect(() => {
    if (clearAllDrawElements) {
      setAllDrawElements([]);
      setSelectedElementId(null);
      onClearAllDrawComplete?.();
    }
  }, [clearAllDrawElements, onClearAllDrawComplete]);

  // Delete specific element when parent requests
  useEffect(() => {
    if (deleteSpecificDrawElement) {
      console.log(
        "🗑️ DrawElement: Deleting specific draw element:",
        deleteSpecificDrawElement
      );

      const drawIdToDelete =
        deleteSpecificDrawElement.drawId || deleteSpecificDrawElement;
      const elementPageNumber =
        deleteSpecificDrawElement.pageNumber || pageNumber;

      if (elementPageNumber === pageNumber) {
        setAllDrawElements((prev) => {
          const filtered = prev.filter(
            (element) => element.id !== drawIdToDelete
          );
          console.log(
            `🗑️ DrawElement: Removed element ${drawIdToDelete}, remaining:`,
            filtered.length
          );
          return filtered;
        });

        if (selectedElementId === drawIdToDelete) {
          setSelectedElementId(null);
        }
      }

      onDeleteSpecificDrawComplete?.();
    }
  }, [
    deleteSpecificDrawElement,
    onDeleteSpecificDrawComplete,
    pageNumber,
    selectedElementId,
  ]);

  // Enhanced coordinate conversion with better precision
  const getPageBoundaries = useCallback(() => {
    if (!containerRef.current) return null;

    const pageElement = containerRef.current.closest("[data-page-number]");
    if (!pageElement) return null;

    const pdfPageElement = pageElement.querySelector(".react-pdf__Page");
    if (!pdfPageElement) return null;

    const pageRect = pdfPageElement.getBoundingClientRect();
    return {
      width: pageRect.width,
      height: pageRect.height,
      element: pdfPageElement,
      rect: pageRect,
    };
  }, []);

  // Improved coordinate conversion
  const screenToPdfCoordinates = useCallback(
    (clientX, clientY) => {
      const pageBounds = getPageBoundaries();
      if (!pageBounds) return { x: 0, y: 0 };

      const pageRect = pageBounds.rect;
      const scaledX = Math.max(
        0,
        Math.min(clientX - pageRect.left, pageRect.width)
      );
      const scaledY = Math.max(
        0,
        Math.min(clientY - pageRect.top, pageRect.height)
      );

      return {
        x: (scaledX * 100) / zoom,
        y: (scaledY * 100) / zoom,
      };
    },
    [zoom, getPageBoundaries]
  );

  // Generate unique ID with better format
  const generateId = () => {
    return `draw-${pageNumber}-${Date.now()}-${drawingIdRef.current++}`;
  };

  // Enhanced arrow head creation
  const createArrowHead = (fromX, fromY, toX, toY, arrowLength = 12) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowAngle = Math.PI / 6; // 30 degrees

    const arrowX1 = toX - arrowLength * Math.cos(angle - arrowAngle);
    const arrowY1 = toY - arrowLength * Math.sin(angle - arrowAngle);
    const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle);
    const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle);

    return `M${toX},${toY} L${arrowX1},${arrowY1} M${toX},${toY} L${arrowX2},${arrowY2}`;
  };

  // Improved brush path smoothing
  const smoothPath = (points) => {
    if (points.length < 3) return points;

    const smoothed = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      const smoothedPoint = {
        x: (prev.x + current.x + next.x) / 3,
        y: (prev.y + current.y + next.y) / 3,
      };

      smoothed.push(smoothedPoint);
    }

    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // Enhanced brush path generation with better smoothing
  const generateBrushPath = (points, smooth = true) => {
    if (points.length < 1) return "";
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} A 0.5 0.5 0 1 1 ${
        points[0].x + 0.1
      } ${points[0].y}`;
    }

    const processedPoints = smooth ? smoothPath(points) : points;
    let path = `M ${processedPoints[0].x} ${processedPoints[0].y}`;

    if (processedPoints.length === 2) {
      path += ` L ${processedPoints[1].x} ${processedPoints[1].y}`;
    } else {
      for (let i = 1; i < processedPoints.length - 1; i++) {
        const current = processedPoints[i];
        const next = processedPoints[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      }

      const lastPoint = processedPoints[processedPoints.length - 1];
      path += ` T ${lastPoint.x} ${lastPoint.y}`;
    }

    return path;
  };

  // Distance calculation for point-to-element proximity
  const distanceToElement = (element, point) => {
    const threshold = 15; // pixels

    if (element.type === "brush") {
      return element.points.some((p) => {
        const scaledP = { x: (p.x * zoom) / 100, y: (p.y * zoom) / 100 };
        const distance = Math.sqrt(
          Math.pow(scaledP.x - point.x, 2) + Math.pow(scaledP.y - point.y, 2)
        );
        return distance <= threshold;
      });
    } else if (element.type === "line" || element.type === "arrow") {
      const startX = (element.startX * zoom) / 100;
      const startY = (element.startY * zoom) / 100;
      const endX = (element.endX * zoom) / 100;
      const endY = (element.endY * zoom) / 100;

      const A = point.x - startX;
      const B = point.y - startY;
      const C = endX - startX;
      const D = endY - startY;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;

      if (lenSq === 0) return Math.sqrt(A * A + B * B) <= threshold;

      let t = Math.max(0, Math.min(1, dot / lenSq));
      const projection = { x: startX + t * C, y: startY + t * D };

      const distance = Math.sqrt(
        Math.pow(point.x - projection.x, 2) +
          Math.pow(point.y - projection.y, 2)
      );

      return distance <= threshold;
    } else if (
      element.type === "square" ||
      element.type === "circle" ||
      element.type === "triangle"
    ) {
      // For shapes, check if point is within the bounding box
      const minX = Math.min(
        (element.startX * zoom) / 100,
        (element.endX * zoom) / 100
      );
      const maxX = Math.max(
        (element.startX * zoom) / 100,
        (element.endX * zoom) / 100
      );
      const minY = Math.min(
        (element.startY * zoom) / 100,
        (element.endY * zoom) / 100
      );
      const maxY = Math.max(
        (element.startY * zoom) / 100,
        (element.endY * zoom) / 100
      );

      return (
        point.x >= minX - threshold &&
        point.x <= maxX + threshold &&
        point.y >= minY - threshold &&
        point.y <= maxY + threshold
      );
    } else if (element.type === "emoji") {
      // For emojis, check distance from center point
      const centerX = (element.x * zoom) / 100;
      const centerY = (element.y * zoom) / 100;
      const distance = Math.sqrt(
        Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
      );
      return distance <= threshold * 2; // Larger threshold for emojis
    }

    return false;
  };

  // Get element bounds for resize handles
  const getElementBounds = (element) => {
    if (element.type === "emoji") {
      const size = ((element.size || element.strokeWidth * 2) * zoom) / 100;
      return {
        left: (element.x * zoom) / 100 - size / 2,
        top: (element.y * zoom) / 100 - size / 2,
        right: (element.x * zoom) / 100 + size / 2,
        bottom: (element.y * zoom) / 100 + size / 2,
        width: size,
        height: size,
      };
    } else {
      // For line, arrow, and shapes
      const minX = Math.min(
        (element.startX * zoom) / 100,
        (element.endX * zoom) / 100
      );
      const maxX = Math.max(
        (element.startX * zoom) / 100,
        (element.endX * zoom) / 100
      );
      const minY = Math.min(
        (element.startY * zoom) / 100,
        (element.endY * zoom) / 100
      );
      const maxY = Math.max(
        (element.startY * zoom) / 100,
        (element.endY * zoom) / 100
      );

      return {
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  };

  // Handle element selection and manipulation
  const handleElementInteraction = useCallback(
    (elementId, event, action = "select") => {
      const element = allDrawElements.find((el) => el.id === elementId);
      if (!element) return;

      if (action === "delete" && drawEditingState?.selectedTool === "eraser") {
        event.preventDefault();
        event.stopPropagation();

        console.log("🗑️ DrawElement: Local delete of element:", elementId);

        setAllDrawElements((prev) => {
          const filtered = prev.filter((el) => el.id !== elementId);
          console.log(
            `🗑️ DrawElement: Local state updated, remaining:`,
            filtered.length
          );
          return filtered;
        });

        if (selectedElementId === elementId) {
          setSelectedElementId(null);
        }

        onDrawDelete?.(elementId, pageNumber);
        return;
      }

      if (action === "select" && drawEditingState?.selectedTool !== "eraser") {
        event.preventDefault();
        event.stopPropagation();
        setSelectedElementId(elementId);
      }
    },
    [
      allDrawElements,
      drawEditingState?.selectedTool,
      selectedElementId,
      onDrawDelete,
      pageNumber,
    ]
  );

  // Handle resize
  const handleResizeMouseMove = useCallback(
    (e) => {
      if (!isResizing || !selectedElementId || !currentResizeHandle) return;

      const element = allDrawElements.find((el) => el.id === selectedElementId);
      if (!element) return;

      const coords = screenToPdfCoordinates(e.clientX, e.clientY);
      const deltaX = coords.x - resizeStart.x;
      const deltaY = coords.y - resizeStart.y;

      let newStartX = resizeStart.startX;
      let newStartY = resizeStart.startY;
      let newEndX = resizeStart.endX;
      let newEndY = resizeStart.endY;
      let newX = resizeStart.elementX;
      let newY = resizeStart.elementY;

      if (element.type === "emoji") {
        // For emojis, just change size
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const newSize = Math.max(16, resizeStart.elementX + distance);

        const updatedElement = {
          ...element,
          size: newSize,
        };

        setAllDrawElements((prev) =>
          prev.map((el) => (el.id === selectedElementId ? updatedElement : el))
        );

        onDrawUpdate?.(selectedElementId, { size: newSize });
        return;
      }

      // Handle different resize directions for shapes and lines
      switch (currentResizeHandle) {
        case "nw":
          newStartX = resizeStart.startX + deltaX;
          newStartY = resizeStart.startY + deltaY;
          break;
        case "ne":
          newEndX = resizeStart.endX + deltaX;
          newStartY = resizeStart.startY + deltaY;
          break;
        case "sw":
          newStartX = resizeStart.startX + deltaX;
          newEndY = resizeStart.endY + deltaY;
          break;
        case "se":
          newEndX = resizeStart.endX + deltaX;
          newEndY = resizeStart.endY + deltaY;
          break;
        case "n":
          if (element.type === "line" || element.type === "arrow") {
            newStartY = resizeStart.startY + deltaY;
          } else {
            newStartY = resizeStart.startY + deltaY;
          }
          break;
        case "s":
          if (element.type === "line" || element.type === "arrow") {
            newEndY = resizeStart.endY + deltaY;
          } else {
            newEndY = resizeStart.endY + deltaY;
          }
          break;
        case "e":
          if (element.type === "line" || element.type === "arrow") {
            newEndX = resizeStart.endX + deltaX;
          } else {
            newEndX = resizeStart.endX + deltaX;
          }
          break;
        case "w":
          if (element.type === "line" || element.type === "arrow") {
            newStartX = resizeStart.startX + deltaX;
          } else {
            newStartX = resizeStart.startX + deltaX;
          }
          break;
      }

      // Apply page boundaries
      const pageBounds = getPageBoundaries();
      if (pageBounds) {
        const pageBaseWidth = (pageBounds.width * 100) / zoom;
        const pageBaseHeight = (pageBounds.height * 100) / zoom;

        newStartX = Math.max(0, Math.min(pageBaseWidth, newStartX));
        newStartY = Math.max(0, Math.min(pageBaseHeight, newStartY));
        newEndX = Math.max(0, Math.min(pageBaseWidth, newEndX));
        newEndY = Math.max(0, Math.min(pageBaseHeight, newEndY));
      }

      const updatedElement = {
        ...element,
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY,
      };

      if (element.type === "emoji") {
        updatedElement.x = newX;
        updatedElement.y = newY;
      }

      setAllDrawElements((prev) =>
        prev.map((el) => (el.id === selectedElementId ? updatedElement : el))
      );

      onDrawUpdate?.(selectedElementId, {
        startX: newStartX,
        startY: newStartY,
        endX: newEndX,
        endY: newEndY,
        x: newX,
        y: newY,
      });
    },
    [
      isResizing,
      selectedElementId,
      currentResizeHandle,
      resizeStart,
      allDrawElements,
      screenToPdfCoordinates,
      zoom,
      getPageBoundaries,
      onDrawUpdate,
    ]
  );

  // Handle drag move
  const handleDragMouseMove = useCallback(
    (e) => {
      if (!isDragging || !selectedElementId) return;

      const element = allDrawElements.find((el) => el.id === selectedElementId);
      if (!element) return;

      const coords = screenToPdfCoordinates(e.clientX, e.clientY);
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      let updatedElement = { ...element };

      if (element.type === "emoji") {
        updatedElement.x = element.x + deltaX;
        updatedElement.y = element.y + deltaY;

        onDrawUpdate?.(selectedElementId, {
          x: updatedElement.x,
          y: updatedElement.y,
        });
      } else {
        updatedElement.startX = element.startX + deltaX;
        updatedElement.startY = element.startY + deltaY;
        updatedElement.endX = element.endX + deltaX;
        updatedElement.endY = element.endY + deltaY;

        onDrawUpdate?.(selectedElementId, {
          startX: updatedElement.startX,
          startY: updatedElement.startY,
          endX: updatedElement.endX,
          endY: updatedElement.endY,
        });
      }

      setAllDrawElements((prev) =>
        prev.map((el) => (el.id === selectedElementId ? updatedElement : el))
      );

      setDragStart(coords);
    },
    [
      isDragging,
      selectedElementId,
      dragStart,
      allDrawElements,
      screenToPdfCoordinates,
      onDrawUpdate,
    ]
  );

  // Enhanced mouse down handler
  const handleMouseDown = useCallback(
    (e) => {
      if (
        !drawEditingState?.addDrawingToPage ||
        !drawEditingState?.selectedTool
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Check if clicking on a resize handle
      if (e.target.classList.contains("resize-handle")) {
        setIsResizing(true);
        setCurrentResizeHandle(e.target.dataset.direction);

        const element = allDrawElements.find(
          (el) => el.id === selectedElementId
        );
        if (element) {
          const coords = screenToPdfCoordinates(e.clientX, e.clientY);
          setResizeStart({
            x: coords.x,
            y: coords.y,
            startX: element.startX,
            startY: element.startY,
            endX: element.endX,
            endY: element.endY,
            elementX:
              element.type === "emoji"
                ? element.size || element.strokeWidth * 2
                : element.x,
            elementY: element.type === "emoji" ? 0 : element.y,
          });
        }
        return;
      }

      const coords = screenToPdfCoordinates(e.clientX, e.clientY);

      // Check if clicking on existing element
      if (drawEditingState.selectedTool === "eraser") {
        const clickPoint = {
          x: e.clientX - containerRef.current.getBoundingClientRect().left,
          y: e.clientY - containerRef.current.getBoundingClientRect().top,
        };

        for (const element of allDrawElements) {
          if (distanceToElement(element, clickPoint)) {
            handleElementInteraction(element.id, e, "delete");
            return;
          }
        }
        return;
      }

      // Check for selection of existing elements (non-brush only)
      const clickPoint = {
        x: e.clientX - containerRef.current.getBoundingClientRect().left,
        y: e.clientY - containerRef.current.getBoundingClientRect().top,
      };

      for (const element of allDrawElements) {
        if (
          element.type !== "brush" &&
          distanceToElement(element, clickPoint)
        ) {
          if (selectedElementId === element.id) {
            // Start dragging if already selected
            setIsDragging(true);
            setDragStart(coords);
          } else {
            // Select the element
            handleElementInteraction(element.id, e, "select");
          }
          return;
        }
      }

      // Deselect if clicking on empty space
      setSelectedElementId(null);

      const elementId = generateId();
      lastPointRef.current = coords;

      let newElement = {
        id: elementId,
        type: drawEditingState.selectedTool,
        color: drawEditingState.selectedColor,
        strokeWidth: drawEditingState.strokeWidth,
        pageNumber: pageNumber,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        points: [coords],
        path: "",
        isComplete: false,
        timestamp: Date.now(),
      };

      // Add emoji-specific properties
      if (drawEditingState.selectedTool === "emoji") {
        newElement.emoji = drawEditingState.selectedEmoji || "😀";
        newElement.x = coords.x;
        newElement.y = coords.y;
        newElement.size = 100;
        newElement.isComplete = true;

        setAllDrawElements((prev) => {
          const updated = [...prev, newElement];
          console.log("🎨 DrawElement: Added emoji, total:", updated.length);
          return updated;
        });

        setSelectedElementId(elementId); // Auto-select new emoji
        onDrawAdd?.(newElement);
        return;
      }

      setCurrentElement(newElement);
      setCurrentPath([coords]);
      setIsDrawing(true);

      // Add to parent immediately for non-brush tools
      if (drawEditingState.selectedTool !== "brush") {
        onDrawAdd?.(newElement);
      }
    },
    [
      drawEditingState?.addDrawingToPage,
      drawEditingState?.selectedTool,
      drawEditingState?.selectedColor,
      drawEditingState?.strokeWidth,
      drawEditingState?.selectedEmoji,
      screenToPdfCoordinates,
      pageNumber,
      onDrawAdd,
      allDrawElements,
      selectedElementId,
      handleElementInteraction,
    ]
  );

  // Enhanced mouse move
  const handleMouseMove = useCallback(
    (e) => {
      if (isResizing) {
        handleResizeMouseMove(e);
        return;
      }

      if (isDragging) {
        handleDragMouseMove(e);
        return;
      }

      if (!isDrawing || !currentElement) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const coords = screenToPdfCoordinates(e.clientX, e.clientY);

        if (drawEditingState?.selectedTool === "brush") {
          const lastPoint = lastPointRef.current;
          const distance = Math.sqrt(
            Math.pow(coords.x - lastPoint.x, 2) +
              Math.pow(coords.y - lastPoint.y, 2)
          );

          if (distance > 1) {
            const newPath = [...currentPath, coords];
            setCurrentPath(newPath);
            lastPointRef.current = coords;

            const updatedElement = {
              ...currentElement,
              points: newPath,
              endX: coords.x,
              endY: coords.y,
            };

            setCurrentElement(updatedElement);
          }
        } else if (
          drawEditingState?.selectedTool === "line" ||
          drawEditingState?.selectedTool === "arrow" ||
          drawEditingState?.selectedTool === "square" ||
          drawEditingState?.selectedTool === "circle" ||
          drawEditingState?.selectedTool === "triangle"
        ) {
          const updatedElement = {
            ...currentElement,
            endX: coords.x,
            endY: coords.y,
          };

          setCurrentElement(updatedElement);
          onDrawUpdate?.(currentElement.id, { endX: coords.x, endY: coords.y });
        }
      });
    },
    [
      isDrawing,
      isResizing,
      isDragging,
      currentElement,
      currentPath,
      drawEditingState?.selectedTool,
      screenToPdfCoordinates,
      onDrawUpdate,
      handleResizeMouseMove,
      handleDragMouseMove,
    ]
  );

  // Enhanced mouse up handler
  const handleMouseUp = useCallback(
    (e) => {
      if (isResizing) {
        setIsResizing(false);
        setCurrentResizeHandle(null);
        return;
      }

      if (isDragging) {
        setIsDragging(false);
        return;
      }

      if (!isDrawing || !currentElement) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      e.preventDefault();
      const coords = screenToPdfCoordinates(e.clientX, e.clientY);

      const finalElement = {
        ...currentElement,
        endX: coords.x,
        endY: coords.y,
        points:
          drawEditingState?.selectedTool === "brush"
            ? currentPath.length > 0
              ? currentPath
              : [coords]
            : [
                { x: currentElement.startX, y: currentElement.startY },
                { x: coords.x, y: coords.y },
              ],
        isComplete: true,
      };

      // Add to local state
      setAllDrawElements((prev) => {
        const updated = [...prev, finalElement];
        console.log(
          "🎨 DrawElement: Added new element, total:",
          updated.length
        );
        return updated;
      });

      // Auto-select non-brush elements
      if (drawEditingState?.selectedTool !== "brush") {
        setSelectedElementId(finalElement.id);
      }

      // Handle parent notifications
      if (drawEditingState?.selectedTool === "brush") {
        onDrawAdd?.(finalElement);
      } else {
        onDrawUpdate?.(currentElement.id, {
          endX: coords.x,
          endY: coords.y,
          isComplete: true,
          points: finalElement.points,
        });
      }

      // Clean up
      setIsDrawing(false);
      setCurrentElement(null);
      setCurrentPath([]);
      lastPointRef.current = null;
    },
    [
      isDrawing,
      isResizing,
      isDragging,
      currentElement,
      currentPath,
      drawEditingState?.selectedTool,
      screenToPdfCoordinates,
      onDrawAdd,
      onDrawUpdate,
    ]
  );

  // Get cursor style for resize handles
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

  // Enhanced element rendering with selection and resize handles
  const renderDrawElement = (element, isHovered = false) => {
    const scaledStrokeWidth = Math.max(1, (element.strokeWidth * zoom) / 100);
    const opacity =
      isHovered && drawEditingState?.selectedTool === "eraser" ? 0.5 : 1;
    const isSelected = selectedElementId === element.id;

    const commonProps = {
      stroke: element.color,
      strokeWidth: scaledStrokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      opacity,
      style: {
        cursor:
          drawEditingState?.selectedTool === "eraser"
            ? "pointer"
            : element.type !== "brush"
            ? "pointer"
            : "default",
        filter:
          isHovered && drawEditingState?.selectedTool === "eraser"
            ? "drop-shadow(0 0 3px rgba(255,0,0,0.5))"
            : isSelected && element.type !== "brush"
            ? "drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3))"
            : "none",
      },
      onClick: (e) =>
        handleElementInteraction(
          element.id,
          e,
          drawEditingState?.selectedTool === "eraser" ? "delete" : "select"
        ),
      onMouseEnter: () => setHoveredElementId(element.id),
      onMouseLeave: () => setHoveredElementId(null),
    };

    if (element.type === "line") {
      return (
        <line
          key={element.id}
          x1={(element.startX * zoom) / 100}
          y1={(element.startY * zoom) / 100}
          x2={(element.endX * zoom) / 100}
          y2={(element.endY * zoom) / 100}
          {...commonProps}
        />
      );
    } else if (element.type === "arrow") {
      const startX = (element.startX * zoom) / 100;
      const startY = (element.startY * zoom) / 100;
      const endX = (element.endX * zoom) / 100;
      const endY = (element.endY * zoom) / 100;

      return (
        <g key={element.id} {...commonProps}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={element.color}
            strokeWidth={scaledStrokeWidth}
            strokeLinecap="round"
            opacity={opacity}
          />
          <path
            d={createArrowHead(
              startX,
              startY,
              endX,
              endY,
              scaledStrokeWidth * 3
            )}
            stroke={element.color}
            strokeWidth={scaledStrokeWidth}
            strokeLinecap="round"
            opacity={opacity}
          />
        </g>
      );
    } else if (element.type === "brush") {
      const scaledPoints = element.points.map((point) => ({
        x: (point.x * zoom) / 100,
        y: (point.y * zoom) / 100,
      }));

      return (
        <path
          key={element.id}
          d={generateBrushPath(scaledPoints)}
          fill="none"
          {...commonProps}
        />
      );
    } else if (element.type === "square") {
      const x = Math.min(
        (element.startX * zoom) / 100,
        (element.endX * zoom) / 100
      );
      const y = Math.min(
        (element.startY * zoom) / 100,
        (element.endY * zoom) / 100
      );
      const width = Math.abs(((element.endX - element.startX) * zoom) / 100);
      const height = Math.abs(((element.endY - element.startY) * zoom) / 100);

      return (
        <rect
          key={element.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          {...commonProps}
        />
      );
    } else if (element.type === "circle") {
      const centerX = (((element.startX + element.endX) / 2) * zoom) / 100;
      const centerY = (((element.startY + element.endY) / 2) * zoom) / 100;
      const radiusX =
        Math.abs(((element.endX - element.startX) * zoom) / 100) / 2;
      const radiusY =
        Math.abs(((element.endY - element.startY) * zoom) / 100) / 2;

      return (
        <ellipse
          key={element.id}
          cx={centerX}
          cy={centerY}
          rx={radiusX}
          ry={radiusY}
          fill="none"
          {...commonProps}
        />
      );
    } else if (element.type === "triangle") {
      const x1 = (((element.startX + element.endX) / 2) * zoom) / 100; // Top point
      const y1 = (element.startY * zoom) / 100;
      const x2 = (element.startX * zoom) / 100; // Bottom left
      const y2 = (element.endY * zoom) / 100;
      const x3 = (element.endX * zoom) / 100; // Bottom right
      const y3 = (element.endY * zoom) / 100;

      const points = `${x1},${y1} ${x2},${y2} ${x3},${y3}`;

      return (
        <polygon
          key={element.id}
          points={points}
          fill="none"
          {...commonProps}
        />
      );
    } else if (element.type === "emoji") {
      const x = (element.x * zoom) / 100;
      const y = (element.y * zoom) / 100;
      const fontSize = Math.max(
        16,
        ((element.size || element.strokeWidth * 2) * zoom) / 100
      );

      return (
        <text
          key={element.id}
          x={x}
          y={y}
          fontSize={fontSize}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            cursor:
              drawEditingState?.selectedTool === "eraser"
                ? "pointer"
                : "pointer",
            opacity,
            filter:
              isHovered && drawEditingState?.selectedTool === "eraser"
                ? "drop-shadow(0 0 3px rgba(255,0,0,0.5))"
                : isSelected
                ? "drop-shadow(0 2px 8px rgba(59, 130, 246, 0.3))"
                : "none",
          }}
          onClick={(e) =>
            handleElementInteraction(
              element.id,
              e,
              drawEditingState?.selectedTool === "eraser" ? "delete" : "select"
            )
          }
          onMouseEnter={() => setHoveredElementId(element.id)}
          onMouseLeave={() => setHoveredElementId(null)}
        >
          {element.emoji}
        </text>
      );
    }

    return null;
  };

  // Render resize handles for selected element
  const renderResizeHandles = (element) => {
    if (!element || element.type === "brush") return null;

    const bounds = getElementBounds(element);
    const handleSize = 12;
    const offset = handleSize / 2;

    const handles = [];

    if (element.type === "emoji") {
      // For emoji, only show one resize handle at bottom-right
      handles.push(
        <circle
          key="se"
          className="resize-handle"
          data-direction="se"
          cx={bounds.right}
          cy={bounds.bottom}
          r={offset}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth="2"
          style={{
            cursor: getCursorStyle("se"),
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
          }}
        />
      );
    } else {
      // For shapes and lines, show all handles
      const handlePositions = [
        { key: "nw", x: bounds.left, y: bounds.top },
        { key: "ne", x: bounds.right, y: bounds.top },
        { key: "sw", x: bounds.left, y: bounds.bottom },
        { key: "se", x: bounds.right, y: bounds.bottom },
        { key: "n", x: bounds.left + bounds.width / 2, y: bounds.top },
        { key: "s", x: bounds.left + bounds.width / 2, y: bounds.bottom },
        { key: "e", x: bounds.right, y: bounds.top + bounds.height / 2 },
        { key: "w", x: bounds.left, y: bounds.top + bounds.height / 2 },
      ];

      handlePositions.forEach(({ key, x, y }) => {
        handles.push(
          <circle
            key={key}
            className="resize-handle"
            data-direction={key}
            cx={x}
            cy={y}
            r={offset}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
            style={{
              cursor: getCursorStyle(key),
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          />
        );
      });
    }

    return handles;
  };

  // Add mouse event listeners with improved cleanup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e) => {
      if (drawEditingState?.addDrawingToPage) {
        e.preventDefault();
      }
    };

    // Handle clicks outside to deselect
    const handleDocumentClick = (e) => {
      if (
        !container.contains(e.target) &&
        !e.target.classList.contains("resize-handle") &&
        drawEditingState?.addDrawingToPage
      ) {
        setSelectedElementId(null);
      }
    };

    if (drawEditingState?.addDrawingToPage) {
      container.addEventListener("mousedown", handleMouseDown, {
        passive: false,
      });
      document.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
      container.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("click", handleDocumentClick);

      return () => {
        container.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("click", handleDocumentClick);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [
    drawEditingState?.addDrawingToPage,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  ]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDrawing) {
        setIsDrawing(false);
        setCurrentElement(null);
        setCurrentPath([]);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDrawing]);

  // Enhanced cursor logic with new tools
  const getCursor = () => {
    if (!drawEditingState?.addDrawingToPage) return "default";
    if (isResizing) return "grabbing";
    if (isDragging) return "grabbing";

    switch (drawEditingState?.selectedTool) {
      case "brush":
        return "crosshair";
      case "line":
        return "crosshair";
      case "arrow":
        return "crosshair";
      case "square":
        return "crosshair";
      case "circle":
        return "crosshair";
      case "triangle":
        return "crosshair";
      case "emoji":
        return "pointer";
      case "eraser":
        return "pointer";
      default:
        return "default";
    }
  };

  const shouldShowInteractiveLayer =
    drawEditingState?.showDrawToolbar || drawEditingState?.addDrawingToPage;

  // Debug: Add console log to track state changes
  useEffect(() => {
    console.log(
      `🎨 DrawElement Page ${pageNumber}: Total elements:`,
      allDrawElements.length,
      `Selected: ${selectedElementId}`
    );
  }, [allDrawElements, pageNumber, selectedElementId]);

  const selectedElement = allDrawElements.find(
    (el) => el.id === selectedElementId
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: shouldShowInteractiveLayer ? 15 : 5,
        cursor: getCursor(),
      }}
    >
      {/* Enhanced Drawing Canvas with better event handling */}
      <svg
        ref={canvasRef}
        className="absolute inset-0 w-full h-full select-none"
        style={{
          pointerEvents: shouldShowInteractiveLayer ? "auto" : "none",
          zIndex: 10,
          touchAction: "none",
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Always render all completed drawings */}
        {allDrawElements.map((element) =>
          renderDrawElement(element, element.id === hoveredElementId)
        )}

        {/* Only render current drawing preview when toolbar is active */}
        {currentElement && shouldShowInteractiveLayer && (
          <g className="drawing-preview" style={{ opacity: 0.8 }}>
            {renderDrawElement(currentElement)}
          </g>
        )}

        {/* Render resize handles for selected element */}
        {selectedElement &&
          shouldShowInteractiveLayer &&
          drawEditingState?.selectedTool !== "eraser" && (
            <g className="resize-handles" style={{ pointerEvents: "auto" }}>
              {renderResizeHandles(selectedElement)}
            </g>
          )}

        {/* Selection outline for selected element */}
        {selectedElement &&
          shouldShowInteractiveLayer &&
          selectedElement.type !== "brush" &&
          drawEditingState?.selectedTool !== "eraser" && (
            <g className="selection-outline" style={{ pointerEvents: "none" }}>
              {(() => {
                const bounds = getElementBounds(selectedElement);
                return (
                  <rect
                    x={bounds.left - 2}
                    y={bounds.top - 2}
                    width={bounds.width + 4}
                    height={bounds.height + 4}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                    rx="4"
                  />
                );
              })()}
            </g>
          )}
      </svg>

      {/* Only show tool indicator when toolbar is active */}
      {shouldShowInteractiveLayer &&
        drawEditingState?.selectedTool === "eraser" && (
          <div
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium pointer-events-none"
            style={{ zIndex: 20 }}
          >
            🗑️ Eraser Mode - Click to delete drawings
          </div>
        )}

      {/* Tool-specific hints */}
      {shouldShowInteractiveLayer &&
        drawEditingState?.selectedTool === "emoji" && (
          <div
            className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium pointer-events-none"
            style={{ zIndex: 20 }}
          >
            😀 Click to place emoji: {drawEditingState?.selectedEmoji || "😀"}
          </div>
        )}

      {/* Selection hint */}
      {shouldShowInteractiveLayer &&
        selectedElement &&
        selectedElement.type !== "brush" &&
        drawEditingState?.selectedTool !== "eraser" && (
          <div
            className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-lg shadow-lg text-sm font-medium pointer-events-none"
            style={{ zIndex: 20 }}
          >
            🎯 Selected: {selectedElement.type} - Drag to move, use handles to
            resize
          </div>
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
    // Drawing editing props
    drawEditingState = null,
    onDrawAdd = null,
    onDrawUpdate = null,
    onDrawDelete = null,
    clearAllDrawElements = false,
    onClearAllDrawComplete = null,
    deleteSpecificDrawElement = null,
    onDeleteSpecificDrawComplete = null,
    // Combined elements
    allTextElements = [],
    allImageElements = [],
    combinedElements = [],
    // ✅ NEW PAN TOOL PROPS
    selectedTool = null,
    isPanning = false,
    scrollPos = { x: 0, y: 0 },
    lastMousePos = { x: 0, y: 0 },
    onPanMouseDown = null,
    onPanMouseMove = null,
    onPanMouseUp = null,
    getCursor = null,
    panToolClick = null,
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

    // Drawing state
    const [drawElements, setDrawElements] = useState({});
    const [selectedDrawId, setSelectedDrawId] = useState(null);

    // Simplified Z-Index management state
    const [elementZIndices, setElementZIndices] = useState({});
    const [nextZIndex, setNextZIndex] = useState(100); // Start from 100 to avoid conflicts

    console.log("combinedElements", combinedElements);

    // Simple function to get next available z-index
    const getNextZIndex = useCallback(() => {
      const newZIndex = nextZIndex;
      setNextZIndex((prev) => prev + 1);
      return newZIndex;
    }, [nextZIndex]);

    // Function to bring element to top - immediate update
    const bringElementToTop = useCallback(
      (elementId, elementType) => {
        const newZIndex = getNextZIndex();
        const key = `${elementType}_${elementId}`;

        setElementZIndices((prev) => ({
          ...prev,
          [key]: newZIndex,
        }));

        console.log(
          `${elementType} ${elementId} brought to top with z-index: ${newZIndex}`
        );
        return newZIndex;
      },
      [getNextZIndex]
    );

    // Function to get element z-index with fallback
    const getElementZIndex = useCallback(
      (elementId, elementType) => {
        const key = `${elementType}_${elementId}`;
        return elementZIndices[key] || 10; // Default low z-index
      },
      [elementZIndices]
    );

    // Function to assign z-index to new element
    const assignZIndexToNewElement = useCallback(
      (elementId, elementType) => {
        const newZIndex = getNextZIndex();
        const key = `${elementType}_${elementId}`;

        setElementZIndices((prev) => ({
          ...prev,
          [key]: newZIndex,
        }));

        console.log(
          `New ${elementType} element created with z-index: ${newZIndex}`
        );
        return newZIndex;
      },
      [getNextZIndex]
    );

    // Initialize z-index for existing elements from combinedElements
    useEffect(() => {
      if (combinedElements.length > 0) {
        const newZIndices = {};
        let currentZIndex = nextZIndex;

        combinedElements.forEach((element) => {
          const elementType =
            element.text !== undefined
              ? "text"
              : element.src !== undefined
              ? "image"
              : "draw";
          const key = `${elementType}_${element.id}`;

          // Only assign if not already assigned
          if (!elementZIndices[key]) {
            newZIndices[key] = currentZIndex;
            currentZIndex++;
          }
        });

        if (Object.keys(newZIndices).length > 0) {
          setElementZIndices((prev) => ({
            ...prev,
            ...newZIndices,
          }));
          setNextZIndex(currentZIndex);
        }
      }
    }, [combinedElements, elementZIndices, nextZIndex]);

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

    // Clean up z-indices when elements are deleted
    const cleanupZIndex = useCallback((elementId, elementType) => {
      const key = `${elementType}_${elementId}`;
      setElementZIndices((prev) => {
        const newIndices = { ...prev };
        delete newIndices[key];
        return newIndices;
      });
    }, []);

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

        // Clean up z-index
        cleanupZIndex(textId, "text");

        // Notify parent that deletion is complete
        if (onDeleteSpecificComplete) {
          onDeleteSpecificComplete();
        }
      }
    }, [
      deleteSpecificElement,
      selectedTextId,
      onDeleteSpecificComplete,
      cleanupZIndex,
    ]);

    // Handle delete specific draw element
    useEffect(() => {
      if (deleteSpecificDrawElement) {
        console.log(
          "🗑️ Deleting specific draw element:",
          deleteSpecificDrawElement
        );

        const { drawId, pageNumber } = deleteSpecificDrawElement;

        // Remove from drawElements state
        setDrawElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((draw) => draw.id !== drawId) || [],
        }));

        // Clear selection if this element was selected
        if (selectedDrawId === drawId) {
          setSelectedDrawId(null);
        }

        // Clean up z-index
        cleanupZIndex(drawId, "draw");

        // Notify parent that deletion is complete
        if (onDeleteSpecificDrawComplete) {
          onDeleteSpecificDrawComplete();
        }
      }
    }, [
      deleteSpecificDrawElement,
      selectedDrawId,
      onDeleteSpecificDrawComplete,
      cleanupZIndex,
    ]);

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

      const getThresholdForZoom = (zoom) => {
        if (zoom <= 50) return [0.1, 0.3, 0.6];
        if (zoom <= 75) return [0.15, 0.4, 0.7];
        if (zoom <= 100) return [0.2, 0.5, 0.8];
        return [0.25, 0.5, 0.9];
      };

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
        setDrawElements((prevElements) => {
          const updatedElements = { ...prevElements };
          Object.keys(updatedElements).forEach((pageNum) => {
            updatedElements[pageNum] = [...updatedElements[pageNum]];
          });
          return updatedElements;
        });
      }
    }, [userZoom, currentZoom]);

    // Additional effect to handle real-time zoom updates for selected elements
    useEffect(() => {
      if ((selectedTextId || selectedDrawId) && userZoom !== currentZoom) {
        if (selectedTextId) {
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

        if (selectedDrawId) {
          const pageNumber = Object.keys(drawElements).find((page) =>
            drawElements[page]?.some((draw) => draw.id === selectedDrawId)
          );

          if (pageNumber) {
            const element = drawElements[pageNumber]?.find(
              (d) => d.id === selectedDrawId
            );
            if (element) {
              setDrawElements((prev) => ({ ...prev }));
            }
          }
        }
      }
    }, [
      userZoom,
      currentZoom,
      selectedTextId,
      selectedDrawId,
      textElements,
      drawElements,
    ]);

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

    // Text element handlers
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

    // Drawing element handlers
    const handleDrawAdd = useCallback(
      (drawElement) => {
        console.log("🎨 Adding draw element:", drawElement);

        setDrawElements((prev) => ({
          ...prev,
          [drawElement.pageNumber]: [
            ...(prev[drawElement.pageNumber] || []),
            drawElement,
          ],
        }));

        // Assign z-index to new drawing element
        assignZIndexToNewElement(drawElement.id, "draw");

        if (onDrawAdd) {
          onDrawAdd(drawElement);
        }
      },
      [onDrawAdd, assignZIndexToNewElement]
    );

    const handleDrawUpdate = useCallback(
      (drawId, updates) => {
        console.log("🎨 Updating draw element:", drawId, updates);

        // Find the page containing this draw element
        const pageNumber = Object.keys(drawElements).find((page) =>
          drawElements[page]?.some((draw) => draw.id === drawId)
        );

        if (pageNumber) {
          setDrawElements((prev) => ({
            ...prev,
            [pageNumber]:
              prev[pageNumber]?.map((draw) =>
                draw.id === drawId ? { ...draw, ...updates } : draw
              ) || [],
          }));

          if (onDrawUpdate) {
            const updatedDraw = drawElements[pageNumber]?.find(
              (d) => d.id === drawId
            );
            if (updatedDraw) {
              onDrawUpdate(drawId, { ...updatedDraw, ...updates });
            }
          }
        }
      },
      [drawElements, onDrawUpdate]
    );

    const handleDrawDelete = useCallback(
      (drawId, pageNumber) => {
        console.log("🗑️ Deleting draw element:", drawId);

        setDrawElements((prev) => ({
          ...prev,
          [pageNumber]:
            prev[pageNumber]?.filter((draw) => draw.id !== drawId) || [],
        }));

        if (selectedDrawId === drawId) {
          setSelectedDrawId(null);
        }

        // Clean up z-index
        cleanupZIndex(drawId, "draw");

        if (onDrawDelete) {
          onDrawDelete(drawId, pageNumber);
        }
      },
      [selectedDrawId, onDrawDelete, cleanupZIndex]
    );

    // Updated text element selection handler
    const handleTextSelect = useCallback(
      (textId) => {
        setSelectedTextId(textId);
        setSelectedImageId(null); // Deselect image when selecting text
        setSelectedDrawId(null); // Deselect draw when selecting text

        // Immediately bring to top
        bringElementToTop(textId, "text");
      },
      [bringElementToTop]
    );

    // Updated image element selection handler
    const handleImageSelect = useCallback(
      (imageId) => {
        setSelectedImageId(imageId);
        setSelectedTextId(null); // Deselect text when selecting image
        setSelectedDrawId(null); // Deselect draw when selecting image

        // Immediately bring to top
        bringElementToTop(imageId, "image");
      },
      [bringElementToTop]
    );

    // Draw element selection handler
    const handleDrawSelect = useCallback(
      (drawId) => {
        setSelectedDrawId(drawId);
        setSelectedTextId(null); // Deselect text when selecting draw
        setSelectedImageId(null); // Deselect image when selecting draw

        // Immediately bring to top
        bringElementToTop(drawId, "draw");
      },
      [bringElementToTop]
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

        // Clean up z-index
        cleanupZIndex(textId, "text");

        if (onTextDelete) {
          onTextDelete(textId, pageNumber);
        }
      },
      [selectedTextId, onTextDelete, cleanupZIndex]
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

        // Clean up z-index
        cleanupZIndex(imageId, "image");

        if (onImageDelete) {
          onImageDelete(imageId, pageNumber);
        }
      },
      [selectedImageId, onImageDelete, cleanupZIndex]
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

          // Clear text z-indices
          setElementZIndices((prev) => {
            const newIndices = { ...prev };
            Object.keys(newIndices).forEach((key) => {
              if (key.startsWith("text_")) {
                delete newIndices[key];
              }
            });
            return newIndices;
          });

          if (onClearAllComplete) {
            onClearAllComplete();
          }
        }, 300);
      }
    }, [clearAllTextElements, onClearAllComplete]);

    // Handle clear all draw elements from parent
    useEffect(() => {
      if (clearAllDrawElements) {
        console.log("🗑️ Clearing all draw elements from PDF preview");

        setDrawElements({});
        setSelectedDrawId(null);

        // Clear draw z-indices
        setElementZIndices((prev) => {
          const newIndices = { ...prev };
          Object.keys(newIndices).forEach((key) => {
            if (key.startsWith("draw_")) {
              delete newIndices[key];
            }
          });
          return newIndices;
        });

        if (onClearAllDrawComplete) {
          onClearAllDrawComplete();
        }
      }
    }, [clearAllDrawElements, onClearAllDrawComplete]);

    // Updated text addition effect
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

        // Assign z-index and select
        assignZIndexToNewElement(textId, "text");
        setSelectedTextId(textId);
        setSelectedImageId(null);
        setSelectedDrawId(null);

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
      assignZIndexToNewElement,
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

    // Click outside handler for text, image, and draw elements
    useEffect(() => {
      const handleClickOutside = (e) => {
        // Don't do anything if clicking on text, image, or draw elements or their controls
        if (
          e.target.closest(".text-element") ||
          e.target.closest(".image-element") ||
          e.target.closest(".draw-element")
        )
          return;

        // If drawing tool is active, only deselect when clicking outside PDF pages
        if (drawEditingState?.showDrawToolbar) {
          if (!e.target.closest("[data-page-number]")) {
            setSelectedDrawId(null);
          }
          return;
        }

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
          setSelectedDrawId(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside, true);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside, true);
    }, [
      textEditingState?.showTextToolbar,
      imageEditingState?.showImageToolbar,
      drawEditingState?.showDrawToolbar,
    ]);

    // Updated text overlay render function with real-time z-index
    const renderTextOverlay = useCallback(
      (pageNumber) => {
        const pageTexts = textElements[pageNumber] || [];
        if (pageTexts.length === 0) return null;

        return (
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {pageTexts.map((textElement) => {
              const zIndex = getElementZIndex(textElement.id, "text");

              return (
                <div
                  key={textElement.id}
                  style={{
                    position: "absolute",
                    zIndex: zIndex,
                    pointerEvents: "auto",
                  }}
                >
                  <ResizableTextElement
                    textElement={textElement}
                    isSelected={selectedTextId === textElement.id}
                    onSelect={() => handleTextSelect(textElement.id)}
                    onUpdate={(updates) =>
                      handleTextStyleUpdate(textElement.id, pageNumber, updates)
                    }
                    onDelete={() =>
                      handleTextDelete(textElement.id, pageNumber)
                    }
                    onTextChange={(newText) =>
                      handleTextChange(textElement.id, pageNumber, newText)
                    }
                    pageScale={pageScale}
                    zoom={userZoom}
                    zIndex={zIndex}
                  />
                </div>
              );
            })}
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
        getElementZIndex,
        handleTextSelect,
      ]
    );

    // Updated image overlay render function with real-time z-index
    const renderImageOverlay = useCallback(
      (pageNumber) => {
        const pageImages = imageElements[pageNumber] || [];
        if (pageImages.length === 0) return null;

        return (
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {pageImages.map((imageElement) => {
              const zIndex = getElementZIndex(imageElement.id, "image");

              return (
                <div
                  key={imageElement.id}
                  style={{
                    position: "absolute",
                    zIndex: zIndex,
                    pointerEvents: "auto",
                  }}
                >
                  <ResizableImageElement
                    imageElement={imageElement}
                    isSelected={selectedImageId === imageElement.id}
                    onSelect={() => handleImageSelect(imageElement.id)}
                    onUpdate={(updates) =>
                      handleImageStyleUpdate(
                        imageElement.id,
                        pageNumber,
                        updates
                      )
                    }
                    onDelete={() =>
                      handleImageDelete(imageElement.id, pageNumber)
                    }
                    pageScale={pageScale}
                    zoom={userZoom}
                    zIndex={zIndex}
                  />
                </div>
              );
            })}
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
        getElementZIndex,
        handleImageSelect,
      ]
    );

    // Draw overlay render function
    const renderDrawOverlay = useCallback(
      (pageNumber) => {
        return (
          <DrawElement
            drawEditingState={drawEditingState}
            onDrawAdd={handleDrawAdd}
            onDrawUpdate={handleDrawUpdate}
            onDrawDelete={handleDrawDelete}
            clearAllDrawElements={clearAllDrawElements}
            onClearAllDrawComplete={onClearAllDrawComplete}
            deleteSpecificDrawElement={deleteSpecificDrawElement}
            onDeleteSpecificDrawComplete={onDeleteSpecificDrawComplete}
            zoom={userZoom}
            pageNumber={pageNumber}
          />
        );
      },
      [
        drawEditingState,
        handleDrawAdd,
        handleDrawUpdate,
        handleDrawDelete,
        clearAllDrawElements,
        onClearAllDrawComplete,
        deleteSpecificDrawElement,
        onDeleteSpecificDrawComplete,
        userZoom,
      ]
    );

    // Updated image addition effect
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

        // Assign z-index and select
        assignZIndexToNewElement(imageId, "image");
        setSelectedImageId(imageId);
        setSelectedTextId(null);
        setSelectedDrawId(null);

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
      assignZIndexToNewElement,
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

        // Clear image z-indices
        setElementZIndices((prev) => {
          const newIndices = { ...prev };
          Object.keys(newIndices).forEach((key) => {
            if (key.startsWith("image_")) {
              delete newIndices[key];
            }
          });
          return newIndices;
        });

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

        // Clean up z-index
        cleanupZIndex(imageId, "image");

        if (onDeleteSpecificImageComplete) {
          onDeleteSpecificImageComplete();
        }
      }
    }, [
      deleteSpecificImageElement,
      selectedImageId,
      onDeleteSpecificImageComplete,
      cleanupZIndex,
    ]);

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
                            ? "bg-red-600 w-6"
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
                        <div className="w-full h-full bg-gradient-to-br from-red-50 to-indigo-100 flex items-center justify-center rounded-lg">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                            <div className="text-red-700 font-medium">
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
                    {renderImageOverlay(currentPage)}
                    {renderDrawOverlay(currentPage)}
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
                      {renderTextOverlay(leftPage)}
                      {renderImageOverlay(leftPage)}
                      {renderDrawOverlay(leftPage)}
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
                        {renderTextOverlay(rightPage)}
                        {renderImageOverlay(rightPage)}
                        {renderDrawOverlay(rightPage)}
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
                        {renderTextOverlay(currentPageNumber)}
                        {renderImageOverlay(currentPageNumber)}
                        {renderDrawOverlay(currentPageNumber)}
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
        style={{
          ...style,
          cursor: getCursor ? getCursor() : "default", // ✅ Add cursor
        }}
        onMouseDown={onPanMouseDown}
      >
        {/* File Preview Area */}
        <div
          className="w-full relative h-full overflow-hidden"
          style={{
            transform:
              selectedTool === "pan" ? `translateY(${-scrollPos.y}px)` : "none", // Only Y transform
            transition: isPanning ? "none" : "transform 0.2s ease",
          }}
        >
          {renderPreview()}

          {/* Selected text info */}
          {selectedTextId && textEditingState?.showTextToolbar && (
            <div className="absolute bottom-2 left-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Text selected - Use toolbar to edit
              </div>
            </div>
          )}

          {/* Selected image info */}
          {selectedImageId && imageEditingState?.showImageToolbar && (
            <div className="absolute bottom-2 right-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Image selected - Use toolbar to edit
              </div>
            </div>
          )}

          {/* Selected draw info */}
          {selectedDrawId && drawEditingState?.showDrawToolbar && (
            <div className="absolute bottom-2 center-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-lg z-30">
              <div className="text-xs text-gray-600 font-medium">
                Drawing selected - Use toolbar to edit
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

          .image-element {
            pointer-events: auto;
          }

          .image-element * {
            pointer-events: auto;
          }

          .draw-element {
            pointer-events: auto;
          }

          .draw-element * {
            pointer-events: auto;
          }

          /* Smooth transitions for text, image, and draw elements */
          .text-element:not(.dragging),
          .image-element:not(.dragging),
          .draw-element:not(.dragging) {
            transition: box-shadow 0.2s ease, transform 0.1s ease;
          }

          .text-element:hover,
          .image-element:hover,
          .draw-element:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `}</style>
      </div>
    );
  }
);

Allpagespreview.displayName = "Allpagespreview";

export default Allpagespreview;
