import { Show, SignInButton, UserButton, useUser, useClerk } from "@clerk/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { api, downloadAuthenticatedFile, fetchAuthenticatedBlobUrl, getApiErrorMessage } from "./api/apiClient";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FeaturePage } from "./pages/FeaturePage";
import { WishlistPage } from "./pages/WishlistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { useWishlist } from "./utils/useWishlist";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Ticket, Sparkles, Film, Calendar, Star, Heart, Compass, Settings, Headphones, Code, Play, ArrowLeft, Lock, Shield, Download, Home, User, Tv, Trophy, Gift } from "lucide-react";
import "./index.css";
import { AdminPortal } from "./admin/AdminPortal";
import { hasAdminRole } from "./utils/clerkRole";

const IMG_BASE_URL     = "https://image.tmdb.org/t/p/w500";
const IMG_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";
// Use the Nginx same-origin proxy in production; local .env.local may override this.
const API_BASE         = import.meta.env.VITE_API_BASE_URL || "";

// ── Language Helper ────────────────────────────────────────────────────────────
const LANG_LABEL: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
};
const getLangLabel = (code: string) => LANG_LABEL[code] ?? code.toUpperCase();

// ── Genre Mapping ──────────────────────────────────────────────────────────────
const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};
const getGenres = (ids?: number[]) => {
  if (!ids || ids.length === 0) return "Cinema • Feature";
  return ids.slice(0, 3).map(id => GENRE_MAP[id] || "Drama").join(" • ");
};

type CineXShow = {
  id: number;
  movieId: number;
  screenId: number;
  showTime: string;
  showDate: string;
  price: number;
  availableSeats: number;
};

type CineXSeat = {
  seatId: number;
  seatNumber: string;
  seatType: string;
  status: "AVAILABLE" | "BOOKED";
  price: number;
};

type CineXScreen = { id: number; screenName: string; theatreId: number };
type CineXTheatre = { id: number; name: string; city: string };
const getGenreList = (ids?: number[]) => {
  if (!ids || ids.length === 0) return ["Drama", "Cinema"];
  return ids.slice(0, 4).map(id => GENRE_MAP[id] || "Drama");
};

// ── Cities ─────────────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Chennai",   state: "Tamil Nadu",     emoji: "🏖️" },
  { name: "Bengaluru", state: "Karnataka",      emoji: "💻" },
  { name: "Hyderabad", state: "Telangana",      emoji: "💎" },
  { name: "Mumbai",    state: "Maharashtra",    emoji: "🌊" },
  { name: "Delhi NCR", state: "Delhi",          emoji: "🏛️" },
];

// ── Realistic Theatre Database per City ────────────────────────────────────────
const THEATRES_DB: Record<string, Array<{
  name: string;
  features: string;
  distance: string;
  times: Array<{ t: string; s: string; type: string }>;
}>> = {
  Chennai: [
    { name: "Sathyam Cinemas: Royapettah", features: "4K Dolby Atmos • SPI Gourmet", distance: "2.1 km", times: [{ t: "09:30 AM", s: "available", type: "4K Atmos" }, { t: "01:15 PM", s: "fast-filling", type: "Dolby 7.1" }, { t: "04:45 PM", s: "available", type: "4K Atmos" }, { t: "09:15 PM", s: "almost-full", type: "IMAX" }] },
    { name: "PVR: Phoenix Marketcity, Velachery", features: "IMAX with Laser • 4K Dolby Atmos", distance: "6.4 km", times: [{ t: "10:00 AM", s: "available", type: "IMAX 3D" }, { t: "02:30 PM", s: "available", type: "Atmos" }, { t: "06:15 PM", s: "fast-filling", type: "IMAX Laser" }, { t: "10:30 PM", s: "available", type: "Dolby 7.1" }] },
    { name: "AGS Cinemas: T. Nagar", features: "Dolby Atmos • Recliner Lounge", distance: "3.8 km", times: [{ t: "11:15 AM", s: "available", type: "Atmos" }, { t: "03:00 PM", s: "fast-filling", type: "Dolby 7.1" }, { t: "07:00 PM", s: "available", type: "Atmos" }] },
    { name: "ROHINI Silver Screens: Koyambedu", features: "RGB Laser • Dolby Atmos • Fans Fort", distance: "8.2 km", times: [{ t: "08:30 AM", s: "fast-filling", type: "Laser" }, { t: "12:30 PM", s: "available", type: "Atmos" }, { t: "05:00 PM", s: "almost-full", type: "RGB Laser" }, { t: "08:45 PM", s: "available", type: "Atmos" }] },
  ],
  Bengaluru: [
    { name: "PVR: Forum Mall, Koramangala", features: "IMAX • 4K Dolby Atmos • Gold Class", distance: "3.2 km", times: [{ t: "10:00 AM", s: "available", type: "IMAX" }, { t: "01:30 PM", s: "fast-filling", type: "Atmos" }, { t: "05:15 PM", s: "available", type: "Gold" }, { t: "09:00 PM", s: "almost-full", type: "IMAX" }] },
    { name: "INOX: Mantri Square, Malleshwaram", features: "INSIGNIA • Dolby 7.1 • 2K Laser", distance: "5.1 km", times: [{ t: "09:45 AM", s: "available", type: "Laser" }, { t: "01:15 PM", s: "available", type: "INSIGNIA" }, { t: "06:30 PM", s: "fast-filling", type: "Dolby 7.1" }, { t: "10:15 PM", s: "available", type: "Laser" }] },
    { name: "Cinepolis: Orion Mall, Rajajinagar", features: "4DX • VIP Recliners • Dolby Atmos", distance: "7.8 km", times: [{ t: "11:00 AM", s: "available", type: "4DX" }, { t: "03:30 PM", s: "fast-filling", type: "Atmos" }, { t: "07:45 PM", s: "available", type: "VIP" }] },
    { name: "Urvashi Theatre: Lalbagh Road", features: "4K RGB Laser • Dolby Atmos • Giant Screen", distance: "2.4 km", times: [{ t: "10:30 AM", s: "fast-filling", type: "4K Laser" }, { t: "02:15 PM", s: "available", type: "Atmos" }, { t: "06:00 PM", s: "almost-full", type: "Giant Screen" }, { t: "09:30 PM", s: "available", type: "Atmos" }] },
  ],
  Hyderabad: [
    { name: "AMB Cinemas: Gachibowli", features: "Laser projection • VIP Lounge • Dolby Atmos", distance: "4.5 km", times: [{ t: "09:45 AM", s: "available", type: "Laser VIP" }, { t: "01:30 PM", s: "fast-filling", type: "Atmos" }, { t: "05:00 PM", s: "almost-full", type: "Laser VIP" }, { t: "08:45 PM", s: "available", type: "Atmos" }] },
    { name: "Prasads Multiplex: Necklace Road", features: "Large Screen • RGB Laser • Dolby Atmos", distance: "3.1 km", times: [{ t: "08:45 AM", s: "fast-filling", type: "Large Screen" }, { t: "12:15 PM", s: "available", type: "Atmos" }, { t: "04:00 PM", s: "almost-full", type: "RGB Laser" }, { t: "08:00 PM", s: "available", type: "Large Screen" }] },
    { name: "PVR: Nexus Mall, Kukatpally", features: "IMAX • Dolby Atmos • Recliners", distance: "9.2 km", times: [{ t: "10:15 AM", s: "available", type: "IMAX" }, { t: "02:00 PM", s: "available", type: "Atmos" }, { t: "06:15 PM", s: "fast-filling", type: "IMAX" }, { t: "10:00 PM", s: "available", type: "Recliner" }] },
    { name: "Cinepolis: Sarath City Capital Mall", features: "4DX • VIP Recliners • Dolby Atmos", distance: "6.8 km", times: [{ t: "11:00 AM", s: "available", type: "4DX" }, { t: "03:15 PM", s: "fast-filling", type: "Atmos" }, { t: "07:30 PM", s: "available", type: "VIP" }] },
  ],
  Mumbai: [
    { name: "PVR: ICON Palladium, Lower Parel", features: "IMAX • 4K Dolby Atmos • Recliner Seats", distance: "1.2 km", times: [{ t: "09:30 AM", s: "available", type: "IMAX" }, { t: "12:45 PM", s: "fast-filling", type: "Atmos" }, { t: "04:15 PM", s: "available", type: "IMAX Laser" }, { t: "08:30 PM", s: "almost-full", type: "Recliner" }] },
    { name: "INOX: Laserplex, Nariman Point", features: "Laser Projection • Dolby 7.1 • Gourmet Food", distance: "3.5 km", times: [{ t: "10:15 AM", s: "available", type: "Laser" }, { t: "01:30 PM", s: "available", type: "Dolby 7.1" }, { t: "05:00 PM", s: "fast-filling", type: "Laser" }, { t: "09:15 PM", s: "available", type: "Dolby 7.1" }] },
    { name: "Cinepolis: Fun Republic, Andheri", features: "4DX • Dolby Atmos • RealD 3D", distance: "8.1 km", times: [{ t: "11:00 AM", s: "available", type: "4DX 3D" }, { t: "03:15 PM", s: "fast-filling", type: "Atmos" }, { t: "07:00 PM", s: "available", type: "RealD 3D" }] },
    { name: "Carnival: IMAX Wadala", features: "IMAX Dome • Giant Screen • Dolby Digital", distance: "5.4 km", times: [{ t: "10:00 AM", s: "available", type: "IMAX Dome" }, { t: "02:00 PM", s: "almost-full", type: "Giant" }, { t: "06:30 PM", s: "available", type: "IMAX Dome" }, { t: "10:00 PM", s: "fast-filling", type: "Giant" }] },
  ],
  "Delhi NCR": [
    { name: "PVR: Select CityWalk, Saket", features: "IMAX • Gold Class • Dolby Atmos", distance: "4.1 km", times: [{ t: "10:00 AM", s: "available", type: "IMAX" }, { t: "01:15 PM", s: "fast-filling", type: "Gold Class" }, { t: "05:30 PM", s: "available", type: "Atmos" }, { t: "09:15 PM", s: "almost-full", type: "IMAX" }] },
    { name: "INOX: Odeon, Connaught Place", features: "Heritage • 4K Projection • Dolby 7.1", distance: "1.8 km", times: [{ t: "09:30 AM", s: "available", type: "4K" }, { t: "12:45 PM", s: "available", type: "Dolby 7.1" }, { t: "04:30 PM", s: "fast-filling", type: "4K" }, { t: "08:30 PM", s: "available", type: "Dolby 7.1" }] },
    { name: "PVR: Ambience Mall, Gurugram", features: "IMAX with Laser • 4DX • Recliners", distance: "12.5 km", times: [{ t: "10:30 AM", s: "available", type: "IMAX Laser" }, { t: "02:15 PM", s: "fast-filling", type: "4DX" }, { t: "06:45 PM", s: "available", type: "Recliner" }, { t: "10:30 PM", s: "available", type: "IMAX Laser" }] },
    { name: "Cinepolis: DLF Mall of India, Noida", features: "4DX • Megaplex • Dolby Atmos", distance: "9.3 km", times: [{ t: "11:00 AM", s: "available", type: "4DX" }, { t: "03:00 PM", s: "almost-full", type: "Megaplex" }, { t: "07:15 PM", s: "available", type: "Atmos" }] },
  ],
};

// Retained only for any non-customer demo surfaces; customer booking uses API data below.
void THEATRES_DB;

export default function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn } = useClerk();

  // Movie state
  const [moviesNowPlaying, setMoviesNowPlaying] = useState<any[]>([]);
  const [moviesTrending,   setMoviesTrending]   = useState<any[]>([]);
  const [moviesUpcoming,   setMoviesUpcoming]   = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [apiError,         setApiError]         = useState(false);

  // Filter state
  const [searchQuery,  setSearchQuery]  = useState("");
  const [activeLang]                  = useState("all");

  // City state
  const [currentCity,     setCurrentCity]     = useState("Chennai");
  const [cityModalOpen,   setCityModalOpen]   = useState(false);
  const [citySearch,      setCitySearch]      = useState("");
  const [isAdminOpen,     setIsAdminOpen]     = useState(false);

  // UI overlays & Modals
  const [currentMovie,   setCurrentMovie]   = useState<any>(null);
  const [shows,          setShows]          = useState<CineXShow[]>([]);
  const [showsLoading,   setShowsLoading]   = useState(false);
  const [showsError,     setShowsError]     = useState("");
  const [selectedShow,   setSelectedShow]   = useState<CineXShow | null>(null);
  const [showSeats,      setShowSeats]      = useState<CineXSeat[]>([]);
  const [seatsLoading,   setSeatsLoading]   = useState(false);
  const [screens,        setScreens]        = useState<CineXScreen[]>([]);
  const [theatres,       setTheatres]       = useState<CineXTheatre[]>([]);
  const [isDetailOpen,   setIsDetailOpen]   = useState(false);
  const [isSeatOpen,     setIsSeatOpen]     = useState(false);
  const [currentTheatre, setCurrentTheatre] = useState("");
  const [currentTime,    setCurrentTime]    = useState("");
  const [currentShowId,  setCurrentShowId]  = useState<number | null>(null);
  const [selectedSeats,  setSelectedSeats]  = useState<Array<{ id: string; price: number; seatId?: number }>>([]);
  const [liveSeatStatus, setLiveSeatStatus] = useState<Record<string, { status: 'HELD' | 'BOOKED' | 'AVAILABLE'; userId?: string }>>({});
  const stompClientRef = useRef<Client | null>(null);
  const lockSessionIdRef = useRef<string>(crypto.randomUUID());
  const selectedSeatsRef = useRef(selectedSeats);
  selectedSeatsRef.current = selectedSeats;

  // Checkout & Payment
  const [isPaymentOpen,  setIsPaymentOpen]  = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [paymentError,   setPaymentError]   = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastBooking, setLastBooking] = useState<{
    bookingId: string | number;
    movieTitle: string;
    posterPath: string;
    theatreName: string;
    showDate: string;
    showTime: string;
    seats: string[];
    totalAmount: number;
    ticketToken?: string;
  } | null>(null);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string>("");

  // History / Bookings
  const [userBookings,   setUserBookings]   = useState<any[]>([]);
  const [ticketQrUrls,   setTicketQrUrls]   = useState<Record<string, string>>({});
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);

  // Carousel
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { wishlist, isWishlisted, toggleWishlist, removeWishlist, wishlistCount } = useWishlist(user?.id);

  // ── Fetch Bookings from Spring Boot Backend ────────────────────────────────────
  const fetchUserBookings = useCallback(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    api.get(`/api/bookings/clerk/${user.id}`)
      .then(res => {
        setUserBookings(res.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch bookings from backend:", getApiErrorMessage(err, "Failed to fetch bookings"));
      });
  }, [isLoaded, isSignedIn, user?.id]);

  // ── Fetch Movies from Spring Boot Backend ──────────────────────────────────────
  const mapBackendMovieToTmdb = (movie: any) => ({
    id: movie.id,
    title: movie.title,
    overview: movie.description || "",
    poster_path: movie.posterPath || null,
    backdrop_path: movie.posterPath || null,
    original_language: (movie.language || "en").slice(0, 2).toLowerCase(),
    genre_ids: [] as number[],
    vote_average: 8,
  });

  const loadMoviesFromBackendCatalog = () =>
    api.get("/api/movies", { skipAuth: true }).then((res) => {
      const catalog = (res.data || []).map(mapBackendMovieToTmdb);
      setMoviesNowPlaying(catalog);
      setMoviesTrending(catalog);
      setMoviesUpcoming(catalog);
      setLoading(false);
    });

  const fetchAllMovies = useCallback(() => {
    setLoading(true);
    setApiError(false);
    Promise.all([
      api.get("/api/tmdb/now_playing", { skipAuth: true }),
      api.get("/api/tmdb/trending", { skipAuth: true }),
      api.get("/api/tmdb/upcoming", { skipAuth: true }),
    ])
      .then(([resNow, resTrend, resUp]) => {
        setMoviesNowPlaying(resNow.data.results || []);
        setMoviesTrending(resTrend.data.results || []);
        setMoviesUpcoming(resUp.data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("TMDB unavailable, falling back to backend movie catalog:", err);
        loadMoviesFromBackendCatalog().catch(fallbackErr => {
          console.error("Failed to load movies from backend:", fallbackErr);
          setApiError(true);
          setLoading(false);
        });
      });
  }, []);

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchUserBookings();
    } else if (isLoaded) {
      setUserBookings([]);
    }
  }, [isLoaded, user?.id, fetchUserBookings]);

  // Filter helper
  const filterMovies = (list: any[]) => {
    return list.filter(m => {
      if (activeLang !== "all" && m.original_language !== activeLang) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = m.title?.toLowerCase().includes(q);
        const genreMatch = getGenres(m.genre_ids).toLowerCase().includes(q);
        return titleMatch || genreMatch;
      }
      return true;
    });
  };

  // Auto-advance hero carousel (filtered by language)
  const carouselMovies = filterMovies(moviesTrending.length > 0 ? moviesTrending : moviesNowPlaying).slice(0, 5);
  useEffect(() => {
    if (carouselMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselMovies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselMovies.length]);

  const handleMovieClick = (movie: any) => {
    if (!movie) return;
    setCurrentMovie(movie);
    setSelectedShow(null);
    setShows([]);
    setShowsError("");
    setShowsLoading(true);
    setSelectedDetailDate("");
    setSelectedShow(null);
    setIsDetailOpen(true);
    Promise.all([
      api.get("/api/movies", { skipAuth: true }),
      api.get("/api/screens", { skipAuth: true }),
      api.get("/api/theatres", { skipAuth: true }),
    ]).then(([moviesRes, screensRes, theatresRes]) => {
      const backendMovie = (moviesRes.data || []).find((item: any) =>
        item.title?.trim().toLowerCase() === movie.title?.trim().toLowerCase()
      );
      setScreens(screensRes.data || []);
      setTheatres(theatresRes.data || []);
      if (!backendMovie?.id) {
        setShowsError("No CineX shows are scheduled for this movie yet.");
        return null;
      }
      return api.get(`/api/shows/movie/${backendMovie.id}`, { skipAuth: true });
    }).then((showsRes) => {
      if (showsRes?.data) {
        setShows(showsRes.data);
        const dates = [...new Set((showsRes.data as CineXShow[]).map(s => s.showDate))].sort();
        if (dates.length > 0) setSelectedDetailDate(dates[0]);
      }
    }).catch(() => {
      setShowsError("Unable to load showtimes. Please try again.");
    }).finally(() => setShowsLoading(false));
    if (location.pathname !== "/" && location.pathname !== "/movies") {
      navigate("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setCurrentMovie(null);
  };

  const openSeats = (show: CineXShow) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    const screen = screens.find(item => item.id === show.screenId);
    const theatre = screen ? theatres.find(item => item.id === screen.theatreId) : undefined;
    setSelectedShow(show);
    setCurrentShowId(show.id);
    setCurrentTheatre(theatre?.name || "Theatre");
    setCurrentTime(show.showTime);
    setShowSeats([]);
    setSeatsLoading(true);
    setSelectedSeats([]);
    setIsSeatOpen(true);
    api.get(`/api/shows/${show.id}/seats`, { skipAuth: true })
      .then(res => setShowSeats(res.data || []))
      .catch(() => toast.error("Unable to load seats for this show."))
      .finally(() => setSeatsLoading(false));
  };

  const closeSeats = () => {
    if (selectedSeats.length > 0) {
      const showIdVal = currentShowId;
      const clerkId = user ? user.id : "guest_user";
      if (showIdVal == null) return;
      const numIds = selectedSeats.map(s => s.seatId).filter((id): id is number => typeof id === "number");
      if (numIds.length === 0) return;
      api.delete(`/api/shows/${showIdVal}/seats/lock`, {
        headers: { "X-Seat-Lock-Session": lockSessionIdRef.current },
        data: { showId: showIdVal, seatIds: numIds, userId: clerkId, action: "RELEASE" }
      }).catch(() => {});
    }
    setIsSeatOpen(false);
  };

  useEffect(() => {
    if (!isSeatOpen) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      return;
    }

    const showIdVal = currentShowId;
    if (showIdVal == null) return;

    const refreshHeldSeats = () => api.get(`/api/shows/${showIdVal}/seats/held`, { skipAuth: true })
      .then(res => {
        if (!Array.isArray(res.data)) return;

        const heldIds = new Set(res.data.map((seatId: number) => String(seatId)));

        setLiveSeatStatus(prev => {
          const next: Record<string, { status: 'HELD' | 'BOOKED' | 'AVAILABLE'; userId?: string }> = {};
          heldIds.forEach(seatId => {
            const existing = prev[seatId];
            next[seatId] = existing?.status === 'BOOKED'
              ? existing
              : { status: 'HELD', userId: existing?.userId };
          });
          Object.entries(prev).forEach(([seatId, info]) => {
            if (info.status === 'BOOKED') {
              next[seatId] = info;
            }
          });
          return next;
        });

        const expiredSelections = selectedSeatsRef.current.filter(
          seat => typeof seat.seatId === "number" && !heldIds.has(String(seat.seatId))
        );
        if (expiredSelections.length > 0) {
          setSelectedSeats(prev => prev.filter(
            seat => !(typeof seat.seatId === "number" && !heldIds.has(String(seat.seatId)))
          ));
          toast.warning("Seat hold expired", {
            description: `${expiredSelections.map(seat => seat.id).join(", ")} was released. Please select again.`,
          });
        }
      })
      .catch(() => {});
    refreshHeldSeats();
    const heldSeatRefresh = window.setInterval(refreshHeldSeats, 15000);

    // Connect to WebSocket via SockJS
    const socket = new SockJS(`${API_BASE}/ws/seats`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/shows/${showIdVal}/seats`, (message) => {
          if (message.body) {
            try {
              const update = JSON.parse(message.body);
              setLiveSeatStatus(prev => {
                const next = { ...prev };
                if (Array.isArray(update.seatIds)) {
                  update.seatIds.forEach((sid: number | string) => {
                    if (update.status === 'AVAILABLE') {
                      delete next[String(sid)];
                    } else {
                      next[String(sid)] = { status: update.status, userId: update.userId };
                    }
                  });
                }
                return next;
              });
            } catch (e) {}
          }
        });
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      window.clearInterval(heldSeatRefresh);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isSeatOpen, currentMovie, currentShowId, user?.id]);

  const toggleSeat = (id: string, price: number, seatId?: number) => {
    if (seatId == null) {
      toast.info("This seat does not have a backend seat ID yet.");
      return;
    }
    const numId = seatId;
    const showIdVal = currentShowId;
    const clerkId = user ? user.id : "guest_user";
    if (showIdVal == null) {
      toast.info("Real show selection is not available yet.");
      return;
    }
    const isCurrentlySelected = selectedSeats.some(s => s.id === id);

    if (isCurrentlySelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== id));
      api.delete(`/api/shows/${showIdVal}/seats/lock`, {
        headers: { "X-Seat-Lock-Session": lockSessionIdRef.current },
        data: { showId: showIdVal, seatIds: [numId], userId: clerkId, action: "RELEASE" }
      }).catch(() => {});
    } else {
      api.post(`/api/shows/${showIdVal}/seats/lock`, {
        showId: showIdVal, seatIds: [numId], userId: clerkId, action: "SELECT"
      }, {
        headers: { "X-Seat-Lock-Session": lockSessionIdRef.current }
      }).then(res => {
        if (res.data === true || res.status === 200) {
          setSelectedSeats(prev => [...prev, { id, price, seatId }]);
        }
      }).catch(err => {
        if (err.response?.status === 409) {
          toast.warning("Seat Unavailable", { description: `Seat ${id} is currently held by another user. Please choose another seat.` });
        } else {
          toast.error("Seat lock failed. Please try again.");
        }
        api.get(`/api/shows/${showIdVal}/seats`, { skipAuth: true })
          .then(res => setShowSeats(res.data || []))
          .catch(() => {});
      });
    }
  };

  const getSeatStatusClass = (id: string, hardcodedBooked: boolean, seatId?: number, backendStatus?: string) => {
    const numId = seatId == null ? id : String(seatId);
    const liveInfo = liveSeatStatus[numId] || liveSeatStatus[id];
    if (backendStatus === 'BOOKED') return 'booked';
    if (liveInfo && liveInfo.status === 'BOOKED') return 'booked';
    if (liveInfo && liveInfo.status === 'HELD' && liveInfo.userId !== (user ? user.id : "guest_user")) return 'held';
    if (hardcodedBooked) return 'booked';
    if (selectedSeats.some(s => s.id === id)) return 'selected';
    return '';
  };

  const isSeatDisabled = (id: string, hardcodedBooked: boolean, seatId?: number, backendStatus?: string) => {
    const numId = seatId == null ? id : String(seatId);
    const liveInfo = liveSeatStatus[numId] || liveSeatStatus[id];
    if (backendStatus === 'BOOKED') return true;
    if (liveInfo && (liveInfo.status === 'BOOKED' || (liveInfo.status === 'HELD' && liveInfo.userId !== (user ? user.id : "guest_user")))) return true;
    return hardcodedBooked;
  };

  const totalPrice = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const seatsByRow = showSeats.reduce<Record<string, CineXSeat[]>>((rows, seat) => {
    const row = seat.seatNumber.match(/^[A-Za-z]+/)?.[0] || "Seats";
    (rows[row] ||= []).push(seat);
    return rows;
  }, {});

  const selectCity = (city: string) => {
    setCurrentCity(city);
    setCityModalOpen(false);
    setCitySearch("");
  };

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
    c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  const processPayment = () => {
    setProcessing(true);
    setPaymentError("");

    if (!isSignedIn || !user?.id) {
      setProcessing(false);
      openSignIn();
      return;
    }
    
    if (!(window as any).Razorpay) {
      setPaymentError("Razorpay SDK failed to load. Please check your network connection or disable adblockers.");
      setProcessing(false);
      return;
    }

    const reqBody = {
      clerkUserId: user.id,
      showId: currentShowId,
      seatIds: selectedSeats
        .map(seat => seat.seatId)
        .filter((seatId): seatId is number => typeof seatId === "number"),
      movieTitle: currentMovie?.title || "Movie",
      posterPath: currentMovie?.poster_path ? `${IMG_BASE_URL}${currentMovie.poster_path}` : "",
      theatreName: currentTheatre || "CineX Theatre",
      cityName: currentCity || "Chennai",
      showDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      showTime: currentTime || "Now",
      amount: totalPrice
    };

    if (currentShowId == null || reqBody.seatIds.length === 0) {
      setPaymentError("Select a real show and seats before booking.");
      setProcessing(false);
      return;
    }

    // Step 1: Create initial booking in database (PENDING_PAYMENT)
    api.post(`/api/bookings`, reqBody)
      .then(res => {
        const bookingId = res.data.bookingId;
        // Step 2: Create Razorpay Order on backend
        return api.post(`/api/payments/create-order`, {
          bookingId: bookingId,
          clerkUserId: user.id
        }).then(orderRes => {
          const orderData = orderRes.data;
          
          const options = {
            key: orderData.keyId,
            amount: orderData.amountInPaise,
            currency: orderData.currency || "INR",
            name: orderData.name || "CineX",
            description: orderData.description || "Movie Ticket Booking",
            order_id: orderData.orderId,
            handler: function (response: any) {
              setProcessing(true);
              // Step 3: Verify signature on backend
              api.post(`/api/payments/verify`, {
                bookingId: bookingId,
                clerkUserId: user.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              .then(() => {
                setProcessing(false);
                setLastBooking({
                  bookingId,
                  movieTitle: currentMovie?.title || "Movie",
                  posterPath: currentMovie?.poster_path || "",
                  theatreName: currentTheatre || "CineX Theatre",
                  showDate: selectedShow?.showDate || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
                  showTime: currentTime || "Now",
                  seats: selectedSeats.map(s => s.id),
                  totalAmount: totalPrice,
                });
                setPaymentSuccess(true);
                toast.success("Payment Confirmed!", {
                  description: `Your tickets for ${currentMovie?.title || 'the movie'} are ready.`
                });
                fetchUserBookings();
              })
              .catch(verifyErr => {
                console.error("Signature Verification Failed:", verifyErr);
                setPaymentError(getApiErrorMessage(verifyErr, "Payment Verification Failed: Invalid Razorpay signature."));
                setProcessing(false);
              });
            },
            modal: {
              ondismiss: function () {
                setProcessing(false);
                setPaymentError("Payment cancelled by user.");
                toast.error("Payment Cancelled", { description: "You cancelled the checkout transaction." });
                api.post(`/api/payments/cancel?bookingId=${bookingId}`).catch(() => {});
              }
            },
            theme: {
              color: "#E50914"
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", function (resp: any) {
            setProcessing(false);
            setPaymentError("Payment Failed: " + (resp.error?.description || "Transaction failed"));
            api.post(`/api/payments/cancel?bookingId=${bookingId}`).catch(() => {});
          });
          setProcessing(false);
          rzp.open();
        });
      })
      .catch(err => {
        console.error("Payment/Booking Error:", err);
        setPaymentError(getApiErrorMessage(err, "Payment Failed: Seat already booked or server error. Please retry."));
        setProcessing(false);
      });
  };

  const isAdminUser = hasAdminRole(user?.publicMetadata as Record<string, unknown> | undefined);

  useEffect(() => {
    if (!isHistoryOpen || !isSignedIn) {
      return;
    }

    let cancelled = false;
    const loadQrImages = async () => {
      const nextUrls: Record<string, string> = {};
      for (const booking of userBookings) {
        const tokenVal = booking.ticketToken;
        if (!tokenVal) continue;
        try {
          nextUrls[tokenVal] = await fetchAuthenticatedBlobUrl(`/api/tickets/qr/${tokenVal}`);
        } catch {
          // QR preview is optional when ticket token is unavailable.
        }
      }
      if (!cancelled) {
        setTicketQrUrls(nextUrls);
      }
    };

    loadQrImages();
    return () => {
      cancelled = true;
    };
  }, [isHistoryOpen, isSignedIn, userBookings]);

  const filteredShowsForDate = shows.filter(s => !selectedDetailDate || s.showDate === selectedDetailDate);
  const showDates = [...new Set(shows.map(s => s.showDate))].sort();

  const formatShowDate = (dateStr: string) => {
    if (!dateStr) return "TODAY";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr.toUpperCase();
    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase();
  };

  const renderFooter = () => (
    <footer className="cx-footer">
      <div className="cx-footer-logo">CINEX</div>
      <div className="cx-footer-links">
        <Link to="/about">Sitemap</Link>
        <Link to="/support">Legal</Link>
        <Link to="/support">Support</Link>
        <Link to="/settings">Terms of Service</Link>
      </div>
      <p className="cx-footer-copy">© 2024 CineX. All rights reserved.</p>
    </footer>
  );

  const renderMobileNav = () => (
    <nav className="cx-mobile-nav">
      <div className="cx-mobile-nav-inner">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}><Film size={20} />Movies</Link>
        <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLInputElement>(".cx-search input")?.focus(); }}><Search size={20} />Search</a>
        <a href="#" className={isHistoryOpen ? "active" : ""} onClick={(e) => { e.preventDefault(); setIsHistoryOpen(true); }}><Ticket size={20} />Bookings</a>
        <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""}><User size={20} />Profile</Link>
      </div>
    </nav>
  );

  if (isAdminOpen) {
    return <AdminPortal onExit={() => setIsAdminOpen(false)} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <Toaster position="top-right" theme="dark" richColors />

      {/* ===== HEADER ===== */}
      <header className="cx-header">
        <div className="cx-header-inner">
          <div className="cx-logo" onClick={() => { closeDetail(); setIsHistoryOpen(false); navigate("/"); }}>CINEX</div>
          <nav className="cx-nav">
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>Movies</Link>
            <Link to="/events" className={location.pathname === "/events" ? "active" : ""}>Theatres</Link>
          </nav>
          <div className="cx-search">
            <Search size={16} color="var(--text3)" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="cx-header-actions">
            <button className="cx-location" onClick={() => setCityModalOpen(true)}>
              <MapPin size={16} /> Location
            </button>
            <div id="auth-section">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="cx-btn-signin">Sign In</button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div className="cx-user-menu">
                  <Link to="/profile" className="cx-hide-mobile">Profile</Link>
                  {isAdminUser && (
                    <span onClick={() => setIsAdminOpen(true)} style={{ cursor: "pointer" }}>Admin</span>
                  )}
                  <span onClick={() => setIsHistoryOpen(true)} style={{ cursor: "pointer" }}>Tickets</span>
                  <Link to="/wishlist" className="cx-hide-mobile">Wishlist ({wishlistCount})</Link>
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main>
        {apiError && (
          <div className="cx-error-banner">
            Could not connect to the backend server. Please verify Spring Boot is running on port 8081.
          </div>
        )}

        <Routes>
          <Route path="/" element={
            loading ? (
              <div className="cx-page">
                <div className="cx-section-head"><h2 className="cx-section-title">Loading...</h2></div>
                <div className="cx-movie-row">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="cx-movie-card">
                      <div className="shad-skeleton cx-poster-wrap" style={{ aspectRatio: "2/3" }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {carouselMovies.length > 0 && !searchQuery && (
                  <section className="cx-hero" style={{ marginTop: "1.5rem" }}>
                    {carouselMovies.map((movie, idx) => (
                      <div key={movie.id} style={{ display: idx === currentSlide ? "block" : "none", position: "absolute", inset: 0 }}>
                        <div
                          className="cx-hero-bg"
                          style={{ backgroundImage: `url(${IMG_ORIGINAL_URL}${movie.backdrop_path})` }}
                        />
                        <div className="cx-hero-overlay" />
                        <div className="cx-hero-content">
                          <div className="cx-hero-tags">
                            <span className="cx-tag">IMAX</span>
                            <span className="cx-tag">{getGenreList(movie.genre_ids)[0] || "ACTION"}</span>
                            <span className="cx-tag">{movie.adult ? "R" : "PG-13"}</span>
                          </div>
                          <h1 className="cx-hero-title">{movie.title}</h1>
                          <p className="cx-hero-desc">{movie.overview || "Experience premium cinema with IMAX and Dolby Atmos."}</p>
                          <div className="cx-hero-actions">
                            <button className="btn-primary" onClick={() => handleMovieClick(movie)}>
                              <Ticket size={16} /> Book Tickets
                            </button>
                            <button className="btn-outline" onClick={() => toast.info("Trailer", { description: `Trailer for ${movie.title}` })}>
                              <Play size={16} /> Watch Trailer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {carouselMovies.length > 1 && (
                      <div className="cx-carousel-dots">
                        {carouselMovies.map((_, idx) => (
                          <button key={idx} className={`cx-dot ${idx === currentSlide ? "active" : ""}`} onClick={() => setCurrentSlide(idx)} aria-label={`Slide ${idx + 1}`} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                <div className="cx-page">
                  <section className="cx-section">
                    <div className="cx-section-head">
                      <h2 className="cx-section-title">Now Showing</h2>
                      <div className="cx-filters">
                        <button className="cx-filter-btn">All Genres</button>
                        <button className="cx-filter-btn">Any Format</button>
                      </div>
                    </div>
                    <div className="cx-movie-row">
                      {filterMovies(moviesNowPlaying).map(m => (
                        <div key={m.id} className="cx-movie-card" onClick={() => handleMovieClick(m)}>
                          <div className="cx-poster-wrap">
                            <img src={m.poster_path?.startsWith("http") ? m.poster_path : `${IMG_BASE_URL}${m.poster_path}`} alt={m.title} loading="lazy" />
                            <span className="cx-rating-badge"><Star size={10} fill="var(--gold)" color="var(--gold)" /> {(m.vote_average || 8).toFixed(1)}</span>
                            {toggleWishlist && (
                              <button className="cx-wish-btn" onClick={(e) => { e.stopPropagation(); toggleWishlist(m); }}>
                                <Heart size={14} fill={isWishlisted(m.id) ? "var(--coral)" : "none"} color={isWishlisted(m.id) ? "var(--coral)" : "#fff"} />
                              </button>
                            )}
                          </div>
                          <div className="cx-movie-title">{m.title}</div>
                          <div className="cx-movie-meta">{getGenres(m.genre_ids)} • 2h 15m</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="cx-section">
                    <div className="cx-section-head">
                      <h2 className="cx-section-title">Coming Soon</h2>
                      <span className="cx-section-link">View All</span>
                    </div>
                    <div className="cx-coming-list">
                      {filterMovies(moviesUpcoming).slice(0, 4).map(m => (
                        <div key={m.id} className="cx-coming-card" onClick={() => handleMovieClick(m)}>
                          <div className="cx-coming-thumb">
                            <img src={m.poster_path?.startsWith("http") ? m.poster_path : `${IMG_BASE_URL}${m.poster_path}`} alt={m.title} loading="lazy" />
                          </div>
                          <div>
                            <div className="cx-coming-date">{m.release_date ? new Date(m.release_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() : "SOON"}</div>
                            <div className="cx-coming-title">{m.title}</div>
                            <div className="cx-coming-desc">{(m.overview || "").slice(0, 100)}{(m.overview || "").length > 100 ? "..." : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="cx-section">
                    <div className="cx-section-head">
                      <h2 className="cx-section-title">Trending Now</h2>
                    </div>
                    <div className="cx-trending-grid">
                      {filterMovies(moviesTrending).slice(0, 3).map((m, idx) => (
                        <div key={m.id} className={`cx-trend-card ${idx === 0 ? "featured" : ""}`} onClick={() => handleMovieClick(m)}>
                          <div className="cx-trend-bg" style={{ backgroundImage: `url(${IMG_ORIGINAL_URL}${m.backdrop_path || m.poster_path})` }} />
                          <div className="cx-trend-overlay" />
                          <span className="cx-trend-rank">{idx + 1}</span>
                          <div className="cx-trend-body">
                            {idx === 0 && <div className="cx-trend-label">#1 AT BOX OFFICE</div>}
                            <div className="cx-trend-title">{m.title}</div>
                            <div className="cx-trend-sub">{idx === 0 ? (m.overview || "").slice(0, 80) : idx === 1 ? "Critics Choice" : "Family Favorite"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                {renderFooter()}
              </>
            )
          } />
          <Route path="/movies" element={<Navigate to="/" replace />} />
          <Route path="/stream" element={<FeaturePage title="Stream & OTT Live" category="4K Ultra HD Streaming" icon={<Tv className="w-10 h-10 text-[#FF3D5A]" />} description="Stream premier blockbusters, CineX Originals, and live TV broadcasts directly in 4K HDR with Dolby Atmos sound." previewItems={[
            { title: "CineX Originals Vault", subtitle: "Exclusive award-winning web series and movies", badge: "4K HDR", tag: "Dolby Atmos" },
            { title: "Live Sports Broadcasts", subtitle: "Watch Premier League and IPL live matches with interactive stats", badge: "Live 60fps", tag: "Sports" },
            { title: "Offline Download Vault", subtitle: "Download in Ultra HD for seamless offline viewing during travel", badge: "Offline", tag: "Mobile & PC" }
          ]} />} />
          <Route path="/events" element={<FeaturePage title="Concerts & Live Events" category="Music & Festivals" icon={<Sparkles className="w-10 h-10 text-[#FFD166]" />} description="Book VIP passes, stadium arena tickets, and front-row seats for international music tours, concerts, and live stand-up comedy." previewItems={[
            { title: "Global Artist Tours 2026", subtitle: "Priority booking queue for international pop and rock stadium tours", badge: "VIP Access", tag: "Arena Stage" },
            { title: "EDM & Music Festivals", subtitle: "3-day festival wristbands with backstage lounge access", badge: "Early Bird", tag: "Festival" },
            { title: "Live Stand-Up Comedy", subtitle: "Intimate club tables and front-row seats for top comedians", badge: "Fast Selling", tag: "Comedy Club" }
          ]} />} />
          <Route path="/plays" element={<FeaturePage title="Theatre & Stage Plays" category="Drama & Performing Arts" icon={<Film className="w-10 h-10 text-[#10B981]" />} description="Experience the magic of live theatre, Broadway musicals, classical drama, and experimental stage performances in premium auditoriums." previewItems={[
            { title: "Broadway & Musicals Showcase", subtitle: "Spectacular stage productions with full live orchestra", badge: "Front Row", tag: "Royal Theatre" },
            { title: "Classical Indian Drama", subtitle: "Timeless mythological and historical stage plays by veteran directors", badge: "Acclaimed", tag: "Auditorium" },
            { title: "Experimental & Indie Stage", subtitle: "Modern thought-provoking plays from emerging playwrights", badge: "Exclusive", tag: "Studio Stage" }
          ]} />} />
          <Route path="/sports" element={<FeaturePage title="Live Sports & IPL Tickets" category="Stadium VIP Box" icon={<Trophy className="w-10 h-10 text-[#E50914]" />} description="Secure official tickets for IPL cricket matches, football derbies, Formula 1 grandstands, and international tournaments." previewItems={[
            { title: "IPL 2026 VIP Box Hospitality", subtitle: "Air-conditioned corporate suites with complimentary gourmet catering", badge: "Hospitality", tag: "Cricket Stadium" },
            { title: "ISL & Football Derbies", subtitle: "Atmospheric fan stands and midfield premium seating", badge: "Live Match", tag: "Football Arena" },
            { title: "Formula 1 Grandstand Passes", subtitle: "Unrivaled views of start/finish straights and pit lane action", badge: "Paddock Club", tag: "Motor Racing" }
          ]} />} />
          <Route path="/activities" element={<FeaturePage title="Adventures & Weekend Activities" category="Outdoors & Exploration" icon={<Compass className="w-10 h-10 text-[#60A5FA]" />} description="Discover thrilling adventure sports, amusement park day passes, scuba diving workshops, and curated weekend getaways." previewItems={[
            { title: "Theme Park VIP FastPass", subtitle: "Skip all roller coaster queues with unlimited priority access", badge: "FastPass", tag: "Amusement Park" },
            { title: "Scuba Diving & Water Sports", subtitle: "Certified instructor-led underwater diving and jet ski expeditions", badge: "Certified", tag: "Beach & Ocean" },
            { title: "Weekend Camping & Trekking", subtitle: "Stargazing camps with bonfire acoustic nights and trekking guides", badge: "All-Inclusive", tag: "Mountain Hills" }
          ]} />} />
          <Route path="/gift-cards" element={<FeaturePage title="CineX VIP Gift Cards" category="Digital Cinema Gifting" icon={<Gift className="w-10 h-10 text-[#FFD166]" />} description="Give the gift of premier cinema and entertainment. Instant email & WhatsApp delivery with personalized video messages and no expiry." previewItems={[
            { title: "Platinum Collector's Gift Card", subtitle: "Loaded with ₹10,000 credit + complimentary gourmet popcorn vouchers", badge: "Best Seller", tag: "Platinum Edition" },
            { title: "Anniversary & Birthday E-Cards", subtitle: "Customizable theme designs delivered instantly on special occasions", badge: "Instant", tag: "Digital Gift" },
            { title: "Corporate Bulk Gifting", subtitle: "Special employee rewards and client gifting packages with invoice tax benefits", badge: "Corporate", tag: "Bulk Orders" }
          ]} />} />
          <Route path="/offers" element={<FeaturePage title="CineX Bank Offers & Discounts" category="Exclusive Savings" icon={<Sparkles className="w-10 h-10 text-[#FF3D5A]" />} description="Unlock Buy 1 Get 1 Free tickets, 50% weekend cashbacks, and complimentary F&B combos with partner bank credit and debit cards." previewItems={[
            { title: "ICICI & HDFC Bank 50% Off", subtitle: "Get up to ₹500 discount on weekend cinema bookings with select credit cards", badge: "BOGO Offer", tag: "Bank Partner" },
            { title: "CineX VIP Loyalty Cashback", subtitle: "Earn 10% instant CineX Coins on every ticket booked through the app", badge: "Loyalty", tag: "CineX Rewards" },
            { title: "Student Super Saver Pass", subtitle: "Special flat 30% discount on weekday matinee shows with valid student ID", badge: "Student Special", tag: "Weekday Shows" }
          ]} />} />
          <Route path="/support" element={<FeaturePage title="24/7 VIP Help & Customer Support" category="Dedicated Support Desk" icon={<Headphones className="w-10 h-10 text-[#FFD166]" />} description="Our VIP customer concierge is available 24/7 to assist with ticket cancellations, instant refunds, seat upgrades, and technical inquiries." previewItems={[
            { title: "Instant AI & Live Chat Support", subtitle: "Connect with a dedicated human support specialist within 30 seconds", badge: "Live Now", tag: "24/7 Desk" },
            { title: "Automated Ticket Cancellation & Refund", subtitle: "Initiate 100% instant refund directly to your original payment method", badge: "Instant", tag: "Self-Service" },
            { title: "Lost QR Ticket Recovery", subtitle: "Resend ticket SMS and email confirmations instantly with 1 click", badge: "Recovery", tag: "Ticket Vault" }
          ]} />} />
          <Route path="/settings" element={<FeaturePage title="Account Settings & Preferences" category="Privacy & Notifications" icon={<Settings className="w-10 h-10 text-[#10B981]" />} description="Customize your cinema experience, manage saved payment methods, set default cities, and configure instant WhatsApp showtime alerts." previewItems={[
            { title: "WhatsApp & SMS Show Alerts", subtitle: "Get instant seat availability alerts when bookings open for blockbuster movies", badge: "Alerts", tag: "Notifications" },
            { title: "Biometric & 2FA Security", subtitle: "Secure your ticket vault and saved cards with FaceID and PIN verification", badge: "Security", tag: "Privacy Vault" },
            { title: "Default Cinema Preferences", subtitle: "Set preferred theatre chains, IMAX screen formats, and seat row locations", badge: "Customization", tag: "Preferences" }
          ]} />} />
          <Route path="/about" element={<FeaturePage title="About CineX Engineering" category="Production Architecture" icon={<Code className="w-10 h-10 text-[#E50914]" />} description="CineX is a production-grade, interview-ready cinema ticket reservation platform engineered with Spring Boot 3, Spring Data JPA, STOMP WebSockets, Clerk JWT Auth, and Razorpay Payments." previewItems={[
            { title: "Real-Time STOMP WebSockets", subtitle: "Sub-50ms live seat lock broadcasting across all connected users without page refresh", badge: "Spring WebSocket", tag: "Real-Time" },
            { title: "Pessimistic Locking & Concurrency", subtitle: "ACID database transactions preventing duplicate seat reservations during high demand", badge: "JPA & PostgreSQL", tag: "Concurrency" },
            { title: "Resilient Circuit Breaker Catalog", subtitle: "Defensive API fallbacks ensuring 100% uptime even if external TMDB APIs go offline", badge: "Resilience", tag: "High Availability" }
          ]} />} />
          <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} onRemove={removeWishlist} onBookMovie={m => handleMovieClick(m)} />} />
          <Route path="/profile" element={<ProfilePage wishlistCount={wishlistCount} bookingsCount={userBookings.length} onOpenBookings={() => setIsHistoryOpen(true)} />} />
          <Route path="/my-bookings" element={<ProfilePage wishlistCount={wishlistCount} bookingsCount={userBookings.length} onOpenBookings={() => setIsHistoryOpen(true)} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ── City Picker Modal ── */}
      <AnimatePresence>
        {cityModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay active"
            onClick={() => { setCityModalOpen(false); setCitySearch(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="city-modal shad-card"
              onClick={e => e.stopPropagation()}
            >
              <div className="city-modal-header">
                <h2>📍 Select Your City</h2>
                <button className="btn-close-modal" onClick={() => { setCityModalOpen(false); setCitySearch(""); }}>✕</button>
              </div>
              <div className="city-modal-search">
                <input
                  type="text"
                  placeholder="Search for your city..."
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="city-modal-grid">
                {filteredCities.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", textAlign: "center", gridColumn: "1 / -1", padding: "2rem" }}>No cities matching your search</p>
                ) : (
                  filteredCities.map(c => (
                    <div
                      key={c.name}
                      className={`city-card ${c.name === currentCity ? "active" : ""}`}
                      onClick={() => selectCity(c.name)}
                    >
                      <div className="city-card-emoji">{c.emoji}</div>
                      <div className="city-card-name">{c.name}</div>
                      <div className="city-card-state">{c.state}</div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Movie Detail Full-Screen View ── */}
      <div className={`movie-detail-view ${isDetailOpen ? "active" : ""}`} ref={detailRef}>
        {currentMovie && (
          <>
            <div className="detail-hero">
              <div className="detail-backdrop" style={{ backgroundImage: `url(${IMG_ORIGINAL_URL}${currentMovie.backdrop_path})` }} />
              <button className="detail-back" onClick={closeDetail}><ArrowLeft size={18} /></button>
              <div className="detail-hero-inner">
                <div className="detail-poster">
                  <img src={`${IMG_BASE_URL}${currentMovie.poster_path}`} alt={currentMovie.title} />
                </div>
                <div className="detail-info">
                  <h1 className="detail-title">{currentMovie.title}</h1>
                  <div className="detail-badges">
                    <span className="detail-rating"><Star size={14} fill="var(--coral)" color="var(--coral)" /> {(currentMovie.vote_average || 8.4).toFixed(1)}</span>
                    <span className="detail-pill-tag">2h 34m</span>
                    <span className="detail-pill-tag">{getLangLabel(currentMovie.original_language)}</span>
                    <span className="detail-pill-tag">{getGenres(currentMovie.genre_ids)}</span>
                    <span className="detail-pill-tag">IMAX 3D</span>
                    <span className="detail-pill-tag">4DX</span>
                  </div>
                  <p className="detail-overview">
                    {currentMovie.overview || "Witness the ultimate entertainment spectacle with state-of-the-art Dolby Atmos and IMAX laser projection."}
                  </p>
                  <button className="btn-outline" onClick={() => toast.info("Trailer", { description: `Playing trailer for ${currentMovie.title}` })}>
                    <Play size={16} /> Watch Trailer
                  </button>
                </div>
              </div>
            </div>

            <div className="theatres-section" id="theatres-scroll-target">
              {showDates.length > 0 && (
                <div className="cx-date-row">
                  <div className="cx-date-label">SELECT DATE</div>
                  <div className="cx-date-pills">
                    {showDates.map(date => (
                      <button
                        key={date}
                        className={`cx-date-pill ${selectedDetailDate === date ? "active" : ""}`}
                        onClick={() => { setSelectedDetailDate(date); setSelectedShow(null); }}
                      >
                        {formatShowDate(date)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showsLoading && <p style={{ color: "var(--text2)" }}>Loading showtimes...</p>}
              {!showsLoading && showsError && <p style={{ color: "var(--text2)" }}>{showsError}</p>}
              {!showsLoading && !showsError && filteredShowsForDate.length === 0 && (
                <p style={{ color: "var(--text2)" }}>No shows available for this date.</p>
              )}

              {filteredShowsForDate.map(show => {
                const screen = screens.find(item => item.id === show.screenId);
                const theatre = screen ? theatres.find(item => item.id === screen.theatreId) : undefined;
                const isSelected = selectedShow?.id === show.id;
                const soldOut = show.availableSeats <= 0;
                return (
                  <div key={show.id} className="theatre-card">
                    <div className="theatre-info">
                      <h3>{theatre?.name || "CineX Theatre"}</h3>
                      <p>{theatre?.city || currentCity} • {screen?.screenName || `Screen ${show.screenId}`}</p>
                      <p>{show.availableSeats} seats available</p>
                    </div>
                    <div className="showtimes-list">
                      <button
                        className={`showtime-pill ${isSelected ? "active" : ""} ${soldOut ? "sold-out" : ""}`}
                        disabled={soldOut}
                        onClick={() => {
                          if (soldOut) return;
                          const scr = screens.find(item => item.id === show.screenId);
                          const th = scr ? theatres.find(item => item.id === scr.theatreId) : undefined;
                          setSelectedShow(show);
                          setCurrentTheatre(th?.name || "CineX Theatre");
                          setCurrentTime(show.showTime);
                        }}
                      >
                        <span className="showtime-time">{show.showTime}</span>
                        <span className="showtime-type">{show.showDate} • ₹{show.price}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedShow && (
              <div className="cx-show-bar">
                <div className="cx-show-bar-info">
                  {(() => {
                    const scr = screens.find(item => item.id === selectedShow.screenId);
                    const th = scr ? theatres.find(item => item.id === scr.theatreId) : undefined;
                    return th?.name || "CineX Theatre";
                  })()}
                  <strong>{selectedShow.showTime} • {selectedShow.showDate}</strong>
                </div>
                <button className="btn-primary" onClick={() => openSeats(selectedShow)}>Select Seats</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Seat Selection Modal (with Aisles) ── */}
      <div className={`seat-selection-view ${isSeatOpen ? "active" : ""}`}>
        <div className="seat-header">
          <button className="btn-close-modal" onClick={closeSeats}><ArrowLeft size={18} /></button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div className="cx-logo" style={{ fontSize: "1.1rem", marginBottom: ".25rem" }}>CINEX</div>
            <div className="seat-header-info">
              <h2>{currentMovie?.title}</h2>
              <p>Today, {currentTime} • {screens.find(s => s.id === selectedShow?.screenId)?.screenName || "IMAX Screen 1"}</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={closeSeats}>✕</button>
        </div>

        <div className="seat-scroll-container">
          <div className="screen-wrapper">
            <span className="screen-label">SCREEN</span>
            <div className="screen-bar" />
          </div>

          <div className="seat-legend">
            <span className="legend-item"><div className="legend-box avail" /> Available</span>
            <span className="legend-item"><div className="legend-box sel" /> Selected</span>
            <span className="legend-item"><div className="legend-box prem" /> Premium Recliner</span>
            <span className="legend-item"><div className="legend-box held" style={{ background: "rgba(245, 158, 11, 0.3)", border: "1px dashed #f59e0b" }} /> Held (Live)</span>
            <span className="legend-item"><div className="legend-box booked" /> Booked / Sold</span>
          </div>

          {seatsLoading && <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading real seats...</p>}
          {!seatsLoading && showSeats.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No seats are configured for this show.</p>}
          {!seatsLoading && showSeats.length > 0 && (
            <div className="seating-chart">
              {Object.entries(seatsByRow).map(([row, seats]) => (
                <div key={row} className="seat-row">
                  <div className="row-label">{row}</div>
                  {seats.map(seat => {
                    const isBooked = seat.status === "BOOKED";
                    const isHeld = liveSeatStatus[String(seat.seatId)]?.status === "HELD";
                    const isSelected = selectedSeats.some(item => item.seatId === seat.seatId);
                    return (
                      <button
                        key={seat.seatId}
                        className={`seat-btn ${seat.seatType?.toLowerCase() || ""} ${isBooked ? "booked" : isHeld ? "held" : isSelected ? "selected" : ""}`}
                        disabled={isBooked || (isHeld && liveSeatStatus[String(seat.seatId)]?.userId !== (user ? user.id : "guest_user"))}
                        title={`${seat.seatNumber} • ${seat.seatType} • ₹${seat.price}`}
                        onClick={() => toggleSeat(seat.seatNumber, seat.price, seat.seatId)}
                      >{seat.seatNumber}</button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="seating-chart" style={{ display: "none" }}>
            {/* Executive Tier */}
            <div className="seat-tier-section">
              <div className="tier-label">👑 EXECUTIVE RECLINERS – ₹350</div>
              {["A", "B"].map(r => (
                <div key={r} className="seat-row">
                  <div className="row-label">{r}</div>
                  {/* Left block (1-4) */}
                  {[1, 2, 3, 4].map(i => {
                    const id = `${r}${i}`;
                    const hardcodedBooked = (r === "A" && i === 2) || (r === "B" && i === 3);
                    return (
                      <button
                        key={id}
                        className={`seat-btn premium ${getSeatStatusClass(id, hardcodedBooked)}`}
                        disabled={isSeatDisabled(id, hardcodedBooked)}
                        onClick={() => toggleSeat(id, 350)}
                      >{i}</button>
                    );
                  })}
                  <div className="aisle-gap" />
                  {/* Middle block (5-10) */}
                  {[5, 6, 7, 8, 9, 10].map(i => {
                    const id = `${r}${i}`;
                    const hardcodedBooked = (r === "A" && (i === 6 || i === 7));
                    return (
                      <button
                        key={id}
                        className={`seat-btn premium ${getSeatStatusClass(id, hardcodedBooked)}`}
                        disabled={isSeatDisabled(id, hardcodedBooked)}
                        onClick={() => toggleSeat(id, 350)}
                      >{i}</button>
                    );
                  })}
                  <div className="aisle-gap" />
                  {/* Right block (11-14) */}
                  {[11, 12, 13, 14].map(i => {
                    const id = `${r}${i}`;
                    return (
                      <button
                        key={id}
                        className={`seat-btn premium ${getSeatStatusClass(id, false)}`}
                        disabled={isSeatDisabled(id, false)}
                        onClick={() => toggleSeat(id, 350)}
                      >{i}</button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Club Tier */}
            <div className="seat-tier-section">
              <div className="tier-label">⭐ CLUB CLASS – ₹220</div>
              {["C", "D", "E", "F", "G"].map(r => (
                <div key={r} className="seat-row">
                  <div className="row-label">{r}</div>
                  {/* Left block (1-4) */}
                  {[1, 2, 3, 4].map(i => {
                    const id = `${r}${i}`;
                    const hardcodedBooked = (r === "C" && i === 1) || (r === "E" && i === 4) || (r === "F" && i === 2);
                    return (
                      <button
                        key={id}
                        className={`seat-btn ${getSeatStatusClass(id, hardcodedBooked)}`}
                        disabled={isSeatDisabled(id, hardcodedBooked)}
                        onClick={() => toggleSeat(id, 220)}
                      >{i}</button>
                    );
                  })}
                  <div className="aisle-gap" />
                  {/* Middle block (5-10) */}
                  {[5, 6, 7, 8, 9, 10].map(i => {
                    const id = `${r}${i}`;
                    const hardcodedBooked = (r === "D" && (i === 5 || i === 8)) || (r === "G" && i === 7);
                    return (
                      <button
                        key={id}
                        className={`seat-btn ${getSeatStatusClass(id, hardcodedBooked)}`}
                        disabled={isSeatDisabled(id, hardcodedBooked)}
                        onClick={() => toggleSeat(id, 220)}
                      >{i}</button>
                    );
                  })}
                  <div className="aisle-gap" />
                  {/* Right block (11-14) */}
                  {[11, 12, 13, 14].map(i => {
                    const id = `${r}${i}`;
                    const hardcodedBooked = (r === "E" && i === 12) || (r === "F" && (i === 13 || i === 14));
                    return (
                      <button
                        key={id}
                        className={`seat-btn ${getSeatStatusClass(id, hardcodedBooked)}`}
                        disabled={isSeatDisabled(id, hardcodedBooked)}
                        onClick={() => toggleSeat(id, 220)}
                      >{i}</button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Screen Visualization */}
            <div className="screen-wrapper">
              <div className="screen-arc" />
              <p>IMAX DUAL LASER SCREEN • ALL EYES THIS WAY</p>
            </div>
          </div>
        </div>

        <div className="seat-footer">
          <div className="seat-footer-info">
            <p style={{ fontSize: ".7rem", letterSpacing: ".1em", color: "var(--text3)", marginBottom: ".2rem" }}>SELECTED SEATS</p>
            <h3>{selectedSeats.length > 0 ? `${selectedSeats.map(s => s.id).join(", ")} (₹${totalPrice})` : "None"}</h3>
          </div>
          <button
            className="btn-primary"
            disabled={selectedSeats.length === 0}
            onClick={() => {
              if (!isSignedIn) {
                openSignIn();
              } else {
                setPaymentError("");
                setPaymentSuccess(false);
                setIsPaymentOpen(true);
              }
            }}
          >
            Proceed →
          </button>
        </div>
      </div>

      {/* ── Checkout & Payment Modal ── */}
      <div
        className={`modal-overlay ${isPaymentOpen ? "active" : ""}`}
        onClick={() => !processing && setIsPaymentOpen(false)}
      >
        <div className="payment-modal" onClick={e => e.stopPropagation()}>
          {paymentSuccess && lastBooking ? (
            <div className="cx-success-view">
              <div className="cx-success-icon">✓</div>
              <h2 className="cx-success-title">Payment Successful</h2>
              <p className="cx-success-sub">Your tickets have been secured.</p>
              <div className="cx-ticket-card">
                <div className="cx-ticket-top">
                  <span className="cx-logo" style={{ fontSize: "1rem" }}>CINEX</span>
                  <span className="cx-ticket-vip">VIP SCREENING</span>
                </div>
                <div className="cx-ticket-movie">
                  <img src={lastBooking.posterPath?.startsWith("http") ? lastBooking.posterPath : `${IMG_BASE_URL}${lastBooking.posterPath}`} alt="" style={{ width: 60, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase" }}>{lastBooking.movieTitle}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text2)", marginTop: ".25rem" }}>IMAX 70MM • SCI-FI</div>
                    <div style={{ color: "var(--gold)", fontSize: ".85rem", marginTop: ".35rem" }}>★ 9.4 / 10</div>
                  </div>
                </div>
                <img className="cx-ticket-qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`CNX-${lastBooking.bookingId}`)}`} alt="QR" />
                <div className="cx-ticket-grid">
                  <div><span>THEATRE</span>{lastBooking.theatreName}</div>
                  <div><span>SCREEN</span>IMAX 1</div>
                  <div><span>DATE</span>{lastBooking.showDate}</div>
                  <div><span>TIME</span>{lastBooking.showTime}</div>
                  <div style={{ gridColumn: "1 / -1" }}><span>SEATS</span><span className="cx-ticket-seats">{lastBooking.seats.join(", ")}</span></div>
                </div>
                <div className="cx-ticket-footer">
                  <div><span style={{ fontSize: ".65rem", color: "var(--text3)" }}>BOOKING ID</span><div>#CNX-{lastBooking.bookingId}</div></div>
                  <div style={{ textAlign: "right" }}><span style={{ fontSize: ".65rem", color: "var(--text3)" }}>TOTAL PAID</span><div className="cx-ticket-total">₹{lastBooking.totalAmount}</div></div>
                </div>
              </div>
              <div className="cx-success-actions">
                <button className="cx-pay-btn" onClick={() => toast.info("Download", { description: "Check your Ticket Vault for PDF download." })}>
                  <Download size={18} /> Download Ticket
                </button>
                <div style={{ display: "flex", gap: ".75rem" }}>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => toast.info("Added to calendar")}><Calendar size={16} /> Add to Calendar</button>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => {
                    setPaymentSuccess(false);
                    setIsPaymentOpen(false);
                    setIsSeatOpen(false);
                    closeDetail();
                    setSelectedSeats([]);
                  }}><Home size={16} /> Back to Home</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="cx-checkout-logo">CINEX</div>
              <button className="cx-checkout-back" onClick={() => setIsPaymentOpen(false)}>
                <ArrowLeft size={16} /> Back to Seat Selection
              </button>

              <div className="cx-checkout-grid">
                <div className="cx-checkout-card">
                  <h3>Order Summary</h3>
                  <div className="cx-order-movie">
                    <div className="cx-order-poster">
                      <img src={currentMovie?.poster_path?.startsWith("http") ? currentMovie.poster_path : `${IMG_BASE_URL}${currentMovie?.poster_path}`} alt="" />
                    </div>
                    <div>
                      <div className="cx-order-title">{currentMovie?.title}</div>
                      <div className="cx-order-tags">
                        <span className="cx-tag">IMAX 2D</span>
                        <span className="cx-tag">R</span>
                      </div>
                      <div className="cx-order-meta">
                        <span><MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{currentTheatre}</span>
                        <span><Calendar size={12} style={{ display: "inline", marginRight: 4 }} />{selectedShow?.showDate} • {currentTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cx-seat-tags">
                    {selectedSeats.map(s => <span key={s.id} className="cx-seat-tag">{s.id}</span>)}
                  </div>
                </div>

                <div className="cx-checkout-card">
                  <h3>Payment Summary</h3>
                  <div className="summary-row">
                    <span>Tickets ({selectedSeats.length} × ₹{selectedSeats.length ? Math.round(totalPrice / selectedSeats.length) : 0})</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="summary-row"><span>Convenience Fee</span><span>Waived</span></div>
                  <div className="summary-row"><span>Taxes</span><span>Included</span></div>
                  <div className="summary-row total"><span>Total</span><span>₹{totalPrice}</span></div>
                </div>
              </div>

              <div className="cx-contact-section">
                <h3>Contact Information</h3>
                <div className="cx-field">
                  <label>Email Address</label>
                  <input type="email" defaultValue={user?.primaryEmailAddress?.emailAddress || ""} readOnly />
                </div>
                <div className="cx-field">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>

              {paymentError && (
                <div className="cx-error-banner" style={{ marginBottom: "1rem" }}>{paymentError}</div>
              )}

              <button className="cx-pay-btn" disabled={processing} onClick={processPayment}>
                <Lock size={16} /> {processing ? "Processing..." : "Complete Payment"}
              </button>
              <p className="cx-secure-note"><Shield size={12} style={{ display: "inline", marginRight: 4 }} />Secure SSL Checkout</p>
            </>
          )}
        </div>
      </div>

      {/* ── Booking History Modal (with QR Code Placeholder) ── */}
      <div
        className={`modal-overlay ${isHistoryOpen ? "active" : ""}`}
        onClick={() => setIsHistoryOpen(false)}
      >
        <div className="history-modal" onClick={e => e.stopPropagation()}>
          <div className="city-modal-header" style={{ padding: "1.5rem 2rem" }}>
            <h2>🎟️ Your Ticket Vault</h2>
            <button className="btn-close-modal" onClick={() => setIsHistoryOpen(false)}>✕</button>
          </div>

          <div className="history-scroll">
            {userBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
                <h3 style={{ marginBottom: "0.5rem", color: "var(--text-secondary)" }}>No Tickets Yet</h3>
                <p style={{ fontSize: "0.9rem" }}>Book your first cinematic experience with CineX today.</p>
              </div>
            ) : (
              userBookings.map((b, i) => {
                const posterImg = b.posterPath ? (b.posterPath.startsWith('http') ? b.posterPath : `https://image.tmdb.org/t/p/w300${b.posterPath}`) : b.poster;
                const movieName = b.movieTitle || b.movie || "Cinema Feature";
                const theatreName = b.theatreName || b.theatre || "CineX IMAX";
                const statusStr = b.bookingStatus || b.status || "CONFIRMED";
                const showTimeStr = b.showTime || b.time || "18:00";
                const showDateStr = b.showDate || b.date || "Today";
                const seatsList = b.seatNumbers || b.seats || ["A1"];
                const amountVal = b.totalAmount || b.total || 0;
                const bookingIdVal = b.bookingId || (b.id ? String(b.id).replace('CNX-', '') : 8000 + i);
                const tokenVal = b.ticketToken || (b.bookingId ? `TOKEN-CNX-${b.bookingId}` : null);

                return (
                <div key={bookingIdVal || i} className="ticket-card">
                  <div className="ticket-poster">
                    <img src={posterImg} alt={movieName} />
                  </div>

                  <div className="ticket-details">
                    <div>
                      <div className="ticket-title-row">
                        <h3>{movieName}</h3>
                        <span className="ticket-status-badge">✓ {statusStr}</span>
                      </div>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "0.2rem" }}>
                        📍 {theatreName}
                      </p>
                    </div>

                    <div className="ticket-meta-grid">
                      <div className="ticket-meta-item">
                        <span>SHOWTIME</span>
                        <span>{showTimeStr}</span>
                      </div>
                      <div className="ticket-meta-item">
                        <span>DATE</span>
                        <span>{showDateStr}</span>
                      </div>
                      <div className="ticket-meta-item">
                        <span>SEATS ({Array.isArray(seatsList) ? seatsList.length : 1})</span>
                        <span style={{ color: "var(--primary)" }}>{Array.isArray(seatsList) ? seatsList.join(", ") : seatsList}</span>
                      </div>
                      <div className="ticket-meta-item">
                        <span>TOTAL PAID</span>
                        <span>₹{amountVal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-qr-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.35rem", minWidth: "165px" }}>
                    <div className="qr-placeholder" style={{ width: "128px", height: "128px", padding: "6px", background: "#fff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
                      <img
                        src={tokenVal ? (ticketQrUrls[tokenVal] || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(tokenVal)}&color=0B0D12&bgcolor=FFFFFF`) : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(bookingIdVal))}&color=0B0D12&bgcolor=FFFFFF`}
                        alt="Ticket QR"
                        style={{ width: "116px", height: "116px", display: "block", borderRadius: "4px" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(bookingIdVal))}&color=0B0D12&bgcolor=FFFFFF`;
                        }}
                      />
                    </div>
                    <span className="qr-id" style={{ fontWeight: 700, fontSize: "0.82rem", color: "#fff", marginTop: "0.2rem" }}>CNX-{bookingIdVal}</span>
                    {tokenVal && (
                      <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "monospace", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tokenVal}>
                        🎟️ {tokenVal.substring(0, 15)}...
                      </span>
                    )}
                    <span style={{ fontSize: "0.68rem", color: "var(--success)", fontWeight: 700 }}>SECURE ENTRY PASS</span>
                    <button
                      type="button"
                      className="btn-download-pdf"
                      onClick={async () => {
                        toast.info("📄 Generating E-Ticket PDF...", { description: `Downloading ticket CNX-${bookingIdVal}` });
                        try {
                          const path = tokenVal
                            ? `/api/tickets/download/${tokenVal}`
                            : `/api/tickets/download-by-booking/${bookingIdVal}`;
                          await downloadAuthenticatedFile(path, `CineX-Ticket-CNX-${bookingIdVal}.pdf`);
                        } catch (err) {
                          toast.error("Download failed", { description: getApiErrorMessage(err, "Unable to download ticket PDF.") });
                        }
                      }}
                      style={{
                        marginTop: "0.35rem",
                        padding: "0.45rem 0.85rem",
                        backgroundColor: "var(--primary)",
                        color: "#fff",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        boxShadow: "0 2px 10px rgba(229, 9, 20, 0.4)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span>📄</span> Download PDF
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {renderMobileNav()}
    </div>
  );
}
