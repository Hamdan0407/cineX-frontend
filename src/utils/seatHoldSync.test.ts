import { describe, expect, it } from "vitest";
import { isStaleHeldPoll, shouldDropLocalSelection } from "./seatHoldSync";

describe("seat hold sync", () => {
  it("ignores an in-flight held poll after a newer lock", () => {
    expect(isStaleHeldPoll(1, 2)).toBe(true);
    expect(isStaleHeldPoll(2, 2)).toBe(false);
  });

  it("does not drop a just-locked seat when the held list is still empty", () => {
    expect(shouldDropLocalSelection({
      seatId: 551,
      heldIds: new Set(),
      lockedAt: 1000,
      now: 1500,
    })).toBe(false);
  });

  it("drops a selection after grace when Redis no longer holds it", () => {
    expect(shouldDropLocalSelection({
      seatId: 551,
      heldIds: new Set(),
      lockedAt: 1000,
      now: 20000,
    })).toBe(true);
  });
});
