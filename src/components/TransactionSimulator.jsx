import { Activity, CheckCircle, XCircle, Zap } from 'lucide-react'
import { ethers } from 'ethers'

export default function TransactionSimulator({ simulation }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
        <Activity className="w-5 h-5 text-indigo-600" />
        <span>Transaction Simulation</span>
      </h3>

      <div className="space-y-4">
        {/* Simulation Status */}
        <div className={`p-4 rounded-lg border-2 ${
          simulation.success 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center space-x-3">
            {simulation.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h4 className={`font-semibold ${
                simulation.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {simulation.success ? 'Simulation Successful' : 'Simulation Failed'}
              </h4>
              <p className={`text-sm ${
                simulation.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {simulation.success 
                  ? 'Transaction would likely succeed if executed' 
                  : 'This transaction will likely fail if executed'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {simulation.error && (
          <div className="p-4 bg-red-100 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center space-x-2">
              <XCircle className="w-4 h-4" />
              <span>Error Details</span>
            </h4>
            <p className="text-sm text-red-800 font-mono">{simulation.error}</p>
          </div>
        )}

        {/* Gas Used */}
        {simulation.gasUsed && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Estimated Gas Used</span>
            </div>
            <span className="text-sm font-mono text-gray-800">
              {Number(simulation.gasUsed).toLocaleString()}
            </span>
          </div>
        )}

        {/* Balance Changes */}
        {simulation.balanceChanges && simulation.balanceChanges.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Predicted Balance Changes</h4>
            <div className="space-y-2">
              {simulation.balanceChanges.map((change, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-blue-700 font-mono">{change.address.slice(0, 10)}...</span>
                  <span className={`font-semibold ${
                    change.change.startsWith('-') ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {change.change} {change.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Note */}
        <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded">
          ℹ️ Simulation provides an estimate based on current blockchain state. 
          Actual results may vary depending on network conditions and other transactions.
        </div>
      </div>
    </div>
  )
}