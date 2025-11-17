export interface BaselineSurveyData {
  participantId: string
  group: number
  timestamp: string
  age: number
  gender: string
  education: string
  priorFinancialApps: boolean
  priorAppsUsed?: string
  trustPropensity_1: number
  trustPropensity_2: number
  trustPropensity_3: number
  trustPropensity_4: number
  trustPropensityMean: number
  digitalLiteracy: number
  financialLiteracy_1: boolean
  financialLiteracy_2: boolean
  financialLiteracy_3: boolean
  financialLiteracyScore: number
}

export interface PostTaskSurveyData {
  participantId: string
  taskIndex: number
  autonomyLevel: string
  explanationQuality: string
  timestamp: string
  trust_1: number
  trust_2: number
  trust_3: number
  trust_4: number
  trust_5: number
  trust_6: number
  trust_7: number
  trustMean: number
  control_1: number
  control_2: number
  control_3: number
  control_4: number
  control_5: number
  controlMean: number
  manipCheck_1: number
  manipCheck_2: number
  manipCheck_3: number
}



