
import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { useTransaction } from '../hooks/useTransaction'
import { Shield, Send, AlertTriangle } from 'lucide-react'
import RiskAnalyzer from './RiskAnalyzer'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'

export default function TransactionInterceptor({ walletAddress }) {
  const { provider, disconnectWallet } = useWallet()
  const { analyzeTransaction, isAnalyzing, analysisResult } = useTransaction()
  
  const [demoContractAddress, setDemoContractAddress] = useState('')
  const [demoSpenderAddress, setDemoSpenderAddress] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Demo: Simulate unlimited approval
  const simulateApproval = async () => {
    if (!demoContractAddress || !demoSpenderAddress) {
      toast.error('Please enter both contract and spender addresses')
      return
    }

    const ERC20_INTERFACE = new ethers.Interface([
      "function approve(address spender, uint256 amount)"
    ])

    const data = ERC20_INTERFACE.encodeFunctionData('approve', [
      demoSpenderAddress,
      ethers.MaxUint256 // Unlimited approval
    ])

    const transaction = {
      to: demoContractAddress,
      from: walletAddress,
      data: data,
      value: '0x0'
    }

    setShowAnalysis(true)
    await analyzeTransaction(transaction, provider, walletAddress)
  }

  // Demo: Simulate limited approval
  const simulateLimitedApproval = async () => {
    if (!demoContractAddress || !demoSpenderAddress) {
      toast.error('Please enter both contract and spender addresses')
      return
    }

    const ERC20_INTERFACE = new ethers.Interface([
      "function approve(address spender, uint256 amount)"
    ])

    const data = ERC20_INTERFACE.encodeFunctionData('approve', [
      demoSpenderAddress,
      ethers.parseEther('100') // Limited: 100 tokens
    ])

    const transaction = {
      to: demoContractAddress,
      from: walletAddress,
      data: data,
      value: '0x0'
    }

    setShowAnalysis(true)
    await analyzeTransaction(transaction, provider, walletAddress)
  }

  // Demo: Simulate transfer
  const simulateTransfer = async () => {
    if (!demoContractAddress) {
      toast.error('Please enter contract address')
      return
    }

    // Validate contract address
    if (!ethers.isAddress(demoContractAddress)) {
      toast.error('Invalid contract address format')
      return
    }

    const ERC20_INTERFACE = new ethers.Interface([
      "function transfer(address to, uint256 amount)"
    ])

    // Use a VALID safe recipient address with CORRECT checksum
    let safeRecipient
    
    if (demoSpenderAddress && ethers.isAddress(demoSpenderAddress)) {
      // Use the provided spender address
      safeRecipient = ethers.getAddress(demoSpenderAddress) // This ensures correct checksum
    } else {
      // Use default safe address (correctly checksummed)
      safeRecipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0'
    }

    const data = ERC20_INTERFACE.encodeFunctionData('transfer', [
      safeRecipient,
      ethers.parseEther('10') // 10 tokens
    ])

    const transaction = {
      to: demoContractAddress,
      from: walletAddress,
      data: data,
      value: '0x0'
    }

    setShowAnalysis(true)
    await analyzeTransaction(transaction, provider, walletAddress)
  }

  if (showAnalysis && analysisResult) {
    return (
      <div>
        <RiskAnalyzer 
          analysisResult={analysisResult}
          onCancel={() => {
            setShowAnalysis(false)
            toast.success('Transaction cancelled')
          }}
          onProceed={() => {
            toast.success('In a real scenario, transaction would be sent to MetaMask')
            setShowAnalysis(false)
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Transaction Monitor</h2>
            <p className="text-sm text-gray-500">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Demo Section */}
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Demo Mode</h3>
              <p className="text-sm text-gray-600">
                Simulate different transaction scenarios to see how our safety system works.
                No real transactions will be executed.
              </p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Contract Address
            </label>
            <input
              type="text"
              value={demoContractAddress}
              onChange={(e) => setDemoContractAddress(e.target.value)}
              placeholder="0x... (e.g., USDT on Sepolia)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Example Sepolia USDT: 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spender Address (for approval)
            </label>
            <input
              type="text"
              value={demoSpenderAddress}
              onChange={(e) => setDemoSpenderAddress(e.target.value)}
              placeholder="0x... (contract that will spend your tokens)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={simulateApproval}
            disabled={isAnalyzing}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{isAnalyzing ? 'Analyzing...' : '🚨 Unlimited Approval'}</span>
          </button>

          <button
            onClick={simulateLimitedApproval}
            disabled={isAnalyzing}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>{isAnalyzing ? 'Analyzing...' : '⚠️ Limited Approval'}</span>
          </button>

          <button
            onClick={simulateTransfer}
            disabled={isAnalyzing}
            className="flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            <span>{isAnalyzing ? 'Analyzing...' : '✅ Safe Transfer'}</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-1">✅ Safe (75-100)</h4>
            <p className="text-sm text-green-700">
              Normal transfers, verified contracts
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-1">⚠️ Caution (40-75)</h4>
            <p className="text-sm text-yellow-700">
              Limited approvals, unverified contracts
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-1">🚨 High Risk (0-40)</h4>
            <p className="text-sm text-red-700">
              Unlimited approvals, suspicious contracts
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}