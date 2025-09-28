"use client";

import { useState, useEffect, useCallback } from "react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useAuctionSystem, AuctionType } from "@/hooks/useAuctionSystem";
import { Navigation } from "@/components/Navigation";
import { WelcomePage } from "@/components/WelcomePage";
import { AuctionCard } from "@/components/AuctionCard";
import { CreateAuctionForm } from "@/components/CreateAuctionForm";
import { BidModal } from "@/components/BidModal";
import { ResultsModal } from "@/components/ResultsModal";
import { Plus, RefreshCw, AlertCircle, CheckCircle, Loader2, Filter, Search, Grid, List, Sparkles } from "lucide-react";

export default function HomePage() {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  // MetaMask connection
  const {
    provider,
    accounts,
    chainId,
    isConnected,
    connect: connectWallet,
    disconnect: disconnectWallet,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = useMetaMask();

  const userAddress = accounts.length > 0 ? accounts[0] : undefined;

  // FHEVM instance
  const { instance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: provider,
    chainId,
    enabled: isConnected,
  });

  // Auction system
  const {
    auctions,
    auctionResults,
    isLoading,
    isCreating,
    isBidding,
    message,
    refreshAuctions: loadAuctions,
    createAuction,
    placeBid,
    setAutoBid,
    endAuction,
    revealResults,
  } = useAuctionSystem({
    instance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Load auctions on mount and when connected
  useEffect(() => {
    if (isConnected && !showWelcome) {
      loadAuctions();
    }
  }, [isConnected, showWelcome, loadAuctions]);

  // Filter auctions based on search and status
  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const now = Math.floor(Date.now() / 1000);
    const isActive = auction.status === 1 || auction.status === 2;
    const isUpcoming = auction.status === 0 && now < auction.startTime;
    const isEnded = auction.status === 3 || auction.status === 4 || now > auction.endTime;

    switch (filterStatus) {
      case 'active':
        return isActive || (auction.status === 0 && now >= auction.startTime && now <= auction.endTime);
      case 'upcoming':
        return isUpcoming;
      case 'ended':
        return isEnded;
      default:
        return true;
    }
  });

  const handleCreateAuction = async (
    title: string,
    description: string,
    itemImageUrl: string,
    auctionType: AuctionType,
    startTime: number,
    endTime: number,
    minimumBidIncrement: string,
    extensionTime: number,
    hasReservePrice: boolean,
    reservePrice?: string
  ) => {
    await createAuction(
      title,
      description,
      itemImageUrl,
      auctionType,
      startTime,
      endTime,
      minimumBidIncrement,
      extensionTime,
      hasReservePrice,
      reservePrice
    );
    setShowCreateForm(false);
  };

  const handleBidSubmit = async (auctionId: number, bidAmount: string) => {
    await placeBid(auctionId, bidAmount);
    setShowBidModal(false);
    setSelectedAuctionId(null);
  };

  const handleBid = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    setShowBidModal(true);
  };

  const handleViewResults = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    setShowResultsModal(true);
  };

  const handleSetAutoBid = async (auctionId: number) => {
    // TODO: Implement auto-bid modal
    console.log("Set auto-bid for auction:", auctionId);
  };

  const handleEndAuction = async (auctionId: number) => {
    await endAuction(auctionId);
  };

  const handleRevealResults = async (auctionId: number) => {
    await revealResults(auctionId);
  };

  const handleGetStarted = () => {
    setShowWelcome(false);
    if (!isConnected) {
      connectWallet();
    }
  };

  // Show welcome page for new users
  if (showWelcome) {
    return <WelcomePage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <Navigation
        userAddress={userAddress}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
      />

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Connection Status */}
          {!isConnected && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Connect Wallet to Start</h3>
                  <p className="text-amber-200">Please connect your Web3 wallet to participate in auctions</p>
                </div>
                <button
                  onClick={connectWallet}
                  className="ml-auto neon-button"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          )}

          {/* FHEVM Status */}
          {isConnected && (
            <div className="mb-8 p-6 rounded-2xl glass border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {fhevmStatus === 'ready' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : fhevmStatus === 'loading' ? (
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      FHEVM Status: {fhevmStatus === 'ready' ? 'Ready' : fhevmStatus === 'loading' ? 'Loading' : 'Error'}
                    </h3>
                    <p className="text-gray-400">
                      {fhevmStatus === 'ready' 
                        ? 'Privacy protection system activated, safe to bid'
                        : fhevmStatus === 'loading'
                        ? 'Initializing privacy protection system...'
                        : 'Privacy protection system initialization failed'
                      }
                    </p>
                  </div>
                </div>
                {fhevmStatus === 'ready' && (
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Privacy Protection Enabled</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="heading-lg gradient-text mb-2">Auction Hall</h1>
              <p className="text-xl text-gray-300">Discover unique items, participate in private auctions</p>
            </div>
            
            <div className="flex items-center space-x-4 mt-6 lg:mt-0">
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={!isConnected || fhevmStatus !== 'ready'}
                className="neon-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Create Auction</span>
              </button>
              
              <button
                onClick={loadAuctions}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 p-6 rounded-2xl glass border border-purple-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search auctions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex items-center space-x-1 p-1 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border border-purple-500/20">
              <p className="text-white">{message}</p>
            </div>
          )}

          {/* Auctions Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-xl text-gray-300">Loading auctions...</p>
              </div>
            </div>
          ) : filteredAuctions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Auctions Found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No auctions match your criteria' 
                  : 'No auctions yet, create the first one!'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={!isConnected || fhevmStatus !== 'ready'}
                  className="neon-button flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Auction</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  userAddress={userAddress}
                  onBid={handleBid}
                  onViewResults={handleViewResults}
                  onSetAutoBid={handleSetAutoBid}
                  onEndAuction={handleEndAuction}
                  isLoading={isBidding}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="cyber-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-md gradient-text">Create New Auction</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  ✕
                </button>
              </div>
              <CreateAuctionForm
                onCreateAuction={handleCreateAuction}
                isCreating={isCreating}
              />
            </div>
          </div>
        </div>
      )}

      {showBidModal && selectedAuctionId !== null && (
        <BidModal
          auction={auctions.find(a => a.id === selectedAuctionId)!}
          onPlaceBid={handleBidSubmit}
          onSetAutoBid={handleSetAutoBid}
          onClose={() => {
            setShowBidModal(false);
            setSelectedAuctionId(null);
          }}
          isBidding={isBidding}
        />
      )}

      {showResultsModal && selectedAuctionId !== null && (
        <ResultsModal
          auction={auctions.find(a => a.id === selectedAuctionId)!}
          results={auctionResults.get(selectedAuctionId) || null}
          onRevealResults={handleRevealResults}
          isRevealing={false}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedAuctionId(null);
          }}
        />
      )}
    </div>
  );
}