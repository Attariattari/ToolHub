"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, HardDrive, Cloud, Plus, SortAsc, Monitor } from "lucide-react";

export default function FileUploaderForWatermark({
  isMultiple = true,
  onFilesSelect, // Regular files ke liye
  onPasswordProtectedFile, // Password protected files ke liye
  onFileProcessingError, // Error handling ke liye
  isDragOver,
  setIsDragOver,
  allowedTypes = [".pdf"],
  showFiles = false,
  showUploadArea = false, // New prop for UploadArea
  side,
  uploadButtonText = "Select PDF files",
  isDrag,
  pageTitle = "Add watermark into a PDF",
  pageSubTitle = "Stamp an image or text over your PDF in seconds.",
  enablePasswordDetection = true, // Toggle password detection
  // Additional props for UploadArea
  setIsDragging,
  setActiveSide,
  handleFiles,
}) {
  const [showTooltip, setShowTooltip] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc");

  // File processing function with useCallback
  const processSelectedFiles = useCallback(
    async (files) => {
      if (!enablePasswordDetection) {
        // Agar password detection disabled hai to direct onFilesSelect call karo
        onFilesSelect(files);
        return;
      }

      const regularFiles = [];
      const protectedFiles = [];

      for (const file of files) {
        try {
          // Simple password protection detection
          const isProtected = await checkIfPasswordProtected(file);

          if (isProtected) {
            protectedFiles.push(file);
          } else {
            regularFiles.push(file);
          }
        } catch (error) {
          console.error("File processing error:", error);
          if (onFileProcessingError) {
            onFileProcessingError(file, error);
          }
        }
      }

      // Regular files handle karo
      if (regularFiles.length > 0) {
        onFilesSelect(regularFiles);
      }

      // Password protected files handle karo
      if (protectedFiles.length > 0 && onPasswordProtectedFile) {
        onPasswordProtectedFile(protectedFiles);
      }
    },
    [
      enablePasswordDetection,
      onFilesSelect,
      onPasswordProtectedFile,
      onFileProcessingError,
    ]
  );

  // Password protection detection function with useCallback
  const checkIfPasswordProtected = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        // PDF header check
        const header = String.fromCharCode.apply(null, uint8Array.slice(0, 8));
        if (!header.startsWith("%PDF-")) {
          resolve(false);
          return;
        }

        // Convert to string for searching
        const pdfString = String.fromCharCode.apply(
          null,
          uint8Array.slice(0, Math.min(uint8Array.length, 50000))
        );

        // Check for encryption indicators
        const encryptionIndicators = [
          "/Encrypt",
          "/Filter/Standard",
          "/V 1",
          "/V 2",
          "/V 4",
          "/V 5", // Encryption versions
          "/Length 40",
          "/Length 128",
          "/Length 256", // Key lengths
        ];

        const isEncrypted = encryptionIndicators.some((indicator) =>
          pdfString.includes(indicator)
        );

        resolve(isEncrypted);
      };

      reader.onerror = () => resolve(false);

      // Read only first 50KB for performance
      const slice = file.slice(0, 50000);
      reader.readAsArrayBuffer(slice);
    });
  }, []);

  // File handling functions with useCallback
  const handleFileSelect = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files);
      processSelectedFiles(selectedFiles);
    },
    [processSelectedFiles]
  );

  // Full screen drag handlers with useCallback
  const handleFullScreenDragOver = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    [setIsDragOver]
  );

  const handleFullScreenDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragOver(false);
      }
    },
    [setIsDragOver]
  );

  const handleFullScreenDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        return allowedTypes.some((type) =>
          file.name.toLowerCase().endsWith(type.replace(".", ""))
        );
      });
      processSelectedFiles(droppedFiles);
    },
    [setIsDragOver, allowedTypes, processSelectedFiles]
  );

  // Cloud service handlers with useCallback
  const handleGoogleDriveSelect = useCallback(() => {
    console.log("Google Drive selected");
    setShowUploadMenu(false);
  }, []);

  const handleDropboxSelect = useCallback(() => {
    console.log("Dropbox selected");
    setShowUploadMenu(false);
  }, []);

  const handlePlusClick = useCallback(() => {
    document.getElementById("file-upload").click();
  }, []);

  // Upload menu for when files are already selected
  const UploadMenu = () => {
    if (!isMultiple) return null;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onMouseEnter={() => setShowUploadMenu(true)}
            onMouseLeave={() => setShowUploadMenu(false)}
            onClick={handlePlusClick}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg relative"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        <input
          id="file-upload"
          type="file"
          multiple={isMultiple}
          accept={allowedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  };

  const UploadArea = () => {
    if (!isMultiple) return null;
    return (
      <div
        className={`h-full border-2 border-dashed flex flex-col items-center justify-center relative transition-colors duration-200 ${isDrag
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (setIsDragging) {
            setIsDragging((prev) => ({ ...prev, [side]: true }));
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (setIsDragging) {
            setIsDragging((prev) => ({ ...prev, [side]: false }));
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (setIsDragging) {
            setIsDragging((prev) => ({ ...prev, [side]: false }));
          }
          const droppedFiles = Array.from(e.dataTransfer.files);
          if (setActiveSide) {
            setActiveSide(side);
          }
          if (handleFiles) {
            handleFiles(droppedFiles);
          } else {
            processSelectedFiles(droppedFiles);
          }
        }}
      >
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-2 font-medium">Drag and drop</p>
          <p className="text-gray-500 text-sm mb-4">Or</p>
          <label className="cursor-pointer">
            <input
              id="file-upload-area"
              type="file"
              multiple={isMultiple}
              accept={allowedTypes.join(",")}
              onChange={(e) => {
                if (setActiveSide) {
                  setActiveSide(side);
                }
                processSelectedFiles(Array.from(e.target.files));
              }}
              className="hidden"
            />
            <span className="inline-block bg-white text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition-colors duration-200 text-sm font-medium">
              Select file
            </span>
          </label>
        </div>
      </div>
    );
  };

  // Initial upload screen
  if (!showFiles && !showUploadArea) {
    return (
      <div className="md:h-[calc(100vh-82px)] bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {pageTitle}
            </h1>
            <p className="text-xl text-gray-600">{pageSubTitle}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${isDragOver
                ? "border-red-500 bg-red-50"
                : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"
                }`}
            >
              {/* Cloud Service Buttons - Top Right Corner */}
              <div className="absolute top-4 right-4 flex gap-2">
                {/* Google Drive Button */}
                <div className="relative">
                  <button
                    onClick={handleGoogleDriveSelect}
                    onMouseEnter={() => setShowTooltip("drive")}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="w-10 h-10 bg-red-600 border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <HardDrive className="w-5 h-5 text-white" />
                  </button>
                  {showTooltip === "drive" && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                      Select from Google Drive
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>

                {/* Dropbox Button */}
                <div className="relative">
                  <button
                    onClick={handleDropboxSelect}
                    onMouseEnter={() => setShowTooltip("dropbox")}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="w-10 h-10 bg-red-600 border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Cloud className="w-5 h-5 text-white" />
                  </button>
                  {showTooltip === "dropbox" && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                      Select from Dropbox
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-red-600" />
              </div>

              <label htmlFor="file-upload-main" className="cursor-pointer">
                <div className="inline-block bg-red-600 hover:bg-red-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4">
                  {uploadButtonText}
                </div>
                <input
                  id="file-upload-main"
                  type="file"
                  multiple={isMultiple}
                  accept={allowedTypes.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <p className="text-gray-500 text-lg">
                or drop file anywhere on screen
              </p>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
          © PDF ToolsHub 2025 • Your PDF Editor
        </footer>
      </div>
    );
  }

  // Return appropriate component based on props
  if (showUploadArea) {
    return <UploadArea />;
  }

  if (showFiles) {
    return <UploadMenu />;
  }

  return null;
}
