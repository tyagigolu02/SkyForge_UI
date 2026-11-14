import { useState, useEffect, useCallback } from 'react';
import { SearchLimitState } from '../types';

const STORAGE_KEY = 'skyforge_guest_search_count';
const DEFAULT_LIMIT = 3;
const DB_NAME = 'SkyForgeHardwareLockDB';
const STORE_NAME = 'QuotaStore';

// Deterministic Hardware/Browser Fingerprint for this machine
function getDeviceLockKey(): string {
  if (typeof window === 'undefined') return STORAGE_KEY;
  const nav = window.navigator;
  const scr = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    scr.colorDepth,
    `${scr.width}x${scr.height}`,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 4,
    (nav as unknown as { deviceMemory?: number }).deviceMemory || 4,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `${STORAGE_KEY}_fp_${Math.abs(hash)}`;
}

function getCookieCount(key: string): number {
  if (typeof document === 'undefined') return 0;
  const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
  return match ? parseInt(match[2], 10) || 0 : 0;
}

function setCookieCount(key: string, val: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 10 * 365 * 86400 * 1000).toUTCString(); // 10-Year Lock
  document.cookie = `${key}=${val}; expires=${expires}; path=/; SameSite=Strict`;
}

function readIndexedDB(key: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        const tx = req.result.transaction(STORE_NAME, 'readonly');
        const getReq = tx.objectStore(STORE_NAME).get(key);
        getReq.onsuccess = () => resolve(Number(getReq.result) || 0);
        getReq.onerror = () => resolve(0);
      };
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

function writeIndexedDB(key: string, val: number): void {
  try {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(val, key);
    };
  } catch {}
}

/**
 * Custom Hook: useSearchLimit
 * Enforces the permanent non-resettable "3-Attempt Rule" per system for guest users.
 */
export function useSearchLimit(maxLimit: number = DEFAULT_LIMIT): SearchLimitState {
  const deviceKey = getDeviceLockKey();

  const getHighestRecordedCount = useCallback((): number => {
    try {
      const legacy = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
      const fpLs = parseInt(localStorage.getItem(deviceKey) || '0', 10) || 0;
      const cookieVal = getCookieCount(deviceKey);
      return Math.min(maxLimit, Math.max(legacy, fpLs, cookieVal));
    } catch {
      return 0;
    }
  }, [deviceKey, maxLimit]);

  const [searchesUsed, setSearchesUsed] = useState<number>(() => getHighestRecordedCount());

  const persistAllLayers = useCallback(
    (count: number) => {
      const clamped = Math.min(maxLimit, count);
      try {
        localStorage.setItem(STORAGE_KEY, clamped.toString());
        localStorage.setItem(deviceKey, clamped.toString());
      } catch {}
      setCookieCount(deviceKey, clamped);
      writeIndexedDB(deviceKey, clamped);
    },
    [deviceKey, maxLimit]
  );

  // Sync with IndexedDB & protect against DevTools localStorage deletion
  useEffect(() => {
    readIndexedDB(deviceKey).then((idbCount) => {
      const trueMax = Math.min(maxLimit, Math.max(getHighestRecordedCount(), idbCount, searchesUsed));
      if (trueMax !== searchesUsed) {
        setSearchesUsed(trueMax);
      }
      persistAllLayers(trueMax);
    });

    const handleStorageTamper = () => {
      const trueMax = Math.max(getHighestRecordedCount(), searchesUsed);
      persistAllLayers(trueMax);
      setSearchesUsed(trueMax);
    };

    window.addEventListener('storage', handleStorageTamper);
    return () => window.removeEventListener('storage', handleStorageTamper);
  }, [deviceKey, getHighestRecordedCount, maxLimit, persistAllLayers, searchesUsed]);

  const searchesRemaining = Math.max(0, maxLimit - searchesUsed);
  const hasExceededLimit = searchesUsed >= maxLimit;

  const recordSearch = useCallback(
    (isAuthenticated = false): boolean => {
      if (isAuthenticated) {
        return true; // Logged-in Pro operators enjoy unlimited searches
      }

      const currentMax = Math.max(searchesUsed, getHighestRecordedCount());
      if (currentMax >= maxLimit) {
        setSearchesUsed(maxLimit);
        persistAllLayers(maxLimit);
        return false; // Limit reached: Freeze search & trigger auth
      }

      const nextCount = currentMax + 1;
      setSearchesUsed(nextCount);
      persistAllLayers(nextCount);
      return true;
    },
    [searchesUsed, getHighestRecordedCount, maxLimit, persistAllLayers]
  );

  /**
   * Permanent Hardware Lock: Guest count NEVER resets to 0 on the same system.
   */
  const resetSearches = useCallback((): void => {
    const lockedCount = Math.max(searchesUsed, getHighestRecordedCount());
    setSearchesUsed(lockedCount);
    persistAllLayers(lockedCount);
  }, [searchesUsed, getHighestRecordedCount, persistAllLayers]);

  return {
    searchesUsed,
    searchesRemaining,
    maxLimit,
    hasExceededLimit,
    recordSearch,
    resetSearches,
  };
}

export default useSearchLimit;