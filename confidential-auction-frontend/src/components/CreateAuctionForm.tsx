"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AuctionType } from "@/hooks/useAuctionSystem";
import { parseEther } from "@/lib/utils";
import { Plus, Calendar, DollarSign, Clock, Shield } from "lucide-react";

interface CreateAuctionFormProps {
  onCreateAuction: (
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
  ) => Promise<void>;
  isCreating: boolean;
}

export function CreateAuctionForm({ onCreateAuction, isCreating }: CreateAuctionFormProps) {
  // Set default times: start in 1 hour, end in 25 hours
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const defaultEndTime = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    itemImageUrl: "",
    auctionType: AuctionType.ENGLISH,
    startTime: defaultStartTime.toISOString().slice(0, 16),
    endTime: defaultEndTime.toISOString().slice(0, 16),
    minimumBidIncrement: "0.01",
    extensionTime: "300", // 5 minutes
    hasReservePrice: false,
    reservePrice: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime).getTime();
      const end = new Date(formData.endTime).getTime();
      const now = Date.now();

      if (start <= now) {
        newErrors.startTime = "Start time must be in the future";
      }

      if (end <= start) {
        newErrors.endTime = "End time must be after start time";
      }

      if (end - start < 300000) { // 5 minutes minimum
        newErrors.endTime = "Auction must run for at least 5 minutes";
      }
    }

    const increment = parseFloat(formData.minimumBidIncrement);
    if (isNaN(increment) || increment <= 0) {
      newErrors.minimumBidIncrement = "Must be a positive number";
    }

    if (formData.hasReservePrice) {
      const reserve = parseFloat(formData.reservePrice);
      if (isNaN(reserve) || reserve <= 0) {
        newErrors.reservePrice = "Reserve price must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const startTime = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const endTime = Math.floor(new Date(formData.endTime).getTime() / 1000);
      const minimumBidIncrement = parseEther(formData.minimumBidIncrement);
      const extensionTime = parseInt(formData.extensionTime);
      const reservePrice = formData.hasReservePrice ? parseEther(formData.reservePrice) : undefined;

      await onCreateAuction(
        formData.title,
        formData.description,
        formData.itemImageUrl,
        formData.auctionType,
        startTime,
        endTime,
        minimumBidIncrement,
        extensionTime,
        formData.hasReservePrice,
        reservePrice
      );

      // Reset form on success with new default times
      const resetNow = new Date();
      const resetStartTime = new Date(resetNow.getTime() + 60 * 60 * 1000);
      const resetEndTime = new Date(resetNow.getTime() + 25 * 60 * 60 * 1000);
      
      setFormData({
        title: "",
        description: "",
        itemImageUrl: "",
        auctionType: AuctionType.ENGLISH,
        startTime: resetStartTime.toISOString().slice(0, 16),
        endTime: resetEndTime.toISOString().slice(0, 16),
        minimumBidIncrement: "0.01",
        extensionTime: "300",
        hasReservePrice: false,
        reservePrice: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to create auction:", error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Set default times (1 hour from now to 25 hours from now)
  const setDefaultTimes = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const end = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    updateFormData("startTime", start.toISOString().slice(0, 16));
    updateFormData("endTime", end.toISOString().slice(0, 16));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Create New Auction
        </CardTitle>
        <CardDescription>
          Set up a confidential auction where all bids are encrypted until reveal
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Auction Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Enter auction title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe the item being auctioned"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Item Image URL (optional)
              </label>
              <Input
                value={formData.itemImageUrl}
                onChange={(e) => updateFormData("itemImageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
          </div>

          {/* Auction Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Auction Configuration</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Auction Type
              </label>
              <select
                value={formData.auctionType}
                onChange={(e) => updateFormData("auctionType", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={AuctionType.ENGLISH}>English (Ascending Price)</option>
                <option value={AuctionType.DUTCH}>Dutch (Descending Price)</option>
                <option value={AuctionType.SEALED_BID}>Sealed Bid</option>
                <option value={AuctionType.RESERVE}>Reserve Auction</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => updateFormData("startTime", e.target.value)}
                  className={errors.startTime ? "border-red-500" : ""}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Time *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => updateFormData("endTime", e.target.value)}
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setDefaultTimes}
              className="mb-2"
            >
              <Clock className="w-4 h-4 mr-1" />
              Set Default Times
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Minimum Bid Increment (ETH) *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.minimumBidIncrement}
                  onChange={(e) => updateFormData("minimumBidIncrement", e.target.value)}
                  className={errors.minimumBidIncrement ? "border-red-500" : ""}
                />
                {errors.minimumBidIncrement && (
                  <p className="text-red-500 text-sm mt-1">{errors.minimumBidIncrement}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Extension Time (seconds)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.extensionTime}
                  onChange={(e) => updateFormData("extensionTime", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time to extend auction if bid placed in final minutes
                </p>
              </div>
            </div>
          </div>

          {/* Reserve Price */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasReservePrice"
                checked={formData.hasReservePrice}
                onChange={(e) => updateFormData("hasReservePrice", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="hasReservePrice" className="text-sm font-medium flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Set Reserve Price
              </label>
              <Badge variant="info" className="text-xs">
                Optional
              </Badge>
            </div>

            {formData.hasReservePrice && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reserve Price (ETH) *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.reservePrice}
                  onChange={(e) => updateFormData("reservePrice", e.target.value)}
                  placeholder="Minimum acceptable bid"
                  className={errors.reservePrice ? "border-red-500" : ""}
                />
                {errors.reservePrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.reservePrice}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This price will be encrypted and hidden until auction ends
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Auction...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Auction
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

