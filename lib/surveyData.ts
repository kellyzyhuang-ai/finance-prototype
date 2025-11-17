import { BaselineSurveyData, PostTaskSurveyData } from '@/types/survey'

// Singleton instance
let globalInstance: SurveyDataManager | null = null

class SurveyDataManager {
  private baselineData: BaselineSurveyData | null = null
  private postTaskData: PostTaskSurveyData[] = []

  static getInstance(): SurveyDataManager {
    if (!globalInstance) {
      globalInstance = new SurveyDataManager()
    }
    return globalInstance
  }

  setBaselineData(data: BaselineSurveyData) {
    this.baselineData = data
  }

  addPostTaskData(data: PostTaskSurveyData) {
    this.postTaskData.push(data)
  }

  getBaselineData(): BaselineSurveyData | null {
    return this.baselineData
  }

  getPostTaskData(): PostTaskSurveyData[] {
    return [...this.postTaskData]
  }

  exportBaselineToCSV(participantId: string): string {
    if (!this.baselineData) {
      return ''
    }

    const data = this.baselineData
    const headers = [
      'participantId',
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

  downloadBaselineCSV(participantId: string) {
    const csv = this.exportBaselineToCSV(participantId)
    if (!csv) {
      alert('No baseline data to export')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${participantId}_baseline.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default SurveyDataManager

