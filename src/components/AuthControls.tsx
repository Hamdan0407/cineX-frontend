import { UserButton, useAuth, useClerk, useUser } from "@clerk/react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type AuthControlsProps = {
  compact?: boolean;
  isAdminUser?: boolean;
  wishlistCount?: number;
  onOpenTickets?: () => void;
  onOpenAdmin?: () => void;
};

const AUTH_LOAD_TIMEOUT_MS = 4000;

/**
 * Always shows Sign In when the user is not signed in.
 * Does not depend on Clerk <Show>, which stays blank while isLoaded is false
 * (e.g. invalid / placeholder publishable key).
 */
export function AuthControls({
  compact = false,
  isAdminUser = false,
  wishlistCount = 0,
  onOpenTickets,
  onOpenAdmin,
}: AuthControlsProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLoadTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  if (isLoaded && isSignedIn) {
    if (compact) {
      return (
        <div className="cx-auth-controls cx-auth-controls-compact">
          <UserButton />
        </div>
      );
    }
    return (
      <div className="cx-user-menu">
        <Link to="/profile" className="cx-hide-mobile">Profile</Link>
        <Link to="/wallet" className="cx-hide-mobile">Wallet</Link>
        {isAdminUser && onOpenAdmin && (
          <span onClick={onOpenAdmin} style={{ cursor: "pointer" }}>Admin</span>
        )}
        {onOpenTickets && (
          <span onClick={onOpenTickets} style={{ cursor: "pointer" }}>Tickets</span>
        )}
        <Link to="/wishlist" className="cx-hide-mobile">Wishlist ({wishlistCount})</Link>
        <UserButton />
      </div>
    );
  }

  // Loading only for a short window — never blank forever.
  if (!isLoaded && !loadTimedOut) {
    return (
      <button type="button" className="cx-btn-signin cx-btn-signin-muted" disabled>
        Loading…
      </button>
    );
  }

  return (
    <button
      type="button"
      className="cx-btn-signin"
      onClick={() => openSignIn()}
      title={!isLoaded ? "Clerk may not be configured. Check VITE_CLERK_PUBLISHABLE_KEY." : undefined}
    >
      Sign In
    </button>
  );
}

export function useClerkAuthReady() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLoadTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    userId: userId || user?.id || null,
    user,
    getToken,
    authReady: isLoaded || loadTimedOut,
    clerkStillInitializing: !isLoaded && !loadTimedOut,
    clerkLikelyMisconfigured: !isLoaded && loadTimedOut,
  };
}
