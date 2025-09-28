"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

// Import generated ABI and addresses
import { ConfidentialAuctionABI } from "@/abi/ConfidentialAuctionABI";
import { ConfidentialAuctionAddresses } from "@/abi/ConfidentialAuctionAddresses";

export enum AuctionType {
  ENGLISH = 0,
  DUTCH = 1,
  SEALED_BID = 2,
  RESERVE = 3,
}

export enum AuctionStatus {
  PENDING = 0,
  ACTIVE = 1,
  EXTENDED = 2,
  ENDED = 3,
  CANCELLED = 4,
}

export interface AuctionInfo {
  id: number;
  title: string;
  description: string;
  itemImageUrl: string;
  creator: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  minimumBidIncrement: string; // in wei
  totalBids: number;
  hasReservePrice: boolean;
}

export interface BidInfo {
  auctionId: number;
  bidder: string;
  timestamp: number;
  isAutoBid: boolean;
}

export interface AuctionResults {
  auctionId: number;
  highestBid: string; // in wei
  reservePrice?: string; // in wei
  winner?: string;
}

function getAuctionSystemByChainId(chainId: number | undefined) {
  if (!chainId) {
    return { abi: ConfidentialAuctionABI.abi };
  }

  const entry = ConfidentialAuctionAddresses[chainId.toString()];
  
  if (!entry || !entry.address || entry.address === ethers.ZeroAddress) {
    return { abi: ConfidentialAuctionABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: ConfidentialAuctionABI.abi,
  };
}

export function useAuctionSystem(parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // State
  const [auctions, setAuctions] = useState<AuctionInfo[]>([]);
  const [auctionResults, setAuctionResults] = useState<Map<number, AuctionResults>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Refs
  const auctionSystemRef = useRef<any>(undefined);
  const isLoadingRef = useRef<boolean>(false);
  const isCreatingRef = useRef<boolean>(false);
  const isBiddingRef = useRef<boolean>(false);

  // Contract info - memoize to prevent recreation
  const auctionSystem = useMemo(() => {
    const contract = getAuctionSystemByChainId(chainId);
    auctionSystemRef.current = contract;
    return contract;
  }, [chainId]);

  // Stable references for contract address and ABI
  const contractAddress = useMemo(() => auctionSystem.address, [auctionSystem.address]);
  const contractABI = useMemo(() => auctionSystem.abi, [auctionSystem.abi]);

  const isDeployed = useMemo(() => {
    return Boolean(contractAddress) && contractAddress !== ethers.ZeroAddress;
  }, [contractAddress]);

  const canInteract = useMemo(() => {
    return contractAddress && ethersReadonlyProvider && !isLoading;
  }, [contractAddress, ethersReadonlyProvider, isLoading]);

  const canRead = useMemo(() => {
    return contractAddress && ethersReadonlyProvider;
  }, [contractAddress, ethersReadonlyProvider]);

  // Load all auctions
  const loadAuctions = useCallback(async () => {
    if (isLoadingRef.current || !contractAddress || !ethersReadonlyProvider) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("Loading auctions...");

    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersReadonlyProvider
      );

      const totalAuctions = await contract.getTotalAuctions();
      const auctionPromises: Promise<AuctionInfo>[] = [];

      for (let i = 0; i < totalAuctions; i++) {
        auctionPromises.push(
          contract.getAuctionInfo(i).then((info: any) => ({
            id: i,
            title: info.title,
            description: info.description,
            itemImageUrl: info.itemImageUrl,
            creator: info.creator,
            auctionType: info.auctionType,
            status: Number(info.status), // Ensure it's a number
            startTime: Number(info.startTime),
            endTime: Number(info.endTime),
            minimumBidIncrement: info.minimumBidIncrement.toString(),
            totalBids: Number(info.totalBids),
            hasReservePrice: info.hasReservePrice,
          }))
        );
      }

      const loadedAuctions = await Promise.all(auctionPromises);
      setAuctions(loadedAuctions);
      setMessage(`Loaded ${loadedAuctions.length} auctions`);
    } catch (error) {
      console.error("Failed to load auctions:", error);
      setMessage("Failed to load auctions");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [contractAddress, contractABI, ethersReadonlyProvider]);

  // Create auction
  const createAuction = useCallback(async (
    title: string,
    description: string,
    itemImageUrl: string,
    auctionType: AuctionType,
    startTime: number,
    endTime: number,
    minimumBidIncrement: string, // in wei
    extensionTime: number,
    hasReservePrice: boolean,
    reservePrice?: string // in wei
  ) => {
    if (isCreatingRef.current || !ethersSigner || !contractAddress || !instance) return;

    isCreatingRef.current = true;
    setIsCreating(true);
    setMessage("Creating auction...");

    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersSigner
      );

      let tx;
      if (hasReservePrice && reservePrice) {
        // Encrypt reserve price
        const input = instance.createEncryptedInput(
          contractAddress,
          ethersSigner.address
        );
        input.add64(BigInt(reservePrice));
        
        setMessage("Encrypting reserve price...");
        const encryptedInput = await input.encrypt();

        tx = await contract.createAuction(
          title,
          description,
          itemImageUrl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          hasReservePrice,
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );
      } else {
        // For auctions without reserve price, create a dummy encrypted input with value 0
        const dummyInput = instance.createEncryptedInput(contractAddress, ethersSigner.address);
        dummyInput.add64(0);
        const dummyEncryptedInput = await dummyInput.encrypt();
        
        tx = await contract.createAuction(
          title,
          description,
          itemImageUrl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          false,
          dummyEncryptedInput.handles[0], // properly encrypted dummy value
          dummyEncryptedInput.inputProof // valid proof
        );
      }

      setMessage(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      setMessage("Auction created successfully!");

      // Reload auctions
      setTimeout(() => loadAuctions(), 1000);

      return receipt;
    } catch (error) {
      console.error("Failed to create auction:", error);
      setMessage("Failed to create auction");
      throw error;
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [ethersSigner, contractAddress, contractABI, instance, loadAuctions]);

  // Place bid
  const placeBid = useCallback(async (auctionId: number, bidAmount: string) => {
    if (isBiddingRef.current || !instance || !ethersSigner || !contractAddress) return;

    isBiddingRef.current = true;
    setIsBidding(true);
    setMessage("Preparing encrypted bid...");

    try {
      // Create encrypted input
      const input = instance.createEncryptedInput(
        contractAddress,
        ethersSigner.address
      );
      input.add64(BigInt(bidAmount));

      setMessage("Encrypting bid...");
      const encryptedInput = await input.encrypt();

      setMessage("Submitting bid...");
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersSigner
      );

      const tx = await contract.placeBid(
        auctionId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      setMessage(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      setMessage("Bid placed successfully!");

      // Reload auctions to update bid counts
      setTimeout(() => loadAuctions(), 1000);

      return receipt;
    } catch (error) {
      console.error("Failed to place bid:", error);
      setMessage("Failed to place bid");
      throw error;
    } finally {
      isBiddingRef.current = false;
      setIsBidding(false);
    }
  }, [instance, ethersSigner, contractAddress, contractABI, loadAuctions]);

  // Set auto-bid
  const setAutoBid = useCallback(async (auctionId: number, maxBidAmount: string) => {
    if (!instance || !ethersSigner || !contractAddress) return;

    try {
      setMessage("Setting up auto-bid...");
      
      const input = instance.createEncryptedInput(
        contractAddress,
        ethersSigner.address
      );
      input.add64(BigInt(maxBidAmount));

      const encryptedInput = await input.encrypt();

      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersSigner
      );

      const tx = await contract.setAutoBid(
        auctionId,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      setMessage(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      setMessage("Auto-bid set successfully!");

      return receipt;
    } catch (error) {
      console.error("Failed to set auto-bid:", error);
      setMessage("Failed to set auto-bid");
      throw error;
    }
  }, [instance, ethersSigner, contractAddress, contractABI]);

  // End auction
  const endAuction = useCallback(async (auctionId: number) => {
    if (!ethersSigner || !contractAddress) return;

    try {
      setMessage("Ending auction...");
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersSigner
      );

      const tx = await contract.endAuction(auctionId);
      setMessage(`Transaction submitted: ${tx.hash}`);
      
      const receipt = await tx.wait();
      setMessage("Auction ended successfully!");

      // Reload auctions
      setTimeout(() => loadAuctions(), 1000);

      return receipt;
    } catch (error) {
      console.error("Failed to end auction:", error);
      setMessage("Failed to end auction");
      throw error;
    }
  }, [ethersSigner, contractAddress, contractABI, loadAuctions]);

  // Reveal auction results
  const revealResults = useCallback(async (auctionId: number) => {
    if (!instance || !ethersSigner || !contractAddress) return;

    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        ethersSigner
      );

      // Get auction info to check if user is creator
      const auctionInfo = await contract.getAuctionInfo(auctionId);
      const isCreator = auctionInfo.creator.toLowerCase() === ethersSigner.address.toLowerCase();
      
      if (!isCreator) {
        setMessage("Making results public...");
        const makePublicTx = await contract.revealResults(auctionId);
        setMessage(`Transaction submitted: ${makePublicTx.hash}`);
        await makePublicTx.wait();
      }
      
      setMessage("Preparing decryption...");

      // Get decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractAddress as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      setMessage("Decrypting results...");

      // Get encrypted highest bid and decrypt
      const encryptedHighestBid = await contract.getEncryptedHighestBid(auctionId);
      
      let highestBid = "0";
      let reservePrice: string | undefined;

      if (encryptedHighestBid !== ethers.ZeroHash) {
        const result = await instance.userDecrypt(
          [{ handle: encryptedHighestBid, contractAddress: contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        highestBid = result[encryptedHighestBid].toString();
      }

      // Decrypt reserve price if exists
      if (auctionInfo.hasReservePrice) {
        // This would require additional contract method to get encrypted reserve price
        // For now, we'll skip this
      }

      const auctionResults: AuctionResults = {
        auctionId,
        highestBid,
        reservePrice,
      };

      setAuctionResults(prev => new Map(prev.set(auctionId, auctionResults)));
      setMessage("Results decrypted successfully!");

      return auctionResults;
    } catch (error) {
      console.error("Failed to decrypt results:", error);
      setMessage("Failed to decrypt results: " + (error as Error).message);
      throw error;
    }
  }, [instance, ethersSigner, contractAddress, contractABI, fhevmDecryptionSignatureStorage]);

  // Check if user has bid
  const hasBid = useCallback(async (auctionId: number, userAddress: string) => {
    if (!canInteract) return false;

    try {
      const contract = new ethers.Contract(
        contractAddress!,
        contractABI,
        ethersReadonlyProvider
      );

      return await contract.hasBidder(auctionId, userAddress);
    } catch (error) {
      console.error("Failed to check bid status:", error);
      return false;
    }
  }, [canInteract, contractAddress, contractABI, ethersReadonlyProvider]);

  // Get auction status
  const getAuctionStatusText = useCallback((auction: AuctionInfo): string => {
    const now = Math.floor(Date.now() / 1000);
    
    switch (auction.status) {
      case AuctionStatus.PENDING:
        return now < auction.startTime ? "Upcoming" : "Pending";
      case AuctionStatus.ACTIVE:
        return now > auction.endTime ? "Ended" : "Active";
      case AuctionStatus.EXTENDED:
        return "Extended";
      case AuctionStatus.ENDED:
        return "Ended";
      case AuctionStatus.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  }, []);

  // Auto-load auctions when contract is available
  useEffect(() => {
    if (canRead) {
      loadAuctions();
    }
  }, [canRead, loadAuctions]);

  return {
    // Contract info
    contractAddress,
    isDeployed,
    canInteract,

    // State
    auctions,
    auctionResults,
    isLoading,
    isCreating,
    isBidding,
    message,

    // Actions
    refreshAuctions: loadAuctions,
    createAuction,
    placeBid,
    setAutoBid,
    endAuction,
    revealResults,
    hasBid,
    getAuctionStatusText,
  };
}
