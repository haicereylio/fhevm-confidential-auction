"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

export interface MetaMaskState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[];
  isConnected: boolean;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  status: "idle" | "connecting" | "connected" | "error";
  error: Error | undefined;
}

export function useMetaMask() {
  const [state, setState] = useState<MetaMaskState>({
    provider: undefined,
    chainId: undefined,
    accounts: [],
    isConnected: false,
    ethersSigner: undefined,
    ethersReadonlyProvider: undefined,
    status: "idle",
    error: undefined,
  });

  const sameChainRef = useRef<(chainId: number | undefined) => boolean>(() => false);
  const sameSignerRef = useRef<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>(() => false);

  // Initialize MetaMask connection
  const initializeMetaMask = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState(prev => ({
        ...prev,
        error: new Error("MetaMask not installed"),
        status: "error",
      }));
      return;
    }

    try {
      const provider = window.ethereum;
      const ethersProvider = new ethers.BrowserProvider(provider);
      
      // Get current accounts
      const accounts = await provider.request({ method: "eth_accounts" }) as string[];
      
      // Get chain ID
      const chainIdHex = await provider.request({ method: "eth_chainId" }) as string;
      const chainId = parseInt(chainIdHex, 16);

      let ethersSigner: ethers.JsonRpcSigner | undefined;
      if (accounts.length > 0) {
        ethersSigner = await ethersProvider.getSigner();
      }

      setState(prev => ({
        ...prev,
        provider,
        chainId,
        accounts,
        isConnected: accounts.length > 0,
        ethersSigner,
        ethersReadonlyProvider: ethersProvider,
        status: accounts.length > 0 ? "connected" : "idle",
        error: undefined,
      }));

      // Update refs
      sameChainRef.current = (newChainId) => newChainId === chainId;
      sameSignerRef.current = (newSigner) => newSigner === ethersSigner;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        status: "error",
      }));
    }
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: new Error("MetaMask not installed"),
        status: "error",
      }));
      return;
    }

    setState(prev => ({ ...prev, status: "connecting" }));

    try {
      const provider = window.ethereum;
      
      // Request account access
      const accounts = await provider.request({ 
        method: "eth_requestAccounts" 
      }) as string[];

      if (accounts.length === 0) {
        throw new Error("No accounts returned");
      }

      // Re-initialize with new connection
      await initializeMetaMask();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
        status: "error",
      }));
    }
  }, [initializeMetaMask]);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      provider: undefined,
      chainId: undefined,
      accounts: [],
      isConnected: false,
      ethersSigner: undefined,
      ethersReadonlyProvider: undefined,
      status: "idle",
      error: undefined,
    });
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log("Accounts changed:", accounts);
    initializeMetaMask();
  }, [initializeMetaMask]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: string) => {
    console.log("Chain changed:", chainIdHex);
    initializeMetaMask();
  }, [initializeMetaMask]);

  // Set up event listeners
  useEffect(() => {
    if (window.ethereum) {
      const provider = window.ethereum;
      
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      
      // Initialize on mount
      initializeMetaMask();

      return () => {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged, initializeMetaMask]);

  // Mock chains for development
  const initialMockChains = {
    31337: "http://localhost:8545", // Hardhat
  };

  return {
    ...state,
    connect,
    disconnect,
    sameChain: sameChainRef,
    sameSigner: sameSignerRef,
    initialMockChains,
  };
}
