'use client'

interface Holding {
  ticker: string
  name: string
  amount: number
  shares: number
}

interface InvestmentPortfolioModalProps {
  totalValue: number
  currentStocks: number
  currentBonds: number
  targetStocks: number
  targetBonds: number
  holdings: {
    stocks: Holding[]
    bonds: Holding[]
  }
  onClose: () => void
}

export default function InvestmentPortfolioModal({
  totalValue,
  currentStocks,
  currentBonds,
  targetStocks,
  targetBonds,
  holdings,
  onClose,
}: InvestmentPortfolioModalProps) {
  const todayChange = 2340
  const todayChangePercent = 1.32

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
        className="portfolio-modal"
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
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Investment Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Portfolio Value */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <span className="text-sm text-gray-600 block mb-2">Total Value</span>
            <h1 className="text-4xl font-bold text-gray-900">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
            <span className="text-sm text-green-600 font-semibold mt-2 block">
              +${todayChange.toLocaleString()} (+{todayChangePercent}%) today
            </span>
          </div>
        </div>

        {/* Holdings List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stocks Holdings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stocks ({currentStocks}%)
            </h3>
            <div className="space-y-3">
              {holdings.stocks.map((holding, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg text-gray-900">{holding.ticker}</span>
                      <span className="text-sm text-gray-600">{holding.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">{holding.shares.toFixed(1)} shares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${holding.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {((holding.amount / totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonds Holdings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bonds ({currentBonds}%)
            </h3>
            <div className="space-y-3">
              {holdings.bonds.map((holding, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg text-gray-900">{holding.ticker}</span>
                      <span className="text-sm text-gray-600">{holding.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">{holding.shares.toFixed(1)} shares</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${holding.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {((holding.amount / totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target vs Current */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Target vs Current</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current:</span>
                <span className="font-semibold text-gray-900">
                  {currentStocks}% stocks / {currentBonds}% bonds
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target:</span>
                <span className="font-semibold text-gray-900">
                  {targetStocks}% stocks / {targetBonds}% bonds
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}




