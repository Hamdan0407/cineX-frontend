import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchShowsForTmdbMovie } from "../services/cinemaApi";
import "../index.css";

vi.mock("../services/cinemaApi", () => ({
  fetchShowsForTmdbMovie: vi.fn(),
  fetchBookableMovies: vi.fn().mockResolvedValue([]),
  fetchTmdbMovieDetails: vi.fn().mockResolvedValue({ id: 550, title: "Fight Club" }),
  fetchTmdbMovieCredits: vi.fn().mockResolvedValue({ cast: [], crew: [] }),
  fetchTmdbSimilarMovies: vi.fn().mockResolvedValue([]),
  fetchCities: vi.fn().mockResolvedValue([]),
}));

describe("Showtimes Loading and Mobile Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches showtimes using tmdbId and currentCity", async () => {
    const mockShows = [
      { id: 101, theatreName: "PVR Director's Cut", showDate: "2026-09-06", showTime: "18:00", screeningLanguage: "Hindi" }
    ];
    (fetchShowsForTmdbMovie as any).mockResolvedValueOnce(mockShows);

    const result = await fetchShowsForTmdbMovie(550, "Mumbai");
    expect(fetchShowsForTmdbMovie).toHaveBeenCalledWith(550, "Mumbai");
    expect(result).toBe(mockShows);
  });

  it("invalidates stale showtimes when city changes to a new city", async () => {
    (fetchShowsForTmdbMovie as any)
      .mockResolvedValueOnce([{ id: 101, showDate: "2026-09-06" }])
      .mockResolvedValueOnce([{ id: 201, showDate: "2026-09-06" }]);

    const showsMumbai = await fetchShowsForTmdbMovie(550, "Mumbai");
    expect(showsMumbai[0].id).toBe(101);

    const showsDelhi = await fetchShowsForTmdbMovie(550, "Delhi");
    expect(showsDelhi[0].id).toBe(201);
    expect(fetchShowsForTmdbMovie).toHaveBeenCalledTimes(2);
  });
});
