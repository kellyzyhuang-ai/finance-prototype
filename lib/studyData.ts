import { BaselineSurveyData, PostTaskSurveyData } from '@/types/survey'

export interface TrialData {
  taskNumber: number
  taskType: string
  autonomyLevel: string
  explanationQuality: string
  taskStartTime: string
  taskEndTime: string
  taskDurationMs: number
  decisionLatencyMs: number
  finalDecision: string
  infoRequestCount: number
  // Survey responses
  trust_1: number | null
  trust_2: number | null
  trust_3: number | null
  trust_4: number | null
  trust_5: number | null
  trust_6: number | null
  trust_7: number | null
  trustMean: number | null
  control_1: number | null
  control_2: number | null
  control_3: number | null
  control_4: number | null
  control_5: number | null
  controlMean: number | null
  manipCheck_1: number | null
  manipCheck_2: number | null
  manipCheck_3: number | null
}

export interface StudyData {
  participantId: string
  baselineSurvey: BaselineSurveyData | null
  trials: TrialData[]
}

class StudyDataManager {
  private data: StudyData

  constructor(participantId: string) {
    this.data = {
      participantId,
      baselineSurvey: null,
      trials: [],
    }
    this.loadFromStorage()
  }

  setBaselineSurvey(data: BaselineSurveyData) {
    this.data.baselineSurvey = data
    this.saveToStorage()
  }

  addTrial(trial: Partial<TrialData>) {
    // Use provided taskNumber or calculate based on existing trials
    const trialNumber = trial.taskNumber || this.data.trials.length + 1
    
    // Check if a trial with this taskNumber already exists
    const existingTrialIndex = this.data.trials.findIndex(t => t.taskNumber === trialNumber)
    
    if (existingTrialIndex >= 0) {
      // Trial already exists - update it instead of creating a new one
      this.data.trials[existingTrialIndex] = {
        ...this.data.trials[existingTrialIndex],
        taskType: trial.taskType || this.data.trials[existingTrialIndex].taskType,
        autonomyLevel: trial.autonomyLevel || this.data.trials[existingTrialIndex].autonomyLevel,
        explanationQuality: trial.explanationQuality || this.data.trials[existingTrialIndex].explanationQuality,
        taskStartTime: trial.taskStartTime || this.data.trials[existingTrialIndex].taskStartTime,
        // Don't overwrite completion data if it already exists
        taskEndTime: this.data.trials[existingTrialIndex].taskEndTime || trial.taskEndTime || '',
        taskDurationMs: this.data.trials[existingTrialIndex].taskDurationMs || trial.taskDurationMs || 0,
        decisionLatencyMs: this.data.trials[existingTrialIndex].decisionLatencyMs || trial.decisionLatencyMs || 0,
        finalDecision: this.data.trials[existingTrialIndex].finalDecision || trial.finalDecision || '',
        infoRequestCount: this.data.trials[existingTrialIndex].infoRequestCount || trial.infoRequestCount || 0,
      }
      this.saveToStorage()
      return existingTrialIndex
    }
    
    // Create new trial only if it doesn't exist
    const newTrial: TrialData = {
      taskNumber: trialNumber,
      taskType: trial.taskType || 'bill',
      autonomyLevel: trial.autonomyLevel || '',
      explanationQuality: trial.explanationQuality || '',
      taskStartTime: trial.taskStartTime || '',
      taskEndTime: trial.taskEndTime || '',
      taskDurationMs: trial.taskDurationMs || 0,
      decisionLatencyMs: trial.decisionLatencyMs || 0,
      finalDecision: trial.finalDecision || '',
      infoRequestCount: trial.infoRequestCount || 0,
      trust_1: null,
      trust_2: null,
      trust_3: null,
      trust_4: null,
      trust_5: null,
      trust_6: null,
      trust_7: null,
      trustMean: null,
      control_1: null,
      control_2: null,
      control_3: null,
      control_4: null,
      control_5: null,
      controlMean: null,
      manipCheck_1: null,
      manipCheck_2: null,
      manipCheck_3: null,
      ...trial,
    }
    this.data.trials.push(newTrial)
    this.saveToStorage()
    return this.data.trials.length - 1
  }

  updateTrialSurvey(trialIndex: number, surveyData: PostTaskSurveyData) {
    if (trialIndex >= 0 && trialIndex < this.data.trials.length) {
      this.data.trials[trialIndex] = {
        ...this.data.trials[trialIndex],
        trust_1: surveyData.trust_1,
        trust_2: surveyData.trust_2,
        trust_3: surveyData.trust_3,
        trust_4: surveyData.trust_4,
        trust_5: surveyData.trust_5,
        trust_6: surveyData.trust_6,
        trust_7: surveyData.trust_7,
        trustMean: surveyData.trustMean,
        control_1: surveyData.control_1,
        control_2: surveyData.control_2,
        control_3: surveyData.control_3,
        control_4: surveyData.control_4,
        control_5: surveyData.control_5,
        controlMean: surveyData.controlMean,
        manipCheck_1: surveyData.manipCheck_1,
        manipCheck_2: surveyData.manipCheck_2,
        manipCheck_3: surveyData.manipCheck_3,
      }
      this.saveToStorage()
    }
  }

  updateTrialData(trialIndex: number, updates: Partial<TrialData>) {
    if (trialIndex >= 0 && trialIndex < this.data.trials.length) {
      this.data.trials[trialIndex] = {
        ...this.data.trials[trialIndex],
        ...updates,
      }
      this.saveToStorage()
    }
  }

  getData(): StudyData {
    return { ...this.data }
  }

  getCurrentTrialIndex(): number {
    return this.data.trials.length - 1
  }

  exportBaselineCSV(): string {
    if (!this.data.baselineSurvey) {
      return ''
    }

    const data = this.data.baselineSurvey
    const headers = [
      'participantId',
      'group',
      'timestamp',
      'age',
      'gender',
      'education',
      'priorFinancialApps',
      'priorAppsUsed',
      'trustPropensity_1',
      'trustPropensity_2',
      'trustPropensity_3',
      'trustPropensity_4',
      'trustPropensityMean',
      'digitalLiteracy',
      'financialLiteracy_1',
      'financialLiteracy_2',
      'financialLiteracy_3',
      'financialLiteracyScore',
    ]

    const row = [
      data.participantId,
      data.group.toString(),
      data.timestamp,
      data.age.toString(),
      data.gender,
      data.education,
      data.priorFinancialApps ? 'yes' : 'no',
      data.priorAppsUsed || '',
      data.trustPropensity_1.toString(),
      data.trustPropensity_2.toString(),
      data.trustPropensity_3.toString(),
      data.trustPropensity_4.toString(),
      data.trustPropensityMean.toFixed(2),
      data.digitalLiteracy.toString(),
      data.financialLiteracy_1 ? 'true' : 'false',
      data.financialLiteracy_2 ? 'true' : 'false',
      data.financialLiteracy_3 ? 'true' : 'false',
      data.financialLiteracyScore.toString(),
    ]

    const csvContent = [headers, row]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  }

  exportTrialsCSV(): string {
    if (this.data.trials.length === 0) {
      return ''
    }

    const headers = [
      'participantId',
      'taskNumber',
      'taskType',
      'autonomyLevel',
      'explanationQuality',
      'taskStartTime',
      'taskEndTime',
      'taskDurationMs',
      'decisionLatencyMs',
      'finalDecision',
      'infoRequestCount',
      'trust_1',
      'trust_2',
      'trust_3',
      'trust_4',
      'trust_5',
      'trust_6',
      'trust_7',
      'trustMean',
      'control_1',
      'control_2',
      'control_3',
      'control_4',
      'control_5',
      'controlMean',
      'manipCheck_1',
      'manipCheck_2',
      'manipCheck_3',
    ]

    const rows = this.data.trials.map((trial) => [
      this.data.participantId,
      trial.taskNumber.toString(),
      trial.taskType,
      trial.autonomyLevel,
      trial.explanationQuality,
      trial.taskStartTime,
      trial.taskEndTime,
      trial.taskDurationMs.toString(),
      trial.decisionLatencyMs.toString(),
      trial.finalDecision,
      trial.infoRequestCount.toString(),
      trial.trust_1?.toString() || '',
      trial.trust_2?.toString() || '',
      trial.trust_3?.toString() || '',
      trial.trust_4?.toString() || '',
      trial.trust_5?.toString() || '',
      trial.trust_6?.toString() || '',
      trial.trust_7?.toString() || '',
      trial.trustMean?.toFixed(2) || '',
      trial.control_1?.toString() || '',
      trial.control_2?.toString() || '',
      trial.control_3?.toString() || '',
      trial.control_4?.toString() || '',
      trial.control_5?.toString() || '',
      trial.controlMean?.toFixed(2) || '',
      trial.manipCheck_1?.toString() || '',
      trial.manipCheck_2?.toString() || '',
      trial.manipCheck_3?.toString() || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  }

  downloadBaselineCSV() {
    const csv = this.exportBaselineCSV()
    if (!csv) {
      alert('No baseline data to export')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${this.data.participantId}_baseline.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  downloadTrialsCSV() {
    const csv = this.exportTrialsCSV()
    if (!csv) {
      alert('No trial data to export')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${this.data.participantId}_trials.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`studyData_${this.data.participantId}`, JSON.stringify(this.data))
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`studyData_${this.data.participantId}`)
      if (stored) {
        try {
          this.data = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to load study data from storage', e)
        }
      }
    }
  }
}

export default StudyDataManager



