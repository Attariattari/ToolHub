"use client"

import { X, ArrowRight } from 'lucide-react'

export default function MobileSidebar({
  isOpen,
  onClose,
  title,
  description,
  children,
  stats,
  buttonText,
  buttonDisabled = false,
  onButtonClick,
  buttonColor = "red",
  warnings = []
}) {
  const buttonColorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  }

  if (!isOpen) return null

  return (
    <div
      className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{title}</h3>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">{description}</p>
            </div>

            {/* Custom content */}
            {children}

            {/* Warnings */}
            {warnings.map((warning, index) => (
              <div key={index} className={`rounded-xl p-4 mb-6 ${warning.type === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className={`text-sm ${warning.type === 'yellow' ? 'text-yellow-800' : 'text-red-800'}`}>
                  {warning.message}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 border-t">
            {/* Statistics */}
            {stats && (
              <div className="space-y-4 mb-6">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{stat.label}:</span>
                    <span className={`font-semibold ${stat.color || 'text-gray-900'}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onButtonClick}
              disabled={buttonDisabled}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!buttonDisabled
                  ? `${buttonColorClasses[buttonColor]} hover:scale-105 shadow-lg`
                  : "bg-gray-300 cursor-not-allowed"
                }`}
            >
              {buttonText}
              <ArrowRight className="w-5 h-5" />
            </button>

            {buttonDisabled && (
              <p className="text-xs text-gray-500 text-center mt-2">Select files to continue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
