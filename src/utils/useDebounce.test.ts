import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  it("should update value after specified delay", () => {
    vi.useFakeTimers();
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    // Update the value
    rerender({ value: "updated", delay: 500 });
    
    // Value should not update immediately
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe("initial"); // Still not updated

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("updated"); // Now it should update

    vi.useRealTimers();
  });
});
