import fs from 'fs';
import path from 'path';

const HARDHAT_ARTIFACTS_PATH = '../fhevm-hardhat-template/artifacts/contracts';
const ABI_OUTPUT_PATH = './src/abi';
const CONFIG_PATH = './config/addresses.json';

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

  // Read addresses from config file
  let addresses = {};
  
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      addresses = config.ConfidentialAuction || {};
      console.log('📖 Loaded addresses from config file');
    } catch (error) {
      console.warn('Could not read config file, using defaults');
    }
  }

  // Use defaults if config is empty or missing
  if (Object.keys(addresses).length === 0) {
    addresses = {
      "31337": {
        address: "0x5c653ca4AeA7F2Da07f0AABf75F85766EAFDA615",
        chainId: 31337,
        chainName: "Hardhat"
      },
      "11155111": {
        address: "0x957c413A9d76969Ff2251058735b2ADcA6668C25",
        chainId: 11155111,
        chainName: "Sepolia"
      }
    };
    console.log('📝 Using default addresses');
  }

  // Generate addresses file
  const addressesContent = `export const ConfidentialAuctionAddresses: Record<string, { address: string; chainId: number; chainName?: string }> = ${JSON.stringify(addresses, null, 2)} as const;`;
  
  fs.writeFileSync(path.join(ABI_OUTPUT_PATH, 'ConfidentialAuctionAddresses.ts'), addressesContent);

  console.log('✅ ABI files generated successfully!');
  console.log('📁 Generated files:');
  console.log('  - src/abi/ConfidentialAuctionABI.ts');
  console.log('  - src/abi/ConfidentialAuctionAddresses.ts');
}

generateABI();