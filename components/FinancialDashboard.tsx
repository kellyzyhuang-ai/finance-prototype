'use client'

import React, { useState, useMemo, useEffect } from 'react'
import AccountModal from './AccountModal'
import InvestmentPortfolioModal from './InvestmentPortfolioModal'

export type TaskType = 'bill' | 'savings' | 'investment'

export interface FinancialData {
  checking: number
  savings: number
  investments: number
  savingsGoal: number
  portfolioAllocation?: {
    stocks: number // Percentage of stocks
    bonds: number // Percentage of bonds
  } // Current portfolio allocation
  pendingState?: {
    checking?: number // Pending checking balance
    savings?: number // Pending savings balance
    investments?: {
      stocks: number
      bonds: number
    } // Pending portfolio allocation
    billPayment?: {
      billName: string
      amount: number
    } // Pending bill payment
  }
  upcomingBills: Array<{
    name: string
    amount: number
    dueDate: string
    highlighted?: boolean
    scheduled?: boolean // If payment is scheduled
  }>
  recentActivity: Array<{
    description: string
    amount?: number
    status: 'pending' | 'completed' | 'skipped'
    timestamp: string
  }>
}

interface FinancialDashboardProps {
  participantId: string
  group: number
  currentTaskType: TaskType | null
  financialData?: FinancialData
  autonomyLevel?: 'low' | 'medium' | 'high'
  highlightElement?: string | null
  forceOpenModal?: 'checking' | 'savings' | 'investments' | null
  onModalClose?: () => void
  isOnboarding?: boolean
}

const INITIAL_DATA: FinancialData = {
  checking: 2430.00,
  savings: 6500.00,
  investments: 180000.00,
  savingsGoal: 10000.00,
  portfolioAllocation: {
    stocks: 75,
    bonds: 25
  },
  upcomingBills: [
    { name: 'Electric Bill', amount: 150, dueDate: 'tomorrow', highlighted: false },
    { name: 'Internet', amount: 89, dueDate: 'in 5 days', highlighted: false },
  ],
  recentActivity: [],
}

export default function FinancialDashboard({ 
  participantId, 
  group, 
  currentTaskType,
  financialData: externalData,
  autonomyLevel,
  highlightElement,
  forceOpenModal,
  onModalClose,
  isOnboarding = false
}: FinancialDashboardProps) {
  // Use external data directly, or fall back to initial data
  const data = externalData || INITIAL_DATA
  const [showCheckingModal, setShowCheckingModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [showInvestmentModal, setShowInvestmentModal] = useState(false)
  
  // Handle forced modal opening (for onboarding) - INSTANT, no delays
  // Only allow forceOpenModal to control modals during onboarding
  useEffect(() => {
    if (!isOnboarding) {
      // During normal operation, don't let forceOpenModal interfere
      return
    }
    
    console.log('forceOpenModal changed:', forceOpenModal, 'isOnboarding:', isOnboarding)
    if (forceOpenModal === 'checking') {
      console.log('Opening checking modal - INSTANT')
      // Instant state update - no delays
      setShowCheckingModal(true)
      setShowSavingsModal(false)
      setShowInvestmentModal(false)
    } else if (forceOpenModal === 'savings') {
      console.log('Opening savings modal - INSTANT')
      setShowCheckingModal(false)
      setShowSavingsModal(true)
      setShowInvestmentModal(false)
    } else if (forceOpenModal === 'investments') {
      console.log('Opening investments modal - INSTANT')
      setShowCheckingModal(false)
      setShowSavingsModal(false)
      setShowInvestmentModal(true)
    } else if (forceOpenModal === null) {
      // Close all modals - INSTANT
      console.log('Closing all modals - INSTANT')
      setShowCheckingModal(false)
      setShowSavingsModal(false)
      setShowInvestmentModal(false)
    }
  }, [forceOpenModal, isOnboarding])
  
  const handleModalClose = (type: 'checking' | 'savings' | 'investments') => {
    if (type === 'checking') {
      setShowCheckingModal(false)
    } else if (type === 'savings') {
      setShowSavingsModal(false)
    } else if (type === 'investments') {
      setShowInvestmentModal(false)
    }
    if (onModalClose) {
      onModalClose()
    }
  }

  // Generate transaction history from recent activity
  const checkingTransactions = useMemo(() => {
    const transactions: Array<{ description: string; amount: number; type: 'credit' | 'debit'; date: string }> = [
      { description: 'Direct Deposit - Payroll', amount: 2800, type: 'credit', date: 'Nov 15' },
      { description: 'Grocery Store', amount: 127.43, type: 'debit', date: 'Nov 14' },
      { description: 'Gas Station', amount: 45.00, type: 'debit', date: 'Nov 13' },
      { description: 'Restaurant', amount: 62.50, type: 'debit', date: 'Nov 12' },
    ]

    // Add transactions from recent activity
    data.recentActivity.forEach(activity => {
      if (activity.amount && activity.status === 'completed') {
        const isDebit = activity.description.includes('Bill') || 
                       activity.description.includes('Transfer') ||
                       activity.description.includes('Payment')
        const date = new Date(activity.timestamp)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        transactions.unshift({
          description: activity.description,
          amount: activity.amount,
          type: isDebit ? 'debit' : 'credit',
          date: dateStr
        })
      }
    })

    return transactions
  }, [data.recentActivity])

  const savingsTransactions = useMemo(() => {
    const transactions: Array<{ description: string; amount: number; type: 'credit' | 'debit'; date: string }> = [
      { description: 'Initial Deposit', amount: 5000, type: 'credit', date: 'Jul 1' },
      { description: 'Monthly Transfer', amount: 500, type: 'credit', date: 'Aug 1' },
      { description: 'Monthly Transfer', amount: 500, type: 'credit', date: 'Sep 1' },
      { description: 'Monthly Transfer', amount: 500, type: 'credit', date: 'Oct 1' },
      { description: 'Monthly Transfer', amount: 500, type: 'credit', date: 'Nov 1' },
    ]

    // Add transfers from recent activity
    data.recentActivity.forEach(activity => {
      if (activity.description.includes('Transfer') && activity.amount && activity.status === 'completed') {
        const date = new Date(activity.timestamp)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        transactions.unshift({
          description: activity.description,
          amount: activity.amount,
          type: 'credit',
          date: dateStr
        })
      }
    })

    return transactions
  }, [data.recentActivity])

  // Update highlighted bill based on current task - create new object with updated highlight
  const dataWithHighlight = React.useMemo(() => {
    if (currentTaskType === 'bill') {
      return {
        ...data,
        upcomingBills: data.upcomingBills.map(bill => 
          bill.name === 'Electric Bill' 
            ? { ...bill, highlighted: true }
            : { ...bill, highlighted: false }
        )
      }
    } else {
      return {
        ...data,
        upcomingBills: data.upcomingBills.map(bill => ({ ...bill, highlighted: false }))
      }
    }
  }, [data, currentTaskType])

  const savingsProgress = (dataWithHighlight.savings / dataWithHighlight.savingsGoal) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Finances</h1>
            <div className="flex gap-4 items-center text-lg">
              <span className="text-gray-600">User: <span className="font-semibold text-gray-900">{participantId}</span></span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Group: <span className="font-semibold text-gray-900">{group}</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Study Disclaimer */}
      <div className="bg-gray-100 border-b border-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs text-gray-600 text-center">
            📋 Study Mode - All data is simulated for research purposes
          </p>
        </div>
      </div>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Account Summary Cards */}
        <div 
          id="account-cards"
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${
            highlightElement === 'account-cards' ? 'onboarding-highlight' : ''
          }`}
        >
          {/* Checking Account */}
          <div 
            id="checking-card"
            className={`bg-white rounded-xl shadow-md p-6 border-2 relative transition-all duration-500 ease-out ${
              isOnboarding ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
            } ${
              dataWithHighlight.pendingState?.checking !== undefined
                ? 'border-amber-400 bg-amber-50 border-dashed'
                : 'border-gray-200'
            } ${
              highlightElement === 'checking-card' ? 'onboarding-highlight' : ''
            }`}
            onClick={(e) => {
              // Completely disable clicks during onboarding
              if (isOnboarding) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              console.log('Checking card clicked - opening modal')
              setShowCheckingModal(true)
            }}
          >
            {dataWithHighlight.pendingState?.checking !== undefined && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                ⏳ Pending
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Checking</h2>
            <p className="text-4xl font-bold text-gray-900 transition-all duration-500 ease-out">
              ${dataWithHighlight.checking.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {dataWithHighlight.pendingState?.checking !== undefined && (
              <p className="text-sm text-amber-700 font-semibold mt-2">
                → ${dataWithHighlight.pendingState.checking.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (scheduled)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Click to view transactions</p>
          </div>

          {/* Savings Account */}
          <div 
            id="savings-card"
            className={`bg-white rounded-xl shadow-md p-6 border-2 relative transition-all duration-500 ease-out ${
              isOnboarding ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
            } ${
              dataWithHighlight.pendingState?.savings !== undefined
                ? 'border-amber-400 bg-amber-50 border-dashed'
                : 'border-gray-200'
            } ${
              highlightElement === 'savings-card' ? 'onboarding-highlight' : ''
            }`}
            onClick={(e) => {
              // Completely disable clicks during onboarding
              if (isOnboarding) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              console.log('Savings card clicked - opening modal')
              setShowSavingsModal(true)
            }}
          >
            {dataWithHighlight.pendingState?.savings !== undefined && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                ⏳ Pending
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Savings</h2>
            <p className="text-4xl font-bold text-gray-900 mb-2 transition-all duration-500 ease-out">
              ${dataWithHighlight.savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {dataWithHighlight.pendingState?.savings !== undefined && (
              <p className="text-sm text-amber-700 font-semibold mb-2">
                → ${dataWithHighlight.pendingState.savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (scheduled)
              </p>
            )}
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Goal: $10,000</span>
                <span className="font-semibold">
                  {Math.round(savingsProgress)}%
                  {dataWithHighlight.pendingState?.savings !== undefined && (
                    <span className="text-amber-700"> → {Math.round((dataWithHighlight.pendingState.savings / dataWithHighlight.savingsGoal) * 100)}%</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to view transactions</p>
          </div>

          {/* Investments */}
          <div 
            id="investments-card"
            className={`bg-white rounded-xl shadow-md p-6 border-2 relative transition-all duration-500 ease-out ${
              isOnboarding ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
            } ${
              dataWithHighlight.pendingState?.investments !== undefined
                ? 'border-amber-400 bg-amber-50 border-dashed'
                : 'border-gray-200'
            } ${
              highlightElement === 'investments-card' ? 'onboarding-highlight' : ''
            }`}
            onClick={(e) => {
              // Completely disable clicks during onboarding
              if (isOnboarding) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              console.log('Investments card clicked - opening modal')
              setShowInvestmentModal(true)
            }}
          >
            {dataWithHighlight.pendingState?.investments !== undefined && (
              <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">
                ⏳ Pending
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Investments</h2>
            <p className="text-4xl font-bold text-gray-900 transition-all duration-500 ease-out">
              ${dataWithHighlight.investments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 mt-2">Retirement Portfolio</p>
            {dataWithHighlight.pendingState?.investments !== undefined && (
              <p className="text-sm text-amber-700 font-semibold mt-1">
                Scheduled rebalance: 75/25 → 60/40
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Click to view portfolio details</p>
          </div>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Chart Area */}
          <div 
            id="chart-area"
            className={`bg-white rounded-xl shadow-md p-6 border border-gray-200 min-h-[400px] ${
              highlightElement === 'chart-area' ? 'onboarding-highlight' : ''
            }`}
          >
            <TaskGraph taskType={currentTaskType} financialData={dataWithHighlight} autonomyLevel={autonomyLevel} />
          </div>

          {/* Sidebar */}
          <div 
            id="sidebar"
            className={`flex flex-col gap-6 ${
              highlightElement === 'sidebar' ? 'onboarding-highlight' : ''
            }`}
          >
            {/* Pending Transactions */}
            {dataWithHighlight.recentActivity.filter(a => a.status === 'pending').length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Transactions</h3>
                <div className="space-y-2">
                  {dataWithHighlight.recentActivity
                    .filter(a => a.status === 'pending')
                    .map((activity, index) => (
                      <div
                        key={index}
                        className="p-2 rounded-lg bg-amber-50 border border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 font-bold text-sm">⏳</span>
                          <div className="flex-1">
                            <div className="text-xs text-gray-900">{activity.description}</div>
                            {activity.amount && (
                              <div className="text-xs font-semibold text-amber-700">
                                ${activity.amount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Upcoming Bills */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Bills</h3>
              <div className="space-y-3">
                {dataWithHighlight.upcomingBills.map((bill, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      bill.highlighted
                        ? 'bg-red-50 border-l-4 border-l-red-500 border-r border-t border-b border-red-300 shadow-md'
                        : bill.scheduled
                        ? 'bg-amber-50 border-l-4 border-l-amber-500 border-r border-t border-b border-amber-300'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {bill.highlighted && (
                        <span className="inline-block text-red-600 font-semibold text-sm">⚠️</span>
                      )}
                      {bill.scheduled && (
                        <span className="inline-block text-amber-600 font-semibold text-sm">⏳</span>
                      )}
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${bill.highlighted ? 'text-red-900' : bill.scheduled ? 'text-amber-900' : 'text-gray-900'}`}>
                          {bill.name}
                        </div>
                        <div className={`text-xs ${bill.highlighted ? 'text-red-700' : bill.scheduled ? 'text-amber-700' : 'text-gray-700'}`}>
                          {bill.scheduled ? `⏳ Payment scheduled for ${bill.dueDate}` : `$${bill.amount} due ${bill.dueDate}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity (only completed/skipped, pending shown separately) */}
            {dataWithHighlight.recentActivity.filter(a => a.status !== 'pending').length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {dataWithHighlight.recentActivity
                    .filter(a => a.status !== 'pending')
                    .map((activity, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg ${
                          activity.status === 'completed'
                            ? 'bg-green-50 border border-green-200'
                            : activity.status === 'skipped'
                            ? 'bg-gray-50 border border-gray-200'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {activity.status === 'completed' && (
                            <span className="text-green-600 font-bold text-sm">✓</span>
                          )}
                          <div className="flex-1">
                            <div className="text-xs text-gray-900">{activity.description}</div>
                            {activity.amount && (
                              <div className="text-xs font-semibold text-gray-700">
                                ${activity.amount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Account Modals */}
      {showCheckingModal && (
        <AccountModal
          accountType="checking"
          balance={dataWithHighlight.checking}
          transactions={checkingTransactions}
          onClose={() => {
            console.log('Checking modal close clicked')
            handleModalClose('checking')
            if (onModalClose) onModalClose()
          }}
        />
      )}
      {showSavingsModal && (
        <AccountModal
          accountType="savings"
          balance={dataWithHighlight.savings}
          transactions={savingsTransactions}
          onClose={() => {
            console.log('Savings modal close clicked')
            handleModalClose('savings')
            if (onModalClose) onModalClose()
          }}
        />
      )}
      {showInvestmentModal && (
        <InvestmentPortfolioModal
          totalValue={dataWithHighlight.investments}
          currentStocks={dataWithHighlight.portfolioAllocation?.stocks || 75}
          currentBonds={dataWithHighlight.portfolioAllocation?.bonds || 25}
          targetStocks={60}
          targetBonds={40}
          holdings={{
            stocks: [
              { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', amount: (dataWithHighlight.investments * (dataWithHighlight.portfolioAllocation?.stocks || 75) / 100) * 0.7037, shares: 312.5 },
              { ticker: 'VXUS', name: 'Vanguard International Stock ETF', amount: (dataWithHighlight.investments * (dataWithHighlight.portfolioAllocation?.stocks || 75) / 100) * 0.2963, shares: 625.0 },
            ],
            bonds: [
              { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', amount: (dataWithHighlight.investments * (dataWithHighlight.portfolioAllocation?.bonds || 25) / 100), shares: 562.5 },
            ],
          }}
          onClose={() => {
            console.log('Investments modal close clicked')
            handleModalClose('investments')
            if (onModalClose) onModalClose()
          }}
        />
      )}
    </div>
  )
}

// Graph component that changes based on task type
function TaskGraph({ taskType, financialData, autonomyLevel }: { taskType: TaskType | null, financialData: FinancialData, autonomyLevel?: 'low' | 'medium' | 'high' }) {
  if (!taskType) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-xl">Select a task to view relevant information</p>
      </div>
    )
  }

  // Bill Payment Task - Show Utilities Spending Line Chart
  if (taskType === 'bill') {
    // Calculate current month utilities spending
    // Check if bill was paid (completed) or scheduled (pending)
    // Look for any bill payment activity (Electric Bill, Internet Bill, or payment plan)
    const billPaid = financialData.recentActivity.some(
      a => (a.description.includes('Bill - Paid') || 
            a.description.includes('Bill Payment - Completed') ||
            a.description.includes('Payment plan started')) &&
           a.status === 'completed'
    )
    const billScheduled = financialData.pendingState?.billPayment !== undefined || 
                         financialData.upcomingBills.some(b => b.scheduled && (b.name === 'Electric Bill' || b.name === 'Internet Bill'))
    
    // Find the amount paid for the current bill (if any)
    const billPaymentActivity = financialData.recentActivity.find(
      a => (a.description.includes('Bill - Paid') || 
            a.description.includes('Bill Payment - Completed') ||
            a.description.includes('Payment plan started')) &&
           a.status === 'completed'
    )
    const paidAmount = billPaymentActivity?.amount || 0
    
    const baseUtilities = [298, 312, 287, 305, 295] // Past 5 months (Jul-Nov) - normal utilities spending
    // Current month (Dec): $152 partial utilities (bill not paid yet) or $302 if bill was paid/scheduled
    // $152 is the partial amount, adding the bill payment (typically $150) brings it to ~$302
    const currentMonth = (billPaid || billScheduled) ? 152 + (paidAmount || 150) : 152
    
    const utilitiesData = [
      { month: 'Jul', amount: baseUtilities[0] },
      { month: 'Aug', amount: baseUtilities[1] },
      { month: 'Sep', amount: baseUtilities[2] },
      { month: 'Oct', amount: baseUtilities[3] },
      { month: 'Nov', amount: baseUtilities[4] },
      { month: 'Dec', amount: currentMonth }, // Current month
    ]
    
    const maxAmount = Math.max(...utilitiesData.map(d => d.amount)) + 50
    const minAmount = 0 // Start from 0 for better visualization
    const range = maxAmount - minAmount
    const chartHeight = 200
    const chartWidth = 600
    const leftMargin = 50
    const rightMargin = 30
    const bottomMargin = 40
    const topMargin = 20
    const plotWidth = chartWidth - leftMargin - rightMargin
    const plotHeight = chartHeight - topMargin - bottomMargin
    
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Utilities Spending</h3>
        <div className="relative w-full" style={{ minHeight: '300px', height: '300px' }}>
          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = topMargin + (i / 4) * plotHeight
              return (
                <line
                  key={i}
                  x1={leftMargin}
                  y1={y}
                  x2={chartWidth - rightMargin}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              )
            })}
            
            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4].map((i) => {
              const value = maxAmount - (i / 4) * range
              const y = topMargin + (i / 4) * plotHeight
              return (
                <text
                  key={i}
                  x={leftMargin - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                  fontSize="12"
                >
                  ${Math.round(value)}
                </text>
              )
            })}
            
            {/* Line chart */}
            {utilitiesData.map((point, index, array) => {
              if (index === 0) return null
              const prevPoint = array[index - 1]
              const monthSpacing = plotWidth / (utilitiesData.length - 1)
              const x1 = leftMargin + (index - 1) * monthSpacing
              const y1 = topMargin + plotHeight - ((prevPoint.amount - minAmount) / range) * plotHeight
              const x2 = leftMargin + index * monthSpacing
              const y2 = topMargin + plotHeight - ((point.amount - minAmount) / range) * plotHeight
              const isCurrent = point.month === 'Dec'
              
              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3b82f6"
                  strokeWidth={isCurrent ? 3 : 2}
                  className="transition-all duration-500 ease-out"
                />
              )
            })}
            
            {/* Data points */}
            {utilitiesData.map((point, index) => {
              const monthSpacing = plotWidth / (utilitiesData.length - 1)
              const x = leftMargin + index * monthSpacing
              const y = topMargin + plotHeight - ((point.amount - minAmount) / range) * plotHeight
              const isCurrent = point.month === 'Dec'
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isCurrent ? 6 : 4}
                    fill="#3b82f6"
                    className="transition-all duration-500 ease-out"
                  />
                  {/* Value label */}
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className="text-xs fill-gray-700 font-semibold"
                    fontSize="11"
                  >
                    ${point.amount}
                  </text>
                  {/* Month label */}
                  <text
                    x={x}
                    y={chartHeight - bottomMargin + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                    fontSize="11"
                  >
                    {point.month}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        {billPaid && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            ✓ Bill paid - December spending updated to ${currentMonth}
          </p>
        )}
        {billScheduled && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            ⏳ Bill payment scheduled - December spending will be ${currentMonth}
          </p>
        )}
        {!billPaid && !billScheduled && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            December shows partial spending - bill not yet paid
          </p>
        )}
      </div>
    )
  }

  // Savings Transfer Task - Show Emergency Fund Progress
  if (taskType === 'savings') {
    const progress = (financialData.savings / financialData.savingsGoal) * 100
    const pendingProgress = financialData.pendingState?.savings 
      ? (financialData.pendingState.savings / financialData.savingsGoal) * 100 
      : null
    
    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Emergency Fund Progress</h3>
        
        {/* Progress bar section - inside the chart card */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-8 mb-3 relative">
            <div
              className="bg-blue-600 h-8 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {progress >= 10 && (
                <span className="text-white text-sm font-semibold">{Math.round(progress)}%</span>
              )}
            </div>
            {pendingProgress !== null && (
              <div
                className="absolute top-0 bg-amber-400 h-8 rounded-full opacity-50 transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{ width: `${Math.min(pendingProgress, 100)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Current: ${financialData.savings.toLocaleString()}
              {pendingProgress !== null && (
                <span className="text-amber-700 font-semibold"> → ${financialData.pendingState!.savings!.toLocaleString()} (scheduled)</span>
              )}
            </span>
            <span>Goal: ${(financialData.savingsGoal / 1000).toFixed(0)}k</span>
          </div>
          {pendingProgress !== null && (
            <div className="text-center">
              <span className="text-sm text-amber-700 font-semibold">
                {Math.round(progress)}% → {Math.round(pendingProgress)}% (pending)
              </span>
            </div>
          )}
        </div>
        
        {/* Line graph showing savings growth over time */}
        <div className="mt-6">
          <div className="relative w-full" style={{ minHeight: '350px', height: '350px' }}>
            <svg className="w-full h-full" viewBox="0 0 750 350" preserveAspectRatio="xMidYMid meet">
              {/* Goal line */}
              <line
                x1="80"
                y1="20"
                x2="680"
                y2="20"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text
                x="685"
                y="24"
                className="text-xs fill-green-600 font-semibold"
                fontSize="12"
              >
                Goal: $10k
              </text>
              
              {/* Grid lines - zoomed to 4000-10000 range */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const y = 20 + (i / 5) * 280
                return (
                  <line
                    key={i}
                    x1="80"
                    y1={y}
                    x2="680"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                )
              })}
              
              {/* Y-axis labels - zoomed to 4000-10000 range with proper spacing */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const value = 10000 - (i / 5) * 6000 // Range from 10000 to 4000
                const y = 20 + (i / 5) * 280
                return (
                  <text
                    key={i}
                    x="75"
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                    fontSize="12"
                  >
                    ${(value / 1000).toFixed(1)}k
                  </text>
                )
              })}
              
              {/* Savings growth data - showing meaningful growth */}
              {(() => {
                const savingsGrowthData = [
                  { month: 'Jul', balance: 5000 },
                  { month: 'Aug', balance: 5500 },
                  { month: 'Sep', balance: 5800 },
                  { month: 'Oct', balance: 6200 },
                  { month: 'Nov', balance: 6500 },
                  { month: 'Dec', balance: financialData.savings },
                  ...(pendingProgress !== null && financialData.pendingState?.savings 
                    ? [{ month: 'Jan', balance: financialData.pendingState.savings }] 
                    : []),
                ]
                const maxMonth = pendingProgress !== null && financialData.pendingState?.savings ? 6 : 5
                const monthSpacing = 600 / maxMonth
                const minBalance = 4000
                const maxBalance = 10000
                const balanceRange = maxBalance - minBalance
                
                return savingsGrowthData.map((point, index, array) => {
                  if (index === 0) return null
                  const prevPoint = array[index - 1]
                  const x1 = 80 + (index - 1) * monthSpacing
                  const y1 = 20 + 280 - ((prevPoint.balance - minBalance) / balanceRange) * 280
                  const x2 = 80 + index * monthSpacing
                  const y2 = 20 + 280 - ((point.balance - minBalance) / balanceRange) * 280
                  const isPending = point.month === 'Jan'
                  
                  return (
                    <line
                      key={index}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isPending ? "#f59e0b" : "#3b82f6"}
                      strokeWidth={isPending ? 3 : 2}
                      strokeDasharray={isPending ? "5,5" : "none"}
                      className="transition-all duration-500 ease-out"
                    />
                  )
                })
              })()}
              
              {/* Data points */}
              {(() => {
                const savingsGrowthData = [
                  { month: 'Jul', balance: 5000 },
                  { month: 'Aug', balance: 5500 },
                  { month: 'Sep', balance: 5800 },
                  { month: 'Oct', balance: 6200 },
                  { month: 'Nov', balance: 6500 },
                  { month: 'Dec', balance: financialData.savings },
                  ...(pendingProgress !== null && financialData.pendingState?.savings 
                    ? [{ month: 'Jan', balance: financialData.pendingState.savings }] 
                    : []),
                ]
                const maxMonth = pendingProgress !== null && financialData.pendingState?.savings ? 6 : 5
                const monthSpacing = 600 / maxMonth
                const minBalance = 4000
                const maxBalance = 10000
                const balanceRange = maxBalance - minBalance
                
                return savingsGrowthData.map((point, index) => {
                  const x = 80 + index * monthSpacing
                  const y = 20 + 280 - ((point.balance - minBalance) / balanceRange) * 280
                  const isCurrent = point.month === 'Dec'
                  const isPending = point.month === 'Jan'
                  
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isPending ? 6 : isCurrent ? 5 : 4}
                        fill={isPending ? "#f59e0b" : isCurrent ? "#3b82f6" : "#60a5fa"}
                        className="transition-all duration-500 ease-out"
                      />
                      {/* Month label */}
                      <text
                        x={x}
                        y="340"
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                        fontSize="12"
                      >
                        {point.month}
                      </text>
                    </g>
                  )
                })
              })()}
            </svg>
          </div>
        </div>
      </div>
    )
  }

  // Investment Rebalancing Task - Show Portfolio Allocation
  if (taskType === 'investment') {
    // Get current allocation from financialData, default to 75/25
    const currentStocks = financialData.portfolioAllocation?.stocks ?? 75
    const currentBonds = financialData.portfolioAllocation?.bonds ?? 25
    const targetStocks = 60
    const targetBonds = 40
    const hasPendingRebalance = financialData.pendingState?.investments !== undefined
    const pendingStocks = financialData.pendingState?.investments?.stocks
    const pendingBonds = financialData.pendingState?.investments?.bonds

    return (
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
        {hasPendingRebalance && pendingStocks !== undefined && pendingBonds !== undefined && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <p className="text-sm text-amber-800 font-semibold">
              ⏳ Scheduled rebalance: {currentStocks}/{currentBonds} → {pendingStocks}/{pendingBonds}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Allocation */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Current Allocation</h4>
            <div className="relative w-64 h-64 mx-auto">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${currentStocks * 2.513} ${100 * 2.513}`}
                  className="transition-all duration-500 ease-out"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${currentBonds * 2.513} ${100 * 2.513}`}
                  strokeDashoffset={`-${currentStocks * 2.513}`}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{currentStocks}%</span>
                <span className="text-sm text-gray-600">Stocks</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{currentBonds}%</span>
                <span className="text-sm text-gray-600">Bonds</span>
              </div>
            </div>
          </div>

          {/* Target Allocation */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Target Allocation</h4>
            <div className="relative w-48 h-48 mx-auto">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${targetStocks * 2.513} ${100 * 2.513}`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${targetBonds * 2.513} ${100 * 2.513}`}
                  strokeDashoffset={`-${targetStocks * 2.513}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{targetStocks}%</span>
                <span className="text-sm text-gray-600">Stocks</span>
                <span className="text-2xl font-bold text-gray-900 mt-1">{targetBonds}%</span>
                <span className="text-sm text-gray-600">Bonds</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-yellow-600 font-semibold">
            ⚠️ Portfolio has drifted 15% from target allocation
          </p>
        </div>
      </div>
    )
  }

  // Fallback - should not reach here if task types are correct
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p className="text-xl">Unknown task type: {taskType}</p>
    </div>
  )
}

