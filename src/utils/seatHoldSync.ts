export function shouldDropLocalSelection(options: {
  seatId: number;
  heldIds: Set<string>;
  lockedAt?: number;
  now: number;
  graceMs?: number;
}): boolean {
  if (options.heldIds.has(String(options.seatId))) return false;
  const graceMs = options.graceMs ?? 8000;
  if (options.lockedAt != null && options.now - options.lockedAt < graceMs) return false;
  return true;
}

export function isStaleHeldPoll(responseGeneration: number, currentGeneration: number): boolean {
  return responseGeneration !== currentGeneration;
}

/** Hold/release events refresh the seat map silently; failed user actions remain actionable. */
export function shouldNotifyForSeatEvent(event: "HOLD_RELEASED" | "LOCK_CONFLICT"): boolean {
  return event === "LOCK_CONFLICT";
}
