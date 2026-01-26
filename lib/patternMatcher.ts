/**
 * Pattern matching system for user input interpretation
 * Uses fuzzy matching with Levenshtein distance for typo tolerance
 */

export type IntentType = 
  | 'option1' 
  | 'option2' 
  | 'option3' 
  | 'confirm_yes' 
  | 'confirm_no' 
  | 'unclear' 
  | 'question' 
  | 'off_topic'

export interface IntentMatch {
  intent: IntentType
  confidence: number // 0-1
  matchedPattern?: string
}

// Pattern definitions for each intent
const PATTERNS: Record<IntentType, string[]> = {
  option1: [
    '1', 'option 1', 'first', 'pay', 'pay now', 'pay bill', 
    'full amount', 'pay it', 'first option', 'option one',
    'one', 'pay now', 'pay today', 'pay full', 'pay all'
  ],
  option2: [
    '2', 'option 2', 'second', 'plan', 'payment plan', 
    'installments', 'split', 'second option', 'option two',
    'two', 'installment', 'payment plan', 'split payment', 'pay over time'
  ],
  option3: [
    '3', 'option 3', 'third', 'skip', 'wait', 'later', 
    'not now', 'third option', 'option three', 'three',
    'skip it', 'skip now', 'wait', 'not yet', 'maybe later'
  ],
  confirm_yes: [
    'yes', 'confirm', 'correct', 'right', 'yeah', 'yep', 
    'sure', 'ok', 'okay', 'y', 'sounds good', 'that works',
    'go ahead', 'proceed', 'do it', 'yes confirm', 'approve',
    'keep', 'keep it', 'keep scheduled', 'keep this', 'keep the action'
  ],
  confirm_no: [
    'no', 'back', 'cancel', 'wrong', 'nope', 'n', 
    'go back', 'change', 'not that', 'different', 'stop',
    'cancel it', 'cancel this', 'cancel the action', 'decline',
    'nevermind', 'never mind', 'don\'t', "don't", 'dont'
  ],
  unclear: [],
  question: [
    'what', 'how', 'why', 'when', 'where', 'which', 
    'should i', 'what should', 'help', 'explain', 'tell me'
  ],
  off_topic: []
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - (distance / maxLen)
}

/**
 * Check if input contains question words
 */
function isQuestion(input: string): boolean {
  const questionWords = PATTERNS.question
  const lowerInput = input.toLowerCase()
  return questionWords.some(word => lowerInput.includes(word))
}

/**
 * Check if input is off-topic (doesn't match any intent patterns)
 */
function isOffTopic(input: string, allMatches: IntentMatch[]): boolean {
  const hasLowConfidenceMatch = allMatches.some(m => 
    m.intent !== 'unclear' && m.confidence < 0.5
  )
  return hasLowConfidenceMatch && !isQuestion(input)
}

/**
 * Get valid intents for a given scenario
 */
function getValidIntentsForScenario(
  taskType: 'bill' | 'savings' | 'investment' | null,
  autonomyLevel: 'low' | 'medium' | 'high'
): IntentType[] {
  if (autonomyLevel === 'high') {
    // High autonomy: only confirm_yes and confirm_no are valid
    return ['confirm_yes', 'confirm_no']
  } else if (autonomyLevel === 'medium') {
    // Medium autonomy: only confirm_yes and confirm_no are valid
    return ['confirm_yes', 'confirm_no']
  } else {
    // Low autonomy: option1, option2, option3, confirm_yes, confirm_no
    return ['option1', 'option2', 'option3', 'confirm_yes', 'confirm_no']
  }
}

/**
 * Check if an intent is valid for the current scenario
 */
function isValidIntentForScenario(
  intent: IntentType,
  taskType: 'bill' | 'savings' | 'investment' | null,
  autonomyLevel: 'low' | 'medium' | 'high'
): boolean {
  const validIntents = getValidIntentsForScenario(taskType, autonomyLevel)
  return validIntents.includes(intent)
}

/**
 * Match user input to intent patterns (context-aware)
 */
export function matchIntent(
  input: string,
  taskType?: 'bill' | 'savings' | 'investment' | null,
  autonomyLevel?: 'low' | 'medium' | 'high'
): IntentMatch {
  const normalizedInput = input.trim().toLowerCase()
  
  if (!normalizedInput) {
    return { intent: 'unclear', confidence: 0 }
  }

  // Get valid intents for current scenario
  const validIntents = taskType && autonomyLevel 
    ? getValidIntentsForScenario(taskType, autonomyLevel)
    : ['option1', 'option2', 'option3', 'confirm_yes', 'confirm_no'] // Default to low autonomy

  // Check for exact matches first (highest confidence) - only for valid intents
  for (const [intent, patterns] of Object.entries(PATTERNS)) {
    if (intent === 'unclear' || intent === 'question' || intent === 'off_topic') continue
    if (taskType && autonomyLevel && !validIntents.includes(intent as IntentType)) continue
    
    for (const pattern of patterns) {
      if (normalizedInput === pattern.toLowerCase()) {
        return {
          intent: intent as IntentType,
          confidence: 1.0,
          matchedPattern: pattern
        }
      }
    }
  }

  // Check for substring matches - only for valid intents
  for (const [intent, patterns] of Object.entries(PATTERNS)) {
    if (intent === 'unclear' || intent === 'question' || intent === 'off_topic') continue
    if (taskType && autonomyLevel && !validIntents.includes(intent as IntentType)) continue
    
    for (const pattern of patterns) {
      if (normalizedInput.includes(pattern.toLowerCase()) || 
          pattern.toLowerCase().includes(normalizedInput)) {
        return {
          intent: intent as IntentType,
          confidence: 0.9,
          matchedPattern: pattern
        }
      }
    }
  }

  // Fuzzy matching with Levenshtein distance - only for valid intents
  const fuzzyMatches: IntentMatch[] = []
  const SIMILARITY_THRESHOLD = 0.7

  for (const [intent, patterns] of Object.entries(PATTERNS)) {
    if (intent === 'unclear' || intent === 'question' || intent === 'off_topic') continue
    if (taskType && autonomyLevel && !validIntents.includes(intent as IntentType)) continue
    
    for (const pattern of patterns) {
      const similarity = calculateSimilarity(normalizedInput, pattern)
      if (similarity >= SIMILARITY_THRESHOLD) {
        fuzzyMatches.push({
          intent: intent as IntentType,
          confidence: similarity,
          matchedPattern: pattern
        })
      }
    }
  }

  // Return best fuzzy match if above threshold
  if (fuzzyMatches.length > 0) {
    fuzzyMatches.sort((a, b) => b.confidence - a.confidence)
    return fuzzyMatches[0]
  }

  // Check for questions
  if (isQuestion(normalizedInput)) {
    return { intent: 'question', confidence: 0.8 }
  }

  // No match found - return unclear
  return { intent: 'unclear', confidence: 0 }
}

/**
 * Get clarification message based on context (scenario-specific)
 */
export function getClarificationMessage(
  autonomyLevel: 'low' | 'medium' | 'high',
  intent: IntentType,
  taskType?: 'bill' | 'savings' | 'investment' | null
): string {
  // High autonomy - only keep/cancel options
  if (autonomyLevel === 'high') {
    if (intent === 'question') {
      return "I'm here to help, but this decision is yours. You can:\n\n• Keep this action (it will proceed as planned)\n• Cancel this action (it will be cancelled)\n\nPlease select one of the options above."
    }
    return "I didn't understand that. Please select one of the options above:\n\n• Keep this action\n• Cancel this action"
  }

  // Medium autonomy - only approve/decline options
  if (autonomyLevel === 'medium') {
    if (intent === 'question') {
      return "I'm here to help, but this decision is yours. You can:\n\n• Approve this recommendation\n• Decline this recommendation\n\nPlease select one of the options above."
    }
    return "I didn't understand that. Please select one of the options above:\n\n• Approve this recommendation\n• Decline this recommendation"
  }

  // Low autonomy - task-specific options
  if (taskType === 'bill') {
    if (intent === 'question') {
      return "I'm here to provide information, but this decision is yours to make. Here are your options again:\n\n• Option 1: Pay $150 now\n• Option 2: Set up payment plan\n• Option 3: Skip for now\n\nYou can click a button above or type your choice."
    }
    return "I didn't understand that. Please select one of the options above:\n\n• Option 1: Pay $150 now\n• Option 2: Set up payment plan\n• Option 3: Skip for now\n\nYou can click a button above or type your choice."
  } else if (taskType === 'savings') {
    if (intent === 'question') {
      return "I'm here to provide information, but this decision is yours to make. Here are your options again:\n\n• Option 1: Transfer $500 to savings\n• Option 2: Transfer a different amount\n• Option 3: Skip for now\n\nYou can click a button above or type your choice."
    }
    return "I didn't understand that. Please select one of the options above:\n\n• Option 1: Transfer $500 to savings\n• Option 2: Transfer a different amount\n• Option 3: Skip for now\n\nYou can click a button above or type your choice."
  } else if (taskType === 'investment') {
    if (intent === 'question') {
      return "I'm here to provide information, but this decision is yours to make. Here are your options again:\n\n• Option 1: Rebalance now to target allocation\n• Option 2: Rebalance partially\n• Option 3: Keep current allocation\n\nYou can click a button above or type your choice."
    }
    return "I didn't understand that. Please select one of the options above:\n\n• Option 1: Rebalance now to target allocation\n• Option 2: Rebalance partially\n• Option 3: Keep current allocation\n\nYou can click a button above or type your choice."
  }

  // Default fallback
  return "I didn't understand that. Please select one of the options above, or type your choice more clearly."
}



