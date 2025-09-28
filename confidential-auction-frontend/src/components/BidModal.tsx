"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AuctionInfo } from "@/hooks/useAuctionSystem";
import { formatEther, parseEther, getAuctionTypeText } from "@/lib/utils";
import { Gavel, DollarSign, X, Shield, Zap } from "lucide-react";

interface BidModalProps {
  auction: AuctionInfo | null;
  onClose: () => void;
  onPlaceBid: (auctionId: number, bidAmount: string) => Promise<void>;
  onSetAutoBid?: (auctionId: number, maxBidAmount: string) => Promise<void>;
  isBidding: boolean;
}

export function BidModal({ auction, onClose, onPlaceBid, onSetAutoBid, isBidding }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [maxAutoBid, setMaxAutoBid] = useState("");
  const [bidType, setBidType] = useState<"manual" | "auto">("manual");
  const [error, setError] = useState("");

  if (!auction) return null;

  const minIncrement = parseFloat(formatEther(auction.minimumBidIncrement));

  const validateBid = (amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      return "Please enter a valid bid amount";
    }
    if (value < minIncrement) {
      return `Minimum bid increment is ${minIncrement} ETH`;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (bidType === "manual") {
      const validationError = validateBid(bidAmount);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const bidAmountWei = parseEther(bidAmount);
        await onPlaceBid(auction.id, bidAmountWei);
        onClose();
      } catch (error) {
        setError("Failed to place bid. Please try again.");
      }
    } else {
      const validationError = validateBid(maxAutoBid);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const maxBidAmountWei = parseEther(maxAutoBid);
        await onSetAutoBid?.(auction.id, maxBidAmountWei);
        onClose();
      } catch (error) {
        setError("Failed to set auto-bid. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Gavel className="w-5 h-5 mr-2" />
                Place Bid
              </CardTitle>
              <CardDescription className="mt-1">
                {auction.title}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Auction Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{getAuctionTypeText(auction.auctionType)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Min. Increment:</span>
                <span className="font-mono font-medium">{formatEther(auction.minimumBidIncrement)} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Bids:</span>
                <span className="font-medium">{auction.totalBids}</span>
              </div>
              {auction.hasReservePrice && (
                <div className="flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-1 text-blue-500" />
                  <span className="text-blue-600 font-medium">Reserve Price Set</span>
                </div>
              )}
            </div>

            {/* Bid Type Selection */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={bidType === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBidType("manual")}
                  className="flex-1"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Manual Bid
                </Button>
                {onSetAutoBid && (
                  <Button
                    type="button"
                    variant={bidType === "auto" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBidType("auto")}
                    className="flex-1"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Auto-Bid
                  </Button>
                )}
              </div>

              {bidType === "auto" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Auto-Bid:</strong> Set your maximum bid amount. The system will automatically 
                    place bids for you up to this limit when others bid.
                  </p>
                </div>
              )}
            </div>

            {/* Bid Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {bidType === "manual" ? "Bid Amount (ETH)" : "Maximum Bid Amount (ETH)"}
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min={minIncrement}
                  value={bidType === "manual" ? bidAmount : maxAutoBid}
                  onChange={(e) => {
                    if (bidType === "manual") {
                      setBidAmount(e.target.value);
                    } else {
                      setMaxAutoBid(e.target.value);
                    }
                    setError("");
                  }}
                  placeholder={`Minimum: ${minIncrement} ETH`}
                  className={error ? "border-red-500" : ""}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  <strong>Privacy Protected:</strong> Your bid amount will be encrypted and hidden 
                  from other bidders until the auction ends.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isBidding}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBidding}
                  className="flex-1"
                >
                  {isBidding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {bidType === "manual" ? "Placing Bid..." : "Setting Auto-Bid..."}
                    </>
                  ) : (
                    <>
                      {bidType === "manual" ? (
                        <>
                          <Gavel className="w-4 h-4 mr-2" />
                          Place Bid
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Set Auto-Bid
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


