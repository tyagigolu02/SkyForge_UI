import { useState, useEffect, useCallback } from 'react';
import {
  getAuthToken,
  fetchFavoriteCitiesFromDb,
  addFavoriteCityToDb,
} from '../services/api';

const STORAGE_KEY = 'skyforge_recent_searches';
const MAX_ENTRIES = 6;

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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function saveToStorage(searches: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {}
}

export function getMostRecentSearch(): string | null {
  const list = loadFromStorage();
  return list.length > 0 ? list[0] : null;
}

export function useRecentSearches(): RecentSearchesState {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadFromStorage());

  // Sync user's saved Favorite Cities from PostgreSQL DB when logged in
  useEffect(() => {
    if (!getAuthToken()) return;
    fetchFavoriteCitiesFromDb().then((dbFavorites) => {
      if (!dbFavorites.length) return;
      setRecentSearches((prev) => {
        const dbNames = dbFavorites.map((item) => toTitleCase(item.cityName)).reverse();
        const combined = [...prev, ...dbNames].filter(Boolean);
        const unique: string[] = [];
        for (const c of combined) {
          if (!unique.some((u) => u.toLowerCase() === c.toLowerCase())) {
            unique.push(c);
          }
        }
        const final = unique.slice(0, MAX_ENTRIES);
        saveToStorage(final);
        return final;
      });
    });
  }, []);

  const addSearch = useCallback((city: string) => {
    const normalized = toTitleCase(city || '');
    if (!normalized) return;

    // Persist to PostgreSQL favorite_cities table if user is logged in
    if (getAuthToken()) {
      addFavoriteCityToDb(normalized);
    }

    setRecentSearches((prev) => {
      const deduplicated = prev.filter((e) => e.toLowerCase() !== normalized.toLowerCase());
      const updated = [normalized, ...deduplicated].slice(0, MAX_ENTRIES);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setRecentSearches([]);
  }, []);

  const removeSearch = useCallback((city: string) => {
    if (!city) return;
    setRecentSearches((prev) => {
      const updated = prev.filter((e) => e.toLowerCase() !== city.trim().toLowerCase());
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { recentSearches, addSearch, clearSearches, removeSearch };
}

export default useRecentSearches;