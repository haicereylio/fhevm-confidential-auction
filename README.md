# FHEVM Confidential Auction Platform

A privacy-preserving auction platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology, ensuring complete bid confidentiality while maintaining transparency and fairness.

## 🌟 Features

### 🔒 Privacy Protection
- **Complete Bid Confidentiality**: All bids are encrypted using FHEVM technology
- **End-to-End Encryption**: From bidding to settlement, privacy is maintained throughout
- **Zero Knowledge**: No one can see your bidding strategy or amounts

### 🎯 Auction Types
- **English Auctions**: Traditional ascending price auctions
- **Dutch Auctions**: Descending price auctions
- **Sealed Bid Auctions**: Private bidding with reveal phase
- **Reserve Price Support**: Optional minimum price protection

### ⚡ Advanced Features
- **Real-time Bidding**: Live auction participation
- **Auto-bidding**: Set maximum bid amounts for automatic bidding
- **Auction Extensions**: Automatic time extensions for last-minute bids
- **Mobile Responsive**: Works perfectly on all devices

### 🎨 Modern UI
- **Cyberpunk Design**: Futuristic dark theme with neon accents
- **Smooth Animations**: Engaging user experience with fluid transitions
- **Glassmorphism Effects**: Modern semi-transparent design elements
- **Gradient System**: Rich color gradients throughout the interface

## 🏗️ Architecture

### Smart Contracts (`fhevm-hardhat-template/`)
- **ConfidentialAuction.sol**: Main auction contract with FHEVM integration
- **VotingSystem.sol**: Voting system for governance (reference)
- **FHECounter.sol**: Basic FHEVM counter example

### Frontend (`confidential-auction-frontend/`)
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **FHEVM Integration**: Zama relayer SDK and mock utils

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### 1. Clone Repository
```bash
git clone https://github.com/haicereylio/fhevm-confidential-auction.git
cd fhevm-confidential-auction
```

### 2. Setup Smart Contracts
```bash
cd fhevm-hardhat-template
npm install
npx hardhat compile
npx hardhat node  # Start local FHEVM node
```

### 3. Deploy Contracts (New Terminal)
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network localhost
```

### 4. Setup Frontend
```bash
cd confidential-auction-frontend
npm install
npm run genabi  # Generate ABI files
npm run dev     # Start development server
```

### 5. Access Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Development

### Smart Contract Development
```bash
cd fhevm-hardhat-template

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat deploy --network localhost

# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia
```

### Frontend Development
```bash
cd confidential-auction-frontend

# Start development server
npm run dev

# Build for production
npm run build

# Generate ABI files from contracts
npm run genabi
```

## 📁 Project Structure

```
fhevm-confidential-auction/
├── fhevm-hardhat-template/          # Smart contracts
│   ├── contracts/                   # Solidity contracts
│   ├── deploy/                      # Deployment scripts
│   ├── test/                        # Contract tests
│   └── tasks/                       # Hardhat tasks
├── confidential-auction-frontend/   # Frontend application
│   ├── src/
│   │   ├── app/                     # Next.js app router
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── fhevm/                   # FHEVM integration
│   │   └── abi/                     # Generated contract ABIs
│   └── public/                      # Static assets
└── zama-voting-frontend/            # Reference implementation
```

## 🔐 FHEVM Integration

This project demonstrates proper FHEVM integration patterns:

### Smart Contract Patterns
```solidity
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialAuction is SepoliaConfig {
    using FHE for euint64;
    
    function placeBid(
        uint256 _auctionId,
        externalEuint64 _encryptedBid,
        bytes calldata _inputProof
    ) external {
        euint64 bid = FHE.fromExternal(_encryptedBid, _inputProof);
        // Process encrypted bid...
    }
}
```

### Frontend Integration
```typescript
import { useFhevm } from "@/fhevm/useFhevm";

// Encrypt bid before sending
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(bidAmount);
const encryptedInput = await input.encrypt();

// Submit to contract
await contract.placeBid(auctionId, encryptedInput.handles[0], encryptedInput.inputProof);
```

## 🌐 Network Support

- **Local Development**: Hardhat network with FHEVM mock
- **Sepolia Testnet**: Ethereum testnet with Zama relayer
- **Production**: Ready for mainnet deployment

## 🛡️ Security Features

- **Encrypted Bids**: All bid amounts are encrypted using FHEVM
- **Access Control**: Proper permissions for auction creators and bidders
- **Time-based Security**: Auction timing enforced on-chain
- **Reentrancy Protection**: Safe contract interactions

## 🎮 Demo

### Screenshots
![Welcome Page](./docs/welcome-page.png)
![Auction Hall](./docs/auction-hall.png)
![Bidding Interface](./docs/bidding-interface.png)

### Live Demo
- **Frontend**: [Demo Link](https://your-demo-link.com) (when deployed)
- **Contracts**: Deployed on Sepolia testnet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **FHEVM Documentation**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Zama**: [https://zama.ai](https://zama.ai)
- **Live Demo**: [https://your-demo-link.com](https://your-demo-link.com)

## 🏆 Acknowledgments

Built with ❤️ using:
- [FHEVM](https://github.com/zama-ai/fhevm) by Zama
- [Next.js](https://nextjs.org/) by Vercel
- [Hardhat](https://hardhat.org/) for smart contract development
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 🚨 Disclaimer

This is a demonstration project showcasing FHEVM capabilities. Please conduct thorough security audits before using in production environments.

---

**Made with 🔐 by the FHEVM community**
