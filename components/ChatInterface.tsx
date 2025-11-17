'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatMessage, AutonomyLevel, ExplanationQuality, DecisionOption, InteractionLog, TaskState } from '@/types'
import InteractionLogger from '@/lib/logger'
import { matchIntent, getClarificationMessage, IntentType } from '@/lib/patternMatcher'
import PostTaskSurvey from '@/components/PostTaskSurvey'
import StudyComplete from '@/components/StudyComplete'
import StudyDataManager from '@/lib/studyData'
import { PostTaskSurveyData } from '@/types/survey'

interface ChatInterfaceProps {
  participantId: string
  group: number
}

// Task type definitions
type TaskType = 'bill' | 'savings' | 'investment'

interface TaskCondition {
  taskNumber: number
  taskType: TaskType
  autonomy: AutonomyLevel
  explanation: ExplanationQuality
}

// Pre-scripted messages for Wizard-of-Oz
const SCRIPTED_MESSAGES: Record<TaskType, Record<string, Record<string, string[]>>> = {
  bill: {
    low: {
      low: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "Here are your options:",
        "Option 1: Pay $150 now",
        "Option 2: Set up payment plan",
        "Option 3: Skip for now",
        "Which option would you like to choose?"
      ],
      high: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "Let me explain each option in detail:",
        "Option 1: Pay $150 now - This will pay your bill in full immediately, avoiding any late fees. The payment will be processed from your checking account today.",
        "Option 2: Set up payment plan - You can split the $150 into 3 monthly payments of $50 each. This gives you more flexibility, but there may be a small setup fee of $5.",
        "Option 3: Skip for now - You can choose to handle this bill yourself later. Note that if you don't pay by tomorrow, you may incur a late fee of $15.",
        "Which option would you like to choose?"
      ]
    },
    medium: {
      low: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "I recommend paying it now to avoid late fees.",
        "Would you like me to proceed with this payment?"
      ],
      high: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "I recommend paying it now. Based on your account balance and payment history, you have sufficient funds available. Paying now will help you avoid a $15 late fee that would be charged if the bill isn't paid by tomorrow.",
        "This recommendation is based on: (1) Your account has enough funds, (2) You've paid bills on time in the past, and (3) Avoiding late fees saves you money.",
        "Would you like me to proceed with this payment?"
      ]
    },
    high: {
      low: [
        "I've processed the payment for your $150 electric bill that's due tomorrow.",
        "The payment has been scheduled from your checking account.",
        "You can cancel this payment within 24 hours if you change your mind."
      ],
      high: [
        "I've analyzed your account and processed the payment for your $150 electric bill that's due tomorrow.",
        "I made this decision because: (1) Your account has sufficient funds, (2) The bill is due tomorrow and paying now avoids a $15 late fee, and (3) Your payment history shows you prefer to pay bills on time.",
        "The payment will be processed from your checking account today. You'll receive a confirmation email once the payment is complete.",
        "You can cancel this payment within 24 hours if you change your mind. After that, you can still contact customer service to request a refund if needed."
      ]
    }
  },
  savings: {
    low: {
      low: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved. Your checking account has $2,430 available.",
        "Here are your options:",
        "Option 1: Transfer $500 to savings",
        "Option 2: Transfer a different amount",
        "Option 3: Skip this month",
        "Which option would you like to choose?"
      ],
      high: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved. Your checking account has $2,430 available.",
        "Let me explain each option in detail:",
        "Option 1: Transfer $500 to savings - This will bring your emergency fund to $7,000, getting you closer to your $10,000 goal. This leaves $1,930 in checking for your monthly expenses.",
        "Option 2: Transfer a different amount - You can choose any amount between $100 and $1,000. A smaller transfer gives you more flexibility, while a larger one gets you closer to your goal faster.",
        "Option 3: Skip this month - You can choose to skip the transfer this month and keep all funds in checking. This gives you maximum flexibility but delays reaching your savings goal.",
        "Which option would you like to choose?"
      ]
    },
    medium: {
      low: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved.",
        "I recommend transferring $500 to savings this month.",
        "Would you like me to proceed with this transfer?"
      ],
      high: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved. Your checking account has $2,430 available.",
        "I recommend transferring $500 to savings this month. This will bring your emergency fund to $7,000, getting you 70% of the way to your goal. With $1,930 remaining in checking, you'll still have enough for your monthly expenses based on your spending patterns.",
        "This recommendation is based on: (1) You're making steady progress toward your goal, (2) Your checking account has sufficient funds, and (3) Regular contributions help build financial security.",
        "Would you like me to proceed with this transfer?"
      ]
    },
    high: {
      low: [
        "I've transferred $500 from your checking account to your emergency fund savings.",
        "Your emergency fund now has $7,000, and your checking account has $1,930 remaining.",
        "You can cancel this transfer within 24 hours if you change your mind."
      ],
      high: [
        "I've analyzed your savings goals and transferred $500 from your checking account to your emergency fund savings.",
        "I made this decision because: (1) You're making steady progress toward your $10,000 goal (now at $7,000), (2) Your checking account had sufficient funds ($2,430), and (3) Regular contributions help build financial security without impacting your monthly expenses.",
        "Your emergency fund now has $7,000, and your checking account has $1,930 remaining. You'll receive a confirmation email once the transfer is complete.",
        "You can cancel this transfer within 24 hours if you change your mind. After that, you can still contact customer service to request a reversal if needed."
      ]
    }
  },
  investment: {
    low: {
      low: [
        "Your retirement portfolio is currently worth $180,000. It's allocated as 75% stocks and 25% bonds, but your target allocation is 60% stocks and 40% bonds.",
        "Here are your options:",
        "Option 1: Rebalance now to target allocation",
        "Option 2: Partial rebalance (move halfway to target)",
        "Option 3: Keep current allocation",
        "Which option would you like to choose?"
      ],
      high: [
        "Your retirement portfolio is currently worth $180,000. It's allocated as 75% stocks and 25% bonds, but your target allocation is 60% stocks and 40% bonds.",
        "Let me explain each option in detail:",
        "Option 1: Rebalance now to target allocation - This will sell $27,000 worth of stocks and buy $27,000 worth of bonds to reach your 60/40 target. This reduces risk but may trigger capital gains taxes on the sales.",
        "Option 2: Partial rebalance (move halfway to target) - This will sell $13,500 worth of stocks and buy $13,500 worth of bonds, moving you to approximately 67.5% stocks and 32.5% bonds. This is a more gradual approach with lower tax impact.",
        "Option 3: Keep current allocation - You can maintain your current 75/25 allocation. This keeps you more heavily invested in stocks, which may offer higher returns but also higher volatility.",
        "Which option would you like to choose?"
      ]
    },
    medium: {
      low: [
        "Your retirement portfolio is currently 75% stocks and 25% bonds, but your target is 60% stocks and 40% bonds.",
        "I recommend rebalancing now to your target allocation.",
        "Would you like me to proceed with this rebalancing?"
      ],
      high: [
        "Your retirement portfolio is currently worth $180,000, allocated as 75% stocks and 25% bonds, but your target allocation is 60% stocks and 40% bonds.",
        "I recommend rebalancing now to your target allocation. This will sell $27,000 worth of stocks and buy $27,000 worth of bonds. This reduces your portfolio risk to match your target, which is important for managing risk as you approach retirement.",
        "This recommendation is based on: (1) Your portfolio has drifted significantly from your target (15% difference), (2) Rebalancing helps manage risk, and (3) Your target allocation aligns with your retirement timeline and risk tolerance.",
        "Would you like me to proceed with this rebalancing?"
      ]
    },
    high: {
      low: [
        "I've rebalanced your retirement portfolio to your target allocation of 60% stocks and 40% bonds.",
        "The rebalancing has been executed: $27,000 in stocks were sold and $27,000 in bonds were purchased.",
        "You can cancel this rebalancing within 24 hours if you change your mind."
      ],
      high: [
        "I've analyzed your portfolio and rebalanced it to your target allocation of 60% stocks and 40% bonds.",
        "I made this decision because: (1) Your portfolio had drifted 15% from your target (75/25 vs 60/40), (2) Rebalancing helps manage risk as you approach retirement, and (3) Your target allocation aligns with your risk tolerance and retirement timeline.",
        "The rebalancing has been executed: $27,000 in stocks were sold and $27,000 in bonds were purchased. Your portfolio is now worth $180,000 with the target 60/40 allocation. You'll receive a confirmation email once the trades are complete.",
        "You can cancel this rebalancing within 24 hours if you change your mind. After that, you can still contact customer service to request a reversal if needed."
      ]
    }
  }
}

// Decision options by task type
const DECISION_OPTIONS: Record<TaskType, DecisionOption[]> = {
  bill: [
    { id: 'option1', label: 'Option 1', description: 'Pay $150 now' },
    { id: 'option2', label: 'Option 2', description: 'Set up payment plan' },
    { id: 'option3', label: 'Option 3', description: 'Skip for now' }
  ],
  savings: [
    { id: 'option1', label: 'Option 1', description: 'Transfer $500 to savings' },
    { id: 'option2', label: 'Option 2', description: 'Transfer a different amount' },
    { id: 'option3', label: 'Option 3', description: 'Skip this month' }
  ],
  investment: [
    { id: 'option1', label: 'Option 1', description: 'Rebalance now to target allocation' },
    { id: 'option2', label: 'Option 2', description: 'Partial rebalance (move halfway to target)' },
    { id: 'option3', label: 'Option 3', description: 'Keep current allocation' }
  ]
}

// Counterbalance groups with 8 pre-defined sequences
const COUNTERBALANCE_GROUPS: Record<number, TaskCondition[]> = {
  1: [
    { taskNumber: 1, taskType: 'bill', autonomy: 'low', explanation: 'low' },
    { taskNumber: 2, taskType: 'savings', autonomy: 'low', explanation: 'high' },
    { taskNumber: 3, taskType: 'investment', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 4, taskType: 'bill', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 5, taskType: 'savings', autonomy: 'high', explanation: 'low' },
    { taskNumber: 6, taskType: 'investment', autonomy: 'high', explanation: 'high' }
  ],
  2: [
    { taskNumber: 1, taskType: 'savings', autonomy: 'low', explanation: 'high' },
    { taskNumber: 2, taskType: 'investment', autonomy: 'low', explanation: 'low' },
    { taskNumber: 3, taskType: 'bill', autonomy: 'high', explanation: 'high' },
    { taskNumber: 4, taskType: 'savings', autonomy: 'high', explanation: 'low' },
    { taskNumber: 5, taskType: 'investment', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 6, taskType: 'bill', autonomy: 'medium', explanation: 'low' }
  ],
  3: [
    { taskNumber: 1, taskType: 'investment', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 2, taskType: 'bill', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 3, taskType: 'savings', autonomy: 'low', explanation: 'low' },
    { taskNumber: 4, taskType: 'investment', autonomy: 'low', explanation: 'high' },
    { taskNumber: 5, taskType: 'bill', autonomy: 'high', explanation: 'low' },
    { taskNumber: 6, taskType: 'savings', autonomy: 'high', explanation: 'high' }
  ],
  4: [
    { taskNumber: 1, taskType: 'bill', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 2, taskType: 'savings', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 3, taskType: 'investment', autonomy: 'high', explanation: 'high' },
    { taskNumber: 4, taskType: 'bill', autonomy: 'high', explanation: 'low' },
    { taskNumber: 5, taskType: 'savings', autonomy: 'low', explanation: 'high' },
    { taskNumber: 6, taskType: 'investment', autonomy: 'low', explanation: 'low' }
  ],
  5: [
    { taskNumber: 1, taskType: 'savings', autonomy: 'high', explanation: 'low' },
    { taskNumber: 2, taskType: 'investment', autonomy: 'high', explanation: 'high' },
    { taskNumber: 3, taskType: 'bill', autonomy: 'low', explanation: 'low' },
    { taskNumber: 4, taskType: 'savings', autonomy: 'low', explanation: 'high' },
    { taskNumber: 5, taskType: 'investment', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 6, taskType: 'bill', autonomy: 'medium', explanation: 'high' }
  ],
  6: [
    { taskNumber: 1, taskType: 'investment', autonomy: 'high', explanation: 'high' },
    { taskNumber: 2, taskType: 'bill', autonomy: 'high', explanation: 'low' },
    { taskNumber: 3, taskType: 'savings', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 4, taskType: 'investment', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 5, taskType: 'bill', autonomy: 'low', explanation: 'high' },
    { taskNumber: 6, taskType: 'savings', autonomy: 'low', explanation: 'low' }
  ],
  7: [
    { taskNumber: 1, taskType: 'bill', autonomy: 'low', explanation: 'high' },
    { taskNumber: 2, taskType: 'investment', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 3, taskType: 'savings', autonomy: 'high', explanation: 'high' },
    { taskNumber: 4, taskType: 'bill', autonomy: 'high', explanation: 'low' },
    { taskNumber: 5, taskType: 'investment', autonomy: 'low', explanation: 'high' },
    { taskNumber: 6, taskType: 'savings', autonomy: 'medium', explanation: 'low' }
  ],
  8: [
    { taskNumber: 1, taskType: 'investment', autonomy: 'low', explanation: 'low' },
    { taskNumber: 2, taskType: 'savings', autonomy: 'high', explanation: 'high' },
    { taskNumber: 3, taskType: 'bill', autonomy: 'medium', explanation: 'low' },
    { taskNumber: 4, taskType: 'investment', autonomy: 'medium', explanation: 'high' },
    { taskNumber: 5, taskType: 'bill', autonomy: 'low', explanation: 'high' },
    { taskNumber: 6, taskType: 'savings', autonomy: 'medium', explanation: 'low' }
  ]
}

export default function ChatInterface({ participantId, group }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('low')
  const [explanationQuality, setExplanationQuality] = useState<ExplanationQuality>('low')
  const [currentTaskType, setCurrentTaskType] = useState<TaskType>('bill')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [decisionStartTime, setDecisionStartTime] = useState<number | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const loggerRef = useRef<InteractionLogger | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [textInput, setTextInput] = useState('')
  const [clarificationAttempts, setClarificationAttempts] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Task state management
  const [taskState, setTaskState] = useState<TaskState>('in_progress')
  const [finalDecision, setFinalDecision] = useState<string>('')
  const [taskStartTime, setTaskStartTime] = useState<number>(Date.now())
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [studyComplete, setStudyComplete] = useState(false)
  const [showPostTaskSurvey, setShowPostTaskSurvey] = useState(false)
  const [showTransitionMessage, setShowTransitionMessage] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState('')
  const studyDataManagerRef = useRef<StudyDataManager | null>(null)
  const [infoRequestCount, setInfoRequestCount] = useState(0)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1)

  const searchParams = useSearchParams()

  useEffect(() => {
    studyDataManagerRef.current = new StudyDataManager(participantId)
  }, [participantId])

  const startConversation = (condition: TaskCondition) => {
    // Clear previous state
    setMessages([])
    setSelectedOption(null)
    setShowConfirmation(false)
    setTaskState('in_progress')
    setFinalDecision('')
    setClarificationAttempts(0)
    setTextInput('')
    setInfoRequestCount(0) // Reset info request count for new task
    setShowTransitionMessage(false)
    
    const taskStartTime = new Date().toISOString()
    const scriptedMessages = SCRIPTED_MESSAGES[condition.taskType][condition.autonomy][condition.explanation]
    // Combine all AI messages into one bubble
    const combinedContent = scriptedMessages.join('\n\n')
    const newMessages: ChatMessage[] = [{
      id: `msg-0`,
      role: 'assistant' as const,
      content: combinedContent,
      timestamp: new Date(),
    }]
    setMessages(newMessages)
    setDecisionStartTime(Date.now())
    setTaskStartTime(Date.now())
    
    // Set current task type and conditions
    setCurrentTaskType(condition.taskType)
    setAutonomyLevel(condition.autonomy)
    setExplanationQuality(condition.explanation)
    
    // Create new trial in study data with proper task number
    if (studyDataManagerRef.current) {
      const trialIndex = studyDataManagerRef.current.addTrial({
        taskNumber: condition.taskNumber,
        taskType: condition.taskType,
        autonomyLevel: condition.autonomy,
        explanationQuality: condition.explanation,
        taskStartTime: taskStartTime,
        taskEndTime: '',
        taskDurationMs: 0,
        decisionLatencyMs: 0,
        finalDecision: '',
        infoRequestCount: 0,
      })
      setCurrentTrialIndex(trialIndex)
    }
    
    loggerRef.current?.log({
      participantId,
      eventType: 'click',
      elementId: 'conversation_start',
      elementText: 'Conversation started',
      autonomyLevel: condition.autonomy,
      explanationQuality: condition.explanation,
      additionalData: { taskIndex: currentTaskIndex, taskType: condition.taskType }
    })
  }

  useEffect(() => {
    loggerRef.current = new InteractionLogger(sessionId)
    
    // Get the task sequence for the selected group
    const taskSequence = COUNTERBALANCE_GROUPS[group] || COUNTERBALANCE_GROUPS[1]
    
    // Use task sequence for proper counterbalancing
    if (currentTaskIndex < taskSequence.length) {
      const condition = taskSequence[currentTaskIndex]
      
      // Only start conversation if not showing survey
      if (!showPostTaskSurvey) {
        startConversation(condition)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, participantId, currentTaskIndex, showPostTaskSurvey, group])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input field when clarification is needed
  useEffect(() => {
    if (clarificationAttempts > 0) {
      inputRef.current?.focus()
    }
  }, [clarificationAttempts])

  const completeTask = (decision: string) => {
    const taskDuration = Date.now() - taskStartTime
    const taskEndTime = new Date().toISOString()
    const decisionLatency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    setFinalDecision(decision)
    setTaskState('completed')
    
    // Update existing trial entry - don't create a new one
    if (studyDataManagerRef.current && currentTrialIndex >= 0) {
      studyDataManagerRef.current.updateTrialData(currentTrialIndex, {
        taskEndTime: taskEndTime,
        taskDurationMs: taskDuration,
        decisionLatencyMs: decisionLatency,
        finalDecision: decision,
        infoRequestCount: infoRequestCount,
      })
    }
    
    // Show appropriate success message based on decision type
    let successMessage = 'Your choice has been recorded.'
    
    if (decision.includes('Declined') || decision.includes('Skip') || decision.includes('Keep current')) {
      successMessage = 'Understood. No changes have been made.'
    } else if (decision.includes('Cancelled')) {
      successMessage = 'The scheduled action has been cancelled.'
    } else if (decision.includes('Kept scheduled')) {
      successMessage = 'The scheduled action will proceed as planned.'
    } else {
      successMessage = 'Your choice has been recorded.'
    }
    
    setMessages(prev => [...prev, {
      id: `msg-success-${Date.now()}`,
      role: 'assistant',
      content: successMessage,
      timestamp: new Date(),
    }])

    // Show transition message and auto-advance to survey
    setTimeout(() => {
      setTransitionMessage('Task Complete! Proceeding to survey...')
      setShowTransitionMessage(true)
      
      setTimeout(() => {
        setShowTransitionMessage(false)
        setShowPostTaskSurvey(true)
      }, 2000)
    }, 2000)
  }

  const handlePostTaskSurveyComplete = (data: PostTaskSurveyData) => {
    // Store survey data to current trial
    if (studyDataManagerRef.current && currentTrialIndex >= 0) {
      studyDataManagerRef.current.updateTrialSurvey(currentTrialIndex, data)
    }

    setShowPostTaskSurvey(false)

    // Get the task sequence for the selected group
    const taskSequence = COUNTERBALANCE_GROUPS[group] || COUNTERBALANCE_GROUPS[1]
    
    // Show transition message
    if (currentTaskIndex >= taskSequence.length - 1) {
      // All tasks complete
      setTransitionMessage('Survey submitted! Thank you. Study complete!')
      setShowTransitionMessage(true)
      setTimeout(() => {
        setShowTransitionMessage(false)
        setStudyComplete(true)
      }, 2000)
    } else {
      // Show transition and auto-advance to next task
      setTransitionMessage(`Survey submitted! Thank you.\n\nStarting Task ${currentTaskIndex + 2} of 6...`)
      setShowTransitionMessage(true)
      setTimeout(() => {
        setShowTransitionMessage(false)
        // Move to next task
        setCurrentTaskIndex(prev => prev + 1)
      }, 2000)
    }
  }

  const handleOptionClick = (optionId: string) => {
    if (autonomyLevel !== 'low' || taskState !== 'in_progress') return
    
    const option = DECISION_OPTIONS[currentTaskType].find(opt => opt.id === optionId)
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    loggerRef.current?.log({
      participantId,
      eventType: 'click',
      elementId: optionId,
      elementText: option?.label || '',
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
      additionalData: { optionDescription: option?.description }
    })
    
    setSelectedOption(optionId)
    setTaskState('awaiting_confirmation')
    setShowConfirmation(true)
    
    // Add confirmation message as system message
    setMessages(prev => [...prev, {
      id: `msg-confirm-${Date.now()}`,
      role: 'assistant',
      content: `Please confirm: ${option?.description}`,
      timestamp: new Date(),
    }])
  }

  const handleConfirmation = (confirmed: boolean) => {
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    loggerRef.current?.log({
      participantId,
      eventType: confirmed ? 'confirmation' : 'click',
      elementId: confirmed ? 'confirm_yes' : 'confirm_no',
      elementText: confirmed ? 'Confirmed' : 'Cancelled',
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
      additionalData: { selectedOption: selectedOption }
    })
    
    if (confirmed) {
      const decision = DECISION_OPTIONS[currentTaskType].find(opt => opt.id === selectedOption)?.description || ''
      completeTask(decision)
    } else {
      // Go back to options
      setShowConfirmation(false)
      setSelectedOption(null)
      setTaskState('in_progress')
      setClarificationAttempts(0)
    }
  }

  const handleApproval = (approved: boolean) => {
    if (autonomyLevel !== 'medium' || taskState === 'completed') return
    
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    loggerRef.current?.log({
      participantId,
      eventType: approved ? 'approval' : 'click',
      elementId: approved ? 'approve_yes' : 'approve_no',
      elementText: approved ? 'Approved' : 'Declined',
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
    })
    
    if (approved) {
      const decision = currentTaskType === 'bill' 
        ? 'Pay $150 now'
        : currentTaskType === 'savings'
        ? 'Transfer $500 to savings'
        : 'Rebalance now to target allocation'
      completeTask(decision)
    } else {
      // Decline is a valid final decision - complete the task immediately
      const decision = currentTaskType === 'bill'
        ? 'Declined recommendation to pay bill'
        : currentTaskType === 'savings'
        ? 'Declined recommendation to transfer to savings'
        : 'Declined recommendation to rebalance portfolio'
      completeTask(decision)
    }
  }

  const handleVeto = (vetoed: boolean) => {
    if (autonomyLevel !== 'high' || taskState === 'completed') return
    
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    loggerRef.current?.log({
      participantId,
      eventType: vetoed ? 'veto' : 'click',
      elementId: vetoed ? 'veto_yes' : 'veto_no',
      elementText: vetoed ? 'Vetoed' : 'Accepted',
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
    })
    
    // Both decisions are valid final decisions - complete task immediately
    if (vetoed) {
      const cancelledDecision = currentTaskType === 'bill'
        ? 'Cancelled scheduled payment'
        : currentTaskType === 'savings'
        ? 'Cancelled scheduled transfer'
        : 'Cancelled scheduled rebalancing'
      completeTask(cancelledDecision)
    } else {
      const keptDecision = currentTaskType === 'bill'
        ? 'Kept scheduled payment'
        : currentTaskType === 'savings'
        ? 'Kept scheduled transfer'
        : 'Kept scheduled rebalancing'
      completeTask(keptDecision)
    }
  }

  const handleExportData = () => {
    if (studyDataManagerRef.current) {
      // Export both CSVs
      studyDataManagerRef.current.downloadBaselineCSV()
      setTimeout(() => {
        studyDataManagerRef.current?.downloadTrialsCSV()
      }, 500)
    }
  }

  const handleTextInput = (input: string) => {
    if (!input.trim() || taskState === 'completed') return

    const rawInput = input.trim()
    const match = matchIntent(rawInput)
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: rawInput,
      timestamp: new Date(),
    }])

    // Log the text input
    loggerRef.current?.log({
      participantId,
      eventType: 'text_input',
      elementId: 'text_input',
      elementText: rawInput,
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
      rawInput: rawInput,
      interpretedIntent: match.intent,
      confidenceScore: match.confidence,
      clarificationNeeded: match.intent === 'unclear' || match.intent === 'question' || match.intent === 'off_topic',
      clarificationAttempts: clarificationAttempts,
    })

    // Handle different intents based on autonomy level
    if (autonomyLevel === 'low') {
      if (match.intent === 'option1') {
        handleOptionClick('option1')
        setTextInput('')
        return
      } else if (match.intent === 'option2') {
        handleOptionClick('option2')
        setTextInput('')
        return
      } else if (match.intent === 'option3') {
        handleOptionClick('option3')
        setTextInput('')
        return
      } else if (showConfirmation) {
        if (match.intent === 'confirm_yes') {
          handleConfirmation(true)
          setTextInput('')
          return
        } else if (match.intent === 'confirm_no') {
          handleConfirmation(false)
          setTextInput('')
          return
        }
      }
    } else if (autonomyLevel === 'medium') {
      if (match.intent === 'confirm_yes') {
        handleApproval(true)
        setTextInput('')
        return
      } else if (match.intent === 'confirm_no') {
        handleApproval(false)
        setTextInput('')
        return
      }
    } else if (autonomyLevel === 'high') {
      if (match.intent === 'confirm_no') {
        handleVeto(true)
        setTextInput('')
        return
      } else if (match.intent === 'confirm_yes') {
        handleVeto(false)
        setTextInput('')
        return
      }
    }

    // Handle unclear/question/off-topic intents
    if (match.intent === 'unclear' || match.intent === 'question' || match.intent === 'off_topic') {
      const clarificationMsg = getClarificationMessage(autonomyLevel, match.intent)
      setMessages(prev => [...prev, {
        id: `msg-clarification-${Date.now()}`,
        role: 'assistant',
        content: clarificationMsg,
        timestamp: new Date(),
      }])
      setClarificationAttempts(prev => prev + 1)
      setTextInput('')
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      handleTextInput(textInput)
    }
  }

  const renderDecisionInterface = () => {
    // Don't show decision interface if task is completed
    if (taskState === 'completed') {
      return null
    }

    if (autonomyLevel === 'low' && taskState === 'in_progress') {
      return (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Choose an option:</h3>
          <div className="space-y-3">
            {DECISION_OPTIONS[currentTaskType].map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="w-full text-left bg-white border-2 border-gray-300 hover:border-blue-500 hover:shadow-md rounded-lg p-4 min-h-[48px] transition-all duration-200"
              >
                <div className="text-xl font-semibold text-gray-900">{option.label}</div>
                <div className="text-lg text-gray-700 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (autonomyLevel === 'low' && taskState === 'awaiting_confirmation') {
      return (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Confirm your selection:
            </h3>
            <p className="text-xl text-gray-700 mb-6">
              {DECISION_OPTIONS[currentTaskType].find(opt => opt.id === selectedOption)?.description}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleConfirmation(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors shadow-md hover:shadow-lg"
              >
                Yes, Confirm
              </button>
              <button
                onClick={() => handleConfirmation(false)}
                className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (autonomyLevel === 'medium' && taskState === 'in_progress') {
      return (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Recommended Action
            </h3>
            <p className="text-xl text-gray-700 mb-6">
              {currentTaskType === 'bill' 
                ? 'Pay $150 now for your electric bill'
                : currentTaskType === 'savings'
                ? 'Transfer $500 to savings'
                : 'Rebalance now to target allocation'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleApproval(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors shadow-md hover:shadow-lg"
              >
                Approve
              </button>
              <button
                onClick={() => handleApproval(false)}
                className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (autonomyLevel === 'high' && taskState === 'in_progress') {
      return (
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Action Already Scheduled
            </h3>
            <p className="text-xl text-gray-700 mb-4">
              {currentTaskType === 'bill'
                ? 'Payment of $150 for your electric bill has been processed.'
                : currentTaskType === 'savings'
                ? 'Transfer of $500 to your emergency fund savings has been processed.'
                : 'Rebalancing of your retirement portfolio to target allocation has been processed.'}
            </p>
            <p className="text-lg text-gray-600 mb-6">
              {currentTaskType === 'bill'
                ? 'You can cancel this payment within 24 hours if you change your mind.'
                : currentTaskType === 'savings'
                ? 'You can cancel this transfer within 24 hours if you change your mind.'
                : 'You can cancel this rebalancing within 24 hours if you change your mind.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleVeto(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors shadow-md hover:shadow-lg"
              >
                Cancel This Action
              </button>
              <button
                onClick={() => handleVeto(false)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg text-xl min-h-[48px] transition-colors shadow-md hover:shadow-lg"
              >
                Keep It
              </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  // Show transition message overlay
  if (showTransitionMessage) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <p className="text-2xl text-gray-900 whitespace-pre-line">{transitionMessage}</p>
        </div>
      </div>
    )
  }

  // Don't render chat interface when showing survey
  if (showPostTaskSurvey && !studyComplete) {
    return (
      <PostTaskSurvey
        participantId={participantId}
        taskIndex={currentTaskIndex}
        autonomyLevel={autonomyLevel}
        explanationQuality={explanationQuality}
        onComplete={handlePostTaskSurveyComplete}
      />
    )
  }

  // Don't render chat interface when study is complete
  if (studyComplete) {
    return (
      <StudyComplete
        participantId={participantId}
        studyDataManager={studyDataManagerRef.current}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-300 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Financial Assistant</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={handleExportData}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg text-lg min-h-[48px] transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => {
            // Detect system/status messages (confirmations, completions, etc.)
            const isSystemMessage = message.content.startsWith('Please confirm:') ||
                                   message.content.startsWith('Thank you!') ||
                                   message.content.includes('I\'ve set up') ||
                                   message.content.includes('I\'ve processed') ||
                                   message.content.includes('I\'ve cancelled') ||
                                   (message.content.includes('Thank you') && message.content.length < 100)
            
            if (isSystemMessage && message.role === 'assistant') {
              // System/status messages - center aligned, gray background
              return (
                <div key={message.id} className="flex justify-center my-4">
                  <div className="bg-gray-100 rounded-lg p-4 max-w-2xl">
                    <p className="text-lg text-gray-700 italic text-center whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                </div>
              )
            }
            
            if (message.role === 'assistant') {
              // AI Assistant messages - left aligned, light blue background
              return (
                <div key={message.id} className="flex justify-start">
                  <div className="flex flex-col max-w-3xl">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-600">Assistant</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                      <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            } else {
              // User messages - right aligned, light green background
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="flex flex-col max-w-3xl items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-600">You</span>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                      <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Decision Interface */}
        {renderDecisionInterface()}
      </main>

      {/* Text Input Area - Hide when task completed */}
      {taskState !== 'completed' && (
        <footer className="bg-white border-t-2 border-gray-300 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleInputSubmit} className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your choice or click a button above..."
                className="flex-1 px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg min-h-[48px] transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </footer>
      )}

    </div>
  )
}

