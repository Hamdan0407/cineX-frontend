export type CityLandmarkId =
  | "chennai"
  | "mumbai"
  | "bengaluru"
  | "hyderabad"
  | "delhi-ncr"
  | "generic";

export type CityConfig = {
  /** Must match backend `/api/theatres/cities` value exactly. */
  city: string;
  state: string;
  landmarkName: string;
  landmarkId: Exclude<CityLandmarkId, "generic">;
  supported: boolean;
};

export type CityDisplay = {
  id: string;
  city: string;
  state: string;
  landmarkId: CityLandmarkId;
  landmarkName?: string;
  cinexAvailable: boolean;
};

export type CitySearchResult = {
  id: string;
  name: string;
  state: string;
  country: string;
  cinexAvailable: boolean;
  landmarkId?: string | null;
};

/**
 * CineX supported cities (source: backend CinemaCatalogUpgrade theatre seeds).
 * Landmark artwork is decorative only — booking data comes from the API per city.
 */
export const CITY_CATALOG: Record<string, CityConfig> = {
  Chennai: {
    city: "Chennai",
    state: "Tamil Nadu",
    landmarkName: "Kapaleeshwarar Temple",
    landmarkId: "chennai",
    supported: true,
  },
  Mumbai: {
    city: "Mumbai",
    state: "Maharashtra",
    landmarkName: "Gateway of India",
    landmarkId: "mumbai",
    supported: true,
  },
  Bengaluru: {
    city: "Bengaluru",
    state: "Karnataka",
    landmarkName: "Vidhana Soudha",
    landmarkId: "bengaluru",
    supported: true,
  },
  Hyderabad: {
    city: "Hyderabad",
    state: "Telangana",
    landmarkName: "Charminar",
    landmarkId: "hyderabad",
    supported: true,
  },
  "Delhi NCR": {
    city: "Delhi NCR",
    state: "Delhi",
    landmarkName: "India Gate",
    landmarkId: "delhi-ncr",
    supported: true,
  },
};

export const FALLBACK_CITY_NAMES = Object.keys(CITY_CATALOG);

export function resolveCityConfig(cityName: string): CityConfig | null {
  if (!cityName) return null;
  const exact = CITY_CATALOG[cityName];
  if (exact) return exact;

  const normalized = cityName.trim().toLowerCase();
  return (
    Object.values(CITY_CATALOG).find(
      (entry) => entry.city.toLowerCase() === normalized
    ) ?? null
  );
}

export function getCityConfigsForNames(cityNames: string[]): CityConfig[] {
  const seen = new Set<string>();
  const configs: CityConfig[] = [];

  for (const name of cityNames) {
    const config = resolveCityConfig(name);
    if (config && !seen.has(config.city)) {
      seen.add(config.city);
      configs.push(config);
    }
  }

  return configs;
}

export function getDefaultCityConfigs(): CityConfig[] {
  return FALLBACK_CITY_NAMES.map((name) => CITY_CATALOG[name]);
}

const KNOWN_LANDMARK_IDS = new Set<CityLandmarkId>([
  "chennai",
  "mumbai",
  "bengaluru",
  "hyderabad",
  "delhi-ncr",
  "generic",
]);

function resolveLandmarkId(value?: string | null, fallback?: CityLandmarkId): CityLandmarkId {
  if (value && KNOWN_LANDMARK_IDS.has(value as CityLandmarkId) && value !== "generic") {
    return value as Exclude<CityLandmarkId, "generic">;
  }
  if (fallback && fallback !== "generic") {
    return fallback;
  }
  return "generic";
}

export function cityConfigToDisplay(config: CityConfig): CityDisplay {
  return {
    id: config.city,
    city: config.city,
    state: config.state,
    landmarkId: config.landmarkId,
    landmarkName: config.landmarkName,
    cinexAvailable: true,
  };
}

export function citySearchResultToDisplay(result: CitySearchResult): CityDisplay {
  const config = resolveCityConfig(result.name);
  return {
    id: result.id,
    city: result.name,
    state: result.state,
    landmarkId: resolveLandmarkId(result.landmarkId, config?.landmarkId),
    landmarkName: config?.landmarkName,
    cinexAvailable: result.cinexAvailable,
  };
}

/**
 * `unknown` = the catalog has not loaded or does not list the city, so we must not claim
 * anything about it. `no-theatres` = the backend explicitly reported cinexAvailable: false.
 * Cities without theatres stay fully selectable; this only drives the empty state copy.
 */
export type CityAvailabilityStatus = "unknown" | "available" | "no-theatres";

export function resolveCityAvailabilityStatus(
  cities: CityDisplay[],
  cityName: string
): CityAvailabilityStatus {
  const normalized = cityName?.trim().toLowerCase() ?? "";
  if (!normalized || cities.length === 0) return "unknown";

  const match = cities.find((entry) => entry.city.trim().toLowerCase() === normalized);
  if (!match) return "unknown";

  return match.cinexAvailable ? "available" : "no-theatres";
}

/**
 * Cities shown in the picker's default grid: only those CineX actually screens in. Search covers
 * the full catalog, so filtering here narrows the browse list without making a city unreachable.
 */
export function selectBookableCities(cities: CityDisplay[]): CityDisplay[] {
  return cities.filter((city) => city.cinexAvailable !== false);
}
