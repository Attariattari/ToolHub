"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Unlock,
} from "lucide-react";
import { pdfjs } from "react-pdf";

export default function PasswordModal({
  isOpen,
  onClose,
  passwordProtectedFiles,
  onPasswordVerified,
}) {
  const [passwords, setPasswords] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [passwordStatus, setPasswordStatus] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [processingFiles, setProcessingFiles] = useState({});
  const [unlockedFilesData, setUnlockedFilesData] = useState({});
  const [validationTimeouts, setValidationTimeouts] = useState({});

  // Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setPasswords({});
      setShowPasswords({});
      setPasswordStatus({});
      setValidationErrors({});
      setProcessingFiles({});
      setUnlockedFilesData({});
      Object.values(validationTimeouts).forEach(clearTimeout);
      setValidationTimeouts({});
    }
  }, [isOpen]);

  // Extract preview (optional, can be removed if not needed)
  const extractFilePreview = useCallback(async (pdfDoc, file) => {
    try {
      const numPages = pdfDoc.numPages;
      const page1 = await pdfDoc.getPage(1);
      const textContent = await page1.getTextContent();
      const textItems = textContent.items.map((item) => item.str).join(" ");
      return {
        id: file.id,
        fileName: file.name,
        fileSize: file.file?.size || file.size || 0,
        totalPages: numPages,
        previewText:
          textItems.substring(0, 300) + (textItems.length > 300 ? "..." : ""),
        unlockTime: new Date().toLocaleString(),
        status: "unlocked",
      };
    } catch {
      return {
        id: file.id,
        fileName: file.name,
        fileSize: file.file?.size || file.size || 0,
        totalPages: "Unknown",
        previewText: "Preview not available",
        unlockTime: new Date().toLocaleString(),
        status: "unlocked",
      };
    }
  }, []);

  // Validate password and unlock PDF
  const validatePassword = useCallback(
    async (file, password, fileId) => {
      if (!password || password.trim() === "") {
        setPasswordStatus((prev) => ({ ...prev, [fileId]: null }));
        setValidationErrors((prev) => ({ ...prev, [fileId]: null }));
        return;
      }

      if (passwordStatus[fileId] === "valid" || processingFiles[fileId]) return;

      setPasswordStatus((prev) => ({ ...prev, [fileId]: "checking" }));
      setValidationErrors((prev) => ({ ...prev, [fileId]: null }));
      setProcessingFiles((prev) => ({ ...prev, [fileId]: true }));

      try {
        // Get actual File object robustly
        let fileObj =
          file.file instanceof File
            ? file.file
            : file instanceof File
            ? file
            : file.fileObj instanceof File
            ? file.fileObj
            : null;

        if (!fileObj) throw new Error("Invalid file object");

        const arrayBuffer = await fileObj.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        console.log("Processing file:", {
          fileName: file.name,
          fileSize: fileObj.size,
          arrayBufferSize: arrayBuffer.byteLength,
          uint8ArrayLength: uint8Array.length,
          firstByte: uint8Array[0],
          password: password.trim(),
        });

        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: password.trim(),
        });

        try {
          const pdfDoc = await loadingTask.promise;

          // Debug: Check if uint8Array is properly created
          console.log("PDF unlocked successfully:", {
            fileName: file.name,
            arrayBufferSize: arrayBuffer.byteLength,
            uint8ArrayLength: uint8Array.length,
            pdfPages: pdfDoc.numPages,
          });

          // Optional: get preview data
          const previewData = await extractFilePreview(pdfDoc, file);

          // Create stable data for unlocked file
          const blob = new Blob([arrayBuffer], { type: fileObj.type });
          const objectUrl = URL.createObjectURL(blob);

          const stableData = {
            blob,
            dataUrl: objectUrl,
            uint8Array, // ✅ This should contain the actual file data
            isPasswordProtected: false,
            password: password.trim(),
            pdfDocument: pdfDoc,
            numPages: pdfDoc.numPages,
            previewData,
          };

          console.log("StableData created:", {
            blobSize: stableData.blob.size,
            uint8ArrayLength: stableData.uint8Array.length,
            hasDataUrl: !!stableData.dataUrl,
            numPages: stableData.numPages,
          });

          setUnlockedFilesData((prev) => ({
            ...prev,
            [fileId]: stableData,
          }));

          setPasswordStatus((prev) => ({ ...prev, [fileId]: "valid" }));
          setValidationErrors((prev) => ({ ...prev, [fileId]: null }));
        } catch (pdfError) {
          if (
            pdfError.name === "PasswordException" ||
            pdfError.message?.toLowerCase().includes("password") ||
            pdfError.message?.toLowerCase().includes("invalid")
          ) {
            setPasswordStatus((prev) => ({ ...prev, [fileId]: "invalid" }));
            setValidationErrors((prev) => ({
              ...prev,
              [fileId]: "Incorrect password. Please try again.",
            }));
          } else {
            setPasswordStatus((prev) => ({ ...prev, [fileId]: "invalid" }));
            setValidationErrors((prev) => ({
              ...prev,
              [fileId]: "Unable to unlock file. File may be corrupted.",
            }));
          }
        }
      } catch (error) {
        setPasswordStatus((prev) => ({ ...prev, [fileId]: "invalid" }));
        setValidationErrors((prev) => ({
          ...prev,
          [fileId]: `Error validating password: ${error.message}`,
        }));
      } finally {
        setProcessingFiles((prev) => ({ ...prev, [fileId]: false }));
      }
    },
    [passwordStatus, processingFiles, extractFilePreview]
  );

  // Debounced password input change handler
  const handlePasswordChange = useCallback(
    (fileId, password) => {
      setPasswords((prev) => ({ ...prev, [fileId]: password }));

      if (validationTimeouts[fileId]) clearTimeout(validationTimeouts[fileId]);

      const file = passwordProtectedFiles.find((f) => f.id === fileId);
      if (!file) return;

      const timeoutId = setTimeout(() => {
        validatePassword(file, password, fileId);
      }, 1000);

      setValidationTimeouts((prev) => ({
        ...prev,
        [fileId]: timeoutId,
      }));
    },
    [passwordProtectedFiles, validatePassword, validationTimeouts]
  );

  // Toggle password visibility
  const togglePasswordVisibility = useCallback((fileId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  }, []);

  // Generate unique ID similar to unprotected files
  const generateFileId = useCallback((fileName) => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    return `${fileName}-${timestamp}-${randomNumber}`;
  }, []);

  // Add unlocked files to parent handler - FIXED VERSION
  const handleAddUnlockedFiles = useCallback(() => {
    const unlockedFiles = passwordProtectedFiles
      .filter((file) => passwordStatus[file.id] === "valid")
      .map((file) => {
        let fileObj =
          file.file instanceof File
            ? file.file
            : file instanceof File
            ? file
            : file.fileObj instanceof File
            ? file.fileObj
            : null;

        const stableData = unlockedFilesData[file.id];

        // Generate new ID in same pattern as unprotected files
        const newId = generateFileId(file.name || fileObj?.name || "unknown");

        // Debug: Check if stableData has proper uint8Array
        console.log("StableData for file:", file.name, {
          hasBlob: !!stableData?.blob,
          hasUint8Array: !!stableData?.uint8Array,
          uint8ArrayLength: stableData?.uint8Array?.length || 0,
          blobSize: stableData?.blob?.size || 0,
        });

        // Create a complete structure similar to unprotected files
        return {
          id: newId, // ✅ New ID with same pattern as unprotected files
          file: fileObj, // Original File object
          name: file.name || fileObj?.name,
          size: fileObj
            ? (fileObj.size / 1024 / 1024).toFixed(2) + " MB"
            : "Unknown",
          type: file.type || fileObj?.type || "application/pdf",
          numPages: stableData?.numPages || 1, // Add numPages at root level
          // Add complete stableData structure with proper data
          stableData: {
            blob: stableData?.blob,
            dataUrl: stableData?.dataUrl,
            uint8Array: stableData?.uint8Array, // This should have the actual data
            isPasswordProtected: false,
            password: stableData?.password,
            pdfDocument: stableData?.pdfDocument,
            numPages: stableData?.numPages,
            previewData: stableData?.previewData,
          },
          isUnlocked: true,
          // Add binary data at root level for consistency
          blob: stableData?.blob,
          dataUrl: stableData?.dataUrl,
          uint8Array: stableData?.uint8Array, // This should contain the file data
          pdfDocument: stableData?.pdfDocument,
        };
      });

    console.log("Fixed unlocked files structure:", unlockedFiles);
    console.log(
      "New generated IDs:",
      unlockedFiles.map((f) => f.id)
    );
    console.log("Individual file structure:", unlockedFiles[0]);

    if (unlockedFiles.length > 0 && onPasswordVerified) {
      onPasswordVerified(unlockedFiles);
    }

    handleClose();
  }, [
    passwordProtectedFiles,
    passwordStatus,
    unlockedFilesData,
    onPasswordVerified,
    generateFileId, // ✅ Add dependency
  ]);

  // Cleanup on close
  const handleClose = useCallback(() => {
    Object.values(unlockedFilesData).forEach((data) => {
      if (data.pdfDocument) data.pdfDocument.destroy();
      if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
        URL.revokeObjectURL(data.dataUrl);
      }
    });

    Object.values(validationTimeouts).forEach(clearTimeout);

    onClose();
  }, [onClose, unlockedFilesData, validationTimeouts]);

  // Helper: status icon and border color based on status
  const getPasswordInputStatus = (fileId) => {
    const status = passwordStatus[fileId];
    const hasPassword = passwords[fileId] && passwords[fileId].trim() !== "";
    const isProcessing = processingFiles[fileId];

    if (!hasPassword) return null;

    if (isProcessing) {
      return {
        icon: (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ),
        borderColor:
          "border-blue-300 focus:border-blue-500 focus:ring-blue-500",
      };
    }

    switch (status) {
      case "checking":
        return {
          icon: <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />,
          borderColor:
            "border-blue-300 focus:border-blue-500 focus:ring-blue-500",
        };
      case "valid":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          borderColor:
            "border-green-300 focus:border-green-500 focus:ring-green-500",
        };
      case "invalid":
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          borderColor: "border-red-300 focus:border-red-500 focus:ring-red-500",
        };
      default:
        return {
          icon: null,
          borderColor:
            "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
        };
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get size robustly
  const getFileSize = (file) => {
    if (file.file instanceof File) return file.file.size;
    if (file instanceof File) return file.size;
    if (file.fileObj instanceof File) return file.fileObj.size;
    return 0;
  };

  // Counts for UI
  const unlockedCount = Object.values(passwordStatus).filter(
    (status) => status === "valid"
  ).length;
  const totalFiles = passwordProtectedFiles.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Unlock Password Protected Files
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {unlockedCount} of {totalFiles} files ready to add
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Progress bar */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Unlock Progress
                </span>
                <span className="text-sm text-blue-700">
                  {unlockedCount}/{totalFiles}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      totalFiles > 0 ? (unlockedCount / totalFiles) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Files list */}
            {passwordProtectedFiles.map((file) => {
              const inputStatus = getPasswordInputStatus(file.id);
              const isUnlocked = passwordStatus[file.id] === "valid";
              const fileSize = getFileSize(file);

              return (
                <div
                  key={file.id}
                  className={`border rounded-lg p-4 transition-all duration-300 ${
                    isUnlocked
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isUnlocked ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {isUnlocked ? (
                        <Unlock className="w-4 h-4 text-white" />
                      ) : (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium text-gray-900 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      {fileSize > 0 && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileSize)}
                        </p>
                      )}
                    </div>
                    {isUnlocked && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Ready to Add
                      </div>
                    )}
                  </div>

                  {/* Password input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showPasswords[file.id] ? "text" : "password"}
                        placeholder="Enter password to unlock"
                        value={passwords[file.id] || ""}
                        onChange={(e) =>
                          handlePasswordChange(file.id, e.target.value)
                        }
                        disabled={processingFiles[file.id] || isUnlocked}
                        className={`w-full p-3 pr-20 border rounded-lg bg-white focus:ring-2 outline-none transition-all duration-200 ${
                          isUnlocked
                            ? "bg-green-50 border-green-300"
                            : inputStatus?.borderColor ||
                              "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />

                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        {inputStatus?.icon}
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(file.id)}
                        disabled={processingFiles[file.id] || isUnlocked}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded flex items-center justify-center"
                      >
                        {showPasswords[file.id] ? (
                          <EyeOff className="w-3 h-3 text-white" />
                        ) : (
                          <Eye className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>

                    {validationErrors[file.id] && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {validationErrors[file.id]}
                      </p>
                    )}

                    {processingFiles[file.id] && (
                      <p className="text-sm text-blue-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Unlocking file...
                      </p>
                    )}

                    {isUnlocked && (
                      <>
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          File unlocked successfully!
                        </p>

                        {/* File Preview below success message */}
                        {unlockedFilesData[file.id]?.previewData && (
                          <div className="bg-white rounded-lg border p-4 mt-3">
                            <div className="flex items-center gap-2 mb-3">
                              <Unlock className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">
                                File Preview
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Pages:</span>
                                <span className="font-medium ml-1">
                                  {
                                    unlockedFilesData[file.id].previewData
                                      .totalPages
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Size:</span>
                                <span className="font-medium ml-1">
                                  {formatFileSize(
                                    unlockedFilesData[file.id].previewData
                                      .fileSize
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Unlocked:</span>
                                <span className="font-medium ml-1">
                                  {
                                    unlockedFilesData[file.id].previewData
                                      .unlockTime
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Id:</span>
                                <span className="font-medium ml-1">
                                  {unlockedFilesData[file.id].previewData.id}
                                </span>
                              </div>
                            </div>

                            {unlockedFilesData[file.id].previewData
                              .previewText && (
                              <div className="bg-gray-50 rounded p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Content Preview:
                                </p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {
                                    unlockedFilesData[file.id].previewData
                                      .previewText
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {unlockedCount > 0 ? (
                <span className="text-green-600 font-medium">
                  ✓ {unlockedCount} file{unlockedCount > 1 ? "s" : ""} ready to
                  add
                </span>
              ) : (
                <span>Enter passwords to unlock files</span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              {unlockedCount > 0 && (
                <button
                  onClick={handleAddUnlockedFiles}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Add {unlockedCount} File{unlockedCount > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
