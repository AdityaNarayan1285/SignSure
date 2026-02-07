import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { getTokenTransfers } from '../utils/etherscan'
import { ERC20_ABI } from '../utils/constants'

export function useApprovals(walletAddress, provider) {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchApprovals = async () => {
    if (!walletAddress || !provider) return

    setLoading(true)

    try {
      // Get all token transfers to find tokens user has interacted with
      const transfers = await getTokenTransfers(walletAddress)
      
      // Get unique token addresses
      const tokenAddresses = [...new Set(transfers.map(t => t.contractAddress))]

      // Check approvals for each token
      const approvalPromises = tokenAddresses.slice(0, 20).map(async (tokenAddress) => {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
          
          // This would require tracking all spenders - simplified for demo
          const [name, symbol] = await Promise.all([
            contract.name(),
            contract.symbol()
          ])

          return {
            tokenAddress,
            name,
            symbol,
            spenders: [] // Would need to track approval events
          }
        } catch {
          return null
        }
      })

      const results = await Promise.all(approvalPromises)
      setApprovals(results.filter(Boolean))
    } catch (error) {
      console.error('Error fetching approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeApproval = async (tokenAddress, spenderAddress) => {
    if (!provider) return false

    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
      
      // Set approval to 0
      const tx = await contract.approve(spenderAddress, 0)
      await tx.wait()

      return true
    } catch (error) {
      console.error('Error revoking approval:', error)
      return false
    }
  }

  useEffect(() => {
    if (walletAddress && provider) {
      fetchApprovals()
    }
  }, [walletAddress, provider])

  return {
    approvals,
    loading,
    fetchApprovals,
    revokeApproval
  }
}