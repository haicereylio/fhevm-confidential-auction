import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEther(wei: string | bigint): string {
  try {
    const value = typeof wei === 'string' ? BigInt(wei) : wei;
    const ether = Number(value) / 1e18;
    return ether.toFixed(4);
  } catch {
    return '0.0000';
  }
}

export function parseEther(ether: string): string {
  try {
    const value = parseFloat(ether);
    return (BigInt(Math.floor(value * 1e18))).toString();
  } catch {
    return '0';
  }
}

export function formatTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;
  
  if (remaining <= 0) {
    return "Ended";
  }
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getAuctionTypeText(type: number): string {
  const types = ['English', 'Dutch', 'Sealed Bid', 'Reserve'];
  return types[type] || 'Unknown';
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'extended':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ended':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'upcoming':
    case 'pending':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}


