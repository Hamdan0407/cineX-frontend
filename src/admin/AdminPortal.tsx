import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Admin.css";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w185";

interface AdminPortalProps {
  onExit: () => void;
  userEmail?: string;
  userRole?: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onExit,
  userEmail = "admin@cinex.com",
  userRole = "ADMIN",
}) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "movies" | "theatres" | "shows" | "bookings" | "layout">("analytics");

  // Pagination states for tables
  const [moviesPage, setMoviesPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 10 });
  const [moviesSort, setMoviesSort] = useState({ by: "id", dir: "desc" });

  const [theatresPage, setTheatresPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 10 });
  const [theatresSort, setTheatresSort] = useState({ by: "id", dir: "asc" });

  const [showsPage, setShowsPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 10 });
  const [showsSort, setShowsSort] = useState({ by: "showDate", dir: "desc" });

  const [bookingsPage, setBookingsPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 10 });
  const [bookingsSort, setBookingsSort] = useState({ by: "id", dir: "desc" });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Layout builder state
  const [seatTier, setSeatTier] = useState<"SILVER" | "GOLD" | "CLUB" | "PLATINUM">("GOLD");
  const [rowsCount, setRowsCount] = useState(8);
  const [colsCount, setColsCount] = useState(12);
  const [seatPrices] = useState({ SILVER: 150, GOLD: 250, CLUB: 350, PLATINUM: 500 });
  const [blockedSeats, setBlockedSeats] = useState<Set<string>>(new Set(["A1", "A2", "H11", "H12"]));

  const authHeaders = {
    "X-User-Role": userRole,
    "X-User-Email": userEmail,
  };

  const fetchMovies = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/movies/paginated?page=${moviesPage.number}&size=${moviesPage.size}&sortBy=${moviesSort.by}&sortDir=${moviesSort.dir}`, { headers: authHeaders })
      .then((res) => setMoviesPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated movies: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [moviesPage.number, moviesPage.size, moviesSort]);

  const fetchTheatres = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/theatres/paginated?page=${theatresPage.number}&size=${theatresPage.size}&sortBy=${theatresSort.by}&sortDir=${theatresSort.dir}`, { headers: authHeaders })
      .then((res) => setTheatresPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated theatres: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [theatresPage.number, theatresPage.size, theatresSort]);

  const fetchShows = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/shows/paginated?page=${showsPage.number}&size=${showsPage.size}&sortBy=${showsSort.by}&sortDir=${showsSort.dir}`, { headers: authHeaders })
      .then((res) => setShowsPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated shows: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [showsPage.number, showsPage.size, showsSort]);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/bookings/paginated?page=${bookingsPage.number}&size=${bookingsPage.size}&sortBy=${bookingsSort.by}&sortDir=${bookingsSort.dir}`, { headers: authHeaders })
      .then((res) => setBookingsPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated bookings: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [bookingsPage.number, bookingsPage.size, bookingsSort]);

  useEffect(() => {
    setErrorMsg(null);
    if (activeTab === "movies") fetchMovies();
    if (activeTab === "theatres") fetchTheatres();
    if (activeTab === "shows") fetchShows();
    if (activeTab === "bookings") fetchBookings();
  }, [activeTab, fetchMovies, fetchTheatres, fetchShows, fetchBookings]);

  const handleSort = (table: "movies" | "theatres" | "shows" | "bookings", column: string) => {
    if (table === "movies") {
      setMoviesSort((prev) => ({ by: column, dir: prev.by === column && prev.dir === "asc" ? "desc" : "asc" }));
    } else if (table === "theatres") {
      setTheatresSort((prev) => ({ by: column, dir: prev.by === column && prev.dir === "asc" ? "desc" : "asc" }));
    } else if (table === "shows") {
      setShowsSort((prev) => ({ by: column, dir: prev.by === column && prev.dir === "asc" ? "desc" : "asc" }));
    } else if (table === "bookings") {
      setBookingsSort((prev) => ({ by: column, dir: prev.by === column && prev.dir === "asc" ? "desc" : "asc" }));
    }
  };

  const toggleSeatBlock = (seatId: string) => {
    setBlockedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) next.delete(seatId);
      else next.add(seatId);
      return next;
    });
  };

  const deleteMovie = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    axios.delete(`${API_BASE}/api/movies/${id}`, { headers: authHeaders })
      .then(() => fetchMovies())
      .catch(err => toast.error("Delete failed: " + (err.response?.data?.message || err.message)));
  };

  const deleteTheatre = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this theatre?")) return;
    axios.delete(`${API_BASE}/api/theatres/${id}`, { headers: authHeaders })
      .then(() => fetchTheatres())
      .catch(err => toast.error("Delete failed: " + (err.response?.data?.message || err.message)));
  };

  return (
    <div className="admin-portal">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>Cine<span>X</span></span>
          <span className="admin-badge">PRO ADMIN</span>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
            <span>📊</span> Analytics Dashboard
          </button>
          <button className={`admin-nav-item ${activeTab === "movies" ? "active" : ""}`} onClick={() => setActiveTab("movies")}>
            <span>🎬</span> Movies Catalog
          </button>
          <button className={`admin-nav-item ${activeTab === "theatres" ? "active" : ""}`} onClick={() => setActiveTab("theatres")}>
            <span>🏢</span> Theatres & Screens
          </button>
          <button className={`admin-nav-item ${activeTab === "shows" ? "active" : ""}`} onClick={() => setActiveTab("shows")}>
            <span>🎟️</span> Shows Schedule
          </button>
          <button className={`admin-nav-item ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}>
            <span>📋</span> Bookings Ledger
          </button>
          <button className={`admin-nav-item ${activeTab === "layout" ? "active" : ""}`} onClick={() => setActiveTab("layout")}>
            <span>💺</span> Seat Layout Builder
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="btn-exit-admin" onClick={onExit}>
            <span>←</span> Return to Cinema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>
              {activeTab === "analytics" && "Analytics & Revenue Dashboard"}
              {activeTab === "movies" && "Paginated Movies Catalog"}
              {activeTab === "theatres" && "Paginated Theatres Directory"}
              {activeTab === "shows" && "Paginated Shows Schedule"}
              {activeTab === "bookings" && "Paginated Bookings Ledger"}
              {activeTab === "layout" && "Interactive Seat Tier & Grid Builder"}
            </h1>
            <p>Production enterprise portal powered by Spring Data JPA Pagination & Redis Caching</p>
          </div>
          <div className="admin-actions">
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "0.5rem 1rem", borderRadius: "20px" }}>
              👤 Logged in as: <strong style={{ color: "#fff" }}>{userEmail}</strong>
            </span>
          </div>
        </header>

        {errorMsg && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#fff", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div>
            <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
              <div className="kpi-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <span className="kpi-label" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>TOTAL REVENUE</span>
                <div className="kpi-value" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fff" }}>₹14,85,200</div>
                <div className="kpi-subtitle" style={{ color: "#22C55E", fontSize: "0.8rem", marginTop: "0.4rem" }}>↑ +18.4% from last month</div>
              </div>

              <div className="kpi-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <span className="kpi-label" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>ACTIVE BOOKINGS</span>
                <div className="kpi-value" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fff" }}>3,420</div>
                <div className="kpi-subtitle" style={{ color: "#3B82F6", fontSize: "0.8rem", marginTop: "0.4rem" }}>⚡ 98.2% occupancy rate</div>
              </div>

              <div className="kpi-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <span className="kpi-label" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>PARTNER THEATRES</span>
                <div className="kpi-value" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fff" }}>28</div>
                <div className="kpi-subtitle" style={{ color: "#F59E0B", fontSize: "0.8rem", marginTop: "0.4rem" }}>📍 5 Top Metro Cities</div>
              </div>

              <div className="kpi-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <span className="kpi-label" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>MOVIES STREAMING</span>
                <div className="kpi-value" style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "0.5rem", color: "#fff" }}>46</div>
                <div className="kpi-subtitle" style={{ color: "#A855F7", fontSize: "0.8rem", marginTop: "0.4rem" }}>🎬 Hindi, English, Tamil</div>
              </div>
            </div>

            <div className="analytics-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
              <div className="chart-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Top Box Office Revenue by Movie</h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 600 }}>LIVE REDIS METRICS</span>
                </div>
                <div className="bar-chart" style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", height: "220px", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                  {[
                    { name: "Kalki 2898 AD", rev: "85%", val: "₹4.2L" },
                    { name: "Deadpool & Wolverine", rev: "92%", val: "₹5.8L" },
                    { name: "Stree 2", rev: "78%", val: "₹3.9L" },
                    { name: "Pushpa 2", rev: "95%", val: "₹6.1L" },
                    { name: "GOAT", rev: "70%", val: "₹3.2L" },
                  ].map((item, idx) => (
                    <div key={idx} className="bar-column" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", height: "100%", justifyContent: "flex-end" }}>
                      <div
                        className="bar-fill"
                        data-value={item.val}
                        style={{ width: "36px", height: item.rev, background: "linear-gradient(180deg, var(--primary) 0%, rgba(229, 9, 20, 0.3) 100%)", borderRadius: "6px 6px 0 0", transition: "all 0.5s" }}
                      />
                      <span className="bar-label" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
                <div className="chart-header" style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Trending Languages</h3>
                </div>
                <div className="top-movies-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { lang: "Hindi (Bollywood)", count: "1,420 bookings", share: "42%" },
                    { lang: "English (Hollywood)", count: "1,150 bookings", share: "34%" },
                    { lang: "Tamil (Kollywood)", count: "850 bookings", share: "24%" },
                  ].map((l, i) => (
                    <div key={i} className="top-movie-item" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="top-movie-rank" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>#{i + 1}</div>
                      <div className="top-movie-info" style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{l.lang}</h4>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{l.count}</p>
                      </div>
                      <div className="top-movie-stats" style={{ fontWeight: 700 }}>{l.share}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOVIES TAB */}
        {activeTab === "movies" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("movies", "id")} style={{ cursor: "pointer" }}>ID {moviesSort.by === "id" ? (moviesSort.dir === "asc" ? "↑" : "↓") : ""}</th>
                  <th>Poster</th>
                  <th onClick={() => handleSort("movies", "title")} style={{ cursor: "pointer" }}>Title {moviesSort.by === "title" ? (moviesSort.dir === "asc" ? "↑" : "↓") : ""}</th>
                  <th onClick={() => handleSort("movies", "language")} style={{ cursor: "pointer" }}>Language</th>
                  <th>Genre</th>
                  <th onClick={() => handleSort("movies", "duration")} style={{ cursor: "pointer" }}>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Loading paginated movies...</td></tr>
                ) : moviesPage.content.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No movies found in this page.</td></tr>
                ) : (
                  moviesPage.content.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>#{m.id}</td>
                      <td>
                        <img
                          src={m.posterPath ? (m.posterPath.startsWith("http") ? m.posterPath : `${IMG_BASE_URL}${m.posterPath}`) : ""}
                          alt={m.title}
                          style={{ width: "36px", height: "52px", borderRadius: "4px", objectFit: "cover" }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: "#fff" }}>{m.title}</td>
                      <td><span className="status-badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.3)" }}>{m.language}</span></td>
                      <td style={{ color: "var(--text-secondary)" }}>{m.genre}</td>
                      <td>{m.duration} mins</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon delete" title="Delete Movie" onClick={() => deleteMovie(m.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={moviesPage.number}
              totalPages={moviesPage.totalPages}
              totalElements={moviesPage.totalElements}
              pageSize={moviesPage.size}
              onPageChange={(page) => setMoviesPage((prev) => ({ ...prev, number: page }))}
              onPageSizeChange={(size) => setMoviesPage((prev) => ({ ...prev, size, number: 0 }))}
            />
          </div>
        )}

        {/* THEATRES TAB */}
        {activeTab === "theatres" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("theatres", "id")} style={{ cursor: "pointer" }}>ID {theatresSort.by === "id" ? (theatresSort.dir === "asc" ? "↑" : "↓") : ""}</th>
                  <th onClick={() => handleSort("theatres", "name")} style={{ cursor: "pointer" }}>Theatre Name</th>
                  <th onClick={() => handleSort("theatres", "city")} style={{ cursor: "pointer" }}>City</th>
                  <th>Address</th>
                  <th>Amenities</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Loading paginated theatres...</td></tr>
                ) : theatresPage.content.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No theatres found.</td></tr>
                ) : (
                  theatresPage.content.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>#{t.id}</td>
                      <td style={{ fontWeight: 600, color: "#fff" }}>{t.name}</td>
                      <td><span className="status-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "1px solid rgba(245, 158, 11, 0.3)" }}>📍 {t.city}</span></td>
                      <td style={{ color: "var(--text-secondary)" }}>{t.address}</td>
                      <td style={{ fontSize: "0.85rem" }}>{t.amenities}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon delete" title="Delete Theatre" onClick={() => deleteTheatre(t.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={theatresPage.number}
              totalPages={theatresPage.totalPages}
              totalElements={theatresPage.totalElements}
              pageSize={theatresPage.size}
              onPageChange={(page) => setTheatresPage((prev) => ({ ...prev, number: page }))}
              onPageSizeChange={(size) => setTheatresPage((prev) => ({ ...prev, size, number: 0 }))}
            />
          </div>
        )}

        {/* SHOWS TAB */}
        {activeTab === "shows" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("shows", "id")} style={{ cursor: "pointer" }}>ID {showsSort.by === "id" ? (showsSort.dir === "asc" ? "↑" : "↓") : ""}</th>
                  <th>Movie ID</th>
                  <th>Screen ID</th>
                  <th onClick={() => handleSort("shows", "showDate")} style={{ cursor: "pointer" }}>Show Date</th>
                  <th>Show Time</th>
                  <th>Base Price</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Loading paginated shows...</td></tr>
                ) : showsPage.content.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No shows scheduled.</td></tr>
                ) : (
                  showsPage.content.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>#{s.id}</td>
                      <td>Movie #{s.movieId}</td>
                      <td>Screen #{s.screenId}</td>
                      <td style={{ fontWeight: 600, color: "#fff" }}>📅 {s.showDate}</td>
                      <td>🕒 {s.showTime}</td>
                      <td style={{ color: "var(--success)", fontWeight: 700 }}>₹{s.price || 250}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={showsPage.number}
              totalPages={showsPage.totalPages}
              totalElements={showsPage.totalElements}
              pageSize={showsPage.size}
              onPageChange={(page) => setShowsPage((prev) => ({ ...prev, number: page }))}
              onPageSizeChange={(size) => setShowsPage((prev) => ({ ...prev, size, number: 0 }))}
            />
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("bookings", "id")} style={{ cursor: "pointer" }}>ID {bookingsSort.by === "id" ? (bookingsSort.dir === "asc" ? "↑" : "↓") : ""}</th>
                  <th>Movie</th>
                  <th>Theatre</th>
                  <th>Showtime</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Loading paginated bookings...</td></tr>
                ) : bookingsPage.content.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No bookings found.</td></tr>
                ) : (
                  bookingsPage.content.map((b) => (
                    <tr key={b.bookingId || b.id}>
                      <td style={{ fontWeight: 600 }}>#CNX-{b.bookingId || b.id}</td>
                      <td style={{ fontWeight: 600, color: "#fff" }}>{b.movieTitle || b.movie || "Cinema Feature"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{b.theatreName || b.theatre || "CineX IMAX"}</td>
                      <td>{b.showDate || "Today"} • {b.showTime || "18:00"}</td>
                      <td><span style={{ color: "var(--primary)", fontWeight: 600 }}>{Array.isArray(b.seatNumbers) ? b.seatNumbers.join(", ") : b.seatNumbers || "A1"}</span></td>
                      <td style={{ fontWeight: 700, color: "#fff" }}>₹{b.totalAmount || b.total || 0}</td>
                      <td>
                        <span className={`status-badge ${(b.bookingStatus || b.status) === "BOOKED" ? "status-booked" : (b.bookingStatus || b.status) === "FAILED" ? "status-failed" : "status-pending"}`}>
                          {b.bookingStatus || b.status || "BOOKED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={bookingsPage.number}
              totalPages={bookingsPage.totalPages}
              totalElements={bookingsPage.totalElements}
              pageSize={bookingsPage.size}
              onPageChange={(page) => setBookingsPage((prev) => ({ ...prev, number: page }))}
              onPageSizeChange={(size) => setBookingsPage((prev) => ({ ...prev, size, number: 0 }))}
            />
          </div>
        )}

        {/* SEAT LAYOUT BUILDER TAB */}
        {activeTab === "layout" && (
          <div className="layout-builder-card">
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>💺 Dynamic Screen Seat Layout Generator</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Click any seat below to block/unblock it or assign pricing tiers.
            </p>

            <div className="layout-controls">
              <div className="control-group">
                <label>Active Pricing Tier to Paint:</label>
                <div className="category-palettes">
                  <button className={`cat-btn silver ${seatTier === "SILVER" ? "active" : ""}`} onClick={() => setSeatTier("SILVER")}>Silver (₹{seatPrices.SILVER})</button>
                  <button className={`cat-btn gold ${seatTier === "GOLD" ? "active" : ""}`} onClick={() => setSeatTier("GOLD")}>Gold (₹{seatPrices.GOLD})</button>
                  <button className={`cat-btn club ${seatTier === "CLUB" ? "active" : ""}`} onClick={() => setSeatTier("CLUB")}>Club (₹{seatPrices.CLUB})</button>
                  <button className={`cat-btn platinum ${seatTier === "PLATINUM" ? "active" : ""}`} onClick={() => setSeatTier("PLATINUM")}>Platinum (₹{seatPrices.PLATINUM})</button>
                </div>
              </div>

              <div className="control-group">
                <label>Rows ({rowsCount}):</label>
                <input type="number" min={4} max={15} value={rowsCount} onChange={(e) => setRowsCount(Number(e.target.value))} style={{ width: "80px" }} />
              </div>

              <div className="control-group">
                <label>Columns ({colsCount}):</label>
                <input type="number" min={6} max={20} value={colsCount} onChange={(e) => setColsCount(Number(e.target.value))} style={{ width: "80px" }} />
              </div>
            </div>

            <div className="builder-grid-preview">
              <div style={{ width: "80%", height: "8px", background: "linear-gradient(90deg, transparent, var(--primary), transparent)", borderRadius: "4px", marginBottom: "1.5rem", boxShadow: "0 4px 15px rgba(229, 9, 20, 0.4)", textAlign: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", letterSpacing: "3px" }}>SCREEN THIS WAY</span>
              </div>

              {Array.from({ length: rowsCount }, (_, rIdx) => {
                const rowChar = String.fromCharCode(65 + rIdx);
                const tierForRow = rIdx < 2 ? "PLATINUM" : rIdx < 5 ? "CLUB" : rIdx < 7 ? "GOLD" : "SILVER";

                return (
                  <div key={rowChar} className="builder-row">
                    <span className="builder-row-label">{rowChar}</span>
                    {Array.from({ length: colsCount }, (_, cIdx) => {
                      const seatNum = `${rowChar}${cIdx + 1}`;
                      const isBlocked = blockedSeats.has(seatNum);
                      return (
                        <button
                          key={seatNum}
                          className={`builder-seat ${isBlocked ? "BLOCKED" : tierForRow}`}
                          onClick={() => toggleSeatBlock(seatNum)}
                          title={`${seatNum} (${isBlocked ? "BLOCKED" : tierForRow})`}
                        >
                          {cIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
