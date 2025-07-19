"use client"

import { Download } from "lucide-react"

export default function ProgressScreen({ uploadProgress, title = "Merging PDFs...", subtitle = "Please wait while we combine your files" }) {
  return (
    <div className="md:h-[calc(100vh-82px)] bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-red-600 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{subtitle}</p>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{uploadProgress}% Complete</p>
        </div>
      </div>
    </div>
  )
}