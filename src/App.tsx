import { useClerk } from "@clerk/react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api, downloadAuthenticatedFile, fetchAuthenticatedBlobUrl, getApiBaseUrl, getApiErrorMessage } from "./api/apiClient";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FeaturePage } from "./pages/FeaturePage";
import { WishlistPage } from "./pages/WishlistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WalletPage } from "./pages/WalletPage";
import { CouponRedeemModal } from "./components/CouponRedeemModal";
import { useWishlist } from "./utils/useWishlist";
import { CinexToaster } from "./components/CinexToaster";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { Search, MapPin, Ticket, Sparkles, Film, Calendar, Star, Compass, Settings, Headphones, Code, Play, ArrowLeft, Lock, Shield, Download, Home, User, Tv, Trophy, Gift, X, Bookmark, ChevronRight } from "lucide-react";
import "./index.css";
import { AdminPortal } from "./admin/AdminPortal";
import { hasAdminRole } from "./utils/clerkRole";
import { MovieCard } from "./components/MovieCard";
import { MediaCoverImage } from "./components/MediaCoverImage";
import { VibeChart } from "./components/VibeChart";
import { MovieCarousel } from "./components/MovieCarousel";
import { SeatMap } from "./components/SeatMap";
import { TrailerModal } from "./components/TrailerModal";
import { CitySelectorModal } from "./components/city/CitySelectorModal";
import { AuthControls, useClerkAuthReady } from "./components/AuthControls";
import { CinexLogo } from "./components/CinexLogo";
import { citySearchResultToDisplay, resolveCityAvailabilityStatus, type CityDisplay } from "./config/cityCatalog";
import { isClerkPublishableKeyValid } from "./utils/clerkConfig";
import {
  fetchShowsForTmdbMovie,
  fetchBookableMovies,
  fetchTmdbMovieDetails,
  fetchTmdbMovieCredits,
  fetchTmdbSimilarMovies,
  fetchCities,
  fetchMovieTrailer,
  type CineXShow,
} from "./services/cinemaApi";
import {
  buildNowShowingDisplay,
  buildHeroCarouselMovies,
  formatShowDate,
  formatShowTime,
  formatReleaseDate,
  formatRuntime,
  formatCompactCount,
  getGenreList,
  getDirectors,
  getCrewByJobs,
  getLangLabel,
  getReleaseYear,
  getProductionCountries,
  extractTmdbGenres,
  enrichTmdbWithCatalog,
  parseTmdbCredits,
  parseTmdbPayload,
  mapTmdbSimilarMovie,
  resolveMediaUrl,
  resolveMovieBackdropUrl,
  resolveTrailerPlaybackUrl,
  type BookableMovieDto,
  type TmdbCastMember,
} from "./utils/movieUtils";
import { isStaleHeldPoll, shouldDropLocalSelection } from "./utils/seatHoldSync";
import { useDebounce } from "./utils/useDebounce";
import { searchMoviesBackend } from "./services/cinemaApi";

const API_BASE         = getApiBaseUrl();
const CLERK_KEY_OK     = isClerkPublishableKeyValid(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const SEAT_SESSION_KEY = "cinex_seat_session";
const CINEX300_PROMPT_VISIT_KEY = "cinex300_prompt_seen_this_visit";

type CineXSeat = {
  seatId: number;
  seatNumber: string;
  seatType: string;
  status: "AVAILABLE" | "BOOKED";
  price: number;
  rowLabel?: string;
  rowIndex?: number;
  columnIndex?: number;
  wheelchairAccessible?: boolean;
};

export default function App() {
  const {
    isLoaded,
    isSignedIn,
    userId,
    user,
    getToken,
    clerkStillInitializing,
    clerkLikelyMisconfigured,
  } = useClerkAuthReady();
  const { openSignIn } = useClerk();

  // Movie state
  const [moviesNowPlaying, setMoviesNowPlaying] = useState<any[]>([]);
  const [moviesTrending,   setMoviesTrending]   = useState<any[]>([]);
  const [moviesUpcoming,   setMoviesUpcoming]   = useState<any[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [apiError,         setApiError]         = useState(false);

  // Filter state
  const [searchQuery,  setSearchQuery]  = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setMobileSearchOpen(false);
    searchInputRef.current?.blur();
    mobileSearchInputRef.current?.blur();
  }, []);

  const openMobileSearch = useCallback(() => {
    setMobileSearchOpen(true);
    window.setTimeout(() => mobileSearchInputRef.current?.focus(), 0);
  }, []);
  
  const [homeScreeningLang, setHomeScreeningLang] = useState("all");
  const [detailScreeningLang, setDetailScreeningLang] = useState("all");

  useEffect(() => {
    if (debouncedSearchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }
    
    let cancelled = false;
    setIsSearching(true);
    setSearchError("");
    searchMoviesBackend(debouncedSearchQuery)
      .then(res => {
        if (cancelled) return;
        const mapped = res.map(m => ({
          ...m,
          id: Number(m.tmdbId),
          tmdbId: Number(m.tmdbId),
          backendMovieId: m.id,
          title: m.title,
          poster_path: m.posterPath,
          backdrop_path: null,
          genre_label: m.genre || "Cinema",
          overview: m.description || "",
          runtime: m.duration || null,
          bookable: true,
        }));
        setSearchResults(mapped);
      })
      .catch(() => {
        if (!cancelled) {
          setSearchError("Unable to search movies right now.");
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });
      
    return () => { cancelled = true; };
  }, [debouncedSearchQuery]);

  // City state
  const [availableCities, setAvailableCities] = useState<CityDisplay[]>([]);
  const [currentCity,     setCurrentCity]     = useState(() => localStorage.getItem("cinex_city") || "");
  const [cityBootstrapLoading, setCityBootstrapLoading] = useState(true);
  const [cityBookableTmdbIds, setCityBookableTmdbIds] = useState<Set<number>>(new Set());
  const [cityBookableMeta, setCityBookableMeta] = useState<Record<number, BookableMovieDto>>({});
  const [cityCatalogLoading, setCityCatalogLoading] = useState(false);
  const [cityCatalogError,   setCityCatalogError]   = useState("");
  const [cityListError,      setCityListError]      = useState("");
  const [cityLanguages,   setCityLanguages]   = useState<string[]>([]);
  const [detailLanguages, setDetailLanguages] = useState<string[]>([]);
  const [cityModalOpen,   setCityModalOpen]   = useState(() => !localStorage.getItem("cinex_city"));
  const [isAdminOpen,     setIsAdminOpen]     = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  // UI overlays & Modals
  const [currentMovie,   setCurrentMovie]   = useState<any>(null);
  const [shows,          setShows]          = useState<CineXShow[]>([]);
  const [showsLoading,   setShowsLoading]   = useState(false);
  const [showsError,     setShowsError]     = useState("");
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [detailExtrasError, setDetailExtrasError] = useState("");
  const [movieCast,      setMovieCast]      = useState<TmdbCastMember[]>([]);
  const [movieCrew,      setMovieCrew]      = useState<ReturnType<typeof parseTmdbCredits>["crew"]>([]);
  const [similarMovies,  setSimilarMovies]  = useState<any[]>([]);
  const [selectedShow,   setSelectedShow]   = useState<CineXShow | null>(null);
  const [showSeats,      setShowSeats]      = useState<CineXSeat[]>([]);
  const [seatsLoading,   setSeatsLoading]   = useState(false);
  const [isDetailOpen,   setIsDetailOpen]   = useState(false);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [trailerModalTitle, setTrailerModalTitle] = useState("");
  const [trailerModalUrl, setTrailerModalUrl] = useState<string | null>(null);
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
  const heldPollGenRef = useRef(0);
  const recentlyLockedAtRef = useRef<Map<number, number>>(new Map());
  const lockInFlightRef = useRef<Set<number>>(new Set());

  // Checkout & Payment
  const [isPaymentOpen,  setIsPaymentOpen]  = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [paymentError,   setPaymentError]   = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "WALLET">("RAZORPAY");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lastBooking, setLastBooking] = useState<{
    bookingId: string | number;
    movieTitle: string;
    posterPath: string;
    theatreName: string;
    screenName?: string;
    screeningLanguage?: string;
    showDate: string;
    showTime: string;
    seats: string[];
    totalAmount: number;
    ticketToken?: string;
    ticketQrUrl?: string;
  } | null>(null);
  const [selectedDetailDate, setSelectedDetailDate] = useState<string>("");

  // History / Bookings
  const [userBookings,   setUserBookings]   = useState<any[]>([]);
  const [ticketQrUrls,   setTicketQrUrls]   = useState<Record<string, string>>({});
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false);

  // Carousel
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { wishlist, isWishlisted, toggleWishlist, removeWishlist, wishlistCount } = useWishlist(user?.id);

  const backendCatalogRef = useRef<any[]>([]);
  const currentMovieRef = useRef<any>(null);
  currentMovieRef.current = currentMovie;

  const fetchCityCinemaData = useCallback((city: string, language?: string) => {
    setCityCatalogLoading(true);
    setCityCatalogError("");
    const lang = language && language !== "all" ? language : undefined;
    const langQuery = lang ? `&language=${encodeURIComponent(lang)}` : "";
    return Promise.all([
      api.get(`/api/shows/availability?city=${encodeURIComponent(city)}${langQuery}`, { skipAuth: true }),
      fetchBookableMovies(city, lang),
    ])
      .then(([availabilityRes, bookableMovies]) => {
        const tmdbIds: number[] = availabilityRes.data?.tmdbIds || [];
        setCityBookableTmdbIds(new Set(tmdbIds.map((id) => Number(id))));
        setCityLanguages(availabilityRes.data?.languages || []);

        const meta: Record<number, BookableMovieDto> = {};
        (bookableMovies || []).forEach((movie) => {
          if (movie?.tmdbId != null) {
            meta[Number(movie.tmdbId)] = movie;
          }
        });
        setCityBookableMeta(meta);
      })
      .catch(() => {
        setCityCatalogError(`Unable to load shows for ${city}. Please try again.`);
        setCityBookableTmdbIds(new Set());
        setCityBookableMeta({});
        setCityLanguages([]);
      })
      .finally(() => setCityCatalogLoading(false));
  }, []);

  const loadShowsForMovie = useCallback((movie: any, city: string) => {
    const tmdbId = Number(movie?.tmdbId ?? movie?.id);
    if (!tmdbId || !city) return Promise.resolve();
    setShowsLoading(true);
    setShowsError("");
    setSelectedShow(null);
    setCurrentShowId(null);
    return fetchShowsForTmdbMovie(tmdbId, city)
      .then((data) => {
        setShows(data);
        setDetailLanguages([...new Set(data.map((show) => show.screeningLanguage).filter(Boolean) as string[])]);
        if (data.length === 0) {
          setShowsError(`No CineX showtimes available in ${city}.`);
          setSelectedDetailDate("");
          return;
        }
        const dates = [...new Set(data.map((show) => show.showDate))].sort();
        setSelectedDetailDate((prev) => (prev && dates.includes(prev) ? prev : dates[0]));
      })
      .catch((err) => {
        console.error("Failed to load showtimes:", err);
        setShowsError("Unable to load showtimes. Please try again.");
        setShows([]);
      })
      .finally(() => setShowsLoading(false));
  }, []);

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

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchUserBookings();
    }
  }, [isSignedIn, user?.id, fetchUserBookings]);

  // ── Fetch Movies from Spring Boot Backend ──────────────────────────────────────
  const fetchAllMovies = useCallback(() => {
    setLoading(true);
    setApiError(false);

    Promise.allSettled([
      api.get("/api/movies", { skipAuth: true }),
      api.get("/api/tmdb/now_playing", { skipAuth: true }),
      api.get("/api/tmdb/trending", { skipAuth: true }),
      api.get("/api/tmdb/upcoming", { skipAuth: true }),
    ])
      .then(([catalogResult, nowPlayingResult, trendingResult, upcomingResult]) => {
        const catalog = catalogResult.status === "fulfilled" ? (catalogResult.value.data || []) : [];
        backendCatalogRef.current = catalog;

        const nowPlaying = nowPlayingResult.status === "fulfilled"
          ? enrichTmdbWithCatalog(parseTmdbPayload(nowPlayingResult.value.data), catalog)
          : [];
        const trending = trendingResult.status === "fulfilled"
          ? enrichTmdbWithCatalog(parseTmdbPayload(trendingResult.value.data), catalog)
          : [];
        const upcoming = upcomingResult.status === "fulfilled"
          ? enrichTmdbWithCatalog(parseTmdbPayload(upcomingResult.value.data), catalog)
          : [];

        if (nowPlaying.length > 0) {
          setMoviesNowPlaying(nowPlaying);
        } else {
          setMoviesNowPlaying([]);
        }

        if (trending.length > 0) {
          setMoviesTrending(trending);
        } else {
          setMoviesTrending([]);
        }

        if (upcoming.length > 0) {
          setMoviesUpcoming(upcoming);
        } else {
          setMoviesUpcoming([]);
        }

        const hasTmdbData = nowPlaying.length > 0 || trending.length > 0 || upcoming.length > 0;
        if (!hasTmdbData) {
          setApiError(true);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load movies:", err);
        setApiError(true);
        setMoviesNowPlaying([]);
        setMoviesTrending([]);
        setMoviesUpcoming([]);
        setLoading(false);
      });
  }, []);

  // Extracted from the mount effect so the city picker can retry. The request-id guard keeps the
  // original cancellation semantics: only the newest call is allowed to write state.
  const cityLoadRef = useRef(0);
  const loadCities = useCallback(() => {
    const requestId = ++cityLoadRef.current;
    const isStale = () => requestId !== cityLoadRef.current;

    setCityBootstrapLoading(true);
    setCityListError("");

    fetchCities()
      .then((cities) => {
        if (isStale()) return;
        const displays = cities.map(citySearchResultToDisplay);
        setAvailableCities(displays);
        const persisted = localStorage.getItem("cinex_city")?.trim() || "";
        const restored = displays.find((city) => city.city.toLowerCase() === persisted.toLowerCase());
        if (restored && restored.cinexAvailable) {
          setCurrentCity(restored.city);
          localStorage.setItem("cinex_city", restored.city);
          setCityModalOpen(false);
        } else {
          setCurrentCity("");
          localStorage.removeItem("cinex_city");
          setCityModalOpen(true);
        }
      })
      .catch(() => {
        if (isStale()) return;
        // A failed catalog fetch is not evidence that the saved city is invalid — showtimes,
        // availability and city search all work without /api/cities. So keep the user's city and
        // only force the picker open when there is none, this time with a message and a retry
        // instead of the previous blank, non-dismissible modal.
        setCityListError("Unable to load the city list right now.");
        if (!localStorage.getItem("cinex_city")?.trim()) {
          setCurrentCity("");
          setCityModalOpen(true);
        }
      })
      .finally(() => {
        if (!isStale()) setCityBootstrapLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCities();
    // Invalidate any in-flight catalog request on unmount.
    return () => { cityLoadRef.current++; };
  }, [loadCities]);

  useEffect(() => {
    if (!cityBootstrapLoading && currentCity) {
      fetchCityCinemaData(currentCity, homeScreeningLang);
    }
  }, [cityBootstrapLoading, currentCity, homeScreeningLang, fetchCityCinemaData]);

  useEffect(() => {
    fetchAllMovies();
  }, [fetchAllMovies]);

  useEffect(() => {
    if (isLoaded && !sessionStorage.getItem(CINEX300_PROMPT_VISIT_KEY)) {
      setCouponOpen(true);
    }
  }, [isLoaded]);

  const dismissCoupon = () => {
    sessionStorage.setItem(CINEX300_PROMPT_VISIT_KEY, "true");
    setCouponOpen(false);
  };

  const completeCouponRedemption = (balance: number) => {
    sessionStorage.setItem(CINEX300_PROMPT_VISIT_KEY, "true");
    setCouponOpen(false);
    toast.success("₹300 added to your CineX Wallet.", { description: `New balance: ₹${balance.toFixed(2)}` });
    navigate("/wallet");
  };

  // Prevent double scrollbar by locking background scroll when any modal/overlay is open
  const isAnyModalActive = Boolean(couponOpen || cityModalOpen || isPaymentOpen || isHistoryOpen || isDetailOpen || isSeatOpen);
  useEffect(() => {
    if (isAnyModalActive) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, [isAnyModalActive]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty("--cx-header-height", `${header.offsetHeight}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  // Abandoned-checkout recovery links: /?recover=1&showId=...&movieId=...
  const recoveryHandledRef = useRef(false);
  useEffect(() => {
    if (recoveryHandledRef.current || loading) return;
    const params = new URLSearchParams(location.search);
    if (params.get("recover") !== "1") return;

    const showId = Number(params.get("showId"));
    const movieId = Number(params.get("movieId"));
    if (!showId) return;

    recoveryHandledRef.current = true;
    try {
      sessionStorage.setItem(SEAT_SESSION_KEY, JSON.stringify({
        showId,
        theatreName: params.get("theatre") || undefined,
        showTime: params.get("showTime") || undefined,
        movieTitle: params.get("movieTitle") || undefined,
      }));
    } catch { /* ignore */ }

    navigate("/", { replace: true });

    if (movieId) {
      const catalogMovie = [...moviesNowPlaying, ...moviesTrending, ...moviesUpcoming]
        .find((movie) => Number(movie.id) === movieId || Number(movie.tmdbId) === movieId);
      if (catalogMovie) {
        handleMovieClick(catalogMovie);
      }
    }

    setCurrentShowId(showId);
    if (params.get("theatre")) setCurrentTheatre(params.get("theatre")!);
    if (params.get("showTime")) setCurrentTime(params.get("showTime")!);
    setIsSeatOpen(true);
    setSeatsLoading(true);
    api.get(`/api/shows/${showId}/seats`, { skipAuth: true })
      .then(res => setShowSeats(res.data || []))
      .catch(() => toast.error("Unable to restore your saved show."))
      .finally(() => setSeatsLoading(false));
  }, [loading, location.search, moviesNowPlaying, moviesTrending, moviesUpcoming, navigate]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchUserBookings();
    } else if (isLoaded) {
      setUserBookings([]);
    }
  }, [isLoaded, user?.id, fetchUserBookings]);

  const nowShowingMovies = useMemo(() => {
    return buildNowShowingDisplay(
      moviesNowPlaying,
      cityBookableTmdbIds,
      cityBookableMeta,
      homeScreeningLang
    );
  }, [moviesNowPlaying, cityBookableTmdbIds, cityBookableMeta, homeScreeningLang]);

  const bookableCountInCity = cityBookableTmdbIds.size;

  // "The backend says this city has no CineX theatres" is a different situation from "no showtimes
  // today", and must not be reported as an error. Derived from the catalog's cinexAvailable flag.
  const cityHasNoTheatres = useMemo(
    () => resolveCityAvailabilityStatus(availableCities, currentCity) === "no-theatres",
    [availableCities, currentCity]
  );

  const trendingDisplay = moviesTrending;
  const upcomingDisplay = moviesUpcoming;

  const carouselMovies = useMemo(
    () => buildHeroCarouselMovies([moviesNowPlaying, trendingDisplay, moviesUpcoming]),
    [moviesNowPlaying, trendingDisplay, moviesUpcoming],
  );
  useEffect(() => {
    if (carouselMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselMovies.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselMovies.length]);

  const handleMovieClick = (movie: any) => {
    if (!movie) return;
    const tmdbId = Number(movie.tmdbId ?? movie.id);
    const enrichedMovie = {
      ...movie,
      id: tmdbId,
      tmdbId,
      poster_path: movie.poster_path || null,
      backdrop_path: movie.backdrop_path || null,
      trailerPlaybackUrl: movie.trailerPlaybackUrl ?? cityBookableMeta[tmdbId]?.trailerPlaybackUrl ?? null,
      trailerObjectKey: movie.trailerObjectKey ?? cityBookableMeta[tmdbId]?.trailerObjectKey ?? null,
    };
    setCurrentMovie(enrichedMovie);
    setSelectedShow(null);
    setShows([]);
    setShowsError("");
    setSelectedDetailDate("");
    setDetailLanguages([]);
    setDetailScreeningLang("all");
    setDetailExtrasError("");
    setMovieCast([]);
    setMovieCrew([]);
    setSimilarMovies([]);
    setIsDetailOpen(true);

    setDetailLoading(true);
    Promise.all([
      fetchTmdbMovieDetails(tmdbId).catch(() => null),
      fetchTmdbMovieCredits(tmdbId).catch(() => {
        setDetailExtrasError("Cast and crew could not be loaded right now.");
        return null;
      }),
      fetchTmdbSimilarMovies(tmdbId).catch(() => []),
    ])
      .then(([tmdbDetails, creditsPayload, similarPayload]) => {
        if (tmdbDetails && typeof tmdbDetails === "object") {
          setCurrentMovie((prev: any) => ({
            ...prev,
            ...tmdbDetails,
            id: tmdbId,
            tmdbId,
            poster_path: (tmdbDetails as any).poster_path ?? prev?.poster_path ?? null,
            backdrop_path: (tmdbDetails as any).backdrop_path ?? prev?.backdrop_path ?? null,
            trailerPlaybackUrl: prev?.trailerPlaybackUrl ?? null,
            trailerObjectKey: prev?.trailerObjectKey ?? null,
          }));
        }
        const { cast, crew } = parseTmdbCredits(creditsPayload);
        setMovieCast(cast);
        setMovieCrew(crew);
        setSimilarMovies(
          (similarPayload || [])
            .filter((item) => item && Number(item.id) !== tmdbId)
            .map((item) => mapTmdbSimilarMovie(item))
            .slice(0, 12)
        );
      })
      .catch(() => {
        setDetailExtrasError("Some movie details could not be loaded.");
      })
      .finally(() => setDetailLoading(false));

    if (!currentCity) {
      setShowsError("Choose your city to see showtimes.");
      return;
    }

    setShowsLoading(true);
    fetchShowsForTmdbMovie(tmdbId, currentCity)
      .then((showData) => {
        setShows(showData);
        setDetailLanguages([...new Set(showData.map((show) => show.screeningLanguage).filter(Boolean) as string[])]);
        if (showData.length === 0) {
          setShowsError(`No CineX showtimes available in ${currentCity}.`);
          setSelectedDetailDate("");
          return;
        }
        const dates = [...new Set(showData.map((show) => show.showDate))].sort();
        setSelectedDetailDate(dates[0]);
        fetchCityCinemaData(currentCity, homeScreeningLang);
      })
      .catch((err) => {
        console.error("Failed to load showtimes:", err);
        setShowsError("Unable to load showtimes. Please try again.");
        setShows([]);
      })
      .finally(() => setShowsLoading(false));

    if (location.pathname !== "/" && location.pathname !== "/movies") {
      navigate("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setCurrentMovie(null);
    setDetailLoading(false);
    setDetailExtrasError("");
    setMovieCast([]);
    setMovieCrew([]);
    setSimilarMovies([]);
  };

  const closeTrailerModal = useCallback(() => {
    setTrailerModalOpen(false);
    setTrailerModalUrl(null);
    setTrailerModalTitle("");
  }, []);

  const openTrailer = useCallback(async (movie: any) => {
    if (!movie) return;
    const tmdbId = Number(movie.tmdbId ?? movie.id);
    const title = typeof movie.title === "string" ? movie.title : "Movie";

    let playbackUrl = resolveTrailerPlaybackUrl({
      trailerPlaybackUrl: movie.trailerPlaybackUrl,
      trailerObjectKey: movie.trailerObjectKey,
    });

    if (!playbackUrl) {
      const bookableMeta = cityBookableMeta[tmdbId];
      playbackUrl = resolveTrailerPlaybackUrl(bookableMeta);
    }

    if (!playbackUrl) {
      try {
        const trailer = await fetchMovieTrailer(tmdbId);
        playbackUrl = resolveTrailerPlaybackUrl(trailer);
      } catch {
        playbackUrl = "";
      }
    }

    if (!playbackUrl) {
      toast.info("Trailer unavailable", {
        description: `No CineX trailer is available for ${title} yet.`,
      });
      return;
    }

    setTrailerModalTitle(title);
    setTrailerModalUrl(playbackUrl);
    setTrailerModalOpen(true);
  }, [cityBookableMeta]);

  const scrollToShowtimes = () => {
    document.getElementById("theatres-scroll-target")?.scrollIntoView({ behavior: "smooth" });
  };

  const openSeats = (show: CineXShow) => {
    if (!show?.id) {
      toast.error("Please select a valid showtime first.");
      return;
    }
    setSelectedShow(show);
    setCurrentShowId(show.id);
    setCurrentTheatre(show.theatreName || "Theatre");
    setCurrentTime(formatShowTime(show.showTime));
    setShowSeats([]);
    setSeatsLoading(true);
    setSelectedSeats([]);
    setLiveSeatStatus({});
    setIsSeatOpen(true);
    try {
      sessionStorage.setItem(SEAT_SESSION_KEY, JSON.stringify({
        showId: show.id,
        theatreName: show.theatreName,
        showTime: formatShowTime(show.showTime),
        movieTitle: currentMovie?.title,
        screenName: show.screenName,
      }));
    } catch { /* ignore */ }
    api.get(`/api/shows/${show.id}/seats`, { skipAuth: true })
      .then(res => setShowSeats(res.data || []))
      .catch(() => toast.error("Unable to load seats for this show."))
      .finally(() => setSeatsLoading(false));
  };

  // After Clerk sign-in (modal or redirect), keep the user on the same show/seat page.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let saved: {
      showId?: number;
      theatreName?: string;
      showTime?: string;
      screenName?: string;
      pendingSeatNumber?: string;
      pendingSeatId?: number;
      pendingPrice?: number;
    } | null = null;
    try {
      const raw = sessionStorage.getItem(SEAT_SESSION_KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      saved = null;
    }
    if (!saved?.showId) return;
    if (isSeatOpen && currentShowId === saved.showId) return;

    setCurrentShowId(saved.showId);
    if (saved.theatreName) setCurrentTheatre(saved.theatreName);
    if (saved.showTime) setCurrentTime(saved.showTime);
    setIsSeatOpen(true);
    setSeatsLoading(true);
    api.get(`/api/shows/${saved.showId}/seats`, { skipAuth: true })
      .then(res => {
        setShowSeats(res.data || []);
        if (saved?.screenName) {
          setSelectedShow(prev => prev?.id === saved.showId ? prev : {
            id: saved.showId!,
            movieId: prev?.movieId || 0,
            screenId: prev?.screenId || 0,
            theatreName: saved.theatreName || currentTheatre,
            screenName: saved.screenName,
            showTime: saved.showTime || "",
            showDate: prev?.showDate || "",
            screeningLanguage: prev?.screeningLanguage,
            price: prev?.price || 0,
            availableSeats: prev?.availableSeats || 0,
          });
        }
        if (saved?.pendingSeatId && userId) {
          const pendingId = Number(saved.pendingSeatId);
          const pendingNumber = saved.pendingSeatNumber || String(pendingId);
          const pendingPrice = saved.pendingPrice || 0;
          return api.post(`/api/shows/${saved.showId}/seats/lock`, {
            showId: saved.showId,
            seatIds: [pendingId],
            userId,
            action: "SELECT",
          }, {
            headers: { "X-Seat-Lock-Session": lockSessionIdRef.current },
          }).then((lockRes) => {
            if (lockRes.data === true) {
              recentlyLockedAtRef.current.set(pendingId, Date.now());
              setSelectedSeats(prev => prev.some(s => s.seatId === pendingId) ? prev : [...prev, { id: pendingNumber, price: pendingPrice, seatId: pendingId }]);
            }
            try { sessionStorage.removeItem(SEAT_SESSION_KEY); } catch { /* ignore */ }
          }).catch(() => {
            toast.warning("Seat Unavailable", { description: "The seat you chose before signing in could not be locked." });
          });
        }
      })
      .catch(() => toast.error("Unable to restore seats for this show."))
      .finally(() => setSeatsLoading(false));
  }, [isLoaded, isSignedIn, userId]);

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

    const refreshHeldSeats = () => {
      const gen = ++heldPollGenRef.current;
      return api.get(`/api/shows/${showIdVal}/seats/held`, { skipAuth: true })
        .then(res => {
          if (isStaleHeldPoll(gen, heldPollGenRef.current)) return;
          if (!Array.isArray(res.data)) return;

          const heldIds = new Set(res.data.map((seatId: number) => String(seatId)));
          const ownIds = new Set(
            selectedSeatsRef.current
              .map(seat => seat.seatId)
              .filter((id): id is number => typeof id === "number")
              .map(String)
          );

          setLiveSeatStatus(prev => {
            const next: Record<string, { status: 'HELD' | 'BOOKED' | 'AVAILABLE'; userId?: string }> = {};
            heldIds.forEach(seatId => {
              const existing = prev[seatId];
              next[seatId] = existing?.status === 'BOOKED'
                ? existing
                : { status: 'HELD', userId: existing?.userId || (ownIds.has(seatId) ? user?.id : undefined) };
            });
            Object.entries(prev).forEach(([seatId, info]) => {
              if (info.status === 'BOOKED') {
                next[seatId] = info;
              }
            });
            ownIds.forEach(seatId => {
              if (!next[seatId]) {
                next[seatId] = { status: 'HELD', userId: user?.id };
              }
            });
            return next;
          });

          const now = Date.now();
          const expiredSelections = selectedSeatsRef.current.filter(seat => {
            if (typeof seat.seatId !== "number") return false;
            return shouldDropLocalSelection({
              seatId: seat.seatId,
              heldIds,
              lockedAt: recentlyLockedAtRef.current.get(seat.seatId),
              now,
            });
          });
          if (expiredSelections.length > 0) {
            setSelectedSeats(prev => prev.filter(seat =>
              !(typeof seat.seatId === "number" && expiredSelections.some(expired => expired.seatId === seat.seatId))
            ));
            toast.warning("Seat hold expired", {
              description: `${expiredSelections.map(seat => seat.id).join(", ")} was released. Please select again.`,
            });
          }
        })
        .catch(err => {
          console.error("[CineX seats] held-seat poll failed", err);
        });
    };
    refreshHeldSeats();
    const heldSeatRefresh = window.setInterval(refreshHeldSeats, 15000);

    if (!isSignedIn) {
      return () => window.clearInterval(heldSeatRefresh);
    }

    void getToken().then((token) => {
      if (!token) {
        return;
      }
      const socket = new SockJS(`${API_BASE}/ws/seats`);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        connectHeaders: { Authorization: `Bearer ${token}` },
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
            } catch (e) {
              console.error("[CineX seats] STOMP payload parse failed", e);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error("[CineX seats] STOMP error", frame.headers, frame.body);
        toast.error("Live seat updates failed", { description: frame.headers["message"] || "STOMP error" });
      },
      onWebSocketError: () => {
        toast.error("Live seat updates failed", { description: "Could not connect to the seat WebSocket." });
      }
    });

    client.activate();
    stompClientRef.current = client;
    });

    return () => {
      window.clearInterval(heldSeatRefresh);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isSeatOpen, currentShowId, isSignedIn, user?.id, getToken]);

  const toggleSeat = (id: string, price: number, seatId?: number) => {
    // Only block briefly while Clerk is genuinely initializing.
    if (clerkStillInitializing) {
      toast.info("Please wait", { description: "Checking sign-in status…" });
      return;
    }

    if (!isSignedIn || !userId) {
      if (clerkLikelyMisconfigured || !CLERK_KEY_OK) {
        toast.error("Sign-in is not configured", {
          description: "Set a real VITE_CLERK_PUBLISHABLE_KEY (pk_test_…) in cinex-ui/.env.local and restart Vite.",
        });
        return;
      }
      // Preserve seat page context across Clerk modal / redirect.
      try {
        sessionStorage.setItem(SEAT_SESSION_KEY, JSON.stringify({
          showId: currentShowId,
          theatreName: currentTheatre,
          showTime: currentTime,
          movieTitle: currentMovie?.title,
          screenName: selectedShow?.screenName,
          pendingSeatNumber: id,
          pendingSeatId: seatId,
          pendingPrice: price,
        }));
      } catch { /* ignore */ }
      toast.info("Sign in to select seats");
      openSignIn();
      return;
    }

    if (seatId == null) {
      toast.info("This seat does not have a backend seat ID yet.");
      return;
    }
    const numId = Number(seatId);
    const showIdVal = currentShowId;
    const clerkId = userId;
    if (!Number.isFinite(numId)) {
      toast.error("Invalid seat ID");
      return;
    }
    if (showIdVal == null) {
      toast.info("Real show selection is not available yet.");
      return;
    }
    if (lockInFlightRef.current.has(numId)) return;

    const isCurrentlySelected = selectedSeatsRef.current.some(s => s.seatId === numId || s.id === id);
    const payload = { showId: showIdVal, seatIds: [numId], userId: clerkId, action: isCurrentlySelected ? "RELEASE" : "SELECT" };

    if (isCurrentlySelected) {
      lockInFlightRef.current.add(numId);
      api.delete(`/api/shows/${showIdVal}/seats/lock`, {
        headers: { "X-Seat-Lock-Session": lockSessionIdRef.current },
        data: payload
      }).then(() => {
        recentlyLockedAtRef.current.delete(numId);
        setSelectedSeats(prev => prev.filter(s => s.seatId !== numId && s.id !== id));
      }).catch(err => {
        toast.error("Could not release seat. Please try again.");
        console.error("[CineX seats] unlock failed", err);
      }).finally(() => {
        lockInFlightRef.current.delete(numId);
      });
      return;
    }

    lockInFlightRef.current.add(numId);
    void getToken().then(token => {
      if (!token) {
        lockInFlightRef.current.delete(numId);
        toast.info("Sign in to select seats");
        openSignIn();
        return;
      }
      return api.post(`/api/shows/${showIdVal}/seats/lock`, payload, {
        // Reuse the token that just passed the sign-in readiness check. This avoids a
        // second Clerk token lookup racing session restoration after a page refresh.
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Seat-Lock-Session": lockSessionIdRef.current,
        }
      }).then(res => {
        if (res.data !== true) {
          toast.warning("Seat Unavailable", { description: `Seat ${id} could not be locked.` });
          return;
        }
        heldPollGenRef.current += 1;
        recentlyLockedAtRef.current.set(numId, Date.now());
        setSelectedSeats(prev => prev.some(s => s.seatId === numId) ? prev : [...prev, { id, price, seatId: numId }]);
        try { sessionStorage.removeItem(SEAT_SESSION_KEY); } catch { /* ignore */ }
      }).catch(err => {
        if (err.response?.status === 409) {
          toast.warning("Seat Unavailable", { description: `Seat ${id} is currently held by another user. Please choose another seat.` });
        } else if (err.response?.status === 401) {
          toast.info("Sign in to select seats");
          openSignIn();
        } else {
          toast.error(getApiErrorMessage(err, "Seat lock failed. Please try again."));
        }
        api.get(`/api/shows/${showIdVal}/seats`, { skipAuth: true })
          .then(res => setShowSeats(res.data || []))
          .catch(() => {});
      }).finally(() => {
        lockInFlightRef.current.delete(numId);
      });
    }).catch(() => {
      lockInFlightRef.current.delete(numId);
      toast.error("Could not get your session token. Please sign in again.");
      openSignIn();
    });
  };

  const totalPrice = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const selectedSeatIds = useMemo(
    () => new Set(selectedSeats.map((s) => s.seatId).filter((id): id is number => typeof id === "number")),
    [selectedSeats]
  );

  const clearCityDependentBookingState = useCallback(() => {
    setIsSeatOpen(false);
    setIsPaymentOpen(false);
    setPaymentSuccess(false);
    setProcessing(false);
    setPaymentError("");
    setSelectedSeats([]);
    setLiveSeatStatus({});
    setCurrentShowId(null);
    setSelectedShow(null);
    setShowSeats([]);
    setCurrentTheatre("");
    setCurrentTime("");
    try {
      sessionStorage.removeItem(SEAT_SESSION_KEY);
    } catch { /* ignore */ }
  }, []);

  const selectCity = (city: string) => {
    const changed = city !== currentCity;
    setCurrentCity(city);
    localStorage.setItem("cinex_city", city);
    setCityModalOpen(false);
    setHomeScreeningLang("all");
    setDetailScreeningLang("all");

    // The picker closes on select, so say it here too: the user searched for a city we track but
    // do not screen in yet, and needs to know that before wondering where the showtimes went.
    if (resolveCityAvailabilityStatus(availableCities, city) === "no-theatres") {
      toast.info(`${city} is not listed on CineX yet`, {
        description: "We have no theatres there so far. Pick a nearby city to book tickets.",
      });
    }

    if (changed) {
      clearCityDependentBookingState();
      if (isDetailOpen && currentMovieRef.current) {
        const movie = currentMovieRef.current;
        const tmdbId = Number(movie.tmdbId ?? movie.id);
        loadShowsForMovie(movie, city).then(() => fetchCityCinemaData(city, "all"));
        if (tmdbId) {
          fetchTmdbMovieDetails(tmdbId).catch(() => null);
        }
      } else if (isDetailOpen) {
        setIsDetailOpen(false);
        setCurrentMovie(null);
      }
    }
  };

  const closeCitySelector = () => {
    if (currentCity) setCityModalOpen(false);
  };

  useEffect(() => {
    if (!isPaymentOpen || !isSignedIn) return;
    let cancelled = false;
    api.get("/api/wallet")
      .then((res) => {
        if (!cancelled) setWalletBalance(Number(res.data?.balance ?? 0));
      })
      .catch(() => {
        if (!cancelled) setWalletBalance(null);
      });
    return () => { cancelled = true; };
  }, [isPaymentOpen, isSignedIn]);

  const processPayment = () => {
    setProcessing(true);
    setPaymentError("");

    if (!isSignedIn || !user?.id) {
      setProcessing(false);
      openSignIn();
      return;
    }
    
    if (paymentMethod === "RAZORPAY" && !(window as any).Razorpay) {
      setPaymentError("Razorpay SDK failed to load. Please check your network connection or disable adblockers.");
      setProcessing(false);
      return;
    }

    const reqBody = {
      showId: currentShowId,
      seatIds: selectedSeats
        .map(seat => seat.seatId)
        .filter((seatId): seatId is number => typeof seatId === "number"),
      userEmail: user.primaryEmailAddress?.emailAddress,
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
        if (paymentMethod === "WALLET") {
          return api.post(`/api/payments/wallet?bookingId=${bookingId}`)
            .then(async (walletRes) => {
              const ticketToken = walletRes.data?.ticketToken as string | undefined;
              let confirmed = {
                bookingId, movieTitle: currentMovie?.title || "Movie", posterPath: currentMovie?.poster_path || "",
                theatreName: selectedShow?.theatreName || currentTheatre || "CineX Theatre", screenName: selectedShow?.screenName,
                screeningLanguage: selectedShow?.screeningLanguage, showDate: selectedShow?.showDate || "",
                showTime: selectedShow?.showTime ? formatShowTime(selectedShow.showTime) : currentTime,
                seats: selectedSeats.map(s => s.id), totalAmount: totalPrice, ticketToken, ticketQrUrl: undefined as string | undefined,
              };
              try {
                const bookingRes = await api.get(`/api/bookings/${bookingId}`);
                const booking = bookingRes.data || {};
                confirmed = { ...confirmed, movieTitle: booking.movieTitle || confirmed.movieTitle,
                  posterPath: booking.posterPath || confirmed.posterPath, theatreName: booking.theatreName || confirmed.theatreName,
                  screenName: booking.screenName || confirmed.screenName, showDate: booking.showDate || confirmed.showDate,
                  showTime: booking.showTime ? formatShowTime(booking.showTime) : confirmed.showTime,
                  seats: booking.seatNumbers || booking.seats || confirmed.seats,
                  totalAmount: booking.totalAmount ?? booking.amount ?? confirmed.totalAmount, ticketToken: booking.ticketToken || ticketToken };
              } catch { /* retain local confirmation */ }
              if (confirmed.ticketToken) {
                try { confirmed.ticketQrUrl = await fetchAuthenticatedBlobUrl(`/api/tickets/qr/${confirmed.ticketToken}`); } catch { /* optional preview */ }
              }
              setWalletBalance((balance) => balance == null ? balance : Math.max(0, balance - confirmed.totalAmount));
              setProcessing(false); setLastBooking(confirmed); setPaymentSuccess(true);
              toast.success("Wallet payment confirmed!", { description: `Your tickets for ${confirmed.movieTitle} are ready.` });
              fetchUserBookings();
            });
        }
        // Step 2: Create Razorpay Order on backend
        return api.post(`/api/payments/create-order`, {
          bookingId: bookingId,
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
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              .then(async (verifyRes) => {
                const ticketToken = verifyRes.data?.ticketToken as string | undefined;
                let confirmed = {
                  bookingId,
                  movieTitle: currentMovie?.title || "Movie",
                  posterPath: currentMovie?.poster_path || "",
                  theatreName: selectedShow?.theatreName || currentTheatre || "CineX Theatre",
                  screenName: selectedShow?.screenName,
                  screeningLanguage: selectedShow?.screeningLanguage,
                  showDate: selectedShow?.showDate || "",
                  showTime: selectedShow?.showTime ? formatShowTime(selectedShow.showTime) : currentTime,
                  seats: selectedSeats.map(s => s.id),
                  totalAmount: totalPrice,
                  ticketToken,
                  ticketQrUrl: undefined as string | undefined,
                };
                try {
                  const bookingRes = await api.get(`/api/bookings/${bookingId}`);
                  const b = bookingRes.data || {};
                  confirmed = {
                    ...confirmed,
                    movieTitle: b.movieTitle || confirmed.movieTitle,
                    posterPath: b.posterPath || confirmed.posterPath,
                    theatreName: b.theatreName || confirmed.theatreName,
                    screenName: b.screenName || confirmed.screenName,
                    showDate: b.showDate || confirmed.showDate,
                    showTime: b.showTime ? formatShowTime(b.showTime) : confirmed.showTime,
                    seats: b.seatNumbers || b.seats || confirmed.seats,
                    totalAmount: b.totalAmount ?? b.amount ?? confirmed.totalAmount,
                    ticketToken: b.ticketToken || ticketToken,
                  };
                } catch { /* keep local confirmation data */ }
                if (confirmed.ticketToken) {
                  try {
                    confirmed.ticketQrUrl = await fetchAuthenticatedBlobUrl(`/api/tickets/qr/${confirmed.ticketToken}`);
                  } catch { /* QR preview optional */ }
                }
                setProcessing(false);
                setLastBooking(confirmed);
                setPaymentSuccess(true);
                toast.success("Payment Confirmed!", {
                  description: `Your tickets for ${confirmed.movieTitle} are ready.`
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

  const languageFilteredShows = shows.filter((show) =>
    detailScreeningLang === "all" || show.screeningLanguage === detailScreeningLang
  );
  const filteredShowsForDate = languageFilteredShows.filter(s => !selectedDetailDate || s.showDate === selectedDetailDate);
  const showDates = [...new Set(languageFilteredShows.map(s => s.showDate))].sort();

  const groupedTheatreShows = useMemo(() => {
    const groups = new Map<string, {
      theatreId: number;
      theatreName: string;
      city: string;
      screenName: string;
      languageGroups: { language: string; shows: CineXShow[] }[];
    }>();
    filteredShowsForDate.forEach((show) => {
      const key = String(show.theatreId || show.screenId);
      let group = groups.get(key);
      if (!group) {
        group = {
          theatreId: show.theatreId || show.screenId,
          theatreName: show.theatreName || `Screen ${show.screenId}`,
          city: show.city || currentCity,
          screenName: show.screenName || "",
          languageGroups: [],
        };
        groups.set(key, group);
      }
      const lang = show.screeningLanguage || "General";
      let langGroup = group.languageGroups.find((entry) => entry.language === lang);
      if (!langGroup) {
        langGroup = { language: lang, shows: [] };
        group.languageGroups.push(langGroup);
      }
      langGroup.shows.push(show);
    });
    groups.forEach((group) => {
      group.languageGroups.forEach((langGroup) => {
        langGroup.shows.sort((a, b) => a.showTime.localeCompare(b.showTime));
      });
    });
    return Array.from(groups.values());
  }, [filteredShowsForDate, currentCity]);

  const formatShowDateLabel = formatShowDate;

  const renderFooter = () => (
    <footer className="cx-footer">
      <CinexLogo height={28} className="cx-footer-logo" onClick={() => { closeDetail(); closeSeats(); setIsPaymentOpen(false); setIsHistoryOpen(false); navigate("/"); }} />
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
        <a
          href="#"
          className={mobileSearchOpen || searchQuery ? "active" : ""}
          onClick={(e) => { e.preventDefault(); openMobileSearch(); }}
        >
          <Search size={20} />Search
        </a>
        <a href="#" className={isHistoryOpen ? "active" : ""} onClick={(e) => { e.preventDefault(); setIsHistoryOpen(true); }}><Ticket size={20} />Bookings</a>
        {isSignedIn ? (
          <Link to="/profile" className={location.pathname === "/profile" ? "active" : ""}>
            <User size={20} />Profile
          </Link>
        ) : (
          <a
            href="#signin"
            className=""
            onClick={(e) => {
              e.preventDefault();
              if (clerkStillInitializing) return;
              if (!CLERK_KEY_OK || clerkLikelyMisconfigured) {
                toast.error("Sign-in is not configured", {
                  description: "Set VITE_CLERK_PUBLISHABLE_KEY=pk_test_… in cinex-ui/.env.local and restart Vite.",
                });
                return;
              }
              openSignIn();
            }}
          >
            <Lock size={20} />Sign In
          </a>
        )}
      </div>
    </nav>
  );

  if (isAdminOpen) {
    return <AdminPortal onExit={() => setIsAdminOpen(false)} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="cx-app-shell">
      <CinexToaster />

      {!CLERK_KEY_OK && (
        <div className="cx-error-banner" role="status">
          Clerk is not configured. Set <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_…</code> in{" "}
          <code>cinex-ui/.env.local</code>, then restart the Vite server. You can browse seats without signing in;
          locking seats requires a valid Clerk key.
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className="cx-header" ref={headerRef}>
        <div className="cx-header-inner">
          <CinexLogo height={34} className="cx-logo" onClick={() => { closeDetail(); closeSeats(); setIsPaymentOpen(false); setIsHistoryOpen(false); navigate("/"); }} />
          <nav className="cx-nav">
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>Movies</Link>
            <Link to="/events" className={location.pathname === "/events" ? "active" : ""}>Theatres</Link>
          </nav>
          <div className="cx-search cx-search-desktop">
            <Search size={16} color="var(--text3)" />
            <input
              type="search"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") clearSearch(); }}
              ref={searchInputRef}
              aria-label="Search movies"
            />
            {searchQuery && (
              <button
                type="button"
                className="cx-search-clear"
                onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="cx-header-actions">
            <button className="cx-location" onClick={() => setCityModalOpen(true)}>
              <MapPin size={16} />
              {currentCity || "Select city"}
            </button>
            <div id="auth-section" className="cx-auth-controls">
              <AuthControls
                isAdminUser={isAdminUser}
                wishlistCount={wishlistCount}
                onOpenTickets={() => setIsHistoryOpen(true)}
                onOpenAdmin={() => setIsAdminOpen(true)}
              />
            </div>
          </div>
        </div>
        {(mobileSearchOpen || searchQuery) && (
          <div className="cx-mobile-search">
            <div className="cx-search">
              <Search size={16} color="var(--text3)" />
              <input
                type="search"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") clearSearch(); }}
                ref={mobileSearchInputRef}
                aria-label="Search movies"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="cx-search-clear"
                  onClick={() => { setSearchQuery(""); mobileSearchInputRef.current?.focus(); }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="cx-search-clear"
                  onClick={clearSearch}
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Main Dashboard Content ── */}
      <main>
        {apiError && (
          <div className="cx-error-banner">
            Unable to load movies right now. Please try again.
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
            ) : debouncedSearchQuery.trim().length >= 2 ? (
              <div className="cx-page" style={{ paddingTop: '2rem' }}>
                <div className="cx-section-head">
                  <h2 className="cx-section-title">Search Results for "{debouncedSearchQuery}"</h2>
                </div>
                
                {isSearching ? (
                  <div className="cx-movie-row">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="cx-movie-card">
                        <div className="shad-skeleton cx-poster-wrap" style={{ aspectRatio: "2/3" }} />
                      </div>
                    ))}
                  </div>
                ) : searchError ? (
                  <div className="cx-empty-state">
                    <p>{searchError}</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="cx-movie-grid">
                    {searchResults.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => handleMovieClick(movie)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="cx-empty-state" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text2)' }}>
                    <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                    <h3>No movies found</h3>
                    <p>We couldn't find anything matching "{debouncedSearchQuery}".</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {carouselMovies.length > 0 && (
                  <div className="cx-home-hero-slot">
                  <section className="cx-hero">
                    {carouselMovies.map((movie, idx) => {
                      const backdropUrl = resolveMovieBackdropUrl(movie);
                      return (
                      <div key={movie.id} className={`cx-hero-slide${idx === currentSlide ? " is-active" : ""}`}>
                        <MediaCoverImage src={backdropUrl} loading={idx === 0 ? "eager" : "lazy"} />
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
                            <button className="btn-outline" onClick={() => openTrailer(movie)}>
                              <Play size={16} /> Watch Trailer
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                    {carouselMovies.length > 1 && (
                      <div className="cx-carousel-dots">
                        {carouselMovies.map((_, idx) => (
                          <button key={idx} className={`cx-dot ${idx === currentSlide ? "active" : ""}`} onClick={() => setCurrentSlide(idx)} aria-label={`Slide ${idx + 1}`} />
                        ))}
                      </div>
                    )}
                  </section>
                  </div>
                )}

                <div className="cx-page">
                  <section className="cx-section">
                    <div className="cx-section-head" style={{ alignItems: "center", marginBottom: "1.25rem" }}>
                      <div>
                        <h2 style={{ fontSize: "1.55rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>
                          Recommended Movies
                        </h2>
                        {currentCity && (
                          <p style={{ fontSize: "0.84rem", color: "var(--text2)", marginTop: "0.2rem" }}>
                            Now showing in {currentCity}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div className="cx-filters">
                          {cityCatalogLoading && (
                            <span className="cx-filter-loading" aria-live="polite">Updating showtimes…</span>
                          )}
                          <button
                            className={`cx-filter-btn ${homeScreeningLang === "all" ? "active" : ""}`}
                            onClick={() => setHomeScreeningLang("all")}
                          >
                            All Languages
                          </button>
                          {cityLanguages.map((lang) => (
                            <button
                              key={lang}
                              className={`cx-filter-btn ${homeScreeningLang === lang ? "active" : ""}`}
                              onClick={() => setHomeScreeningLang(lang)}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="cx-see-all-link"
                          onClick={() => setHomeScreeningLang("all")}
                          style={{
                            color: "#FF3D5A",
                            fontSize: "0.92rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.15rem",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: 0
                          }}
                        >
                          See All &rsaquo;
                        </button>
                      </div>
                    </div>
                    <MovieCarousel ariaLabel={`Now showing movies in ${currentCity}`}>
                      {loading && (
                        <>
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="cx-movie-card cx-movie-card-ref">
                              <div className="shad-skeleton cx-poster-wrap cx-poster-wrap-ref" style={{ aspectRatio: "2/3" }} />
                            </div>
                          ))}
                        </>
                      )}
                      {!loading && apiError && moviesNowPlaying.length === 0 && (
                        <p className="cx-empty-msg">Unable to load movies right now. Please try again.</p>
                      )}
                      {!loading && cityCatalogError && (
                        <p className="cx-empty-msg">{cityCatalogError}</p>
                      )}
                      {!loading && !currentCity && (
                        <p className="cx-empty-msg">Choose your city to see available movies and showtimes.</p>
                      )}
                      {!loading && currentCity && cityHasNoTheatres && (
                        <p className="cx-empty-msg">
                          {currentCity} is not listed on CineX yet — we have no theatres there so far,
                          so there is nothing to book. Pick a nearby city to continue.
                        </p>
                      )}
                      {!loading && currentCity && !cityHasNoTheatres && moviesNowPlaying.length > 0 && bookableCountInCity === 0 && (
                        <p className="cx-empty-msg">
                          Currently showing in India — no CineX showtimes available in {currentCity} right now.
                        </p>
                      )}
                      {!loading && currentCity && !cityHasNoTheatres && moviesNowPlaying.length > 0
                        && homeScreeningLang !== "all" && nowShowingMovies.length === 0 && (
                        <p className="cx-empty-msg">
                          No CineX showtimes in {homeScreeningLang} for {currentCity}.
                        </p>
                      )}
                      {!loading && nowShowingMovies.map((m) => (
                        <MovieCard
                          key={m.id}
                          movie={m}
                          onClick={() => handleMovieClick(m)}
                          isWishlisted={isWishlisted(m.id)}
                          onToggleWishlist={toggleWishlist}
                        />
                      ))}
                    </MovieCarousel>
                  </section>

                  <section className="cx-section">
                    <div className="cx-section-head">
                      <h2 className="cx-section-title">Coming Soon</h2>
                      <span className="cx-section-link">View All</span>
                    </div>
                    <div className="cx-coming-list">
                      {loading && <p className="cx-empty-msg">Loading movies...</p>}
                      {!loading && upcomingDisplay.length === 0 && (
                        <p className="cx-empty-msg">Unable to load upcoming movies. Please try again.</p>
                      )}
                      {upcomingDisplay.slice(0, 4).map(m => (
                        <div key={m.id} className="cx-coming-card" onClick={() => handleMovieClick(m)}>
                          <div className="cx-coming-thumb">
                            <img src={resolveMediaUrl(m.poster_path, "poster")} alt={m.title} loading="lazy" />
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
                      {loading && <p className="cx-empty-msg">Loading trending movies...</p>}
                      {!loading && trendingDisplay.length === 0 && (
                        <p className="cx-empty-msg">Unable to load trending movies. Please try again.</p>
                      )}
                      {trendingDisplay.slice(0, 3).map((m, idx) => (
                        <div key={m.id} className={`cx-trend-card ${idx === 0 ? "featured" : ""}`} onClick={() => handleMovieClick(m)}>
                          <div className="cx-trend-bg" style={{ backgroundImage: (() => {
                            const url = resolveMediaUrl(m.backdrop_path || m.poster_path, "backdrop") || resolveMediaUrl(m.poster_path, "poster");
                            return url ? `url(${url})` : undefined;
                          })() }} />
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
          <Route path="/profile" element={<ProfilePage wishlistCount={wishlistCount} bookings={userBookings} ticketQrUrls={ticketQrUrls} onOpenBookings={() => setIsHistoryOpen(true)} onBookMovie={m => handleMovieClick(m)} onRefreshBookings={fetchUserBookings} />} />
          <Route path="/wallet" element={<WalletPage onClaimCoupon={() => setCouponOpen(true)} />} />
          <Route path="/my-bookings" element={<ProfilePage wishlistCount={wishlistCount} bookings={userBookings} ticketQrUrls={ticketQrUrls} onOpenBookings={() => setIsHistoryOpen(true)} onBookMovie={m => handleMovieClick(m)} onRefreshBookings={fetchUserBookings} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <CouponRedeemModal open={couponOpen} isSignedIn={isSignedIn} onClose={dismissCoupon} onSignIn={openSignIn} onRedeemed={completeCouponRedemption} />
      <TrailerModal
        open={trailerModalOpen}
        title={trailerModalTitle}
        playbackUrl={trailerModalUrl}
        onClose={closeTrailerModal}
      />

      {/* ── City Picker Modal ── */}
      <AnimatePresence>
        {cityModalOpen && (
          <CitySelectorModal
            open={cityModalOpen}
            cities={availableCities}
            currentCity={currentCity}
            onSelectCity={selectCity}
            onClose={closeCitySelector}
            listLoading={cityBootstrapLoading}
            listError={cityListError}
            onRetryList={loadCities}
            required={!currentCity}
          />
        )}
      </AnimatePresence>

      {/* ── Movie Detail Full-Screen View ── */}
      <div className={`movie-detail-view ${isDetailOpen ? "active" : ""}`} ref={detailRef}>
        {currentMovie && (
          <>
            <div className="detail-hero-banner">
              <MediaCoverImage src={resolveMovieBackdropUrl(currentMovie)} />
              <div className="detail-hero-gradient" aria-hidden="true" />
              <button type="button" className="detail-back" onClick={closeDetail} aria-label="Go back">
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className="detail-hero-play"
                onClick={() => openTrailer(currentMovie)}
                aria-label={`Watch trailer for ${currentMovie.title}`}
              >
                <Play size={22} fill="currentColor" />
              </button>
            </div>

            <div className="detail-page-body">
              <div className="detail-page-grid">
                <div className="detail-top-row">
                  <div className="detail-poster">
                    <img src={resolveMediaUrl(currentMovie.poster_path, "poster")} alt={currentMovie.title} />
                  </div>
                  <div className="detail-headline">
                    {shows.length > 0 && (
                      <span className="detail-status-badge">In Theatres</span>
                    )}
                    <h1 className="detail-title">{currentMovie.title}</h1>
                    <p className="detail-subline">
                      {[
                        getReleaseYear(currentMovie.release_date),
                        formatRuntime(currentMovie.runtime),
                      ].filter(Boolean).join(" • ")}
                    </p>
                    {Number(currentMovie.vote_average) > 0 && (
                      <div className="detail-rating-row">
                        <span className="detail-rating-score">
                          <Star size={15} fill="var(--coral)" color="var(--coral)" />
                          {Number(currentMovie.vote_average).toFixed(1)}/10
                        </span>
                        <span className="detail-rating-label">TMDB</span>
                        {typeof currentMovie.vote_count === "number" && currentMovie.vote_count > 0 && (
                          <span className="detail-rating-votes">
                            {formatCompactCount(currentMovie.vote_count)}+ Ratings
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <aside className="detail-sidebar-col">
                  <VibeChart movie={currentMovie} loading={detailLoading} />

                  <div className="detail-sidebar-meta">
                    {getDirectors(movieCrew).length > 0 && (
                      <div className="detail-sidebar-meta-row">
                        <span className="detail-sidebar-meta-label">Director</span>
                        <span className="detail-sidebar-meta-value">
                          {getDirectors(movieCrew).map((member) => member.name).join(", ")}
                        </span>
                      </div>
                    )}
                    {getProductionCountries(currentMovie).length > 0 && (
                      <div className="detail-sidebar-meta-row">
                        <span className="detail-sidebar-meta-label">Country</span>
                        <span className="detail-sidebar-meta-value">
                          {getProductionCountries(currentMovie).join(", ")}
                        </span>
                      </div>
                    )}
                    {currentMovie.original_language && (
                      <div className="detail-sidebar-meta-row">
                        <span className="detail-sidebar-meta-label">Language</span>
                        <span className="detail-sidebar-meta-value">
                          {getLangLabel(currentMovie.original_language)}
                        </span>
                      </div>
                    )}
                    {(currentMovie.certification || currentMovie.adult === true) && (
                      <div className="detail-sidebar-meta-row">
                        <span className="detail-sidebar-meta-label">Age Rating</span>
                        <span className="detail-sidebar-meta-value">
                          {currentMovie.certification || (currentMovie.adult ? "18+" : "")}
                        </span>
                      </div>
                    )}
                    {formatReleaseDate(currentMovie.release_date) && (
                      <div className="detail-sidebar-meta-row">
                        <span className="detail-sidebar-meta-label">Release</span>
                        <span className="detail-sidebar-meta-value">
                          {formatReleaseDate(currentMovie.release_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="detail-sidebar-actions">
                    <button type="button" className="btn-primary detail-sidebar-btn" onClick={scrollToShowtimes}>
                      <Ticket size={16} /> Book Tickets
                    </button>
                    <button
                      type="button"
                      className={`btn-primary detail-sidebar-btn detail-wishlist-btn${isWishlisted(Number(currentMovie.id)) ? " is-active" : ""}`}
                      onClick={() => toggleWishlist({
                        id: Number(currentMovie.id),
                        title: currentMovie.title,
                        poster_path: currentMovie.poster_path,
                        vote_average: currentMovie.vote_average,
                        original_language: currentMovie.original_language,
                        genre_ids: currentMovie.genre_ids,
                        overview: currentMovie.overview,
                      })}
                    >
                      <Bookmark size={16} fill={isWishlisted(Number(currentMovie.id)) ? "currentColor" : "none"} />
                      {isWishlisted(Number(currentMovie.id)) ? "Saved to Wishlist" : "Add to Wishlist"}
                    </button>
                    <button
                      type="button"
                      className="btn-outline detail-sidebar-btn"
                      onClick={() => openTrailer(currentMovie)}
                    >
                      <Play size={16} /> Watch Trailer
                    </button>
                  </div>
                </aside>

                <div className="detail-main-content">
                  <section className="detail-block detail-overview-block">
                    <h2 className="detail-block-title">Overview</h2>
                    {detailLoading ? (
                      <div className="detail-overview-skeleton shad-skeleton" aria-hidden="true" />
                    ) : (
                      <p className="detail-overview">
                        {currentMovie.overview || "No description is available for this title yet."}
                      </p>
                    )}
                    {extractTmdbGenres(currentMovie).length > 0 && (
                      <div className="detail-genre-tags">
                        {extractTmdbGenres(currentMovie).map((genre) => (
                          <span key={genre.id} className="detail-genre-tag">{genre.name}</span>
                        ))}
                      </div>
                    )}
                    {detailExtrasError && (
                      <p className="detail-inline-error">{detailExtrasError}</p>
                    )}
                  </section>

                  <section className="detail-block detail-cast-block">
                    <div className="detail-block-head">
                      <h2 className="detail-block-title">Cast</h2>
                      {movieCast.length > 5 && <ChevronRight size={18} className="detail-block-chevron" aria-hidden="true" />}
                    </div>
                    {detailLoading ? (
                      <div className="detail-cast-row">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <div key={item} className="detail-cast-card">
                            <div className="detail-cast-photo shad-skeleton" />
                            <div className="detail-cast-name shad-skeleton" />
                          </div>
                        ))}
                      </div>
                    ) : movieCast.length > 0 ? (
                      <div className="detail-cast-row">
                        {movieCast.map((member) => {
                          const profileUrl = resolveMediaUrl(member.profilePath, "profile");
                          return (
                            <article key={`${member.id}-${member.name}`} className="detail-cast-card">
                              <div className="detail-cast-photo">
                                {profileUrl ? (
                                  <img src={profileUrl} alt={member.name} loading="lazy" />
                                ) : (
                                  <div className="detail-cast-placeholder" aria-hidden="true">
                                    <User size={22} />
                                  </div>
                                )}
                              </div>
                              <p className="detail-cast-name">{member.name}</p>
                              {member.character && <p className="detail-cast-role">{member.character}</p>}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="detail-empty-msg">Cast information is not available for this title.</p>
                    )}
                  </section>

                  <section className="detail-block detail-crew-block-section">
                    <h2 className="detail-block-title">Crew</h2>
                    {detailLoading ? (
                      <div className="detail-cast-row">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="detail-cast-card">
                            <div className="detail-cast-photo shad-skeleton" />
                            <div className="detail-cast-name shad-skeleton" />
                          </div>
                        ))}
                      </div>
                    ) : (() => {
                      const featuredCrew = getCrewByJobs(movieCrew, ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"]);
                      return featuredCrew.length > 0 ? (
                        <div className="detail-cast-row">
                          {featuredCrew.map((member) => {
                            const profileUrl = resolveMediaUrl(member.profilePath, "profile");
                            return (
                              <article key={`${member.id}-${member.job}`} className="detail-cast-card">
                                <div className="detail-cast-photo">
                                  {profileUrl ? (
                                    <img src={profileUrl} alt={member.name} loading="lazy" />
                                  ) : (
                                    <div className="detail-cast-placeholder" aria-hidden="true">
                                      <User size={22} />
                                    </div>
                                  )}
                                </div>
                                <p className="detail-cast-name">{member.name}</p>
                                {member.job && <p className="detail-cast-role">{member.job}</p>}
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="detail-empty-msg">Crew information is not available for this title.</p>
                      );
                    })()}
                  </section>

                  <div className="theatres-section" id="theatres-scroll-target">
              <div className="cx-date-row">
                <div className="cx-date-label">CITY</div>
                <div className="cx-date-pills">
                  <span className="cx-date-pill active">{currentCity}</span>
                </div>
              </div>

              {detailLanguages.length > 0 && (
                <div className="cx-date-row">
                  <div className="cx-date-label">SCREENING LANGUAGE</div>
                  <div className="cx-date-pills">
                    <button
                      className={`cx-date-pill ${detailScreeningLang === "all" ? "active" : ""}`}
                      onClick={() => setDetailScreeningLang("all")}
                    >
                      All
                    </button>
                    {detailLanguages.map((lang) => (
                      <button
                        key={lang}
                        className={`cx-date-pill ${detailScreeningLang === lang ? "active" : ""}`}
                        onClick={() => setDetailScreeningLang(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                        {formatShowDateLabel(date)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showsLoading && <p style={{ color: "var(--text2)" }}>Loading showtimes...</p>}
              {!showsLoading && showsError && (
                <div style={{ color: "var(--text2)" }}>
                  <p>{showsError}</p>
                  <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", opacity: 0.85 }}>Currently showing in India</p>
                </div>
              )}
              {!showsLoading && !showsError && filteredShowsForDate.length === 0 && (
                <p style={{ color: "var(--text2)" }}>No shows available for this date.</p>
              )}

              {groupedTheatreShows.map((group) => (
                <div key={group.theatreId} className="theatre-card">
                  <div className="theatre-info">
                    <h3>{group.theatreName}</h3>
                    <p>{group.city} • {group.screenName}</p>
                  </div>
                  {group.languageGroups.map((langGroup) => (
                    <div key={langGroup.language} className="theatre-language-group">
                      <div className="theatre-language-label">{langGroup.language}</div>
                      <div className="showtimes-list">
                        {langGroup.shows.map((show) => {
                          const isSelected = selectedShow?.id === show.id;
                          const soldOut = show.availableSeats <= 0;
                          return (
                            <button
                              key={show.id}
                              className={`showtime-pill ${isSelected ? "active" : ""} ${soldOut ? "sold-out" : ""}`}
                              disabled={soldOut}
                              onClick={() => {
                                if (soldOut) return;
                                setSelectedShow(show);
                                setCurrentShowId(show.id);
                                setCurrentTheatre(show.theatreName || group.theatreName);
                                setCurrentTime(formatShowTime(show.showTime));
                              }}
                            >
                              <span className="showtime-time">{formatShowTime(show.showTime)}</span>
                              <span className="showtime-type">₹{show.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
                  </div>

                  <section className="detail-block detail-similar-block">
                    <h2 className="detail-block-title">You May Also Like</h2>
                    {detailLoading ? (
                      <div className="cx-movie-row">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <div key={item} className="cx-movie-card">
                            <div className="shad-skeleton cx-poster-wrap" style={{ aspectRatio: "2/3" }} />
                          </div>
                        ))}
                      </div>
                    ) : similarMovies.length > 0 ? (
                      <div className="cx-movie-row">
                        {similarMovies.map((movie) => (
                          <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={() => handleMovieClick(movie)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="detail-empty-msg">No similar movies are available right now.</p>
                    )}
                  </section>
                </div>
              </div>
            </div>

            {selectedShow && (
              <div className="cx-show-bar">
                <div className="cx-show-bar-info">
                  {selectedShow.theatreName || currentTheatre || "CineX Theatre"}
                  <strong>{formatShowTime(selectedShow.showTime)} • {selectedShow.showDate} • {selectedShow.screeningLanguage || ""}</strong>
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
            <CinexLogo height={24} className="cx-logo" style={{ marginBottom: ".25rem" }} onClick={() => { closeSeats(); closeDetail(); setIsPaymentOpen(false); setIsHistoryOpen(false); navigate("/"); }} />
            <div className="seat-header-info">
              <h2>{currentMovie?.title}</h2>
              <p>Today, {currentTime} • {selectedShow?.screenName || "Screen 1"}</p>
            </div>
          </div>
          <div className="seat-header-auth">
            <AuthControls compact />
            <button className="btn-close-modal" onClick={closeSeats}>✕</button>
          </div>
        </div>

        <div className="seat-scroll-container">
          <div className="screen-wrapper">
            <span className="screen-label">SCREEN</span>
            <div className="screen-bar" />
          </div>

          <div className="seat-legend">
            <span className="legend-item"><div className="legend-box avail" /> Available</span>
            <span className="legend-item"><div className="legend-box sel" /> Selected</span>
            <span className="legend-item"><div className="legend-box royale" /> Royale / Premium</span>
            <span className="legend-item"><div className="legend-box club" /> Club</span>
            <span className="legend-item"><div className="legend-box held" /> Held (Live)</span>
            <span className="legend-item"><div className="legend-box booked" /> Booked</span>
          </div>

          {selectedShow?.screenName && (
            <p className="cx-seat-screen-name">{selectedShow.theatreName} • {selectedShow.screenName}</p>
          )}

          {seatsLoading && <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading seats...</p>}
          {!seatsLoading && showSeats.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No seats are configured for this show.</p>}
          {!seatsLoading && showSeats.length > 0 && (
            <SeatMap
              seats={showSeats}
              selectedSeatIds={selectedSeatIds}
              liveSeatStatus={liveSeatStatus}
              currentUserId={user?.id}
              onToggleSeat={toggleSeat}
            />
          )}
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
                  <CinexLogo height={20} className="cx-logo" />
                  <span className="cx-ticket-vip">VIP SCREENING</span>
                </div>
                <div className="cx-ticket-movie">
                  <img src={resolveMediaUrl(lastBooking.posterPath, "poster")} alt="" style={{ width: 60, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase" }}>{lastBooking.movieTitle}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text2)", marginTop: ".25rem" }}>
                      {[lastBooking.screeningLanguage, lastBooking.screenName].filter(Boolean).join(" • ") || "CineX Screening"}
                    </div>
                    {currentMovie?.vote_average ? (
                      <div style={{ color: "var(--gold)", fontSize: ".85rem", marginTop: ".35rem" }}>★ {Number(currentMovie.vote_average).toFixed(1)} / 10</div>
                    ) : null}
                  </div>
                </div>
                <img className="cx-ticket-qr" src={lastBooking.ticketQrUrl || (lastBooking.ticketToken ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(lastBooking.ticketToken)}` : "")} alt="QR" />
                <div className="cx-ticket-grid">
                  <div><span>THEATRE</span>{lastBooking.theatreName}</div>
                  <div><span>SCREEN</span>{lastBooking.screenName || "Screen"}</div>
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
                <button className="cx-pay-btn" onClick={async () => {
                  if (!lastBooking.ticketToken && !lastBooking.bookingId) {
                    toast.error("Ticket is not ready to download yet.");
                    return;
                  }
                  try {
                    const path = lastBooking.ticketToken
                      ? `/api/tickets/download/${lastBooking.ticketToken}`
                      : `/api/tickets/download-by-booking/${lastBooking.bookingId}`;
                    await downloadAuthenticatedFile(path, `CineX-Ticket-CNX-${lastBooking.bookingId}.pdf`);
                  } catch (err) {
                    toast.error("Download failed", { description: getApiErrorMessage(err, "Unable to download ticket PDF.") });
                  }
                }}>
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
              <CinexLogo height={30} className="cx-checkout-logo" style={{ marginBottom: "0.75rem" }} onClick={() => { setIsPaymentOpen(false); closeSeats(); closeDetail(); setIsHistoryOpen(false); navigate("/"); }} />
              <button className="cx-checkout-back" onClick={() => setIsPaymentOpen(false)}>
                <ArrowLeft size={16} /> Back to Seat Selection
              </button>

              <div className="cx-checkout-grid">
                <div className="cx-checkout-card">
                  <h3>Order Summary</h3>
                  <div className="cx-order-movie">
                    <div className="cx-order-poster">
                      <img src={resolveMediaUrl(currentMovie?.poster_path, "poster")} alt="" />
                    </div>
                    <div>
                      <div className="cx-order-title">{currentMovie?.title}</div>
                      <div className="cx-order-tags">
                        {selectedShow?.screeningLanguage && <span className="cx-tag">{selectedShow.screeningLanguage}</span>}
                        {selectedShow?.screenName && <span className="cx-tag">{selectedShow.screenName}</span>}
                      </div>
                      <div className="cx-order-meta">
                        <span><MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{selectedShow?.theatreName || currentTheatre}</span>
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

              <div className="cx-payment-methods">
                <h3>Choose Payment Method</h3>
                <button type="button" className={`cx-payment-method ${paymentMethod === "RAZORPAY" ? "active" : ""}`} onClick={() => setPaymentMethod("RAZORPAY")}>
                  <span>Razorpay</span><small>Cards, UPI, net banking</small>
                </button>
                <button type="button" className={`cx-payment-method ${paymentMethod === "WALLET" ? "active" : ""}`} onClick={() => setPaymentMethod("WALLET")}>
                  <span>CineX Wallet</span><small>{walletBalance == null ? "Loading balance..." : `Available balance: ₹${walletBalance.toFixed(2)}`}</small>
                </button>
                {paymentMethod === "WALLET" && walletBalance != null && walletBalance < totalPrice && (
                  <div className="cx-error-banner">Insufficient wallet balance. Choose Razorpay to continue.</div>
                )}
              </div>

              {paymentError && (
                <div className="cx-error-banner" style={{ marginBottom: "1rem" }}>{paymentError}</div>
              )}

              <button className="cx-pay-btn" disabled={processing || (paymentMethod === "WALLET" && walletBalance != null && walletBalance < totalPrice)} onClick={processPayment}>
                <Lock size={16} /> {processing ? "Processing..." : paymentMethod === "WALLET" ? `Pay ₹${totalPrice} with Wallet` : "Complete Payment"}
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
                const theatreName = b.theatreName || b.theatre || "CineX Theatre";
                const statusStr = b.bookingStatus || b.status || "PENDING";
                const showTimeStr = b.showTime || b.time || "";
                const showDateStr = b.showDate || b.date || "";
                const seatsList = b.seatNumbers || b.seats || [];
                const amountVal = b.totalAmount || b.total || 0;
                const bookingIdVal = b.bookingId || (b.id ? String(b.id).replace('CNX-', '') : i);
                const tokenVal = b.ticketToken || null;

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
