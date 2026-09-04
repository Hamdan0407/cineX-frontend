export const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";
export const IMG_BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
export const IMG_ORIGINAL_URL = "https://image.tmdb.org/t/p/original";

const getCloudfrontMediaBaseUrl = (): string =>
  (import.meta.env.VITE_CLOUDFRONT_MEDIA_BASE_URL || "").replace(/\/$/, "");

export { getCloudfrontMediaBaseUrl };

export const isAbsoluteMediaUrl = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://");

/** True when the value is a CineX S3 object key rather than a TMDB path or absolute URL. */
export const isCinexObjectKey = (path: string): boolean => {
  const trimmed = path.trim();
  if (!trimmed || isAbsoluteMediaUrl(trimmed) || trimmed.startsWith("/")) {
    return false;
  }
  return /^(trailers|posters|backdrops|tickets)\//.test(trimmed)
    || /\.(mp4|webm|mov|m4v|jpg|jpeg|png|webp|pdf)$/i.test(trimmed);
};

/** Resolves a CineX S3 object key or absolute media URL to a browser-deliverable URL. */
export const resolveCinexMediaDeliveryUrl = (path: string | null | undefined): string => {
  if (!path || path === "null" || path === "undefined") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (isAbsoluteMediaUrl(trimmed)) return trimmed;
  if (!getCloudfrontMediaBaseUrl()) return "";
  const objectKey = trimmed.replace(/^\/+/, "");
  if (!objectKey) return "";
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment).replace(/%28/g, "(").replace(/%29/g, ")"))
    .join("/");
  return `${getCloudfrontMediaBaseUrl()}/${encodedKey}`;
};

export type TrailerMediaDto = {
  tmdbId?: number;
  backendMovieId?: number;
  trailerObjectKey?: string | null;
  trailerPlaybackUrl?: string | null;
  available?: boolean;
};

/** Resolves the best trailer playback URL from API metadata or stored object keys. */
export const resolveTrailerPlaybackUrl = (
  trailer?: TrailerMediaDto | null,
  fallbackObjectKey?: string | null,
): string => {
  const playbackUrl = trailer?.trailerPlaybackUrl?.trim();
  if (playbackUrl) return playbackUrl;
  const objectKey = trailer?.trailerObjectKey?.trim() || fallbackObjectKey?.trim();
  if (!objectKey) return "";
  return resolveCinexMediaDeliveryUrl(objectKey);
};

export const hasTrailerPlayback = (
  trailer?: TrailerMediaDto | null,
  fallbackObjectKey?: string | null,
): boolean => resolveTrailerPlaybackUrl(trailer, fallbackObjectKey).length > 0;

export const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

export const LANG_LABEL: Record<string, string> = {
  hi: "Hindi",
  en: "English",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
};

export const getLangLabel = (code: string) => LANG_LABEL[code] ?? code.toUpperCase();

export const getGenres = (ids?: number[]) => {
  if (!ids || ids.length === 0) return "Cinema • Feature";
  return ids.slice(0, 3).map((id) => GENRE_MAP[id] || "Drama").join(" • ");
};

export const getGenreList = (ids?: number[], genreLabel?: string) => {
  if (ids && ids.length > 0) {
    return ids.slice(0, 4).map((id) => GENRE_MAP[id] || "Drama");
  }
  if (genreLabel) {
    return genreLabel
      .split(/[,•|/]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 4);
  }
  return ["Drama", "Cinema"];
};

/** Compact number formatting for engagement stats (e.g. 8654 → 8.7K). */
export const formatCompactCount = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value < 1_000) return String(Math.round(value));
  if (value < 1_000_000) {
    const compact = value / 1_000;
    const rounded = compact >= 100 ? Math.round(compact) : Math.round(compact * 10) / 10;
    return `${rounded}K`;
  }
  const compact = value / 1_000_000;
  const rounded = compact >= 100 ? Math.round(compact) : Math.round(compact * 10) / 10;
  return `${rounded}M`;
};

export const getMovieFormats = (formats?: string[] | null): string[] => {
  if (!formats || formats.length === 0) return [];
  const seen = new Set<string>();
  return formats
    .map((format) => format.trim())
    .filter((format) => {
      if (!format || seen.has(format)) return false;
      seen.add(format);
      return true;
    })
    .slice(0, 4);
};

export const resolveMediaUrl = (path: string | null | undefined, size: "poster" | "backdrop" | "profile" = "poster"): string => {
  if (!path || path === "null" || path === "undefined") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (isCinexObjectKey(path)) {
    return resolveCinexMediaDeliveryUrl(path);
  }
  if (size === "profile") {
    return `https://image.tmdb.org/t/p/w185${path.startsWith("/") ? path : `/${path}`}`;
  }
  const base = size === "backdrop" ? IMG_BACKDROP_URL : IMG_BASE_URL;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/** True when TMDB supplied a dedicated backdrop asset (not a poster fallback). */
export const hasTmdbBackdrop = (movie: unknown): boolean => {
  if (!movie || typeof movie !== "object") return false;
  const path = (movie as Record<string, unknown>).backdrop_path;
  return typeof path === "string" && path.trim().length > 0;
};

export const resolveMovieBackdropUrl = (movie: unknown): string => {
  if (!hasTmdbBackdrop(movie)) return "";
  return resolveMediaUrl((movie as Record<string, unknown>).backdrop_path as string, "backdrop");
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profilePath?: string | null;
};

export type TmdbCrewMember = {
  id: number;
  name: string;
  job?: string;
  profilePath?: string | null;
};

export const formatReleaseDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getReleaseYear = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const year = dateStr.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : "";
};

export const getProductionCountries = (movie: unknown): string[] => {
  if (!movie || typeof movie !== "object") return [];
  const countries = (movie as Record<string, unknown>).production_countries;
  if (!Array.isArray(countries)) return [];
  return countries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return "";
      const name = (entry as Record<string, unknown>).name;
      return typeof name === "string" ? name.trim() : "";
    })
    .filter(Boolean)
    .slice(0, 3);
};

export const getCrewByJobs = (
  crew: TmdbCrewMember[],
  jobs: string[],
  limit = 6,
): TmdbCrewMember[] => {
  const seen = new Set<number>();
  const result: TmdbCrewMember[] = [];
  for (const job of jobs) {
    for (const member of crew) {
      if (member.job === job && !seen.has(member.id)) {
        seen.add(member.id);
        result.push(member);
        if (result.length >= limit) return result;
      }
    }
  }
  return result;
};

export const formatRuntime = (minutes: number | null | undefined): string => {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const parseTmdbCredits = (payload: unknown): { cast: TmdbCastMember[]; crew: TmdbCrewMember[] } => {
  if (!payload || typeof payload !== "object") {
    return { cast: [], crew: [] };
  }
  const root = payload as { cast?: unknown[]; crew?: unknown[] };
  const cast: TmdbCastMember[] = [];
  if (Array.isArray(root.cast)) {
    for (const member of root.cast) {
      const row = member as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name : "";
      if (!name) continue;
      cast.push({
        id: Number(row.id) || 0,
        name,
        character: typeof row.character === "string" ? row.character : undefined,
        profilePath: typeof row.profile_path === "string" ? row.profile_path : null,
      });
      if (cast.length >= 12) break;
    }
  }
  const crew: TmdbCrewMember[] = [];
  if (Array.isArray(root.crew)) {
    for (const member of root.crew) {
      const row = member as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name : "";
      if (!name) continue;
      crew.push({
        id: Number(row.id) || 0,
        name,
        job: typeof row.job === "string" ? row.job : undefined,
        profilePath: typeof row.profile_path === "string" ? row.profile_path : null,
      });
    }
  }
  return { cast, crew };
};

export const getDirectors = (crew: TmdbCrewMember[]): TmdbCrewMember[] =>
  crew.filter((member) => member.job === "Director").slice(0, 3);

export type TmdbGenreRef = {
  id: number;
  name: string;
};

export type VibeGenreSlice = {
  id: number;
  name: string;
  percentage: number;
  displayPercentage: string;
  color: string;
};

export const VIBE_CHART_COLORS = [
  "#e8958c",
  "#f2c94c",
  "#7b9fd4",
  "#b48ad9",
  "#6fbf8a",
  "#d4786e",
  "#c9a86a",
  "#8ea3b8",
] as const;

/** Distributes 100% across N genres as integers that sum to exactly 100. */
export const distributeVibePercentages = (count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
};

export const formatVibePercentage = (value: number): string => `${value}%`;

export const vibeColorForGenre = (_genreId: number, index: number): string =>
  VIBE_CHART_COLORS[index % VIBE_CHART_COLORS.length];

/**
 * Reads TMDB genres from movie details (`genres`) or list payloads (`genre_ids`).
 * Does not invent genres when TMDB provides none.
 */
export const extractTmdbGenres = (movie: unknown): TmdbGenreRef[] => {
  if (!movie || typeof movie !== "object") return [];
  const record = movie as Record<string, unknown>;

  if (Array.isArray(record.genres)) {
    const fromGenres = record.genres
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const genre = entry as Record<string, unknown>;
        const id = Number(genre.id);
        const name = typeof genre.name === "string" ? genre.name.trim() : "";
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((genre): genre is TmdbGenreRef => genre !== null);
    if (fromGenres.length > 0) return fromGenres;
  }

  if (Array.isArray(record.genre_ids)) {
    return record.genre_ids
      .map((rawId) => {
        const id = Number(rawId);
        if (!id) return null;
        const name = GENRE_MAP[id];
        if (!name) return null;
        return { id, name };
      })
      .filter((genre): genre is TmdbGenreRef => genre !== null);
  }

  return [];
};

/** Builds equal-share vibe slices from actual TMDB genres. */
export const buildVibeChartData = (genres: TmdbGenreRef[]): VibeGenreSlice[] => {
  if (!genres.length) return [];
  const percentages = distributeVibePercentages(genres.length);
  return genres.map((genre, index) => ({
    id: genre.id,
    name: genre.name,
    percentage: percentages[index],
    displayPercentage: formatVibePercentage(percentages[index]),
    color: vibeColorForGenre(genre.id, index),
  }));
};

export const mapTmdbSimilarMovie = (movie: Record<string, unknown>) => ({
  id: Number(movie.id),
  tmdbId: Number(movie.id),
  title: typeof movie.title === "string" ? movie.title : "Untitled",
  poster_path: typeof movie.poster_path === "string" ? movie.poster_path : null,
  backdrop_path: typeof movie.backdrop_path === "string" ? movie.backdrop_path : null,
  overview: typeof movie.overview === "string" ? movie.overview : "",
  vote_average: typeof movie.vote_average === "number" ? movie.vote_average : 0,
  genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids.map((id) => Number(id)) : [],
  release_date: typeof movie.release_date === "string" ? movie.release_date : null,
  original_language: typeof movie.original_language === "string" ? movie.original_language : "en",
});
type TmdbMovieList = {
  results?: Array<Record<string, unknown>>;
};

export const coerceJsonPayload = <T,>(payload: unknown, fallback: T): T => {
  if (payload == null) return fallback;
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return payload as T;
};

export const parseTmdbPayload = (payload: unknown): any[] => {
  const normalized = coerceJsonPayload<unknown>(payload, null);
  if (!normalized) return [];
  if (Array.isArray(normalized)) return normalized;
  const results = (normalized as TmdbMovieList).results;
  return Array.isArray(results) ? results : [];
};

export const enrichTmdbWithCatalog = (movies: any[], catalog: any[]) => {
  const catalogByTitle = new Map(
    catalog.map((movie) => [movie.title?.trim().toLowerCase(), movie.id as number])
  );
  const catalogByTmdbId = new Map(
    catalog.filter((movie) => movie.tmdbId != null).map((movie) => [Number(movie.tmdbId), movie.id as number])
  );
  return movies.map((movie) => ({
    ...movie,
    backendMovieId: catalogByTmdbId.get(Number(movie.id)) || catalogByTitle.get(movie.title?.trim().toLowerCase()),
  }));
};

export type BookableMovieDto = {
  backendMovieId: number;
  tmdbId: number;
  title: string;
  description?: string;
  genre?: string;
  duration?: number;
  posterPath?: string;
  backdropPath?: string;
  trailerObjectKey?: string | null;
  trailerPlaybackUrl?: string | null;
  screeningLanguages?: string[];
  formats?: string[];
};

export const mapBookableToDisplay = (bookable: BookableMovieDto, tmdb?: any) => {
  const poster = tmdb?.poster_path || bookable.posterPath || null;
  const backdrop = tmdb?.backdrop_path || bookable.backdropPath || null;

  if (tmdb) {
    return {
      ...tmdb,
      id: Number(bookable.tmdbId),
      backendMovieId: bookable.backendMovieId,
      screeningLanguages: bookable.screeningLanguages || [],
      formats: bookable.formats || [],
      genre_label: bookable.genre || getGenres(tmdb.genre_ids),
      poster_path: poster,
      backdrop_path: backdrop,
      runtime: tmdb.runtime || bookable.duration || null,
      overview: tmdb.overview || bookable.description || "",
      trailerPlaybackUrl: bookable.trailerPlaybackUrl || null,
      trailerObjectKey: bookable.trailerObjectKey || null,
    };
  }

  return {
    id: Number(bookable.tmdbId),
    backendMovieId: bookable.backendMovieId,
    title: bookable.title,
    overview: bookable.description || "",
    poster_path: poster,
    backdrop_path: backdrop,
    vote_average: 8,
    genre_ids: [] as number[],
    genre_label: bookable.genre || "Cinema",
    runtime: bookable.duration || null,
    release_date: null,
    original_language: "en",
    screeningLanguages: bookable.screeningLanguages || [],
    formats: bookable.formats || ["2D"],
    trailerPlaybackUrl: bookable.trailerPlaybackUrl || null,
    trailerObjectKey: bookable.trailerObjectKey || null,
  };
};

/** TMDB IDs for homepage hero slider — movies with CineX-hosted trailers in S3. */
export const HERO_TRAILER_TMDB_IDS: readonly number[] = [
  969681, // Spider-Man: Brand New Day
  1003596, // Avengers: Doomsday
  1170608, // Dune: Part Three
  1288445, // Mutiny (2026)
  1516698, // The Last Sunrise
  1368337, // The Odyssey
];

/** Builds the homepage hero carousel from TMDB lists, preserving HERO_TRAILER_TMDB_IDS order. */
export const buildHeroCarouselMovies = (sources: unknown[][]): any[] => {
  const byId = new Map<number, any>();
  for (const list of sources) {
    for (const raw of list) {
      const movie = raw as { id?: number; tmdbId?: number };
      const id = Number(movie?.tmdbId ?? movie?.id);
      if (!Number.isFinite(id) || byId.has(id)) continue;
      byId.set(id, raw);
    }
  }
  return HERO_TRAILER_TMDB_IDS.map((id) => byId.get(id)).filter((movie): movie is any => {
    if (!movie) return false;
    return hasTmdbBackdrop(movie) && !!resolveMovieBackdropUrl(movie);
  });
};

export const buildNowShowingDisplay = (
  moviesNowPlaying: any[],
  cityBookableTmdbIds: Set<number>,
  cityBookableMeta: Record<number, BookableMovieDto>,
  activeScreeningLang: string
) => {
  const allMovies = moviesNowPlaying.map((movie) => {
    const tmdbId = Number(movie.id);
    const bookable = cityBookableTmdbIds.has(tmdbId);
    const meta = cityBookableMeta[tmdbId];
    return {
      ...movie,
      tmdbId,
      bookable,
      screeningLanguages: meta?.screeningLanguages || [],
      formats: bookable ? (meta?.formats || getMovieFormats(movie.formats)) : [],
      genre_label: meta?.genre || movie.genre_label,
    };
  });

  if (activeScreeningLang && activeScreeningLang !== "all") {
    return allMovies.filter((movie) => cityBookableTmdbIds.has(Number(movie.id)));
  }

  return allMovies;
};

export const filterMoviesBySearch = (list: any[], searchQuery: string) => {
  if (!searchQuery.trim()) return list;
  const q = searchQuery.toLowerCase();
  return list.filter((m) => {
    const titleMatch = m.title?.toLowerCase().includes(q);
    const genreMatch = getGenres(m.genre_ids).toLowerCase().includes(q)
      || (m.genre_label || "").toLowerCase().includes(q);
    return titleMatch || genreMatch;
  });
};

export const formatShowTime = (time: string | null | undefined): string => {
  if (!time) return "";
  const match = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
};

export const formatShowDate = (dateStr: string) => {
  if (!dateStr) return "TODAY";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.toUpperCase();
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).toUpperCase();
};

export const buildTmdbIndex = (...lists: any[][]) => {
  const map = new Map<number, any>();
  lists.forEach((list) => {
    list.forEach((movie) => {
      if (movie?.id != null) {
        map.set(Number(movie.id), movie);
      }
    });
  });
  return map;
};
