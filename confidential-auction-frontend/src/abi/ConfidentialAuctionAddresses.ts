export const ConfidentialAuctionAddresses: Record<string, { address: string; chainId: number; chainName?: string }> = {
  "31337": {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Default hardhat address (second deployment)
    chainId: 31337,
    chainName: "Hardhat"
  },
  "11155111": {
    address: "", // Add Sepolia address after deployment
    chainId: 11155111,
    chainName: "Sepolia"
  }
} as const;