// import { createContext, useContext, useState } from 'react'
// import { ethers } from 'ethers'

// const WalletContext = createContext(null)

// export function WalletProvider({ children }) {
//   const [walletAddress, setWalletAddress] = useState(null)
//   const [provider, setProvider] = useState(null)
//   const [balance, setBalance] = useState(null)
//   const [isConnecting, setIsConnecting] = useState(false)

//   const connectWallet = async () => {
//     try {
//       setIsConnecting(true)

//       if (!window.ethereum) {
//         alert('MetaMask not found')
//         return
//       }

//       const ethProvider = new ethers.BrowserProvider(window.ethereum)
//       await ethProvider.send('eth_requestAccounts', [])

//       const signer = await ethProvider.getSigner()
//       const address = await signer.getAddress()
//       const bal = await ethProvider.getBalance(address)

//       setProvider(ethProvider)
//       setWalletAddress(address)
//       setBalance(ethers.formatEther(bal))
//     } finally {
//       setIsConnecting(false)
//     }
//   }

//   return (
//     <WalletContext.Provider
//       value={{
//         walletAddress,
//         provider,
//         balance,
//         isConnecting,
//         connectWallet
//       }}
//     >
//       {children}
//     </WalletContext.Provider>
//   )
// }

// export function useWallet() {
//   return useContext(WalletContext)
// }
import { createContext, useContext, useState } from 'react'
import { ethers } from 'ethers'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null)
  const [provider, setProvider] = useState(null)
  const [balance, setBalance] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    try {
      setIsConnecting(true)

      if (!window.ethereum) {
        alert('MetaMask not found')
        return
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      await ethProvider.send('eth_requestAccounts', [])

      const signer = await ethProvider.getSigner()
      const address = await signer.getAddress()
      const bal = await ethProvider.getBalance(address)

      setProvider(ethProvider)
      setWalletAddress(address)
      setBalance(ethers.formatEther(bal))
    } finally {
      setIsConnecting(false)
    }
  }

  // ✅ ADDED (this is what your code expects)
  const disconnectWallet = () => {
    setWalletAddress(null)
    setProvider(null)
    setBalance(null)
  }

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        provider,
        balance,
        isConnecting,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}
