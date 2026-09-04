import { api } from "../api/apiClient";
import { coerceJsonPayload, parseTmdbPayload, type BookableMovieDto, type TrailerMediaDto } from "../utils/movieUtils";
export type CityAvailability = {
  city: string;
  tmdbIds: number[];
  languages: string[];
};

export type CineXShow = {
  id: number;
  movieId: number;
  screenId: number;
  theatreId?: number;
  theatreName?: string;
  city?: string;
  screenName?: string;
  screeningLanguage?: string;
  movieTitle?: string;
  showTime: string;
  showDate: string;
  price: number;
  availableSeats: number;
};

export type CitySearchResultDto = {
  id: string;
  name: string;
  normalizedName: string;
  state: string;
  country: string;
  cinexAvailable: boolean;
  landmarkId?: string | null;
};

export async function fetchCities(): Promise<CitySearchResultDto[]> {
  const res = await api.get<CitySearchResultDto[]>("/api/cities", { skipAuth: true });
  return res.data || [];
}

export async function fetchCityAvailability(city: string, language?: string): Promise<CityAvailability> {
  const langQuery = language && language !== "all" ? `&language=${encodeURIComponent(language)}` : "";
  const res = await api.get<CityAvailability>(
    `/api/shows/availability?city=${encodeURIComponent(city)}${langQuery}`,
    { skipAuth: true }
  );
  return res.data;
}

export async function fetchBookableMovies(city: string, language?: string): Promise<BookableMovieDto[]> {
  const langQuery = language && language !== "all" ? `&language=${encodeURIComponent(language)}` : "";
  const res = await api.get<BookableMovieDto[]>(
    `/api/shows/bookable-movies?city=${encodeURIComponent(city)}${langQuery}`,
    { skipAuth: true }
  );
  return res.data || [];
}

export async function fetchTmdbMovieDetails(tmdbId: number): Promise<Record<string, unknown>> {
  const res = await api.get<unknown>(`/api/tmdb/movie/${tmdbId}`, { skipAuth: true });
  return coerceJsonPayload<Record<string, unknown>>(res.data, {});
}

export async function fetchTmdbMovieCredits(tmdbId: number): Promise<Record<string, unknown>> {
  const res = await api.get<unknown>(`/api/tmdb/movie/${tmdbId}/credits`, { skipAuth: true });
  return coerceJsonPayload<Record<string, unknown>>(res.data, { cast: [], crew: [] });
}

export async function fetchTmdbSimilarMovies(tmdbId: number): Promise<any[]> {
  const res = await api.get<unknown>(`/api/tmdb/movie/${tmdbId}/similar`, { skipAuth: true });
  return parseTmdbPayload(res.data);
}

export async function fetchShowsForTmdbMovie(tmdbId: number, city: string, language?: string): Promise<CineXShow[]> {
  const langQuery = language && language !== "all" ? `&language=${encodeURIComponent(language)}` : "";
  const res = await api.get<CineXShow[]>(
    `/api/shows/tmdb/${tmdbId}?city=${encodeURIComponent(city)}${langQuery}`,
    { skipAuth: true }
  );
  return res.data || [];
}

export async function searchCities(query: string): Promise<CitySearchResultDto[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const res = await api.get<CitySearchResultDto[]>(
    `/api/cities/search?query=${encodeURIComponent(trimmed)}`,
    { skipAuth: true }
  );
  return res.data || [];
}

export async function fetchMovieTrailer(tmdbId: number): Promise<TrailerMediaDto> {
  const res = await api.get<TrailerMediaDto>(
    `/api/media/movies/${tmdbId}/trailer`,
    { skipAuth: true }
  );
  return res.data || { available: false, tmdbId };
}

export async function searchMoviesBackend(query: string): Promise<any[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const res = await api.get<any[]>(
    `/api/movies/search?title=${encodeURIComponent(trimmed)}`,
    { skipAuth: true }
  );
  return res.data || [];
}
