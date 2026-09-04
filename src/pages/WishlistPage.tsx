import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, ArrowLeft, Star, Film, Ticket } from "lucide-react";
import type { WishlistMovie } from "../utils/useWishlist";

const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface WishlistPageProps {
  wishlist: WishlistMovie[];
  onRemove: (id: number, title?: string) => void;
  onBookMovie: (movie: any) => void;
}

const getLangLabel = (lang?: string) => {
  if (!lang) return "HINDI";
  const map: Record<string, string> = { hi: "HINDI", en: "ENGLISH", ta: "TAMIL", te: "TELUGU", ml: "MALAYALAM" };
  return map[lang] || lang.toUpperCase();
};

export const WishlistPage: React.FC<WishlistPageProps> = ({
  wishlist,
  onRemove,
  onBookMovie
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "85vh", padding: "3rem 4rem", color: "#F5F7FA" }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: "2rem" }}>
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

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255, 61, 90, 0.15) 0%, rgba(11, 13, 18, 0.9) 100%)",
        border: "1px solid rgba(255, 61, 90, 0.3)",
        borderRadius: "24px",
        padding: "3rem",
        marginBottom: "3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <span style={{
              background: "rgba(255, 61, 90, 0.2)",
              color: "#FF3D5A",
              padding: "0.3rem 0.8rem",
              borderRadius: "50px",
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}>
              <Heart className="w-3.5 h-3.5 fill-[#FF3D5A]" /> Ticket Vault Wishlist
            </span>
          </div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 900, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            My Saved Movies
          </h1>
          <p style={{ color: "#B8C0CC", fontSize: "1.1rem", maxWidth: "600px" }}>
            Keep track of movies you want to watch in cinemas. Book directly when showtimes open or remove titles anytime.
          </p>
        </div>

        <div style={{
          background: "rgba(255, 61, 90, 0.1)",
          border: "1px solid rgba(255, 61, 90, 0.3)",
          padding: "1.5rem 2.5rem",
          borderRadius: "20px",
          textAlign: "center"
        }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#FF3D5A", display: "block", lineHeight: 1 }}>
            {wishlist.length}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#B8C0CC", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginTop: "0.4rem", display: "block" }}>
            Saved Titles
          </span>
        </div>
      </div>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div style={{
          background: "rgba(18, 22, 31, 0.6)",
          border: "1px dashed #2A3242",
          borderRadius: "24px",
          padding: "5rem 2rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ background: "rgba(255, 61, 90, 0.1)", padding: "1.5rem", borderRadius: "50%", marginBottom: "1.5rem", color: "#FF3D5A" }}>
            <Heart className="w-12 h-12" />
          </div>
          <h3 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.8rem" }}>
            Your Wishlist is Empty
          </h3>
          <p style={{ color: "#B8C0CC", fontSize: "1rem", maxWidth: "450px", marginBottom: "2rem", lineHeight: 1.6 }}>
            Browse premier now-showing and upcoming movies on the homepage and click the ❤️ icon to save your favorites here!
          </p>
          <Link
            to="/"
            style={{
              background: "#E50914",
              color: "#fff",
              textDecoration: "none",
              padding: "0.9rem 2.2rem",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              boxShadow: "0 10px 20px -5px rgba(229, 9, 20, 0.5)"
            }}
          >
            <Film className="w-4 h-4" /> Explore Movies Now
          </Link>
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "2rem"
          }}
        >
          <AnimatePresence>
            {wishlist.map((movie) => (
              <motion.div
                layout
                key={movie.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.25 }}
                className="movie-card shad-card"
                style={{
                  background: "#12161F",
                  border: "1px solid #2A3242",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div className="poster-wrapper" style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
                    <img
                      src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : "https://via.placeholder.com/300x450?text=No+Poster"}
                      alt={movie.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(movie.id, movie.title);
                      }}
                      title="Remove from wishlist"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(11, 13, 18, 0.85)",
                        color: "#FF3D5A",
                        border: "1px solid rgba(255, 61, 90, 0.4)",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", display: "flex", gap: "0.4rem" }}>
                      <span style={{ background: "rgba(11, 13, 18, 0.85)", color: "#FFD166", border: "1px solid #FFD166", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Star className="w-3 h-3 fill-[#FFD166]" /> {(movie.vote_average || 8.0).toFixed(1)}
                      </span>
                      <span style={{ background: "rgba(229, 9, 20, 0.85)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {getLangLabel(movie.original_language)}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "1.2rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={movie.title}>
                      {movie.title}
                    </h3>
                    <p style={{ color: "#B8C0CC", fontSize: "0.8rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {movie.overview || "Premier cinema release available for instant VIP showtime booking."}
                    </p>
                  </div>
                </div>

                <div style={{ padding: "0 1.2rem 1.2rem" }}>
                  <button
                    onClick={() => onBookMovie(movie)}
                    style={{
                      width: "100%",
                      background: "#E50914",
                      color: "#fff",
                      border: "none",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ff0a16")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#E50914")}
                  >
                    <Ticket className="w-4 h-4" /> Book Tickets Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
