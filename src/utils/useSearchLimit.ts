import { useState, useEffect, useCallback } from 'react';
import { SearchLimitState } from '../types';

const STORAGE_KEY = 'skyforge_guest_search_count';
const DEFAULT_LIMIT = 3;

/**
 * Custom Hook: useSearchLimit
 * Enforces the "3-Attempt Rule" for guest users.
 * Persists query count in localStorage and provides methods to check, increment, and reset search limits.
 */
export function useSearchLimit(maxLimit: number = DEFAULT_LIMIT): SearchLimitState {
  const [searchesUsed, setSearchesUsed] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Synchronize state across storage changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, searchesUsed.toString());
    } catch (err) {
      console.warn('Unable to persist guest search count to localStorage', err);
    }
  }, [searchesUsed]);

  const searchesRemaining = Math.max(0, maxLimit - searchesUsed);
  const hasExceededLimit = searchesUsed >= maxLimit;

  /**
   * Attempts to record a search.
   * If isAuthenticated is true, search is always allowed (unlimited).
   * If guest and remaining > 0, increments count and returns true.
   * If guest and limit reached (4th attempt), returns false.
   */
  const recordSearch = useCallback(
    (isAuthenticated = false): boolean => {
      if (isAuthenticated) {
        return true; // Pro operators enjoy unlimited searches
      }

      if (searchesUsed >= maxLimit) {
        return false; // Limit reached: Freeze search & trigger auth
      }

      const nextCount = searchesUsed + 1;
      setSearchesUsed(nextCount);
      try {
        localStorage.setItem(STORAGE_KEY, nextCount.toString());
      } catch {}
      return true;
    },
    [searchesUsed, maxLimit]
  );

  /**
   * Resets search count (e.g., after logging in, testing, or clearing demo state).
   */
  const resetSearches = useCallback((): void => {
    setSearchesUsed(0);
    try {
      localStorage.setItem(STORAGE_KEY, '0');
    } catch {}
  }, []);

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

