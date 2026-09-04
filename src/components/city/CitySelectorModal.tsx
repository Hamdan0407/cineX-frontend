import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import type { CityDisplay } from "../../config/cityCatalog";
import {
  citySearchResultToDisplay,
  resolveCityAvailabilityStatus,
  selectBookableCities,
} from "../../config/cityCatalog";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { searchCities } from "../../services/cinemaApi";
import { CityCard } from "./CityCard";

const SEARCH_DEBOUNCE_MS = 300;

type CitySelectorModalProps = {
  open: boolean;
  cities: CityDisplay[];
  currentCity: string;
  onSelectCity: (city: string) => void;
  onClose: () => void;
  /** Catalog fetch state, owned by App so the picker can explain itself and offer a retry. */
  listLoading?: boolean;
  listError?: string;
  onRetryList?: () => void;
  required?: boolean;
};

export function CitySelectorModal({
  open,
  cities,
  currentCity,
  onSelectCity,
  onClose,
  listLoading = false,
  listError = "",
  onRetryList,
  required = false,
}: CitySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<CityDisplay[]>([]);

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = debouncedQuery.length > 0;

  // Browse view lists only the cities CineX screens in, so the bookable ones are not buried under
  // a wall of "No theatres yet" cards. Search stays unfiltered on purpose: a user in a town we do
  // not cover yet must still be able to find it, pick it, and be told where it stands.
  const cityDisplays = useMemo(() => cities, [cities]);
  const bookableCities = useMemo(() => selectBookableCities(cityDisplays), [cityDisplays]);
  const hasUnlistedResult = searchResults.some((city) => city.cinexAvailable === false);
  const selectedCityUnlisted =
    resolveCityAvailabilityStatus(cityDisplays, currentCity) === "no-theatres";

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError("");

    searchCities(debouncedQuery)
      .then((results) => {
        if (cancelled) return;
        setSearchResults(results.map(citySearchResultToDisplay));
      })
      .catch(() => {
        if (cancelled) return;
        setSearchResults([]);
        setSearchError("Unable to search cities right now. Please try again.");
      })
      .finally(() => {
        if (!cancelled) {
          setSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isSearching]);

  if (!open) return null;

  // Search view and list view need independent status handling.
  const showSearchLoading = isSearching && searchLoading;
  const showSearchEmpty = isSearching && !searchLoading && !searchError && searchResults.length === 0;
  const showListLoading = !isSearching && listLoading;
  const showListError = !isSearching && !listLoading && Boolean(listError);
  const showListEmpty = !isSearching && !listLoading && !listError && bookableCities.length === 0;
  const cards = isSearching ? searchResults : bookableCities;
  const showCards = !showSearchLoading && !showListLoading && cards.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay active"
      onClick={required ? undefined : onClose}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.96, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 18 }}
        className="city-modal shad-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-selector-title"
      >
        <div className="city-modal-header">
          <div>
            <h2 id="city-selector-title">Where are you watching today?</h2>
            <p className="city-modal-subtitle">
              Choose your city to see movies, theatres and showtimes near you.
            </p>
          </div>
          {!required && (
            <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close city selector">
              <X size={16} />
            </button>
          )}
        </div>

        <label className="city-modal-search" htmlFor="city-search-input">
          <Search size={16} className="city-modal-search-icon" aria-hidden="true" />
          <input
            id="city-search-input"
            type="search"
            placeholder="Search any city or town..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            aria-label="Search cities"
          />
        </label>

        <h3 className="city-modal-section-title">
          {isSearching ? "Search Results" : "Available Cities"}
        </h3>

        {showSearchLoading && <p className="city-modal-status">Searching cities...</p>}
        {showListLoading && <p className="city-modal-status">Loading cities...</p>}
        {searchError && <p className="city-modal-status city-modal-status-error">{searchError}</p>}
        {showListError && (
          <div className="city-modal-status city-modal-status-error city-modal-retry" role="alert">
            <span>{listError}</span>
            {onRetryList && (
              <button type="button" className="cx-filter-btn" onClick={onRetryList}>
                Retry
              </button>
            )}
          </div>
        )}
        {showSearchEmpty && (
          <p className="city-modal-empty">No city or town matches "{debouncedQuery}".</p>
        )}
        {showListEmpty && (
          <p className="city-modal-empty">No cities available right now.</p>
        )}
        {showCards && !isSearching && (
          <p className="city-modal-hint">
            These are the cities CineX screens in today. Somewhere else? Search above — we will tell
            you straight away if CineX is not there yet.
          </p>
        )}
        {showCards && isSearching && hasUnlistedResult && (
          <p className="city-modal-hint">
            Cities marked "No theatres yet" are not listed on CineX — you can still pick one, you
            just will not find showtimes there yet.
          </p>
        )}

        {showCards && (
          <div className="city-modal-grid">
            {cards.map((display) => (
              <CityCard
                key={display.id}
                display={display}
                selected={display.city === currentCity}
                onSelect={onSelectCity}
              />
            ))}
          </div>
        )}

        {currentCity && (
          <div className="city-modal-footer">
            <MapPin size={14} aria-hidden="true" />
            <span>Currently browsing: <strong>{currentCity}</strong></span>
            {selectedCityUnlisted && (
              <em className="city-modal-footer-note">Not listed on CineX yet</em>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
