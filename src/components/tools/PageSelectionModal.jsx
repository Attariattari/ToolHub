"use client"

import { useState } from "react"
import { X } from "lucide-react"

export default function PageSelectionModal({ isOpen, onClose, onSubmit, numPages, currentPage }) {
  const [selectionType, setSelectionType] = useState("current")
  const [customPages, setCustomPages] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    let pages = []

    switch (selectionType) {
      case "current":
        pages = [currentPage]
        break
      case "all":
        pages = Array.from({ length: numPages }, (_, i) => i + 1)
        break
      case "odd":
        pages = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 1)
        break
      case "even":
        pages = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0)
        break
      case "custom":
        // Parse custom page input (e.g., "1,3-5,7")
        const pageRanges = customPages.split(",").map((s) => s.trim())
        pages = []

        pageRanges.forEach((range) => {
          if (range.includes("-")) {
            const [start, end] = range.split("-").map((n) => Number.parseInt(n.trim()))
            if (start && end && start <= end) {
              for (let i = start; i <= Math.min(end, numPages); i++) {
                if (!pages.includes(i)) pages.push(i)
              }
            }
          } else {
            const pageNum = Number.parseInt(range)
            if (pageNum && pageNum >= 1 && pageNum <= numPages && !pages.includes(pageNum)) {
              pages.push(pageNum)
            }
          }
        })
        break
    }

    onSubmit({
      type: selectionType,
      pages: pages,
      customPages: pages,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Mark Pages Redaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Page Selection</h4>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="pageSelection"
                  value="current"
                  checked={selectionType === "current"}
                  onChange={(e) => setSelectionType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Current Page</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="pageSelection"
                  value="custom"
                  checked={selectionType === "custom"}
                  onChange={(e) => setSelectionType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Specify pages</span>
              </label>

              {selectionType === "custom" && (
                <input
                  type="text"
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  placeholder="1, 4-10"
                  className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="pageSelection"
                  value="odd"
                  checked={selectionType === "odd"}
                  onChange={(e) => setSelectionType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Odd Pages Only</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="pageSelection"
                  value="even"
                  checked={selectionType === "even"}
                  onChange={(e) => setSelectionType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Even Pages Only</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Mark
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
