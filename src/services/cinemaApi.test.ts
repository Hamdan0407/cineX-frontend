import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/apiClient";
import { searchMoviesBackend, fetchTmdbMovieCredits, fetchTmdbSimilarMovies } from "./cinemaApi";

describe("searchMoviesBackend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
