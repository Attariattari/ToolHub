"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

export default function MarkPagesModal({ isOpen, onClose, onSubmit, numPages, currentPage, fileUrl, password }) {
  const [selectionType, setSelectionType] = useState("current")
  const [customPages, setCustomPages] = useState("")

  if (!isOpen) return null

  const parseCustomPages = (input) => {
    if (!input.trim()) return []

    const pageRanges = input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
    const pages = []

    pageRanges.forEach((range) => {
      if (range.includes("-")) {
        const [start, end] = range.split("-").map((n) => {
          const num = Number.parseInt(n.trim())
          return isNaN(num) ? null : num
        })

        if (start !== null && end !== null && start <= end && start >= 1) {
          const validEnd = Math.min(end, numPages)
          const validStart = Math.max(start, 1)
          for (let i = validStart; i <= validEnd; i++) {
            if (!pages.includes(i)) pages.push(i)
          }
        }
      } else {
        const pageNum = Number.parseInt(range)
        if (!isNaN(pageNum) && pageNum >= 1) {
          const validPageNum = Math.min(pageNum, numPages)
          if (!pages.includes(validPageNum)) {
            pages.push(validPageNum)
          }
        }
      }
    })

    return pages.sort((a, b) => a - b)
  }

  const handleCustomPagesBlur = () => {
    const parsed = parseCustomPages(customPages)
    if (parsed.length > 0) {
      // Convert back to compact format
      const ranges = []
      let start = parsed[0]
      let end = parsed[0]

      for (let i = 1; i < parsed.length; i++) {
        if (parsed[i] === end + 1) {
          end = parsed[i]
        } else {
          if (start === end) {
            ranges.push(start.toString())
          } else {
            ranges.push(`${start}-${end}`)
          }
          start = parsed[i]
          end = parsed[i]
        }
      }

      if (start === end) {
        ranges.push(start.toString())
      } else {
        ranges.push(`${start}-${end}`)
      }

      setCustomPages(ranges.join(","))
    }
  }

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
        pages = parseCustomPages(customPages)
        break
    }

    if (pages.length === 0) {
      pages = [currentPage]
    }

    onSubmit({
      type: selectionType,
      pages: pages,
      customPages: pages,
    })
  }

  const documentOptions = {
    cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    password: password || undefined,
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Mark Pages Redaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left side - PDF Preview */}
          <div className="w-2/3 bg-gray-100 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col items-center space-y-4">
              {fileUrl && (
                <Document file={fileUrl} options={documentOptions} className="contents">
                  {Array.from(new Array(numPages), (el, index) => {
                    const pageNum = index + 1

                    return (
                      <div
                        key={`page_${pageNum}`}
                        className="relative bg-white mx-auto shadow-sm"
                        style={{
                          width: "auto",
                          height: "auto",
                          maxWidth: "100%",
                        }}
                      >
                        <Page
                          pageNumber={pageNum}
                          width={Math.min(500, window.innerWidth * 0.4)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          className="pointer-events-none"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {pageNum}
                        </div>
                      </div>
                    )
                  })}
                </Document>
              )}
            </div>
          </div>

          {/* Right side - Selection Options */}
          <div className="w-1/3 p-6 border-l bg-gray-50">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Page Selection</h4>

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="pageSelection"
                    value="current"
                    checked={selectionType === "current"}
                    onChange={(e) => setSelectionType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Current Page ({currentPage})</span>
                </label>

                <label className="flex items-center space-x-3">
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
                  <div className="ml-7 space-y-2">
                    <input
                      type="text"
                      value={customPages}
                      onChange={(e) => {
                        // Only allow numbers, commas, hyphens, and spaces
                        const value = e.target.value.replace(/[^0-9,\-\s]/g, "")
                        setCustomPages(value)
                      }}
                      onBlur={handleCustomPagesBlur}
                      onKeyPress={(e) => {
                        // Prevent non-allowed characters
                        if (!/[0-9,\-\s]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete") {
                          e.preventDefault()
                        }
                      }}
                      placeholder="1,3,5-10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    />
                    <p className="text-xs text-gray-500">
                      Examples: 1,3,5 or 1-5,8,10-12 (Only numbers, commas, and hyphens allowed)
                    </p>
                  </div>
                )}

                <label className="flex items-center space-x-3">
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

                <label className="flex items-center space-x-3">
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

                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="pageSelection"
                    value="all"
                    checked={selectionType === "all"}
                    onChange={(e) => setSelectionType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">All Pages</span>
                </label>
              </div>

              {/* Preview of selected pages */}
              {selectionType === "custom" && customPages && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">Selected pages:</p>
                  <p className="text-sm text-blue-700">{parseCustomPages(customPages).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
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
  )
}


// "use client"

// import { useState } from "react"
// import { X } from "lucide-react"
// import { Document, Page, pdfjs } from "react-pdf"

// export default function MarkPagesModal({ isOpen, onClose, onSubmit, numPages, currentPage, fileUrl, password }) {
//   const [selectionType, setSelectionType] = useState("current")
//   const [customPages, setCustomPages] = useState("")

//   if (!isOpen) return null

//   // Parse custom pages input without validation errors
//   const parseCustomPages = (input) => {
//     if (!input.trim()) return []

//     const pageRanges = input
//       .split(",")
//       .map((s) => s.trim())
//       .filter((s) => s)
//     const pages = []

//     pageRanges.forEach((range) => {
//       if (range.includes("-")) {
//         const [start, end] = range.split("-").map((n) => {
//           const num = Number.parseInt(n.trim())
//           return isNaN(num) ? null : num
//         })

//         if (start !== null && end !== null && start <= end && start >= 1) {
//           const validEnd = Math.min(end, numPages)
//           for (let i = start; i <= validEnd; i++) {
//             if (!pages.includes(i)) pages.push(i)
//           }
//         }
//       } else {
//         const pageNum = Number.parseInt(range)
//         if (!isNaN(pageNum) && pageNum >= 1) {
//           const validPageNum = Math.min(pageNum, numPages)
//           if (!pages.includes(validPageNum)) {
//             pages.push(validPageNum)
//           }
//         }
//       }
//     })

//     return pages.sort((a, b) => a - b)
//   }

//   const handleSubmit = () => {
//     let pages = []

//     switch (selectionType) {
//       case "current":
//         pages = [currentPage]
//         break
//       case "all":
//         pages = Array.from({ length: numPages }, (_, i) => i + 1)
//         break
//       case "odd":
//         pages = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 1)
//         break
//       case "even":
//         pages = Array.from({ length: numPages }, (_, i) => i + 1).filter((p) => p % 2 === 0)
//         break
//       case "custom":
//         pages = parseCustomPages(customPages)
//         break
//     }

//     if (pages.length === 0) {
//       pages = [currentPage] // Default to current page if nothing selected
//     }

//     onSubmit({
//       type: selectionType,
//       pages: pages,
//       customPages: pages,
//     })
//   }

//   const documentOptions = {
//     cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
//     cMapPacked: true,
//     standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
//     password: password || undefined,
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg w-full max-w-6xl h-[85vh] flex flex-col">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h3 className="text-lg font-semibold">Mark Pages Redaction</h3>
//           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="flex flex-1 overflow-hidden">
//           {/* Left side - PDF Preview (Reduced width) */}
//           <div className="w-2/3 bg-gray-100 p-4 overflow-y-auto custom-scrollbar">
//             <div className="flex flex-col items-center space-y-4">
//               {fileUrl && (
//                 <Document file={fileUrl} options={documentOptions} className="contents">
//                   {Array.from(new Array(numPages), (el, index) => {
//                     const pageNum = index + 1

//                     return (
//                       <div
//                         key={`page_${pageNum}`}
//                         className="relative bg-white mx-auto shadow-sm"
//                         style={{
//                           width: "auto",
//                           height: "auto",
//                           maxWidth: "100%",
//                         }}
//                       >
//                         <Page
//                           pageNumber={pageNum}
//                           width={Math.min(500, window.innerWidth * 0.4)} // Responsive width
//                           renderTextLayer={false}
//                           renderAnnotationLayer={false}
//                           className="pointer-events-none"
//                         />
//                         {/* Page number indicator */}
//                         <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
//                           {pageNum}
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </Document>
//               )}
//             </div>
//           </div>

//           {/* Right side - Selection Options (Increased width) */}
//           <div className="w-1/3 p-6 border-l bg-gray-50">
//             <div>
//               <h4 className="text-sm font-medium text-gray-700 mb-4">Page Selection</h4>

//               <div className="space-y-4">
//                 <label className="flex items-center space-x-3">
//                   <input
//                     type="radio"
//                     name="pageSelection"
//                     value="current"
//                     checked={selectionType === "current"}
//                     onChange={(e) => setSelectionType(e.target.value)}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                   />
//                   <span className="text-sm text-gray-700">Current Page ({currentPage})</span>
//                 </label>

//                 <label className="flex items-center space-x-3">
//                   <input
//                     type="radio"
//                     name="pageSelection"
//                     value="custom"
//                     checked={selectionType === "custom"}
//                     onChange={(e) => setSelectionType(e.target.value)}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                   />
//                   <span className="text-sm text-gray-700">Specify pages</span>
//                 </label>

//                 {selectionType === "custom" && (
//                   <div className="ml-7 space-y-2">
//                     <input
//                       type="text"
//                       value={customPages}
//                       onChange={(e) => {
//                         // Only allow numbers, commas, hyphens, and spaces
//                         const value = e.target.value.replace(/[^0-9,\-\s]/g, "")
//                         setCustomPages(value)
//                       }}
//                       onKeyPress={(e) => {
//                         // Prevent non-allowed characters
//                         if (!/[0-9,\-\s]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete") {
//                           e.preventDefault()
//                         }
//                       }}
//                       placeholder="1,3,5-10"
//                       className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                     <p className="text-xs text-gray-500">
//                       Examples: 1,3,5 or 1-5,8,10-12 (Only numbers, commas, and hyphens allowed)
//                     </p>
//                   </div>
//                 )}

//                 <label className="flex items-center space-x-3">
//                   <input
//                     type="radio"
//                     name="pageSelection"
//                     value="odd"
//                     checked={selectionType === "odd"}
//                     onChange={(e) => setSelectionType(e.target.value)}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                   />
//                   <span className="text-sm text-gray-700">Odd Pages Only</span>
//                 </label>

//                 <label className="flex items-center space-x-3">
//                   <input
//                     type="radio"
//                     name="pageSelection"
//                     value="even"
//                     checked={selectionType === "even"}
//                     onChange={(e) => setSelectionType(e.target.value)}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                   />
//                   <span className="text-sm text-gray-700">Even Pages Only</span>
//                 </label>

//                 <label className="flex items-center space-x-3">
//                   <input
//                     type="radio"
//                     name="pageSelection"
//                     value="all"
//                     checked={selectionType === "all"}
//                     onChange={(e) => setSelectionType(e.target.value)}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
//                   />
//                   <span className="text-sm text-gray-700">All Pages</span>
//                 </label>
//               </div>

//               {/* Preview of selected pages */}
//               {selectionType === "custom" && customPages && (
//                 <div className="mt-4 p-3 bg-blue-50 rounded-lg">
//                   <p className="text-sm text-blue-800 font-medium mb-1">Selected pages:</p>
//                   <p className="text-sm text-blue-700">{parseCustomPages(customPages).join(", ")}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
//           >
//             Add Mark
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
