import axios from 'axios'
import { ethers } from 'ethers'

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY
const NETWORK = import.meta.env.VITE_NETWORK || 'sepolia'

/**
 * Simulate transaction using Alchemy
 */
export async function simulateTransaction(transaction, provider) {
  try {
    // Use eth_call for read-only simulation
    const result = await provider.call({
      to: transaction.to,
      from: transaction.from,
      data: transaction.data,
      value: transaction.value || '0x0'
    })

    return {
      success: true,
      result: result,
      error: null
    }
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error.message
    }
  }
}

/**
 * Simulate transaction with Tenderly (more detailed)
 */
export async function simulateWithTenderly(transaction) {
  const TENDERLY_ACCESS_KEY = import.meta.env.VITE_TENDERLY_ACCESS_KEY
  
  if (!TENDERLY_ACCESS_KEY) {
    return null
  }

  try {
    const response = await axios.post(
      'https://api.tenderly.co/api/v1/public-contract/simulate',
      {
        network_id: NETWORK === 'sepolia' ? '11155111' : '1',
        from: transaction.from,
        to: transaction.to,
        input: transaction.data,
        value: transaction.value || '0',
        save: false,
        save_if_fails: false
      },
      {
        headers: {
          'X-Access-Key': TENDERLY_ACCESS_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    return {
      success: response.data.transaction.status,
      gasUsed: response.data.transaction.gas_used,
      logs: response.data.transaction.transaction_info.logs,
      balanceChanges: extractBalanceChanges(response.data),
      error: response.data.transaction.error_message
    }
  } catch (error) {
    console.error('Tenderly simulation error:', error)
    return null
  }
}

/**
 * Extract balance changes from simulation
 */
function extractBalanceChanges(simulationData) {
  const changes = []
  
  if (simulationData.transaction?.transaction_info?.balance_diff) {
    for (const [address, diff] of Object.entries(simulationData.transaction.transaction_info.balance_diff)) {
      changes.push({
        address,
        change: diff,
        type: 'ETH'
      })
    }
  }

  return changes
}

/**
 * Estimate gas for transaction
 */
export async function estimateGas(transaction, provider) {
  try {
    const gasEstimate = await provider.estimateGas({
      to: transaction.to,
      from: transaction.from,
      data: transaction.data,
      value: transaction.value || '0x0'
    })

    const feeData = await provider.getFeeData()

    return {
      gasLimit: gasEstimate.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
      estimatedCost: (gasEstimate * (feeData.maxFeePerGas || 0n)).toString()
    }
  } catch (error) {
    console.error('Gas estimation error:', error)
    return null
  }
}

/**
 * Get token balance changes (predicted)
 */
export async function predictTokenBalanceChange(transaction, tokenInfo, userAddress, provider) {
  try {
    const { functionName, args } = transaction.decoded

    if (functionName === 'approve' || functionName === 'increaseAllowance') {
      // Approval doesn't change balance, only allowance
      return {
        balanceChange: '0',
        allowanceChange: args[1]?.toString() || '0',
        type: 'APPROVAL'
      }
    }

    if (functionName === 'transfer') {
      const amount = args[1]?.toString() || '0'
      return {
        balanceChange: `-${amount}`,
        type: 'TRANSFER_OUT'
      }
    }

    if (functionName === 'transferFrom') {
      const from = args[0]
      const amount = args[2]?.toString() || '0'
      
      if (from.toLowerCase() === userAddress.toLowerCase()) {
        return {
          balanceChange: `-${amount}`,
          type: 'TRANSFER_OUT'
        }
      } else {
        return {
          balanceChange: amount,
          type: 'TRANSFER_IN'
        }
      }
    }

    return {
      balanceChange: '0',
      type: 'NO_CHANGE'
    }
  } catch (error) {
    console.error('Error predicting balance change:', error)
    return null
  }
}