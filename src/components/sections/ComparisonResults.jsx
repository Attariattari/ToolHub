import React, { useState, useMemo } from "react";
import {
  X,
  Type,
  Loader2,
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Printer,
  Share2,
  Calendar,
  Clock,
  Target,
  Layers,
  Hash,
  BookOpen,
  GitCompare,
  Award,
  AlertTriangle,
} from "lucide-react";

const ComparisonResults = ({
  isOpen,
  onClose,
  isAnalyzing,
  comparisonResult,
  leftAnalysis,
  rightAnalysis,
  leftDifferences = [],
  rightDifferences = [],
  showHighlights,
  onToggleHighlights,
  onGenerateHighlights,
  comparisonComplete,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDetails, setShowDetails] = useState(false);

  // Calculate detailed metrics
  const metrics = useMemo(() => {
    if (!comparisonResult || !leftAnalysis || !rightAnalysis) return null;

    const totalHighlights = leftDifferences.length + rightDifferences.length;
    const changeIntensity = comparisonResult.changes?.changePercentage || 0;

    let changeLevel = "Minimal";
    let changeLevelColor = "text-green-600";
    if (changeIntensity > 20) {
      changeLevel = "Significant";
      changeLevelColor = "text-red-600";
    } else if (changeIntensity > 5) {
      changeLevel = "Moderate";
      changeLevelColor = "text-orange-600";
    }

    const qualityScore = Math.round(
      ((leftAnalysis.extractionQuality === "high"
        ? 100
        : leftAnalysis.extractionQuality === "medium"
        ? 70
        : 40) +
        (rightAnalysis.extractionQuality === "high"
          ? 100
          : rightAnalysis.extractionQuality === "medium"
          ? 70
          : 40)) /
        2
    );

    return {
      totalHighlights,
      changeIntensity,
      changeLevel,
      changeLevelColor,
      qualityScore,
      processingTime: comparisonResult.timestamp
        ? new Date(comparisonResult.timestamp).toLocaleString()
        : new Date().toLocaleString(),
      analysisDepth: comparisonResult.analysisDepth || "standard",
    };
  }, [
    comparisonResult,
    leftAnalysis,
    rightAnalysis,
    leftDifferences,
    rightDifferences,
  ]);

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      documents: {
        left: leftAnalysis?.fileName,
        right: rightAnalysis?.fileName,
      },
      similarity: comparisonResult?.similarity,
      changes: comparisonResult?.changes,
      highlights: leftDifferences.length + rightDifferences.length,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 custom-scrollbar">
      <div className="bg-white rounded-xl max-w-6xl w-full h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <GitCompare className="w-7 h-7" />
                PDF Comparison Report
              </h2>
              <p className="text-red-100">
                {metrics
                  ? `Generated on ${metrics.processingTime} • ${
                      metrics.analysisDepth.charAt(0).toUpperCase() +
                      metrics.analysisDepth.slice(1)
                    } Analysis`
                  : "Comprehensive document analysis and comparison"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReport}
                disabled={!comparisonResult}
                className="p-2 bg-red-500 hover:bg-red-400 rounded-lg transition-colors disabled:opacity-50"
                title="Export Report"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(95vh-140px)]">
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="relative mb-6">
                  <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto" />
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Analyzing Documents
                </h3>
                <p className="text-gray-600">
                  Processing your PDF files for comprehensive comparison...
                </p>
              </div>
            </div>
          ) : comparisonResult ? (
            <div className="p-6 space-y-6 overflow-y-auto max-h-full">
              {/* Status Banner */}
              <div
                className={`rounded-lg p-4 mb-6 ${
                  comparisonResult.requiresOCR
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {comparisonResult.requiresOCR ? (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  <div>
                    <h3
                      className={`font-semibold ${
                        comparisonResult.requiresOCR
                          ? "text-orange-800"
                          : "text-green-800"
                      }`}
                    >
                      {comparisonResult.requiresOCR
                        ? "OCR Processing Required"
                        : "Analysis Complete"}
                    </h3>
                    <p
                      className={`text-sm ${
                        comparisonResult.requiresOCR
                          ? "text-orange-700"
                          : "text-green-700"
                      }`}
                    >
                      {comparisonResult.requiresOCR
                        ? "One or more documents contain image-based content requiring OCR for full text comparison."
                        : `Successfully analyzed ${
                            leftAnalysis.totalPages + rightAnalysis.totalPages
                          } pages with ${
                            metrics?.qualityScore
                          }% extraction quality.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  {["overview", "documents", "changes", "metrics"].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab
                            ? "border-red-500 text-red-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <Target className="w-8 h-8 text-red-600" />
                        <span className="text-xs font-medium text-red-600 bg-red-200 px-2 py-1 rounded-full">
                          SIMILARITY
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-red-700 mb-1">
                        {comparisonResult.similarity?.overall || 0}%
                      </div>
                      <div className="text-sm text-red-600">Overall Match</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
                          CHANGES
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-green-700 mb-1">
                        {metrics?.changeIntensity || 0}%
                      </div>
                      <div className="text-sm text-green-600">
                        Content Modified
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <Hash className="w-8 h-8 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                          HIGHLIGHTS
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        {metrics?.totalHighlights || 0}
                      </div>
                      <div className="text-sm text-purple-600">
                        Differences Found
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <Award className="w-8 h-8 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
                          QUALITY
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-orange-700 mb-1">
                        {metrics?.qualityScore || 0}%
                      </div>
                      <div className="text-sm text-orange-600">
                        Extraction Quality
                      </div>
                    </div>
                  </div>

                  {/* Change Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Change Analysis Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {comparisonResult.changes?.added || 0}
                        </div>
                        <div className="text-sm text-gray-600">Words Added</div>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingDown className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {comparisonResult.changes?.removed || 0}
                        </div>
                        <div className="text-sm text-gray-600">
                          Words Removed
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Minus className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-600 mb-1">
                          {comparisonResult.changes?.unchanged || 0}
                        </div>
                        <div className="text-sm text-gray-600">
                          Words Unchanged
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="w-5 h-5 text-red-500" />
                          <span className="font-medium text-gray-800">
                            Change Intensity
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${metrics?.changeLevelColor}`}
                          >
                            {metrics?.changeLevel}
                          </span>
                          <span className="text-gray-500">
                            ({metrics?.changeIntensity}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Structural Comparison */}
                  {comparisonResult.structural && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        Structural Changes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-gray-600 mb-1">Page Count</div>
                          <div className="font-semibold">
                            {comparisonResult.structural.pageCountChange > 0
                              ? "+"
                              : ""}
                            {comparisonResult.structural.pageCountChange}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-gray-600 mb-1">Word Count</div>
                          <div className="font-semibold">
                            {comparisonResult.structural.wordCountChange > 0
                              ? "+"
                              : ""}
                            {comparisonResult.structural.wordCountChange.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-gray-600 mb-1">
                            Character Count
                          </div>
                          <div className="font-semibold">
                            {comparisonResult.structural.charCountChange > 0
                              ? "+"
                              : ""}
                            {comparisonResult.structural.charCountChange.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="text-gray-600 mb-1">
                            Word Change %
                          </div>
                          <div className="font-semibold">
                            {comparisonResult.structural
                              .wordCountChangePercent > 0
                              ? "+"
                              : ""}
                            {Math.round(
                              comparisonResult.structural.wordCountChangePercent
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Document */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-800">
                            Left Document
                          </h3>
                          <p
                            className="text-sm text-red-600 truncate"
                            title={leftAnalysis?.fileName}
                          >
                            {leftAnalysis?.fileName}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-red-700 font-medium">
                            Document Type
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              leftAnalysis?.fileType === "text-based"
                                ? "bg-green-200 text-green-800"
                                : "bg-orange-200 text-orange-800"
                            }`}
                          >
                            {leftAnalysis?.fileType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Total Pages</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.totalPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Text Pages</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.textBasedPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Image Pages</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.imageBasedPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Word Count</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.wordCount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Avg Words/Page</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.avgWordsPerPage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">
                            Extraction Quality
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              leftAnalysis?.extractionQuality === "high"
                                ? "bg-green-200 text-green-800"
                                : leftAnalysis?.extractionQuality === "medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {leftAnalysis?.extractionQuality}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Confidence</span>
                          <span className="font-semibold text-red-800">
                            {leftAnalysis?.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Document */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800">
                            Right Document
                          </h3>
                          <p
                            className="text-sm text-green-600 truncate"
                            title={rightAnalysis?.fileName}
                          >
                            {rightAnalysis?.fileName}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">
                            Document Type
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rightAnalysis?.fileType === "text-based"
                                ? "bg-green-200 text-green-800"
                                : "bg-orange-200 text-orange-800"
                            }`}
                          >
                            {rightAnalysis?.fileType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Total Pages</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.totalPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Text Pages</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.textBasedPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Image Pages</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.imageBasedPages}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Word Count</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.wordCount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Avg Words/Page</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.avgWordsPerPage}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">
                            Extraction Quality
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rightAnalysis?.extractionQuality === "high"
                                ? "bg-green-200 text-green-800"
                                : rightAnalysis?.extractionQuality === "medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {rightAnalysis?.extractionQuality}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Confidence</span>
                          <span className="font-semibold text-green-800">
                            {rightAnalysis?.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "changes" && (
                <div className="space-y-6">
                  {/* Changes Overview */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Changes Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-2">
                          Change Distribution
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-green-600">
                              Added Content
                            </span>
                            <span className="font-semibold">
                              {comparisonResult.changes?.addedChars || 0} chars
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-red-600">
                              Removed Content
                            </span>
                            <span className="font-semibold">
                              {comparisonResult.changes?.removedChars || 0}{" "}
                              chars
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-2">
                          Change Significance
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Significant Changes
                            </span>
                            <span
                              className={`font-semibold ${
                                comparisonResult.changes?.significantChanges
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {comparisonResult.changes?.significantChanges
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              Change Threshold
                            </span>
                            <span className="font-semibold">5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Common Phrases */}
                  {comparisonResult.commonPhrases && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Common Content
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {comparisonResult.commonPhrases.trigrams &&
                          comparisonResult.commonPhrases.trigrams.length >
                            0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-3">
                                Common 3-word Phrases
                              </div>
                              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                {comparisonResult.commonPhrases.trigrams
                                  .slice(0, 10)
                                  .map((phrase, index) => (
                                    <div
                                      key={index}
                                      className="text-sm bg-white rounded px-3 py-2 border"
                                    >
                                      "{phrase}"
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {comparisonResult.commonPhrases.bigrams &&
                          comparisonResult.commonPhrases.bigrams.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-3">
                                Common 2-word Phrases
                              </div>
                              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                {comparisonResult.commonPhrases.bigrams
                                  .slice(0, 10)
                                  .map((phrase, index) => (
                                    <div
                                      key={index}
                                      className="text-sm bg-white rounded px-3 py-2 border"
                                    >
                                      "{phrase}"
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "metrics" && (
                <div className="space-y-6">
                  {/* Similarity Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Detailed Similarity Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">
                              Jaccard Similarity
                            </span>
                            <span className="font-semibold">
                              {comparisonResult.similarity?.jaccard || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  comparisonResult.similarity?.jaccard || 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">
                              Levenshtein Similarity
                            </span>
                            <span className="font-semibold">
                              {comparisonResult.similarity?.levenshtein || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  comparisonResult.similarity?.levenshtein || 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">
                              Structural Similarity
                            </span>
                            <span className="font-semibold">
                              {Math.round(
                                comparisonResult.similarity?.structural || 0
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  comparisonResult.similarity?.structural || 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-sm text-gray-600 mb-2">
                            Analysis Details
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Processing Time</span>
                              <span className="font-medium">
                                {metrics?.processingTime}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Analysis Type</span>
                              <span className="font-medium capitalize">
                                {comparisonResult.analysisDepth}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>OCR Required</span>
                              <span
                                className={`font-medium ${
                                  comparisonResult.requiresOCR
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {comparisonResult.requiresOCR ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border">
                          <div className="text-sm text-gray-600 mb-2">
                            Content Statistics
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Left Document Words</span>
                              <span className="font-medium">
                                {comparisonResult.metadata?.leftWordCount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Right Document Words</span>
                              <span className="font-medium">
                                {comparisonResult.metadata?.rightWordCount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Left Characters</span>
                              <span className="font-medium">
                                {comparisonResult.metadata?.leftCharCount?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Right Characters</span>
                              <span className="font-medium">
                                {comparisonResult.metadata?.rightCharCount?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Type Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      File Type Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="text-sm text-gray-600 mb-3">
                          Left Document Analysis
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>File Type</span>
                            <span
                              className={`font-medium px-2 py-1 rounded text-xs ${
                                comparisonResult.metadata?.fileTypes?.left ===
                                "text-based"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {comparisonResult.metadata?.fileTypes?.left}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Extraction Quality</span>
                            <span
                              className={`font-medium px-2 py-1 rounded text-xs ${
                                comparisonResult.metadata?.quality?.left ===
                                "high"
                                  ? "bg-green-100 text-green-800"
                                  : comparisonResult.metadata?.quality?.left ===
                                    "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {comparisonResult.metadata?.quality?.left}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border">
                        <div className="text-sm text-gray-600 mb-3">
                          Right Document Analysis
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>File Type</span>
                            <span
                              className={`font-medium px-2 py-1 rounded text-xs ${
                                comparisonResult.metadata?.fileTypes?.right ===
                                "text-based"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {comparisonResult.metadata?.fileTypes?.right}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Extraction Quality</span>
                            <span
                              className={`font-medium px-2 py-1 rounded text-xs ${
                                comparisonResult.metadata?.quality?.right ===
                                "high"
                                  ? "bg-green-100 text-green-800"
                                  : comparisonResult.metadata?.quality
                                      ?.right === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {comparisonResult.metadata?.quality?.right}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Performance & Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border text-center">
                        <Clock className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Generated</div>
                        <div className="font-semibold text-sm">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border text-center">
                        <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Total Pages</div>
                        <div className="font-semibold">
                          {(leftAnalysis?.totalPages || 0) +
                            (rightAnalysis?.totalPages || 0)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border text-center">
                        <Hash className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Total Words</div>
                        <div className="font-semibold">
                          {(
                            (comparisonResult.metadata?.leftWordCount || 0) +
                            (comparisonResult.metadata?.rightWordCount || 0)
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border text-center">
                        <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Differences</div>
                        <div className="font-semibold">
                          {metrics?.totalHighlights || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Comparison Available
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Upload both PDF files and run the comparison to view detailed
                analysis results.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {comparisonResult && !comparisonResult.requiresOCR && (
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Analysis Complete</span>
                </div>
                {metrics && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4 text-red-500" />
                    <span>
                      {metrics.totalHighlights} differences identified
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>

                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonResults;
// import React, { useState, useMemo } from "react";
// import {
//   X,
//   Type,
//   Loader2,
//   AlertCircle,
//   FileText,
//   BarChart3,
//   TrendingUp,
//   TrendingDown,
//   Minus,
//   CheckCircle,
//   XCircle,
//   Info,
//   Download,
//   Printer,
//   Share2,
//   Calendar,
//   Clock,
//   Target,
//   Layers,
//   Hash,
//   BookOpen,
//   GitCompare,
//   Award,
//   AlertTriangle,
// } from "lucide-react";

// const ComparisonResults = ({
//   isOpen,
//   onClose,
//   isAnalyzing,
//   comparisonResult,
//   leftAnalysis,
//   rightAnalysis,
//   leftDifferences = [],
//   rightDifferences = [],
//   showHighlights,
//   onToggleHighlights,
//   onGenerateHighlights,
//   comparisonComplete,
// }) => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [showDetails, setShowDetails] = useState(false);

//   // Calculate detailed metrics
//   const metrics = useMemo(() => {
//     if (!comparisonResult || !leftAnalysis || !rightAnalysis) return null;

//     const totalHighlights = leftDifferences.length + rightDifferences.length;
//     const changeIntensity = comparisonResult.changes?.changePercentage || 0;

//     let changeLevel = "Minimal";
//     let changeLevelColor = "text-green-600";
//     if (changeIntensity > 20) {
//       changeLevel = "Significant";
//       changeLevelColor = "text-red-600";
//     } else if (changeIntensity > 5) {
//       changeLevel = "Moderate";
//       changeLevelColor = "text-orange-600";
//     }

//     const qualityScore = Math.round(
//       ((leftAnalysis.extractionQuality === "high"
//         ? 100
//         : leftAnalysis.extractionQuality === "medium"
//         ? 70
//         : 40) +
//         (rightAnalysis.extractionQuality === "high"
//           ? 100
//           : rightAnalysis.extractionQuality === "medium"
//           ? 70
//           : 40)) /
//         2
//     );

//     return {
//       totalHighlights,
//       changeIntensity,
//       changeLevel,
//       changeLevelColor,
//       qualityScore,
//       processingTime: comparisonResult.timestamp
//         ? new Date(comparisonResult.timestamp).toLocaleString()
//         : new Date().toLocaleString(),
//       analysisDepth: comparisonResult.analysisDepth || "standard",
//     };
//   }, [
//     comparisonResult,
//     leftAnalysis,
//     rightAnalysis,
//     leftDifferences,
//     rightDifferences,
//   ]);

//   const handleExportReport = () => {
//     const reportData = {
//       timestamp: new Date().toISOString(),
//       documents: {
//         left: leftAnalysis?.fileName,
//         right: rightAnalysis?.fileName,
//       },
//       similarity: comparisonResult?.similarity,
//       changes: comparisonResult?.changes,
//       highlights: leftDifferences.length + rightDifferences.length,
//     };

//     const blob = new Blob([JSON.stringify(reportData, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `comparison-report-${Date.now()}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl max-w-6xl w-full h-[95vh] flex flex-col overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
//           <div className="flex justify-between items-start">
//             <div>
//               <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
//                 <GitCompare className="w-7 h-7" />
//                 PDF Comparison Report
//               </h2>
//               <p className="text-blue-100">
//                 {metrics
//                   ? `Generated on ${metrics.processingTime} • ${
//                       metrics.analysisDepth.charAt(0).toUpperCase() +
//                       metrics.analysisDepth.slice(1)
//                     } Analysis`
//                   : "Comprehensive document analysis and comparison"}
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={handleExportReport}
//                 disabled={!comparisonResult}
//                 className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors disabled:opacity-50"
//                 title="Export Report"
//               >
//                 <Download className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={onClose}
//                 className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto max-h-[calc(95vh-140px)]">
//           {isAnalyzing ? (
//             <div className="flex items-center justify-center py-20">
//               <div className="text-center">
//                 <div className="relative mb-6">
//                   <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
//                   <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
//                 </div>
//                 <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                   Analyzing Documents
//                 </h3>
//                 <p className="text-gray-600">
//                   Processing your PDF files for comprehensive comparison...
//                 </p>
//               </div>
//             </div>
//           ) : comparisonResult ? (
//             <div className="p-6 space-y-6 overflow-y-auto max-h-full">
//               {/* Status Banner */}
//               <div
//                 className={`rounded-lg p-4 mb-6 ${
//                   comparisonResult.requiresOCR
//                     ? "bg-orange-50 border border-orange-200"
//                     : "bg-green-50 border border-green-200"
//                 }`}
//               >
//                 <div className="flex items-center gap-3">
//                   {comparisonResult.requiresOCR ? (
//                     <AlertTriangle className="w-6 h-6 text-orange-600" />
//                   ) : (
//                     <CheckCircle className="w-6 h-6 text-green-600" />
//                   )}
//                   <div>
//                     <h3
//                       className={`font-semibold ${
//                         comparisonResult.requiresOCR
//                           ? "text-orange-800"
//                           : "text-green-800"
//                       }`}
//                     >
//                       {comparisonResult.requiresOCR
//                         ? "OCR Processing Required"
//                         : "Analysis Complete"}
//                     </h3>
//                     <p
//                       className={`text-sm ${
//                         comparisonResult.requiresOCR
//                           ? "text-orange-700"
//                           : "text-green-700"
//                       }`}
//                     >
//                       {comparisonResult.requiresOCR
//                         ? "One or more documents contain image-based content requiring OCR for full text comparison."
//                         : `Successfully analyzed ${
//                             leftAnalysis.totalPages + rightAnalysis.totalPages
//                           } pages with ${
//                             metrics?.qualityScore
//                           }% extraction quality.`}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Tab Navigation */}
//               <div className="border-b border-gray-200 mb-6">
//                 <nav className="flex space-x-8">
//                   {["overview", "documents", "changes", "metrics"].map(
//                     (tab) => (
//                       <button
//                         key={tab}
//                         onClick={() => setActiveTab(tab)}
//                         className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
//                           activeTab === tab
//                             ? "border-blue-500 text-blue-600"
//                             : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                         }`}
//                       >
//                         {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                       </button>
//                     )
//                   )}
//                 </nav>
//               </div>

//               {/* Tab Content */}
//               {activeTab === "overview" && (
//                 <div className="space-y-6">
//                   {/* Key Metrics Cards */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                     <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
//                       <div className="flex items-center justify-between mb-3">
//                         <Target className="w-8 h-8 text-blue-600" />
//                         <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
//                           SIMILARITY
//                         </span>
//                       </div>
//                       <div className="text-3xl font-bold text-blue-700 mb-1">
//                         {comparisonResult.similarity?.overall || 0}%
//                       </div>
//                       <div className="text-sm text-blue-600">Overall Match</div>
//                     </div>

//                     <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
//                       <div className="flex items-center justify-between mb-3">
//                         <TrendingUp className="w-8 h-8 text-green-600" />
//                         <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
//                           CHANGES
//                         </span>
//                       </div>
//                       <div className="text-3xl font-bold text-green-700 mb-1">
//                         {metrics?.changeIntensity || 0}%
//                       </div>
//                       <div className="text-sm text-green-600">
//                         Content Modified
//                       </div>
//                     </div>

//                     <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
//                       <div className="flex items-center justify-between mb-3">
//                         <Hash className="w-8 h-8 text-purple-600" />
//                         <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
//                           HIGHLIGHTS
//                         </span>
//                       </div>
//                       <div className="text-3xl font-bold text-purple-700 mb-1">
//                         {metrics?.totalHighlights || 0}
//                       </div>
//                       <div className="text-sm text-purple-600">
//                         Differences Found
//                       </div>
//                     </div>

//                     <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
//                       <div className="flex items-center justify-between mb-3">
//                         <Award className="w-8 h-8 text-orange-600" />
//                         <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
//                           QUALITY
//                         </span>
//                       </div>
//                       <div className="text-3xl font-bold text-orange-700 mb-1">
//                         {metrics?.qualityScore || 0}%
//                       </div>
//                       <div className="text-sm text-orange-600">
//                         Extraction Quality
//                       </div>
//                     </div>
//                   </div>

//                   {/* Change Analysis */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//                       <BarChart3 className="w-5 h-5" />
//                       Change Analysis Summary
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                       <div className="text-center">
//                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                           <TrendingUp className="w-8 h-8 text-green-600" />
//                         </div>
//                         <div className="text-2xl font-bold text-green-600 mb-1">
//                           {comparisonResult.changes?.added || 0}
//                         </div>
//                         <div className="text-sm text-gray-600">Words Added</div>
//                       </div>
//                       <div className="text-center">
//                         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                           <TrendingDown className="w-8 h-8 text-red-600" />
//                         </div>
//                         <div className="text-2xl font-bold text-red-600 mb-1">
//                           {comparisonResult.changes?.removed || 0}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           Words Removed
//                         </div>
//                       </div>
//                       <div className="text-center">
//                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                           <Minus className="w-8 h-8 text-gray-600" />
//                         </div>
//                         <div className="text-2xl font-bold text-gray-600 mb-1">
//                           {comparisonResult.changes?.unchanged || 0}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           Words Unchanged
//                         </div>
//                       </div>
//                     </div>

//                     <div className="mt-6 p-4 bg-white rounded-lg border">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <Info className="w-5 h-5 text-blue-500" />
//                           <span className="font-medium text-gray-800">
//                             Change Intensity
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <span
//                             className={`font-semibold ${metrics?.changeLevelColor}`}
//                           >
//                             {metrics?.changeLevel}
//                           </span>
//                           <span className="text-gray-500">
//                             ({metrics?.changeIntensity}%)
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Structural Comparison */}
//                   {comparisonResult.structural && (
//                     <div className="bg-gray-50 rounded-xl p-6">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
//                         <Layers className="w-5 h-5" />
//                         Structural Changes
//                       </h3>
//                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                         <div className="bg-white rounded-lg p-3 border">
//                           <div className="text-gray-600 mb-1">Page Count</div>
//                           <div className="font-semibold">
//                             {comparisonResult.structural.pageCountChange > 0
//                               ? "+"
//                               : ""}
//                             {comparisonResult.structural.pageCountChange}
//                           </div>
//                         </div>
//                         <div className="bg-white rounded-lg p-3 border">
//                           <div className="text-gray-600 mb-1">Word Count</div>
//                           <div className="font-semibold">
//                             {comparisonResult.structural.wordCountChange > 0
//                               ? "+"
//                               : ""}
//                             {comparisonResult.structural.wordCountChange.toLocaleString()}
//                           </div>
//                         </div>
//                         <div className="bg-white rounded-lg p-3 border">
//                           <div className="text-gray-600 mb-1">
//                             Character Count
//                           </div>
//                           <div className="font-semibold">
//                             {comparisonResult.structural.charCountChange > 0
//                               ? "+"
//                               : ""}
//                             {comparisonResult.structural.charCountChange.toLocaleString()}
//                           </div>
//                         </div>
//                         <div className="bg-white rounded-lg p-3 border">
//                           <div className="text-gray-600 mb-1">
//                             Word Change %
//                           </div>
//                           <div className="font-semibold">
//                             {comparisonResult.structural
//                               .wordCountChangePercent > 0
//                               ? "+"
//                               : ""}
//                             {Math.round(
//                               comparisonResult.structural.wordCountChangePercent
//                             )}
//                             %
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {activeTab === "documents" && (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* Left Document */}
//                     <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
//                           <FileText className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold text-blue-800">
//                             Left Document
//                           </h3>
//                           <p
//                             className="text-sm text-blue-600 truncate"
//                             title={leftAnalysis?.fileName}
//                           >
//                             {leftAnalysis?.fileName}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="space-y-3">
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700 font-medium">
//                             Document Type
//                           </span>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               leftAnalysis?.fileType === "text-based"
//                                 ? "bg-green-200 text-green-800"
//                                 : "bg-orange-200 text-orange-800"
//                             }`}
//                           >
//                             {leftAnalysis?.fileType}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Total Pages</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.totalPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Text Pages</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.textBasedPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Image Pages</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.imageBasedPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Word Count</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.wordCount?.toLocaleString()}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Avg Words/Page</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.avgWordsPerPage}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">
//                             Extraction Quality
//                           </span>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               leftAnalysis?.extractionQuality === "high"
//                                 ? "bg-green-200 text-green-800"
//                                 : leftAnalysis?.extractionQuality === "medium"
//                                 ? "bg-yellow-200 text-yellow-800"
//                                 : "bg-red-200 text-red-800"
//                             }`}
//                           >
//                             {leftAnalysis?.extractionQuality}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-blue-700">Confidence</span>
//                           <span className="font-semibold text-blue-800">
//                             {leftAnalysis?.confidence}%
//                           </span>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Right Document */}
//                     <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
//                           <FileText className="w-6 h-6 text-white" />
//                         </div>
//                         <div>
//                           <h3 className="font-semibold text-green-800">
//                             Right Document
//                           </h3>
//                           <p
//                             className="text-sm text-green-600 truncate"
//                             title={rightAnalysis?.fileName}
//                           >
//                             {rightAnalysis?.fileName}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="space-y-3">
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700 font-medium">
//                             Document Type
//                           </span>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               rightAnalysis?.fileType === "text-based"
//                                 ? "bg-green-200 text-green-800"
//                                 : "bg-orange-200 text-orange-800"
//                             }`}
//                           >
//                             {rightAnalysis?.fileType}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Total Pages</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.totalPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Text Pages</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.textBasedPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Image Pages</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.imageBasedPages}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Word Count</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.wordCount?.toLocaleString()}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Avg Words/Page</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.avgWordsPerPage}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">
//                             Extraction Quality
//                           </span>
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               rightAnalysis?.extractionQuality === "high"
//                                 ? "bg-green-200 text-green-800"
//                                 : rightAnalysis?.extractionQuality === "medium"
//                                 ? "bg-yellow-200 text-yellow-800"
//                                 : "bg-red-200 text-red-800"
//                             }`}
//                           >
//                             {rightAnalysis?.extractionQuality}
//                           </span>
//                         </div>
//                         <div className="flex justify-between items-center">
//                           <span className="text-green-700">Confidence</span>
//                           <span className="font-semibold text-green-800">
//                             {rightAnalysis?.confidence}%
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "changes" && (
//                 <div className="space-y-6">
//                   {/* Changes Overview */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                       Changes Overview
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <div className="text-sm text-gray-600 mb-2">
//                           Change Distribution
//                         </div>
//                         <div className="space-y-2">
//                           <div className="flex items-center justify-between">
//                             <span className="text-green-600">
//                               Added Content
//                             </span>
//                             <span className="font-semibold">
//                               {comparisonResult.changes?.addedChars || 0} chars
//                             </span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-red-600">
//                               Removed Content
//                             </span>
//                             <span className="font-semibold">
//                               {comparisonResult.changes?.removedChars || 0}{" "}
//                               chars
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                       <div>
//                         <div className="text-sm text-gray-600 mb-2">
//                           Change Significance
//                         </div>
//                         <div className="space-y-2">
//                           <div className="flex items-center justify-between">
//                             <span className="text-gray-600">
//                               Significant Changes
//                             </span>
//                             <span
//                               className={`font-semibold ${
//                                 comparisonResult.changes?.significantChanges
//                                   ? "text-red-600"
//                                   : "text-green-600"
//                               }`}
//                             >
//                               {comparisonResult.changes?.significantChanges
//                                 ? "Yes"
//                                 : "No"}
//                             </span>
//                           </div>
//                           <div className="flex items-center justify-between">
//                             <span className="text-gray-600">
//                               Change Threshold
//                             </span>
//                             <span className="font-semibold">5%</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Common Phrases */}
//                   {comparisonResult.commonPhrases && (
//                     <div className="bg-gray-50 rounded-xl p-6">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                         Common Content
//                       </h3>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {comparisonResult.commonPhrases.trigrams &&
//                           comparisonResult.commonPhrases.trigrams.length >
//                             0 && (
//                             <div>
//                               <div className="text-sm text-gray-600 mb-3">
//                                 Common 3-word Phrases
//                               </div>
//                               <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
//                                 {comparisonResult.commonPhrases.trigrams
//                                   .slice(0, 10)
//                                   .map((phrase, index) => (
//                                     <div
//                                       key={index}
//                                       className="text-sm bg-white rounded px-3 py-2 border"
//                                     >
//                                       "{phrase}"
//                                     </div>
//                                   ))}
//                               </div>
//                             </div>
//                           )}

//                         {comparisonResult.commonPhrases.bigrams &&
//                           comparisonResult.commonPhrases.bigrams.length > 0 && (
//                             <div>
//                               <div className="text-sm text-gray-600 mb-3">
//                                 Common 2-word Phrases
//                               </div>
//                               <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
//                                 {comparisonResult.commonPhrases.bigrams
//                                   .slice(0, 10)
//                                   .map((phrase, index) => (
//                                     <div
//                                       key={index}
//                                       className="text-sm bg-white rounded px-3 py-2 border"
//                                     >
//                                       "{phrase}"
//                                     </div>
//                                   ))}
//                               </div>
//                             </div>
//                           )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {activeTab === "metrics" && (
//                 <div className="space-y-6">
//                   {/* Similarity Breakdown */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                       Detailed Similarity Metrics
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="space-y-4">
//                         <div>
//                           <div className="flex justify-between items-center mb-2">
//                             <span className="text-gray-600">
//                               Jaccard Similarity
//                             </span>
//                             <span className="font-semibold">
//                               {comparisonResult.similarity?.jaccard || 0}%
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className="bg-blue-600 h-2 rounded-full"
//                               style={{
//                                 width: `${
//                                   comparisonResult.similarity?.jaccard || 0
//                                 }%`,
//                               }}
//                             />
//                           </div>
//                         </div>

//                         <div>
//                           <div className="flex justify-between items-center mb-2">
//                             <span className="text-gray-600">
//                               Levenshtein Similarity
//                             </span>
//                             <span className="font-semibold">
//                               {comparisonResult.similarity?.levenshtein || 0}%
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className="bg-green-600 h-2 rounded-full"
//                               style={{
//                                 width: `${
//                                   comparisonResult.similarity?.levenshtein || 0
//                                 }%`,
//                               }}
//                             />
//                           </div>
//                         </div>

//                         <div>
//                           <div className="flex justify-between items-center mb-2">
//                             <span className="text-gray-600">
//                               Structural Similarity
//                             </span>
//                             <span className="font-semibold">
//                               {Math.round(
//                                 comparisonResult.similarity?.structural || 0
//                               )}
//                               %
//                             </span>
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2">
//                             <div
//                               className="bg-purple-600 h-2 rounded-full"
//                               style={{
//                                 width: `${
//                                   comparisonResult.similarity?.structural || 0
//                                 }%`,
//                               }}
//                             />
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-4">
//                         <div className="bg-white rounded-lg p-4 border">
//                           <div className="text-sm text-gray-600 mb-2">
//                             Analysis Details
//                           </div>
//                           <div className="space-y-2 text-sm">
//                             <div className="flex justify-between">
//                               <span>Processing Time</span>
//                               <span className="font-medium">
//                                 {metrics?.processingTime}
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span>Analysis Type</span>
//                               <span className="font-medium capitalize">
//                                 {comparisonResult.analysisDepth}
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span>OCR Required</span>
//                               <span
//                                 className={`font-medium ${
//                                   comparisonResult.requiresOCR
//                                     ? "text-orange-600"
//                                     : "text-green-600"
//                                 }`}
//                               >
//                                 {comparisonResult.requiresOCR ? "Yes" : "No"}
//                               </span>
//                             </div>
//                           </div>
//                         </div>

//                         <div className="bg-white rounded-lg p-4 border">
//                           <div className="text-sm text-gray-600 mb-2">
//                             Content Statistics
//                           </div>
//                           <div className="space-y-2 text-sm">
//                             <div className="flex justify-between">
//                               <span>Left Document Words</span>
//                               <span className="font-medium">
//                                 {comparisonResult.metadata?.leftWordCount?.toLocaleString()}
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span>Right Document Words</span>
//                               <span className="font-medium">
//                                 {comparisonResult.metadata?.rightWordCount?.toLocaleString()}
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span>Left Characters</span>
//                               <span className="font-medium">
//                                 {comparisonResult.metadata?.leftCharCount?.toLocaleString()}
//                               </span>
//                             </div>
//                             <div className="flex justify-between">
//                               <span>Right Characters</span>
//                               <span className="font-medium">
//                                 {comparisonResult.metadata?.rightCharCount?.toLocaleString()}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* File Type Analysis */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                       File Type Analysis
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="bg-white rounded-lg p-4 border">
//                         <div className="text-sm text-gray-600 mb-3">
//                           Left Document Analysis
//                         </div>
//                         <div className="space-y-2 text-sm">
//                           <div className="flex justify-between">
//                             <span>File Type</span>
//                             <span
//                               className={`font-medium px-2 py-1 rounded text-xs ${
//                                 comparisonResult.metadata?.fileTypes?.left ===
//                                 "text-based"
//                                   ? "bg-green-100 text-green-800"
//                                   : "bg-orange-100 text-orange-800"
//                               }`}
//                             >
//                               {comparisonResult.metadata?.fileTypes?.left}
//                             </span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span>Extraction Quality</span>
//                             <span
//                               className={`font-medium px-2 py-1 rounded text-xs ${
//                                 comparisonResult.metadata?.quality?.left ===
//                                 "high"
//                                   ? "bg-green-100 text-green-800"
//                                   : comparisonResult.metadata?.quality?.left ===
//                                     "medium"
//                                   ? "bg-yellow-100 text-yellow-800"
//                                   : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {comparisonResult.metadata?.quality?.left}
//                             </span>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="bg-white rounded-lg p-4 border">
//                         <div className="text-sm text-gray-600 mb-3">
//                           Right Document Analysis
//                         </div>
//                         <div className="space-y-2 text-sm">
//                           <div className="flex justify-between">
//                             <span>File Type</span>
//                             <span
//                               className={`font-medium px-2 py-1 rounded text-xs ${
//                                 comparisonResult.metadata?.fileTypes?.right ===
//                                 "text-based"
//                                   ? "bg-green-100 text-green-800"
//                                   : "bg-orange-100 text-orange-800"
//                               }`}
//                             >
//                               {comparisonResult.metadata?.fileTypes?.right}
//                             </span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span>Extraction Quality</span>
//                             <span
//                               className={`font-medium px-2 py-1 rounded text-xs ${
//                                 comparisonResult.metadata?.quality?.right ===
//                                 "high"
//                                   ? "bg-green-100 text-green-800"
//                                   : comparisonResult.metadata?.quality
//                                       ?.right === "medium"
//                                   ? "bg-yellow-100 text-yellow-800"
//                                   : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {comparisonResult.metadata?.quality?.right}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Performance Metrics */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-4">
//                       Performance & Statistics
//                     </h3>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div className="bg-white rounded-lg p-4 border text-center">
//                         <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
//                         <div className="text-sm text-gray-600">Generated</div>
//                         <div className="font-semibold text-sm">
//                           {new Date().toLocaleDateString()}
//                         </div>
//                       </div>
//                       <div className="bg-white rounded-lg p-4 border text-center">
//                         <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
//                         <div className="text-sm text-gray-600">Total Pages</div>
//                         <div className="font-semibold">
//                           {(leftAnalysis?.totalPages || 0) +
//                             (rightAnalysis?.totalPages || 0)}
//                         </div>
//                       </div>
//                       <div className="bg-white rounded-lg p-4 border text-center">
//                         <Hash className="w-6 h-6 text-purple-500 mx-auto mb-2" />
//                         <div className="text-sm text-gray-600">Total Words</div>
//                         <div className="font-semibold">
//                           {(
//                             (comparisonResult.metadata?.leftWordCount || 0) +
//                             (comparisonResult.metadata?.rightWordCount || 0)
//                           ).toLocaleString()}
//                         </div>
//                       </div>
//                       <div className="bg-white rounded-lg p-4 border text-center">
//                         <Target className="w-6 h-6 text-orange-500 mx-auto mb-2" />
//                         <div className="text-sm text-gray-600">Differences</div>
//                         <div className="font-semibold">
//                           {metrics?.totalHighlights || 0}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="text-center py-20">
//               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <AlertCircle className="w-10 h-10 text-gray-400" />
//               </div>
//               <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                 No Comparison Available
//               </h3>
//               <p className="text-gray-600 max-w-md mx-auto">
//                 Upload both PDF files and run the comparison to view detailed
//                 analysis results.
//               </p>
//             </div>
//           )}
//         </div>

//         {/* Footer Actions */}
//         {comparisonResult && !comparisonResult.requiresOCR && (
//           <div className="border-t bg-gray-50 p-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-2 text-sm text-gray-600">
//                   <CheckCircle className="w-4 h-4 text-green-500" />
//                   <span>Analysis Complete</span>
//                 </div>
//                 {metrics && (
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <Target className="w-4 h-4 text-blue-500" />
//                     <span>
//                       {metrics.totalHighlights} differences identified
//                     </span>
//                   </div>
//                 )}
//               </div>

//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={handleExportReport}
//                   className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
//                 >
//                   <Download className="w-4 h-4" />
//                   Export Report
//                 </button>

//                 <button
//                   onClick={onClose}
//                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
//                 >
//                   Close Report
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ComparisonResults;
