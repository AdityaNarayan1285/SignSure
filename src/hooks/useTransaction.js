// 
import { decodeTransactionData } from '../utils/decoder'

import { useState } from 'react'
// import { decodeTransactionData } from '../utils/decoder'
// import { decodeWithCommonABIs } from '../utils/decoder'
import { analyzeContract } from '../utils/contractAnalyzer'
import { runPriorityChecks, getRiskLevelStyle } from '../utils/riskEngine'
import { detectToken } from '../utils/tokenDetector'
import { simulateTransaction } from '../utils/simulator'
import { ethers } from 'ethers'

export function useTransaction() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  /**
   * Main function: Analyze transaction with priority-based checks
   */
  const analyzeTransaction = async (transaction, provider, walletAddress) => {
    setIsAnalyzing(true)
    
    try {
      console.log('🔍 Starting transaction analysis...')
      console.log('Transaction:', transaction)

      // Step 1: Decode transaction
      const decoded = await decodeTransactionData(transaction)
 
      console.log('✅ Decoded:', decoded)

      // Step 2: Analyze contract
      const contractAnalysis = await analyzeContract(transaction.to)
      console.log('✅ Contract analysis:', contractAnalysis)

      // Step 3: Detect token (if it's an ERC-20 interaction)
      let tokenInfo = null
      if (decoded?.functionName === 'approve' || decoded?.functionName === 'transfer' || decoded?.functionName === 'transferFrom') {
        tokenInfo = await detectToken(transaction.to, provider)
        console.log('✅ Token info:', tokenInfo)
      }

      // Step 4: Get user balance
      let userBalance = null
      if (tokenInfo && provider && walletAddress) {
        try {
          const tokenContract = new ethers.Contract(
            transaction.to,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          )
          const balance = await tokenContract.balanceOf(walletAddress)
          userBalance = {
            balance: balance.toString(),
            formatted: ethers.formatUnits(balance, tokenInfo.decimals)
          }
        } catch (error) {
          console.warn('Could not fetch user balance:', error)
        }
      }

      // Step 5: Simulate transaction (optional - can be slow)
      let simulation = null
      try {
        simulation = await simulateTransaction(transaction, provider)
        console.log('✅ Simulation:', simulation)
      } catch (error) {
        console.warn('Simulation failed (non-critical):', error.message)
      }

      // Step 6: Estimate gas
      let gasEstimate = null
      try {
        const estimatedGas = await provider.estimateGas(transaction)
        const feeData = await provider.getFeeData()
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei')
        
        gasEstimate = {
          gasLimit: estimatedGas.toString(),
          gasPrice: gasPrice.toString(),
          estimatedCost: (estimatedGas * gasPrice).toString()
        }
        console.log('✅ Gas estimate:', gasEstimate)
      } catch (error) {
        console.warn('Gas estimation failed:', error.message)
      }

      // Step 7: RUN PRIORITY-BASED RISK CHECKS (NEW!)
      const riskAnalysis = runPriorityChecks(transaction, decoded, contractAnalysis, simulation)
      console.log('🎯 Risk Analysis (Priority-Based):', riskAnalysis)

      // Step 8: Get risk level styling
      const riskLevel = getRiskLevelStyle(riskAnalysis.riskLevel)

      // Step 9: Calculate final safety score
      const safetyScore = riskAnalysis.safetyScore

      // Compile final result
      const result = {
        transaction,
        decoded,
        contractAnalysis,
        tokenInfo,
        riskAnalysis,
        riskLevel,
        safetyScore,
        gasEstimate,
        simulation,
        userBalance
      }

      console.log('✅ Analysis complete:', result)
      setAnalysisResult(result)

    } catch (error) {
      console.error('❌ Analysis failed:', error)
      
      // Fallback analysis on error
      const fallbackResult = {
        transaction,
        decoded: { functionName: 'unknown', error: error.message },
        contractAnalysis: { isVerified: false },
        riskAnalysis: {
          riskLevel: 'CAUTION',
          safetyScore: 50,
          reasons: ['⚠️ Could not fully analyze transaction - proceed with caution'],
          warnings: [error.message],
          recommendations: ['Verify contract address manually on Etherscan'],
          decodedFunction: 'unknown'
        },
        riskLevel: getRiskLevelStyle('CAUTION'),
        safetyScore: 50,
        gasEstimate: null,
        simulation: null
      }
      
      setAnalysisResult(fallbackResult)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return {
    analyzeTransaction,
    isAnalyzing,
    analysisResult
  }
}