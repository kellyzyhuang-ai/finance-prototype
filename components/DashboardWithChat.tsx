'use client'

import { useState, useEffect, useRef } from 'react'
import FinancialDashboard, { FinancialData, TaskType } from './FinancialDashboard'
import ChatWidget from './ChatWidget'
import PaymentPlanDialog from './PaymentPlanDialog'
import CustomAmountDialog from './CustomAmountDialog'
import { ChatMessage, AutonomyLevel, ExplanationQuality, DecisionOption, TaskState } from '@/types'
import InteractionLogger from '@/lib/logger'
import { matchIntent, getClarificationMessage, IntentType } from '@/lib/patternMatcher'
import StudyComplete from './StudyComplete'
import StudyDataManager from '@/lib/studyData'
import TaskTransition from './TaskTransition'
import StartStudyTransition from './StartStudyTransition'

interface DashboardWithChatProps {
  participantId: string
  group: number
}

// Task type definitions
type TaskTypeInternal = 'bill' | 'savings' | 'investment'

interface TaskCondition {
  taskNumber: number
  taskType: TaskTypeInternal
  autonomy: AutonomyLevel
  explanation: ExplanationQuality
}

// Pre-scripted messages for Wizard-of-Oz
const SCRIPTED_MESSAGES: Record<TaskTypeInternal, Record<string, Record<string, string[]>>> = {
  bill: {
    low: {
      low: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "You could pay this bill now, set up a payment plan, or skip it for now. These are your options to consider.",
        "Which option would you like to choose?"
      ],
      high: [
        "I see you have an electric bill of $150 that's due tomorrow.",
        "Paying $150 now from your $2,430 checking balance avoids a $15 late fee that would be charged if unpaid by tomorrow. A payment plan splits the cost but may include a $5 setup fee. Skipping gives you flexibility but risks the late fee. Your choice based on your preference.",
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
        "The payment will be processed from your checking account today.",
        "You can cancel this payment within 24 hours if you change your mind. After that, you can still contact customer service to request a refund if needed."
      ]
    }
  },
  savings: {
    low: {
      low: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved. Your checking account has $2,430 available.",
        "You could transfer money to your savings account to work toward your goal. You have some money available in checking. There are different amounts you could transfer, or you could skip this month. These are your options to consider.",
        "Which option would you like to choose?"
      ],
      high: [
        "I notice your emergency fund goal is $10,000, but you currently have $6,500 saved. Your checking account has $2,430 available.",
        "You're $3,500 away from your $10,000 emergency fund goal. Transferring $500 from your $2,430 checking balance leaves you $1,930 for unexpected expenses while bringing your savings to $7,000. A smaller transfer keeps more cash on hand. Your choice based on your comfort level.",
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
        "Your emergency fund now has $7,000, and your checking account has $1,930 remaining.",
        "You can cancel this transfer within 24 hours if you change your mind. After that, you can still contact customer service to request a reversal if needed."
      ]
    }
  },
  investment: {
    low: {
      low: [
        "Your retirement portfolio of $180,000 is currently allocated:\n\nStocks (75% - $135,000):\n- VTI - Vanguard Total Stock Market ETF: $95,000\n- VXUS - Vanguard International Stock ETF: $40,000\n\nBonds (25% - $45,000):\n- BND - Vanguard Total Bond Market ETF: $45,000\n\nYour target allocation based on your moderate risk tolerance and 12-year timeline to retirement is 60% stocks / 40% bonds. You could rebalance your portfolio to match your target allocation, do a partial rebalance, or keep your current allocation. These are your options to consider.",
        "Which option would you like to choose?"
      ],
      high: [
        "Your retirement portfolio of $180,000 is currently allocated:\n\nStocks (75% - $135,000):\n- VTI - Vanguard Total Stock Market ETF: $95,000\n- VXUS - Vanguard International Stock ETF: $40,000\n\nBonds (25% - $45,000):\n- BND - Vanguard Total Bond Market ETF: $45,000\n\nYour target allocation based on your moderate risk tolerance and 12-year timeline to retirement is 60% stocks / 40% bonds. Your portfolio has drifted 15% from your target. Rebalancing now would sell approximately $27,000 of VTI and VXUS, then purchase $27,000 of BND to reach 60/40, reducing risk but potentially triggering capital gains taxes. A partial rebalance moves you halfway (67.5/32.5) with lower tax impact. Keeping current maintains higher stock exposure for potential growth but with more volatility. Your choice based on your risk tolerance.",
        "Which option would you like to choose?"
      ]
    },
    medium: {
      low: [
        "Your retirement portfolio of $180,000 is currently 75% stocks (VTI, VXUS) and 25% bonds (BND), but your target is 60% stocks / 40% bonds.",
        "I recommend rebalancing now to your target allocation.",
        "Would you like me to proceed with this rebalancing?"
      ],
      high: [
        "Your retirement portfolio of $180,000 is currently allocated:\n\nStocks (75% - $135,000):\n- VTI - Vanguard Total Stock Market ETF: $95,000\n- VXUS - Vanguard International Stock ETF: $40,000\n\nBonds (25% - $45,000):\n- BND - Vanguard Total Bond Market ETF: $45,000\n\nYour target allocation is 60% stocks / 40% bonds. I recommend rebalancing now to your target allocation. This will sell approximately $27,000 worth of VTI and VXUS and buy $27,000 worth of BND. This reduces your portfolio risk to match your target, which is important for managing risk as you approach retirement in 12 years.",
        "This recommendation is based on: (1) Your portfolio has drifted significantly from your target (15% difference), (2) Rebalancing helps manage risk, and (3) Your target allocation aligns with your retirement timeline and risk tolerance.",
        "Would you like me to proceed with this rebalancing?"
      ]
    },
    high: {
      low: [
        "I've rebalanced your retirement portfolio to your target allocation of 60% stocks and 40% bonds.",
        "The rebalancing has been executed: $27,000 in VTI and VXUS were sold and $27,000 in BND were purchased.",
        "You can cancel this rebalancing within 24 hours if you change your mind."
      ],
      high: [
        "I've analyzed your portfolio and rebalanced it to your target allocation of 60% stocks and 40% bonds.",
        "I made this decision because: (1) Your portfolio had drifted 15% from your target (75/25 vs 60/40), (2) Rebalancing helps manage risk as you approach retirement in 12 years, and (3) Your target allocation aligns with your risk tolerance and retirement timeline.",
        "The rebalancing has been executed: $27,000 in VTI and VXUS were sold and $27,000 in BND were purchased. Your portfolio is now worth $180,000 with the target 60/40 allocation:\n\nStocks (60% - $108,000):\n- VTI: $68,000\n- VXUS: $40,000\n\nBonds (40% - $72,000):\n- BND: $72,000",
        "You can cancel this rebalancing within 24 hours if you change your mind. After that, you can still contact customer service to request a reversal if needed."
      ]
    }
  }
}

// Decision options by task type
const DECISION_OPTIONS: Record<TaskTypeInternal, DecisionOption[]> = {
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
    { taskNumber: 5, taskType: 'bill', autonomy: 'high', explanation: 'low' },
    { taskNumber: 6, taskType: 'savings', autonomy: 'low', explanation: 'high' }
  ]
}

export default function DashboardWithChat({ participantId, group }: DashboardWithChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('low')
  const [explanationQuality, setExplanationQuality] = useState<ExplanationQuality>('low')
  const [currentTaskType, setCurrentTaskType] = useState<TaskType | null>(null)
  const [displayTaskType, setDisplayTaskType] = useState<TaskType | null>(null) // Task type to show in dashboard
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [decisionStartTime, setDecisionStartTime] = useState<number | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const loggerRef = useRef<InteractionLogger | null>(null)
  const [textInput, setTextInput] = useState('')
  const [clarificationAttempts, setClarificationAttempts] = useState(0)
  const [taskState, setTaskState] = useState<TaskState>('in_progress')
  const [finalDecision, setFinalDecision] = useState<string>('')
  const [taskStartTime, setTaskStartTime] = useState<number>(Date.now())
  const [capturedDecisionLatency, setCapturedDecisionLatency] = useState<number | null>(null) // For LOW autonomy: capture latency when option clicked
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [studyComplete, setStudyComplete] = useState(false)
  const studyDataManagerRef = useRef<StudyDataManager | null>(null)
  const [infoRequestCount, setInfoRequestCount] = useState(0)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1)
  const [financialData, setFinancialData] = useState<FinancialData>({
    checking: 2430.00,
    savings: 6500.00,
    investments: 180000.00,
    savingsGoal: 10000.00,
    upcomingBills: [
      { name: 'Electric Bill', amount: 150, dueDate: 'tomorrow', highlighted: false },
      { name: 'Internet', amount: 89, dueDate: 'in 5 days', highlighted: false },
    ],
    recentActivity: [],
  })
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [inputMethod, setInputMethod] = useState<'click' | 'typed'>('click')
  const [typedInput, setTypedInput] = useState('')
  const [showTransition, setShowTransition] = useState(false)
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [paymentPlanData, setPaymentPlanData] = useState<{
    billAmount: number
    billName: string
  } | null>(null)
  const [showCustomAmountDialog, setShowCustomAmountDialog] = useState(false)
  
  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [onboardingStarted, setOnboardingStarted] = useState(false)
  const [highlightElement, setHighlightElement] = useState<string | null>(null)
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false) // Start collapsed
  const [showStartStudyTransition, setShowStartStudyTransition] = useState(false)
  const [forceOpenModal, setForceOpenModal] = useState<'checking' | 'savings' | 'investments' | null>(null)

  // Manage pending states during onboarding (steps 5-7, which are indices 5-7 for pending demo)
  useEffect(() => {
    if (onboardingStep >= 5 && onboardingStep <= 7) {
      // Steps 5-7: Show pending states (indices 5-7 = steps 6-8 in 1-indexed)
      setFinancialData(prev => ({
        ...prev,
        pendingState: {
          checking: 1930.00, // $2,430 - $500 = $1,930
          savings: 7000.00,   // $6,500 + $500 = $7,000
          investments: undefined
        }
      }))
    } else {
      // All other steps: Clear pending states
      setFinancialData(prev => ({
        ...prev,
        pendingState: undefined
      }))
    }
  }, [onboardingStep])

  useEffect(() => {
    studyDataManagerRef.current = new StudyDataManager(participantId)
    loggerRef.current = new InteractionLogger(sessionId)
    
    // Disable smooth scroll during study
    document.documentElement.style.scrollBehavior = 'auto'
    
    // Start onboarding after 2 seconds - widget starts collapsed
    if (!onboardingStarted && !onboardingComplete) {
      const onboardingTimer = setTimeout(() => {
        playNotificationSound()
        setChatWidgetOpen(true) // Auto-open the widget
        setOnboardingStarted(true)
      }, 2000)
      
      return () => {
        clearTimeout(onboardingTimer)
        document.documentElement.style.scrollBehavior = ''
      }
    }
    
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [participantId, sessionId, onboardingStarted, onboardingComplete])

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (err) {
      console.log('Audio play failed:', err)
    }
  }

  const handleOnboardingNext = () => {
    console.log('handleOnboardingNext called, current step:', onboardingStep)
    // Onboarding has 14 steps (indices 0-13)
    // Step 13 is the final "Ready" step with special buttons
    if (onboardingStep < 13) {
      const nextStep = onboardingStep + 1
      console.log('Advancing from step', onboardingStep, 'to step', nextStep)
      setOnboardingStep(nextStep)
      // Pending states will be cleared automatically by the useEffect when step moves outside 5-7 range
    } else {
      // Onboarding complete - wait for "Yes, I'm Ready" button
      // This will be handled by the button click in ChatWidget
      console.log('Onboarding complete, waiting for start study button')
    }
  }
  
  const handleStartStudy = () => {
    // Show start study transition instead of immediately starting
    setShowStartStudyTransition(true)
  }
  
  const handleStartStudyTransitionComplete = () => {
    console.log('handleStartStudyTransitionComplete called')
    setShowStartStudyTransition(false)
    setOnboardingComplete(true)
    setHighlightElement(null)
    setForceOpenModal(null)
    // Start first task
    const taskSequence = COUNTERBALANCE_GROUPS[group] || COUNTERBALANCE_GROUPS[1]
    console.log('Task sequence:', taskSequence)
    if (taskSequence.length > 0) {
      console.log('Starting conversation with task:', taskSequence[0])
      startConversation(taskSequence[0])
    }
  }
  
  const handleOpenAccountModal = (type: 'checking' | 'savings' | 'investments') => {
    console.log('handleOpenAccountModal called with type:', type)
    setForceOpenModal(type)
    console.log('forceOpenModal set to:', type)
  }
  
  const handleCloseAccountModals = () => {
    console.log('handleCloseAccountModals called')
    setForceOpenModal(null)
  }

  const handleReviewTour = () => {
    setOnboardingStep(0)
  }

  const startConversation = (condition: TaskCondition) => {
    // Reset ALL scroll positions first
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Reset state
    setMessages([])
    setSelectedOption(null)
    setShowConfirmation(false)
    setTaskState('in_progress')
    setFinalDecision('')
    setClarificationAttempts(0)
    setTextInput('')
    setInfoRequestCount(0)
    setHasNewMessage(false)
    setInputMethod('click')
    setTypedInput('')
    setShowPaymentPlanDialog(false)
    setShowCustomAmountDialog(false)
    setPaymentPlanData(null)
    setCapturedDecisionLatency(null) // Reset captured latency for new task
    
    // Reset financial data to initial state for each new task
    // (Pending state will be set below if autonomy is high)
    setFinancialData({
      checking: 2430.00,
      savings: 6500.00,
      investments: 180000.00,
      savingsGoal: 10000.00,
      portfolioAllocation: {
        stocks: 75,
        bonds: 25
      },
      upcomingBills: [
        { name: 'Electric Bill', amount: 150, dueDate: 'tomorrow', highlighted: false, scheduled: false },
        { name: 'Internet', amount: 89, dueDate: 'in 5 days', highlighted: false, scheduled: false },
      ],
      recentActivity: [],
    })
    
    const taskStartTime = new Date().toISOString()
    const scriptedMessages = SCRIPTED_MESSAGES[condition.taskType][condition.autonomy][condition.explanation]
    const combinedContent = scriptedMessages.join('\n\n')
    
    const newMessages: ChatMessage[] = [{
      id: `msg-0`,
      role: 'assistant' as const,
      content: combinedContent,
      timestamp: new Date(),
    }]
    
    setMessages(newMessages)
    const startTime = Date.now()
    setDecisionStartTime(startTime)
    setTaskStartTime(startTime)
    setHasNewMessage(true)
    
    console.log('=== TASK START ===')
    console.log('Task number:', condition.taskNumber)
    console.log('Task type:', condition.taskType)
    console.log('Autonomy:', condition.autonomy)
    console.log('Start time (ms):', startTime)
    console.log('Timer started when AI message displayed')
    
    // Reset scroll tracking for new task
    // This will be handled by ChatWidget's taskJustLoadedRef
    
    setCurrentTaskType(condition.taskType)
    setDisplayTaskType(condition.taskType) // Update display task type when new task starts
    setAutonomyLevel(condition.autonomy)
    setExplanationQuality(condition.explanation)
    
    // Set pending state for HIGH autonomy tasks (AI has already scheduled action)
    if (condition.autonomy === 'high') {
      setFinancialData(prevData => {
        const updatedData = { ...prevData }
        
        if (condition.taskType === 'bill') {
          // Bill payment scheduled
          return {
            ...updatedData,
            pendingState: {
              checking: updatedData.checking - 150,
              billPayment: {
                billName: 'Electric Bill',
                amount: 150
              }
            },
            upcomingBills: updatedData.upcomingBills.map(bill => 
              bill.name === 'Electric Bill' 
                ? { ...bill, scheduled: true }
                : bill
            ),
            recentActivity: [{
              description: 'Electric Bill Payment - Scheduled for tomorrow',
              amount: 150,
              status: 'pending' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        } else if (condition.taskType === 'savings') {
          // Savings transfer scheduled
          return {
            ...updatedData,
            pendingState: {
              checking: updatedData.checking - 500,
              savings: updatedData.savings + 500
            },
            recentActivity: [{
              description: 'Transfer $500 to Savings - Scheduled for tomorrow',
              amount: 500,
              status: 'pending' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        } else if (condition.taskType === 'investment') {
          // Portfolio rebalancing scheduled
          return {
            ...updatedData,
            pendingState: {
              investments: {
                stocks: 60,
                bonds: 40
              }
            },
            recentActivity: [{
              description: 'Portfolio Rebalancing - Scheduled for tomorrow',
              status: 'pending' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        }
        
        return updatedData
      })
    }
    
    // Create new trial
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
    // Only start tasks if onboarding is complete
    if (!onboardingComplete) return
    
    const taskSequence = COUNTERBALANCE_GROUPS[group] || COUNTERBALANCE_GROUPS[1]
    
    if (currentTaskIndex < taskSequence.length) {
      const condition = taskSequence[currentTaskIndex]
      startConversation(condition)
    } else if (currentTaskIndex >= taskSequence.length) {
      setStudyComplete(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTaskIndex, group, onboardingComplete])

  const updateFinancialData = (updates: Partial<FinancialData>) => {
    if (financialData) {
      setFinancialData({ ...financialData, ...updates })
    }
  }

  const completeTask = (
    decision: string, 
    inputMethod: 'click' | 'typed', 
    typedInput: string = '',
    paymentPlanDetails?: { amount: number; payments: number; frequency: string },
    customTransferAmount?: number
  ) => {
    const taskDuration = Date.now() - taskStartTime
    const taskEndTime = new Date().toISOString()
    // For LOW autonomy, use captured latency (from when option was clicked)
    // For MEDIUM/HIGH autonomy, calculate from decisionStartTime (when approve/decline or keep/cancel was clicked)
    const decisionLatency = capturedDecisionLatency !== null 
      ? capturedDecisionLatency 
      : (decisionStartTime ? Date.now() - decisionStartTime : 0)
    
    console.log('=== TASK COMPLETE ===')
    console.log('Final decision:', decision)
    console.log('Decision latency (ms):', decisionLatency)
    console.log('Task duration (ms):', taskDuration)
    console.log('Latency logged to CSV as decisionLatencyMs')
    
    // Store current task type before state updates
    // displayTaskType will persist until next task starts (in startConversation)
    const taskTypeForUpdate = currentTaskType
    
    setFinalDecision(decision)
    setTaskState('completed')
    
    // Reset captured latency for next task
    setCapturedDecisionLatency(null)
    
    // Update trial entry
    if (studyDataManagerRef.current && currentTrialIndex >= 0) {
      studyDataManagerRef.current.updateTrialData(currentTrialIndex, {
        taskEndTime: taskEndTime,
        taskDurationMs: taskDuration,
        decisionLatencyMs: decisionLatency,
        finalDecision: decision,
        infoRequestCount: infoRequestCount,
        inputMethod: inputMethod,
        typedInput: typedInput,
        paymentPlanAmount: paymentPlanDetails?.amount || null,
        paymentPlanPayments: paymentPlanDetails?.payments || null,
        paymentPlanFrequency: paymentPlanDetails?.frequency || null,
        customTransferAmount: customTransferAmount || null,
      })
    }
    
    // Update financial data based on decision - create new object to avoid mutations
    // Use taskTypeForUpdate to ensure we use the correct task type even if state hasn't updated yet
    setFinancialData(prevData => {
      const updatedData = { ...prevData }
      
      if (taskTypeForUpdate === 'bill') {
        const currentBill = updatedData.upcomingBills.find(bill => bill.highlighted)
        const billAmount = currentBill?.amount || 150
        const billName = currentBill?.name || 'Electric Bill'
        
        if (decision.includes('Pay $150') || decision.includes('Pay $150 now') || decision.includes('Pay $89') || decision.includes('Pay $89 now')) {
          return {
            ...updatedData,
            checking: updatedData.checking - billAmount,
            recentActivity: [{
              description: `${billName} - Paid`,
              amount: billAmount,
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity],
            upcomingBills: updatedData.upcomingBills.filter(b => b.name !== billName)
          }
        } else if (decision.includes('payment plan') || decision.includes('Payment plan')) {
          // Payment plan - deduct first payment
          const firstPayment = paymentPlanDetails?.amount || (billAmount / 3)
          const remainingBalance = billAmount - firstPayment
          const remainingPayments = (paymentPlanDetails?.payments || 3) - 1
          
          return {
            ...updatedData,
            checking: updatedData.checking - firstPayment,
            recentActivity: [{
              description: `Payment plan started: $${firstPayment.toFixed(2)}/${paymentPlanDetails?.frequency || 'month'} for ${paymentPlanDetails?.payments || 3} payments`,
              amount: firstPayment,
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity],
            upcomingBills: updatedData.upcomingBills.map(bill => 
              bill.name === billName 
                ? { 
                    ...bill, 
                    amount: remainingBalance,
                    dueDate: `Payment plan (${remainingPayments} payments left)`,
                    highlighted: false
                  }
                : bill
            )
          }
        } else if (decision.includes('Skip') || decision.includes('Skip for now')) {
          return {
            ...updatedData,
            recentActivity: [{
              description: `${billName} - Skipped`,
              amount: billAmount,
              status: 'skipped' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        }
      } else if (taskTypeForUpdate === 'savings') {
        if (decision.includes('Transfer $500') || decision.includes('Transfer $500 to savings')) {
          return {
            ...updatedData,
            checking: updatedData.checking - 500,
            savings: updatedData.savings + 500,
            recentActivity: [{
              description: 'Transfer to Savings',
              amount: 500,
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        } else if (decision.includes('Transfer $') && customTransferAmount !== undefined) {
          // Custom transfer amount
          return {
            ...updatedData,
            checking: updatedData.checking - customTransferAmount,
            savings: updatedData.savings + customTransferAmount,
            recentActivity: [{
              description: `Transfer $${customTransferAmount.toFixed(2)} to Savings`,
              amount: customTransferAmount,
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        }
      } else if (taskTypeForUpdate === 'investment') {
        if (decision.includes('Rebalance now to target') || decision.includes('Rebalance now')) {
          // Full rebalance to 60/40
          return {
            ...updatedData,
            portfolioAllocation: {
              stocks: 60,
              bonds: 40
            },
            recentActivity: [{
              description: 'Portfolio Rebalanced to 60/40',
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        } else if (decision.includes('Partial rebalance')) {
          // Partial rebalance to 67.5/32.5
          return {
            ...updatedData,
            portfolioAllocation: {
              stocks: 67.5,
              bonds: 32.5
            },
            recentActivity: [{
              description: 'Portfolio Partially Rebalanced to 67.5/32.5',
              status: 'completed' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        } else if (decision.includes('Keep current') || decision.includes('Keep')) {
          // Keep current allocation (no change)
          return {
            ...updatedData,
            recentActivity: [{
              description: 'Portfolio Allocation - Kept Current',
              status: 'skipped' as const,
              timestamp: new Date().toISOString()
            }, ...updatedData.recentActivity]
          }
        }
      }
      
      // Return unchanged if no match
      return updatedData
    })
    
    // Show success message
    let successMessage = 'Your choice has been recorded.'
    if (decision.includes('Declined') || decision.includes('Skip') || decision.includes('Keep current')) {
      successMessage = 'Understood. No changes have been made.'
    } else if (decision.includes('Cancelled')) {
      successMessage = 'The scheduled action has been cancelled.'
    } else if (decision.includes('Kept scheduled')) {
      successMessage = 'The scheduled action will proceed as planned.'
    }
    
    setMessages(prev => [...prev, {
      id: `msg-success-${Date.now()}`,
      role: 'assistant',
      content: successMessage,
      timestamp: new Date(),
    }])
    setHasNewMessage(true)

    // Show transition overlay after 3 seconds, then countdown will handle advancing
    setTimeout(() => {
      setShowTransition(true)
    }, 3000) // Wait 3 seconds after task completion
  }

  const handleOptionClick = (optionId: string) => {
    if (autonomyLevel !== 'low' || taskState !== 'in_progress') return
    
    const option = DECISION_OPTIONS[currentTaskType as TaskTypeInternal]?.find(opt => opt.id === optionId)
    if (!option) return
    
    // CRITICAL: For LOW autonomy, timer STOPS when option is clicked (before confirmation)
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    setCapturedDecisionLatency(latency) // Capture latency at decision point
    
    console.log('=== DECISION MADE (LOW AUTONOMY) ===')
    console.log('Option:', option.label)
    console.log('Decision latency (ms):', latency)
    console.log('Time from task start to decision:', latency)
    
    loggerRef.current?.log({
      participantId,
      eventType: 'click',
      elementId: optionId,
      elementText: option.label,
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
      additionalData: { optionDescription: option.description }
    })
    
    // Check if this is a payment plan option for bill payment
    if (currentTaskType === 'bill' && option.description === 'Set up payment plan') {
      // Find the current bill amount
      const currentBill = financialData.upcomingBills.find(bill => bill.highlighted)
      const billAmount = currentBill?.amount || 150
      const billName = currentBill?.name || 'Electric Bill'
      
      // Add user message
      setMessages(prev => [...prev, {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: option.description,
        timestamp: new Date(),
      }])
      
      // Show payment plan dialog
      setPaymentPlanData({ billAmount, billName })
      setShowPaymentPlanDialog(true)
      setSelectedOption(optionId)
      setInputMethod('click')
      setHasNewMessage(true)
      
      // Add AI message with dialog
      setMessages(prev => [...prev, {
        id: `msg-payment-plan-${Date.now()}`,
        role: 'assistant',
        content: `Let's set up a payment plan for your $${billAmount} ${billName.toLowerCase()}.`,
        timestamp: new Date(),
      }])
      return
    }
    
    // Check if this is a custom amount option for savings transfer
    if (currentTaskType === 'savings' && option.description === 'Transfer a different amount') {
      // Add user message
      setMessages(prev => [...prev, {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        content: option.description,
        timestamp: new Date(),
      }])
      
      // Show custom amount dialog
      setShowCustomAmountDialog(true)
      setSelectedOption(optionId)
      setInputMethod('click')
      setHasNewMessage(true)
      
      // Add AI message with dialog
      setMessages(prev => [...prev, {
        id: `msg-custom-amount-${Date.now()}`,
        role: 'assistant',
        content: 'How much would you like to transfer to your savings?',
        timestamp: new Date(),
      }])
      return
    }
    
    // For other options, proceed with normal confirmation flow
    // Add user message first
    setMessages(prev => [...prev, {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: option.description,
      timestamp: new Date(),
    }])
    
    // Then add confirmation message
    setSelectedOption(optionId)
    setTaskState('awaiting_confirmation')
    setShowConfirmation(true)
    setInputMethod('click')
    
    setMessages(prev => [...prev, {
      id: `msg-confirm-${Date.now()}`,
      role: 'assistant',
      content: `Please confirm: ${option.description}`,
      timestamp: new Date(),
    }])
    setHasNewMessage(true)
  }

  const handleConfirmation = (confirmed: boolean) => {
    // For LOW autonomy, latency was already captured when option was clicked
    // This confirmation step does NOT add to decision latency
    const confirmationTime = Date.now()
    const latency = capturedDecisionLatency !== null 
      ? capturedDecisionLatency 
      : (decisionStartTime ? confirmationTime - decisionStartTime : 0)
    
    loggerRef.current?.log({
      participantId,
      eventType: confirmed ? 'confirmation' : 'click',
      elementId: confirmed ? 'confirm_yes' : 'confirm_no',
      elementText: confirmed ? 'Confirmed' : 'Cancelled',
      decisionLatency: latency, // Use captured latency, not confirmation time
      autonomyLevel,
      explanationQuality,
      additionalData: { selectedOption: selectedOption }
    })
    
    if (confirmed) {
      const decision = DECISION_OPTIONS[currentTaskType as TaskTypeInternal]?.find(opt => opt.id === selectedOption)?.description || ''
      completeTask(decision, inputMethod, typedInput)
    } else {
      setShowConfirmation(false)
      setSelectedOption(null)
      setTaskState('in_progress')
      setClarificationAttempts(0)
    }
  }

  const handlePaymentPlanConfirm = (paymentAmount: number, numPayments: number, frequency: string) => {
    // For LOW autonomy, use captured latency (from when payment plan option was clicked)
    // Dialog confirmation does NOT add to decision latency
    const latency = capturedDecisionLatency !== null 
      ? capturedDecisionLatency 
      : (decisionStartTime ? Date.now() - decisionStartTime : 0)
    
    loggerRef.current?.log({
      participantId,
      eventType: 'confirmation',
      elementId: 'payment_plan_confirm',
      elementText: 'Payment plan confirmed',
      decisionLatency: latency, // Use captured latency, not dialog confirmation time
      autonomyLevel,
      explanationQuality,
      additionalData: { paymentAmount, numPayments, frequency }
    })
    
    // Calculate next payment date
    const today = new Date()
    let nextPaymentDate: Date
    if (frequency === 'weekly') {
      nextPaymentDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else if (frequency === 'biweekly') {
      nextPaymentDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    } else {
      nextPaymentDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    }
    const nextPaymentDateStr = nextPaymentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    
    const remainingBalance = (paymentPlanData?.billAmount || 150) - paymentAmount
    const remainingPayments = numPayments - 1
    
    // Add confirmation message
    setMessages(prev => [...prev, {
      id: `msg-payment-plan-confirm-${Date.now()}`,
      role: 'assistant',
      content: `Payment plan confirmed! Your first payment of $${paymentAmount.toFixed(2)} has been processed.\n\nRemaining balance: $${remainingBalance.toFixed(2)} (${remainingPayments} payment${remainingPayments !== 1 ? 's' : ''} left)\nNext payment: ${nextPaymentDateStr}`,
      timestamp: new Date(),
    }])
    setHasNewMessage(true)
    
    // Close dialog
    setShowPaymentPlanDialog(false)
    
    // Complete task with payment plan details
    const decision = `Set up payment plan: $${paymentAmount.toFixed(2)}/${frequency} for ${numPayments} payments`
    completeTask(decision, inputMethod, typedInput, {
      amount: paymentAmount,
      payments: numPayments,
      frequency: frequency
    })
  }

  const handlePaymentPlanCancel = () => {
    setShowPaymentPlanDialog(false)
    setPaymentPlanData(null)
    setSelectedOption(null)
    setTaskState('in_progress')
    
    // Add cancellation message
    setMessages(prev => [...prev, {
      id: `msg-payment-plan-cancel-${Date.now()}`,
      role: 'assistant',
      content: 'Payment plan setup cancelled. Would you like to choose a different option?',
      timestamp: new Date(),
    }])
    setHasNewMessage(true)
  }

  const handleCustomAmountConfirm = (amount: number) => {
    // For LOW autonomy, use captured latency (from when custom amount option was clicked)
    // Dialog confirmation does NOT add to decision latency
    const latency = capturedDecisionLatency !== null 
      ? capturedDecisionLatency 
      : (decisionStartTime ? Date.now() - decisionStartTime : 0)
    
    loggerRef.current?.log({
      participantId,
      eventType: 'confirmation',
      elementId: 'custom_amount_confirm',
      elementText: 'Custom transfer amount confirmed',
      decisionLatency: latency, // Use captured latency, not dialog confirmation time
      autonomyLevel,
      explanationQuality,
      additionalData: { customAmount: amount }
    })
    
    const newSavings = financialData.savings + amount
    const newChecking = financialData.checking - amount
    
    // Add confirmation message
    setMessages(prev => [...prev, {
      id: `msg-custom-amount-confirm-${Date.now()}`,
      role: 'assistant',
      content: `Transfer confirmed! $${amount.toFixed(2)} has been moved to your emergency fund.\n\nYour savings balance is now $${newSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.\nYour checking balance is now $${newChecking.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      timestamp: new Date(),
    }])
    setHasNewMessage(true)
    
    // Close dialog
    setShowCustomAmountDialog(false)
    
    // Complete task with custom amount
    const decision = `Transfer $${amount.toFixed(2)} to savings`
    completeTask(decision, inputMethod, typedInput, undefined, amount)
  }

  const handleCustomAmountCancel = () => {
    setShowCustomAmountDialog(false)
    setSelectedOption(null)
    setTaskState('in_progress')
    
    // Add cancellation message
    setMessages(prev => [...prev, {
      id: `msg-custom-amount-cancel-${Date.now()}`,
      role: 'assistant',
      content: 'Transfer cancelled. Would you like to choose a different option?',
      timestamp: new Date(),
    }])
    setHasNewMessage(true)
  }

  const handleApproval = (approved: boolean) => {
    if (autonomyLevel !== 'medium' || taskState === 'completed') return
    
    // For MEDIUM autonomy, timer STOPS when approve/decline is clicked
    const endTime = Date.now()
    const latency = decisionStartTime ? endTime - decisionStartTime : 0
    
    console.log('=== DECISION MADE (MEDIUM AUTONOMY) ===')
    console.log('Action:', approved ? 'Approved' : 'Declined')
    console.log('Decision latency (ms):', latency)
    console.log('Time from task start to decision:', latency)
    
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
      completeTask(decision, inputMethod, typedInput)
    } else {
      const decision = currentTaskType === 'bill'
        ? 'Declined recommendation to pay bill'
        : currentTaskType === 'savings'
        ? 'Declined recommendation to transfer to savings'
        : 'Declined recommendation to rebalance portfolio'
      completeTask(decision, inputMethod, typedInput)
    }
  }

  const handleVeto = (vetoed: boolean) => {
    if (autonomyLevel !== 'high' || taskState === 'completed') return
    
    // For HIGH autonomy, timer STOPS when keep/cancel is clicked
    const endTime = Date.now()
    const latency = decisionStartTime ? endTime - decisionStartTime : 0
    
    console.log('=== DECISION MADE (HIGH AUTONOMY) ===')
    console.log('Action:', vetoed ? 'Vetoed (Cancel)' : 'Accepted (Keep)')
    console.log('Decision latency (ms):', latency)
    console.log('Time from task start to decision:', latency)
    
    loggerRef.current?.log({
      participantId,
      eventType: vetoed ? 'veto' : 'click',
      elementId: vetoed ? 'veto_yes' : 'veto_no',
      elementText: vetoed ? 'Vetoed' : 'Accepted',
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
    })
    
    if (vetoed) {
      // Cancel scheduled action - remove pending state
      setFinancialData(prevData => {
        const updatedData = { ...prevData }
        // Remove pending state
        delete updatedData.pendingState
        // Remove pending transaction from activity
        updatedData.recentActivity = updatedData.recentActivity.filter(
          a => a.status !== 'pending'
        )
        // Remove scheduled flag from bills
        updatedData.upcomingBills = updatedData.upcomingBills.map(bill => ({
          ...bill,
          scheduled: false
        }))
        return updatedData
      })
      
      const cancelledDecision = currentTaskType === 'bill'
        ? 'Cancelled scheduled payment'
        : currentTaskType === 'savings'
        ? 'Cancelled scheduled transfer'
        : 'Cancelled scheduled rebalancing'
      completeTask(cancelledDecision, inputMethod, typedInput)
    } else {
      // Keep scheduled action - apply pending state to actual values
      setFinancialData(prevData => {
        if (!prevData.pendingState) return prevData
        
        const updatedData = { ...prevData }
        
        // Apply pending changes
        if (updatedData.pendingState && updatedData.pendingState.checking !== undefined) {
          updatedData.checking = updatedData.pendingState.checking
        }
        if (updatedData.pendingState && updatedData.pendingState.savings !== undefined) {
          updatedData.savings = updatedData.pendingState.savings
        }
        if (updatedData.pendingState && updatedData.pendingState.investments !== undefined) {
          updatedData.portfolioAllocation = {
            stocks: updatedData.pendingState.investments.stocks,
            bonds: updatedData.pendingState.investments.bonds
          }
        }
        
        // Update pending transaction to completed
        updatedData.recentActivity = updatedData.recentActivity.map(activity => {
          if (activity.status === 'pending') {
            return {
              ...activity,
              status: 'completed' as const,
              description: activity.description.replace('Scheduled for tomorrow', 'Completed')
            }
          }
          return activity
        })
        
        // Remove scheduled flag and pending state
        updatedData.upcomingBills = updatedData.upcomingBills.map(bill => ({
          ...bill,
          scheduled: false
        }))
        delete updatedData.pendingState
        
        return updatedData
      })
      
      const keptDecision = currentTaskType === 'bill'
        ? 'Kept scheduled payment'
        : currentTaskType === 'savings'
        ? 'Kept scheduled transfer'
        : 'Kept scheduled rebalancing'
      completeTask(keptDecision, inputMethod, typedInput)
    }
  }

  const handleSendMessage = (message: string) => {
    setInputMethod('typed')
    setTypedInput(message)
    
    // Add user message
    setMessages(prev => [...prev, {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }])
    
    // Match intent with context awareness
    const match = matchIntent(message, currentTaskType, autonomyLevel)
    const latency = decisionStartTime ? Date.now() - decisionStartTime : 0
    
    // Validate that the matched intent is valid for current scenario
    const isValidIntent = match.intent === 'unclear' || 
                          match.intent === 'question' || 
                          match.intent === 'off_topic' ||
                          (autonomyLevel === 'low' && ['option1', 'option2', 'option3', 'confirm_yes', 'confirm_no'].includes(match.intent)) ||
                          (autonomyLevel === 'medium' && ['confirm_yes', 'confirm_no'].includes(match.intent)) ||
                          (autonomyLevel === 'high' && ['confirm_yes', 'confirm_no'].includes(match.intent))
    
    loggerRef.current?.log({
      participantId,
      eventType: 'text_input',
      elementId: 'text_input',
      elementText: message,
      decisionLatency: latency,
      autonomyLevel,
      explanationQuality,
      rawInput: message,
      interpretedIntent: match.intent,
      confidenceScore: match.confidence,
      clarificationNeeded: !isValidIntent || match.intent === 'unclear' || match.intent === 'question' || match.intent === 'off_topic',
      clarificationAttempts: clarificationAttempts,
    })
    
    // If intent is invalid for current scenario, treat as unclear
    if (!isValidIntent || match.intent === 'unclear' || match.intent === 'question' || match.intent === 'off_topic') {
      const clarificationMsg = getClarificationMessage(autonomyLevel, match.intent, currentTaskType)
      setMessages(prev => [...prev, {
        id: `msg-clarification-${Date.now()}`,
        role: 'assistant',
        content: clarificationMsg,
        timestamp: new Date(),
      }])
      setClarificationAttempts(prev => prev + 1)
      setInfoRequestCount(prev => prev + 1)
      setHasNewMessage(true)
      return
    }
    
    // Handle different intents - only process if valid for current scenario
    // Always process text input, even when buttons are shown
    if (autonomyLevel === 'low') {
      if (showConfirmation) {
        // Already in confirmation - handle confirm/cancel from text input
        if (match.intent === 'confirm_yes') {
          handleConfirmation(true)
          return
        } else if (match.intent === 'confirm_no') {
          handleConfirmation(false)
          return
        }
        // If in confirmation but input doesn't match, provide helpful message
        const clarificationMsg = "I didn't understand that. Please type 'yes' or 'confirm' to proceed, or 'no' or 'cancel' to go back. You can also click the buttons above."
        setMessages(prev => [...prev, {
          id: `msg-clarification-${Date.now()}`,
          role: 'assistant',
          content: clarificationMsg,
          timestamp: new Date(),
        }])
        setClarificationAttempts(prev => prev + 1)
        setInfoRequestCount(prev => prev + 1)
        setHasNewMessage(true)
        return
      } else if (taskState === 'in_progress') {
        // Not in confirmation yet - handle option selection
        if (match.intent === 'option1') {
          handleOptionClick('option1')
          return
        } else if (match.intent === 'option2') {
          handleOptionClick('option2')
          return
        } else if (match.intent === 'option3') {
          handleOptionClick('option3')
          return
        }
      }
    } else if (autonomyLevel === 'medium') {
      // Medium autonomy - always handle approve/decline from text input
      if (match.intent === 'confirm_yes') {
        handleApproval(true)
        return
      } else if (match.intent === 'confirm_no') {
        handleApproval(false)
        return
      }
      // If input doesn't match, provide helpful message
      const clarificationMsg = "I didn't understand that. Please type 'yes' or 'approve' to approve this recommendation, or 'no' or 'decline' to decline it. You can also click the buttons above."
      setMessages(prev => [...prev, {
        id: `msg-clarification-${Date.now()}`,
        role: 'assistant',
        content: clarificationMsg,
        timestamp: new Date(),
      }])
      setClarificationAttempts(prev => prev + 1)
      setInfoRequestCount(prev => prev + 1)
      setHasNewMessage(true)
      return
    } else if (autonomyLevel === 'high') {
      // High autonomy - always handle keep/cancel from text input
      if (match.intent === 'confirm_no') {
        handleVeto(true)
        return
      } else if (match.intent === 'confirm_yes') {
        handleVeto(false)
        return
      }
      // If input doesn't match, provide helpful message
      const clarificationMsg = "I didn't understand that. Please type 'keep' or 'keep it' to keep the scheduled action, or 'cancel' or 'cancel it' to cancel it. You can also click the buttons above."
      setMessages(prev => [...prev, {
        id: `msg-clarification-${Date.now()}`,
        role: 'assistant',
        content: clarificationMsg,
        timestamp: new Date(),
      }])
      setClarificationAttempts(prev => prev + 1)
      setInfoRequestCount(prev => prev + 1)
      setHasNewMessage(true)
      return
    }
    
    // If we get here, the intent was matched but not handled - treat as unclear
    const clarificationMsg = getClarificationMessage(autonomyLevel, 'unclear', currentTaskType)
    setMessages(prev => [...prev, {
      id: `msg-clarification-${Date.now()}`,
      role: 'assistant',
      content: clarificationMsg,
      timestamp: new Date(),
    }])
    setClarificationAttempts(prev => prev + 1)
    setInfoRequestCount(prev => prev + 1)
    setHasNewMessage(true)
  }

  if (studyComplete) {
    return (
      <StudyComplete
        participantId={participantId}
        studyDataManager={studyDataManagerRef.current}
      />
    )
  }

  const taskSequence = COUNTERBALANCE_GROUPS[group] || COUNTERBALANCE_GROUPS[1]
  const totalTasks = taskSequence.length

  const isOnboarding = !onboardingComplete && onboardingStarted
  
  return (
    <div className={`relative ${isOnboarding ? 'onboarding-mode' : ''}`} style={{ overflow: 'visible' }}>
      <FinancialDashboard
        participantId={participantId}
        group={group}
        currentTaskType={displayTaskType}
        financialData={financialData}
        autonomyLevel={autonomyLevel}
        highlightElement={highlightElement}
        forceOpenModal={forceOpenModal}
        onModalClose={handleCloseAccountModals}
        isOnboarding={isOnboarding}
      />
      
      {/* AI Assistant Widget - ALWAYS RENDERED - Critical for prototype functionality */}
      <ChatWidget
        participantId={participantId}
        messages={messages}
        onSendMessage={handleSendMessage}
        decisionOptions={currentTaskType ? DECISION_OPTIONS[currentTaskType as TaskTypeInternal] : []}
        autonomyLevel={autonomyLevel}
        taskState={taskState}
        selectedOption={selectedOption}
        onOptionClick={handleOptionClick}
        onConfirmation={handleConfirmation}
        onApproval={handleApproval}
        onVeto={handleVeto}
        showConfirmation={showConfirmation}
        currentTaskType={currentTaskType}
        hasNewMessage={hasNewMessage}
        onNewMessageRead={() => setHasNewMessage(false)}
        showPaymentPlanDialog={showPaymentPlanDialog}
        paymentPlanData={paymentPlanData}
        onPaymentPlanConfirm={handlePaymentPlanConfirm}
        onPaymentPlanCancel={handlePaymentPlanCancel}
        showCustomAmountDialog={showCustomAmountDialog}
        availableBalance={financialData.checking}
        onCustomAmountConfirm={handleCustomAmountConfirm}
        onCustomAmountCancel={handleCustomAmountCancel}
        onboardingStep={onboardingStep}
        onboardingComplete={onboardingComplete}
        onOnboardingNext={handleOnboardingNext}
        onReviewTour={handleReviewTour}
        highlightElement={highlightElement}
        setHighlightElement={setHighlightElement}
        chatWidgetOpen={chatWidgetOpen}
        setChatWidgetOpen={setChatWidgetOpen}
        onStartStudy={handleStartStudy}
        onboardingStarted={onboardingStarted}
        onOpenAccountModal={handleOpenAccountModal}
        onCloseAccountModals={handleCloseAccountModals}
      />
      
      {/* Start Study Transition */}
      {showStartStudyTransition && (
        <StartStudyTransition onComplete={handleStartStudyTransitionComplete} />
      )}
      
      {/* Onboarding Overlay */}
      {!onboardingComplete && highlightElement && (
        <div className="onboarding-overlay" />
      )}
      
      {/* Task Transition Overlay */}
      {showTransition && (
        <TaskTransition
          completedTaskNumber={currentTaskIndex + 1}
          nextTaskNumber={currentTaskIndex + 2}
          totalTasks={totalTasks}
          onStartNext={() => {
            setShowTransition(false)
            // Reset scroll positions before loading next task
            window.scrollTo({ top: 0, behavior: 'instant' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            
            if (currentTaskIndex < totalTasks - 1) {
              setCurrentTaskIndex(prev => prev + 1)
              // currentTaskType will be updated when startConversation runs for the next task
            } else {
              // Final task completed - advance to study complete screen
              setCurrentTaskIndex(prev => prev + 1)
            }
          }}
        />
      )}
    </div>
  )
}

