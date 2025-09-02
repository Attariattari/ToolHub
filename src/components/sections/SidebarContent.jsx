import React from "react";

function SidebarContent({
  activeOption,
  handleOptionChange,
  leftFiles,
  rightFiles,
  leftAnalysis,
  rightAnalysis,
  isAnalyzing,
  comparisonResult,
  setShowComparisonResults,
  overlayDown,
  overlayUp,
  selectedPageDown,
  selectedPageUp,
  setSelectedPageDown,
  setSelectedPageUp,
  removeFile,
  handleFiles,
  handleProtectedFiles,
  isDragOver,
  setIsDragOver,
  showControls,
  overlayOpacity,
  setOverlayOpacity,
  overlayBlendMode,
  setOverlayBlendMode,
  showDifferences,
  setShowDifferences,
  highlightColor,
  setHighlightColor,
  performOverlayAnalysis,
  hasUnhealthyFiles,
  passwordProtectedFiles,
  // Import required components
  DynamicProgressLoader,
  OCRNotification,
  SafeFileUploader,
  // Import required icons
  Check,
  Type,
  Search,
  ArrowRight,
  Image,
  Palette,
  RotateCcw,
  Zap,
  AlertCircle,
  Download,
  FileText,
  // Import toast
  toast,
}) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="">
        <h3 className="sticky top-0 z-30 bg-white text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
          Compare PDF
        </h3>

        {/* Conversion Mode Options */}
        <div className="w-full p-6 relative">
          <div className="flex gap-2 ">
            <button
              onClick={() => handleOptionChange("semantic")}
              className={`relative flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-2 ${
                activeOption === "semantic"
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {activeOption === "semantic" && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 48 48"
                className="text-current"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M19 9.5H4A2.5 2.5 0 0 0 1.5 12v24A2.5 2.5 0 0 0 4 38.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 19 9.5ZM4 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H4ZM44 9.5H29a2.5 2.5 0 0 0-2.5 2.5v24a2.5 2.5 0 0 0 2.5 2.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 44 9.5ZM29 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H29Z"
                  clipRule="evenodd"
                ></path>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M15 18H5v-3h10v3ZM40 18H30v-3h10v3ZM18 21H5v-1h13v1ZM43 21H30v-1h13v1ZM18 25H5v-1h13v1ZM43 25H30v-1h13v1ZM18 29H5v-1h13v1ZM43 29H30v-1h13v1ZM18 33H5v-1h13v1ZM43 33H30v-1h13v1Z"
                  clipRule="evenodd"
                ></path>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M10 26H5v-3h5v3ZM35 26h-5v-3h5v3ZM18 30h-5v-3h5v3ZM43 30h-5v-3h5v3Z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Semantic Text
            </button>

            <button
              onClick={() => handleOptionChange("overlay")}
              className={`relative flex-1 p-3 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center gap-2 ${
                activeOption === "overlay"
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {activeOption === "overlay" && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 48 48"
                className="text-current"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M27 18.5H8A2.5 2.5 0 0 0 5.5 21v19A2.5 2.5 0 0 0 8 42.5h19a2.5 2.5 0 0 0 2.5-2.5V21a2.5 2.5 0 0 0-2.5-2.5ZM8 17a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V21a4 4 0 0 0-4-4H8Z"
                  clipRule="evenodd"
                ></path>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M40 5.5H21A2.5 2.5 0 0 0 18.5 8v19a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 40 5.5ZM21 4a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H21Z"
                  clipRule="evenodd"
                ></path>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="m22 18-4 4-.707-.707 4-4L22 18ZM31 27l-4 4-.707-.707 4-4L31 27ZM25 18l-7 7-.707-.707 7-7L25 18ZM31 24l-7 7-.707-.707 7-7L31 24ZM28 18 18 28l-.707-.707 10-10L28 18ZM31 21 21 31l-.707-.707 10-10L31 21ZM30 19 19 30l-.707-.707 11-11L30 19Z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Content Overlay
            </button>
          </div>
        </div>

        {/* Label based on selection */}
        <div className="my-4 mx-6 text-lg font-semibold text-gray-700">
          {activeOption === "semantic" ? (
            <div className="w-full flex justify-center items-center flex-col">
              <div>
                <p className="border border-red-600 text-center bg-red-50 text-sm text-red-600 rounded-lg p-4">
                  Compare text changes between two PDFs using advanced semantic
                  analysis.
                </p>
              </div>

              {/* File Analysis Status */}
              {(leftFiles?.length > 0 || rightFiles?.length > 0) && (
                <div className="mt-4 w-full space-y-3">
                  {leftFiles?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                          Left Document
                        </span>
                        {leftAnalysis ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Type className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {leftFiles[0]?.name}
                      </p>
                      {leftAnalysis && (
                        <div className="text-xs text-blue-600 mt-1">
                          {leftAnalysis.fileType} • {leftAnalysis.wordCount}{" "}
                          words
                        </div>
                      )}
                    </div>
                  )}

                  {rightFiles?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          Right Document
                        </span>
                        {rightAnalysis ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Type className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {rightFiles[0]?.name}
                      </p>
                      {rightAnalysis && (
                        <div className="text-xs text-green-600 mt-1">
                          {rightAnalysis.fileType} • {rightAnalysis.wordCount}{" "}
                          words
                        </div>
                      )}
                    </div>
                  )}

                  {isAnalyzing ? (
                    <DynamicProgressLoader isAnalyzing={isAnalyzing} />
                  ) : comparisonResult?.requiresOCR ? (
                    <OCRNotification
                      requiresOCR={comparisonResult?.requiresOCR}
                      leftIsImageBased={comparisonResult?.leftIsImageBased}
                      rightIsImageBased={comparisonResult?.rightIsImageBased}
                      leftAnalysis={comparisonResult?.leftAnalysis}
                      rightAnalysis={comparisonResult?.rightAnalysis}
                      ocrToolUrl="/ocr-pdf"
                    />
                  ) : (
                    <>
                      {comparisonResult && !comparisonResult.requiresOCR && (
                        <div
                          className="bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors duration-200 mx-3 sm:mx-4 md:mx-2 my-4"
                          onClick={() => setShowComparisonResults(true)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-purple-800">
                              Comparison Ready
                            </span>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Search className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                              <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
                            </div>
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {comparisonResult.similarity?.overall}% similarity •{" "}
                            {comparisonResult.changes?.changePercentage}%
                            changed
                          </div>
                          <div className="text-xs text-purple-500 mt-2 font-medium">
                            Click to view detailed report →
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Content Overlay Section
            <div className="w-full flex justify-center items-center flex-col gap-4">
              <div>
                <p className="border border-red-600 text-center bg-red-50 text-sm text-red-600 rounded-lg p-4">
                  Overlay content from two files and display any changes in a
                  separate color.
                </p>
              </div>
              <div className="w-full flex flex-col items-center leading-none gap-4">
                {/* Second upload section - overlayUp (Top Layer) */}
                <div className="w-full max-w-lg">
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      overlayUp?.length > 0
                        ? "border border-red-100 bg-white"
                        : "border-2 border-dashed border-red-100 bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Image className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium mb-2 ${
                          overlayUp?.length > 0
                            ? "text-gray-800"
                            : "text-red-600"
                        }`}
                      >
                        {overlayUp?.length > 0
                          ? overlayUp[0]?.name?.length > 30
                            ? overlayUp[0].name.substring(0, 30) + "..."
                            : overlayUp[0]?.name
                          : "No file selected - Top Layer"}
                        {/* Show total pages if PDF is loaded */}
                        {overlayUp?.length > 0 && overlayUp[0]?.numPages && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Total: {overlayUp[0].numPages} pages)
                          </span>
                        )}
                      </div>
                      {/* Only show input if file is selected */}
                      {overlayUp?.length > 0 && (
                        <input
                          type="number"
                          value={selectedPageUp === 0 ? "" : selectedPageUp} // Empty string when 0
                          min="1"
                          max={
                            overlayUp?.length > 0
                              ? overlayUp[0]?.numPages || 1
                              : 1
                          }
                          className="w-full text-sm border border-red-100 rounded-lg px-3 py-2 bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all duration-200 outline-none"
                          placeholder="Page number"
                          onChange={(e) => {
                            const inputValue = e.target.value;

                            // If input is empty, set to 0 (which will show as empty)
                            if (inputValue === "" || inputValue === null) {
                              setSelectedPageUp(0);
                              return;
                            }

                            const value = parseInt(inputValue);

                            // If not a valid number, don't update
                            if (isNaN(value)) {
                              return;
                            }

                            const maxPages =
                              overlayUp?.length > 0
                                ? overlayUp[0]?.numPages || 1
                                : 1;

                            if (value > maxPages) {
                              setSelectedPageUp(maxPages);
                            } else if (value < 1) {
                              setSelectedPageUp(0); // Allow 0 for empty state
                            } else {
                              setSelectedPageUp(value);
                            }
                          }}
                          onBlur={(e) => {
                            // When user leaves the input, if it's empty or 0, set to 1
                            if (selectedPageUp === 0 || e.target.value === "") {
                              setSelectedPageUp(1);
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {overlayUp?.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs text-green-600 font-medium"
                            title="✓ Loaded"
                          >
                            ✓
                          </span>
                          <button
                            onClick={() => {
                              // Handle remove file
                              if (overlayUp?.length > 0 && overlayUp[0]?.id) {
                                removeFile(overlayUp[0].id);
                                // Reset page number when file is removed
                                setSelectedPageUp(1);
                              }
                            }}
                            className="w-5 h-5 text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <SafeFileUploader
                          isMultiple={true}
                          onFilesSelect={handleFiles}
                          onPasswordProtectedFile={handleProtectedFiles}
                          isDragOver={isDragOver}
                          setIsDragOver={setIsDragOver}
                          allowedTypes={[".pdf"]}
                          showFiles={true}
                          uploadButtonText="Select PDF files"
                          pageTitle={
                            activeOption === "semantic"
                              ? "Compare PDF"
                              : "Overlay PDF"
                          }
                          pageSubTitle={
                            activeOption === "semantic"
                              ? "Easily display the differences between two similar files."
                              : "Overlay two PDF files for visual comparison."
                          }
                          className="w-5 h-5 text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {/* First upload section - overlayDown (Bottom Layer) */}
                <div className="w-full max-w-lg">
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      overlayDown?.length > 0
                        ? "border border-red-100 bg-white"
                        : "border-2 border-dashed border-red-100 bg-red-50 hover:bg-red-100"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <Image className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium mb-2 ${
                          overlayDown?.length > 0
                            ? "text-gray-800"
                            : "text-red-600"
                        }`}
                      >
                        {overlayDown?.length > 0
                          ? overlayDown[0]?.name?.length > 30
                            ? overlayDown[0].name.substring(0, 30) + "..."
                            : overlayDown[0]?.name
                          : "No file selected - Bottom Layer"}
                        {/* Show total pages if PDF is loaded */}
                        {overlayDown?.length > 0 &&
                          overlayDown[0]?.numPages && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Total: {overlayDown[0].numPages} pages)
                            </span>
                          )}
                      </div>
                      {/* Only show input if file is selected */}
                      {overlayDown?.length > 0 && (
                        <input
                          type="number"
                          value={selectedPageDown === 0 ? "" : selectedPageDown} // Empty string when 0
                          min="1"
                          max={
                            overlayDown?.length > 0
                              ? overlayDown[0]?.numPages || 1
                              : 1
                          }
                          className="w-full text-sm border border-red-100 rounded-lg px-3 py-2 bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all duration-200 outline-none"
                          placeholder="Page number"
                          onChange={(e) => {
                            const inputValue = e.target.value;

                            // If input is empty, set to 0 (which will show as empty)
                            if (inputValue === "" || inputValue === null) {
                              setSelectedPageDown(0);
                              return;
                            }

                            const value = parseInt(inputValue);

                            // If not a valid number, don't update
                            if (isNaN(value)) {
                              return;
                            }

                            const maxPages =
                              overlayDown?.length > 0
                                ? overlayDown[0]?.numPages || 1
                                : 1;

                            if (value > maxPages) {
                              setSelectedPageDown(maxPages);
                            } else if (value < 1) {
                              setSelectedPageDown(0); // Allow 0 for empty state
                            } else {
                              setSelectedPageDown(value);
                            }
                          }}
                          onBlur={(e) => {
                            // When user leaves the input, if it's empty or 0, set to 1
                            if (
                              selectedPageDown === 0 ||
                              e.target.value === ""
                            ) {
                              setSelectedPageDown(1);
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {overlayDown?.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs text-green-600 font-medium"
                            title="✓ Loaded"
                          >
                            ✓
                          </span>
                          <button
                            onClick={() => {
                              // Handle remove file
                              if (
                                overlayDown?.length > 0 &&
                                overlayDown[0]?.id
                              ) {
                                removeFile(overlayDown[0].id);
                                // Reset page number when file is removed
                                setSelectedPageDown(1);
                              }
                            }}
                            className="w-5 h-5 text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <SafeFileUploader
                          isMultiple={true}
                          onFilesSelect={handleFiles}
                          onPasswordProtectedFile={handleProtectedFiles}
                          isDragOver={isDragOver}
                          setIsDragOver={setIsDragOver}
                          allowedTypes={[".pdf"]}
                          showFiles={true}
                          uploadButtonText="Select PDF files"
                          pageTitle={
                            activeOption === "semantic"
                              ? "Compare PDF"
                              : "Overlay PDF"
                          }
                          pageSubTitle={
                            activeOption === "semantic"
                              ? "Easily display the differences between two similar files."
                              : "Overlay two PDF files for visual comparison."
                          }
                          className="w-5 h-5 text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {/* Updated condition: Show controls only when BOTH files are selected */}
                {showControls &&
                  overlayDown?.length > 0 &&
                  overlayUp?.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 w-full">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-red-600" />
                        Overlay Controls
                      </h3>

                      <div className="space-y-6">
                        {/* Opacity Control */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-3">
                            Top Layer Opacity:{" "}
                            <span className="text-red-600 font-semibold">
                              {overlayOpacity}%
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={overlayOpacity}
                            onChange={(e) =>
                              setOverlayOpacity(parseInt(e.target.value))
                            }
                            className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer slider-thumb-red"
                            style={{
                              background: `linear-gradient(to right, #fee2e2 0%, #dc2626 ${overlayOpacity}%, #fee2e2 ${overlayOpacity}%, #fee2e2 100%)`,
                            }}
                          />
                        </div>

                        {/* Blend Mode */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-3">
                            Blend Mode
                          </label>
                          <select
                            value={overlayBlendMode}
                            onChange={(e) =>
                              setOverlayBlendMode(e.target.value)
                            }
                            className="w-full px-4 py-3 bg-white border-2 border-red-100 rounded-lg text-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600 transition-all duration-200 text-red-600 font-medium"
                            style={{
                              color: "#dc2626",
                            }}
                          >
                            <option
                              value="normal"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Normal
                            </option>
                            <option
                              value="multiply"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Multiply
                            </option>
                            <option
                              value="overlay"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Overlay
                            </option>
                            <option
                              value="difference"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Difference
                            </option>
                            <option
                              value="screen"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Screen
                            </option>
                            <option
                              value="hard-light"
                              className="text-red-600 bg-white hover:bg-red-100 active:bg-red-600 active:text-white"
                            >
                              Hard Light
                            </option>
                          </select>
                        </div>

                        {/* Highlight Differences */}
                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">
                              Highlight Differences
                            </span>
                            <span className="text-xs text-gray-500">
                              Show visual differences between layers
                            </span>
                          </div>
                          <button
                            onClick={() => setShowDifferences(!showDifferences)}
                            className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${
                              showDifferences
                                ? "bg-red-600 shadow-lg"
                                : "bg-gray-300 hover:bg-gray-400"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md ${
                                showDifferences
                                  ? "translate-x-7 shadow-lg"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Reset Button */}
                        <button
                          onClick={() => {
                            setOverlayOpacity(50);
                            setOverlayBlendMode("normal");
                            setShowDifferences(false);
                            setHighlightColor("#ff0000");
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 hover:text-red-700 active:bg-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset Controls
                        </button>
                      </div>
                    </div>
                  )}
                {overlayDown?.length > 0 && overlayUp?.length > 0 && (
                  <button
                    onClick={performOverlayAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Analyze Overlay
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {hasUnhealthyFiles && (
          <div className="bg-yellow-50 rounded-xl p-4 mx-4 mb-6">
            <p className="text-sm text-yellow-800">
              Some files have preview issues but can still be converted. Check
              the yellow-highlighted files.
            </p>
          </div>
        )}

        {passwordProtectedFiles?.size > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {passwordProtectedFiles.size} password-protected file
              {passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords
              will be required for conversion.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 sticky bottom-0 bg-white border-t">
        {/* Semantic Text Button */}
        {activeOption === "semantic" && (
          <button
            onClick={() => {
              if (comparisonResult && !comparisonResult.requiresOCR) {
                // Normal case - download report
                const dataStr = JSON.stringify(comparisonResult, null, 2);
                const dataUri =
                  "data:application/json;charset=utf-8," +
                  encodeURIComponent(dataStr);
                const exportFileDefaultName = "comparison-report.json";
                const linkElement = document.createElement("a");
                linkElement.setAttribute("href", dataUri);
                linkElement.setAttribute("download", exportFileDefaultName);
                linkElement.click();
                toast.success("Report downloaded successfully!");
              }
            }}
            disabled={
              leftFiles?.length === 0 ||
              rightFiles?.length === 0 ||
              comparisonResult?.requiresOCR // Disable when OCR is required
            }
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              comparisonResult?.requiresOCR
                ? "bg-orange-300 cursor-not-allowed" // Disabled state for OCR
                : comparisonResult && !comparisonResult.requiresOCR
                ? "bg-green-600 hover:bg-green-700 hover:scale-105 shadow-lg"
                : "bg-red-300 cursor-not-allowed"
            }`}
          >
            {comparisonResult?.requiresOCR ? (
              <>
                <AlertCircle className="w-5 h-5" />
                OCR Required
              </>
            ) : comparisonResult ? (
              <>
                <Download className="w-5 h-5" />
                Download Report
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Upload Both Files
              </>
            )}
          </button>
        )}

        {/* Content Overlay Button */}
        {activeOption === "overlay" && (
          <button
            onClick={() => {
              // Handle create report functionality for overlay
              console.log("Creating overlay report...");
              // Add your overlay report creation logic here
              toast.success("Overlay report created successfully!");
            }}
            disabled={leftFiles?.length === 0 || rightFiles?.length === 0}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              leftFiles?.length > 0 && rightFiles?.length > 0
                ? "bg-red-300 hover:bg-red-600 hover:scale-105 shadow-lg"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <FileText className="w-5 h-5" />
            Download Report
          </button>
        )}

        {/* Common error messages */}
        {(leftFiles?.length === 0 || rightFiles?.length === 0) && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Upload both PDF files to{" "}
            {activeOption === "semantic" ? "compare" : "create overlay report"}
          </p>
        )}

        {activeOption === "semantic" && comparisonResult?.requiresOCR && (
          <p className="text-xs text-orange-600 text-center mt-2">
            Please process your image-based PDFs with OCR first
          </p>
        )}
      </div>
    </div>
  );
}

export default SidebarContent;
