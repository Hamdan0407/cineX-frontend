import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { Ticket, Heart, Settings, LogOut, QrCode, User, CreditCard, ChevronRight, ArrowLeft, Download, Film, MapPin } from "lucide-react";
import { toast } from "sonner";
import { downloadAuthenticatedFile, getApiErrorMessage } from "../api/apiClient";

export interface UserBookingItem {
  bookingId?: number | string;
  id?: number | string;
  movieTitle?: string;
  movie?: string;
  posterPath?: string;
  poster?: string;
  theatreName?: string;
  theatre?: string;
  screenName?: string;
  screeningLanguage?: string;
  showDate?: string;
  date?: string;
  showTime?: string;
  time?: string;
  seats?: string[] | string;
  seatNumbers?: string[] | string;
  totalAmount?: number;
  total?: number;
  bookingStatus?: string;
  status?: string;
  ticketToken?: string;
  ticketQrUrl?: string;
  createdAt?: string;
}

interface ProfilePageProps {
  wishlistCount: number;
  bookings: UserBookingItem[];
  ticketQrUrls?: Record<string, string>;
  onOpenBookings: () => void;
  onBookMovie?: (movie: any) => void;
  onRefreshBookings?: () => void;
}

const resolvePoster = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w300${path}`;
};

export const ProfilePage: React.FC<ProfilePageProps> = ({
  wishlistCount,
  bookings = [],
  ticketQrUrls = {},
  onOpenBookings,
  onBookMovie,
  onRefreshBookings
}) => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn, signOut } = useClerk();

  useEffect(() => {
    if (isSignedIn && onRefreshBookings) {
      onRefreshBookings();
    }
  }, [isSignedIn, onRefreshBookings]);

  // Separate upcoming vs past bookings based on show date
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: UserBookingItem[] = [];
    const past: UserBookingItem[] = [];

    bookings.forEach((b) => {
      const dateStr = b.showDate || b.date;
      if (!dateStr) {
        upcoming.push(b);
        return;
      }
      const showDate = new Date(dateStr);
      if (isNaN(showDate.getTime()) || showDate >= today) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  const handleDownloadTicket = async (b: UserBookingItem) => {
    const tokenVal = b.ticketToken || null;
    const bookingIdVal = b.bookingId || (b.id ? String(b.id).replace("CNX-", "") : null);
    if (!tokenVal && !bookingIdVal) {
      toast.error("Ticket is not ready to download yet.");
      return;
    }
    try {
      const path = tokenVal
        ? `/api/tickets/download/${tokenVal}`
        : `/api/tickets/download-by-booking/${bookingIdVal}`;
      await downloadAuthenticatedFile(path, `CineX-Ticket-CNX-${bookingIdVal || tokenVal}.pdf`);
      toast.success("Ticket downloaded successfully!");
    } catch (err) {
      toast.error("Download failed", { description: getApiErrorMessage(err, "Unable to download ticket PDF.") });
    }
  };

  if (isLoaded && !isSignedIn) {
    return (
      <div className="cx-page" style={{ paddingTop: "2rem", textAlign: "center" }}>
        <h1 className="cx-section-title" style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Profile</h1>
        <p style={{ color: "var(--text2)", marginBottom: "1.5rem" }}>Sign in to view your CineX tickets, wallet balance, and account settings.</p>
        <button type="button" className="cx-btn-signin" onClick={() => openSignIn()}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="cx-page" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Back Button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#B8C0CC",
            background: "rgba(255,255,255,0.05)",
            padding: "0.6rem 1.2rem",
            borderRadius: "50px",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C0CC")}
          aria-label="Go back to previous screen"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="cx-profile-grid">
        {/* Left Section: Bookings */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h1 className="cx-section-title" style={{ fontSize: "1.75rem", margin: 0 }}>My Bookings</h1>
            {bookings.length > 0 && (
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                onClick={onOpenBookings}
              >
                <Ticket size={14} /> Open Ticket Vault
              </button>
            )}
          </div>

          {/* Upcoming Bookings */}
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Upcoming Shows</span>
            <span style={{ fontSize: "0.75rem", background: "rgba(232,149,140,0.15)", color: "var(--coral)", padding: "0.15rem 0.5rem", borderRadius: "12px" }}>
              {upcomingBookings.length}
            </span>
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="ticket-card" style={{ padding: "2.5rem 1.5rem", textAlign: "center", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: "var(--text3)" }}>
                <Film size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.3rem" }}>No upcoming shows booked yet</h3>
                <p style={{ color: "var(--text2)", fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto" }}>
                  Browse what's playing in theatres right now and reserve your favourite seats.
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}
                onClick={() => navigate("/")}
              >
                <Ticket size={15} /> Browse Movies
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {upcomingBookings.map((b, i) => {
                const posterImg = resolvePoster(b.posterPath || b.poster);
                const movieName = b.movieTitle || b.movie || "Cinema Feature";
                const theatreName = b.theatreName || b.theatre || "CineX Theatre";
                const screenName = b.screenName || "Screen 1";
                const lang = b.screeningLanguage || "";
                const statusStr = b.bookingStatus || b.status || "CONFIRMED";
                const showTimeStr = b.showTime || b.time || "";
                const showDateStr = b.showDate || b.date || "";
                const seatsList = Array.isArray(b.seatNumbers) ? b.seatNumbers : Array.isArray(b.seats) ? b.seats : [String(b.seatNumbers || b.seats || "1 Seat")];
                const amountVal = b.totalAmount || b.total || 0;
                const bookingIdVal = b.bookingId || (b.id ? String(b.id).replace("CNX-", "") : i + 1);
                const tokenVal = b.ticketToken || null;
                const qrUrl = tokenVal
                  ? (ticketQrUrls[tokenVal] || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(tokenVal)}&color=0B0D12&bgcolor=FFFFFF`)
                  : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(bookingIdVal))}&color=0B0D12&bgcolor=FFFFFF`;

                return (
                  <div key={bookingIdVal || i} className="ticket-card cx-upcoming-ticket-card">
                    {/* Poster */}
                    <div className="ticket-poster" style={{ width: 110 }}>
                      {posterImg ? (
                        <img
                          src={posterImg}
                          alt={movieName}
                          style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: "10px", boxShadow: "0 8px 16px rgba(0,0,0,0.4)" }}
                        />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "2/3", background: "var(--surface2)", borderRadius: "10px", display: "grid", placeItems: "center", color: "var(--text3)" }}>
                          <Film size={32} />
                        </div>
                      )}
                    </div>

                    {/* Movie & Show Info */}
                    <div className="ticket-details">
                      <div className="ticket-title-row" style={{ marginBottom: "0.35rem" }}>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{movieName}</h3>
                        <span className="ticket-status-badge" style={{ background: "rgba(74, 222, 128, 0.12)", color: "#4ade80", borderColor: "rgba(74, 222, 128, 0.3)" }}>
                          ✓ {statusStr}
                        </span>
                      </div>

                      <p style={{ color: "var(--text2)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.85rem" }}>
                        <MapPin size={14} color="var(--coral)" />
                        <span>{theatreName} • {screenName} {lang && `• ${lang}`}</span>
                      </p>

                      <div className="ticket-meta-grid" style={{ gap: "0.65rem 1.25rem" }}>
                        <div className="ticket-meta-item">
                          <span>DATE</span>
                          <strong style={{ color: "#fff", fontSize: "0.88rem" }}>{showDateStr || "Upcoming"}</strong>
                        </div>
                        <div className="ticket-meta-item">
                          <span>SHOWTIME</span>
                          <strong style={{ color: "#fff", fontSize: "0.88rem" }}>{showTimeStr || "Today"}</strong>
                        </div>
                        <div className="ticket-meta-item">
                          <span>SEATS ({seatsList.length})</span>
                          <strong style={{ color: "var(--coral)", fontSize: "0.88rem" }}>{seatsList.join(", ")}</strong>
                        </div>
                        <div className="ticket-meta-item">
                          <span>TOTAL PAID</span>
                          <strong style={{ color: "var(--coral)", fontSize: "0.95rem" }}>₹{amountVal}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.1rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                          onClick={() => handleDownloadTicket(b)}
                        >
                          <Download size={14} /> Download PDF
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                          onClick={onOpenBookings}
                        >
                          <QrCode size={14} /> View Ticket Pass
                        </button>
                      </div>
                    </div>

                    {/* QR Code Pass Box */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingLeft: "1rem", borderLeft: "1px dashed rgba(255,255,255,0.12)" }}>
                      <div style={{ width: "100px", height: "100px", background: "#fff", borderRadius: "8px", padding: "5px", display: "grid", placeItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                        <img src={qrUrl} alt="QR" style={{ width: "90px", height: "90px", display: "block" }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff", marginTop: "0.4rem" }}>#CNX-{bookingIdVal}</span>
                      <span style={{ fontSize: "0.62rem", color: "#4ade80", fontWeight: 700, marginTop: "0.15rem" }}>ENTRY PASS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past History */}
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Past History</span>
            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.08)", color: "var(--text2)", padding: "0.15rem 0.5rem", borderRadius: "12px" }}>
              {pastBookings.length}
            </span>
          </h2>

          {pastBookings.length === 0 ? (
            <div className="ticket-card" style={{ padding: "1.75rem", textAlign: "center", color: "var(--text2)", fontSize: "0.88rem" }}>
              No completed past bookings yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {pastBookings.map((b, i) => {
                const posterImg = resolvePoster(b.posterPath || b.poster);
                const movieName = b.movieTitle || b.movie || "Cinema Feature";
                const theatreName = b.theatreName || b.theatre || "CineX Theatre";
                const showDateStr = b.showDate || b.date || "";
                const seatsList = Array.isArray(b.seatNumbers) ? b.seatNumbers : Array.isArray(b.seats) ? b.seats : [String(b.seatNumbers || b.seats || "")];
                const amountVal = b.totalAmount || b.total || 0;
                const bookingIdVal = b.bookingId || (b.id ? String(b.id).replace("CNX-", "") : i + 1);

                return (
                  <div key={bookingIdVal || i} className="ticket-card cx-past-ticket-card">
                    <div className="ticket-poster" style={{ width: 60 }}>
                      {posterImg ? (
                        <img src={posterImg} alt="" style={{ width: "100%", aspectRatio: "2/3", borderRadius: 6, objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "2/3", background: "var(--surface2)", borderRadius: 6, display: "grid", placeItems: "center" }}>
                          <Film size={20} color="var(--text3)" />
                        </div>
                      )}
                    </div>
                    <div className="ticket-details">
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase" }}>{movieName}</h3>
                      <p style={{ color: "var(--text2)", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                        {theatreName} • {showDateStr} • {seatsList.join(", ")} • ₹{amountVal}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: "0.78rem", padding: "0.4rem 0.85rem" }}
                        onClick={() => handleDownloadTicket(b)}
                      >
                        <Download size={13} /> PDF
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: "0.78rem", padding: "0.4rem 0.85rem" }}
                        onClick={() => {
                          if (onBookMovie) {
                            onBookMovie({ title: movieName });
                          } else {
                            navigate("/");
                          }
                        }}
                      >
                        Re-book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Sidebar: Profile & Quick Links */}
        <aside>
          <h2 className="cx-section-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Profile</h2>
          <div className="cx-checkout-card" style={{ marginBottom: "1.25rem", textAlign: "center", padding: "1.5rem" }}>
            <div style={{ width: 76, height: 76, margin: "0 auto 0.85rem", borderRadius: "50%", border: "2px solid var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(232,149,140,0.1)" }}>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={36} color="var(--coral)" />
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>{user?.fullName || user?.firstName || "CineX Member"}</div>
            <div style={{ color: "var(--text2)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{user?.primaryEmailAddress?.emailAddress || "Verified Member"}</div>
            <div style={{ display: "inline-block", color: "var(--coral)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", marginTop: "0.6rem", background: "rgba(232,149,140,0.12)", padding: "0.2rem 0.6rem", borderRadius: "20px" }}>
              CINEX BLACK MEMBER
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {[
              { label: `My Bookings (${bookings.length})`, icon: Ticket, active: true, onClick: onOpenBookings },
              { label: "Account Settings", icon: Settings, to: "/settings" },
              { label: "CineX Wallet", icon: CreditCard, to: "/wallet" },
              { label: `Wishlist (${wishlistCount})`, icon: Heart, to: "/wishlist" },
            ].map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon size={16} color="var(--coral)" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronRight size={14} color="var(--text3)" />
                </>
              );
              const style = {
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                border: `1px solid ${item.active ? "var(--coral)" : "var(--border)"}`,
                borderRadius: 8,
                background: item.active ? "rgba(232,149,140,.08)" : "transparent",
                cursor: "pointer",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text)",
                width: "100%",
                textAlign: "left" as const
              };
              if (item.to) return <Link key={item.label} to={item.to} style={{ ...style, textDecoration: "none" }}>{content}</Link>;
              return <button key={item.label} type="button" style={style} onClick={item.onClick}>{content}</button>;
            })}
          </nav>

          <button
            type="button"
            className="btn-outline"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => { toast.info("Signing out..."); signOut(); }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </aside>
      </div>
    </div>
  );
};

