import { InteractionLog } from '@/types'
import { PostTaskSurveyData } from '@/types/survey'

interface TaskData {
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
  surveyData?: PostTaskSurveyData
}

class InteractionLogger {
  private logs: InteractionLog[] = []
  private sessionId: string
  private surveyData: Map<number, PostTaskSurveyData> = new Map()
  private taskData: Map<number, TaskData> = new Map()

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  setSurveyData(taskIndex: number, data: PostTaskSurveyData) {
    this.surveyData.set(taskIndex, data)
    // Update task data with survey
    const task = this.taskData.get(taskIndex)
    if (task) {
      task.surveyData = data
      this.taskData.set(taskIndex, task)
    }
  }

  setTaskData(taskIndex: number, data: Partial<TaskData>) {
    const existing = this.taskData.get(taskIndex) || {
      taskNumber: taskIndex + 1,
      taskType: 'bill',
      autonomyLevel: '',
      explanationQuality: '',
      taskStartTime: '',
      taskEndTime: '',
      taskDurationMs: 0,
      decisionLatencyMs: 0,
      finalDecision: '',
      infoRequestCount: 0,
    }
    this.taskData.set(taskIndex, { ...existing, ...data })
  }

  log(interaction: Omit<InteractionLog, 'timestamp' | 'sessionId'>) {
    const logEntry: InteractionLog = {
      ...interaction,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    }
    this.logs.push(logEntry)
    console.log('Logged interaction:', logEntry)
  }

  getLogs(): InteractionLog[] {
    return [...this.logs]
  }

  exportToCSV(participantId: string): string {
    // Create one row per task
    const taskIndices = Array.from(this.taskData.keys()).sort((a, b) => a - b)
    
    if (taskIndices.length === 0) {
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

    const rows = taskIndices.map((taskIndex) => {
      const task = this.taskData.get(taskIndex)!
      const survey = task.surveyData

      return [
        participantId,
        task.taskNumber.toString(),
        task.taskType,
        task.autonomyLevel,
        task.explanationQuality,
        task.taskStartTime,
        task.taskEndTime,
        task.taskDurationMs.toString(),
        task.decisionLatencyMs.toString(),
        task.finalDecision,
        task.infoRequestCount.toString(),
        survey?.trust_1?.toString() || '',
        survey?.trust_2?.toString() || '',
        survey?.trust_3?.toString() || '',
        survey?.trust_4?.toString() || '',
        survey?.trust_5?.toString() || '',
        survey?.trust_6?.toString() || '',
        survey?.trust_7?.toString() || '',
        survey?.trustMean?.toFixed(2) || '',
        survey?.control_1?.toString() || '',
        survey?.control_2?.toString() || '',
        survey?.control_3?.toString() || '',
        survey?.control_4?.toString() || '',
        survey?.control_5?.toString() || '',
        survey?.controlMean?.toFixed(2) || '',
        survey?.manipCheck_1?.toString() || '',
        survey?.manipCheck_2?.toString() || '',
        survey?.manipCheck_3?.toString() || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  }

  downloadCSV(participantId: string) {
    const csv = this.exportToCSV(participantId)
    if (!csv) {
      alert('No data to export')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${participantId}_trials.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  clear() {
    this.logs = []
  }
}

export default InteractionLogger

