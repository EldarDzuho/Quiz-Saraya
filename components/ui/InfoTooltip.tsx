'use client'

import { useState } from 'react'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="ml-2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs flex items-center justify-center cursor-help transition-colors"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        i
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop for mobile - tap anywhere to close */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
            <div className="relative">
              {text}
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </>
      )}
    </div>
  )
}
