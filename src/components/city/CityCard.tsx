import type { CityDisplay } from "../../config/cityCatalog";
import { CityLandmarkArt } from "./CityLandmarkArt";

type CityCardProps = {
  display: CityDisplay;
  selected?: boolean;
  onSelect: (city: string) => void;
};

export function CityCard({ display, selected = false, onSelect }: CityCardProps) {
  const landmarkLabel =
    display.landmarkName ?? (display.landmarkId === "generic" ? "City" : display.landmarkId);
  // Advisory only. A city without CineX theatres stays selectable so users can pick their real
  // location and get an explanatory empty state instead of a hidden or dead card.
  const noTheatresYet = display.cinexAvailable === false;

  return (
    <button
      type="button"
      className={`cx-city-card${selected ? " active" : ""}`}
      onClick={() => onSelect(display.city)}
      aria-pressed={selected}
      aria-label={
        `Select ${display.city}, ${display.state}. Landmark: ${landmarkLabel}.` +
        (noTheatresYet ? " No CineX theatres here yet." : "")
      }
    >
      <div className="cx-city-card-art-wrap">
        <CityLandmarkArt landmarkId={display.landmarkId} className="cx-city-card-art" />
      </div>
      <div className="cx-city-card-name">{display.city}</div>
      <div className="cx-city-card-state">{display.state}</div>
      {noTheatresYet && <div className="cx-city-card-badge">No theatres yet</div>}
    </button>
  );
}
