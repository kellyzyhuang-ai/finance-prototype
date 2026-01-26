'use client'

interface Transaction {
  description: string
  amount: number
  type: 'credit' | 'debit'
  date: string
}

interface AccountModalProps {
  accountType: 'checking' | 'savings'
  balance: number
  transactions: Transaction[]
  onClose: () => void
}

export default function AccountModal({
  accountType,
  balance,
  transactions,
  onClose,
}: AccountModalProps) {
  const accountName = accountType === 'checking' ? 'Checking Account' : 'Savings Account'

  return (
    <>
      <div 
        className="modal-backdrop" 
        onClick={onClose} 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'block',
          visibility: 'visible'
        }}
      />
      <div 
        className="account-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{accountName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Account Balance */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <span className="text-sm text-gray-600 block mb-2">Current Balance</span>
            <h1 className="text-4xl font-bold text-gray-900">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center p-4 rounded-lg border ${
                    tx.type === 'credit'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{tx.description}</div>
                    <div className="text-sm text-gray-600 mt-1">{tx.date}</div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      tx.type === 'credit' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'debit' ? '-' : '+'}$
                    {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}




