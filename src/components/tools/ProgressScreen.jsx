"use client"

import { usePathname } from "next/navigation"
import { Download, FileText } from "lucide-react"
import { getProgressMessage } from "../shared/progressMessages"

export default function ProgressScreen({ uploadProgress }) {
  const pathname = usePathname()
  const { title, subtitle } = getProgressMessage(pathname)

  // Show iframe when upload is complete (100%)
  const isProcessing = uploadProgress === 100

  return (
    <div className="min-h-[calc(100vh-82px)] bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 p-8 max-w-lg w-full mx-4 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-3xl"></div>

        <div className="relative z-10">
          <div className="text-center">
            {/* Top Icon/Iframe Area */}
            <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
              {!isProcessing ? (
                <Download className="w-16 h-16 text-blue-600 animate-bounce" />
              ) : (
                <iframe
                  src="https://lottie.host/embed/a15e74f6-fa69-433c-b3d6-505c2790d06d/lhFbB3enE8.lottie"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              )}
            </div>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              {title}
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{subtitle}</p>

            <div className="space-y-4">
              <div className="w-full bg-gray-200/80 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">{uploadProgress}% Complete</p>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>

              {/* Processing Message - Only show when progress is 100% */}
              {isProcessing && (
                <div className="pt-4 border-t border-gray-100 mt-6">
                  <p className="text-emerald-600 font-medium text-lg mb-2">Processing Document...</p>
                  <div className="flex justify-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// "use client"

// import { usePathname } from "next/navigation"
// import { Download } from "lucide-react"
// import { getProgressMessage } from "../shared/progressMessages"

// export default function ProgressScreen({ uploadProgress }) {
//   const pathname = usePathname()
//   const { title, subtitle } = getProgressMessage(pathname)

//   return (
//     <div className="h-[calc(100vh-82px)] bg-gray-50 flex items-center justify-center">
//       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
//         <div className="text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Download className="w-8 h-8 text-blue-600 animate-bounce" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
//           <p className="text-gray-600 mb-6">{subtitle}</p>

//           <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
//             <div
//               className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
//               style={{ width: `${uploadProgress}%` }}
//             ></div>
//           </div>
//           <p className="text-sm text-gray-500">{uploadProgress}% Complete</p>
//         </div>
//       </div>
//       {/* <iframe src="https://lottie.host/embed/a15e74f6-fa69-433c-b3d6-505c2790d06d/lhFbB3enE8.lottie"></iframe> */}
//     </div>
//   )
// }


// // "use client"

// // import { Download } from "lucide-react"

// // export default function ProgressScreen({ uploadProgress, title = "Merging PDFs...", subtitle = "Please wait while we combine your files" }) {
// //   return (
// //     <div className="md:h-[calc(100vh-82px)] bg-gray-50 flex items-center justify-center">
// //       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
// //         <div className="text-center">
// //           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //             <Download className="w-8 h-8 text-blue-600 animate-bounce" />
// //           </div>
// //           <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
// //           <p className="text-gray-600 mb-6">{subtitle}</p>

// //           <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
// //             <div
// //               className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
// //               style={{ width: `${uploadProgress}%` }}
// //             ></div>
// //           </div>
// //           <p className="text-sm text-gray-500">{uploadProgress}% Complete</p>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }