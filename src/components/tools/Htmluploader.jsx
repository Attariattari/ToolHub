import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, HardDrive, Cloud, Plus, SortAsc, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FaGlobe } from "react-icons/fa";

export default function Htmluploader({
  showurl = false,
  uploadButtonText = "Add HTML",
  pageTitle = "HTML to PDF",
  pageSubTitle = "Convert any website to PDF with customizable options.",
  onUrlSubmit,
}) {
  const [addhtml, setAddhtml] = useState(null);
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef(null);

  // Enhanced URL validation
  useEffect(() => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setIsValid(false);
      return;
    }

    // Check for common domain extensions
    const hasExtension = /\.(com|org|net|io|co|edu|gov|in|info|biz|app|xyz|pk|uk|ca|au|de|fr|jp|cn|br|ru|it|es|us)$/i.test(trimmedUrl);
    const hasProtocol = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
    const hasWWW = trimmedUrl.startsWith("www.");

    // Auto-format URL if needed
    if (trimmedUrl && !hasProtocol && (hasWWW || hasExtension)) {
      const formattedUrl = hasWWW || hasExtension ? `https://${trimmedUrl}` : trimmedUrl;
      if (formattedUrl !== url) {
        setTimeout(() => setUrl(formattedUrl), 0);
        return;
      }
    }

    // Comprehensive URL validation
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    // Additional checks for common cases
    const isValidFormat = urlPattern.test(trimmedUrl);
    const hasValidDomain = /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmedUrl);

    setIsValid(isValidFormat && hasValidDomain);
  }, [url]);

  useEffect(() => {
    if (addhtml && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addhtml]);

  const handleSubmit = () => {
    if (isValid && url.trim()) {
      if (onUrlSubmit) {
        onUrlSubmit(url.trim()); // Send clean URL to parent
      }
      setAddhtml(false); // Close modal
      setUrl(""); // Reset input
    }
  };

  const handleaddhtml = () => {
    setAddhtml(true);
  };

  const handleClosehtml = () => {
    setAddhtml(false);
    setUrl("");
  };

  // Helper function to get placeholder text based on common domains
  const getPlaceholderText = () => {
    return "Enter URL (e.g., google.com, github.com)";
  };

  if (!showurl) {
    return (
      <div className="md:h-[calc(100vh-82px)] bg-gray-50">
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {pageTitle}
            </h1>
            <p className="text-xl text-gray-600">{pageSubTitle}</p>
          </div>

          <div className="max-w-2xl mx-auto flex justify-center">
            <button
              onClick={handleaddhtml}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4"
            >
              {uploadButtonText}
            </button>
          </div>

          {/* URL Input Modal */}
          {addhtml && (
            <div className="fixed inset-0 bg-black bg-opacity-30 z-50 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto mt-10 w-[95%] sm:w-[90%] md:w-[700px] lg:w-[800px] bg-white border border-gray-300 rounded-lg shadow-md text-center relative"
              >
                {/* Header */}
                <div className="w-full h-24 flex justify-center items-center relative border-b">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Add Website URL
                  </h2>
                  <button
                    onClick={handleClosehtml}
                    className="absolute top-4 right-4 w-8 h-8 text-blue-500 border-gray-200 border-2 flex items-center justify-center rounded-full hover:bg-gray-50 transition duration-200 transform hover:scale-110"
                  >
                    <IoMdClose className="w-5 h-5 font-bold" />
                  </button>
                </div>

                {/* Tab Section */}
                <div className="flex mt-2 px-4 sm:px-6">
                  <div className="border-t-2 border-blue-600 px-4 py-2 font-semibold text-blue-600">
                    Website URL
                  </div>
                </div>

                {/* Input Section */}
                <div className="p-4 sm:p-6 md:p-8 text-left">
                  <label className="block mb-2 text-[16px] font-medium text-gray-800">
                    Enter the website URL you want to convert
                  </label>

                  <div className="space-y-2">
                    <div
                      className={`flex items-center border-2 ${!isValid && url
                          ? "border-blue-500 bg-blue-50"
                          : isValid
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 bg-white"
                        } rounded-lg px-3 py-3 w-full transition-all duration-200`}
                    >
                      <FaGlobe
                        className={`mr-3 text-lg ${isValid
                            ? "text-green-500"
                            : url && !isValid
                              ? "text-blue-500"
                              : "text-gray-500"
                          }`}
                      />
                      <input
                        ref={inputRef}
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (!url.trim()) {
                              inputRef.current?.focus();
                            } else if (isValid) {
                              handleSubmit();
                            }
                          }
                        }}
                        placeholder={getPlaceholderText()}
                        className="w-full bg-transparent focus:outline-none placeholder:text-gray-500 text-[16px]"
                        autoComplete="url"
                      />
                    </div>

                    {/* Validation Messages */}
                    {url && (
                      <div className="text-sm">
                        {isValid ? (
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Valid URL - Ready to convert!
                          </div>
                        ) : (
                          <div className="text-blue-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Please enter a valid website URL
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              Examples: google.com, github.com, https://example.com
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Helpful Tips */}
                    {!url && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• You can enter URLs with or without https://</p>
                        <p>• Examples: google.com, www.github.com, https://stackoverflow.com</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Button */}
                <div className="flex justify-end border-t px-4 sm:px-6 py-4 bg-gray-50">
                  <div className="flex gap-3">
                    <button
                      onClick={handleClosehtml}
                      className="px-6 py-2 rounded-md font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!isValid || !url.trim()}
                      className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${isValid && url.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      {isValid && url.trim() ? "Add Website" : "Enter Valid URL"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
          © PDF ToolsHub 2025 • Your PDF Editor
        </footer>
      </div>
    );
  }
}