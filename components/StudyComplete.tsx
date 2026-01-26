'use client'

import StudyDataManager from '@/lib/studyData'

interface StudyCompleteProps {
  participantId: string
  studyDataManager: StudyDataManager | null
}

export default function StudyComplete({ participantId, studyDataManager }: StudyCompleteProps) {
  const handleDownloadTrials = () => {
    if (studyDataManager) {
      studyDataManager.downloadTrialsCSV()
    }
  }

  return (
    <div className="task-transition-fullscreen study-complete">
      <div className="transition-content">
        <div className="checkmark-large">
          <svg viewBox="0 0 52 52" className="checkmark-svg">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        
        <h1 className="task-complete-title">All Tasks Complete!</h1>
        
        <div className="survey-instructions">
          <p>Thank you for completing all 6 tasks.</p>
          <p>Please fill out the digital survey.</p>
        </div>
        
        <button className="start-next-button" onClick={handleDownloadTrials}>
          Download Study Data
        </button>
      </div>
    </div>
  )
}

