import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [network, setNetwork] = useState(null)
  const [balance, setBalance] = useState('0')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const address = accounts[0]
      
      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      const web3Network = await web3Provider.getNetwork()

      // Get balance
      const ethBalance = await web3Provider.getBalance(address)

      setWalletAddress(address)
      setProvider(web3Provider)
      setSigner(web3Signer)
      setNetwork(web3Network)
      setBalance(ethers.formatEther(ethBalance))

      return true
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err.message)
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletAddress(null)
    setProvider(null)
    setSigner(null)
    setNetwork(null)
    setBalance('0')
    setError(null)
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else if (accounts[0] !== walletAddress) {
          connectWallet()
        }
      }

      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [walletAddress])

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          })

          if (accounts.length > 0) {
            await connectWallet()
          }
        } catch (err) {
          console.error('Error checking connection:', err)
        }
      }
    }

    checkConnection()
  }, [])

  return {
    walletAddress,
    provider,
    signer,
    network,
    balance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  }
}