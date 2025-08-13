"use client";
import Htmluploader from "@/components/tools/Htmluploader";
import { useRouter } from "next/navigation";
import ProgressScreen from "@/components/tools/ProgressScreen";
import { ImageIcon, X, ArrowRight, ChevronDown } from "lucide-react";
import { HiOutlineRefresh } from "react-icons/hi";
import React, {
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useState,
} from "react";
import { FaGlobe, FaRecycle } from "react-icons/fa";
import { toast } from "react-toastify";
import Api from "@/utils/Api";

function page() {
  const [url, setUrl] = useState("www.ilovepdf.com");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [actualScreenWidth, setActualScreenWidth] = useState(1600);

  // PDF Options
  const [pageOrientation, setPageOrientation] = useState("landscape"); // "portrait" or "landscape"
  const [margin, setMargin] = useState("none"); // "none", "small", "big"
  const [pageSize, setPageSize] = useState("fit");
  const [screenSize, setScreenSize] = useState("pcscreen");
  const [blockadds, setBlockadds] = useState(false);
  const [overlaypopupo, setOverlaypopupo] = useState(false);
  const fileDataCache = useRef({});
  const router = useRouter();

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (url.length === 0) return;

    console.log("Converting URL:", url);
    console.log("Margin Options:", margin);
    console.log("Page Orientation:", pageOrientation);
    console.log("Page Size:", pageSize);
    console.log("Screen Size:", screenSize);
    console.log("Block Ads:", blockadds);
    console.log("Overlay Popups:", overlaypopupo);
    console.log("Actual Screen Width:", actualScreenWidth);
    console.log("Iframe Key:", iframeKey);
    console.log("Is Valid URL:", isValid);
    console.log("Is Loading:", isLoading);
    console.log("Is Uploading:", isUploading);
    console.log("File Data Cache:", fileDataCache.current);
    console.log("Router:", router);
    console.log("Window Width:", window.innerWidth);
    console.log("Window Height:", window.innerHeight);

    // setIsUploading(true);
    // setUploadProgress(0);

    // try {
    //   const formData = new FormData();

    //   // // Add files with their order and rotation
    //   // url.forEach((file, index) => {
    //   //   formData.append("url", url.url);
    //   //   formData.append(`fileOrder_${index}`, index.toString());
    //   //   formData.append(
    //   //     `fileRotation_${index}`,
    //   //     (fileRotations[url.id] || 0).toString()
    //   //   );
    //   // });

    //   // Add PDF options
    //   formData.append("pageOrientation", pageOrientation);
    //   formData.append("pageSize", pageSize);
    //   formData.append("screenSize", screenSize);
    //   formData.append("margin", margin);
    //   formData.append("blockadds", blockadds.toString());
    //   formData.append("overlaypopupo", overlaypopupo.toString());

    //   const response = await Api.post("/tools/jpg-to-pdf", formData, {
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //     },
    //     onUploadProgress: (progressEvent) => {
    //       const progress = Math.round(
    //         (progressEvent.loaded * 100) / progressEvent.total
    //       );
    //       setUploadProgress(progress);
    //     },
    //   });

    //   if (response.data) {
    //     const encodedZipPath = encodeURIComponent(response.data.data.fileUrl);
    //     const downloadUrl = `/downloads/document=${encodedZipPath}?dbTaskId=${response.data.data.dbTaskId}`;
    //     router.push(downloadUrl);
    //   } else {
    //     toast.error("No converted files received from server");
    //   }
    // } catch (error) {
    //   console.error("Convert error:", error);
    //   toast.error(error?.response?.data?.message || "Error converting images");
    //   alert("Failed to convert images to PDF. Please try again.");
    // } finally {
    //   setIsUploading(false);
    // }
  }, [
    url,
    pageOrientation,
    pageSize,
    screenSize,
    margin,
    blockadds,
    overlaypopupo,
    router,
  ]);

  // ✅ Callback when valid URL is submitted
  const handleUrlSubmit = useCallback((newUrl) => {
    console.log("📩 URL received from child:", newUrl);
    setUrl(newUrl);
  }, []);

  useEffect(() => {
    const updateWidth = () => setActualScreenWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);
  const getIframeWidth = () => {
    switch (screenSize) {
      case "pcscreen":
        return actualScreenWidth;
      case "desktophd":
        return 1920;
      case "desktop":
        return 1440;
      case "tablet":
        return 768;
      case "mobile":
        return 320;
      default:
        return "100%";
    }
  };

  // Page size options
  const pageSizeOptions = [
    { value: "fit", label: "Fit (Same page size as image)" },
    { value: "a4", label: "A4 (297x210 mm)" },
    { value: "letter", label: "US Letter (215x279.4 mm)" },
  ];

  const ScreensizeOptions = [
    { value: "pcscreen", label: "Your screen (1600px)" },
    { value: "desktophd", label: "Desktop HD (1920px)" },
    { value: "desktop", label: "Desktop (1440px)" },
    { value: "tablet", label: "Tablet (768px)" },
    { value: "mobile", label: "Mobile (320px)" },
  ];

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

  // Optimized file data creation
  const createStableFileData = useCallback(async (file, id) => {
    if (fileDataCache.current[id]) {
      return fileDataCache.current[id];
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = new Blob([uint8Array], { type: file.type });
      const objectUrl = URL.createObjectURL(blob);

      const stableData = {
        blob,
        dataUrl: objectUrl,
        uint8Array: uint8Array.slice(),
      };

      fileDataCache.current[id] = stableData;
      return stableData;
    } catch (error) {
      console.error("Error creating stable file data:", error);
      return null;
    }
  }, []);

  // // Memoized calculations
  // const totalSize = useMemo();
  // () =>
  //   url
  //     .reduce((total, file) => total + Number.parseFloat(file.size), 0)
  //     .toFixed(2),
  // [url]

  const SafeFileUploader = ({
    whileTap,
    whileHover,
    animate,
    initial,
    ...safeProps
  }) => {
    return <Htmluploader {...safeProps} />;
  };

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />;
  }

  if (url.length === 0) {
    return (
      <SafeFileUploader
        showurl={false}
        uploadButtonText="Add HTML"
        pageTitle="HTML to PDF"
        pageSubTitle="Convert JPG images to PDF in seconds. Easily adjust orientation and margins."
        onUrlSubmit={(url) => {
          setIsLoading(true); // 👈 Start loader in parent
          setUrl(url); // 👈 Set the URL for iframe
          setIframeKey((prev) => prev + 1);
        }}
      />
    );
  }

  // Custom Dropdown Component
  const CustomDropdown = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-red-300 transition-colors duration-200"
        >
          <span className="text-gray-900 font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  console.log("Selected screen size:", option.value); // ← yeh add karo
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  value === option.value
                    ? "bg-red-50 text-red-600 font-medium"
                    : "text-gray-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleresetscreen = () => {
    setScreenSize(null);
  };
  const handleSubmit = () => {
    if (isValid && url) {
      setIsLoading(true); // start loader
      setIframeKey((prev) => prev + 1); // force iframe refresh
      setUrl(url.trim()); // ya koi formatting jo karni hai
      handleUrlSubmit(url.trim()); // send to parent
    }
  };

  return (
    <div className="md:h-[calc(100vh-82px)]">
      <div className="grid grid-cols-1 md:grid-cols-10 border h-full">
        {/* Main Content */}
        <div className=" md:col-span-7 bg-gray-100 overflow-y-auto custom-scrollbar">
          <div className="w-full min-h-screen flex justify-center items-center bg-gray-50">
            <div className="w-full max-w-5xl">
              <div className="w-full min-h-screen flex justify-center items-center bg-gray-50">
                <div
                  className="overflow-auto"
                  style={{ width: getIframeWidth() }}
                >
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[600px]">
                      <div className="w-10 h-10 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <iframe
                      key={iframeKey}
                      src={url.startsWith("http") ? url : `http://${url}`}
                      onLoad={() => setIsLoading(false)}
                      className="w-full h-[600px] border rounded shadow"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>{" "}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              HTML to PDF options
            </h3>

            <div className="mb-6 py-6 ">
              <h4 className="font-semibold text-gray-900 mb-3">Website Url</h4>
              <div className="w-full flex">
                <div
                  className={`flex items-stretch border ${
                    !isValid && url ? "border-red-500" : "border-gray-300"
                  }  w-full bg-white overflow-hidden`}
                  style={{
                    borderRadius: "10px 0px 0px 10px",
                  }}
                >
                  {/* Left Icon */}
                  <div className="w-10 flex justify-center items-center px-3">
                    <FaGlobe
                      className={`${
                        isValid ? "text-red-500" : "text-gray-500"
                      }`}
                    />
                  </div>
                  {/* Input */}
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Example: https://ilovepdf.com"
                    className="w-full px-3 py-2 bg-white focus:outline-none placeholder:text-[16px] text-[16px]"
                  />
                </div>

                <div
                  className="w-12 h-12 flex justify-center items-center bg-red-600 cursor-pointer"
                  style={{
                    borderRadius: "0px 10px 10px 0px",
                  }}
                  onClick={() => handleSubmit()}
                >
                  <HiOutlineRefresh className="text-white w-6 h-6" />
                </div>
              </div>
              {/* Error */}
              {!isValid && url && (
                <p className="text-red-500 text-sm mt-1">Invalid URL format</p>
              )}
            </div>

            {/* Page Size */}
            <div className="mb-6">
              <div className="w-full flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Screen size
                </h4>
                <h4
                  className="font-semibold underline text-red-600 mb-3 cursor-pointer"
                  onClick={(e) => {
                    handleresetscreen();
                  }}
                >
                  Reset all
                </h4>
              </div>
              <CustomDropdown
                value={screenSize}
                onChange={setScreenSize}
                options={ScreensizeOptions}
                placeholder="Select Screen size"
              />
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Page size</h4>
              <CustomDropdown
                value={pageSize}
                onChange={setPageSize}
                options={pageSizeOptions}
                placeholder="Select page size"
              />
            </div>
            {/* Page Orientation */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Page orientation
              </h4>
              <div className="flex gap-3">
                <button
                  onClick={() => setPageOrientation("portrait")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                    pageOrientation === "portrait"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-10 border-2 rounded ${
                        pageOrientation === "portrait"
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        pageOrientation === "portrait"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      Portrait
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setPageOrientation("landscape")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                    pageOrientation === "landscape"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-8 border-2 rounded ${
                        pageOrientation === "landscape"
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        pageOrientation === "landscape"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      Landscape
                    </span>
                  </div>
                </button>
              </div>
            </div>
            {/* Margin */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setMargin("none")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                    margin === "none"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon
                      className={`w-6 h-6 ${
                        margin === "none" ? "text-red-500" : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        margin === "none" ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      No margin
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setMargin("small")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                    margin === "small"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-6 h-6 border-2 border-dashed rounded ${
                        margin === "small"
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        margin === "small" ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      Small
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setMargin("big")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                    margin === "big"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-6 h-6 border-4 border-dashed rounded ${
                        margin === "big" ? "border-red-500" : "border-gray-400"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        margin === "big" ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      Big
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-3">HTML Setting</h4>
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={blockadds}
                      onChange={(e) => setBlockadds(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                        blockadds
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">
                    Try to block ads
                  </span>
                </label>
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={overlaypopupo}
                      onChange={(e) => setOverlaypopupo(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                        overlaypopupo
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-700 font-medium">
                      Remove overlay popups
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="w-full p-6 sticky bottom-0 bg-white">
            <button
              onClick={handleConvert}
              disabled={url.length === 0}
              className={`w-full sticky bottom-0 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                url.length > 0
                  ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Convert to PDF
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
        <button
          onClick={handleConvert}
          disabled={url.length === 0}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            url.length > 0
              ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Convert to PDF
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                HTML to PDF options
              </h3>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4">
              {/* Mobile Options - Same as desktop but in mobile layout */}
              <div className="space-y-6">
                {/* Page Orientation */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Page orientation
                  </h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPageOrientation("portrait")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                        pageOrientation === "portrait"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-8 h-10 border-2 rounded ${
                            pageOrientation === "portrait"
                              ? "border-red-500"
                              : "border-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            pageOrientation === "portrait"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          Portrait
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPageOrientation("landscape")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                        pageOrientation === "landscape"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-10 h-8 border-2 rounded ${
                            pageOrientation === "landscape"
                              ? "border-red-500"
                              : "border-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            pageOrientation === "landscape"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          Landscape
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Page Size */}
                <div>
                  <div className="w-full flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Screen size
                    </h4>
                    <h4
                      className="font-semibold underline text-red-600 mb-3 cursor-pointer"
                      onClick={(e) => {
                        handleresetscreen();
                      }}
                    >
                      Reset all
                    </h4>
                  </div>
                  <CustomDropdown
                    value={screenSize}
                    onChange={setScreenSize}
                    options={ScreensizeOptions}
                    placeholder="Select Screen size"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Page size
                  </h4>
                  <CustomDropdown
                    value={pageSize}
                    onChange={setPageSize}
                    options={pageSizeOptions}
                    placeholder="Select page size"
                  />
                </div>

                {/* Margin */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Margin</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMargin("none")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        margin === "none"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon
                          className={`w-6 h-6 ${
                            margin === "none" ? "text-red-500" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            margin === "none" ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          No margin
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin("small")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        margin === "small"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-6 h-6 border-2 border-dashed rounded ${
                            margin === "small"
                              ? "border-red-500"
                              : "border-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            margin === "small"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          Small
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin("big")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        margin === "big"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-6 h-6 border-4 border-dashed rounded ${
                            margin === "big"
                              ? "border-red-500"
                              : "border-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            margin === "big" ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          Big
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className=" ">
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      HTML Setting
                    </h4>
                    <div className="mb-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={blockadds}
                            onChange={(e) => setBlockadds(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                              blockadds
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          Try to block ads
                        </span>
                      </label>
                    </div>
                    <div className="mb-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={overlaypopupo}
                            onChange={(e) => setOverlaypopupo(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                              overlaypopupo
                                ? "bg-green-500 border-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          Remove overlay popups
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={url.length === 0}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                      url.length > 0
                        ? "bg-red-600 hover:bg-red-700 hover:scale-105 shadow-lg"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Convert to PDF
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default page;
