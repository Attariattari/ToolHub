"use client";

import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  Download,
  Search,
  Type,
  Image,
  AlertCircle,
  Check,
  RotateCcw,
  Palette,
  Zap,
} from "lucide-react";
import { pdfjs } from "react-pdf";
import ProgressScreen from "@/components/tools/ProgressScreen";
import Api from "@/utils/Api";
import { toast } from "react-toastify";
import FileUploaderForWatermark from "@/components/tools/FileUploaderForWatermark";
import PasswordModelPreveiw from "@/components/tools/PasswordModelPreveiw";
// Import diff library for text comparison
import * as Diff from "diff";
import jsPDF from "jspdf";
import ZoomControls from "@/components/sections/ZoomControls";
import ComparisonResults from "@/components/sections/ComparisonResults";
import OCRNotification from "@/components/sections/OCRNotification";
import PDFComaprePreview from "@/components/sections/PDFComaprePreview";
import SidebarContent from "@/components/sections/SidebarContent";
import OverlayPDFPreview from "@/components/sections/OverlayPDFPreview";
import PDFPreview from "@/components/sections/PDFPreview";

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Enhanced text processing utilities
const textUtils = {
  tokenizeSentences: (text) => {
    if (!text) return [];
    return text
      .split(/[.!?]+(?:\s+|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  },

  tokenizeWords: (text) => {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s\-']/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
  },

  levenshteinDistance: (str1, str2, maxDistance = Infinity) => {
    if (str1 === str2) return 0;
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;

    if (Math.abs(str1.length - str2.length) > maxDistance) {
      return maxDistance + 1;
    }

    const matrix = [];
    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[str1.length][str2.length];
  },

  getNGrams: (tokens, n = 3) => {
    if (!tokens || tokens.length < n) return [];
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(" ");
      if (ngram.length > 10) {
        ngrams.push(ngram);
      }
    }
    return ngrams;
  },

  calculateSimilarity: (text1, text2) => {
    const words1 = new Set(textUtils.tokenizeWords(text1));
    const words2 = new Set(textUtils.tokenizeWords(text2));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccard =
      union.size === 0 ? 0 : (intersection.size / union.size) * 100;

    const maxLen = Math.max(text1.length, text2.length);
    const levDistance = textUtils.levenshteinDistance(
      text1,
      text2,
      maxLen * 0.8
    );
    const levSimilarity =
      maxLen === 0 ? 100 : ((maxLen - levDistance) / maxLen) * 100;

    return {
      jaccard: Math.round(jaccard),
      levenshtein: Math.round(levSimilarity),
      overall: Math.round((jaccard + levSimilarity) / 2),
    };
  },
};

// Enhanced comparison engine
class PDFComparisonEngine {
  constructor() {
    this.cache = new Map();
    this.progressCallback = null;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  updateProgress(progress, task) {
    if (this.progressCallback) {
      this.progressCallback(Math.min(100, Math.max(0, progress)), task);
    }
  }

  async extractTextFromPDFWithProgress(file, onProgress) {
    try {
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      this.updateProgress(0, `Reading ${file.name}...`);
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let totalText = "";
      let pageAnalysis = [];
      let textBasedPages = 0;
      let imageBasedPages = 0;
      const totalPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const textItems = textContent.items
          .filter((item) => item.str && item.str.trim().length > 0)
          .map((item) => ({
            text: item.str.trim(),
            y: item.transform[5],
            x: item.transform[4],
            fontSize: item.transform[0] || 12,
          }))
          .sort((a, b) => b.y - a.y || a.x - b.x);

        let pageText = "";
        let currentLine = "";
        let lastY = null;

        textItems.forEach((item) => {
          const yPos = Math.round(item.y);

          if (lastY !== null && Math.abs(yPos - lastY) > 5) {
            if (currentLine.trim()) {
              pageText += currentLine.trim() + " ";
              currentLine = "";
            }
          }

          currentLine += item.text + " ";
          lastY = yPos;
        });

        if (currentLine.trim()) {
          pageText += currentLine.trim();
        }

        const hasText = pageText.length > 50 && textItems.length > 5;

        if (hasText) {
          textBasedPages++;
          const cleanPageText = pageText
            .replace(/\s+/g, " ")
            .replace(/[^\w\s.,!?;:()\-'"/\\]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          totalText += cleanPageText + "\n\n";
        } else {
          imageBasedPages++;
        }

        pageAnalysis.push({
          pageNumber: pageNum,
          hasText,
          textLength: pageText.length,
          text: pageText,
          itemCount: textItems.length,
          avgFontSize:
            textItems.length > 0
              ? textItems.reduce((sum, item) => sum + item.fontSize, 0) /
                textItems.length
              : 12,
        });

        const progress = (pageNum / totalPages) * 50;
        this.updateProgress(
          progress,
          `Processing page ${pageNum}/${totalPages}...`
        );
      }

      const finalText = totalText.trim();
      const wordCount = textUtils.tokenizeWords(finalText).length;

      const result = {
        fileName: file.name,
        totalPages,
        textBasedPages,
        imageBasedPages,
        totalText: finalText,
        pageAnalysis,
        fileType:
          textBasedPages > imageBasedPages ? "text-based" : "image-based",
        confidence: Math.round(
          (Math.max(textBasedPages, imageBasedPages) / totalPages) * 100
        ),
        wordCount,
        charCount: finalText.length,
        avgWordsPerPage: Math.round(wordCount / Math.max(textBasedPages, 1)),
        extractionQuality:
          textBasedPages > totalPages * 0.8
            ? "high"
            : textBasedPages > totalPages * 0.5
            ? "medium"
            : "low",
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(
        `Failed to extract text from ${file.name}: ${error.message}`
      );
    }
  }

  async performDeepTextComparison(leftAnalysis, rightAnalysis) {
    if (!leftAnalysis?.totalText || !rightAnalysis?.totalText) {
      throw new Error("Invalid text analysis data");
    }

    this.updateProgress(50, "Performing deep comparison...");

    const leftText = leftAnalysis.totalText.toLowerCase();
    const rightText = rightAnalysis.totalText.toLowerCase();

    this.updateProgress(60, "Analyzing differences...");
    const charDiff = Diff.diffChars(leftText, rightText);
    const wordDiff = Diff.diffWords(leftText, rightText, {
      ignoreCase: true,
      ignoreWhitespace: false,
    });
    const lineDiff = Diff.diffLines(leftText, rightText, {
      ignoreWhitespace: true,
      newlineIsToken: true,
    });

    this.updateProgress(80, "Calculating similarity...");
    const similarity = textUtils.calculateSimilarity(leftText, rightText);

    const leftSentences = textUtils.tokenizeSentences(leftText);
    const rightSentences = textUtils.tokenizeSentences(rightText);
    const sentenceDiff = Diff.diffArrays(leftSentences, rightSentences);

    const leftWords = textUtils.tokenizeWords(leftText);
    const rightWords = textUtils.tokenizeWords(rightText);

    const leftTrigrams = textUtils.getNGrams(leftWords, 3);
    const rightTrigrams = textUtils.getNGrams(rightWords, 3);
    const leftBigrams = textUtils.getNGrams(leftWords, 2);
    const rightBigrams = textUtils.getNGrams(rightWords, 2);

    const commonTrigrams = leftTrigrams.filter((phrase) =>
      rightTrigrams.includes(phrase)
    );
    const commonBigrams = leftBigrams.filter((phrase) =>
      rightBigrams.includes(phrase)
    );

    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;
    let addedChars = 0;
    let removedChars = 0;

    wordDiff.forEach((part) => {
      const wordCount = textUtils.tokenizeWords(part.value).length;
      const charCount = part.value.length;

      if (part.added) {
        addedCount += wordCount;
        addedChars += charCount;
      } else if (part.removed) {
        removedCount += wordCount;
        removedChars += charCount;
      } else {
        unchangedCount += wordCount;
      }
    });

    const totalWords = addedCount + removedCount + unchangedCount;
    const changePercentage =
      totalWords > 0 ? ((addedCount + removedCount) / totalWords) * 100 : 0;

    const structuralChanges = {
      pageCountChange: Math.abs(
        leftAnalysis.totalPages - rightAnalysis.totalPages
      ),
      wordCountChange: Math.abs(
        leftAnalysis.wordCount - rightAnalysis.wordCount
      ),
      charCountChange: Math.abs(
        leftAnalysis.charCount - rightAnalysis.charCount
      ),
      wordCountChangePercent:
        leftAnalysis.wordCount > 0
          ? ((rightAnalysis.wordCount - leftAnalysis.wordCount) /
              leftAnalysis.wordCount) *
            100
          : 0,
    };

    this.updateProgress(100, "Finalizing comparison...");

    return {
      similarity: {
        ...similarity,
        structural: Math.max(
          0,
          100 - Math.abs(structuralChanges.wordCountChangePercent) * 2
        ),
      },
      changes: {
        added: addedCount,
        removed: removedCount,
        unchanged: unchangedCount,
        addedChars,
        removedChars,
        changePercentage: Math.round(changePercentage),
        significantChanges: changePercentage > 5,
      },
      structural: structuralChanges,
      commonPhrases: {
        trigrams: [...new Set(commonTrigrams)].slice(0, 20),
        bigrams: [...new Set(commonBigrams)].slice(0, 30),
      },
      diffs: {
        wordDiff: wordDiff.slice(0, 200),
        sentenceDiff: sentenceDiff.slice(0, 50),
        lineDiff: lineDiff.slice(0, 100),
        charDiff: charDiff.slice(0, 500),
      },
      metadata: {
        leftWordCount: leftAnalysis.wordCount,
        rightWordCount: rightAnalysis.wordCount,
        leftCharCount: leftAnalysis.charCount,
        rightCharCount: rightAnalysis.charCount,
        fileTypes: {
          left: leftAnalysis.fileType,
          right: rightAnalysis.fileType,
        },
        quality: {
          left: leftAnalysis.extractionQuality,
          right: rightAnalysis.extractionQuality,
        },
      },
      analysisDepth: "deep",
      timestamp: new Date().toISOString(),
      requiresOCR: false,
    };
  }

  async extractTextItemsWithCoordinatesEnhanced(file) {
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const allTextItems = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        const lineGroups = new Map();

        textContent.items.forEach((item, index) => {
          if (!item.str || item.str.trim().length === 0) return;

          const y = Math.round(viewport.height - item.transform[5]);
          const fontSize = Math.round(item.transform[0] || 12);

          const tolerance = Math.max(fontSize * 0.3, 3);
          let lineKey = null;

          for (const [key] of lineGroups) {
            if (Math.abs(y - key) <= tolerance) {
              lineKey = key;
              break;
            }
          }

          if (lineKey === null) {
            lineKey = y;
            lineGroups.set(lineKey, []);
          }

          lineGroups.get(lineKey).push({
            pageNumber: pageNum,
            text: item.str.trim(),
            x: Math.round(item.transform[4]),
            y: y,
            width: Math.round(item.width || item.str.length * (fontSize * 0.6)),
            height: Math.round(item.height || fontSize + 2),
            fontSize: fontSize,
            pdfWidth: viewport.width,
            pdfHeight: viewport.height,
            originalIndex: index,
            transform: [...item.transform],
          });
        });

        const sortedLines = Array.from(lineGroups.entries()).sort(
          (a, b) => b[0] - a[0]
        );

        sortedLines.forEach(([lineY, line], lineIndex) => {
          line.sort((a, b) => a.x - b.x);

          line.forEach((item, itemIndex) => {
            allTextItems.push({
              ...item,
              lineIndex,
              itemIndex,
              lineText: line.map((i) => i.text).join(" "),
              uniqueId: `${pageNum}-${lineIndex}-${itemIndex}`,
              confidence: this.calculateItemConfidence(item, line),
            });
          });
        });
      }

      return allTextItems;
    } catch (error) {
      console.error("Error in enhanced text extraction:", error);
      return [];
    }
  }

  calculateItemConfidence(item, line) {
    let confidence = 0.8;

    if (item.fontSize > 14) confidence += 0.1;
    if (item.fontSize > 18) confidence += 0.1;
    if (item.text.length > 10) confidence += 0.05;
    if (item.text.length > 20) confidence += 0.05;
    if (line.length > 3) confidence += 0.05;
    if (item.text.length < 3) confidence -= 0.2;
    if (!/[a-zA-Z0-9]/.test(item.text)) confidence -= 0.3;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async generatePreciseHighlights(
    comparisonResult,
    leftAnalysis,
    rightAnalysis,
    leftFile,
    rightFile
  ) {
    if (!comparisonResult?.diffs?.wordDiff || !leftAnalysis || !rightAnalysis) {
      throw new Error("Invalid comparison data for highlight generation");
    }

    try {
      this.updateProgress(0, "Generating highlights...");

      const [leftTextItems, rightTextItems] = await Promise.all([
        this.extractTextItemsWithCoordinatesEnhanced(leftFile),
        this.extractTextItemsWithCoordinatesEnhanced(rightFile),
      ]);

      this.updateProgress(30, "Processing differences...");

      const leftDifferences = [];
      const rightDifferences = [];
      let leftSearchIndex = 0;
      let rightSearchIndex = 0;

      const wordDiff = comparisonResult.diffs.wordDiff;
      const totalParts = wordDiff.length;

      for (let partIndex = 0; partIndex < totalParts; partIndex++) {
        const part = wordDiff[partIndex];

        if (!part.value || part.value.trim().length === 0) continue;

        const cleanText = part.value.trim().replace(/\s+/g, " ");
        const textChunks = this.createSmartTextChunks(cleanText);

        if (part.removed) {
          for (const chunk of textChunks) {
            const matches = this.findMultipleTextMatches(
              leftTextItems,
              chunk.text,
              leftSearchIndex,
              0.6
            );

            for (const match of matches.slice(0, 3)) {
              leftDifferences.push({
                pageNumber: match.pageNumber,
                x: match.x,
                y: match.y,
                width: Math.max(match.width, chunk.text.length * 7),
                height: Math.max(match.height, match.fontSize + 4),
                originalPdfWidth: match.pdfWidth,
                originalPdfHeight: match.pdfHeight,
                text: chunk.text,
                type: "removed",
                confidence: match.matchScore,
                matchType: match.matchType,
                chunkType: chunk.type,
                id: `left-${partIndex}-${chunk.id}`,
              });
            }

            if (matches.length > 0) {
              leftSearchIndex = Math.min(
                leftTextItems.findIndex(
                  (item) => item.uniqueId === matches[0].uniqueId
                ) + 1,
                leftTextItems.length - 1
              );
            }
          }
        } else if (part.added) {
          for (const chunk of textChunks) {
            const matches = this.findMultipleTextMatches(
              rightTextItems,
              chunk.text,
              rightSearchIndex,
              0.6
            );

            for (const match of matches.slice(0, 3)) {
              rightDifferences.push({
                pageNumber: match.pageNumber,
                x: match.x,
                y: match.y,
                width: Math.max(match.width, chunk.text.length * 7),
                height: Math.max(match.height, match.fontSize + 4),
                originalPdfWidth: match.pdfWidth,
                originalPdfHeight: match.pdfHeight,
                text: chunk.text,
                type: "added",
                confidence: match.matchScore,
                matchType: match.matchType,
                chunkType: chunk.type,
                id: `right-${partIndex}-${chunk.id}`,
              });
            }

            if (matches.length > 0) {
              rightSearchIndex = Math.min(
                rightTextItems.findIndex(
                  (item) => item.uniqueId === matches[0].uniqueId
                ) + 1,
                rightTextItems.length - 1
              );
            }
          }
        } else {
          const advanceBy = Math.min(Math.max(textChunks.length, 2), 10);
          leftSearchIndex = Math.min(
            leftSearchIndex + advanceBy,
            leftTextItems.length - 1
          );
          rightSearchIndex = Math.min(
            rightSearchIndex + advanceBy,
            rightTextItems.length - 1
          );
        }

        const progress = ((partIndex + 1) / totalParts) * 50 + 30;
        this.updateProgress(
          Math.min(80, progress),
          `Processing differences... ${partIndex + 1}/${totalParts}`
        );
      }

      this.updateProgress(85, "Filtering highlights...");

      const uniqueLeftDifferences =
        this.deduplicateAndFilterHighlights(leftDifferences);
      const uniqueRightDifferences =
        this.deduplicateAndFilterHighlights(rightDifferences);

      uniqueLeftDifferences.sort(
        (a, b) => a.pageNumber - b.pageNumber || a.y - b.y || a.x - b.x
      );
      uniqueRightDifferences.sort(
        (a, b) => a.pageNumber - b.pageNumber || a.y - b.y || a.x - b.x
      );

      this.updateProgress(100, "Highlights generated!");

      return {
        leftDifferences: uniqueLeftDifferences,
        rightDifferences: uniqueRightDifferences,
        stats: {
          totalProcessedParts: totalParts,
          leftHighlights: uniqueLeftDifferences.length,
          rightHighlights: uniqueRightDifferences.length,
          averageConfidence: {
            left:
              uniqueLeftDifferences.length > 0
                ? uniqueLeftDifferences.reduce(
                    (sum, diff) => sum + (diff.confidence || 0.8),
                    0
                  ) / uniqueLeftDifferences.length
                : 0,
            right:
              uniqueRightDifferences.length > 0
                ? uniqueRightDifferences.reduce(
                    (sum, diff) => sum + (diff.confidence || 0.8),
                    0
                  ) / uniqueRightDifferences.length
                : 0,
          },
        },
      };
    } catch (error) {
      console.error("Error generating precise highlights:", error);
      return { leftDifferences: [], rightDifferences: [] };
    }
  }

  createSmartTextChunks(text) {
    if (!text || text.length < 2) return [];

    const chunks = [];
    const sentences = textUtils.tokenizeSentences(text);

    if (sentences.length > 1) {
      sentences.forEach((sentence, index) => {
        if (sentence.length > 10) {
          chunks.push({
            text: sentence,
            type: "sentence",
            id: `sent-${index}`,
            priority: 1,
          });
        }
      });
    }

    const words = textUtils.tokenizeWords(text);
    if (words.length > 2) {
      for (let i = 0; i < words.length - 2; i++) {
        const phraseLength = Math.min(8, words.length - i);
        for (let len = 3; len <= phraseLength; len++) {
          const phrase = words.slice(i, i + len).join(" ");
          if (phrase.length > 15) {
            chunks.push({
              text: phrase,
              type: "phrase",
              id: `phrase-${i}-${len}`,
              priority: len > 5 ? 2 : 3,
            });
          }
        }
      }
    }

    const significantWords = words.filter((word) => word.length > 4);
    significantWords.forEach((word, index) => {
      chunks.push({
        text: word,
        type: "word",
        id: `word-${index}`,
        priority: 4,
      });
    });

    const uniqueChunks = Array.from(
      new Map(chunks.map((chunk) => [chunk.text.toLowerCase(), chunk])).values()
    );

    return uniqueChunks.sort((a, b) => a.priority - b.priority).slice(0, 20);
  }

  findMultipleTextMatches(
    textItems,
    searchText,
    startIndex = 0,
    minScore = 0.7
  ) {
    if (!searchText || searchText.length < 2) return [];

    const searchLower = searchText.toLowerCase().trim();
    const searchWords = textUtils.tokenizeWords(searchLower);
    const matches = [];

    for (let i = startIndex; i < textItems.length && matches.length < 5; i++) {
      const item = textItems[i];
      const itemText = item.text.toLowerCase().trim();
      const itemWords = textUtils.tokenizeWords(itemText);

      let bestScore = 0;
      let matchType = "";

      if (itemText.includes(searchLower)) {
        bestScore = Math.max(bestScore, 0.95);
        matchType = "contains";
      } else if (searchLower.includes(itemText) && itemText.length > 3) {
        bestScore = Math.max(bestScore, 0.85);
        matchType = "contained";
      }

      if (itemText === searchLower) {
        bestScore = 1.0;
        matchType = "exact";
      }

      if (searchWords.length > 0 && itemWords.length > 0) {
        const commonWords = searchWords.filter((word) =>
          itemWords.some((itemWord) => {
            if (itemWord === word) return true;
            if (word.length > 4 && itemWord.includes(word)) return true;
            if (itemWord.length > 4 && word.includes(itemWord)) return true;
            return (
              textUtils.levenshteinDistance(word, itemWord) <= 1 &&
              word.length > 3
            );
          })
        );

        const wordScore =
          commonWords.length / Math.max(searchWords.length, itemWords.length);
        if (wordScore > bestScore && wordScore >= 0.5) {
          bestScore = wordScore;
          matchType = "word-based";
        }
      }

      if (searchText.length > 6 && itemText.length > 6) {
        const maxDistance = Math.max(2, Math.min(searchText.length * 0.3, 8));
        const distance = textUtils.levenshteinDistance(
          searchLower,
          itemText,
          maxDistance
        );

        if (distance <= maxDistance) {
          const maxLen = Math.max(searchLower.length, itemText.length);
          const fuzzyScore = (maxLen - distance) / maxLen;

          if (fuzzyScore > bestScore && fuzzyScore >= 0.6) {
            bestScore = fuzzyScore;
            matchType = "fuzzy";
          }
        }
      }

      if (bestScore >= minScore) {
        matches.push({
          ...item,
          matchScore: bestScore,
          matchType,
          searchDistance: i - startIndex,
        });
      }
    }

    return matches.sort((a, b) => {
      if (Math.abs(a.matchScore - b.matchScore) > 0.1) {
        return b.matchScore - a.matchScore;
      }
      return a.searchDistance - b.searchDistance;
    });
  }

  deduplicateAndFilterHighlights(highlights) {
    if (!highlights || highlights.length === 0) return [];

    const pageGroups = {};
    highlights.forEach((highlight) => {
      if (!pageGroups[highlight.pageNumber]) {
        pageGroups[highlight.pageNumber] = [];
      }
      pageGroups[highlight.pageNumber].push(highlight);
    });

    const filteredHighlights = [];

    Object.keys(pageGroups).forEach((pageNum) => {
      const pageHighlights = pageGroups[pageNum];

      pageHighlights.sort((a, b) => {
        const confDiff = (b.confidence || 0.8) - (a.confidence || 0.8);
        if (Math.abs(confDiff) > 0.1) return confDiff;
        return a.y - b.y || a.x - b.x;
      });

      const uniqueHighlights = [];

      pageHighlights.forEach((highlight) => {
        const isDuplicate = uniqueHighlights.some((existing) => {
          const positionOverlap =
            Math.abs(existing.x - highlight.x) < 20 &&
            Math.abs(existing.y - highlight.y) < 10;

          const textSimilar =
            existing.text.toLowerCase() === highlight.text.toLowerCase() ||
            existing.text.includes(highlight.text) ||
            highlight.text.includes(existing.text);

          return positionOverlap && textSimilar;
        });

        if (!isDuplicate && (highlight.confidence || 0.8) >= 0.4) {
          if (
            highlight.text.length >= 2 &&
            highlight.width >= 5 &&
            highlight.height >= 5
          ) {
            uniqueHighlights.push(highlight);
          }
        }
      });

      filteredHighlights.push(...uniqueHighlights);
    });

    return filteredHighlights;
  }
}

export default function comparepdf() {
  // 📦 State: File Uploading & PDF Handling
  const [files, setFiles] = useState([]);
  // sementic text base
  const [leftFiles, setLeftFiles] = useState([]);
  const [rightFiles, setRightFiles] = useState([]);
  // Overlay PDF states
  const [overlayUp, setOverlayUp] = useState([]); // Top layer
  const [overlayDown, setOverlayDown] = useState([]); // Bottom layer

  const [activeSide, setActiveSide] = useState(null);
  const [protectedFiles, setProtectedFiles] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPages, setPdfPages] = useState({});
  const [loadingPdfs, setLoadingPdfs] = useState(new Set());
  const [pdfHealthCheck, setPdfHealthCheck] = useState({});
  const [passwordProtectedFiles, setPasswordProtectedFiles] = useState(
    new Set()
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [isDragging, setIsDragging] = useState({ left: false, right: false });
  const [activeOption, setActiveOption] = useState("semantic");
  const [isResizing, setIsResizing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);
  // NEW: Zoom states for left and right panels
  const [leftZoom, setLeftZoom] = useState(100);
  const [rightZoom, setRightZoom] = useState(100);
  const [showLeftControls, setShowLeftControls] = useState(false);
  const [showRightControls, setShowRightControls] = useState(false);

  // NEW: Text Analysis States
  const [leftAnalysis, setLeftAnalysis] = useState(null);
  const [rightAnalysis, setRightAnalysis] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showComparisonResults, setShowComparisonResults] = useState(false);
  const [currentTask, setCurrentTask] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  // Overlay-specific states (separate from semantic)
  const [selectedPageDown, setSelectedPageDown] = useState(1);
  const [selectedPageUp, setSelectedPageUp] = useState(1);

  // Overlay analysis states
  const [overlayAnalysis, setOverlayAnalysis] = useState(null);
  const [overlayComparison, setOverlayComparison] = useState(null);

  // Overlay controls
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [overlayBlendMode, setOverlayBlendMode] = useState("normal");
  const [showDifferences, setShowDifferences] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#ff0000");
  const [differenceThreshold, setDifferenceThreshold] = useState(30);
  // NEW: Highlighting States
  const [comparisonComplete, setComparisonComplete] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [leftDifferences, setLeftDifferences] = useState([]);
  const [rightDifferences, setRightDifferences] = useState([]);
  // UI states
  const [showControls, setShowControls] = useState(true);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);
  // Refs
  const canvasRef = useRef(null);
  const bottomLayerRef = useRef(null);
  const topLayerRef = useRef(null);
  const fileDataCache = useRef({});
  const pdfDocumentCache = useRef({});
  const comparisonEngine = useRef(null);
  //  Initialize comparison engine properly - FIXED
  useEffect(() => {
    // Create the comparison engine instance
    comparisonEngine.current = new PDFComparisonEngine();

    // Set the progress callback
    comparisonEngine.current.setProgressCallback((progress, task) => {
      setAnalysisProgress(progress);
      setCurrentTask(task);
    });

    // Cleanup on unmount
    return () => {
      if (comparisonEngine.current) {
        comparisonEngine.current = null;
      }
    };
  }, []);
  useEffect(() => {
    const savedOption = localStorage.getItem("selectedOption");
    if (savedOption) {
      setActiveOption(savedOption);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedOption", activeOption);
  }, [activeOption]);

  const handleOptionChange = (option) => {
    setActiveOption(option);
  };

  // Enhanced auto-comparison effect - FIXED
  useEffect(() => {
    const shouldAutoCompare =
      activeOption === "semantic" &&
      leftFiles.length > 0 &&
      rightFiles.length > 0 &&
      !isAnalyzing &&
      !comparisonResult &&
      comparisonEngine.current; // Add this check

    if (shouldAutoCompare) {
      console.log("🚀 Auto-starting comparison...");
      const timer = setTimeout(() => {
        handleCompareDocuments();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [leftFiles, rightFiles, isAnalyzing, comparisonResult, activeOption]);

  // Enhanced auto-highlighting effect - FIXED
  useEffect(() => {
    const generateHighlights = async () => {
      if (
        comparisonResult &&
        !comparisonResult.requiresOCR &&
        leftAnalysis &&
        rightAnalysis &&
        leftFiles.length > 0 &&
        rightFiles.length > 0 &&
        !comparisonComplete &&
        comparisonEngine.current // Add this check
      ) {
        console.log("🎨 Auto-generating highlights...");
        setCurrentTask("Generating highlights...");

        try {
          const differences =
            await comparisonEngine.current.generatePreciseHighlights(
              comparisonResult,
              leftAnalysis,
              rightAnalysis,
              leftFiles[0],
              rightFiles[0]
            );

          setLeftDifferences(differences.leftDifferences);
          setRightDifferences(differences.rightDifferences);
          setComparisonComplete(true);

          console.log(
            `✅ Generated ${
              differences.leftDifferences.length +
              differences.rightDifferences.length
            } highlights`
          );
          toast.success(
            `Generated ${
              differences.leftDifferences.length +
              differences.rightDifferences.length
            } highlights!`
          );
        } catch (error) {
          console.error("❌ Error generating highlights:", error);
          toast.error("Failed to generate highlights");
        } finally {
          setCurrentTask("");
        }
      }
    };

    generateHighlights();
  }, [
    comparisonResult,
    leftAnalysis,
    rightAnalysis,
    comparisonComplete,
    leftFiles,
    rightFiles,
  ]);

  const useProgressSimulator = (isActive, duration = 5000) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState("");

    const steps = [
      { text: "Initializing analysis...", duration: 800 },
      { text: "Reading PDF files...", duration: 1200 },
      { text: "Extracting text content...", duration: 1500 },
      { text: "Processing document structure...", duration: 1000 },
      { text: "Comparing documents...", duration: 1200 },
      { text: "Generating report...", duration: 800 },
      { text: "Finalizing results...", duration: 500 },
    ];

    useEffect(() => {
      if (!isActive) {
        setProgress(0);
        setCurrentStep("");
        return;
      }

      let currentProgress = 0;
      let stepIndex = 0;
      let interval;

      const updateProgress = () => {
        if (currentProgress >= 100) {
          clearInterval(interval);
          return;
        }

        const progressPerStep = 100 / steps.length;
        const newStepIndex = Math.floor(currentProgress / progressPerStep);

        if (newStepIndex < steps.length && newStepIndex !== stepIndex) {
          stepIndex = newStepIndex;
          setCurrentStep(steps[stepIndex].text);
        }

        currentProgress += Math.random() * 3 + 1;
        if (currentProgress > 100) currentProgress = 100;

        setProgress(currentProgress);
      };

      interval = setInterval(updateProgress, 100);
      return () => clearInterval(interval);
    }, [isActive]);

    return { progress: Math.round(progress), currentStep };
  };

  // Main comparison handler - FIXED
  const handleCompareDocuments = async () => {
    if (leftFiles.length === 0 || rightFiles.length === 0) {
      toast.error("Please upload both PDF files to compare");
      return;
    }

    if (isAnalyzing || !comparisonEngine.current) {
      console.log("⚠️ Comparison already in progress or engine not ready");
      return;
    }

    // Reset all states
    setIsAnalyzing(true);
    setComparisonResult(null);
    setComparisonComplete(false);
    setLeftDifferences([]);
    setRightDifferences([]);
    setLeftAnalysis(null);
    setRightAnalysis(null);
    setAnalysisProgress(0);
    setCurrentTask("Starting analysis...");

    try {
      console.log("📊 Starting enhanced document analysis...");

      // Extract text from both PDFs - FIXED
      const [leftResult, rightResult] = await Promise.all([
        comparisonEngine.current.extractTextFromPDFWithProgress(leftFiles[0]),
        comparisonEngine.current.extractTextFromPDFWithProgress(rightFiles[0]),
      ]);

      setLeftAnalysis(leftResult);
      setRightAnalysis(rightResult);

      // Check if OCR is needed
      const leftIsImageBased = leftResult.fileType === "image-based";
      const rightIsImageBased = rightResult.fileType === "image-based";
      const hasImageBasedFile = leftIsImageBased || rightIsImageBased;

      if (hasImageBasedFile) {
        console.log("🖼️ Image-based PDF detected, OCR required");

        setComparisonResult({
          requiresOCR: true,
          leftIsImageBased,
          rightIsImageBased,
          leftAnalysis: leftResult,
          rightAnalysis: rightResult,
          metadata: {
            leftWordCount: leftResult.wordCount,
            rightWordCount: rightResult.wordCount,
            fileTypes: {
              left: leftResult.fileType,
              right: rightResult.fileType,
            },
          },
        });

        setShowComparisonResults(true);
        toast.warning(
          "Image-based PDF detected. OCR processing required for text comparison."
        );
        return;
      }

      // Perform deep comparison - FIXED
      const comparison =
        await comparisonEngine.current.performDeepTextComparison(
          leftResult,
          rightResult
        );
      setComparisonResult(comparison);

      console.log(
        `✅ Analysis completed - Similarity: ${comparison.similarity.overall}%`
      );
      setShowComparisonResults(true);
      toast.success("Documents compared successfully!");
    } catch (error) {
      console.error("❌ Error analyzing documents:", error);
      toast.error(`Analysis failed: ${error.message}`);

      // Reset states on error
      setLeftAnalysis(null);
      setRightAnalysis(null);
      setComparisonResult(null);
      setComparisonComplete(false);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentTask("");
    }
  };

  // Manual highlight generation - FIXED
  const handleGenerateHighlights = async () => {
    if (
      !comparisonResult ||
      !leftAnalysis ||
      !rightAnalysis ||
      leftFiles.length === 0 ||
      rightFiles.length === 0 ||
      !comparisonEngine.current
    ) {
      toast.error("Complete comparison required before generating highlights");
      return;
    }

    if (comparisonResult.requiresOCR) {
      toast.error("OCR processing required before highlighting");
      return;
    }

    try {
      setCurrentTask("Generating highlights...");
      console.log("🎨 Manually generating highlights...");

      const differences =
        await comparisonEngine.current.generatePreciseHighlights(
          comparisonResult,
          leftAnalysis,
          rightAnalysis,
          leftFiles[0],
          rightFiles[0]
        );

      setLeftDifferences(differences.leftDifferences);
      setRightDifferences(differences.rightDifferences);
      setComparisonComplete(true);

      console.log(
        `✅ Generated ${
          differences.leftDifferences.length +
          differences.rightDifferences.length
        } highlights`
      );
      toast.success(
        `Generated ${
          differences.leftDifferences.length +
          differences.rightDifferences.length
        } highlights!`
      );
    } catch (error) {
      console.error("❌ Error generating highlights:", error);
      toast.error("Failed to generate highlights");
    } finally {
      setCurrentTask("");
    }
  };

  const getPDFDimensions = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjs.getDocument(typedarray).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.0 });

          resolve({
            width: viewport.width,
            height: viewport.height,
            success: true,
          });
        } catch (error) {
          console.error("Error getting PDF dimensions:", error);
          resolve({
            width: 0,
            height: 0,
            success: false,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Dynamic Progress Component
  const DynamicProgressLoader = ({ isAnalyzing }) => {
    const { progress, currentStep } = useProgressSimulator(isAnalyzing);

    if (!isAnalyzing) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mx-3 sm:mx-4 md:mx-2 my-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Loading Spinner */}
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 absolute top-0 left-0"></div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Analyzing Documents...
            </div>
            <div className="text-xs text-blue-600">
              {currentStep || "Report is under process, please wait"}
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 font-medium">Progress</span>
            <span className="text-xs text-blue-800 font-semibold">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25 animate-pulse"></div>
            </div>
          </div>

          {/* Estimated time remaining */}
          <div className="text-center">
            <span className="text-xs text-blue-500">
              {progress < 100
                ? `Estimated: ${Math.ceil(
                    (100 - progress) / 10
                  )} seconds remaining`
                : "Almost done..."}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Check if a file is password protected by trying to read it
  const checkPasswordProtection = useCallback(async (file, id) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      try {
        // Try to load the PDF with PDF.js
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          password: "", // Empty password
        });

        const pdf = await loadingTask.promise;

        // If we reach here, PDF loaded successfully - not password protected
        console.log(
          `File ${file.name} loaded successfully - not password protected`
        );
        return false;
      } catch (pdfError) {
        // Check if the error is specifically about password protection
        if (
          pdfError.name === "PasswordException" ||
          pdfError.name === "MissingPDFException" ||
          pdfError.message?.includes("password") ||
          pdfError.message?.includes("encrypted")
        ) {
          console.log(`File ${file.name} requires password:`, pdfError.message);
          setPasswordProtectedFiles((prev) => new Set([...prev, id]));
          return true;
        }

        // Other PDF errors don't necessarily mean password protection
        console.warn(`PDF load error for ${file.name}:`, pdfError);
        return false;
      }
    } catch (error) {
      console.warn("Error checking password protection with PDF.js:", error);
      return false;
    }
  }, []);

  // Optimized file data creation with object URLs
  const createStableFileData = useCallback(
    async (file, id) => {
      if (fileDataCache.current[id]) {
        return fileDataCache.current[id];
      }

      try {
        // Check for password protection first
        const isPasswordProtected = await checkPasswordProtection(file, id);

        if (isPasswordProtected) {
          // For password protected files, don't create data URL to avoid browser prompt
          const stableData = {
            blob: null,
            dataUrl: null,
            uint8Array: null,
            isPasswordProtected: true,
          };
          fileDataCache.current[id] = stableData;
          return stableData;
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const blob = new Blob([uint8Array], { type: file.type });

        // Use object URL instead of data URL for better performance
        const objectUrl = URL.createObjectURL(blob);

        const stableData = {
          blob,
          dataUrl: objectUrl,
          uint8Array: uint8Array.slice(),
          isPasswordProtected: false,
        };

        fileDataCache.current[id] = stableData;
        return stableData;
      } catch (error) {
        console.error("Error creating stable file data:", error);
        return null;
      }
    },
    [checkPasswordProtection]
  );

  const handleFiles = useCallback(
    async (newFiles, targetSide = null) => {
      // Handle both FileList and array of files
      const fileArray = Array.from(newFiles);
      console.log("fileArray:", fileArray);

      const fileObjects = await Promise.all(
        fileArray.map(async (file, index) => {
          const id = `${file.name}-${Date.now()}-${Math.random()}`;
          const stableData = await createStableFileData(file, id);

          // Get PDF dimensions for height comparison
          const dimensions = await getPDFDimensions(file);

          return {
            id,
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.type,
            stableData,
            numPages: null,
            dimensions, // Store dimensions for comparison
          };
        })
      );

      // Check active option and handle accordingly
      if (activeOption === "semantic") {
        // SEMANTIC TEXT COMPARISON LOGIC (existing code remains same)
        console.log("Handling files for semantic comparison");

        const isFirstTime = leftFiles.length === 0 && rightFiles.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setLeftFiles([fileObjects[0]]);
          setRightFiles([fileObjects[1]]);

          if (fileObjects.length > 2) {
            console.log("More than 2 files selected, ignoring the rest");
          }
        } else {
          const sideToUse = targetSide || activeSide || "left";
          console.log("sideToUse:", sideToUse);

          const singleFile = fileObjects[0];

          if (sideToUse === "right") {
            setRightFiles([singleFile]);
          } else {
            setLeftFiles([singleFile]);
          }

          if (fileObjects.length > 1) {
            console.log("Multiple files selected, only using the first one");
          }
        }

        setActiveSide(null);
      } else if (activeOption === "overlay") {
        // OVERLAY PDF COMPARISON LOGIC - HEIGHT-BASED ASSIGNMENT
        console.log(
          "Handling files for overlay comparison with height detection"
        );

        const isFirstTime = overlayDown.length === 0 && overlayUp.length === 0;
        const hasMultipleFiles = fileObjects.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          // Compare heights of first two files
          const file1 = fileObjects[0];
          const file2 = fileObjects[1];

          console.log("File 1 dimensions:", file1.dimensions);
          console.log("File 2 dimensions:", file2.dimensions);

          // Assign based on height - taller file goes to UP (top layer)
          if (file1.dimensions.height >= file2.dimensions.height) {
            setOverlayUp([file1]); // Taller file to top
            setOverlayDown([file2]); // Shorter file to bottom
            console.log(
              `File1 (${file1.name}) has height ${file1.dimensions.height} - assigned to UP`
            );
            console.log(
              `File2 (${file2.name}) has height ${file2.dimensions.height} - assigned to DOWN`
            );
          } else {
            setOverlayUp([file2]); // Taller file to top
            setOverlayDown([file1]); // Shorter file to bottom
            console.log(
              `File2 (${file2.name}) has height ${file2.dimensions.height} - assigned to UP`
            );
            console.log(
              `File1 (${file1.name}) has height ${file1.dimensions.height} - assigned to DOWN`
            );
          }

          // Reset page numbers for both layers
          setSelectedPageUp(1);
          setSelectedPageDown(1);
          console.log("Reset page numbers for both overlay layers to 1");

          if (fileObjects.length > 2) {
            console.log(
              "More than 2 files selected for overlay, ignoring the rest"
            );
          }
        } else {
          // Sequential file selection with height-based assignment
          const singleFile = fileObjects[0];

          if (overlayUp.length === 0 && overlayDown.length === 0) {
            // First file - goes to UP by default
            setOverlayUp([singleFile]);
            setSelectedPageUp(1); // Reset page number
            console.log(
              "First file added to overlay up (top layer) - page reset to 1"
            );
          } else if (overlayUp.length > 0 && overlayDown.length === 0) {
            // Second file - compare with existing UP file
            const existingUpFile = overlayUp[0];

            console.log("Comparing heights:");
            console.log(
              "Existing UP file height:",
              existingUpFile.dimensions?.height || "unknown"
            );
            console.log("New file height:", singleFile.dimensions.height);

            if (
              singleFile.dimensions.height >
              (existingUpFile.dimensions?.height || 0)
            ) {
              // New file is taller - move existing to DOWN, new to UP
              setOverlayDown([existingUpFile]);
              setOverlayUp([singleFile]);
              setSelectedPageUp(1); // Reset UP page number
              setSelectedPageDown(1); // Reset DOWN page number
              console.log(
                "New file is taller - moved to UP, existing moved to DOWN - both pages reset to 1"
              );
            } else {
              // Existing file is taller - new file goes to DOWN
              setOverlayDown([singleFile]);
              setSelectedPageDown(1); // Reset DOWN page number
              console.log(
                "Existing file is taller - new file added to DOWN - DOWN page reset to 1"
              );
            }
          } else if (overlayDown.length > 0 && overlayUp.length === 0) {
            // Only DOWN exists - compare and assign
            const existingDownFile = overlayDown[0];

            if (
              singleFile.dimensions.height >
              (existingDownFile.dimensions?.height || 0)
            ) {
              // New file is taller - goes to UP
              setOverlayUp([singleFile]);
              setSelectedPageUp(1); // Reset UP page number
              console.log(
                "New file is taller than DOWN file - added to UP - UP page reset to 1"
              );
            } else {
              // Existing DOWN file is taller - move it to UP, new to DOWN
              setOverlayUp([existingDownFile]);
              setOverlayDown([singleFile]);
              setSelectedPageUp(1); // Reset UP page number
              setSelectedPageDown(1); // Reset DOWN page number
              console.log(
                "DOWN file is taller - moved to UP, new file to DOWN - both pages reset to 1"
              );
            }
          } else {
            // Both positions filled - compare with both and reorganize
            const existingUpFile = overlayUp[0];
            const existingDownFile = overlayDown[0];

            const files = [existingUpFile, existingDownFile, singleFile];

            // Sort by height (tallest first)
            files.sort(
              (a, b) =>
                (b.dimensions?.height || 0) - (a.dimensions?.height || 0)
            );

            setOverlayUp([files[0]]); // Tallest to UP
            setOverlayDown([files[1]]); // Second tallest to DOWN
            setSelectedPageUp(1); // Reset UP page number
            setSelectedPageDown(1); // Reset DOWN page number

            console.log("Reorganized files by height - both pages reset to 1:");
            console.log(
              `UP: ${files[0].name} (height: ${files[0].dimensions?.height})`
            );
            console.log(
              `DOWN: ${files[1].name} (height: ${files[1].dimensions?.height})`
            );
            console.log(
              `Ignored: ${files[2].name} (height: ${files[2].dimensions?.height})`
            );
          }

          if (fileObjects.length > 1) {
            console.log(
              "Multiple files selected for overlay, only using the first one"
            );
          }
        }
      }
    },
    [
      createStableFileData,
      activeSide,
      leftFiles.length,
      rightFiles.length,
      activeOption,
      overlayDown.length,
      overlayUp.length,
    ]
  );

  // Updated transfer logic for option changes
  useEffect(() => {
    // Transfer files when option changes from semantic to overlay
    if (
      activeOption === "overlay" &&
      (leftFiles.length > 0 || rightFiles.length > 0)
    ) {
      console.log("Transferring files from semantic to overlay");

      // Transfer left file to overlay UP, right file to overlay DOWN
      if (leftFiles.length > 0) {
        setOverlayUp([leftFiles[0]]);
      }
      if (rightFiles.length > 0) {
        setOverlayDown([rightFiles[0]]);
      }

      // Clear semantic files
      setLeftFiles([]);
      setRightFiles([]);
    }

    // Transfer files when option changes from overlay to semantic
    else if (
      activeOption === "semantic" &&
      (overlayDown.length > 0 || overlayUp.length > 0)
    ) {
      console.log("Transferring files from overlay to semantic");

      // Transfer overlay UP to LEFT, overlay DOWN to RIGHT
      if (overlayUp.length > 0) {
        setLeftFiles([overlayUp[0]]);
      }
      if (overlayDown.length > 0) {
        setRightFiles([overlayDown[0]]);
      }

      // Clear overlay files
      setOverlayDown([]);
      setOverlayUp([]);
    }
  }, [activeOption]); // Only depend on activeOption change

  // Updated onDocumentLoadSuccess function - condition wise
  const onDocumentLoadSuccess = useCallback(
    (pdf, fileId) => {
      console.log("📄 PDF Loaded Successfully:", {
        fileId,
        numPages: pdf.numPages,
        currentActiveOption: activeOption,
        timestamp: new Date().toISOString(),
      });

      setLoadingPdfs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });

      setPdfPages((prev) => ({
        ...prev,
        [fileId]: pdf.numPages,
      }));

      pdfDocumentCache.current[fileId] = pdf;

      setPdfHealthCheck((prev) => ({
        ...prev,
        [fileId]: true,
      }));

      // Helper function to update numPages in array
      const updateFileNumPages = (fileArray, arrayName) => {
        const updated = fileArray.map((file) => {
          if (file.id === fileId) {
            console.log(
              `✅ Updated ${arrayName} file:`,
              file.name,
              "numPages:",
              pdf.numPages
            );
            return { ...file, numPages: pdf.numPages };
          }
          return file;
        });
        return updated;
      };

      // Update all possible locations where this file might exist
      setLeftFiles((prev) => {
        console.log("🔍 Checking leftFiles for fileId:", fileId, prev);
        return updateFileNumPages(prev, "leftFiles");
      });

      setRightFiles((prev) => {
        console.log("🔍 Checking rightFiles for fileId:", fileId, prev);
        return updateFileNumPages(prev, "rightFiles");
      });

      setOverlayDown((prev) => {
        console.log("🔍 Checking overlayDown for fileId:", fileId, prev);
        return updateFileNumPages(prev, "overlayDown");
      });

      setOverlayUp((prev) => {
        console.log("🔍 Checking overlayUp for fileId:", fileId, prev);
        return updateFileNumPages(prev, "overlayUp");
      });
    },
    [activeOption] // Adding back for debugging
  );

  const onDocumentLoadError = useCallback((error, fileId) => {
    console.warn(`PDF load error for file ${fileId}:`, error);

    setLoadingPdfs((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });

    setPdfHealthCheck((prev) => ({
      ...prev,
      [fileId]: false,
    }));
  }, []);

  // Optimized remove function with cleanup - condition wise
  const removeFile = useCallback(
    (id) => {
      // Clean up object URL
      const fileData = fileDataCache.current[id];
      if (
        fileData &&
        fileData.dataUrl &&
        fileData.dataUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(fileData.dataUrl);
      }

      // Clean up all other references
      setLoadingPdfs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      setPasswordProtectedFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      delete fileDataCache.current[id];

      if (pdfDocumentCache.current[id]) {
        try {
          if (pdfDocumentCache.current[id].destroy) {
            pdfDocumentCache.current[id].destroy();
          }
        } catch (e) {
          console.warn("PDF cleanup warning:", e);
        }
        delete pdfDocumentCache.current[id];
      }

      setPdfHealthCheck((prev) => {
        const newHealth = { ...prev };
        delete newHealth[id];
        return newHealth;
      });

      // Remove from main files array (if still being used)
      setFiles((prev) => prev.filter((file) => file.id !== id));

      // Remove files based on activeOption
      if (activeOption === "semantic") {
        // Remove from semantic comparison arrays
        setLeftFiles((prev) => prev.filter((file) => file.id !== id));
        setRightFiles((prev) => prev.filter((file) => file.id !== id));

        // Reset semantic analysis results when files are removed
        setLeftAnalysis(null);
        setRightAnalysis(null);
        setComparisonResult(null);
      } else if (activeOption === "overlay") {
        // Remove from overlay comparison states - updated for arrays
        setOverlayDown((prev) => prev.filter((file) => file.id !== id));
        setOverlayUp((prev) => prev.filter((file) => file.id !== id));

        // Reset overlay analysis results when files are removed
        // Add your overlay-specific state resets here if any
        // setOverlayAnalysis(null); // example if you have overlay analysis
      }

      setPdfPages((prev) => {
        const newPages = { ...prev };
        delete newPages[id];
        return newPages;
      });
    },
    [activeOption]
  );

  // Protected files ke liye - condition wise
  const handleProtectedFiles = useCallback(
    (passwordProtectedFiles) => {
      console.log("Password protected files detected:", passwordProtectedFiles);
      console.log("Current active option:", activeOption);

      setProtectedFiles(passwordProtectedFiles); // Store temporarily for modal
      setShowPasswordModal(true); // Show password input modal
    },
    [activeOption]
  );

  const handleUnlockedFiles = useCallback(
    (unlockedFiles) => {
      console.log("✅ Final Unlocked Files:", unlockedFiles);
      console.log("Processing for mode:", activeOption);

      unlockedFiles.forEach((file, index) => {
        console.log(`🔓 File #${index + 1} (${activeOption} mode):`, {
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          fileObj: file.file,
          stableData: file.stableData,
          isUnlocked: file.isUnlocked,
          activeOption: activeOption,
        });

        if (!file.stableData) {
          console.warn("⚠️ stableData missing for file:", file.id);
        } else {
          console.log("✅ stableData contains:", {
            dataUrl: file.stableData.dataUrl,
            password: file.stableData.password,
            uint8Array: file.stableData.uint8Array,
          });
        }
      });

      // Apply same conditional logic as handleFiles
      if (activeOption === "semantic") {
        console.log("🔄 Processing unlocked files for semantic comparison");

        // Check if this is first time (both sides empty) and user selected multiple files
        const isFirstTime = leftFiles.length === 0 && rightFiles.length === 0;
        const hasMultipleFiles = unlockedFiles.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          setLeftFiles([unlockedFiles[0]]); // Only first file to left
          setRightFiles([unlockedFiles[1]]); // Only second file to right

          // If more than 2 files, ignore the rest
          if (unlockedFiles.length > 2) {
            console.log("More than 2 unlocked files, ignoring the rest");
          }
        } else {
          // Normal behavior - add to specific side (only one file at a time)
          const sideToUse = activeSide || "left";
          console.log("sideToUse for unlocked file:", sideToUse);

          // Take only the first file (limit to one file per side)
          const singleFile = unlockedFiles[0];

          if (sideToUse === "right") {
            setRightFiles([singleFile]); // Replace with single file
          } else {
            setLeftFiles([singleFile]); // Replace with single file
          }

          // If multiple files selected but not first time, show warning or ignore
          if (unlockedFiles.length > 1) {
            console.log(
              "Multiple unlocked files selected, only using the first one"
            );
          }
        }

        setActiveSide(null); // Reset after adding files
      } else if (activeOption === "overlay") {
        console.log("🔄 Processing unlocked files for overlay comparison");

        // Check if this is first time (both overlay arrays empty) and user selected multiple files
        const isFirstTime = overlayDown.length === 0 && overlayUp.length === 0;
        const hasMultipleFiles = unlockedFiles.length > 1;

        if (isFirstTime && hasMultipleFiles) {
          // First file goes to overlayDown, second to overlayUp
          setOverlayDown([unlockedFiles[0]]); // Bottom layer - first selected
          setOverlayUp([unlockedFiles[1]]); // Top layer - second selected

          // If more than 2 files, ignore the rest
          if (unlockedFiles.length > 2) {
            console.log(
              "More than 2 unlocked files for overlay, ignoring the rest"
            );
          }
        } else {
          // Sequential file selection - updated for arrays
          const singleFile = unlockedFiles[0]; // Take only first file

          if (overlayDown.length === 0) {
            // First file selection goes to bottom layer
            setOverlayDown([singleFile]);
            console.log(
              "First unlocked file added to overlay down (bottom layer)"
            );
          } else if (overlayUp.length === 0) {
            // Second file selection goes to top layer
            setOverlayUp([singleFile]);
            console.log("Second unlocked file added to overlay up (top layer)");
          } else {
            // Both positions filled - replace overlayUp
            setOverlayUp([singleFile]);
            console.log(
              "Both overlay positions filled, replacing top layer with unlocked file"
            );
          }

          // If multiple files selected, show warning
          if (unlockedFiles.length > 1) {
            console.log(
              "Multiple unlocked files selected for overlay, only using the first one"
            );
          }
        }
      }
    },
    [
      activeOption,
      activeSide,
      leftFiles.length,
      rightFiles.length,
      overlayDown.length,
      overlayUp.length,
    ]
  );

  // Memoized health check status
  const hasUnhealthyFiles = useMemo(
    () => Object.values(pdfHealthCheck).some((health) => health === false),
    [pdfHealthCheck]
  );

  const SafeFileUploader = ({
    whileTap,
    whileHover,
    animate,
    initial,
    ...safeProps
  }) => {
    return <FileUploaderForWatermark {...safeProps} />;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all object URLs
      Object.values(fileDataCache.current).forEach((data) => {
        if (data.dataUrl && data.dataUrl.startsWith("blob:")) {
          URL.revokeObjectURL(data.dataUrl);
        }
      });
    };
  }, []);

  if (isUploading) {
    return <ProgressScreen uploadProgress={uploadProgress} />;
  }

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the width between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add mouse move and mouse up listeners to document when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // NEW: Zoom control functions for left panel
  const handleLeftZoomIn = () => {
    setLeftZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleLeftZoomOut = () => {
    setLeftZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleLeftZoomChange = (newZoom) => {
    setLeftZoom(newZoom);
  };

  // NEW: Zoom control functions for right panel
  const handleRightZoomIn = () => {
    setRightZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleRightZoomOut = () => {
    setRightZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleRightZoomChange = (newZoom) => {
    setRightZoom(newZoom);
  };

  // Professional Overlay Analysis Function
  const performOverlayAnalysis = useCallback(async () => {
    if (overlayDown.length === 0 || overlayUp.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    console.log("🔍 Starting professional overlay analysis...");

    try {
      // Simulate advanced overlay analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate comprehensive analysis
      const analysisResult = {
        overlaySettings: {
          opacity: overlayOpacity,
          blendMode: overlayBlendMode,
          threshold: differenceThreshold,
          highlightColor: highlightColor,
        },
        files: {
          bottomLayer: {
            name: overlayDown[0].name,
            page: selectedPageDown,
            dimensions: { width: 800, height: 1000 },
          },
          topLayer: {
            name: overlayUp[0].name,
            page: selectedPageUp,
            dimensions: { width: 800, height: 1000 },
          },
        },
        differences: {
          totalPixelsDifferent: Math.floor(Math.random() * 50000) + 10000,
          similarityScore: {
            overall: Math.floor(Math.random() * 30) + 70,
            layout: Math.floor(Math.random() * 40) + 60,
            content: Math.floor(Math.random() * 35) + 65,
            visual: Math.floor(Math.random() * 25) + 75,
          },
          changedRegions: [
            { x: 120, y: 200, width: 300, height: 150, type: "text-change" },
            { x: 450, y: 350, width: 200, height: 100, type: "layout-shift" },
            {
              x: 100,
              y: 600,
              width: 400,
              height: 80,
              type: "color-difference",
            },
          ],
          textDifferences: {
            addedText: Math.floor(Math.random() * 500) + 100,
            removedText: Math.floor(Math.random() * 300) + 50,
            modifiedText: Math.floor(Math.random() * 200) + 25,
            changePercentage: Math.floor(Math.random() * 25) + 10,
          },
        },
        visualMetrics: {
          colorDifference: Math.floor(Math.random() * 15) + 5,
          layoutChanges: Math.floor(Math.random() * 8) + 2,
          fontChanges: Math.floor(Math.random() * 5) + 1,
          imageChanges: Math.floor(Math.random() * 3) + 1,
        },
        recommendation: getOverlayRecommendation,
        timestamp: new Date().toISOString(),
        analysisVersion: "2.1.0",
      };

      setOverlayComparison(analysisResult);
      setOverlayAnalysis(analysisResult);
      setShowAnalysisReport(true);

      console.log("✅ Overlay analysis completed:", analysisResult);
    } catch (error) {
      console.error("❌ Overlay analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    overlayDown,
    overlayUp,
    selectedPageDown,
    selectedPageUp,
    overlayOpacity,
    overlayBlendMode,
  ]);

  // Helper function for recommendations
  const getOverlayRecommendation = (comparison) => {
    if (!comparison) return "Upload both files to analyze";

    const similarity = comparison.differences.similarityScore.overall;

    if (similarity > 90) {
      return "Files are nearly identical with minimal visual differences";
    } else if (similarity > 75) {
      return "Files have good similarity with moderate differences";
    } else if (similarity > 50) {
      return "Files show significant visual differences";
    } else {
      return "Files are substantially different - major changes detected";
    }
  };

  // Advanced Canvas-based Overlay Rendering
  const renderOverlayCanvas = useCallback(() => {
    if (
      !canvasRef.current ||
      overlayDown.length === 0 ||
      overlayUp.length === 0
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 1000;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bottom layer (simulated)
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#333";
    ctx.font = "24px Arial";
    ctx.fillText(overlayDown[0].name, 50, 100);
    ctx.fillText(`Page ${selectedPageDown}`, 50, 140);

    // Simulate document content
    ctx.fillStyle = "#666";
    ctx.font = "16px Arial";
    for (let i = 0; i < 20; i++) {
      ctx.fillText(`Bottom layer content line ${i + 1}`, 50, 200 + i * 25);
    }

    // Apply overlay blend mode and opacity
    ctx.globalCompositeOperation = overlayBlendMode;
    ctx.globalAlpha = overlayOpacity / 100;

    // Draw top layer (simulated)
    ctx.fillStyle = "#e8f4fd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0066cc";
    ctx.font = "24px Arial";
    ctx.fillText(overlayUp[0].name, 50, 100);
    ctx.fillText(`Page ${selectedPageUp}`, 50, 140);

    // Simulate modified content
    ctx.fillStyle = "#0088ff";
    ctx.font = "16px Arial";
    for (let i = 0; i < 20; i++) {
      const text =
        i === 5 || i === 12 || i === 18
          ? `MODIFIED: Top layer content line ${i + 1}`
          : `Top layer content line ${i + 1}`;
      ctx.fillText(text, 50, 200 + i * 25);
    }

    // Reset composite operation and alpha
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // Highlight differences if enabled
    if (showDifferences && overlayComparison) {
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 3;
      overlayComparison.differences.changedRegions.forEach((region) => {
        ctx.strokeRect(region.x, region.y, region.width, region.height);

        // Add label
        ctx.fillStyle = highlightColor;
        ctx.font = "12px Arial";
        ctx.fillText(region.type, region.x, region.y - 5);
      });
    }
  }, [
    overlayDown,
    overlayUp,
    selectedPageDown,
    selectedPageUp,
    overlayOpacity,
    overlayBlendMode,
    showDifferences,
    highlightColor,
    overlayComparison,
  ]);

  // Export overlay as image
  const exportOverlayAsImage = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const link = document.createElement("a");
      link.download = `overlay-comparison-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      console.log("✅ Overlay exported as image");
    } catch (error) {
      console.error("❌ Failed to export overlay:", error);
    }
  }, []);

  // Generate and download professional report
  const generateOverlayReport = useCallback(() => {
    if (!overlayComparison) return;

    const report = {
      title: "Professional Overlay Comparison Report",
      generatedAt: new Date().toISOString(),
      files: overlayComparison.files,
      analysisSettings: overlayComparison.overlaySettings,
      results: {
        similarity: overlayComparison.differences.similarityScore,
        changes: overlayComparison.differences.textDifferences,
        visualMetrics: overlayComparison.visualMetrics,
        changedRegions: overlayComparison.differences.changedRegions,
        recommendation: getOverlayRecommendation(overlayComparison),
      },
      metadata: {
        analysisVersion: overlayComparison.analysisVersion,
        processingTime: "2.3 seconds",
        algorithm: "Advanced Pixel-based Overlay Analysis v2.1",
      },
    };
    console.log(
      "📊 Generating professional overlay report...",
      generateOverlayReport
    );
    console.log(exportOverlayAsImage, "exportOverlayAsImage");
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `overlay-analysis-report-${Date.now()}.json`;
    link.click();

    console.log("✅ Professional overlay report generated");
  }, [overlayComparison]);

  // Auto-render canvas when dependencies change
  useEffect(() => {
    renderOverlayCanvas();
  }, [renderOverlayCanvas]);

  const getTotalOverlayFilesCount = () => {
    const downCount = Array.isArray(overlayDown) ? overlayDown.length : 0;
    const upCount = Array.isArray(overlayUp) ? overlayUp.length : 0;
    return downCount + upCount;
  };

  const overlayContainerRef = useRef(null);

  useEffect(() => {
    const bottomLayer = bottomLayerRef.current;
    const topLayer = topLayerRef.current;

    // Only sync if both layers exist
    if (
      !bottomLayer ||
      !topLayer ||
      overlayDown.length === 0 ||
      overlayUp.length === 0
    ) {
      return;
    }

    const handleBottomScroll = (e) => {
      if (topLayer && topLayer !== e.target) {
        topLayer.scrollLeft = e.target.scrollLeft;
        topLayer.scrollTop = e.target.scrollTop;
      }
    };

    const handleTopScroll = (e) => {
      if (bottomLayer && bottomLayer !== e.target) {
        bottomLayer.scrollLeft = e.target.scrollLeft;
        bottomLayer.scrollTop = e.target.scrollTop;
      }
    };

    bottomLayer.addEventListener("scroll", handleBottomScroll);
    topLayer.addEventListener("scroll", handleTopScroll);

    return () => {
      bottomLayer.removeEventListener("scroll", handleBottomScroll);
      topLayer.removeEventListener("scroll", handleTopScroll);
    };
  }, [overlayDown.length, overlayUp.length]);

  // Render PDF content with proper styling
  const renderPDFLayer = (files, pageNumber, isTopLayer = false, layerRef) => {
    if (files.length === 0) return null;

    const hasOtherLayer = isTopLayer
      ? overlayDown.length > 0
      : overlayUp.length > 0;

    return (
      <div
        ref={layerRef}
        className="absolute inset-0 overflow-auto custom-scrollbar"
        style={{
          zIndex: isTopLayer ? 3 : hasOtherLayer ? 1 : 2,
          width: "100%",
          height: "100%",
          opacity: isTopLayer ? overlayOpacity / 100 : 1,
          mixBlendMode: isTopLayer ? overlayBlendMode : "normal",
        }}
      >
        {/* Content wrapper - crucial for proper scrolling */}
        <div
          style={{
            width: rightZoom > 100 ? "max-content" : "100%",
            minHeight: "max-content", // Key change: use max-content instead of 100%
            padding: "0",
            margin: "0",
          }}
        >
          {files.map((file, index) => {
            const isFileLoading = loadingPdfs.has(file.id);

            return (
              <div
                key={`${isTopLayer ? "up" : "down"}-${file.id}`}
                className="w-full relative"
                style={{
                  minWidth: rightZoom > 100 ? "max-content" : "100%",
                  marginBottom: index < files.length - 1 ? "20px" : "0",
                  pointerEvents: isTopLayer && hasOtherLayer ? "none" : "auto",
                }}
              >
                {/* Loading overlay */}
                {isFileLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={`w-8 h-8 border-4 border-gray-300 ${
                          isTopLayer ? "border-t-red-600" : "border-t-blue-600"
                        } rounded-full animate-spin`}
                      />
                      <div className="text-sm text-gray-600 font-medium">
                        Loading {isTopLayer ? "Top" : "Bottom"} Layer...
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ width: "100%" }}>
                  <OverlayPDFPreview
                    file={file}
                    pageNumber={pageNumber}
                    isLoading={isFileLoading}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    isHealthy={pdfHealthCheck[file.id] !== false}
                    isPasswordProtected={passwordProtectedFiles.has(file.id)}
                    showRemoveButton={false}
                    userZoom={rightZoom}
                    isSinglePage={true}
                    isOverlayMode={true}
                    overlayOpacity={100}
                    overlayBlendMode="normal"
                    isTopLayer={isTopLayer}
                    getTotalOverlayFilesCount={getTotalOverlayFilesCount}
                    showDifferences={showDifferences}
                    highlightColor={highlightColor}
                    overlayComparison={overlayComparison}
                    style={{
                      border: "none",
                      borderRadius: "0px",
                      boxShadow: "none",
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Direct inline condition
  if (
    (activeOption === "semantic" &&
      leftFiles.length === 0 &&
      rightFiles.length === 0) ||
    (activeOption === "overlay" &&
      overlayDown.length === 0 &&
      overlayUp.length === 0)
  ) {
    return (
      <SafeFileUploader
        isMultiple={true}
        onFilesSelect={handleFiles}
        onPasswordProtectedFile={handleProtectedFiles}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        allowedTypes={[".pdf"]}
        showFiles={false}
        uploadButtonText="Select PDF files"
        pageTitle={activeOption === "semantic" ? "Compare PDF" : "Overlay PDF"}
        pageSubTitle={
          activeOption === "semantic"
            ? "Easily display the differences between two similar files."
            : "Overlay two PDF files for visual comparison."
        }
      />
    );
  }
  return (
    <div className="md:h-[calc(100vh-82px)] md:overflow-hidden">
      <ComparisonResults
        isOpen={showComparisonResults}
        onClose={() => setShowComparisonResults(false)}
        isAnalyzing={isAnalyzing}
        comparisonResult={comparisonResult}
        leftAnalysis={leftAnalysis}
        rightAnalysis={rightAnalysis}
        leftDifferences={leftDifferences}
        rightDifferences={rightDifferences}
        showHighlights={showHighlights}
        onToggleHighlights={() => setShowHighlights(!showHighlights)}
        onGenerateHighlights={handleGenerateHighlights}
        comparisonComplete={comparisonComplete}
      />

      <div className="grid grid-cols-1 md:grid-cols-10 border h-full relative">
        <div
          className={`${
            isSidebarVisible ? "md:col-span-7" : "col-span-12"
          } bg-gray-100 transition-all duration-500 ease-in-out transform`}
        >
          <div
            className="fixed right-0 p-2 z-50 w-8 h-8 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-red-50 hover:text-red-600 flex items-center justify-center border border-gray-300 transition-all duration-200"
            onClick={() => {
              // Check screen size and toggle appropriate sidebar
              if (window.innerWidth >= 768) {
                // Desktop: toggle desktop sidebar
                setIsSidebarVisible(!isSidebarVisible);
              } else {
                // Mobile: toggle mobile sidebar
                setShowMobileSidebar(true);
              }
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-300 ${
                isSidebarVisible ? "rotate-180" : ""
              }`}
            >
              <rect
                x="0.75"
                y="0.75"
                width="18.5"
                height="18.5"
                rx="3.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="13.75"
                y1="1"
                x2="13.75"
                y2="20"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          {activeOption === "semantic" ? (
            <div className="h-[calc(100vh-72px)]  md:h-[calc(100vh-72px)] w-full bg-gray-100 p-2 sm:p-4 overflow-hidden">
              <PDFComaprePreview
                // Container props
                containerRef={containerRef}
                leftWidth={leftWidth}
                // Left panel props
                leftFiles={leftFiles}
                leftZoom={leftZoom}
                showLeftControls={showLeftControls}
                setShowLeftControls={setShowLeftControls}
                handleLeftZoomIn={handleLeftZoomIn}
                handleLeftZoomOut={handleLeftZoomOut}
                handleLeftZoomChange={handleLeftZoomChange}
                // Right panel props
                rightFiles={rightFiles}
                rightZoom={rightZoom}
                showRightControls={showRightControls}
                setShowRightControls={setShowRightControls}
                handleRightZoomIn={handleRightZoomIn}
                handleRightZoomOut={handleRightZoomOut}
                handleRightZoomChange={handleRightZoomChange}
                // Common props
                loadingPdfs={loadingPdfs}
                pdfHealthCheck={pdfHealthCheck}
                passwordProtectedFiles={passwordProtectedFiles}
                removeFile={removeFile}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                onDocumentLoadError={onDocumentLoadError}
                // Resizer props
                isResizing={isResizing}
                handleMouseDown={handleMouseDown}
                // File uploader props
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                setActiveSide={setActiveSide}
                handleFiles={handleFiles}
                allowedTypes={[".pdf"]}
                // Component props
                PDFPreview={PDFPreview}
                ZoomControls={ZoomControls}
                SafeFileUploader={SafeFileUploader}
                semanticMode={true}
                overlayMode={false}
                // New highlighting props
                comparisonComplete={comparisonComplete}
                showHighlights={showHighlights}
                leftDifferences={leftDifferences}
                rightDifferences={rightDifferences}
                onToggleHighlights={() => setShowHighlights(!showHighlights)}
                // Enhanced highlighting props
                leftAnalysis={leftAnalysis}
                rightAnalysis={rightAnalysis}
                comparisonResult={comparisonResult}
              />
            </div>
          ) : (
            // Updated rendering section for your main component
            <div className="h-[calc(100vh-82px-3.3rem)] md:h-[calc(100%-3.2rem)] w-[100%] bg-gray-100 pt-4 flex items-center justify-center overflow-hidden">
              <div className="h-full w-[80%] md:w-[60%] flex items-center justify-center">
                <div
                  ref={overlayContainerRef}
                  className="h-full w-[100%] relative overflow-hidden"
                  style={{ position: "relative" }}
                >
                  {/* Bottom Layer */}
                  {renderPDFLayer(
                    overlayDown,
                    selectedPageDown,
                    false,
                    bottomLayerRef
                  )}

                  {/* Top Layer */}
                  {renderPDFLayer(overlayUp, selectedPageUp, true, topLayerRef)}

                  {/* Unified Overlay Canvas for Highlights */}
                  {showDifferences &&
                    (overlayDown.length > 0 || overlayUp.length > 0) && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          zIndex: 10,
                          width: "100%",
                          height: "100%",
                          overflow: "hidden",
                        }}
                      >
                        <canvas
                          id="unified-overlay-canvas"
                          className="absolute top-0 left-0 pointer-events-none"
                          style={{
                            zIndex: 10,
                            width: rightZoom > 100 ? "max-content" : "100%",
                            height: rightZoom > 100 ? "max-content" : "100%",
                            minWidth: "100%",
                            minHeight: "100%",
                          }}
                        />
                      </div>
                    )}

                  {/* No files message */}
                  {overlayDown.length === 0 && overlayUp.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="w-16 h-16 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm">
                          Upload PDF files to start overlay comparison
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}

        <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
          {isSidebarVisible && (
            <SidebarContent
              activeOption={activeOption}
              handleOptionChange={handleOptionChange}
              leftFiles={leftFiles}
              rightFiles={rightFiles}
              leftAnalysis={leftAnalysis}
              rightAnalysis={rightAnalysis}
              isAnalyzing={isAnalyzing}
              comparisonResult={comparisonResult}
              setShowComparisonResults={setShowComparisonResults}
              overlayDown={overlayDown}
              overlayUp={overlayUp}
              selectedPageDown={selectedPageDown}
              selectedPageUp={selectedPageUp}
              setSelectedPageDown={setSelectedPageDown}
              setSelectedPageUp={setSelectedPageUp}
              removeFile={removeFile}
              handleFiles={handleFiles}
              handleProtectedFiles={handleProtectedFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              showControls={showControls}
              overlayOpacity={overlayOpacity}
              setOverlayOpacity={setOverlayOpacity}
              overlayBlendMode={overlayBlendMode}
              setOverlayBlendMode={setOverlayBlendMode}
              showDifferences={showDifferences}
              setShowDifferences={setShowDifferences}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              performOverlayAnalysis={performOverlayAnalysis}
              hasUnhealthyFiles={hasUnhealthyFiles}
              passwordProtectedFiles={passwordProtectedFiles}
              // Pass components and icons
              DynamicProgressLoader={DynamicProgressLoader}
              OCRNotification={OCRNotification}
              SafeFileUploader={SafeFileUploader}
              Check={Check}
              Type={Type}
              Search={Search}
              ArrowRight={ArrowRight}
              Image={Image}
              Palette={Palette}
              RotateCcw={RotateCcw}
              Zap={Zap}
              AlertCircle={AlertCircle}
              Download={Download}
              FileText={FileText}
              toast={toast}
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
            />
          )}
        </div>
      </div>
      {showMobileSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <SidebarContent
              activeOption={activeOption}
              handleOptionChange={handleOptionChange}
              leftFiles={leftFiles}
              rightFiles={rightFiles}
              leftAnalysis={leftAnalysis}
              rightAnalysis={rightAnalysis}
              isAnalyzing={isAnalyzing}
              comparisonResult={comparisonResult}
              setShowComparisonResults={setShowComparisonResults}
              overlayDown={overlayDown}
              overlayUp={overlayUp}
              selectedPageDown={selectedPageDown}
              selectedPageUp={selectedPageUp}
              setSelectedPageDown={setSelectedPageDown}
              setSelectedPageUp={setSelectedPageUp}
              removeFile={removeFile}
              handleFiles={handleFiles}
              handleProtectedFiles={handleProtectedFiles}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              showControls={showControls}
              overlayOpacity={overlayOpacity}
              setOverlayOpacity={setOverlayOpacity}
              overlayBlendMode={overlayBlendMode}
              setOverlayBlendMode={setOverlayBlendMode}
              showDifferences={showDifferences}
              setShowDifferences={setShowDifferences}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
              performOverlayAnalysis={performOverlayAnalysis}
              hasUnhealthyFiles={hasUnhealthyFiles}
              passwordProtectedFiles={passwordProtectedFiles}
              // Pass components and icons
              DynamicProgressLoader={DynamicProgressLoader}
              OCRNotification={OCRNotification}
              SafeFileUploader={SafeFileUploader}
              Check={Check}
              Type={Type}
              Search={Search}
              ArrowRight={ArrowRight}
              Image={Image}
              Palette={Palette}
              RotateCcw={RotateCcw}
              Zap={Zap}
              AlertCircle={AlertCircle}
              Download={Download}
              FileText={FileText}
              toast={toast}
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
            />
          </div>
        </div>
      )}
      <PasswordModelPreveiw
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setProtectedFiles([]); // Clear protected files on modal close
        }}
        passwordProtectedFiles={protectedFiles}
        onPasswordVerified={handleUnlockedFiles} // ✅ ye important
      />

      <style jsx>{`
        .pdf-preview-page canvas {
          border-radius: 8px;
          max-width: 100% !important;
          height: auto !important;
        }

        .pdf-preview-page > div {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        /* PDF Overlay Styles */
        .overlay-page {
          transition: opacity 0.3s ease, mix-blend-mode 0.3s ease;
        }

        /* Custom slider styles for overlay controls */
        .slider-thumb-red::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #dc2626;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
          transition: all 0.2s ease;
        }

        .slider-thumb-red::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .slider-thumb-red::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #dc2626;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
          transition: all 0.2s ease;
        }

        .slider-thumb-red::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        /* Blend mode specific styles - Updated for better compatibility */
        .blend-normal {
          mix-blend-mode: normal !important;
        }

        .blend-multiply {
          mix-blend-mode: multiply !important;
          isolation: isolate;
        }

        .blend-overlay {
          mix-blend-mode: overlay !important;
          isolation: isolate;
        }

        .blend-difference {
          mix-blend-mode: difference !important;
          isolation: isolate;
        }

        .blend-screen {
          mix-blend-mode: screen !important;
          isolation: isolate;
        }

        .blend-hard-light {
          mix-blend-mode: hard-light !important;
          isolation: isolate;
        }

        /* Additional blend modes for better effects */
        .blend-soft-light {
          mix-blend-mode: soft-light !important;
          isolation: isolate;
        }

        .blend-color-dodge {
          mix-blend-mode: color-dodge !important;
          isolation: isolate;
        }

        .blend-color-burn {
          mix-blend-mode: color-burn !important;
          isolation: isolate;
        }

        .blend-darken {
          mix-blend-mode: darken !important;
          isolation: isolate;
        }

        .blend-lighten {
          mix-blend-mode: lighten !important;
          isolation: isolate;
        }

        /* Overlay container positioning */
        .overlay-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .overlay-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Difference highlight animations */
        .difference-highlight {
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        /* Layer indicators */
        .layer-indicator {
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Custom scrollbar for overlay areas */
        .overlay-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .overlay-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .overlay-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .overlay-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Mobile responsive fixes */
        @media (max-width: 768px) {
          .overlay-controls {
            padding: 1rem;
          }

          .layer-indicator {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }

          /* Ensure no main container overflow on mobile */
        }

        /* Print styles for overlay exports */
        @media print {
          .overlay-container {
            break-inside: avoid;
          }

          .layer-indicator,
          .difference-highlight {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
