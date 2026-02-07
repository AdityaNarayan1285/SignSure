import { ethers } from 'ethers'

// Maximum values (FIXED - removed duplicate)
export const MAX_UINT256 = ethers.MaxUint256
export const UNLIMITED_THRESHOLD = MAX_UINT256 * 90n / 100n

// Network configurations
export const NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7',
    chainIdDecimal: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    apiUrl: 'https://api-sepolia.etherscan.io/api'
  },
  mainnet: {
    chainId: '0x1',
    chainIdDecimal: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api'
  }
}

// Risk levels
export const RISK_LEVELS = {
  SAFE: {
    level: 'SAFE',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-500',
    icon: '✅'
  },
  CAUTION: {
    level: 'CAUTION',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-500',
    icon: '⚠️'
  },
  HIGH_RISK: {
    level: 'HIGH_RISK',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-500',
    icon: '🚨'
  },
  CRITICAL: {
    level: 'CRITICAL',
    color: 'red',
    bgColor: 'bg-red-200',
    textColor: 'text-red-900',
    borderColor: 'border-red-700',
    icon: '☠️'
  }
}

// Common ERC20 ABI
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]

// Common ERC721 (NFT) ABI
export const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)"
]

// Dangerous function signatures
export const DANGEROUS_FUNCTIONS = {
  'transferFrom': { risk: 'HIGH', description: 'Can transfer tokens from your wallet' },
  'safeTransferFrom': { risk: 'HIGH', description: 'Can transfer NFTs from your wallet' },
  'setApprovalForAll': { risk: 'CRITICAL', description: 'Gives unlimited access to ALL your NFTs' },
  'delegatecall': { risk: 'CRITICAL', description: 'Can execute arbitrary code' },
  'selfdestruct': { risk: 'CRITICAL', description: 'Can destroy the contract' },
  'withdraw': { risk: 'CAUTION', description: 'Withdrawing funds' },
  'emergencyWithdraw': { risk: 'HIGH', description: 'Emergency withdrawal detected' },
  'rug': { risk: 'CRITICAL', description: 'Potential rug pull function' },
  'renounceOwnership': { risk: 'CAUTION', description: 'Ownership transfer' }
}

// Known malicious contracts
export const KNOWN_MALICIOUS = new Set([
  '0x0000000000000000000000000000000000000000',
])

// Common DeFi protocols (whitelist)
export const KNOWN_PROTOCOLS = {
  // Mainnet - Uniswap
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2 Router',
  '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3 Router',
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': 'Uniswap V3 Router 2',
  
  // Mainnet - 1inch
  '0x1111111254EEB25477B68fb85Ed929f73A960582': '1inch V5 Router',
  '0x1111111254fb6c44bAC0beD2854e76F90643097d': '1inch V4 Router',
  
  // Mainnet - SushiSwap
  '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F': 'SushiSwap Router',
  
  // Mainnet - Aave
  '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9': 'Aave Lending Pool',
  
  // Mainnet - Curve
  '0x8301AE4fc9c624d1D396cbDAa1ed877821D7C511': 'Curve CRV Token',
  
  // Sepolia Testnet
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD': 'Uniswap V3 Sepolia Router',
  '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008': 'Sepolia Swap Router',
  '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506': 'Sushiswap Sepolia Router',
}

// Transaction types
export const TX_TYPES = {
  APPROVE: 'APPROVE',
  TRANSFER: 'TRANSFER',
  SWAP: 'SWAP',
  STAKE: 'STAKE',
  CLAIM: 'CLAIM',
  NFT_APPROVE: 'NFT_APPROVE',
  NFT_TRANSFER: 'NFT_TRANSFER',
  CONTRACT_INTERACTION: 'CONTRACT_INTERACTION',
  UNKNOWN: 'UNKNOWN'
}