'use client'

import { useState } from 'react'

interface PaymentPlanDialogProps {
  billAmount: number
  billName: string
  onConfirm: (paymentAmount: number, numPayments: number, frequency: string) => void
  onCancel: () => void
}

export default function PaymentPlanDialog({
  billAmount,
  billName,
  onConfirm,
  onCancel,
}: PaymentPlanDialogProps) {
  const [numPayments, setNumPayments] = useState(3)
  const [frequency, setFrequency] = useState('monthly')

  const paymentAmount = parseFloat((billAmount / numPayments).toFixed(2))
  const remainingBalance = billAmount - paymentAmount

  const getNextPaymentDate = () => {
    const today = new Date()
    if (frequency === 'weekly') {
      today.setDate(today.getDate() + 7)
    } else if (frequency === 'biweekly') {
      today.setDate(today.getDate() + 14)
    } else {
      // monthly
      today.setMonth(today.getMonth() + 1)
    }
    return today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white rounded-lg p-4 my-2 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Up Payment Plan</h3>
      <p className="text-sm text-gray-600 mb-4">
        Total bill amount: <span className="font-semibold">${billAmount.toFixed(2)}</span> ({billName})
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of payments:
        </label>
        <select
          value={numPayments}
          onChange={(e) => setNumPayments(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={2}>2 payments</option>
          <option value={3}>3 payments</option>
          <option value={4}>4 payments</option>
          <option value={6}>6 payments</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment frequency:
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="bg-gray-50 rounded-md p-3 mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Your plan:</p>
        <p className="text-sm text-gray-700 mb-1">
          ${paymentAmount.toFixed(2)} per payment × {numPayments} payments
        </p>
        <p className="text-sm text-gray-700 mb-1">
          First payment today: <span className="font-semibold">${paymentAmount.toFixed(2)}</span>
        </p>
        {frequency === 'monthly' && (
          <p className="text-sm text-gray-700">Paid off in {numPayments} months</p>
        )}
        {frequency === 'weekly' && (
          <p className="text-sm text-gray-700">Paid off in {numPayments} weeks</p>
        )}
        {frequency === 'biweekly' && (
          <p className="text-sm text-gray-700">Paid off in {numPayments * 2} weeks</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(paymentAmount, numPayments, frequency)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
        >
          Confirm Plan
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-900 font-semibold py-2 px-4 rounded-md text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}




