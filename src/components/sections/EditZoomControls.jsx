import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Download,
  Layout,
  X,
  MoreHorizontal,
} from "lucide-react";

const EditZoomControls = ({
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
  onLayoutChange,
  currentLayout = "magazine",
  show = true,
  zoomLevels = [25, 50, 75, 100, 125, 150, 200, 250, 300],
  minZoom = 25,
  maxZoom = 300,
  className = "",
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLayoutPopup, setShowLayoutPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const layoutPopupRef = useRef(null);
  const layoutButtonRef = useRef(null);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const layoutOptions = [
    {
      id: "magazine",
      name: "Magazine View",
      description: "Interactive page view with thumbnails",
      icon: (
        <div className="w-5 h-5 flex flex-col gap-0.5 items-center justify-center">
          <div className="w-4 h-1.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-sm"></div>
          <div className="flex gap-0.5">
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
        <div className="w-5 h-5 flex flex-col gap-0.5 items-center justify-center">
          <div className="w-3 h-1 bg-gray-400 rounded-sm"></div>
          <div className="w-3 h-1 bg-gray-400 rounded-sm"></div>
          <div className="w-3 h-1 bg-gray-400 rounded-sm"></div>
        </div>
      ),
    },
    {
      id: "spread",
      name: "Two Page Spread",
      description: "Show two pages side by side",
      icon: (
        <div className="w-5 h-5 flex gap-0.5 items-center justify-center">
          <div className="w-1.5 h-3 bg-gray-400 rounded-sm"></div>
          <div className="w-1.5 h-3 bg-gray-400 rounded-sm"></div>
        </div>
      ),
    },
  ];

  // Mobile/Compact Layout
  if (isMobile || compact) {
    return (
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-2xl border border-gray-700/50 mx-4">
          {/* Mobile Main Row */}
          <div className="flex items-center justify-between px-3 py-2.5">
            {/* Page Navigation - Compact */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Previous"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs bg-gray-800/50 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={currentPage}
                  onChange={handlePageInput}
                  min={1}
                  max={totalPages}
                  className="w-8 bg-transparent text-white text-center text-xs focus:outline-none"
                />
                <span className="text-gray-400">/</span>
                <span className="text-gray-300 font-medium">{totalPages}</span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Next"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls - Compact */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onZoomOut}
                disabled={zoom <= minZoom}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <select
                value={zoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="bg-gray-800/50 text-white text-xs rounded-lg px-2 py-1 border border-gray-600/50 focus:outline-none focus:border-blue-500 min-w-[3.5rem]"
              >
                {zoomLevels.map((level) => (
                  <option key={level} value={level} className="bg-gray-800">
                    {level}%
                  </option>
                ))}
                {!zoomLevels.includes(zoom) && (
                  <option value={zoom} className="bg-gray-800">
                    {zoom}%
                  </option>
                )}
              </select>

              <button
                onClick={onZoomIn}
                disabled={zoom >= maxZoom}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* More Options */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all active:scale-95"
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Expanded Options */}
          {isExpanded && (
            <div className="border-t border-gray-700/50 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onFitToWidth || (() => onZoomChange(100))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50 active:scale-95"
                  title="Fit to Width"
                >
                  <Maximize2 className="w-3 h-3" />
                  Fit
                </button>

                <div className="relative">
                  <button
                    ref={layoutButtonRef}
                    onClick={() => setShowLayoutPopup(!showLayoutPopup)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50 active:scale-95"
                    title="Layout"
                  >
                    <Layout className="w-3 h-3" />
                    Layout
                  </button>
                </div>

                <button
                  onClick={onDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50 active:scale-95"
                  title="Download"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Layout Popup for Mobile */}
          {showLayoutPopup && (
            <div
              ref={layoutPopupRef}
              className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
            >
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Page Layout
                  </h3>
                  <button
                    onClick={() => setShowLayoutPopup(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="py-1">
                {layoutOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleLayoutChange(option.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all text-left active:scale-95 ${
                      currentLayout === option.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="flex-shrink-0">{option.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{option.name}</div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                    {currentLayout === option.id && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-xl shadow-2xl border border-gray-700/50">
        {/* Desktop Main Controls */}
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title="Previous Page"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg px-2.5 py-1.5">
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                min={1}
                max={totalPages}
                className="w-12 bg-transparent text-white text-center text-sm focus:outline-none"
              />
              <span className="text-gray-400">/</span>
              <span className="text-gray-300 font-medium min-w-[1.5rem] text-center">
                {totalPages}
              </span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title="Next Page"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600/50"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onZoomOut}
              disabled={zoom <= minZoom}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <select
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="bg-gray-800/50 text-white text-sm font-medium rounded-lg px-2.5 py-1.5 border border-gray-600/50 focus:outline-none focus:border-blue-500 min-w-[4rem] transition-all"
            >
              {zoomLevels.map((level) => (
                <option key={level} value={level} className="bg-gray-800">
                  {level}%
                </option>
              ))}
              {!zoomLevels.includes(zoom) && (
                <option value={zoom} className="bg-gray-800">
                  {zoom}%
                </option>
              )}
            </select>

            <button
              onClick={onZoomIn}
              disabled={zoom >= maxZoom}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600/50"></div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onFitToWidth || (() => onZoomChange(100))}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50 font-medium flex items-center gap-1.5 active:scale-95"
              title="Fit to Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Fit</span>
            </button>

            <div className="relative">
              <button
                ref={layoutButtonRef}
                onClick={() => setShowLayoutPopup(!showLayoutPopup)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all active:scale-95"
                title="Page Layout"
              >
                <Layout className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-all active:scale-95"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Expanded Options */}
        {isExpanded && (
          <div className="border-t border-gray-700/50 px-4 py-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700/50 transition-all border border-gray-600/50 active:scale-95"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 mr-1">Quick:</span>
                {[50, 100, 150, 200].map((level) => (
                  <button
                    key={level}
                    onClick={() => onZoomChange(level)}
                    className={`px-2 py-1 text-xs rounded-lg transition-all active:scale-95 ${
                      zoom === level
                        ? "bg-blue-600 text-white shadow-lg"
                        : "hover:bg-gray-700/50 text-gray-300 border border-gray-600/50"
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layout Popup - Responsive */}
        {showLayoutPopup && (
          <div
            ref={layoutPopupRef}
            className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Page Layout
                </h3>
                <button
                  onClick={() => setShowLayoutPopup(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-1">
              {layoutOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleLayoutChange(option.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all text-left active:scale-[0.98] ${
                    currentLayout === option.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.name}</div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  {currentLayout === option.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditZoomControls;
