export default function PDFComparePreview({
  // Container props
  containerRef,
  leftWidth = 50,

  // Left panel props
  leftFiles = [],
  leftZoom = 100,
  showLeftControls = false,
  setShowLeftControls,
  handleLeftZoomIn,
  handleLeftZoomOut,
  handleLeftZoomChange,

  // Right panel props
  rightFiles = [],
  rightZoom = 100,
  showRightControls = false,
  setShowRightControls,
  handleRightZoomIn,
  handleRightZoomOut,
  handleRightZoomChange,

  // Common props
  loadingPdfs = new Set(),
  pdfHealthCheck = {},
  passwordProtectedFiles = new Set(),
  removeFile,
  onDocumentLoadSuccess,
  onDocumentLoadError,

  // Resizer props
  isResizing = false,
  handleMouseDown,

  // File uploader props
  isDragging = { left: false, right: false },
  setIsDragging,
  setActiveSide,
  handleFiles,
  allowedTypes = [".pdf"],

  // Enhanced highlighting props
  comparisonComplete = false,
  showHighlights = true,
  leftDifferences = [],
  rightDifferences = [],
  onToggleHighlights,

  // Analysis props
  leftAnalysis,
  rightAnalysis,
  comparisonResult,

  // Mode props
  semanticMode = false,
  overlayMode = false,

  // Components
  PDFPreview,
  ZoomControls,
  SafeFileUploader,
}) {
  return (
    <div
      ref={containerRef}
      className="h-full w-full relative flex bg-white rounded-lg shadow-sm overflow-hidden"
    >
      {/* Left Panel */}
      <div
        style={{ width: `${leftWidth}%` }}
        className="h-full relative overflow-hidden"
        onMouseEnter={() =>
          leftFiles.length > 0 &&
          setShowLeftControls &&
          setShowLeftControls(true)
        }
        onMouseLeave={() => setShowLeftControls && setShowLeftControls(false)}
      >
        {leftFiles && leftFiles.length > 0 ? (
          <>
            {/* PDF Preview Area */}
            <div className="h-full w-full overflow-auto custom-scrollbar relative">
              {leftFiles.map((file) => {
                const totalPages = file.numPages || 1;
                const isSinglePage = totalPages === 1;
                const isFileLoading = loadingPdfs.has(file.id);

                return (
                  <div
                    key={file.id}
                    className={`relative ${isSinglePage ? "h-full" : ""}`}
                  >
                    {/* Remove button for each file */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-50">
                      <button
                        onClick={() => removeFile && removeFile(file.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg"
                      >
                        ×
                      </button>
                    </div>

                    {/* Show loading overlay for entire file while loading */}
                    {isFileLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                          <div className="text-xs sm:text-sm text-gray-600 font-medium">
                            Loading PDF...
                          </div>
                        </div>
                      </div>
                    )}

                    {Array.from({ length: totalPages }, (_, index) => {
                      const currentPageNumber = index + 1;
                      // Get current page differences for LEFT panel
                      const pageDifferences = leftDifferences.filter(
                        (diff) => diff.pageNumber === currentPageNumber
                      );
                      return (
                        <div
                          key={`${file.id}-page-${currentPageNumber}`}
                          className={`${
                            isSinglePage
                              ? leftZoom > 100
                                ? "h-auto overflow-x-auto overflow-y-hidden"
                                : "h-full flex justify-center items-center"
                              : leftZoom > 100
                              ? "mb-1 sm:mb-2 w-full"
                              : "flex justify-center mb-1 sm:mb-2"
                          }`}
                          style={{
                            width:
                              (isSinglePage && leftZoom > 100) ||
                              (leftZoom > 100 && !isSinglePage)
                                ? "max-content"
                                : "auto",
                          }}
                        >
                          {PDFPreview && (
                            <PDFPreview
                              file={file}
                              pageNumber={currentPageNumber}
                              isLoading={isFileLoading}
                              onLoadSuccess={onDocumentLoadSuccess}
                              onLoadError={onDocumentLoadError}
                              isHealthy={pdfHealthCheck[file.id] !== false}
                              isPasswordProtected={passwordProtectedFiles.has(
                                file.id
                              )}
                              showRemoveButton={false}
                              userZoom={leftZoom}
                              isSinglePage={isSinglePage}
                              style={{
                                border: "none",
                                borderRadius: "0px",
                                boxShadow: "none",
                                ...(isSinglePage
                                  ? { height: "100%", width: "100%" }
                                  : {}),
                              }}
                              // Highlighting props for LEFT panel
                              side="left"
                              comparisonComplete={comparisonComplete}
                              showHighlights={showHighlights}
                              differences={pageDifferences}
                              highlightColor="red"
                              // Analysis props
                              semanticMode={semanticMode}
                              overlayMode={overlayMode}
                              analysis={leftAnalysis}
                              comparisonResult={comparisonResult}
                              onToggleHighlights={onToggleHighlights}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Left Panel Zoom Controls */}
            {ZoomControls && (
              <ZoomControls
                zoom={leftZoom}
                onZoomIn={handleLeftZoomIn}
                onZoomOut={handleLeftZoomOut}
                onZoomChange={handleLeftZoomChange}
                show={showLeftControls}
                side="Left"
              />
            )}
          </>
        ) : (
          SafeFileUploader && (
            <SafeFileUploader
              showUploadArea={true}
              showFiles={false}
              allowedTypes={[".pdf"]}
              side="left"
              isDrag={isDragging.left}
              setIsDragging={setIsDragging}
              setActiveSide={setActiveSide}
              handleFiles={handleFiles}
              onFilesSelect={(files) => {
                handleFiles && handleFiles(files, "left");
              }}
            />
          )
        )}
      </div>

      {/* Resizer */}
      <div
        className={`w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors duration-200 relative group ${
          isResizing ? "bg-blue-500" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full"></div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full relative overflow-hidden"
        onMouseEnter={() =>
          rightFiles.length > 0 &&
          setShowRightControls &&
          setShowRightControls(true)
        }
        onMouseLeave={() => setShowRightControls && setShowRightControls(false)}
      >
        {rightFiles && rightFiles.length > 0 ? (
          <>
            {/* PDF Preview Area */}
            <div className="h-full w-full overflow-auto custom-scrollbar relative">
              {rightFiles.map((file) => {
                const totalPages = file.numPages || 1;
                const isSinglePage = totalPages === 1;
                const isFileLoading = loadingPdfs.has(file.id);
                return (
                  <div
                    key={file.id}
                    className={`relative ${isSinglePage ? "h-full" : ""}`}
                  >
                    {/* Remove button for each file */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-50">
                      <button
                        onClick={() => removeFile && removeFile(file.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg"
                      >
                        ×
                      </button>
                    </div>

                    {/* Show loading overlay for entire file while loading */}
                    {isFileLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                          <div className="text-xs sm:text-sm text-gray-600 font-medium">
                            Loading PDF...
                          </div>
                        </div>
                      </div>
                    )}

                    {Array.from({ length: totalPages }, (_, index) => {
                      const currentPageNumber = index + 1;
                      // Get current page differences for RIGHT panel
                      const pageDifferences = rightDifferences.filter(
                        (diff) => diff.pageNumber === currentPageNumber
                      );
                      return (
                        <div
                          key={`${file.id}-page-${currentPageNumber}`}
                          className={`${
                            isSinglePage
                              ? rightZoom > 100
                                ? "h-auto overflow-x-auto overflow-y-hidden"
                                : "h-full flex justify-center items-center"
                              : rightZoom > 100
                              ? "mb-1 sm:mb-2 w-full"
                              : "flex justify-center mb-1 sm:mb-2"
                          }`}
                          style={{
                            width:
                              (isSinglePage && rightZoom > 100) ||
                              (rightZoom > 100 && !isSinglePage)
                                ? "max-content"
                                : "auto",
                          }}
                        >
                          {PDFPreview && (
                            <PDFPreview
                              file={file}
                              pageNumber={currentPageNumber}
                              isLoading={isFileLoading}
                              onLoadSuccess={onDocumentLoadSuccess}
                              onLoadError={onDocumentLoadError}
                              isHealthy={pdfHealthCheck[file.id] !== false}
                              isPasswordProtected={passwordProtectedFiles.has(
                                file.id
                              )}
                              showRemoveButton={false}
                              userZoom={rightZoom}
                              isSinglePage={isSinglePage}
                              style={{
                                border: "none",
                                borderRadius: "0px",
                                boxShadow: "none",
                                ...(isSinglePage
                                  ? { height: "100%", width: "100%" }
                                  : {}),
                              }}
                              // Highlighting props for RIGHT panel
                              side="right"
                              comparisonComplete={comparisonComplete}
                              showHighlights={showHighlights}
                              differences={pageDifferences}
                              highlightColor="green"
                              // Analysis props
                              semanticMode={semanticMode}
                              overlayMode={overlayMode}
                              analysis={rightAnalysis}
                              comparisonResult={comparisonResult}
                              onToggleHighlights={onToggleHighlights}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Right Panel Zoom Controls */}
            {ZoomControls && (
              <ZoomControls
                zoom={rightZoom}
                onZoomIn={handleRightZoomIn}
                onZoomOut={handleRightZoomOut}
                onZoomChange={handleRightZoomChange}
                show={showRightControls}
                side="Right"
              />
            )}
          </>
        ) : (
          SafeFileUploader && (
            <SafeFileUploader
              showUploadArea={true}
              showFiles={false}
              allowedTypes={[".pdf"]}
              side="right"
              isDrag={isDragging.right}
              setIsDragging={setIsDragging}
              setActiveSide={setActiveSide}
              handleFiles={handleFiles}
              onFilesSelect={(files) => {
                handleFiles && handleFiles(files, "right");
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
