import { ethers } from 'ethers'
import { ERC20_ABI, ERC721_ABI, MAX_UINT256, UNLIMITED_THRESHOLD } from './constants'

/**
 * Decode transaction data
 */
export function decodeTransaction(data, abi) {
  try {
    const iface = new ethers.Interface(abi)
    const decoded = iface.parseTransaction({ data })
    
    return {
      functionName: decoded.name,
      args: decoded.args,
      signature: decoded.signature,
      selector: decoded.selector,
      fragment: decoded.fragment
    }
  } catch (error) {
    console.error('Error decoding transaction:', error)
    return null
  }
}

/**
 * Try to decode with common ABIs
 */
export function decodeWithCommonABIs(data) {
  // Try ERC20 first
  let decoded = decodeTransaction(data, ERC20_ABI)
  if (decoded) {
    return { ...decoded, tokenType: 'ERC20' }
  }

  // Try ERC721
  decoded = decodeTransaction(data, ERC721_ABI)
  if (decoded) {
    return { ...decoded, tokenType: 'ERC721' }
  }

  // Try to extract function selector
  if (data.length >= 10) {
    return {
      functionName: 'Unknown',
      selector: data.slice(0, 10),
      args: [],
      tokenType: 'UNKNOWN'
    }
  }

  return null
}

/**
 * Check if approval is unlimited
 */
export function isUnlimitedApproval(functionName, args) {
  if (functionName !== 'approve' && functionName !== 'increaseAllowance') {
    return false
  }

  const amount = args[1] || args.amount
  
  if (!amount) return false

  try {
    const amountBigInt = BigInt(amount.toString())
    return amountBigInt >= UNLIMITED_THRESHOLD
  } catch {
    return false
  }
}

/**
 * Check if it's setApprovalForAll (NFT)
 */
export function isNFTApprovalForAll(functionName, args) {
  return functionName === 'setApprovalForAll' && args[1] === true
}

/**
 * Format amount for display
 */
export function formatAmount(amount, decimals = 18) {
  try {
    return ethers.formatUnits(amount, decimals)
  } catch {
    return '0'
  }
}

/**
 * Parse function arguments into readable format
 */
export function parseArguments(args, fragment) {
  const parsed = []
  
  fragment.inputs.forEach((input, index) => {
    const value = args[index]
    
    parsed.push({
      name: input.name || `param${index}`,
      type: input.type,
      value: formatArgumentValue(value, input.type)
    })
  })

  return parsed
}

/**
 * Format argument value based on type
 */
function formatArgumentValue(value, type) {
  if (type === 'address') {
    return value
  } else if (type.includes('uint') || type.includes('int')) {
    return value.toString()
  } else if (type === 'bool') {
    return value ? 'true' : 'false'
  } else if (type === 'bytes' || type.includes('bytes')) {
    return value
  } else if (type === 'string') {
    return value
  } else {
    return String(value)
  }
}

/**
 * Extract spender address from transaction
 */
export function extractSpenderAddress(functionName, args) {
  if (functionName === 'approve' || functionName === 'increaseAllowance') {
    return args[0] || args.spender
  }
  if (functionName === 'setApprovalForAll') {
    return args[0] || args.operator
  }
  return null
}

/**
 * Extract token amount from transaction
 */
export function extractTokenAmount(functionName, args) {
  if (functionName === 'approve' || functionName === 'increaseAllowance' || functionName === 'transfer') {
    return args[1] || args.amount || args.value
  }
  return null
}// ✅ ADD THIS FUNCTION (do not remove anything else)
export function decodeTransactionData(transaction) {
  if (!transaction?.data) return null
  return decodeWithCommonABIs(transaction.data)
}
