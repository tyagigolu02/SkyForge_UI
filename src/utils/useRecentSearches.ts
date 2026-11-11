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
  if (!city) return city;
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
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
    // Silently fail if localStorage is unavailable (e.g., private browsing quota exceeded)
  }
}

export function useRecentSearches(): RecentSearchesState {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadFromStorage());

  const addSearch = useCallback((city: string) => {
    if (!city || !city.trim()) return;
    const normalized = toTitleCase(city.trim());
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
