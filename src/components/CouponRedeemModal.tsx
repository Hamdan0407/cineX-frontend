import { useEffect, useState } from "react";
import { Calendar, Clock, Lock, ShieldCheck, Tag, Ticket, X } from "lucide-react";
import { api, getApiErrorMessage } from "../api/apiClient";
import { CinexLogo } from "./CinexLogo";

type Props = {
  open: boolean;
  isSignedIn: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onRedeemed: (balance: number) => void;
};

export function CouponRedeemModal({ open, isSignedIn, onClose, onSignIn, onRedeemed }: Props) {
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setRedeeming(false);
    }
  }, [open]);

  if (!open) return null;

  const handleRedeem = () => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    setRedeeming(true);
    setError("");

    api.post("/api/coupons/redeem", { code: "CINEX300" })
      .then((response) => {
        const newBalance = Number(response.data.wallet?.balance || 0);
        onRedeemed(newBalance);
      })
      .catch((requestError) => {
        const msg = getApiErrorMessage(requestError, "Unable to redeem this coupon right now.");
        setError(msg);
      })
      .finally(() => setRedeeming(false));
  };

  return (
    <div className="modal-overlay active" onClick={onClose} role="presentation">
      <section
        className="promo-coupon-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-coupon-title"
      >
        {/* Festive Cinema Artwork (Popcorn Bucket, Clapperboard, Confetti Ribbons) */}
        <div className="promo-festive-art" aria-hidden="true">
          <svg className="promo-festive-svg" viewBox="0 0 640 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="popcornBoxGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E2E2" />
              </linearGradient>
              <linearGradient id="popcornRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#96050C" />
              </linearGradient>
              <linearGradient id="popcornKernel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF4B8" />
                <stop offset="65%" stopColor="#F5BD48" />
                <stop offset="100%" stopColor="#C97B1C" />
              </linearGradient>
              <linearGradient id="ribbonRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF3D5A" />
                <stop offset="100%" stopColor="#A80710" />
              </linearGradient>
            </defs>

            {/* Confetti Streamers & Ribbons */}
            <path d="M510 25 C535 48, 560 32, 585 68 C595 82, 578 112, 602 135" stroke="url(#ribbonRed)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M532 16 C546 36, 570 26, 596 52" stroke="#FFD166" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
            
            {/* Confetti Particles */}
            <circle cx="490" cy="65" r="4.5" fill="#FF3D5A" opacity="0.8" />
            <circle cx="560" cy="110" r="3.5" fill="#FFD166" opacity="0.9" />
            <rect x="525" y="85" width="6" height="10" rx="2" transform="rotate(35 525 85)" fill="#FF3D5A" opacity="0.85" />
            <rect x="470" y="115" width="8" height="5" rx="1.5" transform="rotate(-25 470 115)" fill="#FFD166" opacity="0.75" />
            <circle cx="610" cy="90" r="3.5" fill="#FFFFFF" opacity="0.6" />

            <circle cx="160" cy="30" r="3.5" fill="#FFD166" opacity="0.8" />
            <rect x="180" y="45" width="7" height="11" rx="2" transform="rotate(40 180 45)" fill="#FF3D5A" opacity="0.75" />
            <circle cx="210" cy="25" r="4" fill="#FFD166" opacity="0.7" />
            <rect x="135" y="90" width="8" height="6" rx="1.5" transform="rotate(-15 135 90)" fill="#FF3D5A" opacity="0.6" />

            {/* Popcorn Bucket (Tilted ~-14deg at Top Left) */}
            <g transform="translate(20, 10) rotate(-14 60 90)">
              {/* Overflowing Popcorn Kernels */}
              <g>
                <circle cx="45" cy="42" r="13" fill="url(#popcornKernel)" />
                <circle cx="62" cy="35" r="14" fill="url(#popcornKernel)" />
                <circle cx="80" cy="40" r="13" fill="url(#popcornKernel)" />
                <circle cx="35" cy="54" r="12" fill="url(#popcornKernel)" />
                <circle cx="52" cy="48" r="15" fill="url(#popcornKernel)" />
                <circle cx="72" cy="48" r="14" fill="url(#popcornKernel)" />
                <circle cx="90" cy="54" r="12" fill="url(#popcornKernel)" />
                <circle cx="42" cy="28" r="9" fill="url(#popcornKernel)" />
                <circle cx="60" cy="22" r="10" fill="url(#popcornKernel)" />
                <circle cx="75" cy="26" r="9" fill="url(#popcornKernel)" />
              </g>

              {/* Popcorn Tub Body */}
              <path d="M28 65 L40 148 C41 154, 46 158, 52 158 L80 158 C86 158, 91 154, 92 148 L104 65 Z" fill="url(#popcornBoxGrad)" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.6))" />
              {/* Red Stripes on Tub */}
              <path d="M37 65 L46 148 L55 148 L48 65 Z" fill="url(#popcornRedGrad)" />
              <path d="M60 65 L63 158 L71 158 L70 65 Z" fill="url(#popcornRedGrad)" />
              <path d="M82 65 L79 148 L87 148 L93 65 Z" fill="url(#popcornRedGrad)" />
            </g>

            {/* Movie Clapperboard (Below/Behind Popcorn) */}
            <g transform="translate(12, 102) rotate(8 45 45)" opacity="0.95">
              {/* Bottom Body */}
              <rect x="15" y="40" width="75" height="52" rx="6" fill="#1A1C23" stroke="#2E3340" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
              <line x1="22" y1="58" x2="80" y2="58" stroke="#3A4050" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="72" x2="65" y2="72" stroke="#3A4050" strokeWidth="2" strokeLinecap="round" />
              {/* Top Chevron Slate Tilted */}
              <g transform="rotate(-16 15 38)">
                <rect x="14" y="22" width="78" height="18" rx="4" fill="#111318" stroke="#2E3340" strokeWidth="1.5" />
                {/* White diagonal stripes */}
                <path d="M24 22 L32 40 L40 40 L32 22 Z" fill="#E8ECEF" />
                <path d="M46 22 L54 40 L62 40 L54 22 Z" fill="#E8ECEF" />
                <path d="M68 22 L76 40 L84 40 L76 22 Z" fill="#E8ECEF" />
              </g>
            </g>
          </svg>
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="promo-close-btn"
          onClick={onClose}
          aria-label="Close promotional popup"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="promo-header">
          <div style={{ marginBottom: "0.65rem", display: "flex", justifyContent: "center" }}>
            <CinexLogo height={32} />
          </div>

          <h2 id="promo-coupon-title">
            Do you have<br />
            <span className="promo-heading-red">any coupon?</span>
          </h2>

          <p className="promo-subtitle">
            If you have a coupon,<br />
            redeem it <strong className="promo-highlight-yellow">before</strong> it gets expired.
          </p>

          <div className="promo-sparkle-divider" aria-hidden="true">
            ✦
          </div>
        </div>

        {/* Coupon Ticket Voucher */}
        <div className="promo-ticket-wrapper">
          <div className="promo-ticket">
            {/* Left Cream Section */}
            <div className="promo-ticket-left">
              <div className="promo-ticket-left-inner">
                <span className="promo-ticket-eyebrow">EXCLUSIVE OFFER</span>
                <div className="promo-ticket-code">CINEX300</div>
                <div className="promo-ticket-desc">
                  Use this code &amp; get instant <span className="promo-ticket-highlight">₹300 in wallet</span>
                </div>
              </div>
            </div>

            {/* Perforation Cutouts */}
            <div className="promo-ticket-perforation">
              <div className="promo-notch top" />
              <div className="promo-dashed-line" />
              <div className="promo-notch bottom" />
            </div>

            {/* Right Red Stub */}
            <div className="promo-ticket-right">
              <div className="promo-ticket-right-inner">
                <div className="promo-stub-icon-wrap">
                  <Calendar size={22} color="#FFFFFF" strokeWidth={2.2} />
                </div>
                <span className="promo-stub-label">Expires on</span>
                <strong className="promo-stub-date">30 Sep 2025</strong>
                <span className="promo-stub-time">11:59 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Three Benefit Badges */}
        <div className="promo-perks-grid">
          <div className="promo-perk-item">
            <div className="promo-perk-icon-wrap">
              <Tag size={18} className="promo-perk-icon" />
            </div>
            <div className="promo-perk-text">
              <strong>Get ₹300 instantly</strong>
              <small>in your CineX wallet</small>
            </div>
          </div>

          <div className="promo-perk-item">
            <div className="promo-perk-icon-wrap">
              <ShieldCheck size={18} className="promo-perk-icon" />
            </div>
            <div className="promo-perk-text">
              <strong>Valid on all movies</strong>
              <small>&amp; theatres</small>
            </div>
          </div>

          <div className="promo-perk-item">
            <div className="promo-perk-icon-wrap">
              <Clock size={18} className="promo-perk-icon" />
            </div>
            <div className="promo-perk-text">
              <strong>Limited time offer</strong>
              <small>Don't miss out!</small>
            </div>
          </div>
        </div>

        {/* Error Banner if Redemption Fails */}
        {error && (
          <div className="promo-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="promo-actions-row">
          <button
            type="button"
            className="promo-btn-later"
            onClick={onClose}
          >
            Maybe Later
          </button>

          <button
            type="button"
            className="promo-btn-redeem"
            disabled={redeeming}
            onClick={handleRedeem}
          >
            <Ticket size={18} className="promo-btn-ticket-icon" />
            {redeeming ? "Redeeming..." : "Redeem Now"}
          </button>
        </div>

        {/* Footer Trust Note */}
        <div className="promo-trust-footer">
          <Lock size={12} className="promo-lock-icon" />
          <span>Secure • Safe • Trusted by CineX</span>
        </div>
      </section>
    </div>
  );
}


