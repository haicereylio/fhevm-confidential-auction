"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuctionInfo, AuctionResults } from "@/hooks/useAuctionSystem";
import { formatEther, formatAddress, getAuctionTypeText } from "@/lib/utils";
import { Trophy, Eye, X, Shield, DollarSign, User, Calendar } from "lucide-react";

interface ResultsModalProps {
  auction: AuctionInfo | null;
  results: AuctionResults | null;
  onClose: () => void;
  onRevealResults: (auctionId: number) => Promise<void>;
  isRevealing: boolean;
}

export function ResultsModal({ 
  auction, 
  results, 
  onClose, 
  onRevealResults, 
  isRevealing 
}: ResultsModalProps) {
  const [showDecryption, setShowDecryption] = useState(false);

  if (!auction) return null;

  const hasResults = results && results.auctionId === auction.id;
  const highestBidEth = hasResults ? formatEther(results.highestBid) : "0.0000";
  const reservePriceEth = hasResults && results.reservePrice ? formatEther(results.reservePrice) : null;

  const handleRevealResults = async () => {
    setShowDecryption(true);
    try {
      await onRevealResults(auction.id);
    } catch (error) {
      console.error("Failed to reveal results:", error);
    } finally {
      setShowDecryption(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Auction Results
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
          <div className="space-y-6">
            {/* Auction Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Auction Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium">{getAuctionTypeText(auction.auctionType)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Bids:</span>
                  <p className="font-medium">{auction.totalBids}</p>
                </div>
                <div>
                  <span className="text-gray-600">Creator:</span>
                  <p className="font-mono text-xs">{formatAddress(auction.creator)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    Ended
                  </Badge>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-600">Ended:</span>
                <p className="font-medium">
                  {new Date(auction.endTime * 1000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Results Section */}
            {!hasResults ? (
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Shield className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Results Not Yet Revealed
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    The auction results are still encrypted. Click below to decrypt and reveal 
                    the winning bid and other details.
                  </p>
                  
                  {showDecryption && (
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-blue-700">
                          Decrypting results...
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        This may take a few moments while we decrypt the encrypted bids
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleRevealResults}
                    disabled={isRevealing || showDecryption}
                    className="w-full"
                  >
                    {isRevealing || showDecryption ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Revealing Results...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Results
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Winning Bid */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                    <h3 className="font-semibold text-yellow-900">Winning Bid</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800">Highest Bid:</span>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-yellow-600 mr-1" />
                        <span className="font-mono font-bold text-lg text-yellow-900">
                          {highestBidEth} ETH
                        </span>
                      </div>
                    </div>
                    
                    {results.winner && (
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-800">Winner:</span>
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-yellow-600 mr-1" />
                          <span className="font-mono text-sm text-yellow-900">
                            {formatAddress(results.winner)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reserve Price (if applicable) */}
                {auction.hasReservePrice && reservePriceEth && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Shield className="w-5 h-5 text-blue-500 mr-2" />
                      <h3 className="font-semibold text-blue-900">Reserve Price</h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800">Minimum Acceptable:</span>
                      <span className="font-mono font-medium text-blue-900">
                        {reservePriceEth} ETH
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      {parseFloat(highestBidEth) >= parseFloat(reservePriceEth) ? (
                        <Badge variant="success" className="text-xs">
                          Reserve Met ✓
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">
                          Reserve Not Met
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Auction Statistics</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Min. Increment:</span>
                      <p className="font-mono">{formatEther(auction.minimumBidIncrement)} ETH</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">
                        {Math.round((auction.endTime - auction.startTime) / 3600)} hours
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <Shield className="w-4 h-4 inline mr-1" />
                    <strong>Privacy Preserved:</strong> All bids were encrypted during the auction. 
                    Only the final results are now visible.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


