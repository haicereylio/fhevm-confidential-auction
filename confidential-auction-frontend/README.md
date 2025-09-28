# ConfidentialAuction - Privacy-Preserving Auction System

A modern, privacy-preserving auction system built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology, ensuring complete bid confidentiality until auction results are revealed.

## 🌟 Features

### Core Functionality
- **Confidential Bidding**: All bids are encrypted using FHEVM, ensuring complete privacy
- **Multiple Auction Types**: Support for English, Dutch, Sealed Bid, and Reserve auctions
- **Auto-Bidding**: Set maximum bid amounts and let the system bid automatically
- **Time Extensions**: Auctions automatically extend when bids are placed in final minutes
- **Reserve Prices**: Set encrypted minimum acceptable prices
- **Real-time Updates**: Live auction status and bid count updates

### User Experience
- **Modern UI**: Beautiful, responsive interface with gradient backgrounds and smooth animations
- **English Interface**: Clean, professional English-only interface
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Mobile Responsive**: Works perfectly on all device sizes
- **Real-time Feedback**: Live status updates and transaction confirmations

### Technical Features
- **FHEVM Integration**: Full support for encrypted computations
- **Mock Mode**: Local development with `@fhevm/mock-utils`
- **Production Ready**: Real relayer SDK integration for mainnet
- **Type Safety**: Full TypeScript implementation
- **Testing**: Comprehensive test suite for smart contracts

## 🏗️ Architecture

### Smart Contracts (`../fhevm-hardhat-template/`)
- **ConfidentialAuction.sol**: Main contract handling all auction logic
- **FHEVM Integration**: Uses encrypted data types (`euint64`, `ebool`)
- **Access Control**: Role-based permissions for auctioneers and bidders
- **Encrypted Operations**: All bid amounts and reserve prices are encrypted

### Frontend (`confidential-auction-frontend/`)
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **FHEVM Hooks**: Custom React hooks for blockchain interaction
- **Responsive Design**: Mobile-first responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask browser extension
- Git

### 1. Setup Smart Contracts

```bash
# Navigate to smart contract directory
cd ../fhevm-hardhat-template

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Start local Hardhat node
npx hardhat node --verbose
```

### 2. Deploy Contracts

In a new terminal:

```bash
cd ../fhevm-hardhat-template

# Deploy ConfidentialAuction contract
npx hardhat deploy --network localhost --tags ConfidentialAuction
```

### 3. Start Frontend

```bash
# Navigate to frontend directory
cd confidential-auction-frontend

# Install dependencies
npm install

# Generate ABI files
npm run genabi

# Start development server
npm run dev:mock
```

### 4. Access the Application
- Open http://localhost:3000
- Connect your MetaMask wallet
- Switch to localhost network (Chain ID: 31337)
- Start creating and participating in auctions!

## 📖 Usage Guide

### For Auctioneers

#### Creating an Auction
1. Click "Create Auction" tab
2. Fill in auction details:
   - **Title**: Auction name
   - **Description**: Detailed item description
   - **Image URL**: Optional item image
   - **Type**: English, Dutch, Sealed Bid, or Reserve
   - **Time**: Start and end timestamps
   - **Min. Increment**: Minimum bid increment in ETH
   - **Reserve Price**: Optional encrypted minimum price
3. Submit and wait for transaction confirmation

#### Managing Auctions
- **End Auction**: Manually end active auctions
- **Reveal Results**: Decrypt and view final results
- **Time Extensions**: Automatic extensions for last-minute bids

### For Bidders

#### Participating in Auctions
1. Browse available auctions on the home page
2. Check auction status (Active/Ended/Upcoming)
3. Click "Place Bid" on active auctions
4. Choose between manual bid or auto-bid
5. Enter bid amount and confirm encrypted transaction

#### Auto-Bidding
- Set maximum bid amount
- System automatically bids up to your limit
- Saves time and ensures you don't miss opportunities

#### Viewing Results
- Results are only available after auction ends
- Click "View Results" to decrypt and view final bid amounts
- All decryption happens client-side for privacy

## 🔧 Smart Contract Interaction

### Using Hardhat Tasks

```bash
# Create a new auction
npx hardhat auction:create --title "Rare NFT" --description "Limited edition artwork" --network localhost

# Place a bid
npx hardhat auction:bid --auctionid 0 --amount "1.5" --network localhost

# Set auto-bid
npx hardhat auction:auto-bid --auctionid 0 --maxamount "5.0" --network localhost

# List all auctions
npx hardhat auction:list --network localhost

# End an auction
npx hardhat auction:end --auctionid 0 --network localhost

# Reveal results
npx hardhat auction:reveal --auctionid 0 --network localhost
```

## 🎨 Design Features

### Modern UI Elements
- **Gradient Backgrounds**: Beautiful blue to purple gradients
- **Card-Based Layout**: Clean, organized content in cards
- **Smooth Animations**: Subtle transitions and hover effects
- **Status Badges**: Color-coded auction status indicators
- **Loading States**: Animated loading indicators for all actions

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Perfect layout on tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Large buttons and touch targets

## 🔒 Privacy & Security

### FHEVM Encryption
- All bid amounts are encrypted client-side
- Bids remain private until auction ends
- Only authorized parties can decrypt results
- No bid information leaks during auction

### Smart Contract Security
- Role-based access control
- Input validation and sanitization
- Reentrancy protection
- Time-based auction controls

## 🛠️ Development

### Project Structure
```
confidential-auction-frontend/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── AuctionCard.tsx # Auction display component
│   │   ├── BidModal.tsx    # Bidding interface
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── fhevm/              # FHEVM integration
│   ├── lib/                # Utility functions
│   └── abi/                # Generated contract ABIs
├── scripts/                # Build and utility scripts
└── public/                 # Static assets
```

### Key Technologies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Ethers.js**: Ethereum interaction
- **FHEVM**: Homomorphic encryption
- **Lucide React**: Modern icons

## 🌐 Deployment

### Production Deployment
1. Deploy contracts to desired network (Sepolia, Mainnet)
2. Update contract addresses in `ConfidentialAuctionAddresses.ts`
3. Configure environment variables
4. Build and deploy frontend

### Environment Variables
```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

## 📝 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆚 Differences from ZamaVoting

This ConfidentialAuction system is completely different from the original voting system:

### Core Concept
- **Auctions vs Voting**: Competitive bidding vs democratic selection
- **Highest Bid Wins**: Price-based competition vs majority consensus
- **Time Extensions**: Dynamic auction duration vs fixed voting periods

### Unique Features
- **Auto-Bidding**: Automated bidding up to maximum amounts
- **Reserve Prices**: Encrypted minimum acceptable prices
- **Multiple Auction Types**: English, Dutch, Sealed Bid, Reserve
- **Bid Increments**: Minimum bid increment requirements
- **Time Extensions**: Automatic extension for last-minute bids

### Technical Differences
- **Different Data Structures**: Auction vs Voting structs
- **Different Encryption**: Bid amounts vs vote choices
- **Different Access Patterns**: Auctioneers vs Admins
- **Different Result Calculation**: Highest bid vs vote counting

### UI/UX Differences
- **English-Only Interface**: Professional auction environment
- **Modern Gradient Design**: Blue/purple theme vs voting colors
- **Auction-Specific Components**: Bid modals, result displays
- **Real-Time Bidding**: Live auction interaction vs one-time voting