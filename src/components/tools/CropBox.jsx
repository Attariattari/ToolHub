"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Rnd } from "react-rnd"

export default function CropBox({ initialCrop, onCropChange, pageWidth, pageHeight }) {
  const [crop, setCrop] = useState(initialCrop)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    console.log("CropBox: initialCrop changed to", initialCrop)
    console.log("CropBox: pageWidth", pageWidth, "pageHeight", pageHeight)
    setCrop(initialCrop)
  }, [initialCrop, pageWidth, pageHeight])

  // Ensure crop area stays within page bounds and has minimum size
  const boundedCrop = useMemo(() => {
    if (!crop) return { x: 0, y: 0, width: 100, height: 100 }

    let newX = Math.max(0, Math.min(crop.x, pageWidth - 20))
    let newY = Math.max(0, Math.min(crop.y, pageHeight - 20))

    // Ensure width/height are at least minimum size (20px)
    let newWidth = Math.max(20, crop.width)
    let newHeight = Math.max(20, crop.height)

    // Constrain width/height to page boundaries from current position
    newWidth = Math.min(newWidth, pageWidth - newX)
    newHeight = Math.min(newHeight, pageHeight - newY)

    // Re-adjust x, y if width/height push it out of bounds after min/max
    newX = Math.min(newX, pageWidth - newWidth)
    newY = Math.min(newY, pageHeight - newHeight)

    return { x: newX, y: newY, width: newWidth, height: newHeight }
  }, [crop, pageWidth, pageHeight])

  const handleDragStop = useCallback((e, d) => {
    setIsDragging(false)
    const newX = Math.max(0, Math.min(d.x, pageWidth - boundedCrop.width))
    const newY = Math.max(0, Math.min(d.y, pageHeight - boundedCrop.height))

    const finalCrop = {
      x: newX,
      y: newY,
      width: boundedCrop.width,
      height: boundedCrop.height
    }

    setCrop(finalCrop)
    onCropChange(finalCrop)
  }, [onCropChange, pageWidth, pageHeight, boundedCrop.width, boundedCrop.height])

  const handleResizeStop = useCallback((e, direction, ref, delta, position) => {
    setIsResizing(false)
    const newWidth = parseInt(ref.style.width, 10)
    const newHeight = parseInt(ref.style.height, 10)

    const finalCrop = {
      x: Math.max(0, Math.min(position.x, pageWidth - newWidth)),
      y: Math.max(0, Math.min(position.y, pageHeight - newHeight)),
      width: Math.min(newWidth, pageWidth - position.x),
      height: Math.min(newHeight, pageHeight - position.y)
    }

    setCrop(finalCrop)
    onCropChange(finalCrop)
  }, [onCropChange, pageWidth, pageHeight])

  const handleDrag = useCallback((e, d) => {
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleResize = useCallback((e, direction, ref, delta, position) => {
    if (!isResizing) setIsResizing(true)
  }, [isResizing])

  return (
    <Rnd
      size={{ width: boundedCrop.width, height: boundedCrop.height }}
      position={{ x: boundedCrop.x, y: boundedCrop.y }}
      onDragStart={() => setIsDragging(true)}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStart={() => setIsResizing(true)}
      onResize={handleResize}
      onResizeStop={handleResizeStop}
      minWidth={20}
      minHeight={20}
      maxWidth={pageWidth}
      maxHeight={pageHeight}
      bounds="parent"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      style={{
        border: "2px solid #1e90ff",
        backgroundColor: "rgba(30, 144, 255, 0.2)",
        cursor: isDragging ? "grabbing" : isResizing ? "auto" : "grab",
        zIndex: 15,
        borderRadius: "2px",
        boxShadow: "0 2px 8px rgba(30, 144, 255, 0.3)",
      }}
      resizeHandleStyles={{
        // Edge handles
        top: {
          cursor: "ns-resize",
          height: "8px",
          width: "100%",
          top: "-4px",
          left: "0",
          backgroundColor: "transparent",
          // borderTop: "2px solid #1e90ff"
        },
        right: {
          cursor: "ew-resize",
          width: "8px",
          height: "100%",
          right: "-4px",
          top: "0",
          backgroundColor: "transparent",
          // borderRight: "2px solid #1e90ff"
        },
        bottom: {
          cursor: "ns-resize",
          height: "8px",
          width: "100%",
          bottom: "-4px",
          left: "0",
          backgroundColor: "transparent",
          // borderBottom: "2px solid #1e90ff"
        },
        left: {
          cursor: "ew-resize",
          width: "8px",
          height: "100%",
          left: "-4px",
          top: "0",
          backgroundColor: "transparent",
          // borderLeft: "2px solid #1e90ff"
        },
        // Corner handles - more prominent and easier to grab
        topRight: {
          cursor: "nesw-resize",
          width: "12px",
          height: "12px",
          right: "-6px",
          top: "-6px",
          borderRadius: "50%",
          backgroundColor: "#1e90ff",
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
        bottomRight: {
          cursor: "nwse-resize",
          width: "12px",
          height: "12px",
          right: "-6px",
          bottom: "-6px",
          borderRadius: "50%",
          backgroundColor: "#1e90ff",
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
        bottomLeft: {
          cursor: "nesw-resize",
          width: "12px",
          height: "12px",
          left: "-6px",
          bottom: "-6px",
          borderRadius: "50%",
          backgroundColor: "#1e90ff",
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
        topLeft: {
          cursor: "nwse-resize",
          width: "12px",
          height: "12px",
          left: "-6px",
          top: "-6px",
          borderRadius: "50%",
          backgroundColor: "#1e90ff",
          border: "2px solid white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        },
      }}
    />
  )
}