"use client"

import { useState } from "react"

const PlacementModal = ({ isOpen, onClose, onApply, fileName, numPages }) => {
  const [selectedPlacement, setSelectedPlacement] = useState("all-pages")
  const [customPages, setCustomPages] = useState("")
  const [customPagesError, setCustomPagesError] = useState("")

  if (!isOpen) return null

  const validateCustomPages = (input) => {
    if (!input.trim()) {
      return { isValid: false, error: "Please enter page numbers" }
    }

    // Only allow numbers, commas, and dashes
    if (!/^[0-9,\-\s]+$/.test(input)) {
      return { isValid: false, error: "Only numbers, commas, and dashes allowed" }
    }

    const pages = new Set()
    const parts = input.split(",")

    for (let part of parts) {
      part = part.trim()
      if (!part) continue

      if (part.includes("-")) {
        const [start, end] = part.split("-").map((p) => Number.parseInt(p.trim()))
        if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > end) {
          return { isValid: false, error: "Invalid range format" }
        }
        if (start > numPages || end > numPages) {
          return { isValid: false, error: `Page numbers cannot exceed ${numPages}` }
        }
        for (let i = start; i <= end; i++) {
          pages.add(i)
        }
      } else {
        const pageNum = Number.parseInt(part)
        if (isNaN(pageNum) || pageNum < 1) {
          return { isValid: false, error: "Invalid page number" }
        }
        if (pageNum > numPages) {
          return { isValid: false, error: `Page numbers cannot exceed ${numPages}` }
        }
        pages.add(pageNum)
      }
    }

    return { isValid: true, pages: Array.from(pages).sort((a, b) => a - b) }
  }

  const handleCustomPagesChange = (e) => {
    const value = e.target.value
    const filteredValue = value.replace(/[^0-9,\-\s]/g, "")
    setCustomPages(filteredValue)

    if (filteredValue.trim()) {
      const validation = validateCustomPages(filteredValue)
      if (!validation.isValid) {
        setCustomPagesError(validation.error)
      } else {
        setCustomPagesError("")
      }
    } else {
      setCustomPagesError("")
    }
  }

  const handleApply = () => {
    const placementData = { type: selectedPlacement }

    if (selectedPlacement === "custom-pages") {
      const validation = validateCustomPages(customPages)
      if (!validation.isValid) {
        setCustomPagesError(validation.error)
        return
      }
      placementData.pages = validation.pages
    }

    onApply(placementData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">Place on</h2>

        <div className="space-y-4 mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="placement"
              value="only-this-page"
              checked={selectedPlacement === "only-this-page"}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Only this page</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="placement"
              value="all-pages"
              checked={selectedPlacement === "all-pages"}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">All pages</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="placement"
              value="all-pages-but-last"
              checked={selectedPlacement === "all-pages-but-last"}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">All pages but last</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="placement"
              value="last-page"
              checked={selectedPlacement === "last-page"}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Last page</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="placement"
              value="custom-pages"
              checked={selectedPlacement === "custom-pages"}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Custom pages</span>
          </label>

          {selectedPlacement === "custom-pages" && (
            <div className="ml-7 mt-3">
              <input
                type="text"
                value={customPages}
                onChange={handleCustomPagesChange}
                placeholder="e.g., 1,3,5 or 1-4,6,9"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${customPagesError ? "border-blue-500" : "border-gray-300"
                  }`}
              />
              {customPagesError && <p className="text-blue-500 text-sm mt-1">{customPagesError}</p>}
              <p className="text-gray-500 text-xs mt-1">Format: 1,3,5 (pages 1,3,5) or 1-4,6,9 (pages 1,2,3,4,6,9)</p>
            </div>
          )}
        </div>

        {selectedPlacement === "all-pages" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">Create a linked copy on every page of the document.</p>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mb-6">
          <span className="inline-flex items-center gap-2">
            <span>📄</span>
            Current document: {fileName} ({numPages} pages)
          </span>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlacementModal
