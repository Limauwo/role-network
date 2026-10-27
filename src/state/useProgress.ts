import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'netroadmap:v1:progress';

export interface ProgressState {
  learnedNodeIds: Set<string>;
  toggleLearned: (nodeId: string) => void;
  isLearned: (nodeId: string) => boolean;
  resetProgress: () => void;
}

/**
 * Robust localStorage accessor with versioned key, try/catch boundary,
 * and memory fallback for SSR or restricted storage environments.
 */
function loadLearnedFromStorage(): Set<string> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return new Set();
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch (err) {
    console.warn('[useProgress] Failed to read from localStorage:', err);
  }
  return new Set();
}

function saveLearnedToStorage(learnedIds: Set<string>): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const arrayData = Array.from(learnedIds);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arrayData));
    }
  } catch (err) {
    console.warn('[useProgress] Failed to save to localStorage:', err);
  }
}

export function useProgress(): ProgressState {
  const [learnedNodeIds, setLearnedNodeIds] = useState<Set<string>>(
    loadLearnedFromStorage
  );

  // Sync state changes to storage
  useEffect(() => {
    saveLearnedToStorage(learnedNodeIds);
  }, [learnedNodeIds]);

  const toggleLearned = useCallback((nodeId: string) => {
    setLearnedNodeIds((prev: Set<string>): Set<string> => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const isLearned = useCallback(
    (nodeId: string) => {
      return learnedNodeIds.has(nodeId);
    },
    [learnedNodeIds]
  );

  const resetProgress = useCallback(() => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mereset seluruh progres pembelajaran yang sudah dicentang?'
    );
    if (confirmed) {
      setLearnedNodeIds(new Set());
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('[useProgress] Failed to remove storage item:', err);
      }
    }
  }, []);

  return {
    learnedNodeIds,
    toggleLearned,
    isLearned,
    resetProgress,
  };
}
