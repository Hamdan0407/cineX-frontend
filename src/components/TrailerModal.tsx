import { useEffect } from "react";
import { X } from "lucide-react";

type TrailerModalProps = {
  open: boolean;
  title: string;
  playbackUrl: string | null;
  onClose: () => void;
};

export function TrailerModal({ open, title, playbackUrl, onClose }: TrailerModalProps) {
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay active trailer-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onClick={onClose}
    >
      <div className="trailer-modal" onClick={(event) => event.stopPropagation()}>
        <div className="trailer-modal-header">
          <h3>{title}</h3>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close trailer">
            <X size={18} />
          </button>
        </div>
        <div className="trailer-modal-body">
          {playbackUrl ? (
            <video
              key={playbackUrl}
              className="trailer-modal-video"
              src={playbackUrl}
              controls
              playsInline
              preload="auto"
            />
          ) : (
            <p className="trailer-modal-unavailable">Trailer is not available for this title.</p>
          )}
        </div>
      </div>
    </div>
  );
}
