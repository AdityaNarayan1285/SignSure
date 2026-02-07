import { Shield, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { useApprovals } from '../hooks/useApprovals'
import { useWallet } from '../context/WalletContext'
import { NETWORKS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function ApprovalDashboard() {
  const { walletAddress, provider } = useWallet()
  const { approvals, loading, fetchApprovals, revokeApproval } = useApprovals(walletAddress, provider)

  const handleRevoke = async (tokenAddress, spenderAddress) => {
    const success = await revokeApproval(tokenAddress, spenderAddress)
    if (success) {
      toast.success('Approval revoked successfully!')
      fetchApprovals()
    } else {
      toast.error('Failed to revoke approval')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Your Active Approvals</span>
        </h3>
        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No active approvals found</p>
          <p className="text-sm text-gray-500 mt-1">
            You haven't approved any contracts to spend your tokens
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {approval.name} ({approval.symbol})
                  </h4>
                  <a
                    href={`${NETWORKS.sepolia.explorerUrl}/token/${approval.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center space-x-1 mt-1"
                  >
                    <span>{approval.tokenAddress.slice(0, 10)}...{approval.tokenAddress.slice(-8)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {approval.spenders && approval.spenders.length > 0 && (
                <div className="space-y-2 mt-3">
                  {approval.spenders.map((spender, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-mono text-gray-600">
                          {spender.address.slice(0, 10)}...{spender.address.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Amount: {spender.amount === 'unlimited' ? '∞ Unlimited' : spender.amount}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevoke(approval.tokenAddress, spender.address)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Regularly review and revoke unnecessary approvals to protect your assets. 
          Only keep approvals active for contracts you actively use.
        </p>
      </div>
    </div>
  )
}