"use client";

import { useState } from "react";
import { AuctionInfo, AuctionType } from "@/hooks/useAuctionSystem";
import { formatEther, formatTimeRemaining, formatAddress, getAuctionTypeText } from "@/lib/utils";
import { Clock, User, Gavel, TrendingUp, Eye, Settings, Zap, Shield, Timer } from "lucide-react";

interface AuctionCardProps {
  auction: AuctionInfo;
  userAddress?: string;
  onBid?: (auctionId: number) => void;
  onViewResults?: (auctionId: number) => void;
  onSetAutoBid?: (auctionId: number) => void;
  onEndAuction?: (auctionId: number) => void;
  isLoading?: boolean;
}

export function AuctionCard({
  auction,
  userAddress,
  onBid,
  onViewResults,
  onSetAutoBid,
  onEndAuction,
  isLoading = false,
}: AuctionCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const now = Math.floor(Date.now() / 1000);
  const isActive = auction.status === 1 || auction.status === 2; // ACTIVE or EXTENDED
  const isEnded = auction.status === 3 || auction.status === 4 || now > auction.endTime; // ENDED, CANCELLED or time expired
  const isUpcoming = auction.status === 0 && now < auction.startTime; // PENDING and not started
  const isPendingButStarted = auction.status === 0 && now >= auction.startTime && now <= auction.endTime; // PENDING but should be active
  const isCreator = userAddress && auction.creator.toLowerCase() === userAddress.toLowerCase();
  
  const statusText = isUpcoming ? "Upcoming" : 
                    isPendingButStarted ? "Ready" :
                    isActive ? (auction.status === 2 ? "Extended" : "Active") :
                    auction.status === 4 ? "Cancelled" :
                    isEnded ? "Ended" : "Unknown";

  const canBid = (isActive || isPendingButStarted) && !isCreator && userAddress;
  const canViewResults = isEnded;
  const canSetAutoBid = (isActive || isUpcoming || isPendingButStarted) && !isCreator && userAddress;
  const canEndAuction = (isActive || isPendingButStarted) && isCreator;

  const getStatusIcon = () => {
    if (isUpcoming) return Timer;
    if (isPendingButStarted) return Zap;
    if (isActive) return TrendingUp;
    if (auction.status === 2) return Clock;
    return Eye;
  };

  const getStatusColor = () => {
    if (isUpcoming) return "from-blue-500 to-blue-600";
    if (isPendingButStarted) return "from-green-500 to-green-600";
    if (isActive) return "from-purple-500 to-purple-600";
    if (auction.status === 2) return "from-orange-500 to-orange-600";
    if (auction.status === 4) return "from-red-500 to-red-600";
    return "from-gray-500 to-gray-600";
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="cyber-card group relative overflow-hidden">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColor()} text-white text-xs font-medium`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Reserve Price Indicator */}
      {auction.hasReservePrice && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-medium">
            <Shield className="w-3 h-3" />
            <span>Reserve</span>
          </div>
        </div>
      )}

      {/* Item Image */}
      {auction.itemImageUrl && !imageError ? (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={auction.itemImageUrl}
            alt={auction.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-500/20 to-cyan-400/20 flex items-center justify-center rounded-t-lg">
          <Gavel className="w-16 h-16 text-purple-400 opacity-50" />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
            {auction.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2">
            {auction.description}
          </p>
        </div>

        {/* Auction Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Type */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm text-white font-medium">{getAuctionTypeText(auction.auctionType)}</p>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Creator</p>
              <p className="text-sm text-white font-mono">{formatAddress(auction.creator)}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="text-sm text-white font-medium">
                {isUpcoming ? (
                  `Starts in ${formatTimeRemaining(auction.startTime)}`
                ) : (isActive || isPendingButStarted) ? (
                  <span className="text-green-400">{formatTimeRemaining(auction.endTime)} left</span>
                ) : (
                  <span className="text-gray-400">Ended</span>
                )}
              </p>
            </div>
          </div>

          {/* Bids */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bids</p>
              <p className="text-sm text-white font-medium">{auction.totalBids} bids</p>
            </div>
          </div>
        </div>

        {/* Minimum Bid */}
        <div className="mb-6 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-400/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Min. Increment</span>
            <span className="text-lg font-bold text-white font-mono">
              {formatEther(auction.minimumBidIncrement)} ETH
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canBid && (
            <button
              onClick={() => onBid?.(auction.id)}
              disabled={isLoading}
              className="flex-1 neon-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gavel className="w-4 h-4" />
              <span>Place Bid</span>
            </button>
          )}

          {canViewResults && (
            <button
              onClick={() => onViewResults?.(auction.id)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              <span>View Results</span>
            </button>
          )}

          {canEndAuction && (
            <button
              onClick={() => onEndAuction?.(auction.id)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>End Auction</span>
            </button>
          )}

          {canSetAutoBid && (
            <button
              onClick={() => onSetAutoBid?.(auction.id)}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              <Settings className="w-4 h-4" />
              <span>Auto-bid</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

