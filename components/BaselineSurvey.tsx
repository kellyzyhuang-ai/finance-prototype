'use client'

import { useState } from 'react'
import { BaselineSurveyData } from '@/types/survey'

interface BaselineSurveyProps {
  participantId: string
  group: number
  onComplete: (data: BaselineSurveyData) => void
}

export default function BaselineSurvey({ participantId, group, onComplete }: BaselineSurveyProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 4

  // Form state
  const [age, setAge] = useState<number | ''>('')
  const [gender, setGender] = useState('')
  const [education, setEducation] = useState('')
  const [priorFinancialApps, setPriorFinancialApps] = useState<boolean | null>(null)
  const [priorAppsUsed, setPriorAppsUsed] = useState('')
  
  const [trustPropensity_1, setTrustPropensity_1] = useState<number | null>(null)
  const [trustPropensity_2, setTrustPropensity_2] = useState<number | null>(null)
  const [trustPropensity_3, setTrustPropensity_3] = useState<number | null>(null)
  const [trustPropensity_4, setTrustPropensity_4] = useState<number | null>(null)
  
  const [digitalLiteracy, setDigitalLiteracy] = useState<number | null>(null)
  
  const [financialLiteracy_1, setFinancialLiteracy_1] = useState<boolean | null>(null)
  const [financialLiteracy_2, setFinancialLiteracy_2] = useState<boolean | null>(null)
  const [financialLiteracy_3, setFinancialLiteracy_3] = useState<boolean | null>(null)

  const canProceed = () => {
    switch (currentPage) {
      case 1:
        return age !== '' && Number(age) >= 65 && Number(age) <= 100 && 
               gender !== '' && education !== '' && priorFinancialApps !== null
      case 2:
        return trustPropensity_1 !== null && trustPropensity_2 !== null && 
               trustPropensity_3 !== null && trustPropensity_4 !== null
      case 3:
        return digitalLiteracy !== null
      case 4:
        return financialLiteracy_1 !== null && financialLiteracy_2 !== null && 
               financialLiteracy_3 !== null
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    const trustPropensityMean = (
      (trustPropensity_1! + trustPropensity_2! + trustPropensity_3! + trustPropensity_4!) / 4
    )
    
    const financialLiteracyScore = [
      financialLiteracy_1,
      financialLiteracy_2,
      financialLiteracy_3
    ].filter(Boolean).length

    const data: BaselineSurveyData = {
      participantId,
      group,
      timestamp: new Date().toISOString(),
      age: Number(age),
      gender,
      education,
      priorFinancialApps: priorFinancialApps!,
      priorAppsUsed: priorAppsUsed || undefined,
      trustPropensity_1: trustPropensity_1!,
      trustPropensity_2: trustPropensity_2!,
      trustPropensity_3: trustPropensity_3!,
      trustPropensity_4: trustPropensity_4!,
      trustPropensityMean,
      digitalLiteracy: digitalLiteracy!,
      financialLiteracy_1: financialLiteracy_1!,
      financialLiteracy_2: financialLiteracy_2!,
      financialLiteracy_3: financialLiteracy_3!,
      financialLiteracyScore,
    }

    onComplete(data)
  }

  const renderLikert5 = (value: number | null, setValue: (val: number) => void, label: string) => {
    return (
      <div className="mb-8">
        <p className="text-xl text-gray-900 mb-4 font-semibold">{label}</p>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <label
              key={num}
              className="flex flex-col items-center cursor-pointer"
              style={{ minWidth: '80px' }}
            >
              <input
                type="radio"
                name={`likert-${label}`}
                value={num}
                checked={value === num}
                onChange={() => setValue(num)}
                className="w-6 h-6 mb-2"
                style={{ minHeight: '24px', minWidth: '24px' }}
              />
              <span className="text-lg text-gray-700 text-center">{num}</span>
              <span className="text-base text-gray-600 text-center mt-1">
                {num === 1 ? 'Strongly Disagree' : 
                 num === 2 ? 'Disagree' : 
                 num === 3 ? 'Neutral' : 
                 num === 4 ? 'Agree' : 'Strongly Agree'}
              </span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  const renderLikert7 = (value: number | null, setValue: (val: number) => void, label: string) => {
    return (
      <div className="mb-8">
        <p className="text-xl text-gray-900 mb-4 font-semibold">{label}</p>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <label
              key={num}
              className="flex flex-col items-center cursor-pointer"
              style={{ minWidth: '80px' }}
            >
              <input
                type="radio"
                name={`likert7-${label}`}
                value={num}
                checked={value === num}
                onChange={() => setValue(num)}
                className="w-6 h-6 mb-2"
                style={{ minHeight: '24px', minWidth: '24px' }}
              />
              <span className="text-lg text-gray-700 text-center">{num}</span>
              <span className="text-base text-gray-600 text-center mt-1">
                {num === 1 ? 'Not at all' : 
                 num === 4 ? 'Somewhat' : 
                 num === 7 ? 'Very comfortable' : ''}
              </span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xl font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-12 rounded ${
                    i + 1 <= currentPage ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Page 1: Demographics */}
        {currentPage === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Demographics</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-3">
                  Age <span className="text-red-600">*</span>
                </label>
                <p className="text-lg text-gray-700 mb-3 font-medium">
                  Minimum age requirement: <span className="text-red-600 font-bold">65 years or older</span>
                </p>
                <input
                  type="number"
                  min="65"
                  max="100"
                  value={age}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value)
                    setAge(value)
                  }}
                  className={`w-full px-4 py-4 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] ${
                    age !== '' && Number(age) < 65 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your age (must be 65 or older)"
                  required
                />
                {age !== '' && Number(age) < 65 && (
                  <p className="text-lg text-red-600 font-semibold mt-2">
                    ⚠️ You must be 65 years or older to participate in this study.
                  </p>
                )}
                {age !== '' && Number(age) >= 65 && Number(age) <= 100 && (
                  <p className="text-lg text-green-600 font-semibold mt-2">
                    ✓ Age requirement met
                  </p>
                )}
                {age !== '' && Number(age) > 100 && (
                  <p className="text-lg text-red-600 font-semibold mt-2">
                    ⚠️ Please enter a valid age (65-100).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-3">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-3">
                  Highest Education
                </label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                >
                  <option value="">Select...</option>
                  <option value="Less than high school">Less than high school</option>
                  <option value="High school diploma/GED">High school diploma/GED</option>
                  <option value="Some college">Some college</option>
                  <option value="Associate's degree">Associate's degree</option>
                  <option value="Bachelor's degree">Bachelor's degree</option>
                  <option value="Master's degree">Master's degree</option>
                  <option value="Doctoral degree">Doctoral degree</option>
                  <option value="Professional degree (MD, JD, etc.)">Professional degree (MD, JD, etc.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xl font-semibold text-gray-900 mb-3">
                  Have you used any financial apps or robo-advisors before?
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priorFinancialApps"
                      value="yes"
                      checked={priorFinancialApps === true}
                      onChange={() => setPriorFinancialApps(true)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priorFinancialApps"
                      value="no"
                      checked={priorFinancialApps === false}
                      onChange={() => setPriorFinancialApps(false)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">No</span>
                  </label>
                </div>
                {priorFinancialApps === true && (
                  <div className="mt-4">
                    <label className="block text-lg font-semibold text-gray-900 mb-2">
                      Which ones? (optional)
                    </label>
                    <input
                      type="text"
                      value={priorAppsUsed}
                      onChange={(e) => setPriorAppsUsed(e.target.value)}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                      placeholder="e.g., Mint, Betterment, etc."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page 2: Trust Propensity */}
        {currentPage === 2 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trust Propensity</h2>
            <p className="text-xl text-gray-700 mb-8">
              Please rate your agreement with each statement.
            </p>
            
            <div className="space-y-6">
              {renderLikert5(trustPropensity_1, setTrustPropensity_1, 
                "In general, I trust technology to do what it's designed to do")}
              {renderLikert5(trustPropensity_2, setTrustPropensity_2, 
                "Technology usually works the way I expect it to")}
              {renderLikert5(trustPropensity_3, setTrustPropensity_3, 
                "I generally have confidence in automated systems")}
              {renderLikert5(trustPropensity_4, setTrustPropensity_4, 
                "I am comfortable relying on technology for important tasks")}
            </div>
          </div>
        )}

        {/* Page 3: Digital Literacy */}
        {currentPage === 3 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Digital Literacy</h2>
            {renderLikert7(digitalLiteracy, setDigitalLiteracy, 
              "How would you rate your comfort with technology?")}
          </div>
        )}

        {/* Page 4: Financial Literacy */}
        {currentPage === 4 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Financial Literacy</h2>
            <p className="text-xl text-gray-700 mb-8">
              Please answer True or False for each statement:
            </p>
            
            <div className="space-y-8">
              <div>
                <p className="text-xl text-gray-900 mb-4 font-semibold">
                  "Buying a single company's stock usually provides a safer return than a mutual fund."
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_1"
                      checked={financialLiteracy_1 === true}
                      onChange={() => setFinancialLiteracy_1(true)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">True</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_1"
                      checked={financialLiteracy_1 === false}
                      onChange={() => setFinancialLiteracy_1(false)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">False</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xl text-gray-900 mb-4 font-semibold">
                  "If interest rates rise, bond prices will typically fall."
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_2"
                      checked={financialLiteracy_2 === true}
                      onChange={() => setFinancialLiteracy_2(true)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">True</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_2"
                      checked={financialLiteracy_2 === false}
                      onChange={() => setFinancialLiteracy_2(false)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">False</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xl text-gray-900 mb-4 font-semibold">
                  "A 15-year mortgage typically requires higher monthly payments than a 30-year mortgage, but the total interest paid over the life of the loan will be less."
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_3"
                      checked={financialLiteracy_3 === true}
                      onChange={() => setFinancialLiteracy_3(true)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">True</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="financial_3"
                      checked={financialLiteracy_3 === false}
                      onChange={() => setFinancialLiteracy_3(false)}
                      className="w-6 h-6 mr-3"
                      style={{ minHeight: '24px', minWidth: '24px' }}
                    />
                    <span className="text-xl text-gray-700">False</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-300">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-8 py-4 rounded-lg text-xl font-semibold min-h-[48px] transition-colors ${
              currentPage === 1
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
            {currentPage === totalPages ? 'Complete Survey' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}



