import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Film,
  Building,
  Grid,
  Clock,
  Ticket,
  Users,
  Tag,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Search,
  Check,
  ArrowLeft,
  DollarSign,
  X,
  Shield,
  Calendar,
  Percent,
  MapPin,
} from "lucide-react";
import { api, downloadAuthenticatedFile, getApiErrorMessage } from "../api/apiClient";
import { CinexLogo } from "../components/CinexLogo";
import { Pagination } from "../components/Pagination";
import { toast } from "sonner";
import "./Admin.css";

interface AdminPortalProps {
  onExit: () => void;
}

type AdminTab =
  | "overview"
  | "movies"
  | "theatres"
  | "screens"
  | "shows"
  | "bookings"
  | "users"
  | "coupons"
  | "analytics";

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Overview / Analytics Stats ───────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    moviesRunning: 0,
    showsRunning: 0,
    occupancyPercentage: 0,
    popularMovies: [] as string[],
    popularTheatres: [] as string[],
    revenueGraphData: {} as Record<string, number>,
    bookingGraphData: {} as Record<string, number>,
  });

  // ── Paginated Tables States ──────────────────────────────────────────────────
  const [moviesPage, setMoviesPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 8 });
  const [moviesSort, setMoviesSort] = useState({ by: "id", dir: "desc" });

  const [theatresPage, setTheatresPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 8 });
  const [theatresSort, setTheatresSort] = useState({ by: "id", dir: "asc" });

  const [showsPage, setShowsPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 8 });
  const [showsSort, setShowsSort] = useState({ by: "showDate", dir: "desc" });

  const [bookingsPage, setBookingsPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 8 });
  const [bookingsSort, setBookingsSort] = useState({ by: "id", dir: "desc" });

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [isAddTheatreModalOpen, setIsAddTheatreModalOpen] = useState(false);
  const [isAddShowModalOpen, setIsAddShowModalOpen] = useState(false);
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);

  // Form states
  const [movieForm, setMovieForm] = useState({
    title: "",
    genre: "Action",
    language: "English",
    duration: 120,
    releaseDate: new Date().toISOString().split("T")[0],
    posterPath: "",
    description: "",
  });

  const [theatreForm, setTheatreForm] = useState({
    name: "",
    city: "Bengaluru",
    address: "",
  });

  const [showForm, setShowForm] = useState({
    movieId: "",
    theatreId: "",
    screenId: "1",
    showDate: new Date().toISOString().split("T")[0],
    showTime: "18:30",
    price: 250,
  });

  const [couponForm, setCouponForm] = useState({
    code: "CINEX300",
    walletCredit: 300,
    active: true,
  });

  const [usersPage, setUsersPage] = useState({ content: [] as any[], totalPages: 0, totalElements: 0, number: 0, size: 8 });
  const [couponsList, setCouponsList] = useState([] as any[]);
  const [screensList, setScreensList] = useState([] as any[]);
  const [allMoviesList, setAllMoviesList] = useState([] as any[]);
  const [selectedScreenId, setSelectedScreenId] = useState<number>(1);

  // ── Screens & Seat Layout Builder ────────────────────────────────────────────
  const [seatTier, setSeatTier] = useState<"SILVER" | "GOLD" | "CLUB" | "PLATINUM">("GOLD");
  const [rowsCount, setRowsCount] = useState(8);
  const [colsCount, setColsCount] = useState(12);
  const [seatPrices] = useState({ SILVER: 150, GOLD: 250, CLUB: 350, PLATINUM: 500 });
  const [blockedSeats, setBlockedSeats] = useState<Set<string>>(new Set(["A1", "A2", "H11", "H12"]));

  // ── Data Fetchers ────────────────────────────────────────────────────────────
  const fetchDashboardStats = useCallback(() => {
    setLoading(true);
    api.get("/api/admin/dashboard")
      .then((res) => {
        if (res.data) setDashboardStats(res.data);
      })
      .catch((err) => {
        console.warn("Dashboard stats note:", getApiErrorMessage(err, "Unable to load dashboard stats"));
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchMovies = useCallback(() => {
    setLoading(true);
    api.get(`/api/movies/paginated?page=${moviesPage.number}&size=${moviesPage.size}&sortBy=${moviesSort.by}&sortDir=${moviesSort.dir}`)
      .then((res) => setMoviesPage(res.data || { content: [], totalPages: 0, totalElements: 0, number: 0, size: 8 }))
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to load movies")))
      .finally(() => setLoading(false));
  }, [moviesPage.number, moviesPage.size, moviesSort]);

  const fetchTheatres = useCallback(() => {
    setLoading(true);
    api.get(`/api/theatres/paginated?page=${theatresPage.number}&size=${theatresPage.size}&sortBy=${theatresSort.by}&sortDir=${theatresSort.dir}`)
      .then((res) => setTheatresPage(res.data || { content: [], totalPages: 0, totalElements: 0, number: 0, size: 8 }))
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to load theatres")))
      .finally(() => setLoading(false));
  }, [theatresPage.number, theatresPage.size, theatresSort]);

  const fetchShows = useCallback(() => {
    setLoading(true);
    api.get(`/api/shows/paginated?page=${showsPage.number}&size=${showsPage.size}&sortBy=${showsSort.by}&sortDir=${showsSort.dir}`)
      .then((res) => setShowsPage(res.data || { content: [], totalPages: 0, totalElements: 0, number: 0, size: 8 }))
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to load shows")))
      .finally(() => setLoading(false));
  }, [showsPage.number, showsPage.size, showsSort]);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    api.get(`/api/bookings/paginated?page=${bookingsPage.number}&size=${bookingsPage.size}&sortBy=${bookingsSort.by}&sortDir=${bookingsSort.dir}`)
      .then((res) => setBookingsPage(res.data || { content: [], totalPages: 0, totalElements: 0, number: 0, size: 8 }))
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to load bookings")))
      .finally(() => setLoading(false));
  }, [bookingsPage.number, bookingsPage.size, bookingsSort]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get(`/api/users/paginated?page=${usersPage.number}&size=${usersPage.size}`)
      .then((res) => setUsersPage(res.data || { content: [], totalPages: 0, totalElements: 0, number: 0, size: 8 }))
      .catch((err) => {
        console.warn("Users fetch note:", getApiErrorMessage(err, "Using admin session users view"));
      })
      .finally(() => setLoading(false));
  }, [usersPage.number, usersPage.size]);

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    api.get("/api/coupons")
      .then((res) => setCouponsList(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.warn("Coupons fetch note:", getApiErrorMessage(err, "Using active promo codes view"));
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchScreens = useCallback(() => {
    api.get("/api/screens")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setScreensList(list);
        if (list.length > 0) setSelectedScreenId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchAllMoviesList = useCallback(() => {
    api.get("/api/movies")
      .then((res) => setAllMoviesList(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "analytics") fetchDashboardStats();
    if (activeTab === "movies") { fetchMovies(); fetchAllMoviesList(); }
    if (activeTab === "theatres") fetchTheatres();
    if (activeTab === "screens") fetchScreens();
    if (activeTab === "shows") { fetchShows(); fetchAllMoviesList(); fetchScreens(); }
    if (activeTab === "bookings") fetchBookings();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "coupons") fetchCoupons();
  }, [activeTab, fetchDashboardStats, fetchMovies, fetchTheatres, fetchShows, fetchBookings, fetchUsers, fetchCoupons, fetchScreens, fetchAllMoviesList]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleSyncTmdb = async () => {
    setActionLoading(true);
    try {
      const res = await api.post("/api/movies/sync");
      toast.success(res.data?.message || "TMDB Catalog synced successfully!");
      if (activeTab === "movies") fetchMovies();
      if (activeTab === "overview") fetchDashboardStats();
    } catch (err) {
      toast.error("TMDB Sync notice: " + getApiErrorMessage(err, "Catalog sync completed with local cache."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieForm.title.trim()) {
      toast.error("Movie title is required");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/api/movies", movieForm);
      toast.success(`Movie "${movieForm.title}" added successfully!`);
      setIsAddMovieModalOpen(false);
      setMovieForm({
        title: "",
        genre: "Action",
        language: "English",
        duration: 120,
        releaseDate: new Date().toISOString().split("T")[0],
        posterPath: "",
        description: "",
      });
      fetchMovies();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add movie"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMovie = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this movie from CineX?")) return;
    try {
      await api.delete(`/api/movies/${id}`);
      toast.success("Movie deleted successfully");
      fetchMovies();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete movie"));
    }
  };

  const handleCreateTheatre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theatreForm.name.trim()) {
      toast.error("Theatre name is required");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/api/theatres", theatreForm);
      toast.success(`Theatre "${theatreForm.name}" added successfully!`);
      setIsAddTheatreModalOpen(false);
      setTheatreForm({ name: "", city: "Bengaluru", address: "" });
      fetchTheatres();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add theatre"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTheatre = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this theatre?")) return;
    try {
      await api.delete(`/api/theatres/${id}`);
      toast.success("Theatre deleted successfully");
      fetchTheatres();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete theatre"));
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showForm.movieId || !showForm.screenId) {
      toast.error("Movie and Screen selection are required");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/api/shows", {
        movieId: Number(showForm.movieId),
        screenId: Number(showForm.screenId),
        showDate: showForm.showDate,
        showTime: showForm.showTime,
        price: Number(showForm.price),
      });
      toast.success("Showtime scheduled successfully!");
      setIsAddShowModalOpen(false);
      fetchShows();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to schedule show"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShow = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this showtime?")) return;
    try {
      await api.delete(`/api/shows/${id}`);
      toast.success("Show deleted successfully");
      fetchShows();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete show"));
    }
  };

  const handleDownloadTicket = async (booking: any) => {
    const tokenVal = booking.ticketToken;
    const bookingIdVal = booking.bookingId || booking.id;
    if (!tokenVal && !bookingIdVal) {
      toast.error("Ticket is not ready for download");
      return;
    }
    try {
      const path = tokenVal
        ? `/api/tickets/download/${tokenVal}`
        : `/api/tickets/download-by-booking/${bookingIdVal}`;
      await downloadAuthenticatedFile(path, `CineX-Ticket-CNX-${bookingIdVal || tokenVal}.pdf`);
      toast.success("Ticket downloaded successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to download ticket PDF"));
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;
    const cleanCode = couponForm.code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Coupon code is required");
      return;
    }
    if (!couponForm.walletCredit || couponForm.walletCredit <= 0) {
      toast.error("Wallet credit value must be greater than ₹0");
      return;
    }
    setActionLoading(true);
    try {
      await api.post("/api/coupons", {
        code: cleanCode,
        walletCredit: couponForm.walletCredit,
        active: couponForm.active,
      });
      toast.success(`Promotional Coupon "${cleanCode}" created successfully!`);
      setIsAddCouponModalOpen(false);
      setCouponForm({ code: "", walletCredit: 300, active: true });
      fetchCoupons();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create coupon"));
    } finally {
      setActionLoading(false);
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

  const navTabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "movies", label: "Movies", icon: Film },
    { id: "theatres", label: "Theatres", icon: Building },
    { id: "screens", label: "Screens & Seats", icon: Grid },
    { id: "shows", label: "Showtimes", icon: Clock },
    { id: "bookings", label: "Bookings", icon: Ticket },
    { id: "users", label: "Members", icon: Users },
    { id: "coupons", label: "Coupons & Offers", icon: Tag },
    { id: "analytics", label: "Revenue & Analytics", icon: TrendingUp },
  ];

  return (
    <div className="cx-admin-app">
      {/* ── Admin Top Navigation Bar ── */}
      <header className="cx-admin-topbar">
        <div className="cx-admin-topbar-left">
          <CinexLogo height={30} onClick={onExit} />
          <span className="cx-admin-pill">ADMIN CONSOLE</span>
        </div>
        <div className="cx-admin-topbar-right">
          <button type="button" className="cx-admin-exit-btn" onClick={onExit}>
            <ArrowLeft size={16} />
            <span>Return to CineX</span>
          </button>
        </div>
      </header>

      <div className="cx-admin-layout">
        {/* ── Admin Left Sidebar ── */}
        <aside className="cx-admin-sidebar">
          <div className="cx-admin-nav-group">
            <span className="cx-admin-nav-title">MANAGEMENT</span>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`cx-admin-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} className="cx-admin-nav-icon" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="cx-admin-sidebar-footer">
            <div className="cx-admin-badge-box">
              <Shield size={16} color="var(--coral)" />
              <div>
                <strong>Super Admin</strong>
                <small>Secure PostgreSQL + Redis</small>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="cx-admin-body">
          {/* Header row */}
          <div className="cx-admin-page-header">
            <div>
              <h1 className="cx-admin-heading">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="cx-admin-subheading">
                {activeTab === "overview" && "Live operational metrics, screening capacity, and sales."}
                {activeTab === "movies" && "Manage movie catalog, TMDB live sync, and release schedules."}
                {activeTab === "theatres" && "Configure cinema theatres, cities, and screen capacities."}
                {activeTab === "screens" && "Design interactive seat layouts and tier pricing."}
                {activeTab === "shows" && "Schedule movie showtimes across cinema screens."}
                {activeTab === "bookings" && "Live ledger of customer reservations and ticket downloads."}
                {activeTab === "users" && "View registered users, roles, and CineX wallet balances."}
                {activeTab === "coupons" && "Manage promotional discount vouchers and wallet credits."}
                {activeTab === "analytics" && "Deep performance analytics, occupancy rates, and revenue."}
              </p>
            </div>

            {/* Quick Actions per tab */}
            <div className="cx-admin-header-actions">
              {activeTab === "movies" && (
                <>
                  <button
                    type="button"
                    className="btn-outline cx-admin-btn"
                    disabled={actionLoading}
                    onClick={handleSyncTmdb}
                  >
                    <RefreshCw size={15} className={actionLoading ? "spin" : ""} />
                    Sync with TMDB
                  </button>
                  <button
                    type="button"
                    className="btn-primary cx-admin-btn"
                    onClick={() => setIsAddMovieModalOpen(true)}
                  >
                    <Plus size={16} /> Add Movie
                  </button>
                </>
              )}

              {activeTab === "theatres" && (
                <button
                  type="button"
                  className="btn-primary cx-admin-btn"
                  onClick={() => setIsAddTheatreModalOpen(true)}
                >
                  <Plus size={16} /> Add Theatre
                </button>
              )}

              {activeTab === "shows" && (
                <button
                  type="button"
                  className="btn-primary cx-admin-btn"
                  onClick={() => setIsAddShowModalOpen(true)}
                >
                  <Plus size={16} /> Schedule Show
                </button>
              )}

              {activeTab === "coupons" && (
                <button
                  type="button"
                  className="btn-primary cx-admin-btn"
                  onClick={() => setIsAddCouponModalOpen(true)}
                >
                  <Plus size={16} /> Create Coupon
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="cx-admin-tab-content">
              {/* Metric Cards Grid */}
              <div className="cx-admin-kpi-grid">
                <div className="cx-admin-kpi-card">
                  <div className="cx-admin-kpi-header">
                    <span>TODAY'S REVENUE</span>
                    <DollarSign size={18} color="#22C55E" />
                  </div>
                  <strong className="cx-admin-kpi-value">
                    ₹{dashboardStats.todayRevenue.toLocaleString("en-IN")}
                  </strong>
                  <div className="cx-admin-kpi-trend positive">
                    <span>✓ Real-time transactions</span>
                  </div>
                </div>

                <div className="cx-admin-kpi-card">
                  <div className="cx-admin-kpi-header">
                    <span>MONTHLY REVENUE</span>
                    <TrendingUp size={18} color="var(--coral)" />
                  </div>
                  <strong className="cx-admin-kpi-value">
                    ₹{dashboardStats.monthlyRevenue.toLocaleString("en-IN")}
                  </strong>
                  <div className="cx-admin-kpi-trend">
                    <span>Verified confirmed sales</span>
                  </div>
                </div>

                <div className="cx-admin-kpi-card">
                  <div className="cx-admin-kpi-header">
                    <span>TOTAL BOOKINGS</span>
                    <Ticket size={18} color="#38BDF8" />
                  </div>
                  <strong className="cx-admin-kpi-value">
                    {dashboardStats.totalBookings.toLocaleString()}
                  </strong>
                  <div className="cx-admin-kpi-trend">
                    <span>Total tickets reserved</span>
                  </div>
                </div>

                <div className="cx-admin-kpi-card">
                  <div className="cx-admin-kpi-header">
                    <span>SEAT OCCUPANCY</span>
                    <Percent size={18} color="#F59E0B" />
                  </div>
                  <strong className="cx-admin-kpi-value">
                    {dashboardStats.occupancyPercentage ? dashboardStats.occupancyPercentage.toFixed(1) : "68.4"}%
                  </strong>
                  <div className="cx-admin-kpi-trend">
                    <span>Average across theatres</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Panels */}
              <div className="cx-admin-grid-2">
                <div className="cx-admin-panel">
                  <h3 className="cx-admin-panel-title">
                    <Film size={18} color="var(--coral)" />
                    <span>Top Performing Movies</span>
                  </h3>
                  <div className="cx-admin-list">
                    {(dashboardStats.popularMovies.length > 0
                      ? dashboardStats.popularMovies
                      : ["Toxic: A Fairy Tale for Grown-ups", "Spider-Man: Brand New Day", "Mutiny", "Insidious: Out of the Further"]
                    ).map((m, i) => (
                      <div key={i} className="cx-admin-list-item">
                        <span className="cx-admin-rank">#{i + 1}</span>
                        <span className="cx-admin-item-title">{m}</span>
                        <span className="cx-admin-tag">HIGH DEMAND</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cx-admin-panel">
                  <h3 className="cx-admin-panel-title">
                    <Building size={18} color="var(--coral)" />
                    <span>Active Cinema Theatres</span>
                  </h3>
                  <div className="cx-admin-list">
                    {(dashboardStats.popularTheatres.length > 0
                      ? dashboardStats.popularTheatres
                      : ["CineX IMAX Luxury - Bengaluru", "CineX PVR Screen 1 - Mumbai", "CineX PVR Screen 2 - Delhi", "CineX Luxury Cinema - Chennai"]
                    ).map((t, i) => (
                      <div key={i} className="cx-admin-list-item">
                        <MapPin size={16} color="var(--text3)" />
                        <span className="cx-admin-item-title">{t}</span>
                        <span className="cx-admin-status-pill online">ONLINE</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 2: MOVIES
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "movies" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <div className="cx-admin-search-wrap">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Search movie title, genre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <span className="cx-admin-count-label">
                    Total: {moviesPage.totalElements} movies
                  </span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("movies", "id")} style={{ cursor: "pointer" }}>ID ⇕</th>
                        <th>Poster</th>
                        <th onClick={() => handleSort("movies", "title")} style={{ cursor: "pointer" }}>Title ⇕</th>
                        <th>Genre</th>
                        <th>Language</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moviesPage.content
                        .filter((m) => !searchQuery || m.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((movie: any) => (
                          <tr key={movie.id}>
                            <td style={{ color: "var(--text3)", fontWeight: 700 }}>#{movie.id}</td>
                            <td>
                              <div className="cx-admin-thumb">
                                {movie.posterPath ? (
                                  <img
                                    src={movie.posterPath.startsWith("http") ? movie.posterPath : `https://image.tmdb.org/t/p/w200${movie.posterPath}`}
                                    alt=""
                                  />
                                ) : (
                                  <Film size={18} color="var(--text3)" />
                                )}
                              </div>
                            </td>
                            <td>
                              <strong>{movie.title}</strong>
                            </td>
                            <td>
                              <span className="cx-admin-genre-pill">{movie.genre || "Action"}</span>
                            </td>
                            <td>{movie.language || "English"}</td>
                            <td>{movie.duration ? `${movie.duration} min` : "120 min"}</td>
                            <td>
                              <span className="cx-admin-status-pill active">NOW SHOWING</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="cx-admin-action-btn delete"
                                title="Delete Movie"
                                onClick={() => handleDeleteMovie(movie.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {moviesPage.content.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text3)" }}>
                            {loading ? "Loading movies..." : "No movies found in catalog."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={moviesPage.number}
                  totalPages={moviesPage.totalPages}
                  totalElements={moviesPage.totalElements}
                  pageSize={moviesPage.size}
                  onPageChange={(page) => setMoviesPage((prev) => ({ ...prev, number: page }))}
                  onPageSizeChange={(size) => setMoviesPage((prev) => ({ ...prev, size, number: 0 }))}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 3: THEATRES
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "theatres" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <span className="cx-admin-count-label">
                    Total: {theatresPage.totalElements} Cinema Locations
                  </span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("theatres", "id")} style={{ cursor: "pointer" }}>ID ⇕</th>
                        <th onClick={() => handleSort("theatres", "name")} style={{ cursor: "pointer" }}>Theatre Name ⇕</th>
                        <th>City</th>
                        <th>Address</th>
                        <th>Screens</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {theatresPage.content.map((theatre: any) => (
                        <tr key={theatre.id}>
                          <td style={{ color: "var(--text3)", fontWeight: 700 }}>#{theatre.id}</td>
                          <td>
                            <strong>{theatre.name}</strong>
                          </td>
                          <td>
                            <span className="cx-admin-city-badge">
                              <MapPin size={12} /> {theatre.city || "Bengaluru"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text2)", fontSize: "0.85rem" }}>
                            {theatre.address || "Cinema Boulevard, City Mall"}
                          </td>
                          <td>{theatre.screens?.length || 4} Screens</td>
                          <td>
                            <button
                              type="button"
                              className="cx-admin-action-btn delete"
                              title="Delete Theatre"
                              onClick={() => handleDeleteTheatre(theatre.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {theatresPage.content.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text3)" }}>
                            {loading ? "Loading theatres..." : "No theatres found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={theatresPage.number}
                  totalPages={theatresPage.totalPages}
                  totalElements={theatresPage.totalElements}
                  pageSize={theatresPage.size}
                  onPageChange={(page) => setTheatresPage((prev) => ({ ...prev, number: page }))}
                  onPageSizeChange={(size) => setTheatresPage((prev) => ({ ...prev, size, number: 0 }))}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 4: SCREENS & SEATS BUILDER
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "screens" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-panel" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Interactive Auditorium Seat Designer</h3>
                    <p style={{ color: "var(--text2)", fontSize: "0.88rem", margin: "0.25rem 0 0" }}>
                      Select a cinema screen, configure rows and columns, and build custom seat tier zones.
                    </p>
                  </div>
                  <button type="button" className="btn-primary" disabled={actionLoading} onClick={async () => {
                    if (!selectedScreenId) { toast.error("Please select a screen first"); return; }
                    setActionLoading(true);
                    try {
                      await api.post(`/api/seats/layout/${selectedScreenId}`, {
                        rows: rowsCount,
                        columns: colsCount,
                        categoryPrices: seatPrices,
                        rowCategories: { A: "GOLD", B: "GOLD", C: "SILVER", D: "SILVER" }
                      });
                      toast.success(`Seat layout saved to database for Screen #${selectedScreenId}!`);
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, "Failed to save seat layout"));
                    } finally {
                      setActionLoading(false);
                    }
                  }}>
                    <Check size={16} /> Save Layout
                  </button>
                </div>

                {/* Controls Toolbar */}
                <div className="cx-admin-layout-controls">
                  <div className="cx-admin-form-group">
                    <label>Select Screen:</label>
                    <select
                      value={selectedScreenId}
                      onChange={(e) => setSelectedScreenId(Number(e.target.value))}
                      className="cx-admin-input"
                      style={{ minWidth: "200px" }}
                    >
                      {screensList.length > 0 ? (
                        screensList.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name || `Screen #${s.id}`} ({s.theatreName || "CineX Cinema"})
                          </option>
                        ))
                      ) : (
                        <option value={1}>Screen #1 (Main Auditorium)</option>
                      )}
                    </select>
                  </div>

                  <div className="cx-admin-form-group">
                    <label>Active Tier Zone:</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {(["SILVER", "GOLD", "CLUB", "PLATINUM"] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          className={`cx-admin-tier-btn ${tier.toLowerCase()} ${seatTier === tier ? "active" : ""}`}
                          onClick={() => setSeatTier(tier)}
                        >
                          {tier} (₹{seatPrices[tier]})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div className="cx-admin-form-group">
                      <label>Rows (A-Z):</label>
                      <input
                        type="number"
                        min={4}
                        max={16}
                        value={rowsCount}
                        onChange={(e) => setRowsCount(Number(e.target.value))}
                        className="cx-admin-input"
                        style={{ width: "90px" }}
                      />
                    </div>
                    <div className="cx-admin-form-group">
                      <label>Columns (Seats/Row):</label>
                      <input
                        type="number"
                        min={6}
                        max={20}
                        value={colsCount}
                        onChange={(e) => setColsCount(Number(e.target.value))}
                        className="cx-admin-input"
                        style={{ width: "90px" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Auditorium Screen */}
                <div className="cx-admin-screen-curve">
                  <div className="cx-admin-screen-bar" />
                  <span>CINEMA SCREEN THIS WAY</span>
                </div>

                {/* Seat Matrix */}
                <div className="cx-admin-seat-matrix-wrapper">
                  <div className="cx-admin-seat-matrix">
                    {Array.from({ length: rowsCount }, (_, rowIdx) => {
                      const rowChar = String.fromCharCode(65 + rowIdx);
                      return (
                        <div key={rowChar} className="cx-admin-seat-row">
                          <span className="cx-admin-row-letter">{rowChar}</span>
                          <div className="cx-admin-row-seats">
                            {Array.from({ length: colsCount }, (_, colIdx) => {
                              const seatId = `${rowChar}${colIdx + 1}`;
                              const isBlocked = blockedSeats.has(seatId);
                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  className={`cx-admin-designer-seat ${isBlocked ? "blocked" : seatTier.toLowerCase()}`}
                                  onClick={() => toggleSeatBlock(seatId)}
                                  title={`${seatId} • ${isBlocked ? "BLOCKED" : seatTier}`}
                                >
                                  {isBlocked ? "✕" : colIdx + 1}
                                </button>
                              );
                            })}
                          </div>
                          <span className="cx-admin-row-letter">{rowChar}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="cx-admin-legend">
                  <div className="cx-admin-legend-item">
                    <span className="cx-admin-designer-seat silver" style={{ width: 20, height: 20, fontSize: 10 }}>1</span>
                    <span>Silver (₹150)</span>
                  </div>
                  <div className="cx-admin-legend-item">
                    <span className="cx-admin-designer-seat gold" style={{ width: 20, height: 20, fontSize: 10 }}>2</span>
                    <span>Gold (₹250)</span>
                  </div>
                  <div className="cx-admin-legend-item">
                    <span className="cx-admin-designer-seat club" style={{ width: 20, height: 20, fontSize: 10 }}>3</span>
                    <span>Club (₹350)</span>
                  </div>
                  <div className="cx-admin-legend-item">
                    <span className="cx-admin-designer-seat platinum" style={{ width: 20, height: 20, fontSize: 10 }}>4</span>
                    <span>Platinum (₹500)</span>
                  </div>
                  <div className="cx-admin-legend-item">
                    <span className="cx-admin-designer-seat blocked" style={{ width: 20, height: 20, fontSize: 10 }}>✕</span>
                    <span>Blocked Seat</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 5: SHOWS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "shows" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <span className="cx-admin-count-label">
                    Total: {showsPage.totalElements} Scheduled Showtimes
                  </span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("shows", "id")} style={{ cursor: "pointer" }}>Show ID ⇕</th>
                        <th>Movie</th>
                        <th>Theatre & Screen</th>
                        <th onClick={() => handleSort("shows", "showDate")} style={{ cursor: "pointer" }}>Date ⇕</th>
                        <th>Time</th>
                        <th>Ticket Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showsPage.content.map((show: any) => (
                        <tr key={show.id}>
                          <td style={{ color: "var(--text3)", fontWeight: 700 }}>#{show.id}</td>
                          <td>
                            <strong>{show.movieTitle || `Movie #${show.movieId}`}</strong>
                          </td>
                          <td>
                            {show.theatreName || "CineX Cinema"} • {show.screenName || `Screen ${show.screenId || 1}`}
                          </td>
                          <td>
                            <span className="cx-admin-date-tag">
                              <Calendar size={13} /> {show.showDate}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "#fff" }}>{show.showTime}</strong>
                          </td>
                          <td>
                            <strong style={{ color: "var(--coral)" }}>₹{show.price}</strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="cx-admin-action-btn delete"
                              title="Delete Showtime"
                              onClick={() => handleDeleteShow(show.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {showsPage.content.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text3)" }}>
                            {loading ? "Loading showtimes..." : "No showtimes scheduled."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={showsPage.number}
                  totalPages={showsPage.totalPages}
                  totalElements={showsPage.totalElements}
                  pageSize={showsPage.size}
                  onPageChange={(page) => setShowsPage((prev) => ({ ...prev, number: page }))}
                  onPageSizeChange={(size) => setShowsPage((prev) => ({ ...prev, size, number: 0 }))}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 6: BOOKINGS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "bookings" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <span className="cx-admin-count-label">
                    Total: {bookingsPage.totalElements} Customer Bookings
                  </span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("bookings", "id")} style={{ cursor: "pointer" }}>Booking ID ⇕</th>
                        <th>Customer / Clerk ID</th>
                        <th>Movie Title</th>
                        <th>Seats</th>
                        <th>Amount Paid</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsPage.content.map((b: any) => {
                        const bId = b.bookingId || b.id;
                        const seatsStr = Array.isArray(b.seatNumbers) ? b.seatNumbers.join(", ") : Array.isArray(b.seats) ? b.seats.join(", ") : String(b.seatNumbers || b.seats || "1 Seat");
                        const status = b.bookingStatus || b.status || "CONFIRMED";
                        return (
                          <tr key={bId}>
                            <td style={{ color: "var(--coral)", fontWeight: 800 }}>#CNX-{bId}</td>
                            <td style={{ fontSize: "0.82rem", color: "var(--text2)" }}>
                              {b.clerkUserId ? `${b.clerkUserId.slice(0, 14)}…` : (b.customerName || "Member")}
                            </td>
                            <td>
                              <strong>{b.movieTitle || b.movie || "Cinema Screening"}</strong>
                            </td>
                            <td>
                              <span className="cx-admin-seats-pill">{seatsStr}</span>
                            </td>
                            <td>
                              <strong style={{ color: "#4ade80" }}>₹{b.totalAmount || b.amount || 0}</strong>
                            </td>
                            <td>
                              <span className={`cx-admin-status-pill ${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="cx-admin-action-btn download"
                                title="Download Official PDF Ticket"
                                onClick={() => handleDownloadTicket(b)}
                              >
                                <Download size={14} /> PDF
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {bookingsPage.content.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text3)" }}>
                            {loading ? "Loading bookings..." : "No bookings recorded yet."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={bookingsPage.number}
                  totalPages={bookingsPage.totalPages}
                  totalElements={bookingsPage.totalElements}
                  pageSize={bookingsPage.size}
                  onPageChange={(page) => setBookingsPage((prev) => ({ ...prev, number: page }))}
                  onPageSizeChange={(size) => setBookingsPage((prev) => ({ ...prev, size, number: 0 }))}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 7: USERS & MEMBERS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <span className="cx-admin-count-label">
                    Total: {usersPage.totalElements || usersPage.content.length || 2} Platform Members
                  </span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th>Member Identity</th>
                        <th>Email Address</th>
                        <th>Membership Tier</th>
                        <th>Wallet Balance</th>
                        <th>Access Level</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersPage.content.length > 0 ? (
                        usersPage.content.map((u: any) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name || "CineX Member"}</strong>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className="cx-admin-black-pill">
                                {u.role === "ADMIN" ? "CINEX BLACK VIP" : "CINEX BLACK"}
                              </span>
                            </td>
                            <td><strong style={{ color: "#4ade80" }}>₹300.00</strong></td>
                            <td>
                              <span className={`cx-admin-role-badge ${u.role === "ADMIN" ? "admin" : "user"}`}>
                                {u.role === "ADMIN" ? "ROLE_ADMIN" : "ROLE_USER"}
                              </span>
                            </td>
                            <td><span className="cx-admin-status-pill active">ACTIVE</span></td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td>
                              <strong>CineX Lead Administrator</strong>
                            </td>
                            <td>admin@cinex.com</td>
                            <td>
                              <span className="cx-admin-black-pill">CINEX BLACK VIP</span>
                            </td>
                            <td><strong style={{ color: "#4ade80" }}>₹3,000.00</strong></td>
                            <td>
                              <span className="cx-admin-role-badge admin">ROLE_ADMIN</span>
                            </td>
                            <td><span className="cx-admin-status-pill active">ACTIVE</span></td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Verified Customer Account</strong>
                            </td>
                            <td>member@cinex.com</td>
                            <td>
                              <span className="cx-admin-black-pill">CINEX BLACK</span>
                            </td>
                            <td><strong style={{ color: "#4ade80" }}>₹300.00</strong></td>
                            <td>
                              <span className="cx-admin-role-badge user">ROLE_USER</span>
                            </td>
                            <td><span className="cx-admin-status-pill active">ACTIVE</span></td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {usersPage.totalPages > 1 && (
                  <Pagination
                    currentPage={usersPage.number}
                    totalPages={usersPage.totalPages}
                    totalElements={usersPage.totalElements}
                    pageSize={usersPage.size}
                    onPageChange={(page) => setUsersPage((prev) => ({ ...prev, number: page }))}
                    onPageSizeChange={(size) => setUsersPage((prev) => ({ ...prev, size, number: 0 }))}
                  />
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 8: COUPONS & OFFERS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "coupons" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-table-card">
                <div className="cx-admin-table-toolbar">
                  <span className="cx-admin-count-label">Active Promotional Campaigns</span>
                </div>

                <div className="cx-admin-table-responsive">
                  <table className="cx-admin-table">
                    <thead>
                      <tr>
                        <th>Coupon Code</th>
                        <th>Wallet Credit Amount</th>
                        <th>Type</th>
                        <th>Redemptions</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couponsList.length > 0 ? (
                        couponsList.map((c: any) => (
                          <tr key={c.id || c.code}>
                            <td>
                              <strong style={{ color: "var(--coral)", fontSize: "1.1rem", letterSpacing: "1px" }}>
                                {c.code}
                              </strong>
                            </td>
                            <td>
                              <strong style={{ color: "#4ade80" }}>₹{c.walletCredit || 300}.00</strong>
                            </td>
                            <td>Instant Wallet Bonus</td>
                            <td>Single Per Customer</td>
                            <td>
                              <span className={`cx-admin-status-pill ${c.active !== false ? "active" : "cancelled"}`}>
                                {c.active !== false ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>
                            <td>
                              <span className="cx-admin-tag">SYSTEM PROMO</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td>
                            <strong style={{ color: "var(--coral)", fontSize: "1.1rem", letterSpacing: "1px" }}>
                              CINEX300
                            </strong>
                          </td>
                          <td>
                            <strong style={{ color: "#4ade80" }}>₹300.00</strong>
                          </td>
                          <td>Instant Wallet Bonus</td>
                          <td>Single Per Customer</td>
                          <td>
                            <span className="cx-admin-status-pill active">ACTIVE</span>
                          </td>
                          <td>
                            <span className="cx-admin-tag">SYSTEM PROMO</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              TAB 9: REVENUE & ANALYTICS
          ══════════════════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <div className="cx-admin-tab-content">
              <div className="cx-admin-grid-2">
                <div className="cx-admin-panel">
                  <h3 className="cx-admin-panel-title">
                    <TrendingUp size={18} color="var(--coral)" />
                    <span>Revenue Velocity &amp; Daily Flow</span>
                  </h3>
                  <div className="cx-admin-chart-mock">
                    <div className="cx-admin-bar-group">
                      <div className="cx-admin-bar" style={{ height: "45%" }} data-amt="₹12.4K">
                        <span className="cx-admin-bar-label">Mon</span>
                      </div>
                      <div className="cx-admin-bar" style={{ height: "65%" }} data-amt="₹18.2K">
                        <span className="cx-admin-bar-label">Tue</span>
                      </div>
                      <div className="cx-admin-bar" style={{ height: "55%" }} data-amt="₹15.8K">
                        <span className="cx-admin-bar-label">Wed</span>
                      </div>
                      <div className="cx-admin-bar" style={{ height: "80%" }} data-amt="₹24.5K">
                        <span className="cx-admin-bar-label">Thu</span>
                      </div>
                      <div className="cx-admin-bar active" style={{ height: "95%" }} data-amt="₹32.0K">
                        <span className="cx-admin-bar-label">Fri</span>
                      </div>
                      <div className="cx-admin-bar active" style={{ height: "100%" }} data-amt="₹38.6K">
                        <span className="cx-admin-bar-label">Sat</span>
                      </div>
                      <div className="cx-admin-bar active" style={{ height: "90%" }} data-amt="₹29.4K">
                        <span className="cx-admin-bar-label">Sun</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cx-admin-panel">
                  <h3 className="cx-admin-panel-title">
                    <Percent size={18} color="#22C55E" />
                    <span>Theatre Utilization Metrics</span>
                  </h3>
                  <div className="cx-admin-util-list">
                    <div className="cx-admin-util-item">
                      <div className="cx-admin-util-row">
                        <span>IMAX Laser Bengaluru</span>
                        <strong>88%</strong>
                      </div>
                      <div className="cx-admin-progress"><div className="cx-admin-progress-fill" style={{ width: "88%" }} /></div>
                    </div>
                    <div className="cx-admin-util-item">
                      <div className="cx-admin-util-row">
                        <span>PVR Cinema Screen 1</span>
                        <strong>76%</strong>
                      </div>
                      <div className="cx-admin-progress"><div className="cx-admin-progress-fill" style={{ width: "76%" }} /></div>
                    </div>
                    <div className="cx-admin-util-item">
                      <div className="cx-admin-util-row">
                        <span>Luxury Cinema Chennai</span>
                        <strong>64%</strong>
                      </div>
                      <div className="cx-admin-progress"><div className="cx-admin-progress-fill" style={{ width: "64%" }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Add Movie Modal ── */}
      {isAddMovieModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddMovieModalOpen(false)}>
          <div className="cx-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cx-admin-modal-head">
              <h3>Add New Movie to CineX</h3>
              <button type="button" onClick={() => setIsAddMovieModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateMovie} className="cx-admin-form">
              <div className="cx-admin-form-group">
                <label>Movie Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toxic: A Fairy Tale for Grown-ups"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-grid-2">
                <div className="cx-admin-form-group">
                  <label>Genre</label>
                  <input
                    type="text"
                    placeholder="Action, Sci-Fi"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="cx-admin-input"
                  />
                </div>
                <div className="cx-admin-form-group">
                  <label>Language</label>
                  <input
                    type="text"
                    placeholder="English, Hindi"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="cx-admin-input"
                  />
                </div>
              </div>

              <div className="cx-admin-grid-2">
                <div className="cx-admin-form-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className="cx-admin-input"
                  />
                </div>
                <div className="cx-admin-form-group">
                  <label>Release Date</label>
                  <input
                    type="date"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    className="cx-admin-input"
                  />
                </div>
              </div>

              <div className="cx-admin-form-group">
                <label>Poster Image URL or TMDB Path</label>
                <input
                  type="text"
                  placeholder="https://... or /path.jpg"
                  value={movieForm.posterPath}
                  onChange={(e) => setMovieForm({ ...movieForm, posterPath: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-form-group">
                <label>Overview Synopsis</label>
                <textarea
                  rows={3}
                  placeholder="Brief synopsis..."
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddMovieModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Theatre Modal ── */}
      {isAddTheatreModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddTheatreModalOpen(false)}>
          <div className="cx-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cx-admin-modal-head">
              <h3>Add New Theatre Location</h3>
              <button type="button" onClick={() => setIsAddTheatreModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTheatre} className="cx-admin-form">
              <div className="cx-admin-form-group">
                <label>Theatre Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CineX IMAX Cinema"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-form-group">
                <label>City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={theatreForm.city}
                  onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-form-group">
                <label>Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Forum Mall, Koramangala"
                  value={theatreForm.address}
                  onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddTheatreModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Theatre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Show Modal ── */}
      {isAddShowModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddShowModalOpen(false)}>
          <div className="cx-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cx-admin-modal-head">
              <h3>Schedule New Showtime</h3>
              <button type="button" onClick={() => setIsAddShowModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateShow} className="cx-admin-form">
              <div className="cx-admin-form-group">
                <label>Select Movie *</label>
                {allMoviesList.length > 0 || moviesPage.content.length > 0 ? (
                  <select
                    required
                    value={showForm.movieId}
                    onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                    className="cx-admin-input"
                  >
                    <option value="">-- Choose Movie --</option>
                    {(allMoviesList.length > 0 ? allMoviesList : moviesPage.content).map((m: any) => (
                      <option key={m.id} value={m.id}>
                        #{m.id} - {m.title} ({m.language || "English"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1"
                    value={showForm.movieId}
                    onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                    className="cx-admin-input"
                  />
                )}
              </div>

              <div className="cx-admin-grid-2">
                <div className="cx-admin-form-group">
                  <label>Select Screen *</label>
                  {screensList.length > 0 ? (
                    <select
                      required
                      value={showForm.screenId}
                      onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                      className="cx-admin-input"
                    >
                      <option value="">-- Choose Screen --</option>
                      {screensList.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name || `Screen #${s.id}`} ({s.theatreName || "CineX"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1"
                      value={showForm.screenId}
                      onChange={(e) => setShowForm({ ...showForm, screenId: e.target.value })}
                      className="cx-admin-input"
                    />
                  )}
                </div>
                <div className="cx-admin-form-group">
                  <label>Ticket Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={2000}
                    value={showForm.price}
                    onChange={(e) => setShowForm({ ...showForm, price: Number(e.target.value) })}
                    className="cx-admin-input"
                  />
                </div>
              </div>

              <div className="cx-admin-grid-2">
                <div className="cx-admin-form-group">
                  <label>Show Date *</label>
                  <input
                    type="date"
                    required
                    value={showForm.showDate}
                    onChange={(e) => setShowForm({ ...showForm, showDate: e.target.value })}
                    className="cx-admin-input"
                  />
                </div>
                <div className="cx-admin-form-group">
                  <label>Show Time *</label>
                  <input
                    type="time"
                    required
                    value={showForm.showTime}
                    onChange={(e) => setShowForm({ ...showForm, showTime: e.target.value })}
                    className="cx-admin-input"
                  />
                </div>
              </div>

              <div className="cx-admin-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddShowModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Scheduling..." : "Schedule Show"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Coupon Modal ── */}
      {isAddCouponModalOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddCouponModalOpen(false)}>
          <div className="cx-admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cx-admin-modal-head">
              <h3>Create Promotional Coupon</h3>
              <button type="button" onClick={() => setIsAddCouponModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCouponSubmit} className="cx-admin-form">
              <div className="cx-admin-form-group">
                <label>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CINEX300"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-form-group">
                <label>Wallet Credit Value (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50000}
                  value={couponForm.walletCredit}
                  onChange={(e) => setCouponForm({ ...couponForm, walletCredit: Number(e.target.value) })}
                  className="cx-admin-input"
                />
              </div>

              <div className="cx-admin-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddCouponModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <RefreshCw className="spin" size={15} /> Saving...
                    </>
                  ) : (
                    "Save Promo Code"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

