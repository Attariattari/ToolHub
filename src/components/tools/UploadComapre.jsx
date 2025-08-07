import React, { useCallback } from "react";

const UploadArea = ({
  side,
  isDragging: isDrag,
  isMultiple = true,
  allowedTypes = [".pdf"],
  enablePasswordDetection = false,
  onFilesSelect,
  onPasswordProtectedFile,
  onFileProcessingError,
  onDragEnter,
  onDragLeave,
  onDrop,
}) => {
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

  const processSelectedFiles = useCallback(
    async (files) => {
      if (!enablePasswordDetection) {
        // Agar password detection disabled hai to direct onFilesSelect call karo
        onFilesSelect(files, side);
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
            onFileProcessingError(file, error, side);
          }
        }
      }

      // Regular files handle karo
      if (regularFiles.length > 0) {
        onFilesSelect(regularFiles, side);
      }

      // Password protected files handle karo
      if (protectedFiles.length > 0 && onPasswordProtectedFile) {
        onPasswordProtectedFile(protectedFiles, side);
      }
    },
    [
      enablePasswordDetection,
      onFilesSelect,
      onPasswordProtectedFile,
      onFileProcessingError,
      checkIfPasswordProtected,
      side,
    ]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files);
      processSelectedFiles(selectedFiles);
    },
    [processSelectedFiles]
  );

  const handleDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      if (onDragEnter) {
        onDragEnter(e, side);
      }
    },
    [onDragEnter, side]
  );

  const handleDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      if (onDragLeave) {
        onDragLeave(e, side);
      }
    },
    [onDragLeave, side]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      if (onDrop) {
        onDrop(e, side);
      }

      const droppedFiles = Array.from(e.dataTransfer.files);
      processSelectedFiles(droppedFiles);
    },
    [onDrop, side, processSelectedFiles]
  );

  return (
    <div
      className={`h-full border-2 border-dashed flex flex-col items-center justify-center relative transition-colors duration-200 ${
        isDrag
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400"
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
            type="file"
            multiple={isMultiple}
            accept={allowedTypes.join(",")}
            onChange={handleFileSelect}
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

export default UploadArea;
