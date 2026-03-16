'use client'

import { useState } from 'react'
import StudyDataManager from '@/lib/studyData'

const TASK_6_SURVEY_URL = 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_5w2QRBGClBJKV70'

interface StudyCompleteProps {
  participantId: string
  studyDataManager: StudyDataManager | null
}

export default function StudyComplete({ participantId, studyDataManager }: StudyCompleteProps) {
  const [surveyCompleted, setSurveyCompleted] = useState(false)

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
          <p>Please complete the final post-task survey for Task 6.</p>
        </div>

        <a
          href={TASK_6_SURVEY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="survey-link-button"
        >
          Open Survey
        </a>

        <div className="survey-checkbox-wrap">
          <label className="survey-checkbox-label">
            <input
              type="checkbox"
              checked={surveyCompleted}
              onChange={(e) => setSurveyCompleted(e.target.checked)}
              className="survey-checkbox"
            />
            <span>I have completed the survey</span>
          </label>
        </div>

        <div className="ready-section">
          <p>After completing the survey, check the box above and download your data:</p>
        </div>

        <button
          className="start-next-button"
          onClick={handleDownloadTrials}
          disabled={!surveyCompleted}
        >
          Download Study Data
        </button>
      </div>
    </div>
  )
}
