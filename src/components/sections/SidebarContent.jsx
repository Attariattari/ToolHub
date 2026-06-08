import React, { useState } from "react";
import { toast } from "react-toastify";
import { pdfjs } from "react-pdf";
import {
  CheckCircle,
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
  Files,
  Layers,
  Loader2,
} from "lucide-react";
import SafeFileUploader from "../tools/SafeFileUploader";
import OCRNotification from "./OCRNotification";

// Reusable components
const OptionButton = ({ option, activeOption, handleOptionChange, icon: Icon, label }) => (
  <div
    onClick={() => handleOptionChange(option)}
    className={`relative w-1/2 h-28 flex flex-col justify-center items-center rounded-lg gap-2 cursor-pointer transition-all ${activeOption === option ? "bg-blue-100 border" : "bg-white border border-gray-300"
      }`}
  >
    {activeOption === option && (
      <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
        <CheckCircle className="w-3 h-3 text-white" />
      </div>
    )}
    <div className="flex flex-col items-center leading-none">
      <Icon className={`w-12 h-8 ${activeOption === option ? "text-blue-600" : "text-gray-500"}`} />
      <p className={`text-sm font-medium ${activeOption === option ? "text-blue-600" : "text-gray-500"}`}>{label}</p>
    </div>
  </div>
);

const FileStatus = ({ file, analysis, color, label }) => (
  <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3`}>
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium text-${color}-800`}>{label}</span>
      {analysis ? <CheckCircle className={`w-4 h-4 text-green-500`} /> : <Type className={`w-4 h-4 text-${color}-500`} />}
    </div>
    <p className={`text-xs text-${color}-600 mt-1`}>{file?.name}</p>
    {analysis && (
      <div className={`text-xs text-${color}-600 mt-1`}>
        {analysis.fileType} • {analysis.wordCount} words
      </div>
    )}
  </div>
);

const FileUploader = ({ files, maxPages, selectedPage, setSelectedPage, removeFile, handleFiles, handleProtectedFiles, isDragOver, setIsDragOver, layer }) => (
  <div className={`flex items-center w-full gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${files?.length > 0 ? "border border-blue-100 bg-white" : "border-2 border-dashed border-blue-100 bg-blue-50 hover:bg-blue-100"
    }`}>
    <Image className="w-6 h-6 text-blue-600 flex-shrink-0" />
    <div className="flex-1">
      <div className={`text-sm font-medium mb-2 ${files?.length > 0 ? "text-gray-800" : "text-blue-600"}`}>
        {files?.length > 0 ?
          (files[0]?.name?.length > 30 ? `${files[0].name.substring(0, 30)}...` : files[0]?.name) :
          `No file selected - ${layer} Layer`
        }
        {files?.length > 0 && files[0]?.numPages && (
          <span className="text-xs text-gray-500 ml-2">(Total: {files[0].numPages} pages)</span>
        )}
      </div>
      {files?.length > 0 && (
        <input
          type="number"
          value={selectedPage === 0 ? "" : selectedPage}
          min="1"
          max={maxPages || 1}
          className="w-full text-sm border border-blue-100 rounded-lg px-3 py-2 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
          placeholder="Page number"
          onChange={(e) => {
            const value = e.target.value === "" ? 0 : parseInt(e.target.value);
            if (isNaN(value)) return;
            setSelectedPage(value > maxPages ? maxPages : value < 1 ? 0 : value);
          }}
          onBlur={() => selectedPage === 0 && setSelectedPage(1)}
        />
      )}
    </div>
    <div className="flex-shrink-0">
      {files?.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 font-medium" title="✓ Loaded">✓</span>
          <button
            onClick={() => { removeFile(files[0].id); setSelectedPage(1); }}
            className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
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
          pageTitle="Overlay PDF"
          pageSubTitle="Overlay two PDF files for visual comparison."
          className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
        />
      )}
    </div>
  </div>
);

const OverlayControls = ({ state, updateState }) => (
  <div className="w-full">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Palette className="w-5 h-5 text-blue-600" />
      Overlay Controls
    </h3>
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-3">
          Top Layer Opacity: <span className="text-blue-600 font-semibold">{state.overlayOpacity}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={state.overlayOpacity}
          onChange={(e) => updateState({ overlayOpacity: parseInt(e.target.value) })}
          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #fee2e2 0%, #dc2626 ${state.overlayOpacity}%, #fee2e2 ${state.overlayOpacity}%, #fee2e2 100%)`
          }}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-3">Blend Mode</label>
        <select
          value={state.overlayBlendMode}
          onChange={(e) => updateState({ overlayBlendMode: e.target.value })}
          className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all duration-200 text-blue-600 font-medium"
          style={{ color: "#dc2626" }}
        >
          {["normal", "multiply", "overlay", "difference", "screen", "hard-light"].map((mode) => (
            <option key={mode} value={mode} className="text-blue-600 bg-white hover:bg-blue-100">
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <span className="text-sm font-medium text-gray-900 block">Highlight Differences</span>
          <span className="text-xs text-gray-500">Show visual differences between layers</span>
        </div>
        <button
          onClick={() => updateState({ showDifferences: !state.showDifferences })}
          className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${state.showDifferences ? "bg-blue-600 shadow-lg" : "bg-gray-300 hover:bg-gray-400"
            }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md ${state.showDifferences ? "translate-x-7" : "translate-x-1"
            }`} />
        </button>
      </div>
      <button
        onClick={() => updateState({
          overlayOpacity: 50,
          overlayBlendMode: "normal",
          showDifferences: false,
          highlightColor: "#ff0000"
        })}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Controls
      </button>
    </div>
  </div>
);

const ComparisonButton = ({ isLoading, disabled, onClick, label, icon: Icon, loadingText = "Processing..." }) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${disabled || isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
      }`}
  >
    {isLoading ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        {loadingText}
      </>
    ) : (
      <>
        <Icon className="w-5 h-5" />
        {label}
      </>
    )}
  </button>
);

const DynamicProgressLoader = ({ isAnalyzing }) => {
  if (!isAnalyzing) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mx-3 sm:mx-4 md:mx-2 my-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 absolute top-0 left-0"></div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-blue-800 mb-1">Analyzing Documents...</div>
          <div className="text-xs text-blue-600">Report is under process, please wait</div>
        </div>
      </div>
    </div>
  );
};

const SidebarContent = ({
  state,
  updateState,
  handleOptionChange,
  removeFile,
  handleFiles,
  handleProtectedFiles,
  performOverlayAnalysis,
  hasUnhealthyFiles,
  onExportReport,
  onDownloadOverlayReport
}) => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <h3 className="sticky top-0 z-30 bg-white text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
          Compare PDF
        </h3>

        <div className="w-full border border-gray-200 rounded-t overflow-hidden flex p-4 gap-4">
          <OptionButton
            option="semantic"
            activeOption={state.activeOption}
            handleOptionChange={handleOptionChange}
            icon={Files}
            label="Semantic Text"
          />
          <OptionButton
            option="overlay"
            activeOption={state.activeOption}
            handleOptionChange={handleOptionChange}
            icon={Layers}
            label="Content Overlay"
          />
        </div>

        <div className="my-4 px-6 text-lg font-semibold text-gray-700">
          {state.activeOption === "semantic" ? (
            <div className="w-full flex flex-col items-center">
              <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
                Compare text changes between two PDFs using advanced semantic analysis.
              </p>

              {(state.leftFiles?.length > 0 || state.rightFiles?.length > 0) && (
                <div className="mt-4 w-full space-y-3">
                  {state.leftFiles?.length > 0 && (
                    <FileStatus
                      file={state.leftFiles[0]}
                      analysis={state.leftAnalysis}
                      color="blue"
                      label="Left Document"
                    />
                  )}
                  {state.rightFiles?.length > 0 && (
                    <FileStatus
                      file={state.rightFiles[0]}
                      analysis={state.rightAnalysis}
                      color="green"
                      label="Right Document"
                    />
                  )}

                  {state.isAnalyzing ? (
                    <DynamicProgressLoader isAnalyzing={state.isAnalyzing} />
                  ) : state.comparisonResult?.requiresOCR ? (
                    <OCRNotification
                      requiresOCR={state.comparisonResult?.requiresOCR}
                      leftIsImageBased={state.comparisonResult?.leftIsImageBased}
                      rightIsImageBased={state.comparisonResult?.rightIsImageBased}
                      leftAnalysis={state.comparisonResult?.leftAnalysis}
                      rightAnalysis={state.comparisonResult?.rightAnalysis}
                      ocrToolUrl="/ocr-pdf"
                    />
                  ) : (
                    state.comparisonResult && !state.comparisonResult.requiresOCR && (
                      <div
                        className="bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors duration-200 my-4"
                        onClick={() => updateState({ showComparisonResults: true })}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-purple-800">Comparison Ready</span>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Search className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                            <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
                          </div>
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          {state.comparisonResult.similarity?.overall}% similarity • {state.comparisonResult.changes?.changePercentage}% changed
                        </div>
                        <div className="text-xs text-purple-500 mt-2 font-medium">Click to view detailed report →</div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4">
              <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
                Overlay content from two files and display any changes in a separate color.
              </p>

              <div className="w-full flex flex-col items-center gap-4 max-w-lg">
                <FileUploader
                  files={state.overlayUp}
                  maxPages={state.overlayUp?.[0]?.numPages}
                  selectedPage={state.selectedPageUp}
                  setSelectedPage={(page) => updateState({ selectedPageUp: page })}
                  removeFile={removeFile}
                  handleFiles={handleFiles}
                  handleProtectedFiles={handleProtectedFiles}
                  isDragOver={state.isDragOver}
                  setIsDragOver={(isDragOver) => updateState({ isDragOver })}
                  layer="Top"
                />

                <FileUploader
                  files={state.overlayDown}
                  maxPages={state.overlayDown?.[0]?.numPages}
                  selectedPage={state.selectedPageDown}
                  setSelectedPage={(page) => updateState({ selectedPageDown: page })}
                  removeFile={removeFile}
                  handleFiles={handleFiles}
                  handleProtectedFiles={handleProtectedFiles}
                  isDragOver={state.isDragOver}
                  setIsDragOver={(isDragOver) => updateState({ isDragOver })}
                  layer="Bottom"
                />

                {state.showControls && state.overlayDown?.length > 0 && state.overlayUp?.length > 0 && (
                  <OverlayControls state={state} updateState={updateState} />
                )}
              </div>
            </div>
          )}
        </div>

        {hasUnhealthyFiles && (
          <div className="bg-yellow-50 rounded-xl p-4 mx-4 mb-6">
            <p className="text-sm text-yellow-800">
              Some files have preview issues but can still be converted. Check the yellow-highlighted files.
            </p>
          </div>
        )}

        {state.passwordProtectedFiles?.size > 0 && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {state.passwordProtectedFiles.size} password-protected file{state.passwordProtectedFiles.size > 1 ? "s" : ""} detected.
              Passwords will be required for conversion.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 sticky bottom-0 bg-white border-t">
        {state.activeOption === "semantic" ? (
          <ComparisonButton
            isLoading={state.isExportingReport}
            disabled={
              state.leftFiles?.length === 0 ||
              state.rightFiles?.length === 0 ||
              state.comparisonResult?.requiresOCR ||
              !state.comparisonResult
            }
            onClick={onExportReport}
            label={
              state.comparisonResult?.requiresOCR ? "OCR Required" :
                state.leftFiles?.length > 0 && state.rightFiles?.length > 0 && state.comparisonResult ? "Export Report" :
                  "Upload Both Files"
            }
            icon={
              state.comparisonResult?.requiresOCR ? AlertCircle :
                state.leftFiles?.length > 0 && state.rightFiles?.length > 0 && state.comparisonResult ? Download :
                  ArrowRight
            }
            loadingText="Exporting Report..."
          />
        ) : (
          <ComparisonButton
            isLoading={state.isDownloadingReport}
            disabled={state.overlayDown?.length === 0 || state.overlayUp?.length === 0}
            onClick={onDownloadOverlayReport}
            label="Download Report"
            icon={FileText}
            loadingText="Generating Report..."
          />
        )}

        {/* Help text */}
        {(state.leftFiles?.length === 0 || state.rightFiles?.length === 0) && state.activeOption === "semantic" && (
          <p className="text-xs text-gray-500 text-center mt-2">Upload both PDF files to compare</p>
        )}
        {(state.overlayDown?.length === 0 || state.overlayUp?.length === 0) && state.activeOption === "overlay" && (
          <p className="text-xs text-gray-500 text-center mt-2">Upload both PDF files to create overlay report</p>
        )}
        {state.activeOption === "semantic" && state.comparisonResult?.requiresOCR && (
          <p className="text-xs text-orange-600 text-center mt-2">Please process your image-based PDFs with OCR first</p>
        )}
      </div>

      <style jsx>{`
        .slider-thumb-red::-webkit-slider-thumb {
          background: #dc2626;
          border-radius: 50%;
          height: 16px;
          width: 16px;
          cursor: pointer;
        }
        .slider-thumb-red::-moz-range-thumb {
          background: #dc2626;
          border-radius: 50%;
          height: 16px;
          width: 16px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default SidebarContent;

// import React, { useState } from "react";
// import { toast } from "react-toastify";
// import Api from "@/utils/Api";
// import {
//   CheckCircle,
//   Type,
//   Search,
//   ArrowRight,
//   Image,
//   Palette,
//   RotateCcw,
//   Zap,
//   AlertCircle,
//   Download,
//   FileText,
//   Files,
//   Layers,
// } from "lucide-react";
// import { pdfjs } from "react-pdf";
// import SafeFileUploader from "../tools/SafeFileUploader";


// // Reusable components
// const OptionButton = ({ option, activeOption, handleOptionChange, icon: Icon, label }) => (
//   <div
//     onClick={() => handleOptionChange(option)}
//     className={`relative w-1/2 h-28 flex flex-col justify-center items-center rounded-lg gap-2 cursor-pointer transition-all ${activeOption === option ? "bg-blue-100 border" : "bg-white border border-gray-300"
//       }`}
//   >
//     {activeOption === option && (
//       <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
//         <CheckCircle className="w-3 h-3 text-white" />
//       </div>
//     )}
//     <div className="flex flex-col items-center leading-none">
//       <Icon className={`w-12 h-8 ${activeOption === option ? "text-blue-600" : "text-gray-500"}`} />
//       <p className={`text-sm font-medium ${activeOption === option ? "text-blue-600" : "text-gray-500"}`}>{label}</p>
//     </div>
//   </div>
// );

// const FileStatus = ({ file, analysis, color, label }) => (
//   <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3`}>
//     <div className="flex items-center justify-between">
//       <span className={`text-sm font-medium text-${color}-800`}>{label}</span>
//       {analysis ? <CheckCircle className={`w-4 h-4 text-green-500`} /> : <Type className={`w-4 h-4 text-${color}-500`} />}
//     </div>
//     <p className={`text-xs text-${color}-600 mt-1`}>{file?.name}</p>
//     {analysis && (
//       <div className={`text-xs text-${color}-600 mt-1`}>
//         {analysis.fileType} • {analysis.wordCount} words
//       </div>
//     )}
//   </div>
// );

// const FileUploader = ({ files, setFiles, maxPages, selectedPage, setSelectedPage, removeFile, handleFiles, handleProtectedFiles, isDragOver, setIsDragOver, layer }) => (
//   <div className={`flex items-center w-full gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${files?.length > 0 ? "border border-blue-100 bg-white" : "border-2 border-dashed border-blue-100 bg-blue-50 hover:bg-blue-100"}`}>
//     <Image className="w-6 h-6 text-blue-600 flex-shrink-0" />
//     <div className="flex-1">
//       <div className={`text-sm font-medium mb-2 ${files?.length > 0 ? "text-gray-800" : "text-blue-600"}`}>
//         {files?.length > 0 ? (files[0]?.name?.length > 30 ? `${files[0].name.substring(0, 30)}...` : files[0]?.name) : `No file selected - ${layer} Layer`}
//         {files?.length > 0 && files[0]?.numPages && <span className="text-xs text-gray-500 ml-2">(Total: {files[0].numPages} pages)</span>}
//       </div>
//       {files?.length > 0 && (
//         <input
//           type="number"
//           value={selectedPage === 0 ? "" : selectedPage}
//           min="1"
//           max={maxPages || 1}
//           className="w-full text-sm border border-blue-100 rounded-lg px-3 py-2 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
//           placeholder="Page number"
//           onChange={(e) => {
//             const value = e.target.value === "" ? 0 : parseInt(e.target.value);
//             if (isNaN(value)) return;
//             setSelectedPage(value > maxPages ? maxPages : value < 1 ? 0 : value);
//           }}
//           onBlur={() => selectedPage === 0 && setSelectedPage(1)}
//         />
//       )}
//     </div>
//     <div className="flex-shrink-0">
//       {files?.length > 0 ? (
//         <div className="flex items-center gap-2">
//           <span className="text-xs text-green-600 font-medium" title="✓ Loaded">✓</span>
//           <button onClick={() => { removeFile(files[0].id); setSelectedPage(1); }} className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200">×</button>
//         </div>
//       ) : (
//         <SafeFileUploader
//           isMultiple={true}
//           onFilesSelect={handleFiles}
//           onPasswordProtectedFile={handleProtectedFiles}
//           isDragOver={isDragOver}
//           setIsDragOver={setIsDragOver}
//           allowedTypes={[".pdf"]}
//           showFiles={true}
//           uploadButtonText="Select PDF files"
//           pageTitle="Overlay PDF"
//           pageSubTitle="Overlay two PDF files for visual comparison."
//           className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
//         />
//       )}
//     </div>
//   </div>
// );

// const OverlayControls = ({ overlayOpacity, setOverlayOpacity, overlayBlendMode, setOverlayBlendMode, showDifferences, setShowDifferences, setHighlightColor }) => (
//   <div className="w-full">
//     <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//       <Palette className="w-5 h-5 text-blue-600" />
//       Overlay Controls
//     </h3>
//     <div className="space-y-6">
//       <div>
//         <label className="text-sm font-medium text-gray-700 block mb-3">
//           Top Layer Opacity: <span className="text-blue-600 font-semibold">{overlayOpacity}%</span>
//         </label>
//         <input
//           type="range"
//           min="0"
//           max="100"
//           value={overlayOpacity}
//           onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
//           className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
//           style={{ background: `linear-gradient(to right, #fee2e2 0%, #dc2626 ${overlayOpacity}%, #fee2e2 ${overlayOpacity}%, #fee2e2 100%)` }}
//         />
//       </div>
//       <div>
//         <label className="text-sm font-medium text-gray-700 block mb-3">Blend Mode</label>
//         <select
//           value={overlayBlendMode}
//           onChange={(e) => setOverlayBlendMode(e.target.value)}
//           className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all duration-200 text-blue-600 font-medium"
//           style={{ color: "#dc2626" }}
//         >
//           {["normal", "multiply", "overlay", "difference", "screen", "hard-light"].map((mode) => (
//             <option key={mode} value={mode} className="text-blue-600 bg-white hover:bg-blue-100">{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
//           ))}
//         </select>
//       </div>
//       <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
//         <div>
//           <span className="text-sm font-medium text-gray-900 block">Highlight Differences</span>
//           <span className="text-xs text-gray-500">Show visual differences between layers</span>
//         </div>
//         <button
//           onClick={() => setShowDifferences(!showDifferences)}
//           className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${showDifferences ? "bg-blue-600 shadow-lg" : "bg-gray-300 hover:bg-gray-400"}`}
//         >
//           <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md ${showDifferences ? "translate-x-7" : "translate-x-1"}`} />
//         </button>
//       </div>
//       <button
//         onClick={() => {
//           setOverlayOpacity(50);
//           setOverlayBlendMode("normal");
//           setShowDifferences(false);
//           setHighlightColor("#ff0000");
//         }}
//         className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
//       >
//         <RotateCcw className="w-4 h-4" />
//         Reset Controls
//       </button>
//     </div>
//   </div>
// );

// const ComparisonButton = ({ isDownloading, disabled, onClick, label, icon: Icon }) => (
//   <button
//     onClick={onClick}
//     disabled={disabled || isDownloading}
//     className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${disabled || isDownloading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
//       }`}
//   >
//     {isDownloading ? (
//       <>
//         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//         Generating Report...
//       </>
//     ) : (
//       <>
//         <Icon className="w-5 h-5" />
//         {label}
//       </>
//     )}
//   </button>
// );

// const SidebarContent = ({
//   activeOption,
//   handleOptionChange,
//   leftFiles,
//   rightFiles,
//   leftAnalysis,
//   rightAnalysis,
//   isAnalyzing,
//   comparisonResult,
//   setShowComparisonResults,
//   overlayDown,
//   overlayUp,
//   selectedPageDown,
//   selectedPageUp,
//   setSelectedPageDown,
//   setSelectedPageUp,
//   removeFile,
//   handleFiles,
//   handleProtectedFiles,
//   isDragOver,
//   setIsDragOver,
//   showControls,
//   overlayOpacity,
//   setOverlayOpacity,
//   overlayBlendMode,
//   setOverlayBlendMode,
//   showDifferences,
//   setShowDifferences,
//   highlightColor,
//   setHighlightColor,
//   performOverlayAnalysis,
//   hasUnhealthyFiles,
//   passwordProtectedFiles,
//   DynamicProgressLoader,
//   OCRNotification,
//   SafeFileUploader,
//   state
// }) => {
//   const [isDownloading, setIsDownloading] = useState(false);

//   const generateOverlayImage = async (type, files1, files2, extraData = {}) => {
//     if (state.overlayDown.length === 0 || state.overlayUp.length === 0) {
//       toast.error("Upload both PDF files first");
//       return;
//     }

//     try {
//       // Create canvas for overlay generation
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');
//       canvas.width = 800;
//       canvas.height = 1000;

//       // Clear canvas
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Load bottom layer PDF page
//       const bottomFile = state.overlayDown[0];
//       const bottomArrayBuffer = await bottomFile.file.arrayBuffer();
//       const bottomPdf = await pdfjs.getDocument({ data: bottomArrayBuffer }).promise;
//       const bottomPage = await bottomPdf.getPage(state.selectedPageDown);
//       const bottomViewport = bottomPage.getViewport({ scale: 1.5 });

//       // Render bottom layer
//       const bottomCanvas = document.createElement('canvas');
//       const bottomCtx = bottomCanvas.getContext('2d');
//       bottomCanvas.width = bottomViewport.width;
//       bottomCanvas.height = bottomViewport.height;

//       await bottomPage.render({
//         canvasContext: bottomCtx,
//         viewport: bottomViewport
//       }).promise;

//       // Draw bottom layer on main canvas
//       ctx.drawImage(bottomCanvas, 0, 0, canvas.width, canvas.height);

//       // Load top layer PDF page
//       const topFile = state.overlayUp[0];
//       const topArrayBuffer = await topFile.file.arrayBuffer();
//       const topPdf = await pdfjs.getDocument({ data: topArrayBuffer }).promise;
//       const topPage = await topPdf.getPage(state.selectedPageUp);
//       const topViewport = topPage.getViewport({ scale: 1.5 });

//       // Render top layer
//       const topCanvas = document.createElement('canvas');
//       const topCtx = topCanvas.getContext('2d');
//       topCanvas.width = topViewport.width;
//       topCanvas.height = topViewport.height;

//       await topPage.render({
//         canvasContext: topCtx,
//         viewport: topViewport
//       }).promise;

//       // Apply overlay settings
//       ctx.globalAlpha = state.overlayOpacity / 100;
//       ctx.globalCompositeOperation = state.overlayBlendMode;

//       // Draw top layer
//       ctx.drawImage(topCanvas, 0, 0, canvas.width, canvas.height);

//       // Reset composite operation
//       ctx.globalCompositeOperation = 'source-over';
//       ctx.globalAlpha = 1;

//       // Add difference highlights if enabled
//       if (state.showDifferences && state.overlayComparison) {
//         ctx.strokeStyle = state.highlightColor;
//         ctx.lineWidth = 3;

//         state.overlayComparison.differences.changedRegions.forEach(region => {
//           ctx.strokeRect(region.x, region.y, region.width, region.height);

//           // Add label
//           ctx.fillStyle = state.highlightColor;
//           ctx.font = 'bold 14px Arial';
//           ctx.fillText(region.type.toUpperCase(), region.x, region.y - 5);
//         });
//       }

//       // Add header with file info
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
//       ctx.fillRect(0, 0, canvas.width, 80);

//       ctx.fillStyle = '#1f2937';
//       ctx.font = 'bold 16px Arial';
//       ctx.fillText(`Bottom: ${bottomFile.name} (Page ${state.selectedPageDown})`, 10, 25);
//       ctx.fillText(`Top: ${topFile.name} (Page ${state.selectedPageUp})`, 10, 45);
//       ctx.fillText(`Opacity: ${state.overlayOpacity}% | Mode: ${state.overlayBlendMode}`, 10, 65);

//       // Convert to blob and download
//       canvas.toBlob((blob) => {
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `overlay-comparison-${Date.now()}.png`;
//         a.click();
//         URL.revokeObjectURL(url);
//         toast.success('Overlay image downloaded successfully!');
//       }, 'image/png');

//     } catch (error) {
//       console.error('Error generating overlay image:', error);
//       toast.error('Failed to generate overlay image');
//     }
//   };

//   return (
//     <div className="flex flex-col justify-between h-full">
//       <div>
//         <h3 className="sticky top-0 z-30 bg-white text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">Compare PDF</h3>
//         <div className="w-full border border-gray-200 rounded-t overflow-hidden flex p-4 gap-4">
//           <OptionButton option="semantic" activeOption={activeOption} handleOptionChange={handleOptionChange} icon={Files} label="Semantic Text" />
//           <OptionButton option="overlay" activeOption={activeOption} handleOptionChange={handleOptionChange} icon={Layers} label="Content Overlay" />
//         </div>

//         <div className="my-4 px-6 text-lg font-semibold text-gray-700">
//           {activeOption === "semantic" ? (
//             <div className="w-full flex flex-col items-center">
//               <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
//                 Compare text changes between two PDFs using advanced semantic analysis.
//               </p>
//               {(leftFiles?.length > 0 || rightFiles?.length > 0) && (
//                 <div className="mt-4 w-full space-y-3">
//                   {leftFiles?.length > 0 && <FileStatus file={leftFiles[0]} analysis={leftAnalysis} color="blue" label="Left Document" />}
//                   {rightFiles?.length > 0 && <FileStatus file={rightFiles[0]} analysis={rightAnalysis} color="green" label="Right Document" />}
//                   {isAnalyzing ? (
//                     <DynamicProgressLoader isAnalyzing={isAnalyzing} />
//                   ) : comparisonResult?.requiresOCR ? (
//                     <OCRNotification
//                       requiresOCR={comparisonResult?.requiresOCR}
//                       leftIsImageBased={comparisonResult?.leftIsImageBased}
//                       rightIsImageBased={comparisonResult?.rightIsImageBased}
//                       leftAnalysis={comparisonResult?.leftAnalysis}
//                       rightAnalysis={comparisonResult?.rightAnalysis}
//                       ocrToolUrl="/ocr-pdf"
//                     />
//                   ) : (
//                     comparisonResult && !comparisonResult.requiresOCR && (
//                       <div
//                         className="bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors duration-200 my-4"
//                         onClick={() => setShowComparisonResults(true)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <span className="text-xs sm:text-sm font-medium text-purple-800">Comparison Ready</span>
//                           <div className="flex items-center gap-1 sm:gap-2">
//                             <Search className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
//                             <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
//                           </div>
//                         </div>
//                         <div className="text-xs text-purple-600 mt-1">
//                           {comparisonResult.similarity?.overall}% similarity • {comparisonResult.changes?.changePercentage}% changed
//                         </div>
//                         <div className="text-xs text-purple-500 mt-2 font-medium">Click to view detailed report →</div>
//                       </div>
//                     )
//                   )}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="w-full flex flex-col items-center gap-4">
//               <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
//                 Overlay content from two files and display any changes in a separate color.
//               </p>
//               <div className="w-full flex flex-col items-center gap-4 max-w-lg">
//                 <FileUploader
//                   files={overlayUp}
//                   setFiles={setSelectedPageUp}
//                   maxPages={overlayUp?.[0]?.numPages}
//                   selectedPage={selectedPageUp}
//                   setSelectedPage={setSelectedPageUp}
//                   removeFile={removeFile}
//                   handleFiles={handleFiles}
//                   handleProtectedFiles={handleProtectedFiles}
//                   isDragOver={isDragOver}
//                   setIsDragOver={setIsDragOver}
//                   layer="Top"
//                 />
//                 <FileUploader
//                   files={overlayDown}
//                   setFiles={setSelectedPageDown}
//                   maxPages={overlayDown?.[0]?.numPages}
//                   selectedPage={selectedPageDown}
//                   setSelectedPage={setSelectedPageDown}
//                   removeFile={removeFile}
//                   handleFiles={handleFiles}
//                   handleProtectedFiles={handleProtectedFiles}
//                   isDragOver={isDragOver}
//                   setIsDragOver={setIsDragOver}
//                   layer="Bottom"
//                 />
//                 {showControls && overlayDown?.length > 0 && overlayUp?.length > 0 && (
//                   <OverlayControls
//                     overlayOpacity={overlayOpacity}
//                     setOverlayOpacity={setOverlayOpacity}
//                     overlayBlendMode={overlayBlendMode}
//                     setOverlayBlendMode={setOverlayBlendMode}
//                     showDifferences={showDifferences}
//                     setShowDifferences={setShowDifferences}
//                     setHighlightColor={setHighlightColor}
//                   />
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {hasUnhealthyFiles && (
//           <div className="bg-yellow-50 rounded-xl p-4 mx-4 mb-6">
//             <p className="text-sm text-yellow-800">Some files have preview issues but can still be converted. Check the yellow-highlighted files.</p>
//           </div>
//         )}

//         {passwordProtectedFiles?.size > 0 && (
//           <div className="bg-yellow-50 rounded-xl p-4 mb-6">
//             <p className="text-sm text-yellow-800">
//               {passwordProtectedFiles.size} password-protected file{passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords will be required for conversion.
//             </p>
//           </div>
//         )}
//       </div>

//       <div className="p-4 sticky bottom-0 bg-white border-t">
//         {activeOption === "semantic" ? (
//           <ComparisonButton
//             isDownloading={isDownloading}
//             disabled={leftFiles?.length === 0 || rightFiles?.length === 0 || comparisonResult?.requiresOCR}
//             onClick={() => generateOverlayImage()}
//             label={comparisonResult?.requiresOCR ? "OCR Required" : leftFiles?.length > 0 && rightFiles?.length > 0 ? "Download Report" : "Upload Both Files"}
//             icon={comparisonResult?.requiresOCR ? AlertCircle : leftFiles?.length > 0 && rightFiles?.length > 0 ? Download : ArrowRight}
//           />
//         ) : (
//           <ComparisonButton
//             isDownloading={isDownloading}
//             disabled={overlayDown?.length === 0 || overlayUp?.length === 0}
//             // onClick={() => handleComparison("overlay", overlayDown, overlayUp, { selectedPageDown, selectedPageUp, overlayOpacity, overlayBlendMode })}
//               onClick={() => generateOverlayImage()}
//             label="Download Report"
//             icon={FileText}
//           />
//         )}
//         {(leftFiles?.length === 0 || rightFiles?.length === 0) && activeOption === "semantic" && (
//           <p className="text-xs text-gray-500 text-center mt-2">Upload both PDF files to compare</p>
//         )}
//         {(overlayDown?.length === 0 || overlayUp?.length === 0) && activeOption === "overlay" && (
//           <p className="text-xs text-gray-500 text-center mt-2">Upload both PDF files to create overlay report</p>
//         )}
//         {activeOption === "semantic" && comparisonResult?.requiresOCR && (
//           <p className="text-xs text-orange-600 text-center mt-2">Please process your image-based PDFs with OCR first</p>
//         )}
//       </div>

//       <style jsx>{`
//         .slider-thumb-red::-webkit-slider-thumb {
//           background: #dc2626;
//           border-radius: 50%;
//           height: 16px;
//           width: 16px;
//           cursor: pointer;
//         }
//         .slider-thumb-red::-moz-range-thumb {
//           background: #dc2626;
//           border-radius: 50%;
//           height: 16px;
//           width: 16px;
//           cursor: pointer;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default SidebarContent;

// // import Api from "@/utils/Api";
// // import React, { useState } from "react";

// // function SidebarContent({
// //   activeOption,
// //   handleOptionChange,
// //   leftFiles,
// //   rightFiles,
// //   leftAnalysis,
// //   rightAnalysis,
// //   isAnalyzing,
// //   comparisonResult,
// //   setShowComparisonResults,
// //   overlayDown,
// //   overlayUp,
// //   selectedPageDown,
// //   selectedPageUp,
// //   setSelectedPageDown,
// //   setSelectedPageUp,
// //   removeFile,
// //   handleFiles,
// //   handleProtectedFiles,
// //   isDragOver,
// //   setIsDragOver,
// //   showControls,
// //   overlayOpacity,
// //   setOverlayOpacity,
// //   overlayBlendMode,
// //   setOverlayBlendMode,
// //   showDifferences,
// //   setShowDifferences,
// //   highlightColor,
// //   setHighlightColor,
// //   performOverlayAnalysis,
// //   hasUnhealthyFiles,
// //   passwordProtectedFiles,
// //   // Import required components
// //   DynamicProgressLoader,
// //   OCRNotification,
// //   SafeFileUploader,
// //   // Import required icons
// //   Check,
// //   Type,
// //   Search,
// //   ArrowRight,
// //   Image,
// //   Palette,
// //   RotateCcw,
// //   Zap,
// //   AlertCircle,
// //   Download,
// //   FileText,
// //   // Import toast
// //   toast,
// // }) {

// //   const [isDownloading, setIsDownloading] = useState(false);

// //   const handleSemanticComparison = async () => {
// //     if (!leftFiles?.length || !rightFiles?.length) {
// //       toast.error("Please upload both PDF files first");
// //       return;
// //     }

// //     setIsDownloading(true);

// //     try {
// //       const formData = new FormData();

// //       // Add files to FormData
// //       if (leftFiles[0]?.file) {
// //         formData.append('files', leftFiles[0].file);
// //       }
// //       if (rightFiles[0]?.file) {
// //         formData.append('files', rightFiles[0].file);
// //       }

// //       // Add comparison type
// //       formData.append('comparisonType', 'semantic');

// //       const response = await Api.post('/tools/compare-pdf', formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data'
// //         }
// //       });

// //       if (response.success && response.data?.fileUrl) {
// //         // Create download link
// //         const downloadUrl = `/public/documents/${response.data.fileUrl}`;
// //         const fileName = response.data.reportFile || 'semantic-comparison-report.pdf';

// //         // Download file
// //         const link = document.createElement('a');
// //         link.href = downloadUrl;
// //         link.download = fileName;
// //         document.body.appendChild(link);
// //         link.click();
// //         document.body.removeChild(link);

// //         toast.success('Comparison report downloaded successfully!');
// //       } else {
// //         throw new Error('Invalid response format');
// //       }

// //     } catch (error) {
// //       console.error('Comparison error:', error);
// //       toast.error(error?.response?.data?.message || error.message || 'Failed to generate comparison report');
// //     } finally {
// //       setIsDownloading(false);
// //     }
// //   };

// //   const handleOverlayComparison = async () => {
// //     if (!overlayDown?.length || !overlayUp?.length) {
// //       toast.error("Please upload both PDF files first");
// //       return;
// //     }

// //     setIsDownloading(true);

// //     try {
// //       const formData = new FormData();

// //       // Add files to FormData
// //       if (overlayDown[0]?.file) {
// //         formData.append('files', overlayDown[0].file);
// //       }
// //       if (overlayUp[0]?.file) {
// //         formData.append('files', overlayUp[0].file);
// //       }

// //       // Add comparison type and overlay settings
// //       formData.append('comparisonType', 'overlay');
// //       formData.append('selectedPageDown', selectedPageDown.toString());
// //       formData.append('selectedPageUp', selectedPageUp.toString());
// //       formData.append('overlayOpacity', overlayOpacity.toString());
// //       formData.append('overlayBlendMode', overlayBlendMode);

// //       const response = await Api.post('/tools/compare-pdf', formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data'
// //         }
// //       });

// //       if (response.success && response.data?.fileUrl) {
// //         // Create download link
// //         const downloadUrl = `/public/documents/${response.data.fileUrl}`;
// //         const fileName = response.data.reportFile || 'overlay-comparison-report.pdf';

// //         // Download file
// //         const link = document.createElement('a');
// //         link.href = downloadUrl;
// //         link.download = fileName;
// //         document.body.appendChild(link);
// //         link.click();
// //         document.body.removeChild(link);

// //         toast.success('Overlay report downloaded successfully!');
// //       } else {
// //         throw new Error('Invalid response format');
// //       }

// //     } catch (error) {
// //       console.error('Overlay comparison error:', error);
// //       toast.error(error?.response?.data?.message || error.message || 'Failed to generate overlay report');
// //     } finally {
// //       setIsDownloading(false);
// //     }
// //   };


// //   return (
// //     <div className="flex flex-col justify-between h-full">
// //       <div className="">
// //         <h3 className="sticky top-0 z-30 bg-white text-2xl h-16 flex justify-center items-center font-bold text-gray-900 text-center">
// //           Compare PDF
// //         </h3>

// //         {/* Conversion Mode Options */}
// //         <div className="w-full relative">
// //           <div className="flex w-full border border-gray-200 rounded-t overflow-hidden">
// //             <div
// //               onClick={() => handleOptionChange("semantic")}
// //               className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
// //       ${activeOption === "semantic"
// //                   ? "bg-blue-100 border-l border-blue-600 border-b-0"
// //                   : "bg-white border-l-0 border-b border-gray-300"
// //                 }`}
// //             >
// //               {activeOption === "semantic" && (
// //                 <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
// //                   <span className="text-white text-xs font-bold">✔</span>
// //                 </div>
// //               )}
// //               <div className="flex flex-col p-0 m-0 items-center leading-none">
// //                 <div
// //                   className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${activeOption === "semantic"
// //                     ? "text-blue-600"
// //                     : "text-gray-500"
// //                     }`}
// //                 >
// //                   <svg
// //                     xmlns="http://www.w3.org/2000/svg"
// //                     width="48"
// //                     height="48"
// //                   >
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="M19 9.5H4A2.5 2.5 0 0 0 1.5 12v24A2.5 2.5 0 0 0 4 38.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 19 9.5ZM4 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H4ZM44 9.5H29a2.5 2.5 0 0 0-2.5 2.5v24a2.5 2.5 0 0 0 2.5 2.5h15a2.5 2.5 0 0 0 2.5-2.5V12A2.5 2.5 0 0 0 44 9.5ZM29 8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V12a4 4 0 0 0-4-4H29Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="M15 18H5v-3h10v3ZM40 18H30v-3h10v3ZM18 21H5v-1h13v1ZM43 21H30v-1h13v1ZM18 25H5v-1h13v1ZM43 25H30v-1h13v1ZM18 29H5v-1h13v1ZM43 29H30v-1h13v1ZM18 33H5v-1h13v1ZM43 33H30v-1h13v1Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="M10 26H5v-3h5v3ZM35 26h-5v-3h5v3ZM18 30h-5v-3h5v3ZM43 30h-5v-3h5v3Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                   </svg>
// //                 </div>
// //               </div>
// //               <p
// //                 className={`text-sm font-medium ${activeOption === "semantic" ? "text-blue-600" : "text-gray-500"
// //                   }`}
// //               >
// //                 Semantic Text
// //               </p>
// //             </div>

// //             <div
// //               onClick={() => handleOptionChange("overlay")}
// //               className={`relative w-1/2 h-28 flex flex-col justify-center items-center gap-2 cursor-pointer transition-all
// //       ${activeOption === "overlay"
// //                   ? "bg-blue-100 border-l border-blue-600 border-b-0"
// //                   : "bg-white border-l-0 border-b border-gray-300"
// //                 }`}
// //             >
// //               {activeOption === "overlay" && (
// //                 <div className="absolute top-2 left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
// //                   <span className="text-white text-xs font-bold">✔</span>
// //                 </div>
// //               )}
// //               <div className="flex flex-col p-0 m-0 items-center leading-none">
// //                 <div
// //                   className={`text-4xl w-12 h-8 flex justify-center items-center font-bold ${activeOption === "overlay"
// //                     ? "text-blue-600"
// //                     : "text-gray-500"
// //                     }`}
// //                 >
// //                   <svg
// //                     xmlns="http://www.w3.org/2000/svg"
// //                     width="48"
// //                     height="48"
// //                   >
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="M27 18.5H8A2.5 2.5 0 0 0 5.5 21v19A2.5 2.5 0 0 0 8 42.5h19a2.5 2.5 0 0 0 2.5-2.5V21a2.5 2.5 0 0 0-2.5-2.5ZM8 17a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V21a4 4 0 0 0-4-4H8Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="M40 5.5H21A2.5 2.5 0 0 0 18.5 8v19a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5V8A2.5 2.5 0 0 0 40 5.5ZM21 4a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h19a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H21Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                     <path
// //                       fill="currentColor"
// //                       fillRule="evenodd"
// //                       d="m22 18-4 4-.707-.707 4-4L22 18ZM31 27l-4 4-.707-.707 4-4L31 27ZM25 18l-7 7-.707-.707 7-7L25 18ZM31 24l-7 7-.707-.707 7-7L31 24ZM28 18 18 28l-.707-.707 10-10L28 18ZM31 21 21 31l-.707-.707 10-10L31 21ZM30 19 19 30l-.707-.707 11-11L30 19Z"
// //                       clipRule="evenodd"
// //                     ></path>
// //                   </svg>
// //                 </div>
// //               </div>
// //               <p
// //                 className={`text-sm font-medium ${activeOption === "overlay" ? "text-blue-600" : "text-gray-500"
// //                   }`}
// //               >
// //                 Content Overlay
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Label based on selection */}
// //         <div className="my-4 mx-6 text-lg font-semibold text-gray-700">
// //           {activeOption === "semantic" ? (
// //             <div className="w-full flex justify-center items-center flex-col">
// //               <div>
// //                 <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
// //                   Compare text changes between two PDFs using advanced semantic
// //                   analysis.
// //                 </p>
// //               </div>

// //               {/* File Analysis Status */}
// //               {(leftFiles?.length > 0 || rightFiles?.length > 0) && (
// //                 <div className="mt-4 w-full space-y-3">
// //                   {leftFiles?.length > 0 && (
// //                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
// //                       <div className="flex items-center justify-between">
// //                         <span className="text-sm font-medium text-blue-800">
// //                           Left Document
// //                         </span>
// //                         {leftAnalysis ? (
// //                           <Check className="w-4 h-4 text-green-500" />
// //                         ) : (
// //                           <Type className="w-4 h-4 text-blue-500" />
// //                         )}
// //                       </div>
// //                       <p className="text-xs text-blue-600 mt-1">
// //                         {leftFiles[0]?.name}
// //                       </p>
// //                       {leftAnalysis && (
// //                         <div className="text-xs text-blue-600 mt-1">
// //                           {leftAnalysis.fileType} • {leftAnalysis.wordCount}{" "}
// //                           words
// //                         </div>
// //                       )}
// //                     </div>
// //                   )}

// //                   {rightFiles?.length > 0 && (
// //                     <div className="bg-green-50 border border-green-200 rounded-lg p-3">
// //                       <div className="flex items-center justify-between">
// //                         <span className="text-sm font-medium text-green-800">
// //                           Right Document
// //                         </span>
// //                         {rightAnalysis ? (
// //                           <Check className="w-4 h-4 text-green-500" />
// //                         ) : (
// //                           <Type className="w-4 h-4 text-green-500" />
// //                         )}
// //                       </div>
// //                       <p className="text-xs text-green-600 mt-1">
// //                         {rightFiles[0]?.name}
// //                       </p>
// //                       {rightAnalysis && (
// //                         <div className="text-xs text-green-600 mt-1">
// //                           {rightAnalysis.fileType} • {rightAnalysis.wordCount}{" "}
// //                           words
// //                         </div>
// //                       )}
// //                     </div>
// //                   )}

// //                   {isAnalyzing ? (
// //                     <DynamicProgressLoader isAnalyzing={isAnalyzing} />
// //                   ) : comparisonResult?.requiresOCR ? (
// //                     <OCRNotification
// //                       requiresOCR={comparisonResult?.requiresOCR}
// //                       leftIsImageBased={comparisonResult?.leftIsImageBased}
// //                       rightIsImageBased={comparisonResult?.rightIsImageBased}
// //                       leftAnalysis={comparisonResult?.leftAnalysis}
// //                       rightAnalysis={comparisonResult?.rightAnalysis}
// //                       ocrToolUrl="/ocr-pdf"
// //                     />
// //                   ) : (
// //                     <>
// //                       {comparisonResult && !comparisonResult.requiresOCR && (
// //                         <div
// //                           className="bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors duration-200 mx-3 sm:mx-4 md:mx-2 my-4"
// //                           onClick={() => setShowComparisonResults(true)}
// //                         >
// //                           <div className="flex items-center justify-between">
// //                             <span className="text-xs sm:text-sm font-medium text-purple-800">
// //                               Comparison Ready
// //                             </span>
// //                             <div className="flex items-center gap-1 sm:gap-2">
// //                               <Search className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
// //                               <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3 text-purple-500" />
// //                             </div>
// //                           </div>
// //                           <div className="text-xs text-purple-600 mt-1">
// //                             {comparisonResult.similarity?.overall}% similarity •{" "}
// //                             {comparisonResult.changes?.changePercentage}%
// //                             changed
// //                           </div>
// //                           <div className="text-xs text-purple-500 mt-2 font-medium">
// //                             Click to view detailed report →
// //                           </div>
// //                         </div>
// //                       )}
// //                     </>
// //                   )}
// //                 </div>
// //               )}
// //             </div>
// //           ) : (
// //             // Content Overlay Section
// //             <div className="w-full flex justify-center items-center flex-col gap-4">
// //               <div>
// //                 <p className="border border-blue-600 text-center bg-blue-50 text-sm text-blue-600 rounded-lg p-4">
// //                   Overlay content from two files and display any changes in a
// //                   separate color.
// //                 </p>
// //               </div>
// //               <div className="w-full flex flex-col items-center leading-none gap-4">
// //                 {/* Second upload section - overlayUp (Top Layer) */}
// //                 <div className="w-full max-w-lg">
// //                   <div
// //                     className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${overlayUp?.length > 0
// //                       ? "border border-blue-100 bg-white"
// //                       : "border-2 border-dashed border-blue-100 bg-blue-50 hover:bg-blue-100"
// //                       }`}
// //                   >
// //                     <div className="flex-shrink-0">
// //                       <Image className="w-6 h-6 text-blue-600" />
// //                     </div>
// //                     <div className="flex-1">
// //                       <div
// //                         className={`text-sm font-medium mb-2 ${overlayUp?.length > 0
// //                           ? "text-gray-800"
// //                           : "text-blue-600"
// //                           }`}
// //                       >
// //                         {overlayUp?.length > 0
// //                           ? overlayUp[0]?.name?.length > 30
// //                             ? overlayUp[0].name.substring(0, 30) + "..."
// //                             : overlayUp[0]?.name
// //                           : "No file selected - Top Layer"}
// //                         {/* Show total pages if PDF is loaded */}
// //                         {overlayUp?.length > 0 && overlayUp[0]?.numPages && (
// //                           <span className="text-xs text-gray-500 ml-2">
// //                             (Total: {overlayUp[0].numPages} pages)
// //                           </span>
// //                         )}
// //                       </div>
// //                       {/* Only show input if file is selected */}
// //                       {overlayUp?.length > 0 && (
// //                         <input
// //                           type="number"
// //                           value={selectedPageUp === 0 ? "" : selectedPageUp} // Empty string when 0
// //                           min="1"
// //                           max={
// //                             overlayUp?.length > 0
// //                               ? overlayUp[0]?.numPages || 1
// //                               : 1
// //                           }
// //                           className="w-full text-sm border border-blue-100 rounded-lg px-3 py-2 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
// //                           placeholder="Page number"
// //                           onChange={(e) => {
// //                             const inputValue = e.target.value;

// //                             // If input is empty, set to 0 (which will show as empty)
// //                             if (inputValue === "" || inputValue === null) {
// //                               setSelectedPageUp(0);
// //                               return;
// //                             }

// //                             const value = parseInt(inputValue);

// //                             // If not a valid number, don't update
// //                             if (isNaN(value)) {
// //                               return;
// //                             }

// //                             const maxPages =
// //                               overlayUp?.length > 0
// //                                 ? overlayUp[0]?.numPages || 1
// //                                 : 1;

// //                             if (value > maxPages) {
// //                               setSelectedPageUp(maxPages);
// //                             } else if (value < 1) {
// //                               setSelectedPageUp(0); // Allow 0 for empty state
// //                             } else {
// //                               setSelectedPageUp(value);
// //                             }
// //                           }}
// //                           onBlur={(e) => {
// //                             // When user leaves the input, if it's empty or 0, set to 1
// //                             if (selectedPageUp === 0 || e.target.value === "") {
// //                               setSelectedPageUp(1);
// //                             }
// //                           }}
// //                         />
// //                       )}
// //                     </div>
// //                     <div className="flex-shrink-0">
// //                       {overlayUp?.length > 0 ? (
// //                         <div className="flex items-center gap-2">
// //                           <span
// //                             className="text-xs text-green-600 font-medium"
// //                             title="✓ Loaded"
// //                           >
// //                             ✓
// //                           </span>
// //                           <button
// //                             onClick={() => {
// //                               // Handle remove file
// //                               if (overlayUp?.length > 0 && overlayUp[0]?.id) {
// //                                 removeFile(overlayUp[0].id);
// //                                 // Reset page number when file is removed
// //                                 setSelectedPageUp(1);
// //                               }
// //                             }}
// //                             className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
// //                           >
// //                             ×
// //                           </button>
// //                         </div>
// //                       ) : (
// //                         <SafeFileUploader
// //                           isMultiple={true}
// //                           onFilesSelect={handleFiles}
// //                           onPasswordProtectedFile={handleProtectedFiles}
// //                           isDragOver={isDragOver}
// //                           setIsDragOver={setIsDragOver}
// //                           allowedTypes={[".pdf"]}
// //                           showFiles={true}
// //                           uploadButtonText="Select PDF files"
// //                           pageTitle={
// //                             activeOption === "semantic"
// //                               ? "Compare PDF"
// //                               : "Overlay PDF"
// //                           }
// //                           pageSubTitle={
// //                             activeOption === "semantic"
// //                               ? "Easily display the differences between two similar files."
// //                               : "Overlay two PDF files for visual comparison."
// //                           }
// //                           className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //                 {/* First upload section - overlayDown (Bottom Layer) */}
// //                 <div className="w-full max-w-lg">
// //                   <div
// //                     className={`flex items-center gap-4 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 ${overlayDown?.length > 0
// //                       ? "border border-blue-100 bg-white"
// //                       : "border-2 border-dashed border-blue-100 bg-blue-50 hover:bg-blue-100"
// //                       }`}
// //                   >
// //                     <div className="flex-shrink-0">
// //                       <Image className="w-6 h-6 text-blue-600" />
// //                     </div>
// //                     <div className="flex-1">
// //                       <div
// //                         className={`text-sm font-medium mb-2 ${overlayDown?.length > 0
// //                           ? "text-gray-800"
// //                           : "text-blue-600"
// //                           }`}
// //                       >
// //                         {overlayDown?.length > 0
// //                           ? overlayDown[0]?.name?.length > 30
// //                             ? overlayDown[0].name.substring(0, 30) + "..."
// //                             : overlayDown[0]?.name
// //                           : "No file selected - Bottom Layer"}
// //                         {/* Show total pages if PDF is loaded */}
// //                         {overlayDown?.length > 0 &&
// //                           overlayDown[0]?.numPages && (
// //                             <span className="text-xs text-gray-500 ml-2">
// //                               (Total: {overlayDown[0].numPages} pages)
// //                             </span>
// //                           )}
// //                       </div>
// //                       {/* Only show input if file is selected */}
// //                       {overlayDown?.length > 0 && (
// //                         <input
// //                           type="number"
// //                           value={selectedPageDown === 0 ? "" : selectedPageDown} // Empty string when 0
// //                           min="1"
// //                           max={
// //                             overlayDown?.length > 0
// //                               ? overlayDown[0]?.numPages || 1
// //                               : 1
// //                           }
// //                           className="w-full text-sm border border-blue-100 rounded-lg px-3 py-2 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none"
// //                           placeholder="Page number"
// //                           onChange={(e) => {
// //                             const inputValue = e.target.value;

// //                             // If input is empty, set to 0 (which will show as empty)
// //                             if (inputValue === "" || inputValue === null) {
// //                               setSelectedPageDown(0);
// //                               return;
// //                             }

// //                             const value = parseInt(inputValue);

// //                             // If not a valid number, don't update
// //                             if (isNaN(value)) {
// //                               return;
// //                             }

// //                             const maxPages =
// //                               overlayDown?.length > 0
// //                                 ? overlayDown[0]?.numPages || 1
// //                                 : 1;

// //                             if (value > maxPages) {
// //                               setSelectedPageDown(maxPages);
// //                             } else if (value < 1) {
// //                               setSelectedPageDown(0); // Allow 0 for empty state
// //                             } else {
// //                               setSelectedPageDown(value);
// //                             }
// //                           }}
// //                           onBlur={(e) => {
// //                             // When user leaves the input, if it's empty or 0, set to 1
// //                             if (
// //                               selectedPageDown === 0 ||
// //                               e.target.value === ""
// //                             ) {
// //                               setSelectedPageDown(1);
// //                             }
// //                           }}
// //                         />
// //                       )}
// //                     </div>
// //                     <div className="flex-shrink-0">
// //                       {overlayDown?.length > 0 ? (
// //                         <div className="flex items-center gap-2">
// //                           <span
// //                             className="text-xs text-green-600 font-medium"
// //                             title="✓ Loaded"
// //                           >
// //                             ✓
// //                           </span>
// //                           <button
// //                             onClick={() => {
// //                               // Handle remove file
// //                               if (
// //                                 overlayDown?.length > 0 &&
// //                                 overlayDown[0]?.id
// //                               ) {
// //                                 removeFile(overlayDown[0].id);
// //                                 // Reset page number when file is removed
// //                                 setSelectedPageDown(1);
// //                               }
// //                             }}
// //                             className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
// //                           >
// //                             ×
// //                           </button>
// //                         </div>
// //                       ) : (
// //                         <SafeFileUploader
// //                           isMultiple={true}
// //                           onFilesSelect={handleFiles}
// //                           onPasswordProtectedFile={handleProtectedFiles}
// //                           isDragOver={isDragOver}
// //                           setIsDragOver={setIsDragOver}
// //                           allowedTypes={[".pdf"]}
// //                           showFiles={true}
// //                           uploadButtonText="Select PDF files"
// //                           pageTitle={
// //                             activeOption === "semantic"
// //                               ? "Compare PDF"
// //                               : "Overlay PDF"
// //                           }
// //                           pageSubTitle={
// //                             activeOption === "semantic"
// //                               ? "Easily display the differences between two similar files."
// //                               : "Overlay two PDF files for visual comparison."
// //                           }
// //                           className="w-5 h-5 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200"
// //                         />
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //                 {/* Updated condition: Show controls only when BOTH files are selected */}
// //                 {showControls &&
// //                   overlayDown?.length > 0 &&
// //                   overlayUp?.length > 0 && (
// //                     <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 w-full">
// //                       <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
// //                         <Palette className="w-5 h-5 text-blue-600" />
// //                         Overlay Controls
// //                       </h3>

// //                       <div className="space-y-6">
// //                         {/* Opacity Control */}
// //                         <div>
// //                           <label className="text-sm font-medium text-gray-700 block mb-3">
// //                             Top Layer Opacity:{" "}
// //                             <span className="text-blue-600 font-semibold">
// //                               {overlayOpacity}%
// //                             </span>
// //                           </label>
// //                           <input
// //                             type="range"
// //                             min="0"
// //                             max="100"
// //                             value={overlayOpacity}
// //                             onChange={(e) =>
// //                               setOverlayOpacity(parseInt(e.target.value))
// //                             }
// //                             className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer slider-thumb-red"
// //                             style={{
// //                               background: `linear-gradient(to right, #fee2e2 0%, #dc2626 ${overlayOpacity}%, #fee2e2 ${overlayOpacity}%, #fee2e2 100%)`,
// //                             }}
// //                           />
// //                         </div>

// //                         {/* Blend Mode */}
// //                         <div>
// //                           <label className="text-sm font-medium text-gray-700 block mb-3">
// //                             Blend Mode
// //                           </label>
// //                           <select
// //                             value={overlayBlendMode}
// //                             onChange={(e) =>
// //                               setOverlayBlendMode(e.target.value)
// //                             }
// //                             className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 transition-all duration-200 text-blue-600 font-medium"
// //                             style={{
// //                               color: "#dc2626",
// //                             }}
// //                           >
// //                             <option
// //                               value="normal"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Normal
// //                             </option>
// //                             <option
// //                               value="multiply"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Multiply
// //                             </option>
// //                             <option
// //                               value="overlay"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Overlay
// //                             </option>
// //                             <option
// //                               value="difference"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Difference
// //                             </option>
// //                             <option
// //                               value="screen"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Screen
// //                             </option>
// //                             <option
// //                               value="hard-light"
// //                               className="text-blue-600 bg-white hover:bg-blue-100 active:bg-blue-600 active:text-white"
// //                             >
// //                               Hard Light
// //                             </option>
// //                           </select>
// //                         </div>

// //                         {/* Highlight Differences */}
// //                         <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
// //                           <div>
// //                             <span className="text-sm font-medium text-gray-900 block">
// //                               Highlight Differences
// //                             </span>
// //                             <span className="text-xs text-gray-500">
// //                               Show visual differences between layers
// //                             </span>
// //                           </div>
// //                           <button
// //                             onClick={() => setShowDifferences(!showDifferences)}
// //                             className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${showDifferences
// //                               ? "bg-blue-600 shadow-lg"
// //                               : "bg-gray-300 hover:bg-gray-400"
// //                               }`}
// //                           >
// //                             <div
// //                               className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md ${showDifferences
// //                                 ? "translate-x-7 shadow-lg"
// //                                 : "translate-x-1"
// //                                 }`}
// //                             />
// //                           </button>
// //                         </div>

// //                         {/* Reset Button */}
// //                         <button
// //                           onClick={() => {
// //                             setOverlayOpacity(50);
// //                             setOverlayBlendMode("normal");
// //                             setShowDifferences(false);
// //                             setHighlightColor("#ff0000");
// //                           }}
// //                           className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 hover:text-blue-700 active:bg-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
// //                         >
// //                           <RotateCcw className="w-4 h-4" />
// //                           Reset Controls
// //                         </button>
// //                       </div>
// //                     </div>
// //                   )}
// //                 {overlayDown?.length > 0 && overlayUp?.length > 0 && (
// //                   <button
// //                     onClick={performOverlayAnalysis}
// //                     disabled={isAnalyzing}
// //                     className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
// //                   >
// //                     {isAnalyzing ? (
// //                       <>
// //                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
// //                         Analyzing...
// //                       </>
// //                     ) : (
// //                       <>
// //                         <Zap className="w-4 h-4" />
// //                         Analyze Overlay
// //                       </>
// //                     )}
// //                   </button>
// //                 )}
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {hasUnhealthyFiles && (
// //           <div className="bg-yellow-50 rounded-xl p-4 mx-4 mb-6">
// //             <p className="text-sm text-yellow-800">
// //               Some files have preview issues but can still be converted. Check
// //               the yellow-highlighted files.
// //             </p>
// //           </div>
// //         )}

// //         {passwordProtectedFiles?.size > 0 && (
// //           <div className="bg-yellow-50 rounded-xl p-4 mb-6">
// //             <p className="text-sm text-yellow-800">
// //               {passwordProtectedFiles.size} password-protected file
// //               {passwordProtectedFiles.size > 1 ? "s" : ""} detected. Passwords
// //               will be required for conversion.
// //             </p>
// //           </div>
// //         )}
// //       </div>

// //       <div className="p-4 sticky bottom-0 bg-white border-t">
// //         {/* Semantic Text Button */}
// //         {activeOption === "semantic" && (
// //           <button
// //             onClick={handleSemanticComparison}
// //             disabled={
// //               leftFiles?.length === 0 ||
// //               rightFiles?.length === 0 ||
// //               comparisonResult?.requiresOCR ||
// //               isDownloading
// //             }
// //             className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${comparisonResult?.requiresOCR
// //                 ? "bg-orange-300 cursor-not-allowed"
// //                 : leftFiles?.length > 0 && rightFiles?.length > 0 && !isDownloading
// //                   ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
// //                   : "bg-blue-300 cursor-not-allowed"
// //               }`}
// //           >
// //             {isDownloading ? (
// //               <>
// //                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
// //                 Generating Report...
// //               </>
// //             ) : comparisonResult?.requiresOCR ? (
// //               <>
// //                 <AlertCircle className="w-5 h-5" />
// //                 OCR Required
// //               </>
// //             ) : leftFiles?.length > 0 && rightFiles?.length > 0 ? (
// //               <>
// //                 <Download className="w-5 h-5" />
// //                 Download Report
// //               </>
// //             ) : (
// //               <>
// //                 <ArrowRight className="w-5 h-5" />
// //                 Upload Both Files
// //               </>
// //             )}
// //           </button>
// //         )}

// // {/* // Replace the existing overlay button onClick with this: */}
// //         {activeOption === "overlay" && (
// //           <button
// //             onClick={handleOverlayComparison}
// //             disabled={overlayDown?.length === 0 || overlayUp?.length === 0 || isDownloading}
// //             className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${overlayDown?.length > 0 && overlayUp?.length > 0 && !isDownloading
// //                 ? "bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg"
// //                 : "bg-blue-300 cursor-not-allowed"
// //               }`}
// //           >
// //             {isDownloading ? (
// //               <>
// //                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
// //                 Generating Report...
// //               </>
// //             ) : (
// //               <>
// //                 <FileText className="w-5 h-5" />
// //                 Download Report
// //               </>
// //             )}
// //           </button>
// //         )}

// //         {/* Common error messages */}
// //         {(leftFiles?.length === 0 || rightFiles?.length === 0) && (
// //           <p className="text-xs text-gray-500 text-center mt-2">
// //             Upload both PDF files to{" "}
// //             {activeOption === "semantic" ? "compare" : "create overlay report"}
// //           </p>
// //         )}

// //         {activeOption === "semantic" && comparisonResult?.requiresOCR && (
// //           <p className="text-xs text-orange-600 text-center mt-2">
// //             Please process your image-based PDFs with OCR first
// //           </p>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // export default SidebarContent;