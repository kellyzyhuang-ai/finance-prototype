'use client'

interface StartStudyTransitionProps {
  onComplete: () => void
}

export default function StartStudyTransition({ onComplete }: StartStudyTransitionProps) {
  return (
    <div className="task-transition-fullscreen start-study">
      <div className="transition-content">
        <h1 className="start-study-title">Ready to Begin</h1>
        
        <p className="instructions">
          You will now complete 6 financial decision-making tasks.
        </p>
        
        <p className="reminder">
          Remember:
          <br />
          • Take your time with each decision
          <br />
          • There are no wrong answers
          <br />
          • Fill out the digital survey after each task
        </p>
        
        <button 
          className="start-button" 
          onClick={() => {
            console.log('Start Task 1 button clicked')
            onComplete()
          }}
        >
          Start Task 1 of 6
        </button>
      </div>
    </div>
  )
}

