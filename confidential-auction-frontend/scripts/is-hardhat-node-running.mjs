import { ethers } from 'ethers';

async function checkHardhatNode() {
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const network = await provider.getNetwork();
    
    if (network.chainId === 31337n) {
      console.log('✅ Hardhat node is running');
      process.exit(0);
    } else {
      console.log('❌ Connected to wrong network');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Hardhat node is not running');
    console.log('💡 Start it with: cd ../fhevm-hardhat-template && npx hardhat node');
    process.exit(1);
  }
}

checkHardhatNode();

