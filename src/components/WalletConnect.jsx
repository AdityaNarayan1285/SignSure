// import { useState } from 'react'
// import { WalletProvider, useWallet } from '../context/WalletContext'
// // Should be (CORRECT):
// import { useWallet } from "../context/WalletContext";
// import { Toaster } from 'react-hot-toast'
// import { default as WalletConnect } from './components/WalletConnect'

// import TransactionInterceptor from './components/TransactionInterceptor'
// import ApprovalDashboard from './components/ApprovalDashboard'
// import { Shield, FileText } from 'lucide-react'

// function AppContent() {
//   const { walletAddress } = useWallet()
//   const [activeTab, setActiveTab] = useState('monitor')

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4">
//       <div className="max-w-5xl w-full">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4">
//             <Shield className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-5xl font-bold text-white mb-2">
//             🛡️ Transaction Safety Wallet
//           </h1>
//           <p className="text-gray-200 text-lg">
//             Protect yourself from malicious transactions before you sign
//           </p>
//         </div>

//         {/* Main Content */}
//         <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
//           {!walletAddress ? (
//             <div className="p-8">
//               <WalletConnect />
//             </div>
//           ) : (
//             <>
//               {/* Tabs */}
//               <div className="flex border-b border-gray-200">
//                 <button
//                   onClick={() => setActiveTab('monitor')}
//                   className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center space-x-2 ${
//                     activeTab === 'monitor'
//                       ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
//                       : 'text-gray-600 hover:text-gray-800'
//                   }`}
//                 >
//                   <Shield className="w-5 h-5" />
//                   <span>Transaction Monitor</span>
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('approvals')}
//                   className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center space-x-2 ${
//                     activeTab === 'approvals'
//                       ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
//                       : 'text-gray-600 hover:text-gray-800'
//                   }`}
//                 >
//                   <FileText className="w-5 h-5" />
//                   <span>Active Approvals</span>
//                 </button>
//               </div>

//               {/* Tab Content */}
//               <div className="p-8">
//                 {activeTab === 'monitor' ? (
//                   <TransactionInterceptor walletAddress={walletAddress} />
//                 ) : (
//                   <ApprovalDashboard />
//                 )}
//               </div>
//             </>
//           )}
//         </div>

//         {/* Footer */}
//         {walletAddress && (
//           <div className="text-center mt-6">
//             <p className="text-white text-sm">
//               Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
//             </p>
//           </div>
//         )}

//         {/* Info Footer */}
//         <div className="mt-8 text-center text-white text-sm">
//           <p className="mb-2">Built for Hackathon • Sepolia Testnet Only</p>
//           <p className="text-gray-300">
//             Always verify contract addresses and understand risks before approving transactions
//           </p>
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             background: '#363636',
//             color: '#fff',
//           },
//           success: {
//             iconTheme: {
//               primary: '#10b981',
//               secondary: '#fff',
//             },
//           },
//           error: {
//             iconTheme: {
//               primary: '#ef4444',
//               secondary: '#fff',
//             },
//           },
//         }}
//       />
//     </div>
//   )
// }

// function App() {
//   return (
//     <WalletProvider>
//       <AppContent />
//     </WalletProvider>
//   )
// }

// export default App


import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { Shield } from 'lucide-react'

export default function WalletConnect() {
  const { connectWallet, isConnecting } = useWallet()
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    try {
      setError(null)
      await connectWallet()
    } catch (err) {
      setError('Failed to connect wallet')
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-purple-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">
        Connect Your Wallet
      </h2>

      <p className="text-gray-600">
        Connect MetaMask to start analyzing transactions
      </p>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  )
}
