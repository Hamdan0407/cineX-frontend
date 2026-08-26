import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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
    setWishlist((current) => {
      const exists = current.some((m) => m.id === movie.id);
      let updated: WishlistMovie[];
      if (exists) {
        updated = current.filter((m) => m.id !== movie.id);
        toast.info("Removed from Wishlist", {
          description: `${movie.title} has been removed from your saved movies.`
        });
      } else {
        updated = [movie, ...current];
        toast.success("❤️ Added to Wishlist!", {
          description: `${movie.title} is now saved in your Wishlist for quick access.`
        });
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save wishlist:", e);
      }
      return updated;
    });
  }, [storageKey]);

  const removeWishlist = useCallback((movieId: number, movieTitle?: string) => {
    setWishlist((current) => {
      const updated = current.filter((m) => m.id !== movieId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save wishlist:", e);
      }
      if (movieTitle) {
        toast.info("Removed from Wishlist", {
          description: `${movieTitle} was removed.`
        });
      }
      return updated;
    });
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
