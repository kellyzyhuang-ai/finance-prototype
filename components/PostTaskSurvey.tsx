'use client'

import { useState } from 'react'
import { PostTaskSurveyData } from '@/types/survey'

interface PostTaskSurveyProps {
  participantId: string
  taskIndex: number
  autonomyLevel: string
  explanationQuality: string
  onComplete: (data: PostTaskSurveyData) => void
}

export default function PostTaskSurvey({ 
  participantId, 
  taskIndex, 
  autonomyLevel, 
  explanationQuality,
  onComplete 
}: PostTaskSurveyProps) {
  const [currentSection, setCurrentSection] = useState(1)
  const totalSections = 3

  // Trust in Automation (7 items)
  const [trust_1, setTrust_1] = useState<number | null>(null)
  const [trust_2, setTrust_2] = useState<number | null>(null)
  const [trust_3, setTrust_3] = useState<number | null>(null)
  const [trust_4, setTrust_4] = useState<number | null>(null)
  const [trust_5, setTrust_5] = useState<number | null>(null)
  const [trust_6, setTrust_6] = useState<number | null>(null)
  const [trust_7, setTrust_7] = useState<number | null>(null)

  // Perceived Control (5 items)
  const [control_1, setControl_1] = useState<number | null>(null)
  const [control_2, setControl_2] = useState<number | null>(null)
  const [control_3, setControl_3] = useState<number | null>(null)
  const [control_4, setControl_4] = useState<number | null>(null)
  const [control_5, setControl_5] = useState<number | null>(null)

  // Manipulation Checks (3 items)
  const [manipCheck_1, setManipCheck_1] = useState<number | null>(null)
  const [manipCheck_2, setManipCheck_2] = useState<number | null>(null)
  const [manipCheck_3, setManipCheck_3] = useState<number | null>(null)

  const canProceed = () => {
    switch (currentSection) {
      case 1:
        return trust_1 !== null && trust_2 !== null && trust_3 !== null && 
               trust_4 !== null && trust_5 !== null && trust_6 !== null && trust_7 !== null
      case 2:
        return control_1 !== null && control_2 !== null && control_3 !== null && 
               control_4 !== null && control_5 !== null
      case 3:
        return manipCheck_1 !== null && manipCheck_2 !== null && manipCheck_3 !== null
      default:
        return false
    }
  }

  const [surveySubmitted, setSurveySubmitted] = useState(false)

  const handleNext = () => {
    if (currentSection < totalSections) {
      setCurrentSection(currentSection + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trustMean = (
      (trust_1! + trust_2! + trust_3! + trust_4! + trust_5! + trust_6! + trust_7!) / 7
    )
    
    const controlMean = (
      (control_1! + control_2! + control_3! + control_4! + control_5!) / 5
    )

    const data: PostTaskSurveyData = {
      participantId,
      taskIndex,
      autonomyLevel,
      explanationQuality,
      timestamp: new Date().toISOString(),
      trust_1: trust_1!,
      trust_2: trust_2!,
      trust_3: trust_3!,
      trust_4: trust_4!,
      trust_5: trust_5!,
      trust_6: trust_6!,
      trust_7: trust_7!,
      trustMean,
      control_1: control_1!,
      control_2: control_2!,
      control_3: control_3!,
      control_4: control_4!,
      control_5: control_5!,
      controlMean,
      manipCheck_1: manipCheck_1!,
      manipCheck_2: manipCheck_2!,
      manipCheck_3: manipCheck_3!,
    }

    setSurveySubmitted(true)
    
    // Show completion message then call onComplete
    setTimeout(() => {
      onComplete(data)
    }, 1500)
  }

  const renderLikert7 = (
    value: number | null, 
    setValue: (val: number) => void, 
    label: string,
    name: string
  ) => {
    return (
      <div className="mb-8">
        <p className="text-lg text-gray-900 mb-3 font-semibold">{label}</p>
        <div className="flex flex-col gap-2">
          {/* Scale labels at top */}
          <div className="flex justify-between text-sm text-gray-600 px-2">
            <span>Strongly Disagree</span>
            <span>Neutral</span>
            <span>Strongly Agree</span>
          </div>
          {/* Radio buttons in horizontal row */}
          <div className="flex justify-between bg-gray-50 p-3 rounded-lg">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <label
                key={num}
                className="flex flex-col items-center cursor-pointer px-2"
                style={{ minWidth: '60px' }}
              >
                <input
                  type="radio"
                  name={name}
                  value={num}
                  checked={value === num}
                  onChange={() => setValue(num)}
                  className="w-6 h-6 mb-2"
                  style={{ minHeight: '24px', minWidth: '24px' }}
                />
                <span className="text-lg text-gray-700 font-semibold">{num}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (surveySubmitted) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl text-gray-900">Survey submitted! Thank you.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white flex items-start justify-center px-8 py-8 z-50 overflow-y-auto">
      <div className="max-w-4xl w-full bg-white p-8">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-700">
              Section {currentSection} of {totalSections}
            </span>
            <div className="flex gap-2">
              {[...Array(totalSections)].map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-12 rounded ${
                    i + 1 <= currentSection ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Section 1: Trust in Automation */}
        {currentSection === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trust in AI Assistant</h2>
            <p className="text-lg text-gray-600 mb-2">Page 1 of 3</p>
            <p className="text-lg text-gray-700 mb-6">
              Please rate your agreement with each statement about the AI assistant you just interacted with.
            </p>
            <p className="text-base text-gray-500 mb-6">Questions 1-7 of 15 total</p>
            
            <div className="space-y-6">
              {renderLikert7(trust_1, setTrust_1, 
                "The AI assistant was trustworthy", "trust_1")}
              {renderLikert7(trust_2, setTrust_2, 
                "The AI assistant could be trusted to complete assigned financial tasks", "trust_2")}
              {renderLikert7(trust_3, setTrust_3, 
                "I did not feel the need to monitor the AI assistant's suggestions", "trust_3")}
              {renderLikert7(trust_4, setTrust_4, 
                "The AI assistant's behavior was predictable", "trust_4")}
              {renderLikert7(trust_5, setTrust_5, 
                "I could rely on the AI assistant to manage my finances", "trust_5")}
              {renderLikert7(trust_6, setTrust_6, 
                "I felt confident in the AI assistant's recommendations", "trust_6")}
              {renderLikert7(trust_7, setTrust_7, 
                "The AI assistant was dependable", "trust_7")}
            </div>
          </div>
        )}

        {/* Section 2: Perceived Control */}
        {currentSection === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Perceived Control</h2>
            <p className="text-lg text-gray-600 mb-2">Page 2 of 3</p>
            <p className="text-lg text-gray-700 mb-6">
              Please rate your agreement with each statement about your experience.
            </p>
            <p className="text-base text-gray-500 mb-6">Questions 8-12 of 15 total</p>
            
            <div className="space-y-6">
              {renderLikert7(control_1, setControl_1, 
                "I felt in control of my financial decisions", "control_1")}
              {renderLikert7(control_2, setControl_2, 
                "I felt like I had a say in what happened with my money", "control_2")}
              {renderLikert7(control_3, setControl_3, 
                "I felt autonomous in making financial choices", "control_3")}
              {renderLikert7(control_4, setControl_4, 
                "I felt like the AI assistant was controlling my finances", "control_4")}
              {renderLikert7(control_5, setControl_5, 
                "My actions were my own choices, not the AI's", "control_5")}
            </div>
          </div>
        )}

        {/* Section 3: Manipulation Checks */}
        {currentSection === 3 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Manipulation Checks</h2>
            <p className="text-lg text-gray-600 mb-2">Page 3 of 3</p>
            <p className="text-lg text-gray-700 mb-6">
              Please rate how much you agree with each statement about the AI assistant's behavior.
            </p>
            <p className="text-base text-gray-500 mb-6">Questions 13-15 of 15 total</p>
            
            <div className="space-y-6">
              {renderLikert7(manipCheck_1, setManipCheck_1, 
                "The AI provided information but I made all decisions", "manipCheck_1")}
              {renderLikert7(manipCheck_2, setManipCheck_2, 
                "The AI suggested a specific action and asked for my approval", "manipCheck_2")}
              {renderLikert7(manipCheck_3, setManipCheck_3, 
                "The AI made decisions and informed me afterward", "manipCheck_3")}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-300">
          <button
            onClick={() => setCurrentSection(currentSection - 1)}
            disabled={currentSection === 1}
            className={`px-8 py-4 rounded-lg text-xl font-semibold min-h-[48px] transition-colors ${
              currentSection === 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-8 py-4 rounded-lg text-xl font-semibold min-h-[48px] transition-colors ${
              canProceed()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentSection === totalSections ? 'Complete Survey' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

