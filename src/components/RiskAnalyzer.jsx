import { AlertTriangle, Shield, XCircle, CheckCircle, Info, TrendingUp, ExternalLink } from 'lucide-react'
import { NETWORKS } from '../utils/constants'
import { formatAmount } from '../utils/decoder'
import { ethers } from 'ethers'
import ContractInfo from './ContractInfo'
import TokenInfo from './TokenInfo'
import ApprovalWarning from './ApprovalWarning'
import TransactionSimulator from './TransactionSimulator'

export default function RiskAnalyzer({ analysisResult, onCancel, onProceed }) {
  const { 
    decoded, 
    contractAnalysis, 
    tokenInfo, 
    riskAnalysis, 
    safetyScore,
    gasEstimate,
    simulation,
    userBalance
  } = analysisResult

  const riskLevel = riskAnalysis.riskLevel

  return (
    <div className="space-y-6">
      {/* Risk Level Banner */}
      <div className={`${riskLevel.bgColor} ${riskLevel.borderColor} border-2 rounded-xl p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`text-5xl`}>
              {riskLevel.icon}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${riskLevel.textColor} mb-2`}>
                Risk Level: {riskLevel.level.replace('_', ' ')}
              </h2>
              <p className={`text-lg ${riskLevel.textColor}`}>
                {riskLevel.level === 'SAFE' && 'This transaction appears safe to proceed'}
                {riskLevel.level === 'CAUTION' && 'Exercise caution with this transaction'}
                {riskLevel.level === 'HIGH_RISK' && 'This transaction has HIGH RISK factors'}
                {riskLevel.level === 'CRITICAL' && '⚠️ CRITICAL RISK - DO NOT PROCEED'}
              </p>
              
              {riskAnalysis.reasons && riskAnalysis.reasons.length > 0 && (
                <div className="mt-3">
                  <p className={`text-sm font-semibold ${riskLevel.textColor}`}>Reasons:</p>
                  <ul className="mt-1 space-y-1">
                    {riskAnalysis.reasons.map((reason, idx) => (
                      <li key={idx} className={`text-sm ${riskLevel.textColor}`}>
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Safety Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${riskLevel.textColor}`}>
              {safetyScore}
            </div>
            <div className={`text-sm ${riskLevel.textColor} font-medium`}>
              Safety Score
            </div>
            {riskAnalysis.decodedFunction && riskAnalysis.decodedFunction !== 'unknown' && (
              <div className={`text-xs ${riskLevel.textColor} mt-2 font-mono`}>
                {riskAnalysis.decodedFunction}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special Warning for Unlimited Approvals */}
      {riskAnalysis.txType === 'APPROVE' && riskLevel.level === 'CRITICAL' && (
        <ApprovalWarning 
          decoded={decoded}
          tokenInfo={tokenInfo}
          contractAnalysis={contractAnalysis}
          userBalance={userBalance}
        />
      )}

      {/* Transaction Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span>Transaction Details</span>
        </h3>

        <div className="space-y-3">
          {/* Function Name */}
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">Function:</span>
            <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
              {decoded?.functionName || 'Unknown'}
            </span>
          </div>

          {/* Contract Address */}
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600">Contract:</span>
            <a
              href={`${NETWORKS.sepolia.explorerUrl}/address/${analysisResult.transaction.to}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>
                {analysisResult.transaction.to.slice(0, 10)}...
                {analysisResult.transaction.to.slice(-8)}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Parameters */}
          {decoded && decoded.fragment && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600 mb-2 block">Parameters:</span>
              <div className="space-y-2">
                {decoded.fragment.inputs.map((input, index) => (
                  <div key={index} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                    <span className="text-xs font-medium text-gray-600">
                      {input.name || `param${index}`} ({input.type}):
                    </span>
                    <span className="text-xs font-mono text-gray-800 max-w-xs truncate">
                      {input.type.includes('uint') 
                        ? decoded.args[index]?.toString()
                        : String(decoded.args[index])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gas Estimate */}
          {gasEstimate && (
            <div className="flex justify-between items-start pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Estimated Gas:</span>
              <div className="text-right">
                <div className="text-sm font-mono text-gray-800">
                  {Number(ethers.formatUnits(gasEstimate.estimatedCost, 'ether')).toFixed(6)} ETH
                </div>
                <div className="text-xs text-gray-500">
                  Gas Limit: {Number(gasEstimate.gasLimit).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Info */}
      {tokenInfo && (
        <TokenInfo 
          tokenInfo={tokenInfo}
          userBalance={userBalance}
          decoded={decoded}
        />
      )}

      {/* Contract Analysis */}
      {contractAnalysis && (
        <ContractInfo contractAnalysis={contractAnalysis} />
      )}

      {/* Simulation Results */}
      {simulation && (
        <TransactionSimulator simulation={simulation} />
      )}

      {/* Warnings */}
      {riskAnalysis.warnings && riskAnalysis.warnings.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Warnings ({riskAnalysis.warnings.length})</span>
          </h3>
          <ul className="space-y-2">
            {riskAnalysis.warnings.map((warning, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-red-800">
                <span className="text-red-600 font-bold">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Recommendations</span>
          </h3>
          <ul className="space-y-2">
            {riskAnalysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                <span className="text-blue-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <XCircle className="w-5 h-5" />
          <span>Cancel & Go Back</span>
        </button>

        <button
          onClick={onProceed}
          disabled={riskLevel.level === 'CRITICAL'}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl
            ${riskLevel.level === 'CRITICAL' 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>
            {riskLevel.level === 'CRITICAL' ? 'Blocked for Safety' : 'Proceed Anyway'}
          </span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-500 pt-4">
        <p>
          This analysis is provided for informational purposes only. 
          Always verify contract addresses and understand the risks before proceeding.
        </p>
      </div>
    </div>
  )
}