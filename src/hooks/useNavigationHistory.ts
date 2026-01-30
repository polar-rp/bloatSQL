import { useState, useCallback, useRef, useEffect } from 'react';

interface NavigationHistoryState<T> {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  push: (item: T) => void;
  current: T | null;
}

export function useNavigationHistory<T>(
  onNavigate: (item: T) => void,
  isEqual: (a: T, b: T) => boolean = (a, b) => a === b
): NavigationHistoryState<T> {
  const [history, setHistory] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isNavigatingRef = useRef(false);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;
  const current = currentIndex >= 0 ? history[currentIndex] : null;

  const goBack = useCallback(() => {
    if (canGoBack) {
      isNavigatingRef.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate(history[newIndex]);
    }
  }, [canGoBack, currentIndex, history, onNavigate]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      isNavigatingRef.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate(history[newIndex]);
    }
  }, [canGoForward, currentIndex, history, onNavigate]);

  const push = useCallback((item: T) => {
    // Jeśli nawigujemy (back/forward), nie dodawaj do historii
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    setHistory((prev) => {
      // Nie dodawaj jeśli to ten sam element co aktualny
      if (currentIndex >= 0 && prev[currentIndex] && isEqual(prev[currentIndex], item)) {
        return prev;
      }

      // Usuń wszystko po currentIndex (forward history)
      const newHistory = prev.slice(0, currentIndex + 1);
      // Dodaj nowy element
      newHistory.push(item);
      return newHistory;
    });

    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, isEqual]);

  // Reset flagi nawigacji po każdej zmianie
  useEffect(() => {
    const timer = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    push,
    current,
  };
}
