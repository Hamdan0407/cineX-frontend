import { useState, useEffect, useCallback, useRef } from "react";
import { showWishlistAddedToast, showWishlistRemovedToast } from "./cinexToast";

export interface WishlistMovie {
  id: number;
  title: string;
  poster_path?: string;
  vote_average?: number;
  original_language?: string;
  genre_ids?: number[];
  overview?: string;
}

const WISHLIST_KEY_PREFIX = "cinex_wishlist_";

export const useWishlist = (userId?: string) => {
  const effectiveUserId = userId || "guest_user";
  const storageKey = `${WISHLIST_KEY_PREFIX}${effectiveUserId}`;

  const [wishlist, setWishlist] = useState<WishlistMovie[]>([]);
  const wishlistRef = useRef<WishlistMovie[]>([]);

  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  // Load from localStorage on mount or user change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setWishlist(JSON.parse(stored));
      } else {
        setWishlist([]);
      }
    } catch (e) {
      console.error("Failed to load wishlist from localStorage:", e);
      setWishlist([]);
    }
  }, [storageKey]);

  // Save to localStorage whenever wishlist changes
  const saveWishlist = useCallback((newList: WishlistMovie[]) => {
    setWishlist(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage:", e);
    }
  }, [storageKey]);

  const isWishlisted = useCallback((movieId: number) => {
    return wishlist.some((m) => m.id === movieId);
  }, [wishlist]);

  const toggleWishlist = useCallback((movie: WishlistMovie) => {
    const current = wishlistRef.current;
    const exists = current.some((m) => m.id === movie.id);
    const updated = exists
      ? current.filter((m) => m.id !== movie.id)
      : [movie, ...current];

    wishlistRef.current = updated;
    setWishlist(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save wishlist:", e);
    }

    if (exists) {
      showWishlistRemovedToast(movie.title);
    } else {
      showWishlistAddedToast(movie.title);
    }
  }, [storageKey]);

  const removeWishlist = useCallback((movieId: number, movieTitle?: string) => {
    const current = wishlistRef.current;
    const updated = current.filter((m) => m.id !== movieId);

    wishlistRef.current = updated;
    setWishlist(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save wishlist:", e);
    }

    if (movieTitle) {
      showWishlistRemovedToast(movieTitle);
    }
  }, [storageKey]);

  return {
    wishlist,
    isWishlisted,
    toggleWishlist,
    removeWishlist,
    saveWishlist,
    wishlistCount: wishlist.length
  };
};
