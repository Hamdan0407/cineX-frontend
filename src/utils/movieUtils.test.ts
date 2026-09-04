import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildNowShowingDisplay,
  buildHeroCarouselMovies,
  buildVibeChartData,
  distributeVibePercentages,
  extractTmdbGenres,
  filterMoviesBySearch,
  formatCompactCount,
  formatReleaseDate,
  formatRuntime,
  getReleaseYear,
  getProductionCountries,
  getCrewByJobs,
  getDirectors,
  getGenreList,
  getMovieFormats,
  mapTmdbSimilarMovie,
  parseTmdbCredits,
  resolveMediaUrl,
  resolveMovieBackdropUrl,
  resolveCinexMediaDeliveryUrl,
  resolveTrailerPlaybackUrl,
  isCinexObjectKey,
  hasTrailerPlayback,
  hasTmdbBackdrop,
  getTrailerObjectKeyForTmdbId,
  coerceJsonPayload,
} from "./movieUtils";

describe("resolveMovieBackdropUrl", () => {
  it("returns w1280 backdrop URL only when TMDB backdrop exists", () => {
    expect(resolveMovieBackdropUrl({ backdrop_path: "/abc.jpg" })).toBe(
      "https://image.tmdb.org/t/p/w1280/abc.jpg",
    );
    expect(resolveMovieBackdropUrl({ poster_path: "/poster.jpg" })).toBe("");
    expect(hasTmdbBackdrop({ poster_path: "/poster.jpg" })).toBe(false);
    expect(hasTmdbBackdrop({ backdrop_path: "/abc.jpg" })).toBe(true);
  });
});

describe("formatCompactCount", () => {
  it("formats thousands with one decimal", () => {
    expect(formatCompactCount(8654)).toBe("8.7K");
    expect(formatCompactCount(69500)).toBe("69.5K");
  });

  it("formats millions", () => {
    expect(formatCompactCount(1_000_000)).toBe("1M");
  });

  it("returns whole numbers below 1000", () => {
    expect(formatCompactCount(42)).toBe("42");
  });
});

describe("getGenreList", () => {
  it("maps TMDB genre ids", () => {
    expect(getGenreList([878, 12])).toEqual(["Sci-Fi", "Adventure"]);
  });

  it("falls back to genre label string", () => {
    expect(getGenreList([], "Sci-Fi, Action")).toEqual(["Sci-Fi", "Action"]);
  });
});

describe("getMovieFormats", () => {
  it("deduplicates and limits formats", () => {
    expect(getMovieFormats(["2D", "IMAX 2D", "2D", "4DX", "3D", "EXTRA"])).toEqual([
      "2D",
      "IMAX 2D",
      "4DX",
      "3D",
    ]);
  });
});

describe("buildHeroCarouselMovies", () => {
  const heroPool = [
    { id: 200, title: "Other Movie", backdrop_path: "/other.jpg" },
    { id: 1368337, title: "The Odyssey", backdrop_path: "/odyssey.jpg" },
    { id: 969681, title: "Spider-Man", backdrop_path: "/spidey.jpg" },
    { id: 1003596, title: "Avengers", backdrop_path: "/avengers.jpg" },
    { id: 1170608, title: "Dune", backdrop_path: "/dune.jpg" },
    { id: 1288445, title: "Mutiny", backdrop_path: "/mutiny.jpg" },
    { id: 1516698, title: "The Last Sunrise", backdrop_path: "/sunrise.jpg" },
  ];

  it("returns only the six hero trailer movies in the configured order", () => {
    const result = buildHeroCarouselMovies([heroPool]);
    expect(result.map((movie) => movie.id)).toEqual([
      969681, 1003596, 1170608, 1288445, 1516698, 1368337,
    ]);
  });

  it("excludes non-hero TMDB movies even when present in now playing", () => {
    const result = buildHeroCarouselMovies([[{ id: 999, title: "Random", backdrop_path: "/x.jpg" }, ...heroPool]]);
    expect(result.some((movie) => movie.id === 999)).toBe(false);
  });

  it("skips hero IDs without a TMDB backdrop", () => {
    const result = buildHeroCarouselMovies([[{ id: 969681, title: "Spider-Man", backdrop_path: null }]]);
    expect(result).toHaveLength(0);
  });
});

describe("buildNowShowingDisplay", () => {
  const tmdbMovies = [
    { id: 100, title: "Movie A", vote_average: 7.5 },
    { id: 200, title: "Movie B", vote_average: 8.1 },
  ];

  it("shows all TMDB movies when language filter is all", () => {
    const bookable = new Set([100]);
    const meta = { 100: { tmdbId: 100, backendMovieId: 1, title: "Movie A", formats: ["2D"] } };
    const result = buildNowShowingDisplay(tmdbMovies, bookable, meta as any, "all");
    expect(result).toHaveLength(2);
    expect(result[0].bookable).toBe(true);
    expect(result[1].bookable).toBe(false);
  });

  it("filters to language-specific bookable movies when a screening language is selected", () => {
    const bookable = new Set([100]);
    const meta = { 100: { tmdbId: 100, backendMovieId: 1, title: "Movie A", formats: ["2D"] } };
    const result = buildNowShowingDisplay(tmdbMovies, bookable, meta as any, "Tamil");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(100);
  });

  it("propagates TMDB id onto every Now Showing card", () => {
    const result = buildNowShowingDisplay(tmdbMovies, new Set(), {}, "all");
    expect(result.map((movie) => movie.tmdbId)).toEqual([100, 200]);
    expect(result.every((movie) => movie.id === movie.tmdbId)).toBe(true);
  });
});

describe("filterMoviesBySearch", () => {
  const movies = [
    { title: "Dune: Part Two", genre_ids: [878, 12] },
    { title: "Oppenheimer", genre_label: "Drama" },
    { title: "Jawan", genre_label: "Action" },
  ];

  it("returns the full list for an empty query", () => {
    expect(filterMoviesBySearch(movies, "")).toHaveLength(3);
    expect(filterMoviesBySearch(movies, "   ")).toHaveLength(3);
  });

  it("matches titles case-insensitively with partial text", () => {
    expect(filterMoviesBySearch(movies, "dune").map((m) => m.title)).toEqual(["Dune: Part Two"]);
    expect(filterMoviesBySearch(movies, "PART").map((m) => m.title)).toEqual(["Dune: Part Two"]);
  });

  it("matches genre labels when the title does not match", () => {
    expect(filterMoviesBySearch(movies, "drama").map((m) => m.title)).toEqual(["Oppenheimer"]);
    expect(filterMoviesBySearch(movies, "sci").map((m) => m.title)).toEqual(["Dune: Part Two"]);
  });
});

describe("formatReleaseDate", () => {
  it("formats ISO dates for display", () => {
    expect(formatReleaseDate("2024-03-01")).toMatch(/2024/);
    expect(formatReleaseDate("")).toBe("");
  });
});

describe("formatRuntime", () => {
  it("formats minutes into hours and minutes", () => {
    expect(formatRuntime(166)).toBe("2h 46m");
    expect(formatRuntime(45)).toBe("45m");
    expect(formatRuntime(120)).toBe("2h");
  });
});

describe("getReleaseYear", () => {
  it("extracts year from TMDB release date", () => {
    expect(getReleaseYear("2024-03-01")).toBe("2024");
    expect(getReleaseYear("")).toBe("");
  });
});

describe("getProductionCountries", () => {
  it("reads TMDB production_countries", () => {
    expect(getProductionCountries({
      production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
    })).toEqual(["United States of America"]);
  });
});

describe("getCrewByJobs", () => {
  it("returns crew filtered by job priority", () => {
    const crew = [
      { id: 1, name: "A", job: "Producer" },
      { id: 2, name: "B", job: "Director" },
      { id: 3, name: "C", job: "Writer" },
    ];
    expect(getCrewByJobs(crew, ["Director", "Writer"], 2).map((m) => m.name)).toEqual(["B", "C"]);
  });
});

describe("parseTmdbCredits", () => {
  it("maps cast and crew with profile paths", () => {
    const parsed = parseTmdbCredits({
      cast: [{ id: 1, name: "Actor One", character: "Hero", profile_path: "/a.jpg" }],
      crew: [{ id: 2, name: "Director One", job: "Director", profile_path: null }],
    });
    expect(parsed.cast).toHaveLength(1);
    expect(parsed.cast[0].name).toBe("Actor One");
    expect(parsed.cast[0].profilePath).toBe("/a.jpg");
    expect(getDirectors(parsed.crew)[0].name).toBe("Director One");
  });

  it("returns empty arrays for invalid payloads", () => {
    expect(parseTmdbCredits(null)).toEqual({ cast: [], crew: [] });
  });
});

describe("mapTmdbSimilarMovie", () => {
  it("normalizes TMDB similar movie payloads", () => {
    const mapped = mapTmdbSimilarMovie({
      id: 42,
      title: "Similar Film",
      poster_path: "/poster.jpg",
      vote_average: 7.8,
      genre_ids: [28],
      original_language: "hi",
    });
    expect(mapped.tmdbId).toBe(42);
    expect(mapped.title).toBe("Similar Film");
    expect(mapped.original_language).toBe("hi");
  });
});

describe("resolveMediaUrl", () => {
  it("builds profile image URLs", () => {
    expect(resolveMediaUrl("/abc.jpg", "profile")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
  });

  it("preserves absolute TMDB-style external URLs", () => {
    expect(resolveMediaUrl("https://image.tmdb.org/t/p/w500/foo.jpg", "poster")).toBe(
      "https://image.tmdb.org/t/p/w500/foo.jpg",
    );
  });
});

describe("CineX media delivery resolution", () => {
  const spiderManTrailerObjectKey =
    "trailers/SPIDER-MAN_ BRAND NEW DAY \u2013 New Trailer (4K).mp4";
  const spiderManTrailerPlaybackUrl =
    `https://d1al8zqo1izqiu.cloudfront.net/${spiderManTrailerObjectKey
      .split("/")
      .map((segment) => encodeURIComponent(segment).replace(/%28/g, "(").replace(/%29/g, ")"))
      .join("/")}`;

  beforeEach(() => {
    vi.stubEnv("VITE_CLOUDFRONT_MEDIA_BASE_URL", "https://d1al8zqo1izqiu.cloudfront.net");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects CineX S3 object keys", () => {
    expect(isCinexObjectKey(spiderManTrailerObjectKey)).toBe(true);
    expect(isCinexObjectKey("/abc.jpg")).toBe(false);
    expect(isCinexObjectKey("https://example.com/a.mp4")).toBe(false);
  });

  it("resolves exact Spider-Man trailer object key to encoded CloudFront URL", () => {
    expect(resolveCinexMediaDeliveryUrl(spiderManTrailerObjectKey)).toBe(
      spiderManTrailerPlaybackUrl,
    );
  });

  it("attaches the known static key so hero trailers resolve without an API request", () => {
    const result = buildHeroCarouselMovies([[{ id: 1288445, title: "Mutiny", backdrop_path: "/mutiny.jpg" }]]);
    expect(result[0].trailerObjectKey).toBe(getTrailerObjectKeyForTmdbId(1288445));
    expect(resolveTrailerPlaybackUrl({ trailerObjectKey: result[0].trailerObjectKey })).toContain(
      "trailers/Mutiny%20(2026)%20Official%20Trailer%20-%20Jason%20Statham%20-%20(1080p).mp4",
    );
  });

  it("returns no static mapping for titles that must use the backend fallback", () => {
    expect(getTrailerObjectKeyForTmdbId(999999)).toBeNull();
    expect(resolveTrailerPlaybackUrl({ trailerObjectKey: getTrailerObjectKeyForTmdbId(999999) })).toBe("");
  });

  it("preserves absolute delivery URLs", () => {
    const url = "https://www.youtube.com/watch?v=abc";
    expect(resolveCinexMediaDeliveryUrl(url)).toBe(url);
  });

  it("returns empty string for missing trailer media", () => {
    expect(resolveCinexMediaDeliveryUrl(null)).toBe("");
    expect(hasTrailerPlayback(null)).toBe(false);
  });

  it("prefers API playback URL over object key fallback", () => {
    expect(
      resolveTrailerPlaybackUrl(
        {
          trailerPlaybackUrl: spiderManTrailerPlaybackUrl,
        },
        "trailers/other.mp4",
      ),
    ).toBe(spiderManTrailerPlaybackUrl);
  });
});

describe("coerceJsonPayload", () => {
  it("parses JSON string responses from TMDB proxy endpoints", () => {
    const parsed = coerceJsonPayload<{ cast: Array<{ name: string }> }>(
      "{\"cast\":[{\"name\":\"Actor One\"}],\"crew\":[]}",
      { cast: [] }
    );
    expect(parsed.cast[0].name).toBe("Actor One");
  });
});

describe("vibe chart genre calculation", () => {
  const tmdbFixture = {
    id: 969681,
    title: "Spider-Man: Brand New Day",
    genres: [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 878, name: "Science Fiction" },
    ],
  };

  it("returns 100% for one TMDB genre", () => {
    const slices = buildVibeChartData([{ id: 28, name: "Action" }]);
    expect(slices).toHaveLength(1);
    expect(slices[0].percentage).toBe(100);
    expect(slices[0].displayPercentage).toBe("100%");
  });

  it("returns 50/50 for two genres", () => {
    const slices = buildVibeChartData([
      { id: 28, name: "Action" },
      { id: 18, name: "Drama" },
    ]);
    expect(slices.map((slice) => slice.percentage)).toEqual([50, 50]);
  });

  it("sums to exactly 100% for three genres", () => {
    const genres = extractTmdbGenres(tmdbFixture);
    const slices = buildVibeChartData(genres);
    expect(genres.map((g) => g.name)).toEqual(["Action", "Adventure", "Science Fiction"]);
    expect(slices.map((slice) => slice.percentage)).toEqual([34, 33, 33]);
    expect(slices.reduce((sum, slice) => sum + slice.percentage, 0)).toBe(100);
  });

  it("sums to exactly 100% for six genres", () => {
    const genres = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      name: `Genre ${index + 1}`,
    }));
    const total = buildVibeChartData(genres).reduce((sum, slice) => sum + slice.percentage, 0);
    expect(total).toBe(100);
    expect(distributeVibePercentages(6)).toEqual([17, 17, 17, 17, 16, 16]);
  });

  it("returns empty data when TMDB genres are missing", () => {
    expect(extractTmdbGenres({ id: 1, title: "No genres" })).toEqual([]);
    expect(buildVibeChartData([])).toEqual([]);
  });

  it("uses genre_ids fallback without hardcoded movie-specific values", () => {
    const genres = extractTmdbGenres({ id: 550, genre_ids: [53, 80] });
    expect(genres.map((genre) => genre.name)).toEqual(["Thriller", "Crime"]);
    const total = buildVibeChartData(genres).reduce((sum, slice) => sum + slice.percentage, 0);
    expect(total).toBe(100);
  });
});
