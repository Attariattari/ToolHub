import React from "react";

const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onFitToWidth,
  show = true,
  zoomLevels = [25, 50, 75, 100, 125, 150, 200, 250, 300],
  minZoom = 25,
  maxZoom = 300,
  className = "",
}) => {
  if (!show) return null;

  return (
    <div
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-40 ${className}`}
    >
      <div className="bg-gray-800 text-white rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
        {/* Zoom Out Button */}
        <button
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        {/* Zoom Percentage Display */}
        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
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

        {/* Zoom In Button */}
        <button
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Fit to Width Button */}
        <button
          onClick={onFitToWidth || (() => onZoomChange(100))}
          className="px-3 py-1 text-xs rounded hover:bg-gray-700 transition-colors border border-gray-600"
          title="Fit to Width"
        >
          Fit
        </button>
      </div>
    </div>
  );
};

export default ZoomControls;
