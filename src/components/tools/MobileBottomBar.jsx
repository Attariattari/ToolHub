"use client"

import { ArrowRight } from 'lucide-react'

export default function MobileBottomBar({
  buttonText,
  buttonDisabled = false,
  onButtonClick,
  onSettingsClick,
  buttonColor = "red"
}) {
  const buttonColorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-blue-600 hover:bg-blue-700"
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center gap-3 z-50">
      <button
        onClick={onButtonClick}
        disabled={buttonDisabled}
        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!buttonDisabled ? buttonColorClasses[buttonColor] : "bg-gray-300 cursor-not-allowed"
          }`}
      >
        {buttonText}
        <ArrowRight className="w-4 h-4" />
      </button>
      <button
        onClick={onSettingsClick}
        className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}
