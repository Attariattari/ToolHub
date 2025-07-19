"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, HardDrive, Cloud, Plus, SortAsc, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { FaGlobe } from "react-icons/fa";

export default function Htmluploader({
  showurl = false,
  uploadButtonText = "Add HTML",
  pageTitle = "HTML to PDF",
  pageSubTitle = "Combine PDFs in the order you want with the easiest PDF merger available.",
  onUrlSubmit,
}) {
  const [addhtml, setAddhtml] = useState(null);
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    const trimmedUrl = url.trim();
    const hasExtension =
      /\.(com|pk|org|net|io|co|edu|gov|in|info|biz|app|xyz)$/i.test(trimmedUrl);
    const hasProtocol =
      trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
    const hasWWW = trimmedUrl.startsWith("www.");

    // ✅ Auto-add www. if needed
    if (trimmedUrl && !hasProtocol && !hasWWW && hasExtension) {
      setTimeout(() => setUrl("www." + trimmedUrl), 0);
    }

    // ✅ Basic URL format check
    const urlPattern = new RegExp(
      "^(https?:\\/\\/|http:\\/\\/|www\\.)?" + // optional protocol/www
        "(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}$",
      "i"
    );

    const isRegexValid = urlPattern.test(trimmedUrl);

    // ✅ Extract domain part before extension
    const domainMatch = trimmedUrl.match(
      /^((https?:\/\/|http:\/\/|www\.)?)([^.]+)\./i
    );
    const domainName = domainMatch?.[3] || "";

    // ✅ Final validation: regex match + domain name should NOT be 'www' or empty
    const isValidUrl =
      isRegexValid &&
      domainName.toLowerCase() !== "www" &&
      domainName.length >= 2;

    setIsValid(isValidUrl);
  }, [url]);
  useEffect(() => {
    if (addhtml && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addhtml]);

  const handleSubmit = () => {
    if (isValid) {
      console.log("✅ Valid URL:", url);

      // Start loader + send URL to parent
      if (onUrlSubmit) {
        onUrlSubmit(url); // Parent will handle setLoading(true)
      }

      setAddhtml(false); // Close modal
      setUrl(""); // Reset input
    }
  };

  const handleaddhtml = () => {
    setAddhtml(true);
    console.log("Button Click");
  };
  const handleClosehtml = () => {
    setAddhtml(false);
    setUrl("");
    console.log("Button Click");
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
            <label htmlFor="file-upload-main" className="cursor-pointer">
              <div
                className="inline-block bg-red-600 hover:bg-red-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4"
                onClick={handleaddhtml}
              >
                {uploadButtonText}
              </div>
            </label>
          </div>

          {/* ✅ Place your conditional popup HERE */}
          {addhtml && (
            <div className="fixed inset-0 bg-black bg-opacity-30 z-50 overflow-auto">
              <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mx-auto mt-10 w-[95%] sm:w-[90%] md:w-[700px] lg:w-[800px] bg-white border border-gray-300 rounded-lg shadow-md text-center relative"
              >
                {/* Top Title + Close */}
                <div className="w-full h-24 flex justify-center items-center relative">
                  <h2 className="text-2xl font-semibold text-gray-800 w-[90%]">
                    Add HTML to convert from
                  </h2>
                  <div
                    className="absolute top-4 right-4 w-8 h-8 text-red-500 border-gray-100 border-2 flex items-center justify-center rounded-full cursor-pointer shadow-sm transition duration-200 transform hover:scale-110"
                    onClick={handleClosehtml}
                  >
                    <IoMdClose className="w-5 h-5 font-bold" />
                  </div>
                </div>

                {/* Tab Section */}
                <div className="flex mt-2 px-4 sm:px-6 ">
                  <div className="border-t-2 border-gray-600 px-4 py-2 font-semibold text-red-600">
                    Url
                  </div>
                </div>

                {/* Input Section */}
                <div className="p-4 sm:p-6 md:p-8 text-left">
                  <label className="block mb-2 text-[16px] font-medium text-gray-800">
                    Write the website URL
                  </label>
                  <div
                    className={`flex items-center border ${
                      !isValid && url ? "border-red-500" : "border-gray-300"
                    } rounded-md px-3 py-2 w-full bg-white`}
                  >
                    <FaGlobe
                      className={`mr-2 ${
                        isValid ? "text-red-500" : "text-gray-500"
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
                            // If input is empty → focus again
                            inputRef.current?.focus();
                          } else if (isValid) {
                            handleSubmit(); // If valid → submit
                          }
                        }
                      }}
                      placeholder="Example: https://ilovepdf.com"
                      className="w-full bg-white focus:outline-none placeholder:text-[16px] text-[16px]"
                    />
                  </div>
                  {!isValid && url && (
                    <p className="text-red-500 text-sm mt-1">
                      Invalid URL format
                    </p>
                  )}
                </div>

                {/* Bottom Button */}
                <div className="flex justify-end border-t px-4 sm:px-6 py-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className={`px-6 py-2 rounded-md font-medium transition ${
                      isValid
                        ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Add
                  </button>
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
