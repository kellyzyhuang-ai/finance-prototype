'use client'

import { useState } from 'react'

const SURVEY_LINKS: Record<number, string> = {
  1: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_9mdY76SzzpnrQW2',
  2: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_3aPbnPppEM6Pnca',
  3: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_eL5KZbOVw1UmWuW',
  4: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_bfHJKxa7wUnaoU6',
  5: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_55TioGJX6yYeWUe',
  6: 'https://uwaterloo.ca1.qualtrics.com/jfe/form/SV_5w2QRBGClBJKV70'
}

interface TaskTransitionProps {
  completedTaskNumber: number
  nextTaskNumber: number
  totalTasks: number
  onStartNext: () => void
}

export default function TaskTransition({
  completedTaskNumber,
  nextTaskNumber,
  totalTasks,
  onStartNext
}: TaskTransitionProps) {
  const isFinalTask = completedTaskNumber >= totalTasks
  const [isExiting, setIsExiting] = useState(false)
  const [surveyCompleted, setSurveyCompleted] = useState(false)

  const surveyUrl = SURVEY_LINKS[completedTaskNumber] ?? '#'

  const handleStartNext = () => {
    setIsExiting(true)
    setTimeout(() => {
      onStartNext()
    }, 500)
  }

  return (
    <div className={`task-transition-fullscreen ${isExiting ? 'exiting' : ''}`}>
      <div className="transition-content">
        <div className="checkmark-large">
          <svg viewBox="0 0 52 52" className="checkmark-svg">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <h1 className="task-complete-title">
          {isFinalTask ? 'All Tasks Complete!' : `Task ${completedTaskNumber} Complete`}
        </h1>

        <div className="survey-instructions">
          {isFinalTask && (
            <p className="thank-you-line">Thank you for completing all 6 tasks.</p>
          )}
          <p>
            Please complete the post-task survey for Task {completedTaskNumber}.
          </p>
        </div>

        <a
          href={surveyUrl}
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
          <p>After completing the survey, check the box above and click:</p>
        </div>
      </div>

      <div className="transition-footer">
        {!isFinalTask && (
          <button
            className="start-next-button"
            onClick={handleStartNext}
            disabled={!surveyCompleted}
          >
            Start Task {nextTaskNumber} of {totalTasks}
          </button>
        )}
        {isFinalTask && (
          <button
            className="start-next-button"
            onClick={handleStartNext}
            disabled={!surveyCompleted}
          >
            Continue to Final Screen
          </button>
        )}
      </div>
    </div>
  )
}
