import { Show, SignInButton, UserButton, useUser, useClerk } from "@clerk/react";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FeaturePage } from "./pages/FeaturePage";
import { WishlistPage } from "./pages/WishlistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { useWishlist } from "./utils/useWishlist";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Ticket, Sparkles, Film, Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, Star, TrendingUp, Tv, Flame, Gift, LifeBuoy, Heart, Trophy, Compass, Settings, Headphones, Code } from "lucide-react";
import "./index.css";
import { AdminPortal } from "./admin/AdminPortal";

const IMG_BASE_URL     = "https://image.tmdb.org/t/p/w500";
const IMG_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";
const API_BASE         = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

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

const getNumericSeatId = (seatName: string) => {
  const row = seatName.charCodeAt(0) - 64;
  const col = parseInt(seatName.slice(1)) || 1;
  return row * 100 + col;
};

export default function App() {
  const { isSignedIn, user } = useUser();
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
  const [isDetailOpen,   setIsDetailOpen]   = useState(false);
  const [isSeatOpen,     setIsSeatOpen]     = useState(false);
  const [currentTheatre, setCurrentTheatre] = useState("");
  const [currentTime,    setCurrentTime]    = useState("");
  const [selectedSeats,  setSelectedSeats]  = useState<Array<{ id: string; price: number }>>([]);
  const [liveSeatStatus, setLiveSeatStatus] = useState<Record<string, { status: 'HELD' | 'BOOKED' | 'AVAILABLE'; userId?: string }>>({});
  const stompClientRef = useRef<Client | null>(null);

  // Checkout & Payment
  const [isPaymentOpen,  setIsPaymentOpen]  = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState("UPI");
  const [processing,     setProcessing]     = useState(false);
  const [paymentError,   setPaymentError]   = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // History / Bookings
  const [userBookings,   setUserBookings]   = useState<any[]>([]);
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);

  // Carousel
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { wishlist, isWishlisted, toggleWishlist, removeWishlist, wishlistCount } = useWishlist(user?.id);

  // ── Fetch Bookings from Spring Boot Backend ────────────────────────────────────
  const fetchUserBookings = useCallback(() => {
    if (!user?.id) return;
    axios.get(`${API_BASE}/api/bookings/clerk/${user.id}`)
      .then(res => {
        setUserBookings(res.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch bookings from backend:", err);
      });
  }, [user?.id]);

  // ── Fetch Movies from Spring Boot Backend ──────────────────────────────────────
  const fetchAllMovies = useCallback(() => {
    setLoading(true);
    setApiError(false);
    Promise.all([
      axios.get(`${API_BASE}/api/tmdb/now_playing`),
      axios.get(`${API_BASE}/api/tmdb/trending`),
      axios.get(`${API_BASE}/api/tmdb/upcoming`),
    ])
      .then(([resNow, resTrend, resUp]) => {
        setMoviesNowPlaying(resNow.data.results || []);
        setMoviesTrending(resTrend.data.results || []);
        setMoviesUpcoming(resUp.data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load movies from backend:", err);
        setApiError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  useEffect(() => {
    if (user?.id) {
      fetchUserBookings();
    } else {
      setUserBookings([]);
    }
  }, [user?.id, fetchUserBookings]);

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
    setIsDetailOpen(true);
    if (location.pathname !== "/" && location.pathname !== "/movies") {
      navigate("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setCurrentMovie(null);
  };

  const openSeats = (theatre: string, time: string) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setCurrentTheatre(theatre);
    setCurrentTime(time);
    setSelectedSeats([]);
    setIsSeatOpen(true);
  };

  const closeSeats = () => {
    if (selectedSeats.length > 0) {
      const showIdVal = currentMovie?.id ? Number(currentMovie.id) : 101;
      const clerkId = user ? user.id : "guest_user";
      const numIds = selectedSeats.map(s => getNumericSeatId(s.id));
      axios.delete(`${API_BASE}/api/shows/${showIdVal}/seats/lock`, {
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

    const showIdVal = currentMovie?.id ? Number(currentMovie.id) : 101;

    // Fetch initially held seats via REST
    axios.get(`${API_BASE}/api/shows/${showIdVal}/seats/held`)
      .then(res => {
        if (Array.isArray(res.data)) {
          const initialMap: Record<string, { status: 'HELD' | 'BOOKED' | 'AVAILABLE'; userId?: string }> = {};
          res.data.forEach((s: any) => {
            if (s.seatId) initialMap[s.seatId] = { status: s.status || 'HELD', userId: s.userId };
          });
          setLiveSeatStatus(initialMap);
        }
      })
      .catch(() => {});

    // Connect to WebSocket via SockJS
    const socket = new SockJS(`${API_BASE}/ws`);
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
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isSeatOpen, currentMovie]);

  const toggleSeat = (id: string, price: number) => {
    const numId = getNumericSeatId(id);
    const showIdVal = currentMovie?.id ? Number(currentMovie.id) : 101;
    const clerkId = user ? user.id : "guest_user";
    const isCurrentlySelected = selectedSeats.some(s => s.id === id);

    if (isCurrentlySelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== id));
      axios.delete(`${API_BASE}/api/shows/${showIdVal}/seats/lock`, {
        data: { showId: showIdVal, seatIds: [numId], userId: clerkId, action: "RELEASE" }
      }).catch(() => {});
    } else {
      axios.post(`${API_BASE}/api/shows/${showIdVal}/seats/lock`, {
        showId: showIdVal, seatIds: [numId], userId: clerkId, action: "SELECT"
      }).then(res => {
        if (res.data === true || res.status === 200) {
          setSelectedSeats(prev => [...prev, { id, price }]);
        }
      }).catch(err => {
        if (err.response?.status === 409) {
          toast.warning("Seat Unavailable", { description: `Seat ${id} is currently held by another user. Please choose another seat.` });
        } else {
          setSelectedSeats(prev => [...prev, { id, price }]);
        }
      });
    }
  };

  const getSeatStatusClass = (id: string, hardcodedBooked: boolean) => {
    const numId = getNumericSeatId(id);
    const liveInfo = liveSeatStatus[numId] || liveSeatStatus[id];
    if (liveInfo && liveInfo.status === 'BOOKED') return 'booked';
    if (liveInfo && liveInfo.status === 'HELD' && liveInfo.userId !== (user ? user.id : "guest_user")) return 'held';
    if (hardcodedBooked) return 'booked';
    if (selectedSeats.some(s => s.id === id)) return 'selected';
    return '';
  };

  const isSeatDisabled = (id: string, hardcodedBooked: boolean) => {
    const numId = getNumericSeatId(id);
    const liveInfo = liveSeatStatus[numId] || liveSeatStatus[id];
    if (liveInfo && (liveInfo.status === 'BOOKED' || (liveInfo.status === 'HELD' && liveInfo.userId !== (user ? user.id : "guest_user")))) return true;
    return hardcodedBooked;
  };

  const totalPrice = selectedSeats.reduce((acc, s) => acc + s.price, 0);

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
    
    if (!(window as any).Razorpay) {
      setPaymentError("Razorpay SDK failed to load. Please check your network connection or disable adblockers.");
      setProcessing(false);
      return;
    }

    const clerkUserId = user ? user.id : "guest_" + Math.floor(Math.random() * 100000);
    const reqBody = {
      clerkUserId: clerkUserId,
      movieId: currentMovie?.id || 1,
      movieTitle: currentMovie?.title || "Movie",
      posterPath: currentMovie?.poster_path ? `${IMG_BASE_URL}${currentMovie.poster_path}` : "",
      theatreName: currentTheatre || "CineX Theatre",
      cityName: currentCity || "Chennai",
      showDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      showTime: currentTime || "Now",
      seatNames: selectedSeats.map(s => s.id),
      amount: totalPrice
    };

    // Step 1: Create initial booking in database (PENDING_PAYMENT)
    axios.post(`${API_BASE}/api/bookings`, reqBody)
      .then(res => {
        const bookingId = res.data.id;
        // Step 2: Create Razorpay Order on backend
        return axios.post(`${API_BASE}/api/payments/create-order`, {
          bookingId: bookingId,
          clerkUserId: clerkUserId
        }).then(orderRes => {
          const orderData = orderRes.data;
          
          const options = {
            key: orderData.keyId || "rzp_test_TAG6wbNf35AKL4",
            amount: orderData.amountInPaise,
            currency: orderData.currency || "INR",
            name: orderData.name || "CineX",
            description: orderData.description || "Movie Ticket Booking",
            order_id: orderData.orderId,
            handler: function (response: any) {
              setProcessing(true);
              // Step 3: Verify signature on backend
              axios.post(`${API_BASE}/api/payments/verify`, {
                bookingId: bookingId,
                clerkUserId: clerkUserId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              .then(() => {
                setProcessing(false);
                setPaymentSuccess(true);
                toast.success("🎉 Payment Confirmed!", {
                  description: `Your tickets for ${currentMovie?.title || 'the movie'} are ready in your Ticket Vault.`
                });
                if (user?.id) {
                  fetchUserBookings();
                } else {
                  setUserBookings(prev => [{ ...res.data, status: "BOOKED", bookingStatus: "BOOKED", paymentStatus: "SUCCESS" }, ...prev]);
                }
                setTimeout(() => {
                  setPaymentSuccess(false);
                  setIsPaymentOpen(false);
                  setIsSeatOpen(false);
                  closeDetail();
                  setIsHistoryOpen(true);
                }, 1500);
              })
              .catch(verifyErr => {
                console.error("Signature Verification Failed:", verifyErr);
                const errMsg = verifyErr.response?.data?.message || "Payment Verification Failed: Invalid Razorpay signature.";
                setPaymentError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
                setProcessing(false);
              });
            },
            modal: {
              ondismiss: function () {
                setProcessing(false);
                setPaymentError("Payment cancelled by user.");
                toast.error("Payment Cancelled", { description: "You cancelled the checkout transaction." });
                axios.post(`${API_BASE}/api/payments/cancel?bookingId=${bookingId}&clerkUserId=${clerkUserId}`).catch(() => {});
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
            axios.post(`${API_BASE}/api/payments/cancel?bookingId=${bookingId}&clerkUserId=${clerkUserId}`).catch(() => {});
          });
          setProcessing(false);
          rzp.open();
        });
      })
      .catch(err => {
        console.error("Payment/Booking Error:", err);
        const errMsg = err.response?.data?.message || err.response?.data || "Payment Failed: Seat already booked or server error. Please retry.";
        setPaymentError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        setProcessing(false);
      });
  };

  const theatres = THEATRES_DB[currentCity] ?? THEATRES_DB["Chennai"];

  if (isAdminOpen) {
    return <AdminPortal onExit={() => setIsAdminOpen(false)} userEmail={user?.primaryEmailAddress?.emailAddress} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <Toaster position="top-right" theme="dark" richColors />

      {/* ===== TOP NAVBAR ===== */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="logo" onClick={() => { closeDetail(); setIsHistoryOpen(false); navigate("/"); }} style={{ cursor: "pointer" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="2"/><polygon points="10,8 16,12 10,16" fill="#f97316"/></svg>
            <span>CINE<em>X</em></span>
          </div>
          <div className="search-bar">
            <Search className="search-icon w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by movie, theater, actor, or keyword" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="top-actions">
            <Link to="/gift-cards" className="top-link">
              <Gift className="w-4 h-4" /> Gift Cards
            </Link>
            <Link to="/offers" className="top-link">
              <Sparkles className="w-4 h-4" /> Offers
            </Link>
            <div id="auth-section">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="top-link sign-in-btn" style={{ background: "transparent", border: "none", color: "#f97316", fontWeight: 700 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
                    Sign In
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <Link to="/profile" className="top-link">👤 Profile</Link>
                  <span className="top-link" onClick={() => setIsAdminOpen(true)} style={{ cursor: "pointer" }}>🛡️ Admin</span>
                  <span className="top-link" onClick={() => setIsHistoryOpen(true)} style={{ cursor: "pointer" }}>🎟️ Tickets</span>
                  <Link to="/wishlist" className="top-link">❤️ Wishlist ({wishlistCount})</Link>
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </div>
      </header>

      {/* ===== SECONDARY NAV ===== */}
      <nav className="secondary-nav">
        <div className="secondary-nav-inner">
          <ul className="nav-menu">
            <li><Link to="/" className={location.pathname === "/" ? "active" : ""}>Movies</Link></li>
            <li><Link to="/stream" className={location.pathname === "/stream" ? "active" : ""}>Stream at Home</Link></li>
            <li><Link to="/events" className={location.pathname === "/events" ? "active" : ""}>Events</Link></li>
            <li><Link to="/plays" className={location.pathname === "/plays" ? "active" : ""}>Plays</Link></li>
            <li><Link to="/sports" className={location.pathname === "/sports" ? "active" : ""}>Sports</Link></li>
            <li><Link to="/activities" className={location.pathname === "/activities" ? "active" : ""}>Activities</Link></li>
          </ul>
          <div className="location-indicator" onClick={() => setCityModalOpen(true)} style={{ cursor: "pointer" }}>
            <MapPin className="w-4 h-4 text-[#f97316]" />
            <span>{currentCity}, IN</span>
          </div>
        </div>
      </nav>

      {/* ── Main Dashboard Content ── */}
      <main>
        {apiError && (
          <div style={{ background: "rgba(229, 9, 20, 0.2)", border: "1px solid var(--primary)", color: "#fff", padding: "1rem", borderRadius: "12px", margin: "1.5rem 4rem", textAlign: "center" }}>
            ⚠️ Could not connect to the backend server. Please verify Spring Boot is running on port 8081.
          </div>
        )}

        <Routes>
          <Route path="/" element={
            loading ? (
              <div style={{ padding: "2rem 4rem" }}>
            <div className="section-header" style={{ padding: 0, marginBottom: "2rem" }}>
              <h2 className="section-title">Loading Premier Cinema...</h2>
            </div>
            <div className="movies-grid" style={{ padding: 0 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div key={i} className="skeleton-card shad-card" style={{ padding: "0.8rem", background: "#151922", border: "1px solid #2A3242" }}>
                  <div className="shad-skeleton" style={{ width: "100%", height: "280px", borderRadius: "12px", marginBottom: "1rem" }} />
                  <div className="shad-skeleton" style={{ width: "80%", height: "18px", borderRadius: "6px", marginBottom: "0.5rem" }} />
                  <div className="shad-skeleton" style={{ width: "50%", height: "14px", borderRadius: "6px" }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero Carousel Section ── */}
            {carouselMovies.length > 0 && !searchQuery && (
              <section className="hero-section" id="hero-section" style={{ position: "relative" }}>
                <div className="hero-carousel" style={{ height: "450px", position: "relative", overflow: "hidden" }}>
                  <button className="carousel-arrow left" id="hero-prev" aria-label="Previous slide" onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselMovies.length) % carouselMovies.length)}>‹</button>
                  <button className="carousel-arrow right" id="hero-next" aria-label="Next slide" onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselMovies.length)}>›</button>

                  <div className="carousel-track" style={{ height: "100%", display: "flex" }}>
                    {carouselMovies.map((movie, idx) => (
                      <div
                        key={movie.id}
                        className={`hero-slide ${idx === currentSlide ? "active" : ""}`}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: idx === currentSlide ? 1 : 0, transition: "opacity 0.6s ease-in-out" }}
                      >
                        <img
                          src={`${IMG_ORIGINAL_URL}${movie.backdrop_path}`}
                          className="hero-bg"
                          alt={movie.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                        />
                        <div className="hero-gradient" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 0%, rgba(10,11,15,0.7) 40%, rgba(10,11,15,0.2) 100%)" }} />
                        <div className="hero-content" style={{ position: "absolute", bottom: "40px", left: "40px", zIndex: 10, maxWidth: "60%" }}>
                          <h1 className="hero-title" style={{ fontSize: "2.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>{movie.title}</h1>
                          <p className="hero-subtitle" style={{ color: "var(--text2)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
                            {getGenreList(movie.genre_ids).join(' • ')} | {movie.adult ? 'R' : 'PG-13'} | {getLangLabel(movie.original_language)}
                          </p>
                          <button className="btn-primary" onClick={() => handleMovieClick(movie)}>
                            Book Tickets Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* GET SHOWTIMES widget */}
                  <div className="showtimes-widget">
                      <h3>GET SHOWTIMES</h3>
                      <div className="widget-filters">
                          <select className="widget-select" value={currentCity} onChange={(e) => setCurrentCity(e.target.value)}>
                              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <input type="date" className="widget-date" defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <button className="widget-btn" onClick={() => {
                         const firstMovie = carouselMovies[0];
                         if (firstMovie) { handleMovieClick(firstMovie); }
                      }}>Find Tickets</button>
                  </div>
                </div>
              </section>
            )}

            {/* ===== 3-COLUMN LAYOUT ===== */}
            <div className="page-wrapper" style={{ padding: "0 1.5rem", maxWidth: "1360px", margin: "0 auto" }}>
              <div className="content-grid" style={{ display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: "2rem", alignItems: "start", marginTop: "2rem" }}>
                
                {/* ===== LEFT SIDEBAR ===== */}
                <aside className="sidebar-left">
                  <div className="sidebar-section">
                      <h4 className="sidebar-title" style={{ fontSize: "0.75rem", color: "var(--text3)", letterSpacing: "1.5px", marginBottom: "1rem" }}>BROWSE</h4>
                      <ul className="sidebar-menu" style={{ listStyle: "none", padding: 0 }}>
                          <li style={{ marginBottom: "0.5rem" }}><a href="#" className="active" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text)", padding: "0.6rem 1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>
                              <Film className="w-4 h-4" /> Now Playing
                          </a></li>
                          <li style={{ marginBottom: "0.5rem" }}><a href="#" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text2)", padding: "0.6rem 1rem", textDecoration: "none" }}>
                              <Calendar className="w-4 h-4" /> Coming Soon
                          </a></li>
                          <li style={{ marginBottom: "0.5rem" }}><a href="#" style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text2)", padding: "0.6rem 1rem", textDecoration: "none" }}>
                              <Trophy className="w-4 h-4" /> Top Box Office
                          </a></li>
                      </ul>
                  </div>
                  {!isSignedIn && (
                    <div className="promo-card" style={{ background: "linear-gradient(145deg, var(--surface), var(--surface2))", border: "1px solid var(--border)", borderRadius: "var(--card-radius)", padding: "1.5rem", textAlign: "center", marginTop: "2rem" }}>
                        <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>My CineX</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginBottom: "1rem" }}>Sign in for fast checkout and exclusive offers.</p>
                        <SignInButton mode="modal">
                          <button className="btn-secondary" style={{ width: "100%", padding: "0.8rem", background: "transparent", border: "1px solid var(--orange)", color: "var(--orange)", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Sign In</button>
                        </SignInButton>
                    </div>
                  )}
                </aside>

                {/* ===== CENTER CONTENT ===== */}
                <main className="center-content">
                  <MovieSectionGrid title="Now Showing"        movies={moviesNowPlaying} filterFunc={filterMovies} onClick={handleMovieClick} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist} />
                  <MovieSectionGrid title="Trending in India"  movies={moviesTrending}   filterFunc={filterMovies} onClick={handleMovieClick} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist} />
                  <MovieSectionGrid title="Upcoming Releases"  movies={moviesUpcoming}   filterFunc={filterMovies} onClick={handleMovieClick} isWishlisted={isWishlisted} onToggleWishlist={toggleWishlist} />
                </main>
                
                {/* ===== RIGHT SIDEBAR ===== */}
                <aside className="sidebar-right">
                    <div className="promo-card" style={{ background: "linear-gradient(145deg, #1f1b18, #1a1512)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "var(--card-radius)", padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <div style={{ color: "var(--orange)", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "2px", marginBottom: "0.5rem" }}>CINEVERSE VIP</div>
                        <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unlimited Movies</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginBottom: "1rem" }}>Watch up to 3 movies per week for just $19.99/mo.</p>
                        <button style={{ width: "100%", padding: "0.8rem", background: "var(--orange)", color: "#000", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>Join Now</button>
                    </div>

                    <div className="deals-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-radius)", padding: "1.5rem" }}>
                        <h4 style={{ fontSize: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Ticket className="w-4 h-4 text-[#f97316]" /> Weekly Deals
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            <li style={{ paddingBottom: "0.8rem", borderBottom: "1px solid var(--border)", marginBottom: "0.8rem" }}>
                                <strong style={{ display: "block", fontSize: "0.9rem" }}>Student Tuesday</strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text2)" }}>50% off standard tickets</span>
                            </li>
                            <li style={{ paddingBottom: "0.8rem", borderBottom: "1px solid var(--border)", marginBottom: "0.8rem" }}>
                                <strong style={{ display: "block", fontSize: "0.9rem" }}>Family Bundle</strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text2)" }}>4 tickets + 2 large popcorns</span>
                            </li>
                            <li>
                                <strong style={{ display: "block", fontSize: "0.9rem" }}>Date Night</strong>
                                <span style={{ fontSize: "0.8rem", color: "var(--text2)" }}>2 VIP seats + drinks included</span>
                            </li>
                        </ul>
                    </div>
                </aside>
              </div>
            </div>
          </>
        )} />
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
              <img
                src={`${IMG_ORIGINAL_URL}${currentMovie.backdrop_path}`}
                className="detail-backdrop"
                alt="Backdrop"
              />
              <button
                onClick={closeDetail}
                style={{ position: "absolute", top: "2rem", left: "4rem", zIndex: 10, background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)", color: "#fff", borderRadius: "50%", width: "44px", height: "44px", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ←
              </button>
              <div className="detail-poster">
                <img src={`${IMG_BASE_URL}${currentMovie.poster_path}`} alt="Poster" />
              </div>
              <div className="detail-info">
                <h1 className="detail-title">{currentMovie.title}</h1>
                <div className="detail-badges" style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center" }}>
                  <span className="detail-rating" style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(255, 209, 102, 0.15)", border: "1px solid #FFD166", padding: "0.35rem 0.8rem", borderRadius: "20px" }}>
                    <Star className="w-4 h-4 fill-[#FFD166] text-[#FFD166]" /> {(currentMovie.vote_average || 8.4).toFixed(1)}/10
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400 }}>
                      ({((currentMovie.vote_count || 1200) / 1000).toFixed(1)}K+ Ratings)
                    </span>
                  </span>
                  <span className="detail-pill-tag" style={{ background: "var(--primary)", borderColor: "var(--primary)", fontWeight: 700 }}>
                    {getLangLabel(currentMovie.original_language)}
                  </span>
                  <span className="detail-pill-tag" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Film className="w-3.5 h-3.5 text-[#FFD166]" /> {getGenres(currentMovie.genre_ids)}</span>
                  <span className="detail-pill-tag" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Clock className="w-3.5 h-3.5 text-[#FF3D5A]" /> 2h 24m • 2D / IMAX 3D / Atmos</span>
                  <span className="detail-pill-tag" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Calendar className="w-3.5 h-3.5 text-[#60A5FA]" /> Release: {currentMovie.release_date || "2026"}</span>
                  <span className="detail-pill-tag" style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#22C55E", borderColor: "#22C55E", background: "rgba(34, 197, 94, 0.1)" }}><TrendingUp className="w-3.5 h-3.5" /> #1 Blockbuster</span>
                  <button onClick={() => toast.success("Added to Wishlist!", { description: `${currentMovie.title} added to your favorites.` })} style={{ background: "rgba(255, 61, 90, 0.15)", border: "1px solid #FF3D5A", color: "#FF3D5A", padding: "0.35rem 0.8rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    <Heart className="w-3.5 h-3.5 fill-[#FF3D5A]" /> Wishlist
                  </button>
                </div>
                <p className="detail-overview">
                  {currentMovie.overview || "Witness the ultimate entertainment spectacle. Equipped with state-of-the-art Dolby Atmos spatial acoustics and IMAX dual 4K laser projection for unmatched immersion."}
                </p>
                <button
                  className="btn-primary"
                  onClick={() => document.getElementById("theatres-scroll-target")?.scrollIntoView({ behavior: "smooth" })}
                >
                  🎟️ Book Tickets Now
                </button>
              </div>
            </div>

            {/* Theatre & Showtime Section */}
            <div className="theatres-section" id="theatres-scroll-target">
              <div className="theatres-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 className="w-6 h-6 text-[#22C55E]" /> Theatres in <span style={{ color: "var(--primary)" }}>{currentCity}</span></h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}><AlertCircle className="w-4 h-4 text-[#FFD166]" /> Select a showtime to proceed with live seat selection</p>
                </div>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <Link to="/support" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid #2A3242", color: "#F5F7FA", padding: "0.5rem 1rem", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
                    <LifeBuoy className="w-4 h-4 text-[#FFD166]" /> VIP Support
                  </Link>
                  <button className="city-pill" onClick={() => setCityModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <MapPin className="w-4 h-4 text-[#E50914]" /> Change City
                  </button>
                </div>
              </div>

              <div className="theatres-list">
                {theatres.map(t => (
                  <div key={t.name} className="theatre-card">
                    <div className="theatre-info">
                      <h3>
                        <span>🎥</span> {t.name}
                      </h3>
                      <p>{t.features} • <span style={{ color: "var(--primary)", fontWeight: 600 }}>{t.distance}</span></p>
                    </div>
                    <div className="showtimes-list">
                      {t.times.map(slot => (
                        <div
                          key={slot.t}
                          className={`showtime-pill ${slot.s === "fast-filling" || slot.s === "almost-full" ? "fast-filling" : ""}`}
                          onClick={() => openSeats(t.name, slot.t)}
                        >
                          <span className="showtime-time">{slot.t}</span>
                          <span className="showtime-type">{slot.type} • {slot.s === "almost-full" ? "Almost Full" : slot.s === "fast-filling" ? "Filling Fast" : "Available"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Seat Selection Modal (with Aisles) ── */}
      <div className={`seat-selection-view ${isSeatOpen ? "active" : ""}`}>
        <div className="seat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button className="btn-close-modal" onClick={closeSeats}>←</button>
            <div className="seat-header-info">
              <h2>{currentMovie?.title}</h2>
              <p>{currentTheatre} • <strong style={{ color: "#fff" }}>{currentTime}</strong></p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={closeSeats}>✕</button>
        </div>

        <div className="seat-scroll-container">
          <div className="seat-legend">
            <span className="legend-item"><div className="legend-box avail" /> Available</span>
            <span className="legend-item"><div className="legend-box sel" /> Selected</span>
            <span className="legend-item"><div className="legend-box prem" /> Premium Recliner</span>
            <span className="legend-item"><div className="legend-box held" style={{ background: "rgba(245, 158, 11, 0.3)", border: "1px dashed #f59e0b" }} /> Held (Live)</span>
            <span className="legend-item"><div className="legend-box booked" /> Booked / Sold</span>
          </div>

          <div className="seating-chart">
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
            <h3>₹{totalPrice}</h3>
            <p>{selectedSeats.length} {selectedSeats.length === 1 ? "Ticket" : "Tickets"} Selected {selectedSeats.length > 0 && `(${selectedSeats.map(s => s.id).join(", ")})`}</p>
          </div>
          <button
            className="btn-primary"
            disabled={selectedSeats.length === 0}
            onClick={() => {
              if (!isSignedIn) {
                openSignIn();
              } else {
                setPaymentError("");
                setIsPaymentOpen(true);
              }
            }}
          >
            Proceed to Payment <span>→</span>
          </button>
        </div>
      </div>

      {/* ── Checkout & Payment Modal ── */}
      <div
        className={`modal-overlay ${isPaymentOpen ? "active" : ""}`}
        onClick={() => !processing && setIsPaymentOpen(false)}
      >
        <div className="payment-modal" onClick={e => e.stopPropagation()}>
          {paymentSuccess ? (
            <div className="status-state-box">
              <div className="status-icon-circle success">✓</div>
              <h2>Booking Confirmed!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Your tickets for <strong style={{ color: "#fff" }}>{currentMovie?.title}</strong> have been booked successfully.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2>🔒 Secure Checkout</h2>
                <button className="btn-close-modal" onClick={() => setIsPaymentOpen(false)}>✕</button>
              </div>

              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Select your preferred payment mode</p>

              <div className="payment-summary-box">
                <div className="summary-row">
                  <span>Movie</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{currentMovie?.title}</span>
                </div>
                <div className="summary-row">
                  <span>Seats ({selectedSeats.length})</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSeats.map(s => s.id).join(", ")}</span>
                </div>
                <div className="summary-row">
                  <span>Convenience Fee & Taxes</span>
                  <span>₹0 (Waived)</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount Payable</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              <div className="payment-methods">
                {[
                  { id: "UPI",    label: "Google Pay / PhonePe / Paytm UPI", icon: "📱" },
                  { id: "Card",   label: "Credit / Debit Card (Visa, MC, RuPay)", icon: "💳" },
                  { id: "Net",    label: "NetBanking (HDFC, SBI, ICICI, Axis)", icon: "🏦" },
                ].map(m => (
                  <div
                    key={m.id}
                    className={`payment-method-card ${paymentMethod === m.id ? "active" : ""}`}
                    onClick={() => setPaymentMethod(m.id)}
                  >
                    <span className="payment-method-icon">{m.icon}</span>
                    <span className="payment-method-label">{m.label}</span>
                  </div>
                ))}
              </div>

              {paymentError && (
                <div style={{ background: "rgba(229, 9, 20, 0.15)", border: "1px solid var(--primary)", color: "#fff", padding: "0.8rem", borderRadius: "8px", marginBottom: "1.2rem", fontSize: "0.85rem", textAlign: "center" }}>
                  ⚠️ {paymentError}
                </div>
              )}

              <button className="btn-primary" style={{ width: "100%" }} disabled={processing} onClick={processPayment}>
                {processing ? "Processing Transaction..." : `Pay ₹${totalPrice} Securely`}
              </button>
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
                        src={tokenVal ? `${API_BASE}/api/tickets/qr/${tokenVal}` : `${API_BASE}/api/tickets/qr/TOKEN-CNX-${bookingIdVal}`}
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
                    <a
                      href={tokenVal ? `${API_BASE}/api/tickets/download/${tokenVal}?clerkUserId=${user?.id || ''}` : `${API_BASE}/api/tickets/download-by-booking/${bookingIdVal}?clerkUserId=${user?.id || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download-pdf"
                      onClick={() => toast.info("📄 Generating E-Ticket PDF...", { description: `Downloading ticket CNX-${bookingIdVal}` })}
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
                    </a>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Movie Section Helper Sub-Component ─────────────────────────────────────────
function MovieSectionGrid({ title, movies, filterFunc, onClick, isWishlisted, onToggleWishlist }: {
  title: string;
  movies: any[];
  filterFunc: (list: any[]) => any[];
  onClick: (movie: any) => void;
  isWishlisted?: (id: number) => boolean;
  onToggleWishlist?: (movie: any, e?: React.MouseEvent) => void;
}) {
  const filtered = filterFunc(movies);
  if (filtered.length === 0) return null;

  return (
    <section style={{ marginBottom: "2.5rem", padding: "0 4rem" }}>
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Flame className="w-6 h-6 text-[#E50914]" />
          <h2 className="section-title" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{title}</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#FF3D5A", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}>
          See All <ChevronRight className="w-4 h-4" />
        </span>
      </div>
      <div className="movies-grid" style={{ padding: 0 }}>
        {filtered.map(m => (
          <motion.div
            key={m.id}
            whileHover={{ scale: 1.04, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="movie-card shad-card"
            onClick={() => onClick(m)}
            style={{ cursor: "pointer", overflow: "hidden" }}
          >
            <div className="poster-wrapper">
              <img
                src={m.poster_path ? `${IMG_BASE_URL}${m.poster_path}` : ""}
                alt={m.title}
                loading="lazy"
              />
              {isWishlisted && onToggleWishlist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(m, e);
                  }}
                  title="Save to Wishlist"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(11, 13, 18, 0.85)",
                    color: isWishlisted(m.id) ? "#FF3D5A" : "#fff",
                    border: "1px solid rgba(255, 61, 90, 0.4)",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "all 0.2s"
                  }}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted(m.id) ? "fill-[#FF3D5A]" : ""}`} />
                </button>
              )}
              <div className="card-rating-badge" style={{ display: "flex", alignItems: "center", gap: "0.2rem", background: "rgba(11, 13, 18, 0.85)", border: "1px solid #FFD166", color: "#FFD166" }}>
                <Star className="w-3 h-3 fill-[#FFD166]" /> {(m.vote_average || 8.0).toFixed(1)}
              </div>
              <div className="card-lang-badge" style={{ background: "rgba(229, 9, 20, 0.85)", fontWeight: 700 }}>
                {getLangLabel(m.original_language)}
              </div>
            </div>
            <div className="card-content" style={{ padding: "1rem" }}>
              <div>
                <h3 className="card-title" title={m.title} style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.3rem" }}>{m.title}</h3>
                <p className="card-genres" style={{ color: "#B8C0CC", fontSize: "0.75rem" }}>{getGenres(m.genre_ids)}</p>
              </div>
              <div className="card-footer" style={{ marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px solid #2A3242", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748B" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Tv className="w-3 h-3" /> UA • 2D/IMAX</span>
                <span style={{ color: "#FF3D5A", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>Book Tickets →</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
