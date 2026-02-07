import { getContractSource, getContractCreationInfo, getTransactionCount } from './etherscan'
import { KNOWN_MALICIOUS, KNOWN_PROTOCOLS, DANGEROUS_FUNCTIONS } from './constants'

/**
 * Comprehensive contract analysis
 */
export async function analyzeContract(contractAddress) {
  const analysis = {
    address: contractAddress,
    isKnownProtocol: false,
    protocolName: null,
    isMalicious: false,
    isVerified: false,
    creationInfo: null,
    sourceCodeAvailable: false,
    contractAge: null,
    suspiciousPatterns: [],
    trustScore: 0
  }

  // Check if known protocol
  if (KNOWN_PROTOCOLS[contractAddress]) {
    analysis.isKnownProtocol = true
    analysis.protocolName = KNOWN_PROTOCOLS[contractAddress]
    analysis.trustScore = 100
    return analysis
  }

  // Check if known malicious
  if (KNOWN_MALICIOUS.has(contractAddress)) {
    analysis.isMalicious = true
    analysis.trustScore = 0
    return analysis
  }

  try {
    // Get contract source
    const sourceInfo = await getContractSource(contractAddress)
    
    if (sourceInfo && sourceInfo.sourceCode) {
      analysis.isVerified = true
      analysis.sourceCodeAvailable = true
      analysis.contractName = sourceInfo.contractName
      analysis.trustScore += 30

      // Analyze source code for suspicious patterns
      const suspiciousPatterns = analyzeSourceCode(sourceInfo.sourceCode)
      analysis.suspiciousPatterns = suspiciousPatterns
     

      if (suspiciousPatterns.length > 0) {
        analysis.trustScore -= suspiciousPatterns.length * 10
      } else {
        analysis.trustScore += 20
      }
    }

    // Get creation info
    const creationInfo = await getContractCreationInfo(contractAddress)
    if (creationInfo) {
      analysis.creationInfo = creationInfo
      analysis.trustScore += 10

      // Check creator's transaction history
      const txCount = await getTransactionCount(creationInfo.creator)
      
      if (txCount > 100) {
        analysis.trustScore += 20
      } else if (txCount < 10) {
        analysis.suspiciousPatterns.push('Contract creator has very few transactions')
        analysis.trustScore -= 15
      }
    }

    // Ensure trust score is between 0 and 100
    analysis.trustScore = Math.max(0, Math.min(100, analysis.trustScore))

  } catch (error) {
    console.error('Error analyzing contract:', error)
  }

  return analysis
}

/**
 * Analyze source code for suspicious patterns
 */
function analyzeSourceCode(sourceCode) {
  const suspicious = []
  
  // Check for dangerous keywords
  const dangerousKeywords = [
    'selfdestruct',
    'delegatecall',
    'suicide',
    'onlyOwner modifier bypass',
    'tx.origin',
    'block.timestamp manipulation'
  ]

  dangerousKeywords.forEach(keyword => {
    if (sourceCode.toLowerCase().includes(keyword.toLowerCase())) {
      suspicious.push(`Contains dangerous keyword: ${keyword}`)
    }
  })

  // Check for hidden admin functions
  if (sourceCode.includes('onlyOwner') && sourceCode.includes('withdraw')) {
    suspicious.push('Contains owner-only withdrawal function')
  }

  // Check for pausable without timelock
  if (sourceCode.includes('pause()') && !sourceCode.includes('timelock')) {
    suspicious.push('Pausable contract without timelock protection')
  }

  // Check for proxy patterns
  if (sourceCode.includes('delegatecall')) {
    suspicious.push('Uses proxy pattern (upgradeable)')
  }

  return suspicious
}

/**
 * Check function safety
 */
export function analyzeFunctionSafety(functionName) {
  if (DANGEROUS_FUNCTIONS[functionName]) {
    return {
      isDangerous: true,
      risk: DANGEROUS_FUNCTIONS[functionName].risk,
      description: DANGEROUS_FUNCTIONS[functionName].description
    }
  }

  return {
    isDangerous: false,
    risk: 'LOW',
    description: 'Standard function'
  }
}