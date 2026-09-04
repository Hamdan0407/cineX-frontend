import { Fragment, type ReactElement } from "react";

export type ShowSeat = {
  seatId: number;
  seatNumber: string;
  seatType: string;
  status: "AVAILABLE" | "BOOKED";
  price: number;
  rowLabel?: string;
  rowIndex?: number;
  columnIndex?: number;
  wheelchairAccessible?: boolean;
};

type SeatMapProps = {
  seats: ShowSeat[];
  selectedSeatIds: Set<number>;
  liveSeatStatus: Record<string, { status: "HELD" | "BOOKED" | "AVAILABLE"; userId?: string }>;
  currentUserId?: string;
  onToggleSeat: (seatNumber: string, price: number, seatId: number) => void;
};

export function rowKeyForSeat(seat: ShowSeat): string {
  if (seat.rowLabel) return seat.rowLabel;
  const fromNumber = seat.seatNumber?.match(/^[A-Za-z]+/)?.[0];
  if (fromNumber) return fromNumber.toUpperCase();
  if (seat.rowIndex != null) return String.fromCharCode(65 + seat.rowIndex);
  return "Row";
}

const seatTypeClass = (type?: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("royale") || t.includes("premium") || t.includes("vip") || t.includes("platinum") || t.includes("recliner")) return "royale";
  if (t.includes("club")) return "club";
  if (t.includes("wheelchair")) return "wheelchair";
  return "classic";
};

const seatLabel = (seatNumber: string) => {
  const match = seatNumber.match(/(\d+)$/);
  if (match) return match[1];
  return seatNumber.replace(/^[A-Za-z]+-?/i, "");
};

const categoryTitle = (type?: string) => {
  const t = (type || "CLASSIC").toUpperCase();
  if (t.includes("WHEELCHAIR")) return "ACCESSIBLE";
  if (t.includes("ROYALE") || t.includes("RECLINER")) return "ROYALE / RECLINER";
  if (t.includes("PREMIUM") || t.includes("VIP")) return "PREMIUM";
  if (t.includes("CLUB")) return "CLUB";
  return "CLASSIC";
};

export function SeatMap({ seats, selectedSeatIds, liveSeatStatus, currentUserId, onToggleSeat }: SeatMapProps) {
  const rows = seats.reduce<Map<string, ShowSeat[]>>((map, seat) => {
    const rowKey = rowKeyForSeat(seat);
    const list = map.get(rowKey) || [];
    list.push(seat);
    map.set(rowKey, list);
    return map;
  }, new Map());

  const sortedRows = [...rows.entries()].sort((a, b) => {
    const ai = a[1][0]?.rowIndex;
    const bi = b[1][0]?.rowIndex;
    if (ai != null && bi != null && ai !== bi) return ai - bi;
    return a[0].localeCompare(b[0]);
  });

  let lastCategory = "";

  return (
    <div className="cx-seat-map-scroll">
      <div className="cx-seat-map">
        {sortedRows.map(([rowLabel, rowSeats]) => {
          const sorted = [...rowSeats].sort((a, b) => {
            const ac = a.columnIndex ?? 0;
            const bc = b.columnIndex ?? 0;
            if (ac !== bc) return ac - bc;
            return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true });
          });
          const category = categoryTitle(sorted.find(s => !s.wheelchairAccessible)?.seatType || sorted[0]?.seatType);
          const showTier = category !== lastCategory;
          lastCategory = category;
          let prevCol = Number.NaN;
          return (
            <Fragment key={rowLabel}>
              {showTier && <div className="cx-seat-tier">{category}</div>}
              <div className="seat-row">
                <div className="row-label">{rowLabel}</div>
                <div className="seat-row-seats">
                  {sorted.map((seat) => {
                    const col = seat.columnIndex;
                    const gaps: ReactElement[] = [];
                    if (col != null && !Number.isNaN(prevCol) && col - prevCol > 1) {
                      const gapWidth = Math.min(col - prevCol - 1, 2);
                      for (let g = 0; g < gapWidth; g++) {
                        gaps.push(<div key={`gap-${rowLabel}-${col}-${g}`} className="aisle-gap" />);
                      }
                    }
                    prevCol = col ?? prevCol;

                    const isBooked = seat.status === "BOOKED";
                    const live = liveSeatStatus[String(seat.seatId)];
                    const isHeld = live?.status === "HELD";
                    const isSelected = selectedSeatIds.has(seat.seatId);
                    const isHeldByOther = Boolean(isHeld && live?.userId && live.userId !== currentUserId && !isSelected);
                    const typeClass = seatTypeClass(seat.seatType);

                    return (
                      <Fragment key={seat.seatId}>
                        {gaps}
                        <button
                          type="button"
                          className={`seat-btn ${typeClass} ${isBooked ? "booked" : ""} ${isHeld && !isBooked ? "held" : ""} ${isSelected ? "selected" : ""}`}
                          disabled={isBooked || isHeldByOther}
                          title={`${seat.seatNumber} • ${seat.seatType} • ₹${seat.price}`}
                          onClick={() => onToggleSeat(seat.seatNumber, seat.price, seat.seatId)}
                        >
                          {seat.wheelchairAccessible ? "♿" : seatLabel(seat.seatNumber)}
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
                <div className="row-label">{rowLabel}</div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
