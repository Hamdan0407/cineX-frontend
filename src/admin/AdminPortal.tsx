import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api/apiClient";
import "./Admin.css";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner";

interface AdminPortalProps {
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
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

  const fetchMovies = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/movies/paginated?page=${moviesPage.number}&size=${moviesPage.size}&sortBy=${moviesSort.by}&sortDir=${moviesSort.dir}`)
      .then((res) => setMoviesPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated movies: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [moviesPage.number, moviesPage.size, moviesSort]);

  const fetchTheatres = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/theatres/paginated?page=${theatresPage.number}&size=${theatresPage.size}&sortBy=${theatresSort.by}&sortDir=${theatresSort.dir}`)
      .then((res) => setTheatresPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated theatres: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [theatresPage.number, theatresPage.size, theatresSort]);

  const fetchShows = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/shows/paginated?page=${showsPage.number}&size=${showsPage.size}&sortBy=${showsSort.by}&sortDir=${showsSort.dir}`)
      .then((res) => setShowsPage(res.data))
      .catch((err) => setErrorMsg("Failed to load paginated shows: " + (err.response?.data?.message || err.message)))
      .finally(() => setLoading(false));
  }, [showsPage.number, showsPage.size, showsSort]);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/bookings/paginated?page=${bookingsPage.number}&size=${bookingsPage.size}&sortBy=${bookingsSort.by}&sortDir=${bookingsSort.dir}`)
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
    api.delete(`/api/movies/${id}`)
      .then(() => fetchMovies())
      .catch(err => toast.error("Delete failed: " + (err.response?.data?.message || err.message)));
  };

  const deleteTheatre = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this theatre?")) return;
    api.delete(`/api/theatres/${id}`)
      .then(() => fetchTheatres())
      .catch(err => toast.error("Delete failed: " + (err.response?.data?.message || err.message)));
  };

  const renderSortableHeader = (table: "movies" | "theatres" | "shows" | "bookings", label: string, column: string) => (
    <th onClick={() => handleSort(table, column)} style={{ cursor: "pointer" }}>{label}</th>
  );

  return (
    <div className="admin-portal">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>CINEX ADMIN</span>
          <span className="admin-badge">PORTAL</span>
        </div>
        <nav className="admin-nav">
          {(["analytics", "movies", "theatres", "shows", "bookings", "layout"] as const).map((tab) => (
            <button key={tab} className={`admin-nav-item ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn-exit-admin" onClick={onExit}>← Exit Admin</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Operational Dashboard</h1>
            <p>Overview of current cinema performance and active screenings.</p>
          </div>
        </header>

        {errorMsg && <div style={{ color: "#ff6b6b", marginBottom: "1rem" }}>{errorMsg}</div>}
        {loading && <div style={{ color: "#B8C0CC", marginBottom: "1rem" }}>Loading...</div>}

        {activeTab === "analytics" && (
          <div className="admin-table-container" style={{ padding: "2rem" }}>
            <h2>Platform Analytics</h2>
            <p style={{ color: "#B8C0CC" }}>Use the tabs to manage catalog data and bookings.</p>
          </div>
        )}

        {activeTab === "movies" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {renderSortableHeader("movies", "ID", "id")}
                  {renderSortableHeader("movies", "Title", "title")}
                  <th>Genre</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {moviesPage.content.map((movie: any) => (
                  <tr key={movie.id}>
                    <td>{movie.id}</td>
                    <td>{movie.title}</td>
                    <td>{movie.genre || "—"}</td>
                    <td><button onClick={() => deleteMovie(movie.id)}>Delete</button></td>
                  </tr>
                ))}
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

        {activeTab === "theatres" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {renderSortableHeader("theatres", "ID", "id")}
                  {renderSortableHeader("theatres", "Name", "name")}
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {theatresPage.content.map((theatre: any) => (
                  <tr key={theatre.id}>
                    <td>{theatre.id}</td>
                    <td>{theatre.name}</td>
                    <td>{theatre.city || "—"}</td>
                    <td><button onClick={() => deleteTheatre(theatre.id)}>Delete</button></td>
                  </tr>
                ))}
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

        {activeTab === "shows" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {renderSortableHeader("shows", "ID", "id")}
                  <th>Movie ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {showsPage.content.map((show: any) => (
                  <tr key={show.id}>
                    <td>{show.id}</td>
                    <td>{show.movieId}</td>
                    <td>{show.showDate}</td>
                    <td>{show.showTime}</td>
                    <td>{show.price}</td>
                  </tr>
                ))}
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

        {activeTab === "bookings" && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {renderSortableHeader("bookings", "ID", "id")}
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookingsPage.content.map((booking: any) => (
                  <tr key={booking.bookingId || booking.id}>
                    <td>{booking.bookingId || booking.id}</td>
                    <td>{booking.bookingStatus || booking.status}</td>
                    <td>{booking.paymentStatus}</td>
                    <td>{booking.amount || booking.totalAmount}</td>
                  </tr>
                ))}
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

        {activeTab === "layout" && (
          <div className="admin-table-container" style={{ padding: "1.5rem" }}>
            <h2>Seat Layout Builder</h2>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <label>Tier: <select value={seatTier} onChange={(e) => setSeatTier(e.target.value as typeof seatTier)}>{Object.keys(seatPrices).map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select></label>
              <label>Rows: <input type="number" min={1} max={20} value={rowsCount} onChange={(e) => setRowsCount(Number(e.target.value))} /></label>
              <label>Cols: <input type="number" min={1} max={20} value={colsCount} onChange={(e) => setColsCount(Number(e.target.value))} /></label>
            </div>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {Array.from({ length: rowsCount }, (_, row) => (
                <div key={row} style={{ display: "flex", gap: "0.35rem" }}>
                  {Array.from({ length: colsCount }, (_, col) => {
                    const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
                    const blocked = blockedSeats.has(seatId);
                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeatBlock(seatId)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          border: "1px solid #2A3242",
                          background: blocked ? "#E50914" : seatTier === "GOLD" ? "#f59e0b" : "#334155",
                          color: "#fff",
                          fontSize: "0.65rem",
                        }}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
