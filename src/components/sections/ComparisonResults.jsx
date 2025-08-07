import React from 'react';
import { X, Type, Loader2, AlertCircle } from 'lucide-react';

const ComparisonResults = ({
    isOpen,
    onClose,
    isAnalyzing,
    comparisonResult,
    leftAnalysis,
    rightAnalysis
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Text Comparison Results
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {isAnalyzing ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-600">Analyzing documents...</p>
                            </div>
                        </div>
                    ) : comparisonResult ? (
                        <div className="space-y-6">
                            {/* Similarity Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {comparisonResult.similarity.overall}%
                                    </div>
                                    <div className="text-sm text-blue-700">
                                        Overall Similarity
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                        {comparisonResult.changes.changePercentage}%
                                    </div>
                                    <div className="text-sm text-green-700">
                                        Content Changed
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600 mb-1">
                                        {comparisonResult.commonWords}
                                    </div>
                                    <div className="text-sm text-purple-700">Common Words</div>
                                </div>
                            </div>

                            {/* Document Types */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                        <Type className="w-5 h-5 mr-2 text-green-500" />
                                        Left Document ({leftAnalysis?.fileName})
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Type:</span>
                                            <span
                                                className={`font-medium ${leftAnalysis?.fileType === "text-based"
                                                    ? "text-green-600"
                                                    : "text-orange-600"
                                                    }`}
                                            >
                                                {leftAnalysis?.fileType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Word Count:</span>
                                            <span className="font-medium">
                                                {leftAnalysis?.wordCount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Text Pages:</span>
                                            <span className="font-medium">
                                                {leftAnalysis?.textBasedPages}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                        <Type className="w-5 h-5 mr-2 text-green-500" />
                                        Right Document ({rightAnalysis?.fileName})
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Type:</span>
                                            <span
                                                className={`font-medium ${rightAnalysis?.fileType === "text-based"
                                                    ? "text-green-600"
                                                    : "text-orange-600"
                                                    }`}
                                            >
                                                {rightAnalysis?.fileType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Word Count:</span>
                                            <span className="font-medium">
                                                {rightAnalysis?.wordCount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Text Pages:</span>
                                            <span className="font-medium">
                                                {rightAnalysis?.textBasedPages}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Changes Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-800 mb-3">
                                    Changes Breakdown
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                            {comparisonResult.changes.added}
                                        </div>
                                        <div className="text-gray-600">Added Words</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">
                                            {comparisonResult.changes.removed}
                                        </div>
                                        <div className="text-gray-600">Removed Words</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-gray-600">
                                            {comparisonResult.changes.unchanged}
                                        </div>
                                        <div className="text-gray-600">Unchanged Words</div>
                                    </div>
                                </div>
                            </div>

                            {/* Common Phrases */}
                            {comparisonResult.commonPhrases && comparisonResult.commonPhrases.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-800 mb-3">
                                        Common Phrases
                                    </h3>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                        {comparisonResult.commonPhrases.map((phrase, index) => (
                                            <div
                                                key={index}
                                                className="text-sm bg-white rounded px-2 py-1 border"
                                            >
                                                "{phrase}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Similarity Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-800 mb-3">
                                    Similarity Metrics
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Jaccard Similarity:</span>
                                        <span className="font-medium">
                                            {comparisonResult.similarity.jaccard}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Levenshtein Similarity:
                                        </span>
                                        <span className="font-medium">
                                            {comparisonResult.similarity.levenshtein}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Unique to Left:</span>
                                        <span className="font-medium text-orange-600">
                                            {comparisonResult.uniqueWordsLeft}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Unique to Right:</span>
                                        <span className="font-medium text-orange-600">
                                            {comparisonResult.uniqueWordsRight}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Upload both PDF files to see comparison results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComparisonResults;