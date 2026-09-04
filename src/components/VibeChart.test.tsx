import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VibeChart } from "./VibeChart";

const tmdbActionOnly = {
  id: 1,
  genres: [{ id: 28, name: "Action" }],
};

const tmdbThreeGenres = {
  id: 2,
  genres: [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
  ],
};

describe("VibeChart", () => {
  it("renders unavailable state when TMDB genres are missing", () => {
    render(<VibeChart movie={{ id: 99, title: "No Genres" }} />);
    expect(screen.getByText("Vibe data unavailable for this title.")).toBeTruthy();
  });

  it("renders legend from real TMDB genre objects", () => {
    render(<VibeChart movie={tmdbThreeGenres} />);
    expect(screen.getAllByText("Action").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Comedy")).toBeTruthy();
    expect(screen.getByText("Drama")).toBeTruthy();
    expect(screen.getAllByText("34%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("33%").length).toBeGreaterThanOrEqual(2);
  });

  it("shows 100% for a single TMDB genre", () => {
    render(<VibeChart movie={tmdbActionOnly} />);
    expect(screen.getAllByText("100%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Action").length).toBeGreaterThanOrEqual(1);
  });

  it("renders loading skeleton", () => {
    render(<VibeChart movie={tmdbActionOnly} loading />);
    expect(screen.getByLabelText("Loading vibe chart")).toBeTruthy();
  });
});
