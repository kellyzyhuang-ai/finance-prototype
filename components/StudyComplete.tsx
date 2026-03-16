'use client'

import { useState } from 'react'
import StudyDataManager from '@/lib/studyData'

interface StudyCompleteProps {
  participantId: string
  studyDataManager: StudyDataManager | null
}

export default function StudyComplete({ participantId, studyDataManager }: StudyCompleteProps) {
  const [confirmed, setConfirmed] = useState(false)

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

        <h1 className="task-complete-title">Study Complete!</h1>

        <div className="survey-instructions">
          <p>Thank you for your participation!</p>
          <p>You have completed all 6 tasks and surveys.</p>
          <p>Before we proceed to the interview portion, please confirm:</p>
        </div>

        <div className="survey-checkbox-wrap">
          <label className="survey-checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="survey-checkbox"
            />
            <span>I confirm I have completed all tasks and post-task surveys</span>
          </label>
        </div>

        <div className="ready-section">
          <p>Once confirmed, please download your study data below, then let the researcher know you&apos;re ready for the interview.</p>
        </div>

        <button
          className="start-next-button"
          onClick={handleDownloadTrials}
          disabled={!confirmed}
        >
          Download Study Data
        </button>
      </div>
    </div>
  )
}
