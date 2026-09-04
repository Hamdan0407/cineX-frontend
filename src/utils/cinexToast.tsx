import { Bookmark, X } from "lucide-react";
import { toast } from "sonner";

const WISHLIST_TOAST_ID = "cinex-wishlist";

type WishlistToastProps = {
  title: string;
  message: string;
  variant: "added" | "removed";
};

function WishlistToast({ title, message, variant }: WishlistToastProps) {
  return (
    <div className="cinex-wishlist-toast" role="status" aria-live="polite">
      <div className={`cinex-wishlist-toast__icon${variant === "added" ? " is-added" : ""}`}>
        <Bookmark size={18} strokeWidth={2.25} fill={variant === "added" ? "currentColor" : "none"} />
      </div>
      <div className="cinex-wishlist-toast__body">
        <p className="cinex-wishlist-toast__title">{title}</p>
        <p className="cinex-wishlist-toast__message">{message}</p>
      </div>
      <button
        type="button"
        className="cinex-wishlist-toast__close"
        onClick={() => toast.dismiss(WISHLIST_TOAST_ID)}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function showWishlistAddedToast(movieTitle: string) {
  toast.custom(
    () => (
      <WishlistToast
        variant="added"
        title="Saved to Ticket Vault"
        message={`${movieTitle} is in your wishlist.`}
      />
    ),
    { id: WISHLIST_TOAST_ID, duration: 2800, unstyled: true },
  );
}

export function showWishlistRemovedToast(movieTitle: string) {
  toast.custom(
    () => (
      <WishlistToast
        variant="removed"
        title="Removed from Wishlist"
        message={`${movieTitle} was removed from your saved movies.`}
      />
    ),
    { id: WISHLIST_TOAST_ID, duration: 2500, unstyled: true },
  );
}
