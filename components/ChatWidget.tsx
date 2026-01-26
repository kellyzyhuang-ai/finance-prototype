'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage, DecisionOption, AutonomyLevel, TaskState } from '@/types'
import { matchIntent } from '@/lib/patternMatcher'
import PaymentPlanDialog from './PaymentPlanDialog'
import CustomAmountDialog from './CustomAmountDialog'

interface ChatWidgetProps {
  participantId: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  decisionOptions?: DecisionOption[]
  autonomyLevel: AutonomyLevel
  taskState: TaskState
  selectedOption: string | null
  onOptionClick: (optionId: string) => void
  onConfirmation: (confirmed: boolean) => void
  onApproval: (approved: boolean) => void
  onVeto: (vetoed: boolean) => void
  showConfirmation: boolean
  currentTaskType: 'bill' | 'savings' | 'investment' | null
  hasNewMessage: boolean
  onNewMessageRead: () => void
  showPaymentPlanDialog?: boolean
  paymentPlanData?: { billAmount: number; billName: string } | null
  onPaymentPlanConfirm?: (paymentAmount: number, numPayments: number, frequency: string) => void
  onPaymentPlanCancel?: () => void
  showCustomAmountDialog?: boolean
  availableBalance?: number
  onCustomAmountConfirm?: (amount: number) => void
  onCustomAmountCancel?: () => void
  onboardingStep?: number
  onboardingComplete?: boolean
  onOnboardingNext?: () => void
  onReviewTour?: () => void
  highlightElement?: string | null
  setHighlightElement?: (element: string | null) => void
  chatWidgetOpen?: boolean
  setChatWidgetOpen?: (open: boolean) => void
  onStartStudy?: () => void
  onboardingStarted?: boolean
  onOpenAccountModal?: (type: 'checking' | 'savings' | 'investments') => void
  onCloseAccountModals?: () => void
}

// Onboarding messages (14 steps)
const ONBOARDING_MESSAGES = [
  {
    text: "Hi! I'm your AI financial assistant.\n\nBefore we begin the study, let me show you around the dashboard so you feel comfortable using it.\n\nWe'll take a quick tour together. Ready to start?",
    button: "Let's Go!",
    highlight: null,
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "Here at the top, you can see your three accounts:\n\n- Checking account - for everyday expenses\n- Savings account - working toward your emergency fund goal\n- Investments - your retirement portfolio\n\nThese show simulated balances for this study. All data is practice money, not real accounts.\n\nLet me show you what's inside each account.",
    button: "Show me",
    highlight: "account-cards",
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "This is your checking account.\n\nYou can see your recent transactions like payroll deposits, grocery purchases, and other expenses. This helps you track where your money is going.\n\nTake a look, then click Continue when you're ready.",
    button: "Continue",
    highlight: "checking-card",
    autoOpenModal: "checking",
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "Now let's look at your savings account.\n\nThis shows your progress toward your $10,000 emergency fund goal. You can see deposits and your current balance growing over time.",
    button: "Continue",
    highlight: "savings-card",
    autoOpenModal: "savings",
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "Finally, your investment portfolio.\n\nHere you can see your retirement holdings - specific stocks and bonds (ETFs like VTI, VXUS, BND). This shows how your $180,000 is allocated.",
    button: "Continue",
    highlight: "investments-card",
    autoOpenModal: "investments",
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "During some tasks, I might schedule actions for you that are pending.\n\nLet me show you what that looks like.",
    button: "Show me",
    highlight: null,
    autoOpenModal: null,
    showPendingState: true,
    showActionButtons: false
  },
  {
    text: "See the orange \"⏳ Pending\" badges?\n\nThis means I've scheduled an action that will happen soon. You'll see both the current amount and what it will become after the action processes.\n\nYou can always cancel or modify pending actions if you change your mind.",
    button: "Got it",
    highlight: null,
    autoOpenModal: null,
    showPendingState: true,
    showActionButtons: false
  },
  {
    text: "When something is pending, you'll see action buttons to manage it.\n\nLet me show you the buttons you'll use.",
    button: "Continue",
    highlight: null,
    autoOpenModal: null,
    showPendingState: true,
    showActionButtons: true
  },
  {
    text: "The green \"Keep It\" button means you're okay with my decision.\n\nThe red \"Cancel\" button lets you stop the action if you don't want it to happen.\n\nYou'll see different button options depending on the situation.",
    button: "Understood",
    highlight: null,
    autoOpenModal: null,
    showPendingState: true,
    showActionButtons: true
  },
  {
    text: "Great! Now let's look at this main area.\n\nThis is where charts and graphs will appear during the study. The information shown here will change based on which financial task we're working on together.\n\nRight now it's empty, but you'll see helpful visualizations when we begin the tasks.",
    button: "Continue",
    highlight: "chart-area",
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "Over here on the right, you can see upcoming bills and recent activity.\n\nThis helps you keep track of what needs attention.",
    button: "Continue",
    highlight: "sidebar",
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "During the study, I'll present financial decisions for you to make.\n\nYou can respond by:\n- Clicking the option buttons I show you, OR\n- Typing your choice in the message box\n\nEither way works perfectly!",
    button: "Understood",
    highlight: null,
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "If the text is too small or too large, you can adjust it!\n\nSee the A- and A+ buttons at the top of this chat? Click those anytime to change the text size.",
    button: "Thanks, good to know",
    highlight: "font-controls",
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  },
  {
    text: "Perfect! You're all set to begin.\n\nYou'll complete 6 financial decision tasks. After each task, you'll fill out a short digital survey before continuing.\n\nTake your time with each decision - there are no wrong answers.\n\nAre you ready to start the study?",
    buttons: ["Yes, I'm Ready", "Review the Tour Again"],
    highlight: null,
    autoOpenModal: null,
    showPendingState: false,
    showActionButtons: false
  }
]

export default function ChatWidget({
  participantId,
  messages,
  onSendMessage,
  decisionOptions = [],
  autonomyLevel,
  taskState,
  selectedOption,
  onOptionClick,
  onConfirmation,
  onApproval,
  onVeto,
  showConfirmation,
  currentTaskType,
  hasNewMessage,
  onNewMessageRead,
  showPaymentPlanDialog = false,
  paymentPlanData = null,
  onPaymentPlanConfirm,
  onPaymentPlanCancel,
  showCustomAmountDialog = false,
  availableBalance = 0,
  onCustomAmountConfirm,
  onCustomAmountCancel,
  onboardingStep = -1,
  onboardingComplete = true,
  onOnboardingNext,
  onReviewTour,
  highlightElement,
  setHighlightElement,
  chatWidgetOpen = false,
  setChatWidgetOpen,
  onStartStudy,
  onboardingStarted = false,
  onOpenAccountModal,
  onCloseAccountModals,
}: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false) // Start collapsed
  const [textInput, setTextInput] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastMessageCountRef = useRef(0)
  const taskJustLoadedRef = useRef(false)
  const lastTaskStateRef = useRef<TaskState>('in_progress')
  const lastMessagesLengthRef = useRef(0)
  
  // Handle onboarding mode - only true when onboarding has actually started
  const isOnboarding = !onboardingComplete && onboardingStep >= 0 && onboardingStarted

  // Track when a new task just loaded (for scroll to top)
  useEffect(() => {
    if (isOnboarding) return // Skip during onboarding
    
    // Detect new task: messages went from 0 to 1 (new task loaded)
    const messagesWentFromZeroToOne = lastMessagesLengthRef.current === 0 && messages.length === 1
    // OR taskState changed from completed to in_progress (transitioning between tasks)
    const taskStateChanged = lastTaskStateRef.current !== taskState
    const isNewTaskTransition = taskStateChanged && taskState === 'in_progress' && lastTaskStateRef.current === 'completed'
    
    if (messagesWentFromZeroToOne || isNewTaskTransition) {
      // New task just loaded - scroll chat to top ONCE
      console.log('New task detected - scrolling to top')
      taskJustLoadedRef.current = true
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0
      }
      // Also scroll window to top
      window.scrollTo({ top: 0, behavior: 'instant' })
      
      // After 1 second, allow normal scroll behavior
      setTimeout(() => {
        taskJustLoadedRef.current = false
      }, 1000)
    }
    
    lastTaskStateRef.current = taskState
    lastMessagesLengthRef.current = messages.length
  }, [taskState, messages.length, isOnboarding])

  // Auto-expand when chat widget should open (after 2 second delay)
  useEffect(() => {
    if (chatWidgetOpen && !isExpanded) {
      setIsExpanded(true)
      // Scroll to top when widget first opens during onboarding
      setTimeout(() => {
        if (messagesContainerRef.current && isOnboarding) {
          messagesContainerRef.current.scrollTop = 0
        }
      }, 100)
    }
  }, [chatWidgetOpen, isExpanded, isOnboarding])
  
  // Update highlight element and auto-open modals when onboarding step changes
  useEffect(() => {
    if (isOnboarding && onboardingStep >= 0 && onboardingStep < ONBOARDING_MESSAGES.length) {
      const currentMessage = ONBOARDING_MESSAGES[onboardingStep]
      console.log('Onboarding step changed:', onboardingStep, 'autoOpenModal:', currentMessage.autoOpenModal)
      
      // Auto-open/close modals based on step
      if (currentMessage.autoOpenModal) {
        console.log('Step requires modal:', currentMessage.autoOpenModal)
        // Remove highlight immediately to prevent flashing
        if (setHighlightElement) {
          setHighlightElement(null)
        }
        // Close all modals first (instant)
        if (onCloseAccountModals) {
          console.log('Closing all modals first')
          onCloseAccountModals()
        }
        // Open modal INSTANTLY - no delays
        if (onOpenAccountModal && currentMessage.autoOpenModal) {
          console.log('Opening modal:', currentMessage.autoOpenModal)
          // Open modal without highlight (highlight would cover modal) - INSTANT
          onOpenAccountModal(currentMessage.autoOpenModal as 'checking' | 'savings' | 'investments')
        }
      } else {
        // Set highlight for non-modal steps
        // For steps 5-6 (indices), highlight account cards to show pending states
        if (onboardingStep === 5 || onboardingStep === 6) {
          if (setHighlightElement) {
            setHighlightElement('account-cards')
          }
        } else {
          if (setHighlightElement) {
            setHighlightElement(currentMessage.highlight)
          }
        }
        // Close all modals when moving to non-modal steps
        if (onCloseAccountModals) {
          onCloseAccountModals()
        }
      }
    }
  }, [onboardingStep, isOnboarding, setHighlightElement, onOpenAccountModal, onCloseAccountModals])

  // Auto-expand when new message arrives (only if not onboarding)
  useEffect(() => {
    if (!isOnboarding && hasNewMessage && !isExpanded) {
      setIsExpanded(true)
      onNewMessageRead()
    }
  }, [hasNewMessage, isExpanded, onNewMessageRead, isOnboarding])

  // Auto-expand when task starts (with slight delay) - only if not onboarding
  useEffect(() => {
    if (!isOnboarding && taskState === 'in_progress' && messages.length > 0) {
      const timer = setTimeout(() => {
        setIsExpanded(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [taskState, messages.length, isOnboarding])

  // Scroll behavior: top for onboarding and new tasks, bottom for ongoing conversation
  useEffect(() => {
    if (isOnboarding) {
      // For onboarding, always scroll to top
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0
      }
    } else if (messages.length > 0 && !taskJustLoadedRef.current) {
      // Only auto-scroll during ongoing conversation (not when task just loaded)
      const messageCountChanged = messages.length !== lastMessageCountRef.current
      
      if (messageCountChanged) {
        // For ongoing conversation, always scroll to bottom for new messages (user or AI)
        // This lets user see their message and AI's response
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }, 100)
        
        lastMessageCountRef.current = messages.length
      }
    }
  }, [messages, isOnboarding, onboardingStep])
  
  // Scroll to bottom only when user sends a message (for button clicks)
  const handleUserMessageSent = () => {
    // Only scroll down for user's own messages
    setTimeout(() => {
      if (messagesContainerRef.current && !isOnboarding) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      onSendMessage(textInput.trim())
      setTextInput('')
    }
  }

  const handleOptionSelect = (optionId: string) => {
    if (autonomyLevel === 'low' && taskState === 'in_progress') {
      // Only call onOptionClick - it will handle adding the user message and confirmation
      // Don't call onSendMessage here to avoid duplicate confirmation
      onOptionClick(optionId)
    }
  }

  const handleTextInput = (input: string) => {
    if (!input.trim() || taskState === 'completed') return

    // Match intent with context awareness
    const match = matchIntent(input.trim(), currentTaskType, autonomyLevel)
    
    // Validate that the matched intent is valid for current scenario
    const isValidIntent = match.intent === 'unclear' || 
                          match.intent === 'question' || 
                          match.intent === 'off_topic' ||
                          (autonomyLevel === 'low' && ['option1', 'option2', 'option3', 'confirm_yes', 'confirm_no'].includes(match.intent)) ||
                          (autonomyLevel === 'medium' && ['confirm_yes', 'confirm_no'].includes(match.intent)) ||
                          (autonomyLevel === 'high' && ['confirm_yes', 'confirm_no'].includes(match.intent))
    
    // If intent is invalid, pass to parent to handle clarification
    if (!isValidIntent) {
      onSendMessage(input.trim())
      return
    }

    // Handle different intents based on autonomy level - always process text input
    if (autonomyLevel === 'low') {
      if (match.intent === 'option1') {
        handleOptionSelect('option1')
        return
      } else if (match.intent === 'option2') {
        handleOptionSelect('option2')
        return
      } else if (match.intent === 'option3') {
        handleOptionSelect('option3')
        return
      } else if (showConfirmation) {
        // In confirmation state - handle yes/no from text input
        if (match.intent === 'confirm_yes') {
          onConfirmation(true)
          return
        } else if (match.intent === 'confirm_no') {
          onConfirmation(false)
          return
        }
        // If in confirmation but input doesn't match, pass to parent for clarification
        onSendMessage(input.trim())
        return
      }
    } else if (autonomyLevel === 'medium') {
      // Medium autonomy - always handle approve/decline from text input
      if (match.intent === 'confirm_yes') {
        onApproval(true)
        return
      } else if (match.intent === 'confirm_no') {
        onApproval(false)
        return
      }
      // If input doesn't match, pass to parent for clarification
      onSendMessage(input.trim())
      return
    } else if (autonomyLevel === 'high') {
      // High autonomy - always handle keep/cancel from text input
      if (match.intent === 'confirm_no') {
        onVeto(true)
        return
      } else if (match.intent === 'confirm_yes') {
        onVeto(false)
        return
      }
      // If input doesn't match, pass to parent for clarification
      onSendMessage(input.trim())
      return
    }

    // Default: send as regular message (will handle unclear/question/off_topic)
    onSendMessage(input.trim())
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      handleTextInput(textInput.trim())
      setTextInput('')
      // Scroll to bottom for user's own message
      handleUserMessageSent()
    }
  }

  // Collapsed state - show minimized widget (ALWAYS RENDERED)
  if (!isExpanded) {
    return (
      <div 
        className={`ai-assistant-widget minimized ${
          isOnboarding ? 'onboarding-active' : ''
        }`}
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1002,
          display: 'block',
          visibility: 'visible'
        }}
      >
        <button
          onClick={() => {
            setIsExpanded(true)
            if (setChatWidgetOpen) setChatWidgetOpen(true)
          }}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="Open AI Assistant"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </div>
    )
  }

  // Expanded state (ALWAYS RENDERED)
  return (
    <div 
      className={`ai-assistant-widget open ${
        isOnboarding ? 'onboarding-active' : ''
      }`}
      style={{ 
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '400px',
        height: '550px',
        zIndex: 1002,
        display: 'block',
        visibility: 'visible',
        '--chat-font-size': `${fontSize}px`
      } as React.CSSProperties}
    >
      <div className="w-full h-full bg-white rounded-lg shadow-2xl border-2 border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <div className="flex items-center gap-2">
          {/* Font Size Controls */}
          <div 
            id="font-controls"
            className={`flex gap-1 ${
              highlightElement === 'font-controls' ? 'onboarding-highlight' : ''
            }`}
          >
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white px-2 py-1 rounded text-xs transition-colors"
              title="Decrease font size"
              aria-label="Decrease font size"
            >
              A−

            </button>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none text-white px-2 py-1 rounded text-xs transition-colors"
              title="Increase font size"
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
          {!isOnboarding && (
          <button
              onClick={() => {
                setIsExpanded(false)
                if (setChatWidgetOpen) setChatWidgetOpen(false)
              }}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Minimize chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
      >
        {/* Onboarding Messages */}
        {isOnboarding && onboardingStep >= 0 && onboardingStep < ONBOARDING_MESSAGES.length && (
          <div className="flex justify-start">
            <div className="flex flex-col max-w-[85%]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                <p 
                  className="text-gray-900 leading-relaxed whitespace-pre-line"
                  style={{ fontSize: 'var(--chat-font-size, 16px)' }}
                >
                  {ONBOARDING_MESSAGES[onboardingStep].text}
                </p>
              </div>
              
              {/* Demo Action Buttons for steps 8-9 */}
              {ONBOARDING_MESSAGES[onboardingStep].showActionButtons && (
                <div className="mt-3 action-buttons-demo">
                  <div className="action-label">Action Already Scheduled</div>
                  <button className="action-button keep" disabled>
                    Keep It
                  </button>
                  <button className="action-button cancel" disabled>
                    Cancel This Action
                  </button>
                </div>
              )}
              
              {/* Onboarding buttons */}
              <div className="mt-3 space-y-2">
                {ONBOARDING_MESSAGES[onboardingStep].buttons ? (
                  ONBOARDING_MESSAGES[onboardingStep].buttons!.map((buttonText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (buttonText === "Yes, I'm Ready" && onStartStudy) {
                          onStartStudy()
                        } else if (buttonText === "Review the Tour Again" && onReviewTour) {
                          onReviewTour()
                        }
                      }}
                      className={`w-full text-left bg-white border-2 rounded-lg p-3 min-h-[48px] transition-all duration-200 ${
                        buttonText === "Yes, I'm Ready"
                          ? 'border-green-500 hover:border-green-600 hover:bg-green-50'
                          : 'border-gray-300 hover:border-blue-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{buttonText}</div>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => {
                      console.log('Onboarding button clicked:', ONBOARDING_MESSAGES[onboardingStep].button, 'Step:', onboardingStep)
                      // Normal button - just advance
                      if (onOnboardingNext) {
                        onOnboardingNext()
                      }
                    }}
                    className="w-full text-left bg-white border-2 border-gray-300 hover:border-blue-400 hover:shadow-sm rounded-lg p-3 min-h-[48px] transition-all duration-200 onboarding-button"
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {ONBOARDING_MESSAGES[onboardingStep].button}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Regular Messages - only show if not onboarding */}
        {!isOnboarding && messages.map((message) => {
          if (message.role === 'assistant') {
            return (
              <div key={message.id} className="flex justify-start">
                <div className="flex flex-col max-w-[85%]">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <p 
                      className="text-gray-900 leading-relaxed whitespace-pre-line"
                      style={{ fontSize: 'var(--chat-font-size, 16px)' }}
                    >
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Payment Plan Dialog - show when payment plan is selected */}
                  {showPaymentPlanDialog && 
                   paymentPlanData && 
                   onPaymentPlanConfirm && 
                   onPaymentPlanCancel &&
                   (message.content.includes('payment plan') || message.content.includes('Payment plan')) && (
                    <div className="mt-3">
                      <PaymentPlanDialog
                        billAmount={paymentPlanData.billAmount}
                        billName={paymentPlanData.billName}
                        onConfirm={onPaymentPlanConfirm}
                        onCancel={onPaymentPlanCancel}
                      />
                    </div>
                  )}
                  
                  {/* Custom Amount Dialog - show when custom transfer amount is selected */}
                  {showCustomAmountDialog && 
                   onCustomAmountConfirm && 
                   onCustomAmountCancel &&
                   (message.content.includes('How much') || message.content.includes('transfer')) && (
                    <div className="mt-3">
                      <CustomAmountDialog
                        availableBalance={availableBalance}
                        onConfirm={onCustomAmountConfirm}
                        onCancel={onCustomAmountCancel}
                      />
                    </div>
                  )}
                  
                  {/* Inline Options - only show for low autonomy, in progress, NO confirmation yet, and first message */}
                  {autonomyLevel === 'low' && 
                   taskState === 'in_progress' && 
                   !showConfirmation &&
                   !selectedOption &&
                   decisionOptions.length > 0 &&
                   message.id === messages[0]?.id && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Select an option:</p>
                      {decisionOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(option.id)}
                          className={`w-full text-left bg-white border-2 rounded-lg p-3 min-h-[48px] transition-all duration-200 ${
                            selectedOption === option.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-300 hover:border-blue-400 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedOption === option.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-400'
                            }`}>
                              {selectedOption === option.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-700">{option.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Confirmation buttons for low autonomy - ONLY show in confirmation message */}
                  {autonomyLevel === 'low' && 
                   showConfirmation && 
                   taskState === 'awaiting_confirmation' &&
                   message.content.startsWith('Please confirm:') && (
                    <div className="mt-3 space-y-2">
                      <div className="space-y-2">
                        <button
                          onClick={() => onConfirmation(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Yes, Confirm
                        </button>
                        <button
                          onClick={() => onConfirmation(false)}
                          className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approval buttons for medium autonomy */}
                  {autonomyLevel === 'medium' && taskState === 'in_progress' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Recommended Action</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => onApproval(true)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onApproval(false)}
                          className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Veto buttons for high autonomy */}
                  {autonomyLevel === 'high' && taskState === 'in_progress' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Action Already Scheduled</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => onVeto(true)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Cancel This Action
                        </button>
                        <button
                          onClick={() => onVeto(false)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm min-h-[48px] transition-colors"
                        >
                          Keep It
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          } else {
            // User messages
            return (
              <div key={message.id} className="flex justify-end">
                <div className="flex flex-col max-w-[85%] items-end">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-sm">
                    <p 
                      className="text-gray-900 leading-relaxed whitespace-pre-line"
                      style={{ fontSize: 'var(--chat-font-size, 16px)' }}
                    >
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

      {/* Input Area - hide during onboarding */}
      {!isOnboarding && taskState !== 'completed' && (
        <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
          <form onSubmit={handleInputSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm min-h-[48px] transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}

