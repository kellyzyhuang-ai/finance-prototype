export type AutonomyLevel = 'low' | 'medium' | 'high'
export type ExplanationQuality = 'low' | 'high'
export type TaskState = 'in_progress' | 'awaiting_confirmation' | 'completed'

export interface InteractionLog {
  timestamp: string
  participantId: string
  eventType: 'click' | 'info_request' | 'decision' | 'confirmation' | 'approval' | 'veto' | 'text_input' | 'task_complete'
  elementId?: string
  elementText?: string
  decisionLatency?: number // milliseconds
  autonomyLevel?: AutonomyLevel
  explanationQuality?: ExplanationQuality
  sessionId: string
  // Pattern matching fields
  rawInput?: string
  interpretedIntent?: string
  confidenceScore?: number
  clarificationNeeded?: boolean
  clarificationAttempts?: number
  // Task completion fields
  taskDuration?: number // milliseconds
  usedTimer?: boolean
  finalDecision?: string
  additionalData?: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export interface DecisionOption {
  id: string
  label: string
  description: string
}

