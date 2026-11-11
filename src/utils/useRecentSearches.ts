import { useState, useCallback } from 'react';

const STORAGE_KEY = 'skyforge_recent_searches';
const MAX_ENTRIES = 5;

export interface RecentSearchesState {
  recentSearches: string[];
  addSearch: (city: string) => void;
  clearSearches: () => void;
  removeSearch: (city: string) => void;
}

function toTitleCase(city: string): string {
  return city
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed.slice(0, MAX_ENTRIES);
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(searches: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Synchronously reads the most recently searched city from localStorage.
 * Used as a fallback initial station when geolocation is denied or unsupported.
 */
export function getMostRecentSearch(): string | null {
  const list = loadFromStorage();
  return list.length > 0 ? list[0] : null;
}

/**
 * Custom Hook: useRecentSearches
 * Stores up to 5 recent searched cities in localStorage, deduplicated with most recent first.
 */
export function useRecentSearches(): RecentSearchesState {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadFromStorage());

  const addSearch = useCallback((city: string) => {
    if (!city || !city.trim()) return;
    const normalized = toTitleCase(city);
    if (!normalized) return;

    setRecentSearches((prev) => {
      const deduplicated = prev.filter(
        (entry) => entry.toLowerCase() !== normalized.toLowerCase()
      );
      const updated = [normalized, ...deduplicated].slice(0, MAX_ENTRIES);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is unavailable
    }
    setRecentSearches([]);
  }, []);

  const removeSearch = useCallback((city: string) => {
    if (!city) return;
    setRecentSearches((prev) => {
      const updated = prev.filter(
        (entry) => entry.toLowerCase() !== city.trim().toLowerCase()
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { recentSearches, addSearch, clearSearches, removeSearch };
}

export default useRecentSearches;
