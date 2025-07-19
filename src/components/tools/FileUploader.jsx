"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, HardDrive, Cloud, Plus, SortAsc, Monitor } from "lucide-react"

export default function FileUploader({
  isMultiple = true,
  onFilesSelect,
  isDragOver,
  setIsDragOver,
  allowedTypes = [".pdf"],
  showFiles = false,
  onSort,
  uploadButtonText = "Select PDF files",
  selectedCount = 1,
  pageTitle ="Merge PDF files",
  pageSubTitle ="Combine PDFs in the order you want with the easiest PDF merger available."
}) {
  const [showTooltip, setShowTooltip] = useState(null)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [sortOrder, setSortOrder] = useState("asc") // 'asc' for A-Z, 'desc' for Z-A

  // Full screen drag handlers
  const handleFullScreenDragOver = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(true)
    },
    [setIsDragOver],
  )

  const handleFullScreenDragLeave = useCallback(
    (e) => {
      e.preventDefault()
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragOver(false)
      }
    },
    [setIsDragOver],
  )

  const handleFullScreenDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        return allowedTypes.some((type) => file.name.toLowerCase().endsWith(type.replace(".", "")))
      })
      onFilesSelect(droppedFiles)
    },
    [onFilesSelect, setIsDragOver, allowedTypes],
  )

  useEffect(() => {
    document.addEventListener("dragover", handleFullScreenDragOver)
    document.addEventListener("dragleave", handleFullScreenDragLeave)
    document.addEventListener("drop", handleFullScreenDrop)

    return () => {
      document.removeEventListener("dragover", handleFullScreenDragOver)
      document.removeEventListener("dragleave", handleFullScreenDragLeave)
      document.removeEventListener("drop", handleFullScreenDrop)
    }
  }, [handleFullScreenDragOver, handleFullScreenDragLeave, handleFullScreenDrop])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    onFilesSelect(selectedFiles)
  }

  const handleGoogleDriveSelect = () => {
    console.log("Google Drive selected")
    setShowUploadMenu(false)
  }

  const handleDropboxSelect = () => {
    console.log("Dropbox selected")
    setShowUploadMenu(false)
  }

  const handleComputerSelect = () => {
    document.getElementById("file-upload").click()
    setShowUploadMenu(false)
  }

  const handlePlusClick = () => {
    document.getElementById("file-upload").click()
  }

  const handleAdvancedSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc"
    setSortOrder(newOrder)
    if (onSort) {
      onSort(newOrder)
    }
  }

  // Upload menu for when files are already selected
  const UploadMenu = () => {
    if (!isMultiple) return null

    return (
      <div className="flex items-center gap-2">
        {onSort && (
          <button
            onClick={handleAdvancedSort}
            className="w-12 h-12 bg-white border-2 border-gray-200 hover:border-red-500 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md relative group"
            // title={`Sort ${sortOrder === "asc" ? "Z to A" : "A to Z"}`}
          >
            <SortAsc
              className={`w-5 h-5 text-gray-600 group-hover:text-red-500 transition-transform duration-200 ${sortOrder === "desc" ? "rotate-180" : ""}`}
            />
            <div className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Sort {sortOrder === "asc" ? "Z to A" : "A to Z"}
            </div>
          </button>
        )}

        <div className="relative z-40">
          <button
            onMouseEnter={() => setShowUploadMenu(true)}
            onMouseLeave={() => setShowUploadMenu(false)}
            onClick={handlePlusClick}
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg relative"
          >
            <Plus className="w-6 h-6 text-white" />
            {showFiles && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                {selectedCount}
              </div>
            )}
          </button>

          <div
            className={`absolute top-[-20px] left-0 mt-16 z-50 overflow-hidden transition-all duration-300 ease-in-out ${showUploadMenu ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
              }`}
            onMouseEnter={() => setShowUploadMenu(true)}
            onMouseLeave={() => setShowUploadMenu(false)}
          >
            <div className="flex flex-col gap-2 pt-3">
              <button
                onClick={handleComputerSelect}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg relative group transition-colors duration-200"
              >
                <Monitor className="w-5 h-5 text-white" />
                <div className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Computer
                </div>
              </button>

              <button
                onClick={handleGoogleDriveSelect}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg relative group transition-colors duration-200"
              >
                <HardDrive className="w-5 h-5 text-white" />
                <div className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Google Drive
                </div>
              </button>

              <button
                onClick={handleDropboxSelect}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg relative group transition-colors duration-200"
              >
                <Cloud className="w-5 h-5 text-white" />
                <div className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Dropbox
                </div>
              </button>
            </div>
          </div>
        </div>

        <input
          id="file-upload"
          type="file"
          multiple={isMultiple}
          accept={allowedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Initial upload screen
  if (!showFiles) {
    return (
      <div className="md:h-[calc(100vh-82px)] bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{pageTitle}</h1>
            <p className="text-xl text-gray-600">
              {pageSubTitle}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${isDragOver
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"
                }`}
            >
              {/* Cloud Service Buttons - Top Right Corner */}
              <div className="absolute top-4 right-4 flex gap-2">
                {/* Google Drive Button */}
                <div className="relative">
                  <button
                    onClick={handleGoogleDriveSelect}
                    onMouseEnter={() => setShowTooltip("drive")}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="w-10 h-10 bg-red-600 border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <HardDrive className="w-5 h-5 text-white" />
                  </button>
                  {showTooltip === "drive" && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                      Select from Google Drive
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>

                {/* Dropbox Button */}
                <div className="relative">
                  <button
                    onClick={handleDropboxSelect}
                    onMouseEnter={() => setShowTooltip("dropbox")}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="w-10 h-10 bg-red-600 border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Cloud className="w-5 h-5 text-white" />
                  </button>
                  {showTooltip === "dropbox" && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                      Select from Dropbox
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-red-600" />
              </div>

              <label htmlFor="file-upload-main" className="cursor-pointer">
                <div className="inline-block bg-red-600 hover:bg-red-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4">
                  {uploadButtonText}
                </div>
                <input
                  id="file-upload-main"
                  type="file"
                  multiple={isMultiple}
                  accept={allowedTypes.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <p className="text-gray-500 text-lg">or drop file anywhere on screen</p>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
          © PDF ToolsHub 2025 • Your PDF Editor
        </footer>
      </div>
    )
  }

  return <UploadMenu />
}



// "use client"

// import { useState, useCallback, useEffect } from "react"
// import { Upload, HardDrive, Cloud, Plus, SortAsc } from "lucide-react"

// export default function FileUploader({
//   isMultiple = true,
//   onFilesSelect,
//   isDragOver,
//   setIsDragOver,
//   allowedTypes = [".pdf"],
//   showFiles = false,
//   onSort,
// }) {
//   const [showTooltip, setShowTooltip] = useState(null)
//   const [showUploadMenu, setShowUploadMenu] = useState(false)

//   // Full screen drag handlers
//   const handleFullScreenDragOver = useCallback(
//     (e) => {
//       e.preventDefault()
//       setIsDragOver(true)
//     },
//     [setIsDragOver],
//   )

//   const handleFullScreenDragLeave = useCallback(
//     (e) => {
//       e.preventDefault()
//       if (e.clientX === 0 && e.clientY === 0) {
//         setIsDragOver(false)
//       }
//     },
//     [setIsDragOver],
//   )

//   const handleFullScreenDrop = useCallback(
//     (e) => {
//       e.preventDefault()
//       setIsDragOver(false)
//       const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
//         return allowedTypes.some((type) => file.name.toLowerCase().endsWith(type.replace(".", "")))
//       })
//       onFilesSelect(droppedFiles)
//     },
//     [onFilesSelect, setIsDragOver, allowedTypes],
//   )

//   useEffect(() => {
//     document.addEventListener("dragover", handleFullScreenDragOver)
//     document.addEventListener("dragleave", handleFullScreenDragLeave)
//     document.addEventListener("drop", handleFullScreenDrop)

//     return () => {
//       document.removeEventListener("dragover", handleFullScreenDragOver)
//       document.removeEventListener("dragleave", handleFullScreenDragLeave)
//       document.removeEventListener("drop", handleFullScreenDrop)
//     }
//   }, [handleFullScreenDragOver, handleFullScreenDragLeave, handleFullScreenDrop])

//   const handleFileSelect = (e) => {
//     const selectedFiles = Array.from(e.target.files)
//     onFilesSelect(selectedFiles)
//   }

//   const handleGoogleDriveSelect = () => {
//     console.log("Google Drive selected")
//     setShowUploadMenu(false)
//   }

//   const handleDropboxSelect = () => {
//     console.log("Dropbox selected")
//     setShowUploadMenu(false)
//   }

//   const handleComputerSelect = () => {
//     document.getElementById("file-upload").click()
//     setShowUploadMenu(false)
//   }

//   // Upload menu for when files are already selected
//   const UploadMenu = () => {
//     if (!showFiles || !isMultiple) return null

//     return (
//       <div className="flex items-center gap-2 mb-4">
//         <div className="relative">
//           <button
//             onMouseEnter={() => setShowUploadMenu(true)}
//             onMouseLeave={() => setShowUploadMenu(false)}
//             onClick={handleComputerSelect}
//             className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors relative"
//           >
//             <Plus className="w-5 h-5" />
//           </button>

//           {showUploadMenu && (
//             <div
//               className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50"
//               onMouseEnter={() => setShowUploadMenu(true)}
//               onMouseLeave={() => setShowUploadMenu(false)}
//             >
//               <button
//                 onClick={handleComputerSelect}
//                 onMouseEnter={() => setShowTooltip("computer")}
//                 onMouseLeave={() => setShowTooltip(null)}
//                 className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors relative"
//               >
//                 <Upload className="w-4 h-4 text-gray-600" />
//                 {showTooltip === "computer" && (
//                   <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
//                     Upload from Computer
//                   </div>
//                 )}
//               </button>

//               <button
//                 onClick={handleGoogleDriveSelect}
//                 onMouseEnter={() => setShowTooltip("drive")}
//                 onMouseLeave={() => setShowTooltip(null)}
//                 className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors relative"
//               >
//                 <HardDrive className="w-4 h-4 text-blue-600" />
//                 {showTooltip === "drive" && (
//                   <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
//                     Google Drive
//                   </div>
//                 )}
//               </button>

//               <button
//                 onClick={handleDropboxSelect}
//                 onMouseEnter={() => setShowTooltip("dropbox")}
//                 onMouseLeave={() => setShowTooltip(null)}
//                 className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors relative"
//               >
//                 <Cloud className="w-4 h-4 text-blue-700" />
//                 {showTooltip === "dropbox" && (
//                   <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
//                     Dropbox
//                   </div>
//                 )}
//               </button>
//             </div>
//           )}
//         </div>

//         {onSort && (
//           <button
//             onClick={onSort}
//             onMouseEnter={() => setShowTooltip("sort")}
//             onMouseLeave={() => setShowTooltip(null)}
//             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors relative"
//           >
//             <SortAsc className="w-5 h-5" />
//             {showTooltip === "sort" && (
//               <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
//                 Sort by name
//               </div>
//             )}
//           </button>
//         )}

//         <input
//           id="file-upload"
//           type="file"
//           multiple={isMultiple}
//           accept={allowedTypes.join(",")}
//           onChange={handleFileSelect}
//           className="hidden"
//         />
//       </div>
//     )
//   }

//   // Initial upload screen
//   if (!showFiles) {
//     return (
//       <div className="md:h-[calc(100vh-82px)] bg-gray-50">
//         <div className="container mx-auto px-4 py-8">
//           <div className="text-center mb-8">
//             <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF files</h1>
//             <p className="text-xl text-gray-600">
//               Combine PDFs in the order you want with the easiest PDF merger available.
//             </p>
//           </div>

//           <div className="max-w-2xl mx-auto">
//             <div
//               className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${isDragOver
//                   ? "border-red-500 bg-red-50"
//                   : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"
//                 }`}
//             >
//               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <Upload className="w-10 h-10 text-red-600" />
//               </div>

//               <label htmlFor="file-upload" className="cursor-pointer">
//                 <div className="inline-block bg-red-600 hover:bg-red-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4">
//                   Select PDF files
//                 </div>
//                 <input
//                   id="file-upload"
//                   type="file"
//                   multiple={isMultiple}
//                   accept={allowedTypes.join(",")}
//                   onChange={handleFileSelect}
//                   className="hidden"
//                 />
//               </label>

//               <p className="text-gray-500 text-lg">or drop PDFs anywhere on screen</p>
//             </div>
//           </div>
//         </div>

//         <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
//           © PDF ToolsHub 2025 • Your PDF Editor
//         </footer>
//       </div>
//     )
//   }

//   return <UploadMenu />
// }


// // "use client"

// // import { useState, useCallback, useEffect } from "react"
// // import { Upload, HardDrive, Cloud } from "lucide-react"

// // export default function FileUploader({ isMultiple = true, onFilesSelect, isDragOver, setIsDragOver }) {
// //   const [showTooltip, setShowTooltip] = useState(null)

// //   // Full screen drag handlers
// //   const handleFullScreenDragOver = useCallback((e) => {
// //     e.preventDefault()
// //     setIsDragOver(true)
// //   }, [setIsDragOver])

// //   const handleFullScreenDragLeave = useCallback((e) => {
// //     e.preventDefault()
// //     // Only set to false if leaving the entire document
// //     if (e.clientX === 0 && e.clientY === 0) {
// //       setIsDragOver(false)
// //     }
// //   }, [setIsDragOver])

// //   const handleFullScreenDrop = useCallback((e) => {
// //     e.preventDefault()
// //     setIsDragOver(false)
// //     const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
// //     onFilesSelect(droppedFiles)
// //   }, [onFilesSelect, setIsDragOver])

// //   // Add full screen drag listeners
// //   useEffect(() => {
// //     document.addEventListener('dragover', handleFullScreenDragOver)
// //     document.addEventListener('dragleave', handleFullScreenDragLeave)
// //     document.addEventListener('drop', handleFullScreenDrop)

// //     return () => {
// //       document.removeEventListener('dragover', handleFullScreenDragOver)
// //       document.removeEventListener('dragleave', handleFullScreenDragLeave)
// //       document.removeEventListener('drop', handleFullScreenDrop)
// //     }
// //   }, [handleFullScreenDragOver, handleFullScreenDragLeave, handleFullScreenDrop])

// //   const handleFileSelect = (e) => {
// //     const selectedFiles = Array.from(e.target.files)
// //     onFilesSelect(selectedFiles)
// //   }

// //   const handleGoogleDriveSelect = () => {
// //     // Google Drive integration logic here
// //     console.log("Google Drive selected")
// //   }

// //   const handleDropboxSelect = () => {
// //     // Dropbox integration logic here
// //     console.log("Dropbox selected")
// //   }

// //   return (
// //     <div className="md:h-[calc(100vh-82px)] bg-gray-50">
// //       <div className="container mx-auto px-4 py-8">
// //         <div className="text-center mb-8">
// //           <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF files</h1>
// //           <p className="text-xl text-gray-600">
// //             Combine PDFs in the order you want with the easiest PDF merger available.
// //           </p>
// //         </div>

// //         <div className="max-w-2xl mx-auto">
// //           <div
// //             className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${isDragOver
// //               ? "border-red-500 bg-red-50"
// //               : "border-gray-300 bg-white hover:border-red-400 hover:bg-red-50"
// //               }`}
// //           >
// //             {/* Cloud Service Buttons - Top Right Corner */}
// //             <div className="absolute top-4 right-4 flex gap-2">
// //               {/* Google Drive Button */}
// //               <div className="relative">
// //                 <button
// //                   onClick={handleGoogleDriveSelect}
// //                   onMouseEnter={() => setShowTooltip('drive')}
// //                   onMouseLeave={() => setShowTooltip(null)}
// //                   className="w-10 h-10 bg-primary border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
// //                 >
// //                   <HardDrive className="w-5 h-5 text-white" />
// //                 </button>
// //                 {showTooltip === 'drive' && (
// //                   <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
// //                     Select from Google Drive
// //                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
// //                   </div>
// //                 )}
// //               </div>

// //               {/* Dropbox Button */}
// //               <div className="relative">
// //                 <button
// //                   onClick={handleDropboxSelect}
// //                   onMouseEnter={() => setShowTooltip('dropbox')}
// //                   onMouseLeave={() => setShowTooltip(null)}
// //                   className="w-10 h-10 bg-primary border-2 hover:bg-red-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
// //                 >
// //                   <Cloud className="w-5 h-5 text-white" />
// //                 </button>
// //                 {showTooltip === 'dropbox' && (
// //                   <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
// //                     Select from Dropbox
// //                     <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
// //               <Upload className="w-10 h-10 text-red-600" />
// //             </div>

// //             <label htmlFor="file-upload" className="cursor-pointer">
// //               <div className="inline-block bg-red-600 hover:bg-red-700 text-2xl text-white font-semibold py-4 px-24 rounded-xl transition-colors duration-200 mb-4">
// //                 Select PDF files
// //               </div>
// //               <input
// //                 id="file-upload"
// //                 type="file"
// //                 multiple={isMultiple}
// //                 accept=".pdf"
// //                 onChange={handleFileSelect}
// //                 className="hidden"
// //               />
// //             </label>

// //             <p className="text-gray-500 text-lg">or drop PDFs anywhere on screen</p>
// //           </div>
// //         </div>
// //       </div>

// //       <footer className="absolute bottom-4 left-4 text-sm text-gray-500">
// //         © PDF ToolsHub 2025 • Your PDF Editor
// //       </footer>
// //     </div>
// //   )
// // }