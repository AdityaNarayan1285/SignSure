import { AlertTriangle, Coins, Users, Clock, Shield } from 'lucide-react'
import { formatAmount } from '../utils/decoder'
import { ethers } from 'ethers'

export default function ApprovalWarning({ decoded, tokenInfo, contractAnalysis, userBalance }) {
  const spenderAddress = decoded.args[0]
  const approvalAmount = decoded.args[1]
  
  const isUnlimited = approvalAmount >= (ethers.MaxUint256 * 90n / 100n)

  return (
    <div className="bg-gradient-to-br from-red-900 to-red-700 text-white rounded-xl p-8 shadow-2xl border-4 border-red-500">
      <div className="flex items-start space-x-4 mb-6">
        <div className="bg-white rounded-full p-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">
            ⚠️ UNLIMITED APPROVAL DETECTED
          </h2>
          <p className="text-red-100 text-lg">
            This is one of the most common ways people lose their crypto assets!
          </p>
        </div>
      </div>

      {/* What's Happening */}
      <div className="bg-red-800 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-xl mb-3 flex items-center space-x-2">
          <Coins className="w-6 h-6" />
          <span>What's Happening?</span>
        </h3>
        <div className="space-y-3 text-red-50">
          <p className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>
              You are about to give <strong className="text-yellow-300">UNLIMITED ACCESS</strong> to 
              {tokenInfo ? ` your ${tokenInfo.name} (${tokenInfo.symbol})` : ' your tokens'}
            </span>
          </p>
          <p className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>
              The contract at <code className="bg-red-900 px-2 py-1 rounded text-xs">{spenderAddress.slice(0, 10)}...</code> will be able to spend <strong className="text-yellow-300">ALL</strong> your tokens
            </span>
          </p>
          <p className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>
              This permission will remain active until you manually revoke it
            </span>
          </p>
          {userBalance && tokenInfo && (
            <p className="flex items-start space-x-2">
              <span className="font-bold">•</span>
              <span>
                Your current balance: <strong className="text-yellow-300">
                  {formatAmount(userBalance, tokenInfo.decimals)} {tokenInfo.symbol}
                </strong> - ALL OF IT is at risk!
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Why This Is Dangerous */}
      <div className="bg-red-800 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-xl mb-3 flex items-center space-x-2">
          <Shield className="w-6 h-6" />
          <span>Why This Is Extremely Dangerous</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>If Contract Is Malicious</span>
            </h4>
            <p className="text-sm text-red-100">
              The contract can immediately drain ALL your tokens to the attacker's wallet
            </p>
          </div>

          <div className="bg-red-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>If Contract Gets Hacked</span>
            </h4>
            <p className="text-sm text-red-100">
              Even legitimate contracts can be exploited. Your approval remains active.
            </p>
          </div>

          <div className="bg-red-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Delayed Attack</span>
            </h4>
            <p className="text-sm text-red-100">
              Scammers often wait weeks or months before draining approved tokens
            </p>
          </div>

          <div className="bg-red-900 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>No Warning Signs</span>
            </h4>
            <p className="text-sm text-red-100">
              Your tokens can be moved without any transaction from you
            </p>
          </div>
        </div>
      </div>

      {/* Contract Status */}
      {contractAnalysis && (
        <div className="bg-red-800 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-xl mb-3">Contract Status</h3>
          <div className="space-y-2 text-red-50">
            <div className="flex justify-between items-center">
              <span>Verified on Etherscan:</span>
              <span className={`font-bold ${contractAnalysis.isVerified ? 'text-green-300' : 'text-yellow-300'}`}>
                {contractAnalysis.isVerified ? '✓ Yes' : '✗ No (RED FLAG!)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Known Protocol:</span>
              <span className={`font-bold ${contractAnalysis.isKnownProtocol ? 'text-green-300' : 'text-yellow-300'}`}>
                {contractAnalysis.isKnownProtocol ? `✓ ${contractAnalysis.protocolName}` : '✗ Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trust Score:</span>
              <span className={`font-bold ${
                contractAnalysis.trustScore > 70 ? 'text-green-300' : 
                contractAnalysis.trustScore > 40 ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {contractAnalysis.trustScore}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* What You Should Do */}
      <div className="bg-yellow-500 text-yellow-900 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-3">✋ RECOMMENDED ACTIONS</h3>
        <ol className="space-y-2 text-sm font-medium">
          <li className="flex items-start space-x-2">
            <span className="font-bold">1.</span>
            <span><strong>CANCEL THIS TRANSACTION</strong> - Do not proceed unless you fully trust this contract</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">2.</span>
            <span>Verify the contract address matches the official website (check multiple sources)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">3.</span>
            <span>If you must approve, consider approving only the exact amount you need</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">4.</span>
            <span>Revoke the approval immediately after your transaction completes</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">5.</span>
            <span>Never approve unlimited amounts for unknown or unverified contracts</span>
          </li>
        </ol>
      </div>
    </div>
  )
}