'use client'

import { useState, useEffect } from 'react'

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
          <p>
            {isFinalTask 
              ? 'Thank you for completing all 6 tasks.\n\nPlease fill out the digital survey.'
              : 'Please fill out the digital survey.'}
          </p>
        </div>
        
        {!isFinalTask && (
          <div className="ready-section">
            <p>When you're ready to continue:</p>
            <button className="start-next-button" onClick={handleStartNext}>
              Start Task {nextTaskNumber} of {totalTasks}
            </button>
          </div>
        )}
        
        {isFinalTask && (
          <div className="ready-section">
            <button className="start-next-button" onClick={handleStartNext}>
              Continue to Final Screen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

