import { FileCode, User, Calendar, Shield, AlertTriangle, ExternalLink } from 'lucide-react'
import { NETWORKS } from '../utils/constants'

export default function ContractInfo({ contractAnalysis }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <FileCode className="w-5 h-5 text-purple-600" />
        <span>Contract Analysis</span>
      </h3>

      <div className="space-y-4">
        {/* Trust Score */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Trust Score</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  contractAnalysis.trustScore > 70 ? 'bg-green-500' :
                  contractAnalysis.trustScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${contractAnalysis.trustScore}%` }}
              />
            </div>
            <span className="font-bold text-gray-800 w-12 text-right">
              {contractAnalysis.trustScore}/100
            </span>
          </div>
        </div>

        {/* Verification Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            contractAnalysis.isVerified 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center space-x-2 mb-1">
              {contractAnalysis.isVerified ? (
                <Shield className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${
                contractAnalysis.isVerified ? 'text-green-900' : 'text-red-900'
              }`}>
                Verification
              </span>
            </div>
            <p className={`text-xs ${
              contractAnalysis.isVerified ? 'text-green-700' : 'text-red-700'
            }`}>
              {contractAnalysis.isVerified ? 'Verified on Etherscan' : 'NOT Verified'}
            </p>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            contractAnalysis.isKnownProtocol 
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center space-x-2 mb-1">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                Protocol
              </span>
            </div>
            <p className="text-xs text-gray-700">
              {contractAnalysis.isKnownProtocol 
                ? contractAnalysis.protocolName 
                : 'Unknown Protocol'}
            </p>
          </div>
        </div>

        {/* Contract Name */}
        {contractAnalysis.contractName && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Contract Name:</span>
            <span className="text-sm font-mono text-gray-800">{contractAnalysis.contractName}</span>
          </div>
        )}

        {/* Creator Info */}
        {contractAnalysis.creationInfo && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Creation Info</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-blue-700">Creator:</span>
              <a
                href={`${NETWORKS.sepolia.explorerUrl}/address/${contractAnalysis.creationInfo.creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{contractAnalysis.creationInfo.creator.slice(0, 10)}...{contractAnalysis.creationInfo.creator.slice(-8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-blue-700">Creation Tx:</span>
              <a
                href={`${NETWORKS.sepolia.explorerUrl}/tx/${contractAnalysis.creationInfo.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{contractAnalysis.creationInfo.txHash.slice(0, 10)}...{contractAnalysis.creationInfo.txHash.slice(-8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Suspicious Patterns */}
        {contractAnalysis.suspiciousPatterns && contractAnalysis.suspiciousPatterns.length > 0 && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-900">Suspicious Patterns Detected</span>
            </div>
            <ul className="space-y-1">
              {contractAnalysis.suspiciousPatterns.map((pattern, index) => (
                <li key={index} className="text-xs text-red-800 flex items-start space-x-2">
                  <span className="text-red-600">•</span>
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View on Etherscan */}
        <a
          href={`${NETWORKS.sepolia.explorerUrl}/address/${contractAnalysis.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
        >
          <span>View on Etherscan</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
