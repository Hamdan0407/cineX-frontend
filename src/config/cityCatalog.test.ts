import { describe, expect, it } from "vitest";
import {
  CITY_CATALOG,
  FALLBACK_CITY_NAMES,
  cityConfigToDisplay,
  citySearchResultToDisplay,
  resolveCityAvailabilityStatus,
  resolveCityConfig,
  selectBookableCities,
} from "./cityCatalog";

describe("cityCatalog", () => {
  it("keeps landmark metadata separate from the backend city catalog", () => {
    expect(FALLBACK_CITY_NAMES.sort()).toEqual([
      "Bengaluru",
      "Chennai",
      "Delhi NCR",
      "Hyderabad",
      "Mumbai",
    ]);
  });

  it("resolves city config by exact backend name", () => {
    const config = resolveCityConfig("Delhi NCR");
    expect(config?.landmarkName).toBe("India Gate");
    expect(config?.landmarkId).toBe("delhi-ncr");
  });

  it("does not discard an API city that has no curated landmark", () => {
    const display = citySearchResultToDisplay({
      id: "in-tn-ambur",
      name: "Ambur",
      state: "Tamil Nadu",
      country: "India",
      cinexAvailable: false,
      landmarkId: null,
    });
    expect(display.city).toBe("Ambur");
    expect(display.landmarkId).toBe("generic");
  });

  it("assigns a unique landmark per supported city", () => {
    const landmarkIds = Object.values(CITY_CATALOG).map((c) => c.landmarkId);
    expect(new Set(landmarkIds).size).toBe(landmarkIds.length);
  });

  it("maps popular city config to display cards", () => {
    const display = cityConfigToDisplay(CITY_CATALOG.Chennai);
    expect(display.city).toBe("Chennai");
    expect(display.landmarkId).toBe("chennai");
    expect(display.cinexAvailable).toBe(true);
  });

  it("uses curated landmark for supported search results", () => {
    const display = citySearchResultToDisplay({
      id: "in-tn-chennai",
      name: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      cinexAvailable: true,
      landmarkId: "chennai",
    });
    expect(display.landmarkId).toBe("chennai");
  });

  it("falls back to generic landmark for unsupported cities", () => {
    const display = citySearchResultToDisplay({
      id: "in-tn-coimbatore",
      name: "Coimbatore",
      state: "Tamil Nadu",
      country: "India",
      cinexAvailable: false,
      landmarkId: null,
    });
    expect(display.landmarkId).toBe("generic");
    expect(display.cinexAvailable).toBe(false);
  });
});

describe("resolveCityAvailabilityStatus", () => {
  const catalog = [
    citySearchResultToDisplay({
      id: "in-tn-chennai", name: "Chennai", state: "Tamil Nadu",
      country: "India", cinexAvailable: true, landmarkId: "chennai",
    }),
    citySearchResultToDisplay({
      id: "in-tn-ambur", name: "Ambur", state: "Tamil Nadu",
      country: "India", cinexAvailable: false, landmarkId: null,
    }),
  ];

  it("reports a city with theatres as available", () => {
    expect(resolveCityAvailabilityStatus(catalog, "Chennai")).toBe("available");
  });

  it("reports a selectable city without theatres so the UI can show an empty state", () => {
    expect(resolveCityAvailabilityStatus(catalog, "Ambur")).toBe("no-theatres");
  });

  it("matches case-insensitively and ignores surrounding whitespace", () => {
    expect(resolveCityAvailabilityStatus(catalog, "  ambur ")).toBe("no-theatres");
  });

  it("stays unknown when the catalog has not loaded, so no empty state is claimed", () => {
    expect(resolveCityAvailabilityStatus([], "Ambur")).toBe("unknown");
  });

  it("stays unknown for a city missing from the catalog or for no selection", () => {
    expect(resolveCityAvailabilityStatus(catalog, "Zzzz")).toBe("unknown");
    expect(resolveCityAvailabilityStatus(catalog, "")).toBe("unknown");
  });

  it("narrows the browse grid to cities CineX screens in", () => {
    const bookable = selectBookableCities(catalog);
    expect(bookable.map((c) => c.city)).toEqual(["Chennai"]);
  });

  it("keeps unlisted cities in the catalog so search can still reach them", () => {
    // selectBookableCities must not mutate or drop anything from the source list: the picker
    // filters only its default grid, while search continues to offer every city.
    expect(catalog.map((c) => c.city)).toEqual(["Chennai", "Ambur"]);
  });
});

