import React from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { Ticket, Heart, Settings, LogOut, Calendar, QrCode, User, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ProfilePageProps {
  wishlistCount: number;
  bookingsCount: number;
  onOpenBookings: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  wishlistCount,
  bookingsCount,
  onOpenBookings
}) => {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="cx-page" style={{ paddingTop: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", alignItems: "start" }}>
        <section>
          <h1 className="cx-section-title" style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>My Bookings</h1>

          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Upcoming</h2>
          <div className="ticket-card" style={{ marginBottom: "2rem" }}>
            <div className="ticket-poster" style={{ width: 100 }}>
              <div style={{ width: "100%", aspectRatio: "2/3", background: "var(--surface2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
                <Ticket size={28} />
              </div>
            </div>
            <div className="ticket-details">
              <div className="ticket-title-row">
                <h3>{bookingsCount > 0 ? "Your Upcoming Show" : "No Upcoming Bookings"}</h3>
                {bookingsCount > 0 && <span className="ticket-status-badge">CONFIRMED</span>}
              </div>
              {bookingsCount > 0 ? (
                <>
                  <p style={{ color: "var(--text2)", fontSize: ".85rem", display: "flex", alignItems: "center", gap: ".35rem", marginTop: ".5rem" }}>
                    <Calendar size={14} color="var(--coral)" /> Open Ticket Vault for details
                  </p>
                  <button className="btn-outline" style={{ marginTop: "1rem", fontSize: ".85rem" }} onClick={onOpenBookings}>
                    <QrCode size={14} /> View Ticket
                  </button>
                </>
              ) : (
                <p style={{ color: "var(--text2)", fontSize: ".85rem", marginTop: ".5rem" }}>Book your next cinematic experience from the home page.</p>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>Past History</h2>
          <div className="ticket-card" style={{ alignItems: "center" }}>
            <div className="ticket-poster" style={{ width: 56 }}>
              <div style={{ width: "100%", aspectRatio: "2/3", background: "var(--surface2)", borderRadius: 6 }} />
            </div>
            <div className="ticket-details" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: ".95rem" }}>Previous Bookings</h3>
                <p style={{ color: "var(--text2)", fontSize: ".8rem" }}>View in Ticket Vault</p>
              </div>
              <button className="btn-outline" style={{ fontSize: ".8rem", padding: ".45rem 1rem" }} onClick={onOpenBookings}>Re-book</button>
            </div>
          </div>
        </section>

        <aside>
          <h2 className="cx-section-title" style={{ fontSize: "1rem", marginBottom: "1rem" }}>Profile</h2>
          <div className="cx-checkout-card" style={{ marginBottom: "1.25rem", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, margin: "0 auto .75rem", borderRadius: 12, border: "2px solid var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={32} color="var(--coral)" />
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{user?.fullName || user?.firstName || "Member"}</div>
            <div style={{ color: "var(--coral)", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em", marginTop: ".25rem" }}>CINEX BLACK MEMBER</div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1.5rem" }}>
            {[
              { label: "My Bookings", icon: Ticket, active: true, onClick: onOpenBookings },
              { label: "Account Settings", icon: Settings, to: "/settings" },
              { label: "Payment Methods", icon: CreditCard, to: "/settings" },
              { label: `Wishlist (${wishlistCount})`, icon: Heart, to: "/wishlist" },
            ].map(item => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon size={16} color="var(--coral)" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronRight size={14} color="var(--text3)" />
                </>
              );
              const style = {
                display: "flex", alignItems: "center", gap: ".75rem", padding: ".85rem 1rem",
                border: `1px solid ${item.active ? "var(--coral)" : "var(--border)"}`,
                borderRadius: 8, background: item.active ? "rgba(232,149,140,.06)" : "transparent",
                cursor: "pointer", fontSize: ".88rem", fontWeight: 600, color: "var(--text)", width: "100%", textAlign: "left" as const
              };
              if (item.to) return <Link key={item.label} to={item.to} style={{ ...style, textDecoration: "none" }}>{content}</Link>;
              return <button key={item.label} type="button" style={style} onClick={item.onClick}>{content}</button>;
            })}
          </nav>

          <button
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
