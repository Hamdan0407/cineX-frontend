import { Heart, Star, ThumbsUp } from "lucide-react";
import { useState } from "react";
import {
  formatCompactCount,
  getGenreList,
  getMovieFormats,
  resolveMediaUrl,
} from "../utils/movieUtils";

export type MovieCardMovie = {
  id?: number;
  tmdbId?: number;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genre_label?: string;
  formats?: string[];
  likeCount?: number | null;
  bookable?: boolean;
};

type MovieCardProps = {
  movie: MovieCardMovie;
  onClick: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (movie: any) => void;
};

const FALLBACK_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect fill='%231a1a2e' width='300' height='450'/%3E%3Ctext x='50%25' y='50%25' fill='%23666' font-size='16' text-anchor='middle' dominant-baseline='middle'%3ENo Poster%3C/text%3E%3C/svg%3E";

export function MovieCard({
  movie,
  onClick,
  isWishlisted,
  onToggleWishlist,
}: MovieCardProps) {
  const [imgError, setImgError] = useState(false);
  const posterUrl = resolveMediaUrl(movie.poster_path, "poster");
  const ratingValue = Number(movie.vote_average);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const ratingLabel = hasRating ? ratingValue.toFixed(1) : null;
  const voteCount = typeof movie.vote_count === "number" && movie.vote_count > 0
    ? movie.vote_count
    : null;
  const likeCount = typeof movie.likeCount === "number" && movie.likeCount > 0
    ? movie.likeCount
    : null;
  const genres = getGenreList(movie.genre_ids, movie.genre_label);
  const formats = getMovieFormats(movie.formats);
  const title = movie.title || "Untitled";

  return (
    <article
      className="cx-movie-card cx-movie-card-bms"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title}. ${hasRating ? `Rated ${ratingLabel}` : ""}`}
    >
      <div className="cx-poster-wrap cx-poster-wrap-bms">
        <img
          src={imgError || !posterUrl ? FALLBACK_POSTER : posterUrl}
          alt={`${title} poster`}
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {onToggleWishlist && (
          <button
            type="button"
            className={`cx-wish-btn cx-wish-btn-bms${isWishlisted ? " active" : ""}`}
            aria-label={isWishlisted ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
            aria-pressed={isWishlisted}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(movie);
            }}
          >
            <Heart
              size={15}
              fill={isWishlisted ? "#E50914" : "none"}
              color={isWishlisted ? "#E50914" : "#fff"}
            />
          </button>
        )}

        {/* BookMyShow Bottom Rating Bar */}
        <div className="cx-bms-rating-bar" aria-label="Audience rating">
          {hasRating ? (
            <div className="cx-bms-rating-content">
              <Star size={13} fill="#E50914" color="#E50914" className="cx-bms-star-icon" />
              <strong className="cx-bms-rating-score">{ratingLabel}/10</strong>
              {voteCount ? (
                <span className="cx-bms-rating-votes">{formatCompactCount(voteCount)}+ Votes</span>
              ) : null}
            </div>
          ) : likeCount ? (
            <div className="cx-bms-rating-content">
              <ThumbsUp size={12} fill="#22C55E" color="#22C55E" />
              <strong className="cx-bms-rating-score">{formatCompactCount(likeCount)}+ Likes</strong>
            </div>
          ) : (
            <div className="cx-bms-rating-content">
              <Star size={13} fill="#E50914" color="#E50914" />
              <strong className="cx-bms-rating-score">Trending Now</strong>
            </div>
          )}
        </div>
      </div>

      <h3 className="cx-bms-title">{title}</h3>
      <p className="cx-bms-genres">{genres.length > 0 ? genres.join("/") : "Cinema Feature"}</p>
      
      {movie.bookable === false && (
        <p className="cx-movie-availability">No CineX showtimes in your city</p>
      )}

      {formats.length > 0 && (
        <div className="cx-format-badges" aria-label="Available formats">
          {formats.map((format) => (
            <span key={format} className="cx-format-pill">
              {format}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
