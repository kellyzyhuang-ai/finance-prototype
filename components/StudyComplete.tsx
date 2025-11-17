'use client'

import StudyDataManager from '@/lib/studyData'

interface StudyCompleteProps {
  participantId: string
  studyDataManager: StudyDataManager | null
}

export default function StudyComplete({ participantId, studyDataManager }: StudyCompleteProps) {
  const handleDownloadBaseline = () => {
    if (studyDataManager) {
      studyDataManager.downloadBaselineCSV()
    }
  }

  const handleDownloadTrials = () => {
    if (studyDataManager) {
      studyDataManager.downloadTrialsCSV()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
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

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Study Complete!</h1>
        
        <p className="text-2xl text-gray-700 mb-4">
          Thank you for participating, {participantId}
        </p>

        <p className="text-xl text-gray-600 mb-8">
          You have completed all tasks in this study.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleDownloadBaseline}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold px-12 py-4 rounded-lg text-2xl min-h-[48px] transition-colors"
          >
            Download Baseline Survey Data
          </button>

          <button
            onClick={handleDownloadTrials}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 rounded-lg text-2xl min-h-[48px] transition-colors"
          >
            Download Task & Survey Data
          </button>
        </div>

        <p className="text-lg text-gray-500 mt-6">
          Your responses have been automatically saved
        </p>
      </div>
    </div>
  )
}

