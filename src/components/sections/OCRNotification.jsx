import React from 'react';
import { ImageIcon, Type } from 'lucide-react';

const OCRNotification = ({
    requiresOCR,
    leftIsImageBased,
    rightIsImageBased,
    leftAnalysis,
    rightAnalysis,
    ocrToolUrl = "/ocr-pdf" // Default URL, can be overridden
}) => {
    if (!requiresOCR) return null;

    return (
        <div className="px-3 sm:px-4 md:px-4 my-4">
            {/* Main OCR Alert */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-3 sm:p-4 mb-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 18.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <div className="ml-2 sm:ml-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-orange-800">
                            OCR Processing Required
                        </h3>
                        <p className="text-xs sm:text-sm text-orange-700 mt-1 leading-relaxed">
                            {leftIsImageBased && rightIsImageBased
                                ? "Both PDFs contain scanned images"
                                : "One PDF contains scanned images"}{" "}
                            and require OCR for text comparison.
                        </p>
                    </div>
                </div>
            </div>

            {/* File Analysis Details */}
            <div className="space-y-2 sm:space-y-3 mb-4">
                {/* Left File Status */}
                <div
                    className={`border rounded-lg p-2 sm:p-3 ${leftIsImageBased
                        ? "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                        }`}
                >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs sm:text-sm font-medium">
                            Left Document
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {leftIsImageBased ? (
                                <>
                                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                        Requires OCR
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Type className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                        Text Ready
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <p
                        className="text-xs text-gray-600 mt-1 truncate"
                        title={leftAnalysis?.fileName}
                    >
                        {leftAnalysis?.fileName}
                    </p>
                    <div className="text-xs mt-1 sm:mt-2">
                        <span className="text-gray-500">
                            Text: {leftAnalysis?.textBasedPages}/{leftAnalysis?.totalPages}{" "}
                            •{leftAnalysis?.confidence}%
                        </span>
                    </div>
                </div>

                {/* Right File Status */}
                <div
                    className={`border rounded-lg p-2 sm:p-3 ${rightIsImageBased
                        ? "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                        }`}
                >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs sm:text-sm font-medium">
                            Right Document
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {rightIsImageBased ? (
                                <>
                                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                        Requires OCR
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Type className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                                    <span className="text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                                        Text Ready
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <p
                        className="text-xs text-gray-600 mt-1 truncate"
                        title={rightAnalysis?.fileName}
                    >
                        {rightAnalysis?.fileName}
                    </p>
                    <div className="text-xs mt-1 sm:mt-2">
                        <span className="text-gray-500">
                            Text: {rightAnalysis?.textBasedPages}/
                            {rightAnalysis?.totalPages} •{rightAnalysis?.confidence}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Solution Steps - Collapsible on mobile */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-blue-800 mb-2">
                    💡 How to proceed:
                </h4>
                <ol className="text-xs sm:text-sm text-blue-700 space-y-1 sm:space-y-2">
                    <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                            1
                        </span>
                        <span className="leading-tight">
                            Use OCR software to convert your scanned PDF
                        </span>
                    </li>
                    <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                            2
                        </span>
                        <span className="leading-tight">Or use our OCR tool below</span>
                    </li>
                    <li className="flex items-start">
                        <span className="bg-blue-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                            3
                        </span>
                        <span className="leading-tight">
                            Upload the text-searchable version
                        </span>
                    </li>
                </ol>
            </div>

            {/* OCR Tools Suggestions */}
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-700 mb-2">
                    🔧 Recommended OCR Tools:
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                        • <strong className="text-red-600">PDF ToolsHub</strong> (Our OCR
                        Tool)
                    </li>
                    <li className="hidden sm:block">
                        • Adobe Acrobat Pro (Built-in OCR)
                    </li>
                    <li className="hidden sm:block">
                        • Google Drive (Free OCR conversion)
                    </li>
                    <li className="hidden sm:block">
                        • Microsoft Office (Built-in OCR)
                    </li>
                    <li className="sm:hidden">• Adobe, Google Drive, MS Office</li>
                    <li className="sm:hidden">• SmallPDF, IlovePDF</li>
                </ul>
            </div>

            {/* Use Our OCR Tool Button */}
            <div className="mt-3 sm:mt-4">
                <a
                    href={ocrToolUrl}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                    <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                    Use Our OCR Tool
                </a>
            </div>
        </div>
    );
};

export default OCRNotification;