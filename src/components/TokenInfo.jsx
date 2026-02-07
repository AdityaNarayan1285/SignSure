import { Coins, TrendingUp, Wallet } from 'lucide-react'
import { formatAmount } from '../utils/decoder'

export default function TokenInfo({ tokenInfo, userBalance, decoded }) {
  const approvalAmount = decoded?.args?.[1]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <Coins className="w-5 h-5 text-yellow-600" />
        <span>Token Information</span>
      </h3>

      <div className="space-y-4">
        {/* Token Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">Token Name</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{tokenInfo.name}</p>
            <p className="text-sm text-purple-700">{tokenInfo.symbol}</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Token Type</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{tokenInfo.type}</p>
            {tokenInfo.decimals && (
              <p className="text-sm text-blue-700">Decimals: {tokenInfo.decimals}</p>
            )}
          </div>
        </div>

        {/* Your Balance */}
        {userBalance && tokenInfo.decimals && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Your Balance</span>
              </div>
              <span className="text-2xl font-bold text-green-900">
                {formatAmount(userBalance, tokenInfo.decimals)} {tokenInfo.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Approval Amount */}
        {approvalAmount && tokenInfo.decimals && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-900">Approval Amount</span>
              <span className="text-xl font-bold text-yellow-900">
                {approvalAmount.toString() === '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                  ? '∞ UNLIMITED'
                  : `${formatAmount(approvalAmount, tokenInfo.decimals)} ${tokenInfo.symbol}`
                }
              </span>
            </div>
            
            {/* Percentage of balance */}
            {userBalance && approvalAmount.toString() !== '115792089237316195423570985008687907853269984665640564039457584007913129639935' && (
              <div className="mt-2 pt-2 border-t border-yellow-300">
                <div className="flex justify-between items-center text-xs text-yellow-800">
                  <span>Percentage of your balance:</span>
                  <span className="font-semibold">
                    {((Number(formatAmount(approvalAmount, tokenInfo.decimals)) / 
                       Number(formatAmount(userBalance, tokenInfo.decimals))) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total Supply */}
        {tokenInfo.totalSupply && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Total Supply:</span>
            <span className="text-sm font-mono text-gray-800">
              {formatAmount(tokenInfo.totalSupply, tokenInfo.decimals || 18)} {tokenInfo.symbol}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}