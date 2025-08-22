import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Download,
  FileText,
  Layout,
  X,
  Focus,
  Monitor,
  BookOpen,
} from "lucide-react";

const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFitToWidth,
  onRotateLeft,
  onRotateRight,
  onDownload,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onLayoutChange, // New prop for layout changes
  currentLayout = "magazine", // Changed default to magazine
  show = true,
  zoomLevels = [25, 50, 75, 100, 125, 150, 200, 250, 300],
  minZoom = 25,
  maxZoom = 300,
  className = "",
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLayoutPopup, setShowLayoutPopup] = useState(false);
  const layoutPopupRef = useRef(null);
  const layoutButtonRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        layoutPopupRef.current &&
        !layoutPopupRef.current.contains(event.target) &&
        layoutButtonRef.current &&
        !layoutButtonRef.current.contains(event.target)
      ) {
        setShowLayoutPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!show) return null;

  const handlePreviousPage = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInput = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const handleLayoutChange = (layoutType) => {
    if (onLayoutChange) {
      onLayoutChange(layoutType);
    }
    setShowLayoutPopup(false);
  };

  // Updated layout options with new Magazine layout
  const layoutOptions = [
    {
      id: "magazine",
      name: "Magazine View",
      description: "Interactive page view with thumbnails",
      icon: (
        <div className="w-6 h-6 flex flex-col gap-1 items-center justify-center">
          <div className="w-5 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-sm"></div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      ),
    },
    {
      id: "continuous",
      name: "Continuous",
      description: "Show all pages vertically",
      icon: (
        <div className="w-6 h-6 flex flex-col gap-1 items-center justify-center">
          <div className="w-4 h-1.5 bg-gray-400 rounded-sm"></div>
          <div className="w-4 h-1.5 bg-gray-400 rounded-sm"></div>
          <div className="w-4 h-1.5 bg-gray-400 rounded-sm"></div>
        </div>
      ),
    },
    {
      id: "spread",
      name: "Two Page Spread",
      description: "Show two pages side by side",
      icon: (
        <div className="w-6 h-6 flex gap-1 items-center justify-center">
          <div className="w-2 h-4 bg-gray-400 rounded-sm"></div>
          <div className="w-2 h-4 bg-gray-400 rounded-sm"></div>
        </div>
      ),
    },
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          className="w-8 h-8 flex items-center justify-center rounded bg-white shadow hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Display */}
        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="px-2 py-1 text-sm bg-white border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {zoomLevels.map((level) => (
            <option key={level} value={level}>
              {level}%
            </option>
          ))}
        </select>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          className="w-8 h-8 flex items-center justify-center rounded bg-white shadow hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700">
        {/* Main Controls Row */}
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                min={1}
                max={totalPages}
                className="w-12 bg-gray-700 text-white text-center text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 py-1"
              />
              <span className="text-gray-400">/</span>
              <span className="text-gray-300 font-medium min-w-[2rem] text-center">
                {totalPages}
              </span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onZoomOut}
              disabled={zoom <= minZoom}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <select
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="bg-gray-700 text-white text-sm font-medium rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500 min-w-[4rem]"
            >
              {zoomLevels.map((level) => (
                <option key={level} value={level} className="bg-gray-700">
                  {level}%
                </option>
              ))}
              {!zoomLevels.includes(zoom) && (
                <option value={zoom} className="bg-gray-700">
                  {zoom}%
                </option>
              )}
            </select>

            <button
              onClick={onZoomIn}
              disabled={zoom >= maxZoom}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600"></div>

          {/* Fit to Width */}
          <button
            onClick={onFitToWidth || (() => onZoomChange(100))}
            className="px-3 py-1 text-xs rounded hover:bg-gray-700 transition-colors border border-gray-600 font-medium"
            title="Fit to Width"
          >
            <Maximize2 className="w-3 h-3 inline mr-1" />
            Fit
          </button>

          {/* Layout Options */}
          <div className="relative">
            <button
              ref={layoutButtonRef}
              onClick={() => setShowLayoutPopup(!showLayoutPopup)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
              title="Page Layout"
            >
              <Layout className="w-4 h-4" />
            </button>

            {/* Layout Popup */}
            {showLayoutPopup && (
              <div
                ref={layoutPopupRef}
                className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
              >
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-800">
                      Page Layout
                    </h3>
                    <button
                      onClick={() => setShowLayoutPopup(false)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="py-1">
                  {layoutOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleLayoutChange(option.id)}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                        currentLayout === option.id
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="flex-shrink-0">{option.icon}</div>
                      <div>
                        <div className="text-sm font-medium">{option.name}</div>
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      </div>
                      {currentLayout === option.id && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* More Options Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
            title="More Options"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <div className="border-t border-gray-700 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Download */}
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-700 transition-colors border border-gray-600"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              {/* Quick Zoom Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 mr-2">Quick:</span>
                {[50, 100, 150, 200].map((level) => (
                  <button
                    key={level}
                    onClick={() => onZoomChange(level)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      zoom === level
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomControls;
