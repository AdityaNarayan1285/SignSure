import { ethers } from 'ethers'
import { ERC20_ABI, ERC721_ABI } from './constants'

/**
 * Detect token type (ERC20, ERC721, or unknown)
 */
export async function detectTokenType(contractAddress, provider) {
  try {
    // Try ERC20 first
    const isERC20 = await checkERC20(contractAddress, provider)
    if (isERC20) {
      return 'ERC20'
    }

    // Try ERC721
    const isERC721 = await checkERC721(contractAddress, provider)
    if (isERC721) {
      return 'ERC721'
    }

    return 'UNKNOWN'
  } catch (error) {
    console.error('Error detecting token type:', error)
    return 'UNKNOWN'
  }
}

/**
 * Check if contract is ERC20
 */
async function checkERC20(contractAddress, provider) {
  try {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
    
    // Try to call standard ERC20 functions
    await contract.totalSupply()
    await contract.decimals()
    await contract.symbol()
    
    return true
  } catch {
    return false
  }
}

/**
 * Check if contract is ERC721
 */
async function checkERC721(contractAddress, provider) {
  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
    
    // Try to call standard ERC721 functions
    await contract.name()
    await contract.symbol()
    
    return true
  } catch {
    return false
  }
}

/**
 * Get ERC20 token info
 */
export async function getERC20Info(contractAddress, provider) {
  try {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider)
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ])

    return {
      type: 'ERC20',
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
      address: contractAddress
    }
  } catch (error) {
    console.error('Error getting ERC20 info:', error)
    return null
  }
}

/**
 * Get ERC721 token info
 */
export async function getERC721Info(contractAddress, provider) {
  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider)
    
    const [name, symbol] = await Promise.all([
      contract.name(),
      contract.symbol()
    ])

    return {
      type: 'ERC721',
      name,
      symbol,
      address: contractAddress
    }
  } catch (error) {
    console.error('Error getting ERC721 info:', error)
    return null
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(tokenAddress, walletAddress, provider) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const balance = await contract.balanceOf(walletAddress)
    return balance.toString()
  } catch (error) {
    console.error('Error getting token balance:', error)
    return '0'
  }
}

/**
 * Get current allowance
 */
export async function getCurrentAllowance(tokenAddress, ownerAddress, spenderAddress, provider) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const allowance = await contract.allowance(ownerAddress, spenderAddress)
    return allowance.toString()
  } catch (error) {
    console.error('Error getting allowance:', error)
    return '0'
  }
}

/**
 * Get NFT balance
 */
export async function getNFTBalance(nftAddress, walletAddress, provider) {
  try {
    const contract = new ethers.Contract(nftAddress, ERC721_ABI, provider)
    const balance = await contract.balanceOf(walletAddress)
    return balance.toString()
  } catch (error) {
    console.error('Error getting NFT balance:', error)
    return '0'
  }
}

/**
 * Check if operator is approved for all NFTs
 */
export async function isApprovedForAll(nftAddress, ownerAddress, operatorAddress, provider) {
  try {
    const contract = new ethers.Contract(nftAddress, ERC721_ABI, provider)
    return await contract.isApprovedForAll(ownerAddress, operatorAddress)
  } catch (error) {
    console.error('Error checking approval for all:', error)
    return false
  }
}

export async function detectToken(contractAddress, provider) {
  const type = await detectTokenType(contractAddress, provider)

  if (type === 'ERC20') {
    return await getERC20Info(contractAddress, provider)
  }

  if (type === 'ERC721') {
    return await getERC721Info(contractAddress, provider)
  }

  return null
}