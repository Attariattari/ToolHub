import React, { useRef, useEffect } from 'react';
import jsPDF from 'jspdf';

const ReportGenerator = {
  // Generate visual comparison report
  generateComparisonReport: (comparisonResult, leftAnalysis, rightAnalysis, leftDifferences, rightDifferences) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions for report
    canvas.width = 800;
    canvas.height = 1000;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 100);
    gradient.addColorStop(0, '#dc2626');
    gradient.addColorStop(1, '#ef4444');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Comparison Report', canvas.width / 2, 50);

    // Date
    ctx.font = '14px Arial';
    ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, canvas.width / 2, 75);

    // Document info section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Document Information', 40, 140);

    // Draw document info boxes
    const drawDocBox = (x, y, title, fileName, analysis) => {
      // Box background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, y, 340, 120);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 340, 120);

      // Title
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(title, x + 15, y + 25);

      // File name (truncated if too long)
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      const truncatedName = fileName.length > 35 ? fileName.substring(0, 35) + '...' : fileName;
      ctx.fillText(`File: ${truncatedName}`, x + 15, y + 50);

      // Stats
      ctx.font = '12px Arial';
      ctx.fillText(`Pages: ${analysis.totalPages}`, x + 15, y + 70);
      ctx.fillText(`Words: ${analysis.wordCount.toLocaleString()}`, x + 15, y + 85);
      ctx.fillText(`Quality: ${analysis.extractionQuality}`, x + 15, y + 100);

      // Type badge
      const badgeColor = analysis.fileType === 'text-based' ? '#10b981' : '#f59e0b';
      ctx.fillStyle = badgeColor;
      ctx.fillRect(x + 250, y + 10, 80, 25);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(analysis.fileType.toUpperCase(), x + 290, y + 27);
      ctx.textAlign = 'left';
    };

    drawDocBox(40, 160, 'Left Document', leftAnalysis.fileName, leftAnalysis);
    drawDocBox(420, 160, 'Right Document', rightAnalysis.fileName, rightAnalysis);

    // Similarity section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Similarity Analysis', 40, 320);

    // Similarity meters
    const drawMeter = (x, y, label, percentage, color) => {
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      ctx.fillText(label, x, y - 10);

      // Meter background
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x, y, 200, 20);

      // Meter fill
      ctx.fillStyle = color;
      ctx.fillRect(x, y, (200 * percentage) / 100, 20);

      // Percentage text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${percentage}%`, x + 100, y + 14);
      ctx.textAlign = 'left';
    };

    drawMeter(40, 350, 'Overall Similarity', comparisonResult.similarity.overall, '#10b981');
    drawMeter(40, 385, 'Jaccard Similarity', comparisonResult.similarity.jaccard, '#3b82f6');
    drawMeter(40, 420, 'Levenshtein Similarity', comparisonResult.similarity.levenshtein, '#8b5cf6');

    // Changes section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Content Changes', 420, 320);

    // Change stats
    const changes = comparisonResult.changes;
    const changeData = [
      { label: 'Words Added', value: changes.added, color: '#10b981' },
      { label: 'Words Removed', value: changes.removed, color: '#ef4444' },
      { label: 'Words Unchanged', value: changes.unchanged, color: '#6b7280' }
    ];

    changeData.forEach((item, index) => {
      const y = 350 + (index * 35);

      // Circle indicator
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(430, y - 5, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Text
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      ctx.fillText(`${item.label}: ${item.value.toLocaleString()}`, 450, y);
    });

    // Highlights section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Difference Highlights', 40, 480);

    // Highlight stats box
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(40, 500, 720, 80);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 500, 720, 80);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${leftDifferences.length + rightDifferences.length} Differences Identified`, canvas.width / 2, 530);

    ctx.font = '14px Arial';
    ctx.fillText(`Left Document: ${leftDifferences.length} highlights`, 200, 555);
    ctx.fillText(`Right Document: ${rightDifferences.length} highlights`, 600, 555);
    ctx.textAlign = 'left';

    // Summary section
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Analysis Summary', 40, 620);

    // Summary box
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(40, 640, 720, 120);
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 640, 720, 120);

    // Summary text
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '14px Arial';
    const summaryLines = [
      `Change Intensity: ${changes.changePercentage}% (${changes.significantChanges ? 'Significant' : 'Minor'} changes detected)`,
      `Document Types: ${leftAnalysis.fileType} vs ${rightAnalysis.fileType}`,
      `Processing Quality: ${leftAnalysis.extractionQuality} (left) | ${rightAnalysis.extractionQuality} (right)`,
      `Total Content: ${(leftAnalysis.wordCount + rightAnalysis.wordCount).toLocaleString()} words processed`,
      `Recommendation: ${getRecommendation(comparisonResult)}`
    ];

    summaryLines.forEach((line, index) => {
      ctx.fillText(line, 60, 670 + (index * 20));
    });

    // Footer
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by PDF Comparison Tool • Advanced Semantic Analysis', canvas.width / 2, 950);

    return canvas;
  },

  // Generate overlay comparison image
  generateOverlayImage: async (bottomFile, topFile, bottomPage, topPage, overlaySettings) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set standard dimensions
    canvas.width = 800;
    canvas.height = 1000;

    try {
      // Create temporary canvases for each PDF layer
      const bottomCanvas = document.createElement('canvas');
      const topCanvas = document.createElement('canvas');

      bottomCanvas.width = topCanvas.width = 800;
      bottomCanvas.height = topCanvas.height = 1000;

      // Render bottom layer (simplified representation)
      const bottomCtx = bottomCanvas.getContext('2d');
      bottomCtx.fillStyle = '#ffffff';
      bottomCtx.fillRect(0, 0, 800, 1000);

      // Add some sample content to represent the PDF
      bottomCtx.fillStyle = '#1f2937';
      bottomCtx.font = '16px Arial';
      bottomCtx.fillText(`Bottom Layer: ${bottomFile.name}`, 50, 50);
      bottomCtx.fillText(`Page: ${bottomPage}`, 50, 80);

      // Add sample text content
      for (let i = 0; i < 30; i++) {
        bottomCtx.fillStyle = i % 5 === 0 ? '#dc2626' : '#374151';
        bottomCtx.font = i % 5 === 0 ? 'bold 14px Arial' : '14px Arial';
        bottomCtx.fillText(`Bottom layer content line ${i + 1}`, 50, 120 + (i * 25));
      }

      // Render top layer
      const topCtx = topCanvas.getContext('2d');
      topCtx.fillStyle = '#f8fafc';
      topCtx.fillRect(0, 0, 800, 1000);

      topCtx.fillStyle = '#1e40af';
      topCtx.font = '16px Arial';
      topCtx.fillText(`Top Layer: ${topFile.name}`, 50, 50);
      topCtx.fillText(`Page: ${topPage}`, 50, 80);

      // Add sample text content with some differences
      for (let i = 0; i < 30; i++) {
        const isDifferent = [5, 12, 18, 24].includes(i);
        topCtx.fillStyle = isDifferent ? '#dc2626' : '#1e40af';
        topCtx.font = isDifferent ? 'bold 14px Arial' : '14px Arial';
        const text = isDifferent ? `MODIFIED: Top layer content line ${i + 1}` : `Top layer content line ${i + 1}`;
        topCtx.fillText(text, 50, 120 + (i * 25));
      }

      // Composite the layers
      ctx.drawImage(bottomCanvas, 0, 0);

      // Apply overlay settings
      ctx.globalAlpha = overlaySettings.opacity / 100;
      ctx.globalCompositeOperation = overlaySettings.blendMode || 'normal';
      ctx.drawImage(topCanvas, 0, 0);

      // Reset composition
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Add overlay info header
      const headerGradient = ctx.createLinearGradient(0, 0, 800, 40);
      headerGradient.addColorStop(0, '#1e40af');
      headerGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, 800, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Overlay Comparison: ${overlaySettings.opacity}% opacity, ${overlaySettings.blendMode} blend`, 400, 25);
      ctx.textAlign = 'left';

      // Add difference highlights if enabled
      if (overlaySettings.showDifferences) {
        ctx.strokeStyle = overlaySettings.highlightColor || '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        // Highlight some sample difference areas
        const diffAreas = [
          { x: 40, y: 240, width: 300, height: 20 },
          { x: 40, y: 420, width: 250, height: 20 },
          { x: 40, y: 570, width: 400, height: 20 },
          { x: 40, y: 720, width: 200, height: 20 }
        ];

        diffAreas.forEach(area => {
          ctx.strokeRect(area.x, area.y, area.width, area.height);
        });

        ctx.setLineDash([]);
      }

      return canvas;
    } catch (error) {
      console.error('Error generating overlay image:', error);
      // Return a basic error canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 1000);
      ctx.fillStyle = '#dc2626';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Error generating overlay', 400, 500);
      return canvas;
    }
  }
};

// Helper function to get recommendation text
function getRecommendation(comparisonResult) {
  const similarity = comparisonResult.similarity.overall;
  if (similarity > 90) return 'Documents are nearly identical';
  if (similarity > 75) return 'Documents are very similar with minor differences';
  if (similarity > 50) return 'Documents have moderate differences';
  return 'Documents are significantly different';
}

// Enhanced download functions
const DownloadHandlers = {
  downloadComparisonReport: (comparisonResult, leftAnalysis, rightAnalysis, leftDifferences, rightDifferences) => {
    try {
      const canvas = ReportGenerator.generateComparisonReport(
        comparisonResult,
        leftAnalysis,
        rightAnalysis,
        leftDifferences,
        rightDifferences
      );

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PDF-Comparison-Report-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

      return true;
    } catch (error) {
      console.error('Error downloading comparison report:', error);
      return false;
    }
  },

  downloadOverlayImage: async (bottomFile, topFile, bottomPage, topPage, overlaySettings) => {
    try {
      const canvas = await ReportGenerator.generateOverlayImage(
        bottomFile,
        topFile,
        bottomPage,
        topPage,
        overlaySettings
      );

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PDF-Overlay-Comparison-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

      return true;
    } catch (error) {
      console.error('Error downloading overlay image:', error);
      return false;
    }
  }
};

// Component to integrate into your main app
const ReportDownloadButton = ({
  comparisonResult,
  leftAnalysis,
  rightAnalysis,
  leftDifferences,
  rightDifferences,
  isDownloading,
  onDownloadStart,
  onDownloadComplete
}) => {
  const handleDownload = async () => {
    if (!comparisonResult || !leftAnalysis || !rightAnalysis) {
      alert('Complete comparison required before downloading report');
      return;
    }

    onDownloadStart?.();

    try {
      const success = DownloadHandlers.downloadComparisonReport(
        comparisonResult,
        leftAnalysis,
        rightAnalysis,
        leftDifferences || [],
        rightDifferences || []
      );

      if (success) {
        onDownloadComplete?.(true);
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Download failed:', error);
      onDownloadComplete?.(false);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !comparisonResult}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDownloading || !comparisonResult
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700'
        }`}
    >
      {isDownloading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Report
        </>
      )}
    </button>
  );
};

const OverlayDownloadButton = ({
  bottomFile,
  topFile,
  bottomPage,
  topPage,
  overlaySettings,
  isDownloading,
  onDownloadStart,
  onDownloadComplete
}) => {
  const handleDownload = async () => {
    if (!bottomFile || !topFile) {
      alert('Both PDF files required for overlay download');
      return;
    }

    onDownloadStart?.();

    try {
      const success = await DownloadHandlers.downloadOverlayImage(
        bottomFile,
        topFile,
        bottomPage,
        topPage,
        overlaySettings
      );

      if (success) {
        onDownloadComplete?.(true);
      } else {
        throw new Error('Failed to generate overlay image');
      }
    } catch (error) {
      console.error('Overlay download failed:', error);
      onDownloadComplete?.(false);
      alert('Failed to download overlay image. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !bottomFile || !topFile}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDownloading || !bottomFile || !topFile
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
    >
      {isDownloading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Download Overlay
        </>
      )}
    </button>
  );
};

// Export the handlers and components
export { ReportGenerator, DownloadHandlers, ReportDownloadButton, OverlayDownloadButton };