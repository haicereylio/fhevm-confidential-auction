export const ConfidentialAuctionAddresses: Record<string, { address: string; chainId: number; chainName?: string }> = {
  "31337": {
    "address": "0x5c653ca4AeA7F2Da07f0AABf75F85766EAFDA615",
    "chainId": 31337,
    "chainName": "Hardhat"
  },
  "11155111": {
    "address": "0x957c413A9d76969Ff2251058735b2ADcA6668C25",
    "chainId": 11155111,
    "chainName": "Sepolia"
  }
} as const;