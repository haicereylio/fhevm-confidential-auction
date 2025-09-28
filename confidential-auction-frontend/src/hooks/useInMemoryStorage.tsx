"use client";

import { useState, useCallback } from "react";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage(): { storage: GenericStringStorage } {
  const [storageMap] = useState<Map<string, string>>(new Map());

  const storage: GenericStringStorage = {
    getItem: useCallback(async (key: string): Promise<string | null> => {
      return storageMap.get(key) || null;
    }, [storageMap]),

    setItem: useCallback(async (key: string, value: string): Promise<void> => {
      storageMap.set(key, value);
    }, [storageMap]),

    removeItem: useCallback(async (key: string): Promise<void> => {
      storageMap.delete(key);
    }, [storageMap]),
  };

  return { storage };
}
