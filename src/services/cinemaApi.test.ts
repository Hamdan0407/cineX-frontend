import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/apiClient";
import { searchMoviesBackend, fetchTmdbMovieCredits, fetchTmdbSimilarMovies, fetchShowsForTmdbMovie, clearShowtimesCache } from "./cinemaApi";

describe("searchMoviesBackend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearShowtimesCache();
  });

  it("does not call the API for empty or very short queries", async () => {
    const adapter = vi.fn();
    api.defaults.adapter = adapter;

    await expect(searchMoviesBackend("")).resolves.toEqual([]);
    await expect(searchMoviesBackend(" ")).resolves.toEqual([]);
    await expect(searchMoviesBackend("a")).resolves.toEqual([]);
    expect(adapter).not.toHaveBeenCalled();
  });

  it("searches movies by title using the backend endpoint", async () => {
    const adapter = vi.fn(async (config) => ({
      data: [{ id: 1, tmdbId: 653346, title: "Dune: Part Two" }],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    const results = await searchMoviesBackend("dune");

    expect(results).toHaveLength(1);
    expect(adapter).toHaveBeenCalledTimes(1);
    const config = adapter.mock.calls[0][0];
    expect(config.url).toBe("/api/movies/search?title=dune");
    expect(config.skipAuth).toBe(true);
  });
});

describe("fetchShowsForTmdbMovie", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearShowtimesCache();
  });

  it("caches showtimes and deduplicates concurrent requests", async () => {
    const mockShows = [{ id: 101, movieTitle: "Spider-Man", city: "Bengaluru", showDate: "2026-09-06" }];
    const adapter = vi.fn(async (config) => ({
      data: mockShows,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    // Concurrent calls should be deduplicated into a single network call
    const [p1, p2] = await Promise.all([
      fetchShowsForTmdbMovie(969681, "Bengaluru"),
      fetchShowsForTmdbMovie(969681, "Bengaluru"),
    ]);

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(p1).toEqual(mockShows);
    expect(p2).toEqual(mockShows);

    // Subsequent call should use memory cache instantly without network request
    const p3 = await fetchShowsForTmdbMovie(969681, "Bengaluru");
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(p3).toEqual(mockShows);
  });
});

describe("fetchTmdbMovieCredits", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches credits from the TMDB proxy endpoint", async () => {
    const adapter = vi.fn(async (config) => ({
      data: { cast: [{ id: 1, name: "Actor" }], crew: [] },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    const credits = await fetchTmdbMovieCredits(653346);
    expect(credits.cast).toHaveLength(1);
    expect(adapter.mock.calls[0][0].url).toBe("/api/tmdb/movie/653346/credits");
  });
});

describe("fetchTmdbSimilarMovies", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses similar movie results from the TMDB proxy endpoint", async () => {
    const adapter = vi.fn(async (config) => ({
      data: { results: [{ id: 99, title: "Similar" }] },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    const similar = await fetchTmdbSimilarMovies(653346);
    expect(similar).toHaveLength(1);
    expect(similar[0].title).toBe("Similar");
  });
});
