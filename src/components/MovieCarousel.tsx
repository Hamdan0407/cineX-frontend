import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MovieCarouselProps = {
  children: ReactNode;
  ariaLabel?: string;
};

export function MovieCarousel({ children, ariaLabel = "Movie carousel" }: MovieCarouselProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector<HTMLElement>(".cx-movie-card");
    const gap = 14;
    const amount = (card?.offsetWidth || 188) + gap;
    row.scrollBy({ left: direction * amount * 2, behavior: "smooth" });
  };

  return (
    <div className="cx-movie-carousel">
      <button
        type="button"
        className="cx-carousel-btn cx-carousel-btn-prev"
        aria-label="Scroll movies left"
        onClick={() => scrollByCards(-1)}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="cx-movie-row cx-movie-row-ref" ref={rowRef} role="list" aria-label={ariaLabel}>
        {children}
      </div>
      <button
        type="button"
        className="cx-carousel-btn cx-carousel-btn-next"
        aria-label="Scroll movies right"
        onClick={() => scrollByCards(1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
