'use client'

import { useState, useEffect } from 'react'

interface TaskCompleteProps {
  decisionSummary: string
  onContinue: (usedTimer: boolean) => void
  isLastTask?: boolean
}

export default function TaskComplete({ decisionSummary, onContinue, isLastTask = false }: TaskCompleteProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onContinue(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onContinue])

  const handleContinueClick = () => {
    onContinue(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Task Complete!</h2>

        {/* Summary */}
        <p className="text-2xl text-gray-700 mb-4">
          You chose to: {decisionSummary}
        </p>

        <p className="text-xl text-gray-600 mb-8">
          Your response has been recorded
        </p>

        {/* Continue Button */}
        <button
          onClick={handleContinueClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 rounded-lg text-2xl min-h-[48px] transition-colors mb-4"
        >
          {isLastTask ? 'Continue to Survey' : 'Continue to Next Task'}
        </button>

        {/* Timer */}
        <p className="text-lg text-gray-500">
          {isLastTask ? 'Survey in' : 'Next task in'} {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  )
}

export { TaskComplete }

