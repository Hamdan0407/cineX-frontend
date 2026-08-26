import React from "react";
import { Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { Ticket, Heart, Settings, LogOut, ArrowLeft, Shield, Award, Calendar } from "lucide-react";
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
    <div style={{ minHeight: "85vh", padding: "3rem 4rem", color: "#F5F7FA" }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#B8C0CC",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: "rgba(255,255,255,0.05)",
            padding: "0.6rem 1.2rem",
            borderRadius: "50px",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C0CC")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movies & Shows
        </Link>
      </div>

      {/* Profile Header Card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(18, 22, 31, 0.95) 0%, rgba(11, 13, 18, 0.95) 100%)",
        border: "1px solid #2A3242",
        borderRadius: "24px",
        padding: "3rem",
        marginBottom: "3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "2rem",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                style={{ width: "100px", height: "100px", borderRadius: "50%", border: "3px solid #E50914", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#E50914", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 800, color: "#fff", border: "3px solid #FFD166" }}>
                {user?.firstName ? user.firstName[0] : "V"}
              </div>
            )}
            <span style={{ position: "absolute", bottom: "0", right: "0", background: "#FFD166", color: "#0B0D12", padding: "0.2rem 0.6rem", borderRadius: "50px", fontSize: "0.7rem", fontWeight: 900, border: "2px solid #0B0D12" }}>
              VIP
            </span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff" }}>
                {user?.fullName || user?.firstName || "VIP Member"}
              </h1>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10B981", padding: "0.2rem 0.7rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                Active Account
              </span>
            </div>
            <p style={{ color: "#B8C0CC", fontSize: "1rem", marginBottom: "1rem" }}>
              {user?.primaryEmailAddress?.emailAddress || "member@cinex.premier"}
            </p>
            <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "#64748B" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Shield className="w-4 h-4 text-[#FFD166]" /> Verified CineX Identity</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Award className="w-4 h-4 text-[#E50914]" /> Platinum Tier Member</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Calendar className="w-4 h-4" /> Joined 2026</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => {
              toast.info("Signing out...", { description: "You have been logged out of your CineX account." });
              signOut();
            }}
            style={{
              background: "rgba(255, 61, 90, 0.15)",
              color: "#FF3D5A",
              border: "1px solid rgba(255, 61, 90, 0.4)",
              padding: "0.85rem 1.6rem",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 61, 90, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 61, 90, 0.15)")}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Quick Access Dashboard Grid */}
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>
        Account Management & Quick Links
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {/* Card 1: My Bookings */}
        <div
          onClick={onOpenBookings}
          style={{
            background: "#12161F",
            border: "1px solid #2A3242",
            borderRadius: "16px",
            padding: "2rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E50914"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3242"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(229, 9, 20, 0.15)", padding: "1rem", borderRadius: "14px", color: "#E50914" }}>
              <Ticket className="w-7 h-7" />
            </div>
            <span style={{ background: "#E50914", color: "#fff", padding: "0.25rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 800 }}>
              {bookingsCount} Tickets
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
            My Ticket Vault
          </h3>
          <p style={{ color: "#B8C0CC", fontSize: "0.9rem", lineHeight: 1.5 }}>
            View your active QR show tickets, past cinema history, seat numbers, and downloadable invoices.
          </p>
        </div>

        {/* Card 2: Wishlist */}
        <Link
          to="/wishlist"
          style={{
            background: "#12161F",
            border: "1px solid #2A3242",
            borderRadius: "16px",
            padding: "2rem",
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "block"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF3D5A"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3242"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(255, 61, 90, 0.15)", padding: "1rem", borderRadius: "14px", color: "#FF3D5A" }}>
              <Heart className="w-7 h-7 fill-[#FF3D5A]" />
            </div>
            <span style={{ background: "rgba(255, 61, 90, 0.2)", color: "#FF3D5A", padding: "0.25rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 800 }}>
              {wishlistCount} Saved
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
            Saved Movie Wishlist
          </h3>
          <p style={{ color: "#B8C0CC", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Access titles you marked for later. Instant 1-click showtime booking from your curated collection.
          </p>
        </Link>

        {/* Card 3: Settings */}
        <Link
          to="/settings"
          style={{
            background: "#12161F",
            border: "1px solid #2A3242",
            borderRadius: "16px",
            padding: "2rem",
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "block"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FFD166"; e.currentTarget.style.transform = "translateY(-4px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2A3242"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(255, 209, 102, 0.15)", padding: "1rem", borderRadius: "14px", color: "#FFD166" }}>
              <Settings className="w-7 h-7" />
            </div>
            <span style={{ background: "rgba(255, 209, 102, 0.15)", color: "#FFD166", padding: "0.25rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 800 }}>
              Preferences
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
            Account Settings
          </h3>
          <p style={{ color: "#B8C0CC", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Manage notification preferences, default cinema city, payment methods, and privacy security settings.
          </p>
        </Link>
      </div>
    </div>
  );
};
