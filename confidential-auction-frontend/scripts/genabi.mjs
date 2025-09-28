import fs from 'fs';
import path from 'path';

const HARDHAT_ARTIFACTS_PATH = '../fhevm-hardhat-template/artifacts/contracts';
const ABI_OUTPUT_PATH = './src/abi';

function generateABI() {
  // Ensure output directory exists
  if (!fs.existsSync(ABI_OUTPUT_PATH)) {
    fs.mkdirSync(ABI_OUTPUT_PATH, { recursive: true });
  }

  // Read ConfidentialAuction artifact
  const artifactPath = path.join(HARDHAT_ARTIFACTS_PATH, 'ConfidentialAuction.sol/ConfidentialAuction.json');
  
  if (!fs.existsSync(artifactPath)) {
    console.error('ConfidentialAuction artifact not found. Run hardhat compile first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Generate ABI file
  const abiContent = `export const ConfidentialAuctionABI = ${JSON.stringify({ abi: artifact.abi }, null, 2)} as const;`;
  fs.writeFileSync(path.join(ABI_OUTPUT_PATH, 'ConfidentialAuctionABI.ts'), abiContent);

  // Generate addresses file
  const addressesContent = `export const ConfidentialAuctionAddresses: Record<string, { address: string; chainId: number; chainName?: string }> = {
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
} as const;`;
  
  fs.writeFileSync(path.join(ABI_OUTPUT_PATH, 'ConfidentialAuctionAddresses.ts'), addressesContent);

  console.log('✅ ABI files generated successfully!');
  console.log('📁 Generated files:');
  console.log('  - src/abi/ConfidentialAuctionABI.ts');
  console.log('  - src/abi/ConfidentialAuctionAddresses.ts');
}

generateABI();

