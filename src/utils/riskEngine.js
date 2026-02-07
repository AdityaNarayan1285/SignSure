import { RISK_LEVELS, TX_TYPES, MAX_UINT256 } from './constants'
import { isUnlimitedApproval, isNFTApprovalForAll } from './decoder'

/**
 * DETERMINISTIC RULE-BASED RISK ANALYSIS
 * No AI inference - only explicit rules
 */
export function analyzeRisk(transactionData) {
  const {
    transaction,
    decoded,
    contractAnalysis,
    tokenInfo,
    simulation,
    userBalance
  } = transactionData

  // Initialize result object
  let riskLevel = 'SAFE'
  let safetyScore = 90
  let reasons = []
  let decodedFunction = 'unknown'
  let warnings = []
  let recommendations = []
  let txType = TX_TYPES.UNKNOWN

  // Extract function name if decoded
  if (decoded && decoded.functionName) {
    decodedFunction = decoded.functionName
  }

  // ============================================
  // RULE 1: Simple ETH Transfer
  // ============================================
  if (!transaction.data || transaction.data === '0x' || transaction.data === '0x0') {
    // Check if recipient is EOA (not contract)
    // Note: We can't reliably check EOA vs contract without additional calls
    // So we'll treat empty data as safe ETH transfer
    riskLevel = 'SAFE'
    safetyScore = 95
    reasons.push('Simple ETH transfer')
    warnings.push('✅ Simple ETH transfer - no contract interaction')
    recommendations.push('Verify recipient address is correct')
    txType = TX_TYPES.TRANSFER
  }
  // ============================================
  // RULE 7: Simulation Predicts Asset Loss (HIGHEST PRIORITY)
  // ============================================
  else if (simulation && simulation.balanceChanges && simulation.balanceChanges.length > 0) {
    // Check for unexpected balance decreases
    const hasNegativeChange = simulation.balanceChanges.some(change => {
      const changeValue = change.change
      return changeValue && (changeValue.toString().startsWith('-') || parseFloat(changeValue) < 0)
    })

    if (hasNegativeChange) {
      riskLevel = 'HIGH'
      safetyScore = 5
      reasons.push('Simulation predicts asset loss')
      warnings.push('🚨 CRITICAL: Simulation shows you will lose assets!')
      warnings.push('Unexpected balance decrease detected')
      recommendations.push('REJECT this transaction immediately')
      recommendations.push('This transaction will drain your assets')
    }
  }
  // ============================================
  // RULE 3: Unlimited ERC-20 Approval (CRITICAL)
  // ============================================
  else if (decoded && (decoded.functionName === 'approve' || decoded.functionName === 'increaseAllowance')) {
    txType = TX_TYPES.APPROVE
    decodedFunction = decoded.functionName

    const approvalAmount = decoded.args[1]
    const isUnlimited = isUnlimitedApproval(decoded.functionName, decoded.args)

    if (isUnlimited) {
      riskLevel = 'HIGH'
      safetyScore = 10
      reasons.push('Unlimited token approval')
      warnings.push('🚨 CRITICAL RISK: UNLIMITED TOKEN APPROVAL')
      warnings.push('Contract can spend ALL your tokens at any time')
      warnings.push('This is the #1 way users lose crypto')
      recommendations.push('STRONGLY RECOMMEND: Cancel this transaction')
      recommendations.push('Only approve the exact amount you need')
      recommendations.push('If you must proceed, revoke immediately after use')
    } else {
      // ============================================
      // RULE 5: Limited ERC-20 Approval
      // ============================================
      riskLevel = 'CAUTION'
      safetyScore = 50
      reasons.push('Limited token approval')
      warnings.push('⚠️ Token approval with limited amount')
      warnings.push(`Approving specific amount (not unlimited)`)
      recommendations.push('Verify the spender contract is legitimate')
      recommendations.push('Consider revoking after use')
    }
  }
  // ============================================
  // RULE 4: NFT Full Approval Scam
  // ============================================
  else if (decoded && decoded.functionName === 'setApprovalForAll') {
    txType = TX_TYPES.NFT_APPROVE
    decodedFunction = 'setApprovalForAll'

    const approved = decoded.args[1]

    if (approved === true) {
      riskLevel = 'HIGH'
      safetyScore = 10
      reasons.push('Full NFT collection approval')
      warnings.push('🚨 CRITICAL RISK: NFT APPROVAL FOR ALL')
      warnings.push('Operator can transfer ALL your NFTs in this collection')
      warnings.push('One of the most common NFT scams')
      recommendations.push('STRONGLY RECOMMEND: Cancel this transaction')
      recommendations.push('Only approve trusted marketplaces like OpenSea')
      recommendations.push('Revoke approval immediately after trading')
    } else {
      riskLevel = 'SAFE'
      safetyScore = 80
      reasons.push('Revoking NFT approval')
      warnings.push('✅ Revoking NFT operator approval')
      recommendations.push('Good security practice')
    }
  }
  // ============================================
  // RULE 2: Generic Contract Interaction
  // ============================================
  else if (transaction.data && transaction.data !== '0x' && !decoded) {
    riskLevel = 'CAUTION'
    safetyScore = 65
    reasons.push('Unknown function call')
    warnings.push('⚠️ Contract interaction with unknown function')
    warnings.push('Unable to decode transaction data')
    recommendations.push('Verify contract address carefully')
    recommendations.push('Only proceed if you trust this contract')
    txType = TX_TYPES.CONTRACT_INTERACTION
  }
  // ============================================
  // Known Safe Functions (transfer, etc.)
  // ============================================
  else if (decoded && (decoded.functionName === 'transfer' || decoded.functionName === 'transferFrom')) {
    txType = TX_TYPES.TRANSFER
    decodedFunction = decoded.functionName
    riskLevel = 'SAFE'
    safetyScore = 85
    reasons.push('Token transfer')
    warnings.push('✅ Standard token transfer')
    recommendations.push('Verify recipient address')
  }
  // ============================================
  // Other Decoded Functions
  // ============================================
  else if (decoded && decoded.functionName) {
    decodedFunction = decoded.functionName
    riskLevel = 'CAUTION'
    safetyScore = 70
    reasons.push(`Function: ${decoded.functionName}`)
    warnings.push(`⚠️ Contract interaction: ${decoded.functionName}`)
    recommendations.push('Review transaction details carefully')
  }

  // ============================================
  // RULE 6: Unverified Contract (MODIFIER)
  // ============================================
  if (contractAnalysis && !contractAnalysis.isVerified && riskLevel !== 'HIGH') {
    // Reduce safety score by 20
    safetyScore = Math.max(0, safetyScore - 20)
    
    // Upgrade risk level if score drops too low
    if (safetyScore < 40 && riskLevel === 'SAFE') {
      riskLevel = 'CAUTION'
    }
    
    reasons.push('Unverified contract')
    warnings.push('🔍 Contract is NOT verified on Etherscan')
    warnings.push('Source code is not publicly available')
    recommendations.push('Extreme caution: Unverified contracts may be malicious')
    recommendations.push('Verify contract address matches official documentation')
  }

  // ============================================
  // Known Protocol Bonus (MODIFIER)
  // ============================================
  if (contractAnalysis && contractAnalysis.isKnownProtocol && riskLevel !== 'HIGH') {
    // Add bonus points for known protocols (but don't exceed safe thresholds)
    if (riskLevel === 'CAUTION') {
      safetyScore = Math.min(safetyScore + 10, 75)
    } else if (riskLevel === 'SAFE') {
      safetyScore = Math.min(safetyScore + 5, 100)
    }
    
    warnings.push(`✅ Known protocol: ${contractAnalysis.protocolName}`)
  }

  // ============================================
  // Simulation Failure (MODIFIER)
  // ============================================
  if (simulation && !simulation.success && riskLevel !== 'HIGH') {
    safetyScore = Math.max(0, safetyScore - 15)
    
    if (riskLevel === 'SAFE') {
      riskLevel = 'CAUTION'
    }
    
    reasons.push('Simulation failed')
    warnings.push('⚠️ Transaction simulation failed')
    warnings.push('Transaction will likely revert on-chain')
    recommendations.push('This transaction may fail and waste gas')
  }

  // ============================================
  // Known Malicious Contract (OVERRIDE ALL)
  // ============================================
  if (contractAnalysis && contractAnalysis.isMalicious) {
    riskLevel = 'HIGH'
    safetyScore = 0
    reasons = ['KNOWN MALICIOUS CONTRACT'] // Override all other reasons
    warnings = ['☠️ CRITICAL: KNOWN MALICIOUS CONTRACT']
    warnings.push('This contract has been flagged as a scam')
    recommendations = ['DO NOT PROCEED UNDER ANY CIRCUMSTANCES']
    recommendations.push('Report this website/contract')
  }

  // ============================================
  // Final Recommendations Based on Risk Level
  // ============================================
  if (riskLevel === 'HIGH' && recommendations.length < 2) {
    recommendations.push('Double-check contract address')
    recommendations.push('Verify you are on the legitimate website')
  } else if (riskLevel === 'CAUTION' && recommendations.length < 2) {
    recommendations.push('Proceed with caution')
    recommendations.push('Ensure you trust this contract')
  }

  // ============================================
  // Map to internal risk level format
  // ============================================
  let internalRiskLevel
  switch (riskLevel) {
    case 'SAFE':
      internalRiskLevel = RISK_LEVELS.SAFE
      break
    case 'CAUTION':
      internalRiskLevel = RISK_LEVELS.CAUTION
      break
    case 'HIGH':
      internalRiskLevel = RISK_LEVELS.CRITICAL
      break
    default:
      internalRiskLevel = RISK_LEVELS.SAFE
  }

  // ============================================
  // Return BOTH formats for compatibility
  // ============================================
  return {
    // New format (for judges/display)
    riskLevel,           // "SAFE" | "CAUTION" | "HIGH"
    safetyScore,         // 0-100
    reasons,             // Array of strings
    decodedFunction,     // Function name
    
    // Old format (for existing UI)
    riskLevel: internalRiskLevel,  // RISK_LEVELS object
    warnings,
    recommendations,
    txType,
    trustScore: contractAnalysis?.trustScore || 0
  }
}

/**
 * Calculate safety score (backwards compatibility)
 */
export function calculateSafetyScore(riskAnalysis, contractAnalysis) {
  // Return the score calculated by analyzeRisk
  return riskAnalysis.safetyScore || 50
}

/**
 * Get risk summary (backwards compatibility)
 */
export function getRiskSummary(riskAnalysis) {
  const { riskLevel, warnings, recommendations } = riskAnalysis

  let summary = ''
  let action = ''

  // Handle both string and object riskLevel
  const level = typeof riskLevel === 'string' ? riskLevel : riskLevel?.level

  switch (level) {
    case 'SAFE':
      summary = 'Transaction appears safe to proceed'
      action = 'You can proceed with confidence'
      break
    case 'CAUTION':
      summary = 'Exercise caution with this transaction'
      action = 'Review warnings before proceeding'
      break
    case 'HIGH':
    case 'CRITICAL':
      summary = '⚠️ CRITICAL RISK - DO NOT PROCEED'
      action = 'STRONGLY RECOMMEND: Cancel'
      break
    default:
      summary = 'Review transaction carefully'
      action = 'Verify all details'
  }

  return {
    summary,
    action,
    warningCount: warnings?.length || 0,
    recommendationCount: recommendations?.length || 0
  }
}

// ✅ ADAPTER: keep old API expected by useTransaction
export function runPriorityChecks(transaction, decoded, contractAnalysis, simulation) {
  return analyzeRisk({
    transaction,
    decoded,
    contractAnalysis,
    simulation
  })
}
// ✅ ADAPTER: UI styling helper
export function getRiskLevelStyle(level) {
  switch (level) {
    case 'SAFE':
      return {
        level: 'SAFE',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-800',
        icon: '✅'
      }

    case 'CAUTION':
      return {
        level: 'CAUTION',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-800',
        icon: '⚠️'
      }

    case 'HIGH':
    case 'CRITICAL':
      return {
        level: 'CRITICAL',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-800',
        icon: '🚨'
      }

    default:
      return {
        level: 'UNKNOWN',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-800',
        icon: '❓'
      }
  }
}
// import { RISK_LEVELS, TX_TYPES, MAX_UINT256 } from './constants'
// import { isUnlimitedApproval, isNFTApprovalForAll } from './decoder'

// /**
//  * DETERMINISTIC RULE-BASED RISK ANALYSIS - FIXED
//  */
// export function analyzeRisk(transactionData) {
//   const {
//     transaction,
//     decoded,
//     contractAnalysis,
//     tokenInfo,
//     simulation,
//     userBalance
//   } = transactionData

//   // Initialize result object
//   let riskLevel = 'SAFE'
//   let safetyScore = 90
//   let reasons = []
//   let decodedFunction = 'unknown'
//   let warnings = []
//   let recommendations = []
//   let txType = TX_TYPES.UNKNOWN
//   let executionStatus = 'OK' // NEW: Separate execution risk from security risk

//   // Extract function name if decoded
//   if (decoded && decoded.functionName) {
//     decodedFunction = decoded.functionName
//   }

//   // ============================================
//   // RULE 1: Simple ETH Transfer
//   // ============================================
//   if (!transaction.data || transaction.data === '0x' || transaction.data === '0x0') {
//     riskLevel = 'SAFE'
//     safetyScore = 95
//     reasons.push('Simple ETH transfer')
//     warnings.push('✅ Simple ETH transfer - no contract interaction')
//     recommendations.push('Verify recipient address is correct')
//     txType = TX_TYPES.TRANSFER
//   }
//   // ============================================
//   // RULE 7: Simulation Predicts Asset Loss (HIGHEST PRIORITY)
//   // ============================================
//   else if (simulation && simulation.balanceChanges && simulation.balanceChanges.length > 0) {
//     const hasNegativeChange = simulation.balanceChanges.some(change => {
//       const changeValue = change.change
//       return changeValue && (changeValue.toString().startsWith('-') || parseFloat(changeValue) < 0)
//     })

//     if (hasNegativeChange) {
//       riskLevel = 'HIGH'
//       safetyScore = 5
//       reasons.push('Simulation predicts asset loss')
//       warnings.push('🚨 CRITICAL: Simulation shows you will lose assets!')
//       warnings.push('Unexpected balance decrease detected')
//       recommendations.push('REJECT this transaction immediately')
//       recommendations.push('This transaction will drain your assets')
//     }
//   }
//   // ============================================
//   // RULE 3: Unlimited ERC-20 Approval (CRITICAL)
//   // ============================================
//   else if (decoded && (decoded.functionName === 'approve' || decoded.functionName === 'increaseAllowance')) {
//     txType = TX_TYPES.APPROVE
//     decodedFunction = decoded.functionName

//     const isUnlimited = isUnlimitedApproval(decoded.functionName, decoded.args)

//     if (isUnlimited) {
//       riskLevel = 'HIGH'
//       safetyScore = 10
//       reasons.push('Unlimited token approval')
//       warnings.push('🚨 CRITICAL RISK: UNLIMITED TOKEN APPROVAL')
//       warnings.push('Contract can spend ALL your tokens at any time')
//       warnings.push('This is the #1 way users lose crypto')
//       recommendations.push('STRONGLY RECOMMEND: Cancel this transaction')
//       recommendations.push('Only approve the exact amount you need')
//       recommendations.push('If you must proceed, revoke immediately after use')
//     } else {
//       // ============================================
//       // RULE 5: Limited ERC-20 Approval - FIXED SCORING
//       // ============================================
//       riskLevel = 'CAUTION'
//       safetyScore = 50 // Base score for limited approval
//       reasons.push('Limited token approval')
//       warnings.push('⚠️ Token approval with limited amount')
//       warnings.push(`Approving specific amount (not unlimited)`)
//       recommendations.push('Verify the spender contract is legitimate')
//       recommendations.push('Consider revoking after use')
//     }
//   }
//   // ============================================
//   // RULE 4: NFT Full Approval Scam - WITH TOKEN TYPE CHECK
//   // ============================================
//   else if (decoded && decoded.functionName === 'setApprovalForAll') {
//     txType = TX_TYPES.NFT_APPROVE
//     decodedFunction = 'setApprovalForAll'

//     // FIX #4: Detect if this is being called on wrong token type
//     if (tokenInfo && tokenInfo.type === 'ERC20') {
//       riskLevel = 'CAUTION'
//       safetyScore = 40
//       reasons.push('Invalid transaction type')
//       warnings.push('⚠️ NFT approval function called on ERC-20 token')
//       warnings.push('This transaction is invalid and will revert on-chain')
//       warnings.push('setApprovalForAll only works on ERC-721 (NFT) contracts')
//       recommendations.push('This appears to be a mistake or malicious attempt')
//       recommendations.push('Cancel this transaction')
//       executionStatus = 'WILL FAIL'
//     } else {
//       const approved = decoded.args[1]

//       if (approved === true) {
//         riskLevel = 'HIGH'
//         safetyScore = 10
//         reasons.push('Full NFT collection approval')
//         warnings.push('🚨 CRITICAL RISK: NFT APPROVAL FOR ALL')
//         warnings.push('Operator can transfer ALL your NFTs in this collection')
//         warnings.push('One of the most common NFT scams')
//         recommendations.push('STRONGLY RECOMMEND: Cancel this transaction')
//         recommendations.push('Only approve trusted marketplaces like OpenSea')
//         recommendations.push('Revoke approval immediately after trading')
//       } else {
//         riskLevel = 'SAFE'
//         safetyScore = 80
//         reasons.push('Revoking NFT approval')
//         warnings.push('✅ Revoking NFT operator approval')
//         recommendations.push('Good security practice')
//       }
//     }
//   }
//   // ============================================
//   // RULE 2: Generic Contract Interaction
//   // ============================================
//   else if (transaction.data && transaction.data !== '0x' && !decoded) {
//     riskLevel = 'CAUTION'
//     safetyScore = 65
//     reasons.push('Unknown function call')
//     warnings.push('⚠️ Contract interaction with unknown function')
//     warnings.push('Unable to decode transaction data')
//     recommendations.push('Verify contract address carefully')
//     recommendations.push('Only proceed if you trust this contract')
//     txType = TX_TYPES.CONTRACT_INTERACTION
//   }
//   // ============================================
//   // Known Safe Functions (transfer, etc.) - FIXED FLOOR
//   // ============================================
//   else if (decoded && (decoded.functionName === 'transfer' || decoded.functionName === 'transferFrom')) {
//     txType = TX_TYPES.TRANSFER
//     decodedFunction = decoded.functionName
//     riskLevel = 'SAFE'
//     safetyScore = 85 // FIX #1: Higher floor for transfers
//     reasons.push('Token transfer')
//     warnings.push('✅ Standard token transfer')
//     recommendations.push('Verify recipient address')
//   }
//   // ============================================
//   // Other Decoded Functions
//   // ============================================
//   else if (decoded && decoded.functionName) {
//     decodedFunction = decoded.functionName
//     riskLevel = 'CAUTION'
//     safetyScore = 70
//     reasons.push(`Function: ${decoded.functionName}`)
//     warnings.push(`⚠️ Contract interaction: ${decoded.functionName}`)
//     recommendations.push('Review transaction details carefully')
//   }

//   // ============================================
//   // RULE 6: Unverified Contract (MODIFIER) - FIXED
//   // ============================================
//   if (contractAnalysis && !contractAnalysis.isVerified && riskLevel !== 'HIGH') {
//     // FIX #1: SAFE + Unverified = must be CAUTION minimum
//     if (riskLevel === 'SAFE') {
//       riskLevel = 'CAUTION'
//       safetyScore = Math.min(safetyScore, 70) // Cap SAFE score for unverified
//     }
    
//     // FIX #3: Cap penalty for limited approvals
//     if (txType === TX_TYPES.APPROVE && safetyScore === 50) {
//       safetyScore = Math.max(45, safetyScore - 15) // Reduce from -20 to -15, with floor
//     } else {
//       safetyScore = Math.max(40, safetyScore - 20) // Normal penalty with floor
//     }
    
//     reasons.push('Unverified contract')
//     warnings.push('🔍 Contract is NOT verified on Etherscan')
//     warnings.push('Source code is not publicly available')
//     recommendations.push('Extreme caution: Unverified contracts may be malicious')
//     recommendations.push('Verify contract address matches official documentation')
//   }

//   // ============================================
//   // Known Protocol Bonus (MODIFIER)
//   // ============================================
//   if (contractAnalysis && contractAnalysis.isKnownProtocol && riskLevel !== 'HIGH') {
//     if (riskLevel === 'CAUTION') {
//       safetyScore = Math.min(safetyScore + 10, 75)
//     } else if (riskLevel === 'SAFE') {
//       safetyScore = Math.min(safetyScore + 5, 95)
//     }
    
//     warnings.push(`✅ Known protocol: ${contractAnalysis.protocolName}`)
//   }

//   // ============================================
//   // FIX #5: Simulation Failure - Separate Execution Risk
//   // ============================================
//   if (simulation && !simulation.success && riskLevel !== 'HIGH') {
//     // Check if it's a balance/execution issue vs security issue
//     const isBalanceIssue = simulation.error && (
//       simulation.error.toLowerCase().includes('balance') ||
//       simulation.error.toLowerCase().includes('insufficient') ||
//       simulation.error.toLowerCase().includes('exceeds')
//     )

//     if (isBalanceIssue) {
//       // FIX #5: Don't penalize security score for execution issues
//       executionStatus = 'WILL FAIL'
//       warnings.push('ℹ️ Transaction will fail: Insufficient balance')
//       recommendations.push('This is an execution error, not a security risk')
//       recommendations.push('Check your token balance before proceeding')
//     } else {
//       // Unknown simulation failure - treat as potential risk
//       safetyScore = Math.max(40, safetyScore - 15)
      
//       if (riskLevel === 'SAFE') {
//         riskLevel = 'CAUTION'
//       }
      
//       executionStatus = 'MAY FAIL'
//       warnings.push('⚠️ Transaction simulation failed')
//       warnings.push('Transaction may fail on-chain')
//       recommendations.push('This transaction may not execute successfully')
//     }
//   }

//   // ============================================
//   // Known Malicious Contract (OVERRIDE ALL)
//   // ============================================
//   if (contractAnalysis && contractAnalysis.isMalicious) {
//     riskLevel = 'HIGH'
//     safetyScore = 0
//     reasons = ['KNOWN MALICIOUS CONTRACT']
//     warnings = ['☠️ CRITICAL: KNOWN MALICIOUS CONTRACT']
//     warnings.push('This contract has been flagged as a scam')
//     recommendations = ['DO NOT PROCEED UNDER ANY CIRCUMSTANCES']
//     recommendations.push('Report this website/contract')
//     executionStatus = 'DANGEROUS'
//   }

//   // ============================================
//   // Final Recommendations Based on Risk Level
//   // ============================================
//   if (riskLevel === 'HIGH' && recommendations.length < 2) {
//     recommendations.push('Double-check contract address')
//     recommendations.push('Verify you are on the legitimate website')
//   } else if (riskLevel === 'CAUTION' && recommendations.length < 2) {
//     recommendations.push('Proceed with caution')
//     recommendations.push('Ensure you trust this contract')
//   } else if (riskLevel === 'SAFE' && recommendations.length < 2) {
//     recommendations.push('Transaction appears safe')
//     recommendations.push('Always verify recipient addresses')
//   }

//   // ============================================
//   // Map to internal risk level format
//   // ============================================
//   let internalRiskLevel
//   switch (riskLevel) {
//     case 'SAFE':
//       internalRiskLevel = RISK_LEVELS.SAFE
//       break
//     case 'CAUTION':
//       internalRiskLevel = RISK_LEVELS.CAUTION
//       break
//     case 'HIGH':
//       internalRiskLevel = RISK_LEVELS.CRITICAL
//       break
//     default:
//       internalRiskLevel = RISK_LEVELS.SAFE
//   }

//   // ============================================
//   // Return BOTH formats for compatibility
//   // ============================================
//   return {
//     // New format
//     riskLevel,
//     safetyScore: Math.max(0, Math.min(100, Math.round(safetyScore))),
//     reasons,
//     decodedFunction,
//     executionStatus, // NEW: Separate execution risk
    
//     // Old format (for existing UI)
//     riskLevel: internalRiskLevel,
//     warnings,
//     recommendations,
//     txType,
//     trustScore: contractAnalysis?.trustScore || 0
//   }
// }

// export function calculateSafetyScore(riskAnalysis, contractAnalysis) {
//   return riskAnalysis.safetyScore || 50
// }

// export function getRiskSummary(riskAnalysis) {
//   const { riskLevel, warnings, recommendations } = riskAnalysis
//   const level = typeof riskLevel === 'string' ? riskLevel : riskLevel?.level

//   let summary = ''
//   let action = ''

//   switch (level) {
//     case 'SAFE':
//       summary = 'Transaction appears safe to proceed'
//       action = 'You can proceed with confidence'
//       break
//     case 'CAUTION':
//       summary = 'Exercise caution with this transaction'
//       action = 'Review warnings before proceeding'
//       break
//     case 'HIGH':
//     case 'CRITICAL':
//       summary = '⚠️ CRITICAL RISK - DO NOT PROCEED'
//       action = 'STRONGLY RECOMMEND: Cancel'
//       break
//     default:
//       summary = 'Review transaction carefully'
//       action = 'Verify all details'
//   }

//   return {
//     summary,
//     action,
//     warningCount: warnings?.length || 0,
//     recommendationCount: recommendations?.length || 0
//   }
// }// =========================
// // UI STYLE HELPER (REQUIRED BY UI)
// // =========================
// export function getRiskLevelStyle(level) {
//   const lvl = typeof level === 'string' ? level : level?.level

//   switch (lvl) {
//     case 'SAFE':
//       return {
//         level: 'SAFE',
//         bgColor: 'bg-green-50',
//         borderColor: 'border-green-300',
//         textColor: 'text-green-800',
//         icon: '✅'
//       }

//     case 'CAUTION':
//       return {
//         level: 'CAUTION',
//         bgColor: 'bg-yellow-50',
//         borderColor: 'border-yellow-300',
//         textColor: 'text-yellow-800',
//         icon: '⚠️'
//       }

//     case 'HIGH':
//     case 'CRITICAL':
//       return {
//         level: 'CRITICAL',
//         bgColor: 'bg-red-50',
//         borderColor: 'border-red-300',
//         textColor: 'text-red-800',
//         icon: '🚨'
//       }

//     default:
//       return {
//         level: 'UNKNOWN',
//         bgColor: 'bg-gray-50',
//         borderColor: 'border-gray-300',
//         textColor: 'text-gray-800',
//         icon: '❓'
//       }
//   }
// }
