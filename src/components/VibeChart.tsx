import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import {
  buildVibeChartData,
  extractTmdbGenres,
  type VibeGenreSlice,
} from "../utils/movieUtils";

type VibeChartProps = {
  movie: unknown;
  loading?: boolean;
};

const CHART_SIZE = 168;
const STROKE = 28;
const RADIUS = (CHART_SIZE - STROKE) / 2;
const CENTER = CHART_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function buildArcs(slices: VibeGenreSlice[]) {
  let offset = 0;
  return slices.map((slice) => {
    const arcLength = (slice.percentage / 100) * CIRCUMFERENCE;
    const arc = {
      ...slice,
      arcLength,
      dashOffset: -offset,
    };
    offset += arcLength;
    return arc;
  });
}

export function VibeChart({ movie, loading = false }: VibeChartProps) {
  const slices = useMemo(() => buildVibeChartData(extractTmdbGenres(movie)), [movie]);
  const arcs = useMemo(() => buildArcs(slices), [slices]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const activeSlice = arcs.find((slice) => slice.id === hoveredId) ?? arcs[0] ?? null;

  if (loading) {
    return (
      <div className="vibe-chart-card" aria-busy="true" aria-label="Loading vibe chart">
        <div className="vibe-chart-head">
          <h2 className="vibe-chart-title">Vibe Chart</h2>
        </div>
        <div className="vibe-chart-body">
          <div className="vibe-chart-donut-wrap">
            <div className="vibe-chart-donut shad-skeleton" aria-hidden="true" />
          </div>
          <div className="vibe-chart-legend">
            {[1, 2, 3].map((item) => (
              <div key={item} className="vibe-chart-legend-row shad-skeleton" style={{ height: 24 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!slices.length) {
    return (
      <div className="vibe-chart-card">
        <div className="vibe-chart-head">
          <h2 className="vibe-chart-title">Vibe Chart</h2>
          <button
            type="button"
            className="vibe-chart-info"
            title="Genre mix derived from this movie's TMDB classification. Percentages are an equal split across listed genres, not TMDB-provided scores."
            aria-label="About the vibe chart"
          >
            <Info size={15} />
          </button>
        </div>
        <p className="detail-empty-msg">Vibe data unavailable for this title.</p>
      </div>
    );
  }

  return (
    <div className="vibe-chart-card">
      <div className="vibe-chart-head">
        <h2 className="vibe-chart-title">Vibe Chart</h2>
        <button
          type="button"
          className="vibe-chart-info"
          title="Genre mix derived from this movie's TMDB classification. Percentages are an equal split across listed genres, not TMDB-provided scores."
          aria-label="About the vibe chart"
        >
          <Info size={15} />
        </button>
      </div>

      <div className="vibe-chart-body">
        <div className="vibe-chart-donut-wrap">
          <svg
            className="vibe-chart-donut"
            viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
            role="img"
            aria-label={`Vibe chart for ${activeSlice?.name ?? "genres"}`}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
            />
            {arcs.map((arc) => {
              const isActive = hoveredId == null || hoveredId === arc.id;
              return (
                <circle
                  key={arc.id}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE - arc.arcLength}`}
                  strokeDashoffset={arc.dashOffset}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                  className={`vibe-chart-slice${isActive ? " is-active" : " is-dimmed"}`}
                  onMouseEnter={() => setHoveredId(arc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(arc.id)}
                  onBlur={() => setHoveredId(null)}
                  tabIndex={0}
                  aria-label={`${arc.name} ${arc.displayPercentage}`}
                />
              );
            })}
          </svg>
          <div className="vibe-chart-center" aria-live="polite">
            <span className="vibe-chart-center-genre">{activeSlice?.name}</span>
            <strong className="vibe-chart-center-pct">{activeSlice?.displayPercentage}</strong>
          </div>
        </div>

        <ul className="vibe-chart-legend">
          {slices.map((slice) => {
            const isHovered = hoveredId === slice.id;
            return (
              <li
                key={slice.id}
                className={`vibe-chart-legend-row${isHovered ? " is-hovered" : ""}`}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <span className="vibe-chart-dot" style={{ backgroundColor: slice.color }} />
                <span className="vibe-chart-legend-name">{slice.name}</span>
                <span className="vibe-chart-legend-pct">{slice.displayPercentage}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
