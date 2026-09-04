type MediaCoverImageProps = {
  src: string;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
};

/** Fills a positioned parent using the same behavior as background-size: cover. */
export function MediaCoverImage({ src, alt = "", className = "", loading }: MediaCoverImageProps) {
  if (!src) return null;
  return (
    <div className={`media-cover${className ? ` ${className}` : ""}`}>
      <img className="media-cover__img" src={src} alt={alt} loading={loading} decoding="async" />
    </div>
  );
}
