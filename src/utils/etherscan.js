import axios from 'axios'
import { NETWORKS } from './constants'

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY
const NETWORK = import.meta.env.VITE_NETWORK || 'sepolia'
const ETHERSCAN_BASE_URL = NETWORKS[NETWORK].apiUrl

/**
 * Get contract ABI from Etherscan
 */
export async function getContractABI(contractAddress) {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'contract',
        action: 'getabi',
        address: contractAddress,
        apikey: ETHERSCAN_API_KEY
      }
    })

    if (response.data.status === '1') {
      return JSON.parse(response.data.result)
    } else {
      return null
    }
  } catch (error) {
    console.error('Error fetching ABI:', error)
    return null
  }
}

/**
 * Check if contract is verified
 */
export async function isContractVerified(contractAddress) {
  const abi = await getContractABI(contractAddress)
  return abi !== null
}

/**
 * Get contract source code
 */
export async function getContractSource(contractAddress) {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
        apikey: ETHERSCAN_API_KEY
      }
    })

    if (response.data.status === '1' && response.data.result[0]) {
      return {
        sourceCode: response.data.result[0].SourceCode,
        contractName: response.data.result[0].ContractName,
        compilerVersion: response.data.result[0].CompilerVersion,
        optimization: response.data.result[0].OptimizationUsed,
        runs: response.data.result[0].Runs,
        constructorArguments: response.data.result[0].ConstructorArguments,
        evmVersion: response.data.result[0].EVMVersion,
        library: response.data.result[0].Library,
        licenseType: response.data.result[0].LicenseType,
        proxy: response.data.result[0].Proxy,
        implementation: response.data.result[0].Implementation,
        swarmSource: response.data.result[0].SwarmSource
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching contract source:', error)
    return null
  }
}

/**
 * Get contract creation info
 */
export async function getContractCreationInfo(contractAddress) {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'contract',
        action: 'getcontractcreation',
        contractaddresses: contractAddress,
        apikey: ETHERSCAN_API_KEY
      }
    })

    if (response.data.status === '1' && response.data.result[0]) {
      return {
        creator: response.data.result[0].contractCreator,
        txHash: response.data.result[0].txHash
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching contract creation:', error)
    return null
  }
}

/**
 * Get transaction count for address
 */
export async function getTransactionCount(address) {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionCount',
        address: address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    })

    return parseInt(response.data.result, 16)
  } catch (error) {
    console.error('Error fetching transaction count:', error)
    return 0
  }
}

/**
 * Get ETH balance
 */
export async function getETHBalance(address) {
  try {
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    })

    return response.data.result
  } catch (error) {
    console.error('Error fetching ETH balance:', error)
    return '0'
  }
}

/**
 * Get token transfers for address
 */
export async function getTokenTransfers(address, contractAddress = null) {
  try {
    const params = {
      module: 'account',
      action: 'tokentx',
      address: address,
      startblock: 0,
      endblock: 99999999,
      sort: 'desc',
      apikey: ETHERSCAN_API_KEY
    }

    if (contractAddress) {
      params.contractaddress = contractAddress
    }

    const response = await axios.get(ETHERSCAN_BASE_URL, { params })

    return response.data.result || []
  } catch (error) {
    console.error('Error fetching token transfers:', error)
    return []
  }
}