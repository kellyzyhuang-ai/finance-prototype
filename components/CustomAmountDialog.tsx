'use client'

import { useState } from 'react'

interface CustomAmountDialogProps {
  availableBalance: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export default function CustomAmountDialog({
  availableBalance,
  onConfirm,
  onCancel,
}: CustomAmountDialogProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    const numAmount = parseFloat(amount)

    // Validation
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (numAmount > availableBalance) {
      setError(`Amount cannot exceed $${availableBalance.toFixed(2)}`)
      return
    }
    if (numAmount > 5000) {
      setError('Maximum transfer is $5,000')
      return
    }

    onConfirm(numAmount)
  }

  return (
    <div className="bg-white rounded-lg p-4 my-2 border border-gray-200 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">Enter Transfer Amount</h4>
      <p className="text-sm text-gray-600 mb-4">
        Available in checking: <span className="font-semibold">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl font-semibold text-gray-700">$</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError('')
          }}
          placeholder="0.00"
          min="0"
          max={availableBalance}
          step="0.01"
          className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
        >
          Confirm
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




