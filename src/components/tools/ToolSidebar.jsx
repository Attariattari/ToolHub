"use client"

import { ArrowRight } from 'lucide-react'

export default function ToolSidebar({
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

  return (
    <div className="hidden md:flex md:col-span-3 overflow-y-auto custom-scrollbar border-l flex-col justify-between">
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
  )
}
