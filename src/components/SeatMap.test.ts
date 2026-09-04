import { describe, expect, it } from "vitest";
import { rowKeyForSeat, type ShowSeat } from "./SeatMap";

const seat = (partial: Partial<ShowSeat>): ShowSeat => ({
  seatId: 1,
  seatNumber: "A1",
  seatType: "CLASSIC",
  status: "AVAILABLE",
  price: 250,
  ...partial,
});

describe("SeatMap row grouping", () => {
  it("uses rowLabel from backend layout data", () => {
    expect(rowKeyForSeat(seat({ rowLabel: "J", seatNumber: "J12" }))).toBe("J");
  });

  it("falls back to the letter in seatNumber when rowIndex is missing", () => {
    expect(rowKeyForSeat(seat({ seatNumber: "B7", rowLabel: undefined, rowIndex: undefined }))).toBe("B");
  });
});
