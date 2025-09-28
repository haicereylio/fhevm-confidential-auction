export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

export const FHEVM_CONSTANTS = {
  // Default mock chains for development
  DEFAULT_MOCK_CHAINS: {
    31337: "http://localhost:8545", // Hardhat
  },
  
  // FHEVM configuration
  PUBLIC_KEY_CACHE_KEY: "fhevm_public_key",
  DECRYPTION_SIGNATURE_CACHE_KEY: "fhevm_decryption_signature",
  
  // Network configurations
  SUPPORTED_CHAINS: {
    31337: {
      name: "Hardhat",
      rpcUrl: "http://localhost:8545",
      isMock: true,
    },
    11155111: {
      name: "Sepolia",
      rpcUrl: "https://sepolia.infura.io/v3/",
      isMock: false,
    },
  },
  
  // Timeouts and retries
  CONNECTION_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

